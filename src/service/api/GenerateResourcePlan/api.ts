import { fetchFromApi } from '@/service/apiClient';

export interface ResourceAllocation {
  Resource_Id: string;
  Resource_Name: string;
  Role: string;
  Allocation_Percentage: number;
  Effort_Hours: number;
  Cost: number;
}

export interface AvailabilityPlan {
  Month: string;
  Available_Resources: number;
  Utilization: number;
}

export interface ResourcePlanDocumentPayload {
  id?: number;
  ResourcePlan_Id?: string;
  Organization_Id?: number;
  Project_Id?: number | null;
  Project_Name?: string;
  Project_Code?: string;
  Client_Name?: string;
  Project_Manager?: number;
  Start_Date?: string;
  End_Date?: string;
  Project_Duration?: string;
  Project_Type?: string;
  Methodology?: string;
  Location?: string;
  In_Scope?: string[];
  Out_Of_Scope?: string[];
  Key_Deliverables?: string[];
  Resource_Allocation?: ResourceAllocation[];
  Availability_Plan?: AvailabilityPlan[];
  Resource_Notes?: string;
  Total_Resources?: number;
  Total_Effort?: number;
  Total_Cost?: number;
  Cost_Summary?: any;
  Average_Utilization?: number;
  Version?: string;
  Document_Status?: string;
  Generated_On?: string;
  Is_Deleted?: boolean;
  Created_By?: number;
  Created_Date?: string;
  Updated_By?: number;
  Updated_Date?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Create a new Resource Plan Document (POST)
 */
export async function createResourcePlanDocument(payload: ResourcePlanDocumentPayload): Promise<any> {
  return fetchFromApi('/user/GenerateResourcePlanCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single Resource Plan Document by ID (GET)
 */
export async function fetchResourcePlanDocumentById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/GenerateResourcePlanCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch Resource Plan by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/GenerateResourcePlanCRUD/${id}/`, {
      method: 'GET',
    });
  }
}

/**
 * Update an existing Resource Plan Document fully (PUT)
 */
export async function updateResourcePlanDocument(id: number | string, payload: ResourcePlanDocumentPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/GenerateResourcePlanCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/GenerateResourcePlanCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/GenerateResourcePlanCRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Partially update a Resource Plan Document (PATCH)
 */
export async function patchResourcePlanDocument(id: number | string, payload: Partial<ResourcePlanDocumentPayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/GenerateResourcePlanCRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/GenerateResourcePlanCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/GenerateResourcePlanCRUD/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete a Resource Plan Document by ID (DELETE)
 */
export async function deleteResourcePlanDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/GenerateResourcePlanCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/GenerateResourcePlanCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

/**
 * List Resource Plan Documents with Pagination (GET)
 */
export async function fetchResourcePlanDocumentsWithPagination(page?: number): Promise<PaginatedResponse<any>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/GenerateResourcePlanListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * List Resource Plan Documents without Pagination (GET)
 */
export async function fetchResourcePlanDocumentsWithoutPagination(): Promise<any[]> {
  return fetchFromApi('/user/GenerateResourcePlanlistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Search Resource Plan Documents (GET)
 */
export async function searchResourcePlanDocuments(search: string): Promise<any[]> {
  return fetchFromApi(`/user/GenerateResourcePlanSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * Filter Resource Plan Documents (POST)
 */
export interface ResourcePlanDocumentFilterPayload {
  Project_Name?: string;
}
export async function filterResourcePlanDocuments(payload: ResourcePlanDocumentFilterPayload): Promise<any[]> {
  try {
    return await fetchFromApi('/user/GenerateResourcePlanFilter/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn(`POST for GenerateResourcePlanFilter failed, trying GET fallback:`, error);
    return fetchFromApi('/user/GenerateResourcePlanFilter/', {
      method: 'GET',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Calculate Resource Plan costs (POST)
 */
export async function calculateResourcePlan(payload: { Resource_Allocation: any[] }): Promise<any> {
  return fetchFromApi('/user/ResourcePlanCalculationAPIView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Generate Resource Plan Document PDF (POST)
 */
export async function generateResourcePlanDocumentPDF(resourcePlanId: number | string): Promise<any> {
  let planId: number;
  if (typeof resourcePlanId === 'string') {
    const cleanStr = resourcePlanId.replace(/\D/g, '');
    planId = parseInt(cleanStr, 10);
  } else {
    planId = resourcePlanId;
  }
  return fetchFromApi('/user/GenerateResourcePlanDocumentAPIView/', {
    method: 'POST',
    body: JSON.stringify({ ResourcePlan_Id: planId }),
  });
}

/**
 * Fetch Resource List without pagination (GET)
 */
export async function fetchResourceListWithoutPagination(): Promise<any[]> {
  return fetchFromApi('/user/ResourcelitwithoutpaginationAPIView/', {
    method: 'GET',
  });
}
