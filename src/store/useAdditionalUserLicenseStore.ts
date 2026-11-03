import { create } from 'zustand';
import { AdditionalUserLicenseRecord } from '@/types/additional-user-license';

interface AdditionalUserLicenseState {
  requests: AdditionalUserLicenseRecord[];
  addRequest: (request: AdditionalUserLicenseRecord) => void;
  deleteRequest: (id: string) => void;
  updateRequest: (id: string, updatedRequest: Partial<AdditionalUserLicenseRecord>) => void;
}

const initialRequests: AdditionalUserLicenseRecord[] = [
  {
    id: 'AUL-101',
    organization: 'Acme Solutions Pvt. Ltd.',
    organizationCode: 'ACME001',
    currentPlan: 'Professional Plan',
    primaryContact: 'Raghav S.',
    email: 'raghav.s@acmesolutions.com',
    phone: '+91 98765 43210',
    requestType: 'Add Additional Users',
    additionalLicenses: 5,
    userRole: 'Standard User',
    department: 'Sales',
    requiredFromDate: '2025-06-26',
    reason: 'Our team is expanding and we need additional user licenses to support ongoing projects and service delivery.',
    budgetApproval: true,
    approvedBy: 'Sandeep Verma',
    approvalDate: '2025-06-26',
    poReference: 'PO/2025/06/1187',
    notes: 'Approved as per budget for Q2 requirements.',
    status: 'Approved',
    createdAt: '2025-06-25'
  },
  {
    id: 'AUL-102',
    organization: 'Globex Corporation',
    organizationCode: 'GLOBEX02',
    currentPlan: 'Enterprise Plan',
    primaryContact: 'Sarah Jenkins',
    email: 's.jenkins@globex.com',
    phone: '+1 555 019 2834',
    requestType: 'Temporary License (Short Term)',
    additionalLicenses: 15,
    userRole: 'Read-Only User',
    department: 'Support',
    requiredFromDate: '2026-07-01',
    reason: 'Temporary audit team joining for Q3 review.',
    budgetApproval: true,
    approvedBy: 'John Doe',
    approvalDate: '2026-06-28',
    poReference: 'PO/2026/TEMP/882',
    notes: 'Temporary license for 3 months.',
    status: 'Pending Approval',
    createdAt: '2026-06-28'
  }
];

export const useAdditionalUserLicenseStore = create<AdditionalUserLicenseState>((set) => ({
  requests: initialRequests,
  addRequest: (request) => set((state) => ({ requests: [request, ...state.requests] })),
  deleteRequest: (id) => set((state) => ({ requests: state.requests.filter((r) => r.id !== id) })),
  updateRequest: (id, updatedRequest) =>
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, ...updatedRequest } : r)),
    })),
}));
