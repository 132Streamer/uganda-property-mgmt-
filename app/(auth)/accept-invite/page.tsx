'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'


interface InvitationDetails {
  id: string
  tenant_email: string
  property_id: string
  unit_id: string
  monthly_rent: number
  start_date: string
  expires_at: string
  properties: {
    name: string
    address: string
  }
  units: {
    unit_number: string
  }
}

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', password: '' })

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link.')
      setLoading(false)
      return
    }

    async function validateToken() {
      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select(`
          *,
          properties (name, address),
          units (unit_number)
        `)
        .eq('token', token)
        .eq('accepted', false)
        .single()

      if (fetchError || !data) {
        setError('Invitation not found or already used.')
        setLoading(false)
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Invitation has expired.')
        setLoading(false)
        return
      }

      setInvitation(data)
      setLoading(false)
    }

    validateToken()
  }, [token, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation) return
    setSubmitting(true)
    setError(null)

    try {
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.tenant_email,
        password: form.password,
        options: {
          data: { role: 'tenant' },
        },
      })

      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message ?? 'Failed to create account')
      }

      const userId = authData.user.id

      // Insert profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        full_name: form.full_name,
        phone: form.phone,
        email: invitation.tenant_email,
        role: 'tenant',
      })

      if (profileError) throw new Error('Failed to create profile')

      // Create tenancy record
      const { error: tenancyError } = await supabase.from('tenancies').insert({
        tenant_id: userId,
        property_id: invitation.property_id,
        unit_id: invitation.unit_id,
        monthly_rent: invitation.monthly_rent,
        start_date: invitation.start_date,
        status: 'active',
      })

      if (tenancyError) throw new Error('Failed to create tenancy record')

      // Mark invitation accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted: true, accepted_at: new Date().toISOString() })
        .eq('token', token)

      if (updateError) throw new Error('Failed to mark invitation as accepted')

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Validating invitation...</p>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">Invalid Invitation</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accept Invitation</h1>
          <p className="text-sm text-gray-500 mt-1">Create your tenant account to continue.</p>
        </div>

        {invitation && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1 text-sm">
            <p className="font-medium text-gray-700">{invitation.properties?.name}</p>
            <p className="text-gray-500">{invitation.properties?.address}</p>
            <p className="text-gray-500">Unit {invitation.units?.unit_number}</p>
            <p className="text-gray-900 font-semibold mt-2">
              ${Number(invitation.monthly_rent).toLocaleString()} / month
            </p>
            <p className="text-gray-500">
              Starting {new Date(invitation.start_date).toLocaleDateString()}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="+1 555 000 0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Accept & Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}