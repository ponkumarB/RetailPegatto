import { create } from 'zustand';
import { SalesTarget, SalesAchievement } from '@/types/salesTarget';
import { fetchNewITSalesAchievementDashboard } from '@/service/api/SalesAchievement/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { fetchFromApi } from '@/service/apiClient';

interface SalesTargetState {
  targets: SalesTarget[];
  achievements: SalesAchievement[];
  addTarget: (target: SalesTarget) => void;
  updateTarget: (id: string, updatedTarget: Partial<SalesTarget>) => void;
  deleteTarget: (id: string) => void;
  dashboardData: any;
  usersList: any[];
  salesTargetsAdditional: any[];
  isLoading: boolean;
  loadDashboardData: (periodRange: [string, string]) => Promise<void>;
  loadUsersList: () => Promise<void>;
  loadSalesTargetsAdditional: () => Promise<void>;
  saveSalesTarget: (payload: any, isEdit: boolean) => Promise<any>;
  deleteSalesTarget: (id: number | string) => Promise<void>;
}

const initialTargets: SalesTarget[] = [
  {
    id: 'TGT-001',
    targetName: 'Q2 FY 2024 Sales Target',
    targetPeriod: 'Q2-2024',
    targetType: 'Revenue',
    measure: 'INR',
    salesManager: 'Aarav Rao',
    salesPersonsCount: 5,
    regionsCount: 4,
    branchesCount: 4,
    totalTarget: 10500000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    breakdown: [
      { id: 'BD-01', salesPerson: 'Rohit Kumar', region: 'North', branch: 'Delhi Branch', targetAmount: 2500000 },
      { id: 'BD-02', salesPerson: 'Sneha Sharma', region: 'West', branch: 'Mumbai Branch', targetAmount: 2000000 },
      { id: 'BD-03', salesPerson: 'Suresh Kumar', region: 'North', branch: 'Noida Branch', targetAmount: 3005000 },
      { id: 'BD-04', salesPerson: 'Priya Kapoor', region: 'East', branch: 'Kolkata Branch', targetAmount: 1540000 },
      { id: 'BD-05', salesPerson: 'Arjun Singh', region: 'South', branch: 'Delhi Branch', targetAmount: 1455000 }
    ]
  },
  {
    id: 'TGT-002',
    targetName: 'Apr 2024 Sales Target',
    targetPeriod: 'Apr-2024',
    targetType: 'Revenue',
    measure: 'INR',
    salesManager: 'Aarav Rao',
    salesPersonsCount: 5,
    regionsCount: 4,
    branchesCount: 4,
    totalTarget: 3000000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    breakdown: [
      { id: 'BD-06', salesPerson: 'Rohit Kumar', region: 'North', branch: 'Delhi Branch', targetAmount: 700000 },
      { id: 'BD-07', salesPerson: 'Sneha Sharma', region: 'West', branch: 'Mumbai Branch', targetAmount: 600000 },
      { id: 'BD-08', salesPerson: 'Suresh Kumar', region: 'North', branch: 'Noida Branch', targetAmount: 800000 },
      { id: 'BD-09', salesPerson: 'Priya Kapoor', region: 'East', branch: 'Kolkata Branch', targetAmount: 500000 },
      { id: 'BD-10', salesPerson: 'Arjun Singh', region: 'South', branch: 'Delhi Branch', targetAmount: 400000 }
    ]
  },
  {
    id: 'TGT-003',
    targetName: 'May 2024 Sales Target',
    targetPeriod: 'May-2024',
    targetType: 'Revenue',
    measure: 'INR',
    salesManager: 'Aarav Rao',
    salesPersonsCount: 5,
    regionsCount: 4,
    branchesCount: 4,
    totalTarget: 4000000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    breakdown: [
      { id: 'BD-11', salesPerson: 'Rohit Kumar', region: 'North', branch: 'Delhi Branch', targetAmount: 900000 },
      { id: 'BD-12', salesPerson: 'Sneha Sharma', region: 'West', branch: 'Mumbai Branch', targetAmount: 800000 },
      { id: 'BD-13', salesPerson: 'Suresh Kumar', region: 'North', branch: 'Noida Branch', targetAmount: 1100000 },
      { id: 'BD-14', salesPerson: 'Priya Kapoor', region: 'East', branch: 'Kolkata Branch', targetAmount: 600000 },
      { id: 'BD-15', salesPerson: 'Arjun Singh', region: 'South', branch: 'Delhi Branch', targetAmount: 600000 }
    ]
  },
  {
    id: 'TGT-004',
    targetName: 'Jun 2024 Sales Target',
    targetPeriod: 'Jun-2024',
    targetType: 'Revenue',
    measure: 'INR',
    salesManager: 'Aarav Rao',
    salesPersonsCount: 5,
    regionsCount: 4,
    branchesCount: 4,
    totalTarget: 3500000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    breakdown: [
      { id: 'BD-16', salesPerson: 'Rohit Kumar', region: 'North', branch: 'Delhi Branch', targetAmount: 900000 },
      { id: 'BD-17', salesPerson: 'Sneha Sharma', region: 'West', branch: 'Mumbai Branch', targetAmount: 600000 },
      { id: 'BD-18', salesPerson: 'Suresh Kumar', region: 'North', branch: 'Noida Branch', targetAmount: 1105000 },
      { id: 'BD-19', salesPerson: 'Priya Kapoor', region: 'East', branch: 'Kolkata Branch', targetAmount: 440000 },
      { id: 'BD-20', salesPerson: 'Arjun Singh', region: 'South', branch: 'Delhi Branch', targetAmount: 455000 }
    ]
  }
];

const initialAchievements: SalesAchievement[] = [
  // Q2-2024
  { id: 'ACH-001', salesPerson: 'Rohit Kumar', salesManager: 'Aarav Rao', region: 'North', branch: 'Delhi Branch', target: 2500000, achievement: 2600000, achievementPercent: 104, status: 'Achieved', lastUpdated: '2024-06-01', targetPeriod: 'Q2-2024' },
  { id: 'ACH-002', salesPerson: 'Sneha Sharma', salesManager: 'Aarav Rao', region: 'West', branch: 'Mumbai Branch', target: 2000000, achievement: 1900000, achievementPercent: 95, status: 'In Progress', lastUpdated: '2024-06-03', targetPeriod: 'Q2-2024' },
  { id: 'ACH-003', salesPerson: 'Suresh Kumar', salesManager: 'Aarav Rao', region: 'North', branch: 'Noida Branch', target: 3005000, achievement: 2400000, achievementPercent: 80, status: 'Behind Target', lastUpdated: '2024-06-02', targetPeriod: 'Q2-2024' },
  { id: 'ACH-004', salesPerson: 'Priya Kapoor', salesManager: 'Aarav Rao', region: 'East', branch: 'Kolkata Branch', target: 1540000, achievement: 1540005, achievementPercent: 100, status: 'Achieved', lastUpdated: '2024-06-05', targetPeriod: 'Q2-2024' },
  { id: 'ACH-005', salesPerson: 'Arjun Singh', salesManager: 'Aarav Rao', region: 'South', branch: 'Delhi Branch', target: 1455000, achievement: 1104995, achievementPercent: 76, status: 'Behind Target', lastUpdated: '2024-06-04', targetPeriod: 'Q2-2024' },

  // Apr-2024
  { id: 'ACH-006', salesPerson: 'Rohit Kumar', salesManager: 'Aarav Rao', region: 'North', branch: 'Delhi Branch', target: 700000, achievement: 650000, achievementPercent: 92, status: 'In Progress', lastUpdated: '2024-04-28', targetPeriod: 'Apr-2024' },
  { id: 'ACH-007', salesPerson: 'Sneha Sharma', salesManager: 'Aarav Rao', region: 'West', branch: 'Mumbai Branch', target: 600000, achievement: 610000, achievementPercent: 101, status: 'Achieved', lastUpdated: '2024-04-30', targetPeriod: 'Apr-2024' },
  { id: 'ACH-008', salesPerson: 'Suresh Kumar', salesManager: 'Aarav Rao', region: 'North', branch: 'Noida Branch', target: 800000, achievement: 560000, achievementPercent: 70, status: 'Behind Target', lastUpdated: '2024-04-29', targetPeriod: 'Apr-2024' },
  { id: 'ACH-009', salesPerson: 'Priya Kapoor', salesManager: 'Aarav Rao', region: 'East', branch: 'Kolkata Branch', target: 500000, achievement: 510000, achievementPercent: 102, status: 'Achieved', lastUpdated: '2024-04-27', targetPeriod: 'Apr-2024' },
  { id: 'ACH-010', salesPerson: 'Arjun Singh', salesManager: 'Aarav Rao', region: 'South', branch: 'Delhi Branch', target: 400000, achievement: 220000, achievementPercent: 55, status: 'Behind Target', lastUpdated: '2024-04-28', targetPeriod: 'Apr-2024' },

  // May-2024
  { id: 'ACH-011', salesPerson: 'Rohit Kumar', salesManager: 'Aarav Rao', region: 'North', branch: 'Delhi Branch', target: 900000, achievement: 950000, achievementPercent: 105, status: 'Achieved', lastUpdated: '2024-05-28', targetPeriod: 'May-2024' },
  { id: 'ACH-012', salesPerson: 'Sneha Sharma', salesManager: 'Aarav Rao', region: 'West', branch: 'Mumbai Branch', target: 800000, achievement: 820000, achievementPercent: 102, status: 'Achieved', lastUpdated: '2024-05-30', targetPeriod: 'May-2024' },
  { id: 'ACH-013', salesPerson: 'Suresh Kumar', salesManager: 'Aarav Rao', region: 'North', branch: 'Noida Branch', target: 1100000, achievement: 1120000, achievementPercent: 101, status: 'Achieved', lastUpdated: '2024-05-29', targetPeriod: 'May-2024' },
  { id: 'ACH-014', salesPerson: 'Priya Kapoor', salesManager: 'Aarav Rao', region: 'East', branch: 'Kolkata Branch', target: 600000, achievement: 580000, achievementPercent: 96, status: 'In Progress', lastUpdated: '2024-05-27', targetPeriod: 'May-2024' },
  { id: 'ACH-015', salesPerson: 'Arjun Singh', salesManager: 'Aarav Rao', region: 'South', branch: 'Delhi Branch', target: 600000, achievement: 340000, achievementPercent: 56, status: 'Behind Target', lastUpdated: '2024-05-28', targetPeriod: 'May-2024' },

  // Jun-2024
  { id: 'ACH-016', salesPerson: 'Rohit Kumar', salesManager: 'Aarav Rao', region: 'North', branch: 'Delhi Branch', target: 900000, achievement: 1000000, achievementPercent: 111, status: 'Achieved', lastUpdated: '2024-06-15', targetPeriod: 'Jun-2024' },
  { id: 'ACH-017', salesPerson: 'Sneha Sharma', salesManager: 'Aarav Rao', region: 'West', branch: 'Mumbai Branch', target: 600000, achievement: 470000, achievementPercent: 78, status: 'Behind Target', lastUpdated: '2024-06-14', targetPeriod: 'Jun-2024' },
  { id: 'ACH-018', salesPerson: 'Suresh Kumar', salesManager: 'Aarav Rao', region: 'North', branch: 'Noida Branch', target: 1105000, achievement: 720000, achievementPercent: 65, status: 'Behind Target', lastUpdated: '2024-06-13', targetPeriod: 'Jun-2024' },
  { id: 'ACH-019', salesPerson: 'Priya Kapoor', salesManager: 'Aarav Rao', region: 'East', branch: 'Kolkata Branch', target: 440000, achievement: 450000, achievementPercent: 102, status: 'Achieved', lastUpdated: '2024-06-15', targetPeriod: 'Jun-2024' },
  { id: 'ACH-020', salesPerson: 'Arjun Singh', salesManager: 'Aarav Rao', region: 'South', branch: 'Delhi Branch', target: 455000, achievement: 545000, achievementPercent: 119, status: 'Achieved', lastUpdated: '2024-06-12', targetPeriod: 'Jun-2024' }
];

export const useSalesTargetStore = create<SalesTargetState>((set) => ({
  targets: initialTargets,
  achievements: initialAchievements,
  addTarget: (target) =>
    set((state) => {
      // Auto generate mock achievements for the new target
      const newAchievements = target.breakdown.map((row, idx) => {
        // Simulate an achievement between 65% and 110% of target Amount
        const randomFactor = 0.65 + Math.random() * 0.45;
        const achievementVal = Math.round(row.targetAmount * randomFactor);
        const achievementPercentVal = Math.round((achievementVal / row.targetAmount) * 100);
        const statusVal = achievementPercentVal >= 100 ? 'Achieved' : (achievementPercentVal >= 85 ? 'In Progress' : 'Behind Target');

        return {
          id: `ACH-NEW-${Date.now()}-${idx}`,
          salesPerson: row.salesPerson,
          salesManager: target.salesManager,
          region: row.region,
          branch: row.branch,
          target: row.targetAmount,
          achievement: achievementVal,
          achievementPercent: achievementPercentVal,
          status: statusVal as any,
          lastUpdated: new Date().toISOString().split('T')[0],
          targetPeriod: target.targetPeriod
        };
      });

      return {
        targets: [target, ...state.targets],
        achievements: [...newAchievements, ...state.achievements]
      };
    }),
  updateTarget: (id, updatedTarget) =>
    set((state) => ({
      targets: state.targets.map((t) => (t.id === id ? { ...t, ...updatedTarget, updatedAt: new Date().toISOString() } : t)),
    })),
  deleteTarget: (id) => set((state) => ({ targets: state.targets.filter((t) => t.id !== id) })),
  dashboardData: null,
  usersList: [],
  salesTargetsAdditional: [],
  isLoading: false,
  loadDashboardData: async (periodRange) => {
    set({ isLoading: true });
    try {
      const orgId = Number(localStorage.getItem('Organization_Id') || '1');
      const res = await fetchNewITSalesAchievementDashboard({
        organization_id: orgId,
        start_date: periodRange[0],
        end_date: periodRange[1]
      });
      set({ dashboardData: res });
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      // Set empty dashboard data structure to prevent UI errors
      set({
        dashboardData: {
          cards: {
            total_achievement: 0,
            target_realization_percentage: 0,
            target_realization_amount: 0,
            achieved_targets_count: 0,
            achieved_targets_out_of: 0,
            in_progress_count: 0,
            behind_target_count: 0
          },
          active_period: '',
          achievement_by_sales_person: [],
          achievement_by_region: [],
          achievement_trend: [],
          table_data: []
        }
      });
    } finally {
      set({ isLoading: false });
    }
  },
  loadUsersList: async () => {
    try {
      const res = await fetchUsersList();
      const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
      set({ usersList: list });
    } catch (err) {
      console.error('Failed to load users list:', err);
    }
  },
  loadSalesTargetsAdditional: async () => {
    try {
      const res = await fetchFromApi('/user/SalesTargetAdditional/', {
        method: 'GET'
      });
      set({ salesTargetsAdditional: Array.isArray(res) ? res : [] });
    } catch (err: any) {
      console.error('Failed to load sales targets additional:', err);
      // If endpoint doesn't exist, set empty array to prevent UI errors
      set({ salesTargetsAdditional: [] });
    }
  },
  saveSalesTarget: async (payload, isEdit) => {
    const method = isEdit ? 'PUT' : 'POST';
    try {
      return await fetchFromApi('/user/SalesTargetCRUD/', {
        method,
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      console.error('Failed to save sales target:', err);
      throw new Error(`Failed to save sales target: ${err?.message || 'API endpoint not available'}`);
    }
  },
  deleteSalesTarget: async (id) => {
    try {
      await fetchFromApi(`/user/SalesTargetCRUD/?id=${id}`, {
        method: 'DELETE'
      });
      set((state) => ({
        salesTargetsAdditional: state.salesTargetsAdditional.filter(
          (item: any) => String(item.id) !== String(id)
        )
      }));
    } catch (err: any) {
      console.error('Failed to delete sales target:', err);
      throw new Error(`Failed to delete sales target: ${err?.message || 'API endpoint not available'}`);
    }
  }
}));

export default useSalesTargetStore;
