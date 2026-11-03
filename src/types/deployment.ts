export interface ApproverStep {
  step: number;
  approver: string;
  role: string;
  avatar: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface DeploymentRequest {
  id: string; // APP-DEP-2024-0012
  requestedBy: string;
  requestedByRole: string;
  department: string;
  requestDate: string;
  requiredDate: string;
  deploymentType: string;
  priority: 'High' | 'Medium' | 'Low';
  environment: 'Production' | 'Staging' | 'Development' | 'UAT';
  changeType: string;
  reportingManager: string;
  deploymentFor: 'Internal' | 'Third Party';
  purpose: string;
  appName: string;
  appVersion: string;
  appOwner: string;
  appType: string;
  repository: string;
  artifact: string;
  dbChanges: 'Yes' | 'No';
  dbScriptsFilename?: string;
  targetEnv: string;
  serverCluster: string;
  deploymentWindow: string;
  estimatedDowntime: number; // minutes
  rollbackPlan: string;
  dependencies: string;
  notes?: string;
  attachedDocsFilename?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed';
  approvals: ApproverStep[];
  notifyUpdates: boolean;
}
