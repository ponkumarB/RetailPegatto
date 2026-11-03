import { create } from 'zustand';

export interface DocumentSection {
  id: string;
  sectionName: string;
  description: string;
  type: 'Standard' | 'Optional' | 'Required';
}

export interface Documentation {
  id: string;
  title: string;
  project: string;
  documentType: 'BRD' | 'FRD' | 'SRS';
  documentCode: string;
  version: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Active';
  preparedBy: string;
  preparedByRole: string;
  department?: string;
  reviewers?: string[];
  targetAudience?: string;
  confidentiality: 'Internal' | 'Public' | 'Confidential' | 'Restricted';
  effectiveDate?: string;
  description: string;
  
  // Document-specific details
  relatedBrd?: string;
  relatedFrd?: string;
  requirementPriority?: 'Low' | 'Medium' | 'High' | 'Critical';
  modulesFeatures?: string[];
  assumptionsConstraints?: string; // (Assumptions & Constraints for SRS, Assumptions for FRD)
  
  sections: DocumentSection[];
  lastSaved: string;
  createdAt: string;
}

interface DocumentStore {
  documents: Documentation[];
  addDocument: (doc: Documentation) => void;
  updateDocument: (id: string, updatedDoc: Partial<Documentation>) => void;
  deleteDocument: (id: string) => void;
}

export const defaultBrdSections: DocumentSection[] = [
  { id: 'sec-1', sectionName: 'Executive Summary', description: 'High-level overview of the project and objectives', type: 'Required' },
  { id: 'sec-2', sectionName: 'Business Overview', description: 'Background, vision, and business context', type: 'Required' },
  { id: 'sec-3', sectionName: 'Current State Analysis', description: 'Existing process, system, and pain points', type: 'Required' },
  { id: 'sec-4', sectionName: 'Business Requirements', description: 'Detailed functional and non-functional requirements', type: 'Required' },
  { id: 'sec-5', sectionName: 'Scope', description: 'In-scope and out-of-scope items', type: 'Optional' },
  { id: 'sec-6', sectionName: 'Assumptions & Constraints', description: 'Key assumptions and limitations', type: 'Optional' }
];

export const defaultFrdSections: DocumentSection[] = [
  { id: 'sec-1', sectionName: 'Introduction', description: 'Purpose, scope and references', type: 'Standard' },
  { id: 'sec-2', sectionName: 'Functional Requirements', description: 'Detailed functional requirements', type: 'Standard' },
  { id: 'sec-3', sectionName: 'Business Rules', description: 'Business rules and validations', type: 'Standard' },
  { id: 'sec-4', sectionName: 'Use Cases', description: 'Use case diagrams and descriptions', type: 'Optional' },
  { id: 'sec-5', sectionName: 'Acceptance Criteria', description: 'Acceptance criteria for requirements', type: 'Standard' }
];

export const defaultSrsSections: DocumentSection[] = [
  { id: 'sec-1', sectionName: 'Introduction', description: 'Purpose, scope and references', type: 'Standard' },
  { id: 'sec-2', sectionName: 'Overall Description', description: 'Product perspective and system overview', type: 'Standard' },
  { id: 'sec-3', sectionName: 'Specific Requirements', description: 'Functional and non-functional requirements', type: 'Standard' },
  { id: 'sec-4', sectionName: 'System Features', description: 'Detailed description of system features', type: 'Standard' },
  { id: 'sec-5', sectionName: 'External Interface Requirements', description: 'User interfaces, hardware, software and communication', type: 'Standard' },
  { id: 'sec-6', sectionName: 'Data Requirements', description: 'Data models, data dictionary and data flow', type: 'Optional' }
];

const initialDocuments: Documentation[] = [
  {
    id: 'DOC-BRD-001',
    title: 'CRM Customer Portal Redesign',
    project: 'CRM Implementation (PRJ-001)',
    documentType: 'BRD',
    documentCode: 'BRD-001',
    version: '1.0',
    status: 'Approved',
    preparedBy: 'Sadia Afrin',
    preparedByRole: 'Project Manager',
    department: 'Business Analysis',
    confidentiality: 'Internal',
    effectiveDate: '2026-05-15',
    description: 'Business requirements documentation outlining the main objectives, goals, and high-level requirements for the redesign of the CRM customer portal.',
    sections: defaultBrdSections,
    lastSaved: '2 days ago',
    createdAt: '2026-05-15'
  },
  {
    id: 'DOC-FRD-001',
    title: 'Customer Portal Lead Scoring Logic',
    project: 'CRM Implementation (PRJ-001)',
    documentType: 'FRD',
    documentCode: 'FRD-001',
    version: '1.0',
    status: 'Review',
    preparedBy: 'Sadia Afrin',
    preparedByRole: 'Business Analyst',
    department: 'Business Analysis',
    confidentiality: 'Internal',
    effectiveDate: '2026-06-01',
    description: 'Functional details and business rules governing the automated lead scoring algorithm inside the CRM portal.',
    relatedBrd: 'DOC-BRD-001',
    requirementPriority: 'High',
    modulesFeatures: ['Lead Management', 'Scoring Engine'],
    assumptionsConstraints: 'Assumes the integration with ERP customer metrics is functional.',
    sections: defaultFrdSections,
    lastSaved: 'Yesterday',
    createdAt: '2026-06-01'
  },
  {
    id: 'DOC-SRS-001',
    title: 'Lead Scoring Engine Specifications',
    project: 'CRM Implementation (PRJ-001)',
    documentType: 'SRS',
    documentCode: 'SRS-001',
    version: '1.0',
    status: 'Draft',
    preparedBy: 'Sadia Afrin',
    preparedByRole: 'Business Analyst',
    department: 'Engineering',
    confidentiality: 'Internal',
    description: 'Detailed software requirements specification for the technical implementation of the scoring engine database hooks, triggers, and APIs.',
    relatedBrd: 'DOC-BRD-001',
    relatedFrd: 'DOC-FRD-001',
    requirementPriority: 'Medium',
    modulesFeatures: ['Scoring Engine API', 'DB Triggers'],
    assumptionsConstraints: 'Must scale up to 100,000 real-time scoring updates per hour under peek loads.',
    sections: defaultSrsSections,
    lastSaved: 'Just now',
    createdAt: '2026-06-10'
  }
];

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: initialDocuments,
  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
  updateDocument: (id, updatedDoc) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updatedDoc } : doc
      )
    })),
  deleteDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id)
    }))
}));
