import { fetchFromApi } from '@/service/apiClient';

export interface BRDDocumentPayload {
  id?: number;
  Organization_Id?: number;
  Project_Id?: number;
  Project_Name?: string;
  Document_Code?: string;
  Document_Title?: string;
  Document_Type?: string;
  Version?: string;
  Status?: string;
  Prepared_By?: number;
  Department?: string;
  Target_Audience?: string;
  Confidentiality?: string;
  Effective_Date?: string;
  Description?: string;
  Reviewers?: number[];
  Sections?: any[];
  Created_By?: number;
  Updated_By?: number;
}

/**
 * Create a new BRD document via BRDDocumentCRUD (POST)
 */
export async function createBRDDocument(payload: BRDDocumentPayload): Promise<any> {
  return fetchFromApi('/user/BRDDocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single BRD document by ID via BRDDocumentCRUD (GET)
 */
export async function fetchBRDDocumentById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/BRDDocumentCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch BRD document by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/BRDDocumentCRUD/${id}/`, {
      method: 'GET',
    });
  }
}

/**
 * Update a BRD document fully via BRDDocumentCRUD (PUT)
 */
export async function updateBRDDocument(id: number | string, payload: BRDDocumentPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/BRDDocumentCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/BRDDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/BRDDocumentCRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Update a BRD document partially via BRDDocumentCRUD (PATCH)
 */
export async function patchBRDDocument(id: number | string, payload: Partial<BRDDocumentPayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/BRDDocumentCRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/BRDDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/BRDDocumentCRUD/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete a BRD document via BRDDocumentCRUD (DELETE)
 */
export async function deleteBRDDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/BRDDocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/BRDDocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

/**
 * Fetch BRD documents list with pagination (GET /user/BRDDocumentList/)
 */
export async function fetchBRDDocumentList(params: {
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

  return fetchFromApi(`/user/BRDDocumentList/?${queryParams.toString()}`, {
    method: 'GET',
  });
}

/**
 * Fetch BRD documents list without pagination (GET /user/BRDDocumentListwithoutpagination/)
 */
export async function fetchBRDDocumentListWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/BRDDocumentListwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * Search BRD documents (GET /user/BRDDocumentSearch/?search=...)
 */
export async function searchBRDDocuments(search: string): Promise<any> {
  return fetchFromApi(`/user/BRDDocumentSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * Filter BRD documents (POST /user/BRDDocumentFilter/)
 */
export async function filterBRDDocuments(payload: {
  Project_Id?: number;
  Document_Title?: string;
  Document_Type?: string;
  Version?: string;
  Status?: string;
  Confidentiality?: string;
  Created_Date?: [string, string];
  page?: number;
}): Promise<any> {
  return fetchFromApi('/user/BRDDocumentFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function generateBRDDocument(id: number): Promise<any> {
  return fetchFromApi('/user/GenerateBRDDocumentAPIView/', {
    method: 'POST',
    body: JSON.stringify({ BRDDocument_Id: id }),
  });
}

