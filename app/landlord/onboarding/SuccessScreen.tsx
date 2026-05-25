'use client';

import { CheckCircle2, Building2, Layers, UserCheck, ArrowRight, RotateCcw } from 'lucide-react';
import type { PropertyData, UnitData, TenantData } from './OnboardingWizard';

type Props = {
  property: PropertyData;
  unit: UnitData;
  tenant: TenantData;
  onRestart: () => void;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500 font-medium shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-semibold text-right">{value}</span>
    </div>
  );
}

export default function SuccessScreen({ property, unit, tenant, onRestart }: Props) {
  const statusColors: Record<string, string> = {
    vacant: 'bg-emerald-100 text-emerald-700',
    occupied: 'bg-blue-100 text-blue-700',
    maintenance: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-xl">
        {/* Header badge */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Pango Properties</p>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Landlord Onboarding</h1>
          </div>
        </div>

        {/* Success hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-5">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center ring-4 ring-white/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
            <p className="text-emerald-100 text-sm max-w-xs mx-auto leading-relaxed">
              Your property has been created and your tenant invitation is ready to send.
            </p>
          </div>

          {/* Step completion indicators */}
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="flex justify-around">
              {[
                { icon: Building2, label: 'Property Added', color: 'text-amber-500', bg: 'bg-amber-50' },
                { icon: Layers, label: 'Unit Defined', color: 'text-teal-500', bg: 'bg-teal-50' },
                { icon: UserCheck, label: 'Tenant Invited', color: 'text-slate-600', bg: 'bg-slate-100' },
              ].map(({ icon: Icon, label, color, bg }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className="text-xs font-medium text-slate-600 text-center leading-tight max-w-[70px]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Property summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Property</span>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-1 border border-slate-100">
                <SummaryRow label="Name" value={property.title} />
                <SummaryRow label="Address" value={property.address} />
                <SummaryRow label="District" value={property.district} />
                <SummaryRow
                  label="Size"
                  value={`${property.bedrooms} bed · ${property.bathrooms} bath`}
                />
                <SummaryRow
                  label="Monthly Rent"
                  value={`UGX ${property.rentAmount}`}
                />
              </div>
            </div>

            {/* Unit summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-teal-500" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</span>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-1 border border-slate-100">
                <SummaryRow label="Unit No." value={unit.unitNumber} />
                <SummaryRow label="Floor" value={unit.floor} />
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs text-slate-500 font-medium">Status</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                      statusColors[unit.status] ?? 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {unit.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Tenant summary */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tenant</span>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-1 border border-slate-100">
                <SummaryRow label="Name" value={tenant.fullName} />
                <SummaryRow label="Email" value={tenant.email} />
                <SummaryRow label="Phone" value={tenant.phone} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md shadow-amber-200">
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
