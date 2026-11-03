import { fetchFromApi } from '@/service/apiClient';

export interface ApiDealFactor {
  id: number;
  Deal_Factor_Id?: string;
  Factor_Name: string;
  Description: string;
  Data_Type: string;
  Impact: string;
  Weight: number;
  Is_Mandatory: boolean;
  Sort_Order: number;
  Active_Flag: boolean;
  Is_Deleted: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Organization_Id: any;
  Created_By?: any;
  Updated_By?: any;
}

export interface DealFactorListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiDealFactor[];
}

/**
 * Fetch all deal factors
 */
export async function fetchDealFactors(token?: string): Promise<DealFactorListResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi('/user/DealFactorlist/', {
    method: 'GET',
    headers,
  });
}

/**
 * Create a new deal factor via POST
 */
export async function createDealFactor(factorData: Partial<ApiDealFactor>, token?: string): Promise<ApiDealFactor> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi('/user/DealFactorCRUD/', {
    method: 'POST',
    headers,
    body: JSON.stringify(factorData),
  });
}

/**
 * Update an existing deal factor via PUT
 */
export async function updateDealFactor(factorData: Partial<ApiDealFactor>, token?: string): Promise<ApiDealFactor> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi('/user/DealFactorCRUD/', {
    method: 'PUT',
    headers,
    body: JSON.stringify(factorData),
  });
}

/**
 * Delete a deal factor via DELETE with query param id
 */
export async function deleteDealFactor(factorId: number, token?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi(`/user/DealFactorCRUD/?id=${factorId}`, {
    method: 'DELETE',
    headers,
  });
}
