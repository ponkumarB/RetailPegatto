import { create } from 'zustand';
import { AddReduceUsersRecord } from '@/types/add-reduce-users';

interface AddReduceUsersState {
  records: AddReduceUsersRecord[];
  addRecord: (record: AddReduceUsersRecord) => void;
  deleteRecord: (id: string) => void;
  updateRecord: (id: string, updatedRecord: Partial<AddReduceUsersRecord>) => void;
}

const initialRecords: AddReduceUsersRecord[] = [
  {
    id: 'USR-001',
    instanceName: 'Greenfield International School',
    instanceDomain: 'greenfield-school.crmfarm.in',
    currentUsers: 125,
    newUsers: 150,
    changeAmount: 25,
    planName: 'Professional (Annual)',
    status: 'Completed',
    pricePerUser: 15,
    billingCycle: '01 Jan 2024 - 31 Dec 2024',
    createdAt: '2026-06-25'
  },
  {
    id: 'USR-002',
    instanceName: 'Acme Corporates',
    instanceDomain: 'acme.crmfarm.in',
    currentUsers: 50,
    newUsers: 75,
    changeAmount: 25,
    planName: 'Enterprise (Monthly)',
    status: 'Pending Approval',
    pricePerUser: 25,
    billingCycle: '01 Jun 2026 - 30 Jun 2026',
    createdAt: '2026-06-28'
  }
];

export const useAddReduceUsersStore = create<AddReduceUsersState>((set) => ({
  records: initialRecords,
  addRecord: (record) => set((state) => ({ records: [record, ...state.records] })),
  deleteRecord: (id) => set((state) => ({ records: state.records.filter((r) => r.id !== id) })),
  updateRecord: (id, updatedRecord) =>
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? { ...r, ...updatedRecord } : r)),
    })),
}));
