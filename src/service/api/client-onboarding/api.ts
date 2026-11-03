import { fetchFromApi } from '@/service/apiClient';

export interface ClientmastercrudPostPayload {
  Client_Code?: string;
  Client_Name?: string;
  Legal_Name?: string;
  Industry?: string;
  Company_Size?: string;
  Website?: string;
  Primary_Contact_Name?: string;
  Primary_Contact_Email?: string;
  Primary_Contact_PhoneNo?: string;
  Currency?: string;
  TimeZone?: string;
  Date_Format?: string;
  Brand_Color?: string;
  Progress_Percentage?: number;
  Status?: string;
  Client_Owner_Id?: number;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Draft_Flag?: boolean;
}

export interface ClientmastercrudPutPayload {
  id?: number;
  ClientMaster_Id?: string;
  Client_Code?: string;
  Client_Name?: string;
  Legal_Name?: string;
  Industry?: string;
  Company_Size?: string;
  Website?: string;
  Primary_Contact_Name?: string;
  Primary_Contact_Email?: string;
  Primary_Contact_PhoneNo?: string;
  Currency?: string;
  TimeZone?: string;
  Date_Format?: string;
  Client_Logo?: any;
  Brand_Color?: string;
  Progress_Percentage?: number;
  Onboarded_On?: string;
  Status?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Draft_Flag?: boolean;
  Client_Owner_Id?: number;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
}

export interface ClientmasterfilterPayload {
  ClientMaster_Id?: string;
  Client_Code?: string;
  Client_Name?: string;
  Legal_Name?: string;
  Industry?: string;
  Primary_Contact_Name?: string;
  Primary_Contact_Email?: string;
  Primary_Contact_PhoneNo?: string;
  Currency?: string;
  Status?: string;
  Created_Date?: any[];
  page?: number;
}

export interface ClientbusinessconfigurationcrudPostPayload {
  Client_Id?: number;
  Business_Type?: string;
  Registration_Number?: string;
  GST_Number?: string;
  Address_Line1?: string;
  Address_Line2?: string;
  City?: string;
  State?: string;
  Country?: string;
  Postal_Code?: string;
  Configuration_Data?: any;
  Created_By?: number;
}

export interface ClientbusinessconfigurationfilterPayload {
  ClientBusinessConfiguration_Id?: string;
  Client_Name?: string;
  Business_Type?: string;
  Registration_Number?: string;
  GST_Number?: string;
  Address_Line1?: string;
  Address_Line2?: string;
  City?: string;
  State?: string;
  Country?: string;
  Postal_Code?: string;
  Created_Date?: any[];
  page?: number;
}

export interface ClientteamaccesscrudPostPayload {
  Client_Id?: number;
  User_Id?: number;
  Role_Name?: string;
  Access_Level?: string;
  Status?: string;
  Created_By?: number;
}


/**
 * Endpoint: POST /user/ClientMasterCRUD
 */
export async function clientmastercrudPost(payload?: ClientmastercrudPostPayload): Promise<any> {
  return fetchFromApi('/user/ClientMasterCRUD/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/ClientMasterCRUD
 */
export async function clientmastercrudGet(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientMasterCRUD/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: PUT /user/ClientMasterCRUD
 */
export async function clientmastercrudPut(payload?: ClientmastercrudPutPayload): Promise<any> {
  return fetchFromApi('/user/ClientMasterCRUD/', {
    method: 'PUT',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/ClientMasterList
 */
export async function clientmasterlist(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientMasterList/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ClientMasterwithoutpagination
 */
export async function clientmasterwithoutpagination(id?: string | number): Promise<any> {
  const path = id ? `/user/ClientMasterwithoutpagination/?id=${id}` : '/user/ClientMasterwithoutpagination/';
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ClientMasterSearch
 */
export async function clientmastersearch(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientMasterSearch/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /user/ClientMasterFilter
 */
export async function clientmasterfilter(payload?: ClientmasterfilterPayload): Promise<any> {
  return fetchFromApi('/user/ClientMasterFilter/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: POST /user/ClientBusinessConfigurationCRUD
 */
export async function clientbusinessconfigurationcrudPost(payload?: ClientbusinessconfigurationcrudPostPayload): Promise<any> {
  return fetchFromApi('/user/ClientBusinessConfigurationCRUD/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/ClientBusinessConfigurationCRUD
 */
export async function clientbusinessconfigurationcrudGet(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientBusinessConfigurationCRUD/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ClientBusinessConfigurationList
 */
export async function clientbusinessconfigurationlist(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientBusinessConfigurationList/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ClientBusinessConfigurationwithoutpagination
 */
export async function clientbusinessconfigurationwithoutpagination(id?: string | number): Promise<any> {
  const path = id ? `/user/ClientBusinessConfigurationwithoutpagination/?id=${id}` : '/user/ClientBusinessConfigurationwithoutpagination/';
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ClientBusinessConfigurationSearch
 */
export async function clientbusinessconfigurationsearch(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientBusinessConfigurationSearch/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /user/ClientBusinessConfigurationFilter
 */
export async function clientbusinessconfigurationfilter(payload?: ClientbusinessconfigurationfilterPayload): Promise<any> {
  return fetchFromApi('/user/ClientBusinessConfigurationFilter/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: POST /user/ClientTeamAccessCRUD
 */
export async function clientteamaccesscrudPost(payload?: ClientteamaccesscrudPostPayload): Promise<any> {
  return fetchFromApi('/user/ClientTeamAccessCRUD/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/ClientTeamAccessCRUD
 */
export async function clientteamaccesscrudGet(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientTeamAccessCRUD/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ClientTeamAccessList
 */
export async function clientteamaccesslist(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientTeamAccessList/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ClientTeamAccesswithoutpagination
 */
export async function clientteamaccesswithoutpagination(id?: string | number): Promise<any> {
  const path = id ? `/user/ClientTeamAccesswithoutpagination/?id=${id}` : '/user/ClientTeamAccesswithoutpagination/';
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ClientOnboardingDashboard
 */
export async function clientonboardingdashboard(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ClientOnboardingDashboard/${query}`, {
    method: 'GET',
  });
}

