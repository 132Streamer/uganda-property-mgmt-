'use client'

// app/(tenant)/payments/page.tsx

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Tenancy {
  id: string
  monthly_rent: number
  due_day: number
}

interface RentPayment {
  id: string
  payment_month: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  completed_at: string | null
  merchant_reference: string
  pesapal_confirmation_code: string | null
}

function formatUGX(amount: number) {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getDueDate(dueDay: number) {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), dueDay)
    .toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  pending:   'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  failed:    'bg-red-50 text-red-700 ring-1 ring-red-200',
}

export default function PaymentsPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [tenancy, setTenancy] = useState<Tenancy | null>(null)
  const [payments, setPayments] = useState<RentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const [tenancyRes, paymentsRes] = await Promise.all([
        supabase
          .from('tenancies')
          .select('id, monthly_rent, due_day')
          .eq('tenant_id', session.user.id)
          .eq('status', 'active')
          .single(),
        supabase
          .from('rent_payments')
          .select('id, payment_month, amount, status, completed_at, merchant_reference, pesapal_confirmation_code')
          .eq('tenant_id', session.user.id)
          .order('payment_month', { ascending: false })
          .limit(24),
      ])

      if (tenancyRes.data) setTenancy(tenancyRes.data)
      if (paymentsRes.data) setPayments(paymentsRes.data)
      setLoading(false)
    }

    load()
  }, [])

  const currentMonth = getCurrentMonth()
  const currentPayment = payments.find(p => p.payment_month === currentMonth)
  const alreadyPaid = currentPayment?.status === 'completed'

  async function handlePayRent() {
    setError(null)
    setPaying(true)

    try {
      const res = await fetch('/api/payments/initiate', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Payment initiation failed')
        return
      }

      window.location.href = data.redirectUrl
    } catch {
      setError('Network error — try again')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  if (!tenancy) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">No active tenancy found. Contact your landlord.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Rent Payments</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage and track your monthly rent</p>
      </div>

      {/* Current Rent Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            Due This Month
          </span>
          {alreadyPaid && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Paid
            </span>
          )}
        </div>

        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-4xl font-bold text-slate-900 tracking-tight">
                {formatUGX(tenancy.monthly_rent)}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                For{' '}
                <span className="font-medium text-slate-700">
                  {new Date(currentMonth + '-01').toLocaleDateString('en-UG', { month: 'long', year: 'numeric' })}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
              Due {getDueDate(tenancy.due_day)}
            </div>
          </div>

          <div className="sm:self-end">
            <button
              onClick={handlePayRent}
              disabled={paying || alreadyPaid}
              className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all
                ${alreadyPaid
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-700 active:scale-[0.98] shadow-sm'}
              `}
            >
              {paying ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting…
                </>
              ) : alreadyPaid ? (
                'Already Paid'
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  Pay Rent
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-4">Payment History</h2>

        {payments.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
            No payments yet
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Month</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">Date Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {new Date(p.payment_month + '-01').toLocaleDateString('en-UG', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-slate-700">
                      {formatUGX(p.amount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-slate-500 hidden sm:table-cell">
                      {p.completed_at
                        ? new Date(p.completed_at).toLocaleDateString('en-UG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}