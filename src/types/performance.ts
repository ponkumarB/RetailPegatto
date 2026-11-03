export interface EmployeePerformanceRecord {
  id: string;
  name: string;
  avatarUrl: string;
  totalCalls: number;
  completedCalls: number;
  pendingCalls: number;
  overdueCalls: number;
  completionRate: number; // e.g. 63.16
  avgCallDuration: string; // e.g. "00:06:24"
  performanceRating: 'Excellent' | 'Good' | 'Average' | 'Below Avg';
}

export interface WeekWiseStats {
  week: string; // e.g. "W-15"
  label: string; // e.g. "08 Apr - 14 Apr"
  totalCalls: number;
  completedCalls: number;
}

export interface CallPerformanceInsight {
  id: string;
  type: 'success' | 'danger';
  title: string;
  description: string;
}
