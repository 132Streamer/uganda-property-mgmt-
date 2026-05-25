'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

type Role = 'landlord' | 'tenant'

interface FormState {
  full_name: string
  email: string
  phone: string
  password: string
  role: Role
}

export default function SignupPage() {
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [form, setForm] = useState<FormState>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'tenant',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { full_name, email, phone, password, role } = form

    // 1. Sign up with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name, phone },
      },
    })

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Signup failed.')
      setLoading(false)
      return
    }

    // 2. Insert into public.users
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      full_name,
      email,
      phone,
      role,
    })

    if (dbError) {
      setError(dbError.message)
      setLoading(false)
      return
    }

    // 3. Role-based redirect
    if (role === 'landlord') {
      router.push('/landlord/onboarding')
    } else {
      router.push('/tenant/portal')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">
          Create account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Full name"
            name="full_name"
            type="text"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
          />
          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
          />

          {/* Role selector */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              I am a…
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['landlord', 'tenant'] as Role[]).map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center justify-center rounded-lg border-2 py-3 text-sm font-medium capitalize transition-colors ${
                    form.role === r
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={form.role === r}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Tiny reusable field component (local to this file)
// ---------------------------------------------------------------------------
interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

function Field({ label, name, ...rest }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...rest}
        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  )
}