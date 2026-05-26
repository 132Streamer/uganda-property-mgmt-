import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Obtain a Pesapal OAuth token */
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
  if (!res.ok) throw new Error(`Pesapal auth failed: ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

/** Register IPN URL with Pesapal (idempotent per URL) */
async function getIpnId(token: string): Promise<string> {
  const ipnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/ipn`;
  const res = await fetch(
    `${process.env.PESAPAL_API_URL}/api/URLSetup/RegisterIPN`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: ipnUrl, ipn_notification_type: "GET" }),
    }
  );
  if (!res.ok) throw new Error(`IPN registration failed: ${res.status}`);
  const data = await res.json();
  return data.ipn_id as string;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const body = await req.json();

    const {
      invoiceId,
      guestName,
      guestPhone,
      guestEmail,
      // For authenticated flows these come from the session
    } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
    }

    // Fetch invoice + relations
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        id,
        amount_due,
        currency,
        description,
        tenant_id,
        property_units (
          unit_number,
          properties ( name )
        ),
        tenants:profiles!invoices_tenant_id_fkey (
          full_name,
          email,
          phone
        )
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if ((invoice as any).status === "paid") {
      return NextResponse.json({ error: "Invoice already paid" }, { status: 400 });
    }

    // Resolve payer details — guest fields take priority over tenant profile
    const payerName: string =
      guestName ?? (invoice as any).tenants?.full_name ?? "Tenant";
    const payerEmail: string =
      guestEmail ?? (invoice as any).tenants?.email ?? "";
    const payerPhone: string =
      guestPhone ?? (invoice as any).tenants?.phone ?? "";

    const amount: number = (invoice as any).amount_due;
    const currency: string = (invoice as any).currency ?? "UGX";
    const description: string =
      (invoice as any).description ??
      `Rent – ${(invoice as any).property_units?.properties?.name}`;

    // Create a pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        amount,
        currency,
        status: "pending",
        is_guest_payment: !!guestName,
        guest_name: guestName ?? null,
        guest_phone: guestPhone ?? null,
      })
      .select("id")
      .single();

    if (paymentError || !payment) {
      console.error("Payment record error:", paymentError);
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 }
      );
    }

    const pesapalToken = await getPesapalToken();
    const ipnId = await getIpnId(pesapalToken);

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/callback?paymentId=${payment.id}`;

    const orderPayload = {
      id: payment.id,
      currency,
      amount,
      description,
      callback_url: callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: payerEmail,
        phone_number: payerPhone,
        first_name: payerName.split(" ")[0],
        last_name: payerName.split(" ").slice(1).join(" ") || "",
      },
    };

    const orderRes = await fetch(
      `${process.env.PESAPAL_API_URL}/api/Transactions/SubmitOrderRequest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${pesapalToken}`,
        },
        body: JSON.stringify(orderPayload),
      }
    );

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error("Pesapal order error:", errText);
      return NextResponse.json(
        { error: "Pesapal order submission failed" },
        { status: 502 }
      );
    }

    const orderData = await orderRes.json();

    // Persist the Pesapal tracking ID
    await supabase
      .from("payments")
      .update({ pesapal_tracking_id: orderData.order_tracking_id })
      .eq("id", payment.id);

    return NextResponse.json({
      redirectUrl: orderData.redirect_url,
      paymentId: payment.id,
      trackingId: orderData.order_tracking_id,
    });
  } catch (err) {
    console.error("initiate payment error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}