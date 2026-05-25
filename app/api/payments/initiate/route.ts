import { createServerClient } from @supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { registerIPN, submitOrder } from "@/lib/pesapal";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Auth check — tenant only
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Verify user has tenant role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "tenant") {
    return NextResponse.json({ error: "Forbidden: tenants only" }, { status: 403 });
  }

  // Parse body
  let body: {
    tenancy_id: string;
    amount: number;
    period_month: number;
    period_year: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { tenancy_id, amount, period_month, period_year } = body;

  if (!tenancy_id || !amount || !period_month || !period_year) {
    return NextResponse.json(
      { error: "Missing required fields: tenancy_id, amount, period_month, period_year" },
      { status: 400 }
    );
  }

  // Fetch tenancy + property + tenant details, verify ownership
  const { data: tenancy, error: tenancyError } = await supabase
    .from("tenancies")
    .select(
      `
      id,
      unit:units (
        id,
        unit_number,
        property:properties ( id, name )
      ),
      tenant:profiles!tenancies_tenant_id_fkey (
        id,
        first_name,
        last_name,
        email
      )
    `
    )
    .eq("id", tenancy_id)
    .eq("tenant_id", userId)
    .eq("status", "active")
    .single();

  if (tenancyError || !tenancy) {
    return NextResponse.json(
      { error: "Tenancy not found or not active" },
      { status: 404 }
    );
  }

  const property = (tenancy.unit as any)?.property;
  const unit = tenancy.unit as any;
  const tenant = tenancy.tenant as any;
  const monthName = MONTH_NAMES[period_month - 1];

  const description = `Rent payment - ${property?.name ?? "Property"} Unit ${unit?.unit_number ?? ""} ${monthName} ${period_year}`;
  const internalOrderId = uuidv4();

  try {
    // Register IPN URL
    const ipnUrl = `${APP_URL}/api/payments/ipn`;
    const notificationId = await registerIPN(ipnUrl);

    // Submit order to Pesapal
    const orderResponse = await submitOrder({
      id: internalOrderId,
      currency: "UGX",
      amount,
      description,
      callbackUrl: `${APP_URL}/tenant/payments/callback`,
      notificationId,
      billingAddress: {
        email_address: tenant.email,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
      },
    });

    // Persist pending payment record
    const { error: insertError } = await supabase
      .from("rent_payments")
      .insert({
        id: internalOrderId,
        tenancy_id,
        tenant_id: userId,
        amount,
        currency: "UGX",
        period_month,
        period_year,
        description,
        status: "pending",
        pesapal_order_id: orderResponse.order_tracking_id,
        pesapal_merchant_reference: orderResponse.merchant_reference,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to record payment initiation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      redirect_url: orderResponse.redirect_url,
      order_tracking_id: orderResponse.order_tracking_id,
    });
  } catch (err) {
    console.error("Payment initiation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment initiation failed" },
      { status: 500 }
    );
  }
}
