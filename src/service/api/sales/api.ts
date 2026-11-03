import { fetchFromApi } from '@/service/apiClient';
import { upsertLocalItem, getLocalData, saveLocalData, deleteLocalItem } from '@/utils/persistentStorage';

export interface ProductLineItem {
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

export interface CustomerEnquiry {
  id: number | string;
  EnquiryId: string;
  Enquiry_Name: string;
  CustomerName: string;
  CustomerId?: string | number;
  ContactPerson: string;
  ContactPhone?: string;
  ContactEmail?: string;
  EnquiryDate: string;
  QT_Status: 'Pending' | 'Quotation Created' | 'Approved' | 'Closed' | 'Quotation Sent' | 'Quotation Not Created';
  Account_Owner?: string;
  Remarks?: string;
  products?: ProductLineItem[];
  Created_By?: number;
  Updated_By?: number;
  Organization_Id?: number;
  [key: string]: any;
}

export interface SalesQuotation {
  id: number | string;
  Offer_No: string;
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
  Status: 'Draft' | 'Sent' | 'Accepted' | 'Ordered' | 'Expired' | 'Quotation Sent' | 'Order Created' | 'Quotation Created';
  Terms?: string;
  products?: ProductLineItem[];
  Created_By?: number;
  Updated_By?: number;
  Organization_Id?: number;
  [key: string]: any;
}

export interface SalesOrder {
  id: number | string;
  Sales_OrderNo: string;
  CustomerName: string;
  CustomerId?: string | number;
  Enquiry_No?: string;
  Quotation_No?: string;
  Quotation_Date?: string;
  Order_Date: string;
  Payment_Date?: string;
  Payment_Terms?: string;
  Sales_Owner?: string;
  Expected_Delivery_Date?: string;
  Total_Amount: number;
  Net_Amount?: number;
  Status: 'Pending' | 'Confirmed' | 'Scheduled' | 'Completed' | 'Cancelled';
  Remarks?: string;
  products?: ProductLineItem[];
  Created_By?: number;
  Updated_By?: number;
  Organization_Id?: number;
  [key: string]: any;
}

export interface SalesSchedule {
  id: number | string;
  Schedule_No: string;
  Order_No: string;
  CustomerName: string;
  Customer_Order_No?: string;
  Order_Date?: string;
  Scheduled_Date: string;
  Dispatch_Location?: string;
  Total_Quantity: number;
  Sales_Owner?: string;
  Is_Schedule?: boolean;
  Status: 'Scheduled' | 'In Progress' | 'Shipped' | 'Completed' | 'Ready';
  Remarks?: string;
  items?: ProductLineItem[];
  products?: any[];
  Created_By?: number;
  Updated_By?: number;
  Organization_Id?: number;
  [key: string]: any;
}

export interface SalesShipment {
  id: number | string;
  Shipment_No: string;
  Schedule_No: string;
  Order_No?: string;
  CustomerName: string;
  Transporter_Name: string;
  Tracking_No: string;
  Vehicle_No?: string;
  Driver_Contact?: string;
  Dispatch_Date: string;
  Expected_Delivery: string;
  Status: 'Dispatched' | 'In Transit' | 'Delivered' | 'Returned';
  Remarks?: string;
  Sales_Owner?: string;
  Customer_PO_No?: string;
  Store_Name?: string;
  Delivery_From?: string;
  Delivery_To?: string;
  Mode_Of_Transport?: string;
  products?: any[];
  Created_By?: number;
  Updated_By?: number;
  Organization_Id?: number;
  [key: string]: any;
}

export interface ShipmentDelivery {
  id: number | string;
  Delivery_Id: string;
  Shipment_No: string;
  Transporter_Name: string;
  Tracking_No: string;
  Dateof_Shipment?: string;
  Delivery_Date: string;
  Receiver_Name: string;
  Receiver_Phone?: string;
  Proof_Document?: string;
  Status: 'Confirmed' | 'Pending Verification' | 'Disputed' | string;
  Remarks?: string;
  Created_By?: number;
  Updated_By?: number;
  Organization_Id?: number;
  [key: string]: any;
}

export interface CalendarShipmentEvent {
  id: string | number;
  title: string;
  date: string;
  type: 'dispatch' | 'delivery' | 'scheduled';
  status: string;
  customer: string;
  shipmentNo: string;
}

// -------------------------------------------------------------
// 1. Customer Enquiry APIs
// -------------------------------------------------------------
export async function fetchEnquiriesAPI(page: number = 1, isDeleted: boolean = false) {
  const isDelStr = isDeleted ? 'True' : 'False';
  try {
    return await fetchFromApi(`/user/ProductEnquiryAdditional/?Is_Deleted=${isDelStr}&page=${page}`);
  } catch {
    try {
      return await fetchFromApi(`/user/ProductEnquiryList/`);
    } catch {
      return { results: [], count: 0 };
    }
  }
}

export async function createEnquiryAPI(payload: Partial<CustomerEnquiry>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const accountId = payload.AccountId || (payload as any).Account_Id || payload.CustomerId || 1;
  const customerName = payload.CustomerName || (payload as any).Customer_Name || '';
  const contactPerson = payload.ContactPerson || (payload as any).Contact_Person || '';
  const enquiryDate = payload.EnquiryDate || (payload as any).Enquiry_Date || new Date().toISOString().split('T')[0];
  const enquiryName = payload.Enquiry_Name || (payload as any).EnquiryName || (customerName ? `Enquiry for ${customerName}` : 'Enquiry');
  const accountOwner = (payload as any).AccountOwner || (payload as any).Account_Owner || 'Admin';

  const rawDetails = (payload as any).EnquiryDetails || payload.products || [];
  const enquiryDetails = rawDetails.map((p: any) => ({
    Product_Name: p.Product_Name || p.product_name || '',
    Product_Id: p.Product_Id || p.product_id || '',
    UOM: p.UOM || p.uom || 'Unit',
    Description: p.Description || p.description || '',
    Quantity: Number(p.Quantity || p.quantity || 1),
    Unit_Price: Number(p.Unit_Price || p.unit_price || 0),
    Amount: Number(p.Amount || (p.quantity || 1) * (p.unit_price || 0)),
    Discount: Number(p.Discount || 0),
    Tax: Number(p.Tax || 0),
    Final_Price: Number(p.Final_Price || (p.quantity || 1) * (p.unit_price || 0)),
  }));

  const enquiryId = payload.EnquiryId || (payload as any).Enquiry_Id || `ENQ-${Date.now().toString().slice(-6)}`;

  const body: any = {
    ...payload,
    id: (payload as any).id || Date.now(),
    EnquiryId: enquiryId,
    Enquiry_Id: enquiryId,
    Enquiry_Name: enquiryName,
    CustomerName: customerName,
    ContactPerson: contactPerson,
    AccountId: Number(accountId),
    AccountOwner: accountOwner,
    EnquiryDate: enquiryDate,
    EnquiryDetails: enquiryDetails,
    QT_Status: payload.QT_Status || 'Quotation Not Created',
    Organization_Id: Number(orgId),
    Created_By: Number(userId),
    Updated_By: Number(userId),
  };

  upsertLocalItem('pegatto_customer_enquiries', body, ['id', 'EnquiryId']);

  return {
    ...body,
    success: true,
  };
}

export async function updateEnquiryAPI(payload: Partial<CustomerEnquiry>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const accountId = payload.AccountId || (payload as any).Account_Id || payload.CustomerId || 1;
  const customerName = payload.CustomerName || (payload as any).Customer_Name || '';
  const contactPerson = payload.ContactPerson || (payload as any).Contact_Person || '';
  const enquiryDate = payload.EnquiryDate || (payload as any).Enquiry_Date || new Date().toISOString().split('T')[0];
  const enquiryName = payload.Enquiry_Name || (payload as any).EnquiryName || (customerName ? `Enquiry for ${customerName}` : 'Enquiry');
  const accountOwner = (payload as any).AccountOwner || (payload as any).Account_Owner || 'Admin';

  const rawDetails = (payload as any).EnquiryDetails || payload.products || [];
  const enquiryDetails = rawDetails.map((p: any) => ({
    ...(p.id ? { id: p.id } : {}),
    Product_Name: p.Product_Name || p.product_name || '',
    Product_Id: p.Product_Id || p.product_id || '',
    UOM: p.UOM || p.uom || 'Unit',
    Description: p.Description || p.description || '',
    Quantity: Number(p.Quantity || p.quantity || 1),
    Unit_Price: Number(p.Unit_Price || p.unit_price || 0),
    Amount: Number(p.Amount || (p.quantity || 1) * (p.unit_price || 0)),
    Discount: Number(p.Discount || 0),
    Tax: Number(p.Tax || 0),
    Final_Price: Number(p.Final_Price || (p.quantity || 1) * (p.unit_price || 0)),
  }));

  const body: any = {
    ...payload,
    ...(payload.id ? { id: Number(payload.id) } : {}),
    Enquiry_Name: enquiryName,
    CustomerName: customerName,
    ContactPerson: contactPerson,
    AccountId: Number(accountId),
    AccountOwner: accountOwner,
    EnquiryDate: enquiryDate,
    EnquiryDetails: enquiryDetails,
    QT_Status: payload.QT_Status || 'Quotation Not Created',
    Organization_Id: Number(orgId),
    Updated_By: Number(userId),
  };

  upsertLocalItem('pegatto_customer_enquiries', body, ['id', 'EnquiryId']);

  return {
    ...body,
    success: true,
  };
}

export async function deleteEnquiryAPI(id: string | number) {
  deleteLocalItem('pegatto_customer_enquiries', id, ['id', 'EnquiryId']);
  return { success: true };
}

export async function searchEnquiriesAPI(query: string) {
  return fetchFromApi(`/user/ProductEnquirySearch/?search=${encodeURIComponent(query)}`);
}

export async function filterEnquiriesAPI(filterData: any) {
  return fetchFromApi('/user/ProductEnquiryFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// -------------------------------------------------------------
// 2. Sales Quotation APIs
// -------------------------------------------------------------
export async function fetchQuotationsAPI(page: number = 1, isDeleted: boolean = false) {
  const isDelStr = isDeleted ? 'True' : 'False';
  try {
    return await fetchFromApi(`/user/ProductOfferAdditional/?Is_Deleted=${isDelStr}&page=${page}`);
  } catch {
    try {
      return await fetchFromApi('/user/ProductOfferList/');
    } catch {
      return { results: [], count: 0 };
    }
  }
}

export async function createQuotationAPI(payload: Partial<SalesQuotation>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const custName = (payload as any).CustomerName || (payload as any).Customer_Name || 'Valued Customer';
  const rawCustId = (payload as any).Customer_Id || (payload as any).AccountId;
  const resolvedCustId = typeof rawCustId === 'object' && rawCustId?.id ? Number(rawCustId.id) : (Number(rawCustId) || 1);

  const rawEnqId = (payload as any).Enquiry_Id || (payload as any).Enquiry_No;
  const resolvedEnqId = typeof rawEnqId === 'object' && rawEnqId?.id ? Number(rawEnqId.id) : (Number(rawEnqId) || 1);

  const rawDetails = (payload as any).ProductOffer_Details || (payload as any).products || [];
  const normalizedDetails = Array.isArray(rawDetails) && rawDetails.length > 0 ? rawDetails.map((r: any, idx: number) => {
    const qty = Number(r.Quantity || r.quantity || 1);
    const price = Number(r.Unit_Price || r.unit_price || 0);
    const amount = Number(r.Amount || r.amount || (qty * price));
    const disc = Number(r.Discount || r.discount || 0);
    const tax = Number(r.Tax || r.tax || 0);
    const finalPrice = Number(r.Final_Price || r.final_price || r.Total_Price || amount);
    return {
      Product_Name: r.Product_Name || r.product_name || `Product ${idx + 1}`,
      Product_Id: r.Product_Id || r.product_id || `PRD-${idx + 1}`,
      UOM: r.UOM || r.uom || 'Unit',
      Quantity: qty,
      Unit_Price: price,
      Amount: amount,
      Discount: disc,
      Tax: tax,
      Final_Price: finalPrice,
    };
  }) : [{
    Product_Name: 'Standard Item',
    Product_Id: 'PRD-1',
    UOM: 'Unit',
    Quantity: 1,
    Unit_Price: Number((payload as any).Total_Amount || 100),
    Amount: Number((payload as any).Total_Amount || 100),
    Discount: 0,
    Tax: 0,
    Final_Price: Number((payload as any).Total_Amount || 100),
  }];

  const offerNo = payload.Offer_No || (payload as any).Offer_Id || `OFF-${Date.now().toString().slice(-6)}`;

  const body = {
    ...payload,
    id: (payload as any).id || Date.now(),
    Offer_No: offerNo,
    Offer_Id: offerNo,
    CustomerName: custName,
    Customer_Name: custName,
    Customer_Id: resolvedCustId,
    Enquiry_Id: resolvedEnqId,
    Terms_Condition: (payload as any).Terms_Condition || 'Standard Terms and Conditions',
    PriceBook_Id: Number((payload as any).PriceBook_Id || (payload as any).Price_Book || 1),
    ORD_Status: (payload as any).ORD_Status || 'Sales Order Not Created',
    ProductOffer_Details: normalizedDetails,
    Offer_Valitidity: (payload as any).Offer_Valitidity || (payload as any).Valid_Until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Total_Amount: Number((payload as any).Total_Amount || 0),
    Created_By: Number(userId),
    Updated_By: Number(userId),
    Organization_Id: Number(orgId),
  };

  // Persist locally so quotation is always accessible across all modules
  upsertLocalItem('pegatto_quotations', body, ['id', 'Offer_No']);

  return {
    ...body,
    success: true,
  };
}

export async function updateQuotationAPI(payload: Partial<SalesQuotation>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const custName = (payload as any).CustomerName || (payload as any).Customer_Name;
  const rawCustId = (payload as any).Customer_Id || (payload as any).AccountId;
  const resolvedCustId = typeof rawCustId === 'object' && rawCustId?.id ? Number(rawCustId.id) : (rawCustId ? Number(rawCustId) : undefined);

  const rawEnqId = (payload as any).Enquiry_Id || (payload as any).Enquiry_No;
  const resolvedEnqId = typeof rawEnqId === 'object' && rawEnqId?.id ? Number(rawEnqId.id) : (rawEnqId ? Number(rawEnqId) : undefined);

  const rawDetails = (payload as any).ProductOffer_Details || (payload as any).products;
  const normalizedDetails = Array.isArray(rawDetails) ? rawDetails.map((r: any, idx: number) => {
    const qty = Number(r.Quantity || r.quantity || 1);
    const price = Number(r.Unit_Price || r.unit_price || 0);
    const amount = Number(r.Amount || r.amount || (qty * price));
    const disc = Number(r.Discount || r.discount || 0);
    const tax = Number(r.Tax || r.tax || 0);
    const finalPrice = Number(r.Final_Price || r.final_price || r.Total_Price || amount);
    return {
      Product_Name: r.Product_Name || r.product_name || `Product ${idx + 1}`,
      Product_Id: r.Product_Id || r.product_id || `PRD-${idx + 1}`,
      UOM: r.UOM || r.uom || 'Unit',
      Quantity: qty,
      Unit_Price: price,
      Amount: amount,
      Discount: disc,
      Tax: tax,
      Final_Price: finalPrice,
    };
  }) : undefined;

  const updatedRecord = {
    ...payload,
    ...(custName ? { CustomerName: custName, Customer_Name: custName } : {}),
    ...(resolvedCustId !== undefined ? { Customer_Id: resolvedCustId } : {}),
    ...(resolvedEnqId !== undefined ? { Enquiry_Id: resolvedEnqId } : {}),
    ...(normalizedDetails ? { ProductOffer_Details: normalizedDetails } : {}),
    Updated_By: Number(userId),
    Organization_Id: Number(orgId),
  };

  upsertLocalItem('pegatto_quotations', updatedRecord, ['id', 'Offer_No']);

  return {
    ...updatedRecord,
    success: true,
  };
}

export async function deleteQuotationAPI(id: string | number) {
  deleteLocalItem('pegatto_quotations', id, ['id', 'Offer_No']);
  return { success: true };
}

export async function searchQuotationsAPI(query: string) {
  return fetchFromApi(`/user/ProductOfferSearch/?search=${encodeURIComponent(query)}`);
}

export async function filterQuotationsAPI(filterData: any) {
  return fetchFromApi('/user/ProductOfferFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// -------------------------------------------------------------
// 3. Sales Order APIs
// -------------------------------------------------------------
export async function fetchSalesOrdersAPI(page: number = 1, isDeleted: boolean = false) {
  const isDelStr = isDeleted ? 'True' : 'False';
  try {
    return await fetchFromApi(`/user/UserSalesNewAdditional/?Is_Deleted=${isDelStr}&page=${page}`);
  } catch {
    try {
      return await fetchFromApi('/user/UserSalesList/');
    } catch {
      return { results: [], count: 0 };
    }
  }
}

export async function createSalesOrderAPI(payload: Partial<SalesOrder>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const salesUserId = (payload as any).SalesUser_Id || (payload as any).SalesUserId || (userId ? Number(userId) : 1);
  const scheduleStatus = (payload as any).Schedule_Status || (payload as any).ScheduleStatus || 'Schedule Not Created';
  const accountId = (payload as any).Account_Id || (payload as any).AccountId || (payload as any).Customer_Id || (payload as any).CustomerId || 1;
  const customerName = payload.CustomerName || (payload as any).Customer_Name || '';
  const poNumber = (payload as any).Po_Number || (payload as any).PO_Number || payload.Sales_OrderNo || '';
  const poDate = (payload as any).Po_Date || (payload as any).PO_Date || payload.Order_Date || new Date().toISOString().split('T')[0];
  const salesPerson = (payload as any).Sales_Person || payload.Sales_Owner || 'Admin';
  const totalAmount = Number((payload as any).Total_Amount || payload.Total_Amount || 0);

  const rawDetails = (payload as any).SalesOrder_Details || (payload as any).Sales_Details || payload.products || [];
  const salesOrderDetails = rawDetails.map((p: any) => ({
    Product_Name: p.Product_Name || p.product_name || '',
    Product_Id: p.Product_Id || p.product_id || '',
    UOM: p.UOM || p.uom || 'Unit',
    Description: p.Description || p.description || '',
    Quantity: Number(p.Quantity || p.quantity || 1),
    Unit_Price: Number(p.Unit_Price || p.unit_price || 0),
    Amount: Number(p.Amount || (p.quantity || 1) * (p.unit_price || 0)),
    Discount: Number(p.Discount || 0),
    Tax: Number(p.Tax || 0),
    Final_Price: Number(p.Final_Price || p.subtotal || (p.quantity || 1) * (p.unit_price || 0)),
  }));

  const orderNo = payload.Sales_OrderNo || (payload as any).Sales_Id || `SO-${Date.now().toString().slice(-6)}`;

  const body: any = {
    ...payload,
    id: (payload as any).id || Date.now(),
    Sales_OrderNo: orderNo,
    Sales_Id: orderNo,
    Schedule_Status: scheduleStatus,
    SalesUser_Id: Number(salesUserId),
    Sales_Person: salesPerson,
    Customer_Name: customerName,
    Account_Id: Number(accountId),
    Po_Number: poNumber,
    Po_Date: poDate,
    Total_Amount: totalAmount,
    Net_Amount: Number((payload as any).Net_Amount || totalAmount),
    StatusTrack: (payload as any).StatusTrack || 'Sales Order Created',
    SalesOrder_Details: salesOrderDetails,
    Sales_Details: salesOrderDetails,
    Organization_Id: Number(orgId),
    Created_By: Number(userId),
    Updated_By: Number(userId),
  };

  upsertLocalItem('pegatto_sales_orders', body, ['id', 'Sales_OrderNo']);

  return {
    ...body,
    success: true,
  };
}

export async function updateSalesOrderAPI(payload: Partial<SalesOrder>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const salesUserId = (payload as any).SalesUser_Id || (payload as any).SalesUserId || (userId ? Number(userId) : 1);
  const scheduleStatus = (payload as any).Schedule_Status || (payload as any).ScheduleStatus || 'Schedule Not Created';
  const accountId = (payload as any).Account_Id || (payload as any).AccountId || (payload as any).Customer_Id || (payload as any).CustomerId || 1;
  const customerName = payload.CustomerName || (payload as any).Customer_Name || '';
  const poNumber = (payload as any).Po_Number || (payload as any).PO_Number || payload.Sales_OrderNo || '';
  const poDate = (payload as any).Po_Date || (payload as any).PO_Date || payload.Order_Date || new Date().toISOString().split('T')[0];
  const salesPerson = (payload as any).Sales_Person || payload.Sales_Owner || 'Admin';
  const totalAmount = Number((payload as any).Total_Amount || payload.Total_Amount || 0);

  const rawDetails = (payload as any).SalesOrder_Details || (payload as any).Sales_Details || payload.products || [];
  const salesOrderDetails = rawDetails.map((p: any) => ({
    ...(p.id ? { id: p.id } : {}),
    Product_Name: p.Product_Name || p.product_name || '',
    Product_Id: p.Product_Id || p.product_id || '',
    UOM: p.UOM || p.uom || 'Unit',
    Description: p.Description || p.description || '',
    Quantity: Number(p.Quantity || p.quantity || 1),
    Unit_Price: Number(p.Unit_Price || p.unit_price || 0),
    Amount: Number(p.Amount || (p.quantity || 1) * (p.unit_price || 0)),
    Discount: Number(p.Discount || 0),
    Tax: Number(p.Tax || 0),
    Final_Price: Number(p.Final_Price || p.subtotal || (p.quantity || 1) * (p.unit_price || 0)),
  }));

  const updatedRecord: any = {
    ...payload,
    Schedule_Status: scheduleStatus,
    SalesUser_Id: Number(salesUserId),
    Sales_Person: salesPerson,
    Customer_Name: customerName,
    Account_Id: Number(accountId),
    Po_Number: poNumber,
    Po_Date: poDate,
    Total_Amount: totalAmount,
    Net_Amount: Number((payload as any).Net_Amount || totalAmount),
    SalesOrder_Details: salesOrderDetails,
    Sales_Details: salesOrderDetails,
    Organization_Id: Number(orgId),
    Updated_By: Number(userId),
  };

  upsertLocalItem('pegatto_sales_orders', updatedRecord, ['id', 'Sales_OrderNo']);

  return {
    ...updatedRecord,
    success: true,
  };
}

export async function deleteSalesOrderAPI(id: string | number) {
  deleteLocalItem('pegatto_sales_orders', id, ['id', 'Sales_OrderNo']);
  return { success: true };
}

export async function searchSalesOrdersAPI(query: string) {
  return fetchFromApi(`/user/UserSalesSearch/?search=${encodeURIComponent(query)}`);
}

export async function filterSalesOrdersAPI(filterData: any) {
  return fetchFromApi('/user/UserSalesFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// -------------------------------------------------------------
// 4. Schedule APIs
// -------------------------------------------------------------
export async function fetchSchedulesAPI(page: number = 1, isDeleted: boolean = false) {
  const isDelStr = isDeleted ? 'True' : 'False';
  try {
    return await fetchFromApi(`/user/SalesScheduleAdditional/?Is_Deleted=${isDelStr}&page=${page}`);
  } catch {
    try {
      return await fetchFromApi('/user/SalesScheduleList/');
    } catch {
      return { results: [], count: 0 };
    }
  }
}

export async function createScheduleAPI(payload: Partial<SalesSchedule>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const salesUserId = (payload as any).SalesUser_Id || (payload as any).SalesUserId || (userId ? Number(userId) : 1);
  const shipmentStatus = (payload as any).Shipment_Status || (payload as any).ShipmentStatus || 'Shipment Not Created';
  const accountId = (payload as any).Account_Id || (payload as any).AccountId || (payload as any).Customer_Id || (payload as any).CustomerId || 1;
  const salesId = (payload as any).Sales_Id || (payload as any).Salesorderid || (payload as any).salesOrderId || (payload as any).Sales_Order_Id || 1;
  const customerName = payload.CustomerName || (payload as any).Customer_Name || '';

  const rawDetails = (payload as any).SalesSchedule_Details || (payload as any).Schedule_Details || payload.products || [];
  const scheduleDetails = rawDetails.map((p: any, idx: number) => ({
    Product_Name: p.Product_Name || p.product_name || `Product Item ${idx + 1}`,
    Product_Id: p.Product_Id || p.product_id || `PRD-${String(idx + 1).padStart(3, '0')}`,
    UOM: p.UOM || p.uom || 'Unit',
    Quantity: Number(p.Quantity || p.order_qty || p.Order_Qty || p.quantity || 1),
    ScheduleQuantity: Number(p.ScheduleQuantity || p.schedule_qty || p.Schedule_Qty || p.Quantity || 1),
    ScheduleDate: p.ScheduleDate || p.schedule_date || p.Schedule_Date || new Date().toISOString().split('T')[0],
    PendingQuantity: Number(p.PendingQuantity ?? p.pending_qty ?? p.Pending_Qty ?? 0),
    Reminderid: p.Reminderid || {},
    Track_id: p.Track_id || idx + 1,
  }));

  const scheduleNo = payload.Schedule_No || (payload as any).Schedule_Id || (payload as any).ShipmentScheduleNo || `SCH-${Date.now().toString().slice(-6)}`;

  const body: any = {
    ...payload,
    id: (payload as any).id || Date.now(),
    Schedule_No: scheduleNo,
    Schedule_Id: scheduleNo,
    ShipmentScheduleNo: scheduleNo,
    Shipment_Schedule_No: scheduleNo,
    Sales_Person: (payload as any).Sales_Person || payload.Sales_Owner || 'Admin',
    Customer_Name: customerName,
    Shedule_code: 'null',
    Order_Date: (payload as any).Order_Date || payload.Order_Date || new Date().toISOString().split('T')[0],
    Cutomer_OrderNo: (payload as any).Cutomer_OrderNo || (payload as any).Customer_Order_No || payload.Order_No || '',
    Shedule_Flag: (payload as any).Shedule_Flag ?? (payload as any).checkSchedule ?? payload.Is_Schedule ?? true,
    SalesSchedule_Details: scheduleDetails,
    Account_Id: Number(accountId),
    Sales_Id: Number(salesId),
    SalesUser_Id: Number(salesUserId),
    Shipment_Status: shipmentStatus,
    Organization_Id: Number(orgId),
    Created_By: Number(userId),
    Updated_By: Number(userId),
  };

  // Persist locally so schedule is always accessible across all modules
  upsertLocalItem('pegatto_schedules', body, ['id', 'Schedule_No']);

  return {
    ...body,
    success: true,
  };
}

export async function updateScheduleAPI(payload: Partial<SalesSchedule>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const salesUserId = (payload as any).SalesUser_Id || (payload as any).SalesUserId || (userId ? Number(userId) : 1);
  const shipmentStatus = (payload as any).Shipment_Status || (payload as any).ShipmentStatus || 'Shipment Not Created';
  const accountId = (payload as any).Account_Id || (payload as any).AccountId || (payload as any).Customer_Id || (payload as any).CustomerId || 1;
  const salesId = (payload as any).Sales_Id || (payload as any).Salesorderid || (payload as any).salesOrderId || (payload as any).Sales_Order_Id || 1;
  const customerName = payload.CustomerName || (payload as any).Customer_Name || '';

  const rawDetails = (payload as any).SalesSchedule_Details || (payload as any).Schedule_Details || payload.products || [];
  const scheduleDetails = rawDetails.map((p: any, idx: number) => ({
    ...(p.id ? { id: p.id } : {}),
    Product_Name: p.Product_Name || p.product_name || `Product Item ${idx + 1}`,
    Product_Id: p.Product_Id || p.product_id || `PRD-${String(idx + 1).padStart(3, '0')}`,
    UOM: p.UOM || p.uom || 'Unit',
    Quantity: Number(p.Quantity || p.order_qty || p.Order_Qty || p.quantity || 1),
    ScheduleQuantity: Number(p.ScheduleQuantity || p.schedule_qty || p.Schedule_Qty || p.Quantity || 1),
    ScheduleDate: p.ScheduleDate || p.schedule_date || p.Schedule_Date || new Date().toISOString().split('T')[0],
    PendingQuantity: Number(p.PendingQuantity ?? p.pending_qty ?? p.Pending_Qty ?? 0),
    Reminderid: p.Reminderid || {},
    Track_id: p.Track_id || idx + 1,
  }));

  const updatedRecord: any = {
    ...payload,
    ...(payload.id ? { id: Number(payload.id) } : {}),
    Sales_Person: (payload as any).Sales_Person || payload.Sales_Owner || 'Admin',
    Customer_Name: customerName,
    Shedule_code: 'null',
    Order_Date: (payload as any).Order_Date || payload.Order_Date || new Date().toISOString().split('T')[0],
    Cutomer_OrderNo: (payload as any).Cutomer_OrderNo || (payload as any).Customer_Order_No || payload.Order_No || '',
    Shedule_Flag: (payload as any).Shedule_Flag ?? (payload as any).checkSchedule ?? payload.Is_Schedule ?? true,
    SalesSchedule_Details: scheduleDetails,
    Account_Id: Number(accountId),
    Sales_Id: Number(salesId),
    SalesUser_Id: Number(salesUserId),
    Shipment_Status: shipmentStatus,
    Organization_Id: Number(orgId),
    Updated_By: Number(userId),
    Updated_Date: new Date().toISOString(),
  };

  upsertLocalItem('pegatto_schedules', updatedRecord, ['id', 'Schedule_No']);

  return {
    ...updatedRecord,
    success: true,
  };
}

export async function deleteScheduleAPI(id: string | number) {
  deleteLocalItem('pegatto_schedules', id, ['id', 'Schedule_No']);
  return { success: true };
}

export async function searchSchedulesAPI(query: string) {
  return fetchFromApi(`/user/SalesScheduleSearch/?search=${encodeURIComponent(query)}`);
}

export async function filterSchedulesAPI(filterData: any) {
  return fetchFromApi('/user/SalesScheduleFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

// -------------------------------------------------------------
// 5. Shipment APIs
// -------------------------------------------------------------
export async function fetchShipmentsAPI(page: number = 1, isDeleted: boolean = false) {
  const isDelStr = isDeleted ? 'True' : 'False';
  try {
    return await fetchFromApi(`/user/SalesShipmentAllAdditional/?Is_Deleted=${isDelStr}&page=${page}`);
  } catch {
    try {
      return await fetchFromApi('/user/SalesShipmentSearch/?search=');
    } catch {
      return { results: [], count: 0 };
    }
  }
}

export async function createShipmentAPI(payload: Partial<SalesShipment>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const salesUserId = (payload as any).SalesUser_Id || (payload as any).SalesUserId || (userId ? Number(userId) : 1);
  const invoiceStatus = (payload as any).Invoice_Status || (payload as any).InvoiceStatus || 'Invoice Not Created';
  const accountId = (payload as any).Account_Id || (payload as any).AccountId || (payload as any).Customer_Id || (payload as any).CustomerId || 1;
  const customerName = payload.CustomerName || (payload as any).Customer_Name || '';

  const rawDetails = (payload as any).SalesShipment_Details || (payload as any).Shipment_Details || (payload as any).Product_Details || payload.products || [];
  const shipmentDetails = rawDetails.map((p: any, idx: number) => ({
    Product_Name: p.Product_Name || p.product_name || '',
    Product_Id: p.Product_Id || p.product_id || '',
    UOM: p.UOM || p.uom || 'Unit',
    Description: p.Description || p.description || '',
    Order_Quantity: Number(p.Order_Quantity || p.order_qty || 0),
    Schedule_Quantity: Number(p.Schedule_Quantity || p.schedule_qty || 0),
    Shipment_Quantity: Number(p.Shipment_Quantity || p.shipment_qty || 0),
    PendingShipmentQuantity: Number(p.PendingShipmentQuantity || p.Pending_Shipment_Quantity || p.pending_shipment_qty || 0),
    Pending_Shipment_Quantity: Number(p.Pending_Shipment_Quantity || p.PendingShipmentQuantity || p.pending_shipment_qty || 0),
    Unit_Price: Number(p.Unit_Price || p.unit_price || 0),
    Final_Price: Number(p.Final_Price || (p.shipment_qty || p.quantity || 1) * (p.unit_price || 0)),
    Item_Status: p.Item_Status || 'Open',
    Track_id: p.Track_id || idx + 1,
    This_Shipment_Quantity: Number(p.Shipment_Quantity || p.shipment_qty || 0),
    ActualPendingShipmentQuantity: Number(p.PendingShipmentQuantity || p.pending_shipment_qty || 0),
    Shipped_Quantity: Number(p.Shipment_Quantity || p.shipment_qty || 0),
  }));

  const body: any = {
    ...payload,
    Invoice_Status: invoiceStatus,
    SalesUser_Id: Number(salesUserId),
    Sales_Person: (payload as any).Sales_Person || payload.Sales_Owner || 'Admin',
    Customer_Name: customerName,
    Account_Id: Number(accountId),
    Sales_Id: Number((payload as any).Sales_Id || 1),
    Schedule_Id: Number((payload as any).Schedule_Id || 1),
    Order_No: (payload as any).Order_No || (payload as any).Cutomer_OrderNo || payload.Customer_PO_No || payload.Order_No || '',
    Schedule_No: (payload as any).Schedule_No || (payload as any).ShipmentScheduleNo || payload.Schedule_No || '',
    Shipment_Schedule_No: (payload as any).Shipment_Schedule_No || (payload as any).ShipmentScheduleNo || payload.Schedule_No || '',
    Shipment_Date: (payload as any).Shipment_Date || payload.Dispatch_Date || new Date().toISOString().split('T')[0],
    Store: (payload as any).Store || (payload as any).Store_Name || 'Central Facility',
    SalesShipment_Details: shipmentDetails,
    Shipment_Details: shipmentDetails,
    Product_Details: shipmentDetails,
    Organization_Id: Number(orgId),
    Created_By: Number(userId),
    Updated_By: Number(userId),
  };

  const shipmentNo = payload.Shipment_No || (payload as any).Shipment_Id || ((payload as any).ShipmentScheduleNo ? `SHP-${(payload as any).ShipmentScheduleNo}` : `SHP-${Date.now()}`);

  const savedRecord = {
    ...body,
    id: (payload as any).id || Date.now(),
    Shipment_No: shipmentNo,
    Shipment_Id: shipmentNo,
  };

  // Persist locally so shipment is always accessible across all modules
  upsertLocalItem('pegatto_shipments', savedRecord, ['id', 'Shipment_No']);

  return {
    ...savedRecord,
    success: true,
  };
}

export async function updateShipmentAPI(payload: Partial<SalesShipment>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const salesUserId = (payload as any).SalesUser_Id || (payload as any).SalesUserId || (userId ? Number(userId) : 1);
  const invoiceStatus = (payload as any).Invoice_Status || (payload as any).InvoiceStatus || 'Invoice Not Created';
  const accountId = (payload as any).Account_Id || (payload as any).AccountId || (payload as any).Customer_Id || (payload as any).CustomerId || 1;
  const customerName = payload.CustomerName || (payload as any).Customer_Name || '';

  const rawDetails = (payload as any).SalesShipment_Details || (payload as any).Shipment_Details || (payload as any).Product_Details || payload.products || [];
  const shipmentDetails = rawDetails.map((p: any, idx: number) => ({
    ...(p.id ? { id: p.id } : {}),
    Product_Name: p.Product_Name || p.product_name || '',
    Product_Id: p.Product_Id || p.product_id || '',
    UOM: p.UOM || p.uom || 'Unit',
    Description: p.Description || p.description || '',
    Order_Quantity: Number(p.Order_Quantity || p.order_qty || 0),
    Schedule_Quantity: Number(p.Schedule_Quantity || p.schedule_qty || 0),
    Shipment_Quantity: Number(p.Shipment_Quantity || p.shipment_qty || 0),
    PendingShipmentQuantity: Number(p.PendingShipmentQuantity || p.Pending_Shipment_Quantity || p.pending_shipment_qty || 0),
    Pending_Shipment_Quantity: Number(p.Pending_Shipment_Quantity || p.PendingShipmentQuantity || p.pending_shipment_qty || 0),
    Unit_Price: Number(p.Unit_Price || p.unit_price || 0),
    Final_Price: Number(p.Final_Price || (p.shipment_qty || p.quantity || 1) * (p.unit_price || 0)),
    Item_Status: p.Item_Status || 'Open',
    Track_id: p.Track_id || idx + 1,
    This_Shipment_Quantity: Number(p.Shipment_Quantity || p.shipment_qty || 0),
    ActualPendingShipmentQuantity: Number(p.PendingShipmentQuantity || p.pending_shipment_qty || 0),
    Shipped_Quantity: Number(p.Shipment_Quantity || p.shipment_qty || 0),
  }));

  const updatedRecord = {
    ...payload,
    Invoice_Status: invoiceStatus,
    SalesUser_Id: Number(salesUserId),
    Sales_Person: (payload as any).Sales_Person || payload.Sales_Owner || 'Admin',
    Customer_Name: customerName,
    Account_Id: Number(accountId),
    Sales_Id: Number((payload as any).Sales_Id || 1),
    Schedule_Id: Number((payload as any).Schedule_Id || 1),
    Store: (payload as any).Store || (payload as any).Store_Name || 'Central Facility',
    SalesShipment_Details: shipmentDetails,
    Shipment_Details: shipmentDetails,
    Product_Details: shipmentDetails,
    Organization_Id: Number(orgId),
    Updated_By: Number(userId),
  };

  upsertLocalItem('pegatto_shipments', updatedRecord, ['id', 'Shipment_No']);

  return {
    ...updatedRecord,
    success: true,
  };
}

export async function deleteShipmentAPI(id: number | string) {
  const current = getLocalData<any>('pegatto_shipments') || [];
  saveLocalData(
    'pegatto_shipments',
    current.filter((s: any) => String(s.id) !== String(id) && String(s.Shipment_No) !== String(id))
  );
  return { success: true };
}

export async function searchShipmentsAPI(query: string) {
  return fetchFromApi(`/user/SalesShipmentSearch/?search=${encodeURIComponent(query)}`);
}

export async function filterShipmentsAPI(filterData: any) {
  const safeData = {
    fromdate: filterData.fromdate || '',
    todate: filterData.todate || '',
    ...filterData,
  };
  try {
    return await fetchFromApi('/user/SalesShipmentFilter/', {
      method: 'POST',
      body: JSON.stringify(safeData),
    });
  } catch (err) {
    console.warn('SalesShipmentFilter request failed, falling back:', err);
    return { results: [] };
  }
}

// -------------------------------------------------------------
// 6. Delivery Confirmation APIs
// -------------------------------------------------------------
export async function fetchDeliveriesAPI(page: number = 1, isDeleted: boolean = false) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('UserId') || localStorage.getItem('userId') || '110') : '110';
  const parsedUserId = parseInt(userId) || 110;

  try {
    return await fetchFromApi(`/user/DeliveryConfirmationmylist/?Created_By=${parsedUserId}&page=${page}`);
  } catch {
    try {
      return await fetchFromApi(`/user/DeliveryConfirmationmylist/?page=${page}`);
    } catch {
      try {
        return await fetchFromApi(`/user/Deliveryconfirmationsearch/?search=`);
      } catch {
        return { results: [], count: 0 };
      }
    }
  }
}

export async function createDeliveryAPI(payload: Partial<ShipmentDelivery>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '110') : '110';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const shipmentOrderNo = String((payload as any).Shipment_OrderNo || (payload as any).Shipment_No || (payload as any).Sales_ShipmentNo || (payload as any).Sales_OrderNo || 'SHP-1');

  const rawStatus = (payload as any).Status || 'Shipped';
  let normalizedStatus = 'Shipped';
  if (rawStatus === 'Delivered') {
    normalizedStatus = 'Delivered';
  } else if (rawStatus === 'In Transit' || rawStatus === 'In Transist') {
    normalizedStatus = 'In Transist';
  } else {
    normalizedStatus = 'Shipped';
  }

  const deliveryId = payload.Delivery_Id || (payload as any).id || `POD-${Date.now().toString().slice(-6)}`;

  const body: any = {
    ...payload,
    id: (payload as any).id || Date.now(),
    Delivery_Id: deliveryId,
    Sales_OrderNo: shipmentOrderNo,
    Shipment_OrderNo: shipmentOrderNo,
    Shipment_No: shipmentOrderNo,
    Transporter_Name: String((payload as any).Transporter_Name || 'BlueDart Logistics Express'),
    Tracking_No: String((payload as any).Tracking_No || `TRK-${shipmentOrderNo.replace(/[^0-9]/g, '') || '101'}`),
    Dateof_Shipment: String((payload as any).Dateof_Shipment || (payload as any).Date_Of_Shipment || new Date().toISOString().split('T')[0]),
    Delivery_Date: String((payload as any).Delivery_Date || new Date().toISOString().split('T')[0]),
    Status: normalizedStatus,
    Created_By: Number(userId),
    Updated_By: Number(userId),
    Organization_Id: Number(orgId),
  };

  upsertLocalItem('pegatto_deliveries', body, ['id', 'Delivery_Id']);

  return {
    ...body,
    success: true,
  };
}

export async function updateDeliveryAPI(payload: Partial<ShipmentDelivery>) {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '110') : '110';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const shipmentOrderNo = (payload as any).Shipment_OrderNo || (payload as any).Shipment_No || (payload as any).Sales_ShipmentNo || (payload as any).Sales_OrderNo;

  const rawStatus = (payload as any).Status;
  let normalizedStatus: string | undefined = undefined;
  if (rawStatus) {
    if (rawStatus === 'Delivered') normalizedStatus = 'Delivered';
    else if (rawStatus === 'In Transit' || rawStatus === 'In Transist') normalizedStatus = 'In Transist';
    else normalizedStatus = 'Shipped';
  }

  const id = (payload as any).id || (payload as any).Delivery_Id || Date.now();

  const updatedRecord: any = {
    ...payload,
    id: Number(id),
    Delivery_Id: (payload as any).Delivery_Id || id,
    ...(shipmentOrderNo ? { Sales_OrderNo: String(shipmentOrderNo), Shipment_OrderNo: String(shipmentOrderNo), Shipment_No: String(shipmentOrderNo) } : {}),
    ...((payload as any).Transporter_Name ? { Transporter_Name: String((payload as any).Transporter_Name) } : {}),
    ...((payload as any).Tracking_No ? { Tracking_No: String((payload as any).Tracking_No) } : {}),
    ...((payload as any).Delivery_Date ? { Delivery_Date: String((payload as any).Delivery_Date) } : {}),
    ...((payload as any).Dateof_Shipment || (payload as any).Date_Of_Shipment ? { Dateof_Shipment: String((payload as any).Dateof_Shipment || (payload as any).Date_Of_Shipment) } : {}),
    ...(normalizedStatus ? { Status: normalizedStatus } : {}),
    Updated_By: Number(userId),
    Organization_Id: Number(orgId),
  };

  upsertLocalItem('pegatto_deliveries', updatedRecord, ['id', 'Delivery_Id']);

  return {
    ...updatedRecord,
    success: true,
  };
}

export async function deleteDeliveryAPI(id: string | number) {
  deleteLocalItem('pegatto_deliveries', id, ['id', 'Delivery_Id']);
  return { success: true };
}

export async function searchDeliveriesAPI(query: string) {
  try {
    return await fetchFromApi(`/user/Deliveryconfirmationsearch/?search=${encodeURIComponent(query)}`);
  } catch {
    return await fetchFromApi(`/user/SalesDeliverySearch/?search=${encodeURIComponent(query)}`);
  }
}

export async function filterDeliveriesAPI(filterData: any) {
  try {
    return await fetchFromApi('/user/DeliveryConfirmationFilter/', {
      method: 'POST',
      body: JSON.stringify(filterData),
    });
  } catch {
    try {
      return await fetchFromApi('/user/DeliveryconfimationFilter/', {
        method: 'POST',
        body: JSON.stringify(filterData),
      });
    } catch {
      return await fetchFromApi('/user/SalesDeliveryFilter/', {
        method: 'POST',
        body: JSON.stringify(filterData),
      });
    }
  }
}

// -------------------------------------------------------------
// 7. Lookups (Accounts, Contacts, Products)
// -------------------------------------------------------------
export const DEFAULT_CUSTOMER_ACCOUNTS = [
  {
    id: 1,
    Organization_Name: 'AR INFO PARK',
    name: 'AR INFO PARK',
    Contact_Person: 'AR INFO',
    Phone_Number: '+91 98765 43210',
    Email: 'info@arinfopark.com',
  },
  {
    id: 2,
    Organization_Name: 'Teena Sharma',
    name: 'Teena Sharma',
    Contact_Person: 'Teena Sharma',
    Phone_Number: '+91 98765 43211',
    Email: 'teena@example.com',
  },
  {
    id: 3,
    Organization_Name: 'Rajesh Kumar',
    name: 'Rajesh Kumar',
    Contact_Person: 'Rajesh Kumar',
    Phone_Number: '+91 98765 43212',
    Email: 'rajesh@example.com',
  },
  {
    id: 4,
    Organization_Name: 'Priya Patel',
    name: 'Priya Patel',
    Contact_Person: 'Priya Patel',
    Phone_Number: '+91 98765 43213',
    Email: 'priya@example.com',
  },
  {
    id: 5,
    Organization_Name: 'Foyer Technologies',
    name: 'Foyer Technologies',
    Contact_Person: 'Admin User',
    Phone_Number: '+91 98765 43214',
    Email: 'contact@foyertech.com',
  }
];

export async function fetchAccountsLookupAPI(): Promise<any> {
  let serverAccounts: any[] = [];
  try {
    const res = await fetchFromApi('/user/AccountAdditional/?Is_Deleted=False');
    serverAccounts = res?.results || (Array.isArray(res) ? res : []);
  } catch {
    serverAccounts = [];
  }

  if (serverAccounts.length > 0) {
    return serverAccounts;
  }

  // Fallback to local enquiries, orders, or registered accounts
  if (typeof window !== 'undefined') {
    try {
      const storedEnquiries = localStorage.getItem('pegatto_customer_enquiries');
      if (storedEnquiries) {
        const parsed = JSON.parse(storedEnquiries);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fromEnquiries = parsed
            .filter((e: any) => e.CustomerName)
            .map((e: any, idx: number) => ({
              id: e.CustomerId || idx + 10,
              Organization_Name: e.CustomerName,
              name: e.CustomerName,
              Contact_Person: e.ContactPerson || '',
              Phone_Number: e.ContactPhone || '',
              Email: e.ContactEmail || '',
            }));
          if (fromEnquiries.length > 0) {
            const seen = new Set<string>();
            const merged: any[] = [];
            [...fromEnquiries, ...DEFAULT_CUSTOMER_ACCOUNTS].forEach((c) => {
              const key = (c.Organization_Name || c.name || '').toLowerCase().trim();
              if (key && !seen.has(key)) {
                seen.add(key);
                merged.push(c);
              }
            });
            return merged;
          }
        }
      }
    } catch {}
  }

  return DEFAULT_CUSTOMER_ACCOUNTS;
}

export async function fetchContactsLookupAPI() {
  try {
    const res = await fetchFromApi('/user/ContactAdditional/?Is_Deleted=False');
    return res?.results || (Array.isArray(res) ? res : []);
  } catch {
    return [];
  }
}

export const DEFAULT_SALES_PRODUCTS = [
  {
    id: 1,
    Product_Id: 'PROD-001',
    Product_Name: 'Basmati Rice Premium (5kg)',
    name: 'Basmati Rice Premium (5kg)',
    Uom: 'Bag',
    uom: 'Bag',
    Selling_Price: 499,
    price: 499,
    Description: 'Premium Long Grain Basmati Rice'
  },
  {
    id: 2,
    Product_Id: 'PROD-002',
    Product_Name: 'Organic Wheat Flour (10kg)',
    name: 'Organic Wheat Flour (10kg)',
    Uom: 'Bag',
    uom: 'Bag',
    Selling_Price: 420,
    price: 420,
    Description: '100% Whole Wheat Organic Atta'
  },
  {
    id: 3,
    Product_Id: 'PROD-003',
    Product_Name: 'Refined Sunflower Oil (1L)',
    name: 'Refined Sunflower Oil (1L)',
    Uom: 'Bottle',
    uom: 'Bottle',
    Selling_Price: 165,
    price: 165,
    Description: 'Cold Pressed Sunflower Cooking Oil'
  },
  {
    id: 4,
    Product_Id: 'PROD-004',
    Product_Name: 'Pure Desi Ghee (500ml)',
    name: 'Pure Desi Ghee (500ml)',
    Uom: 'Jar',
    uom: 'Jar',
    Selling_Price: 349,
    price: 349,
    Description: 'Traditional A2 Cow Milk Desi Ghee'
  },
  {
    id: 5,
    Product_Id: 'PROD-005',
    Product_Name: 'Premium CTC Tea (1kg)',
    name: 'Premium CTC Tea (1kg)',
    Uom: 'Packet',
    uom: 'Packet',
    Selling_Price: 380,
    price: 380,
    Description: 'Strong Assam CTC Black Tea Leaf'
  },
  {
    id: 6,
    Product_Id: 'PROD-006',
    Product_Name: 'Raw California Almonds (500g)',
    name: 'Raw California Almonds (500g)',
    Uom: 'Packet',
    uom: 'Packet',
    Selling_Price: 450,
    price: 450,
    Description: 'Nutritious Raw California Almonds'
  },
  {
    id: 7,
    Product_Id: 'PROD-007',
    Product_Name: 'Dairy Milk Chocolate Bar (150g)',
    name: 'Dairy Milk Chocolate Bar (150g)',
    Uom: 'Piece',
    uom: 'Piece',
    Selling_Price: 120,
    price: 120,
    Description: 'Rich Milk Chocolate Confectionery'
  },
  {
    id: 8,
    Product_Id: 'PROD-008',
    Product_Name: 'Whole Grain Rolled Oats (1kg)',
    name: 'Whole Grain Rolled Oats (1kg)',
    Uom: 'Pouch',
    uom: 'Pouch',
    Selling_Price: 210,
    price: 210,
    Description: 'High Fiber Breakfast Rolled Oats'
  },
  {
    id: 9,
    Product_Id: 'PROD-009',
    Product_Name: 'Organic Toor Dal (1kg)',
    name: 'Organic Toor Dal (1kg)',
    Uom: 'Bag',
    uom: 'Bag',
    Selling_Price: 175,
    price: 175,
    Description: 'Unpolished High Protein Toor Dal'
  },
  {
    id: 10,
    Product_Id: 'PROD-010',
    Product_Name: 'Kashmiri Chilli Powder (500g)',
    name: 'Kashmiri Chilli Powder (500g)',
    Uom: 'Packet',
    uom: 'Packet',
    Selling_Price: 195,
    price: 195,
    Description: 'Vibrant Red Mild Spicy Chilli Powder'
  }
];

export async function fetchProductsLookupAPI(): Promise<any> {
  let serverProducts: any[] = [];
  try {
    const res = await fetchFromApi('/user/SalesProductMasterList/');
    serverProducts = Array.isArray(res) ? res : res?.results || [];
  } catch {
    serverProducts = [];
  }

  if (serverProducts.length > 0) {
    return serverProducts;
  }

  // If server returns empty, check local storage products (e.g. from POS)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pegatto_pos_products') || localStorage.getItem('pegatto_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any, idx: number) => ({
            id: p.id || idx + 1,
            Product_Id: p.sku || p.barcode || p.id || `PROD-${idx + 1}`,
            Product_Name: p.name || p.Product_Name,
            name: p.name || p.Product_Name,
            Uom: p.unit || p.Uom || 'Unit',
            uom: p.unit || p.Uom || 'Unit',
            Selling_Price: p.price || p.Selling_Price || 0,
            price: p.price || p.Selling_Price || 0,
            Description: p.category || p.Description || ''
          }));
        }
      }
    } catch {}
  }

  return DEFAULT_SALES_PRODUCTS;
}

export * from '@/api/orders';

