import { create } from 'zustand';
import { LicenseRecord } from '@/types/license';

interface LicenseState {
  licenses: LicenseRecord[];
  addLicense: (license: LicenseRecord) => void;
  deleteLicense: (id: string) => void;
  updateLicense: (id: string, updatedLicense: Partial<LicenseRecord>) => void;
}

const initialLicenses: LicenseRecord[] = [
  {
    id: 'LIC-101',
    currentPlan: 'Professional Plan',
    currentLicenses: 10,
    additionalLicenses: 5,
    totalLicenses: 15,
    reason: 'Team Expansion',
    justification: 'We are expanding our sales team and need additional CRM licenses to manage more leads and customers efficiently.',
    startDate: 'May 20, 2024',
    duration: '12 Months',
    status: 'Active',
    createdAt: '2024-05-18'
  },
  {
    id: 'LIC-102',
    currentPlan: 'Professional Plan',
    currentLicenses: 10,
    additionalLicenses: 2,
    totalLicenses: 12,
    reason: 'Department Growth',
    justification: 'Adding new marketing staff to the Bangalore branch.',
    startDate: 'Jul 01, 2026',
    duration: '6 Months',
    status: 'Pending Approval',
    createdAt: '2026-06-11'
  }
];

export const useLicenseStore = create<LicenseState>((set) => ({
  licenses: initialLicenses,
  addLicense: (license) => set((state) => ({ licenses: [license, ...state.licenses] })),
  deleteLicense: (id) => set((state) => ({ licenses: state.licenses.filter((l) => l.id !== id) })),
  updateLicense: (id, updatedLicense) =>
    set((state) => ({
      licenses: state.licenses.map((l) => (l.id === id ? { ...l, ...updatedLicense } : l)),
    })),
}));
