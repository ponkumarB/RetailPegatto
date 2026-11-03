import { fetchFromApi } from '@/service/apiClient';

export interface ITUserGroupCRUDPayload {
  id?: number;
  UserTeams_Id?: string;
  Group_Name: string;
  Group_Type: string;
  Description?: string;
  Teams: (number | string)[];
  Status: string;
  Organization_Id: number | string;
  Created_By?: number | string;
  Updated_By?: number | string;
}

export interface ITUserGroupFilterPayload {
  Group_Name?: string;
  Group_Type?: string;
  Status?: string;
  Organization_Id: number | string;
  Created_By?: number | string | null;
  page?: number;
}

/**
 * Fetch IT User Groups List
 * Endpoint: GET /user/ITUserGroupList/
 */
export async function fetchITUserGroupList(params?: { Organization_Id?: string | number; page?: number }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.Organization_Id) query.append('Organization_Id', String(params.Organization_Id));
  if (params?.page) query.append('page', String(params.page));
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchFromApi(`/user/ITUserGroupList/${queryString}`, {
    method: 'GET',
  });
}

/**
 * Fetch IT User Groups List (Without Pagination)
 * Endpoint: GET /user/ITUserGroupListwithoutpagination/
 */
export async function fetchITUserGroupListWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/ITUserGroupListwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * Search IT User Groups
 * Endpoint: GET /user/ITUserGroupSearch/
 */
export async function searchITUserGroup(searchQuery: string): Promise<any> {
  return fetchFromApi(`/user/ITUserGroupSearch/?search=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
  });
}

/**
 * Filter IT User Groups
 * Endpoint: POST /user/ITUserGroupFilter/
 */
export async function filterITUserGroup(payload: ITUserGroupFilterPayload): Promise<any> {
  return fetchFromApi('/user/ITUserGroupFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Create User Group
 * Endpoint: POST /user/ITUserGroupCRUD/
 */
export async function createITUserGroup(payload: ITUserGroupCRUDPayload): Promise<any> {
  return fetchFromApi('/user/ITUserGroupCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update User Group
 * Endpoint: PUT /user/ITUserGroupCRUD/
 */
export async function updateITUserGroup(payload: ITUserGroupCRUDPayload & { id: number }): Promise<any> {
  return fetchFromApi('/user/ITUserGroupCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete User Group by ID
 * Endpoint: DELETE /user/ITUserGroupCRUD/?id=X
 */
export async function deleteITUserGroup(id: number | string): Promise<any> {
  return fetchFromApi(`/user/ITUserGroupCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch a single User Group by ID
 * Endpoint: GET /user/ITUserGroupList/?id=X
 */
export async function fetchITUserGroupById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/ITUserGroupList/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Fetch IT User Group Dashboard Cards
 * Endpoint: POST /user/ITUserGroupDashboardcards/
 */
export async function fetchITUserGroupDashboardCards(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITUserGroupDashboardcards/', {
    // Note: The endpoint case matches Postman: ITUserGroupDashboardcards
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}

/**
 * Fetch IT User Group Type Chart
 * Endpoint: POST /user/ITUserGroupTypeChart/
 */
export async function fetchITUserGroupTypeChart(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITUserGroupTypeChart/', {
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}

/**
 * Fetch IT User Group Overall List
 * Endpoint: POST /user/ITUserGroupOverallList/
 */
export async function fetchITUserGroupOverallList(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITUserGroupOverallList/', {
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}

/**
 * Fetch IT Top Groups
 * Endpoint: POST /user/ITTopGroups/
 */
export async function fetchITTopGroups(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITTopGroups/', {
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}

/**
 * Fetch IT Recent Group Activity
 * Endpoint: POST /user/ITRecentGroupActivity/
 */
export async function fetchITRecentGroupActivity(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITRecentGroupActivity/', {
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}
