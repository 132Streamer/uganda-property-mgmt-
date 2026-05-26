'use server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server';
import { getLeasePdfPath } from '@/lib/lease-utils';
import { revalidatePath } from 'next/cache';

export async function uploadLeasePdf(leaseId: string, formData: FormData): Promise<{ error?: string }> {
  const supabase = createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Unauthorized.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'landlord') return { error: 'Only landlords can upload lease PDFs.' };

  const file = formData.get('pdf') as File | null;
  if (!file) return { error: 'No file provided.' };
  if (file.type !== 'application/pdf') return { error: 'File must be a PDF.' };
  if (file.size > 10 * 1024 * 1024) return { error: 'PDF exceeds 10 MB limit.' };

  const admin = createSupabaseAdminClient();

  // Verify landlord owns this lease
  const { data: lease, error: leaseError } = await admin
    .from('leases')
    .select('id, unit_id, units!inner(property_id, properties!inner(landlord_id))')
    .eq('id', leaseId)
    .single();

  if (leaseError || !lease) return { error: 'Lease not found.' };

  const prop = (lease as any).units?.properties as { landlord_id: string };
  if (prop.landlord_id !== user.id) return { error: 'Lease does not belong to your property.' };

  const pdfPath = getLeasePdfPath(leaseId);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from('lease-documents')
    .upload(pdfPath, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    console.error('PDF upload error:', uploadError);
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { error: updateError } = await admin
    .from('leases')
    .update({ pdf_path: pdfPath, updated_at: new Date().toISOString() })
    .eq('id', leaseId);

  if (updateError) {
    console.error('PDF path update error:', updateError);
    return { error: 'Uploaded PDF but failed to save path.' };
  }

  revalidatePath(`/properties/${(lease as any).units?.property_id}`);
  return {};
}

export async function getLeaseDownloadUrl(pdfPath: string): Promise<{ url?: string; error?: string }> {
  const supabase = createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Unauthorized.' };

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin.storage
    .from('lease-documents')
    .createSignedUrl(pdfPath, 60 * 60); // 1-hour expiry

  if (error || !data?.signedUrl) {
    return { error: 'Failed to generate download URL.' };
  }

  return { url: data.signedUrl };
}