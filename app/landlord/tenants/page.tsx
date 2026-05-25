'use client'
export const dynamic = 'force-dynamic';
import { useState } from 'react'

interface InviteForm {
  tenant_email: string
  property_id: string
  unit_id: string
  monthly_rent: string
  start_date: string
}

const initialForm: InviteForm = {
  tenant_email: '',
  property_id: '',
  unit_id: '',
  monthly_rent: '',
  start_date: '',
}

export default function TenantsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<InviteForm>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          monthly_rent: parseFloat(form.monthly_rent),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to send invitation')
      }

      setSuccess(true)
      setForm(initialForm)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function closeDialog() {
    setDialogOpen(false)
    setSuccess(false)
    setError(null)
    setForm(initialForm)
  }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and invite tenants to your units.</p>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="bg-gray-900 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-gray-700 transition"
        >
          + Invite Tenant
        </button>
      </div>

      {/* Tenant list placeholder */}
      <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center">
        <p className="text-gray-400 text-sm">No tenants yet. Invite one to get started.</p>
      </div>

      {/* Dialog overlay */}
      {dialogOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          onClick={e => { if (e.target === e.currentTarget) closeDialog() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
            {success ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Invitation Sent</h2>
                  <p className="text-sm text-gray-500 mt-1">Tenant will receive an email with invite link.</p>
                </div>
                <button
                  onClick={closeDialog}
                  className="w-full bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Invite Tenant</h2>
                  <p className="text-sm text-gray-500 mt-1">Send an invitation link to a prospective tenant.</p>
                </div>

                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Email</label>
                    <input
                      type="email"
                      name="tenant_email"
                      required
                      value={form.tenant_email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="tenant@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
                    <input
                      type="text"
                      name="property_id"
                      required
                      value={form.property_id}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="uuid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit ID</label>
                    <input
                      type="text"
                      name="unit_id"
                      required
                      value={form.unit_id}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="uuid"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent ($)</label>
                    <input
                      type="number"
                      name="monthly_rent"
                      required
                      min={0}
                      value={form.monthly_rent}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="1200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="start_date"
                      required
                      value={form.start_date}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 transition disabled:opacity-50"
                    >
                      {submitting ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}