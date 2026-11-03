export interface IncreaseWorkspaceRecord {
  id: string;
  instanceName: string;
  instanceDomain: string;
  databaseSchema: string;
  currentSizeGb: number;
  usedSizeGb: number;
  additionalSizeGb: number;
  newSizeGb: number;
  planName: string;
  databaseServer: string;
  status: 'Completed' | 'Pending Approval' | 'Cancelled';
  createdAt: string;
}
