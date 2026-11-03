import { create } from 'zustand';
import { EstimationItem } from '@/types/estimation';

interface EstimationState {
  estimations: EstimationItem[];
  addEstimation: (item: EstimationItem) => void;
  updateEstimation: (id: string, updatedItem: Partial<EstimationItem>) => void;
  deleteEstimation: (id: string) => void;
}

const initialEstimations: EstimationItem[] = [
  {
    id: 'EST-2024-001',
    projectName: 'CRM Portal Implementation',
    projectType: 'Web Application',
    clientName: 'ABC Pvt. Ltd.',
    domain: 'CRM / Sales',
    organization: 'CRMFarm IT',
    developmentApproach: 'Agile / Scrum',
    projectManager: 'Aarav Rao',
    technologyStack: '.NET, React, SQL, Azure',
    estimationDate: '2024-05-21',
    version: 'v1.0',
    counts: {
      ei: { low: 2, medium: 5, high: 3 },
      eo: { low: 1, medium: 4, high: 2 },
      eq: { low: 3, medium: 6, high: 2 },
      ilf: { low: 1, medium: 5, high: 3 },
      eif: { low: 2, medium: 2, high: 1 }
    },
    ratings: {
      dataComm: 4,
      distProcessing: 3,
      performance: 4,
      heavilyUsedConfig: 3,
      transactionRate: 4,
      onlineDataEntry: 4,
      endUserEfficiency: 4,
      onlineUpdate: 3,
      complexProcessing: 5,
      reusability: 3,
      installationEase: 3,
      operationalEase: 4,
      multipleSites: 2,
      facilitateChange: 4
    },
    ufp: 263,
    tdi: 50,
    vaf: 1.15,
    afp: 302.45,
    roundedAFP: 309, // matches the rounded value displayed in the mockup
    productivityHours: 12,
    effortHours: 3708,
    costPerHour: 1200,
    contingencyPercent: 10,
    currency: 'INR (₹)',
    notes: 'Standard CRM portal implementation with customer accounts, sales tracking, and analytical reports.',
    teamSize: 5,
    workingDays: 22,
    durationMonths: 3.36,
    totalCost: 4894560
  }
];

export const useEstimationStore = create<EstimationState>((set) => ({
  estimations: initialEstimations,
  addEstimation: (item) => set((state) => ({
    estimations: [item, ...state.estimations]
  })),
  updateEstimation: (id, updatedItem) => set((state) => ({
    estimations: state.estimations.map((est) => 
      est.id === id ? { ...est, ...updatedItem } : est
    )
  })),
  deleteEstimation: (id) => set((state) => ({
    estimations: state.estimations.filter((est) => est.id !== id)
  }))
}));
