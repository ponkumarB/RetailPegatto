import { create } from 'zustand';

export interface HLDDocument {
  id: string;
  projectName: string;
  projectCode: string;
  clientName: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  inScope: string[];
  outOfScope: string[];
  projectId?: number | null;
  accountId?: number | null;
  systemContext?: string;
  keyDesignGoals?: string[];
  assumptions?: string[];
  logicalArchitecture?: Array<{ Layer: string; Technology: string }>;
  moduleStructure?: Array<{ Module: string; Description: string }>;
  dataFlowDiagram?: Array<{ Source: string; Description: string; Destination: string }>;
  technologyStack?: Array<Record<string, string>>;
  nonFunctionalRequirements?: Array<Record<string, string>>;
  architecturePrinciples?: string[];
  reviewChecklist?: string[];
  overallHld?: { Summary: string; Version: string };
  documentVersion?: string;
  status?: string;
  hldId?: string;
}

interface HLDDocumentStore {
  hldList: HLDDocument[];
  currentHld: HLDDocument | null;
  isGenerating: boolean;

  createHLD: () => void;
  selectHLD: (id: string) => void;
  deleteHLD: (id: string) => void;
  saveHLD: () => void;
  updateCurrentField: (field: string, value: any) => void;
  toggleCurrentScope: (scopeType: 'inScope' | 'outOfScope', item: string) => void;
  generateDocument: () => Promise<void>;
}

export const useHLDDocumentStore = create<HLDDocumentStore>((set) => ({
  hldList: [],
  currentHld: null,
  isGenerating: false,

  createHLD: () => set((state) => ({
    currentHld: {
      id: `hld-${Math.random().toString(36).substring(2, 9)}`,
      hldId: '',
      projectName: '',
      projectCode: '',
      clientName: '',
      projectManager: '',
      startDate: '',
      endDate: '',
      inScope: [],
      outOfScope: [],
      projectId: null,
      accountId: null,
      systemContext: 'CRM system for managing leads, deals, projects and customer interactions.',
      keyDesignGoals: [
        'Scalability',
        'Security',
        'High Availability'
      ],
      assumptions: [
        'Users will access system via modern web browsers.',
        'Internet connectivity is stable.',
        'AWS cloud infrastructure is used.'
      ],
      logicalArchitecture: [
        { Layer: 'Frontend', Technology: 'React.js, HTML5, CSS3, JavaScript' },
        { Layer: 'Backend', Technology: '.NET Core 8.0 Web API' },
        { Layer: 'Database', Technology: 'PostgreSQL (RDS)' }
      ],
      moduleStructure: [],
      dataFlowDiagram: [
        { Source: 'User', Destination: 'API', Description: 'Submit lead details' }
      ],
      technologyStack: [
        { Frontend: 'React.js, HTML5, CSS3, JavaScript' },
        { Backend: '.NET Core 8.0 Web API' },
        { Database: 'PostgreSQL (RDS)' },
        { Cache: 'Redis (ElastiCache)' },
        { Cloud: 'AWS (EC2, RDS, S3, IAM)' }
      ] as Record<string, string>[],
      nonFunctionalRequirements: [
        { Performance: 'Response time below 2 seconds' },
        { Security: 'Role-Based encryption' }
      ] as Record<string, string>[],
      architecturePrinciples: [
        'Microservice Ready',
        'REST API First',
        'Loose Coupling'
      ],
      reviewChecklist: [
        'Architecture Reviewed',
        'Security Reviewed',
        'Performance Reviewed'
      ],
      overallHld: {
        Summary: 'CRM Farm High Level Design Document',
        Version: '1.0'
      },
      documentVersion: '1.0',
      status: 'Draft'
    }
  })),

  selectHLD: (id) => set((state) => {
    const hld = state.hldList.find(h => h.id === id);
    return {
      currentHld: hld ? JSON.parse(JSON.stringify(hld)) : null
    };
  }),

  deleteHLD: (id) => set((state) => ({
    hldList: state.hldList.filter(h => h.id !== id),
    currentHld: state.currentHld?.id === id ? null : state.currentHld
  })),

  saveHLD: () => set((state) => {
    if (!state.currentHld) return {};
    const exists = state.hldList.some(h => h.id === state.currentHld!.id);
    const updatedList = exists
      ? state.hldList.map(h => h.id === state.currentHld!.id ? state.currentHld! : h)
      : [...state.hldList, state.currentHld!];
    return {
      hldList: updatedList,
      currentHld: null
    };
  }),

  updateCurrentField: (field, value) => set((state) => {
    if (!state.currentHld) return {};
    const updated = { ...state.currentHld };
    (updated as any)[field] = value;
    return { currentHld: updated };
  }),

  toggleCurrentScope: (scopeType, item) => set((state) => {
    if (!state.currentHld) return {};
    const updated = { ...state.currentHld };
    const list = updated[scopeType] || [];
    updated[scopeType] = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    return { currentHld: updated };
  }),

  generateDocument: async () => {
    set({ isGenerating: true });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    set({ isGenerating: false });
  },
}));
