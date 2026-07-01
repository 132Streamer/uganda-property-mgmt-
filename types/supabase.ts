// NOTE: This is a hand-written stand-in for the file the Supabase CLI
// generates. Once your migrations are applied to a real project, replace
// this entirely by running:
//
//   npx supabase gen types typescript --project-id <your-project-ref> --schema public > types/supabase.ts
//
// (Needs `npx supabase login` and `NEXT_PUBLIC_SUPABASE_URL` set, or pass
// --db-url for a direct connection.) Until then, this keeps lib/auth.ts and
// other typed Supabase clients compiling, but it does NOT cover every table
// referenced in the app (e.g. rent_payments / invoices / property_units are
// not yet defined — see migration notes).

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: 'landlord' | 'tenant'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          role: 'landlord' | 'tenant'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      properties: {
        Row: {
          id: string
          landlord_id: string
          title: string
          description: string | null
          address: string
          district: string
          city: string
          monthly_rent: number
          bedrooms: number | null
          bathrooms: number | null
          property_type: string | null
          photos: string[]
          status: 'available' | 'occupied' | 'unavailable'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landlord_id: string
          title: string
          description?: string | null
          address: string
          district: string
          city: string
          monthly_rent: number
          bedrooms?: number | null
          bathrooms?: number | null
          property_type?: string | null
          photos?: string[]
          status?: 'available' | 'occupied' | 'unavailable'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
      }
      invitations: {
        Row: {
          id: string
          property_id: string
          unit_id: string | null
          landlord_id: string
          tenant_email: string
          monthly_rent: number | null
          start_date: string | null
          status: 'pending' | 'accepted' | 'expired' | 'revoked'
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_id?: string | null
          landlord_id: string
          tenant_email: string
          monthly_rent?: number | null
          start_date?: string | null
          status?: 'pending' | 'accepted' | 'expired' | 'revoked'
          token: string
          expires_at: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
      }
      units: {
        Row: {
          id: string
          property_id: string
          unit_number: string
          floor: number | null
          status: 'vacant' | 'occupied'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_number: string
          floor?: number | null
          status?: 'vacant' | 'occupied'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['units']['Insert']>
      }
      tenancies: {
        Row: {
          id: string
          unit_id: string
          tenant_id: string
          start_date: string
          end_date: string | null
          monthly_rent_ugx: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          tenant_id: string
          start_date: string
          end_date?: string | null
          monthly_rent_ugx: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['tenancies']['Insert']>
      }
      maintenance_requests: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          landlord_id: string
          title: string
          description: string
          status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved'
          landlord_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          landlord_id: string
          title: string
          description: string
          status?: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved'
          landlord_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['maintenance_requests']['Insert']>
      }
      lease_documents: {
        Row: {
          id: string
          property_id: string
          tenant_id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          property_id: string
          tenant_id: string
          storage_path: string
          uploaded_at?: string
        }
        Update: Partial<Database['public']['Tables']['lease_documents']['Insert']>
      }
      guest_payment_tokens: {
        Row: {
          id: string
          token: string
          invoice_id: string
          created_by: string | null
          expires_at: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          invoice_id: string
          created_by?: string | null
          expires_at: string
          used_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['guest_payment_tokens']['Insert']>
      }
      property_units: {
        Row: {
          id: string
          property_id: string
          unit_number: string
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_number: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['property_units']['Insert']>
      }
      invoices: {
        Row: {
          id: string
          property_unit_id: string
          tenant_id: string
          amount_due: number
          currency: string
          description: string | null
          status: 'pending' | 'paid' | 'cancelled'
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_unit_id: string
          tenant_id: string
          amount_due: number
          currency?: string
          description?: string | null
          status?: 'pending' | 'paid' | 'cancelled'
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          currency: string
          status: 'pending' | 'paid' | 'failed' | 'reversed'
          is_guest_payment: boolean
          guest_name: string | null
          guest_phone: string | null
          pesapal_tracking_id: string | null
          pesapal_status: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'paid' | 'failed' | 'reversed'
          is_guest_payment?: boolean
          guest_name?: string | null
          guest_phone?: string | null
          pesapal_tracking_id?: string | null
          pesapal_status?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
    }
  }
}
