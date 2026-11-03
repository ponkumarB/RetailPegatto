import { create } from 'zustand';

export interface Deal {
  id: string;
  name: string;
  stage: 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  company: string;
  companyInitials: string;
  companyBgColor: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  contactInitials: string;
  contactBgColor: string;
  dealValue: number;
  expectedClose: string;
  probability: number;
  owner: string;
  ownerInitials: string;
  ownerAvatarColor: string;
  createdOn: string;
  lastUpdated: string;
  currency: string;
  currencySymbol: string;
  summary: string;
  source: string;
  internalNotes: string;
  activities?: Array<{
    id: string;
    type: string;
    details: string;
    date: string;
    time: string;
    user: string;
    color: string;
    category: 'create' | 'stage' | 'note' | 'task' | 'email';
  }>;
  tasksList?: Array<{
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
    owner: string;
  }>;
  documentsList?: Array<{
    id: string;
    name: string;
    size: string;
    date: string;
    type: 'pdf' | 'docx' | 'xlsx' | 'pptx';
  }>;
  Deal_Json?: any;
  Lead_Id?: any;
  Contact_Id?: any;
}

export interface DealStageCounts {
  Qualification?: number;
  Proposal?: number;
  Negotiation?: number;
  "Closed Won"?: number;
  "Closed Lost"?: number;
  [key: string]: number | undefined;
}

export interface DealKPIs {
  Total_Deals: number;
  Total_Pipeline_Value: number;
  Deal_Stage_Counts?: DealStageCounts;
  Won_Deals?: number;
  Lost_Deals?: number;
}

interface DealState {
  deals: Deal[];
  cachedPages: Record<string, { results: Deal[]; count: number }>;
  kpis: DealKPIs | null;
  myDealsCount: number | null;
  setCachedPage: (key: string, results: Deal[], count: number) => void;
  setKPIs: (kpis: DealKPIs) => void;
  setMyDealsCount: (count: number) => void;
  clearCache: () => void;
  addDeal: (deal: Deal) => void;
  deleteDeal: (id: string) => void;
  updateDeal: (id: string, updatedDeal: Partial<Deal>) => void;
}

const initialDeals: Deal[] = [
  {
    id: 'DEAL-802',
    name: 'Website Development Project',
    stage: 'Proposal',
    company: 'SoftTech Ltd.',
    companyInitials: 'ST',
    companyBgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400',
    contactName: 'Monirul Islam',
    contactEmail: 'monirul@softtech.com',
    contactPhone: '+880 1711-123456',
    contactRole: 'Manager, SoftTech Ltd.',
    contactInitials: 'MR',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 650000,
    expectedClose: '2025-05-25',
    probability: 60,
    owner: 'Sadia Afrin',
    ownerInitials: 'SA',
    ownerAvatarColor: 'bg-emerald-500 text-white',
    createdOn: '2025-05-10',
    lastUpdated: '2025-05-20',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'SoftTech Ltd. is looking to build a modern, responsive corporate website to improve their online presence and showcase their services. The project includes design, development, content integration, and basic SEO setup.',
    source: 'Website',
    internalNotes: 'Client is happy with the proposal. Waiting for final approval from management.',
    activities: [
      { id: 'EV-1', type: 'Note added', details: 'Client is happy with the proposal. Waiting for final approval from management.', date: '20 May, 2025', time: '02:45 PM', user: 'Sadia Afrin', color: 'bg-amber-500', category: 'note' },
      { id: 'EV-2', type: 'Stage changed to Proposal', details: 'Opportunity progress updated in the sales cycle pipeline.', date: '14 May, 2025', time: '11:15 AM', user: 'Sadia Afrin', color: 'bg-purple-500', category: 'stage' },
      { id: 'EV-3', type: 'Deal created', details: 'Deal record initialized with BDT 6,50,000 value.', date: '2025-05-10', time: '10:30 AM', user: 'Sadia Afrin', color: 'bg-emerald-500', category: 'create' }
    ],
    tasksList: [
      { id: 'T-1', title: 'Schedule technical review call', dueDate: '22 May, 2025', completed: false, owner: 'Sadia Afrin' },
      { id: 'T-2', title: 'Send finalized commercial proposal package', dueDate: '2025-05-25', completed: false, owner: 'Sadia Afrin' }
    ],
    documentsList: [
      { id: 'F-1', name: 'Proposal_Draft.pdf', size: '1.2 MB', date: '14 May, 2025', type: 'pdf' },
      { id: 'F-2', name: 'Requirement_Spec.docx', size: '850 KB', date: '12 May, 2025', type: 'docx' }
    ]
  },
  {
    id: 'DEAL-803',
    name: 'CRM Implementation',
    stage: 'Negotiation',
    company: 'Bright Digitals',
    companyInitials: 'BD',
    companyBgColor: 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400',
    contactName: 'Arefin Rahman',
    contactEmail: 'arefin@brightdigitals.com',
    contactPhone: '+880 1812-987654',
    contactRole: 'CTO, Bright Digitals',
    contactInitials: 'AR',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 1200000,
    expectedClose: '2025-06-10',
    probability: 85,
    owner: 'Sadia Afrin',
    ownerInitials: 'SA',
    ownerAvatarColor: 'bg-emerald-500 text-white',
    createdOn: '2025-05-12',
    lastUpdated: '2025-05-22',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'Implementation of custom Salesforce CRM suite for tracking sales channels, including data migration and 5 training sessions.',
    source: 'Referral',
    internalNotes: 'Pricing negotiation is going on. They requested a 10% discount on support fees.',
    activities: [
      { id: 'EV-1', type: 'Stage changed to Negotiation', details: 'Deal progress updated to Negotiation.', date: '22 May, 2025', time: '04:15 PM', user: 'Sadia Afrin', color: 'bg-blue-600', category: 'stage' },
      { id: 'EV-2', type: 'Deal created', details: 'Deal record initialized with BDT 12,00,000 value.', date: '2025-05-12', time: '10:00 AM', user: 'Sadia Afrin', color: 'bg-emerald-500', category: 'create' }
    ],
    tasksList: [
      { id: 'T-1', title: 'Schedule meeting with pricing committee', dueDate: '2025-06-05', completed: false, owner: 'Sadia Afrin' }
    ],
    documentsList: [
      { id: 'F-1', name: 'Salesforce_Scope_Of_Work.pdf', size: '2.5 MB', date: '2025-05-15', type: 'pdf' }
    ]
  },
  {
    id: 'DEAL-804',
    name: 'Mobile App Development',
    stage: 'Qualification',
    company: 'Innovate Tech',
    companyInitials: 'IT',
    companyBgColor: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400',
    contactName: 'Nusrat Jahan',
    contactEmail: 'nusrat@innovatetech.com',
    contactPhone: '+880 1715-321654',
    contactRole: 'Product Owner, Innovate Tech',
    contactInitials: 'NJ',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 875000,
    expectedClose: '2025-06-18',
    probability: 20,
    owner: 'Jisan Mahmud',
    ownerInitials: 'JM',
    ownerAvatarColor: 'bg-amber-500 text-white',
    createdOn: '2025-05-15',
    lastUpdated: '2025-05-18',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'Cross-platform React Native app delivery for e-commerce store with integrated SSLCommerz payment portal.',
    source: 'Google Ads',
    internalNotes: 'First intro call done. Client is preparing detailed system requirement specs.',
    activities: [
      { id: 'EV-1', type: 'Deal created', details: 'Deal record initialized with BDT 8,75,000 value.', date: '2025-05-15', time: '10:30 AM', user: 'Jisan Mahmud', color: 'bg-emerald-500', category: 'create' }
    ],
    tasksList: [],
    documentsList: []
  },
  {
    id: 'DEAL-805',
    name: 'Digital Marketing Service',
    stage: 'Proposal',
    company: 'WebGrow Ltd.',
    companyInitials: 'WG',
    companyBgColor: 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400',
    contactName: 'Fahim Ahmed',
    contactEmail: 'fahim@webgrow.com',
    contactPhone: '+880 1913-654987',
    contactRole: 'Marketing Director, WebGrow',
    contactInitials: 'FA',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 320000,
    expectedClose: '2025-05-30',
    probability: 60,
    owner: 'Sadia Afrin',
    ownerInitials: 'SA',
    ownerAvatarColor: 'bg-emerald-500 text-white',
    createdOn: '2025-05-11',
    lastUpdated: '2025-05-15',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: '6-month search engine optimization and Facebook advertising pipeline optimization to drive inbound product leads.',
    source: 'Cold Email',
    internalNotes: 'Sent proposal copy. Client reviewing and checking budget availability.',
    activities: [
      { id: 'EV-1', type: 'Deal created', details: 'Deal record initialized with BDT 3,20,000 value.', date: '2025-05-11', time: '11:00 AM', user: 'Sadia Afrin', color: 'bg-emerald-500', category: 'create' }
    ],
    tasksList: [],
    documentsList: []
  },
  {
    id: 'DEAL-806',
    name: 'SEO Optimization',
    stage: 'Closed Won',
    company: 'Rank Kings',
    companyInitials: 'RK',
    companyBgColor: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-455',
    contactName: 'Shakib Rahman',
    contactEmail: 'shakib@rankkings.com',
    contactPhone: '+880 1814-741852',
    contactRole: 'Owner, Rank Kings',
    contactInitials: 'SR',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 410000,
    expectedClose: '2025-05-15',
    probability: 100,
    owner: 'Jisan Mahmud',
    ownerInitials: 'JM',
    ownerAvatarColor: 'bg-amber-500 text-white',
    createdOn: '2025-04-20',
    lastUpdated: '2025-05-15',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'Comprehensive SEO site audit, page index fixes, and keyword rankings growth package.',
    source: 'Organic',
    internalNotes: 'Signed service agreement. Invoice paid in full. Handed off to delivery team.',
    activities: [
      { id: 'EV-1', type: 'Deal Closed Won', details: 'Deal marked as won. Signed contract received.', date: '15 May, 2025', time: '05:00 PM', user: 'Jisan Mahmud', color: 'bg-emerald-500', category: 'stage' }
    ],
    tasksList: [],
    documentsList: []
  },
  {
    id: 'DEAL-807',
    name: 'E-commerce Solution',
    stage: 'Closed Lost',
    company: 'Fashion Store',
    companyInitials: 'FS',
    companyBgColor: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400',
    contactName: 'Tanjila Akter',
    contactEmail: 'tanjila@fashionstore.com',
    contactPhone: '+880 1612-951753',
    contactRole: 'CEO, Fashion Store',
    contactInitials: 'TA',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 225000,
    expectedClose: '2025-05-05',
    probability: 0,
    owner: 'Sadia Afrin',
    ownerInitials: 'SA',
    ownerAvatarColor: 'bg-emerald-500 text-white',
    createdOn: '2025-04-15',
    lastUpdated: '2025-05-05',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'WooCommerce custom redesign and hosting migration for fashion brand.',
    source: 'Website',
    internalNotes: 'Lost to competitor offering cheaper rate. Follow up in 6 months for maintenance.',
    activities: [
      { id: 'EV-1', type: 'Deal Closed Lost', details: 'Lost to competitor.', date: '05 May, 2025', time: '02:00 PM', user: 'Sadia Afrin', color: 'bg-rose-500', category: 'stage' }
    ],
    tasksList: [],
    documentsList: []
  },
  {
    id: 'DEAL-808',
    name: 'Custom Software Development',
    stage: 'Negotiation',
    company: 'Global Logistics',
    companyInitials: 'GL',
    companyBgColor: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400',
    contactName: 'Imran Hossain',
    contactEmail: 'imran@globallogistics.com',
    contactPhone: '+880 1511-753951',
    contactRole: 'Operations Chief, Global Logistics',
    contactInitials: 'IH',
    contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    dealValue: 1560000,
    expectedClose: '2025-06-28',
    probability: 85,
    owner: 'Jisan Mahmud',
    ownerInitials: 'JM',
    ownerAvatarColor: 'bg-amber-500 text-white',
    createdOn: '2025-05-01',
    lastUpdated: '2025-05-25',
    currency: 'BDT (₹)',
    currencySymbol: '₹',
    summary: 'Custom ERP and warehousing tracker system development, integrating with local barcode scanner equipment API.',
    source: 'Referral',
    internalNotes: 'Contract drafts exchanged. Legal review ongoing. Expect signing next week.',
    activities: [
      { id: 'EV-1', type: 'Deal created', details: 'Deal record initialized with BDT 15,60,000 value.', date: '2025-05-01', time: '09:00 AM', user: 'Jisan Mahmud', color: 'bg-emerald-500', category: 'create' }
    ],
    tasksList: [],
    documentsList: []
  }
];

export const useDealStore = create<DealState>((set) => ({
  deals: initialDeals,
  cachedPages: {},
  kpis: null,
  myDealsCount: null,
  setCachedPage: (key, results, count) => set((state) => ({
    cachedPages: { ...state.cachedPages, [key]: { results, count } }
  })),
  setKPIs: (kpis) => set({ kpis }),
  setMyDealsCount: (myDealsCount) => set({ myDealsCount }),
  clearCache: () => set({ cachedPages: {}, kpis: null, myDealsCount: null }),
  addDeal: (deal) => set((state) => ({
    deals: [deal, ...state.deals],
    cachedPages: {}, // invalidate cache
    kpis: null,
    myDealsCount: null
  })),
  deleteDeal: (id) => set((state) => ({
    deals: state.deals.filter((d) => d.id !== id),
    cachedPages: {}, // invalidate cache
    kpis: null,
    myDealsCount: null
  })),
  updateDeal: (id, updatedDeal) =>
    set((state) => ({
      deals: state.deals.map((d) => (d.id === id ? { ...d, ...updatedDeal } : d)),
      cachedPages: {}, // invalidate cache
      kpis: null,
      myDealsCount: null
    })),
}));
