export interface AddonRecord {
  id: string;
  addonApp: string; // "SMS Gateway", "WhatsApp API", "Email Marketing Suite", etc.
  planPackage: string; // e.g. "Professional Plan - 10,000 SMS / Month"
  quantity: number;
  reason: string;
  startDate: string; // "May 20, 2024"
  duration: string; // "3 Months", "6 Months", "12 Months", "24 Months"
  justification: string;
  cost: number; // e.g. 2000
  status: 'Pending Approval' | 'Approved' | 'Rejected' | 'Active';
  createdAt: string;
}
