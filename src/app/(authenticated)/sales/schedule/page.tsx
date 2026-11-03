'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Filter,
  Trash2,
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
  SalesSchedule,
  SalesShipment,
  fetchSchedulesAPI,
  createScheduleAPI,
  updateScheduleAPI,
  deleteScheduleAPI,
  searchSchedulesAPI,
  filterSchedulesAPI,
  fetchAccountsLookupAPI,
  fetchProductsLookupAPI,
  getSalesOrdersList,
  createShipmentAPI,
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

export interface ScheduleProductItem {
  id?: number | string;
  product_name: string;
  product_id: string;
  uom: string;
  order_qty: number;
  schedule_qty: number;
  schedule_date: string;
  pending_qty: number;
}

const ITEMS_PER_PAGE = 10;

export default function SchedulePage() {
  const router = useRouter();

  // Dynamic State with persistent localStorage cache
  const [schedules, setSchedules] = useState<SalesSchedule[]>(() => getLocalData<SalesSchedule>('pegatto_schedules'));
  const [customerOptions, setCustomerOptions] = useState<{ id: number; name: string }[]>([]);
  const [salesOrderOptions, setSalesOrderOptions] = useState<any[]>([]);
  const [masterProducts, setMasterProducts] = useState<{ name: string; id: string; uom: string }[]>([]);
  const [manualProductRows, setManualProductRows] = useState<{ [index: number]: boolean }>({});
  const [salesOwnerOptions, setSalesOwnerOptions] = useState<string[]>(DEFAULT_SALES_OWNERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load lookups dynamically from API
  React.useEffect(() => {
    async function loadLookups() {
      try {
        const [accountsData, productsData, salesOrdersData, usersData] = await Promise.all([
          fetchAccountsLookupAPI().catch(() => []),
          fetchProductsLookupAPI().catch(() => []),
          getSalesOrdersList().catch(() => []),
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
          }))
          .filter((p: any) => Boolean(p.name));
        setMasterProducts(prods);

        const localOrders = getLocalData<any>('pegatto_sales_orders') || [];
        const rawOrders = Array.isArray(salesOrdersData) ? salesOrdersData : (salesOrdersData?.results || salesOrdersData?.data || []);
        const seenOrders = new Set<string>();
        const mergedOrders: any[] = [];
        [...rawOrders, ...localOrders].forEach((o: any) => {
          const no = String(o.Sales_OrderNo || o.Sales_Id || o.Po_Number || (o.id ? `SO-${o.id}` : '')).trim();
          if (no && !seenOrders.has(no)) {
            seenOrders.add(no);
            mergedOrders.push(o);
          }
        });
        setSalesOrderOptions(mergedOrders);

        const rawUsers = Array.isArray(usersData)
          ? usersData
          : (Array.isArray(usersData?.results) ? usersData.results : (usersData?.data || []));
        const userNames = rawUsers
          .map((u: any) => String(u.username || u.Name || u.name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : '')).trim())
          .filter(Boolean);

        const existingOwners = [
          ...schedules.map((s) => s.Sales_Owner),
          ...localOrders.map((o: any) => o.Sales_Person || o.Sales_Owner)
        ].map((s) => String(s || '').trim()).filter(Boolean);

        const mergedOwners = Array.from(new Set([...DEFAULT_SALES_OWNERS, ...userNames, ...existingOwners]));
        setSalesOwnerOptions(mergedOwners);
      } catch (err) {
        console.error('Failed to load schedule lookups:', err);
      }
    }
    loadLookups();
  }, []);

  // Filter Popover State matching old retail ScheduleRightCard.js
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterForm, setFilterForm] = useState({
    scheduleId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    scheduleId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadSchedules = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeFilters.scheduleId || activeFilters.customerName || activeFilters.fromDate || activeFilters.toDate) {
        const res = await filterSchedulesAPI({
          Schedule_Id: activeFilters.scheduleId || undefined,
          Customer_Name: activeFilters.customerName || undefined,
          fromdate: activeFilters.fromDate || undefined,
          todate: activeFilters.toDate || undefined,
        });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setSchedules(list.map((item: any) => ({
            id: item.id,
            Schedule_No: item.Schedule_Id || item.Schedule_No || `SCH-${item.id}`,
            Order_No: item.Cutomer_OrderNo || item.Order_No || item.SalesOrder_ID || '',
            CustomerName: item.Customer_Name || item.CustomerName || '',
            Customer_Order_No: item.Cutomer_OrderNo || item.Customer_Order_No || '',
            Order_Date: item.Order_Date?.split('T')[0] || item.Scheduled_Date || '',
            Scheduled_Date: item.Schedule_Date?.split('T')[0] || item.Scheduled_Date || '',
            Dispatch_Location: item.Dispatch_Location || 'Dock 4 - Hub North',
            Total_Quantity: Number(item.Total_Quantity || item.Total_Qty || 1),
            Status: item.Shipment_Status || item.Status || 'Ready',
            Sales_Owner: item.Sales_Person || item.Sales_Owner || 'Sales Rep 1',
            Is_Schedule: item.checkSchedule ?? item.Is_Schedule ?? true,
            products: Array.isArray(item.Schedule_Details) ? item.Schedule_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || 'Unit',
              order_qty: Number(p.Order_Qty || 0),
              schedule_qty: Number(p.Schedule_Qty || 0),
              schedule_date: p.Schedule_Date || '',
              pending_qty: Number(p.Pending_Qty || 0),
            })) : [],
          })));
        }
      } else if (searchTerm.trim()) {
        const res = await searchSchedulesAPI(searchTerm.trim());
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setSchedules(list.map((item: any) => ({
            id: item.id,
            Schedule_No: item.Schedule_Id || item.Schedule_No || `SCH-${item.id}`,
            Order_No: item.Cutomer_OrderNo || item.Order_No || item.SalesOrder_ID || '',
            CustomerName: item.Customer_Name || item.CustomerName || '',
            Customer_Order_No: item.Cutomer_OrderNo || item.Customer_Order_No || '',
            Order_Date: item.Order_Date?.split('T')[0] || item.Scheduled_Date || '',
            Scheduled_Date: item.Schedule_Date?.split('T')[0] || item.Scheduled_Date || '',
            Dispatch_Location: item.Dispatch_Location || 'Dock 4 - Hub North',
            Total_Quantity: Number(item.Total_Quantity || item.Total_Qty || 1),
            Status: item.Shipment_Status || item.Status || 'Ready',
            Sales_Owner: item.Sales_Person || item.Sales_Owner || 'Sales Rep 1',
            Is_Schedule: item.checkSchedule ?? item.Is_Schedule ?? true,
            products: Array.isArray(item.Schedule_Details) ? item.Schedule_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || 'Unit',
              order_qty: Number(p.Order_Qty || 0),
              schedule_qty: Number(p.Schedule_Qty || 0),
              schedule_date: p.Schedule_Date || '',
              pending_qty: Number(p.Pending_Qty || 0),
            })) : [],
          })));
        }
      } else {
        const res = await fetchSchedulesAPI(1);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedBackend = list.map((item: any) => ({
          id: item.id,
          Schedule_No: item.Schedule_Id || item.Schedule_No || `SCH-${item.id}`,
          Order_No: item.Cutomer_OrderNo || item.Order_No || item.SalesOrder_ID || '',
          CustomerName: item.Customer_Name || item.CustomerName || '',
          Customer_Order_No: item.Cutomer_OrderNo || item.Customer_Order_No || '',
          Order_Date: item.Order_Date?.split('T')[0] || item.Scheduled_Date || '',
          Scheduled_Date: item.Schedule_Date?.split('T')[0] || item.Scheduled_Date || '',
          Dispatch_Location: item.Dispatch_Location || 'Dock 4 - Hub North',
          Total_Quantity: Number(item.Total_Quantity || item.Total_Qty || 1),
          Status: item.Shipment_Status || item.Status || 'Ready',
          Sales_Owner: item.Sales_Person || item.Sales_Owner || 'Sales Rep 1',
          Is_Schedule: item.checkSchedule ?? item.Is_Schedule ?? true,
          products: Array.isArray(item.Schedule_Details) ? item.Schedule_Details.map((p: any) => ({
            id: p.id,
            product_name: p.Product_Name || '',
            product_id: p.Product_Id || '',
            uom: p.UOM || 'Unit',
            order_qty: Number(p.Order_Qty || 0),
            schedule_qty: Number(p.Schedule_Qty || 0),
            schedule_date: p.Schedule_Date || '',
            pending_qty: Number(p.Pending_Qty || 0),
          })) : [],
        }));
        const merged = mergeWithLocalData<SalesSchedule>('pegatto_schedules', mappedBackend, ['id', 'Schedule_No']);
        setSchedules(merged);
      }
    } catch {
      const local = getLocalData<SalesSchedule>('pegatto_schedules');
      if (local.length > 0) setSchedules(local);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, searchTerm]);

  React.useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isShipmentOpen, setIsShipmentOpen] = useState(false);

  const [selectedSchedule, setSelectedSchedule] = useState<SalesSchedule | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form State matching screenshot
  const [formState, setFormState] = useState<{
    Schedule_No?: string;
    Sales_Order: string;
    CustomerName: string;
    Customer_Order_No: string;
    Order_Date: string;
    Sales_Owner: string;
    Is_Schedule: boolean;
    products: ScheduleProductItem[];
  }>({
    Sales_Order: '',
    CustomerName: '',
    Customer_Order_No: '',
    Order_Date: new Date().toISOString().split('T')[0],
    Sales_Owner: '',
    Is_Schedule: true,
    products: [
      {
        id: 1,
        product_name: '',
        product_id: '',
        uom: '',
        order_qty: 0,
        schedule_qty: 0,
        schedule_date: new Date().toISOString().split('T')[0],
        pending_qty: 0
      }
    ]
  });

  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Check entered/modified fields
  const getModifiedFields = (): string[] => {
    const fields: string[] = [];

    if (isEditOpen && selectedSchedule) {
      if (formState.CustomerName !== selectedSchedule.CustomerName) fields.push(`Customer Name ("${formState.CustomerName}")`);
      if (formState.Sales_Order !== selectedSchedule.Order_No) fields.push(`Sales Order ("${formState.Sales_Order}")`);
      if (formState.Customer_Order_No !== (selectedSchedule.Customer_Order_No || '')) fields.push(`Customer Order No ("${formState.Customer_Order_No}")`);
      if (formState.Order_Date !== (selectedSchedule.Order_Date || '')) fields.push(`Order Date ("${formState.Order_Date}")`);
      if (formState.Sales_Owner !== (selectedSchedule.Sales_Owner || '')) fields.push(`Sales Owner ("${formState.Sales_Owner}")`);
      return fields;
    }

    // In Create mode:
    if (formState.Sales_Order?.trim()) fields.push(`Sales Order ("${formState.Sales_Order.trim()}")`);
    if (formState.CustomerName?.trim()) fields.push(`Customer Name ("${formState.CustomerName.trim()}")`);
    if (formState.Customer_Order_No?.trim()) fields.push(`Customer Order No ("${formState.Customer_Order_No.trim()}")`);
    if (formState.Sales_Owner?.trim()) fields.push(`Sales Owner ("${formState.Sales_Owner.trim()}")`);

    const modifiedProducts = formState.products.filter(
      (p) => p.product_name || p.schedule_qty > 0 || p.order_qty > 0
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
    setSelectedSchedule(null);
  };

  // Auto-populate when selecting a sales order
  const handleSalesOrderSelect = (orderId: string) => {
    const trimmedId = (orderId || '').trim();
    const found = salesOrderOptions.find(
      (o) =>
        (o.Sales_OrderNo || o.Sales_Id || o.Po_Number || (o.id ? `SO-${o.id}` : '')).toLowerCase().trim() ===
        trimmedId.toLowerCase()
    );
    if (found) {
      const details = Array.isArray(found.SalesOrder_Details)
        ? found.SalesOrder_Details
        : (Array.isArray(found.Sales_Details)
            ? found.Sales_Details
            : (found.products || []));
      const mapped = details.map((p: any, idx: number) => ({
        id: Date.now() + idx,
        product_name: p.Product_Name || p.product_name || p.name || `Product Item ${idx + 1}`,
        product_id: p.Product_Id || p.product_id || p.id || `PRD-${String(idx + 1).padStart(3, '0')}`,
        uom: p.UOM || p.uom || 'Unit',
        order_qty: Number(p.Quantity || p.quantity || p.order_qty || p.OrderQuantity || 1),
        schedule_qty: Number(p.ScheduleQuantity || p.Schedule_Qty || p.schedule_qty || p.Quantity || 1),
        schedule_date: p.ScheduleDate || p.schedule_date || new Date().toISOString().split('T')[0],
        pending_qty: Number(p.PendingQuantity ?? p.pending_qty ?? 0)
      }));

      setFormState((prev) => ({
        ...prev,
        Sales_Order: orderId,
        CustomerName: found.Customer_Name || found.CustomerName || prev.CustomerName,
        Customer_Order_No: found.Customer_Order_No || found.Po_Number || prev.Customer_Order_No,
        Order_Date: found.Po_Date?.split('T')[0] || found.Order_Date?.split('T')[0] || prev.Order_Date,
        Sales_Owner: found.Sales_Person || found.Sales_Owner || prev.Sales_Owner,
        products: mapped.length > 0 ? mapped : prev.products
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        Sales_Order: orderId
      }));
    }
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.Sales_Order;
      return copy;
    });
  };

  const handleCustomerSelect = (custName: string) => {
    const trimmedName = (custName || '').trim();
    const foundOrder = salesOrderOptions.find(
      (o) => (o.Customer_Name || o.CustomerName || '').toLowerCase().trim() === trimmedName.toLowerCase()
    );
    if (foundOrder) {
      const details = Array.isArray(foundOrder.SalesOrder_Details)
        ? foundOrder.SalesOrder_Details
        : (Array.isArray(foundOrder.Sales_Details)
            ? foundOrder.Sales_Details
            : (foundOrder.products || []));
      const mapped = details.map((p: any, idx: number) => ({
        id: Date.now() + idx,
        product_name: p.Product_Name || p.product_name || p.name || `Product Item ${idx + 1}`,
        product_id: p.Product_Id || p.product_id || p.id || `PRD-${String(idx + 1).padStart(3, '0')}`,
        uom: p.UOM || p.uom || 'Unit',
        order_qty: Number(p.Quantity || p.quantity || p.order_qty || p.OrderQuantity || 1),
        schedule_qty: Number(p.ScheduleQuantity || p.Schedule_Qty || p.schedule_qty || p.Quantity || 1),
        schedule_date: p.ScheduleDate || p.schedule_date || new Date().toISOString().split('T')[0],
        pending_qty: Number(p.PendingQuantity ?? p.pending_qty ?? 0)
      }));

      setFormState((prev) => ({
        ...prev,
        CustomerName: custName,
        Sales_Order: foundOrder.Sales_OrderNo || foundOrder.Sales_Id || foundOrder.Po_Number || (foundOrder.id ? `SO-${foundOrder.id}` : ''),
        Customer_Order_No: foundOrder.Customer_Order_No || foundOrder.Po_Number || prev.Customer_Order_No,
        Order_Date: foundOrder.Po_Date?.split('T')[0] || foundOrder.Order_Date?.split('T')[0] || prev.Order_Date,
        Sales_Owner: foundOrder.Sales_Person || foundOrder.Sales_Owner || prev.Sales_Owner,
        products: mapped.length > 0 ? mapped : prev.products
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        CustomerName: custName,
        Sales_Owner: prev.Sales_Owner || 'Sales Rep 1'
      }));
    }
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.CustomerName;
      return copy;
    });
  };

  // Product row field change
  const handleProductRowChange = (index: number, field: keyof ScheduleProductItem, value: any) => {
    if (field === 'product_name' && value === '__CUSTOM__') {
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

    setFormState((prev) => {
      const updated = [...prev.products];
      const item = { ...updated[index], [field]: value };
      if (field === 'product_name') {
        const trimmed = String(value).toLowerCase().trim();
        const prod = masterProducts.find((p) => p.name.toLowerCase().trim() === trimmed || p.id.toLowerCase().trim() === trimmed);
        if (prod) {
          item.product_id = prod.id;
          item.uom = prod.uom;
        } else if (value && !item.product_id) {
          item.product_id = `PRD-${String(Date.now()).slice(-4)}`;
        }
      }
      if (field === 'order_qty' || field === 'schedule_qty') {
        const oQty = field === 'order_qty' ? Number(value) || 0 : Number(item.order_qty || 0);
        const sQty = field === 'schedule_qty' ? Number(value) || 0 : Number(item.schedule_qty || 0);
        item.pending_qty = Math.max(0, oQty - sQty);
      }
      updated[index] = item;
      return { ...prev, products: updated };
    });
  };

  const handleAddProductRow = () => {
    setFormState((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          id: Date.now(),
          product_name: '',
          product_id: '',
          uom: '',
          order_qty: 0,
          schedule_qty: 0,
          schedule_date: new Date().toISOString().split('T')[0],
          pending_qty: 0
        }
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
  };

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.Schedule_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Order_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Dispatch_Location || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Popover filters
      if (activeFilters.scheduleId && !item.Schedule_No.toLowerCase().includes(activeFilters.scheduleId.toLowerCase())) {
        return false;
      }
      if (activeFilters.customerName && !item.CustomerName.toLowerCase().includes(activeFilters.customerName.toLowerCase())) {
        return false;
      }
      if (activeFilters.fromDate) {
        const itemDate = new Date(item.Scheduled_Date);
        const fromD = new Date(activeFilters.fromDate);
        if (itemDate < fromD) return false;
      }
      if (activeFilters.toDate) {
        const itemDate = new Date(item.Scheduled_Date);
        const toD = new Date(activeFilters.toDate);
        if (itemDate > toD) return false;
      }

      return true;
    });
  }, [schedules, searchTerm, activeFilters]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedSchedules = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredSchedules.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSchedules, safeCurrentPage]);

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
    const empty = { scheduleId: '', customerName: '', fromDate: '', toDate: '' };
    setFilterForm(empty);
    setActiveFilters(empty);
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    setFormErrors({});
    setFormState({
      Sales_Order: '',
      CustomerName: '',
      Customer_Order_No: '',
      Order_Date: new Date().toISOString().split('T')[0],
      Sales_Owner: '',
      Is_Schedule: true,
      products: [
        {
          id: 1,
          product_name: '',
          product_id: '',
          uom: '',
          order_qty: 0,
          schedule_qty: 0,
          schedule_date: new Date().toISOString().split('T')[0],
          pending_qty: 0
        }
      ]
    });
    setManualProductRows({});
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (schedule: SalesSchedule) => {
    setSelectedSchedule(schedule);
    setFormErrors({});
    setFormState({
      Schedule_No: schedule.Schedule_No,
      Sales_Order: schedule.Order_No,
      CustomerName: schedule.CustomerName,
      Customer_Order_No: schedule.Customer_Order_No || 'CUST-ORD-8821',
      Order_Date: schedule.Order_Date || schedule.Scheduled_Date,
      Sales_Owner: schedule.Sales_Owner || 'Sales Rep 1',
      Is_Schedule: schedule.Is_Schedule !== false,
      products: schedule.products && schedule.products.length > 0
        ? schedule.products.map((p: any, idx: number) => ({
            id: p.id || idx + 1,
            product_name: p.product_name || '',
            product_id: p.product_id || '',
            uom: p.uom || 'Unit',
            order_qty: p.order_qty || schedule.Total_Quantity || 1,
            schedule_qty: p.schedule_qty || schedule.Total_Quantity || 1,
            schedule_date: p.schedule_date || schedule.Scheduled_Date,
            pending_qty: p.pending_qty || 0
          }))
        : [
            {
              id: 1,
              product_name: '10" Android POS Tablet',
              product_id: 'PRD-TAB-05',
              uom: 'Unit',
              order_qty: schedule.Total_Quantity || 5,
              schedule_qty: schedule.Total_Quantity || 5,
              schedule_date: schedule.Scheduled_Date,
              pending_qty: 0
            }
          ]
    });
    const manualMap: { [index: number]: boolean } = {};
    (schedule.products || []).forEach((p: any, idx: number) => {
      if (p.product_name && !masterProducts.some((mp) => mp.name.toLowerCase().trim() === String(p.product_name).toLowerCase().trim())) {
        manualMap[idx] = true;
      }
    });
    setManualProductRows(manualMap);
    setIsEditOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (schedule: SalesSchedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteOpen(true);
  };

  // Open Shipment Dialog
  const handleOpenShipment = (schedule: SalesSchedule) => {
    setSelectedSchedule(schedule);
    setIsShipmentOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formState.CustomerName.trim()) {
      errors.CustomerName = 'Customer Name is required';
    }
    if (!formState.Sales_Order.trim()) {
      errors.Sales_Order = 'Sales Order is required';
    }
    if (formState.products.length === 0) {
      errors.products = 'At least one product item is required';
      toast.error('Please add at least one product to schedule');
    } else {
      const emptyIdx = formState.products.findIndex((p) => !p.product_name.trim());
      if (emptyIdx !== -1) {
        errors.products = `Please enter or select a Product Name for row ${emptyIdx + 1}`;
        toast.error(`Product Name is required for row ${emptyIdx + 1}`);
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save create
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const totalQty = formState.products.reduce((acc, p) => acc + (Number(p.schedule_qty) || 0), 0) || 1;
    const firstProductDate = formState.products[0]?.schedule_date || formState.Order_Date;

    const newSchedule: SalesSchedule = {
      id: Date.now(),
      Schedule_No: `SCH-2026-${String(schedules.length + 1).padStart(3, '0')}`,
      Order_No: formState.Sales_Order,
      CustomerName: formState.CustomerName,
      Customer_Order_No: formState.Customer_Order_No,
      Order_Date: formState.Order_Date,
      Scheduled_Date: firstProductDate,
      Dispatch_Location: 'Dock 4 - Hub North',
      Total_Quantity: totalQty,
      Status: 'Ready',
      Sales_Owner: formState.Sales_Owner || 'Sales Rep 1',
      Is_Schedule: formState.Is_Schedule,
      products: formState.products
    };

    upsertLocalItem('pegatto_schedules', newSchedule, ['id', 'Schedule_No']);
    setSchedules((prev) => [newSchedule, ...prev.filter(s => s.id !== newSchedule.id)]);
    setIsCreateOpen(false);
    toast.success(`Schedule ${newSchedule.Schedule_No} created successfully`);

    const matchedAccount = customerOptions.find(
      (c) => c.name.toLowerCase().trim() === formState.CustomerName.toLowerCase().trim()
    );
    const resolvedAccountId = matchedAccount?.id || (customerOptions.length > 0 ? customerOptions[0].id : 1);

    const foundSalesOrder = salesOrderOptions.find(
      (o) =>
        (o.Sales_OrderNo || o.Sales_Id || o.Po_Number || (o.id ? `SO-${o.id}` : '')).toLowerCase().trim() ===
        formState.Sales_Order.toLowerCase().trim()
    );
    const resolvedSalesId = foundSalesOrder?.id || (salesOrderOptions.length > 0 ? salesOrderOptions[0].id : 1);
    const currentUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : 1;

    try {
      await createScheduleAPI({
        id: newSchedule.id,
        Schedule_No: newSchedule.Schedule_No,
        Schedule_Id: newSchedule.Schedule_No,
        ShipmentScheduleNo: newSchedule.Schedule_No,
        Cutomer_OrderNo: formState.Customer_Order_No || formState.Sales_Order,
        Customer_Name: formState.CustomerName,
        CustomerName: formState.CustomerName,
        Order_Date: formState.Order_Date,
        Sales_Person: formState.Sales_Owner || 'Sales Rep 1',
        Shedule_Flag: formState.Is_Schedule,
        Account_Id: resolvedAccountId,
        AccountId: resolvedAccountId,
        Sales_Id: resolvedSalesId,
        Salesorderid: resolvedSalesId,
        SalesUser_Id: currentUserId,
        Shipment_Status: 'Shipment Not Created',
        SalesSchedule_Details: formState.products.map((p, idx) => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: Number(p.order_qty || 1),
          ScheduleQuantity: Number(p.schedule_qty || 1),
          ScheduleDate: p.schedule_date || firstProductDate,
          PendingQuantity: Number(p.pending_qty || 0),
          Reminderid: {},
          Track_id: idx + 1,
        })),
      } as any);
      loadSchedules();
    } catch (err) {
      console.warn('Backend schedule save notice (persisted locally):', err);
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule || !validateForm()) return;

    const totalQty = formState.products.reduce((acc, p) => acc + (Number(p.schedule_qty) || 0), 0) || 1;
    const firstProductDate = formState.products[0]?.schedule_date || formState.Order_Date;

    const updatedSchedule: SalesSchedule = {
      ...selectedSchedule,
      Order_No: formState.Sales_Order,
      CustomerName: formState.CustomerName,
      Customer_Order_No: formState.Customer_Order_No,
      Order_Date: formState.Order_Date,
      Scheduled_Date: firstProductDate,
      Total_Quantity: totalQty,
      Sales_Owner: formState.Sales_Owner,
      Is_Schedule: formState.Is_Schedule,
      products: formState.products
    };

    upsertLocalItem('pegatto_schedules', updatedSchedule, ['id', 'Schedule_No']);
    setSchedules((prev) =>
      prev.map((item) => (item.id === selectedSchedule.id ? updatedSchedule : item))
    );
    setIsEditOpen(false);
    toast.success(`Schedule ${selectedSchedule.Schedule_No} updated`);

    const matchedAccount = customerOptions.find(
      (c) => c.name.toLowerCase().trim() === formState.CustomerName.toLowerCase().trim()
    );
    const resolvedAccountId = matchedAccount?.id || (selectedSchedule as any).Account_Id || (customerOptions.length > 0 ? customerOptions[0].id : 1);

    const foundSalesOrder = salesOrderOptions.find(
      (o) =>
        (o.Sales_OrderNo || o.Sales_Id || o.Po_Number || (o.id ? `SO-${o.id}` : '')).toLowerCase().trim() ===
        formState.Sales_Order.toLowerCase().trim()
    );
    const resolvedSalesId = foundSalesOrder?.id || (selectedSchedule as any).Sales_Id || (salesOrderOptions.length > 0 ? salesOrderOptions[0].id : 1);
    const currentUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : 1;

    try {
      await updateScheduleAPI({
        id: selectedSchedule.id,
        Schedule_Id: selectedSchedule.Schedule_No,
        Cutomer_OrderNo: formState.Customer_Order_No || formState.Sales_Order,
        Customer_Name: formState.CustomerName,
        CustomerName: formState.CustomerName,
        Order_Date: formState.Order_Date,
        Sales_Person: formState.Sales_Owner || 'Sales Rep 1',
        Shedule_Flag: formState.Is_Schedule,
        Account_Id: resolvedAccountId,
        AccountId: resolvedAccountId,
        Sales_Id: resolvedSalesId,
        Salesorderid: resolvedSalesId,
        SalesUser_Id: currentUserId,
        Shipment_Status: 'Shipment Not Created',
        SalesSchedule_Details: formState.products.map((p, idx) => ({
          id: p.id,
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: Number(p.order_qty || 1),
          ScheduleQuantity: Number(p.schedule_qty || 1),
          ScheduleDate: p.schedule_date || firstProductDate,
          PendingQuantity: Number(p.pending_qty || 0),
          Reminderid: {},
          Track_id: idx + 1,
        })),
      } as any);
      loadSchedules();
    } catch (err) {
      console.warn('Backend schedule update notice (persisted locally):', err);
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedSchedule) return;
    deleteLocalItem('pegatto_schedules', selectedSchedule.id, ['id', 'Schedule_No']);
    setSchedules((prev) => prev.filter((item) => item.id !== selectedSchedule.id));
    setIsDeleteOpen(false);
    toast.success(`Schedule ${selectedSchedule.Schedule_No} deleted`);

    try {
      await deleteScheduleAPI(selectedSchedule.id);
      loadSchedules();
    } catch {
      // Backend error fallback
    }
  };

  // Confirm shipment conversion
  const handleConfirmShipmentConversion = async () => {
    if (!selectedSchedule) return;
    const shpNo = `SHP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const updatedSchedule = { ...selectedSchedule, Status: 'Shipped' as const };
    upsertLocalItem('pegatto_schedules', updatedSchedule, ['id', 'Schedule_No']);

    setSchedules((prev) =>
      prev.map((item) =>
        item.id === selectedSchedule.id ? updatedSchedule : item
      )
    );

    const newShipment: SalesShipment = {
      id: Date.now(),
      Shipment_No: shpNo,
      Schedule_No: selectedSchedule.Schedule_No,
      Order_No: selectedSchedule.Order_No,
      CustomerName: selectedSchedule.CustomerName,
      Transporter_Name: 'Express Logistics Corp',
      Tracking_No: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      Dispatch_Date: new Date().toISOString().split('T')[0],
      Expected_Delivery: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      Status: 'In Transit',
      Sales_Owner: selectedSchedule.Sales_Owner || 'Sales Rep 1',
      products: (selectedSchedule.products || []).map(p => ({
        id: p.id,
        product_name: p.product_name,
        product_id: p.product_id,
        uom: p.uom || 'Unit',
        order_qty: p.order_qty,
        schedule_qty: p.schedule_qty,
        shipment_qty: p.schedule_qty,
        pending_shipment_qty: 0
      }))
    };
    upsertLocalItem('pegatto_shipments', newShipment, ['id', 'Shipment_No']);

    setIsShipmentOpen(false);
    toast.success(`Shipment ${shpNo} generated for Schedule ${selectedSchedule.Schedule_No}`);

    try {
      await createShipmentAPI({
        Shipment_No: shpNo,
        Schedule_No: selectedSchedule.Schedule_No,
        Cutomer_OrderNo: selectedSchedule.Order_No,
        Customer_Name: selectedSchedule.CustomerName,
        Sales_Person: selectedSchedule.Sales_Owner || 'Sales Rep 1',
        Dispatch_Date: newShipment.Dispatch_Date,
        Expected_Delivery: newShipment.Expected_Delivery,
        Tracking_No: newShipment.Tracking_No,
        Transporter_Name: newShipment.Transporter_Name,
        Status: 'In Transit',
        Product_Details: (selectedSchedule.products || []).map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom || 'Unit',
          Order_Quantity: p.order_qty,
          Schedule_Quantity: p.schedule_qty,
          Shipment_Quantity: p.schedule_qty,
          PendingShipmentQuantity: 0
        }))
      } as any);
    } catch (e) {
      console.warn('Backend shipment sync notice (persisted locally):', e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Shipment Schedule List
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
              <span>( {filteredSchedules.length} ) Schedules</span>
            </button>

            {/* Filter Popover matching old retail ScheduleRightCard.js */}
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
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Schedule Id</label>
                      <input
                        type="text"
                        placeholder="Schedule Id"
                        value={filterForm.scheduleId}
                        onChange={(e) => setFilterForm({ ...filterForm, scheduleId: e.target.value })}
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
              onClick={() => loadSchedules()}
              disabled={isLoading}
              className="p-2 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh Schedules"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

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
                    <span>SCHEDULE ID</span>
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
                    <span>ORDER NO</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>ORDER DATE</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[160px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>LOCATION / DOCK</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center min-w-[100px]">
                  <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>QUANTITY</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>SALES OWNER</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[120px]">
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
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#2A7D5B]" />
                      <span>Loading schedules...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No schedules found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedSchedules.map((schedule) => {
                  const isShipped = schedule.Status === 'Shipped';

                  return (
                    <tr
                      key={schedule.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {schedule.Schedule_No}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {schedule.CustomerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {schedule.Order_No}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {schedule.Scheduled_Date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {schedule.Dispatch_Location || 'Main Warehouse'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                        {schedule.Total_Quantity}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {schedule.Sales_Owner || 'Sales Rep 1'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {schedule.Status}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Schedule Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                              Schedule Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => handleOpenEdit(schedule)}
                            >
                              <SquarePen className="h-4 w-4 text-slate-500" /> Edit Schedule
                            </DropdownMenuItem>

                            {!isShipped && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600"
                                onClick={() => handleOpenShipment(schedule)}
                              >
                                <Truck className="h-4 w-4 text-blue-600" /> Generate Shipment
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-2 py-1.5 rounded-lg"
                              onClick={() => handleOpenDelete(schedule)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" /> Delete Schedule
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

      {/* CREATE / EDIT SCHEDULE MODAL */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelClick();
          }
        }}
      >
        <DialogContent className="max-w-5xl p-6 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isCreateOpen ? 'Create Schedule' : 'Edit Schedule'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={isCreateOpen ? handleSaveCreate : handleSaveEdit} className="space-y-6 pt-2">
            {/* Top Form Fields matching screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs">
              {/* Left Column: Sales Order */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Sales Order <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formState.Sales_Order || ''}
                    onChange={(e) => handleSalesOrderSelect(e.target.value)}
                    className={`w-full appearance-none px-3 py-2 pr-8 text-xs rounded border ${
                      formErrors.Sales_Order ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] cursor-pointer`}
                  >
                    <option value="">Select Sales Order ID</option>
                    {salesOrderOptions.map((so) => {
                      const no = so.Sales_OrderNo || so.Sales_Id || so.Po_Number || (so.id ? `SO-${so.id}` : '');
                      const cust = so.Customer_Name || so.CustomerName || '';
                      return (
                        <option key={no} value={no}>
                          {no}{cust ? ` — ${cust}` : ''}
                        </option>
                      );
                    })}
                    {formState.Sales_Order && !salesOrderOptions.some((so) => (so.Sales_OrderNo || so.Sales_Id || so.Po_Number || (so.id ? `SO-${so.id}` : '')) === formState.Sales_Order) && (
                      <option value={formState.Sales_Order}>{formState.Sales_Order}</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  {formErrors.Sales_Order && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.Sales_Order}</p>
                  )}
                </div>
              </div>

              {/* Right Column: Customer Name */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter or select Customer Name"
                    list="schedule-customer-suggestions"
                    value={formState.CustomerName}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded border ${
                      formErrors.CustomerName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                  />
                  <datalist id="schedule-customer-suggestions">
                    {customerOptions.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </datalist>
                  {formErrors.CustomerName && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.CustomerName}</p>
                  )}
                </div>
              </div>

              {/* Left Column: Customer Order No */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Customer Order No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Customer Order No"
                  value={formState.Customer_Order_No}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Customer_Order_No: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              {/* Right Column: Order Date */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Order Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.Order_Date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Order_Date: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              {/* Left Column: Sales Owner */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Sales Owner <span className="text-red-500">*</span>
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

              {/* Right Column: Is Schedule Checkbox */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="isScheduleBox"
                  checked={formState.Is_Schedule}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Is_Schedule: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-[#2A7D5B] focus:ring-[#2A7D5B] cursor-pointer"
                />
                <label htmlFor="isScheduleBox" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  Is Schedule
                </label>
              </div>
            </div>

            {/* Products Table matching screenshot */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f8f9fa] dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[180px]">Product Name</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px]">Product Id</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[90px]">Uom</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[100px]">Order Qty</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px]">Schedule Qty</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[130px]">Schedule Date</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[120px]">Pending Quantity</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formState.products.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            {manualProductRows[index] ? (
                              <div className="relative w-full flex items-center">
                                <input
                                  type="text"
                                  placeholder="Type product name..."
                                  value={item.product_name}
                                  onChange={(e) => handleProductRowChange(index, 'product_name', e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 pr-7 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  title="Switch to catalog dropdown"
                                  onClick={() => setManualProductRows((prev) => ({ ...prev, [index]: false }))}
                                  className="absolute right-1.5 text-xs text-slate-400 hover:text-emerald-600 p-0.5 cursor-pointer"
                                >
                                  📋
                                </button>
                              </div>
                            ) : (
                              <div className="relative w-full flex items-center">
                                <select
                                  value={item.product_name}
                                  onChange={(e) => handleProductRowChange(index, 'product_name', e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 appearance-none pr-7 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                                >
                                  <option value="">Select or enter product</option>
                                  {masterProducts.map((prod) => (
                                    <option key={prod.id || prod.name} value={prod.name}>
                                      {prod.name} ({prod.id})
                                    </option>
                                  ))}
                                  <option value="__CUSTOM__">✏️ + Enter Custom Product...</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                              </div>
                            )}
                            <button
                              type="button"
                              title={manualProductRows[index] ? "Switch to Catalog List" : "Type Custom Product"}
                              onClick={() => {
                                setManualProductRows((prev) => ({ ...prev, [index]: !prev[index] }));
                              }}
                              className="text-[10px] px-1.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 shrink-0 border border-slate-200 dark:border-slate-700 cursor-pointer font-medium"
                            >
                              {manualProductRows[index] ? "Catalog" : "Custom"}
                            </button>
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Product Id"
                            value={item.product_id}
                            onChange={(e) => handleProductRowChange(index, 'product_id', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="UOM"
                            value={item.uom}
                            onChange={(e) => handleProductRowChange(index, 'uom', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            placeholder="Order Qty"
                            value={item.order_qty || ''}
                            onChange={(e) => handleProductRowChange(index, 'order_qty', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            placeholder="Schedule Qty"
                            value={item.schedule_qty || ''}
                            onChange={(e) => handleProductRowChange(index, 'schedule_qty', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="date"
                            value={item.schedule_date}
                            onChange={(e) => handleProductRowChange(index, 'schedule_date', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            placeholder="Pending Quantity"
                            value={item.pending_qty || 0}
                            readOnly
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-center">
                          {formState.products.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProductRow(index)}
                              className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-colors"
                              title="Remove Product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add product button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddProductRow}
                className="text-[#2A7D5B] hover:text-[#23674b] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Product Item
              </button>
            </div>

            {/* Bottom Divider & Centered Buttons matching screenshot */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="submit"
                  className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-6 py-2 rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>

                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-6 py-2 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONVERT TO SHIPMENT MODAL */}
      <Dialog open={isShipmentOpen} onOpenChange={setIsShipmentOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Generate Shipment
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 dark:text-slate-400 py-2">
            Are you sure you want to generate a Shipment for Schedule{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedSchedule?.Schedule_No}
            </span>{' '}
            for <span className="font-semibold">{selectedSchedule?.CustomerName}</span>?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsShipmentOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmShipmentConversion}
              className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Generate Shipment
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
            Are you sure you want to delete schedule{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedSchedule?.Schedule_No}
            </span>{' '}
            for <span className="font-semibold">{selectedSchedule?.CustomerName}</span>?
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
