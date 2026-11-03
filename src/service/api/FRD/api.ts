import { fetchFromApi } from '@/service/apiClient';

export interface FRDDocumentPayload {
  id?: number;
  Organization_Id?: number;
  Project_Id?: number;
  BRD_Id?: number;
  Project_Name?: string;
  Document_Code?: string;
  Document_Title?: string;
  Document_Type?: string;
  Version?: string;
  Status?: string;
  Prepared_By?: number;
  Department?: string;
  Reviewers?: number[];
  Target_Audience?: string;
  Confidentiality?: string;
  Effective_Date?: string;
  Description?: string;
  Requirement_Priority?: string;
  Modules_Features?: string;
  Assumptions?: string;
  Sections?: any[];
  Created_By?: number;
  Updated_By?: number;
}

/**
 * Create a new FRD document via FRDDocumentCRUD (POST)
 */
export async function createFRDDocument(payload: FRDDocumentPayload): Promise<any> {
  return fetchFromApi('/user/FRDDocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single FRD document by ID via FRDDocumentCRUD (GET)
 */
export async function fetchFRDDocumentById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/FRDDocumentCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch FRD document by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/FRDDocumentCRUD/${id}/`, {
      method: 'GET',
    });
  }
}

/**
 * Update an FRD document fully via FRDDocumentCRUD (PUT)
 */
export async function updateFRDDocument(id: number | string, payload: FRDDocumentPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/FRDDocumentCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/FRDDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/FRDDocumentCRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Update an FRD document partially via FRDDocumentCRUD (PATCH)
 */
export async function patchFRDDocument(id: number | string, payload: Partial<FRDDocumentPayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/FRDDocumentCRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/FRDDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/FRDDocumentCRUD/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete an FRD document via FRDDocumentCRUD (DELETE)
 */
export async function deleteFRDDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/FRDDocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/FRDDocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

export async function fetchFRDDocumentList(params: {
  page?: number;
  Project_Id?: number | string;
  Status?: string;
  search?: string;
} = {}): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', String(params.page));
  if (params.Project_Id && params.Project_Id !== 'All') queryParams.append('Project_Id', String(params.Project_Id));
  if (params.Status && params.Status !== 'All') queryParams.append('Status', params.Status);
  if (params.search) queryParams.append('search', params.search);

  return fetchFromApi(`/user/FRDDocumentList/?${queryParams.toString()}`, {
    method: 'GET',
  });
}

/**
 * Fetch FRD documents list without pagination (GET /user/FRDDocumentListwithoutpagination/)
 */
export async function fetchFRDDocumentListWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/FRDDocumentListwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * Search FRD documents (GET /user/FRDDocumentSearch/?search=...)
 */
export async function searchFRDDocuments(search: string): Promise<any> {
  return fetchFromApi(`/user/FRDDocumentSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * Filter FRD documents (POST /user/FRDDocumentFilter/)
 */
export async function filterFRDDocuments(payload: {
  Project_Id?: number;
  BRD_Id?: number;
  Document_Title?: string;
  Document_Type?: string;
  Prepared_By?: number;
  Status?: string;
  Department?: string;
  Confidentiality?: string;
  Version?: string;
  Requirement_Priority?: string;
  Modules_Features?: string;
  page?: number;
}): Promise<any> {
  return fetchFromApi('/user/FRDDocumentFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function generateFRDDocument(id: number): Promise<any> {
  return fetchFromApi('/user/GenerateFRDDocumentAPIView/', {
    method: 'POST',
    body: JSON.stringify({ FRDDocument_Id: id }),
  });
}

