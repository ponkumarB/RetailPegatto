import { fetchFromApi } from '@/service/apiClient';

export interface CustomerretentionsetupcrudPostPayload {
  RetentionTracking?: boolean;
  RetentionCalculationMethod?: string;
  RetentionWindowMonths?: number;
  ReEngagementWindowDays?: number;
  MinimumRevenueThreshold?: number;
  RetentionMetrics?: any[];
  AlertSettings?: any[];
  PrimaryDataSource?: string;
  DataSyncFrequency?: string;
  ChurnReasons?: any;
  CustomerSegments?: any[];
  CustomerReasons?: any;
  Segments?: any[];
  Created_By?: number;
  Updated_By?: number;
}

export interface CustomerretentionsetupcrudPutPayload {
  id?: number;
  CustomerRetentionSetup_Id?: string;
  RetentionTracking?: boolean;
  RetentionCalculationMethod?: string;
  RetentionWindowMonths?: number;
  ReEngagementWindowDays?: number;
  MinimumRevenueThreshold?: string;
  RetentionMetrics?: any[];
  AlertSettings?: any[];
  PrimaryDataSource?: string;
  DataSyncFrequency?: string;
  ChurnReasons?: any;
  CustomerSegments?: any[];
  CustomerReasons?: any;
  Segments?: any[];
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Created_By?: number;
  Updated_By?: number;
}


export interface CustomerretentionsetupcrudPatchPayload {
  id?: number;
  RetentionTracking?: boolean;
}

export interface CustomerretentioncrudPostPayload {
  Account_Id?: number;
  Segment?: string;
  RetentionStatus?: string;
  RiskScore?: number;
  ChurnReason?: string;
  LastActivityDate?: string;
  ChurnDate?: string;
  RevenueAtRisk?: number;
  RecommendedAction?: string;
  Notes?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface CustomerretentioncrudPutPayload {
  id?: number;
  CustomerRetention_Id?: string;
  Segment?: string;
  RetentionStatus?: string;
  RiskScore?: number;
  ChurnReason?: string;
  LastActivityDate?: string;
  ChurnDate?: string;
  RevenueAtRisk?: string;
  RecommendedAction?: string;
  Notes?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Account_Id?: number;
  Created_By?: number;
  Updated_By?: number;
}

export interface CustomerretentioncrudPatchPayload {
  id?: number;
  RiskScore?: number;
  RetentionStatus?: string;
  ChurnReason?: string;
}

export interface CustomerretentionfilterPayload {
  CustomerRetention_Id?: string;
  Segment?: string;
  RetentionStatus?: string;
  ChurnReason?: string;
  Created_Date?: any[];
  page?: number;
}

export interface CustomerretentionsegmentanalysisPayload {
  Created_Date?: any[];
}

export interface CustomerretentiondashboardsummaryPayload {
  Created_Date?: any[];
}

export interface CustomerretentionchurnreasonsPayload {
  Created_Date?: any[];
}

export interface CustomerretentioncohortanalysisPayload {
  Created_Date?: any[];
}

export interface CustomerretentionratetrendPayload {
  Created_Date?: any[];
}


/**
 * Endpoint: POST /user/CustomerRetentionSetupCRUD
 */
export async function customerretentionsetupcrudPost(payload?: CustomerretentionsetupcrudPostPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionSetupCRUD/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/CustomerRetentionSetupCRUD
 */
export async function customerretentionsetupcrudGet(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerRetentionSetupCRUD/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: PUT /user/CustomerRetentionSetupCRUD
 */
export async function customerretentionsetupcrudPut(payload?: CustomerretentionsetupcrudPutPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionSetupCRUD/', {
    method: 'PUT',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: PATCH /user/CustomerRetentionSetupCRUD
 */
export async function customerretentionsetupcrudPatch(payload?: CustomerretentionsetupcrudPatchPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionSetupCRUD/', {
    method: 'PATCH',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: DELETE /user/CustomerRetentionSetupCRUD
 */
export async function customerretentionsetupcrudDelete(payload?: any): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionSetupCRUD/', {
    method: 'DELETE',
  });
}

/**
 * Endpoint: GET /user/CustomerRetentionSetupList
 */
export async function customerretentionsetuplist(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerRetentionSetupList/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/CustomerRetentionSetupwithoutpagination
 */
export async function customerretentionsetupwithoutpagination(id?: string | number): Promise<any> {
  const path = id ? `/user/CustomerRetentionSetupwithoutpagination/?id=${id}` : '/user/CustomerRetentionSetupwithoutpagination/';
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /user/CustomerRetentionCRUD
 */
export async function customerretentioncrudPost(payload?: CustomerretentioncrudPostPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionCRUD/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/CustomerRetentionCRUD
 */
export async function customerretentioncrudGet(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerRetentionCRUD/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: PUT /user/CustomerRetentionCRUD
 */
export async function customerretentioncrudPut(payload?: CustomerretentioncrudPutPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionCRUD/', {
    method: 'PUT',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: PATCH /user/CustomerRetentionCRUD
 */
export async function customerretentioncrudPatch(payload?: CustomerretentioncrudPatchPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionCRUD/', {
    method: 'PATCH',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/CustomerRetentionList
 */
export async function customerretentionlist(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerRetentionList/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/CustomerRetentionwithoutpagination
 */
export async function customerretentionwithoutpagination(id?: string | number): Promise<any> {
  const path = id ? `/user/CustomerRetentionwithoutpagination/?id=${id}` : '/user/CustomerRetentionwithoutpagination/';
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/CustomerRetentionSearch
 */
export async function customerretentionsearch(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerRetentionSearch/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /user/CustomerRetentionFilter
 */
export async function customerretentionfilter(payload?: CustomerretentionfilterPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionFilter/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: POST /user/CustomerRetentionSegmentAnalysis
 */
export async function customerretentionsegmentanalysis(payload?: CustomerretentionsegmentanalysisPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionSegmentAnalysis/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: POST /user/CustomerRetentionDashboardSummary
 */
export async function customerretentiondashboardsummary(payload?: CustomerretentiondashboardsummaryPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionDashboardSummary/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: POST /user/CustomerRetentionChurnReasons
 */
export async function customerretentionchurnreasons(payload?: CustomerretentionchurnreasonsPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionChurnReasons/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: POST /user/CustomerRetentionCohortAnalysis
 */
export async function customerretentioncohortanalysis(payload?: CustomerretentioncohortanalysisPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionCohortAnalysis/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: POST /user/CustomerRetentionRateTrend
 */
export async function customerretentionratetrend(payload?: CustomerretentionratetrendPayload): Promise<any> {
  return fetchFromApi('/user/CustomerRetentionRateTrend/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

