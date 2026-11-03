export interface AssigneeUser {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface AssignmentCall {
  id: string; // e.g. "1", "2"
  leadName: string;
  company: string;
  phone: string;
  nextCallDateTime: string; // "25/05/2024 10:30 AM"
  status: 'Unassigned' | 'Assigned';
  assignedTo?: string; // Name of teammate
  avatarUrl?: string; // Teammate avatar
  isDueToday?: boolean;
  isOverdue?: boolean;
}
