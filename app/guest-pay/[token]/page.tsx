"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InvoiceDetails {
  id: string;
  amount_due: number;
  currency: string;
  description: string | null;
  status: string;
  due_date: string | null;
  property_name: string;
  unit_number: string;
  tenant_name: string;
}

type PageState =
  | "loading"
  | "form"
  | "paying"
  | "expired"
  | "not_found"
  | "already_paid"
  | "error";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = "UGX") {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GuestPayPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [invoiceId, setInvoiceId] = useState<string>("");

  // Form fields
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  // ── Resolve token on mount ──────────────────────────────────────────────

  useEffect(() => {
    async function resolveToken() {
      const { data: tokenRow, error } = await supabase
        .from("guest_payment_tokens")
        .select(
          `
          id,
          invoice_id,
          expires_at,
          used_at,
          invoices (
            id,
            amount_due,
            currency,
            description,
            status,
            due_date,
            property_units (
              unit_number,
              properties ( name )
            ),
            tenants:profiles!invoices_tenant_id_fkey ( full_name )
          )
        `
        )
        .eq("token", params.token)
        .single();

      if (error || !tokenRow) {
        setPageState("not_found");
        return;
      }

      const now = new Date();
      if (new Date(tokenRow.expires_at) < now) {
        setPageState("expired");
        return;
      }

      const inv = (tokenRow as any).invoices;
      if (!inv) {
        setPageState("not_found");
        return;
      }

      if (inv.status === "paid") {
        setPageState("already_paid");
        return;
      }

      setInvoiceId(inv.id);
      setInvoice({
        id: inv.id,
        amount_due: inv.amount_due,
        currency: inv.currency ?? "UGX",
        description: inv.description,
        status: inv.status,
        due_date: inv.due_date,
        property_name: inv.property_units?.properties?.name ?? "Property",
        unit_number: inv.property_units?.unit_number ?? "",
        tenant_name: inv.tenants?.full_name ?? "Tenant",
      });
      setPageState("form");
    }

    resolveToken();
  }, [params.token]);

  // ── Validation ─────────────────────────────────────────────────────────

  function validate() {
    const errors: Record<string, string> = {};
    if (!guestName.trim()) errors.guestName = "Name is required";
    if (!guestPhone.trim()) {
      errors.guestPhone = "Phone is required";
    } else if (!/^\+?[\d\s\-]{9,15}$/.test(guestPhone.trim())) {
      errors.guestPhone = "Enter a valid phone number";
    }
    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      errors.guestEmail = "Enter a valid email";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ── Payment initiation ─────────────────────────────────────────────────

  async function handlePay() {
    if (!validate()) return;
    setPageState("paying");
    setSubmitError("");

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Payment initiation failed. Try again.");
        setPageState("form");
        return;
      }

      // Mark token as used
      await supabase
        .from("guest_payment_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", params.token);

      // Redirect to Pesapal
      window.location.href = data.redirectUrl;
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
      setPageState("form");
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="guest-pay-root">
      {/* Background pattern */}
      <div className="bg-pattern" aria-hidden="true" />

      <main className="guest-pay-container">
        {/* Logo / Brand */}
        <header className="brand">
          <div className="brand-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#1a472a" />
              <path
                d="M7 14h14M14 7v14"
                stroke="#c8f7d4"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span>RentFlow UG</span>
          </div>
        </header>

        {/* ── States ── */}

        {pageState === "loading" && (
          <div className="state-card state-loading">
            <div className="spinner" />
            <p>Verifying payment link…</p>
          </div>
        )}

        {pageState === "not_found" && (
          <StateCard
            icon="🔗"
            title="Link not found"
            body="This payment link is invalid or has been removed."
            variant="error"
          />
        )}

        {pageState === "expired" && (
          <StateCard
            icon="⏰"
            title="Link expired"
            body="This payment link was valid for 48 hours and has now expired. Request a new one from your landlord or property manager."
            variant="warning"
          />
        )}

        {pageState === "already_paid" && (
          <StateCard
            icon="✅"
            title="Already paid"
            body="This invoice has already been settled. No further action needed."
            variant="success"
          />
        )}

        {pageState === "error" && (
          <StateCard
            icon="⚠️"
            title="Something went wrong"
            body="An unexpected error occurred. Please try again or contact support."
            variant="error"
          />
        )}

        {(pageState === "form" || pageState === "paying") && invoice && (
          <div className="pay-card">
            {/* Invoice summary */}
            <div className="invoice-summary">
              <div className="property-badge">
                <span className="property-icon">🏢</span>
                <div>
                  <p className="property-name">{invoice.property_name}</p>
                  {invoice.unit_number && (
                    <p className="unit-label">Unit {invoice.unit_number}</p>
                  )}
                </div>
              </div>

              <div className="invoice-meta">
                <div className="meta-row">
                  <span className="meta-label">Tenant</span>
                  <span className="meta-value">{invoice.tenant_name}</span>
                </div>
                {invoice.description && (
                  <div className="meta-row">
                    <span className="meta-label">For</span>
                    <span className="meta-value">{invoice.description}</span>
                  </div>
                )}
                {invoice.due_date && (
                  <div className="meta-row">
                    <span className="meta-label">Due</span>
                    <span className="meta-value">
                      {new Date(invoice.due_date).toLocaleDateString("en-UG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="amount-display">
                <span className="amount-label">Amount Due</span>
                <span className="amount-value">
                  {formatCurrency(invoice.amount_due, invoice.currency)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="divider">
              <span>Your details</span>
            </div>

            {/* Guest form */}
            <div className="guest-form">
              <div className="field">
                <label htmlFor="guestName">Full name *</label>
                <input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. Amara Nakibuuka"
                  disabled={pageState === "paying"}
                  autoComplete="name"
                />
                {fieldErrors.guestName && (
                  <span className="field-error">{fieldErrors.guestName}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="guestPhone">Phone number *</label>
                <input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+256 700 000 000"
                  disabled={pageState === "paying"}
                  autoComplete="tel"
                />
                {fieldErrors.guestPhone && (
                  <span className="field-error">{fieldErrors.guestPhone}</span>
                )}
              </div>

              <div className="field">
                <label htmlFor="guestEmail">
                  Email <span className="optional">(optional)</span>
                </label>
                <input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={pageState === "paying"}
                  autoComplete="email"
                />
                {fieldErrors.guestEmail && (
                  <span className="field-error">{fieldErrors.guestEmail}</span>
                )}
              </div>

              {submitError && (
                <div className="submit-error" role="alert">
                  {submitError}
                </div>
              )}

              <button
                className="pay-btn"
                onClick={handlePay}
                disabled={pageState === "paying"}
              >
                {pageState === "paying" ? (
                  <>
                    <span className="btn-spinner" />
                    Redirecting to Pesapal…
                  </>
                ) : (
                  <>
                    Pay {formatCurrency(invoice.amount_due, invoice.currency)}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.75 9h10.5M9.75 4.5 14.25 9l-4.5 4.5"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>

              <p className="secure-note">
                🔒 Secured by Pesapal. You'll be redirected to complete payment.
              </p>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        /* ── Root & Background ── */
        .guest-pay-root {
          min-height: 100vh;
          background: #f4f7f4;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px 48px;
          position: relative;
          font-family: "Georgia", "Times New Roman", serif;
        }

        .bg-pattern {
          position: fixed;
          inset: 0;
          background-image: radial-gradient(
              circle at 20% 20%,
              rgba(26, 71, 42, 0.06) 0%,
              transparent 50%
            ),
            radial-gradient(
              circle at 80% 80%,
              rgba(26, 71, 42, 0.04) 0%,
              transparent 50%
            );
          pointer-events: none;
          z-index: 0;
        }

        /* ── Layout ── */
        .guest-pay-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ── Brand ── */
        .brand {
          display: flex;
          justify-content: center;
          padding: 8px 0 4px;
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.05rem;
          font-weight: 600;
          color: #1a472a;
          letter-spacing: -0.01em;
        }

        /* ── State cards ── */
        .state-card {
          background: #fff;
          border-radius: 16px;
          padding: 48px 32px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06),
            0 4px 16px rgba(0, 0, 0, 0.06);
        }

        .state-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #666;
          font-size: 0.95rem;
        }

        .spinner {
          width: 36px;
          height: 36px;
          border: 3px solid #e0ead0;
          border-top-color: #1a472a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ── Main pay card ── */
        .pay-card {
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06),
            0 8px 32px rgba(0, 0, 0, 0.08);
        }

        /* ── Invoice summary ── */
        .invoice-summary {
          background: linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%);
          padding: 28px 28px 24px;
          color: #fff;
        }

        .property-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .property-icon {
          font-size: 1.8rem;
          line-height: 1;
        }

        .property-name {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
          color: #fff;
        }

        .unit-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.65);
          margin: 2px 0 0;
        }

        .invoice-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 22px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 14px 16px;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
        }

        .meta-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        .meta-value {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.9);
          text-align: right;
        }

        .amount-display {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .amount-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .amount-value {
          font-size: 1.9rem;
          font-weight: 700;
          color: #c8f7d4;
          letter-spacing: -0.02em;
        }

        /* ── Divider ── */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 28px;
          margin: 22px 0 0;
        }

        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e8ede8;
        }

        .divider span {
          font-size: 0.75rem;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: nowrap;
        }

        /* ── Form ── */
        .guest-form {
          padding: 16px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .field label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #3a4a3a;
          letter-spacing: 0.01em;
        }

        .optional {
          font-weight: 400;
          color: #aaa;
        }

        .field input {
          padding: 11px 14px;
          border: 1.5px solid #dde6dd;
          border-radius: 10px;
          font-size: 0.95rem;
          color: #1a2a1a;
          background: #fafcfa;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }

        .field input:focus {
          border-color: #1a472a;
          box-shadow: 0 0 0 3px rgba(26, 71, 42, 0.08);
          background: #fff;
        }

        .field input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .field-error {
          font-size: 0.78rem;
          color: #c0392b;
        }

        .submit-error {
          background: #fdf0ef;
          border: 1px solid #f5c6c2;
          color: #922b21;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 0.85rem;
          line-height: 1.45;
        }

        /* ── Pay button ── */
        .pay-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          background: #1a472a;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          font-family: inherit;
          margin-top: 4px;
          letter-spacing: -0.01em;
        }

        .pay-btn:hover:not(:disabled) {
          background: #163d23;
          transform: translateY(-1px);
        }

        .pay-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .pay-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        .secure-note {
          text-align: center;
          font-size: 0.76rem;
          color: #999;
          margin: 0;
          line-height: 1.5;
        }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .guest-pay-root {
            padding: 16px 12px 40px;
          }
          .invoice-summary {
            padding: 22px 20px 20px;
          }
          .amount-value {
            font-size: 1.55rem;
          }
          .guest-form {
            padding: 12px 20px 24px;
          }
          .divider {
            padding: 0 20px;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Reusable state card ──────────────────────────────────────────────────────

function StateCard({
  icon,
  title,
  body,
  variant,
}: {
  icon: string;
  title: string;
  body: string;
  variant: "success" | "error" | "warning";
}) {
  const colors = {
    success: { bg: "#f0faf0", border: "#b7e0b7", icon: "#1a7a2a" },
    error: { bg: "#fdf4f4", border: "#f0c0c0", icon: "#922b21" },
    warning: { bg: "#fffbf0", border: "#f0dfa0", icon: "#7a5a00" },
  }[variant];

  return (
    <div
      style={{
        background: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 16,
        padding: "40px 28px",
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ fontSize: "2.4rem", marginBottom: 14 }}>{icon}</div>
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#1a2a1a",
          fontFamily: "Georgia, serif",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: "0.9rem",
          color: "#555",
          lineHeight: 1.6,
          fontFamily: "Georgia, serif",
        }}
      >
        {body}
      </p>
    </div>
  );
}