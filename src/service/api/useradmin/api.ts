import { fetchFromApi } from '@/service/apiClient';

export interface UserAdditionalParams {
  is_active?: string | boolean;
  Organization_Id?: string | number;
  page?: string | number;
}

/**
 * Fetch user additional info / list users
 * Endpoint: GET /useradmin/UserAdditional/
 */
export async function fetchUserAdditional(params: UserAdditionalParams): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params.is_active !== undefined) {
    queryParams.append('is_active', String(params.is_active));
  }
  if (params.Organization_Id !== undefined) {
    queryParams.append('Organization_Id', String(params.Organization_Id));
  }
  if (params.page !== undefined) {
    queryParams.append('page', String(params.page));
  }
  
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromApi(`/useradmin/UserAdditional/${query}`, {
    method: 'GET',
  });
}

/**
 * Update user details
 * Endpoint: PATCH /useradmin/UserCRUD/
 */
export async function updateUser(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/UserCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Invite / Create user
 * Endpoint: POST /useradmin/UserCRUD/
 */
export async function createUser(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/UserCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Check user limit
 * Endpoint: GET /useradmin/Userlimitcheckfunction/
 */
export async function checkUserLimit(): Promise<any> {
  return fetchFromApi('/useradmin/Userlimitcheckfunction/', {
    method: 'GET',
  });
}

/**
 * Create user with invitation mail
 * Endpoint: POST /useradmin/UserCreate/
 */
export async function createUserWithMail(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/UserCreate/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Mail Configuration for user
 * Endpoint: GET /user/MailConfigurationCRUD/?User_Id=${userId}
 */
export async function fetchMailConfiguration(userId: number | string): Promise<any> {
  return fetchFromApi(`/user/MailConfigurationCRUD/?User_Id=${userId}`, {
    method: 'GET',
  });
}

/**
 * Save/Update Mail Configuration
 * Endpoint: POST /user/MailConfigurationCRUD/ or PUT /user/MailConfigurationCRUD/?id=${payload.id}
 */
export async function saveMailConfiguration(payload: any): Promise<any> {
  const hasId = !!payload.id;
  const url = hasId ? `/user/MailConfigurationCRUD/?id=${payload.id}` : '/user/MailConfigurationCRUD/';
  return fetchFromApi(url, {
    method: hasId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
}



