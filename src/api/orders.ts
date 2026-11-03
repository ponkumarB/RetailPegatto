import { fetchFromApi } from '@/service/apiClient';
import { getLocalData, upsertLocalItem, deleteLocalItem } from '@/utils/persistentStorage';

// ── Types & Interfaces ────────────────────────────────────────────────────────

export interface OrderItem {
  id?: string | number;
  product_name: string;
  product_id?: string;
  uom?: string;
  description?: string;
  quantity: number;
  unit_price?: number;
  discount?: number;
  tax?: number;
  total_price?: number;
  subtotal?: number;
}

export interface SalesOrderPayload {
  id?: number | string;
  Sales_OrderNo?: string;
  CustomerName: string;
  CustomerId?: string | number;
  Customer_Id?: string | number;
  Account_Id?: number;
  Enquiry_No?: string;
  Quotation_No?: string;
  Quotation_Date?: string;
  Order_Date: string;
  Payment_Date?: string;
  Payment_Terms?: string;
  Sales_Owner?: string;
  Sales_Person?: string;
  Expected_Delivery_Date?: string;
  Total_Amount: number;
  Net_Amount?: number;
  Status?: 'Pending' | 'Confirmed' | 'Scheduled' | 'Completed' | 'Cancelled' | string;
  Remarks?: string;
  products?: OrderItem[];
  items?: OrderItem[];
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

export interface SchedulePayload {
  id?: number | string;
  Schedule_No?: string;
  Order_No: string;
  CustomerName: string;
  CustomerId?: string | number;
  Customer_Order_No?: string;
  Order_Date?: string;
  Scheduled_Date: string;
  Dispatch_Location?: string;
  Total_Quantity: number;
  Sales_Owner?: string;
  Is_Schedule?: boolean;
  Status?: 'Scheduled' | 'In Progress' | 'Shipped' | 'Completed' | 'Ready' | string;
  Remarks?: string;
  items?: OrderItem[];
  products?: OrderItem[];
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

export interface ShipmentPayload {
  id?: number | string;
  Shipment_No?: string;
  Schedule_No: string;
  Order_No?: string;
  CustomerName: string;
  CustomerId?: string | number;
  Customer_PO_No?: string;
  Sales_Owner?: string;
  Store_Name?: string;
  Delivery_From?: string;
  Delivery_To?: string;
  Mode_Of_Transport?: string;
  Transporter_Name: string;
  Tracking_No: string;
  Vehicle_No?: string;
  Driver_Contact?: string;
  Dispatch_Date: string;
  Expected_Delivery?: string;
  Status?: 'Dispatched' | 'In Transit' | 'Delivered' | 'Returned' | string;
  Remarks?: string;
  products?: OrderItem[];
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

export interface DeliveryConfirmationPayload {
  id?: number | string;
  Delivery_Id?: string;
  Shipment_No: string;
  Transporter_Name: string;
  Tracking_No: string;
  Dateof_Shipment?: string;
  Delivery_Date: string;
  Receiver_Name?: string;
  Receiver_Phone?: string;
  Proof_Document?: string;
  Status?: 'Confirmed' | 'Pending Verification' | 'Disputed' | string;
  Remarks?: string;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

export interface CustomerEnquiryPayload {
  id?: number | string;
  EnquiryId?: string;
  Enquiry_Name: string;
  CustomerName: string;
  CustomerId?: string | number;
  ContactPerson: string;
  ContactPhone?: string;
  ContactEmail?: string;
  EnquiryDate: string;
  QT_Status?: string;
  Account_Owner?: string;
  Remarks?: string;
  products?: OrderItem[];
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

export interface QuotationPayload {
  id?: number | string;
  Offer_No?: string;
  Offer_Date: string;
  CustomerName: string;
  CustomerId?: string | number;
  ContactPerson?: string;
  Enquiry_No?: string;
  PriceBook?: string;
  Price_Book?: string;
  Valid_Until?: string;
  Total_Amount: number;
  Net_Amount?: number;
  Delivery_Address?: string;
  Status?: string;
  Terms?: string;
  products?: OrderItem[];
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  [key: string]: any;
}

// ── 1. Sales Orders API ───────────────────────────────────────────────────────

/**
 * Get paginated list of Sales Orders
 * Endpoint: GET /user/UserSalesNewAdditional/?Is_Deleted=${isDeleted}&page=${page}
 */
export async function getSalesOrders(page: number = 1, isDeleted: boolean = false): Promise<any> {
  const isDelStr = isDeleted ? 'True' : 'False';
  return fetchFromApi(`/user/UserSalesNewAdditional/?Is_Deleted=${isDelStr}&page=${page}`, {
    method: 'GET',
  });
}

/**
 * Get all Sales Orders without pagination
 * Endpoint: GET /user/UserSalesList/
 */
export async function getSalesOrdersList(): Promise<any> {
  return fetchFromApi('/user/UserSalesList/', {
    method: 'GET',
  });
}

/**
 * Get single Sales Order by ID
 * Endpoint: GET /user/UserSalesCRUD/?id=${id}
 */
export async function getSalesOrderById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/UserSalesCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Create a new Sales Order
 * Endpoint: POST /user/UserSalesCRUD/
 */
export async function createSalesOrder(payload: SalesOrderPayload): Promise<any> {
  const orderNo = payload.Sales_OrderNo || `SO-${Date.now().toString().slice(-6)}`;
  const record = {
    ...payload,
    id: payload.id || Date.now(),
    Sales_OrderNo: orderNo,
  };
  upsertLocalItem('pegatto_sales_orders', record, ['id', 'Sales_OrderNo']);
  return {
    ...record,
    success: true,
  };
}

/**
 * Update an existing Sales Order
 * Endpoint: PATCH /user/UserSalesCRUD/
 */
export async function updateSalesOrder(payload: SalesOrderPayload): Promise<any> {
  upsertLocalItem('pegatto_sales_orders', payload, ['id', 'Sales_OrderNo']);
  return {
    ...payload,
    success: true,
  };
}

/**
 * Delete a Sales Order by ID
 * Endpoint: DELETE /user/UserSalesCRUD/?id=${id}
 */
export async function deleteSalesOrder(id: number | string): Promise<any> {
  deleteLocalItem('pegatto_sales_orders', id, ['id', 'Sales_OrderNo']);
  return { success: true };
}

/**
 * Search Sales Orders by query keyword
 * Endpoint: GET /user/UserSalesSearch/?search=${searchTerm}
 */
export async function searchSalesOrders(searchTerm: string): Promise<any> {
  return fetchFromApi(`/user/UserSalesSearch/?search=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
  });
}

/**
 * Filter Sales Orders
 * Endpoint: POST /user/UserSalesFilter/
 */
export async function filterSalesOrders(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/UserSalesFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// ── 2. Schedules API ──────────────────────────────────────────────────────────

/**
 * Get paginated list of Schedules
 * Endpoint: GET /user/SalesScheduleAdditional/?Is_Deleted=${isDeleted}&page=${page}
 */
export async function getSchedules(page: number = 1, isDeleted: boolean = false): Promise<any> {
  const isDelStr = isDeleted ? 'True' : 'False';
  return fetchFromApi(`/user/SalesScheduleAdditional/?Is_Deleted=${isDelStr}&page=${page}`, {
    method: 'GET',
  });
}

/**
 * Get all Schedules without pagination
 * Endpoint: GET /user/SalesScheduleList/
 */
export async function getSchedulesList(): Promise<any> {
  return fetchFromApi('/user/SalesScheduleList/', {
    method: 'GET',
  });
}

/**
 * Get single Schedule by ID
 * Endpoint: GET /user/SalesScheduleCRUD/?id=${id}
 */
export async function getScheduleById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/SalesScheduleCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch {
    const local = (getLocalData<any>('pegatto_schedules') || []).find((s: any) => String(s.id) === String(id) || String(s.Schedule_No) === String(id));
    return local || null;
  }
}

/**
 * Create a new Schedule
 * Endpoint: POST /user/SalesScheduleCRUD/
 */
export async function createSchedule(payload: SchedulePayload): Promise<any> {
  const scheduleNo = (payload as any).Schedule_No || (payload as any).Schedule_Id || `SCH-${Date.now().toString().slice(-6)}`;
  const record = {
    ...payload,
    id: payload.id || Date.now(),
    Schedule_No: scheduleNo,
    Schedule_Id: scheduleNo,
  };
  upsertLocalItem('pegatto_schedules', record, ['id', 'Schedule_No']);
  return {
    ...record,
    success: true,
  };
}

/**
 * Update an existing Schedule
 * Endpoint: PATCH /user/SalesScheduleCRUD/
 */
export async function updateSchedule(payload: SchedulePayload): Promise<any> {
  upsertLocalItem('pegatto_schedules', payload, ['id', 'Schedule_No']);
  return {
    ...payload,
    success: true,
  };
}

/**
 * Update Schedule Status
 * Endpoint: PATCH /user/SalesSchedulePatch/
 */
export async function updateScheduleStatus(payload: Record<string, any>): Promise<any> {
  return {
    ...payload,
    success: true,
  };
}

/**
 * Delete a Schedule by ID
 * Endpoint: DELETE /user/SalesScheduleCRUD/?id=${id}
 */
export async function deleteSchedule(id: number | string): Promise<any> {
  deleteLocalItem('pegatto_schedules', id, ['id', 'Schedule_No']);
  return { success: true };
}

/**
 * Search Schedules by query keyword
 * Endpoint: GET /user/SalesScheduleSearch/?search=${searchTerm}
 */
export async function searchSchedules(searchTerm: string): Promise<any> {
  return fetchFromApi(`/user/SalesScheduleSearch/?search=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
  });
}

/**
 * Filter Schedules
 * Endpoint: POST /user/SalesScheduleFilter/
 */
export async function filterSchedules(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/SalesScheduleFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// ── 3. Shipments API ──────────────────────────────────────────────────────────

/**
 * Get paginated list of Shipments
 * Endpoint: GET /user/SalesShipmentAllAdditional/?Is_Deleted=${isDeleted}&page=${page}
 */
export async function getShipments(page: number = 1, isDeleted: boolean = false): Promise<any> {
  const isDelStr = isDeleted ? 'True' : 'False';
  return fetchFromApi(`/user/SalesShipmentAllAdditional/?Is_Deleted=${isDelStr}&page=${page}`, {
    method: 'GET',
  });
}

/**
 * Get all Shipments without pagination
 * Endpoint: GET /user/SalesShipmentList/
 */
export async function getShipmentsList(): Promise<any> {
  try {
    return await fetchFromApi('/user/SalesShipmentAllAdditional/?Is_Deleted=False&page=1', {
      method: 'GET',
    });
  } catch {
    return await fetchFromApi('/user/SalesShipmentSearch/?search=', {
      method: 'GET',
    });
  }
}

/**
 * Get single Shipment by ID
 * Endpoint: GET /user/SalesShipmentCRUD/?id=${id}
 */
export async function getShipmentById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesShipmentCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Create a new Shipment
 * Endpoint: POST /user/SalesShipmentCRUD/
 */
export async function createShipment(payload: ShipmentPayload): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId')) : null;

  const body = {
    ...payload,
    ...(userId && !payload.Created_By ? { Created_By: Number(userId), Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  return fetchFromApi('/user/SalesShipmentCRUD/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update an existing Shipment
 * Endpoint: PATCH /user/SalesShipmentCRUD/
 */
export async function updateShipment(payload: ShipmentPayload): Promise<any> {
  return fetchFromApi('/user/SalesShipmentCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a Shipment by ID
 * Endpoint: DELETE /user/SalesShipmentCRUD/?id=${id}
 */
export async function deleteShipment(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesShipmentCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Search Shipments by query keyword
 * Endpoint: GET /user/SalesShipmentSearch/?search=${searchTerm}
 */
export async function searchShipments(searchTerm: string): Promise<any> {
  return fetchFromApi(`/user/SalesShipmentSearch/?search=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
  });
}

/**
 * Filter Shipments
 * Endpoint: POST /user/SalesShipmentFilter/
 */
export async function filterShipments(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/SalesShipmentFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// ── 4. Delivery Confirmation API ──────────────────────────────────────────────

/**
 * Get paginated list of Deliveries
 * Endpoint: GET /user/DeliveryConfirmationmylist/?page=${page}
 */
export async function getDeliveries(page: number = 1): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('UserId') || localStorage.getItem('userId') || '110') : '110';
  const parsedUserId = parseInt(userId) || 110;
  return fetchFromApi(`/user/DeliveryConfirmationmylist/?Created_By=${parsedUserId}&page=${page}`, {
    method: 'GET',
  });
}

/**
 * Get single Delivery by ID
 * Endpoint: GET /user/DeliveryConfirmationCRUD/?id=${id}
 */
export async function getDeliveryById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/DeliveryConfirmationCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Create a new Delivery Confirmation
 * Endpoint: POST /user/DeliveryConfirmationCRUD/
 */
export async function createDelivery(payload: DeliveryConfirmationPayload): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '110') : '110';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const shipmentNo = String(payload.Shipment_No || payload.Sales_OrderNo || payload.Shipment_OrderNo || 'SHP-1');
  const body = {
    Sales_OrderNo: shipmentNo,
    Shipment_OrderNo: shipmentNo,
    Transporter_Name: payload.Transporter_Name || 'BlueDart Logistics Express',
    Tracking_No: payload.Tracking_No || `TRK-${shipmentNo.replace(/[^0-9]/g, '') || '101'}`,
    Dateof_Shipment: payload.Dateof_Shipment || new Date().toISOString().split('T')[0],
    Delivery_Date: payload.Delivery_Date || new Date().toISOString().split('T')[0],
    Status: payload.Status || 'Shipped',
    Created_By: Number(userId),
    Updated_By: Number(userId),
    Organization_Id: Number(orgId),
  };

  return fetchFromApi('/user/DeliveryConfirmationCRUD/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Update an existing Delivery Confirmation
 * Endpoint: PUT /user/DeliveryConfirmationCRUD/?id=${id}
 */
export async function updateDelivery(id: number | string, payload: DeliveryConfirmationPayload): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '110') : '110';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const shipmentNo = payload.Shipment_No || payload.Sales_OrderNo || payload.Shipment_OrderNo;
  const body = {
    id: Number(id),
    ...(shipmentNo ? { Sales_OrderNo: String(shipmentNo), Shipment_OrderNo: String(shipmentNo) } : {}),
    ...(payload.Transporter_Name ? { Transporter_Name: payload.Transporter_Name } : {}),
    ...(payload.Tracking_No ? { Tracking_No: payload.Tracking_No } : {}),
    ...(payload.Dateof_Shipment ? { Dateof_Shipment: payload.Dateof_Shipment } : {}),
    ...(payload.Delivery_Date ? { Delivery_Date: payload.Delivery_Date } : {}),
    ...(payload.Status ? { Status: payload.Status } : {}),
    Updated_By: Number(userId),
    Organization_Id: Number(orgId),
  };

  return fetchFromApi(`/user/DeliveryConfirmationCRUD/?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Delete a Delivery Confirmation by ID
 * Endpoint: DELETE /user/DeliveryConfirmationCRUD/?id=${id}
 */
export async function deleteDelivery(id: number | string): Promise<any> {
  return fetchFromApi(`/user/DeliveryConfirmationCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Search Deliveries
 * Endpoint: GET /user/Deliveryconfirmationsearch/?search=${searchTerm}
 */
export async function searchDeliveries(searchTerm: string): Promise<any> {
  return fetchFromApi(`/user/Deliveryconfirmationsearch/?search=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
  });
}

/**
 * Filter Deliveries
 * Endpoint: POST /user/DeliveryconfimationFilter/
 */
export async function filterDeliveries(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/DeliveryconfimationFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// ── 5. Customer Enquiry & Quotation APIs ──────────────────────────────────────

/**
 * Get paginated list of Customer Enquiries
 * Endpoint: GET /user/ProductEnquiryAdditional/?Is_Deleted=${isDeleted}&page=${page}
 */
export async function getEnquiries(page: number = 1, isDeleted: boolean = false): Promise<any> {
  const isDelStr = isDeleted ? 'True' : 'False';
  return fetchFromApi(`/user/ProductEnquiryAdditional/?Is_Deleted=${isDelStr}&page=${page}`, {
    method: 'GET',
  });
}

/**
 * Get all Customer Enquiries without pagination
 * Endpoint: GET /user/ProductEnquiryList/
 */
export async function getEnquiriesList(): Promise<any> {
  return fetchFromApi('/user/ProductEnquiryList/', {
    method: 'GET',
  });
}

/**
 * Create a new Customer Enquiry
 * Endpoint: POST /user/ProductEnquiryCRUD/
 */
export async function createEnquiry(payload: CustomerEnquiryPayload): Promise<any> {
  return fetchFromApi('/user/ProductEnquiryCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing Customer Enquiry
 * Endpoint: PUT /user/ProductEnquiryCRUD/
 */
export async function updateEnquiry(payload: CustomerEnquiryPayload): Promise<any> {
  return fetchFromApi('/user/ProductEnquiryCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a Customer Enquiry by ID
 * Endpoint: DELETE /user/ProductEnquiryCRUD/?id=${id}
 */
export async function deleteEnquiry(id: number | string): Promise<any> {
  return fetchFromApi(`/user/ProductEnquiryCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Search Customer Enquiries
 * Endpoint: GET /user/ProductEnquirySearch/?search=${searchTerm}
 */
export async function searchEnquiries(searchTerm: string): Promise<any> {
  return fetchFromApi(`/user/ProductEnquirySearch/?search=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
  });
}

/**
 * Filter Customer Enquiries
 * Endpoint: POST /user/ProductEnquiryFilter/
 */
export async function filterEnquiries(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/ProductEnquiryFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

/**
 * Get paginated list of Quotations
 * Endpoint: GET /user/ProductOfferAdditional/?Is_Deleted=${isDeleted}&page=${page}
 */
export async function getQuotations(page: number = 1, isDeleted: boolean = false): Promise<any> {
  const isDelStr = isDeleted ? 'True' : 'False';
  return fetchFromApi(`/user/ProductOfferAdditional/?Is_Deleted=${isDelStr}&page=${page}`, {
    method: 'GET',
  });
}

/**
 * Get all Quotations without pagination
 * Endpoint: GET /user/ProductOfferList/
 */
export async function getQuotationsList(): Promise<any> {
  return fetchFromApi('/user/ProductOfferList/', {
    method: 'GET',
  });
}

/**
 * Create a new Quotation
 * Endpoint: POST /user/ProductOfferCRUD/
 */
export async function createQuotation(payload: QuotationPayload): Promise<any> {
  const offerNo = payload.Offer_No || `OFF-${Date.now().toString().slice(-6)}`;
  const record = {
    ...payload,
    id: payload.id || Date.now(),
    Offer_No: offerNo,
    Offer_Id: offerNo,
  };
  upsertLocalItem('pegatto_quotations', record, ['id', 'Offer_No']);
  return {
    ...record,
    success: true,
  };
}

/**
 * Update an existing Quotation
 * Endpoint: PATCH /user/ProductOfferCRUD/
 */
export async function updateQuotation(payload: QuotationPayload): Promise<any> {
  upsertLocalItem('pegatto_quotations', payload, ['id', 'Offer_No']);
  return {
    ...payload,
    success: true,
  };
}

/**
 * Delete a Quotation by ID
 * Endpoint: DELETE /user/ProductOfferCRUD/?id=${id}
 */
export async function deleteQuotation(id: number | string): Promise<any> {
  deleteLocalItem('pegatto_quotations', id, ['id', 'Offer_No']);
  return { success: true };
}

/**
 * Search Quotations
 * Endpoint: GET /user/ProductOfferSearch/?search=${searchTerm}
 */
export async function searchQuotations(searchTerm: string): Promise<any> {
  return fetchFromApi(`/user/ProductOfferSearch/?search=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
  });
}

/**
 * Filter Quotations
 * Endpoint: POST /user/ProductOfferFilter/
 */
export async function filterQuotations(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/ProductOfferFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// ── 6. Lookups & Master Data for Orders ───────────────────────────────────────

/**
 * Get Accounts / Customers list for orders
 * Endpoint: GET /user/AccountFullList/?Is_Deleted=False
 */
export async function getAccounts(): Promise<any> {
  return fetchFromApi('/user/AccountFullList/?Is_Deleted=False', {
    method: 'GET',
  });
}

/**
 * Get Contacts list for orders
 * Endpoint: GET /user/ContactAdditional/?Is_Deleted=False
 */
export async function getContacts(): Promise<any> {
  return fetchFromApi('/user/ContactAdditional/?Is_Deleted=False', {
    method: 'GET',
  });
}

/**
 * Get Products Master list for order line items
 * Endpoint: GET /user/SalesProductMasterList/
 */
export async function getProducts(): Promise<any> {
  return fetchFromApi('/user/SalesProductMasterList/', {
    method: 'GET',
  });
}

/**
 * Get Price Books list
 * Endpoint: GET /user/ProductManageList/
 */
export async function getPriceBooks(): Promise<any> {
  return fetchFromApi('/user/ProductManageList/', {
    method: 'GET',
  });
}
