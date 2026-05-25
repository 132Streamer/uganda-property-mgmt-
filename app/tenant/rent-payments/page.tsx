"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type PaymentStatus = "pending" | "completed" | "failed" | "reversed";

interface RentPayment {
  id: string;
  amount: number;
  currency: string;
  period_month: number;
  period_year: number;
  status: PaymentStatus;
  payment_date: string | null;
  confirmation_code: string | null;
  payment_method: string | null;
  created_at: string;
  pesapal_tracking_id: string | null;
}

interface Tenancy {
  id: string;
  monthly_rent: number;
  currency: string;
  unit: {
    unit_number: string;
    property: {
      name: string;
    };
  };
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  failed: "bg-red-50 text-red-600 border-red-100",
  reversed: "bg-stone-100 text-stone-500 border-stone-200",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  completed: "Paid",
  pending: "Pending",
  failed: "Failed",
  reversed: "Reversed",
};

export default function TenantPaymentsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [tenancy, setTenancy] = useState<Tenancy | null>(null);
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const { data: tenancyData, error: tenancyError } = await supabase
      .from("tenancies")
      .select(
        `
        id,
        monthly_rent,
        currency,
        unit:units (
          unit_number,
          property:properties ( name )
        )
      `
      )
      .eq("tenant_id", session.user.id)
      .eq("status", "active")
      .single();

    if (tenancyError || !tenancyData) {
      setError("No active tenancy found.");
      setLoading(false);
      return;
    }

    setTenancy(tenancyData as unknown as Tenancy);

    const { data: paymentsData, error: paymentsError } = await supabase
      .from("rent_payments")
      .select(
        `
        id, amount, currency, period_month, period_year,
        status, payment_date, confirmation_code,
        payment_method, created_at, pesapal_tracking_id
      `
      )
      .eq("tenant_id", session.user.id)
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false })
      .limit(24);

    if (!paymentsError) {
      setPayments((paymentsData as RentPayment[]) ?? []);
    }

    setLoading(false);
  }

  const currentMonthPaid = payments.some(
    (p) =>
      p.period_month === currentMonth &&
      p.period_year === currentYear &&
      p.status === "completed"
  );

  const currentMonthPending = payments.some(
    (p) =>
      p.period_month === currentMonth &&
      p.period_year === currentYear &&
      p.status === "pending"
  );

  async function handlePayNow() {
    if (!tenancy) return;
    setInitiating(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenancy_id: tenancy.id,
          amount: tenancy.monthly_rent,
          period_month: currentMonth,
          period_year: currentYear,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to initiate payment");
      }

      // Redirect to Pesapal checkout
      window.location.href = data.redirect_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment initiation failed");
      setInitiating(false);
    }
  }

  function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="text-stone-400 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error && !tenancy) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-6">
        <div className="bg-white border border-stone-100 rounded-2xl p-8 text-center max-w-sm">
          <p className="text-stone-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const property = tenancy?.unit?.property;
  const unit = tenancy?.unit;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
            Payments
          </h1>
          {property && unit && (
            <p className="text-stone-400 text-sm mt-1">
              {property.name} · Unit {unit.unit_number}
            </p>
          )}
        </div>

        {/* Current Rent Due Card */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-stone-50">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </p>
            <p className="text-3xl font-bold text-stone-900 mt-1 tracking-tight">
              {tenancy ? formatAmount(tenancy.monthly_rent, tenancy.currency) : "—"}
            </p>
            <p className="text-stone-400 text-sm mt-0.5">Monthly rent</p>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            {currentMonthPaid ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span className="text-sm text-emerald-700 font-medium">
                  Paid for this month
                </span>
              </div>
            ) : currentMonthPending ? (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                <span className="text-sm text-amber-600 font-medium">
                  Payment processing
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span className="text-sm text-red-600 font-medium">
                  Due this month
                </span>
              </div>
            )}

            {!currentMonthPaid && !currentMonthPending && (
              <button
                onClick={handlePayNow}
                disabled={initiating}
                className="bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {initiating ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
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
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Redirecting…
                  </>
                ) : (
                  "Pay Now"
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-widest mb-4">
            Payment History
          </h2>

          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 px-6 py-10 text-center">
              <p className="text-stone-400 text-sm">No payments yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-50">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider hidden sm:table-cell">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider hidden md:table-cell">
                        Method
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-semibold text-stone-400 uppercase tracking-wider">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-stone-800">
                          {MONTH_NAMES[payment.period_month - 1]}{" "}
                          {payment.period_year}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-stone-700">
                          {formatAmount(payment.amount, payment.currency)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              STATUS_STYLES[payment.status]
                            }`}
                          >
                            {STATUS_LABELS[payment.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-stone-500 hidden sm:table-cell">
                          {payment.payment_date
                            ? new Date(payment.payment_date).toLocaleDateString(
                                "en-UG",
                                { day: "numeric", month: "short", year: "numeric" }
                              )
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-stone-500 hidden md:table-cell capitalize">
                          {payment.payment_method?.toLowerCase() ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {payment.status === "completed" &&
                          payment.confirmation_code ? (
                            <button
                              onClick={() => downloadReceipt(payment)}
                              className="text-stone-400 hover:text-stone-700 transition-colors"
                              title="Download receipt"
                            >
                              <svg
                                className="w-4 h-4 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </button>
                          ) : (
                            <span className="text-stone-200">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function downloadReceipt(payment: RentPayment) {
  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const amount = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: payment.currency,
    maximumFractionDigits: 0,
  }).format(payment.amount);

  const period = `${MONTH_NAMES[payment.period_month - 1]} ${payment.period_year}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Receipt — ${period}</title>
  <style>
    body { font-family: sans-serif; max-width: 560px; margin: 40px auto; color: #1a1a1a; }
    h2 { color: #16a34a; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    td:first-child { font-weight: 600; width: 45%; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h2>Payment Receipt</h2>
  <table>
    <tr><td>Period</td><td>${period}</td></tr>
    <tr><td>Amount Paid</td><td>${amount}</td></tr>
    <tr><td>Payment Method</td><td>${payment.payment_method ?? "—"}</td></tr>
    <tr><td>Confirmation Code</td><td style="font-family:monospace">${payment.confirmation_code ?? "—"}</td></tr>
    <tr><td>Payment Date</td><td>${payment.payment_date ? new Date(payment.payment_date).toLocaleDateString("en-UG", { dateStyle: "long" }) : "—"}</td></tr>
    <tr><td>Tracking ID</td><td style="font-family:monospace;font-size:12px">${payment.pesapal_tracking_id ?? "—"}</td></tr>
  </table>
  <button onclick="window.print()">Print / Save PDF</button>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `receipt-${MONTH_NAMES[payment.period_month - 1].toLowerCase()}-${payment.period_year}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
