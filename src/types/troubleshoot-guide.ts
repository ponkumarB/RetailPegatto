export interface TroubleshootStep {
  id: string;
  order: number;
  instruction: string;
}

export interface TroubleshootGuideRecord {
  id: string;
  title: string;
  code: string;
  status: 'Active' | 'Inactive';
  issueProblemId: string;
  category: string;
  appliesTo: string;
  priority: 'Low' | 'Medium' | 'High';
  createdBy: string;
  reviewDate?: string;
  description: string;
  symptoms?: string;
  rootCause?: string;
  prerequisites?: string;
  notes?: string;
  author: string;
  reviewedBy?: string;
  approvedBy?: string;
  version: string;
  steps: TroubleshootStep[];
  visibility: 'All Users' | 'Internal IT' | 'Restricted';
  createdAt: string;
}
