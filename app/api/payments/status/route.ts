import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get("orderTrackingId");

  if (!orderTrackingId) {
    return NextResponse.json(
      { error: "Missing orderTrackingId" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("rent_payments")
    .select("status")
    .eq("pesapal_order_id", orderTrackingId)
    .eq("tenant_id", session.user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: "pending" });
  }

  return NextResponse.json({ status: data.status });
}