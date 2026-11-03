import { fetchFromApi, getTenantName, BASE_URL } from '@/service/apiClient';

/**
 * Decodes the logged-in user ID from the JWT token in localStorage.
 */
export function getLoggedInUserId(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const token = localStorage.getItem('token');
  if (!token) return undefined;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(window.atob(parts[1]));
      return payload.user_id ? Number(payload.user_id) : undefined;
    }
  } catch (e) {
    console.error('Failed to parse JWT token', e);
  }
  return undefined;
}

/**
 * Fetches all clients onboarding list without pagination.
 * Reused in contacts dropdown for "Account Name".
 * Endpoint: GET /user/ClientMasterwithoutpagination/
 */
export async function fetchClientMasterWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/ClientMasterwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * Fetches all contacts without pagination.
 * Endpoint: GET /user/Contactlistwithoutpagination/
 */
export async function fetchContactListWithoutPagination(createdBy?: number): Promise<any> {
  const query = createdBy !== undefined && createdBy !== null ? `?Created_By=${createdBy}` : '';
  return fetchFromApi(`/user/Contactlistwithoutpagination/${query}`, {
    method: 'GET',
  });
}



/**
 * Interface representing the Contact data model in the backend database.
 */
export interface ContactModel {
  id?: number;
  Contact_Id?: string;
  Organization_Id?: number;
  Account_Id?: number | null;
  Name?: string;
  FirstName?: string;
  LastName?: string;
  Gender?: string;
  Company_Name?: string;
  MobileCountry_Id?: string;
  Mobile_Number?: string;
  AlternatePhoneNo?: string;
  Email_Id?: string;
  Job_Title?: string;
  Department?: string;
  DateOfBirth?: string;
  Address?: string;
  Country?: string;
  State?: string;
  City?: string;
  Pincode?: string;
  Industry_Type?: string;
  LeadSource?: string;
  Contact_Owner?: string | any;
  Contact_Owner_Id?: number;
  Reportingto_Id?: number | any | null;
  Tags?: string[] | string;
  Description?: string;
  No_of_Calls?: string;
  Last_Call_Date?: string;
  Last_Called_By?: string;
  No_Of_Days?: string;
  Lead_Flag?: boolean;
  Archive?: boolean;
  Is_Favorites?: boolean;
  Callconnected?: boolean;
  Active_Flag?: boolean;
  Status?: string;
  Contact_Json?: {
    Source?: string;
    Campaign?: string;
    Interest?: string;
    Remarks?: string;
    [key: string]: any;
  } | null;
  Created_By?: number | any;
  Updated_By?: number | any;
  Created_Date?: string;
  Updated_Date?: string;
  File?: string;
  FileName?: string;
  User_Photo?: string;
}

/**
 * Filter payload structure for filtering contacts.
 */
export interface ContactFilterPayload {
  FirstName?: string;
  LastName?: string;
  Company_Name?: string;
  Email_Id?: string;
  Mobile_Number?: string;
  Job_Title?: string;
  Contact_Owner?: string;
  LeadSource?: string;
  Contact_Id?: string;
  Created_By?: string;
  Created_Date?: [string, string]; // [StartDate, EndDate]
  page: number;
  Is_Favorites?: boolean;
  Status?: string;
}

/**
 * Dashboard KPI card structure.
 */
export interface ContactDashboardCard {
  Metric: string;
  Count: number;
}

/**
 * Generic response type for Django REST framework pagination.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Fetches all contacts (optionally filtered by creator for "My Contacts").
 * Endpoint: GET /user/ContactAdditional/?page=X&Created_By=Y
 */
export async function fetchContactsList(page: number, createdBy?: number): Promise<PaginatedResponse<ContactModel>> {
  const query = new URLSearchParams({ page: String(page) });
  if (createdBy !== undefined && createdBy !== null) {
    query.append('Created_By', String(createdBy));
  }
  return fetchFromApi(`/user/ContactAdditional/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Fetches recently added contacts for a user.
 * Endpoint: GET /user/RecentlyAddedContacts/?Created_By=Y&page=X
 */
export async function fetchRecentlyAddedContacts(page: number, createdBy: number): Promise<PaginatedResponse<ContactModel>> {
  const query = new URLSearchParams({ page: String(page), Created_By: String(createdBy) });
  return fetchFromApi(`/user/RecentlyAddedContacts/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Fetches favorite contacts for a user.
 * Endpoint: GET /user/FavoriteContacts/?page=X
 */
export async function fetchFavoriteContacts(page: number = 1): Promise<PaginatedResponse<ContactModel>> {
  const query = new URLSearchParams({ page: String(page) });
  return fetchFromApi(`/user/FavoriteContacts/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Searches contacts.
 * Endpoint: GET /user/ContactSearch/?search=XYZ&page=X&Created_By=Y&Is_Favorites=True&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 */
export async function searchContacts(
  search: string,
  page: number,
  createdBy?: number,
  isFavorites?: boolean,
  fromDate?: string,
  toDate?: string
): Promise<PaginatedResponse<ContactModel>> {
  const query = new URLSearchParams({ search, page: String(page) });
  if (createdBy !== undefined && createdBy !== null) {
    query.append('Created_By', String(createdBy));
  }
  if (isFavorites) {
    query.append('Is_Favorites', 'True');
  }
  if (fromDate) {
    query.append('from_date', fromDate);
  }
  if (toDate) {
    query.append('to_date', toDate);
  }
  return fetchFromApi(`/user/ContactSearch/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Filters contacts based on advanced criteria.
 * Endpoint: POST /user/ContactFilter/
 */
export async function filterContacts(payload: ContactFilterPayload): Promise<PaginatedResponse<ContactModel>> {
  return fetchFromApi('/user/ContactFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches contact dashboard KPI stats.
 * Endpoint: GET /user/ContactDashboardCards/
 */
export async function fetchContactDashboardCards(filterBody?: any): Promise<ContactDashboardCard[]> {
  // If the endpoint accepts filter body, pass it, otherwise call simple GET
  return fetchFromApi('/user/ContactDashboardCards/', {
    method: 'GET',
    ...(filterBody ? { body: JSON.stringify(filterBody) } : {}),
  });
}

/**
 * Fetches contact details by primary key ID.
 * Endpoint: GET /user/ContactCRUD/?id=X
 */
export async function fetchContactDetails(id: number): Promise<ContactModel> {
  return fetchFromApi(`/user/ContactCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Creates a new contact record.
 * Endpoint: POST /user/ContactCRUD/
 */
export async function createContact(payload: ContactModel): Promise<ContactModel> {
  return fetchFromApi('/user/ContactCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing contact record.
 * Endpoint: PUT /user/ContactCRUD/
 */
export async function updateContact(payload: Partial<ContactModel> & { id: number }): Promise<ContactModel> {
  return fetchFromApi('/user/ContactCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a contact record by primary key ID.
 * Endpoint: DELETE /user/ContactCRUD/?id=X
 */
export async function deleteContact(id: number): Promise<any> {
  return fetchFromApi(`/user/ContactCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Downloads the contact XLSX import template.
 * Bypasses json() parse in fetchFromApi to support raw binary file download.
 * Endpoint: GET /user/DownloadContactTemplate/
 */
export async function downloadContactTemplate(): Promise<Blob> {
  const tenant = getTenantName();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/${tenant}/user/DownloadContactTemplate/`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    throw new Error(`Failed to download contact template: ${res.statusText}`);
  }
  return res.blob();
}

/**
 * Uploads/imports contacts using the XLSX template.
 * Bypasses fetchFromApi to avoid setting application/json Content-Type (which would prevent browser from injecting multipart boundary).
 * Endpoint: POST /user/UploadContactTemplate/
 */
export async function uploadContactTemplate(formData: FormData): Promise<any> {
  const tenant = getTenantName();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}/${tenant}/user/UploadContactTemplate/`, {
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
