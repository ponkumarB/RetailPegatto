import { fetchFromApi } from '@/service/apiClient';

export interface CreateResourcetrackingapiviewPayload {
  page?: number;
  start_date?: string;
  end_date?: string;
  project_id?: string | number;
  location?: string;
  department?: string;
  status?: string;
}

export interface CreateResourceutilisationapiviewPayload {
  page?: number;
  start_date?: string;
  end_date?: string;
  project_id?: string | number;
  department?: string;
  role?: string;
  location?: string;
  status?: string;
  search?: string;
}

export interface CreateResourceutilizationcapacitydashboardPayload {
}

export interface CreateResourcecapacitydashboardapiviewPayload {
}

/**
 * POST request for ResourceTrackingAPIView
 */
export async function createResourceapi(payload: CreateResourcetrackingapiviewPayload): Promise<any> {
  return fetchFromApi('/user/ResourceCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for ResourceTrackingAPIView
 */
export async function createResourcetrackingapiview(payload: CreateResourcetrackingapiviewPayload): Promise<any> {
  return fetchFromApi('/user/ResourceTrackingAPIView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for ResourceUtilisationAPIView
 */
export async function createResourceutilisationapiview(payload: CreateResourceutilisationapiviewPayload): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationAPIView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for ResourceUtilizationCapacityDashboard
 */
export async function createResourceutilizationcapacitydashboard(payload: CreateResourceutilizationcapacitydashboardPayload): Promise<any> {
  return fetchFromApi('/user/ResourceUtilizationCapacityDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for ResourceCapacityDashboardAPIView
 */
export async function createResourcecapacitydashboardapiview(payload: CreateResourcecapacitydashboardapiviewPayload): Promise<any> {
  return fetchFromApi('/user/ResourceCapacityDashboardAPIView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// New Resource CRUD & Search/Filter Endpoints
// ============================================================================

export interface ResourceFilterPayload {
  Name?: string;
  Designation?: string;
  fromdate?: string;
  todate?: string;
  page?: number;
}

/**
 * Fetch resources from ResourceAdditional (lists active resources ordered by -Created_Date)
 */
export async function fetchResourcesList(params?: { page?: number }): Promise<any> {
  const query = params?.page ? `?page=${params.page}` : '';
  return fetchFromApi(`/user/ResourceAdditional/${query}`, {
    method: 'GET',
  });
}

/**
 * Search resources by name or designation
 */
export async function searchResources(search: string): Promise<any> {
  return fetchFromApi(`/user/Resourcesearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * Filter resources by Name, Designation, and Date Range
 */
export async function filterResources(params: ResourceFilterPayload): Promise<any> {
  const query = new URLSearchParams();
  if (params.Name) query.set('Name', params.Name);
  if (params.Designation) query.set('Designation', params.Designation);
  if (params.fromdate) query.set('fromdate', params.fromdate);
  if (params.todate) query.set('todate', params.todate);
  if (params.page) query.set('page', String(params.page));
  return fetchFromApi(`/user/ResourceFilter/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Fetch a single resource detail by ID
 */
export async function fetchResourceById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/ResourceCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Create a new resource
 */
export async function createResource(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing resource
 */
export async function updateResource(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a resource by ID
 */
export async function deleteResourceApi(id: number | string): Promise<any> {
  return fetchFromApi(`/user/ResourceCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch Resource Employee List (just names)
 */
export async function fetchResourceEmployeeList(): Promise<any> {
  return fetchFromApi('/user/ResourceEmployeeList/', {
    method: 'GET',
  });
}

/**
 * Upload User File to UserFilesandUrlsCRUD
 */
export async function uploadUserFile(fileName: string, base64Data: string): Promise<any> {
  return fetchFromApi('/user/UserFilesandUrlsCRUD/', {
    method: 'POST',
    body: JSON.stringify({
      FileName: fileName,
      File: base64Data,
    }),
  });
}

/**
 * Delete User File from UserFilesandUrlsCRUD
 */
export async function deleteUserFile(id: number | string): Promise<any> {
  return fetchFromApi(`/user/UserFilesandUrlsCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch User File by FileName from UserFilesandUrlsCRUD
 */
export async function fetchUserFile(id: string): Promise<any> {
  return fetchFromApi(`/user/UserFilesandUrlsGetById/?id=${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}

/**
 * Fetch dynamic dropdown list from Userlookupsearch
 */
export async function fetchDropDownList(search: string = ''): Promise<any> {
  return fetchFromApi(`/useradmin/Userlookupsearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * Fetch User Lookup List with Pagination (GET)
 */
export async function fetchUserLookupListWithPagination(page: number = 1, pageSize: number = 100): Promise<any> {
  return fetchFromApi(`/useradmin/Userlookuplistwithpagination/?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
  });
}

/**
 * Create a new Lookup (POST)
 */
export async function createUserLookup(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/Userlookup/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing Lookup (PUT)
 */
export async function updateUserLookup(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/Userlookup/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a Lookup by ID (DELETE)
 */
export async function deleteUserLookup(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/Userlookup/?id=${id}`, {
    method: 'DELETE',
  });
}


/**
 * Create a new resource allocation (POST)
 */
export async function createResourceAllocation(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceallocationCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get a single resource allocation details by ID
 */
export async function getResourceAllocation(id: string | number): Promise<any> {
  return fetchFromApi(`/user/ResourceallocationCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing resource allocation (PUT)
 */
export async function updateResourceAllocation(id: string | number, payload: any): Promise<any> {
  return fetchFromApi(`/user/ResourceallocationCRUD/?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a resource allocation by ID
 */
export async function deleteResourceAllocation(id: string | number): Promise<any> {
  return fetchFromApi(`/user/ResourceallocationCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch Resource Allocation List with pagination (GET)
 */
export async function fetchResourceAllocationList(): Promise<any> {
  return fetchFromApi('/user/ResourceallocationList/', {
    method: 'GET',
  });
}

/**
 * Fetch Resource Allocation list without pagination (GET)
 */
export async function fetchResourceAllocationWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/Resourceallocationwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * Fetch Resource Allocation Dashboard stats (POST)
 */
export async function fetchResourceAllocationDashboard(payload: any): Promise<any> {
  return fetchFromApi('/user/Resourseallocationdashboard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Resource Utilisation summary and list (POST)
 */
export async function fetchResourceUtilisation(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationAPIView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Resource Utilisation Heatmap data (POST)
 */
export async function fetchResourceUtilisationHeatmap(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationHeatmap/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Resource Utilisation Dashboard metrics (POST)
 */
export async function fetchResourceUtilisationDashboard(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Resource Utilisation Trend (POST)
 */
export async function fetchResourceUtilisationTrend(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationTrend/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Resource Utilisation View (POST)
 */
export async function fetchResourceUtilisationView(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Top Under Utilised Resources (POST)
 */
export async function fetchTopUnderUtilisedResources(payload: any): Promise<any> {
  return fetchFromApi('/user/TopUnderUtilisedResources/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Resource Utilisation Insights (POST)
 */
export async function fetchResourceUtilisationInsights(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationInsights/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Resource Utilisation By Project (POST)
 */
export async function fetchResourceUtilisationByProject(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationByProject/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Top Over Utilised Resources (POST)
 */
export async function fetchTopOverUtilisedResources(payload: any): Promise<any> {
  return fetchFromApi('/user/TopOverUtilisedResources/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Resource Utilisation Details (POST)
 */
export async function fetchResourceUtilisationDetails(payload: any): Promise<any> {
  return fetchFromApi('/user/ResourceUtilisationDetails/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}


