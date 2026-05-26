"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResultContent() {
  const params = useSearchParams();
  const status = params.get("status"); // "paid" | "failed" | "pending"
  const paymentId = params.get("paymentId");

  const states = {
    paid: {
      icon: "✅",
      title: "Payment successful",
      body: "Your payment has been received. A receipt will be sent if you provided an email address.",
      color: "#1a7a2a",
      bg: "#f0faf0",
      border: "#b7e0b7",
    },
    failed: {
      icon: "❌",
      title: "Payment failed",
      body: "Your payment could not be processed. Please try again or use a different payment method.",
      color: "#922b21",
      bg: "#fdf4f4",
      border: "#f0c0c0",
    },
    pending: {
      icon: "⏳",
      title: "Payment pending",
      body: "Your payment is being processed. This usually takes a few minutes. Check back shortly or contact your property manager.",
      color: "#7a5a00",
      bg: "#fffbf0",
      border: "#f0dfa0",
    },
  };

  const state = states[status as keyof typeof states] ?? states.pending;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7f4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: state.bg,
          border: `1.5px solid ${state.border}`,
          borderRadius: 20,
          padding: "48px 32px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>{state.icon}</div>
        <h1
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#1a2a1a",
            margin: "0 0 12px",
          }}
        >
          {state.title}
        </h1>
        <p
          style={{
            fontSize: "0.92rem",
            color: "#555",
            lineHeight: 1.65,
            margin: "0 0 24px",
          }}
        >
          {state.body}
        </p>

        {paymentId && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "#aaa",
              fontFamily: "monospace",
              background: "rgba(0,0,0,0.04)",
              borderRadius: 6,
              padding: "6px 10px",
              display: "inline-block",
            }}
          >
            Ref: {paymentId}
          </p>
        )}
      </div>
    </div>
  );
}

export default function GuestPayResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}