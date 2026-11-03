export interface LicenseRecord {
  id: string;
  currentPlan: string; // e.g. "Professional Plan"
  currentLicenses: number; // e.g. 10
  additionalLicenses: number; // e.g. 5
  totalLicenses: number; // e.g. 15
  reason: string; // e.g. "Team Expansion"
  justification: string;
  startDate: string; // "May 20, 2024"
  duration: string; // "12 Months"
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Active';
  createdAt: string;
}
