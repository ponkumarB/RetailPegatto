import { fetchFromApi } from '@/service/apiClient';

export interface Milestone {
  Name: string;
  Date: string;
}

export interface TimelineData {
  Phase: string;
  Start: string;
  End: string;
}

export interface ResourcePlan {
  Role: string;
  Count: number;
}

export interface BudgetSummary {
  Category: string;
  Amount: number;
}

export interface ProjectPlanDocumentPayload {
  id?: number;
  ProjectPlanDocument_Id?: string;
  Organization_Id?: number;
  Project_Id?: number;
  Project_Manager?: number;
  Project_Name?: string;
  Project_Code?: string;
  Client_Name?: string;
  Project_Sponsor?: string;
  Start_Date?: string;
  End_Date?: string;
  Duration_Months?: number;
  Project_Type?: string;
  Methodology?: string;
  Project_Location?: string;
  Currency?: string;
  In_Scope?: string[];
  Out_Of_Scope?: string[];
  Key_Deliverables?: string[];
  WBS_Template?: string;
  Resource_Template?: string;
  Working_Days_Per_Week?: number;
  Hours_Per_Day?: number;
  Risk_Level?: string;
  Milestones?: Milestone[];
  Timeline_Data?: TimelineData[];
  Resource_Plan?: ResourcePlan[];
  Budget_Summary?: BudgetSummary[];
  Total_Budget?: number;
  Document_Version?: string;
  Status?: string;
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
 * Create a new Project Plan Document (POST)
 */
export async function createProjectPlanDocument(payload: ProjectPlanDocumentPayload): Promise<any> {
  return fetchFromApi('/user/ProjectPlanDocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single Project Plan Document by ID (GET)
 */
export async function fetchProjectPlanDocumentById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ProjectPlanDocumentCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch Project Plan by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ProjectPlanDocumentCRUD/${id}/`, {
      method: 'GET',
    });
  }
}

/**
 * Update an existing Project Plan Document fully (PUT)
 */
export async function updateProjectPlanDocument(id: number | string, payload: ProjectPlanDocumentPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/ProjectPlanDocumentCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/ProjectPlanDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ProjectPlanDocumentCRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Partially update a Project Plan Document (PATCH)
 */
export async function patchProjectPlanDocument(id: number | string, payload: Partial<ProjectPlanDocumentPayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/ProjectPlanDocumentCRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/ProjectPlanDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ProjectPlanDocumentCRUD/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete a Project Plan Document by ID (DELETE)
 */
export async function deleteProjectPlanDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ProjectPlanDocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ProjectPlanDocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

/**
 * List Project Plan Documents with Pagination (GET)
 */
export async function fetchProjectPlanDocumentsWithPagination(page?: number): Promise<PaginatedResponse<any>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/ProjectPlanDocumentListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * List Project Plan Documents without Pagination (GET)
 */
export async function fetchProjectPlanDocumentsWithoutPagination(): Promise<any[]> {
  return fetchFromApi('/user/ProjectPlanDocumentlistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Search Project Plan Documents (GET)
 */
export async function searchProjectPlanDocuments(search: string): Promise<any[]> {
  return fetchFromApi(`/user/ProjectPlanDocumentSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * Filter Project Plan Documents (POST or GET with body fallback)
 */
export interface ProjectPlanDocumentFilterPayload {
  Project_Name?: string;
}
export async function filterProjectPlanDocuments(payload: ProjectPlanDocumentFilterPayload): Promise<any[]> {
  try {
    return await fetchFromApi('/user/ProjectPlanDocumentFilter/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn(`POST for ProjectPlanDocumentFilter failed, trying GET fallback:`, error);
    return fetchFromApi('/user/ProjectPlanDocumentFilter/', {
      method: 'GET',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Generate PDF for a Project Plan Document (POST)
 */
export async function generateProjectPlanDocumentPDF(id: number | string): Promise<any> {
  return fetchFromApi('/user/GenerateProjectPlanDocumentAPIView/', {
    method: 'POST',
    body: JSON.stringify({ ProjectPlanDocument_Id: typeof id === 'string' ? parseInt(id, 10) : id }),
  });
}

