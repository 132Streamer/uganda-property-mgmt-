'use client';

import { useState } from 'react';
import { MapPin, Home, DollarSign, ChevronRight } from 'lucide-react';
import type { PropertyData } from './OnboardingWizard';

const DISTRICTS = ['Kampala', 'Wakiso', 'Entebbe', 'Jinja', 'Mukono'];

type Props = {
  data: PropertyData;
  onChange: (data: PropertyData) => void;
  onNext: () => void;
};

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

export default function StepPropertyDetails({ data, onChange, onNext }: Props) {
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyData, string>>>({});

  const set = (key: keyof PropertyData, value: string) => {
    onChange({ ...data, [key]: value });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Partial<Record<keyof PropertyData, string>> = {};
    if (!data.title.trim()) e.title = 'Property name is required';
    if (!data.address.trim()) e.address = 'Address is required';
    if (!data.district) e.district = 'Please select a district';
    if (!data.bedrooms || isNaN(Number(data.bedrooms)) || Number(data.bedrooms) < 0)
      e.bedrooms = 'Enter a valid number of bedrooms';
    if (!data.bathrooms || isNaN(Number(data.bathrooms)) || Number(data.bathrooms) < 0)
      e.bathrooms = 'Enter a valid number of bathrooms';
    if (!data.rentAmount || isNaN(Number(data.rentAmount.replace(/,/g, ''))) || Number(data.rentAmount.replace(/,/g, '')) <= 0)
      e.rentAmount = 'Enter a valid rent amount';
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

  const formatRent = (val: string) => {
    const digits = val.replace(/[^0-9]/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Add Your Property</h2>
            <p className="text-amber-100 text-sm">Tell us about the property you manage</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Property Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Property Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Nakawa Apartments"
            value={data.title}
            onChange={(e) => set('title', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
              errors.title ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
            }`}
          />
          {errors.title && <FieldError msg={errors.title} />}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Street Address <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Plot 14, Kira Road"
              value={data.address}
              onChange={(e) => set('address', e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.address ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>
          {errors.address && <FieldError msg={errors.address} />}
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            District <span className="text-red-400">*</span>
          </label>
          <select
            value={data.district}
            onChange={(e) => set('district', e.target.value)}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition appearance-none bg-no-repeat cursor-pointer ${
              errors.district ? 'border-red-300 bg-red-50 text-slate-800' : 'border-slate-200 bg-slate-50 text-slate-800'
            } ${!data.district ? 'text-slate-400' : ''}`}
          >
            <option value="" disabled>Select a district</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {errors.district && <FieldError msg={errors.district} />}
        </div>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Bedrooms <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 3"
              value={data.bedrooms}
              onChange={(e) => set('bedrooms', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.bedrooms ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
            {errors.bedrooms && <FieldError msg={errors.bedrooms} />}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Bathrooms <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 2"
              value={data.bathrooms}
              onChange={(e) => set('bathrooms', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.bathrooms ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
            {errors.bathrooms && <FieldError msg={errors.bathrooms} />}
          </div>
        </div>

        {/* Rent Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Monthly Rent <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 border-r border-slate-300 pr-2">UGX</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="600,000"
              value={data.rentAmount}
              onChange={(e) => set('rentAmount', formatRent(e.target.value))}
              className={`w-full pl-16 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition ${
                errors.rentAmount ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>
          {errors.rentAmount && <FieldError msg={errors.rentAmount} />}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md shadow-amber-200 mt-2"
        >
          Continue to Unit Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
