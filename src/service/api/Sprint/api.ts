import { fetchFromApi } from '@/service/apiClient';

export interface SprintFilterPayload {
  Sprint_Name?: string;
  Sprint_Owner?: string;
  Sprint_Type?: string;
  Sprint_Goal?: string;
  Date?: [string, string];
  page?: number;
  [key: string]: any;
}

export interface NewITSprintListPayload {
  organization_id: number;
  project_id?: number;
  sprint_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface NewITSprintDashboardCardPayload {
  organization_id: number;
  project_id: number;
}

/**
 * POST request for SprintFilter
 */
export async function filterSprint(payload: SprintFilterPayload): Promise<any> {
  return fetchFromApi('/user/SprintFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for SprintSearch
 */
export async function searchSprint(searchQuery: string): Promise<any> {
  return fetchFromApi(`/user/SprintSearch/?search=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
  });
}

/**
 * POST request for NewITSprintList
 */
export async function fetchNewITSprintList(payload: NewITSprintListPayload): Promise<any> {
  return fetchFromApi('/user/NewITSprintList/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for NewITSprintDashboardCard
 */
export async function fetchNewITSprintDashboardCard(payload: NewITSprintDashboardCardPayload): Promise<any> {
  return fetchFromApi('/user/NewITSprintDashboardCard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface SprintPayload {
  id?: number | string;
  Sprint_Name?: string;
  Sprint_Goal?: string;
  Sprint_Type?: string;
  Sprint_Owner?: number;
  Duration?: string | number;
  Velocity?: number;
  Description?: string;
  Start_Date?: string;
  End_Date?: string;
  Status?: string;
  Progress_percentage?: number;
  Working_Days?: string | string[];
  Team_Members?: string | any[];
  Project_Id?: number | string;
  Organization_Id?: number;
  [key: string]: any;
}

/**
 * GET request for a specific Sprint
 */
export async function getSprint(id: string | number): Promise<any> {
  return fetchFromApi(`/user/SprintCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * POST request to create a Sprint
 */
export async function createSprint(payload: SprintPayload): Promise<any> {
  return fetchFromApi('/user/SprintCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PUT request to update a Sprint
 */
export async function updateSprint(payload: SprintPayload): Promise<any> {
  return fetchFromApi('/user/SprintCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE request to delete a Sprint
 */
export async function deleteSprint(id: string | number): Promise<any> {
  return fetchFromApi(`/user/SprintCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * GET request for SprintListwithPagination
 */
export async function fetchSprintListWithPagination(page: number = 1): Promise<any> {
  return fetchFromApi(`/user/SprintListwithPagination/?page=${page}`, {
    method: 'GET',
  });
}

// ==========================================
// SPRINT BACKLOG APIs
// ==========================================

export interface SprintBacklogPayload {
  id?: number | string;
  WorkflowStage_Id?: number | string | null;
  Sprint?: number | string | null;
  Story_Type?: string | null;
  Project_Id?: number | string | null;
  Assignee_Resource?: number | string | null;
  Priority?: string | null;
  Story_Title?: string | null;
  Story_Point?: number | null;
  Labels?: any[] | null;
  Description?: string | null;
  Sprint_Attachments?: any[] | null;
  Acceptance_Criteria?: any[] | null;
  Linked_Task?: string | null;
  Deliverable_Name?: string;
  Deliverable_Id?: any[];
  Assigned_To?: number | string | null;
  Status?: string;
  Estimate_Hours?: number;
  Actual_Hours?: number;
  Is_Deleted?: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

export async function fetchSprintBacklogList(sprintId?: string | number): Promise<any> {
  // If a sprintId is provided, you might append ?Sprint=sprintId
  const url = sprintId ? `/user/SprintBacklogCRUD/?Sprint=${sprintId}` : '/user/SprintBacklogCRUD/';
  return fetchFromApi(url, {
    method: 'GET',
  });
}

export async function fetchSprintBacklogListPaginated(page: number = 1): Promise<any> {
  return fetchFromApi(`/user/SprintBacklogListwithPagination/?page=${page}`, {
    method: 'GET',
  });
}

export async function fetchSprintBacklogBySprintId(sprintId: string | number): Promise<any> {
  return fetchFromApi(`/user/SprintBacklogBySprintListAPI/?Sprint_Id=${sprintId}`, {
    method: 'GET',
  });
}

export async function fetchSprintBacklogSearch(search: string): Promise<any> {
  return fetchFromApi(`/user/SprintBacklogSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

export async function fetchSprintBacklogFilter(status: string, page: number = 1): Promise<any> {
  return fetchFromApi('/user/SprintBacklogFilter/', {
    method: 'POST',
    body: JSON.stringify({ Status: status, page }),
  });
}

export async function createSprintBacklog(payload: SprintBacklogPayload): Promise<any> {
  return fetchFromApi('/user/SprintBacklogCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSprintBacklog(payload: SprintBacklogPayload): Promise<any> {
  return fetchFromApi('/user/SprintBacklogCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function patchUpdateSprintBacklog(payload: SprintBacklogPayload): Promise<any> {
  return fetchFromApi('/user/SprintBacklogCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteSprintBacklog(id: string | number): Promise<any> {
  return fetchFromApi(`/user/SprintBacklogCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

