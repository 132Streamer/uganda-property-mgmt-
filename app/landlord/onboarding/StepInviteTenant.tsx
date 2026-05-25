'use client';

import { useState } from 'react';
import { UserPlus, Mail, Phone, User, ChevronLeft, Send } from 'lucide-react';
import type { TenantData } from './OnboardingWizard';

type Props = {
  data: TenantData;
  onChange: (data: TenantData) => void;
  onNext: () => void;
  onBack: () => void;
};

function FieldError({ msg }: { msg: string }) {
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

export default function StepInviteTenant({ data, onChange, onNext, onBack }: Props) {
  const [errors, setErrors] = useState<Partial<Record<keyof TenantData, string>>>({});

  const set = (key: keyof TenantData, value: string) => {
    onChange({ ...data, [key]: value });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Partial<Record<keyof TenantData, string>> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email.trim()) e.email = 'Email address is required';
    else if (!emailRegex.test(data.email)) e.email = 'Enter a valid email address';
    if (!data.fullName.trim()) e.fullName = 'Full name is required';
    const phoneClean = data.phone.replace(/\s+/g, '');
    if (!phoneClean) e.phone = 'Phone number is required';
    else if (!/^(\+?256|0)[0-9]{9}$/.test(phoneClean))
      e.phone = 'Enter a valid Ugandan phone number (e.g. 0701234567)';
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
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Invite a Tenant</h2>
            <p className="text-slate-300 text-sm">Send an invitation to your first tenant</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. Aisha Nakato"
              value={data.fullName}
              onChange={(e) => set('fullName', e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition ${
                errors.fullName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>
          {errors.fullName && <FieldError msg={errors.fullName} />}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Email Address <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              placeholder="e.g. aisha@example.com"
              value={data.email}
              onChange={(e) => set('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>
          {errors.email && <FieldError msg={errors.email} />}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-400 border-r border-slate-300 pr-2">+256</span>
            </div>
            <input
              type="tel"
              placeholder="701 234 567"
              value={data.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={`w-full pl-[72px] pr-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 transition ${
                errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
              }`}
            />
          </div>
          {errors.phone && <FieldError msg={errors.phone} />}
        </div>

        {/* Info note */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs text-amber-700 leading-relaxed">
            An invitation link will be sent to the tenant once your setup is complete. They can skip this step and invite tenants later.
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
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md shadow-slate-200"
          >
            Send Invitation
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
