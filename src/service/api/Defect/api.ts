import { fetchFromApi } from '@/service/apiClient';

export interface NewITDefectTrackingFilterPayload {
  Project_Id?: number;
  Assigned_To?: number;
  Status?: string;
  Priority?: string;
  Severity?: string;
  Defect_Category?: string;
  Sprint?: string;
  Branch?: string;
  Created_Date?: [string, string];
  page?: number;
}

export interface DefectTrackingDashboardParams {
  from_date?: string;
  to_date?: string;
}

export interface DefectTrackingListPayload {
  from_date?: string;
  to_date?: string;
  Project_Id?: number;
  Status?: string;
  Severity?: string;
  Assigned_To?: number;
  page?: number;
  page_size?: number;
}

/**
 * POST request for NewITDefectTrackingFilter
 */
export async function filterNewITDefectTracking(payload: NewITDefectTrackingFilterPayload): Promise<any> {
  return fetchFromApi('/user/NewITDefectTrackingFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for NewITDefectTrackingSearch
 */
export async function searchNewITDefectTracking(searchQuery: string): Promise<any> {
  return fetchFromApi(`/user/NewITDefectTrackingSearch/?search=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
  });
}

/**
 * GET request for DefectTrackingDashboard
 */
export async function fetchDefectTrackingDashboard(params: DefectTrackingDashboardParams): Promise<any> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchFromApi(`/user/DefectTrackingDashboard/${queryString}`, {
    method: 'GET',
  });
}

/**
 * POST request for DefectTrackingList
 */
export async function fetchDefectTrackingList(payload: DefectTrackingListPayload): Promise<any> {
  return fetchFromApi('/user/DefectTrackingList/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * DefectTrackingCRUD Operations
 */

export async function createDefectTracking(payload: any): Promise<any> {
  return fetchFromApi('/user/DefectTrackingCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDefectTracking(id: string | number): Promise<any> {
  return fetchFromApi(`/user/DefectTrackingCRUD/?id=${id}`, {
    method: 'GET',
  });
}

export async function updateDefectTracking(payload: any): Promise<any> {
  return fetchFromApi('/user/DefectTrackingCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDefectTracking(id: string | number): Promise<any> {
  return fetchFromApi(`/user/DefectTrackingCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}
