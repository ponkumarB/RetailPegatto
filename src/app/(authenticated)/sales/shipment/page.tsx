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
  CheckCircle2,
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
  Check,
  Calendar as CalendarIcon
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
  SalesShipment,
  ShipmentDelivery,
  fetchShipmentsAPI,
  createShipmentAPI,
  updateShipmentAPI,
  deleteShipmentAPI,
  searchShipmentsAPI,
  filterShipmentsAPI,
  fetchAccountsLookupAPI,
  fetchProductsLookupAPI,
  fetchSchedulesAPI,
  createDeliveryAPI,
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

export interface ShipmentProductItem {
  id?: number | string;
  product_name: string;
  product_id: string;
  uom: string;
  order_qty: number;
  schedule_qty: number;
  shipment_qty: number;
  pending_shipment_qty: number;
}

const STORE_OPTIONS = [
  'Main Warehouse',
  'Central Facility',
  'Regional Hub',
  'Retail Store 1'
];

const MODE_OF_TRANSPORT_OPTIONS = [
  'Roadways',
  'Railways',
  'Air',
  'Sea'
];

const ITEMS_PER_PAGE = 10;

export default function ShipmentPage() {
  const router = useRouter();

  // Dynamic State with persistent localStorage cache
  const [shipments, setShipments] = useState<SalesShipment[]>(() => getLocalData<SalesShipment>('pegatto_shipments'));
  const [customerOptions, setCustomerOptions] = useState<{ id: number; name: string }[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<any[]>([]);
  const [masterProducts, setMasterProducts] = useState<{ name: string; id: string; uom: string }[]>([]);
  const [manualProductRows, setManualProductRows] = useState<{ [index: number]: boolean }>({});
  const [salesOwnerOptions, setSalesOwnerOptions] = useState<string[]>(DEFAULT_SALES_OWNERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Load lookups dynamically from API
  React.useEffect(() => {
    async function loadLookups() {
      try {
        const [accountsData, productsData, schedulesData, usersData] = await Promise.all([
          fetchAccountsLookupAPI().catch(() => []),
          fetchProductsLookupAPI().catch(() => []),
          fetchSchedulesAPI(1, false).catch(() => ({ results: [] })),
          fetchUsersList().catch(() => [])
        ]);
        const accs = (Array.isArray(accountsData) ? accountsData : (accountsData?.results || []))
          .map((a: any) => ({
            id: Number(a.id),
            name: String(a.Organization_Name || a.Company_Name || a.Account_Name || '').trim(),
          }))
          .filter((c: any) => Boolean(c.name));
        setCustomerOptions(accs);

        const prods = (Array.isArray(productsData) ? productsData : (productsData?.results || []))
          .map((p: any) => ({
            name: String(p.Product_Name || p.name || '').trim(),
            id: String(p.Product_Id || p.product_id || p.id || '').trim(),
            uom: String(p.Uom || p.uom || 'Unit').trim(),
          }))
          .filter((p: any) => Boolean(p.name));
        setMasterProducts(prods);

        const schList = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.results || schedulesData?.data || []);
        setScheduleOptions(schList);

        const rawUsers = Array.isArray(usersData)
          ? usersData
          : (Array.isArray(usersData?.results) ? usersData.results : (usersData?.data || []));
        const userNames = rawUsers
          .map((u: any) => String(u.username || u.Name || u.name || (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : '')).trim())
          .filter(Boolean);

        const existingOwners = [
          ...shipments.map((s) => s.Sales_Owner),
          ...schList.map((s: any) => s.Sales_Person || s.Sales_Owner)
        ].map((s) => String(s || '').trim()).filter(Boolean);

        const mergedOwners = Array.from(new Set([...DEFAULT_SALES_OWNERS, ...userNames, ...existingOwners]));
        setSalesOwnerOptions(mergedOwners);
      } catch (err) {
        console.error('Failed to load shipment lookups:', err);
      }
    }
    loadLookups();
  }, []);

  // Filter Popover State matching old retail MyShipmentRight.js
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterForm, setFilterForm] = useState({
    shipmentId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    shipmentId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadShipments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeFilters.shipmentId || activeFilters.customerName || activeFilters.fromDate || activeFilters.toDate) {
        const res = await filterShipmentsAPI({
          Shipment_Id: activeFilters.shipmentId || undefined,
          Customer_Name: activeFilters.customerName || undefined,
          fromdate: activeFilters.fromDate || undefined,
          todate: activeFilters.toDate || undefined,
        });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setShipments(list.map((item: any) => ({
            id: item.id,
            Shipment_No: item.Shipment_Id || item.Shipmentcode || item.Shipment_No || `SHP-${item.id}`,
            Schedule_No: item.ShipmentScheduleNo || item.Schedule_No || item.Schedule_Id || 'SCH-2026-001',
            Order_No: item.Cutomer_OrderNo || item.Order_No || item.OrderNo || '',
            Customer_PO_No: item.Cutomer_OrderNo || item.Customer_PO_No || item.Order_No || '',
            CustomerName: item.Customer_Name || item.CustomerName || '',
            Sales_Owner: item.Sales_Person || item.SalesPerson || item.Sales_Owner || 'Sales Rep 1',
            Store_Name: item.Store || item.Store_Name || 'Main Flagship Retail',
            Dispatch_Date: item.Shipment_Date?.split('T')[0] || item.Dispatch_Date || '',
            Expected_Delivery: item.Expected_Delivery?.split('T')[0] || item.Expected_Delivery || '',
            Tracking_No: item.Tracking_No || item.Track_id || '',
            Vehicle_No: item.Vehicle_No || item.VehicleNo || '',
            Delivery_From: item.Deliveryfrom || item.Delivery_From || 'Central Dock Bay 1',
            Delivery_To: item.Delivery_To || 'Customer Main Depot',
            Mode_Of_Transport: item.ModeOfTransport || item.Mode_Of_Transport || 'Road Transport',
            Transporter_Name: item.Transporter_Name || item.TransporterName || '',
            Remarks: item.Remarks || '',
            Status: item.Shipment_Status || item.Status || 'In Transit',
            products: Array.isArray(item.Product_Details) ? item.Product_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || 'Unit',
              order_qty: Number(p.Order_Quantity || 0),
              schedule_qty: Number(p.Schedule_Quantity || 0),
              shipment_qty: Number(p.Shipment_Quantity || p.This_Shipment_Quantity || 0),
              pending_shipment_qty: Number(p.PendingShipmentQuantity || 0),
            })) : [],
          })));
        }
      } else if (searchTerm.trim()) {
        const res = await searchShipmentsAPI(searchTerm.trim());
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setShipments(list.map((item: any) => ({
            id: item.id,
            Shipment_No: item.Shipment_Id || item.Shipmentcode || item.Shipment_No || `SHP-${item.id}`,
            Schedule_No: item.ShipmentScheduleNo || item.Schedule_No || item.Schedule_Id || 'SCH-2026-001',
            Order_No: item.Cutomer_OrderNo || item.Order_No || item.OrderNo || '',
            Customer_PO_No: item.Cutomer_OrderNo || item.Customer_PO_No || item.Order_No || '',
            CustomerName: item.Customer_Name || item.CustomerName || '',
            Sales_Owner: item.Sales_Person || item.SalesPerson || item.Sales_Owner || 'Sales Rep 1',
            Store_Name: item.Store || item.Store_Name || 'Main Flagship Retail',
            Dispatch_Date: item.Shipment_Date?.split('T')[0] || item.Dispatch_Date || '',
            Expected_Delivery: item.Expected_Delivery?.split('T')[0] || item.Expected_Delivery || '',
            Tracking_No: item.Tracking_No || item.Track_id || '',
            Vehicle_No: item.Vehicle_No || item.VehicleNo || '',
            Delivery_From: item.Deliveryfrom || item.Delivery_From || 'Central Dock Bay 1',
            Delivery_To: item.Delivery_To || 'Customer Main Depot',
            Mode_Of_Transport: item.ModeOfTransport || item.Mode_Of_Transport || 'Road Transport',
            Transporter_Name: item.Transporter_Name || item.TransporterName || '',
            Remarks: item.Remarks || '',
            Status: item.Shipment_Status || item.Status || 'In Transit',
            products: Array.isArray(item.Product_Details) ? item.Product_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || 'Unit',
              order_qty: Number(p.Order_Quantity || 0),
              schedule_qty: Number(p.Schedule_Quantity || 0),
              shipment_qty: Number(p.Shipment_Quantity || p.This_Shipment_Quantity || 0),
              pending_shipment_qty: Number(p.PendingShipmentQuantity || 0),
            })) : [],
          })));
        }
      } else {
        const res = await fetchShipmentsAPI(1);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedBackend = list.map((item: any) => ({
          id: item.id,
          Shipment_No: item.Shipment_Id || item.Shipmentcode || item.Shipment_No || `SHP-${item.id}`,
          Schedule_No: item.ShipmentScheduleNo || item.Schedule_No || item.Schedule_Id || 'SCH-2026-001',
          Order_No: item.Cutomer_OrderNo || item.Order_No || item.OrderNo || '',
          Customer_PO_No: item.Cutomer_OrderNo || item.Customer_PO_No || item.Order_No || '',
          CustomerName: item.Customer_Name || item.CustomerName || '',
          Sales_Owner: item.Sales_Person || item.SalesPerson || item.Sales_Owner || 'Sales Rep 1',
          Store_Name: item.Store || item.Store_Name || 'Main Flagship Retail',
          Dispatch_Date: item.Shipment_Date?.split('T')[0] || item.Dispatch_Date || '',
          Expected_Delivery: item.Expected_Delivery?.split('T')[0] || item.Expected_Delivery || '',
          Tracking_No: item.Tracking_No || item.Track_id || '',
          Vehicle_No: item.Vehicle_No || item.VehicleNo || '',
          Delivery_From: item.Deliveryfrom || item.Delivery_From || 'Central Dock Bay 1',
          Delivery_To: item.Delivery_To || 'Customer Main Depot',
          Mode_Of_Transport: item.ModeOfTransport || item.Mode_Of_Transport || 'Road Transport',
          Transporter_Name: item.Transporter_Name || item.TransporterName || '',
          Remarks: item.Remarks || '',
          Status: item.Shipment_Status || item.Status || 'In Transit',
          products: Array.isArray(item.Product_Details) ? item.Product_Details.map((p: any) => ({
            id: p.id,
            product_name: p.Product_Name || '',
            product_id: p.Product_Id || '',
            uom: p.UOM || 'Unit',
            order_qty: Number(p.Order_Quantity || 0),
            schedule_qty: Number(p.Schedule_Quantity || 0),
            shipment_qty: Number(p.Shipment_Quantity || p.This_Shipment_Quantity || 0),
            pending_shipment_qty: Number(p.PendingShipmentQuantity || 0),
          })) : [],
        }));
        const merged = mergeWithLocalData<SalesShipment>('pegatto_shipments', mappedBackend, ['id', 'Shipment_No']);
        setShipments(merged);
      }
    } catch {
      const local = getLocalData<SalesShipment>('pegatto_shipments');
      if (local.length > 0) setShipments(local);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, searchTerm]);

  React.useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);

  const [selectedShipment, setSelectedShipment] = useState<SalesShipment | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form State matching screenshot
  const [formState, setFormState] = useState<{
    Shipment_No?: string;
    Schedule_No: string;
    CustomerName: string;
    Sales_Owner: string;
    Customer_PO_No: string;
    Store_Name: string;
    Shipment_Date: string;
    Tracking_No: string;
    Delivery_From: string;
    Delivery_To: string;
    Mode_Of_Transport: string;
    Transporter_Name: string;
    Remarks: string;
    products: ShipmentProductItem[];
  }>({
    Schedule_No: '',
    CustomerName: '',
    Sales_Owner: '',
    Customer_PO_No: '',
    Store_Name: '',
    Shipment_Date: new Date().toISOString().split('T')[0],
    Tracking_No: '',
    Delivery_From: '',
    Delivery_To: '',
    Mode_Of_Transport: '',
    Transporter_Name: '',
    Remarks: '',
    products: [
      {
        id: 1,
        product_name: '',
        product_id: '',
        uom: '',
        order_qty: 0,
        schedule_qty: 0,
        shipment_qty: 0,
        pending_shipment_qty: 0
      }
    ]
  });

  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Check entered/modified fields
  const getModifiedFields = (): string[] => {
    const fields: string[] = [];

    if (isEditOpen && selectedShipment) {
      if (formState.CustomerName !== selectedShipment.CustomerName) fields.push(`Customer Name ("${formState.CustomerName}")`);
      if (formState.Schedule_No !== selectedShipment.Schedule_No) fields.push(`Schedule No ("${formState.Schedule_No}")`);
      if (formState.Sales_Owner !== (selectedShipment.Sales_Owner || '')) fields.push(`Sales Owner ("${formState.Sales_Owner}")`);
      if (formState.Customer_PO_No !== (selectedShipment.Customer_PO_No || '')) fields.push(`Customer PO No ("${formState.Customer_PO_No}")`);
      if (formState.Store_Name !== (selectedShipment.Store_Name || '')) fields.push(`Store Name ("${formState.Store_Name}")`);
      if (formState.Tracking_No !== (selectedShipment.Tracking_No || '')) fields.push(`Tracking No ("${formState.Tracking_No}")`);
      if (formState.Delivery_From !== (selectedShipment.Delivery_From || '')) fields.push(`Delivery From ("${formState.Delivery_From}")`);
      if (formState.Delivery_To !== (selectedShipment.Delivery_To || '')) fields.push(`Delivery To ("${formState.Delivery_To}")`);
      if (formState.Mode_Of_Transport !== (selectedShipment.Mode_Of_Transport || '')) fields.push(`Mode Of Transport ("${formState.Mode_Of_Transport}")`);
      if (formState.Transporter_Name !== (selectedShipment.Transporter_Name || '')) fields.push(`Transporter Name ("${formState.Transporter_Name}")`);
      if (formState.Remarks !== (selectedShipment.Remarks || '')) fields.push(`Remarks ("${formState.Remarks}")`);
      return fields;
    }

    // In Create mode:
    if (formState.Schedule_No?.trim()) fields.push(`Schedule No ("${formState.Schedule_No.trim()}")`);
    if (formState.CustomerName?.trim()) fields.push(`Customer Name ("${formState.CustomerName.trim()}")`);
    if (formState.Sales_Owner?.trim()) fields.push(`Sales Owner ("${formState.Sales_Owner.trim()}")`);
    if (formState.Customer_PO_No?.trim()) fields.push(`Customer PO No ("${formState.Customer_PO_No.trim()}")`);
    if (formState.Store_Name?.trim()) fields.push(`Store Name ("${formState.Store_Name.trim()}")`);
    if (formState.Tracking_No?.trim()) fields.push(`Tracking No ("${formState.Tracking_No.trim()}")`);
    if (formState.Delivery_From?.trim()) fields.push(`Delivery From ("${formState.Delivery_From.trim()}")`);
    if (formState.Delivery_To?.trim()) fields.push(`Delivery To ("${formState.Delivery_To.trim()}")`);
    if (formState.Mode_Of_Transport?.trim()) fields.push(`Mode Of Transport ("${formState.Mode_Of_Transport.trim()}")`);
    if (formState.Transporter_Name?.trim()) fields.push(`Transporter Name ("${formState.Transporter_Name.trim()}")`);
    if (formState.Remarks?.trim()) fields.push(`Remarks ("${formState.Remarks.trim()}")`);

    const modifiedProducts = formState.products.filter(
      (p) => p.product_name || p.shipment_qty > 0 || p.schedule_qty > 0 || p.order_qty > 0
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
    setSelectedShipment(null);
  };

  // Auto-populate when selecting a schedule
  const handleScheduleSelect = (scheduleNo: string) => {
    const trimmedNo = (scheduleNo || '').trim().toLowerCase();
    const found = scheduleOptions.find(
      (s: any) =>
        String(s.ShipmentScheduleNo || s.Shipment_Schedule_No || s.Schedule_No || s.Schedule_Id || `SCH-${s.id}`)
          .toLowerCase()
          .trim() === trimmedNo
    );

    if (found) {
      const details = Array.isArray(found.SalesSchedule_Details)
        ? found.SalesSchedule_Details
        : (Array.isArray(found.Schedule_Details) ? found.Schedule_Details : (found.products || []));

      const mapped = details.map((p: any, idx: number) => ({
        id: Date.now() + idx,
        product_name: p.Product_Name || p.product_name || p.name || '',
        product_id: p.Product_Id || p.product_id || p.id || '',
        uom: p.UOM || p.uom || 'Unit',
        order_qty: Number(p.Quantity || p.Order_Qty || p.order_qty || 1),
        schedule_qty: Number(p.ScheduleQuantity || p.Schedule_Qty || p.schedule_qty || p.Quantity || 1),
        shipment_qty: Number(p.ScheduleQuantity || p.Schedule_Qty || p.schedule_qty || p.Quantity || 1),
        pending_shipment_qty: Number(p.PendingQuantity || p.Pending_Qty || 0)
      })).filter((p: any) => Boolean(p.product_name));

      const custName = found.Customer_Name || found.CustomerName || found.Sales_Id?.Customer_Name || '';
      const orderNo = found.Customer_Order_No || found.Cutomer_OrderNo || found.Order_No || found.Sales_Id?.Po_Number || '';
      const salesOwner = found.Sales_Person || found.Sales_Owner || found.Sales_Id?.Sales_Person || '';

      setFormState((prev) => ({
        ...prev,
        Schedule_No: scheduleNo,
        CustomerName: custName || prev.CustomerName,
        Customer_PO_No: orderNo || prev.Customer_PO_No,
        Sales_Owner: salesOwner || prev.Sales_Owner,
        Store_Name: prev.Store_Name || 'Main Flagship Retail',
        Delivery_From: found.Dispatch_Location || prev.Delivery_From,
        Delivery_To: prev.Delivery_To,
        Mode_Of_Transport: prev.Mode_Of_Transport || 'Road Transport',
        Transporter_Name: prev.Transporter_Name || 'BlueDart Logistics Express',
        Tracking_No: prev.Tracking_No,
        products: mapped.length > 0 ? mapped : prev.products
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        Schedule_No: scheduleNo
      }));
    }
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.Schedule_No;
      return copy;
    });
  };

  const handleCustomerSelect = (custName: string) => {
    const trimmedCust = (custName || '').trim();
    const found = scheduleOptions.find((s) => (s.Customer_Name || s.CustomerName || '').toLowerCase().trim() === trimmedCust.toLowerCase());
    if (found) {
      const details = Array.isArray(found.Schedule_Details) ? found.Schedule_Details : (found.products || []);
      const mapped = details.map((p: any, idx: number) => ({
        id: Date.now() + idx,
        product_name: p.Product_Name || p.product_name || p.name || '',
        product_id: p.Product_Id || p.product_id || p.id || '',
        uom: p.UOM || p.uom || 'Unit',
        order_qty: Number(p.Order_Qty || p.order_qty || p.Quantity || p.quantity || 1),
        schedule_qty: Number(p.Schedule_Qty || p.schedule_qty || p.Quantity || p.quantity || 1),
        shipment_qty: Number(p.Schedule_Qty || p.schedule_qty || p.Quantity || p.quantity || 1),
        pending_shipment_qty: 0
      }));

      setFormState((prev) => ({
        ...prev,
        CustomerName: custName,
        Schedule_No: found.Schedule_No || found.Schedule_Id || `SCH-${found.id}`,
        Customer_PO_No: found.Customer_Order_No || found.Cutomer_OrderNo || found.Order_No || prev.Customer_PO_No,
        Sales_Owner: found.Sales_Person || found.Sales_Owner || prev.Sales_Owner,
        Store_Name: prev.Store_Name || 'Main Flagship Retail',
        Delivery_From: found.Dispatch_Location || prev.Delivery_From,
        Delivery_To: prev.Delivery_To,
        Mode_Of_Transport: prev.Mode_Of_Transport || 'Road Transport',
        Transporter_Name: prev.Transporter_Name || 'BlueDart Logistics Express',
        Tracking_No: prev.Tracking_No,
        products: mapped.length > 0 ? mapped : prev.products
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        CustomerName: custName,
        Customer_PO_No: `PO-${custName.slice(0, 3).toUpperCase()}-001`,
        Sales_Owner: prev.Sales_Owner || 'Sales Rep 1',
        Store_Name: prev.Store_Name || 'Main Flagship Retail'
      }));
    }
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.CustomerName;
      delete copy.Schedule_No;
      return copy;
    });
  };

  // Product row field change
  const handleProductRowChange = (index: number, field: keyof ShipmentProductItem, value: any) => {
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
        const trimmed = String(value || '').toLowerCase().trim();
        const prod = masterProducts.find(
          (p: any) =>
            String(p.name || p.product_name || '').toLowerCase().trim() === trimmed ||
            String(p.id || p.product_id || '').toLowerCase().trim() === trimmed
        );
        if (prod) {
          item.product_id = (prod as any).id || (prod as any).product_id || '';
          item.uom = (prod as any).uom || (prod as any).UOM || 'Unit';
        } else if (value && !item.product_id) {
          item.product_id = `PRD-${String(Date.now()).slice(-4)}`;
        }
      }
      if (field === 'schedule_qty' || field === 'shipment_qty') {
        const schQty = field === 'schedule_qty' ? Number(value) || 0 : Number(item.schedule_qty || 0);
        const shpQty = field === 'shipment_qty' ? Number(value) || 0 : Number(item.shipment_qty || 0);
        item.pending_shipment_qty = Math.max(0, schQty - shpQty);
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
          shipment_qty: 0,
          pending_shipment_qty: 0
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

  // Filtered shipments
  const filteredShipments = useMemo(() => {
    return shipments.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.Shipment_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Order_No || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Transporter_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Tracking_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Status.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Popover filters
      if (activeFilters.shipmentId && !item.Shipment_No.toLowerCase().includes(activeFilters.shipmentId.toLowerCase())) {
        return false;
      }
      if (activeFilters.customerName && !item.CustomerName.toLowerCase().includes(activeFilters.customerName.toLowerCase())) {
        return false;
      }
      if (activeFilters.fromDate) {
        const itemDate = new Date(item.Dispatch_Date);
        const fromD = new Date(activeFilters.fromDate);
        if (itemDate < fromD) return false;
      }
      if (activeFilters.toDate) {
        const itemDate = new Date(item.Dispatch_Date);
        const toD = new Date(activeFilters.toDate);
        if (itemDate > toD) return false;
      }

      return true;
    });
  }, [shipments, searchTerm, activeFilters]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedShipments = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredShipments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredShipments, safeCurrentPage]);

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
    const empty = { shipmentId: '', customerName: '', fromDate: '', toDate: '' };
    setFilterForm(empty);
    setActiveFilters(empty);
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    const nextSeq = shipments.length + 1;
    setFormErrors({});
    setFormState({
      Shipment_No: `SHP-2026-${String(nextSeq).padStart(3, '0')}`,
      Schedule_No: '',
      CustomerName: '',
      Sales_Owner: '',
      Customer_PO_No: '',
      Store_Name: '',
      Shipment_Date: new Date().toISOString().split('T')[0],
      Tracking_No: '',
      Delivery_From: '',
      Delivery_To: '',
      Mode_Of_Transport: '',
      Transporter_Name: '',
      Remarks: '',
      products: [
        {
          id: 1,
          product_name: '',
          product_id: '',
          uom: '',
          order_qty: 0,
          schedule_qty: 0,
          shipment_qty: 0,
          pending_shipment_qty: 0
        }
      ]
    });
    setManualProductRows({});
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (shipment: SalesShipment) => {
    setSelectedShipment(shipment);
    setFormErrors({});
    setFormState({
      Shipment_No: shipment.Shipment_No,
      Schedule_No: shipment.Schedule_No,
      CustomerName: shipment.CustomerName,
      Sales_Owner: shipment.Sales_Owner || 'Sales Rep 1',
      Customer_PO_No: shipment.Customer_PO_No || shipment.Order_No || 'PO-2026-001',
      Store_Name: shipment.Store_Name || 'Main Flagship Retail',
      Shipment_Date: shipment.Dispatch_Date,
      Tracking_No: shipment.Tracking_No,
      Delivery_From: shipment.Delivery_From || 'Central Dock Bay 1',
      Delivery_To: shipment.Delivery_To || 'Customer Main Depot',
      Mode_Of_Transport: shipment.Mode_Of_Transport || 'Road Transport',
      Transporter_Name: shipment.Transporter_Name,
      Remarks: shipment.Remarks || '',
      products: shipment.products && shipment.products.length > 0
        ? shipment.products.map((p: any, idx: number) => ({
            id: p.id || idx + 1,
            product_name: p.product_name || '',
            product_id: p.product_id || '',
            uom: p.uom || 'Unit',
            order_qty: p.order_qty || 1,
            schedule_qty: p.schedule_qty || 1,
            shipment_qty: p.shipment_qty || 1,
            pending_shipment_qty: p.pending_shipment_qty || 0
          }))
        : [
            {
              id: 1,
              product_name: '10" Android POS Tablet',
              product_id: 'PRD-TAB-05',
              uom: 'Unit',
              order_qty: 5,
              schedule_qty: 5,
              shipment_qty: 5,
              pending_shipment_qty: 0
            }
          ]
    });
    const manualMap: { [index: number]: boolean } = {};
    (shipment.products || []).forEach((p: any, idx: number) => {
      if (p.product_name && !masterProducts.some((mp: any) => String(mp.name || mp.product_name || '').toLowerCase().trim() === String(p.product_name).toLowerCase().trim())) {
        manualMap[idx] = true;
      }
    });
    setManualProductRows(manualMap);
    setIsEditOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (shipment: SalesShipment) => {
    setSelectedShipment(shipment);
    setIsDeleteOpen(true);
  };

  // Open Delivery Dialog
  const handleOpenDelivery = (shipment: SalesShipment) => {
    setSelectedShipment(shipment);
    setIsDeliveryOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formState.Schedule_No.trim()) {
      errors.Schedule_No = 'Schedule No is required';
    }
    if (!formState.CustomerName.trim()) {
      errors.CustomerName = 'Customer Name is required';
    }
    const hasValidProduct = formState.products.some((p) => p.product_name && p.product_name.trim());
    if (!hasValidProduct) {
      toast.error('Please select or enter at least one product with valid quantity');
      return false;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save create
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newShipment: SalesShipment = {
      id: Date.now(),
      Shipment_No: formState.Shipment_No || `SHP-2026-${String(shipments.length + 1).padStart(3, '0')}`,
      Schedule_No: formState.Schedule_No,
      CustomerName: formState.CustomerName,
      Order_No: formState.Customer_PO_No,
      Customer_PO_No: formState.Customer_PO_No,
      Sales_Owner: formState.Sales_Owner,
      Store_Name: formState.Store_Name,
      Dispatch_Date: formState.Shipment_Date,
      Expected_Delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Tracking_No: formState.Tracking_No,
      Delivery_From: formState.Delivery_From,
      Delivery_To: formState.Delivery_To,
      Mode_Of_Transport: formState.Mode_Of_Transport,
      Transporter_Name: formState.Transporter_Name,
      Remarks: formState.Remarks,
      Status: 'In Transit',
      products: formState.products
    };

    upsertLocalItem('pegatto_shipments', newShipment, ['id', 'Shipment_No']);
    setShipments((prev) => [newShipment, ...prev.filter(s => s.id !== newShipment.id)]);
    setIsCreateOpen(false);
    toast.success(`Shipment ${newShipment.Shipment_No} created successfully`);

    try {
      const trimmedNo = formState.Schedule_No.trim().toLowerCase();
      const matchSch = scheduleOptions.find((s: any) =>
        String(s.ShipmentScheduleNo || s.Shipment_Schedule_No || s.Schedule_No || s.Schedule_Id || `SCH-${s.id}`)
          .toLowerCase()
          .trim() === trimmedNo
      );
      const matchCust = customerOptions.find((c) => c.name.toLowerCase() === formState.CustomerName.toLowerCase());

      const parsedAccountId = Number(matchCust?.id || matchSch?.Account_Id?.id || matchSch?.Account_Id || 1) || 1;
      const parsedSalesId = Number(matchSch?.Sales_Id?.id || matchSch?.Sales_Id || matchSch?.Sales_Order_Id || 1) || 1;
      const parsedScheduleId = Number(matchSch?.id || matchSch?.Schedule_Id || 1) || 1;

      await createShipmentAPI({
        id: newShipment.id,
        Shipment_No: newShipment.Shipment_No,
        Shipment_Id: newShipment.Shipment_No,
        ShipmentScheduleNo: formState.Schedule_No,
        Schedule_No: formState.Schedule_No,
        Customer_Name: formState.CustomerName,
        CustomerName: formState.CustomerName,
        Cutomer_OrderNo: formState.Customer_PO_No,
        Order_No: formState.Customer_PO_No,
        Sales_Person: formState.Sales_Owner,
        Store: formState.Store_Name,
        Store_Name: formState.Store_Name,
        Shipment_Date: formState.Shipment_Date,
        Tracking_No: formState.Tracking_No,
        Deliveryfrom: formState.Delivery_From,
        Delivery_To: formState.Delivery_To,
        ModeOfTransport: formState.Mode_Of_Transport,
        Transporter_Name: formState.Transporter_Name,
        Remarks: formState.Remarks,
        Account_Id: parsedAccountId,
        Sales_Id: parsedSalesId,
        Schedule_Id: parsedScheduleId,
        Product_Details: formState.products.map((p) => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Order_Quantity: p.order_qty,
          Schedule_Quantity: p.schedule_qty,
          Shipment_Quantity: p.shipment_qty,
          PendingShipmentQuantity: p.pending_shipment_qty,
        })),
      } as any);
      loadShipments();
    } catch {
      // Backend error fallback
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !validateForm()) return;

    const updatedShipment: SalesShipment = {
      ...selectedShipment,
      Schedule_No: formState.Schedule_No,
      CustomerName: formState.CustomerName,
      Order_No: formState.Customer_PO_No,
      Customer_PO_No: formState.Customer_PO_No,
      Sales_Owner: formState.Sales_Owner,
      Store_Name: formState.Store_Name,
      Dispatch_Date: formState.Shipment_Date,
      Tracking_No: formState.Tracking_No,
      Delivery_From: formState.Delivery_From,
      Delivery_To: formState.Delivery_To,
      Mode_Of_Transport: formState.Mode_Of_Transport,
      Transporter_Name: formState.Transporter_Name,
      Remarks: formState.Remarks,
      products: formState.products
    };

    upsertLocalItem('pegatto_shipments', updatedShipment, ['id', 'Shipment_No']);
    setShipments((prev) =>
      prev.map((item) => (item.id === selectedShipment.id ? updatedShipment : item))
    );
    setIsEditOpen(false);
    toast.success(`Shipment ${selectedShipment.Shipment_No} updated`);

    try {
      const trimmedNo = formState.Schedule_No.trim().toLowerCase();
      const matchSch = scheduleOptions.find((s: any) =>
        String(s.ShipmentScheduleNo || s.Shipment_Schedule_No || s.Schedule_No || s.Schedule_Id || `SCH-${s.id}`)
          .toLowerCase()
          .trim() === trimmedNo
      );
      const matchCust = customerOptions.find((c) => c.name.toLowerCase() === formState.CustomerName.toLowerCase());

      const parsedAccountId = Number(matchCust?.id || matchSch?.Account_Id?.id || matchSch?.Account_Id || 1) || 1;
      const parsedSalesId = Number(matchSch?.Sales_Id?.id || matchSch?.Sales_Id || matchSch?.Sales_Order_Id || 1) || 1;
      const parsedScheduleId = Number(matchSch?.id || matchSch?.Schedule_Id || 1) || 1;

      await updateShipmentAPI({
        id: selectedShipment.id,
        Shipment_Id: selectedShipment.Shipment_No,
        ShipmentScheduleNo: formState.Schedule_No,
        Schedule_No: formState.Schedule_No,
        Customer_Name: formState.CustomerName,
        CustomerName: formState.CustomerName,
        Cutomer_OrderNo: formState.Customer_PO_No,
        Order_No: formState.Customer_PO_No,
        Sales_Person: formState.Sales_Owner,
        Store: formState.Store_Name,
        Store_Name: formState.Store_Name,
        Shipment_Date: formState.Shipment_Date,
        Tracking_No: formState.Tracking_No,
        Deliveryfrom: formState.Delivery_From,
        Delivery_To: formState.Delivery_To,
        ModeOfTransport: formState.Mode_Of_Transport,
        Transporter_Name: formState.Transporter_Name,
        Remarks: formState.Remarks,
        Account_Id: parsedAccountId,
        Sales_Id: parsedSalesId,
        Schedule_Id: parsedScheduleId,
        Product_Details: formState.products.map((p) => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Order_Quantity: p.order_qty,
          Schedule_Quantity: p.schedule_qty,
          Shipment_Quantity: p.shipment_qty,
          PendingShipmentQuantity: p.pending_shipment_qty,
        })),
      } as any);
      loadShipments();
    } catch {
      // Backend error fallback
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedShipment) return;
    deleteLocalItem('pegatto_shipments', selectedShipment.id, ['id', 'Shipment_No']);
    setShipments((prev) => prev.filter((item) => item.id !== selectedShipment.id));
    setIsDeleteOpen(false);
    toast.success(`Shipment ${selectedShipment.Shipment_No} deleted`);

    try {
      await deleteShipmentAPI(selectedShipment.id);
      loadShipments();
    } catch {
      // Backend error fallback
    }
  };

  // Confirm delivery
  const handleConfirmDelivery = async () => {
    if (!selectedShipment) return;
    const updatedShipment = { ...selectedShipment, Status: 'Delivered' as const };
    upsertLocalItem('pegatto_shipments', updatedShipment, ['id', 'Shipment_No']);

    setShipments((prev) =>
      prev.map((item) =>
        item.id === selectedShipment.id ? updatedShipment : item
      )
    );

    const newDelivery: ShipmentDelivery = {
      id: Date.now(),
      Delivery_Id: `POD-${Date.now().toString().slice(-6)}`,
      Shipment_No: selectedShipment.Shipment_No,
      Transporter_Name: selectedShipment.Transporter_Name || 'Express Logistics Corp',
      Tracking_No: selectedShipment.Tracking_No || '',
      Dateof_Shipment: selectedShipment.Dispatch_Date,
      Delivery_Date: new Date().toISOString().split('T')[0],
      Receiver_Name: selectedShipment.CustomerName || 'Store Incharge',
      Status: 'Confirmed',
      Remarks: 'Delivered successfully from shipment dispatch'
    };
    upsertLocalItem('pegatto_deliveries', newDelivery, ['id', 'Delivery_Id']);

    setIsDeliveryOpen(false);
    toast.success(`Shipment ${selectedShipment.Shipment_No} marked as Delivered`);

    try {
      await createDeliveryAPI({
        Shipment_No: selectedShipment.Shipment_No,
        Transporter_Name: selectedShipment.Transporter_Name || 'Express Logistics Corp',
        Tracking_No: selectedShipment.Tracking_No || '',
        Dateof_Shipment: selectedShipment.Dispatch_Date,
        Delivery_Date: newDelivery.Delivery_Date,
        Receiver_Name: newDelivery.Receiver_Name,
        Status: 'Confirmed',
        Remarks: 'Delivered successfully'
      } as any);
    } catch (e) {
      console.warn('Backend delivery sync notice (persisted locally):', e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Shipment List
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
              <span>( {filteredShipments.length} ) Shipments</span>
            </button>

            {/* Filter Popover matching old retail MyShipmentRight.js */}
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
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Shipment Id</label>
                      <input
                        type="text"
                        placeholder="Shipment Id"
                        value={filterForm.shipmentId}
                        onChange={(e) => setFilterForm({ ...filterForm, shipmentId: e.target.value })}
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
              onClick={() => loadShipments()}
              disabled={isLoading}
              className="p-2 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh Shipments"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => router.push('/sales/shipment-calendar')}
              className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold px-3 py-2 rounded-md shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Calendar View"
            >
              <CalendarIcon className="h-4 w-4 text-[#2A7D5B]" />
              Calendar View
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
                    <span>SHIPMENT ID</span>
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
                    <span>SCHEDULE NO</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[160px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>TRANSPORTER NAME</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>TRACKING NO</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>DISPATCH DATE</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
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
                      <span>Loading shipments...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedShipments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No shipments found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedShipments.map((shipment) => {
                  const isDelivered = shipment.Status === 'Delivered';

                  return (
                    <tr
                      key={shipment.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {shipment.Shipment_No}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {shipment.CustomerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {shipment.Order_No}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {shipment.Schedule_No}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {shipment.Transporter_Name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {shipment.Tracking_No}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {shipment.Dispatch_Date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {shipment.Status}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Shipment Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                              Shipment Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => handleOpenEdit(shipment)}
                            >
                              <SquarePen className="h-4 w-4 text-slate-500" /> Edit Shipment
                            </DropdownMenuItem>

                            {!isDelivered && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600"
                                onClick={() => handleOpenDelivery(shipment)}
                              >
                                <CheckCircle2 className="h-4 w-4 text-blue-600" /> Confirm Delivery
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-2 py-1.5 rounded-lg"
                              onClick={() => handleOpenDelete(shipment)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" /> Delete Shipment
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

      {/* CREATE / EDIT SHIPMENT MODAL */}
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
              {isCreateOpen ? 'Create Shipment' : 'Edit Shipment'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={isCreateOpen ? handleSaveCreate : handleSaveEdit} className="space-y-6 pt-2">
            {/* Top Form Fields matching screenshot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs">
              {/* Row 1 Left: Schedule No */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Schedule No <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formState.Schedule_No || ''}
                    onChange={(e) => handleScheduleSelect(e.target.value)}
                    className={`w-full appearance-none px-3 py-2 pr-8 text-xs rounded border ${
                      formErrors.Schedule_No ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] cursor-pointer`}
                  >
                    <option value="">Select Schedule No</option>
                    {scheduleOptions.map((sch) => {
                      const no = sch.Schedule_No || sch.Schedule_Id || (sch.id ? `SCH-${sch.id}` : '');
                      const cust = sch.Customer_Name || sch.CustomerName || '';
                      return (
                        <option key={no} value={no}>
                          {no}{cust ? ` — ${cust}` : ''}
                        </option>
                      );
                    })}
                    {formState.Schedule_No && !scheduleOptions.some((sch) => (sch.Schedule_No || sch.Schedule_Id || (sch.id ? `SCH-${sch.id}` : '')) === formState.Schedule_No) && (
                      <option value={formState.Schedule_No}>{formState.Schedule_No}</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  {formErrors.Schedule_No && (
                    <p className="text-[11px] text-red-500 mt-1">{formErrors.Schedule_No}</p>
                  )}
                </div>
              </div>

              {/* Row 1 Right: Customer Name */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter or select Customer Name"
                    list="shipment-customer-suggestions"
                    value={formState.CustomerName}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded border ${
                      formErrors.CustomerName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                  />
                  <datalist id="shipment-customer-suggestions">
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

              {/* Row 2 Left: Sales Owner */}
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

              {/* Row 2 Right: Customer PO No */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Customer PO No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Order No"
                  value={formState.Customer_PO_No}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Customer_PO_No: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              {/* Row 3 Left: Store Name */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formState.Store_Name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, Store_Name: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                  >
                    <option value="">Select Store Name</option>
                    {STORE_OPTIONS.map((store) => (
                      <option key={store} value={store}>
                        {store}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Row 3 Right: Shipment Date */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Shipment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.Shipment_Date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Shipment_Date: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              {/* Row 4 Left: Tracking No */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Tracking No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Tracking No"
                  value={formState.Tracking_No}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Tracking_No: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              {/* Row 4 Right: Delivery From */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Delivery From <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Delivery From"
                  value={formState.Delivery_From}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Delivery_From: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              {/* Row 5 Left: Delivery To */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Delivery To <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Delivery To"
                  value={formState.Delivery_To}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Delivery_To: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              {/* Row 5 Right: Mode Of Transport */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Mode Of Transport <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formState.Mode_Of_Transport}
                    onChange={(e) => setFormState((prev) => ({ ...prev, Mode_Of_Transport: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                  >
                    <option value="">Select Mode Of Transport</option>
                    {MODE_OF_TRANSPORT_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Row 6 Left: Transporter Name */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Transporter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Transporter Name"
                  value={formState.Transporter_Name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Transporter_Name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>
            </div>

            {/* Full-width Remarks */}
            <div className="grid grid-cols-[140px_1fr] items-start gap-2 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-200 pt-2">
                Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Remarks"
                value={formState.Remarks}
                onChange={(e) => setFormState((prev) => ({ ...prev, Remarks: e.target.value }))}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] resize-none"
              />
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
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[110px]">Shipment Qty</th>
                      <th className="py-2.5 px-3 whitespace-nowrap min-w-[140px]">Pending Shipment Qty</th>
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
                                  {masterProducts.map((prod: any) => {
                                    const pName = prod.name || prod.product_name;
                                    const pId = prod.id || prod.product_id || '';
                                    return (
                                      <option key={pId || pName} value={pName}>
                                        {pName} {pId ? `(${pId})` : ''}
                                      </option>
                                    );
                                  })}
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
                            type="number"
                            min={0}
                            placeholder="0"
                            value={item.shipment_qty}
                            onChange={(e) => handleProductRowChange(index, 'shipment_qty', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            placeholder="0"
                            value={item.pending_shipment_qty}
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

      {/* CONFIRM DELIVERY MODAL */}
      <Dialog open={isDeliveryOpen} onOpenChange={setIsDeliveryOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Confirm Delivery
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 dark:text-slate-400 py-2">
            Are you sure you want to mark Shipment{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedShipment?.Shipment_No}
            </span>{' '}
            for <span className="font-semibold">{selectedShipment?.CustomerName}</span> as Delivered?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsDeliveryOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelivery}
              className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Confirm Delivered
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
            Are you sure you want to delete shipment{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedShipment?.Shipment_No}
            </span>{' '}
            for <span className="font-semibold">{selectedShipment?.CustomerName}</span>?
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
