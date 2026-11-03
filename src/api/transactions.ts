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
 * Get Product Inward Opening Balance transaction view
 * Endpoint: POST /user/ProductInwardOpeningBalanceView/
 */
export async function getProductOpeningBalance(payload: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/ProductInwardOpeningBalanceView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
