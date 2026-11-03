import { fetchFromApi } from '@/service/apiClient';

export interface Stakeholder {
  Name: string;
  Role: string;
}

export interface TimelineData {
  Phase: string;
  Start_Date: string;
  End_Date: string;
}

export interface ResourcePlan {
  Role: string;
  Count: number;
}

export interface BudgetSummary {
  Category: string;
  Amount: number;
}

export interface PIDDocumentPayload {
  id?: number;
  ProjectInitiationDocument_Id?: string;
  Organization_Id?: number;
  Project_Id?: number;
  Project_Manager?: number;
  Project_Name?: string;
  Project_Code?: string;
  Client_Name?: string;
  Project_Sponsor?: string;
  Start_Date?: string;
  End_Date?: string;
  Estimated_Duration?: string;
  Estimated_Budget?: number;
  Currency?: string;
  Stakeholders?: Stakeholder[];
  Project_Objectives?: string[];
  Business_Justification?: string;
  In_Scope?: string[];
  Out_Of_Scope?: string[];
  Success_Criteria?: string[];
  Timeline?: TimelineData[];
  Resources_Summary?: ResourcePlan[];
  Budget_Summary?: BudgetSummary[];
  Total_Estimated_Budget?: number;
  Version?: string;
  Document_Status?: string;
  Generated_On?: string;
  Remarks?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Create a new Project Initiation Document (POST)
 */
export async function createProjectInitiationDocument(payload: PIDDocumentPayload): Promise<any> {
  return fetchFromApi('/user/ProjectInitiationDocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single Project Initiation Document by ID (GET)
 */
export async function fetchProjectInitiationDocumentById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ProjectInitiationDocumentCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch PID by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ProjectInitiationDocumentCRUD/${id}/`, {
      method: 'GET',
    });
  }
}

/**
 * Update an existing Project Initiation Document fully (PUT)
 */
export async function updateProjectInitiationDocument(id: number | string, payload: PIDDocumentPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/ProjectInitiationDocumentCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/ProjectInitiationDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ProjectInitiationDocumentCRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Partially update a Project Initiation Document (PATCH)
 */
export async function patchProjectInitiationDocument(id: number | string, payload: Partial<PIDDocumentPayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/ProjectInitiationDocumentCRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/ProjectInitiationDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ProjectInitiationDocumentCRUD/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete a Project Initiation Document by ID (DELETE)
 */
export async function deleteProjectInitiationDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ProjectInitiationDocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ProjectInitiationDocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

/**
 * List Project Initiation Documents with Pagination (GET)
 */
export async function fetchProjectInitiationDocumentsWithPagination(page?: number): Promise<PaginatedResponse<any>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/ProjectInitiationDocumentListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * List Project Initiation Documents without Pagination (GET)
 */
export async function fetchProjectInitiationDocumentsWithoutPagination(): Promise<any[]> {
  return fetchFromApi('/user/ProjectInitiationDocumentlistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Search Project Initiation Documents (GET)
 */
export async function searchProjectInitiationDocuments(search: string): Promise<any[]> {
  return fetchFromApi(`/user/ProjectInitiationDocumentSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * Filter Project Initiation Documents
 */
export interface ProjectInitiationDocumentFilterPayload {
  Project_Name?: string;
}
export async function filterProjectInitiationDocuments(payload: ProjectInitiationDocumentFilterPayload): Promise<any[]> {
  try {
    return await fetchFromApi('/user/ProjectInitiationDocumentFilter/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn(`POST for ProjectInitiationDocumentFilter failed, trying GET fallback:`, error);
    return fetchFromApi('/user/ProjectInitiationDocumentFilter/', {
      method: 'GET',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Generate PDF Project Initiation Document (POST)
 */
export async function generateProjectInitiationDocument(id: number | string): Promise<any> {
  return fetchFromApi('/user/GenerateProjectInitiationDocumentAPIView/', {
    method: 'POST',
    body: JSON.stringify({ ProjectInitiationDocument_Id: typeof id === 'string' ? parseInt(id, 10) : id }),
  });
}
