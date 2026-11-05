import { fetchFromApi } from '@/service/apiClient';
import { Invoice, InvoiceItem, InvoicePayment } from '@/types/invoice';

export interface SalesInvoiceSearchParams {
  search: string;
  created_by?: number | string;
  Is_Paid?: boolean;
}

export interface NewITPendingInvoiceSendReminderPayload {
  invoice_id: number;
  User_Id: number;
}

export interface NewITPendingInvoiceListPayload {
  organization_id: number;
  customer_id?: number;
  sales_person_id?: number;
  status?: string;
  due_date?: string;
  page?: number;
  page_size?: number;
}

export interface NewITPendingInvoiceDashboardPayload {
  organization_id: number;
}

/**
 * GET request for SalesInvoiceSearch
 */
export async function searchSalesInvoice(params: SalesInvoiceSearchParams): Promise<any> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  return fetchFromApi(`/user/SalesInvoiceSearch/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * POST request for NewITPendingInvoiceSendReminder
 */
export async function sendPendingInvoiceReminder(payload: NewITPendingInvoiceSendReminderPayload): Promise<any> {
  return fetchFromApi('/user/NewITPendingInvoiceSendReminder/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for NewITPendingInvoiceList
 */
export async function fetchNewITPendingInvoiceList(payload: NewITPendingInvoiceListPayload): Promise<any> {
  return fetchFromApi('/user/NewITPendingInvoiceList/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for NewITPendingInvoiceDashboard
 */
export async function fetchNewITPendingInvoiceDashboard(payload: NewITPendingInvoiceDashboardPayload): Promise<any> {
  return fetchFromApi('/user/NewITPendingInvoiceDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for SalesInvoiceList with Is_Paid parameter and optional pagination page parameters
 */
export async function fetchSalesInvoiceList(isPaid?: boolean | 'All' | 'Paid' | 'Unpaid' | '', page?: number): Promise<any> {
  const params: string[] = [];
  if (isPaid === 'Paid' || isPaid === true) {
    params.push('Is_Paid=True');
  } else if (isPaid === 'Unpaid' || isPaid === false) {
    params.push('Is_Paid=False');
  }
  if (page !== undefined) params.push(`page=${page}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/SalesInvoiceList/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for SalesInvoiceListwithoutpagination
 */
export async function fetchSalesInvoiceListWithoutPagination(isPaid: boolean): Promise<any> {
  return fetchFromApi(`/user/SalesInvoiceListwithoutpagination/?Is_Paid=${isPaid ? 'True' : 'False'}`, {
    method: 'GET',
  });
}

/**
 * GET request for SalesInvoiceSearch with search query
 */
export async function searchSalesInvoiceByName(search: string): Promise<any> {
  return fetchFromApi(`/user/SalesInvoiceSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * POST request for SalesInvoiceCRUD (Create)
 */
export async function createSalesInvoice(payload: any): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId')) : null;

  const rawAccountId = payload.Account_Id;
  const resolvedAccountId = typeof rawAccountId === 'object' && rawAccountId?.id ? Number(rawAccountId.id) : (Number(rawAccountId) || 1);

  const rawSalesId = payload.Sales_Id;
  const resolvedSalesId = typeof rawSalesId === 'object' && rawSalesId?.id ? Number(rawSalesId.id) : (Number(rawSalesId) || 1);

  const rawShipmentId = payload.Shipment_Id;
  const resolvedShipmentId = typeof rawShipmentId === 'object' && rawShipmentId?.id ? Number(rawShipmentId.id) : (Number(rawShipmentId) || 1);

  const rawSalesUserId = payload.SalesUser_Id;
  const resolvedSalesUserId = typeof rawSalesUserId === 'object' && rawSalesUserId?.id ? Number(rawSalesUserId.id) : (Number(rawSalesUserId) || (userId ? Number(userId) : 1));

  const rawStoreId = payload.Store_Id;
  const resolvedStoreId = typeof rawStoreId === 'object' && rawStoreId?.id ? Number(rawStoreId.id) : (Number(rawStoreId) || 1);

  const body = {
    ...payload,
    Account_Id: resolvedAccountId,
    Sales_Id: resolvedSalesId,
    Shipment_Id: resolvedShipmentId,
    SalesUser_Id: resolvedSalesUserId,
    Store_Id: resolvedStoreId,
    Payment_Status: payload.Payment_Status || 'Payment Pending',
    ...(userId && !payload.Created_By ? { Created_By: Number(userId), Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  return fetchFromApi('/user/SalesInvoiceCRUD/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request for SalesInvoiceCRUD (Edit - supports body ID or query param with PATCH fallback)
 */
export async function updateSalesInvoice(payload: any): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId')) : null;

  const rawAccountId = payload.Account_Id;
  const resolvedAccountId = typeof rawAccountId === 'object' && rawAccountId?.id ? Number(rawAccountId.id) : (Number(rawAccountId) || 1);

  const rawSalesId = payload.Sales_Id;
  const resolvedSalesId = typeof rawSalesId === 'object' && rawSalesId?.id ? Number(rawSalesId.id) : (Number(rawSalesId) || 1);

  const rawShipmentId = payload.Shipment_Id;
  const resolvedShipmentId = typeof rawShipmentId === 'object' && rawShipmentId?.id ? Number(rawShipmentId.id) : (Number(rawShipmentId) || 1);

  const rawSalesUserId = payload.SalesUser_Id;
  const resolvedSalesUserId = typeof rawSalesUserId === 'object' && rawSalesUserId?.id ? Number(rawSalesUserId.id) : (Number(rawSalesUserId) || (userId ? Number(userId) : 1));

  const rawStoreId = payload.Store_Id;
  const resolvedStoreId = typeof rawStoreId === 'object' && rawStoreId?.id ? Number(rawStoreId.id) : (Number(rawStoreId) || 1);

  const body = {
    ...payload,
    Account_Id: resolvedAccountId,
    Sales_Id: resolvedSalesId,
    Shipment_Id: resolvedShipmentId,
    SalesUser_Id: resolvedSalesUserId,
    Store_Id: resolvedStoreId,
    Payment_Status: payload.Payment_Status || 'Payment Pending',
    ...(userId && !payload.Updated_By ? { Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  try {
    return await fetchFromApi('/user/SalesInvoiceCRUD/', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  } catch (err) {
    const id = body.id || body.Invoice_Id;
    if (id) {
      try {
        return await fetchFromApi(`/user/SalesInvoiceCRUD/?id=${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } catch {
        return await fetchFromApi('/user/SalesInvoiceCRUD/', {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      }
    }
    throw err;
  }
}

/**
 * DELETE request for SalesInvoiceCRUD
 */
export async function deleteSalesInvoiceBackend(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesInvoiceCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * GET request for SalesInvoiceCRUD by ID
 * Endpoint: /user/SalesInvoiceCRUD/?id=${id}
 */
export async function fetchSalesInvoiceById(id: number | string): Promise<any> {
  const isNumeric = /^\d+$/.test(String(id).trim());
  if (isNumeric) {
    try {
      const res = await fetchFromApi(`/user/SalesInvoiceCRUD/?id=${id}`, {
        method: 'GET',
      });
      if (res && (res.id || (Array.isArray(res) && res.length > 0) || (res.results && res.results.length > 0))) {
        return res;
      }
    } catch (e) {
      console.warn('fetchSalesInvoiceById direct fetch failed, trying search fallback...', e);
    }
  }

  // Fallback lookup via search or list
  try {
    const searchRes = await fetchFromApi(`/user/SalesInvoiceSearch/?search=${encodeURIComponent(String(id).trim())}`, { method: 'GET' });
    const list = Array.isArray(searchRes) ? searchRes : (searchRes?.results || []);
    const match = list.find((item: any) => String(item.id) === String(id) || item.Invoice_code === String(id) || item.Invoice_Id === String(id));
    if (match) return match;
  } catch {}

  return null;
}

/**
 * GET request for InvoicesalesPaymentlist (Payment Tab)
 * Endpoint: /user/InvoicesalesPaymentlist/
 */
export async function fetchInvoiceSalesPaymentList(invoiceId: number | string): Promise<any> {
  const numId = Number(invoiceId);
  // Try Invoice_Id query param
  try {
    const res = await fetchFromApi(`/user/InvoicesalesPaymentlist/?Invoice_Id=${numId}`, {
      method: 'GET',
    });
    if (res && (Array.isArray(res) || Array.isArray(res.data) || Array.isArray(res.results))) {
      return res;
    }
  } catch (e) {
    console.warn('GET /user/InvoicesalesPaymentlist/?Invoice_Id= failed, trying lowercase invoice_id...', e);
  }

  // Try invoice_id query param
  try {
    const res2 = await fetchFromApi(`/user/InvoicesalesPaymentlist/?invoice_id=${numId}`, {
      method: 'GET',
    });
    if (res2 && (Array.isArray(res2) || Array.isArray(res2.data) || Array.isArray(res2.results))) {
      return res2;
    }
  } catch {}

  // Try general SalesPaymentSearch or filter
  try {
    const res3 = await fetchFromApi(`/user/SalesPaymentSearch/?search=${invoiceId}`, {
      method: 'GET',
    });
    if (res3 && (Array.isArray(res3) || Array.isArray(res3.results))) {
      return res3;
    }
  } catch {}

  return { results: [] };
}

/**
 * GET request for UserDropdownAPI
 */
export async function fetchUserDropdownList(): Promise<any> {
  return fetchFromApi('/user/UserDropdownAPI/', {
    method: 'GET',
  });
}

/**
 * GET request for accountfulllist
 */
export async function fetchAccountFullList(): Promise<any> {
  return fetchFromApi('/user/accountfulllist/', {
    method: 'GET',
  });
}

/**
 * Maps a backend invoice object to the frontend Invoice type.
 */
export function mapBackendToInvoice(bk: any): Invoice {
  const rawDate = bk.Invoice_Date || bk.date || bk.Created_Date;
  const rawDueDate = bk.Due_Date || bk.date || rawDate;
  const invoiceDateParsed = rawDate ? new Date(rawDate) : new Date();
  const dueDateParsed = rawDueDate ? new Date(rawDueDate) : new Date();

  const formattedInvoiceDate = invoiceDateParsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedDueDate = dueDateParsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Calculate status
  let status: 'Paid' | 'Pending' | 'Overdue' | 'Due Soon' | 'Draft' = 'Pending';
  if (bk.Is_Paid || bk.status === 'Paid' || bk.Payment_Status === 'Paid') {
    status = 'Paid';
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDateParsed.setHours(0, 0, 0, 0);
    if (dueDateParsed < today) {
      status = 'Overdue';
    } else if (dueDateParsed.getTime() - today.getTime() <= 3 * 24 * 60 * 60 * 1000) {
      status = 'Due Soon';
    }
  }

  // Map invoice items
  let items: InvoiceItem[] = [];
  if (Array.isArray(bk.Invoice_Details) && bk.Invoice_Details.length > 0) {
    items = bk.Invoice_Details.map((item: any, idx: number) => ({
      id: String(item.id || idx),
      description: item.Product_Name || item.Item_Name || item.description || item.product_name || 'Line Item',
      details: item.Item_Details || item.details || item.Description || item.description || '',
      quantity: Number(item.Quantity || item.quantity || item.Shipment_Quantity || 1),
      rate: Number(item.Rate || item.rate || item.Unit_Price || item.unit_price || 0),
      tax: item.Tax_Percentage ? `${item.Tax_Percentage}% GST` : (item.Tax ? `${item.Tax}% GST` : (item.tax || '18% GST')),
      amount: Number(item.Amount || item.amount || item.Final_Price || item.final_price || item.Net_Amount || (Number(item.Quantity || item.Shipment_Quantity || 1) * Number(item.Unit_Price || item.Rate || 0))),
    }));
  } else if (Array.isArray(bk.items) && bk.items.length > 0) {
    items = bk.items.map((it: any, idx: number) => ({
      id: String(it.id || idx),
      description: it.product?.name || it.name || it.description || 'Line Item',
      details: it.product?.sku || it.details || '',
      quantity: Number(it.quantity || 1),
      rate: Number(it.rate || it.product?.price || 0),
      tax: `${it.product?.taxRate || 18}% GST`,
      amount: Number(it.total || (Number(it.quantity || 1) * Number(it.rate || 0))),
    }));
  }

  // If no items, add a fallback item showing total
  if (items.length === 0) {
    const totalVal = Number(bk.Sub_Total || bk.Invoice_Amount || bk.subtotal || bk.Net_Amount || bk.totalAmount || 0);
    items.push({
      id: 'itm-1',
      description: bk.Order_No ? `Sales Order #${bk.Order_No} Items` : 'Sales Invoice Billing',
      details: bk.Invoice_Note || bk.notes || 'Standard retail billing item',
      quantity: 1,
      rate: totalVal,
      tax: '18% GST',
      amount: totalVal
    });
  }

  // Construct payments list
  const payments: InvoicePayment[] = [];
  const recAmt = Number(bk.Amount_Received ?? bk.amountReceived ?? (bk.Is_Paid || bk.status === 'Paid' ? (bk.Net_Amount || bk.totalAmount) : 0));
  if (recAmt > 0) {
    payments.push({
      id: 'pay-1',
      paymentMethod: bk.Payment_Method || bk.paymentMethod || 'Cash',
      transactionId: bk.Reference_Id || bk.receiptNo || `TXN-${bk.id}`,
      paymentDate: formattedInvoiceDate,
      amountPaid: recAmt
    });
  }

  const subTotalVal = Number(bk.Sub_Total || bk.Invoice_Amount || bk.subtotal || 0);
  const discountVal = Number(bk.Discount_Amount || bk.discountAmount || bk.Spl_Discount || 0);
  const taxVal = Number(bk.Tax_Amount || bk.taxAmount || 0);
  const totalVal = Number(bk.Net_Amount || bk.Invoice_Amount || bk.totalAmount || (subTotalVal - discountVal + taxVal));

  return {
    id: String(bk.id),
    invoiceNumber: bk.Invoice_code || bk.Invoice_Id || bk.invoiceNumber || `INV-${bk.id}`,
    status,
    billedTo: {
      companyName: bk.Customer_Name || bk.CustomerName || bk.customerName || 'Unknown Customer',
      contactPerson: bk.Contact_Person || bk.ContactPerson || bk.Customer_Name || bk.CustomerName || bk.customerName || '',
      email: bk.Customer_Email || bk.CustomerEmail || bk.email || '',
      mobileNumber: bk.Customer_Mobile || bk.Customer_Phone || bk.customerPhone || bk.mobileNumber || '',
      address: bk.Customer_Address || bk.Delivery_Address || bk.delivery || bk.address || ''
    },
    invoiceDate: formattedInvoiceDate,
    dueDate: formattedDueDate,
    terms: bk.Terms || bk.Payment_Terms || 'Net 30 Days',
    salesOwner: bk.Sales_Person || bk.Sales_Owner || bk.salesman || bk.cashierName || 'Sales Person',
    amountDue: status === 'Paid' ? 0 : Math.max(0, totalVal - recAmt),
    subTotal: subTotalVal,
    discount: discountVal,
    taxableAmount: Math.max(0, subTotalVal - discountVal),
    cgst: Number(bk.CGST_Amount || (taxVal / 2)),
    sgst: Number(bk.SGST_Amount || (taxVal / 2)),
    total: totalVal,
    items,
    payments,
    notes: bk.Invoice_Note || bk.notes ? [{ id: 'note-1', content: bk.Invoice_Note || bk.notes, date: formattedInvoiceDate, user: bk.Sales_Person || bk.cashierName || 'System' }] : [],
    attachments: [],
    activities: [],
    relatedDeal: bk.Order_No || bk.relatedDeal || '',
    relatedAccount: bk.Customer_Name || bk.CustomerName || bk.customerName || '',
    createdBy: bk.Created_By ? String(bk.Created_By) : 'System',
    createdAt: bk.Invoice_Date || bk.date || '',
    updatedAt: bk.Invoice_Date || bk.date || ''
  };
}

/**
 * Maps the frontend Invoice type back to a backend payload.
 */
export function mapInvoiceToBackend(inv: Invoice, originalBk: any = {}): any {
  const userId = localStorage.getItem('userId')

  const formatDateString = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) { }
    return new Date().toISOString().split('T')[0];
  };

  const invoiceDateStr = formatDateString(inv.invoiceDate);
  const dueDateStr = formatDateString(inv.dueDate);

  const invoiceDetails = inv.items.map((item, idx) => ({
    id: isNaN(Number(item.id)) ? undefined : Number(item.id),
    Item_Name: item.description,
    Item_Details: item.details,
    Quantity: item.quantity,
    Rate: item.rate,
    Tax_Percentage: parseFloat(item.tax) || 18,
    Amount: item.amount
  }));

  const payload: any = {
    ...originalBk,
    Organization_Id: localStorage.getItem("Organization_Id"),
    Project_Id: originalBk.Project_Id,
    Invoice_code: inv.invoiceNumber,
    Customer_Name: inv.billedTo.companyName,
    Order_No: inv.relatedDeal,
    Sales_Person: inv.salesOwner,
    Order_Date: invoiceDateStr,
    Invoice_Date: invoiceDateStr,
    Shipment_Date: invoiceDateStr,
    Invoice_Amount: inv.subTotal,
    Tax_Amount: (inv.cgst || 0) + (inv.sgst || 0),
    Net_Amount: inv.total,
    Freight_Cost: originalBk.Freight_Cost || 0,
    Discount_Amount: inv.discount,
    Shipment_No: originalBk.Shipment_No,
    Booking_Id: null,
    Invoice_Details: invoiceDetails,
    Approval_Status: originalBk.Approval_Status || false,
    BookingStageName: originalBk.BookingStageName || "Confirmed",
    Shipment_Id: originalBk.Shipment_Id ? (typeof originalBk.Shipment_Id === 'object' ? originalBk.Shipment_Id.id : Number(originalBk.Shipment_Id)) : 1,
    Sales_Id: originalBk.Sales_Id ? (typeof originalBk.Sales_Id === 'object' ? originalBk.Sales_Id.id : Number(originalBk.Sales_Id)) : 1,
    Store_Id: originalBk.Store_Id ? (typeof originalBk.Store_Id === 'object' ? originalBk.Store_Id.id : Number(originalBk.Store_Id)) : 1,
    Account_Id: originalBk.Account_Id ? (typeof originalBk.Account_Id === 'object' ? originalBk.Account_Id.id : Number(originalBk.Account_Id)) : 1,
    SalesUser_Id: originalBk.SalesUser_Id ? (typeof originalBk.SalesUser_Id === 'object' ? originalBk.SalesUser_Id.id : Number(originalBk.SalesUser_Id)) : Number(userId || 1),
    Payment_Status: inv.status === 'Paid' ? 'Paid' : 'Pending',
    Advance_Amount: inv.payments.reduce((sum, p) => sum + p.amountPaid, 0),
    Invoice_Type: originalBk.Invoice_Type || "Sales",
    Reference_Id: inv.payments[0]?.transactionId || null,
    Is_Replacement: originalBk.Is_Replacement || false,
    POS_Details: originalBk.POS_Details || {},
    Customer_Mobile: inv.billedTo.mobileNumber,
    Customer_Address: inv.billedTo.address,
    Customer_Email: inv.billedTo.email,
    Delivery_Boy: originalBk.Delivery_Boy,
    Packing_Charges: originalBk.Packing_Charges,
    Amount_Received: inv.payments.reduce((sum, p) => sum + p.amountPaid, 0),
    Refund_Amount: originalBk.Refund_Amount,
    Discount_Reason: originalBk.Discount_Reason,
    Given_By: originalBk.Given_By,
    Payment_Method: inv.payments[0]?.paymentMethod,
    Membership_Id: originalBk.Membership_Id,
    CGST_Percentage: inv.taxableAmount > 0 ? (inv.cgst / inv.taxableAmount) * 100 : 9.00,
    CGST_Amount: inv.cgst || 0,
    SGST_Percentage: inv.taxableAmount > 0 ? (inv.sgst / inv.taxableAmount) * 100 : 9.00,
    SGST_Amount: inv.sgst || 0,
    IGST_Percentage: 0.00,
    IGST_Amount: 0.00,
    Is_Paid: inv.status === 'Paid',
    Counter_Id: originalBk.Counter_Id,
    Is_Deleted: false,
    Created_By: Number(userId),
    Updated_By: Number(userId),
    Due_Date: dueDateStr,
    Terms: inv.terms,
    Sub_Total: inv.subTotal,
    Invoice_Note: inv.notes[0]?.content || "Thank you for your business."
  };

  if (originalBk && originalBk.id) {
    payload.Invoice_Id = inv.invoiceNumber || originalBk.Invoice_Id;
  }

  if (inv.id && !isNaN(Number(inv.id))) {
    payload.id = Number(inv.id);
  }

  return payload;
}

/**
 * POST request for SalesInvoiceFilter
 */
export async function filterSalesInvoices(payload: any): Promise<any> {
  return fetchFromApi('/user/SalesInvoiceFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── POS Invoice APIs ─────────────────────────────────────────────────────────────
export interface PosInvoiceFilterParams {
  page?: number;
  search?: string;
  status?: string;
  customer?: string;
  Invoice_Type?: string;
}

export async function fetchPosInvoicesAPI(params: PosInvoiceFilterParams = {}): Promise<any> {
  const query = new URLSearchParams();
  if (params.Invoice_Type) query.append('Invoice_Type', params.Invoice_Type);
  if (params.page) query.append('page', String(params.page));
  if (params.search) query.append('search', params.search);
  if (params.status && params.status !== 'All') query.append('status', params.status);
  if (params.customer && params.customer !== 'All') query.append('customer', params.customer);

  try {
    return await fetchFromApi(`/user/SalesInvoiceAdditional/?${query.toString()}`, { method: 'GET' });
  } catch {
    try {
      return await fetchFromApi(`/user/SalesInvoiceList/?${query.toString()}`, { method: 'GET' });
    } catch {
      return await fetchFromApi(`/user/SalesInvoiceAllAdditional/?${query.toString()}`, { method: 'GET' });
    }
  }
}

export async function fetchPosInvoiceStatsAPI(): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('UserId') || localStorage.getItem('userId')) : null;
  return fetchFromApi('/user/SalesInvoiceDashboardAPI/', {
    method: 'POST',
    body: JSON.stringify({
      UserId: Number(userId) || 0,
      Invoice_Type: 'POS Invoice',
    }),
  });
}

export async function syncPosInvoiceToTallyAPI(invoiceId: string | number): Promise<any> {
  return fetchFromApi('/user/tally/sync-invoice/', {
    method: 'POST',
    body: JSON.stringify({ invoice_id: invoiceId }),
  });
}

export * from '@/api/transactions';
export {
  getInvoices,
  getInvoicesWithoutPagination,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  patchInvoice,
  deleteInvoice,
  searchInvoices,
  filterInvoices,
  getPosInvoices,
  getInvoiceStats,
  sendInvoiceMail,
  uploadInvoiceFile,
  getOrganizationById,
  updateShipmentStatus,
} from '@/api/invoice';


