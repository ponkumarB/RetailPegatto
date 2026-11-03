'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Filter,
  Trash2,
  Send,
  SquarePen,
  Save,
  X,
  ChevronDown,
  Truck,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ArrowUpDown,
  Settings,
  MoreHorizontal,
  Eye,
  FileText,
  CheckSquare,
  Mail,
  PhoneCall,
  RefreshCw,
  AlertTriangle,
  Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  SalesOrder,
  SalesSchedule,
  ProductLineItem,
  fetchSalesOrdersAPI,
  createSalesOrderAPI,
  updateSalesOrderAPI,
  deleteSalesOrderAPI,
  searchSalesOrdersAPI,
  filterSalesOrdersAPI,
  fetchAccountsLookupAPI,
  fetchProductsLookupAPI,
  getQuotationsList,
  createScheduleAPI,
  DEFAULT_CUSTOMER_ACCOUNTS,
  DEFAULT_SALES_PRODUCTS,
} from '@/service/api/sales/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { getLocalData, upsertLocalItem, deleteLocalItem, mergeWithLocalData } from '@/utils/persistentStorage';

const DEFAULT_SALES_OWNERS = [
  'Sales Rep 1',
  'Sales Rep 2',
  'Sales Rep 3',
  'Priya Sharma',
  'Rahul Verma',
  'Neha Singh',
  'Sales Manager',
  'Admin'
];

const ITEMS_PER_PAGE = 10;

export default function SalesOrderPage() {
  const router = useRouter();

  // Dynamic State with persistent localStorage cache
  const [orders, setOrders] = useState<SalesOrder[]>(() => getLocalData<SalesOrder>('pegatto_sales_orders'));
  const [customerOptions, setCustomerOptions] = useState<{ id: number; name: string }[]>([]);
  const [masterProducts, setMasterProducts] = useState<{ name: string; id: string; uom: string; desc: string; price: number }[]>([]);
  const [manualProductRows, setManualProductRows] = useState<{ [index: number]: boolean }>({});
  const [quotationOptions, setQuotationOptions] = useState<any[]>([]);
  const [salesOwnerOptions, setSalesOwnerOptions] = useState<string[]>(DEFAULT_SALES_OWNERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Load lookups dynamically from API
  React.useEffect(() => {
    async function loadLookups() {
      try {
        const [accountsData, productsData, quotationsData, usersData] = await Promise.all([
          fetchAccountsLookupAPI().catch(() => []),
          fetchProductsLookupAPI().catch(() => []),
          getQuotationsList().catch(() => []),
          fetchUsersList().catch(() => [])
        ]);

        const rawAccounts = (Array.isArray(accountsData) && accountsData.length > 0)
          ? accountsData
          : DEFAULT_CUSTOMER_ACCOUNTS;

        const localCusts = [
          ...(getLocalData<any>('pegatto_customer_enquiries') || []),
          ...(getLocalData<any>('pegatto_sales_orders') || [])
        ].map((e: any) => ({
          id: Number(e.CustomerId || e.AccountId || e.id || 1),
          name: e.CustomerName || e.Customer_Name || '',
        })).filter((c: any) => Boolean(c.name));

        const accs = rawAccounts
          .map((a: any) => ({
            id: Number(a.id),
            name: String(a.Organization_Name || a.Company_Name || a.Account_Name || a.name || '').trim(),
          }))
          .filter((c: any) => Boolean(c.name));

        const seenCusts = new Set<string>();
        const mergedCusts: any[] = [];
        [...accs, ...localCusts].forEach((c: any) => {
          const key = c.name.toLowerCase().trim();
          if (key && !seenCusts.has(key)) {
            seenCusts.add(key);
            mergedCusts.push(c);
          }
        });
        setCustomerOptions(mergedCusts);

        const rawProds = (Array.isArray(productsData) && productsData.length > 0)
          ? productsData
          : DEFAULT_SALES_PRODUCTS;

        const prods = rawProds
          .map((p: any) => ({
            name: String(p.Product_Name || p.name || '').trim(),
            id: String(p.Product_Id || p.product_id || p.id || '').trim(),
            uom: String(p.Uom || p.uom || 'Unit').trim(),
            desc: String(p.Description || p.desc || '').trim(),
            price: Number(p.Selling_Price || p.price || 0)
          }))
          .filter((p: any) => Boolean(p.name));
        setMasterProducts(prods);

        const localQuotes = getLocalData<any>('pegatto_quotations') || [];
        const rawQuotes = Array.isArray(quotationsData) ? quotationsData : (quotationsData?.results || quotationsData?.data || []);
        const seenQuotes = new Set<string>();
        const mergedQuotes: any[] = [];
        [...rawQuotes, ...localQuotes].forEach((q: any) => {
          const no = String(q.Offer_No || q.Offer_Id || (q.id ? `QT-${q.id}` : '')).trim();
          if (no && !seenQuotes.has(no)) {
            seenQuotes.add(no);
            mergedQuotes.push(q);
          }
        });
        setQuotationOptions(mergedQuotes);

        const rawUsers = Array.isArray(usersData)
          ? usersData
          : (Array.isArray(usersData?.results) ? usersData.results : (usersData?.data || []));
        const userNames = rawUsers
          .map((u: any) => String(u.username || u.Name || u.name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : '')).trim())
          .filter(Boolean);

        const existingOwners = [
          ...orders.map((o) => o.Sales_Owner),
          ...localQuotes.map((q: any) => q.Sales_Person || q.Sales_Owner)
        ].map((s) => String(s || '').trim()).filter(Boolean);

        const mergedOwners = Array.from(new Set([...DEFAULT_SALES_OWNERS, ...userNames, ...existingOwners]));
        setSalesOwnerOptions(mergedOwners);
      } catch (err) {
        console.error('Failed to load sales order lookups:', err);
      }
    }
    loadLookups();
  }, []);

  // Filter Popover State matching old retail SalesOrderRightCard.js
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterForm, setFilterForm] = useState({
    salesId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    salesId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });

  const loadOrders = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeFilters.salesId || activeFilters.customerName || activeFilters.fromDate || activeFilters.toDate) {
        const res = await filterSalesOrdersAPI({
          fromdate: activeFilters.fromDate || undefined,
          todate: activeFilters.toDate || undefined,
          Customer_Name: activeFilters.customerName || undefined,
          Sales_Id: activeFilters.salesId || undefined,
        });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setOrders(list.map((item: any) => ({
            id: item.id,
            Sales_OrderNo: item.Sales_Id || item.Sales_OrderNo || item.Po_Number || `SO-${item.id}`,
            CustomerName: item.Customer_Name || item.CustomerName || '',
            Enquiry_No: item.Enquiry_No || '',
            Quotation_No: item.Quotation_No || item.Offer_No || '',
            Order_Date: item.Po_Date?.split('T')[0] || item.Order_Date?.split('T')[0] || item.Created_Date?.split('T')[0] || '',
            Payment_Date: item.Payment_Date?.split('T')[0] || '',
            Expected_Delivery_Date: item.Expected_Delivery_Date?.split('T')[0] || item.Delivery_Date?.split('T')[0] || '',
            Total_Amount: Number(item.Total_Amount || item.Net_Amount || 0),
            Status: item.Status || 'Confirmed',
            Payment_Terms: item.Payment_Terms || 'Net 30 Days',
            Sales_Owner: item.Sales_Person || item.Sales_Owner || '',
            products: Array.isArray(item.Sales_Details) ? item.Sales_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || '',
              quantity: Number(p.Quantity || 1),
              unit_price: Number(p.Unit_Price || 0),
              subtotal: Number(p.Final_Price || (p.Quantity || 1) * (p.Unit_Price || 0)),
            })) : [],
          })));
        }
      } else if (searchTerm.trim()) {
        const res = await searchSalesOrdersAPI(searchTerm.trim());
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setOrders(list.map((item: any) => ({
            id: item.id,
            Sales_OrderNo: item.Sales_Id || item.Sales_OrderNo || item.Po_Number || `SO-${item.id}`,
            CustomerName: item.Customer_Name || item.CustomerName || '',
            Enquiry_No: item.Enquiry_No || '',
            Quotation_No: item.Quotation_No || item.Offer_No || '',
            Order_Date: item.Po_Date?.split('T')[0] || item.Order_Date?.split('T')[0] || item.Created_Date?.split('T')[0] || '',
            Payment_Date: item.Payment_Date?.split('T')[0] || '',
            Expected_Delivery_Date: item.Expected_Delivery_Date?.split('T')[0] || item.Delivery_Date?.split('T')[0] || '',
            Total_Amount: Number(item.Total_Amount || item.Net_Amount || 0),
            Status: item.Status || 'Confirmed',
            Payment_Terms: item.Payment_Terms || 'Net 30 Days',
            Sales_Owner: item.Sales_Person || item.Sales_Owner || '',
            products: Array.isArray(item.Sales_Details) ? item.Sales_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || '',
              quantity: Number(p.Quantity || 1),
              unit_price: Number(p.Unit_Price || 0),
              subtotal: Number(p.Final_Price || (p.Quantity || 1) * (p.Unit_Price || 0)),
            })) : [],
          })));
        }
      } else {
        const res = await fetchSalesOrdersAPI(currentPage);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedBackend = list.map((item: any) => ({
          id: item.id,
          Sales_OrderNo: item.Sales_Id || item.Sales_OrderNo || item.Po_Number || `SO-${item.id}`,
          CustomerName: item.Customer_Name || item.CustomerName || '',
          Enquiry_No: item.Enquiry_No || '',
          Quotation_No: item.Quotation_No || item.Offer_No || '',
          Order_Date: item.Po_Date?.split('T')[0] || item.Order_Date?.split('T')[0] || item.Created_Date?.split('T')[0] || '',
          Payment_Date: item.Payment_Date?.split('T')[0] || '',
          Expected_Delivery_Date: item.Expected_Delivery_Date?.split('T')[0] || item.Delivery_Date?.split('T')[0] || '',
          Total_Amount: Number(item.Total_Amount || item.Net_Amount || 0),
          Status: item.Status || 'Confirmed',
          Payment_Terms: item.Payment_Terms || 'Net 30 Days',
          Sales_Owner: item.Sales_Person || item.Sales_Owner || '',
          products: Array.isArray(item.Sales_Details) ? item.Sales_Details.map((p: any) => ({
            id: p.id,
            product_name: p.Product_Name || '',
            product_id: p.Product_Id || '',
            uom: p.UOM || '',
            quantity: Number(p.Quantity || 1),
            unit_price: Number(p.Unit_Price || 0),
            subtotal: Number(p.Final_Price || (p.Quantity || 1) * (p.Unit_Price || 0)),
          })) : [],
        }));
        const merged = mergeWithLocalData<SalesOrder>('pegatto_sales_orders', mappedBackend, ['id', 'Sales_OrderNo']);
        setOrders(merged);
      }
    } catch (e) {
      console.error('Failed to load sales orders from API:', e);
      const local = getLocalData<SalesOrder>('pegatto_sales_orders');
      if (local.length > 0) setOrders(local);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, searchTerm, currentPage]);

  React.useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form State
  const [formState, setFormState] = useState<{
    Sales_OrderNo?: string;
    CustomerName: string;
    Enquiry_No: string;
    Quotation_No: string;
    Quotation_Date: string;
    Order_Date: string;
    Payment_Date: string;
    Expected_Delivery_Date: string;
    Payment_Terms: string;
    Sales_Owner: string;
    products: ProductLineItem[];
  }>({
    CustomerName: '',
    Enquiry_No: '',
    Quotation_No: '',
    Quotation_Date: new Date().toISOString().split('T')[0],
    Order_Date: new Date().toISOString().split('T')[0],
    Payment_Date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Expected_Delivery_Date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Payment_Terms: 'Net 30 Days',
    Sales_Owner: 'Sales Rep 1',
    products: [
      { id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0, subtotal: 0 }
    ]
  });

  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Check entered/modified fields
  const getModifiedFields = (): string[] => {
    const fields: string[] = [];

    if (isEditOpen && selectedOrder) {
      if (formState.CustomerName !== selectedOrder.CustomerName) fields.push(`Customer Name ("${formState.CustomerName}")`);
      if (formState.Enquiry_No !== (selectedOrder.Enquiry_No || '')) fields.push(`Enquiry No ("${formState.Enquiry_No}")`);
      if (formState.Quotation_No !== (selectedOrder.Quotation_No || '')) fields.push(`Quotation No ("${formState.Quotation_No}")`);
      if (formState.Order_Date !== selectedOrder.Order_Date) fields.push(`Order Date ("${formState.Order_Date}")`);
      if (formState.Payment_Date !== (selectedOrder.Payment_Date || '')) fields.push(`Payment Date ("${formState.Payment_Date}")`);
      if (formState.Expected_Delivery_Date !== (selectedOrder.Expected_Delivery_Date || '')) fields.push(`Expected Delivery ("${formState.Expected_Delivery_Date}")`);
      if (formState.Payment_Terms !== (selectedOrder.Payment_Terms || 'Net 30 Days')) fields.push(`Payment Terms ("${formState.Payment_Terms}")`);
      if (JSON.stringify(formState.products) !== JSON.stringify(selectedOrder.products || [])) {
        fields.push(`Product line items`);
      }
      return fields;
    }

    // In Create mode:
    if (formState.CustomerName?.trim()) fields.push(`Customer Name ("${formState.CustomerName.trim()}")`);
    if (formState.Enquiry_No?.trim()) fields.push(`Enquiry No ("${formState.Enquiry_No.trim()}")`);
    if (formState.Quotation_No?.trim()) fields.push(`Quotation No ("${formState.Quotation_No.trim()}")`);
    if (formState.Payment_Terms && formState.Payment_Terms !== 'Net 30 Days') fields.push(`Payment Terms ("${formState.Payment_Terms}")`);

    const modifiedProducts = formState.products.filter(
      (p) => p.product_name || (p.unit_price || 0) > 0 || (p.quantity && p.quantity > 1) || p.description
    );
    if (modifiedProducts.length > 0) {
      fields.push(`${modifiedProducts.length} Product item(s)`);
    }

    return fields;
  };

  const handleCancelClick = () => {
    const modified = getModifiedFields();
    if (modified.length > 0) {
      setShowCancelWarning(true);
    } else {
      handleConfirmCancel();
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelWarning(false);
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setSelectedOrder(null);
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.Sales_OrderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Quotation_No || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Payment_Terms || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Status.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Popover filters
      if (activeFilters.salesId && !item.Sales_OrderNo.toLowerCase().includes(activeFilters.salesId.toLowerCase())) {
        return false;
      }
      if (activeFilters.customerName && !item.CustomerName.toLowerCase().includes(activeFilters.customerName.toLowerCase())) {
        return false;
      }
      if (activeFilters.fromDate) {
        const itemDate = new Date(item.Order_Date);
        const fromD = new Date(activeFilters.fromDate);
        if (itemDate < fromD) return false;
      }
      if (activeFilters.toDate) {
        const itemDate = new Date(item.Order_Date);
        const toD = new Date(activeFilters.toDate);
        if (itemDate > toD) return false;
      }

      return true;
    });
  }, [orders, searchTerm, activeFilters]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, safeCurrentPage]);

  // Handle Popover Filter Apply
  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({ ...filterForm });
    setCurrentPage(1);
    setShowFilterPopover(false);
    toast.success('Filters applied');
  };

  // Handle Popover Filter Reset
  const handleResetFilter = () => {
    const empty = { salesId: '', customerName: '', fromDate: '', toDate: '' };
    setFilterForm(empty);
    setActiveFilters(empty);
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    const nextSeq = orders.length + 1;
    setManualProductRows({});
    setFormErrors({});
    setFormState({
      Sales_OrderNo: `SO-2026-${String(nextSeq).padStart(3, '0')}`,
      CustomerName: '',
      Enquiry_No: '',
      Quotation_No: '',
      Quotation_Date: new Date().toISOString().split('T')[0],
      Order_Date: new Date().toISOString().split('T')[0],
      Payment_Date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Expected_Delivery_Date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Payment_Terms: 'Net 30 Days',
      Sales_Owner: 'Sales Rep 1',
      products: [
        { id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0, subtotal: 0 }
      ]
    });
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (order: SalesOrder) => {
    setSelectedOrder(order);
    setFormErrors({});
    const manualMap: { [index: number]: boolean } = {};
    (order.products || []).forEach((p, idx) => {
      if (p.product_name && !masterProducts.some((mp) => mp.name.toLowerCase().trim() === p.product_name.toLowerCase().trim())) {
        manualMap[idx] = true;
      }
    });
    setManualProductRows(manualMap);
    setFormState({
      Sales_OrderNo: order.Sales_OrderNo,
      CustomerName: order.CustomerName,
      Enquiry_No: order.Enquiry_No || '',
      Quotation_No: order.Quotation_No || '',
      Quotation_Date: order.Quotation_Date || order.Order_Date || '',
      Order_Date: order.Order_Date,
      Payment_Date: order.Payment_Date || order.Expected_Delivery_Date || '',
      Expected_Delivery_Date: order.Expected_Delivery_Date || '',
      Payment_Terms: order.Payment_Terms || 'Net 30 Days',
      Sales_Owner: order.Sales_Owner || 'Sales Rep 1',
      products: order.products && order.products.length > 0
        ? [...order.products]
        : [{ id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0, subtotal: 0 }]
    });
    setIsEditOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsDeleteOpen(true);
  };

  // Open Schedule Dialog
  const handleOpenSchedule = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsScheduleOpen(true);
  };

  // Product row handlers
  const handleAddProductRow = () => {
    setFormState((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { id: Date.now(), product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0, subtotal: 0 }
      ]
    }));
  };

  const handleRemoveProductRow = (index: number) => {
    if (formState.products.length <= 1) return;
    setFormState((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));

    setManualProductRows((prev) => {
      const copy: { [index: number]: boolean } = {};
      Object.keys(prev).forEach((k) => {
        const i = Number(k);
        if (i < index) copy[i] = prev[i];
        else if (i > index) copy[i - 1] = prev[i];
      });
      return copy;
    });

    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy[`product_${index}`];
      return copy;
    });
  };

  const handleQuotationSelect = (quoteNo: string) => {
    const trimmedNo = (quoteNo || '').trim().toLowerCase();
    const quote = quotationOptions.find(
      (q) => (q.Offer_No || q.Offer_Id || (q.id ? `QT-${q.id}` : '')).toLowerCase().trim() === trimmedNo
    );
    if (quote) {
      const details = Array.isArray(quote.ProductOffer_Details) ? quote.ProductOffer_Details : (quote.products || []);
      const mapped = details.map((p: any, idx: number) => ({
        id: Date.now() + idx,
        product_name: p.Product_Name || p.product_name || p.name || '',
        product_id: p.Product_Id || p.product_id || p.id || '',
        uom: p.UOM || p.uom || 'Unit',
        description: p.Description || p.description || '',
        quantity: Number(p.Quantity || p.quantity || 1),
        unit_price: Number(p.Unit_Price || p.unit_price || p.price || 0),
        subtotal: Number(p.Total_Price || p.subtotal || ((p.Quantity || 1) * (p.Unit_Price || 0)))
      }));

      setFormState((prev) => ({
        ...prev,
        Quotation_No: quoteNo,
        CustomerName: quote.Customer_Name || quote.CustomerName || quote.Account_Name || prev.CustomerName,
        Enquiry_No: quote.Enquiry_No || prev.Enquiry_No,
        Quotation_Date: quote.Offer_Date?.split('T')[0] || prev.Quotation_Date,
        Payment_Terms: quote.Payment_Terms || prev.Payment_Terms,
        Sales_Owner: quote.Sales_Person || quote.Sales_Owner || prev.Sales_Owner,
        products: mapped.length > 0 ? mapped : prev.products
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        Quotation_No: quoteNo
      }));
    }
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.Quotation_No;
      delete copy.CustomerName;
      return copy;
    });
  };

  const handleCustomerSelect = (custName: string) => {
    const trimmedCust = (custName || '').trim().toLowerCase();
    const matchQuote = quotationOptions.find(
      (q) => (q.Customer_Name || q.CustomerName || '').toLowerCase().trim() === trimmedCust
    );
    if (matchQuote) {
      const details = Array.isArray(matchQuote.ProductOffer_Details) ? matchQuote.ProductOffer_Details : (matchQuote.products || []);
      const mapped = details.map((p: any, idx: number) => ({
        id: Date.now() + idx,
        product_name: p.Product_Name || p.product_name || p.name || '',
        product_id: p.Product_Id || p.product_id || p.id || '',
        uom: p.UOM || p.uom || 'Unit',
        description: p.Description || p.description || '',
        quantity: Number(p.Quantity || p.quantity || 1),
        unit_price: Number(p.Unit_Price || p.unit_price || p.price || 0),
        subtotal: Number(p.Total_Price || p.subtotal || ((p.Quantity || 1) * (p.Unit_Price || 0)))
      }));

      setFormState((prev) => ({
        ...prev,
        CustomerName: custName,
        Quotation_No: matchQuote.Offer_No || matchQuote.Offer_Id || `QT-${matchQuote.id}`,
        Enquiry_No: matchQuote.Enquiry_No || '',
        Quotation_Date: matchQuote.Offer_Date?.split('T')[0] || prev.Quotation_Date,
        Payment_Terms: matchQuote.Payment_Terms || prev.Payment_Terms,
        Sales_Owner: matchQuote.Sales_Person || matchQuote.Sales_Owner || prev.Sales_Owner,
        products: mapped.length > 0 ? mapped : prev.products
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        CustomerName: custName,
        Sales_Owner: prev.Sales_Owner || 'Sales Rep 1',
        Payment_Terms: prev.Payment_Terms || 'Net 30 Days'
      }));
    }
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.CustomerName;
      delete copy.Quotation_No;
      return copy;
    });
  };

  const handleProductSelect = (index: number, productName: string) => {
    if (productName === '__CUSTOM__') {
      setManualProductRows((prev) => ({ ...prev, [index]: true }));
      setFormState((prev) => {
        const updated = [...prev.products];
        updated[index] = {
          ...updated[index],
          product_name: '',
          product_id: updated[index].product_id || `PRD-${String(Date.now()).slice(-4)}`,
          uom: updated[index].uom || 'Unit'
        };
        return { ...prev, products: updated };
      });
      return;
    }

    const trimmedProd = (productName || '').trim().toLowerCase();
    const master = masterProducts.find((p) => p.name.toLowerCase().trim() === trimmedProd || p.id.toLowerCase().trim() === trimmedProd);
    setFormState((prev) => {
      const updated = [...prev.products];
      if (master) {
        const qty = updated[index].quantity || 1;
        updated[index] = {
          ...updated[index],
          product_name: master.name,
          product_id: master.id,
          uom: master.uom,
          description: master.desc,
          unit_price: master.price,
          subtotal: master.price * qty
        };
      } else {
        const qty = updated[index].quantity || 1;
        const price = updated[index].unit_price || 0;
        updated[index] = {
          ...updated[index],
          product_name: productName,
          product_id: updated[index].product_id || `PRD-${String(Date.now()).slice(-4)}`,
          uom: updated[index].uom || 'Unit',
          subtotal: qty * price
        };
      }
      return { ...prev, products: updated };
    });

    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy[`product_${index}`];
      return copy;
    });
  };

  const handleProductFieldChange = (index: number, field: keyof ProductLineItem, value: any) => {
    setFormState((prev) => {
      const updated = [...prev.products];
      const item = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? value : item.quantity || 1;
        const price = field === 'unit_price' ? value : item.unit_price || 0;
        item.subtotal = qty * price;
      }
      updated[index] = item;
      return { ...prev, products: updated };
    });
  };

  // Validate form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formState.CustomerName.trim()) {
      errors.CustomerName = 'Customer Name is required';
    }
    if (!formState.Order_Date) {
      errors.Order_Date = 'Order Date is required';
    }
    formState.products.forEach((p, idx) => {
      if (!p.product_name.trim()) {
        errors[`product_${idx}`] = 'Product is required';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save create
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const totalAmount = formState.products.reduce((acc, p) => acc + (p.subtotal || 0), 0);

    const newOrder: SalesOrder = {
      id: Date.now(),
      Sales_OrderNo: formState.Sales_OrderNo || `SO-2026-${String(orders.length + 1).padStart(3, '0')}`,
      CustomerName: formState.CustomerName,
      Enquiry_No: formState.Enquiry_No || (formState.Quotation_No ? `ENQ-${formState.Quotation_No.replace('QT-', '')}` : 'ENQ-2026-001'),
      Quotation_No: formState.Quotation_No,
      Quotation_Date: formState.Quotation_Date || formState.Order_Date,
      Order_Date: formState.Order_Date,
      Payment_Date: formState.Payment_Date || formState.Expected_Delivery_Date,
      Expected_Delivery_Date: formState.Expected_Delivery_Date,
      Payment_Terms: formState.Payment_Terms,
      Sales_Owner: formState.Sales_Owner,
      Total_Amount: totalAmount,
      Status: 'Confirmed',
      products: formState.products
    };

    upsertLocalItem('pegatto_sales_orders', newOrder, ['id', 'Sales_OrderNo']);
    setOrders((prev) => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
    setIsCreateOpen(false);
    toast.success(`Sales Order ${newOrder.Sales_OrderNo} created successfully`);

    const matchedAccount = customerOptions.find(
      (c) => c.name.toLowerCase() === formState.CustomerName.toLowerCase()
    );
    const resolvedAccountId = matchedAccount?.id || (customerOptions.length > 0 ? customerOptions[0].id : 1);
    const currentUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : 1;

    try {
      await createSalesOrderAPI({
        id: newOrder.id,
        Sales_OrderNo: newOrder.Sales_OrderNo,
        Po_Number: newOrder.Sales_OrderNo,
        Customer_Name: formState.CustomerName,
        CustomerName: formState.CustomerName,
        Account_Id: resolvedAccountId,
        AccountId: resolvedAccountId,
        Schedule_Status: 'Schedule Not Created',
        SalesUser_Id: currentUserId,
        Sales_Person: formState.Sales_Owner || 'Admin',
        Po_Date: formState.Order_Date,
        Payment_Date: formState.Payment_Date,
        Delivery_Date: formState.Expected_Delivery_Date,
        Payment_Terms: formState.Payment_Terms,
        Total_Amount: totalAmount,
        Net_Amount: totalAmount,
        Sales_Details: formState.products.map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Final_Price: p.subtotal || (p.quantity || 1) * (p.unit_price || 0),
        })),
        SalesOrder_Details: formState.products.map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Final_Price: p.subtotal || (p.quantity || 1) * (p.unit_price || 0),
        })),
      } as any);
      loadOrders();
    } catch (err) {
      console.warn('Backend sales order save notice (persisted locally):', err);
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !validateForm()) return;

    const totalAmount = formState.products.reduce((acc, p) => acc + (p.subtotal || 0), 0);

    const updated: SalesOrder = {
      ...selectedOrder,
      CustomerName: formState.CustomerName,
      Enquiry_No: formState.Enquiry_No,
      Quotation_No: formState.Quotation_No,
      Quotation_Date: formState.Quotation_Date,
      Order_Date: formState.Order_Date,
      Payment_Date: formState.Payment_Date,
      Expected_Delivery_Date: formState.Expected_Delivery_Date,
      Payment_Terms: formState.Payment_Terms,
      Sales_Owner: formState.Sales_Owner,
      Total_Amount: totalAmount,
      products: formState.products
    };

    upsertLocalItem('pegatto_sales_orders', updated, ['id', 'Sales_OrderNo']);
    setOrders((prev) =>
      prev.map((item) => (item.id === selectedOrder.id ? updated : item))
    );
    setIsEditOpen(false);
    toast.success(`Sales Order ${selectedOrder.Sales_OrderNo} updated`);

    const matchedAccount = customerOptions.find(
      (c) => c.name.toLowerCase() === formState.CustomerName.toLowerCase()
    );
    const resolvedAccountId = matchedAccount?.id || (selectedOrder as any).Account_Id || (customerOptions.length > 0 ? customerOptions[0].id : 1);
    const currentUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : 1;

    try {
      await updateSalesOrderAPI({
        id: selectedOrder.id,
        Po_Number: selectedOrder.Sales_OrderNo,
        Customer_Name: formState.CustomerName,
        CustomerName: formState.CustomerName,
        Account_Id: resolvedAccountId,
        AccountId: resolvedAccountId,
        Schedule_Status: (selectedOrder as any).Schedule_Status || 'Schedule Not Created',
        SalesUser_Id: currentUserId,
        Sales_Person: formState.Sales_Owner || 'Admin',
        Po_Date: formState.Order_Date,
        Payment_Date: formState.Payment_Date,
        Delivery_Date: formState.Expected_Delivery_Date,
        Payment_Terms: formState.Payment_Terms,
        Total_Amount: totalAmount,
        Net_Amount: totalAmount,
        Sales_Details: formState.products.map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Final_Price: p.subtotal || (p.quantity || 1) * (p.unit_price || 0),
        })),
        SalesOrder_Details: formState.products.map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Final_Price: p.subtotal || (p.quantity || 1) * (p.unit_price || 0),
        })),
      } as any);
      loadOrders();
    } catch (err) {
      console.warn('Backend sales order update notice (persisted locally):', err);
    }
    setSelectedOrder(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedOrder) return;
    const delId = selectedOrder.id;
    deleteLocalItem('pegatto_sales_orders', delId, ['id', 'Sales_OrderNo']);
    setOrders((prev) => prev.filter((item) => item.id !== delId));
    setIsDeleteOpen(false);
    toast.success(`Sales Order ${selectedOrder.Sales_OrderNo} deleted`);

    try {
      await deleteSalesOrderAPI(delId);
      loadOrders();
    } catch (err) {
      console.warn('Backend sales order delete notice (persisted locally):', err);
    }
    setSelectedOrder(null);
  };

  // Confirm schedule
  const handleConfirmScheduleConversion = async () => {
    if (!selectedOrder) return;
    const schNo = `SCH-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const updatedOrder = { ...selectedOrder, Status: 'Scheduled' as const };
    upsertLocalItem('pegatto_sales_orders', updatedOrder, ['id', 'Sales_OrderNo']);

    setOrders((prev) =>
      prev.map((item) =>
        item.id === selectedOrder.id ? updatedOrder : item
      )
    );

    const firstDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const totalQty = (selectedOrder.products || []).reduce((acc, p) => acc + (Number(p.quantity) || 1), 0);

    const newSchedule: SalesSchedule = {
      id: Date.now(),
      Schedule_No: schNo,
      Order_No: selectedOrder.Sales_OrderNo,
      CustomerName: selectedOrder.CustomerName,
      Customer_Order_No: selectedOrder.Sales_OrderNo,
      Order_Date: selectedOrder.Order_Date,
      Scheduled_Date: firstDate,
      Dispatch_Location: 'Dock 4 - Hub North',
      Total_Quantity: totalQty,
      Status: 'Ready',
      Sales_Owner: selectedOrder.Sales_Owner || 'Sales Rep 1',
      Is_Schedule: true,
      products: (selectedOrder.products || []).map(p => ({
        id: p.id,
        product_name: p.product_name,
        product_id: p.product_id,
        uom: p.uom || 'Unit',
        order_qty: p.quantity,
        schedule_qty: p.quantity,
        schedule_date: firstDate,
        pending_qty: 0
      }))
    };
    upsertLocalItem('pegatto_schedules', newSchedule, ['id', 'Schedule_No']);

    setIsScheduleOpen(false);
    setSelectedOrder(null);
    toast.success(`Schedule ${schNo} allocated for Order ${selectedOrder.Sales_OrderNo}`);

    try {
      await createScheduleAPI({
        id: newSchedule.id,
        Schedule_No: newSchedule.Schedule_No,
        ShipmentScheduleNo: newSchedule.Schedule_No,
        Cutomer_OrderNo: selectedOrder.Sales_OrderNo,
        Customer_Name: selectedOrder.CustomerName,
        Order_Date: selectedOrder.Order_Date,
        Schedule_Date: firstDate,
        Sales_Person: selectedOrder.Sales_Owner || 'Sales Rep 1',
        checkSchedule: true,
        Total_Quantity: totalQty,
        Dispatch_Location: 'Dock 4 - Hub North',
        Schedule_Details: (selectedOrder.products || []).map((p) => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom || 'Unit',
          Order_Qty: p.quantity,
          Schedule_Qty: p.quantity,
          Schedule_Date: firstDate,
          Pending_Qty: 0
        }))
      } as any);
    } catch (e) {
      console.warn('Backend schedule sync notice (persisted locally):', e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Sales Order List
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          {/* Subtitle with filter icon button */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className="flex items-center gap-2 text-[#198754] hover:text-[#146c43] font-semibold text-sm cursor-pointer transition-colors"
              title="Click to toggle filters"
            >
              <Filter className="h-4 w-4 text-[#198754]" />
              <span>( {filteredOrders.length} ) Orders</span>
            </button>

            {/* Filter Popover matching old retail SalesOrderRightCard.js */}
            {showFilterPopover && (
              <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    Filters
                  </span>
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1 rounded transition-colors cursor-pointer"
                    title="Reset Filters"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleApplyFilter} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Sales Id</label>
                      <input
                        type="text"
                        placeholder="Sales Id"
                        value={filterForm.salesId}
                        onChange={(e) => setFilterForm({ ...filterForm, salesId: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Customer Name</label>
                      <input
                        type="text"
                        placeholder="Customer Name"
                        value={filterForm.customerName}
                        onChange={(e) => setFilterForm({ ...filterForm, customerName: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">From Date</label>
                      <input
                        type="date"
                        value={filterForm.fromDate}
                        onChange={(e) => setFilterForm({ ...filterForm, fromDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">To Date</label>
                      <input
                        type="date"
                        value={filterForm.toDate}
                        onChange={(e) => setFilterForm({ ...filterForm, toDate: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="submit"
                      className="bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold px-4 py-1.5 rounded shadow-xs transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilterPopover(false)}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-1.5 rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right: Search box & Create + button */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleOpenCreate}
              className="bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              Create +
            </button>
          </div>
        </div>
      </div>

      {/* Main Table matching clean Title Case style */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr className="border-0">
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>SALES ID</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[170px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>CUSTOMER NAME</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>ENQUIRY NO</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>QUOTATION DATE</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>PAYMENTS DATE</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[150px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>PAYMENT TERMS</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>SALES OWNER</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-right min-w-[130px]">
                  <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>NET AMOUNT</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>STATUS</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center min-w-[100px]">
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-xs text-slate-700 dark:text-slate-300">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No sales orders found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isScheduled =
                    (order.Status as string) === 'Scheduled' || (order.Status as string) === 'Schedule Created';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {order.Sales_OrderNo}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-medium">
                        {order.CustomerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {order.Enquiry_No || (order.Quotation_No ? `ENQ-${order.Quotation_No.replace('QT-', '')}` : '-')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {order.Quotation_Date || order.Order_Date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {order.Payment_Date || order.Expected_Delivery_Date || order.Order_Date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {order.Payment_Terms}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {order.Sales_Owner}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-slate-100">
                        ₹{(order.Total_Amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {isScheduled ? 'Schedule Created' : order.Status}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Order Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                              Order Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => handleOpenEdit(order)}
                            >
                              <SquarePen className="h-4 w-4 text-slate-500" /> Edit Order
                            </DropdownMenuItem>

                            {!isScheduled && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600"
                                onClick={() => handleOpenSchedule(order)}
                              >
                                <Truck className="h-4 w-4 text-blue-600" /> Allocate Schedule
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1.5 rounded-lg"
                              onClick={() => handleOpenDelete(order)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" /> Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Controls matching customer enquiry */}
        <div className="p-4 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 select-none">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isActive = pageNum === safeCurrentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7] font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs"
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT ORDER MODAL */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelClick();
          }
        }}
      >
        <DialogContent className="max-w-4xl p-6 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isCreateOpen ? 'Create Sales Order' : 'Edit Sales Order'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={isCreateOpen ? handleSaveCreate : handleSaveEdit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    list="sales-order-customer-suggestions"
                    value={formState.CustomerName}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded border ${
                      formErrors.CustomerName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                  />
                  <datalist id="sales-order-customer-suggestions">
                    {customerOptions.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </datalist>
                </div>
                {formErrors.CustomerName && (
                  <p className="text-[11px] text-red-500">{formErrors.CustomerName}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Enquiry No
                </label>
                <input
                  type="text"
                  placeholder="Enquiry No"
                  value={formState.Enquiry_No}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Enquiry_No: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Quotation No
                </label>
                <div className="relative">
                  <select
                    value={formState.Quotation_No}
                    onChange={(e) => handleQuotationSelect(e.target.value)}
                    className={`w-full appearance-none px-3 py-2 pr-8 text-xs rounded border ${
                      formErrors.Quotation_No ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                  >
                    <option value="">Select Quotation No</option>
                    {quotationOptions.map((q) => {
                      const no = q.Offer_No || q.Offer_Id || `QT-${q.id}`;
                      const cust = q.Customer_Name || q.CustomerName || '';
                      return (
                        <option key={no} value={no}>
                          {no}{cust ? ` — ${cust}` : ''}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {formErrors.Quotation_No && (
                  <p className="text-[11px] text-red-500">{formErrors.Quotation_No}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Quotation Date
                </label>
                <input
                  type="date"
                  value={formState.Quotation_Date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Quotation_Date: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.Order_Date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Order_Date: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs rounded border ${
                    formErrors.Order_Date ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                />
                {formErrors.Order_Date && (
                  <p className="text-[11px] text-red-500">{formErrors.Order_Date}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={formState.Payment_Date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Payment_Date: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Expected Delivery Date
                </label>
                <input
                  type="date"
                  value={formState.Expected_Delivery_Date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Expected_Delivery_Date: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Payment Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. Net 30 Days"
                  value={formState.Payment_Terms}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Payment_Terms: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Sales Owner
                </label>
                <div className="relative">
                  <select
                    value={formState.Sales_Owner || 'Sales Rep 1'}
                    onChange={(e) => setFormState((prev) => ({ ...prev, Sales_Owner: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] cursor-pointer"
                  >
                    <option value="">Select Sales Owner</option>
                    {Array.from(new Set([...salesOwnerOptions, ...(formState.Sales_Owner ? [formState.Sales_Owner] : [])])).map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3 pt-2">
              <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 w-32">Product Id</th>
                      <th className="py-2.5 px-3 w-24">UOM</th>
                      <th className="py-2.5 px-3 w-24">Unit Price</th>
                      <th className="py-2.5 px-3 w-20">Quantity</th>
                      <th className="py-2.5 px-3 w-24 text-right">Net Amount</th>
                      <th className="py-2.5 px-3 w-14 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {formState.products.map((row, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              {manualProductRows[idx] ? (
                                <div className="relative w-full flex items-center">
                                  <input
                                    type="text"
                                    placeholder="Type product name..."
                                    value={row.product_name}
                                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                                    className={`w-full px-2.5 py-1.5 text-xs rounded border ${
                                      formErrors[`product_${idx}`] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                                    } bg-transparent text-slate-900 dark:text-slate-100 pr-7 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    title="Switch to catalog dropdown"
                                    onClick={() => setManualProductRows((prev) => ({ ...prev, [idx]: false }))}
                                    className="absolute right-1.5 text-xs text-slate-400 hover:text-emerald-600 p-0.5 cursor-pointer"
                                  >
                                    📋
                                  </button>
                                </div>
                              ) : (
                                <div className="relative w-full flex items-center">
                                  <select
                                    value={row.product_name}
                                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                                    className={`w-full px-2.5 py-1.5 text-xs rounded border ${
                                      formErrors[`product_${idx}`] ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                                    } bg-transparent text-slate-900 dark:text-slate-100 appearance-none pr-7 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                                  >
                                    <option value="">Select or enter product</option>
                                    {masterProducts.map((p) => (
                                      <option key={p.id || p.name} value={p.name}>
                                        {p.name} {p.id ? `(${p.id})` : ''}
                                      </option>
                                    ))}
                                    <option value="__CUSTOM__">✏️ + Enter Custom Product...</option>
                                  </select>
                                  <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                </div>
                              )}
                              <button
                                type="button"
                                title={manualProductRows[idx] ? "Switch to Catalog List" : "Type Custom Product"}
                                onClick={() => {
                                  setManualProductRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
                                }}
                                className="text-[10px] px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer font-medium"
                              >
                                {manualProductRows[idx] ? "Catalog" : "Custom"}
                              </button>
                            </div>
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Product ID"
                              value={row.product_id || ''}
                              onChange={(e) => handleProductFieldChange(idx, 'product_id', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="UOM"
                              value={row.uom || ''}
                              onChange={(e) => handleProductFieldChange(idx, 'uom', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min={0}
                              placeholder="Price"
                              value={row.unit_price || 0}
                              onChange={(e) => handleProductFieldChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min={1}
                              placeholder="Qty"
                              value={row.quantity || 1}
                              onChange={(e) => handleProductFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>

                          <td className="p-2 text-right font-medium">
                            ₹{((row.subtotal || (row.quantity || 1) * (row.unit_price || 0))).toLocaleString('en-IN')}
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveProductRow(idx)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                        {formErrors[`product_${idx}`] && (
                          <tr>
                            <td colSpan={7} className="px-3 pb-1 text-[11px] text-red-500 font-medium">
                              {formErrors[`product_${idx}`]}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleAddProductRow}
                  className="text-[#2A7D5B] hover:text-[#23674b] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  + Add Product
                </button>

                <div className="text-right text-xs font-bold text-slate-900 dark:text-slate-100">
                  Total Order Amount:{' '}
                  <span className="text-[#2A7D5B] text-sm font-extrabold ml-1">
                    ₹{formState.products.reduce((acc, p) => acc + (p.subtotal || (p.quantity || 1) * (p.unit_price || 0)), 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                type="submit"
                className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-6 py-2 rounded font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Save
              </button>

              <button
                type="button"
                onClick={handleCancelClick}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-6 py-2 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONVERT TO SCHEDULE MODAL */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Allocate Shipment Schedule
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 dark:text-slate-400 py-2">
            Are you sure you want to allocate a delivery schedule for Sales Order{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedOrder?.Sales_OrderNo}
            </span>{' '}
            for <span className="font-semibold">{selectedOrder?.CustomerName}</span>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsScheduleOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmScheduleConversion}
              className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Confirm Schedule
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 dark:text-slate-400 py-2">
            Are you sure you want to delete sales order{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedOrder?.Sales_OrderNo}
            </span>{' '}
            for <span className="font-semibold">{selectedOrder?.CustomerName}</span>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* WARNING MODAL ON CANCEL */}
      <Dialog open={showCancelWarning} onOpenChange={setShowCancelWarning}>
        <DialogContent className="max-w-[430px] p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Header with soft green banner and warning icon */}
          <div className="bg-[#D4E8DC] dark:bg-emerald-950/70 px-4 py-3 flex items-center gap-2.5 rounded-t-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Warning</h3>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              CRMFarm found that some modification has been made. By cancelling the modification will not be saved
            </p>

            {getModifiedFields().length > 0 && (
              <div className="mt-3.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Entered Details:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {getModifiedFields().map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold px-4 py-1.5 rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Yes
              </button>

              <button
                type="button"
                onClick={() => setShowCancelWarning(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 py-1.5 rounded flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
                No
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
