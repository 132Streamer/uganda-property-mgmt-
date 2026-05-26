import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getPesapalToken(): Promise<string> {
  const res = await fetch(
    `${process.env.PESAPAL_API_URL}/api/Auth/RequestToken`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
      }),
    }
  );
  if (!res.ok) throw new Error("Pesapal auth failed");
  const data = await res.json();
  return data.token as string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentId = searchParams.get("paymentId");
  const trackingId = searchParams.get("OrderTrackingId"); // Pesapal appends this

  if (!paymentId) {
    return NextResponse.redirect(
      new URL("/guest-pay/error?reason=missing_payment_id", req.url)
    );
  }

  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch the payment to find the invoice/token
    const { data: payment } = await supabase
      .from("payments")
      .select("id, invoice_id, pesapal_tracking_id, is_guest_payment")
      .eq("id", paymentId)
      .single();

    if (!payment) {
      return NextResponse.redirect(
        new URL("/guest-pay/error?reason=payment_not_found", req.url)
      );
    }

    const tid = trackingId ?? payment.pesapal_tracking_id;

    if (tid) {
      // Query Pesapal for definitive status
      const token = await getPesapalToken();
      const statusRes = await fetch(
        `${process.env.PESAPAL_API_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${tid}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        const pesapalStatus: string = statusData.payment_status_description ?? "";
        const mappedStatus =
          pesapalStatus.toLowerCase() === "completed"
            ? "paid"
            : pesapalStatus.toLowerCase() === "failed"
            ? "failed"
            : "pending";

        await supabase
          .from("payments")
          .update({
            status: mappedStatus,
            pesapal_status: pesapalStatus,
            pesapal_tracking_id: tid,
            paid_at: mappedStatus === "paid" ? new Date().toISOString() : null,
          })
          .eq("id", paymentId);

        if (mappedStatus === "paid") {
          await supabase
            .from("invoices")
            .update({ status: "paid" })
            .eq("id", payment.invoice_id);
        }

        const resultParam = mappedStatus === "paid" ? "success" : mappedStatus;
        return NextResponse.redirect(
          new URL(
            `/guest-pay/result?status=${resultParam}&paymentId=${paymentId}`,
            req.url
          )
        );
      }
    }

    // Fallback if Pesapal status unreachable
    return NextResponse.redirect(
      new URL(`/guest-pay/result?status=pending&paymentId=${paymentId}`, req.url)
    );
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(
      new URL("/guest-pay/error?reason=server_error", req.url)
    );
  }
}