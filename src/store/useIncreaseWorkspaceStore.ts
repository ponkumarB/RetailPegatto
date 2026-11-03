import { create } from 'zustand';
import { IncreaseWorkspaceRecord } from '@/types/increase-workspace';

interface IncreaseWorkspaceState {
  records: IncreaseWorkspaceRecord[];
  addRecord: (record: IncreaseWorkspaceRecord) => void;
  deleteRecord: (id: string) => void;
  updateRecord: (id: string, updatedRecord: Partial<IncreaseWorkspaceRecord>) => void;
}

const initialRecords: IncreaseWorkspaceRecord[] = [
  {
    id: 'WKP-001',
    instanceName: 'Greenfield International School',
    instanceDomain: 'greenfield-school.crmfarm.in',
    databaseSchema: 'greenfield_school',
    currentSizeGb: 20,
    usedSizeGb: 12.45,
    additionalSizeGb: 10,
    newSizeGb: 30,
    planName: 'Professional',
    databaseServer: 'AWS - Mumbai (ap-south-1)',
    status: 'Completed',
    createdAt: '2026-05-15'
  },
  {
    id: 'WKP-002',
    instanceName: 'Acme Corporates',
    instanceDomain: 'acme.crmfarm.in',
    databaseSchema: 'acme_corporate_db',
    currentSizeGb: 50,
    usedSizeGb: 44.12,
    additionalSizeGb: 20,
    newSizeGb: 70,
    planName: 'Professional',
    databaseServer: 'AWS - Mumbai (ap-south-1)',
    status: 'Pending Approval',
    createdAt: '2026-06-28'
  }
];

export const useIncreaseWorkspaceStore = create<IncreaseWorkspaceState>((set) => ({
  records: initialRecords,
  addRecord: (record) => set((state) => ({ records: [record, ...state.records] })),
  deleteRecord: (id) => set((state) => ({ records: state.records.filter((r) => r.id !== id) })),
  updateRecord: (id, updatedRecord) =>
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? { ...r, ...updatedRecord } : r)),
    })),
}));
