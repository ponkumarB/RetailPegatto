import { create } from 'zustand';

export interface LeadRecord {
  id: string;
  name: string;
  company: string;
  source: string;
  owner: string;
  stage: 'New Leads' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Converted' | 'Won';
  daysInStage: number;
  status: 'Active' | 'Converted' | 'Won';
  lastActivity: string;
}

interface LeadTrackingStore {
  leads: LeadRecord[];
  searchQuery: string;
  selectedOwner: string;
  currentPage: number;
  pageSize: number;

  setSearchQuery: (query: string) => void;
  setSelectedOwner: (owner: string) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
}

const generateMockLeads = (): LeadRecord[] => {
  const records: LeadRecord[] = [];

  // Exact mockup rows (1 to 8)
  const mockupLeads: Omit<LeadRecord, 'id'>[] = [
    {
      name: 'Ravi Kumar',
      company: 'Tech Solutions Inc.',
      source: 'Website',
      owner: 'Ajay Kumar',
      stage: 'Qualified',
      daysInStage: 2,
      status: 'Active',
      lastActivity: 'May 20, 2024 10:30 AM',
    },
    {
      name: 'Priya Singh',
      company: 'CloudNext Pvt. Ltd.',
      source: 'LinkedIn',
      owner: 'Neha Singh',
      stage: 'Proposal Sent',
      daysInStage: 3,
      status: 'Active',
      lastActivity: 'May 20, 2024 09:15 AM',
    },
    {
      name: 'Amit Mehta',
      company: 'Digital Dynamics',
      source: 'Referral',
      owner: 'Rahul Verma',
      stage: 'Contacted',
      daysInStage: 1,
      status: 'Active',
      lastActivity: 'May 20, 2024 11:20 AM',
    },
    {
      name: 'Sneha Kapoor',
      company: 'Innovatech Systems',
      source: 'Website',
      owner: 'Priya Sharma',
      stage: 'Qualified',
      daysInStage: 4,
      status: 'Active',
      lastActivity: 'May 19, 2024 04:45 PM',
    },
    {
      name: 'Vikram Bhatia',
      company: 'NetCore Services',
      source: 'Email Campaign',
      owner: 'Ajay Kumar',
      stage: 'New Leads',
      daysInStage: 0,
      status: 'Active',
      lastActivity: 'May 19, 2024 02:10 PM',
    },
    {
      name: 'Deepak Sharma',
      company: 'SoftWings Tech',
      source: 'Facebook',
      owner: 'Rahul Verma',
      stage: 'Converted',
      daysInStage: 2,
      status: 'Converted',
      lastActivity: 'May 18, 2024 01:00 PM',
    },
    {
      name: 'Meera Reddy',
      company: 'Binary Brains',
      source: 'Referral',
      owner: 'Neha Singh',
      stage: 'Won',
      daysInStage: 5,
      status: 'Won',
      lastActivity: 'May 17, 2024 12:35 PM',
    },
    {
      name: 'Arjun Singh',
      company: 'CodeCraft Solutions',
      source: 'Website',
      owner: 'Ajay Kumar',
      stage: 'Proposal Sent',
      daysInStage: 3,
      status: 'Active',
      lastActivity: 'May 17, 2024 10:05 AM',
    },
  ];

  // Insert mock leads
  mockupLeads.forEach((lead, idx) => {
    records.push({
      ...lead,
      id: `lead-mock-${idx}`,
    });
  });

  // Generate 40 other leads to sum exactly to 48 entries
  const owners = ['Ajay Kumar', 'Neha Singh', 'Rahul Verma', 'Priya Sharma', 'Vikram Patel'];
  const companies = ['Innovations Hub', 'Prime Focus', 'Starlight Media', 'Nexus Corp', 'Stark Industries', 'Wayne Enterprises'];
  const sources = ['Website', 'LinkedIn', 'Referral', 'Email Campaign', 'Facebook'];
  const stages: LeadRecord['stage'][] = ['New Leads', 'Contacted', 'Qualified', 'Proposal Sent', 'Converted', 'Won'];

  for (let i = 8; i < 48; i++) {
    const stage = stages[i % stages.length];
    const status: LeadRecord['status'] = stage === 'Converted' ? 'Converted' : stage === 'Won' ? 'Won' : 'Active';
    
    // Create random details
    const company = companies[i % companies.length];
    const source = sources[i % sources.length];
    const owner = owners[i % owners.length];
    const days = i % 6;
    
    const activityDate = new Date();
    activityDate.setDate(activityDate.getDate() - (i % 5));
    activityDate.setHours(9 + (i % 8), 10 + (i % 45));
    
    const formattedDate = activityDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + activityDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    records.push({
      id: `lead-gen-${i}`,
      name: `Lead Applicant ${i}`,
      company,
      source,
      owner,
      stage,
      daysInStage: days,
      status,
      lastActivity: formattedDate,
    });
  }

  return records;
};

export const useLeadTrackingStore = create<LeadTrackingStore>((set) => ({
  leads: generateMockLeads(),
  searchQuery: '',
  selectedOwner: 'All',
  currentPage: 1,
  pageSize: 10,

  setSearchQuery: (query) => set({ searchQuery: query, currentPage: 1 }),
  setSelectedOwner: (owner) => set({ selectedOwner: owner, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),
}));
