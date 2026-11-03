import { getLocalData } from './persistentStorage';

export interface OrderReferenceOption {
  id: string;
  orderNumber: string;
  type: 'Sales Order' | 'POS Bill' | 'Invoice';
  customerName?: string;
  customerPhone?: string;
  amount?: number;
  date?: string;
  status?: string;
}

const DEFAULT_ORDERS: OrderReferenceOption[] = [
  {
    id: 'seed-so-1',
    orderNumber: 'SO-2026-0001',
    type: 'Sales Order',
    customerName: 'Rani Patel',
    customerPhone: '9876543210',
    amount: 14500,
    date: '2026-03-18',
    status: 'Confirmed'
  },
  {
    id: 'seed-pos-1',
    orderNumber: 'INV-POS-1001',
    type: 'POS Bill',
    customerName: 'John Doe',
    customerPhone: '9876543211',
    amount: 3250,
    date: '2026-03-20',
    status: 'Paid'
  },
  {
    id: 'seed-so-2',
    orderNumber: 'SO-2026-0002',
    type: 'Sales Order',
    customerName: 'Amit Kumar',
    customerPhone: '9876543212',
    amount: 8900,
    date: '2026-03-19',
    status: 'Completed'
  },
  {
    id: 'seed-pos-2',
    orderNumber: 'INV-POS-1002',
    type: 'POS Bill',
    customerName: 'Priya Sharma',
    customerPhone: '9876543213',
    amount: 4780,
    date: '2026-03-21',
    status: 'Paid'
  },
  {
    id: 'seed-inv-1',
    orderNumber: 'INV-2026-001',
    type: 'Invoice',
    customerName: 'Vikram Singh',
    customerPhone: '9876543214',
    amount: 19800,
    date: '2026-03-15',
    status: 'Paid'
  }
];

export function getAvailableOrderReferences(customerName?: string, customerPhone?: string): OrderReferenceOption[] {
  const optionsMap = new Map<string, OrderReferenceOption>();

  // 1. Load from POS Invoices
  try {
    const posInvoices = getLocalData<any>('pegatto_pos_invoices');
    if (Array.isArray(posInvoices)) {
      posInvoices.forEach((inv) => {
        const orderNumber = inv.invoiceNumber || inv.invoice_number || inv.orderNumber || inv.id;
        if (orderNumber && typeof orderNumber === 'string') {
          optionsMap.set(orderNumber.toUpperCase(), {
            id: String(inv.id || orderNumber),
            orderNumber: orderNumber,
            type: 'POS Bill',
            customerName: inv.customerName || inv.CustomerName,
            customerPhone: inv.customerPhone || inv.CustomerPhone,
            amount: inv.totalAmount ?? inv.total ?? inv.grandTotal,
            date: inv.date || inv.invoiceDate,
            status: inv.status || 'Paid'
          });
        }
      });
    }
  } catch (e) {
    console.warn('Error reading pegatto_pos_invoices:', e);
  }

  // 2. Load from Sales Orders
  try {
    const salesOrders = getLocalData<any>('pegatto_sales_orders');
    if (Array.isArray(salesOrders)) {
      salesOrders.forEach((so) => {
        const orderNumber = so.Sales_OrderNo || so.salesOrderNo || so.orderNo || so.id;
        if (orderNumber && typeof orderNumber === 'string') {
          optionsMap.set(orderNumber.toUpperCase(), {
            id: String(so.id || orderNumber),
            orderNumber: orderNumber,
            type: 'Sales Order',
            customerName: so.CustomerName || so.Lead_Name || so.customerName,
            customerPhone: so.CustomerPhone || so.customerPhone || so.Phone,
            amount: so.Total_Amount ?? so.Net_Amount ?? so.totalAmount,
            date: so.Order_Date || so.Created_Date || so.date,
            status: so.Status || 'Confirmed'
          });
        }
      });
    }
  } catch (e) {
    console.warn('Error reading pegatto_sales_orders:', e);
  }

  // 3. Load from General Invoices
  try {
    const invoices = getLocalData<any>('pegatto_invoices');
    if (Array.isArray(invoices)) {
      invoices.forEach((inv) => {
        const orderNumber = inv.Invoice_code || inv.Invoice_No || inv.invoiceNumber || inv.id;
        if (orderNumber && typeof orderNumber === 'string') {
          if (!optionsMap.has(orderNumber.toUpperCase())) {
            optionsMap.set(orderNumber.toUpperCase(), {
              id: String(inv.id || orderNumber),
              orderNumber: orderNumber,
              type: 'Invoice',
              customerName: inv.Account_Name || inv.CustomerName || inv.customerName,
              customerPhone: inv.Contact_Number || inv.customerPhone,
              amount: inv.Total_Amount ?? inv.totalAmount,
              date: inv.Invoice_Date || inv.date,
              status: inv.Status || 'Paid'
            });
          }
        }
      });
    }
  } catch (e) {
    console.warn('Error reading pegatto_invoices:', e);
  }

  // Fallback to default orders if nothing found
  if (optionsMap.size === 0) {
    DEFAULT_ORDERS.forEach((ord) => {
      optionsMap.set(ord.orderNumber.toUpperCase(), ord);
    });
  }

  const results = Array.from(optionsMap.values());

  // Prioritize matching customer
  if (customerName || customerPhone) {
    const normName = customerName?.trim().toLowerCase();
    const normPhone = customerPhone?.trim();

    return results.sort((a, b) => {
      const aMatchesCust = (normName && a.customerName?.toLowerCase().includes(normName)) || (normPhone && a.customerPhone?.includes(normPhone));
      const bMatchesCust = (normName && b.customerName?.toLowerCase().includes(normName)) || (normPhone && b.customerPhone?.includes(normPhone));

      if (aMatchesCust && !bMatchesCust) return -1;
      if (!aMatchesCust && bMatchesCust) return 1;
      return 0;
    });
  }

  return results;
}
