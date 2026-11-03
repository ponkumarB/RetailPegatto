export interface RenewalRecord {
  id: string;
  currentPlan: string;
  currentLicenses: number;
  expiryDate: string;
  renewalDuration: string; // e.g. "12 Months"
  planPackage: string; // e.g. "Professional Plan - 10 Users"
  numUsers: number;
  startDate: string;
  endDate: string;
  reason: string;
  justification: string;
  totalAmount: number; // calculated cost
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Active';
  createdAt: string;
}
