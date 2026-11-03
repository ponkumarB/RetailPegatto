export interface ProblemCategoryRecord {
  id: string;
  name: string;
  code: string;
  parentCategory?: string;
  status: 'Active' | 'Inactive';
  description: string;
  displayOrder?: number;
  associatedService?: string;
  defaultPriority: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  affectsBusinessProcess?: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
}
