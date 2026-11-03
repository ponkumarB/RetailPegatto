import { create } from 'zustand';

export interface TemplateItem {
  id: string;
  name: string;
  type: 'Form' | 'Report' | 'Document' | 'Email' | 'SMS' | 'Workflow';
  module: string;
  category: string;
  createdBy: string;
  updatedOn: string;
  status: 'Active' | 'Inactive';
  description?: string;
  tags?: string[];
  baseTemplate?: string;
  visibleTo?: string;
  isDefault?: boolean;
  includeSampleData?: boolean;
}

interface TemplateState {
  templates: TemplateItem[];
  addTemplate: (template: TemplateItem) => void;
  deleteTemplate: (id: string) => void;
  toggleTemplateStatus: (id: string) => void;
  updateTemplate: (id: string, updated: Partial<TemplateItem>) => void;
  setTemplates: (templates: TemplateItem[]) => void;
}

const INITIAL_TEMPLATES: TemplateItem[] = [
  {
    id: 'TPL-01',
    name: 'Farmer Registration Form',
    type: 'Form',
    module: 'Farmers',
    category: 'Registration',
    createdBy: 'Admin User',
    updatedOn: 'May 14, 2024 10:30 AM',
    status: 'Active',
    description: 'Standard registration form for new farmers in the CRM system.',
    tags: ['farmer', 'registration', 'onboarding'],
    visibleTo: 'All Users',
    isDefault: true,
    includeSampleData: true
  },
  {
    id: 'TPL-02',
    name: 'Field Inspection Form',
    type: 'Form',
    module: 'Fields',
    category: 'Inspection',
    createdBy: 'Admin User',
    updatedOn: 'May 13, 2024 04:15 PM',
    status: 'Active',
    description: 'Field checkup checklist for quality assurance operations.',
    tags: ['field', 'inspection', 'qa'],
    visibleTo: 'All Users',
    isDefault: false,
    includeSampleData: true
  },
  {
    id: 'TPL-03',
    name: 'Crop Production Report',
    type: 'Report',
    module: 'Crops',
    category: 'Analytics',
    createdBy: 'Admin User',
    updatedOn: 'May 12, 2024 11:05 AM',
    status: 'Active',
    description: 'Yield analysis and forecast metrics reports.',
    tags: ['crop', 'production', 'analytics'],
    visibleTo: 'Administrators Only',
    isDefault: true,
    includeSampleData: false
  },
  {
    id: 'TPL-04',
    name: 'Farmer Summary Report',
    type: 'Report',
    module: 'Farmers',
    category: 'Summary',
    createdBy: 'Admin User',
    updatedOn: 'May 10, 2024 09:40 AM',
    status: 'Active',
    description: 'Weekly summary of crop and activity details for registered farmers.',
    tags: ['farmer', 'summary', 'report'],
    visibleTo: 'All Users',
    isDefault: false,
    includeSampleData: true
  },
  {
    id: 'TPL-05',
    name: 'Farm Lease Agreement',
    type: 'Document',
    module: 'Farmers',
    category: 'Legal',
    createdBy: 'Admin User',
    updatedOn: 'May 09, 2024 03:20 PM',
    status: 'Active',
    description: 'Legal document template for farm land lease agreements.',
    tags: ['legal', 'agreement', 'lease'],
    visibleTo: 'Administrators Only',
    isDefault: false,
    includeSampleData: false
  },
  {
    id: 'TPL-06',
    name: 'NDA Template',
    type: 'Document',
    module: 'General',
    category: 'Legal',
    createdBy: 'Admin User',
    updatedOn: 'May 08, 2024 02:10 PM',
    status: 'Inactive',
    description: 'Non-disclosure agreement document template.',
    tags: ['legal', 'agreement', 'nda'],
    visibleTo: 'All Users',
    isDefault: false,
    includeSampleData: false
  },
  {
    id: 'TPL-07',
    name: 'Welcome Email Template',
    type: 'Email',
    module: 'Farmers',
    category: 'Communication',
    createdBy: 'Admin User',
    updatedOn: 'May 07, 2024 10:00 AM',
    status: 'Active',
    description: 'Onboarding welcome email sent automatically to new farmers.',
    tags: ['email', 'communication', 'onboarding'],
    visibleTo: 'All Users',
    isDefault: true,
    includeSampleData: true
  },
  {
    id: 'TPL-08',
    name: 'SMS Notification Template',
    type: 'SMS',
    module: 'Activities',
    category: 'Alerts',
    createdBy: 'Admin User',
    updatedOn: 'May 06, 2024 05:30 PM',
    status: 'Active',
    description: 'Alert message templates for scheduling weather or task updates.',
    tags: ['sms', 'alert', 'notification'],
    visibleTo: 'All Users',
    isDefault: false,
    includeSampleData: false
  },
  {
    id: 'TPL-09',
    name: 'Field Approval Workflow',
    type: 'Workflow',
    module: 'Fields',
    category: 'Approval',
    createdBy: 'Admin User',
    updatedOn: 'May 05, 2024 01:45 PM',
    status: 'Active',
    description: 'Approval route for field registration and quality tests.',
    tags: ['workflow', 'approval', 'field'],
    visibleTo: 'All Users',
    isDefault: true,
    includeSampleData: true
  },
  {
    id: 'TPL-10',
    name: 'Irrigation Request Workflow',
    type: 'Workflow',
    module: 'Irrigation',
    category: 'Approval',
    createdBy: 'Admin User',
    updatedOn: 'May 04, 2024 12:20 PM',
    status: 'Active',
    description: 'Irrigation booking approval and resource dispatch workflow route.',
    tags: ['workflow', 'approval', 'irrigation'],
    visibleTo: 'All Users',
    isDefault: false,
    includeSampleData: true
  }
];

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: INITIAL_TEMPLATES,
  addTemplate: (template) => set((state) => ({ templates: [template, ...state.templates] })),
  deleteTemplate: (id) => set((state) => ({ templates: state.templates.filter((t) => t.id !== id) })),
  toggleTemplateStatus: (id) => set((state) => ({
    templates: state.templates.map((t) => t.id === id ? { ...t, status: t.status === 'Active' ? 'Inactive' : 'Active' } : t)
  })),
  updateTemplate: (id, updated) => set((state) => ({
    templates: state.templates.map((t) => t.id === id ? { ...t, ...updated } : t)
  })),
  setTemplates: (templates) => set({ templates })
}));
