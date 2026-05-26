import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { computeDaysUntilExpiry, resolveLeaseStatus } from '@/lib/lease-utils';
import UploadLeasePdfButton from '@/components/UploadLeasePdfButton';
import type { LeaseWithDetails } from '@/types/lease';

interface PageProps {
  params: { id: string };
}

function LeaseRowHighlight({ days, status }: { days: number; status: string }) {
  if (status === 'terminated') return 'bg-gray-50 opacity-60';
  if (status === 'expired' || days < 0) return 'bg-red-50';
  if (days <= 30) return 'bg-yellow-50';
  return '';
}

function StatusBadge({ status, days }: { status: string; days: number }) {
  const resolved = status === 'terminated'
    ? 'terminated'
    : days < 0
    ? 'expired'
    : days <= 30
    ? 'expiring soon'
    : status;

  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    'expiring soon': 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800',
    terminated: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${colors[resolved] ?? 'bg-gray-100 text-gray-600'}`}>
      {resolved}
    </span>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function PropertyPage({ params }: PageProps) {
  const { id: propertyId } = params;
  const supabase = createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'landlord') redirect('/');

  const admin = createSupabaseAdminClient();

  // Fetch property — verify ownership
  const { data: property, error: propError } = await admin
    .from('properties')
    .select('id, name, address, landlord_id')
    .eq('id', propertyId)
    .single();

  if (propError || !property) notFound();
  if (property.landlord_id !== user.id) notFound();

  // Fetch leases for this property
  const { data: rawLeases, error: leaseError } = await admin
    .from('leases')
    .select(`
      id, unit_id, tenant_id, start_date, end_date, rent_amount, status, pdf_path, created_at, updated_at,
      units!inner ( unit_number, property_id ),
      tenant:profiles!leases_tenant_id_fkey ( full_name, email, phone )
    `)
    .eq('units.property_id', propertyId)
    .order('start_date', { ascending: false });

  if (leaseError) {
    console.error('Lease fetch error:', leaseError);
    throw new Error('Failed to load leases.');
  }

  const leases: LeaseWithDetails[] = (rawLeases ?? []).map((l: any) => ({
    id: l.id,
    unit_id: l.unit_id,
    tenant_id: l.tenant_id,
    start_date: l.start_date,
    end_date: l.end_date,
    rent_amount: l.rent_amount,
    status: resolveLeaseStatus(l.status, l.end_date),
    pdf_path: l.pdf_path,
    created_at: l.created_at,
    updated_at: l.updated_at,
    tenant_name: l.tenant?.full_name ?? 'Unknown',
    tenant_email: l.tenant?.email ?? '',
    tenant_phone: l.tenant?.phone ?? null,
    unit_number: l.units?.unit_number ?? '',
    property_id: propertyId,
    property_name: property.name,
    landlord_name: '',
    landlord_email: '',
    landlord_phone: null,
    days_until_expiry: computeDaysUntilExpiry(l.end_date),
  }));

  const activeCount = leases.filter(l => l.status === 'active').length;
  const expiringCount = leases.filter(l => l.status === 'active' && l.days_until_expiry <= 30 && l.days_until_expiry >= 0).length;
  const expiredCount = leases.filter(l => l.status === 'expired').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{property.address}</p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-3 gap-4 sm:grid-cols-3">
          {[
            { label: 'Active Leases', value: activeCount, color: 'text-green-700' },
            { label: 'Expiring ≤ 30 days', value: expiringCount, color: 'text-yellow-700' },
            { label: 'Expired', value: expiredCount, color: 'text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-yellow-100 ring-1 ring-yellow-300" />
            Expiring within 30 days
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-red-100 ring-1 ring-red-300" />
            Expired
          </span>
        </div>

        {/* Lease table */}
        {leases.length === 0 ? (
          <div className="rounded-lg bg-white py-16 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-gray-400">No leases found for this property.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tenant', 'Unit', 'Rent / mo', 'Start', 'End', 'Days Left', 'Status', 'PDF'].map(h => (
                      <th
                        key={h}
                        className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leases.map(lease => {
                    const rowClass = LeaseRowHighlight({ days: lease.days_until_expiry, status: lease.status });
                    return (
                      <tr key={lease.id} className={`transition-colors ${rowClass}`}>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{lease.tenant_name}</div>
                          <div className="text-xs text-gray-400">{lease.tenant_email}</div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {lease.unit_number}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {formatCurrency(lease.rent_amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {formatDate(lease.start_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                          {formatDate(lease.end_date)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {lease.status === 'terminated' ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <span className={lease.days_until_expiry < 0 ? 'font-medium text-red-600' : lease.days_until_expiry <= 30 ? 'font-medium text-yellow-700' : 'text-gray-700'}>
                              {lease.days_until_expiry < 0
                                ? `${Math.abs(lease.days_until_expiry)}d ago`
                                : `${lease.days_until_expiry}d`}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusBadge status={lease.status} days={lease.days_until_expiry} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <UploadLeasePdfButton leaseId={lease.id} hasPdf={!!lease.pdf_path} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}