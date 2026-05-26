import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PESAPAL_BASE_URL =
  process.env.PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`Pesapal auth failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.token;
}

async function getTransactionStatus(token: string, orderTrackingId: string) {
  const res = await fetch(
    `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error(`Status query failed: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export async function POST(req: NextRequest) {
  try {
    // Pesapal sends IPN as query params on a POST
    const { searchParams } = new URL(req.url);
    const orderTrackingId = searchParams.get("OrderTrackingId");
    const orderMerchantReference = searchParams.get("OrderMerchantReference"); // your invoiceId
    const orderNotificationType = searchParams.get("OrderNotificationType");

    if (!orderTrackingId || !orderMerchantReference) {
      return NextResponse.json({ error: "Missing IPN params" }, { status: 400 });
    }

    const token = await getPesapalToken();
    const status = await getTransactionStatus(token, orderTrackingId);

    // payment_status_code: 1 = COMPLETED, 2 = FAILED, 3 = REVERSED
    if (status.payment_status_code === 1) {
      const { error } = await supabase
        .from("rent_payments")
        .update({
          status: "paid",
          pesapal_tracking_id: orderTrackingId,
          pesapal_confirmation_code: status.confirmation_code,
          payment_method: status.payment_method,
          paid_at: new Date().toISOString(),
        })
        .eq("invoice_id", orderMerchantReference);

      if (error) throw new Error(`Supabase update failed: ${error.message}`);
    } else if (status.payment_status_code === 2) {
      await supabase
        .from("rent_payments")
        .update({ status: "failed", pesapal_tracking_id: orderTrackingId })
        .eq("invoice_id", orderMerchantReference);
    }

    // Pesapal requires 200 with orderNotificationType echoed back
    return NextResponse.json(
      { orderNotificationType, orderTrackingId, orderMerchantReference },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    console.error("[Pesapal IPN Error]", message);
    // Still return 200 to prevent Pesapal retry storms; log internally
    return NextResponse.json({ error: message }, { status: 200 });
  }
}