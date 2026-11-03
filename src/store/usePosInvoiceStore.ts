import { create } from 'zustand';
import { fetchPosInvoicesAPI, deleteSalesInvoiceBackend, createSalesInvoice } from '@/service/api/Invoice/api';
import { fetchFromApi } from '@/service/apiClient';
import { getLocalData, upsertLocalItem, deleteLocalItem, mergeWithLocalData } from '@/utils/persistentStorage';

export interface PosProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  costPrice?: number;
  taxRate: number; // e.g. 5, 12, 18
  stock: number;
  unit: string;
}

export interface PosCartItem {
  product: PosProduct;
  quantity: number;
  rate: number;
  discountPercent: number;
  taxAmount: number;
  total: number;
}

export interface PosInvoice {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerName: string;
  customerPhone: string;
  storeName?: string;
  delivery?: string;
  items: PosCartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOff: number;
  totalAmount: number;
  amountReceived: number;
  changeReturned: number;
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Credit' | 'Split';
  status: 'Paid' | 'Pending' | 'Partial' | 'Un Paid';
  cashierName: string;
  notes?: string;
}

interface PosInvoiceState {
  products: PosProduct[];
  cartItems: PosCartItem[];
  invoices: PosInvoice[];
  isLoading: boolean;
  totalCount: number;
  customerInfo: {
    name: string;
    phone: string;
  };
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Credit' | 'Split';
  amountReceived: number;
  discountRate: number;

  // Actions
  loadInvoices: (params?: any) => Promise<void>;
  loadProducts: () => Promise<void>;
  setCustomerInfo: (info: { name: string; phone: string }) => void;
  setPaymentMethod: (method: 'Cash' | 'Card' | 'UPI' | 'Credit' | 'Split') => void;
  setAmountReceived: (amount: number) => void;
  setDiscountRate: (discount: number) => void;

  addToCart: (product: PosProduct, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discountPercent: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  createInvoice: () => PosInvoice | null;
  addCustomInvoice: (invoice: PosInvoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addProduct: (product: PosProduct) => void;
}

const initialProducts: PosProduct[] = [
  {
    id: 'prod-1',
    name: 'Basmati Rice Premium (5kg)',
    sku: 'RICE-BAS-05',
    barcode: '8901234567890',
    category: 'Groceries',
    price: 499.00,
    costPrice: 380.00,
    taxRate: 5,
    stock: 48,
    unit: 'Bag'
  },
  {
    id: 'prod-2',
    name: 'Organic Wheat Flour (10kg)',
    sku: 'FLOUR-WHT-10',
    barcode: '8901234567891',
    category: 'Groceries',
    price: 420.00,
    costPrice: 320.00,
    taxRate: 5,
    stock: 35,
    unit: 'Bag'
  },
  {
    id: 'prod-3',
    name: 'Refined Sunflower Oil (1L)',
    sku: 'OIL-SUN-01',
    barcode: '8901234567892',
    category: 'Oils & Ghee',
    price: 165.00,
    costPrice: 130.00,
    taxRate: 5,
    stock: 60,
    unit: 'Bottle'
  },
  {
    id: 'prod-4',
    name: 'Pure Desi Ghee (500ml)',
    sku: 'GHEE-DESI-500',
    barcode: '8901234567893',
    category: 'Oils & Ghee',
    price: 349.00,
    costPrice: 280.00,
    taxRate: 12,
    stock: 24,
    unit: 'Jar'
  },
  {
    id: 'prod-5',
    name: 'Premium CTC Tea (1kg)',
    sku: 'BEV-TEA-01',
    barcode: '8901234567894',
    category: 'Beverages',
    price: 380.00,
    costPrice: 290.00,
    taxRate: 5,
    stock: 40,
    unit: 'Pack'
  },
  {
    id: 'prod-6',
    name: 'Instant Roast Coffee (200g)',
    sku: 'BEV-COF-200',
    barcode: '8901234567895',
    category: 'Beverages',
    price: 295.00,
    costPrice: 220.00,
    taxRate: 18,
    stock: 55,
    unit: 'Bottle'
  },
  {
    id: 'prod-7',
    name: 'Whole Almonds California (500g)',
    sku: 'NUT-ALM-500',
    barcode: '8901234567896',
    category: 'Dry Fruits',
    price: 480.00,
    costPrice: 380.00,
    taxRate: 12,
    stock: 30,
    unit: 'Pack'
  },
  {
    id: 'prod-8',
    name: 'Cashew Nuts W320 (500g)',
    sku: 'NUT-CSH-500',
    barcode: '8901234567897',
    category: 'Dry Fruits',
    price: 540.00,
    costPrice: 420.00,
    taxRate: 12,
    stock: 22,
    unit: 'Pack'
  },
  {
    id: 'prod-9',
    name: 'Dark Chocolate Bar 70% (100g)',
    sku: 'SNK-CHOC-100',
    barcode: '8901234567898',
    category: 'Snacks & Sweets',
    price: 150.00,
    costPrice: 95.00,
    taxRate: 18,
    stock: 75,
    unit: 'Bar'
  },
  {
    id: 'prod-10',
    name: 'Multigrain Digestive Cookies (300g)',
    sku: 'SNK-COK-300',
    barcode: '8901234567899',
    category: 'Snacks & Sweets',
    price: 95.00,
    costPrice: 65.00,
    taxRate: 18,
    stock: 80,
    unit: 'Pack'
  },
  {
    id: 'prod-11',
    name: 'Mineral Water (1L)',
    sku: 'BEV-WTR-01',
    barcode: '8901234567900',
    category: 'Beverages',
    price: 20.00,
    costPrice: 12.00,
    taxRate: 18,
    stock: 120,
    unit: 'Bottle'
  },
  {
    id: 'prod-12',
    name: 'Handcrafted Organic Soap (125g)',
    sku: 'PER-SOP-125',
    barcode: '8901234567901',
    category: 'Personal Care',
    price: 110.00,
    costPrice: 70.00,
    taxRate: 18,
    stock: 45,
    unit: 'Piece'
  }
];

const initialInvoices: PosInvoice[] = [
  {
    id: 'pos-149',
    invoiceNumber: 'SSI000000149',
    date: '2026-06-08',
    time: '11:30',
    customerName: 'ponkumar',
    customerPhone: '6382394993',
    storeName: 'Thoraipakkam store',
    delivery: 'Store Pickup',
    items: [
      {
        product: initialProducts[0],
        quantity: 5,
        rate: 499.00,
        discountPercent: 0,
        taxAmount: 124.75,
        total: 2619.75
      },
      {
        product: initialProducts[1],
        quantity: 5,
        rate: 420.00,
        discountPercent: 0,
        taxAmount: 105.00,
        total: 2129.34
      }
    ],
    subtotal: 4749.09,
    discountAmount: 0.00,
    taxAmount: 229.75,
    roundOff: 0.00,
    totalAmount: 4749.09,
    amountReceived: 0.00,
    changeReturned: 0.00,
    paymentMethod: 'Cash',
    status: 'Un Paid',
    cashierName: 'Counter 1'
  },
  {
    id: 'pos-148',
    invoiceNumber: 'SSI000000148',
    date: '2026-04-19',
    time: '14:20',
    customerName: 'ponkumar',
    customerPhone: '6382394993',
    storeName: 'Civicon Construction Market',
    delivery: 'Karthik',
    items: [
      {
        product: initialProducts[6],
        quantity: 1,
        rate: 480.00,
        discountPercent: 0,
        taxAmount: 57.60,
        total: 537.60
      },
      {
        product: initialProducts[7],
        quantity: 1,
        rate: 540.00,
        discountPercent: 0,
        taxAmount: 64.80,
        total: 539.90
      }
    ],
    subtotal: 1077.50,
    discountAmount: 36.85,
    taxAmount: 122.40,
    roundOff: 0.00,
    totalAmount: 1040.65,
    amountReceived: 1040.65,
    changeReturned: 0.00,
    paymentMethod: 'Cash',
    status: 'Paid',
    cashierName: 'Counter 1'
  },
  {
    id: 'pos-147',
    invoiceNumber: 'SSI000000147',
    date: '2026-04-19',
    time: '15:45',
    customerName: 'ponkumar',
    customerPhone: '6382394993',
    storeName: 'bangalore hub',
    delivery: 'Karthik',
    items: [
      {
        product: initialProducts[0],
        quantity: 2,
        rate: 499.00,
        discountPercent: 0,
        taxAmount: 49.90,
        total: 1047.90
      },
      {
        product: initialProducts[4],
        quantity: 1,
        rate: 536.60,
        discountPercent: 0,
        taxAmount: 26.83,
        total: 536.60
      }
    ],
    subtotal: 1584.50,
    discountAmount: 36.85,
    taxAmount: 76.73,
    roundOff: 0.00,
    totalAmount: 1547.65,
    amountReceived: 1547.65,
    changeReturned: 0.00,
    paymentMethod: 'Cash',
    status: 'Paid',
    cashierName: 'Counter 2'
  },
  {
    id: 'pos-146',
    invoiceNumber: 'SSI000000146',
    date: '2026-04-15',
    time: '12:10',
    customerName: 'Rahul Sharma',
    customerPhone: '9845011223',
    storeName: 'Thoraipakkam store',
    delivery: 'Store Pickup',
    items: [
      {
        product: initialProducts[1],
        quantity: 2,
        rate: 420.00,
        discountPercent: 0,
        taxAmount: 42.00,
        total: 850.00
      }
    ],
    subtotal: 862.00,
    discountAmount: 12.00,
    taxAmount: 42.00,
    roundOff: 0.00,
    totalAmount: 850.00,
    amountReceived: 850.00,
    changeReturned: 0.00,
    paymentMethod: 'Cash',
    status: 'Paid',
    cashierName: 'Counter 1'
  },
  {
    id: 'pos-145',
    invoiceNumber: 'SSI000000145',
    date: '2026-04-10',
    time: '16:30',
    customerName: 'Pooja Verma',
    customerPhone: '9711044556',
    storeName: 'Civicon Construction Market',
    delivery: 'Karthik',
    items: [
      {
        product: initialProducts[7],
        quantity: 2,
        rate: 540.00,
        discountPercent: 0,
        taxAmount: 64.80,
        total: 980.00
      }
    ],
    subtotal: 1000.00,
    discountAmount: 20.00,
    taxAmount: 64.80,
    roundOff: 0.00,
    totalAmount: 980.00,
    amountReceived: 1000.00,
    changeReturned: 20.00,
    paymentMethod: 'Cash',
    status: 'Paid',
    cashierName: 'Counter 2'
  },
  {
    id: 'pos-144',
    invoiceNumber: 'SSI000000144',
    date: '2026-04-05',
    time: '17:15',
    customerName: 'Anil Kumar',
    customerPhone: '9980088991',
    storeName: 'bangalore hub',
    delivery: 'Karthik',
    items: [
      {
        product: initialProducts[4],
        quantity: 2,
        rate: 350.00,
        discountPercent: 0,
        taxAmount: 35.00,
        total: 691.62
      }
    ],
    subtotal: 701.62,
    discountAmount: 10.00,
    taxAmount: 35.00,
    roundOff: 0.00,
    totalAmount: 691.62,
    amountReceived: 700.00,
    changeReturned: 8.38,
    paymentMethod: 'Cash',
    status: 'Paid',
    cashierName: 'Counter 1'
  }
];

export const usePosInvoiceStore = create<PosInvoiceState>((set, get) => {
  const localSavedInvoices = getLocalData<PosInvoice>('pegatto_pos_invoices');
  const initialList = localSavedInvoices.length > 0 ? localSavedInvoices : initialInvoices;

  return {
    products: initialProducts,
    cartItems: [],
    invoices: initialList,
    isLoading: false,
    totalCount: initialList.length,
    customerInfo: { name: 'Walk-in Customer', phone: '+91 98000 00000' },
    paymentMethod: 'Cash',
    amountReceived: 0,
    discountRate: 0,

    loadInvoices: async (params?: any) => {
      set({ isLoading: true });
      try {
        const res = await fetchPosInvoicesAPI(params);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const count = res?.count || list.length;
        const mappedInvoices: PosInvoice[] = list.map((item: any) => ({
          id: String(item.id || item.Invoice_Id || Date.now()),
          invoiceNumber: item.Invoice_Id || item.Invoice_No || item.Invoice_code || `POS-${item.id}`,
          date: item.Invoice_Date?.split('T')[0] || item.Created_Date?.split('T')[0] || new Date().toISOString().split('T')[0],
          time: item.Invoice_Date?.includes('T') ? item.Invoice_Date.split('T')[1]?.slice(0, 5) : '12:00',
          customerName: item.Customer_Name || item.customerName || 'Walk-in Customer',
          customerPhone: item.Customer_Phone || item.customerPhone || item.Customer_Mobile || '',
          storeName: item.Store_Id?.Store_Name || item.Store_Name || item.storeName || 'Default Store',
          delivery: item.Customer_Address || item.delivery || '',
          items: Array.isArray(item.Invoice_Details) && item.Invoice_Details.length > 0 ? item.Invoice_Details.map((d: any) => ({
            product: {
              id: String(d.Product_Id || d.id),
              name: d.Product_Name || d.Item_Name || 'Product',
              sku: String(d.Product_Id || ''),
              barcode: '',
              category: 'General',
              price: Number(d.Unit_Price || d.Rate || 0),
              taxRate: Number(d.Tax || d.Tax_Percentage || 0),
              stock: Number(d.Stock_Aval || 0),
              unit: d.UOM || 'Unit',
            },
            quantity: Number(d.Shipment_Quantity || d.Quantity || 1),
            rate: Number(d.Unit_Price || d.Rate || 0),
            discountPercent: Number(d.Discount || 0),
            taxAmount: Number(d.Tax || 0),
            total: Number(d.Final_Price || d.Net_Amount || d.Amount || 0),
          })) : [],
          subtotal: Number(item.Invoice_Amount || item.Sub_Total || item.subtotal || 0),
          discountAmount: Number(item.Discount_Amount || item.Spl_Discount || item.discountAmount || 0),
          taxAmount: Number(item.Tax_Amount || item.taxAmount || 0),
          roundOff: Number(item.roundOff || 0),
          totalAmount: Number(item.Net_Amount || item.Invoice_Amount || item.totalAmount || 0),
          amountReceived: Number(item.Amount_Received || item.Net_Amount || item.amountReceived || 0),
          changeReturned: Number(item.changeReturned || 0),
          paymentMethod: (item.Payment_Method || item.paymentMethod || 'Cash') as any,
          status: (item.Is_Paid || item.status === 'Paid') ? 'Paid' : 'Pending',
          cashierName: item.Sales_Person || item.cashierName || 'Counter 1',
          notes: item.Invoice_Note || item.notes || '',
        }));

        const merged = mergeWithLocalData<PosInvoice>('pegatto_pos_invoices', mappedInvoices, ['id', 'invoiceNumber']);
        const finalList = merged.length > 0 ? merged : initialInvoices;
        set({ invoices: finalList, totalCount: Math.max(count, finalList.length), isLoading: false });
      } catch (e: any) {
        if (e?.status === 504 || e?.isTimeout || e?.status === 0) {
          console.warn('POS invoices API timed out (using local cached data):', e?.message || e);
        } else {
          console.error('Failed to load POS invoices from API:', e);
        }
        const local = getLocalData<PosInvoice>('pegatto_pos_invoices');
        set({ invoices: local.length > 0 ? local : initialInvoices, isLoading: false });
      }
    },

  setCustomerInfo: (info) => set({ customerInfo: info }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setAmountReceived: (amount) => set({ amountReceived: amount }),
  setDiscountRate: (discount) => set({ discountRate: discount }),

  addToCart: (product: PosProduct, quantity = 1) => {
    set((state) => {
      const existing = state.cartItems.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        const netRate = existing.rate * (1 - existing.discountPercent / 100);
        const taxable = netRate * newQty;
        const tax = (taxable * product.taxRate) / 100;
        const total = taxable + tax;

        return {
          cartItems: state.cartItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: newQty, taxAmount: tax, total }
              : item
          )
        };
      } else {
        const taxable = product.price * quantity;
        const tax = (taxable * product.taxRate) / 100;
        const total = taxable + tax;

        return {
          cartItems: [
            ...state.cartItems,
            {
              product,
              quantity,
              rate: product.price,
              discountPercent: 0,
              taxAmount: tax,
              total
            }
          ]
        };
      }
    });
  },

  updateCartQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.product.id !== productId) return item;
        const netRate = item.rate * (1 - item.discountPercent / 100);
        const taxable = netRate * quantity;
        const tax = (taxable * item.product.taxRate) / 100;
        const total = taxable + tax;
        return { ...item, quantity, taxAmount: tax, total };
      })
    }));
  },

  updateItemDiscount: (productId: string, discountPercent: number) => {
    set((state) => ({
      cartItems: state.cartItems.map((item) => {
        if (item.product.id !== productId) return item;
        const netRate = item.rate * (1 - discountPercent / 100);
        const taxable = netRate * item.quantity;
        const tax = (taxable * item.product.taxRate) / 100;
        const total = taxable + tax;
        return { ...item, discountPercent, taxAmount: tax, total };
      })
    }));
  },

  removeFromCart: (productId: string) => {
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.product.id !== productId)
    }));
  },

  clearCart: () => {
    set({
      cartItems: [],
      amountReceived: 0,
      discountRate: 0,
      customerInfo: { name: 'Walk-in Customer', phone: '+91 98000 00000' }
    });
  },

  createInvoice: () => {
    const { cartItems, customerInfo, paymentMethod, amountReceived, discountRate, invoices } = get();
    if (cartItems.length === 0) return null;

    const subtotal = cartItems.reduce((acc, item) => acc + item.rate * item.quantity, 0);
    const itemDiscount = cartItems.reduce(
      (acc, item) => acc + (item.rate * item.quantity * item.discountPercent) / 100,
      0
    );
    const generalDiscount = ((subtotal - itemDiscount) * discountRate) / 100;
    const totalDiscount = itemDiscount + generalDiscount;

    const totalTax = cartItems.reduce((acc, item) => acc + item.taxAmount, 0);
    const rawTotal = subtotal - totalDiscount + totalTax;
    const totalAmount = Math.round(rawTotal);
    const roundOff = Number((totalAmount - rawTotal).toFixed(2));

    const change = Math.max(0, (amountReceived || totalAmount) - totalAmount);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const invoiceNum = `POS-${now.getFullYear()}-${String(invoices.length + 101).padStart(5, '0')}`;

    const newInvoice: PosInvoice = {
      id: `pos-inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: dateStr,
      time: timeStr,
      customerName: customerInfo.name || 'Walk-in Customer',
      customerPhone: customerInfo.phone || '+91 98000 00000',
      items: [...cartItems],
      subtotal,
      discountAmount: totalDiscount,
      taxAmount: totalTax,
      roundOff,
      totalAmount,
      amountReceived: amountReceived || totalAmount,
      changeReturned: change,
      paymentMethod,
      status: 'Paid',
      cashierName: 'POS Counter 1'
    };

    upsertLocalItem('pegatto_pos_invoices', newInvoice, ['id', 'invoiceNumber']);

    set((state) => ({
      invoices: [newInvoice, ...state.invoices]
    }));

    return newInvoice;
  },

  loadProducts: async () => {
    try {
      const res = await fetchFromApi('/user/SalesProductMasterList/', { method: 'GET' });
      const list = Array.isArray(res) ? res : (res?.results || []);
      if (list.length > 0) {
        const mapped: PosProduct[] = list.map((p: any) => ({
          id: String(p.id || p.Product_Id),
          name: p.Product_Name || p.name || 'Product',
          sku: String(p.Product_Id || p.sku || p.id),
          barcode: String(p.Barcode || p.barcode || p.Product_Id || ''),
          category: p.Category || 'Groceries',
          price: Number(p.Selling_Price || p.Price || p.Unit_Price || 0),
          costPrice: Number(p.Cost_Price || 0),
          taxRate: Number(p.Tax || p.Tax_Percentage || 5),
          stock: Number(p.Stock_In_Hand || p.Stock_Aval || 50),
          unit: p.Uom || p.UOM || p.unit || 'Unit'
        }));
        set({ products: mapped });
      }
    } catch (e) {
      console.warn('Failed to load products from SalesProductMasterList:', e);
    }
  },

  addCustomInvoice: async (invoice: PosInvoice) => {
    upsertLocalItem('pegatto_pos_invoices', invoice, ['id', 'invoiceNumber']);

    // Also persist into pegatto_invoices so /invoice and /invoice/[id] have full record
    const generalInvoiceRecord = {
      id: invoice.id,
      Invoice_Id: invoice.invoiceNumber,
      Invoice_code: invoice.invoiceNumber,
      Invoice_Type: 'POS Invoice',
      Customer_Name: invoice.customerName,
      Customer_Phone: invoice.customerPhone,
      Customer_Mobile: invoice.customerPhone,
      Customer_Address: invoice.delivery || '',
      Store_Name: invoice.storeName || 'Store',
      Sales_Person: invoice.cashierName || 'Counter 1',
      Invoice_Date: invoice.date,
      Due_Date: invoice.date,
      Created_Date: `${invoice.date}T${invoice.time || '12:00'}:00`,
      Invoice_Amount: invoice.subtotal,
      Sub_Total: invoice.subtotal,
      Discount_Amount: invoice.discountAmount,
      Tax_Amount: invoice.taxAmount,
      Net_Amount: invoice.totalAmount,
      Amount_Received: invoice.amountReceived,
      Payment_Method: invoice.paymentMethod,
      Payment_Status: invoice.status === 'Paid' ? 'Paid' : 'Pending',
      Is_Paid: invoice.status === 'Paid',
      Invoice_Note: invoice.notes || '',
      Invoice_Details: invoice.items.map((item) => ({
        Product_Name: item.product.name,
        Item_Name: item.product.name,
        Product_Id: item.product.sku || item.product.id,
        Quantity: item.quantity,
        Shipment_Quantity: item.quantity,
        Rate: item.rate,
        Unit_Price: item.rate,
        Discount: item.discountPercent,
        Tax_Percentage: item.product.taxRate,
        Tax: item.taxAmount,
        Amount: item.rate * item.quantity,
        Final_Price: item.total,
        Net_Amount: item.total,
        UOM: item.product.unit || 'Unit'
      }))
    };
    upsertLocalItem('pegatto_invoices', generalInvoiceRecord, ['id', 'Invoice_Id', 'Invoice_code']);

    set((state) => ({
      invoices: [invoice, ...state.invoices.filter(i => i.id !== invoice.id && i.invoiceNumber !== invoice.invoiceNumber)]
    }));

    try {
      const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : null;
      const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId')) : null;

      const payload = {
        Invoice_Id: invoice.invoiceNumber,
        Invoice_code: invoice.invoiceNumber,
        Invoice_Type: 'POS Invoice',
        Customer_Name: invoice.customerName,
        Customer_Phone: invoice.customerPhone,
        Customer_Mobile: invoice.customerPhone,
        Customer_Address: invoice.delivery || '',
        Store_Name: invoice.storeName || 'Store',
        Sales_Person: invoice.cashierName || 'Counter 1',
        Invoice_Date: invoice.date,
        Due_Date: invoice.date,
        Invoice_Amount: invoice.subtotal,
        Sub_Total: invoice.subtotal,
        Discount_Amount: invoice.discountAmount,
        Tax_Amount: invoice.taxAmount,
        Net_Amount: invoice.totalAmount,
        Amount_Received: invoice.amountReceived,
        Payment_Method: invoice.paymentMethod,
        Payment_Status: invoice.status === 'Paid' ? 'Paid' : 'Pending',
        Is_Paid: invoice.status === 'Paid',
        Invoice_Note: invoice.notes || '',
        Organization_Id: orgId ? Number(orgId) : undefined,
        Created_By: userId ? Number(userId) : undefined,
        Updated_By: userId ? Number(userId) : undefined,
        Invoice_Details: invoice.items.map((item) => ({
          Product_Name: item.product.name,
          Product_Id: item.product.sku || item.product.id,
          Quantity: item.quantity,
          Rate: item.rate,
          Unit_Price: item.rate,
          Discount: item.discountPercent,
          Tax_Percentage: item.product.taxRate,
          Tax: item.taxAmount,
          Amount: item.rate * item.quantity,
          Final_Price: item.total,
          Net_Amount: item.total,
          UOM: item.product.unit || 'Unit'
        }))
      };
      const res = await createSalesInvoice(payload);
      if (res && res.id) {
        upsertLocalItem('pegatto_pos_invoices', { ...invoice, id: String(res.id) }, ['id', 'invoiceNumber']);
      }
    } catch (err) {
      console.warn('Backend POS invoice save notice (persisted in local state):', err);
    }
  },

  deleteInvoice: async (id: string) => {
    deleteLocalItem('pegatto_pos_invoices', id, ['id', 'invoiceNumber']);
    deleteLocalItem('pegatto_invoices', id, ['id', 'Invoice_Id', 'Invoice_code']);
    set((state) => ({
      invoices: state.invoices.filter((inv) => inv.id !== id)
    }));
    try {
      await deleteSalesInvoiceBackend(id);
    } catch (err) {
      console.error('API deleteSalesInvoice error:', err);
    }
  },

  addProduct: (product: PosProduct) => {
    set((state) => ({
      products: [product, ...state.products]
    }));
  }
}; });

