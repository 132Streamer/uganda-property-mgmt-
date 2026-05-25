"use client";

// app/pay/[token]/page.tsx
// Public page — no authentication required.

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import GuestPayForm from "../GuestPayForm";

interface GuestPayment {
  id: string;
  token: string;
  lease_id: string;
  property_name: string;
  unit_name: string;
  amount: number;
  currency: string;
  expires_at: string;
  status: string;
  description?: string;
}

// Use anon key — this is a public read
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getGuestPayment(token: string): Promise<GuestPayment | null> {
  const { data, error } = await supabase
    .from("guest_payments")
    .select(
      "id, token, lease_id, property_name, unit_name, amount, currency, expires_at, status, description"
    )
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("Error fetching guest payment:", error.message);
    return null;
  }
  return data;
}

export default async function GuestPayPage({ params }: { params: { token: string } }) {
  const payment = await getGuestPayment(params.token);

  if (!payment) notFound();

  const isExpired = new Date(payment.expires_at) < new Date();
  const isAlreadyPaid = payment.status === "completed";

  return (
    <main className="min-h-screen bg-[#0f0f14] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[#c9a84c] text-xs tracking-[0.25em] uppercase mb-2 font-mono">
            Secure Payment Link
          </p>
          <h1 className="text-white text-3xl font-light tracking-tight">
            {payment.property_name}
          </h1>
          <p className="text-[#6b6b80] text-sm mt-1">{payment.unit_name}</p>
        </div>

        {/* Amount card */}
        <div className="rounded-xl border border-[#1e1e2e] bg-[#13131c] p-6 mb-6">
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-[#6b6b80] text-sm">Amount Due</span>
            <span className="text-[#c9a84c] text-xs font-mono">{payment.currency}</span>
          </div>
          <p className="text-white text-4xl font-light tracking-tight">
            {new Intl.NumberFormat("en-UG").format(payment.amount)}
          </p>
          {payment.description && (
            <p className="text-[#6b6b80] text-xs mt-3 leading-relaxed">{payment.description}</p>
          )}
          <div className="mt-4 pt-4 border-t border-[#1e1e2e] flex items-center justify-between">
            <span className="text-[#6b6b80] text-xs">Expires</span>
            <span className="text-[#6b6b80] text-xs font-mono">
              {new Date(payment.expires_at).toLocaleDateString("en-UG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* State: expired */}
        {isExpired && (
          <div className="rounded-xl border border-[#3d1a1a] bg-[#1e1010] p-6 text-center">
            <div className="text-2xl mb-3">⏱</div>
            <h2 className="text-[#e57373] text-lg font-light mb-2">Link Expired</h2>
            <p className="text-[#6b6b80] text-sm leading-relaxed">
              This payment link expired on{" "}
              {new Date(payment.expires_at).toLocaleDateString("en-UG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              . Contact your property manager for a new link.
            </p>
          </div>
        )}

        {/* State: already paid */}
        {!isExpired && isAlreadyPaid && (
          <div className="rounded-xl border border-[#1a3d1a] bg-[#101e10] p-6 text-center">
            <div className="text-2xl mb-3">✓</div>
            <h2 className="text-[#81c784] text-lg font-light mb-2">Payment Received</h2>
            <p className="text-[#6b6b80] text-sm">
              This payment has already been completed. Check your email for a receipt.
            </p>
          </div>
        )}

        {/* State: active — show form */}
        {!isExpired && !isAlreadyPaid && (
          <GuestPayForm
            guestPaymentId={payment.id}
            leaseId={payment.lease_id}
            amount={payment.amount}
          />
        )}

        <p className="text-center text-[#3d3d52] text-xs mt-8">
          Secured by Pesapal · Encrypted payment
        </p>
      </div>
    </main>
  );
}