'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSalesOrderStore, SalesOrderItem, SalesOrder } from '@/store/useSalesOrderStore';
import { fetchProjectlistwithoutpaginaton } from '@/service/api/Project';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Trash2,
  ChevronLeft,
  Info,
  FileText,
  Calendar as CalendarIcon,
  User,
  MapPin,
  DollarSign,
  PlusCircle,
  Paperclip,
  UploadCloud,
  Check,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  fetchUserSalesById,
  createUserSales,
  updateUserSales
} from '@/service/api/SalesOrder';
import { fetchAccountFullList } from '@/service/api/Company';
import { usePermission } from '@/hooks/usePermission';

const CUSTOMERS_DB: Record<string, {
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  billingAddress: string;
  shippingAddress: string;
}> = {
  'Green Valley Farms': {
    contactPerson: 'John Smith',
    contactPhone: '+1 555-123-4567',
    contactEmail: 'john.smith@greenvalley.com',
    billingAddress: '123 Farm Road, Green Valley, California, USA',
    shippingAddress: '123 Farm Road, Green Valley, California, USA',
  },
  'Agri Best Supplies': {
    contactPerson: 'Sarah Best',
    contactPhone: '+1 555-888-9999',
    contactEmail: 'sarah@agribest.com',
    billingAddress: '456 Supply Blvd, Chicago, IL, USA',
    shippingAddress: '456 Supply Blvd, Chicago, IL, USA',
  },
  'Farm Fresh Co.': {
    contactPerson: 'David Miller',
    contactPhone: '+1 555-456-7890',
    contactEmail: 'david@farmfresh.co',
    billingAddress: '789 Fresh Ave, Portland, OR, USA',
    shippingAddress: '789 Fresh Ave, Portland, OR, USA',
  },
  'Nature Crop Ltd.': {
    contactPerson: 'Emily Davis',
    contactPhone: '+1 555-321-7654',
    contactEmail: 'emily@naturecrop.com',
    billingAddress: '99 Green Hills, Seattle, WA, USA',
    shippingAddress: '99 Green Hills, Seattle, WA, USA',
  },
  'Harvest Point': {
    contactPerson: 'Alan Carter',
    contactPhone: '+1 555-777-6666',
    contactEmail: 'alan@harvestpoint.com',
    billingAddress: '321 Crop Field, Denver, CO, USA',
    shippingAddress: '321 Crop Field, Denver, CO, USA',
  }
};

export interface ProjectItem {
  id: number;
  project_id: string;
  project_name: string;
  Customer_Name?: string;
  Project_Iniit_No?: string;
  Project_Cost?: number;
  project_description?: string;
  project_duration?: string;
  project_owner?: string;
  Status?: string;
  project_estimation_start_date?: string;
  project_estimation_end_date?: string;
  Is_Deleted?: boolean;
  Completion_Date?: string | null;
  Created_Date?: string;
  Updated_Date?: string;
  Priority?: string | null;
  UserSales_Id?: string | number | null;
  project_owner_id?: number;
  Created_By?: number;
  Updated_By?: number;
  Organization_Id?: number;
}

const getCurrencySymbol = (curr: string) => {
  switch (curr) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'AED': return 'د.إ';
    case 'INR': return '₹';
    default: return curr;
  }
};

export default function CreateSalesOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    }>
      <CreateSalesOrderFormInner />
    </Suspense>
  );
}

function CreateSalesOrderFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { addSalesOrder, salesOrders } = useSalesOrderStore();

  const editId = searchParams.get('edit');
  const [isEditing, setIsEditing] = useState(false);
  const [editOrderData, setEditOrderData] = useState<any>(null);

  const { canCreateSalesOrder, canEditSalesOrder, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded) {
      if (editId && !canEditSalesOrder) {
        toast.error('You do not have permission to edit Sales Orders.');
        router.push('/sales/orders');
      } else if (!editId && !canCreateSalesOrder) {
        toast.error('You do not have permission to create Sales Orders.');
        router.push('/sales/orders');
      }
    }
  }, [isLoaded, editId, canEditSalesOrder, canCreateSalesOrder, router]);

  // Order Details States
  const [orderId, setOrderId] = useState('');
  useEffect(() => {
    if (!editId) {
      setOrderId('');
    }
  }, [editId]);

  const [orderDate, setOrderDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // YYYY-MM-DD
  });
  const [requiredDate, setRequiredDate] = useState('');
  const [reference, setReference] = useState('');
  const [customer, setCustomer] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [salesRepresentative, setSalesRepresentative] = useState('Admin User');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('1. Delivery within 7-10 business days of order confirmation.\n2. Payment is due as per the terms specified above.\n3. Goods remain the property of the seller until paid in full.');

  // Items State
  const [items, setItems] = useState<SalesOrderItem[]>([
    { itemType: 'Product', product: '', description: '', quantity: 1, unitPrice: 0, discount: '0%', tax: 'VAT 5%', amount: 0 }
  ]);

  // Fetch Accounts and Projects using useQuery
  const { data: accountsData } = useQuery({
    queryKey: ['accountsList'],
    queryFn: fetchAccountFullList
  });

  const accounts = useMemo(() => {
    if (!accountsData) return [];
    return Array.isArray(accountsData) ? accountsData : (accountsData?.results || []);
  }, [accountsData]);

  const { data: projectsData } = useQuery({
    queryKey: ['projectsList'],
    queryFn: fetchProjectlistwithoutpaginaton
  });

  const projects = useMemo(() => {
    if (!projectsData) return [];
    return Array.isArray(projectsData) ? projectsData : (projectsData?.results || []);
  }, [projectsData]);

  // Fetch editing order if editing
  const { data: editOrderRes, isLoading: isOrderDetailLoading } = useQuery({
    queryKey: ['salesOrderDetail', editId],
    queryFn: () => fetchUserSalesById(editId!),
    enabled: !!editId
  });

  useEffect(() => {
    if (editOrderRes) {
      setIsEditing(true);
      setEditOrderData(editOrderRes);
      setOrderId(editOrderRes.Sale_Id || '');
      setOrderDate(editOrderRes.Po_Date || editOrderRes.Order_Date || '');
      setRequiredDate(editOrderRes.Required_Date || '');
      setReference(editOrderRes.Po_Number || '');

      // Resolve customer name from accounts or Account_Id object to match dropdown options
      let initialCustomer = editOrderRes.Customer_Name || '';
      let initialPhone = '';
      let initialEmail = '';
      let initialContactPerson = editOrderRes.Contact_Person || '';
      let initialBilling = editOrderRes.Billing_Address || '';
      let initialShipping = editOrderRes.Billing_Address || '';

      const accObj = editOrderRes.Account_Id;
      if (accObj) {
        const accId = typeof accObj === 'object' ? accObj.id : accObj;
        const matched = accounts.find((a: any) => a.id === accId);

        if (matched) {
          initialCustomer = matched.Contact_Name || matched.Lead_Name || matched.Organization_Name || '';
          initialPhone = matched.Phone_Number || '';
          initialEmail = matched.Mail || '';
          if (!initialContactPerson) {
            initialContactPerson = matched.Contact_Name || matched.Lead_Name || '';
          }
          if (!initialBilling) {
            initialBilling = matched.Address || '';
          }
          if (!initialShipping) {
            initialShipping = matched.Address || '';
          }
        } else if (typeof accObj === 'object') {
          initialCustomer = accObj.Contact_Name || accObj.Lead_Name || accObj.Organization_Name || '';
          initialPhone = accObj.Phone_Number || '';
          initialEmail = accObj.Mail || '';
          if (!initialContactPerson) {
            initialContactPerson = accObj.Contact_Name || accObj.Lead_Name || '';
          }
          if (!initialBilling) {
            initialBilling = accObj.Address || '';
          }
          if (!initialShipping) {
            initialShipping = accObj.Address || '';
          }
        }
      }

      setCustomer(initialCustomer);
      setContactPerson(initialContactPerson);
      setContactPhone(initialPhone);
      setContactEmail(initialEmail);
      setBillingAddress(initialBilling);
      setShippingAddress(initialShipping);

      setCurrency(editOrderRes.Currency || 'USD');
      setPaymentTerms(editOrderRes.Payment_Terms || 'Net 30');
      setSalesRepresentative(editOrderRes.Sales_Person || 'Admin User');
      setNotes(editOrderRes.Note || '');
      setTerms(editOrderRes.Terms_Condition || '');

      const mappedItems = (editOrderRes.SalesOrder_Details || []).map((det: any) => ({
        itemType: 'Service',
        product: det.Project_Name || det.Project_Id || '',
        description: det.Description || det.Project_Name || '',
        quantity: det.Quantity ? parseInt(det.Quantity) || 1 : 1,
        unitPrice: det.Unit_Price ? parseFloat(det.Unit_Price) || 0 : 0,
        discount: det.Discount ? `${det.Discount}%` : '0%',
        tax: det.Tax ? `VAT ${det.Tax}%` : 'VAT 5%',
        amount: det.Net_Amount || det.Amount || 0
      }));
      if (mappedItems.length > 0) {
        setItems(mappedItems);
      }
    }
  }, [editOrderRes, accounts]);

  const getUserId = (): number => {
    if (typeof window !== 'undefined') {
      try {
        const directId = localStorage.getItem('userId');
        if (directId) {
          const id = Number(directId);
          if (!isNaN(id) && id > 0) return id;
        }
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const id = Number(userData?.id || userData?.userId);
          if (!isNaN(id) && id > 0) return id;
        }
      } catch (e) {
        console.error('Error retrieving userId from localStorage', e);
      }
    }
    return 72; // default fallback
  };

  // Pre-fill contacts when customer changes
  const handleCustomerChange = (val: string) => {
    setCustomer(val);
    const selectedAcc = accounts.find(acc => (acc.Contact_Name || acc.Lead_Name || acc.Organization_Name) === val);
    if (selectedAcc) {
      setContactPerson(selectedAcc.Contact_Name || selectedAcc.Lead_Name || '');
      setContactPhone(selectedAcc.Phone_Number || '');
      setContactEmail(selectedAcc.Mail || '');
      setBillingAddress(selectedAcc.Address || '');
      setShippingAddress(selectedAcc.Address || '');
    } else if (CUSTOMERS_DB[val]) {
      const data = CUSTOMERS_DB[val];
      setContactPerson(data.contactPerson);
      setContactPhone(data.contactPhone);
      setContactEmail(data.contactEmail);
      setBillingAddress(data.billingAddress);
      setShippingAddress(data.shippingAddress);
    }
  };

  // Add Item Row
  const handleAddItemRow = () => {
    setItems(prev => [
      ...prev,
      { itemType: 'Product', product: '', description: '', quantity: 1, unitPrice: 0, discount: '0%', tax: 'VAT 5%', amount: 0 }
    ]);
  };

  // Remove Item Row
  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) {
      toast.error('A sales order must have at least one item.');
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handle Item Row Update
  const handleUpdateItemRow = (index: number, updatedFields: Partial<SalesOrderItem>) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;

      const merged = { ...item, ...updatedFields };

      // If product changed, autopopulate type, description, and price
      if (updatedFields.product) {
        const selectedProj = projects.find(p => p.project_id === updatedFields.product || p.project_name === updatedFields.product);
        if (selectedProj) {
          merged.itemType = 'Service';
          merged.description = selectedProj.project_description || selectedProj.project_name || '';
          merged.unitPrice = selectedProj.Project_Cost || 0;
        }
      }

      // Calculate row amount
      const quantity = merged.quantity || 0;
      const price = merged.unitPrice || 0;
      const discountPct = parseFloat(merged.discount) || 0;

      const sub = quantity * price;
      const discAmount = sub * (discountPct / 100);
      merged.amount = Number((sub - discAmount).toFixed(2));

      return merged;
    }));
  };

  // Totals calculations
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = 0;
    const grandTotal = subtotal;
    return { subtotal, taxAmount, grandTotal };
  }, [items]);

  // Mutation for saving
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (isEditing) {
        return updateUserSales(payload);
      } else {
        return createUserSales(payload);
      }
    },
    onSuccess: (data) => {
      const displayId = data?.Sale_Id || orderId || '';
      toast.success(`Sales Order ${displayId} ${isEditing ? 'updated' : 'created'} successfully.`);
      queryClient.invalidateQueries({ queryKey: ['salesOrderCards'] });
      queryClient.invalidateQueries({ queryKey: ['salesOrdersList'] });
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ['salesOrderDetail', editId] });
      }
      router.push('/sales/orders');
    },
    onError: (err: any) => {
      console.error("Failed to save Sales Order:", err);
      toast.error(`Failed to save Sales Order: ${err.message || err}`);
    }
  });

  const isSubmitting = saveMutation.isPending;

  // Handle Form Submission
  const handleSubmit = async (status: 'Draft' | 'Confirmed') => {
    // Validations
    if (!customer || !customer.trim()) {
      toast.error('Please select a customer.');
      return;
    }
    if (!orderDate || !orderDate.trim()) {
      toast.error('Please select an Order Date.');
      return;
    }
    if (!requiredDate || !requiredDate.trim()) {
      toast.error('Please specify a Required Delivery Date.');
      return;
    }

    // Check if items are fully configured
    const invalidItems = items.some(item => !item.product || item.unitPrice < 0);
    if (invalidItems) {
      toast.error('Please configure all item rows with valid products and prices.');
      return;
    }

    const userId = getUserId();
    const payload: any = {
      Po_Number: reference || "NA",
      Po_Date: orderDate,
      Payment_Terms: paymentTerms,
      Delivery_Terms: editOrderData?.Delivery_Terms || null,
      freight: editOrderData?.freight || null,
      Price_Book: editOrderData?.Price_Book || "",
      Total_Amount: totals.grandTotal,
      Net_Amount: totals.subtotal,
      Currency: currency,
      Order_Date: orderDate,
      Contact_Person: contactPerson || null,
      Required_Date: requiredDate,
      Reference: reference || null,
      Billing_Address: billingAddress || null,
      Terms_Condition: terms || null,
      Attachment: editOrderData?.Attachment || null,
      Is_Draft: status === 'Draft',
      Sales_Person: salesRepresentative,
      Note: notes,
      Total_Discount: editOrderData?.Total_Discount || null,
      Customer_Name: customer,
      Spl_Discount: editOrderData?.Spl_Discount || 0,
      ScheduledSalesOrder_Details: editOrderData?.ScheduledSalesOrder_Details || null,
      Order_Type: editOrderData?.Order_Type || null,
      Reference_Id: editOrderData?.Reference_Id || null,
      Is_Replacement: editOrderData?.Is_Replacement || false,
      Offer_Name: editOrderData?.Offer_Name || null,
      Offer_Discount_Amount: editOrderData?.Offer_Discount_Amount || 0.0,
      Offer_Code: editOrderData?.Offer_Code || null,
      Bank_Name: editOrderData?.Bank_Name || null,
      Card_Type: editOrderData?.Card_Type || null,
      isSchedule: editOrderData?.isSchedule || false,
      isScheduleClosed: editOrderData?.isScheduleClosed || false,
      Schedule_Status: editOrderData?.Schedule_Status || "Schedule Not Created",
      StatusTrack: status === 'Draft' ? 'Draft Saved' : 'Sales Order Created',
      Is_Deleted: false,
      Organization_Id: editOrderData?.Organization_Id
        ? (typeof editOrderData.Organization_Id === 'object' ? editOrderData.Organization_Id.id : editOrderData.Organization_Id)
        : 1,
      SalesUser_Id: editOrderData?.SalesUser_Id
        ? (typeof editOrderData.SalesUser_Id === 'object' ? editOrderData.SalesUser_Id.id : editOrderData.SalesUser_Id)
        : userId,
      Account_Id: accounts.find(acc => (acc.Contact_Name || acc.Lead_Name || acc.Organization_Name) === customer)?.id
        || (editOrderData?.Account_Id ? (typeof editOrderData.Account_Id === 'object' ? editOrderData.Account_Id.id : editOrderData.Account_Id) : null)
        || 399,
      Lead_Id: editOrderData?.Lead_Id
        ? (typeof editOrderData.Lead_Id === 'object' ? editOrderData.Lead_Id.id : editOrderData.Lead_Id)
        : null,
      Deal_Id: editOrderData?.Deal_Id
        ? (typeof editOrderData.Deal_Id === 'object' ? editOrderData.Deal_Id.id : editOrderData.Deal_Id)
        : null,
      OffersMaster_Id: editOrderData?.OffersMaster_Id
        ? (typeof editOrderData.OffersMaster_Id === 'object' ? editOrderData.OffersMaster_Id.id : editOrderData.OffersMaster_Id)
        : null,
      Bank_Id: editOrderData?.Bank_Id
        ? (typeof editOrderData.Bank_Id === 'object' ? editOrderData.Bank_Id.id : editOrderData.Bank_Id)
        : null,
      Created_By: editOrderData?.Created_By
        ? (typeof editOrderData.Created_By === 'object' ? editOrderData.Created_By.id : editOrderData.Created_By)
        : userId,
      Updated_By: userId,
      SalesOrder_Details: items.map(item => {
        const selectedProj = projects.find(p => p.project_id === item.product || p.project_name === item.product);
        return {
          Project_Id: selectedProj?.id,
          Project_Name: selectedProj?.project_name || item.product,
          Projectid: selectedProj?.id,
          project_Id: selectedProj?.id,
          UOM: "",
          Unit_Price: String(item.unitPrice),
          Description: item.description,
          Quantity: "1",
          Amount: String(item.amount),
          Discount: String(parseFloat(item.discount) || 0),
          Tax: "0",
          Final_Price: String(item.amount),
          Net_Amount: item.amount
        };
      })
    };

    if (isEditing) {
      payload.id = Number(editId);
      payload.Sale_Id = orderId;
    }

    saveMutation.mutate(payload);
  };

  if (isOrderDetailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isLoaded && ((editId && !canEditSalesOrder) || (!editId && !canCreateSalesOrder))) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-455 font-semibold mb-0.5">
            <Link href="/sales/orders" className="hover:underline flex items-center gap-0.5 text-slate-400">
              <ChevronLeft className="h-3 w-3" /> Sales Orders
            </Link>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">{isEditing ? 'Edit Order' : 'Create Order'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isEditing ? 'Edit Sales Order' : 'Create Sales Order'}
          </h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Link href="/sales/orders" className="inline-flex items-center justify-center h-9 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            Cancel
          </Link>

          <Button
            onClick={() => handleSubmit('Confirmed')}
            disabled={isSubmitting}
            className="h-9 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm border border-transparent flex items-center gap-1.5"
          >
            {isSubmitting && <RefreshCw className="h-3 w-3 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Save & Submit'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Card 1: Order Information */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-blue-600 dark:text-blue-505 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Order Information</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">

                {/* Order No. */}
                {isEditing && (
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500">Order Number</label>
                    <Input
                      value={orderId}
                      disabled
                      placeholder="SO-XXXX-XXXXX"
                      className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 font-bold focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                    />
                  </div>
                )}

                {/* Customer */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Customer <span className="text-red-500">*</span></label>
                  <Select value={customer} onValueChange={(val) => handleCustomerChange(val || '')}>
                    <SelectTrigger className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800">
                      <SelectValue placeholder="Select Customer" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl">
                      {accounts?.map(acc => {
                        const name = acc.Contact_Name || acc.Lead_Name || acc.Organization_Name || '';
                        return (
                          <SelectItem key={acc.id} value={name}>
                            {name}
                          </SelectItem>
                        );
                      })}
                      {accounts.length === 0 && Object.keys(CUSTOMERS_DB).map(cust => (
                        <SelectItem key={cust} value={cust}>{cust}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Order Date <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 font-semibold focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                  />
                </div>

                {/* Required Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Required Delivery Date <span className="text-red-500">*</span></label>
                  <Input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 font-semibold focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                  />
                </div>

                {/* Payment Terms */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Payment Terms</label>
                  <Select value={paymentTerms} onValueChange={(val) => setPaymentTerms(val || 'Net 30')}>
                    <SelectTrigger className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800">
                      <SelectValue placeholder="Select Terms" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl">
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reference */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Customer Reference PO</label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. PO-2024-0012"
                    className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                  />
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Currency</label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val || 'INR')}>
                    <SelectTrigger className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800">
                      <SelectValue placeholder="INR" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl">
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sales Representative */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Sales Representative</label>
                  <Input
                    value={salesRepresentative}
                    onChange={(e) => setSalesRepresentative(e.target.value)}
                    placeholder="e.g. Sales Agent"
                    className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Order Items Table */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-600 dark:text-blue-505" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Order Items</h3>
              </div>
              <Button
                onClick={handleAddItemRow}
                variant="outline"
                size="sm"
                className="h-8 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 hover:bg-slate-50 hover:text-blue-600 gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Item
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-955/20 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3 w-10 text-center">#</th>
                    <th className="px-4 py-3 w-40">Project</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 w-32">Unit Price</th>
                    <th className="px-4 py-3 w-28">Discount (%)</th>
                    <th className="px-4 py-3 w-24 text-right">Amount</th>
                    <th className="px-4 py-3 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-950/5">
                      <td className="px-4 py-3.5 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Project Selector */}
                      <td className="px-4 py-3.5">
                        <Select
                          value={item.product}
                          onValueChange={(val) => handleUpdateItemRow(idx, { product: val || '' })}
                        >
                          <SelectTrigger className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800">
                            <SelectValue placeholder="Select Project" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl">
                            {projects.map((proj) => (
                              <SelectItem key={proj.project_id} value={proj.project_name || proj.project_id}>
                                {proj.project_name || proj.project_id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3.5">
                        <Input
                          value={item.description}
                          onChange={(e) => handleUpdateItemRow(idx, { description: e.target.value })}
                          placeholder="Item Description"
                          className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs w-full font-medium focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                        />
                      </td>



                      {/* Unit Price */}
                      <td className="px-4 py-3.5">
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-xs font-bold text-slate-455 select-none">
                            {getCurrencySymbol(currency)}
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice || ''}
                            onChange={(e) => handleUpdateItemRow(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                            className="h-8.5 pl-6.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs w-full font-bold focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                          />
                        </div>
                      </td>

                      {/* Discount Dropdown */}
                      <td className="px-4 py-3.5">
                        <Select
                          value={item.discount}
                          onValueChange={(val) => handleUpdateItemRow(idx, { discount: val || '0%' })}
                        >
                          <SelectTrigger className="h-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-905 text-xs text-center font-semibold focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800">
                            <SelectValue placeholder="0%" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-855 rounded-xl">
                            <SelectItem value="0%">0%</SelectItem>
                            <SelectItem value="5%">5%</SelectItem>
                            <SelectItem value="10%">10%</SelectItem>
                            <SelectItem value="15%">15%</SelectItem>
                            <SelectItem value="20%">20%</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Row Amount */}
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-white text-xs">
                        {currency} {item.amount.toFixed(2)}
                      </td>

                      {/* Delete Action */}
                      <td className="px-4 py-3.5 text-center">
                        <Button
                          onClick={() => handleRemoveItemRow(idx)}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-xl hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-955/20 text-slate-400 transition-colors border border-transparent"
                          title="Remove Row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary block */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row md:justify-between items-end gap-6 bg-slate-50/20 dark:bg-slate-955/5">
              <div className="text-left max-w-md w-full">
                <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Info className="h-4.5 w-4.5 text-blue-600 dark:text-blue-505 shrink-0 mt-0.5" />
                  <p className="leading-relaxed font-medium">
                    Order items total includes item discounts.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-80 space-y-2.5 text-xs font-bold text-slate-500">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-slate-850 dark:text-white font-extrabold">{currency} {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 text-sm">
                  <span className="text-slate-800 dark:text-slate-200">Grand Total</span>
                  <span className="text-blue-600 dark:text-blue-400 text-base font-extrabold">{currency} {totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Form Panels: Customer Contacts, T&C, Attachments (1/3 width) */}
        <div className="space-y-6">
          {/* Card 3: Contact & Delivery Metadata */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <MapPin className="h-4.5 w-4.5 text-blue-600 dark:text-blue-505 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Delivery & Contact</h3>
            </div>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Contact Person</label>
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Contact Person Name"
                    className="h-9 pl-8.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 font-semibold text-slate-800 dark:text-slate-200 focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Contact Phone</label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Phone"
                    className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">Contact Email</label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Email"
                    className="h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 focus-visible:ring-0 focus-visible:border-slate-200 dark:focus-visible:border-slate-800"
                  />
                </div>
              </div>                <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Billing Address</label>
                <textarea
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Street, City, Zip, Country..."
                  rows={2}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-855 dark:text-slate-200 focus:outline-hidden focus:border-slate-200 dark:focus:border-slate-800 focus:ring-0"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-500">Shipping Address</label>
                  <button
                    onClick={() => setShippingAddress(billingAddress)}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                    type="button"
                  >
                    Copy Billing Address
                  </button>
                </div>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Shipping Address..."
                  rows={2}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-855 dark:text-slate-200 focus:outline-hidden focus:border-slate-200 dark:focus:border-slate-800 focus:ring-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-blue-600 dark:text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Terms & Notes</h3>
            </div>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Order Notes / Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter internal comments or instructions..."
                  rows={2.5}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 focus:outline-hidden focus:border-slate-200 dark:focus:border-slate-800 focus:ring-0"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">Terms & Conditions</label>
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Specify payment or shipment policies..."
                  rows={3}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 focus:outline-hidden focus:border-slate-200 dark:focus:border-slate-800 focus:ring-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Attachments Dropzone */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Paperclip className="h-4.5 w-4.5 text-blue-600 dark:text-blue-505 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Attachments</h3>
            </div>
            <CardContent className="p-5 text-center">
              <div
                onClick={() => toast.info('File attachment system is simulated. Selected files will be stored internally.')}
                className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:bg-slate-50/50 dark:hover:bg-slate-955/10 cursor-pointer transition-colors flex flex-col items-center justify-center gap-2"
              >
                <UploadCloud className="h-8 w-8 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag & Drop Files here</span>
                <span className="text-[10px] text-slate-400">or click to browse from device (PDF, DOCX, JPEG up to 10MB)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
