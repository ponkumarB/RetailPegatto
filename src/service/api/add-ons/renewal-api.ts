import { fetchFromApi } from '@/service/apiClient';

/**
 * Get Renewal Form Data
 * Endpoint: GET /useradmin/RenewalFormData/
 */
export async function getRenewalFormData(): Promise<any> {
  return fetchFromApi('/useradmin/RenewalFormData/', {
    method: 'GET',
  });
}

/**
 * Get Renewal Request List
 * Endpoint: GET /useradmin/UserRenewalRequestlist/
 */
export async function getRenewalRequestList(): Promise<any> {
  return fetchFromApi('/useradmin/UserRenewalRequestlist/', {
    method: 'GET',
  });
}

/**
 * Create Renewal Request
 * Endpoint: POST /useradmin/UserRenewalRequestCRUD/
 */
export async function createUserRenewalRequest(data: any): Promise<any> {
  return fetchFromApi('/useradmin/UserRenewalRequestCRUD/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
