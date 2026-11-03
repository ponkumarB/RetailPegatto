export interface AddReduceUsersRecord {
  id: string;
  instanceName: string;
  instanceDomain: string;
  currentUsers: number;
  newUsers: number;
  changeAmount: number;
  planName: string;
  status: 'Completed' | 'Pending Approval' | 'Cancelled';
  pricePerUser: number;
  billingCycle: string;
  createdAt: string;
}
