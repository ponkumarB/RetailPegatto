import { create } from 'zustand';

export interface TestPlanSection {
  id: number;
  name: string;
  description: string;
  type: 'Standard' | 'Optional';
}

export interface TestPlan {
  id: string;
  project: string;
  documentType: string;
  title: string;
  documentCode: string;
  version: string;
  status: 'Draft' | 'Active' | 'Review' | 'Approved';
  preparedBy: string;
  department: string;
  reviewers: string;
  confidentiality: string;
  effectiveDate: string;
  targetRelease: string;
  purpose: string;
  testingTypes: string[];
  testingApproach: string;
  testLevels: string[];
  testEnvironments: string[];
  exitCriteria: string;
  risksAssumptions: string;
  sections: TestPlanSection[];
  isFavorite: boolean;
  lastSaved: string;
}

interface TestPlanState {
  testPlans: TestPlan[];
  addTestPlan: (testPlan: TestPlan) => void;
  deleteTestPlan: (id: string) => void;
  updateTestPlan: (id: string, updatedTestPlan: Partial<TestPlan>) => void;
  toggleFavorite: (id: string) => void;
}

const initialTestPlans: TestPlan[] = [
  {
    id: 'TP-001',
    project: 'CRM Implementation (PRJ-001)',
    documentType: 'Test Plan',
    title: 'CRM Test Plan for Sprint 4 & Core Modules Integration',
    documentCode: 'TP-001',
    version: '1.0',
    status: 'Approved',
    preparedBy: 'Sadia Afrin (QA Manager)',
    department: 'Quality Assurance',
    reviewers: 'Aarav Rao, Sneha Verma',
    confidentiality: 'Internal',
    effectiveDate: '2026-06-01',
    targetRelease: 'Milestone 2.0 (Core Releases)',
    purpose: 'Define the testing strategy, scope, resources and schedule for validation of the CRM Core platform.',
    testingTypes: ['Functional Testing', 'Non-Functional Testing', 'Regression Testing'],
    testingApproach: 'Manual Testing',
    testLevels: ['System Testing', 'Integration Testing'],
    testEnvironments: ['Staging', 'QA Sandbox'],
    exitCriteria: 'Zero critical or high bugs open. All core scripts run and passed.',
    risksAssumptions: 'Tight schedules, potential delays in API environments.',
    sections: [
      { id: 1, name: 'Introduction', description: 'Overview and context of the test plan.', type: 'Standard' },
      { id: 2, name: 'Test Objectives', description: 'What we intend to achieve through testing.', type: 'Standard' },
      { id: 3, name: 'Scope', description: 'In-scope and out-of-scope items.', type: 'Standard' },
      { id: 4, name: 'Test Strategy', description: 'Approach, types, tools and resources.', type: 'Standard' },
      { id: 5, name: 'Test Environment', description: 'Hardware, software and network details.', type: 'Standard' },
      { id: 6, name: 'Test Schedule', description: 'Testing schedule and milestones.', type: 'Optional' }
    ],
    isFavorite: true,
    lastSaved: '2 days ago'
  },
  {
    id: 'TP-002',
    project: 'ERP Portal Upgrade (PRJ-002)',
    documentType: 'Test Plan',
    title: 'ERP Integration and API Webhook Delivery Test Plan',
    documentCode: 'TP-002',
    version: '1.1',
    status: 'Approved',
    preparedBy: 'Aarav Rao (Lead QA)',
    department: 'Quality Assurance',
    reviewers: 'Vikram Joshi',
    confidentiality: 'Restricted',
    effectiveDate: '2026-05-15',
    targetRelease: 'ERP Release 4.0',
    purpose: 'Assure authentication token refresh and data syncing webhooks perform under load conditions.',
    testingTypes: ['Functional Testing', 'Regression Testing'],
    testingApproach: 'Automation Testing',
    testLevels: ['Integration Testing'],
    testEnvironments: ['Staging'],
    exitCriteria: '95% success rate in webhook retries, latency under 500ms.',
    risksAssumptions: 'External ERP servers might be offline during testing.',
    sections: [
      { id: 1, name: 'Objectives', description: 'Integration scope objectives.', type: 'Standard' },
      { id: 2, name: 'Schedules', description: 'Timelines for end-to-end automation checks.', type: 'Standard' }
    ],
    isFavorite: true,
    lastSaved: '1 week ago'
  },
  {
    id: 'TP-003',
    project: 'Mobile App Redesign (PRJ-003)',
    documentType: 'Test Plan',
    title: 'Mobile App Redesign UX and Offline Mode Validation Plan',
    documentCode: 'TP-003',
    version: '0.8',
    status: 'Review',
    preparedBy: 'Sadia Afrin (QA Manager)',
    department: 'Quality Assurance',
    reviewers: 'Priya Nair',
    confidentiality: 'Internal',
    effectiveDate: '2026-06-08',
    targetRelease: 'Beta Release v1',
    purpose: 'Validate mobile app layouts on iOS and Android viewports and local storage caching.',
    testingTypes: ['Functional Testing', 'Non-Functional Testing'],
    testingApproach: 'Manual Testing',
    testLevels: ['System Testing', 'Acceptance Testing'],
    testEnvironments: ['QA Sandbox', 'Development'],
    exitCriteria: 'Responsive checks pass on iPhone 13, 14, 15 and Pixel 7.',
    risksAssumptions: 'Simulator rendering may differ slightly from physical devices.',
    sections: [
      { id: 1, name: 'Scope', description: 'iOS and Android app viewports validation scope.', type: 'Standard' },
      { id: 2, name: 'Defect Logging', description: 'QA template for submitting visual bugs.', type: 'Standard' }
    ],
    isFavorite: false,
    lastSaved: '3 days ago'
  },
  {
    id: 'TP-004',
    project: 'CRM Implementation (PRJ-001)',
    documentType: 'Test Plan',
    title: 'Analytics Dashboard Widgets & Chart Calculations Test Plan',
    documentCode: 'TP-004',
    version: '1.0',
    status: 'Draft',
    preparedBy: 'Rani javaji (Inventory Manager)',
    department: 'Operations',
    reviewers: 'Select reviewers (optional)',
    confidentiality: 'Internal',
    effectiveDate: '2026-06-09',
    targetRelease: 'Milestone 2.1 (Analytics)',
    purpose: 'Ensure mathematical accuracy of lead score charts and sales conversions widgets.',
    testingTypes: ['Functional Testing', 'Non-Functional Testing'],
    testingApproach: 'Manual Testing',
    testLevels: ['System Testing'],
    testEnvironments: ['QA Sandbox'],
    exitCriteria: 'Calculations match Excel benchmarks down to 2 decimal places.',
    risksAssumptions: 'Underlying score database feeds must be static during test cycles.',
    sections: [
      { id: 1, name: 'Calculations Base', description: 'Formula sheets for verification.', type: 'Standard' }
    ],
    isFavorite: false,
    lastSaved: 'Just now'
  }
];

export const useTestPlanStore = create<TestPlanState>((set) => ({
  testPlans: initialTestPlans,
  addTestPlan: (testPlan) => set((state) => ({ testPlans: [testPlan, ...state.testPlans] })),
  deleteTestPlan: (id) => set((state) => ({ testPlans: state.testPlans.filter((tp) => tp.id !== id) })),
  updateTestPlan: (id, updatedTestPlan) =>
    set((state) => ({
      testPlans: state.testPlans.map((tp) => (tp.id === id ? { ...tp, ...updatedTestPlan } : tp)),
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      testPlans: state.testPlans.map((tp) =>
        tp.id === id ? { ...tp, isFavorite: !tp.isFavorite } : tp
      ),
    })),
}));
