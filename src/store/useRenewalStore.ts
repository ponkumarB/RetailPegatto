import { create } from 'zustand';
import { RenewalRecord } from '@/types/renewal';

interface RenewalState {
  renewals: RenewalRecord[];
  addRenewal: (renewal: RenewalRecord) => void;
  deleteRenewal: (id: string) => void;
  updateRenewal: (id: string, updatedRenewal: Partial<RenewalRecord>) => void;
}

const initialRenewals: RenewalRecord[] = [
  {
    id: 'REN-101',
    currentPlan: 'Professional Plan',
    currentLicenses: 10,
    expiryDate: 'May 20, 2024',
    renewalDuration: '12 Months',
    planPackage: 'Professional Plan - 10 Users',
    numUsers: 10,
    startDate: 'May 21, 2024',
    endDate: 'May 20, 2025',
    reason: 'We are satisfied with CRMFarm IT and would like to continue using the platform for our business operations.',
    justification: 'CRMFarm IT helps us manage leads, automate workflows and improve team productivity.',
    totalAmount: 120000,
    status: 'Active',
    createdAt: '2024-05-18'
  },
  {
    id: 'REN-102',
    currentPlan: 'Professional Plan',
    currentLicenses: 10,
    expiryDate: 'Jul 01, 2026',
    renewalDuration: '6 Months',
    planPackage: 'Professional Plan - 10 Users',
    numUsers: 10,
    startDate: 'Jul 02, 2026',
    endDate: 'Jan 01, 2027',
    reason: 'We are satisfied with CRMFarm IT and would like to continue using the platform for our business operations.',
    justification: 'System is essential for Bangalore sales workflows.',
    totalAmount: 60000,
    status: 'Pending Approval',
    createdAt: '2026-06-11'
  }
];

export const useRenewalStore = create<RenewalState>((set) => ({
  renewals: initialRenewals,
  addRenewal: (renewal) => set((state) => ({ renewals: [renewal, ...state.renewals] })),
  deleteRenewal: (id) => set((state) => ({ renewals: state.renewals.filter((r) => r.id !== id) })),
  updateRenewal: (id, updatedRenewal) =>
    set((state) => ({
      renewals: state.renewals.map((r) => (r.id === id ? { ...r, ...updatedRenewal } : r)),
    })),
}));
