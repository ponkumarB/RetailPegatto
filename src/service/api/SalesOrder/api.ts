import { fetchFromApi } from '@/service/apiClient';

// Helper to build query parameters dynamically and cleanly
function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      if (Array.isArray(val)) {
        val.forEach(item => query.append(key, String(item)));
      } else {
        query.append(key, String(val));
      }
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

export interface CreateSalesorderoverviewapiviewPayload {
  Sales_Order_Id?: string;
}

export interface CreateSalesordertrackingapiviewPayload {
  Sale_Id?: number;
}

export interface SalesOrderDetail {
  Project_Id?: string | number;
  Project_Name?: string;
  Projectid?: number;
  project_Id?: number;
  UOM?: string;
  Unit_Price?: string | number;
  Description?: string;
  Quantity?: string | number;
  Amount?: string | number;
  Discount?: string | number;
  Tax?: string | number;
  Final_Price?: string | number;
  Net_Amount?: number;
}

export interface UserSalesPayload {
  id?: number;
  Sale_Id?: string;
  Po_Number?: string;
  Po_Date?: string;
  Payment_Terms?: string;
  Delivery_Terms?: string | null;
  freight?: string | number | null;
  Price_Book?: string;
  Total_Amount?: number;
  Net_Amount?: number;
  Currency?: string | null;
  Order_Date?: string;
  Contact_Person?: string | null;
  Required_Date?: string;
  Reference?: string | null;
  Billing_Address?: string | null;
  Terms_Condition?: string | null;
  Attachment?: string | null;
  Is_Draft?: boolean;
  Sales_Person?: string;
  Note?: string;
  Total_Discount?: string | number | null;
  Customer_Name?: string;
  SalesOrder_Details?: SalesOrderDetail[];
  Spl_Discount?: number;
  ScheduledSalesOrder_Details?: any[] | null;
  Order_Type?: string | null;
  Reference_Id?: string | number | null;
  Is_Replacement?: boolean;
  Offer_Name?: string | null;
  Offer_Discount_Amount?: number;
  Offer_Code?: string | null;
  Bank_Name?: string | null;
  Card_Type?: string | null;
  isSchedule?: boolean;
  isScheduleClosed?: boolean;
  Schedule_Status?: string;
  StatusTrack?: string;
  Is_Deleted?: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Organization_Id?: number;
  SalesUser_Id?: number;
  Account_Id?: number;
  Quotation_Id?: number;
  Lead_Id?: number | null;
  Deal_Id?: number | null;
  OffersMaster_Id?: number | null;
  Bank_Id?: number | null;
  Created_By?: number;
  Updated_By?: number;
}

export interface UserSalesNewAdditionalParams {
  Is_Deleted?: boolean;
  page?: number;
  [key: string]: any;
}

/**
 * POST request for SalesOrderOverviewAPIView
 */
export async function createSalesorderoverviewapiview(payload: CreateSalesorderoverviewapiviewPayload): Promise<any> {
  return fetchFromApi('/user/SalesOrderOverviewAPIView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for SalesOrderTrackingAPIView
 */
export async function createSalesordertrackingapiview(payload: CreateSalesordertrackingapiviewPayload): Promise<any> {
  return fetchFromApi('/user/SalesOrderTrackingAPIView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for SalesOrderCardsAPIView
 */
export async function fetchSalesordercardsapiview(): Promise<any> {
  return fetchFromApi('/user/SalesOrderCardsAPIView/', {
    method: 'GET',
  });
}

/**
 * GET request for UserSalesNewAdditional (List with pagination)
 */
export async function fetchUserSalesNewAdditional(params?: UserSalesNewAdditionalParams): Promise<any> {
  const queryParams = { Is_Deleted: false, page: 1, ...params };
  const queryString = buildQueryString(queryParams);
  return fetchFromApi(`/user/UserSalesNewAdditional/${queryString}`, {
    method: 'GET',
  });
}

/**
 * GET request for UserSalesList (List without pagination)
 */
export async function fetchUserSalesList(): Promise<any> {
  return fetchFromApi('/user/UserSalesList/', {
    method: 'GET',
  });
}

/**
 * POST request for UserSalesCRUD (Create)
 */
export async function createUserSales(payload: UserSalesPayload): Promise<any> {
  return fetchFromApi('/user/UserSalesCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PUT request for UserSalesCRUD (Full Update)
 */
export async function updateUserSales(payload: UserSalesPayload): Promise<any> {
  return fetchFromApi('/user/UserSalesCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH request for UserSalesCRUD (Partial Update)
 */
export async function patchUserSales(payload: Partial<UserSalesPayload>): Promise<any> {
  return fetchFromApi('/user/UserSalesCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE request for UserSalesCRUD (Delete)
 */
export async function deleteUserSales(id: number | string): Promise<any> {
  return fetchFromApi(`/user/UserSalesCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * GET request for UserSalesCRUD by id (Read single)
 */
export async function fetchUserSalesById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/UserSalesCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * GET request for UserSalesSearch (Search with pagination)
 */
export async function searchUserSales(search: string, page?: number): Promise<any> {
  const queryParams = { search, page: page || 1 };
  const queryString = buildQueryString(queryParams);
  return fetchFromApi(`/user/UserSalesSearch/${queryString}`, {
    method: 'GET',
  });
}

