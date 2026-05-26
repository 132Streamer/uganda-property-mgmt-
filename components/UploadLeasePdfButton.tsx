import { redirect } from 'next/navigation';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { computeDaysUntilExpiry, resolveLeaseStatus } from '@/lib/lease-utils';
import { getLeaseDownloadUrl } from '@/lib/lease-actions';
import type { LeaseWithDetails } from '@/types/lease';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default async function TenantLeasePage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'tenant') redirect('/');

  const admin = createSupabaseAdminClient();

  const { data: raw, error: leaseError } = await admin
    .from('leases')
    .select(`
      id, unit_id, tenant_id, start_date, end_date, rent_amount, status, pdf_path, created_at, updated_at,
      units!inner (
        unit_number, property_id,
        properties!inner (
          name,
          landlord:profiles!properties_landlord_id_fkey ( full_name, email, phone )
        )
      )
    `)
    .eq('tenant_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (leaseError) {
    console.error('Tenant lease fetch error:', leaseError);
    throw new Error('Failed to load lease.');
  }

  if (!raw) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-gray-200 text-center">
          <h2 className="text-lg font-semibold text-gray-900">No Active Lease</h2>
          <p className="mt-2 text-sm text-gray-500">You currently have no active lease. Contact your landlord for details.</p>
        </div>
      </div>
    );
  }

  const unit = (raw as any).units;
  const prop = unit?.properties;
  const landlord = prop?.landlord;
  const days = computeDaysUntilExpiry(raw.end_date);

  const lease: LeaseWithDetails = {
    id: raw.id,
    unit_id: raw.unit_id,
    tenant_id: raw.tenant_id,
    start_date: raw.start_date,
    end_date: raw.end_date,
    rent_amount: raw.rent_amount,
    status: resolveLeaseStatus(raw.status, raw.end_date),
    pdf_path: raw.pdf_path,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    tenant_name: '',
    tenant_email: '',
    tenant_phone: null,
    unit_number: unit?.unit_number ?? '',
    property_id: unit?.property_id ?? '',
    property_name: prop?.name ?? '',
    landlord_name: landlord?.full_name ?? '',
    landlord_email: landlord?.email ?? '',
    landlord_phone: landlord?.phone ?? null,
    days_until_expiry: days,
  };

  // Generate signed URL for PDF download if available
  let pdfDownloadUrl: string | null = null;
  if (lease.pdf_path) {
    const { url, error } = await getLeaseDownloadUrl(lease.pdf_path);
    if (!error && url) pdfDownloadUrl = url;
  }

  const isExpiringSoon = days >= 0 && days <= 30;
  const isExpired = days < 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Your Lease</h1>

        {/* Expiry warning banner */}
        {isExpiringSoon && (
          <div className="mb-6 rounded-lg bg-yellow-50 p-4 ring-1 ring-yellow-200">
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ Lease expiring in {days} day{days !== 1 ? 's' : ''} — contact your landlord to renew.
            </p>
          </div>
        )}
        {isExpired && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
            <p className="text-sm font-medium text-red-800">
              ⛔ Lease expired {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''} ago.
            </p>
          </div>
        )}

        {/* Main lease card */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Lease Details</p>
          </div>
          <dl className="divide-y divide-gray-100">
            {[
              { label: 'Property', value: lease.property_name },
              { label: 'Unit', value: lease.unit_number },
              { label: 'Rent', value: `${formatCurrency(lease.rent_amount)} / month` },
              { label: 'Start Date', value: formatDate(lease.start_date) },
              { label: 'End Date', value: formatDate(lease.end_date) },
              {
                label: 'Days Remaining',
                value: isExpired
                  ? `Expired ${Math.abs(days)} days ago`
                  : `${days} day${days !== 1 ? 's' : ''}`,
                highlight: isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-700' : undefined,
              },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="grid grid-cols-3 gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className={`col-span-2 text-sm ${highlight ?? 'text-gray-900'}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Landlord contact card */}
        <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Landlord Contact</p>
          </div>
          <dl className="divide-y divide-gray-100">
            {[
              { label: 'Name', value: lease.landlord_name || '—' },
              { label: 'Email', value: lease.landlord_email || '—' },
              { label: 'Phone', value: lease.landlord_phone || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="grid grid-cols-3 gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="col-span-2 text-sm text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* PDF download */}
        <div className="mt-4">
          {pdfDownloadUrl ? (
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
              </svg>
              Download Lease PDF
            </a>
          ) : (
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-center text-sm text-gray-400 ring-1 ring-gray-200">
              No lease PDF uploaded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}