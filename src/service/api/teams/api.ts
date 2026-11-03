import { fetchFromApi } from '@/service/apiClient';

export interface ITUserTeamsCRUDPayload {
  id?: number;
  Team_Name: string;
  Team_Code: string;
  Description?: string;
  Department: string;
  Team_Lead: number | string;
  Team_Members: (number | string)[];
  Status: string;
  Organization_Id: number | string;
  Created_By?: number | string;
  Updated_By?: number | string;
}

export interface ITUserTeamsFilterPayload {
  Team_Name?: string;
  Team_Code?: string;
  Department?: string;
  Status?: string;
  Team_Lead?: number | string | null;
  Organization_Id?: number | string;
  Created_By?: number | string | null;
  page?: number;
}

/**
 * Create Team
 * Endpoint: POST /user/ITUserTeamsCRUD/
 */
export async function createITUserTeam(payload: ITUserTeamsCRUDPayload): Promise<any> {
  return fetchFromApi('/user/ITUserTeamsCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update Team (PUT triggers update on the same CRUD endpoint)
 * Endpoint: PUT /user/ITUserTeamsCRUD/
 */
export async function updateITUserTeam(payload: ITUserTeamsCRUDPayload & { id: number }): Promise<any> {
  return fetchFromApi('/user/ITUserTeamsCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete Team by ID
 * Endpoint: DELETE /user/ITUserTeamsCRUD/?id=X
 */
export async function deleteITUserTeam(id: number | string): Promise<any> {
  return fetchFromApi(`/user/ITUserTeamsCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetch a single Team by ID
 * Endpoint: GET /user/ITUserTeamsList/?id=X
 */
export async function fetchITUserTeamById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/ITUserTeamsList/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Fetch IT User Teams List (Paginated)
 * Endpoint: GET /user/ITUserTeamsList/
 */
export async function fetchITUserTeamsList(params?: Record<string, string | number>): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        queryParams.append(key, String(val));
      }
    });
  }
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromApi(`/user/ITUserTeamsList/${query}`, {
    method: 'GET',
  });
}

/**
 * Fetch IT User Teams List (Without Pagination)
 * Endpoint: GET /user/ITUserTeamsListwithoutpagination/
 */
export async function fetchITUserTeamsListWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/ITUserTeamsListwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * Search IT User Teams
 * Endpoint: GET /user/ITUserTeamsSearch/
 */
export async function searchITUserTeams(searchQuery: string): Promise<any> {
  return fetchFromApi(`/user/ITUserTeamsSearch/?search=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
  });
}

/**
 * Filter IT User Teams
 * Endpoint: POST /user/ITUserTeamsFilter/
 */
export async function filterITUserTeams(payload: ITUserTeamsFilterPayload): Promise<any> {
  return fetchFromApi('/user/ITUserTeamsFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch IT User Teams Cards
 * Endpoint: POST /user/ITUserTeamsCards/
 */
export async function fetchITUserTeamsCards(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITUserTeamsCards/', {
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}

/**
 * Fetch IT User Teams by Department
 * Endpoint: POST /user/ITUserTeamsTeamByDepartment/
 */
export async function fetchITUserTeamsTeamByDepartment(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITUserTeamsTeamByDepartment/', {
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}

/**
 * Fetch IT User Teams All Teams
 * Endpoint: POST /user/ITUserTeamsAllTeams/
 */
export async function fetchITUserTeamsAllTeams(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITUserTeamsAllTeams/', {
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}

/**
 * Fetch IT User Teams Recent Activities
 * Endpoint: POST /user/ITUserTeamsRecentActivites/
 */
export async function fetchITUserTeamsRecentActivities(organizationId: number | string): Promise<any> {
  return fetchFromApi('/user/ITUserTeamsRecentActivites/', {
    method: 'POST',
    body: JSON.stringify({ organization_id: Number(organizationId) }),
  });
}
