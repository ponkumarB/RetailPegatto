import { fetchFromApi } from '@/service/apiClient';

export interface CallCenterListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

/**
 * Fetches call center lists from the backend.
 * Endpoint: GET /user/UserCallCenterListAdditional/
 */
export async function fetchCallCenterLists(
  page: number,
  createdBy: number | string,
  organizationId: number | string
): Promise<CallCenterListResponse> {
  const query = new URLSearchParams({
    Is_Deleted: 'False',
    page: String(page),
    Created_By: String(createdBy),
    Organization_Id: String(organizationId),
  });
  return fetchFromApi(`/user/UserCallCenterListAdditional/?${query.toString()}`, {
    method: 'GET',
  });
}

export interface CallCenterLeadFilterParams {
  LeadSource?: string;
  Lead_Owner?: string;
  Lead_Status?: string;
  Location?: string;
  City?: string;
  page?: number;
  search?: string;
}

/**
 * Filter leads using POST endpoint /user/CallCenterLeadFilter/
 */
export async function postCallCenterLeadFilter(payload: CallCenterLeadFilterParams): Promise<any> {
  return fetchFromApi('/user/CallCenterLeadFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface CreateCallCenterListPayload {
  ListName: string;
  Location: string[];
  Vennilacontact: number[];
  Contact: number[];
  Callconnected: boolean;
  Organization_Id: number;
  Created_By: number;
  Updated_By: number;
  Call_Date?: string;
  Description?: string;
  Industry?: {
    id: number;
    Lead_Name: string;
    Call_Status: string;
    Assign_Id: number | null;
    Assign_Name: string;
    Company?: string;
    Phone_No?: string;
    Assign_Status?: string;
  }[];
}

/**
 * Creates a new call center list.
 * Endpoint: POST /user/UserCallCenterListCRUD/
 */
export async function createUserCallCenterList(payload: CreateCallCenterListPayload): Promise<any> {
  return fetchFromApi('/user/UserCallCenterListCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a call center list.
 * Endpoint: DELETE /user/UserCallCenterListCRUD/?id=<id>
 */
export async function deleteCallCenterList(id: number | string): Promise<any> {
  return fetchFromApi(`/user/UserCallCenterListCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetches call assignment list details.
 * Endpoint: POST /user/CallAssignmentListAPI/
 */
export async function fetchCallAssignmentListDetails(listId: number): Promise<any> {
  return fetchFromApi('/user/CallAssignmentListAPI/', {
    method: 'POST',
    body: JSON.stringify({ ListId: listId }),
  });
}

/**
 * Fetches call center lists without pagination.
 * Endpoint: GET /user/UserCallCenterListwithoutpagination/
 */
export async function fetchCallCenterListsWithoutPagination(
  createdBy: number | string,
  organizationId: number | string
): Promise<any[]> {
  const query = new URLSearchParams({
    Created_By: String(createdBy),
    Organization_Id: String(organizationId),
  });
  return fetchFromApi(`/user/UserCallCenterListwithoutpagination/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Fetches the details of a single call center list (including contact details).
 * Endpoint: GET /user/UserCallCenterListCRUD/?id=<id>
 */
export async function fetchCallCenterListDetails(id: number | string): Promise<any> {
  return fetchFromApi(`/user/UserCallCenterListCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Searches call center lists using backend endpoint.
 * Endpoint: GET /user/UserCallCenterListSearch/
 */
export async function searchCallCenterLists(
  search: string,
  organizationId: number | string,
  createdBy: number | string,
  page?: number
): Promise<any> {
  const params: Record<string, string> = {
    search: String(search),
    Organization_Id: String(organizationId),
    Created_By: String(createdBy),
  };
  if (page) {
    params.page = String(page);
  }
  const query = new URLSearchParams(params);
  return fetchFromApi(`/user/UserCallCenterListSearch/?${query.toString()}`, {
    method: 'GET',
  });
}

export interface UserCallCenterListDashboardPayload {
  Organization_Id: number | string;
  StartDate?: string;
  EndDate?: string;
  page?: number;
}

/**
 * Fetches dashboard call center lists.
 * Endpoint: POST /user/UserCallCenterListDashboard/
 */
export async function fetchUserCallCenterListDashboard(
  payload: UserCallCenterListDashboardPayload
): Promise<any> {
  const pageQuery = payload.page ? `?page=${payload.page}` : '';
  const bodyPayload = {
    Organization_Id: Number(payload.Organization_Id),
    ...(payload.StartDate && { StartDate: payload.StartDate }),
    ...(payload.EndDate && { EndDate: payload.EndDate }),
  };
  return fetchFromApi(`/user/UserCallCenterListDashboard/${pageQuery}`, {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
  });
}

export interface CallAssignmentDashboardPayload {
  UserId: number | string;
  StartDate: string;
  EndDate: string;
}

/**
 * Fetches call assignment dashboard metrics.
 * Endpoint: POST /user/CallAssignmentDashboardAPI/
 */
export async function fetchCallAssignmentDashboard(
  payload: CallAssignmentDashboardPayload
): Promise<any> {
  return fetchFromApi('/user/CallAssignmentDashboardAPI/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface CallAssignmentListPayload {
  ListId: number | string;
  UserId?: number | string;
  Status?: string;
  period?: string[];
  Search?: string;
}

/**
 * Fetches call assignment list details.
 * Endpoint: POST /user/CallAssignmentListAPI/
 */
export async function fetchCallAssignmentList(
  payload: CallAssignmentListPayload
): Promise<any> {
  return fetchFromApi('/user/CallAssignmentListAPI/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface NewITTodayCallCardPayload {
  list_id?: number | string;
  user_id?: number | string;
  assigned_id?: number | string;
  start_date?: string;
  end_date?: string;
}

/**
 * Fetches today's call summary card metrics.
 * Endpoint: POST /user/NewITTodayCallCardAPI/
 */
export async function fetchNewITTodayCallCard(
  payload: NewITTodayCallCardPayload
): Promise<any> {
  const bodyPayload = {
    ...payload,
    ...(payload.user_id !== undefined && {
      user_id: !isNaN(Number(payload.user_id)) ? Number(payload.user_id) : payload.user_id
    }),
    ...(payload.list_id !== undefined && {
      list_id: !isNaN(Number(payload.list_id)) ? Number(payload.list_id) : payload.list_id
    }),
    ...(payload.assigned_id !== undefined && {
      assigned_id: !isNaN(Number(payload.assigned_id)) ? Number(payload.assigned_id) : payload.assigned_id
    }),
  };
  return fetchFromApi('/user/NewITTodayCallCardAPI/', {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
  });
}

export interface CallsByAssignedToPayload {
  list_id: number | string;
  user_id: number | string;
  start_date?: string;
  end_date?: string;
}

/**
 * Fetches call assignment breakdown by user.
 * Endpoint: POST /user/CallsByAssignedToAPI/
 */
export async function fetchCallsByAssignedTo(
  payload: CallsByAssignedToPayload
): Promise<any> {
  const bodyPayload = {
    ...payload,
    ...(payload.user_id !== undefined && {
      user_id: !isNaN(Number(payload.user_id)) ? Number(payload.user_id) : payload.user_id
    }),
    ...(payload.list_id !== undefined && {
      list_id: !isNaN(Number(payload.list_id)) ? Number(payload.list_id) : payload.list_id
    }),
  };
  return fetchFromApi('/user/CallsByAssignedToAPI/', {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
  });
}

export interface EmployeePerformancePayload {
  list_id?: number | string;
  user_id?: number | string;
  start_date?: string;
  end_date?: string;
}

export interface TotalVsCompletedCallsChartPayload {
  organization_id?: number | string;
  created_by?: number | string;
  assigned_id?: number | string;
  start_date: string;
  end_date: string;
}

/**
 * Fetches employee performance records.
 * Endpoint: POST /user/EmployeePerformanceAPI/
 */
export async function fetchEmployeePerformance(
  payload: EmployeePerformancePayload
): Promise<any> {
  const bodyPayload = {
    ...payload,
    ...(payload.user_id !== undefined && {
      user_id: !isNaN(Number(payload.user_id)) ? Number(payload.user_id) : payload.user_id
    }),
    ...(payload.list_id !== undefined && {
      list_id: !isNaN(Number(payload.list_id)) ? Number(payload.list_id) : payload.list_id
    }),
  };
  return fetchFromApi('/user/EmployeePerformanceAPI/', {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
  });
}

/**
 * Fetches total vs completed calls weekly chart.
 * Endpoint: POST /user/TotalVsCompletedCallsChartAPI/
 */
export async function fetchTotalVsCompletedCallsChart(
  payload: TotalVsCompletedCallsChartPayload
): Promise<any> {
  const bodyPayload = {
    ...payload,
    ...(payload.organization_id !== undefined && {
      organization_id: !isNaN(Number(payload.organization_id)) ? Number(payload.organization_id) : payload.organization_id
    }),
    ...(payload.created_by !== undefined && {
      created_by: !isNaN(Number(payload.created_by)) ? Number(payload.created_by) : payload.created_by
    }),
    ...(payload.assigned_id !== undefined && {
      assigned_id: !isNaN(Number(payload.assigned_id)) ? Number(payload.assigned_id) : payload.assigned_id
    }),
  };
  return fetchFromApi('/user/TotalVsCompletedCallsChartAPI/', {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
  });
}

/**
 * Fetches top employee performance list.
 * Endpoint: POST /user/TopEmployeePerformanceAPI/
 */
export async function fetchTopEmployeePerformance(
  payload: EmployeePerformancePayload
): Promise<any> {
  const bodyPayload = {
    ...payload,
    ...(payload.user_id !== undefined && {
      user_id: !isNaN(Number(payload.user_id)) ? Number(payload.user_id) : payload.user_id
    }),
    ...(payload.list_id !== undefined && {
      list_id: !isNaN(Number(payload.list_id)) ? Number(payload.list_id) : payload.list_id
    }),
  };
  return fetchFromApi('/user/TopEmployeePerformanceAPI/', {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
  });
}

export interface NewITTodayCallListPayload {
  list_id?: number | string;
  assigned_to?: number | string;
  status?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Fetches today's call list.
 * Endpoint: POST /user/NewITTodayCallListAPI/
 */
export async function fetchNewITTodayCallList(
  payload: NewITTodayCallListPayload
): Promise<any> {
  const bodyPayload = {
    ...payload,
    ...(payload.assigned_to !== undefined && {
      assigned_to: !isNaN(Number(payload.assigned_to)) ? Number(payload.assigned_to) : payload.assigned_to
    }),
    ...(payload.list_id !== undefined && {
      list_id: !isNaN(Number(payload.list_id)) ? Number(payload.list_id) : payload.list_id
    }),
  };
  return fetchFromApi('/user/NewITTodayCallListAPI/', {
    method: 'POST',
    body: JSON.stringify(bodyPayload),
  });
}
