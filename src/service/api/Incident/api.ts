import { fetchFromApi } from '@/service/apiClient';

export interface IncidentManagementModel {
  id?: number;
  IncidentManagement_Id?: string;
  Requester?: number;
  Requester_Name?: string;
  Contact_Number?: string;
  Email?: string;
  Incident_Source?: string;
  Reported_On?: string;
  Affected_Service?: string;
  Related_Service?: string;
  Related_Problem?: string;
  Related_Change?: string;
  Category?: string;
  Sub_Category?: string;
  Summary?: string;
  Description?: string;
  Priority?: string;
  Impact?: string;
  Urgency?: string;
  Environment?: string;
  Assigned_To?: number;
  Assigned_Person?: string;
  Assignment_Rule?: string;
  Assignment_Notes?: string;
  Assigned_On?: string;
  Due_Date?: string;
  SLA?: string;
  Communication_Preference?: string;
  Notify_Requester?: boolean;
  Notify_Assignee?: boolean;
  Notify_Watchers?: boolean;
  Attachment?: any[];
  Status?: string;
  Resolution?: string;
  Closed_On?: string | null;
  Remarks?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Created_By?: number;
  Updated_By?: number;
  Team?: string;
}

export interface IncidentManagementListParams {
  Created_By?: number | string;
}

/**
 * GET request for IncidentManagementlistwithoutpagination
 */
export async function fetchIncidentManagementList(params?: IncidentManagementListParams): Promise<IncidentManagementModel[]> {
  const query = new URLSearchParams();
  if (params?.Created_By !== undefined && params?.Created_By !== null) {
    query.append('Created_By', String(params.Created_By));
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchFromApi(`/user/IncidentManagementlistwithoutpagination/${queryString}`, {
    method: 'GET',
  });
}

/**
 * GET request for IncidentManagementMyList — returns only incidents created by the given user.
 * Endpoint: GET /user/IncidentManagementMyList/?Created_By=<id>
 */
export async function fetchIncidentManagementMyList(createdBy: number | string): Promise<IncidentManagementModel[]> {
  return fetchFromApi(`/user/IncidentManagementMyList/?Created_By=${createdBy}`, {
    method: 'GET',
  });
}

/**
 * Fetches a single incident by ID.
 * Endpoint: GET /user/IncidentManagementCRUD/?id=X
 */
export async function fetchIncidentManagementById(id: number | string): Promise<IncidentManagementModel> {
  return fetchFromApi(`/user/IncidentManagementCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Creates a new incident.
 * Endpoint: POST /user/IncidentManagementCRUD/
 */
export async function createIncidentManagement(payload: IncidentManagementModel): Promise<any> {
  return fetchFromApi('/user/IncidentManagementCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing incident.
 * Endpoint: PUT /user/IncidentManagementCRUD/
 */
export async function updateIncidentManagement(payload: IncidentManagementModel): Promise<any> {
  return fetchFromApi('/user/IncidentManagementCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes an incident by ID.
 * Endpoint: DELETE /user/IncidentManagementCRUD/?id=X
 */
export async function deleteIncidentManagement(id: number | string): Promise<any> {
  return fetchFromApi(`/user/IncidentManagementCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Soft deletes an incident (Patch method if supported/needed by postman).
 * Endpoint: PATCH /user/IncidentManagementCRUD/
 */
export async function patchIncidentManagement(id: number, isDeleted: boolean): Promise<any> {
  return fetchFromApi('/user/IncidentManagementCRUD/', {
    method: 'PATCH',
    body: JSON.stringify({ id, Is_Deleted: isDeleted }),
  });
}

export interface IncidentManagementFilterPayload {
  IncidentManagement_Id?: string;
  Requester_Name?: string;
  Email?: string;
  Summary?: string;
  Incident_Source?: string;
  Affected_Service?: string;
  Category?: string;
  Sub_Category?: string;
  Priority?: string;
  Impact?: string;
  Urgency?: string;
  Environment?: string;
  Assigned_Person?: string;
  Status?: string;
  Reported_On?: string[];
  Created_Date?: string[];
  page?: number;
}

/**
 * POST request for IncidentManagementFilter
 */
export async function filterIncidentManagement(payload: IncidentManagementFilterPayload): Promise<any> {
  return fetchFromApi('/user/IncidentManagementFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for IncidentManagementSearch
 */
export async function searchIncidentManagement(query: string): Promise<IncidentManagementModel[]> {
  return fetchFromApi(`/user/IncidentManagementSearch/?search=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
}

/**
 * POST request for IncidentAssignementDashboardCards
 * Endpoint: POST /user/IncidentAssignementDashboardCards/
 */
export async function fetchIncidentAssignmentDashboardCards(createdBy: number | string): Promise<any> {
  return fetchFromApi('/user/IncidentAssignementDashboardCards/', {
    method: 'POST',
    body: JSON.stringify({ created_by: Number(createdBy) || 72 }),
  });
}

