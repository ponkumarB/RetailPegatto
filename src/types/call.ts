export interface AssignedToBreakdown {
  name: string;
  count: number;
  percentage: number;
}

export interface ScheduledCall {
  id: string;
  leadName: string;
  company: string;
  phone: string;
  email: string;
  nextCallDateTime: string; // "DD/MM/YYYY HH:MM AM/PM"
  assignedTo: string;
  avatarUrl?: string;
  status: 'Scheduled' | 'Pending' | 'Completed' | 'Overdue';
}

export interface CallList {
  id: string;
  callListId: string; // e.g. "CL-2024-0007"
  name: string;
  date: string; // "DD/MM/YYYY"
  totalCalls: number;
  completed: number;
  pending: number;
  overdue: number;
  followUps: number;
  completionRate: number; // e.g. 25
  createdBy: string;
  createdOn: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedToBreakdown: AssignedToBreakdown[];
  scheduledCalls: ScheduledCall[];
}

export interface CallInsight {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
}
