import { fetchFromApi } from '@/service/apiClient';

/**
 * Get User Subscription List
 * Endpoint: GET /useradmin/subscriptionlist/
 */
export async function getUserSubscriptionList(): Promise<any> {
  return fetchFromApi('/useradmin/subscriptionlist/', {
    method: 'GET',
  });
}

/**
 * AddstorageSearch
 * Endpoint: GET /useradmin/AddstorageSearch/?search={query}
 */
export async function addStorageSearch(search: string): Promise<any> {
  return fetchFromApi(`/useradmin/AddstorageSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * AddstorageFilter
 * Endpoint: POST /useradmin/AddstorageFilter/
 */
export async function addStorageFilter(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/AddstorageFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * UserAddStoragelist
 * Endpoint: GET /useradmin/UserAddStoragelist/?page={page}&status={status}
 */
export async function userAddStorageList(page: number = 1, status?: string): Promise<any> {
  const queryParams = new URLSearchParams();
  queryParams.append('page', String(page));
  if (status && status !== 'All' && status !== 'All Statuses') {
    queryParams.append('status', status);
  }
  return fetchFromApi(`/useradmin/UserAddStoragelist/?${queryParams.toString()}`, {
    method: 'GET',
  });
}

/**
 * AddstorageRequest - GET (by key)
 * Endpoint: GET /useradmin/AddstorageRequest/?AddStorageRequestKey={key}
 */
export async function getAddStorageRequest(key: string): Promise<any> {
  return fetchFromApi(`/useradmin/AddstorageRequest/?AddStorageRequestKey=${encodeURIComponent(key)}`, {
    method: 'GET',
  });
}

/**
 * AddstorageRequest - POST
 * Endpoint: POST /useradmin/AddstorageRequest/
 */
export async function createAddStorageRequest(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/AddstorageRequest/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * AddstorageRequest - PUT
 * Endpoint: PUT /useradmin/AddstorageRequest/
 */
export async function updateAddStorageRequest(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/AddstorageRequest/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * AddstorageRequest - DELETE
 * Endpoint: DELETE /useradmin/AddstorageRequest/?AddStorageRequestKey={key}
 */
export async function deleteAddStorageRequest(key: string): Promise<any> {
  return fetchFromApi(`/useradmin/AddstorageRequest/?AddStorageRequestKey=${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
}
