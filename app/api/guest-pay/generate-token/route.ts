import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

    // Must be authenticated (landlord or tenant)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
    }

    // Verify invoice exists and caller has access
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        id,
        amount_due,
        status,
        tenant_id,
        property_units (
          properties ( landlord_id )
        )
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Allow access if caller is the tenant or the landlord
    const landlordId = (invoice.property_units as any)?.properties?.landlord_id;
    const isAuthorized =
      invoice.tenant_id === user.id || landlordId === user.id;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    // Generate a cryptographically secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hrs

    const { error: insertError } = await supabase
      .from("guest_payment_tokens")
      .insert({
        token,
        invoice_id: invoiceId,
        created_by: user.id,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Token insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
    const paymentLink = `${baseUrl}/guest-pay/${token}`;

    return NextResponse.json({
      token,
      paymentLink,
      expiresAt,
    });
  } catch (err) {
    console.error("generate-token error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}