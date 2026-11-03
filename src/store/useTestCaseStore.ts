import { create } from 'zustand';

export interface TestStep {
  id: number;
  description: string;
  testData: string;
  expectedResult: string;
}

export interface TestCase {
  id: string | number;
  dbId?: string | number;
  testCaseId?: string;
  title: string;
  project: string;
  projectName?: string;
  testPlan: string;
  testPlanName?: string;
  module: string;
  requirement: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  testType: string;
  testLevel: string;
  precondition: string;
  testData: string;
  environment: string;
  objective: string;
  steps: TestStep[];
  expectedResultSummary: string;
  attachmentsCount: number;
  attachments?: any[];
  status: 'Draft' | 'Active' | 'Review' | 'Approved';
  createdBy: string | number;
  updatedBy?: string | number;
  lastSaved: string;
  isFavorite: boolean;
}

interface TestCaseState {
  testCases: TestCase[];
  addTestCase: (testCase: TestCase) => void;
  deleteTestCase: (id: string | number) => void;
  updateTestCase: (id: string | number, updatedTestCase: Partial<TestCase>) => void;
  toggleFavorite: (id: string | number) => void;
}

const initialTestCases: TestCase[] = [
  {
    id: 1,
    title: 'Validate user password reset flow via email token validation',
    project: 'CRM Implementation (PRJ-001)',
    testPlan: 'TP-001: CRM Test Plan',
    module: 'Auth / Session',
    requirement: 'REQ-101: User Authentication',
    priority: 'Critical',
    testType: 'Functional',
    testLevel: 'System Testing',
    precondition: 'User exists in DB with active status and valid email address.',
    testData: 'Email: testuser@example.com',
    environment: 'Staging',
    objective: 'Ensure the reset token is received, expires in 2 hours, and allows new password setup.',
    steps: [
      { id: 1, description: 'Request password reset with valid email', testData: 'testuser@example.com', expectedResult: 'Reset link sent notification displays.' },
      { id: 2, description: 'Verify reset token received in email inbox', testData: 'Access Email Server', expectedResult: 'HTML email with valid secure token link is received.' },
      { id: 3, description: 'Submit new password with less than 8 characters', testData: 'Pass: abc', expectedResult: 'Form rejects submission, validation error displayed.' },
      { id: 4, description: 'Submit valid new password credentials', testData: 'Pass: SecurePassword123!', expectedResult: 'Password updated confirmation, redirects to Login page.' }
    ],
    expectedResultSummary: 'User is successfully redirected and can login with the new credentials.',
    attachmentsCount: 2,
    status: 'Approved',
    createdBy: 'Sadia Afrin',
    lastSaved: '2 days ago',
    isFavorite: true
  },
  {
    id: 2,
    title: 'CRM Lead Score calculator validation with multi-criteria conditions',
    project: 'CRM Implementation (PRJ-001)',
    testPlan: 'TP-001: CRM Test Plan',
    module: 'Lead Tracking',
    requirement: 'REQ-102: Lead Score Algorithm',
    priority: 'High',
    testType: 'Functional',
    testLevel: 'Integration Testing',
    precondition: 'CRM Lead Score logic is configured in settings.',
    testData: 'Annual revenue, email opens, job title',
    environment: 'QA Sandbox',
    objective: 'Confirm score increases for executive job title and positive email activity.',
    steps: [
      { id: 1, description: 'Create lead with "VP Marketing" job title', testData: 'Job: VP Marketing, Revenue: $500k', expectedResult: 'Lead initialized with score 50.' },
      { id: 2, description: 'Trigger 3 email opens on sent campaign', testData: 'Campaign Email Opens', expectedResult: 'Lead score increases to 80.' }
    ],
    expectedResultSummary: 'Lead score accurately reflects criteria values.',
    attachmentsCount: 1,
    status: 'Active',
    createdBy: 'Rani javaji',
    lastSaved: 'Today',
    isFavorite: false
  },
  {
    id: 3,
    title: 'Responsive dashboard columns arrangement on mobile viewport sizing',
    project: 'CRM Implementation (PRJ-001)',
    testPlan: 'TP-001: CRM Test Plan',
    module: 'Dashboard Analytics',
    requirement: 'REQ-103: Responsive Layout',
    priority: 'Medium',
    testType: 'Non-Functional',
    testLevel: 'System Testing',
    precondition: 'Dashboard page loaded with full charts widgets.',
    testData: 'Viewport: 375px width',
    environment: 'Development',
    objective: 'Verify columns wrap into single column view on small screens.',
    steps: [
      { id: 1, description: 'Resize viewport to width 375px', testData: 'Viewport: 375px x 812px', expectedResult: 'Layout changes to single vertical column list.' },
      { id: 2, description: 'Verify chart widths match mobile screen boundaries', testData: 'Width checks', expectedResult: 'Charts scale dynamically without horizontal scrolling.' }
    ],
    expectedResultSummary: 'Dashboard is readable and layout is responsive.',
    attachmentsCount: 0,
    status: 'Draft',
    createdBy: 'Sadia Afrin',
    lastSaved: 'Just now',
    isFavorite: false
  },
  {
    id: 4,
    title: 'ERP Integration token refresh and webhook delivery reliability',
    project: 'ERP Portal Upgrade (PRJ-002)',
    testPlan: 'TP-002: ERP Integration Plan',
    module: 'Select Module',
    requirement: 'Select Requirement',
    priority: 'Critical',
    testType: 'Regression',
    testLevel: 'Integration Testing',
    precondition: 'ERP access token expires in 15 minutes.',
    testData: 'API Request / Webhook trigger',
    environment: 'Staging',
    objective: 'Verify seamless auth refresh when token expires during call.',
    steps: [
      { id: 1, description: 'Simulate API request with expired token', testData: 'Expired Token header', expectedResult: 'Client library intercepts, requests token refresh.' },
      { id: 2, description: 'Retry initial API request with refreshed token', testData: 'API Retries', expectedResult: 'Request completes successfully with HTTP 200.' }
    ],
    expectedResultSummary: 'Automatic token refresh happens transparently.',
    attachmentsCount: 3,
    status: 'Approved',
    createdBy: 'Aarav Rao',
    lastSaved: '1 week ago',
    isFavorite: true
  },
  {
    id: 5,
    title: 'Mobile dashboard offline mode caching verification',
    project: 'Mobile App Redesign (PRJ-003)',
    testPlan: 'TP-003: Mobile Security Checklist',
    module: 'Settings Menu',
    requirement: 'Select Requirement',
    priority: 'Low',
    testType: 'Performance',
    testLevel: 'Acceptance Testing',
    precondition: 'App is running in offline state (airplane mode).',
    testData: 'Network disconnect',
    environment: 'QA Sandbox',
    objective: 'Check if index DB serves local cached items when offline.',
    steps: [
      { id: 1, description: 'Switch device to airplane mode', testData: 'Airplane Mode On', expectedResult: 'Application displays offline notice.' },
      { id: 2, description: 'Navigate to Contacts tab offline', testData: 'Offline Navigation', expectedResult: 'Loads cached contacts list immediately.' }
    ],
    expectedResultSummary: 'User can browse cached data smoothly while offline.',
    attachmentsCount: 0,
    status: 'Review',
    createdBy: 'Vikram Joshi',
    lastSaved: '3 days ago',
    isFavorite: false
  }
];

export const useTestCaseStore = create<TestCaseState>((set) => ({
  testCases: initialTestCases,
  addTestCase: (testCase) => set((state) => ({ testCases: [testCase, ...state.testCases] })),
  deleteTestCase: (id) => set((state) => ({ testCases: state.testCases.filter((tc) => tc.id !== id) })),
  updateTestCase: (id, updatedTestCase) =>
    set((state) => ({
      testCases: state.testCases.map((tc) => (tc.id === id ? { ...tc, ...updatedTestCase } : tc)),
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      testCases: state.testCases.map((tc) =>
        tc.id === id ? { ...tc, isFavorite: !tc.isFavorite } : tc
      ),
    })),
}));
