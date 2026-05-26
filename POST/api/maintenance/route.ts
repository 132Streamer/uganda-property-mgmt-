import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { sendSMS } from "@/lib/africas-talking";

type Status = "open" | "in_progress" | "resolved";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer();
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: "Maintenance request ID is required" },
      { status: 400 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { status?: Status; landlord_notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { status, landlord_notes } = body;

  const validStatuses: Status[] = ["open", "in_progress", "resolved"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "status must be 'open', 'in_progress', or 'resolved'" },
      { status: 400 }
    );
  }

  if (!status && landlord_notes === undefined) {
    return NextResponse.json(
      { error: "Provide at least status or landlord_notes" },
      { status: 400 }
    );
  }

  // Fetch request + verify landlord owns the property
  const { data: request, error: fetchError } = await supabase
    .from("maintenance_requests")
    .select(
      `
      id, title, status, tenant_id,
      property_id,
      properties(landlord_id, users:landlord_id(phone)),
      leases(tenant_id, profiles:tenant_id(phone))
    `
    )
    .eq("id", id)
    .single();

  if (fetchError || !request) {
    return NextResponse.json(
      { error: "Maintenance request not found" },
      { status: 404 }
    );
  }

  const landlordId = (request.properties as any)?.landlord_id as string | undefined;

  if (landlordId !== user.id) {
    return NextResponse.json(
      { error: "Forbidden — not landlord of this property" },
      { status: 403 }
    );
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updatePayload.status = status;
  if (landlord_notes !== undefined) updatePayload.landlord_notes = landlord_notes;

  const { data: updated, error: updateError } = await supabase
    .from("maintenance_requests")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updated) {
    console.error("Update maintenance_requests error:", updateError);
    return NextResponse.json(
      { error: "Failed to update maintenance request" },
      { status: 500 }
    );
  }

  const tenantId = request.tenant_id as string;
  const tenantPhone = (request.leases as any)?.profiles?.phone as string | undefined;

  // Insert notification for tenant
  if (status) {
    const statusLabel: Record<Status, string> = {
      open: "Open",
      in_progress: "In Progress",
      resolved: "Resolved",
    };

    const { error: notifError } = await supabase.from("notifications").insert({
      user_id: tenantId,
      type: "maintenance_status_update",
      message: `Your maintenance request "${request.title}" is now ${statusLabel[status]}.`,
      reference_id: id,
    });

    if (notifError) {
      console.error("Tenant notification insert error:", notifError);
    }

    // Send SMS to tenant
    if (tenantPhone) {
      try {
        await sendSMS(
          tenantPhone,
          `Maintenance update: "${request.title}" status changed to ${statusLabel[status]}.${
            landlord_notes ? ` Note: ${landlord_notes}` : ""
          }`
        );
      } catch (smsErr) {
        console.error("Tenant SMS error:", smsErr);
      }
    }
  }

  return NextResponse.json({ data: updated }, { status: 200 });
}