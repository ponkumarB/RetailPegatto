import { create } from 'zustand';

export interface LLDReferenceDocument {
  Document_Name: string;
  Version: string;
}

export interface LLDKeyModule {
  Module_Name: string;
  Description: string;
}

export interface LLDTechnologyStack {
  Backend: string;
  Frontend: string;
  Database: string;
}

export interface LLDModuleDesignItem {
  Module: string;
  Design: string;
}

export interface LLDDatabaseDesignItem {
  Table_Name: string;
  Description: string;
}

export interface LLDAPIDesignItem {
  API_Name: string;
  Method: string;
  Endpoint: string;
}

export interface LLDClassDesignItem {
  Class_Name: string;
  Description: string;
}

export interface LLDUIDesignItem {
  Screen: string;
  Description: string;
}

export interface LLDSequenceDiagramItem {
  Process: string;
  Description: string;
}

export interface LLDSampleCodeItem {
  Language: string;
  Code: string;
}

export interface LLDReviewChecklistItem {
  Item: string;
  Status: boolean;
}

export interface LLDDocument {
  id: string;
  lldId?: string;
  Organization_Id?: number;
  projectId?: number | null;
  accountId?: number | null;
  projectName: string;
  projectCode: string;
  clientName: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  inScope: string[];
  outOfScope: string[];
  referenceDocuments: LLDReferenceDocument[];
  keyModules: LLDKeyModule[];
  technologyStack: LLDTechnologyStack;
  moduleDesign: LLDModuleDesignItem[];
  databaseDesign: LLDDatabaseDesignItem[];
  apiDesign: LLDAPIDesignItem[];
  classDesign: LLDClassDesignItem[];
  uiDesign: LLDUIDesignItem[];
  sequenceDiagrams: LLDSequenceDiagramItem[];
  sampleCode: LLDSampleCodeItem[];
  designConsiderations: string[];
  dependencies: string[];
  assumptions: string[];
  reviewChecklist: LLDReviewChecklistItem[];
  preparedBy?: string;
  documentDate?: string;
  overallLld: {
    Summary: string;
    Version: string;
  };
  documentVersion: string;
  status: string;
}

interface LLDDocumentStore {
  lldList: LLDDocument[];
  currentLld: LLDDocument | null;
  isGenerating: boolean;

  createLLD: () => void;
  selectLLD: (id: string) => void;
  deleteLLD: (id: string) => void;
  saveLLD: () => void;
  updateCurrentField: (field: string, value: any) => void;
  toggleCurrentScope: (scopeType: 'inScope' | 'outOfScope', item: string) => void;
  generateDocument: () => Promise<void>;
}

export const useLLDDocumentStore = create<LLDDocumentStore>((set) => ({
  lldList: [],
  currentLld: null,
  isGenerating: false,

  createLLD: () => set((state) => ({
    currentLld: {
      id: `lld-${Math.random().toString(36).substring(2, 9)}`,
      lldId: '',
      projectName: '',
      projectCode: '',
      clientName: '',
      projectManager: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
      inScope: [],
      outOfScope: [],
      projectId: null,
      accountId: null,
      referenceDocuments: [
        { Document_Name: 'HLD Document', Version: '1.0' }
      ],
      keyModules: [
        { Module_Name: 'Lead Management', Description: 'Manage customer leads' },
        { Module_Name: 'Deal Management', Description: 'Track sales opportunities' }
      ],
      technologyStack: {
        Backend: 'Django',
        Frontend: 'React',
        Database: 'PostgreSQL'
      },
      moduleDesign: [
        { Module: 'Lead Management', Design: 'CRUD Operations' }
      ],
      databaseDesign: [
        { Table_Name: 'Lead', Description: 'Stores lead information' }
      ],
      apiDesign: [
        { API_Name: 'Create Lead', Method: 'POST', Endpoint: '/api/leads/create/' }
      ],
      classDesign: [
        { Class_Name: 'LeadViewSet', Description: 'Lead Operations' }
      ],
      uiDesign: [
        { Screen: 'Lead Dashboard', Description: 'Lead listing and filtering' }
      ],
      sequenceDiagrams: [
        { Process: 'Lead Creation', Description: 'User creates a new lead' }
      ],
      sampleCode: [
        { Language: 'Python', Code: "Lead.objects.create(name='Test')" }
      ],
      designConsiderations: [
        'Scalability', 'Security', 'Performance'
      ],
      dependencies: [
        'Django 5.0', 'PostgreSQL 16'
      ],
      assumptions: [
        'Users are authenticated', 'Organization already exists'
      ],
      reviewChecklist: [
        { Item: 'API Reviewed', Status: true },
        { Item: 'Database Reviewed', Status: true }
      ],
      overallLld: {
        Summary: 'Complete Low Level Design for CRM Project',
        Version: '1.0'
      },
      documentVersion: '1.0',
      status: 'Draft'
    }
  })),

  selectLLD: (id) => set((state) => {
    const lld = state.lldList.find(l => l.id === id);
    return {
      currentLld: lld ? JSON.parse(JSON.stringify(lld)) : null
    };
  }),

  deleteLLD: (id) => set((state) => ({
    lldList: state.lldList.filter(l => l.id !== id),
    currentLld: state.currentLld?.id === id ? null : state.currentLld
  })),

  saveLLD: () => set((state) => {
    if (!state.currentLld) return {};
    const exists = state.lldList.some(l => l.id === state.currentLld!.id);
    const updatedList = exists
      ? state.lldList.map(l => l.id === state.currentLld!.id ? state.currentLld! : l)
      : [...state.lldList, state.currentLld!];
    return {
      lldList: updatedList,
      currentLld: null
    };
  }),

  updateCurrentField: (field, value) => set((state) => {
    if (!state.currentLld) return {};
    const updated = { ...state.currentLld };
    (updated as any)[field] = value;
    return { currentLld: updated };
  }),

  toggleCurrentScope: (scopeType, item) => set((state) => {
    if (!state.currentLld) return {};
    const updated = { ...state.currentLld };
    const list = updated[scopeType] || [];
    updated[scopeType] = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list, item];
    return { currentLld: updated };
  }),

  generateDocument: async () => {
    set({ isGenerating: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    set({ isGenerating: false });
  },
}));
