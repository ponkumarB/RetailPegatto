import { fetchFromApi } from '@/service/apiClient';

/**
 * Get Add/Cancel License Request List
 * Endpoint: GET /useradmin/UserAddorcancellicenselist/
 */
export async function getUserAddOrCancelLicenseList(search?: string): Promise<any> {
  const url = search 
    ? `/useradmin/UserAddorcancellicenseSearch/?search=${encodeURIComponent(search)}&db=crmuseradmin1`
    : '/useradmin/UserAddorcancellicenselist/?db=crmuseradmin1';
  return fetchFromApi(url, {
    method: 'GET',
  });
}

/**
 * Get Current Subscriptions
 * Endpoint: GET /useradmin/subscriptionlist/
 */
export async function getSubscriptionList(): Promise<any> {
  return fetchFromApi('/useradmin/subscriptionlist/', {
    method: 'GET',
  });
}

/**
 * Create or Edit License Request
 * Endpoint: PUT /useradmin/AddlicenseRequest/
 */
export async function updateAddLicenseRequest(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/AddlicenseRequest/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Filter License Requests
 * Endpoint: POST /useradmin/UserAddorcancellicenseFilter/
 */
export async function filterUserAddOrCancelLicenseList(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/UserAddorcancellicenseFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
