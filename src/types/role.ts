export interface Role {
  id: string;
  name: string;
  type: 'System' | 'Custom';
  description: string;
  usersCount: number;
  status: 'Active' | 'Inactive';
  lastUpdated: string;
  permissions?: string[];
}
