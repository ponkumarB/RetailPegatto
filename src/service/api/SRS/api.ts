import { fetchFromApi } from '@/service/apiClient';

export interface SRSDocumentPayload {
  id?: number;
  Organization_Id?: number;
  Project_Id?: number;
  Project_Name?: string;
  DocumentCode?: string;
  DocumentType?: string;
  DocumentTitle?: string;
  Version?: string;
  Status?: string;
  PreparedBy?: number;
  Department?: string;
  Reviewers?: number[];
  TargetAudience?: string;
  Confidentiality?: string;
  EffectiveDate?: string;
  DescriptionPurpose?: string;
  RelatedBRD?: string;
  RelatedFRD?: string;
  BRDDocument_Id?: number;
  FRDDocument_Id?: number;
  RequirementPriority?: string;
  ModulesFeatures?: any[];
  AssumptionsConstraints?: string;
  DocumentSections?: any[];
  Created_By?: number;
  Updated_By?: number;
}

/**
 * Create a new SRS document via SRSDocumentCRUD (POST)
 */
export async function createSRSDocument(payload: SRSDocumentPayload): Promise<any> {
  return fetchFromApi('/user/SRSDocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single SRS document by ID via SRSDocumentCRUD (GET)
 */
export async function fetchSRSDocumentById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/SRSDocumentCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch SRS document by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/SRSDocumentCRUD/${id}/`, {
      method: 'GET',
    });
  }
}

/**
 * Update an SRS document fully via SRSDocumentCRUD (PUT)
 */
export async function updateSRSDocument(id: number | string, payload: SRSDocumentPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/SRSDocumentCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/SRSDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/SRSDocumentCRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Update an SRS document partially via SRSDocumentCRUD (PATCH)
 */
export async function patchSRSDocument(id: number | string, payload: Partial<SRSDocumentPayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/SRSDocumentCRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/SRSDocumentCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/SRSDocumentCRUD/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete an SRS document via SRSDocumentCRUD (DELETE)
 */
export async function deleteSRSDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/SRSDocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/SRSDocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

export async function fetchSRSDocumentList(params: {
  page?: number;
  Project_Id?: number | string;
  Status?: string;
  search?: string;
  arch?: string;
} = {}): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', String(params.page));
  if (params.Project_Id && params.Project_Id !== 'All') queryParams.append('Project_Id', String(params.Project_Id));
  if (params.Status && params.Status !== 'All') queryParams.append('Status', params.Status);
  if (params.search) queryParams.append('search', params.search);
  if (params.arch) queryParams.append('arch', params.arch);

  return fetchFromApi(`/user/SRSDocumentList/?${queryParams.toString()}`, {
    method: 'GET',
  });
}

/**
 * Fetch SRS documents list without pagination (GET /user/SRSDocumentListwithoutpagination/)
 */
export async function fetchSRSDocumentListWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/SRSDocumentListwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * Search SRS documents (GET /user/SRSDocumentSearch/?arch=...)
 */
export async function searchSRSDocuments(arch: string): Promise<any> {
  return fetchFromApi(`/user/SRSDocumentSearch/?arch=${encodeURIComponent(arch)}`, {
    method: 'GET',
  });
}

/**
 * Filter SRS documents (POST /user/SRSDocumentFilter/)
 */
export async function filterSRSDocuments(payload: {
  Project_Id?: number;
  PreparedBy?: number;
  BRDDocument_Id?: number;
  FRDDocument_Id?: number;
  DocumentTitle?: string;
  DocumentType?: string;
  Status?: string;
  Department?: string;
  Confidentiality?: string;
  Version?: string;
  RequirementPriority?: string;
  RelatedBRD?: string;
  RelatedFRD?: string;
  Created_Date?: [string, string];
  page?: number;
}): Promise<any> {
  return fetchFromApi('/user/SRSDocumentFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
export async function generateSRSDocument(id: number): Promise<any> {
  return fetchFromApi('/user/GenerateSRSDocumentAPIView/', {
    method: 'POST',
    body: JSON.stringify({ SRSDocument_Id: id }),
  });
}

