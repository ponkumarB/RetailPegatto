import { create } from 'zustand';

export interface SLATarget {
  priority: 'High' | 'Medium' | 'Low';
  responseTime: number;
  responseUnit: 'Minutes' | 'Hours' | 'Days';
  resolutionTime: number;
  resolutionUnit: 'Minutes' | 'Hours' | 'Days';
}

export interface SLAConditions {
  customer: string;
  category: string;
  productService: string;
}

export interface SLA {
  name: string;
  code: string;
  type: string;
  priorityLevels: ('High' | 'Medium' | 'Low')[];
  appliesTo: string;
  status: 'Active' | 'Inactive';
  createdOn: string;
  description: string;
  businessHours: string;
  targets: SLATarget[];
  conditions: SLAConditions;
  createdBy: string;
}

export interface SLABreach {
  ticketId: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low';
  customer: string;
  breachedOn: string;
  breachType: 'Response Time' | 'Resolution Time';
  status: 'Open' | 'In Progress' | 'Resolved';
}

interface SLAState {
  slas: SLA[];
  breaches: SLABreach[];
  addSLA: (sla: SLA) => void;
  updateSLA: (code: string, updatedSLA: Partial<SLA>) => void;
  deleteSLA: (code: string) => void;
  toggleStatus: (code: string) => void;
}

const initialSLAs: SLA[] = [
  {
    name: 'Standard Support SLA',
    code: 'SLA-001',
    type: 'Time Based',
    priorityLevels: ['High', 'Medium', 'Low'],
    appliesTo: 'All Customers',
    status: 'Active',
    createdOn: 'May 15, 2024',
    description: 'Standard SLA for general support coverage with default response targets.',
    businessHours: 'Default Business Hours (24x7)',
    createdBy: 'Admin User',
    conditions: {
      customer: 'All Customers',
      category: 'All Categories',
      productService: 'All Products/Services'
    },
    targets: [
      { priority: 'High', responseTime: 2, responseUnit: 'Hours', resolutionTime: 8, resolutionUnit: 'Hours' },
      { priority: 'Medium', responseTime: 8, responseUnit: 'Hours', resolutionTime: 24, resolutionUnit: 'Hours' },
      { priority: 'Low', responseTime: 24, responseUnit: 'Hours', resolutionTime: 72, resolutionUnit: 'Hours' }
    ]
  },
  {
    name: 'Premium Support SLA',
    code: 'SLA-002',
    type: 'Time Based',
    priorityLevels: ['High', 'Medium', 'Low'],
    appliesTo: 'Premium Customers',
    status: 'Active',
    createdOn: 'May 20, 2024',
    description: 'SLA for premium customers to ensure fast response and resolution for all support tickets.',
    businessHours: 'Default Business Hours (24x7)',
    createdBy: 'Admin User',
    conditions: {
      customer: 'Premium Customers',
      category: 'All Categories',
      productService: 'All Products/Services'
    },
    targets: [
      { priority: 'High', responseTime: 1, responseUnit: 'Hours', resolutionTime: 4, resolutionUnit: 'Hours' },
      { priority: 'Medium', responseTime: 4, responseUnit: 'Hours', resolutionTime: 16, resolutionUnit: 'Hours' },
      { priority: 'Low', responseTime: 8, responseUnit: 'Hours', resolutionTime: 40, resolutionUnit: 'Hours' }
    ]
  },
  {
    name: 'Hardware Support SLA',
    code: 'SLA-003',
    type: 'Time Based',
    priorityLevels: ['High', 'Medium', 'Low'],
    appliesTo: 'All Customers',
    status: 'Active',
    createdOn: 'May 25, 2024',
    description: 'SLA specific to physical hardware troubleshooting and replacements.',
    businessHours: 'Default Business Hours (24x7)',
    createdBy: 'Admin User',
    conditions: {
      customer: 'All Customers',
      category: 'Hardware Issues',
      productService: 'All Products/Services'
    },
    targets: [
      { priority: 'High', responseTime: 4, responseUnit: 'Hours', resolutionTime: 12, resolutionUnit: 'Hours' },
      { priority: 'Medium', responseTime: 12, responseUnit: 'Hours', resolutionTime: 48, resolutionUnit: 'Hours' },
      { priority: 'Low', responseTime: 48, responseUnit: 'Hours', resolutionTime: 96, resolutionUnit: 'Hours' }
    ]
  },
  {
    name: 'Critical Issue SLA',
    code: 'SLA-004',
    type: 'Time Based',
    priorityLevels: ['High'],
    appliesTo: 'All Customers',
    status: 'Active',
    createdOn: 'Jun 01, 2024',
    description: 'Dedicated SLA covering Severity-1 systems down outages.',
    businessHours: 'Default Business Hours (24x7)',
    createdBy: 'Admin User',
    conditions: {
      customer: 'All Customers',
      category: 'All Categories',
      productService: 'All Products/Services'
    },
    targets: [
      { priority: 'High', responseTime: 15, responseUnit: 'Minutes', resolutionTime: 2, resolutionUnit: 'Hours' }
    ]
  },
  {
    name: 'Onsite Support SLA',
    code: 'SLA-005',
    type: 'Time Based',
    priorityLevels: ['High', 'Medium'],
    appliesTo: 'All Customers',
    status: 'Inactive',
    createdOn: 'Jun 05, 2024',
    description: 'Onsite dispatch support targets requiring technician physical presence.',
    businessHours: 'Custom Business Hours (9am-5pm)',
    createdBy: 'Admin User',
    conditions: {
      customer: 'All Customers',
      category: 'Onsite Visit',
      productService: 'All Products/Services'
    },
    targets: [
      { priority: 'High', responseTime: 8, responseUnit: 'Hours', resolutionTime: 24, resolutionUnit: 'Hours' },
      { priority: 'Medium', responseTime: 24, responseUnit: 'Hours', resolutionTime: 48, resolutionUnit: 'Hours' }
    ]
  },
  {
    name: 'Software Support SLA',
    code: 'SLA-006',
    type: 'Time Based',
    priorityLevels: ['High', 'Medium', 'Low'],
    appliesTo: 'All Customers',
    status: 'Active',
    createdOn: 'Jun 10, 2024',
    description: 'SLA for general application support, bugs and feature requests.',
    businessHours: 'Default Business Hours (24x7)',
    createdBy: 'Admin User',
    conditions: {
      customer: 'All Customers',
      category: 'Software Bug',
      productService: 'All Products/Services'
    },
    targets: [
      { priority: 'High', responseTime: 2, responseUnit: 'Hours', resolutionTime: 12, resolutionUnit: 'Hours' },
      { priority: 'Medium', responseTime: 6, responseUnit: 'Hours', resolutionTime: 36, resolutionUnit: 'Hours' },
      { priority: 'Low', responseTime: 24, responseUnit: 'Hours', resolutionTime: 72, resolutionUnit: 'Hours' }
    ]
  },
  {
    name: 'Vendor Support SLA',
    code: 'SLA-007',
    type: 'Time Based',
    priorityLevels: ['Medium', 'Low'],
    appliesTo: 'All Customers',
    status: 'Active',
    createdOn: 'Jun 12, 2024',
    description: 'SLA covering third-party API and partner integrations failures.',
    businessHours: 'Default Business Hours (24x7)',
    createdBy: 'Admin User',
    conditions: {
      customer: 'All Customers',
      category: 'Integration Issue',
      productService: 'All Products/Services'
    },
    targets: [
      { priority: 'Medium', responseTime: 12, responseUnit: 'Hours', resolutionTime: 48, resolutionUnit: 'Hours' },
      { priority: 'Low', responseTime: 48, responseUnit: 'Hours', resolutionTime: 120, resolutionUnit: 'Hours' }
    ]
  },
  {
    name: 'Gold Support SLA',
    code: 'SLA-008',
    type: 'Time Based',
    priorityLevels: ['High', 'Medium', 'Low'],
    appliesTo: 'Gold Customers',
    status: 'Active',
    createdOn: 'Jun 15, 2024',
    description: 'SLA tailored to Gold subscription level enterprise accounts.',
    businessHours: 'Default Business Hours (24x7)',
    createdBy: 'Admin User',
    conditions: {
      customer: 'Gold Customers',
      category: 'All Categories',
      productService: 'All Products/Services'
    },
    targets: [
      { priority: 'High', responseTime: 1, responseUnit: 'Hours', resolutionTime: 6, resolutionUnit: 'Hours' },
      { priority: 'Medium', responseTime: 5, responseUnit: 'Hours', resolutionTime: 20, resolutionUnit: 'Hours' },
      { priority: 'Low', responseTime: 12, responseUnit: 'Hours', resolutionTime: 48, resolutionUnit: 'Hours' }
    ]
  }
];

const initialBreaches: SLABreach[] = [
  {
    ticketId: 'TKT-10245',
    subject: 'Unable to access CRM',
    priority: 'High',
    customer: 'TechNova Solutions',
    breachedOn: 'May 28, 2024 10:15 AM',
    breachType: 'Resolution Time',
    status: 'Open'
  },
  {
    ticketId: 'TKT-10231',
    subject: 'Email not syncing',
    priority: 'Medium',
    customer: 'BrightWave Inc.',
    breachedOn: 'May 27, 2024 04:35 PM',
    breachType: 'Response Time',
    status: 'In Progress'
  }
];

export const useSLAStore = create<SLAState>((set) => ({
  slas: initialSLAs,
  breaches: initialBreaches,
  addSLA: (sla) => set((state) => ({ slas: [...state.slas, sla] })),
  updateSLA: (code, updatedSLA) => set((state) => ({
    slas: state.slas.map((s) => s.code === code ? { ...s, ...updatedSLA } : s)
  })),
  deleteSLA: (code) => set((state) => ({
    slas: state.slas.filter((s) => s.code !== code)
  })),
  toggleStatus: (code) => set((state) => ({
    slas: state.slas.map((s) => s.code === code ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s)
  }))
}));
