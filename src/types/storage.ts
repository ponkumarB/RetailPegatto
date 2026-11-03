export interface StorageRecord {
  id: string;
  currentPlan: string;
  currentStorage: number; // in GB
  additionalStorage: number; // in GB
  totalStorage: number; // in GB
  reason: string;
  justification: string;
  startDate: string;
  duration: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Active';
  createdAt: string;
}
