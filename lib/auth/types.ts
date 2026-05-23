export type UserRole = 'landlord' | 'tenant'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name?: string
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}
