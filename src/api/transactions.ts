import { fetchFromApi } from '@/service/apiClient';

// ── Types & Interfaces ────────────────────────────────────────────────────────

export interface SeriesValueResponse {
  prefix?: string;
  series?: string;
  value?: string;
  next_number?: number;
  [key: string]: any;
}

// ── Transaction & Series API Functions ────────────────────────────────────────

/**
 * Get Next Transaction Series Value for a Doctype
 * Doctype examples:
 * - 'Sales_Invoice'
 * - 'Sales_Payment'
 * - 'Sales_Order'
 * - 'Sales_Schedule'
 * - 'Sales_Shipment'
 * - 'Delivery_Confirmation'
 * - 'Product_Enquiry'
 * - 'Product_Offer'
 * 
 * Endpoint: GET /user/SeriesValue/?doctype=${doctype}
 */
export async function getTransactionSeries(doctype: string): Promise<any> {
  return fetchFromApi(`/user/SeriesValue/?doctype=${encodeURIComponent(doctype)}`, {
    method: 'GET',
  });
}

/**
 * Sync Invoice Transaction to Tally ERP
 * Endpoint: POST /user/tally/sync-invoice/
 */
export async function syncInvoiceToTally(invoiceId: number | string): Promise<any> {
  return fetchFromApi('/user/tally/sync-invoice/', {
    method: 'POST',
    body: JSON.stringify({
      invoice_id: invoiceId,
    }),
  });
}

/**
 * Fetch Sales Invoices for Tally Sync Report
 * Endpoint: GET /user/SalesInvoiceAllAdditional/?user_id=${userId}
 */
export async function fetchTallyReportInvoices(userId?: number | string): Promise<any> {
  const uId = userId || (typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '') : '');
  const query = uId ? `?user_id=${encodeURIComponent(String(uId))}` : '';
  return fetchFromApi(`/user/SalesInvoiceAllAdditional/${query}`, {
    method: 'GET',
  });
}

/**
 * Get Product Inward Opening Balance transaction view
 * Endpoint: POST /user/ProductInwardOpeningBalanceView/
 */
export async function getProductOpeningBalance(payload: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/ProductInwardOpeningBalanceView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Tally Configuration for organization
 * Endpoint: GET /user/tally/configuration/?Organization_Id=${orgId}
 */
export async function fetchTallyConfiguration(orgId: number | string): Promise<any> {
  return fetchFromApi(`/user/tally/configuration/?Organization_Id=${encodeURIComponent(String(orgId))}`, {
    method: 'GET',
  });
}

/**
 * Save or Update Tally Configuration
 * Endpoint: POST or PUT /user/tally/configuration/
 */
export async function saveTallyConfiguration(payload: any): Promise<any> {
  const hasId = !!payload.id;
  return fetchFromApi('/user/tally/configuration/', {
    method: hasId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Stores list for Tally Store selector
 * Endpoint: GET /user/StoreMasterList/
 */
export async function fetchStoreMasterList(): Promise<any> {
  return fetchFromApi('/user/StoreMasterList/', {
    method: 'GET',
  });
}
