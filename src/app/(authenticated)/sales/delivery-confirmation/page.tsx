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
  FileCheck,
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
  ShipmentDelivery,
  fetchDeliveriesAPI,
  createDeliveryAPI,
  updateDeliveryAPI,
  deleteDeliveryAPI,
  searchDeliveriesAPI,
  filterDeliveriesAPI,
  fetchShipmentsAPI
} from '@/service/api/sales/api';
import { fetchFromApi } from '@/service/apiClient';
import { getLocalData, upsertLocalItem, deleteLocalItem, mergeWithLocalData } from '@/utils/persistentStorage';

const TRANSPORTER_OPTIONS = [
  'BlueDart Logistics Express',
  'Safexpress Freight',
  'VRL Logistics Surface',
  'DTDC Prime Cargo',
  'Delhivery Corporate'
];

const STATUS_OPTIONS = [
  'Shipped',
  'In Transit',
  'Delivered'
];

const ITEMS_PER_PAGE = 10;

export default function DeliveryConfirmationPage() {
  const router = useRouter();

  // State with persistent localStorage cache
  const [deliveries, setDeliveries] = useState<ShipmentDelivery[]>(() => getLocalData<ShipmentDelivery>('pegatto_deliveries'));
  const [shipmentOptions, setShipmentOptions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter Popover State matching old retail ShipmentDeliveryList.js
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterForm, setFilterForm] = useState({
    deliveryId: '',
    transporterName: '',
    fromDate: '',
    toDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    deliveryId: '',
    transporterName: '',
    fromDate: '',
    toDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadDeliveries = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeFilters.deliveryId || activeFilters.transporterName || activeFilters.fromDate || activeFilters.toDate) {
        const res = await filterDeliveriesAPI({
          Sales_ShipmentNo: activeFilters.deliveryId || undefined,
          Transporter_Name: activeFilters.transporterName || undefined,
          fromdate: activeFilters.fromDate || undefined,
          todate: activeFilters.toDate || undefined,
        });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setDeliveries(list.map((item: any) => ({
            id: item.id,
            Delivery_Id: item.Delivery_Id || `POD-${item.id}`,
            Shipment_No: item.SalesShipment_Id?.Shipment_Id || item.Sales_ShipmentNo || item.Shipment_No || 'SHP-2026-001',
            Transporter_Name: item.Transporter_Name || item.TransporterName || '',
            Tracking_No: item.Tracking_No || item.Track_id || '',
            Dateof_Shipment: item.Dateof_Shipment?.split('T')[0] || item.Date_Of_Shipment || '',
            Delivery_Date: item.Delivery_Date?.split('T')[0] || item.Delivery_Date || '',
            Receiver_Name: item.Receiver_Name || item.Contact_Person || 'Receiver',
            Receiver_Phone: item.Receiver_Phone || '',
            Status: item.Status || 'Confirmed',
            Remarks: item.Remarks || '',
          })));
        }
      } else if (searchTerm.trim()) {
        const res = await searchDeliveriesAPI(searchTerm.trim());
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setDeliveries(list.map((item: any) => ({
            id: item.id,
            Delivery_Id: item.Delivery_Id || `POD-${item.id}`,
            Shipment_No: item.SalesShipment_Id?.Shipment_Id || item.Sales_ShipmentNo || item.Shipment_No || 'SHP-2026-001',
            Transporter_Name: item.Transporter_Name || item.TransporterName || '',
            Tracking_No: item.Tracking_No || item.Track_id || '',
            Dateof_Shipment: item.Dateof_Shipment?.split('T')[0] || item.Date_Of_Shipment || '',
            Delivery_Date: item.Delivery_Date?.split('T')[0] || item.Delivery_Date || '',
            Receiver_Name: item.Receiver_Name || item.Contact_Person || 'Receiver',
            Receiver_Phone: item.Receiver_Phone || '',
            Status: item.Status || 'Confirmed',
            Remarks: item.Remarks || '',
          })));
        }
      } else {
        const res = await fetchDeliveriesAPI(1);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedBackend = list.map((item: any) => ({
          id: item.id,
          Delivery_Id: item.Delivery_Id || `POD-${item.id}`,
          Shipment_No: item.SalesShipment_Id?.Shipment_Id || item.Sales_ShipmentNo || item.Shipment_No || 'SHP-2026-001',
          Transporter_Name: item.Transporter_Name || item.TransporterName || '',
          Tracking_No: item.Tracking_No || item.Track_id || '',
          Dateof_Shipment: item.Dateof_Shipment?.split('T')[0] || item.Date_Of_Shipment || '',
          Delivery_Date: item.Delivery_Date?.split('T')[0] || item.Delivery_Date || '',
          Receiver_Name: item.Receiver_Name || item.Contact_Person || 'Receiver',
          Receiver_Phone: item.Receiver_Phone || '',
          Status: item.Status || 'Confirmed',
          Remarks: item.Remarks || '',
        }));
        const merged = mergeWithLocalData<ShipmentDelivery>('pegatto_deliveries', mappedBackend, ['id', 'Delivery_Id']);
        setDeliveries(merged);
      }
    } catch {
      const local = getLocalData<ShipmentDelivery>('pegatto_deliveries');
      if (local.length > 0) setDeliveries(local);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, searchTerm]);

  React.useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  React.useEffect(() => {
    const loadShipments = async () => {
      try {
        const res = await fetchShipmentsAPI(1, false).catch(() => ({ results: [] }));
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const localShps = getLocalData<any>('pegatto_shipments') || [];
        const seen = new Set<string>();
        const combined: any[] = [];
        [...list, ...localShps].forEach((s: any) => {
          const key = String(s.Shipment_No || s.Shipment_Id || s.id || '').trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            combined.push(s);
          }
        });
        setShipmentOptions(combined);
      } catch (e) {
        console.error('Failed to load shipment options:', e);
      }
    };
    loadShipments();
  }, []);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedDelivery, setSelectedDelivery] = useState<ShipmentDelivery | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form State
  const [formState, setFormState] = useState<{
    Delivery_Id?: string;
    Shipment_No: string;
    ShipmentId?: number | null;
    Transporter_Name: string;
    Tracking_No: string;
    Date_Of_Shipment: string;
    Status: string;
    Delivery_Date: string;
  }>({
    Shipment_No: '',
    ShipmentId: null,
    Transporter_Name: TRANSPORTER_OPTIONS[0],
    Tracking_No: '',
    Date_Of_Shipment: new Date().toISOString().split('T')[0],
    Status: 'Shipped',
    Delivery_Date: new Date().toISOString().split('T')[0]
  });

  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Check entered/modified fields
  const getModifiedFields = (): string[] => {
    const fields: string[] = [];

    if (isEditOpen && selectedDelivery) {
      if (formState.Shipment_No !== selectedDelivery.Shipment_No) fields.push(`Shipment No ("${formState.Shipment_No}")`);
      if (formState.Transporter_Name !== (selectedDelivery.Transporter_Name || '')) fields.push(`Transporter ("${formState.Transporter_Name}")`);
      if (formState.Tracking_No !== (selectedDelivery.Tracking_No || '')) fields.push(`Tracking No ("${formState.Tracking_No}")`);
      if (formState.Delivery_Date !== selectedDelivery.Delivery_Date) fields.push(`Delivery Date ("${formState.Delivery_Date}")`);
      if (formState.Status !== selectedDelivery.Status) fields.push(`Status ("${formState.Status}")`);
      return fields;
    }

    // In Create mode:
    if (formState.Shipment_No.trim()) fields.push(`Shipment No ("${formState.Shipment_No.trim()}")`);
    if (formState.Tracking_No.trim()) fields.push(`Tracking No ("${formState.Tracking_No.trim()}")`);

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
    setSelectedDelivery(null);
  };

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.Delivery_Id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Shipment_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Transporter_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Tracking_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Receiver_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Status.toLowerCase().includes(searchTerm.toLowerCase());

      return matchSearch;
    });
  }, [deliveries, searchTerm]);

  // Safe Pagination
  const totalPages = Math.max(1, Math.ceil(filteredDeliveries.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedDeliveries = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredDeliveries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDeliveries, safeCurrentPage]);

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
    const empty = { deliveryId: '', transporterName: '', fromDate: '', toDate: '' };
    setFilterForm(empty);
    setActiveFilters(empty);
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    const nextSeq = deliveries.length + 1;
    setFormErrors({});
    setFormState({
      Delivery_Id: `POD-2026-${String(nextSeq).padStart(3, '0')}`,
      Shipment_No: '',
      ShipmentId: null,
      Transporter_Name: TRANSPORTER_OPTIONS[0],
      Tracking_No: '',
      Date_Of_Shipment: new Date().toISOString().split('T')[0],
      Status: 'Shipped',
      Delivery_Date: new Date().toISOString().split('T')[0]
    });
    setIsCreateOpen(true);
  };

  const handleShipmentSelect = (shipmentNo: string) => {
    const trimmed = (shipmentNo || '').trim().toLowerCase();
    const found = shipmentOptions.find(
      (s) =>
        String(s.Shipment_Id || '').toLowerCase() === trimmed ||
        String(s.Sales_ShipmentNo || '').toLowerCase() === trimmed ||
        String(s.Shipment_No || '').toLowerCase() === trimmed ||
        String(s.id) === trimmed
    ) || deliveries.find((d) => String(d.Shipment_No).toLowerCase() === trimmed);

    if (found) {
      const parsedShipmentId = Number(found.id || (found as any).SalesShipment_Id?.id || (found as any).SalesShipment_Id || (found as any).ShipmentId);
      setFormState((prev) => ({
        ...prev,
        Shipment_No: found.Shipment_Id || found.Sales_ShipmentNo || found.Shipment_No || shipmentNo,
        ShipmentId: !isNaN(parsedShipmentId) && parsedShipmentId > 0 ? parsedShipmentId : (shipmentOptions[0]?.id || 1),
        Transporter_Name: found.Transporter_Name || found.TransporterName || TRANSPORTER_OPTIONS[0],
        Tracking_No: found.Tracking_No || found.Track_id || `TRK-${shipmentNo.replace(/[^0-9]/g, '') || '101'}`,
        Date_Of_Shipment: found.Dateof_Shipment?.split('T')[0] || found.Date_Of_Shipment || new Date().toISOString().split('T')[0],
        Delivery_Date: found.Delivery_Date?.split('T')[0] || new Date().toISOString().split('T')[0],
        Status: found.Status || 'Shipped'
      }));
    } else {
      const fallbackShipment = shipmentOptions[0];
      setFormState((prev) => ({
        ...prev,
        Shipment_No: shipmentNo,
        ShipmentId: fallbackShipment?.id || 1,
        Transporter_Name: TRANSPORTER_OPTIONS[0],
        Tracking_No: shipmentNo ? `TRK-${shipmentNo.replace(/[^0-9]/g, '') || '101'}` : '',
        Date_Of_Shipment: new Date().toISOString().split('T')[0],
        Delivery_Date: new Date().toISOString().split('T')[0],
        Status: 'Shipped'
      }));
    }
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.Shipment_No;
      delete copy.Tracking_No;
      delete copy.Date_Of_Shipment;
      delete copy.Delivery_Date;
      return copy;
    });
  };

  // Open Edit Dialog
  const handleOpenEdit = (delivery: ShipmentDelivery) => {
    setSelectedDelivery(delivery);
    setFormErrors({});
    setFormState({
      Delivery_Id: delivery.Delivery_Id,
      Shipment_No: delivery.Shipment_No,
      Transporter_Name: delivery.Transporter_Name,
      Tracking_No: delivery.Tracking_No,
      Date_Of_Shipment: delivery.Delivery_Date,
      Status: delivery.Status,
      Delivery_Date: delivery.Delivery_Date
    });
    setIsEditOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (delivery: ShipmentDelivery) => {
    setSelectedDelivery(delivery);
    setIsDeleteOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formState.Shipment_No) {
      errors.Shipment_No = 'Shipment No is required';
    }
    if (!formState.Tracking_No.trim()) {
      errors.Tracking_No = 'Tracking No is required';
    }
    if (!formState.Date_Of_Shipment) {
      errors.Date_Of_Shipment = 'Date of Shipment is required';
    }
    if (!formState.Delivery_Date) {
      errors.Delivery_Date = 'Delivery Date is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save create
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newDelivery: ShipmentDelivery = {
      id: Date.now(),
      Delivery_Id: formState.Delivery_Id || `POD-2026-${String(deliveries.length + 1).padStart(3, '0')}`,
      Shipment_No: formState.Shipment_No,
      Transporter_Name: formState.Transporter_Name,
      Tracking_No: formState.Tracking_No,
      Delivery_Date: formState.Delivery_Date,
      Dateof_Shipment: formState.Date_Of_Shipment,
      Receiver_Name: '',
      Status: formState.Status,
      Remarks: ''
    };

    upsertLocalItem('pegatto_deliveries', newDelivery, ['id', 'Delivery_Id']);
    setDeliveries((prev) => [newDelivery, ...prev.filter(d => d.id !== newDelivery.id)]);
    setIsCreateOpen(false);
    toast.success(`Delivery confirmation ${newDelivery.Delivery_Id} recorded successfully`);

    try {
      await createDeliveryAPI({
        id: newDelivery.id,
        Delivery_Id: newDelivery.Delivery_Id,
        Sales_OrderNo: formState.Shipment_No,
        Shipment_OrderNo: formState.Shipment_No,
        Transporter_Name: formState.Transporter_Name,
        Tracking_No: formState.Tracking_No,
        Delivery_Date: formState.Delivery_Date,
        Dateof_Shipment: formState.Date_Of_Shipment,
        Status: formState.Status,
      } as any);
      loadDeliveries();
    } catch (err: any) {
      console.warn('Delivery Confirmation save notice (saved locally):', err);
      const detail = err?.data ? (typeof err.data === 'object' ? JSON.stringify(err.data) : err.data) : (err?.message || '');
      if (detail) {
        toast.info(`Saved locally. Note: ${detail}`, { duration: 4000 });
      }
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery || !validateForm()) return;

    const updatedDelivery: ShipmentDelivery = {
      ...selectedDelivery,
      Shipment_No: formState.Shipment_No,
      Transporter_Name: formState.Transporter_Name,
      Tracking_No: formState.Tracking_No,
      Delivery_Date: formState.Delivery_Date,
      Dateof_Shipment: formState.Date_Of_Shipment,
      Status: formState.Status
    };

    upsertLocalItem('pegatto_deliveries', updatedDelivery, ['id', 'Delivery_Id']);
    setDeliveries((prev) =>
      prev.map((item) => (item.id === selectedDelivery.id ? updatedDelivery : item))
    );
    setIsEditOpen(false);
    toast.success(`Delivery confirmation ${selectedDelivery.Delivery_Id} updated`);

    try {
      await updateDeliveryAPI({
        id: selectedDelivery.id,
        Delivery_Id: selectedDelivery.Delivery_Id,
        Sales_OrderNo: formState.Shipment_No,
        Shipment_OrderNo: formState.Shipment_No,
        Transporter_Name: formState.Transporter_Name,
        Tracking_No: formState.Tracking_No,
        Delivery_Date: formState.Delivery_Date,
        Dateof_Shipment: formState.Date_Of_Shipment,
        Status: formState.Status,
      } as any);
      loadDeliveries();
    } catch (err: any) {
      console.warn('Delivery Confirmation update notice (saved locally):', err);
      const detail = err?.data ? (typeof err.data === 'object' ? JSON.stringify(err.data) : err.data) : (err?.message || '');
      if (detail) {
        toast.info(`Updated locally. Note: ${detail}`, { duration: 4000 });
      }
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedDelivery) return;
    deleteLocalItem('pegatto_deliveries', selectedDelivery.id, ['id', 'Delivery_Id']);
    setDeliveries((prev) => prev.filter((item) => item.id !== selectedDelivery.id));
    setIsDeleteOpen(false);
    toast.success(`Delivery record ${selectedDelivery.Delivery_Id} deleted`);

    try {
      await deleteDeliveryAPI(selectedDelivery.id);
      loadDeliveries();
    } catch {
      // Backend error fallback
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Delivery Confirmation List
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
              <span>( {filteredDeliveries.length} ) Confirmations</span>
            </button>

            {/* Filter Popover matching old retail ShipmentDeliveryList.js */}
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
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Delivery Id</label>
                      <input
                        type="text"
                        placeholder="Delivery Id"
                        value={filterForm.deliveryId}
                        onChange={(e) => setFilterForm({ ...filterForm, deliveryId: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Transporter Name</label>
                      <input
                        type="text"
                        placeholder="Transporter Name"
                        value={filterForm.transporterName}
                        onChange={(e) => setFilterForm({ ...filterForm, transporterName: e.target.value })}
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
              onClick={() => loadDeliveries()}
              disabled={isLoading}
              className="p-2 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Refresh Confirmations"
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
                    <span>DELIVERY ID</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>SHIPMENT NO</span>
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
                    <span>DELIVERY DATE</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[160px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>RECEIVER NAME</span>
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
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#2A7D5B]" />
                      <span>Loading delivery confirmations...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No delivery confirmations found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedDeliveries.map((delivery) => {
                  return (
                    <tr
                      key={delivery.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {delivery.Delivery_Id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {delivery.Shipment_No}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {delivery.Transporter_Name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {delivery.Tracking_No}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {delivery.Delivery_Date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {delivery.Receiver_Name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {delivery.Status}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Delivery Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                              Delivery Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => handleOpenEdit(delivery)}
                            >
                              <SquarePen className="h-4 w-4 text-slate-500" /> Edit Delivery
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-2 py-1.5 rounded-lg"
                              onClick={() => handleOpenDelete(delivery)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" /> Delete Confirmation
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

      {/* CREATE / EDIT DELIVERY MODAL */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelClick();
          }
        }}
      >
        <DialogContent className="max-w-xl p-6 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isCreateOpen ? 'Create Delivery Confirmation' : 'Edit Delivery Confirmation'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={isCreateOpen ? handleSaveCreate : handleSaveEdit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              {/* Shipment No - dropdown */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Shipment No <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formState.Shipment_No || ''}
                    onChange={(e) => handleShipmentSelect(e.target.value)}
                    className={`w-full appearance-none px-3 py-2 pr-8 text-xs rounded border ${
                      formErrors.Shipment_No ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] cursor-pointer`}
                  >
                    <option value="">Select Shipment No</option>
                    {shipmentOptions.map((s) => {
                      const sNo = s.Shipment_Id || s.Sales_ShipmentNo || s.Shipment_No || s.id;
                      const cust = s.CustomerName || s.Customer_Name || '';
                      return (
                        <option key={s.id || sNo} value={sNo}>
                          {sNo}{cust ? ` — ${cust}` : ''}
                        </option>
                      );
                    })}
                    {formState.Shipment_No && !shipmentOptions.some((s) => (s.Shipment_Id || s.Sales_ShipmentNo || s.Shipment_No || s.id) === formState.Shipment_No) && (
                      <option value={formState.Shipment_No}>{formState.Shipment_No}</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
                {formErrors.Shipment_No && (
                  <p className="text-red-500 text-[10px] mt-1">{formErrors.Shipment_No}</p>
                )}
              </div>

              {/* Transporter Name - text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Transporter Name
                </label>
                <input
                  type="text"
                  placeholder="Transporter Name"
                  value={formState.Transporter_Name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Transporter_Name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                />
              </div>

              {/* Tracking No - text */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Tracking No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Tracking No"
                  value={formState.Tracking_No}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Tracking_No: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs rounded border ${
                    formErrors.Tracking_No ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                />
                {formErrors.Tracking_No && (
                  <p className="text-red-500 text-[10px]">{formErrors.Tracking_No}</p>
                )}
              </div>

              {/* Date of Shipment - date */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Date of Shipment <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.Date_Of_Shipment}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Date_Of_Shipment: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs rounded border ${
                    formErrors.Date_Of_Shipment ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                />
                {formErrors.Date_Of_Shipment && (
                  <p className="text-red-500 text-[10px]">{formErrors.Date_Of_Shipment}</p>
                )}
              </div>

              {/* Status - dropdown */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Status <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formState.Status || 'Shipped'}
                    onChange={(e) => setFormState((prev) => ({ ...prev, Status: e.target.value }))}
                    className="w-full appearance-none px-3 py-2 pr-8 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] cursor-pointer"
                  >
                    <option value="">Select Status</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Delivery Date - date */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formState.Delivery_Date}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Delivery_Date: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs rounded border ${
                    formErrors.Delivery_Date ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                />
                {formErrors.Delivery_Date && (
                  <p className="text-red-500 text-[10px]">{formErrors.Delivery_Date}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
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
            Are you sure you want to delete delivery confirmation{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedDelivery?.Delivery_Id}
            </span>{' '}
            for Shipment <span className="font-semibold">{selectedDelivery?.Shipment_No}</span>?
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
