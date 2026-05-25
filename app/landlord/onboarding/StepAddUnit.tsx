'use client';

import { useState } from 'react';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import type { UnitData } from './OnboardingWizard';

const STATUS_OPTIONS = [
  { value: 'vacant', label: 'Vacant', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { value: 'occupied', label: 'Occupied', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { value: 'maintenance', label: 'Under Maintenance', color: 'bg-orange-100 text-orange-700 border-orange-300' },
];

const FLOOR_OPTIONS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor+'];

type Props = {
  data: UnitData;
  onChange: (data: UnitData) => void;
  onNext: () => void;
  onBack: () => void;
};

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

export default function StepAddUnit({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Partial<Record<keyof UnitData, string>>>({});

  const set = (key: keyof UnitData, value: string) => {
    onChange({ ...data, [key]: value });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Partial<Record<keyof UnitData, string>> = {};
    if (!data.unitNumber.trim()) e.unitNumber = 'Unit number is required';
    if (!data.floor) e.floor = 'Please select a floor';
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onNext();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Add a Unit</h2>
            <p className="text-teal-100 text-sm">Define the first unit in your property</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Unit Number */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Unit Number <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. A1, 101, Unit 3"
            value={data.unitNumber}
            onChange={(e) => set('unitNumber', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 transition ${
              errors.unitNumber ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
            }`}
          />
          {errors.unitNumber && <FieldError msg={errors.unitNumber} />}
        </div>

        {/* Floor */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Floor <span className="text-red-400">*</span>
          </label>
          <select
            value={data.floor}
            onChange={(e) => set('floor', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 transition cursor-pointer ${
              errors.floor
                ? 'border-red-300 bg-red-50 text-slate-800'
                : 'border-slate-200 bg-slate-50 text-slate-800'
            } ${!data.floor ? 'text-slate-400' : ''}`}
          >
            <option value="" disabled>Select floor level</option>
            {FLOOR_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          {errors.floor && <FieldError msg={errors.floor} />}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2.5">
            Unit Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('status', opt.value)}
                className={`py-2.5 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200 ${
                  data.status === opt.value
                    ? opt.color + ' shadow-sm scale-[1.02]'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className={`block w-2 h-2 rounded-full mx-auto mb-1.5 ${
                  opt.value === 'vacant' ? 'bg-emerald-500' :
                  opt.value === 'occupied' ? 'bg-blue-500' : 'bg-orange-500'
                }`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info note */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            You can add more units after completing the onboarding from your property dashboard.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md shadow-teal-100"
          >
            Continue to Invite Tenant
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
