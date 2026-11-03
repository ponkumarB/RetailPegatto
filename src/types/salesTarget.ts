export type TargetStatus = 'Achieved' | 'In Progress' | 'Behind Target';

export interface SalesTargetBreakdown {
  id: string;
  salesPerson: string;
  region: string;
  branch: string;
  targetAmount: number;
}

export interface SalesPeriod {
  period_name: string;
  from_date: string;
  to_date: string;
  target_amount: number;
}

export interface SalespersonAllocation {
  salesperson_id: number;
  salesperson_Name: string;
  periods: SalesPeriod[];
  region?: string;
  branch?: string;
}

export interface SalesTarget {
  id: string;
  targetName: string;
  targetPeriod: string;
  targetType: string;
  measure: string;
  salesManager: string;
  salesPersonsCount: number;
  regionsCount: number;
  branchesCount: number;
  totalTarget: number;
  notes?: string;
  breakdown: SalesTargetBreakdown[];
  salesperson_allocations?: SalespersonAllocation[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesAchievement {
  id: string;
  salesPerson: string;
  salesManager: string;
  region: string;
  branch: string;
  target: number;
  achievement: number;
  achievementPercent: number;
  status: TargetStatus;
  lastUpdated: string;
  targetPeriod: string;
}
