export interface TodaysCallRecord {
  id: string;
  leadName: string;
  company: string;
  phone: string;
  nextCallDateTime: string; // "24/05/2024 09:30 AM"
  dateStr: string; // "24/05/2024" for querying/filtering by day
  assignedTo: string;
  avatarUrl: string;
  status: 'Completed' | 'Pending' | 'Overdue';
}
