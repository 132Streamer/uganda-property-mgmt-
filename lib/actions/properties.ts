'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { propertySchema, type PropertyFormValues } from '@/lib/types/property'

// ─── Fetch all properties for the current landlord ───────────────────────────

export async function getProperties() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ─── Fetch a single property ─────────────────────────────────────────────────

export async function getProperty(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─── Create a new property ───────────────────────────────────────────────────

export async function createProperty(values: PropertyFormValues) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const parsed = propertySchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const { error } = await supabase.from('properties').insert({
    ...parsed.data,
    landlord_id: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/landlord/properties')
}

// ─── Update an existing property ─────────────────────────────────────────────

export async function updateProperty(id: string, values: PropertyFormValues) {
  const supabase = await createClient()

  const parsed = propertySchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const { error } = await supabase
    .from('properties')
    .update(parsed.data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/landlord/properties')
  revalidatePath(`/landlord/properties/${id}`)
}

// ─── Delete a property ───────────────────────────────────────────────────────

export async function deleteProperty(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/landlord/properties')
}
