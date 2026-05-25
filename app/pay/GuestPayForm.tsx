"use client";

// app/pay/[token]/GuestPayForm.tsx

import { useState, FormEvent } from "react";

interface Props {
  guestPaymentId: string;
  leaseId: string;
  amount: number;
}

interface Field {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

const FIELDS: Field[] = [
  { id: "name", label: "Full Name", type: "text", placeholder: "John Mukasa", required: true },
  { id: "email", label: "Email Address", type: "email", placeholder: "john@example.com", required: true },
  { id: "phone", label: "Phone Number", type: "tel", placeholder: "+256 7XX XXX XXX", required: true },
];

export default function GuestPayForm({ guestPaymentId, leaseId, amount }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lease_id: leaseId,
          amount,
          payer_name: name.trim(),
          payer_email: email.trim(),
          payer_phone: phone.trim(),
          payment_type: "guest",
          guest_payment_id: guestPaymentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Payment initiation failed. Please try again.");
        return;
      }

      // Redirect to Pesapal hosted page
      window.location.href = data.redirect_url;
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {FIELDS.map((field) => {
        const value = field.id === "name" ? name : field.id === "email" ? email : phone;
        const setter =
          field.id === "name" ? setName : field.id === "email" ? setEmail : setPhone;

        return (
          <div key={field.id}>
            <label
              htmlFor={field.id}
              className="block text-[#9090a8] text-xs tracking-widest uppercase mb-2"
            >
              {field.label}
            </label>
            <input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              value={value}
              onChange={(e) => setter(e.target.value)}
              className="
                w-full bg-[#13131c] border border-[#1e1e2e] rounded-lg
                px-4 py-3 text-white text-sm placeholder-[#3d3d52]
                focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]
                transition-colors duration-200
              "
            />
          </div>
        );
      })}

      {error && (
        <div className="rounded-lg border border-[#3d1a1a] bg-[#1e1010] px-4 py-3">
          <p className="text-[#e57373] text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="
          w-full mt-2 rounded-lg bg-[#c9a84c] text-[#0f0f14]
          py-3.5 text-sm font-semibold tracking-wide
          hover:bg-[#d4b56a] active:scale-[0.99]
          transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-center gap-2
        "
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Redirecting to Pesapal…
          </>
        ) : (
          "Pay Now"
        )}
      </button>

      <p className="text-center text-[#3d3d52] text-xs pt-1">
        You will be redirected to Pesapal to complete payment via MTN Mobile Money, Airtel Money, or card.
      </p>
    </form>
  );
}