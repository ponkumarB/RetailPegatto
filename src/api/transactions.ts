import { fetchFromApi } from '@/service/apiClient';
import { getLocalData } from '@/utils/persistentStorage';

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
 * Sends rich invoice identifiers (numeric id, voucher code, organization, store, and tally id),
 * handles fallback between Tally endpoints, and automatically updates the CRM database record with Tally_Id and SUCCESS status.
 * Endpoint: POST /user/tally/sync-invoice/
 */
export async function syncInvoiceToTally(invoiceOrId: number | string | Record<string, any>): Promise<any> {
  const isObj = typeof invoiceOrId === 'object' && invoiceOrId !== null;
  const invoiceIdStr = isObj
    ? String(invoiceOrId.Invoice_Id || invoiceOrId.invoiceNumber || invoiceOrId.Invoice_No || invoiceOrId.Invoice_code || invoiceOrId.id || '')
    : String(invoiceOrId);
  // Extract or resolve database ID
  let targetId: number | string = invoiceIdStr;
  if (isObj && invoiceOrId.id !== undefined && invoiceOrId.id !== null) {
    const raw = invoiceOrId.id;
    if (!isNaN(Number(raw))) {
      targetId = Number(raw);
    } else {
      const digits = String(raw).replace(/\D/g, '');
      if (digits && !isNaN(Number(digits))) {
        targetId = parseInt(digits, 10);
      } else {
        targetId = String(raw);
      }
    }
  } else if (invoiceIdStr) {
    const digits = invoiceIdStr.replace(/\D/g, '');
    if (digits && !isNaN(Number(digits))) {
      targetId = parseInt(digits, 10);
    }
  }

  const numericId = typeof targetId === 'number' ? targetId : (!isNaN(Number(targetId)) ? Number(targetId) : undefined);

  const orgId = isObj && invoiceOrId.Organization_Id
    ? Number(invoiceOrId.Organization_Id)
    : (typeof window !== 'undefined'
        ? Number(localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || 1)
        : 1);

  const storeId = isObj && invoiceOrId.Store_Id ? Number(invoiceOrId.Store_Id) : null;

  // Existing Tally ID or fallback to the alphanumeric invoice code
  const existingTallyId = isObj
    ? (invoiceOrId.Tally_Id || invoiceOrId.tally_id || invoiceIdStr)
    : invoiceIdStr;

  const payload: Record<string, any> = {
    invoice_id: invoiceIdStr,
    Invoice_Id: invoiceIdStr,
    Invoice_Number: invoiceIdStr,
    invoice_number: invoiceIdStr,
    ...(numericId ? { id: numericId } : {}),
    tally_id: existingTallyId,
    Tally_Id: existingTallyId,
    voucher_number: invoiceIdStr,
    VOUCHERNUMBER: invoiceIdStr,
    Organization_Id: orgId,
    ...(storeId ? { Store_Id: storeId } : {}),
    ...(isObj && (invoiceOrId.Customer_Name || invoiceOrId.customerName)
      ? { Customer_Name: invoiceOrId.Customer_Name || invoiceOrId.customerName }
      : {}),
    ...(isObj && (invoiceOrId.Invoice_Date || invoiceOrId.date)
      ? { Invoice_Date: invoiceOrId.Invoice_Date || invoiceOrId.date }
      : {}),
    ...(isObj && (invoiceOrId.Net_Amount || invoiceOrId.totalAmount)
      ? { Net_Amount: invoiceOrId.Net_Amount || invoiceOrId.totalAmount }
      : {}),
    ...(isObj && (invoiceOrId.Tax_Amount || invoiceOrId.taxAmount)
      ? { Tax_Amount: invoiceOrId.Tax_Amount || invoiceOrId.taxAmount }
      : {}),
    ...(isObj && (invoiceOrId.Invoice_Amount || invoiceOrId.subtotal)
      ? { Invoice_Amount: invoiceOrId.Invoice_Amount || invoiceOrId.subtotal }
      : {}),
  };

  let res: any = null;
  let syncSuccess = false;

  // Primary Sync Endpoint: /user/tally/sync-invoice/
  res = await fetchFromApi('/user/tally/sync-invoice/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res?.success === true || (res?.status === 200 && res?.success !== false) || res?.status === 'success') {
    syncSuccess = true;
  }

  // If sync succeeded or returned positive response, update the database record with Tally_Id and SUCCESS
  if (syncSuccess || (res && !res.error && res.status !== 400 && res.status !== 500)) {
    const resolvedTallyId =
      res?.tally_id ||
      res?.Tally_Id ||
      res?.voucher_id ||
      res?.voucher_number ||
      existingTallyId ||
      invoiceIdStr;

    // Persist Tally_Id and SUCCESS status into CRM database
    if (targetId !== undefined || invoiceIdStr) {
      const updatePayload: Record<string, any> = {
        id: targetId,
        Invoice_Id: invoiceIdStr,
        Tally_Sync_Status: 'SUCCESS',
        Tally_Id: String(resolvedTallyId),
        Tally_Sync_Date: new Date().toISOString(),
        Tally_Sync_Error: '',
      };

      try {
        // 1. Primary: PATCH /user/SalesInvoiceCRUD/?id=${targetId}
        await fetchFromApi(`/user/SalesInvoiceCRUD/?id=${encodeURIComponent(String(targetId))}`, {
          method: 'PATCH',
          body: JSON.stringify(updatePayload),
        });
      } catch (patchErr1) {
        try {
          // 2. Secondary: PATCH /user/SalesInvoiceCRUD/ with id in body
          await fetchFromApi('/user/SalesInvoiceCRUD/', {
            method: 'PATCH',
            body: JSON.stringify(updatePayload),
          });
        } catch (patchErr2) {
          try {
            // 3. Fallback: try with alphanumeric invoice code in URL
            await fetchFromApi(`/user/SalesInvoiceCRUD/?id=${encodeURIComponent(invoiceIdStr)}`, {
              method: 'PATCH',
              body: JSON.stringify({ ...updatePayload, id: invoiceIdStr }),
            });
          } catch (patchErr3) {
            console.warn('SalesInvoiceCRUD PATCH could not update database record (Tally sync was successful):', patchErr3);
          }
        }
      }
    }

    // Also update local storage caches for instant offline/UI sync
    if (typeof window !== 'undefined') {
      try {
        const { upsertLocalItem } = await import('@/utils/persistentStorage');
        if (isObj) {
          upsertLocalItem(
            'pegatto_pos_invoices',
            { ...invoiceOrId, Tally_Sync_Status: 'SUCCESS', Tally_Id: String(resolvedTallyId), Tally_Sync_Date: new Date().toISOString() },
            ['id', 'invoiceNumber']
          );
          upsertLocalItem(
            'pegatto_invoices',
            { ...invoiceOrId, Tally_Sync_Status: 'SUCCESS', Tally_Id: String(resolvedTallyId), Tally_Sync_Date: new Date().toISOString() },
            ['id', 'Invoice_Id', 'Invoice_code']
          );
        }
      } catch {}
    }

    return {
      success: true,
      status: 200,
      tally_id: resolvedTallyId,
      Tally_Id: resolvedTallyId,
      message: res?.message || `Invoice ${invoiceIdStr} synced to Tally successfully!`,
      ...res,
    };
  }

  return res;
}

/**
 * Sync Multiple Invoices sequentially to Tally ERP
 * Sequentially invokes sync to avoid overloading Tally Prime's single-threaded XML server.
 */
export async function syncMultipleInvoicesToTally(
  invoicesOrIds: (number | string | Record<string, any>)[],
  onProgress?: (current: number, total: number, currentInvoiceId: number | string) => void
): Promise<{
  successCount: number;
  failCount: number;
  lastError: string | null;
  results: { invoiceId: number | string; success: boolean; tallyId?: string; error?: string }[];
}> {
  const results: { invoiceId: number | string; success: boolean; tallyId?: string; error?: string }[] = [];
  let successCount = 0;
  let failCount = 0;
  let lastError: string | null = null;

  for (let i = 0; i < invoicesOrIds.length; i++) {
    const item = invoicesOrIds[i];
    const itemIdentifier = typeof item === 'object' && item !== null
      ? (item.Invoice_Id || item.invoiceNumber || item.id || `Item-${i + 1}`)
      : item;

    onProgress?.(i + 1, invoicesOrIds.length, itemIdentifier);
    try {
      const res = await syncInvoiceToTally(item);
      if (res?.success === true || (res?.status === 200 && res?.success !== false) || res?.status === 'success') {
        successCount++;
        results.push({
          invoiceId: itemIdentifier,
          success: true,
          tallyId: res?.tally_id || res?.Tally_Id,
        });
      } else {
        failCount++;
        const errMsg = res?.error || res?.details || res?.message || 'Sync failed';
        lastError = errMsg;
        results.push({ invoiceId: itemIdentifier, success: false, error: errMsg });
      }
    } catch (err: any) {
      failCount++;
      const errMsg = err?.data?.error || err?.data?.message || err?.message || 'Tally Sync Server Error';
      lastError = errMsg;
      results.push({ invoiceId: itemIdentifier, success: false, error: errMsg });
    }
  }

  return { successCount, failCount, lastError, results };
}

/**
 * Normalizes invoice records across POS, standard invoices, and various backend response schemas
 */
export function normalizeInvoiceRecord(inv: any): any {
  if (!inv) return null;

  const id = String(inv.id || inv.Invoice_Id || inv.invoiceNumber || inv.Invoice_No || inv.Invoice_code || '');
  const invoiceId = String(
    inv.Invoice_Id || inv.invoiceNumber || inv.Invoice_No || inv.Invoice_code || inv.id || ''
  );
  if (!invoiceId) return null;

  const customerName = String(
    inv.Customer_Name ||
    inv.customerName ||
    (typeof inv.Customer === 'object' && inv.Customer ? inv.Customer.name : null) ||
    (typeof inv.customer === 'object' && inv.customer ? inv.customer.name : null) ||
    'Walk-in Customer'
  );

  const rawDate = inv.Invoice_Date || inv.date || inv.Created_Date || inv.created_at || '';
  const dateStr = rawDate ? String(rawDate) : '';

  // Extract Tax Amount
  let taxAmount = 0;
  if (inv.Tax_Amount !== undefined && inv.Tax_Amount !== null) {
    taxAmount = Number(inv.Tax_Amount);
  } else if (inv.taxAmount !== undefined && inv.taxAmount !== null) {
    taxAmount = Number(inv.taxAmount);
  } else if (inv.Tax !== undefined && inv.Tax !== null) {
    taxAmount = Number(inv.Tax);
  } else if (inv.CGST || inv.SGST) {
    taxAmount = Number(inv.CGST || 0) + Number(inv.SGST || 0);
  } else if (Array.isArray(inv.items) && inv.items.length > 0) {
    taxAmount = inv.items.reduce((s: number, it: any) => s + Number(it.taxAmount || it.Tax || 0), 0);
  } else if (Array.isArray(inv.Invoice_Details) && inv.Invoice_Details.length > 0) {
    taxAmount = inv.Invoice_Details.reduce((s: number, it: any) => s + Number(it.Tax || it.Tax_Amount || 0), 0);
  }

  // Extract Net Amount
  let netAmount = 0;
  if (inv.Net_Amount !== undefined && inv.Net_Amount !== null && Number(inv.Net_Amount) > 0) {
    netAmount = Number(inv.Net_Amount);
  } else if (inv.totalAmount !== undefined && inv.totalAmount !== null && Number(inv.totalAmount) > 0) {
    netAmount = Number(inv.totalAmount);
  } else if (inv.Invoice_Amount !== undefined && inv.Invoice_Amount !== null && Number(inv.Invoice_Amount) > 0) {
    netAmount = Number(inv.Invoice_Amount) + taxAmount;
  } else if (inv.subtotal !== undefined && inv.subtotal !== null && Number(inv.subtotal) > 0) {
    netAmount = Number(inv.subtotal) + taxAmount;
  }

  // Extract Taxable Value / Invoice Amount
  let invoiceAmount = 0;
  if (inv.Invoice_Amount !== undefined && inv.Invoice_Amount !== null && Number(inv.Invoice_Amount) > 0) {
    invoiceAmount = Number(inv.Invoice_Amount);
  } else if (inv.subtotal !== undefined && inv.subtotal !== null && Number(inv.subtotal) > 0) {
    invoiceAmount = Number(inv.subtotal);
  } else if (netAmount > 0) {
    invoiceAmount = Math.max(0, netAmount - taxAmount);
  }

  const rawStatus = String(
    inv.Tally_Sync_Status ||
    inv.tally_sync_status ||
    (inv.is_tally_synced || inv.Tally_Id || inv.tally_id ? 'SUCCESS' : 'PENDING')
  ).trim();
  const tallyStatus = rawStatus.toUpperCase() === 'SUCCESS' ? 'SUCCESS' : 'PENDING';

  const tallyId = inv.Tally_Id || inv.tally_id || (tallyStatus === 'SUCCESS' ? (inv.Tally_Id || invoiceId) : '');

  return {
    ...inv,
    id: id || invoiceId,
    Invoice_Id: invoiceId,
    invoiceNumber: invoiceId,
    Customer_Name: customerName,
    customerName: customerName,
    Invoice_Date: dateStr,
    date: dateStr,
    Invoice_Amount: invoiceAmount,
    subtotal: invoiceAmount,
    Tax_Amount: taxAmount,
    taxAmount: taxAmount,
    Net_Amount: netAmount,
    totalAmount: netAmount,
    Tally_Sync_Status: tallyStatus,
    Tally_Id: tallyId,
    Tally_Sync_Date: inv.Tally_Sync_Date || inv.tally_sync_date || '',
    Store_Name: inv.Store_Name || inv.storeName || (typeof inv.Store_Id === 'object' ? inv.Store_Id?.Store_Name : '') || '',
    Customer_Phone: inv.Customer_Phone || inv.customerPhone || inv.Customer_Mobile || '',
    Payment_Method: inv.Payment_Method || inv.paymentMethod || 'Cash',
    Is_Paid: inv.Is_Paid !== undefined ? inv.Is_Paid : (inv.status === 'Paid'),
  };
}

/**
 * Fetch Sales Invoices for Tally Sync Report
 * Queries all real invoice endpoints and local persistent storage to ensure
 * all actual sales invoices are returned without missing records.
 */
export async function fetchTallyReportInvoices(userId?: number | string): Promise<any[]> {
  const combinedList: any[] = [];
  const seenKeys = new Set<string>();

  const addUnique = (rawItem: any) => {
    const item = normalizeInvoiceRecord(rawItem);
    if (!item) return;
    const key = String(item.Invoice_Id || item.id || '').trim().toLowerCase();
    if (!key) return;

    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combinedList.push(item);
    } else {
      // Merge enriched information if available
      const existingIdx = combinedList.findIndex(
        (x) => String(x.Invoice_Id || x.id || '').trim().toLowerCase() === key
      );
      if (existingIdx !== -1) {
        combinedList[existingIdx] = {
          ...combinedList[existingIdx],
          ...item,
          Tally_Id: item.Tally_Id || combinedList[existingIdx].Tally_Id,
          Tally_Sync_Status:
            item.Tally_Sync_Status === 'SUCCESS'
              ? 'SUCCESS'
              : combinedList[existingIdx].Tally_Sync_Status,
          Tax_Amount: item.Tax_Amount || combinedList[existingIdx].Tax_Amount,
        };
      }
    }
  };

  // 1. Concurrently query available backend invoice endpoints
  const endpoints = [
    '/user/SalesInvoiceAdditional/?Is_Deleted=False',
    '/user/SalesInvoiceList/?Is_Deleted=False',
    '/user/SalesInvoiceListwithoutpagination/?Is_Paid=True',
    '/user/SalesInvoiceListwithoutpagination/?Is_Paid=False',
    '/user/SalesInvoiceAllAdditional/',
  ];

  const results = await Promise.allSettled(
    endpoints.map((ep) => fetchFromApi(ep, { method: 'GET' }))
  );

  results.forEach((res) => {
    if (res.status === 'fulfilled' && res.value) {
      const data = res.value;
      const list = Array.isArray(data)
        ? data
        : (data?.results || data?.Result || data?.data || []);
      if (Array.isArray(list)) {
        list.forEach(addUnique);
      }
    }
  });

  // 2. Also incorporate local persistent storage (POS invoices & sales invoices created locally)
  if (typeof window !== 'undefined') {
    try {
      const posLocal = getLocalData<any>('pegatto_pos_invoices');
      if (Array.isArray(posLocal)) {
        posLocal.forEach(addUnique);
      }
      const invLocal = getLocalData<any>('pegatto_invoices');
      if (Array.isArray(invLocal)) {
        invLocal.forEach(addUnique);
      }
    } catch (e) {
      console.warn('Error reading local invoice storage for Tally Report:', e);
    }
  }

  // 3. Sort by Invoice_Date descending (newest first), then by Invoice_Id descending
  combinedList.sort((a, b) => {
    const timeA = a.Invoice_Date ? new Date(a.Invoice_Date).getTime() : 0;
    const timeB = b.Invoice_Date ? new Date(b.Invoice_Date).getTime() : 0;
    if (timeB !== timeA) return timeB - timeA;
    return String(b.Invoice_Id || '').localeCompare(String(a.Invoice_Id || ''));
  });

  return combinedList;
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
