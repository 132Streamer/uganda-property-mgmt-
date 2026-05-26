import { createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');
  const tenantId = searchParams.get('tenantId');

  if (!propertyId || !tenantId) {
    return NextResponse.json({ error: 'Missing propertyId or tenantId' }, { status: 400 });
  }

  // RLS enforced: tenant can only select their own row
  const { data: leaseDoc, error: dbError } = await supabase
    .from('lease_documents')
    .select('storage_path')
    .eq('property_id', propertyId)
    .eq('tenant_id', tenantId)
    .single();

  if (dbError || !leaseDoc) {
    return NextResponse.json({ error: 'Lease document not found' }, { status: 404 });
  }

  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('leases')
    .createSignedUrl(leaseDoc.storage_path, 60 * 60); // 1 hour

  if (signedUrlError || !signedUrlData) {
    return NextResponse.json({ error: signedUrlError?.message ?? 'Failed to generate signed URL' }, { status: 500 });
  }

  return NextResponse.json({ url: signedUrlData.signedUrl }, { status: 200 });
}