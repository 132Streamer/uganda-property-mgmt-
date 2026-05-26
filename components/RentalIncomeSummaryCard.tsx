/**
 * RentalIncomeSummaryCard
 *
 * Server component — fetches rent collected this calendar month for a landlord,
 * then displays total collected + estimated withholding tax (6%).
 *
 * Assumptions about your schema:
 *   payments table columns:
 *     landlord_id  uuid
 *     amount       numeric
 *     paid_at      timestamptz
 *     status       text  ('paid' | ...)
 *
 * Adjust the query if your schema differs.
 */

import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { formatUGX, calcWithholdingTax } from "@/lib/constants";

export async function RentalIncomeSummaryCard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // First day of current month (UTC)
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const { data, error } = await supabase
    .from("payments")
    .select("amount")
    .eq("landlord_id", user?.id)
    .eq("status", "paid")
    .gte("paid_at", monthStart);

  const totalCollected: number = error
    ? 0
    : (data ?? []).reduce((sum: number, row: { amount: any; }) => sum + Number(row.amount), 0);

  const estimatedTax = calcWithholdingTax(totalCollected);

  const month = now.toLocaleString("en-UG", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Rental Income — {month}</h2>
        <span className="text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">
          URA 6% WHT
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Total Collected"
          value={formatUGX(totalCollected)}
          valueClass="text-gray-900"
        />
        <Stat
          label="Est. Withholding Tax"
          value={formatUGX(estimatedTax)}
          valueClass="text-red-600"
        />
      </div>

      <p className="text-xs text-gray-400">
        Withholding tax at 6% applies to gross rental income for individual landlords (URA).
        Consult a tax advisor for exact obligations.
      </p>
    </div>
  );
}

// ─── Internal sub-component ──────────────────────────────────────────────────

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xl font-bold ${valueClass ?? "text-gray-900"}`}>{value}</span>
    </div>
  );
}