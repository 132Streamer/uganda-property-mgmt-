// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  getAuthToken,
  registerIPN,
  submitOrder,
} from "@/lib/pesapal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface InitiateBody {
  lease_id: string;
  amount: number;
  payer_name: string;
  payer_email: string;
  payer_phone: string;
  payment_type: "tenant" | "guest";
  guest_payment_id?: string; // required when payment_type === 'guest'
}

function buildAppUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${base.replace(/\/$/, "")}${path}`;
}

export async function POST(req: NextRequest) {
  let body: InitiateBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lease_id, amount, payer_name, payer_email, payer_phone, payment_type, guest_payment_id } =
    body;

  // --- Validation ---
  if (!lease_id || !amount || !payer_name || !payer_email || !payer_phone || !payment_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 422 });
  }
  if (!["tenant", "guest"].includes(payment_type)) {
    return NextResponse.json({ error: "payment_type must be 'tenant' or 'guest'" }, { status: 422 });
  }
  if (payment_type === "guest" && !guest_payment_id) {
    return NextResponse.json(
      { error: "guest_payment_id required for guest payments" },
      { status: 422 }
    );
  }
  if (amount <= 0) {
    return NextResponse.json({ error: "amount must be positive" }, { status: 422 });
  }

  try {
    // 1. Authenticate with Pesapal
    const pesapalToken = await getAuthToken();

    // 2. Register IPN
    const ipnUrl = buildAppUrl("/api/payments/webhook");
    const ipnId = await registerIPN(pesapalToken, ipnUrl);

    // 3. Build a unique merchant reference
    const merchantReference = uuidv4();
    const callbackUrl = buildAppUrl(`/payment/callback?ref=${merchantReference}`);

    // 4. Submit order
    const order = await submitOrder({
      token: pesapalToken,
      ipnId,
      merchantReference,
      amount,
      currency: "UGX",
      description: `Rent payment — lease ${lease_id}`,
      callbackUrl,
      payerName: payer_name,
      payerEmail: payer_email,
      payerPhone: payer_phone,
    });

    // 5. Persist pending record
    const commonFields = {
      lease_id,
      amount,
      currency: "UGX",
      payer_name,
      payer_email,
      payer_phone,
      merchant_reference: merchantReference,
      order_tracking_id: order.order_tracking_id,
      status: "pending",
      ipn_id: ipnId,
    };

    if (payment_type === "tenant") {
      const { error: dbErr } = await supabase.from("rent_payments").insert({
        ...commonFields,
        payment_type: "tenant",
      });
      if (dbErr) throw new Error(`DB insert failed: ${dbErr.message}`);
    } else {
      // Update the guest_payment row with tracking info
      const { error: dbErr } = await supabase
        .from("guest_payments")
        .update({
          merchant_reference: merchantReference,
          order_tracking_id: order.order_tracking_id,
          payer_name,
          payer_email,
          payer_phone,
          status: "pending",
          ipn_id: ipnId,
        })
        .eq("id", guest_payment_id);
      if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`);
    }

    return NextResponse.json({
      redirect_url: order.redirect_url,
      order_tracking_id: order.order_tracking_id,
      merchant_reference: merchantReference,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/payments/initiate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}