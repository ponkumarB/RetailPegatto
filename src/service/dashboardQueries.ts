import { useQuery } from '@tanstack/react-query';
import { fetchFromApi } from './apiClient';

// --- Welcomeback Admin ---
export function useAdminSummaryChartQuery(fromDate: string, toDate: string, enabled = true) {
  return useQuery({
    queryKey: ['adminSummaryChart', fromDate, toDate],
    queryFn: () => fetchFromApi('/user/DashboardSummarychart/', {
      method: 'POST',
      body: JSON.stringify({ From_Date: fromDate, To_Date: toDate }),
    }),
    enabled,
  });
}

export function useAdminDashboardNewITQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['adminDashboardNewIT', startDate, endDate],
    queryFn: () => fetchFromApi('/user/AdminDashboardNewIT/', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    }),
    enabled,
  });
}

// --- CEO Dashboard ---
export function useCEODashboardITNewQuery(startDate: string, endDate: string, createdBy: number, enabled = true) {
  return useQuery({
    queryKey: ['ceoDashboardITNew', startDate, endDate, createdBy],
    queryFn: () => fetchFromApi('/user/CEODashboardITNew/', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate, created_by: createdBy }),
    }),
    enabled,
  });
}

export function useCEODashboardAnalyticsNewITQuery(startDate: string, endDate: string, createdBy: number, enabled = true) {
  return useQuery({
    queryKey: ['ceoDashboardAnalyticsNewIT', startDate, endDate, createdBy],
    queryFn: () => fetchFromApi('/user/CEODashboardAnalyticsNewIT/', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate, created_by: createdBy }),
    }),
    enabled,
  });
}

// --- Delivery Dashboard ---
export function useDeliveryDashboardITNewQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['deliveryDashboardITNew', startDate, endDate],
    queryFn: () => fetchFromApi('/user/DeliveryDashboardITNew/', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    }),
    enabled,
  });
}

export function useDeliveryDashboardAnalyticsITNewQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['deliveryDashboardAnalyticsITNew', startDate, endDate],
    queryFn: () => fetchFromApi('/user/DeliveryDashboardAnalyticsITNew/', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    }),
    enabled,
  });
}

// --- Project Manager Dashboard ---
export function usePMDashboardNewITQuery(startDate: string, endDate: string, createdBy: number, enabled = true) {
  return useQuery({
    queryKey: ['pmDashboardNewIT', startDate, endDate, createdBy],
    queryFn: () => fetchFromApi('/user/PMDashboardNewIT/', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate, created_by: createdBy }),
    }),
    enabled,
  });
}

export function usePMDashboardAnalyticsITNewQuery(startDate: string, endDate: string, enabled = true) {
  return useQuery({
    queryKey: ['pmDashboardAnalyticsITNew', startDate, endDate],
    queryFn: () => fetchFromApi('/user/PMDashboardAnalyticsITNew/', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    }),
    enabled,
  });
}

// 1. CEO Dashboard hook (Legacy/Backup)
export function useCEODashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'ceo'],
    queryFn: () => fetchFromApi('/dashboard/ceo'),
  });
}

// 2. Delivery Manager Dashboard hook (Legacy/Backup)
export function useDeliveryManagerDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'delivery-manager'],
    queryFn: () => fetchFromApi('/dashboard/delivery-manager'),
  });
}

// 3. Project Manager Dashboard hook (Legacy/Backup)
export function useProjectManagerDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'project-manager'],
    queryFn: () => fetchFromApi('/dashboard/project-manager'),
  });
}

// 4. Project Lead Dashboard hook (Legacy/Backup)
export function useProjectLeadDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'project-lead'],
    queryFn: () => fetchFromApi('/dashboard/project-lead'),
  });
}

// 5. Test Lead Dashboard hook (Legacy/Backup)
export function useTestLeadDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'test-lead'],
    queryFn: () => fetchFromApi('/dashboard/test-lead'),
  });
}

// 6. Developer Dashboard hook (Legacy/Backup)
export function useDeveloperDashboardQuery() {
  return useQuery({
    queryKey: ['dashboard', 'developer'],
    queryFn: () => fetchFromApi('/dashboard/developer'),
  });
}

// --- New Role-Based API Hooks ---
export function useProjectLeadDashboardNewQuery(createdBy: number, startDate?: string, endDate?: string, enabled = true) {
  const query = new URLSearchParams({ created_by: String(createdBy) });
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  return useQuery({
    queryKey: ['projectLeadDashboardNew', createdBy, startDate, endDate],
    queryFn: () => fetchFromApi(`/user/ProjectLeadDashboardAPIView/?${query.toString()}`),
    enabled,
  });
}

export function useProjectLeadTaskDashboardNewQuery(createdBy: number, startDate?: string, endDate?: string, enabled = true) {
  const query = new URLSearchParams({ created_by: String(createdBy) });
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  return useQuery({
    queryKey: ['projectLeadTaskDashboardNew', createdBy, startDate, endDate],
    queryFn: () => fetchFromApi(`/user/ProjectLeadTaskDashboardAPIView/?${query.toString()}`),
    enabled,
  });
}

export function useTestCaseDashboardNewQuery(createdBy: number, startDate?: string, endDate?: string, enabled = true) {
  const query = new URLSearchParams({ created_by: String(createdBy) });
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  return useQuery({
    queryKey: ['testCaseDashboardNew', createdBy, startDate, endDate],
    queryFn: () => fetchFromApi(`/user/TestCaseDashboardAPIView/?${query.toString()}`),
    enabled,
  });
}

export function useDefectDashboardNewQuery(createdBy: number, startDate?: string, endDate?: string, enabled = true) {
  const query = new URLSearchParams({ created_by: String(createdBy) });
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  return useQuery({
    queryKey: ['defectDashboardNew', createdBy, startDate, endDate],
    queryFn: () => fetchFromApi(`/user/DefectDashboardAPIView/?${query.toString()}`),
    enabled,
  });
}

export function useDeveloperDashboardNewQuery(createdBy: number, startDate?: string, endDate?: string, enabled = true) {
  const query = new URLSearchParams({ created_by: String(createdBy) });
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  return useQuery({
    queryKey: ['developerDashboardNew', createdBy, startDate, endDate],
    queryFn: () => fetchFromApi(`/user/DeveloperDashboardAPIView/?${query.toString()}`),
    enabled,
  });
}

export function useDeveloperProjectWorkNewQuery(createdBy: number, startDate?: string, endDate?: string, enabled = true) {
  const query = new URLSearchParams({ created_by: String(createdBy) });
  if (startDate) query.append('start_date', startDate);
  if (endDate) query.append('end_date', endDate);

  return useQuery({
    queryKey: ['developerProjectWorkNew', createdBy, startDate, endDate],
    queryFn: () => fetchFromApi(`/user/DeveloperProjectWorkAPIView/?${query.toString()}`),
    enabled,
  });
}

// --- Task Dashboard Status Queries ---
export interface TaskDashboardKPIPayload {
  start_date: string;
  end_date: string;
}

export function useTaskDashboardKPIQuery(payload: TaskDashboardKPIPayload, enabled = true) {
  return useQuery({
    queryKey: ['taskDashboardKPI', payload],
    queryFn: () => fetchFromApi('/user/TaskDashboardKPIAPI/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    enabled,
  });
}

export interface TaskDashboardAnalyticsPayload {
  project_id?: number | string | null;
  assigned_to?: number | string | null;
  created_by?: number | string | null;
  status?: string;
  priority?: string;
  start_date: string;
  end_date: string;
}

export function useTaskDashboardAnalyticsQuery(payload: TaskDashboardAnalyticsPayload, enabled = true) {
  return useQuery({
    queryKey: ['taskDashboardAnalytics', payload],
    queryFn: () => fetchFromApi('/user/TaskDashboardAnalyticsAPI/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    enabled,
  });
}

export interface TaskDashboardListPayload {
  project_id?: number | string | null;
  assigned_to?: number | string | null;
  created_by?: number | string | null;
  status?: string;
  priority?: string;
  start_date: string;
  end_date: string;
  search?: string;
}

export function useTaskDashboardListQuery(payload: TaskDashboardListPayload, enabled = true) {
  return useQuery({
    queryKey: ['taskDashboardList', payload],
    queryFn: () => fetchFromApi('/user/TaskDashboardListAPI/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    enabled,
  });
}

export function useTaskDashboardFilterDropdownQuery(enabled = true) {
  return useQuery({
    queryKey: ['taskDashboardFilterDropdown'],
    queryFn: () => fetchFromApi('/user/TaskDashboardFilterDropdownAPI/', {
      method: 'POST',
    }),
    enabled,
  });
}
