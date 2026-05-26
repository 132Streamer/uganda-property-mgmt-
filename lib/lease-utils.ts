import { LeaseStatus } from '@/types/lease';

export function computeDaysUntilExpiry(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function resolveLeaseStatus(
  currentStatus: LeaseStatus,
  endDate: string
): LeaseStatus {
  if (currentStatus === 'terminated') return 'terminated';
  const days = computeDaysUntilExpiry(endDate);
  if (days < 0) return 'expired';
  return currentStatus === 'active' ? 'active' : currentStatus;
}

export function validateDateRange(startDate: string, endDate: string): string | null {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime())) return 'Invalid start_date format.';
  if (isNaN(end.getTime())) return 'Invalid end_date format.';
  if (end <= start) return 'end_date must be after start_date.';
  return null;
}

export function getLeasePdfPath(leaseId: string): string {
  return `leases/${leaseId}.pdf`;
}