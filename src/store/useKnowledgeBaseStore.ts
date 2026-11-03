import { create } from 'zustand';

export interface Article {
  id: string;
  title: string;
  category: string;
  tags: string[];
  status: 'Published' | 'Draft';
  visibility: 'Public' | 'Internal';
  lastUpdated: string;
  views: number;
  helpful: number;
  content: string;
}

interface KnowledgeBaseState {
  articles: Article[];
  addArticle: (article: Article) => void;
  updateArticle: (id: string, updatedArticle: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  incrementViews: (id: string) => void;
  incrementHelpful: (id: string) => void;
}

const INITIAL_ARTICLES: Article[] = [
  {
    id: 'KB-001',
    title: 'How to Create a Lead',
    category: 'Leads',
    tags: ['lead', 'create', 'basics'],
    status: 'Published',
    visibility: 'Public',
    lastUpdated: '19/05/2024',
    views: 652,
    helpful: 125,
    content: 'Creating a lead in CRMFarm IT is simple. Navigate to the Leads module under Marketing, click on "Create Lead" or "+ New Lead", fill in contact details (name, email, company) and save. You can also import leads via CSV.'
  },
  {
    id: 'KB-002',
    title: 'Creating a Call List from Leads',
    category: 'Call Management',
    tags: ['call list', 'leads', 'outbound'],
    status: 'Published',
    visibility: 'Public',
    lastUpdated: '18/05/2024',
    views: 548,
    helpful: 98,
    content: 'To create a call list, head to Marketing > Call Lists. Click "Create Call List", choose a campaign, and filter leads based on status or score. Add them to the list, assign an agent, and trigger the auto-dialer.'
  },
  {
    id: 'KB-003',
    title: "Managing Today's Call List",
    category: 'Call Management',
    tags: ['today', 'calls', 'daily'],
    status: 'Published',
    visibility: 'Public',
    lastUpdated: '17/05/2024',
    views: 432,
    helpful: 76,
    content: 'View your daily calls under Call Management > My Tasks. Log each call, set outcome status (No Answer, Follow-up, Interested), and schedule reminders directly from the call panel.'
  },
  {
    id: 'KB-004',
    title: 'Call Summary Overview',
    category: 'Call Management',
    tags: ['summary', 'report'],
    status: 'Published',
    visibility: 'Internal',
    lastUpdated: '16/05/2024',
    views: 378,
    helpful: 64,
    content: 'Managers can view call performance reports under Analytics > Call Performance. Access total calls, average duration, success rate, and agent-level call recordings.'
  },
  {
    id: 'KB-005',
    title: 'Call Assignment Process',
    category: 'Call Management',
    tags: ['assignment', 'users'],
    status: 'Published',
    visibility: 'Internal',
    lastUpdated: '15/05/2024',
    views: 410,
    helpful: 81,
    content: 'Assign calls automatically by setting distribution rules. Go to Settings > Call Setup to define round-robin, priority, or load-based routing parameters.'
  },
  {
    id: 'KB-006',
    title: 'Understanding Lead Statuses',
    category: 'Leads',
    tags: ['status', 'lead'],
    status: 'Published',
    visibility: 'Public',
    lastUpdated: '14/05/2024',
    views: 298,
    helpful: 55,
    content: 'Leads progress through standard milestones: New, Attempting Contact, Contacted, Qualified, and Unqualified. Status transitions trigger automated workflow emails.'
  },
  {
    id: 'KB-007',
    title: 'How to Add a New Customer',
    category: 'Customers',
    tags: ['customer', 'create'],
    status: 'Published',
    visibility: 'Public',
    lastUpdated: '13/05/2024',
    views: 320,
    helpful: 58,
    content: 'Convert a qualified deal into a Customer, or create a customer record manually under Customers > Add Customer. Enter billing and shipping addresses, set VAT credentials, and link contacts.'
  },
  {
    id: 'KB-008',
    title: 'Employee Performance Reports',
    category: 'Reports',
    tags: ['performance', 'reports'],
    status: 'Published',
    visibility: 'Internal',
    lastUpdated: '12/05/2024',
    views: 512,
    helpful: 93,
    content: 'Generate performance scorecards under Analytics > Sales Performance. Filter by team or individual to check metrics, target achievement ratio, and average deal closing speed.'
  },
  {
    id: 'KB-009',
    title: 'Troubleshooting Call Issues',
    category: 'Troubleshooting',
    tags: ['call', 'issues', 'fix'],
    status: 'Published',
    visibility: 'Public',
    lastUpdated: '11/05/2024',
    views: 266,
    helpful: 41,
    content: 'If calls fail to connect, check your VoIP settings. Navigate to Settings > Integration, reset the API credentials, clear browser cache, and verify your microphone permissions.'
  },
  {
    id: 'KB-010',
    title: 'User Roles and Permissions',
    category: 'Settings',
    tags: ['roles', 'permissions'],
    status: 'Published',
    visibility: 'Internal',
    lastUpdated: '10/05/2024',
    views: 389,
    helpful: 67,
    content: 'Manage user access control via Settings > Privileges. Define roles such as CEO, Sales Rep, Support Agent, and assign specific view, create, edit, or delete permissions.'
  }
];

export const useKnowledgeBaseStore = create<KnowledgeBaseState>((set) => ({
  articles: INITIAL_ARTICLES,
  addArticle: (article) => set((state) => ({ articles: [article, ...state.articles] })),
  updateArticle: (id, updatedArticle) => set((state) => ({
    articles: state.articles.map(a => a.id === id ? { ...a, ...updatedArticle } : a)
  })),
  deleteArticle: (id) => set((state) => ({
    articles: state.articles.filter(a => a.id !== id)
  })),
  incrementViews: (id) => set((state) => ({
    articles: state.articles.map(a => a.id === id ? { ...a, views: a.views + 1 } : a)
  })),
  incrementHelpful: (id) => set((state) => ({
    articles: state.articles.map(a => a.id === id ? { ...a, helpful: a.helpful + 1 } : a)
  }))
}));
