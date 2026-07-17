'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// ─── Get current user profile ─────────────────────────────────────────────

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string) ?? '',
    phone: (user.user_metadata?.phone as string) ?? '',
    avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
  }
}

// ─── Update profile ───────────────────────────────────────────────────────

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
})

export async function updateProfile(values: { full_name: string; phone?: string }) {
  const supabase = await createClient()
  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: parsed.data.full_name,
      phone: parsed.data.phone ?? '',
    },
  })
  if (error) throw new Error(error.message)
  revalidatePath('/landlord/dashboard')
}

// ─── Sign up ──────────────────────────────────────────────────────────────

const signUpSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function signUp(values: z.infer<typeof signUpSchema>) {
  const supabase = await createClient()
  const parsed = signUpSchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      // Supabase will send a confirmation email; after confirmation
      // the user lands at the URL set in your Supabase dashboard
      // (Authentication → URL Configuration → Site URL).
    },
  })

  if (error) throw new Error(error.message)
  // Don't redirect — let the page show the "check your email" state
}

// ─── Sign in ──────────────────────────────────────────────────────────────

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function signIn(values: z.infer<typeof signInSchema>) {
  const supabase = await createClient()
  const parsed = signInSchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) throw new Error(error.message)
  redirect('/landlord/dashboard')
}

// ─── Forgot password ──────────────────────────────────────────────────────

export async function forgotPassword(email: string) {
  const supabase = await createClient()

  if (!z.string().email().safeParse(email).success) {
    throw new Error('Please enter a valid email address')
  }

  // Always returns success to prevent email enumeration
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
  })
}

// ─── Reset password ───────────────────────────────────────────────────────

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

export async function resetPassword(values: z.infer<typeof resetPasswordSchema>) {
  const supabase = await createClient()
  const parsed = resetPasswordSchema.safeParse(values)
  if (!parsed.success) throw new Error(parsed.error.errors[0].message)

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) throw new Error(error.message)
  redirect('/landlord/dashboard')
}

// ─── Sign out ─────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
