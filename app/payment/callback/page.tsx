"use client";

// app/payment/callback/page.tsx
// Pesapal redirects here after payment attempt.
// We show status — Pesapal status is confirmed via IPN webhook, not this page.

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackContent() {
  const params = useSearchParams();
  const trackingId = params.get("OrderTrackingId");
  const status = params.get("OrderNotificationType"); // may be absent on redirect

  return (
    <main className="min-h-screen bg-[#0f0f14] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-4xl mb-6">
          {status === "FAILED" ? "✗" : "✓"}
        </div>
        <h1 className="text-white text-2xl font-light mb-3">
          {status === "FAILED" ? "Payment Unsuccessful" : "Payment Submitted"}
        </h1>
        <p className="text-[#6b6b80] text-sm leading-relaxed mb-8">
          {status === "FAILED"
            ? "Your payment could not be processed. Please try again or use a different payment method."
            : "Your payment is being processed. You will receive a receipt by email once confirmed."}
        </p>

        {trackingId && (
          <div className="rounded-xl border border-[#1e1e2e] bg-[#13131c] px-4 py-3 mb-8">
            <p className="text-[#6b6b80] text-xs mb-1">Tracking ID</p>
            <p className="text-white font-mono text-sm break-all">{trackingId}</p>
          </div>
        )}

        <p className="text-[#3d3d52] text-xs">
          Keep your tracking ID as reference. Confirmation may take a few minutes.
        </p>
      </div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f14]" />}>
      <CallbackContent />
    </Suspense>
  );
}