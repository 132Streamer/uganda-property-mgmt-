export type LeaseStatus = 'active' | 'expired' | 'terminated' | 'pending';

export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  status: LeaseStatus;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaseWithDetails extends Lease {
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string | null;
  unit_number: string;
  property_id: string;
  property_name: string;
  landlord_name: string;
  landlord_email: string;
  landlord_phone: string | null;
  days_until_expiry: number;
}

export interface CreateLeaseBody {
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
}

export interface UpdateLeaseBody {
  action: 'renew' | 'terminate';
  new_end_date?: string; // required when action is 'renew'
}

export interface ApiError {
  error: string;
  details?: string;
}