
import { createRouteHandlerClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export async function requireLandlord() {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
      supabase: null,
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profileError || profile?.role !== 'landlord') {
    return {
      error: NextResponse.json({ error: 'Forbidden: landlord role required' }, { status: 403 }),
      session: null,
      supabase: null,
    }
  }

  return { error: null, session, supabase }
}