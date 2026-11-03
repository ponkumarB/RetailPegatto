import { create } from 'zustand';

export interface SOWDocument {
  id: string;
  projectName: string;
  projectCode: string;
  customerName: string;
  contactPerson: string;
  email: string;
  phone: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  projectLocation: string;
  currency: string;
  duration: number;
  paymentTerms: string;
  totalCost: number;
  inScope: string[];
  outOfScope: string[];
  deliverables: string[];
  termsAndConditions: string[];
  dealId?: number | null;
  accountId?: number | null;
  overallSow?: any;
}

interface SOWDocumentStore {
  sowList: SOWDocument[];
  currentSow: SOWDocument | null;
  isGenerating: boolean;

  createSOW: () => void;
  selectSOW: (id: string) => void;
  deleteSOW: (id: string) => void;
  saveSOW: () => void;
  updateCurrentField: (field: string, value: any) => void;
  toggleCurrentScope: (scopeType: 'inScope' | 'outOfScope', item: string) => void;
  toggleCurrentTerm: (term: string) => void;
  generateSOW: () => Promise<void>;
}

export const useSOWDocumentStore = create<SOWDocumentStore>((set) => ({
  sowList: [
    {
      id: 'sow-mock-1',
      projectName: 'CRM Implementation',
      projectCode: 'CRM-2024-05',
      customerName: 'ABC Manufacturing Pvt Ltd',
      contactPerson: 'Mr. Kumar',
      email: 'kumar@abcmfg.com',
      phone: '+91 80 1234 5678',
      projectManager: 'Ravi Sharma',
      startDate: '2024-06-01',
      endDate: '2024-08-31',
      projectLocation: 'Bangalore, India',
      currency: 'INR - Indian Rupee (₹)',
      duration: 3,
      paymentTerms: '40% Advance, 40% Milestone, 20% On Delivery',
      totalCost: 1000000,
      inScope: [
        'Lead Management',
        'Contact Management',
        'Deal Management',
        'Workflow Automation',
        'Reporting & Dashboards',
        'Data Migration',
        'User Training',
      ],
      outOfScope: [
        'Mobile Application',
        'Payroll Management',
        'ERP Integration (Phase 1)',
        'Third Party Custom Hardware',
      ],
      deliverables: [
        'Configured CRM Solution',
        'Data Migration & Validation',
        'User Training & Documentation',
        'System Testing & UAT Support',
        'Go-Live & Hypercare Support',
      ],
      termsAndConditions: [
        'All costs exclude applicable taxes.',
        'Customer will provide necessary data and access.',
        'Timelines may change based on change requests.',
        'Confidentiality to be maintained by both parties.',
      ],
    },
  ],
  currentSow: null,
  isGenerating: false,

  createSOW: () => set((state) => ({
    currentSow: {
      id: `sow-${Math.random().toString(36).substring(2, 9)}`,
      projectName: 'New CRM SOW',
      projectCode: 'CRM-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 100),
      customerName: 'ABC Manufacturing Pvt Ltd',
      contactPerson: 'Mr. Kumar',
      email: 'kumar@abcmfg.com',
      phone: '+91 80 1234 5678',
      projectManager: 'Ravi Sharma',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
      projectLocation: 'Bangalore, India',
      currency: 'INR - Indian Rupee (₹)',
      duration: 3,
      paymentTerms: '40% Advance, 40% Milestone, 20% On Delivery',
      totalCost: 1000000,
      inScope: ['Lead Management', 'Contact Management'],
      outOfScope: ['Mobile Application'],
      deliverables: ['Configured CRM Solution'],
      termsAndConditions: [
        'All costs exclude applicable taxes.',
        'Customer will provide necessary data and access.',
      ],
    }
  })),

  selectSOW: (id) => set((state) => {
    const sow = state.sowList.find(s => s.id === id);
    return {
      currentSow: sow ? JSON.parse(JSON.stringify(sow)) : null
    };
  }),

  deleteSOW: (id) => set((state) => ({
    sowList: state.sowList.filter(s => s.id !== id),
    currentSow: state.currentSow?.id === id ? null : state.currentSow
  })),

  saveSOW: () => set((state) => {
    if (!state.currentSow) return {};
    const exists = state.sowList.some(s => s.id === state.currentSow!.id);
    const updatedList = exists
      ? state.sowList.map(s => s.id === state.currentSow!.id ? state.currentSow! : s)
      : [...state.sowList, state.currentSow!];
    return {
      sowList: updatedList,
      currentSow: null
    };
  }),

  updateCurrentField: (field, value) => set((state) => {
    if (!state.currentSow) return {};
    const updated = { ...state.currentSow };

    // If startDate or endDate changes, calculate project duration in months
    if (field === 'startDate' || field === 'endDate') {
      const start = new Date(field === 'startDate' ? value : updated.startDate);
      const end = new Date(field === 'endDate' ? value : updated.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        updated.duration = Math.max(1, diffMonths === 0 ? 1 : diffMonths + 1);
      }
    }

    (updated as any)[field] = value;
    return { currentSow: updated };
  }),

  toggleCurrentScope: (scopeType, item) => set((state) => {
    if (!state.currentSow) return {};
    const updated = { ...state.currentSow };
    const list = updated[scopeType];
    updated[scopeType] = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    return { currentSow: updated };
  }),

  toggleCurrentTerm: (term) => set((state) => {
    if (!state.currentSow) return {};
    const updated = { ...state.currentSow };
    const list = updated.termsAndConditions;
    updated.termsAndConditions = list.includes(term)
      ? list.filter((t) => t !== term)
      : [...list, term];
    return { currentSow: updated };
  }),

  generateSOW: async () => {
    set({ isGenerating: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ isGenerating: false });
  },
}));
