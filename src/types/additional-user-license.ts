export interface AdditionalUserLicenseRecord {
  id: string;
  organization: string;
  organizationCode: string;
  currentPlan: string;
  primaryContact: string;
  email: string;
  phone: string;
  requestType: 'Add Additional Users' | 'Temporary License (Short Term)';
  additionalLicenses: number;
  userRole: string;
  department?: string;
  requiredFromDate: string;
  reason: string;
  budgetApproval: boolean;
  approvedBy: string;
  approvalDate: string;
  poReference?: string;
  notes?: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Active';
  createdAt: string;
}
