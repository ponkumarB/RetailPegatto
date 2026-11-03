import { fetchFromApi, getTenantName, BASE_URL } from '@/service/apiClient';

export interface TicketManagementModel {
  id?: number;
  Organization_Id?: number;
  TicketManagement_Id?: string;
  Subject?: string;
  Ticket_Description?: string;
  Category?: string;
  Sub_Category?: string;
  Priority?: string;
  Impact?: string;
  Urgency?: string;
  Ticket_Status?: string;
  Name?: string;
  Contact_Person?: string;
  Mail_Id?: string;
  Requester_Phone?: string;
  Requester_Department?: string;
  Requester_Location?: string;
  Source?: string;
  Assigned_To?: number;
  Assigned_Person?: string;
  Backup_Assigned_To?: number;
  Team?: string;
  Remarks?: string;
  SLA?: string;
  Due_Date?: string;
  Response_Due_Date?: string;
  Resolution_Due_Date?: string;
  Start_Date?: string;
  Estimation_Hours?: number;
  Completion_Hours?: number;
  Closed_Hours?: number;
  Instance?: string;
  Related_Module?: string;
  Type?: string | null;
  Type_Name?: string;
  Ticket_Level?: string;
  Assigned_History?: any;
  Created_By?: number;
  Updated_By?: number;
  File?: string | null;
}

export interface TicketManagementSummaryParams {
  User_Id?: number | string;
}

export interface TicketManagementSearchParams {
  search: string;
  Created_By?: number | string;
  Assigned_To?: number | string;
}

/**
 * Downloads the Ticket XLSX upload template.
 * Bypasses json() parse in fetchFromApi to support raw binary file download.
 */
export async function downloadTicketUploadTemplate(): Promise<Blob> {
  const tenant = getTenantName();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/${tenant}/user/download_excel_template_TicketUpload/`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to download ticket upload template: ${res.statusText}`);
  }
  return res.blob();
}

/**
 * Uploads/imports tickets using the XLSX template.
 * Bypasses fetchFromApi to avoid setting application/json Content-Type.
 */
export async function uploadTicketManagementFile(formData: FormData): Promise<any> {
  const tenant = getTenantName();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/${tenant}/user/TicketManagement_upload/`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    let errorDetail = '';
    try {
      const errData = await res.clone().json();
      errorDetail = errData.detail || errData.message || errData.error || JSON.stringify(errData);
    } catch {
      try {
        errorDetail = await res.clone().text();
      } catch {}
    }
    throw new Error(`API error: ${res.status} ${res.statusText || ''} ${errorDetail}`.trim());
  }
  return res.json();
}

/**
 * GET request for TicketManagementSummary
 */
export async function fetchTicketManagementSummary(params?: TicketManagementSummaryParams): Promise<any> {
  const query = new URLSearchParams();
  if (params?.User_Id !== undefined && params?.User_Id !== null) {
    query.append('User_Id', String(params.User_Id));
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchFromApi(`/user/TicketManagementSummary/${queryString}`, {
    method: 'GET',
  });
}

/**
 * GET request for TicketManagementSearch
 */
export async function searchTicketManagement(params: TicketManagementSearchParams): Promise<any> {
  const query = new URLSearchParams();
  query.append('search', params.search);
  if (params.Created_By !== undefined && params.Created_By !== null) {
    query.append('Created_By', String(params.Created_By));
  }
  if (params.Assigned_To !== undefined && params.Assigned_To !== null) {
    query.append('Assigned_To', String(params.Assigned_To));
  }
  return fetchFromApi(`/user/TicketManagementSearch/?${query.toString()}`, {
    method: 'GET',
  });
}

export interface TicketManagementListPayload {
  priority?: string;
  category?: string;
  Sub_Category?: string;
  status?: string;
  assigned_to?: string | number | null;
  start_date?: string;
  end_date?: string;
  search?: string;
  page: number;
  page_size: number;
}

/**
 * POST request for TicketManagementListAPI
 */
export async function fetchTicketManagementList(payload: TicketManagementListPayload): Promise<any> {
  return fetchFromApi(`/user/TicketManagementListAPI/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Creates a new ticket.
 * Endpoint: POST /user/TicketManagementCRUD/
 */
export async function createTicketManagement(payload: TicketManagementModel): Promise<any> {
  return fetchFromApi('/user/TicketManagementCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing ticket.
 * Endpoint: PUT /user/TicketManagementCRUD/
 */
export async function updateTicketManagement(payload: TicketManagementModel): Promise<any> {
  return fetchFromApi('/user/TicketManagementCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Partially updates an existing ticket (e.g. status or priority).
 * Endpoint: PATCH /user/TicketManagementCRUD/
 */
export async function patchTicketManagement(payload: { id: number | string; [key: string]: any }): Promise<any> {
  return fetchFromApi('/user/TicketManagementCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a ticket by ID.
 * Endpoint: DELETE /user/TicketManagementCRUD/?id=X
 */
export async function deleteTicketManagement(id: number | string): Promise<any> {
  return fetchFromApi(`/user/TicketManagementCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Fetches a single ticket by ID.
 * Endpoint: GET /user/TicketManagementCRUD/?id=X
 */
export async function fetchTicketManagementById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/TicketManagementCRUD/?id=${id}`, {
    method: 'GET',
  });
}

export interface TicketSummaryReportPayload {
  user_id?: string | number | null;
  start_date?: string;
  end_date?: string;
}

/**
 * POST request for TicketSummaryReport
 */
export async function fetchTicketSummaryReport(payload: TicketSummaryReportPayload): Promise<any> {
  return fetchFromApi(`/user/TicketSummaryReport/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
