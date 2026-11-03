import { create } from 'zustand';
import { AddonRecord } from '@/types/addon';

interface AddonState {
  addons: AddonRecord[];
  addAddon: (addon: AddonRecord) => void;
  deleteAddon: (id: string) => void;
  updateAddon: (id: string, updatedAddon: Partial<AddonRecord>) => void;
}

const initialAddons: AddonRecord[] = [
  {
    id: 'ADD-101',
    addonApp: 'SMS Gateway',
    planPackage: 'Professional Plan - 10,000 SMS / Month',
    quantity: 1,
    reason: 'We need SMS gateway integration to communicate with leads and customers for promotions, alerts and updates.',
    startDate: 'May 20, 2024',
    duration: '12 Months',
    justification: 'This will help our sales and support teams to reach more customers faster and improve engagement.',
    cost: 2000,
    status: 'Active',
    createdAt: '2024-05-19'
  },
  {
    id: 'ADD-102',
    addonApp: 'WhatsApp API',
    planPackage: 'Enterprise Plan - 50,000 WhatsApp Messages / Month',
    quantity: 2,
    reason: 'To establish direct chat communication channels with active support tickets.',
    startDate: 'Jun 15, 2026',
    duration: '6 Months',
    justification: 'Clients are requesting WhatsApp integration for urgent ticket updates.',
    cost: 16000, // ₹ 8,000 * 2 units
    status: 'Pending Approval',
    createdAt: '2026-06-10'
  }
];

export const useAddonStore = create<AddonState>((set) => ({
  addons: initialAddons,
  addAddon: (addon) => set((state) => ({ addons: [addon, ...state.addons] })),
  deleteAddon: (id) => set((state) => ({ addons: state.addons.filter((a) => a.id !== id) })),
  updateAddon: (id, updatedAddon) =>
    set((state) => ({
      addons: state.addons.map((a) => (a.id === id ? { ...a, ...updatedAddon } : a)),
    })),
}));
