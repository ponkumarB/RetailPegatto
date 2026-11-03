export interface ProblemRecord {
  id: string;
  title: string;
  status: 'New' | 'Open' | 'Workaround Found' | 'Resolved' | 'Closed';
  reportedBy: string;
  reportedOn: string;
  source: string;
  impact: 'Low' | 'Medium' | 'High';
  urgency: 'Low' | 'Medium' | 'High';
  priority: 'Low' | 'Medium' | 'High';
  category: string;
  subCategory?: string;
  affectedService: string;
  configurationItem?: string;
  description: string;
  symptoms?: string;
  businessImpact?: string;
  assignTo: string;
  assignmentGroup: string;
  vendor?: string;
  dueDate: string;
  watchers: string[];
  detectedBy: string;
  detectedOn: string;
  rootCause?: string;
  referenceIncident?: string;
  createdAt: string;
}
