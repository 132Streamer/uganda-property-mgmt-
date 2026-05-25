// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthToken, getTransactionStatus } from "@/lib/pesapal";
import { sendReceiptEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Pesapal sends IPN as GET with query params:
 *   ?OrderTrackingId=...&OrderMerchantReference=...&OrderNotificationType=IPNCHANGE
 *
 * We must respond with a JSON body acknowledging receipt, then process asynchronously.
 * Pesapal docs also allow POST — this handler covers both.
 */

async function handleIPN(orderTrackingId: string, merchantReference: string): Promise<void> {
  // 1. Authenticate
  const token = await getAuthToken();

  // 2. Get authoritative status from Pesapal
  const status = await getTransactionStatus(token, orderTrackingId);

  const isCompleted = status.payment_status_description === "Completed";
  const isFailed =
    status.payment_status_description === "Failed" ||
    status.payment_status_description === "Invalid" ||
    status.payment_status_description === "Reversed";

  const newStatus = isCompleted ? "completed" : isFailed ? "failed" : "pending";
  const statusFields = {
    status: newStatus,
    payment_method: status.payment_method,
    confirmation_code: status.confirmation_code,
    payment_status_description: status.payment_status_description,
    updated_at: new Date().toISOString(),
  };

  // 3. Try rent_payments first, then guest_payments
  const { data: rentRow, error: rentErr } = await supabase
    .from("rent_payments")
    .update(statusFields)
    .eq("order_tracking_id", orderTrackingId)
    .select("id, lease_id, payer_name, payer_email, amount, currency")
    .maybeSingle();

  if (rentErr) throw new Error(`rent_payments update error: ${rentErr.message}`);

  const { data: guestRow, error: guestErr } = !rentRow
    ? await supabase
        .from("guest_payments")
        .update(statusFields)
        .eq("order_tracking_id", orderTrackingId)
        .select("id, lease_id, payer_name, payer_email, amount, currency, property_name, unit_name")
        .maybeSingle()
    : { data: null, error: null };

  if (guestErr) throw new Error(`guest_payments update error: ${guestErr.message}`);

  const row = rentRow ?? guestRow;
  if (!row) {
    console.warn(`[webhook] No payment record found for tracking ID: ${orderTrackingId}`);
    return;
  }

  // 4. Post-success actions
  if (isCompleted && row) {
    // Insert landlord notification
    const notifDescription = rentRow
      ? `Rent payment of ${row.currency} ${row.amount} received from ${row.payer_name}`
      : `Guest payment of ${row.currency} ${row.amount} received from ${row.payer_name}`;

    const { error: notifErr } = await supabase.from("notifications").insert({
      lease_id: row.lease_id,
      type: "payment_received",
      description: notifDescription,
      metadata: {
        amount: row.amount,
        currency: row.currency,
        payer_name: row.payer_name,
        confirmation_code: status.confirmation_code,
        payment_type: rentRow ? "tenant" : "guest",
      },
      read: false,
      created_at: new Date().toISOString(),
    });

    if (notifErr) {
      // Non-fatal — log but continue
      console.error(`[webhook] Notification insert failed: ${notifErr.message}`);
    }

    // Send receipt email
    if (row.payer_email) {
      try {
        await sendReceiptEmail({
          toEmail: row.payer_email,
          toName: row.payer_name,
          amount: row.amount,
          currency: row.currency,
          confirmationCode: status.confirmation_code,
          leaseId: row.lease_id,
          paymentDate: new Date(status.created_date).toLocaleDateString("en-UG", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        });
      } catch (emailErr) {
        // Non-fatal
        console.error(`[webhook] Receipt email failed:`, emailErr);
      }
    }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.json({ error: "Missing IPN parameters" }, { status: 400 });
  }

  // Acknowledge immediately — Pesapal requires this exact shape
  const ack = NextResponse.json({
    orderNotificationType: "IPNCHANGE",
    orderTrackingId,
    orderMerchantReference: merchantReference,
    status: 200,
  });

  // Process in background (edge-safe fire-and-forget with error logging)
  handleIPN(orderTrackingId, merchantReference).catch((err) => {
    console.error("[webhook] IPN processing error:", err);
  });

  return ack;
}

// Some Pesapal configurations POST the IPN body
export async function POST(req: NextRequest) {
  let orderTrackingId: string | undefined;
  let merchantReference: string | undefined;

  try {
    const body = await req.json();
    orderTrackingId = body.OrderTrackingId ?? body.orderTrackingId;
    merchantReference = body.OrderMerchantReference ?? body.orderMerchantReference;
  } catch {
    // Fall back to query params
    const { searchParams } = new URL(req.url);
    orderTrackingId = searchParams.get("OrderTrackingId") ?? undefined;
    merchantReference = searchParams.get("OrderMerchantReference") ?? undefined;
  }

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.json({ error: "Missing IPN parameters" }, { status: 400 });
  }

  const ack = NextResponse.json({
    orderNotificationType: "IPNCHANGE",
    orderTrackingId,
    orderMerchantReference: merchantReference,
    status: 200,
  });

  handleIPN(orderTrackingId, merchantReference).catch((err) => {
    console.error("[webhook] IPN processing error:", err);
  });

  return ack;
}