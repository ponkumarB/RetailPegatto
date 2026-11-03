import { create } from 'zustand';

export interface SalesOrderItem {
  id?: string;
  itemType: 'Product' | 'Service';
  product: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: string; // e.g. "5%" or "0%"
  tax: string; // e.g. "VAT 5%"
  amount: number; // calculated total for item
}

export interface SalesOrderTimelineEvent {
  id: string;
  title: string;
  details: string;
  timestamp: string;
}

export interface SalesOrderProject {
  id: string;
  name: string;
  deliveryAddress: string;
  scheduleDate: string;
  status: 'Draft' | 'Confirmed' | 'Partially Delivered' | 'Delivered' | 'Cancelled' | 'Pending' | 'Out for Delivery';
  progress: number;
}

export interface SalesOrder {
  id: string; // SO-2024-00045
  orderDate: string; // DD/MM/YYYY
  customer: string;
  totalAmount: number;
  status: 'Draft' | 'Confirmed' | 'Partially Delivered' | 'Delivered' | 'Cancelled';
  deliveryDate: string; // DD/MM/YYYY or "—"
  createdBy: string;
  
  // Detail metadata
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  billingAddress: string;
  shippingAddress: string;
  currency: string; // e.g. "USD"
  paymentTerms: string; // e.g. "Net 30"
  salesRepresentative: string;
  reference: string;
  
  // Lists
  items: SalesOrderItem[];
  timeline: SalesOrderTimelineEvent[];
  projects: SalesOrderProject[];
}

interface SalesOrderState {
  salesOrders: SalesOrder[];
  selectedSalesOrderId: string;
  setSelectedSalesOrderId: (id: string) => void;
  addSalesOrder: (order: SalesOrder) => void;
  updateSalesOrder: (id: string, updatedOrder: Partial<SalesOrder>) => void;
  deleteSalesOrder: (id: string) => void;
}

const initialSalesOrders: SalesOrder[] = [
  {
    id: 'SO-2024-00045',
    orderDate: '14/05/2024',
    customer: 'Green Valley Farms',
    totalAmount: 1386.53,
    status: 'Confirmed',
    deliveryDate: '21/05/2024',
    createdBy: 'Admin User',
    contactPerson: 'John Smith',
    contactPhone: '+1 555-123-4567',
    contactEmail: 'john.smith@greenvalley.com',
    billingAddress: '123 Farm Road, Green Valley, California, USA',
    shippingAddress: '123 Farm Road, Green Valley, California, USA',
    currency: 'USD',
    paymentTerms: 'Net 30',
    salesRepresentative: 'Admin User',
    reference: 'PO-2024-0012',
    items: [
      { product: 'FERT-001', description: 'Organic Fertilizer 50kg', quantity: 10, unitPrice: 50.00, discount: '5%', tax: 'VAT 5%', amount: 475.00, itemType: 'Product' },
      { product: 'SEED-002', description: 'Hybrid Maize Seed', quantity: 20, unitPrice: 30.00, discount: '0%', tax: 'VAT 5%', amount: 630.00, itemType: 'Product' },
      { product: 'PSTC-003', description: 'Pesticide 1L', quantity: 15, unitPrice: 20.00, discount: '5%', tax: 'VAT 5%', amount: 285.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Sales Order Created', details: 'Sales order has been created.', timestamp: '14/05/2024 10:30 AM by Admin User' },
      { id: 'ev-2', title: 'Order Confirmed', details: 'Sales order has been confirmed.', timestamp: '14/05/2024 10:45 AM by Admin User' },
      { id: 'ev-3', title: 'Delivery Pending', details: 'Shipment assignment is pending logistics dispatch.', timestamp: '14/05/2024 10:45 AM' },
      { id: 'ev-4', title: 'Invoice Pending', details: 'Invoice has not been generated yet.', timestamp: '14/05/2024 10:45 AM' }
    ],
    projects: [
      { id: 'P-1', name: 'Farm Expansion Project', deliveryAddress: '123 Farm Road, Green Valley, CA, USA', scheduleDate: '18/05/2024', status: 'Delivered', progress: 100 },
      { id: 'P-2', name: 'Greenhouse Installation', deliveryAddress: '456 Greenhouse Lane, Green Valley, CA, USA', scheduleDate: '21/05/2024', status: 'Out for Delivery', progress: 75 },
      { id: 'P-3', name: 'Irrigation System Setup', deliveryAddress: '789 Waterway Dr, Green Valley, CA, USA', scheduleDate: '25/05/2024', status: 'Pending', progress: 0 }
    ]
  },
  {
    id: 'SO-2024-00044',
    orderDate: '13/05/2024',
    customer: 'Agri Best Supplies',
    totalAmount: 2450.00,
    status: 'Delivered',
    deliveryDate: '18/05/2024',
    createdBy: 'John Smith',
    contactPerson: 'Sarah Best',
    contactPhone: '+1 555-888-9999',
    contactEmail: 'sarah@agribest.com',
    billingAddress: '456 Supply Blvd, Chicago, IL, USA',
    shippingAddress: '456 Supply Blvd, Chicago, IL, USA',
    currency: 'USD',
    paymentTerms: 'Net 15',
    salesRepresentative: 'John Smith',
    reference: 'PO-2024-0011',
    items: [
      { product: 'SEED-004', description: 'Premium Wheat Seed Bag', quantity: 50, unitPrice: 40.00, discount: '0%', tax: 'VAT 5%', amount: 2000.00, itemType: 'Product' },
      { product: 'FERT-002', description: 'Liquid Bio-Fertilizer 20L', quantity: 15, unitPrice: 30.00, discount: '0%', tax: 'VAT 5%', amount: 450.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Sales Order Created', details: 'Order created in CRM.', timestamp: '13/05/2024 09:15 AM by John Smith' },
      { id: 'ev-2', title: 'Order Confirmed', details: 'Client confirmed order details.', timestamp: '13/05/2024 09:40 AM by John Smith' },
      { id: 'ev-3', title: 'Dispatched', details: 'Goods left the central warehouse.', timestamp: '15/05/2024 11:00 AM' },
      { id: 'ev-4', title: 'Delivered', details: 'Delivered and signed by receiving team.', timestamp: '18/05/2024 03:00 PM' }
    ],
    projects: [
      { id: 'P-4', name: 'Supply Delivery', deliveryAddress: '456 Supply Blvd, Chicago, IL, USA', scheduleDate: '18/05/2024', status: 'Delivered', progress: 100 }
    ]
  },
  {
    id: 'SO-2024-00043',
    orderDate: '10/05/2024',
    customer: 'Farm Fresh Co.',
    totalAmount: 975.25,
    status: 'Confirmed',
    deliveryDate: '15/05/2024',
    createdBy: 'Sarah Johnson',
    contactPerson: 'David Miller',
    contactPhone: '+1 555-456-7890',
    contactEmail: 'david@farmfresh.co',
    billingAddress: '789 Fresh Ave, Portland, OR, USA',
    shippingAddress: '789 Fresh Ave, Portland, OR, USA',
    currency: 'USD',
    paymentTerms: 'Due on Receipt',
    salesRepresentative: 'Sarah Johnson',
    reference: 'PO-2024-0010',
    items: [
      { product: 'PSTC-001', description: 'Insecticide Spray 5L', quantity: 5, unitPrice: 150.00, discount: '5%', tax: 'VAT 5%', amount: 712.50, itemType: 'Product' },
      { product: 'TOOL-005', description: 'Pruning Shears Premium', quantity: 10, unitPrice: 25.00, discount: '0%', tax: 'VAT 5%', amount: 250.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Sales Order Created', details: 'Sales order created.', timestamp: '10/05/2024 02:00 PM by Sarah Johnson' },
      { id: 'ev-2', title: 'Order Confirmed', details: 'Client payment verified.', timestamp: '10/05/2024 02:30 PM by Sarah Johnson' }
    ],
    projects: []
  },
  {
    id: 'SO-2024-00042',
    orderDate: '09/05/2024',
    customer: 'Green Valley Farms',
    totalAmount: 560.00,
    status: 'Draft',
    deliveryDate: '—',
    createdBy: 'Admin User',
    contactPerson: 'John Smith',
    contactPhone: '+1 555-123-4567',
    contactEmail: 'john.smith@greenvalley.com',
    billingAddress: '123 Farm Road, Green Valley, California, USA',
    shippingAddress: '123 Farm Road, Green Valley, California, USA',
    currency: 'USD',
    paymentTerms: 'Net 30',
    salesRepresentative: 'Admin User',
    reference: 'PO-2024-0009',
    items: [
      { product: 'FERT-001', description: 'Organic Fertilizer 50kg', quantity: 10, unitPrice: 50.00, discount: '0%', tax: 'VAT 5%', amount: 500.00, itemType: 'Product' },
      { product: 'PSTC-003', description: 'Pesticide 1L', quantity: 3, unitPrice: 20.00, discount: '0%', tax: 'VAT 5%', amount: 60.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Draft Saved', details: 'Sales order saved as draft.', timestamp: '09/05/2024 11:00 AM by Admin User' }
    ],
    projects: []
  },
  {
    id: 'SO-2024-00041',
    orderDate: '08/05/2024',
    customer: 'Nature Crop Ltd.',
    totalAmount: 3125.75,
    status: 'Partially Delivered',
    deliveryDate: '20/05/2024',
    createdBy: 'Michael Brown',
    contactPerson: 'Emily Davis',
    contactPhone: '+1 555-321-7654',
    contactEmail: 'emily@naturecrop.com',
    billingAddress: '99 Green Hills, Seattle, WA, USA',
    shippingAddress: '99 Green Hills, Seattle, WA, USA',
    currency: 'USD',
    paymentTerms: 'Net 45',
    salesRepresentative: 'Michael Brown',
    reference: 'PO-2024-0008',
    items: [
      { product: 'SEED-001', description: 'Soybean Seeds Premium Bag', quantity: 40, unitPrice: 60.00, discount: '5%', tax: 'VAT 5%', amount: 2280.00, itemType: 'Product' },
      { product: 'FERT-005', description: 'Soil Conditioner 25kg', quantity: 20, unitPrice: 40.00, discount: '5%', tax: 'VAT 5%', amount: 760.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Sales Order Created', details: 'Order logged in CRM.', timestamp: '08/05/2024 04:15 PM by Michael Brown' },
      { id: 'ev-2', title: 'Order Confirmed', details: 'Confirmed by Michael.', timestamp: '08/05/2024 04:30 PM by Michael Brown' }
    ],
    projects: []
  },
  {
    id: 'SO-2024-00040',
    orderDate: '07/05/2024',
    customer: 'Agri Best Supplies',
    totalAmount: 1890.00,
    status: 'Delivered',
    deliveryDate: '12/05/2024',
    createdBy: 'John Smith',
    contactPerson: 'Sarah Best',
    contactPhone: '+1 555-888-9999',
    contactEmail: 'sarah@agribest.com',
    billingAddress: '456 Supply Blvd, Chicago, IL, USA',
    shippingAddress: '456 Supply Blvd, Chicago, IL, USA',
    currency: 'USD',
    paymentTerms: 'Net 15',
    salesRepresentative: 'John Smith',
    reference: 'PO-2024-0007',
    items: [
      { product: 'FERT-001', description: 'Organic Fertilizer 50kg', quantity: 36, unitPrice: 50.00, discount: '0%', tax: 'VAT 5%', amount: 1800.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Sales Order Created', details: 'Created.', timestamp: '07/05/2024 10:00 AM' },
      { id: 'ev-2', title: 'Delivered', details: 'Delivered to client.', timestamp: '12/05/2024 02:00 PM' }
    ],
    projects: []
  },
  {
    id: 'SO-2024-00039',
    orderDate: '06/05/2024',
    customer: 'Harvest Point',
    totalAmount: 780.00,
    status: 'Cancelled',
    deliveryDate: '—',
    createdBy: 'Sarah Johnson',
    contactPerson: 'Alan Carter',
    contactPhone: '+1 555-777-6666',
    contactEmail: 'alan@harvestpoint.com',
    billingAddress: '321 Crop Field, Denver, CO, USA',
    shippingAddress: '321 Crop Field, Denver, CO, USA',
    currency: 'USD',
    paymentTerms: 'Net 30',
    salesRepresentative: 'Sarah Johnson',
    reference: 'PO-2024-0006',
    items: [
      { product: 'TOOL-001', description: 'Irrigation Sprinkler Head', quantity: 20, unitPrice: 35.00, discount: '0%', tax: 'VAT 5%', amount: 700.05, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Sales Order Created', details: 'Created.', timestamp: '06/05/2024 11:30 AM' },
      { id: 'ev-2', title: 'Cancelled', details: 'Cancelled by client request.', timestamp: '06/05/2024 04:00 PM' }
    ],
    projects: []
  },
  {
    id: 'SO-2024-00038',
    orderDate: '05/05/2024',
    customer: 'Farm Fresh Co.',
    totalAmount: 2210.50,
    status: 'Confirmed',
    deliveryDate: '14/05/2024',
    createdBy: 'Admin User',
    contactPerson: 'David Miller',
    contactPhone: '+1 555-456-7890',
    contactEmail: 'david@farmfresh.co',
    billingAddress: '789 Fresh Ave, Portland, OR, USA',
    shippingAddress: '789 Fresh Ave, Portland, OR, USA',
    currency: 'USD',
    paymentTerms: 'Net 30',
    salesRepresentative: 'Admin User',
    reference: 'PO-2024-0005',
    items: [
      { product: 'SEED-002', description: 'Hybrid Maize Seed', quantity: 70, unitPrice: 30.00, discount: '0%', tax: 'VAT 5%', amount: 2100.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Sales Order Created', details: 'Created.', timestamp: '05/05/2024 09:30 AM' }
    ],
    projects: []
  },
  {
    id: 'SO-2024-00037',
    orderDate: '04/05/2024',
    customer: 'Green Valley Farms',
    totalAmount: 650.00,
    status: 'Draft',
    deliveryDate: '—',
    createdBy: 'Michael Brown',
    contactPerson: 'John Smith',
    contactPhone: '+1 555-123-4567',
    contactEmail: 'john.smith@greenvalley.com',
    billingAddress: '123 Farm Road, Green Valley, California, USA',
    shippingAddress: '123 Farm Road, Green Valley, California, USA',
    currency: 'USD',
    paymentTerms: 'Net 30',
    salesRepresentative: 'Michael Brown',
    reference: 'PO-2024-0004',
    items: [
      { product: 'FERT-001', description: 'Organic Fertilizer 50kg', quantity: 13, unitPrice: 50.00, discount: '0%', tax: 'VAT 5%', amount: 650.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Draft Saved', details: 'Saved as draft.', timestamp: '04/05/2024 10:15 AM' }
    ],
    projects: []
  },
  {
    id: 'SO-2024-00036',
    orderDate: '03/05/2024',
    customer: 'Nature Crop Ltd.',
    totalAmount: 1175.30,
    status: 'Delivered',
    deliveryDate: '09/05/2024',
    createdBy: 'John Smith',
    contactPerson: 'Emily Davis',
    contactPhone: '+1 555-321-7654',
    contactEmail: 'emily@naturecrop.com',
    billingAddress: '99 Green Hills, Seattle, WA, USA',
    shippingAddress: '99 Green Hills, Seattle, WA, USA',
    currency: 'USD',
    paymentTerms: 'Net 30',
    salesRepresentative: 'John Smith',
    reference: 'PO-2024-0003',
    items: [
      { product: 'PSTC-003', description: 'Pesticide 1L', quantity: 58, unitPrice: 20.00, discount: '0%', tax: 'VAT 5%', amount: 1160.00, itemType: 'Product' }
    ],
    timeline: [
      { id: 'ev-1', title: 'Sales Order Created', details: 'Created.', timestamp: '03/05/2024 08:30 AM' },
      { id: 'ev-2', title: 'Delivered', details: 'Completed.', timestamp: '09/05/2024 04:00 PM' }
    ],
    projects: []
  }
];

export const useSalesOrderStore = create<SalesOrderState>((set) => ({
  salesOrders: initialSalesOrders,
  selectedSalesOrderId: 'SO-2024-00045',
  setSelectedSalesOrderId: (id) => set({ selectedSalesOrderId: id }),
  addSalesOrder: (order) => set((state) => ({ salesOrders: [order, ...state.salesOrders] })),
  updateSalesOrder: (id, updatedOrder) =>
    set((state) => ({
      salesOrders: state.salesOrders.map((o) => (o.id === id ? { ...o, ...updatedOrder } : o)),
    })),
  deleteSalesOrder: (id) =>
    set((state) => ({ salesOrders: state.salesOrders.filter((o) => o.id !== id) })),
}));
