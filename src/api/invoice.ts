import { fetchFromApi } from '@/service/apiClient';

// ── Types & Interfaces ────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  id?: number | string;
  Item_Name: string;
  Item_Details?: string;
  Quantity: number;
  Rate: number;
  Tax_Percentage?: number;
  Amount: number;
  UOM?: string;
  Stock_Aval?: number;
}

export interface SalesInvoicePayload {
  id?: number;
  Invoice_Id?: string;
  Invoice_code?: string;
  Customer_Name: string;
  Order_No?: string;
  Sales_Person?: string;
  Order_Date?: string;
  Invoice_Date?: string;
  Due_Date?: string;
  Shipment_Date?: string;
  Shipment_No?: string;
  Shipment_Id?: number | null;
  Store_Id?: number | null;
  Store_Name?: string;
  Account_Id?: number | null;
  Customer_Mobile?: string;
  Customer_Address?: string;
  Customer_Email?: string;
  Invoice_Amount: number;
  Sub_Total?: number;
  Tax_Amount?: number;
  Net_Amount: number;
  Freight_Cost?: number;
  Discount_Amount?: number;
  Advance_Amount?: number;
  Amount_Received?: number;
  Payment_Status?: string;
  Payment_Method?: string;
  Invoice_Type?: string;
  Terms?: string;
  Invoice_Note?: string;
  Invoice_Details?: InvoiceLineItem[];
  Is_Paid?: boolean;
  Is_Deleted?: boolean;
  Organization_Id?: number | string;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

export interface InvoiceListFilterParams {
  page?: number;
  search?: string;
  isPaid?: boolean | 'All' | 'Paid' | 'Unpaid';
  customer?: string;
  status?: string;
  Invoice_Type?: string;
}

// ── Invoice API Functions ─────────────────────────────────────────────────────

/**
 * Get paginated list of Sales Invoices
 * Endpoint: GET /user/SalesInvoiceList/?page=${page}&Is_Paid=${isPaid}
 */
export async function getInvoices(page: number = 1, isPaid?: boolean | 'All' | 'Paid' | 'Unpaid'): Promise<any> {
  const params: string[] = [`page=${page}`];
  if (isPaid === true || isPaid === 'Paid') {
    params.push('Is_Paid=True');
  } else if (isPaid === false || isPaid === 'Unpaid') {
    params.push('Is_Paid=False');
  }
  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/SalesInvoiceList/${queryString}`, {
    method: 'GET',
  });
}

/**
 * Get full list of Sales Invoices without pagination
 * Endpoint: GET /user/SalesInvoiceListwithoutpagination/?Is_Paid=${isPaid}
 */
export async function getInvoicesWithoutPagination(isPaid?: boolean): Promise<any> {
  const query = isPaid !== undefined ? `?Is_Paid=${isPaid ? 'True' : 'False'}` : '';
  return fetchFromApi(`/user/SalesInvoiceListwithoutpagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Get a single Sales Invoice by ID
 * Endpoint: GET /user/SalesInvoiceCRUD/?id=${id}
 */
export async function getInvoiceById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesInvoiceCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Create a new Sales Invoice
 * Endpoint: POST /user/SalesInvoiceCRUD/
 */
export async function createInvoice(payload: SalesInvoicePayload): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId')) : null;

  const body = {
    ...payload,
    ...(userId && !payload.Created_By ? { Created_By: Number(userId), Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  return fetchFromApi('/user/SalesInvoiceCRUD/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update an existing Sales Invoice
 * Endpoint: PUT /user/SalesInvoiceCRUD/
 */
export async function updateInvoice(payload: SalesInvoicePayload): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId')) : null;

  const body = {
    ...payload,
    ...(userId && !payload.Updated_By ? { Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  return fetchFromApi('/user/SalesInvoiceCRUD/', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Partial update for an existing Sales Invoice (Status, Payment, etc.)
 * Endpoint: PATCH /user/SalesInvoiceCRUD/
 */
export async function patchInvoice(payload: Partial<SalesInvoicePayload>): Promise<any> {
  return fetchFromApi('/user/SalesInvoiceCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a Sales Invoice by ID
 * Endpoint: DELETE /user/SalesInvoiceCRUD/?id=${id}
 */
export async function deleteInvoice(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesInvoiceCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Search Sales Invoices by keyword
 * Endpoint: GET /user/SalesInvoiceSearch/?search=${search}&Is_Paid=${isPaid}&page=${page}
 */
export async function searchInvoices(search: string, isPaid?: boolean, page: number = 1): Promise<any> {
  const query = new URLSearchParams({ search, page: String(page) });
  if (isPaid !== undefined) {
    query.append('Is_Paid', isPaid ? 'True' : 'False');
  }
  return fetchFromApi(`/user/SalesInvoiceSearch/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Filter Sales Invoices with advanced payload
 * Endpoint: POST /user/SalesInvoiceFilter/
 */
export async function filterInvoices(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/SalesInvoiceFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

/**
 * Fetch POS / Additional Invoices with multi-parameter filter
 * Endpoint: GET /user/SalesInvoiceAllAdditional/?...
 */
export async function getPosInvoices(params: InvoiceListFilterParams = {}): Promise<any> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'All') query.append('status', params.status);
  if (params.customer && params.customer !== 'All') query.append('customer', params.customer);
  query.append('Invoice_Type', params.Invoice_Type || 'POS Invoice');

  return fetchFromApi(`/user/SalesInvoiceAllAdditional/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Get Invoice Dashboard KPI Statistics
 * Endpoint: POST /user/SalesInvoiceDashboardAPI/
 */
export async function getInvoiceStats(invoiceType: string = 'POS Invoice'): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
  return fetchFromApi('/user/SalesInvoiceDashboardAPI/', {
    method: 'POST',
    body: JSON.stringify({
      UserId: Number(userId) || 0,
      Invoice_Type: invoiceType,
    }),
  });
}

/**
 * Send Invoice via Email
 * Endpoint: POST /user/QuotationMailSending/
 */
export async function sendInvoiceMail(payload: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/QuotationMailSending/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Upload Invoice Attachment / Document
 * Endpoint: POST /user/UserFilesandUrlsCRUD/
 */
export async function uploadInvoiceFile(payload: FormData | Record<string, any>): Promise<any> {
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
  return fetchFromApi('/user/UserFilesandUrlsCRUD/', {
    method: 'POST',
    ...(isFormData ? { body: payload } : { body: JSON.stringify(payload) }),
  });
}

/**
 * Fetch Organization details for Invoice header/print
 * Endpoint: GET /useradmin/CRMorganizationCRUD/?id=${id}
 */
export async function getOrganizationById(id: number | string): Promise<any> {
  return fetchFromApi(`/useradmin/CRMorganizationCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Fetch Shipment status updates
 * Endpoint: PATCH /user/SalesShipmentCRUD/
 */
export async function updateShipmentStatus(payload: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/SalesShipmentCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
