'use client'

import { useState } from 'react'
import { Check, ChevronRight, Building2, Layers, UserPlus } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface PropertyData {
  title: string
  address: string
  district: string
  bedrooms: string
  bathrooms: string
  rentUGX: string
}

interface UnitData {
  unitNumber: string
  floor: string
  status: string
}

interface TenantData {
  email: string
  fullName: string
  phone: string
}

type Step = 1 | 2 | 3 | 'success'

const DISTRICTS = ['Kampala', 'Wakiso', 'Entebbe', 'Jinja', 'Mukono']
const UNIT_STATUSES = ['Vacant', 'Occupied', 'Under Maintenance']

const STEPS = [
  { number: 1, label: 'Add Property', icon: Building2 },
  { number: 2, label: 'Add Unit',     icon: Layers },
  { number: 3, label: 'Invite Tenant', icon: UserPlus },
]

// ── Progress Bar ───────────────────────────────────────────────────────────

function ProgressBar({ current }: { current: number }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between relative">
        {/* Connector line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-stone-200 z-0" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-stone-900 z-0 transition-all duration-500"
          style={{ width: current === 1 ? '0%' : current === 2 ? '50%' : '100%' }}
        />

        {STEPS.map((step) => {
          const done    = current > step.number
          const active  = current === step.number
          const Icon    = step.icon

          return (
            <div key={step.number} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                  done
                    ? 'bg-stone-900 border-stone-900 text-white'
                    : active
                    ? 'bg-white border-stone-900 text-stone-900'
                    : 'bg-white border-stone-300 text-stone-400',
                ].join(' ')}
              >
                {done ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={[
                  'text-xs font-medium whitespace-nowrap',
                  done || active ? 'text-stone-900' : 'text-stone-400',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Shared field components ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full border border-stone-200 rounded-xl px-3.5 py-2.5 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition placeholder:text-stone-400'

// ── Step 1: Add Property ───────────────────────────────────────────────────

function StepProperty({
  data,
  onChange,
  onNext,
}: {
  data: PropertyData
  onChange: (d: PropertyData) => void
  onNext: () => void
}) {
  const set = (key: keyof PropertyData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...data, [key]: e.target.value })

  const valid =
    data.title.trim() &&
    data.address.trim() &&
    data.district &&
    data.bedrooms &&
    data.bathrooms &&
    data.rentUGX

  return (
    <div className="space-y-5">
      <Field label="Property Title">
        <input
          type="text"
          placeholder="e.g. Kololo Heights Apartments"
          value={data.title}
          onChange={set('title')}
          className={inputClass}
        />
      </Field>

      <Field label="Address">
        <input
          type="text"
          placeholder="e.g. Plot 14, Acacia Avenue"
          value={data.address}
          onChange={set('address')}
          className={inputClass}
        />
      </Field>

      <Field label="District">
        <select value={data.district} onChange={set('district')} className={inputClass}>
          <option value="" disabled>Select district</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Bedrooms">
          <input
            type="number"
            min={0}
            placeholder="3"
            value={data.bedrooms}
            onChange={set('bedrooms')}
            className={inputClass}
          />
        </Field>
        <Field label="Bathrooms">
          <input
            type="number"
            min={0}
            placeholder="2"
            value={data.bathrooms}
            onChange={set('bathrooms')}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Monthly Rent (UGX)">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-stone-500 font-medium pointer-events-none">
            UGX
          </span>
          <input
            type="number"
            min={0}
            placeholder="1,500,000"
            value={data.rentUGX}
            onChange={set('rentUGX')}
            className={`${inputClass} pl-14`}
          />
        </div>
      </Field>

      <button
        onClick={onNext}
        disabled={!valid}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-stone-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-stone-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ── Step 2: Add Unit ───────────────────────────────────────────────────────

function StepUnit({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: UnitData
  onChange: (d: UnitData) => void
  onNext: () => void
  onBack: () => void
}) {
  const set = (key: keyof UnitData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onChange({ ...data, [key]: e.target.value })

  const valid = data.unitNumber.trim() && data.floor.trim() && data.status

  return (
    <div className="space-y-5">
      <Field label="Unit Number">
        <input
          type="text"
          placeholder="e.g. A1, 3B, Unit 4"
          value={data.unitNumber}
          onChange={set('unitNumber')}
          className={inputClass}
        />
      </Field>

      <Field label="Floor">
        <input
          type="text"
          placeholder="e.g. Ground, 1st, 2nd"
          value={data.floor}
          onChange={set('floor')}
          className={inputClass}
        />
      </Field>

      <Field label="Status">
        <select value={data.status} onChange={set('status')} className={inputClass}>
          <option value="" disabled>Select status</option>
          {UNIT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onBack}
          className="flex-1 border border-stone-200 text-stone-700 text-sm font-semibold py-3 rounded-xl hover:bg-stone-50 transition"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 flex items-center justify-center gap-2 bg-stone-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-stone-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Invite Tenant ──────────────────────────────────────────────────

function StepTenant({
  data,
  onChange,
  onSubmit,
  onBack,
}: {
  data: TenantData
  onChange: (d: TenantData) => void
  onSubmit: () => void
  onBack: () => void
}) {
  const set = (key: keyof TenantData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => onChange({ ...data, [key]: e.target.value })

  const valid = data.email.trim() && data.fullName.trim() && data.phone.trim()

  return (
    <div className="space-y-5">
      <Field label="Full Name">
        <input
          type="text"
          placeholder="e.g. Alice Nakato"
          value={data.fullName}
          onChange={set('fullName')}
          className={inputClass}
        />
      </Field>

      <Field label="Email Address">
        <input
          type="email"
          placeholder="tenant@example.com"
          value={data.email}
          onChange={set('email')}
          className={inputClass}
        />
      </Field>

      <Field label="Phone Number">
        <input
          type="tel"
          placeholder="+256 700 000 000"
          value={data.phone}
          onChange={set('phone')}
          className={inputClass}
        />
      </Field>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onBack}
          className="flex-1 border border-stone-200 text-stone-700 text-sm font-semibold py-3 rounded-xl hover:bg-stone-50 transition"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={!valid}
          className="flex-1 bg-stone-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-stone-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Send Invitation
        </button>
      </div>
    </div>
  )
}

// ── Success Screen ─────────────────────────────────────────────────────────

function SuccessScreen({
  property,
  unit,
  tenant,
  onRestart,
}: {
  property: PropertyData
  unit: UnitData
  tenant: TenantData
  onRestart: () => void
}) {
  const rent = property.rentUGX
    ? new Intl.NumberFormat('en-UG').format(Number(property.rentUGX))
    : '—'

  return (
    <div className="text-center space-y-8">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check className="w-10 h-10 text-emerald-600 stroke-[2.5]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-stone-900">All set!</h2>
          <p className="text-stone-500 text-sm mt-1">
            Your property has been created and the tenant invitation is ready.
          </p>
        </div>
      </div>

      <div className="text-left space-y-3">
        {/* Property summary */}
        <div className="bg-stone-50 rounded-2xl p-4 space-y-2 border border-stone-100">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Property</p>
          <p className="font-semibold text-stone-900">{property.title}</p>
          <p className="text-sm text-stone-500">{property.address}, {property.district}</p>
          <div className="flex gap-4 text-sm text-stone-600 pt-1">
            <span>{property.bedrooms} bed</span>
            <span>{property.bathrooms} bath</span>
            <span className="font-medium text-stone-900">UGX {rent} / mo</span>
          </div>
        </div>

        {/* Unit summary */}
        <div className="bg-stone-50 rounded-2xl p-4 space-y-2 border border-stone-100">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Unit</p>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-stone-900">Unit {unit.unitNumber}</p>
            <span className="text-xs bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-medium">
              {unit.status}
            </span>
          </div>
          <p className="text-sm text-stone-500">Floor: {unit.floor}</p>
        </div>

        {/* Tenant summary */}
        <div className="bg-amber-50 rounded-2xl p-4 space-y-2 border border-amber-100">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Invitation Sent To</p>
          <p className="font-semibold text-stone-900">{tenant.fullName}</p>
          <p className="text-sm text-stone-500">{tenant.email}</p>
          <p className="text-sm text-stone-500">{tenant.phone}</p>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full border border-stone-200 text-stone-700 text-sm font-semibold py-3 rounded-xl hover:bg-stone-50 transition"
      >
        Add Another Property
      </button>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

const defaultProperty: PropertyData = {
  title: '', address: '', district: '', bedrooms: '', bathrooms: '', rentUGX: '',
}
const defaultUnit: UnitData = { unitNumber: '', floor: '', status: '' }
const defaultTenant: TenantData = { email: '', fullName: '', phone: '' }

export default function OnboardingPage() {
  const [step, setStep]         = useState<Step>(1)
  const [property, setProperty] = useState<PropertyData>(defaultProperty)
  const [unit, setUnit]         = useState<UnitData>(defaultUnit)
  const [tenant, setTenant]     = useState<TenantData>(defaultTenant)

  function restart() {
    setStep(1)
    setProperty(defaultProperty)
    setUnit(defaultUnit)
    setTenant(defaultTenant)
  }

  const stepTitles: Record<number, string> = {
    1: 'Add your property',
    2: 'Add a unit',
    3: 'Invite a tenant',
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-start justify-center pt-12 pb-20 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="text-xl font-bold text-stone-900">PropertyHub</span>
          <p className="text-stone-400 text-sm mt-1">Uganda Property Management</p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-8">
          {step === 'success' ? (
            <SuccessScreen
              property={property}
              unit={unit}
              tenant={tenant}
              onRestart={restart}
            />
          ) : (
            <>
              <ProgressBar current={step as number} />

              <div className="mb-6">
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-1">
                  Step {step} of 3
                </p>
                <h1 className="text-xl font-bold text-stone-900">
                  {stepTitles[step as number]}
                </h1>
              </div>

              {step === 1 && (
                <StepProperty
                  data={property}
                  onChange={setProperty}
                  onNext={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <StepUnit
                  data={unit}
                  onChange={setUnit}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <StepTenant
                  data={tenant}
                  onChange={setTenant}
                  onSubmit={() => setStep('success')}
                  onBack={() => setStep(2)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
