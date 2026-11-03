import { create } from 'zustand';
import { ProblemRecord } from '@/types/problem';

interface ProblemState {
  problems: ProblemRecord[];
  addProblem: (problem: ProblemRecord) => void;
  deleteProblem: (id: string) => void;
  updateProblem: (id: string, updatedProblem: Partial<ProblemRecord>) => void;
}

const initialProblems: ProblemRecord[] = [
  {
    id: 'PRB-101',
    title: 'CRM Farm Application login timeout on peak hours',
    status: 'New',
    reportedBy: 'Sneha R.',
    reportedOn: '2025-06-26 10:45 AM',
    source: 'Incident',
    impact: 'Medium',
    urgency: 'High',
    priority: 'High',
    category: 'Application',
    subCategory: 'Login Issue',
    affectedService: 'CRM Farm Application',
    configurationItem: 'Auth Service API',
    description: 'Users are experiencing login timeouts during morning peak traffic (9:00 AM - 10:30 AM). The auth container logs show connection pooling limit exceeded.',
    symptoms: '504 Gateway Timeout during authentication. App latency jumps to 15 seconds.',
    businessImpact: 'Sales agents cannot access their accounts, causing delays in customer call logs.',
    assignTo: 'Arjun K.',
    assignmentGroup: 'Level 2 Support',
    vendor: 'AWS Inc.',
    dueDate: '2025-07-03',
    watchers: ['Vikram P.', 'Harish N.'],
    detectedBy: 'Monitoring System',
    detectedOn: '2025-06-26 10:30 AM',
    rootCause: 'Database connection pool exhaustion',
    referenceIncident: 'INC-2291',
    createdAt: '2025-06-26'
  },
  {
    id: 'PRB-102',
    title: 'Stripe payment webhook signature mismatch',
    status: 'Workaround Found',
    reportedBy: 'Sandeep Verma',
    reportedOn: '2026-06-20 02:15 PM',
    source: 'Monitoring System',
    impact: 'High',
    urgency: 'High',
    priority: 'High',
    category: 'Billing',
    subCategory: 'Payment Process',
    affectedService: 'Stripe Payment Gateway',
    configurationItem: 'Stripe Webhook Listener',
    description: 'Stripe payment notifications fail signature validation. Workaround: Validate payload parameters manually until new secret is rotated.',
    symptoms: 'Failed payment status updates on subscription renewals.',
    businessImpact: 'Accounts are marked delinquent incorrectly if renewal payment succeeds but is not processed.',
    assignTo: 'Raghav S.',
    assignmentGroup: 'Platform Engineering',
    vendor: 'Stripe',
    dueDate: '2026-06-30',
    watchers: ['Sandeep Verma'],
    detectedBy: 'Logging Alert',
    detectedOn: '2026-06-20 02:00 PM',
    rootCause: 'Expired Stripe Webhook Signing Secret key',
    referenceIncident: 'INC-8831',
    createdAt: '2026-06-20'
  }
];

export const useProblemStore = create<ProblemState>((set) => ({
  problems: initialProblems,
  addProblem: (problem) => set((state) => ({ problems: [problem, ...state.problems] })),
  deleteProblem: (id) => set((state) => ({ problems: state.problems.filter((p) => p.id !== id) })),
  updateProblem: (id, updatedProblem) =>
    set((state) => ({
      problems: state.problems.map((p) => (p.id === id ? { ...p, ...updatedProblem } : p)),
    })),
}));
