import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getTransactionStatus } from "@/lib/pesapal";

// Service-role client — no user session needed for IPN
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

const PESAPAL_STATUS_MAP: Record<string, string> = {
  Completed: "completed",
  Failed: "failed",
  Invalid: "failed",
  Reversed: "reversed",
};

export async function GET(req: NextRequest) {
  // Pesapal sends IPN as GET with query params
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");
  const notificationType = searchParams.get("OrderNotificationType");

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.json(
      { error: "Missing OrderTrackingId or OrderMerchantReference" },
      { status: 400 }
    );
  }

  try {
    const status = await getTransactionStatus(orderTrackingId);
    const mappedStatus =
      PESAPAL_STATUS_MAP[status.payment_status_description] ?? "pending";

    // Find the payment record
    const { data: payment, error: fetchError } = await supabase
      .from("rent_payments")
      .select(
        `
        id,
        tenancy_id,
        tenant_id,
        amount,
        currency,
        period_month,
        period_year,
        description,
        tenant:profiles!rent_payments_tenant_id_fkey (
          first_name,
          last_name,
          email
        ),
        tenancy:tenancies (
          unit:units (
            unit_number,
            property:properties ( name )
          )
        )
      `
      )
      .eq("pesapal_merchant_reference", merchantReference)
      .single();

    if (fetchError || !payment) {
      console.error("Payment record not found:", fetchError);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update payment record
    const { error: updateError } = await supabase
      .from("rent_payments")
      .update({
        status: mappedStatus,
        pesapal_tracking_id: orderTrackingId,
        payment_method: status.payment_method,
        payment_account: status.payment_account,
        confirmation_code: status.confirmation_code,
        payment_date:
          mappedStatus === "completed"
            ? new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Payment update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // Send receipt email on successful completion
    if (mappedStatus === "completed") {
      const tenant = payment.tenant as any;
      const unit = (payment.tenancy as any)?.unit;
      const property = unit?.property;

      const MONTH_NAMES = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];

      const monthName = MONTH_NAMES[(payment.period_month as number) - 1];

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@yourdomain.com",
        to: tenant.email,
        subject: `Rent Payment Receipt — ${monthName} ${payment.period_year}`,
        html: buildReceiptEmail({
          firstName: tenant.first_name,
          lastName: tenant.last_name,
          amount: payment.amount as number,
          currency: payment.currency as string,
          period: `${monthName} ${payment.period_year}`,
          propertyName: property?.name ?? "Property",
          unitNumber: unit?.unit_number ?? "",
          confirmationCode: status.confirmation_code,
          paymentMethod: status.payment_method,
          paymentAccount: status.payment_account,
          paymentDate: new Date().toLocaleDateString("en-UG", {
            dateStyle: "long",
          }),
          orderTrackingId,
        }),
      });
    }

    return NextResponse.json({ status: "ok", payment_status: mappedStatus });
  } catch (err) {
    console.error("IPN processing error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "IPN processing failed" },
      { status: 500 }
    );
  }
}

// Pesapal also POSTs in some configurations — handle both
export async function POST(req: NextRequest) {
  return GET(req);
}

interface ReceiptEmailParams {
  firstName: string;
  lastName: string;
  amount: number;
  currency: string;
  period: string;
  propertyName: string;
  unitNumber: string;
  confirmationCode: string;
  paymentMethod: string;
  paymentAccount: string;
  paymentDate: string;
  orderTrackingId: string;
}

function buildReceiptEmail(p: ReceiptEmailParams): string {
  const formattedAmount = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: p.currency,
    maximumFractionDigits: 0,
  }).format(p.amount);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#16a34a">Payment Receipt</h2>
  <p>Dear ${p.firstName} ${p.lastName},</p>
  <p>Rent payment for <strong>${p.period}</strong> has been received successfully.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr style="background:#f4f4f5">
      <td style="padding:10px 12px;font-weight:600">Property</td>
      <td style="padding:10px 12px">${p.propertyName}, Unit ${p.unitNumber}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;font-weight:600">Period</td>
      <td style="padding:10px 12px">${p.period}</td>
    </tr>
    <tr style="background:#f4f4f5">
      <td style="padding:10px 12px;font-weight:600">Amount Paid</td>
      <td style="padding:10px 12px">${formattedAmount}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;font-weight:600">Payment Method</td>
      <td style="padding:10px 12px">${p.paymentMethod}</td>
    </tr>
    <tr style="background:#f4f4f5">
      <td style="padding:10px 12px;font-weight:600">Account</td>
      <td style="padding:10px 12px">${p.paymentAccount}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;font-weight:600">Confirmation Code</td>
      <td style="padding:10px 12px;font-family:monospace">${p.confirmationCode}</td>
    </tr>
    <tr style="background:#f4f4f5">
      <td style="padding:10px 12px;font-weight:600">Date</td>
      <td style="padding:10px 12px">${p.paymentDate}</td>
    </tr>
    <tr>
      <td style="padding:10px 12px;font-weight:600">Tracking ID</td>
      <td style="padding:10px 12px;font-family:monospace;font-size:12px">${p.orderTrackingId}</td>
    </tr>
  </table>
  <p style="color:#6b7280;font-size:13px">Keep this email as proof of payment.</p>
</body>
</html>
  `.trim();
}