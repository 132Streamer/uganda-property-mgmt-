// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL || "receipts@yourdomain.com";

export interface ReceiptData {
  toEmail: string;
  toName: string;
  amount: number;
  currency: string;
  confirmationCode: string;
  leaseId: string;
  paymentDate: string;
}

export async function sendReceiptEmail(data: ReceiptData): Promise<void> {
  const formattedAmount = new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: data.currency,
    minimumFractionDigits: 0,
  }).format(data.amount);

  await resend.emails.send({
    from: FROM,
    to: data.toEmail,
    subject: `Payment Receipt — ${formattedAmount}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden">
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:normal;letter-spacing:1px">
              PAYMENT RECEIPT
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <p style="margin:0 0 8px;color:#6b7280;font-size:14px">Dear ${data.toName},</p>
            <p style="margin:0 0 32px;color:#374151;font-size:15px;line-height:1.6">
              Your rent payment has been received successfully.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
              <tr style="background:#f9fafb">
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb">Amount Paid</td>
                <td style="padding:12px 16px;color:#111827;font-size:15px;font-weight:bold;text-align:right;border-bottom:1px solid #e5e7eb">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb">Confirmation Code</td>
                <td style="padding:12px 16px;color:#111827;font-size:13px;font-family:monospace;text-align:right;border-bottom:1px solid #e5e7eb">${data.confirmationCode}</td>
              </tr>
              <tr style="background:#f9fafb">
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb">Lease Reference</td>
                <td style="padding:12px 16px;color:#111827;font-size:13px;font-family:monospace;text-align:right;border-bottom:1px solid #e5e7eb">${data.leaseId}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px">Payment Date</td>
                <td style="padding:12px 16px;color:#111827;font-size:13px;text-align:right">${data.paymentDate}</td>
              </tr>
            </table>

            <p style="margin:32px 0 0;color:#9ca3af;font-size:12px;line-height:1.6">
              Keep this email as proof of payment. If you have questions, contact your property manager.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}