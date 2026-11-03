import { fetchFromApi } from '@/service/apiClient';

export interface SalesTargetSearchParams {
  search: string;
}

export interface NewITAchievementRegionBranchPayload {
  organization_id: number;
  start_date?: string;
  end_date?: string;
  target_id?: number;
  sales_manager_id?: number;
  region?: string;
  branch?: string;
}

export interface NewITSalesAchievementTableListPayload {
  organization_id: number;
  tab?: string; // "All", "Behind Target", "Achieved", "In Progress"
}

export interface NewITAchievementRegionTrendPayload {
  organization_id: number;
  target_id?: number;
  sales_manager_id?: number;
  start_date?: string;
  end_date?: string;
  region?: string;
  branch?: string;
}

export interface NewITSalesAchievementDashboardPayload {
  organization_id: number;
  start_date?: string;
  end_date?: string;
  branch?: string;
  region?: string;
  target_id?: number;
  sales_manager_id?: number;
}

/**
 * GET request for SalesTargetSearch
 */
export async function searchSalesTarget(params: SalesTargetSearchParams): Promise<any> {
  return fetchFromApi(`/user/SalesTargetSearch/?search=${encodeURIComponent(params.search)}`, {
    method: 'GET',
  });
}

/**
 * POST request for NewITAchievementRegionBranch with optional search query
 */
export async function fetchNewITAchievementRegionBranch(payload: NewITAchievementRegionBranchPayload, search?: string): Promise<any> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return fetchFromApi(`/user/NewITAchievementRegionBranch/${query}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for NewITSalesAchievementTableList
 */
export async function fetchNewITSalesAchievementTableList(payload: NewITSalesAchievementTableListPayload): Promise<any> {
  return fetchFromApi('/user/NewITSalesAchievementTableList/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for NewITAchievementRegionTrend
 */
export async function fetchNewITAchievementRegionTrend(payload: NewITAchievementRegionTrendPayload): Promise<any> {
  return fetchFromApi('/user/NewITAchievementRegionTrend/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for NewITSalesAchievementDashboard
 */
export async function fetchNewITSalesAchievementDashboard(payload: NewITSalesAchievementDashboardPayload): Promise<any> {
  return fetchFromApi('/user/NewITSalesAchievementDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
