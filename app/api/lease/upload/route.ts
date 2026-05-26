import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  const supabase = createClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const propertyId = formData.get('propertyId') as string;
  const tenantId = formData.get('tenantId') as string;

  if (!file || !propertyId || !tenantId) {
    return NextResponse.json({ error: 'Missing file, propertyId, or tenantId' }, { status: 400 });
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 });
  }

  const storagePath = `leases/${propertyId}/${tenantId}/lease.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('leases')
    .upload(storagePath, file, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error: dbError } = await supabase
    .from('lease_documents')
    .upsert(
      {
        property_id: propertyId,
        tenant_id: tenantId,
        storage_path: storagePath,
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: 'property_id,tenant_id' }
    )
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ lease: data }, { status: 201 });
}