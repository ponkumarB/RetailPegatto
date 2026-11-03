import { create } from 'zustand';

export interface LeadList {
  id: string;
  name: string;
  description: string;
  source: string;
  sourceDetails: string;
  captureMethod: 'Form Submission' | 'File Upload' | 'Manual Entry';
  campaign: string;
  tags: string[];
  preventDuplicates: boolean;
  totalLeads: number;
  newLeads: number;
  conversionRate: number;
  status: 'Active' | 'Paused' | 'Inactive' | 'Archived';
  createdOn: string;
  createdBy: string;
}

interface LeadListState {
  lists: LeadList[];
  addList: (list: LeadList) => void;
  deleteList: (id: string) => void;
  updateList: (id: string, updatedList: Partial<LeadList>) => void;
}

const initialLists: LeadList[] = [
  {
    id: 'LST-001',
    name: 'Website Enquiry Leads',
    description: 'Leads from website contact forms',
    source: 'Website',
    sourceDetails: 'https://www.crmfarmit.com/contact-us',
    captureMethod: 'Form Submission',
    campaign: 'Product Demo Flow',
    tags: ['Inbound', 'Web'],
    preventDuplicates: true,
    totalLeads: 2350,
    newLeads: 320,
    conversionRate: 9.45,
    status: 'Active',
    createdOn: '2024-04-28',
    createdBy: 'Aarav Rao',
  },
  {
    id: 'LST-002',
    name: 'Google Ads Campaign - May',
    description: 'Leads from Google Ads (Search)',
    source: 'Google Ads',
    sourceDetails: 'Campaign ID: GOOG-MAY-2024',
    captureMethod: 'Form Submission',
    campaign: 'Q2 Tech Ads',
    tags: ['Paid', 'Google'],
    preventDuplicates: true,
    totalLeads: 1845,
    newLeads: 256,
    conversionRate: 7.81,
    status: 'Active',
    createdOn: '2024-04-27',
    createdBy: 'Sneha Sharma',
  },
  {
    id: 'LST-003',
    name: 'LinkedIn Ads - IT Services',
    description: 'Leads from LinkedIn ad campaign',
    source: 'LinkedIn Ads',
    sourceDetails: 'Campaign Group: IT-B2B-Services',
    captureMethod: 'Form Submission',
    campaign: 'IT Enterprise Q2',
    tags: ['B2B', 'LinkedIn'],
    preventDuplicates: true,
    totalLeads: 1250,
    newLeads: 185,
    conversionRate: 10.32,
    status: 'Active',
    createdOn: '2024-04-25',
    createdBy: 'Rohit Kumar',
  },
  {
    id: 'LST-004',
    name: 'Cold Call Outreach - April',
    description: 'Leads from outbound calling',
    source: 'Cold Call',
    sourceDetails: 'Outbound SDR List #4',
    captureMethod: 'Manual Entry',
    campaign: 'Q2 Outbound Tele',
    tags: ['Outbound', 'SDR'],
    preventDuplicates: false,
    totalLeads: 980,
    newLeads: 92,
    conversionRate: 6.63,
    status: 'Paused',
    createdOn: '2024-04-20',
    createdBy: 'Deepa Patel',
  },
  {
    id: 'LST-005',
    name: 'Email Campaign - Newsletter',
    description: 'Leads from email newsletter',
    source: 'Email',
    sourceDetails: 'Monthly Newsletter Opt-ins',
    captureMethod: 'Form Submission',
    campaign: 'Spring Newsletter',
    tags: ['Inbound', 'Newsletter'],
    preventDuplicates: true,
    totalLeads: 1560,
    newLeads: 210,
    conversionRate: 8.12,
    status: 'Active',
    createdOn: '2024-04-18',
    createdBy: 'Sneha Sharma',
  },
  {
    id: 'LST-006',
    name: 'Partner Referrals - Q2',
    description: 'Leads from partner referrals',
    source: 'Referral',
    sourceDetails: 'Affiliate Partner Network Portal',
    captureMethod: 'Manual Entry',
    campaign: 'Referral Partner Bonus',
    tags: ['Partners', 'Referral'],
    preventDuplicates: true,
    totalLeads: 765,
    newLeads: 78,
    conversionRate: 12.45,
    status: 'Active',
    createdOn: '2024-04-15',
    createdBy: 'Manish Raj',
  },
  {
    id: 'LST-007',
    name: 'Event Leads - Tech Summit',
    description: 'Leads from Tech Summit 2024',
    source: 'Event',
    sourceDetails: 'Frankfurt Tech Expo Booth 4B',
    captureMethod: 'File Upload',
    campaign: 'Tech Summit 2024',
    tags: ['Event', 'Physical'],
    preventDuplicates: true,
    totalLeads: 890,
    newLeads: 64,
    conversionRate: 11.01,
    status: 'Active',
    createdOn: '2024-04-12',
    createdBy: 'Aarav Rao',
  },
  {
    id: 'LST-008',
    name: 'Social Media Leads - April',
    description: 'Leads from social media channels',
    source: 'Social Media',
    sourceDetails: 'Instagram/Facebook Organic Bio Links',
    captureMethod: 'Form Submission',
    campaign: 'Social Organic Growth',
    tags: ['Social', 'Organic'],
    preventDuplicates: true,
    totalLeads: 818,
    newLeads: 71,
    conversionRate: 7.28,
    status: 'Inactive',
    createdOn: '2024-04-10',
    createdBy: 'Rohit Kumar',
  },
];

export const useLeadListStore = create<LeadListState>((set) => ({
  lists: initialLists,
  addList: (list) => set((state) => ({ lists: [list, ...state.lists] })),
  deleteList: (id) => set((state) => ({ lists: state.lists.filter((l) => l.id !== id) })),
  updateList: (id, updatedList) =>
    set((state) => ({
      lists: state.lists.map((l) => (l.id === id ? { ...l, ...updatedList } : l)),
    })),
}));
