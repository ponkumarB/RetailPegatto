import { create } from 'zustand';

export interface SADocument {
  id: string;
  title: string;
  project: string;
  documentCode: string;
  version: string;
  status: 'Draft' | 'Review' | 'Approved' | 'Active';
  preparedBy: string;
  lastSaved: string;
  createdAt: string;
  cloudPlatform: string;
  techStack: string;
  businessContext: string;
}

interface SADStore {
  sadDocuments: SADocument[];
  addSADocument: (doc: SADocument) => void;
  updateSADocument: (id: string, updatedDoc: Partial<SADocument>) => void;
  deleteSADocument: (id: string) => void;
}

const initialSADocuments: SADocument[] = [
  {
    id: 'SAD-001',
    title: 'CRM Implementation Solution Architecture',
    project: 'CRM Implementation',
    documentCode: 'CRM-2024-05_SAD',
    version: '1.0',
    status: 'Approved',
    preparedBy: 'Ravi Sharma',
    lastSaved: '2 days ago',
    createdAt: '2026-05-26',
    cloudPlatform: 'AWS',
    techStack: 'React.js, .NET Core, PostgreSQL, S3',
    businessContext: 'Centralized CRM solution to streamline sales, improve customer engagement, and automate key business processes.'
  },
  {
    id: 'SAD-002',
    title: 'ERP Upgrade Solution Architecture',
    project: 'ERP Upgrade',
    documentCode: 'ERP-2024-09_SAD',
    version: '1.0',
    status: 'Review',
    preparedBy: 'Vikram Joshi',
    lastSaved: 'Yesterday',
    createdAt: '2026-06-01',
    cloudPlatform: 'Azure',
    techStack: 'Angular, Node.js (NestJS), Azure SQL, Azure Blob',
    businessContext: 'Upgrade wholesale inventory ordering APIs and supplier portal interfaces.'
  }
];

export const useSADStore = create<SADStore>((set) => ({
  sadDocuments: initialSADocuments,
  addSADocument: (doc) => set((state) => ({ sadDocuments: [doc, ...state.sadDocuments] })),
  updateSADocument: (id, updatedDoc) => set((state) => ({
    sadDocuments: state.sadDocuments.map((doc) => doc.id === id ? { ...doc, ...updatedDoc } : doc)
  })),
  deleteSADocument: (id) => set((state) => ({
    sadDocuments: state.sadDocuments.filter((doc) => doc.id !== id)
  }))
}));
