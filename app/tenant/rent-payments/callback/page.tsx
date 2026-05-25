'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type PaymentState = 'loading' | 'completed' | 'failed' | 'pending'

function CallbackContent() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<PaymentState>('loading')
  const [trackingId, setTrackingId] = useState<string | null>(null)

  useEffect(() => {
    const orderTrackingId = searchParams.get('OrderTrackingId')
    const merchantReference = searchParams.get('OrderMerchantReference')
    setTrackingId(orderTrackingId)

    if (!orderTrackingId || !merchantReference) { setState('failed'); return }

    let attempts = 0
    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/status?orderTrackingId=${orderTrackingId}`)
        const data = await res.json()
        const status: string = data.status ?? 'pending'
        if (status === 'completed') { setState('completed'); return }
        if (status === 'failed' || status === 'reversed') { setState('failed'); return }
        attempts++
        if (attempts < 10) setTimeout(poll, 2000)
        else setState('pending')
      } catch { setState('pending') }
    }
    poll()
  }, [searchParams])

  if (state === 'loading') return <LoadingCard />
  if (state === 'completed') return <SuccessCard trackingId={trackingId} />
  if (state === 'pending') return <PendingCard trackingId={trackingId} />
  return <FailureCard />
}

export default function PaymentCallbackPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Suspense fallback={<LoadingCard />}>
          <CallbackContent />
        </Suspense>
      </div>
    </div>
  )
}

function LoadingCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-10 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
        <svg className="w-8 h-8 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Confirming payment</h1>
      <p className="text-stone-500 text-sm">Please wait while we verify your transaction.</p>
    </div>
  )
}

function SuccessCard({ trackingId }: { trackingId: string | null }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-10 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-50 flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Payment successful</h1>
      <p className="text-stone-500 text-sm mb-2">Rent received. Receipt sent to your email.</p>
      {trackingId && <p className="text-stone-400 text-xs font-mono mt-4 mb-6 break-all">Ref: {trackingId}</p>}
      <Link href="/tenant/payments" className="inline-block bg-stone-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-stone-700 transition-colors">
        View payment history
      </Link>
    </div>
  )
}

function PendingCard({ trackingId }: { trackingId: string | null }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-10 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center">
        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Payment processing</h1>
      <p className="text-stone-500 text-sm mb-2">Status updates within a few minutes.</p>
      {trackingId && <p className="text-stone-400 text-xs font-mono mt-4 mb-6 break-all">Ref: {trackingId}</p>}
      <Link href="/tenant/payments" className="inline-block bg-stone-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-stone-700 transition-colors">
        Check payment history
      </Link>
    </div>
  )
}

function FailureCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-10 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-stone-800 mb-2">Payment failed</h1>
      <p className="text-stone-500 text-sm mb-6">Transaction could not be completed. No charge was made.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/tenant/payments" className="inline-block bg-stone-900 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-stone-700 transition-colors">Try again</Link>
        <Link href="/tenant/portal" className="inline-block bg-stone-100 text-stone-700 text-sm font-medium px-6 py-3 rounded-xl hover:bg-stone-200 transition-colors">Go to portal</Link>
      </div>
    </div>
  )
}