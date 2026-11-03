import { fetchFromApi } from '@/service/apiClient';

export interface CustomerfeedbackcrudPayload {
  [key: string]: any;
}

export interface CustomerfeedbackfilterPayload {
  CustomerFeedback_Id?: string;
  Feedback_Type?: string;
  Customer_Name?: string;
  Rating?: number;
  Sentiment?: string;
  Overall_Experience?: string;
  Related_To?: string;
  PhoneNo?: string;
  EmailId?: string;
  Priority?: string;
  Status?: string;
  Created_Date?: any[];
  page?: number;
  [key: string]: any;
}

export interface CustomerfeedbacksearchPayload {
  CustomerFeedback_Id?: string;
  Feedback_Type?: string;
  Customer_Name?: string;
  Rating?: number;
  Sentiment?: string;
  Overall_Experience?: string;
  Related_To?: string;
  PhoneNo?: string;
  EmailId?: string;
  Priority?: string;
  Status?: string;
  Created_Date?: any[];
  page?: number;
}

export interface CustomerFeedbackStatusListAndSearchPayload {
  status?: string;
  search?: string;
  page?: number;
}

export interface CustomerfeedbackratingsummaryPayload {
  CustomerFeedback_Id?: string;
  Feedback_Type?: string;
  Customer_Name?: string;
  Rating?: number;
  Sentiment?: string;
  Overall_Experience?: string;
  Related_To?: string;
  PhoneNo?: string;
  EmailId?: string;
  Priority?: string;
  Status?: string;
  Created_Date?: any[];
  page?: number;
}

export interface CustomerfeedbackwithoutpaginationPayload {
  CustomerFeedback_Id?: string;
  Feedback_Type?: string;
  Customer_Name?: string;
  Rating?: number;
  Sentiment?: string;
  Overall_Experience?: string;
  Related_To?: string;
  PhoneNo?: string;
  EmailId?: string;
  Priority?: string;
  Status?: string;
  Created_Date?: any[];
  page?: number;
}


/**
 * Endpoint: POST /user/CustomerFeedbackCRUD
 */
export async function customerfeedbackcrud(payload?: CustomerfeedbackcrudPayload): Promise<any> {
  return fetchFromApi('/user/CustomerFeedbackCRUD/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/CustomerFeedbackDashboard
 */
export async function customerfeedbackdashboard(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerFeedbackDashboard/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/CustomerFeedbackwithPagination
 */
export async function customerfeedbackwithpagination(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerFeedbackwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /user/CustomerFeedbackFilter
 */
export async function customerfeedbackfilter(payload?: CustomerfeedbackfilterPayload): Promise<any> {
  return fetchFromApi('/user/CustomerFeedbackFilter/', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/CustomerFeedbackSearch
 */
export async function customerfeedbacksearch(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerFeedbackSearch/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/CustomerFeedbackstatuslistandSearch
 */
export async function customerfeedbackstatuslistandsearch(params?: CustomerFeedbackStatusListAndSearchPayload): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerFeedbackstatuslistandSearch/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/CustomerFeedbackRatingSummary
 */
export async function customerfeedbackratingsummary(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerFeedbackRatingSummary/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/CustomerFeedbackwithoutpagination
 */
export async function customerfeedbackwithoutpagination(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/CustomerFeedbackwithoutpagination/${query}`, {
    method: 'GET',
  });
}

export interface CustomerFeedbackModel {
  id: number;
  CustomerFeedback_Id?: string;
  Ticket_Id?: number | null;
  Feedback_Type?: string;
  Customer_Name?: string;
  Rating?: number;
  Comment?: string;
  Date?: string;
  Account_Id?: number | null;
  Feedback?: string;
  Sentiment?: string;
  Overall_Experience?: string;
  Followup_required?: boolean;
  Related_To?: string;
  PhoneNo?: string;
  EmailId?: string;
  Priority?: string;
  Attachment?: any[];
  Status?: string;
  Received_On?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number | null;
  Is_Deleted?: boolean;
}

/**
 * Endpoint: GET /user/CustomerFeedbackCRUD/?id=ID
 */
export async function getFeedbackDetails(id: number | string): Promise<CustomerFeedbackModel> {
  return fetchFromApi(`/user/CustomerFeedbackCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /user/CustomerFeedbackCRUD/
 */
export async function createFeedbackApi(payload: Omit<CustomerFeedbackModel, 'id'>): Promise<CustomerFeedbackModel> {
  return fetchFromApi('/user/CustomerFeedbackCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Endpoint: PUT /user/CustomerFeedbackCRUD/?id=ID
 */
export async function updateFeedbackApi(id: number | string, payload: Partial<CustomerFeedbackModel>): Promise<CustomerFeedbackModel> {
  return fetchFromApi(`/user/CustomerFeedbackCRUD/?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Endpoint: DELETE /user/CustomerFeedbackCRUD/?id=ID
 */
export async function deleteFeedbackApi(id: number | string): Promise<any> {
  return fetchFromApi(`/user/CustomerFeedbackCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}


