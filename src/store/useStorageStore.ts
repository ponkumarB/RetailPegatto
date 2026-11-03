import { create } from 'zustand';
import { StorageRecord } from '@/types/storage';

interface StorageState {
  storageRequests: StorageRecord[];
  addStorageRequest: (request: StorageRecord) => void;
  deleteStorageRequest: (id: string) => void;
  updateStorageRequest: (id: string, updatedRequest: Partial<StorageRecord>) => void;
}

const initialRequests: StorageRecord[] = [
  {
    id: 'STG-101',
    currentPlan: 'Professional Plan',
    currentStorage: 100,
    additionalStorage: 200,
    totalStorage: 300,
    reason: 'Business Growth & More Data',
    justification: 'We are expanding our operations and need additional storage to store more files, documents, and attachments.',
    startDate: 'May 20, 2024',
    duration: '12 Months',
    status: 'Active',
    createdAt: '2024-05-18'
  },
  {
    id: 'STG-102',
    currentPlan: 'Professional Plan',
    currentStorage: 100,
    additionalStorage: 100,
    totalStorage: 200,
    reason: 'Temporary Project Backup',
    justification: 'Need extra workspace space for the client audit files backup.',
    startDate: 'Jul 01, 2026',
    duration: '6 Months',
    status: 'Pending Approval',
    createdAt: '2026-06-11'
  }
];

export const useStorageStore = create<StorageState>((set) => ({
  storageRequests: initialRequests,
  addStorageRequest: (request) => set((state) => ({ storageRequests: [request, ...state.storageRequests] })),
  deleteStorageRequest: (id) => set((state) => ({ storageRequests: state.storageRequests.filter((r) => r.id !== id) })),
  updateStorageRequest: (id, updatedRequest) =>
    set((state) => ({
      storageRequests: state.storageRequests.map((r) => (r.id === id ? { ...r, ...updatedRequest } : r)),
    })),
}));
