import { fetchFromApi } from '@/service/apiClient';

// ── Types & Interfaces ────────────────────────────────────────────────────────

export interface BillingPaymentPayload {
  id?: number | string;
  Payment_Date: string;
  Customer_Name: string;
  Customer_Id?: string | number;
  Account_Id?: number | null;
  Invoice_No?: string;
  Invoice_Id?: number | string;
  Paid_Amount: number;
  Invoice_Amount?: number;
  Mode_of_Payment: string;
  Transaction_No?: string;
  Payment_Flag?: boolean;
  Status?: string;
  Is_Deleted?: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

export interface BillingPaymentFilterParams {
  page?: number;
  isDeleted?: boolean;
  searchTerm?: string;
}

// ── Billing / Payment API Functions ───────────────────────────────────────────

/**
 * Get paginated list of Sales Payments / Billing records
 * Endpoint: GET /user/SalesPaymentAllAdditional/?Is_Deleted=${isDeleted}&page=${page}
 */
export async function getPayments(page: number = 1, isDeleted: boolean = false): Promise<any> {
  const isDelStr = isDeleted ? 'True' : 'False';
  return fetchFromApi(`/user/SalesPaymentAllAdditional/?Is_Deleted=${isDelStr}&page=${page}`, {
    method: 'GET',
  });
}

/**
 * Get a single Payment record by ID
 * Endpoint: GET /user/SalesPaymentCRUD/?id=${id}
 */
export async function getPaymentById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesPaymentCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Create a new Payment / Billing transaction
 * Endpoint: POST /user/SalesPaymentCRUD/
 */
export async function createPayment(payload: BillingPaymentPayload): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId')) : null;

  const body = {
    Payment_Flag: true,
    Is_Deleted: false,
    ...payload,
    ...(userId && !payload.Created_By ? { Created_By: Number(userId), Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  return fetchFromApi('/user/SalesPaymentCRUD/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update an existing Payment record
 * Endpoint: PUT /user/SalesPaymentCRUD/
 */
export async function updatePayment(payload: BillingPaymentPayload): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId')) : null;

  const body = {
    ...payload,
    ...(userId && !payload.Updated_By ? { Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  return fetchFromApi('/user/SalesPaymentCRUD/', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Delete a Payment record by ID
 * Endpoint: DELETE /user/SalesPaymentCRUD/?id=${id}
 */
export async function deletePayment(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesPaymentCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Search Payments by search term
 * Endpoint: GET /user/SalesPaymentSearch/?search=${searchTerm}
 */
export async function searchPayments(searchTerm: string): Promise<any> {
  return fetchFromApi(`/user/SalesPaymentSearch/?search=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
  });
}

/**
 * Filter Payments by criteria
 * Endpoint: POST /user/SalesPaymentFilter/
 */
export async function filterPayments(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/SalesPaymentFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

/**
 * Fetch unpaid invoices available for payment allocation
 * Endpoint: GET /user/SalesInvoiceAdditional/?Is_Deleted=False&Created_By=${UserId}
 */
export async function getInvoicesForPayment(userId?: number | string): Promise<any> {
  const uid = userId || (typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : '');
  const userParam = uid ? `&Created_By=${uid}` : '';
  return fetchFromApi(`/user/SalesInvoiceAdditional/?Is_Deleted=False${userParam}`, {
    method: 'GET',
  });
}

/**
 * Update invoice payment status after recording payment
 * Endpoint: PATCH /user/SalesInvoiceCRUD/
 */
export async function updateInvoicePaymentStatus(payload: { id: number | string; Payment_Status?: string; Is_Paid?: boolean; [key: string]: any }): Promise<any> {
  return fetchFromApi('/user/SalesInvoiceCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Get payments associated with a specific invoice
 * Endpoint: GET /user/InvoicesalesPaymentlist/?Invoice_Id=${Invoice_Id}
 */
export async function getPaymentsByInvoiceId(invoiceId: number | string): Promise<any> {
  return fetchFromApi(`/user/InvoicesalesPaymentlist/?Invoice_Id=${invoiceId}`, {
    method: 'GET',
  });
}
