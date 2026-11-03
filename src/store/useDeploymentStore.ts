import { create } from 'zustand';
import { DeploymentRequest } from '@/types/deployment';

interface DeploymentState {
  requests: DeploymentRequest[];
  addRequest: (req: DeploymentRequest) => void;
  updateRequest: (id: string, updated: Partial<DeploymentRequest>) => void;
  deleteRequest: (id: string) => void;
}

const initialRequests: DeploymentRequest[] = [
  {
    id: 'APP-DEP-2024-0012',
    requestedBy: 'Priya Kapoor',
    requestedByRole: 'Business Analyst',
    department: 'Business Analysis',
    requestDate: '13 May 2024',
    requiredDate: '20 May 2024',
    deploymentType: 'Application Deployment',
    priority: 'Medium',
    environment: 'Production',
    changeType: 'Standard Change',
    reportingManager: 'Aaray Rao (Project Manager)',
    deploymentFor: 'Internal',
    purpose: 'Deployment of CRM Module v2.3 for enhanced reporting and performance improvements.',
    appName: 'CRM Module',
    appVersion: 'v2.3',
    appOwner: 'Neha Bansal',
    appType: 'Web Application',
    repository: 'GitLab - crmfarm/crm-module',
    artifact: 'crm-module-v2.3.zip',
    dbChanges: 'Yes',
    dbScriptsFilename: 'db-migration-v2.3.sql',
    targetEnv: 'Production',
    serverCluster: 'prod-web-01, prod-web-02',
    deploymentWindow: '18 May 2024 10:00 PM',
    estimatedDowntime: 30,
    rollbackPlan: 'Revert to previous version (v2.2) using backup artifacts and DB rollback scripts.',
    dependencies: 'CRM Core Service, Notification Service, Reporting DB',
    notes: 'Kindly review and approve the deployment request.',
    attachedDocsFilename: 'deployment-checklist-v2.pdf',
    status: 'Pending',
    notifyUpdates: true,
    approvals: [
      { step: 1, approver: 'Aaray Rao', role: 'Project Manager', avatar: 'AR', status: 'Pending' },
      { step: 2, approver: 'Rahul Mehta', role: 'IT Manager', avatar: 'RM', status: 'Pending' },
      { step: 3, approver: 'Neha Bansal', role: 'Application Owner', avatar: 'NB', status: 'Pending' },
      { step: 4, approver: 'Vikram Tiwari', role: 'Infrastructure Head', avatar: 'VK', status: 'Pending' }
    ]
  },
  {
    id: 'APP-DEP-2024-0011',
    requestedBy: 'Aarav Rao',
    requestedByRole: 'Project Manager',
    department: 'Delivery Management',
    requestDate: '08 May 2024',
    requiredDate: '12 May 2024',
    deploymentType: 'Service Patch',
    priority: 'High',
    environment: 'Staging',
    changeType: 'Emergency Change',
    reportingManager: 'Rahul Mehta (IT Manager)',
    deploymentFor: 'Internal',
    purpose: 'Critical hotfix for session timeout bugs in staging environments.',
    appName: 'HR System',
    appVersion: 'v1.4.2-hotfix',
    appOwner: 'Rahul Mehta',
    appType: 'Microservice',
    repository: 'GitHub - crmfarm/hr-auth-service',
    artifact: 'hr-auth-v1.4.2.tar.gz',
    dbChanges: 'No',
    targetEnv: 'Staging',
    serverCluster: 'stage-auth-cluster',
    deploymentWindow: '10 May 2024 08:00 PM',
    estimatedDowntime: 0,
    rollbackPlan: 'Re-deploy previous Docker tag v1.4.1.',
    dependencies: 'Redis Cache Server',
    notes: 'Urgent deployment needed to clear staging QA blocks.',
    status: 'Completed',
    notifyUpdates: false,
    approvals: [
      { step: 1, approver: 'Rahul Mehta', role: 'IT Manager', avatar: 'RM', status: 'Approved' },
      { step: 2, approver: 'Vikram Tiwari', role: 'Infrastructure Head', avatar: 'VK', status: 'Approved' }
    ]
  },
  {
    id: 'APP-DEP-2024-0010',
    requestedBy: 'Neha Bansal',
    requestedByRole: 'Application Owner',
    department: 'Engineering',
    requestDate: '05 May 2024',
    requiredDate: '10 May 2024',
    deploymentType: 'API Integration',
    priority: 'Low',
    environment: 'Production',
    changeType: 'Minor Change',
    reportingManager: 'Rahul Mehta (IT Manager)',
    deploymentFor: 'Third Party',
    purpose: 'Integrating Stripe checkout webhooks for corporate payment module billing.',
    appName: 'Billing Service',
    appVersion: 'v3.1.0',
    appOwner: 'Neha Bansal',
    appType: 'API Service',
    repository: 'GitLab - crmfarm/stripe-billing',
    artifact: 'stripe-billing-v3.1.0.jar',
    dbChanges: 'Yes',
    dbScriptsFilename: 'stripe_schema_update.sql',
    targetEnv: 'Production',
    serverCluster: 'prod-billing-01',
    deploymentWindow: '08 May 2024 11:30 PM',
    estimatedDowntime: 15,
    rollbackPlan: 'Rollback database changes and revert JAR running version.',
    dependencies: 'Stripe API Webhooks, DB Gateway',
    notes: 'Scheduled window aligned with low usage hours.',
    status: 'Approved',
    notifyUpdates: true,
    approvals: [
      { step: 1, approver: 'Rahul Mehta', role: 'IT Manager', avatar: 'RM', status: 'Approved' },
      { step: 2, approver: 'Neha Bansal', role: 'Application Owner', avatar: 'NB', status: 'Approved' },
      { step: 3, approver: 'Vikram Tiwari', role: 'Infrastructure Head', avatar: 'VK', status: 'Approved' }
    ]
  },
  {
    id: 'APP-DEP-2024-0009',
    requestedBy: 'Vikram Tiwari',
    requestedByRole: 'Infrastructure Head',
    department: 'DevOps & Cloud',
    requestDate: '01 May 2024',
    requiredDate: '03 May 2024',
    deploymentType: 'Infrastructure Upgrade',
    priority: 'High',
    environment: 'Production',
    changeType: 'Major Change',
    reportingManager: 'Rahul Mehta (IT Manager)',
    deploymentFor: 'Internal',
    purpose: 'Upgrade Node.js version and cluster base images to resolve open CVEs.',
    appName: 'Gateway API',
    appVersion: 'v2.0',
    appOwner: 'Vikram Tiwari',
    appType: 'Gateway',
    repository: 'GitHub - crmfarm/api-gateway',
    artifact: 'gateway-v2.0-pkg.bin',
    dbChanges: 'No',
    targetEnv: 'Production',
    serverCluster: 'prod-gateway-01 to prod-gateway-05',
    deploymentWindow: '02 May 2024 02:00 AM',
    estimatedDowntime: 60,
    rollbackPlan: 'Revert Load Balancer path routing to v1.9 target groups.',
    dependencies: 'All downstream API services',
    notes: 'Requires 60 minutes maintenance window.',
    status: 'Rejected',
    notifyUpdates: true,
    approvals: [
      { step: 1, approver: 'Rahul Mehta', role: 'IT Manager', avatar: 'RM', status: 'Rejected' }
    ]
  }
];

export const useDeploymentStore = create<DeploymentState>((set) => ({
  requests: initialRequests,
  addRequest: (req) => set((state) => ({ requests: [req, ...state.requests] })),
  deleteRequest: (id) => set((state) => ({ requests: state.requests.filter((r) => r.id !== id) })),
  updateRequest: (id, updated) =>
    set((state) => ({
      requests: state.requests.map((r) => (r.id === id ? { ...r, ...updated } : r)),
    })),
}));
