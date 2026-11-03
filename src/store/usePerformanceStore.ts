import { create } from 'zustand';
import { EmployeePerformanceRecord, WeekWiseStats, CallPerformanceInsight } from '@/types/performance';

interface PerformanceStore {
  selectedWeekRange: string;
  employees: EmployeePerformanceRecord[];
  weeklyStats: WeekWiseStats[];
  insights: CallPerformanceInsight[];
  
  setSelectedWeekRange: (range: string) => void;
  updateEmployeeRecord: (id: string, updatedRecord: Partial<EmployeePerformanceRecord>) => void;
}

const initialEmployees: EmployeePerformanceRecord[] = [
  {
    id: 'emp-1',
    name: 'Sarah Miller',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    totalCalls: 38,
    completedCalls: 24,
    pendingCalls: 10,
    overdueCalls: 4,
    completionRate: 63.16,
    avgCallDuration: '00:06:24',
    performanceRating: 'Excellent'
  },
  {
    id: 'emp-2',
    name: 'Mike Johnson',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    totalCalls: 36,
    completedCalls: 21,
    pendingCalls: 11,
    overdueCalls: 4,
    completionRate: 58.33,
    avgCallDuration: '00:05:58',
    performanceRating: 'Good'
  },
  {
    id: 'emp-3',
    name: 'Emily Davis',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    totalCalls: 34,
    completedCalls: 20,
    pendingCalls: 10,
    overdueCalls: 4,
    completionRate: 58.82,
    avgCallDuration: '00:06:10',
    performanceRating: 'Good'
  },
  {
    id: 'emp-4',
    name: 'David Wilson',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
    totalCalls: 28,
    completedCalls: 16,
    pendingCalls: 9,
    overdueCalls: 3,
    completionRate: 57.14,
    avgCallDuration: '00:05:36',
    performanceRating: 'Average'
  },
  {
    id: 'emp-5',
    name: 'Jessica White',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80',
    totalCalls: 25,
    completedCalls: 13,
    pendingCalls: 9,
    overdueCalls: 3,
    completionRate: 52.00,
    avgCallDuration: '00:05:21',
    performanceRating: 'Average'
  },
  {
    id: 'emp-6',
    name: 'Daniel Harris',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    totalCalls: 24,
    completedCalls: 12,
    pendingCalls: 8,
    overdueCalls: 4,
    completionRate: 50.00,
    avgCallDuration: '00:05:02',
    performanceRating: 'Average'
  },
  {
    id: 'emp-7',
    name: 'Thomas Lee',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    totalCalls: 22,
    completedCalls: 11,
    pendingCalls: 7,
    overdueCalls: 4,
    completionRate: 50.00,
    avgCallDuration: '00:04:55',
    performanceRating: 'Average'
  },
  {
    id: 'emp-8',
    name: 'Robert Brown',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
    totalCalls: 17,
    completedCalls: 8,
    pendingCalls: 6,
    overdueCalls: 3,
    completionRate: 47.06,
    avgCallDuration: '00:04:40',
    performanceRating: 'Below Avg'
  },
  {
    id: 'emp-9',
    name: 'Olivia Martin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
    totalCalls: 16,
    completedCalls: 7,
    pendingCalls: 6,
    overdueCalls: 3,
    completionRate: 43.75,
    avgCallDuration: '00:04:38',
    performanceRating: 'Below Avg'
  },
  {
    id: 'emp-10',
    name: 'Kevin Scott',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    totalCalls: 16,
    completedCalls: 7,
    pendingCalls: 3,
    overdueCalls: 6,
    completionRate: 43.75,
    avgCallDuration: '00:04:31',
    performanceRating: 'Below Avg'
  }
];

const initialWeeklyStats: WeekWiseStats[] = [
  { week: 'W-15', label: '08 Apr - 14 Apr', totalCalls: 180, completedCalls: 98 },
  { week: 'W-16', label: '15 Apr - 21 Apr', totalCalls: 210, completedCalls: 115 },
  { week: 'W-17', label: '22 Apr - 28 Apr', totalCalls: 230, completedCalls: 128 },
  { week: 'W-18', label: '29 Apr - 05 May', totalCalls: 202, completedCalls: 112 },
  { week: 'W-19', label: '06 May - 12 May', totalCalls: 228, completedCalls: 133 },
  { week: 'W-20', label: '13 May - 19 May', totalCalls: 256, completedCalls: 142 }
];

const initialInsights: CallPerformanceInsight[] = [
  {
    id: 'pi-1',
    type: 'success',
    title: '55.47% of calls were completed this week.',
    description: '↑ 5.2% higher than last week.'
  },
  {
    id: 'pi-2',
    type: 'danger',
    title: '26 calls are overdue.',
    description: 'Focus on follow ups to reduce overdue calls.'
  }
];

export const usePerformanceStore = create<PerformanceStore>((set) => ({
  selectedWeekRange: '13/05/2024 - 19/05/2024 (Week 20)',
  employees: initialEmployees,
  weeklyStats: initialWeeklyStats,
  insights: initialInsights,
  
  setSelectedWeekRange: (selectedWeekRange) => set({ selectedWeekRange }),
  
  updateEmployeeRecord: (id, updatedRecord) => set((state) => ({
    employees: state.employees.map((emp) => emp.id === id ? { ...emp, ...updatedRecord } : emp)
  }))
}));
