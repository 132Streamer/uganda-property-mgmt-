'use client';

import { useState } from 'react';
import StepPropertyDetails from './StepPropertyDetails';
import StepAddUnit from './StepAddUnit';
import StepInviteTenant from './StepInviteTenant';
import SuccessScreen from './SuccessScreen';
import ProgressBar from './ProgressBar';
import { Building2 } from 'lucide-react';

export type PropertyData = {
  title: string;
  address: string;
  district: string;
  bedrooms: string;
  bathrooms: string;
  rentAmount: string;
};

export type UnitData = {
  unitNumber: string;
  floor: string;
  status: string;
};

export type TenantData = {
  email: string;
  fullName: string;
  phone: string;
};

const TOTAL_STEPS = 3;

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [done, setDone] = useState(false);

  const [property, setProperty] = useState<PropertyData>({
    title: '',
    address: '',
    district: '',
    bedrooms: '',
    bathrooms: '',
    rentAmount: '',
  });

  const [unit, setUnit] = useState<UnitData>({
    unitNumber: '',
    floor: '',
    status: 'vacant',
  });

  const [tenant, setTenant] = useState<TenantData>({
    email: '',
    fullName: '',
    phone: '',
  });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((s) => s + 1);
    } else {
      setDone(true);
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setDone(false);
    setProperty({ title: '', address: '', district: '', bedrooms: '', bathrooms: '', rentAmount: '' });
    setUnit({ unitNumber: '', floor: '', status: 'vacant' });
    setTenant({ email: '', fullName: '', phone: '' });
  };

  if (done) {
    return (
      <SuccessScreen
        property={property}
        unit={unit}
        tenant={tenant}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-4">
      {/* Header */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Pango Properties</p>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Landlord Onboarding</h1>
          </div>
        </div>

        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>

      {/* Step Content */}
      <div className="w-full max-w-xl">
        {currentStep === 1 && (
          <StepPropertyDetails
            data={property}
            onChange={setProperty}
            onNext={handleNext}
          />
        )}
        {currentStep === 2 && (
          <StepAddUnit
            data={unit}
            onChange={setUnit}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <StepInviteTenant
            data={tenant}
            onChange={setTenant}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}
