import { fetchFromApi } from '@/service/apiClient';

/**
 * Get Addon Request List
 * Endpoint: GET /useradmin/AddonRequestlist/
 */
export async function getAddonRequestList(): Promise<any> {
  return fetchFromApi('/useradmin/AddonRequestlist/', {
    method: 'GET',
  });
}

/**
 * Create or Update Addon Request
 * Endpoint: PUT /useradmin/AddonRequestCRUD/
 */
export async function updateAddonRequest(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/AddonRequestCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Get Full Addons List from Superadmin
 * Endpoint: GET /superadmin/AddonsFullList/
 */
export async function getFullAddonsList(): Promise<any> {
  return fetchFromApi('/useradmin/AddonsFullList/', {
    method: 'GET',
  });
}

/**
 * Search Addon Requests
 * Endpoint: GET /useradmin/AddonSearch/?search={query}
 */
export async function searchAddonRequestList(query: string): Promise<any> {
  return fetchFromApi(`/useradmin/AddonSearch/?search=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
}
