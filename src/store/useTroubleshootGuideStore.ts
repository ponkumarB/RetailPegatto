import { create } from 'zustand';
import { TroubleshootGuideRecord } from '@/types/troubleshoot-guide';

interface TroubleshootGuideState {
  guides: TroubleshootGuideRecord[];
  addGuide: (guide: TroubleshootGuideRecord) => void;
  deleteGuide: (id: string) => void;
  updateGuide: (id: string, updatedGuide: Partial<TroubleshootGuideRecord>) => void;
}

const initialGuides: TroubleshootGuideRecord[] = [
  {
    id: 'TG-001',
    title: 'CRM Farm Login Timeout Resolution Guide',
    code: 'TG-2291',
    status: 'Active',
    issueProblemId: 'PRB-101',
    category: 'Application',
    appliesTo: 'Auth Service API',
    priority: 'High',
    createdBy: 'Raghav S.',
    reviewDate: '2025-12-31',
    description: 'Step-by-step instructions to increase the connection pool size and clear stagnant connection pools in case of server timeouts.',
    symptoms: '504 Gateway Timeout during authentication. App latency jumps to 15 seconds.',
    rootCause: 'Database connection pool exhaustion',
    prerequisites: 'Access to AWS ECS Console and PostgreSQL read-write access.',
    notes: 'Avoid scaling DB instance directly before trying to purge connection pools.',
    author: 'Raghav S.',
    version: '1.0',
    steps: [
      { id: '1', order: 1, instruction: 'Verify the issue and reproduce it by querying auth latency metrics.' },
      { id: '2', order: 2, instruction: 'Check the connection pooling configuration parameters in settings.' },
      { id: '3', order: 3, instruction: 'Perform basic troubleshooting by purging expired connections.' },
      { id: '4', order: 4, instruction: 'Apply the recommended fix / workaround: Scale pool size by 50%.' },
      { id: '5', order: 5, instruction: 'Verify the issue is resolved and logs reflect healthy pool levels.' }
    ],
    visibility: 'All Users',
    createdAt: '2025-06-26'
  }
];

export const useTroubleshootGuideStore = create<TroubleshootGuideState>((set) => ({
  guides: initialGuides,
  addGuide: (guide) => set((state) => ({ guides: [guide, ...state.guides] })),
  deleteGuide: (id) => set((state) => ({ guides: state.guides.filter((g) => g.id !== id) })),
  updateGuide: (id, updatedGuide) =>
    set((state) => ({
      guides: state.guides.map((g) => (g.id === id ? { ...g, ...updatedGuide } : g)),
    })),
}));
