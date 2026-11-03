import { fetchFromApi } from '@/service/apiClient';

/**
 * Payload expected by the auth_token endpoint.
 */
export interface LoginPayload {
  username: string;
  password: string;
}

/**
 * Response returned by the auth_token endpoint.
 */
export interface LoginResponse {
  refresh: string;
  access: string;
}

/**
 * Raw response model returned by UserCRUD_GET.
 */
export interface UserProfileResponse {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_superuser: boolean;
  Designation: string;
  User_Photo: string;
  PhoneNo: string;
  City: string;
  State: string;
  Country: string;
  UserType: string;
  Url: string;
  bio?: string;
  Organization_Id?: number;
}

/**
 * Logs in the user with username and password.
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  return fetchFromApi('/auth_token', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetches the user profile details for a given username.
 */
export async function fetchUserProfile(username: string, token: string): Promise<UserProfileResponse> {
  return fetchFromApi(`/useradmin/UserCRUD_GET/?username=${username}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
