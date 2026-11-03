import { create } from 'zustand';
import { Lead } from '@/types/marketing';

interface LeadState {
  leads: Lead[];
  addLead: (lead: Lead) => void;
  deleteLead: (id: string) => void;
  updateLead: (id: string, updatedLead: Partial<Lead>) => void;
}

const initialLeads: Lead[] = [
  {
    id: 'LD-101',
    leadName: 'Aarav Rao',
    companyName: 'TechNova Pvt Ltd',
    leadType: 'Corporate',
    leadSource: 'Website',
    contactPerson: 'Aarav Rao',
    email: 'aarav.rao@technova.com',
    mobileNumber: '+91 98765 43210',
    addressLine1: 'Suite 201, Tech Park',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    status: 'New',
    score: 72,
    assignedTo: 'John Smith',
    createdAt: '2024-05-20',
    companySize: '51 - 200',
    preferredContactMethod: 'Email',
    bestTimeToContact: '10:00 AM - 12:00 PM',
    leadSourceDetails: 'Visited product page and requested a demo.',
    tags: ['Software', 'B2B', 'High Potential'],
    rating: 4,
    followUpDate: '2024-05-24',
    industry: 'Software',
    website: 'www.technova.com',
    designation: 'CTO',
    annualRevenue: 5000000,
    noOfEmployees: 120,
    activities: [
      { id: 'ACT-1', type: 'Phone Call', status: 'Completed', details: 'Discussed product features and pricing.', date: 'May 21, 2024 04:15 PM', user: 'John Smith' },
      { id: 'ACT-2', type: 'Email Sent', status: 'Completed', details: 'Sent product brochure and case studies.', date: 'May 21, 2024 12:20 PM', user: 'John Smith' },
      { id: 'ACT-3', type: 'Note Added', details: 'Interested in enterprise plan.', date: 'May 21, 2024 11:05 AM', user: 'John Smith' },
      { id: 'ACT-4', type: 'Lead Created', details: 'Lead was created.', date: 'May 20, 2024 10:30 AM', user: 'John Smith' },
      { id: 'ACT-5', type: 'Website Visit', details: 'Visited pricing page.', date: 'May 20, 2024 09:45 AM' }
    ],
    tasksList: [
      { id: 'TSK-1', title: 'Follow up call', dueDate: 'May 24, 2024', completed: false, owner: 'John Smith' },
      { id: 'TSK-2', title: 'Send proposal', dueDate: 'May 27, 2024', completed: false, owner: 'John Smith' },
      { id: 'TSK-3', title: 'Check requirements', dueDate: 'May 30, 2024', completed: false, owner: 'John Smith' }
    ],
    notesList: [
      { id: 'NTE-1', content: 'Client is evaluating our platform. Key decision maker is CTO.', date: 'May 21, 2024', user: 'John Smith' }
    ],
    documentsList: [
      { id: 'DOC-1', name: 'Company Profile.pdf', date: 'May 21, 2024', type: 'pdf' },
      { id: 'DOC-2', name: 'Product Brochure.pdf', date: 'May 21, 2024', type: 'pdf' }
    ]
  },
  {
    id: 'LD-102',
    leadName: 'Priya Shah',
    companyName: 'Innova Solutions',
    leadType: 'Corporate',
    leadSource: 'Referral',
    contactPerson: 'Priya Shah',
    email: 'priya.shah@innovas.com',
    mobileNumber: '+91 91234 56789',
    addressLine1: 'Building 4B, Mindspace',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    status: 'Contacted',
    score: 72,
    assignedTo: 'Sarah Davis',
    createdAt: '2024-05-20'
  },
  {
    id: 'LD-103',
    leadName: 'Rahul Kumar',
    companyName: 'Kumar Enterprises',
    leadType: 'Corporate',
    leadSource: 'LinkedIn',
    contactPerson: 'Rahul Kumar',
    email: 'rahul@kumarent.com',
    mobileNumber: '+91 99887 76655',
    addressLine1: 'Plot 12, Industrial Area',
    country: 'India',
    state: 'Delhi',
    city: 'New Delhi',
    status: 'Qualified',
    score: 94,
    assignedTo: 'Michael Brown',
    createdAt: '2024-05-19'
  },
  {
    id: 'LD-104',
    leadName: 'Neha Iyer',
    companyName: 'Exacta Technologies',
    leadType: 'Corporate',
    leadSource: 'Email Campaign',
    contactPerson: 'Neha Iyer',
    email: 'neha.iyer@exacta.com',
    mobileNumber: '+91 88990 12345',
    addressLine1: '3rd Floor, Sunrise Tower',
    country: 'India',
    state: 'Tamil Nadu',
    city: 'Chennai',
    status: 'Proposal Sent',
    score: 68,
    assignedTo: 'John Smith',
    createdAt: '2024-05-19'
  },
  {
    id: 'LD-105',
    leadName: 'Deepak Patel',
    companyName: 'Patel & Co.',
    leadType: 'Corporate',
    leadSource: 'Cold Call',
    contactPerson: 'Deepak Patel',
    email: 'deepak@patelandco.com',
    mobileNumber: '+91 93456 78901',
    addressLine1: 'Corner Plaza, MG Road',
    country: 'India',
    state: 'Gujarat',
    city: 'Ahmedabad',
    status: 'Negotiation',
    score: 78,
    assignedTo: 'Sarah Davis',
    createdAt: '2024-05-18'
  },
  {
    id: 'LD-106',
    leadName: 'Vikram Singh',
    companyName: 'Sigma Infotech',
    leadType: 'Corporate',
    leadSource: 'Website',
    contactPerson: 'Vikram Singh',
    email: 'vikram.singh@sigmait.com',
    mobileNumber: '+91 90123 45678',
    addressLine1: 'Infinity Benchmark, Sector V',
    country: 'India',
    state: 'West Bengal',
    city: 'Kolkata',
    status: 'Converted',
    score: 99,
    assignedTo: 'Michael Brown',
    createdAt: '2024-05-18'
  },
  {
    id: 'LD-107',
    leadName: 'Meera Joshi',
    companyName: 'Joshi Group',
    leadType: 'Corporate',
    leadSource: 'Referral',
    contactPerson: 'Meera Joshi',
    email: 'meera.joshi@joshigroup.com',
    mobileNumber: '+91 98701 23456',
    addressLine1: 'Royal Enclave, Jayanagar',
    country: 'India',
    state: 'Karnataka',
    city: 'Bengaluru',
    status: 'New',
    score: 81,
    assignedTo: 'John Smith',
    createdAt: '2024-05-17'
  },
  {
    id: 'LD-108',
    leadName: 'Amit Sinha',
    companyName: 'Amit Traders',
    leadType: 'Corporate',
    leadSource: 'LinkedIn',
    contactPerson: 'Amit Sinha',
    email: 'amit@amittraders.com',
    mobileNumber: '+91 93210 98765',
    addressLine1: 'Commercial Complex, Sector 15',
    country: 'India',
    state: 'Haryana',
    city: 'Gurugram',
    status: 'Contacted',
    score: 75,
    assignedTo: 'Sarah Davis',
    createdAt: '2024-05-17'
  },
  {
    id: 'LD-109',
    leadName: 'Karan Grover',
    companyName: 'Grover Industries',
    leadType: 'Corporate',
    leadSource: 'Cold Call',
    contactPerson: 'Karan Grover',
    email: 'karan@groverindustries.com',
    mobileNumber: '+91 98123 65432',
    addressLine1: 'Grover House, Linking Road',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    status: 'Disqualified',
    score: 45,
    assignedTo: 'Michael Brown',
    createdAt: '2024-05-16'
  },
  {
    id: 'LD-110',
    leadName: 'Pooja Wagh',
    companyName: 'Wagh Creations',
    leadType: 'Corporate',
    leadSource: 'Email Campaign',
    contactPerson: 'Pooja Wagh',
    email: 'pooja@waghcreations.com',
    mobileNumber: '+91 90987 65432',
    addressLine1: 'Creative Plaza, Senapati Bapat Road',
    country: 'India',
    state: 'Maharashtra',
    city: 'Pune',
    status: 'Nurturing',
    score: 62,
    assignedTo: 'John Smith',
    createdAt: '2024-05-16'
  }
];

export const useLeadStore = create<LeadState>((set) => ({
  leads: initialLeads,
  addLead: (lead) => set((state) => ({ leads: [lead, ...state.leads] })),
  deleteLead: (id) => set((state) => ({ leads: state.leads.filter((l) => l.id !== id) })),
  updateLead: (id, updatedLead) =>
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? { ...l, ...updatedLead } : l)),
    })),
}));
