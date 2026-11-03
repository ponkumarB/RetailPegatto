'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  AlertCircle,
  Boxes,
  Download,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Store,
  Tags,
  Truck,
  Users,
  Building2,
  CheckCircle2,
  CalendarDays,
  Trash2,
  Edit,
  Eye,
  Filter,
  Upload,
  UserPlus,
  TrendingUp,
  TrendingDown,
  X,
  Sparkles,
  Info,
  CheckSquare,
  Shield,
  Tag,
  Clock,
  Layers,
  ShoppingBag,
  Phone,
  Printer,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight
} from 'lucide-react';
import { fetchFromApi } from '@/service/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StoreCustomForm } from './StoreCustomForm';
import { ProductItemCustomForm } from './ProductItemCustomForm';
import { BarcodePrintDialog } from './BarcodePrintDialog';
import StoreEmployeeAssignment from './StoreEmployeeAssignment';
import { StoreOverviewModal } from './StoreOverviewModal';
import { GenericOverviewModal } from './GenericOverviewModal';
import CounterManagementDashboard from './CounterManagementDashboard';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { useStore as useGlobalStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export type StoreModule =
  | 'product-category'
  | 'product-group'
  | 'product-item'
  | 'supplier'
  | 'store'
  | 'counter'
  | 'store-employees'
  | 'product-inward'
  | 'product-tracking'
  | 'store-adjustment'
  | 'return-management'
  | 'replacement-management'
  | 'refund-management'
  | 'refund-policy';

type StoreRow = Record<string, any>;

type StoreProductRow = {
  id?: string | number;
  Product_Id: string | number;
  Product_Code?: string;
  Product_Name: string;
  UOM?: string;
  Opening_Balance?: string | number;
  Reorder_Level?: string | number;
  Min_Stock_Level?: string | number;
};

type ModuleConfig = {
  title: string;
  subtitle: string;
  category: string;
  actionLabel: string;
  crudEndpoint?: string;
  deleteEndpointFormat?: 'path' | 'query';
  updateEndpointFormat?: 'path' | 'query' | 'none';
  request: (page: number, search: string, status?: string) => { endpoint: string; options?: RequestInit };
  icon: React.ElementType;
  idField: string;
  nameField: string;
  statusField?: string;
  formFields: { key: string; label: string; type?: string; placeholder?: string; required?: boolean; options?: { label: string; value: string }[] }[];
  customFormComponent?: React.ComponentType<{
    formData: any;
    setFormData: (data: any) => void;
    isEdit: boolean;
    productRows: any[];
    setProductRows: (rows: any[]) => void;
    productList?: any[];
  }>;
};

const moduleConfig: Record<StoreModule, ModuleConfig> = {
  'product-category': {
    title: 'Product Categories',
    subtitle: 'Organize and manage product categories across your retail network',
    category: 'Product Management',
    actionLabel: 'Add Category',
    crudEndpoint: '/user/ProductCategoryCRUD/',
    request: (page, search) => ({
      endpoint: `/user/ProductCategoryAdditional/?Is_Deleted=False&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: Tags,
    idField: 'id',
    nameField: 'Category_Name',
    statusField: 'Is_Active',
    formFields: [
      { key: 'Category_Name', label: 'Category Name', required: true, placeholder: 'e.g. Electronics, Apparel' },
      { key: 'Category_Description', label: 'Description', type: 'textarea', placeholder: 'Category overview and scope...' },
    ],
  },
  'product-group': {
    title: 'Product Groups',
    subtitle: 'Manage product groups and their category relationships',
    category: 'Product Management',
    actionLabel: 'Add Group',
    crudEndpoint: '/user/ProductItemGroupCRUD/',
    request: (page, search) => ({
      endpoint: `/user/ProductItemGroupAdditional/?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: Package,
    idField: 'id',
    nameField: 'ProductItemGroup_Name',
    statusField: 'Is_Active',
    formFields: [
      { key: 'ProductItemGroup_Name', label: 'Group Name', required: true, placeholder: 'e.g. Smart Phones, Menswear' },
      { key: 'Category_Name', label: 'Category', placeholder: 'Select or enter category' },
    ],
  },
  'product-item': {
    title: 'Product Items',
    subtitle: 'Manage inventory products, pricing, stock levels, and SKU details',
    category: 'Product Management',
    actionLabel: 'Add Product',
    crudEndpoint: '/user/SalesProductMasterCRUD/',
    request: (page, search) => ({
      endpoint: `/user/SalesProductMasterAdditional/?Is_Deleted=False&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: ShoppingBag,
    idField: 'id',
    nameField: 'Product_Name',
    statusField: 'Is_Active',
    formFields: [
      { key: 'Product_Name', label: 'Product Name', required: true, placeholder: 'e.g. iPhone 15 Pro, Nike Air Max' },
      { key: 'Product_Categry_Name', label: 'Category', placeholder: 'Product Category' },
      { key: 'Price', label: 'Price (₹)', type: 'number', placeholder: '0.00' },
      { key: 'Opening_Balance', label: 'Initial Stock', type: 'number', placeholder: '0' },
    ],
    customFormComponent: ProductItemCustomForm,
  },
  supplier: {
    title: 'Suppliers',
    subtitle: 'Maintain supplier vendor contacts, procurement, and address details',
    category: 'Product Management',
    actionLabel: 'Add Supplier',
    crudEndpoint: '/user/SupplierCRUD/',
    request: (page, search) => ({
      endpoint: `/user/SupplierAdditional/?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: Truck,
    idField: 'id',
    nameField: 'Company_Name',
    formFields: [
      { key: 'Company_Name', label: 'Company Name', required: true, placeholder: 'Supplier Company Name' },
      { key: 'ContactPerson_FirstName', label: 'First Name', placeholder: 'Contact First Name' },
      { key: 'ContactPerson_LastName', label: 'Last Name', placeholder: 'Contact Last Name' },
      { key: 'Mobile_No', label: 'Phone Number', placeholder: '+91 9876543210' },
      { key: 'Email_Id', label: 'Email Address', placeholder: 'vendor@company.com' },
    ],
  },
  store: {
    title: 'Store Management',
    subtitle: 'Create and manage retail store locations, managers, and product stock parameters',
    category: 'Store Management',
    actionLabel: 'Create Store',
    crudEndpoint: '/user/StoreMasterCRUD/',
    updateEndpointFormat: 'none',
    request: (page, search) => ({
      endpoint: `/user/StoreMasterAdditional/?Is_Deleted=False&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: Store,
    idField: 'id',
    nameField: 'Store_Name',
    statusField: 'Active_Status',
    formFields: [
      { key: 'Store_Name', label: 'Store Name', required: true, placeholder: 'e.g. Downtown Flagship, Mall Branch' },
      { key: 'Store_Inchange', label: 'Store Manager / In-Charge', placeholder: 'Manager Name' },
      { key: 'Building_Name', label: 'Building / Suite Name', placeholder: 'Building or Complex Name' },
      { key: 'Country', label: 'Country', placeholder: 'e.g. India' },
      { key: 'State', label: 'State', placeholder: 'e.g. Maharashtra' },
      { key: 'City', label: 'City', placeholder: 'e.g. Mumbai' },
      { key: 'Location', label: 'Location / Address', required: true, placeholder: 'City or Address' },
      { key: 'Contact_No', label: 'Contact Phone', placeholder: '+91 9876543210' },
      {
        key: 'Active_Status', label: 'Status', type: 'select', options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ]
      },
    ],
  },
  counter: {
    title: 'Counter Management',
    subtitle: 'Configure billing & sales counters across your store locations',
    category: 'Store Management',
    actionLabel: 'Add Counter',
    crudEndpoint: '/user/CounterMasterCRUD/',
    updateEndpointFormat: 'query',
    request: (page, search) => ({
      endpoint: `/user/CounterMasterlist/?page=${page}&page_size=10${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: SlidersHorizontal,
    idField: 'id',
    nameField: 'Counter_Name',
    statusField: 'Status',
    formFields: [
      { key: 'Counter_Name', label: 'Counter Name / Code', required: true, placeholder: 'e.g. Counter 1, Express POS' },
      { key: 'Store_Name', label: 'Store Name', placeholder: 'Assigned Store' },
      { key: 'Counter_Incharge', label: 'Assigned User', placeholder: 'Counter Cashier / User' },
      {
        key: 'Status', label: 'Status', type: 'select', options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ]
      },
    ],
  },
  'store-employees': {
    title: 'Store Employees',
    subtitle: 'Assign employees to stores and manage role responsibilities',
    category: 'Store Management',
    actionLabel: 'New Assignment',
    crudEndpoint: '/user/StoreemployeeCRUD/',
    request: (page, search) => ({
      endpoint: `/user/StoreemployeeList/?page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: Users,
    idField: 'id',
    nameField: 'Employees',
    statusField: 'Active_Status',
    formFields: [
      { key: 'Employees', label: 'Employee Name', required: true, placeholder: 'Staff Member Name' },
      { key: 'Store_Name', label: 'Assigned Store', required: true, placeholder: 'Store Location' },
      { key: 'Designation', label: 'Designation / Role', placeholder: 'e.g. Sales Associate, Supervisor' },
      {
        key: 'Active_Status', label: 'Status', type: 'select', options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ]
      },
    ],
  },
  'product-inward': {
    title: 'Product Inward',
    subtitle: 'Record, verify, and track inbound stock inventory received from suppliers',
    category: 'Store Management',
    actionLabel: 'Record Inward',
    crudEndpoint: '/user/ProductInwardCRUD/',
    request: (page, search) => ({
      endpoint: `/user/ProductInwardAdditional/?Is_Deleted=False&page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: Boxes,
    idField: 'id',
    nameField: 'ProductInward_Id',
    formFields: [
      { key: 'GI_No', label: 'GI/Dispatch No', required: true, placeholder: 'GI / Dispatch Number' },
      { key: 'GI_Date', label: 'GI Date', type: 'date', required: true },
      { key: 'Store_Name', label: 'Receiving Store', required: true, placeholder: 'Store Name' },
      { key: 'Supplier_Name', label: 'Supplier', required: true, placeholder: 'Supplier Name' },
      { key: 'Inward_Source', label: 'Source Ref / Invoice', placeholder: 'PO / Invoice Number' },
    ],
  },
  'product-tracking': {
    title: 'Product & Store Stocks',
    subtitle: 'Review real-time stock balances, inventory valuation, and sales velocity',
    category: 'Store Management',
    actionLabel: 'Export Stock',
    request: () => ({
      endpoint: '/user/RetailProductStorePerformance/',
      options: {
        method: 'POST',
        body: JSON.stringify({
          FromDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().slice(0, 10),
          ToDate: new Date().toISOString().slice(0, 10),
        }),
      },
    }),
    icon: Layers,
    idField: 'ProductName',
    nameField: 'ProductName',
    formFields: [],
  },
  'store-adjustment': {
    title: 'Store Adjustments',
    subtitle: 'Review, approve, and manage inventory corrections and stock reconciliation',
    category: 'Store Management',
    actionLabel: 'Create Adjustment',
    crudEndpoint: '/user/StoreAdjustmentCRUD/',
    request: (page, search) => ({
      endpoint: `/user/StoreAdjustmentAdditional/?Is_Deleted=False&page=${page}&limit=10${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: SlidersHorizontal,
    idField: 'id',
    nameField: 'Reference_No',
    statusField: 'Adjustment_Status',
    formFields: [
      { key: 'Reference_No', label: 'Reference No.', required: true, placeholder: 'ADJ-2026-001' },
      { key: 'Store_Name', label: 'Store Name', required: true, placeholder: 'Store Location' },
      {
        key: 'Adjustment_Status', label: 'Status', type: 'select', options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ]
      },
      { key: 'Notes', label: 'Adjustment Notes', type: 'textarea', placeholder: 'Reason for stock adjustment...' },
    ],
  },
  'return-management': {
    title: 'Return Management',
    subtitle: 'Process customer product returns',
    category: 'Store Management',
    actionLabel: 'Create Return',
    crudEndpoint: '/user/ReturnItemsCRUD/',
    updateEndpointFormat: 'none',
    request: (page, search) => ({
      endpoint: `/user/ReturnItemslistwithPagination/?page=${page}&page_size=10${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: RefreshCw,
    idField: 'id',
    nameField: 'Return_Number',
    statusField: 'Status',
    formFields: [
      { key: 'Return_Number', label: 'Return Number', placeholder: 'RET-2026-001 (Auto-generated)' },
      { key: 'Sales_Order_Id', label: 'Sales Order ID', required: true, placeholder: 'Order Number' },
      { key: 'Customer_Name', label: 'Customer Name', placeholder: 'Customer Name' },
      {
        key: 'Return_Reason', label: 'Return Reason', required: true, type: 'select', options: [
          { label: 'Defective product', value: 'Defective product' },
          { label: 'Wrong item received', value: 'Wrong item received' },
          { label: 'Size issue', value: 'Size issue' },
          { label: 'Not as described', value: 'Not as described' },
          { label: 'Damaged during shipping', value: 'Damaged during shipping' },
          { label: 'Changed mind', value: 'Changed mind' },
          { label: 'Other', value: 'Other' },
        ]
      },
      {
        key: 'Condition_Status', label: 'Item Condition', type: 'select', options: [
          { label: 'Good', value: 'Good' },
          { label: 'Damaged', value: 'Damaged' },
          { label: 'Opened', value: 'Opened' },
          { label: 'Used', value: 'Used' },
        ]
      },
      {
        key: 'Status', label: 'Processing Status', type: 'select', options: [
          { label: 'Initiated', value: 'Initiated' },
          { label: 'Processing', value: 'Processing' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Rejected', value: 'Rejected' },
          { label: 'Completed', value: 'Completed' },
        ]
      },
      { key: 'Comments', label: 'Comments / Notes', type: 'textarea', placeholder: 'Additional details...' },
    ],
  },
  'replacement-management': {
    title: 'Replacement Management',
    subtitle: 'Manage product exchanges and replacement tracking',
    category: 'Store Management',
    actionLabel: 'New Replacement',
    crudEndpoint: '/user/ReplacementCRUD/',
    request: (page, search) => ({
      endpoint: `/user/ReplacementList/?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: RefreshCw,
    idField: 'id',
    nameField: 'Replacement_Number',
    statusField: 'Status',
    formFields: [
      { key: 'Replacement_Number', label: 'Replacement ID', placeholder: 'Auto-generated' },
      { key: 'Return_Item_Id', label: 'Return Item Ref', required: true, placeholder: 'RIT-xxx' },
      { key: 'Sales_Order_Id', label: 'Original Order', required: true, placeholder: 'Order Number' },
      { key: 'Customer_Name', label: 'Customer Name', placeholder: 'Customer Name' },
      { key: 'Replacement_Product', label: 'Replacement Product', required: true, placeholder: 'Product Name / SKU' },
      { key: 'Tracking_Number', label: 'Shipping Tracking #', placeholder: 'Tracking code' },
      {
        key: 'Status', label: 'Status', type: 'select', options: [
          { label: 'Pending', value: 'Pending' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Shipped', value: 'Shipped' },
          { label: 'Delivered', value: 'Delivered' },
          { label: 'Rejected', value: 'Rejected' },
        ]
      },
    ],
  },
  'refund-management': {
    title: 'Refund Management',
    subtitle: 'Process and track customer refund transactions',
    category: 'Store Management',
    actionLabel: 'Process Refund',
    crudEndpoint: '/user/RefundCRUD/',
    updateEndpointFormat: 'none',
    request: (page, search) => ({
      endpoint: `/user/RefundList/?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: RefreshCw,
    idField: 'id',
    nameField: 'Refund_Number',
    statusField: 'Status',
    formFields: [
      { key: 'Refund_Number', label: 'Refund ID', placeholder: 'Auto-generated' },
      { key: 'Return_Item_Id', label: 'Return Item Ref', required: true, placeholder: 'RIT-xxx' },
      { key: 'Customer_Name', label: 'Customer Name', placeholder: 'Customer Name' },
      { key: 'Refund_Amount', label: 'Refund Amount (₹)', required: true, type: 'number', placeholder: '0.00' },
      {
        key: 'Payment_Method', label: 'Payment Method', type: 'select', options: [
          { label: 'Original Payment Method', value: 'Original' },
          { label: 'Store Credit', value: 'Credit' },
          { label: 'Bank Transfer', value: 'Bank Transfer' },
        ]
      },
      { key: 'Transaction_Id', label: 'Transaction ID', placeholder: 'Bank or gateway TXN id' },
      {
        key: 'Status', label: 'Status', type: 'select', options: [
          { label: 'Initiated', value: 'Initiated' },
          { label: 'Pending', value: 'Pending' },
          { label: 'Processing', value: 'Processing' },
          { label: 'Completed', value: 'Completed' },
          { label: 'Failed', value: 'Failed' },
        ]
      },
      {
        key: 'Approval_Status', label: 'Approval', type: 'select', options: [
          { label: 'Pending', value: 'Pending' },
          { label: 'Approved', value: 'Approved' },
          { label: 'Rejected', value: 'Rejected' },
        ]
      },
    ],
  },
  'refund-policy': {
    title: 'Refund Policy',
    subtitle: 'Configure return and refund policies for the store',
    category: 'Store Management',
    actionLabel: 'Add Policy',
    crudEndpoint: '/user/ReturnPoliciesCRUD/',
    request: (page, search) => ({
      endpoint: `/user/ReturnPolicieslist/?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`
    }),
    icon: RefreshCw,
    idField: 'id',
    nameField: 'Policy_Name',
    statusField: 'Is_Active',
    formFields: [
      { key: 'Policy_Name', label: 'Policy Name', required: true, placeholder: 'e.g. Standard 30 Days' },
      { key: 'Return_Days_Limit', label: 'Valid Days', required: true, type: 'number', placeholder: '30' },
      { key: 'Restocking_Fee_Percent', label: 'Restocking Fee (%)', type: 'number', placeholder: '0.00' },
      {
        key: 'Refund_Type', label: 'Refund Type', type: 'select', options: [
          { label: 'Any', value: 'Any' },
          { label: 'Cash', value: 'Cash' },
          { label: 'Store Credit', value: 'Store Credit' },
          { label: 'Original Payment Method', value: 'Original Payment Method' },
        ]
      },
      { key: 'Category_Name', label: 'Category', placeholder: 'e.g. Electronics' },
      { key: 'Product_Name', label: 'Product', placeholder: 'e.g. Dell Laptop' },
      { key: 'Rules', label: 'Rules', type: 'textarea', placeholder: 'Enter rules separated by commas' },
      {
        key: 'Is_Active', label: 'Status', type: 'select', options: [
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ]
      },
      { key: 'Description', label: 'Description', type: 'textarea', placeholder: 'Policy details...' },
    ],
  },
};

function getRows(response: any): StoreRow[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.Data)) return response.Data;
  return [];
}

function getTotal(response: any, rows: StoreRow[]) {
  return response?.count ?? response?.total ?? response?.totalCount ?? response?.data?.count ?? rows.length;
}

function getRowStatus(row: StoreRow): string {
  const val = row.Active_Status ?? row.Is_Active ?? row.Adjustment_Status ?? row.Status ?? row.status;
  if (val !== undefined && val !== null && val !== '') {
    return String(val).toLowerCase();
  }
  return row.Active_Status === false ? 'inactive' : 'active';
}

const ModuleStatCard = ({ title, value, icon: Icon, color, isGood = true }: { title: string, value: string | number, icon: any, color: string, isGood?: boolean }) => {
  return (
    <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white dark:bg-slate-950 hover:shadow-md transition-all">
      <CardContent className="p-4 flex items-center justify-between gap-3 h-full">
        <div className="flex flex-col justify-center h-full min-w-0 py-1">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-snug line-clamp-1">{title}</p>
          <div className="mt-2 mb-2">
            <h3 className="text-2xl lg:text-[28px] font-bold text-slate-900 dark:text-white leading-none truncate">
              {value}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 mt-auto">
            {isGood ? (
              <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 shrink-0 text-rose-500" />
            )}
            <span className={`text-[11px] sm:text-xs font-medium whitespace-nowrap ${isGood ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
              {isGood ? 'Optimal status' : 'Needs attention'}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center justify-center">
          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${color}`}>
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function StoreModulePage({ module }: { module: StoreModule }) {
  if (module === 'store-employees') {
    return <StoreEmployeeAssignment />;
  }

  const config = moduleConfig[module];
  const Icon = config.icon;
  const { primaryColor } = useGlobalStore();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<string>('All Records');

  // Store Products dynamic table rows
  const [productRows, setProductRows] = useState<StoreProductRow[]>([
    { Product_Id: '', Product_Name: '', UOM: '', Opening_Balance: '', Reorder_Level: '', Min_Stock_Level: '' }
  ]);

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<any>(null);

  const [activeRow, setActiveRow] = useState<StoreRow | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk'>('single');
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline editing state for refund-policy
  const [editingField, setEditingField] = useState<{ rowId: string | number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<any>(null);

  // Fetch product master list for store product selection dropdown
  const { data: productMasterData } = useQuery({
    queryKey: ['product-master-list'],
    queryFn: () => fetchFromApi('/user/SalesProductMasterAdditional/?Is_Deleted=False&page_size=100'),
    enabled: module === 'store',
    staleTime: 5 * 60_000,
  });

  const productList = useMemo(() => getRows(productMasterData), [productMasterData]);

  // Fetch users for mapping IDs to names (e.g., Received_By)
  const { data: usersData } = useQuery({
    queryKey: ['users-list-for-mapping'],
    queryFn: () => fetchFromApi('/useradmin/UsersList/?page_size=1000'),
    enabled: module === 'product-inward' || module === 'store',
    staleTime: 5 * 60_000,
  });

  const usersList = useMemo(() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData;
    if (usersData.data && Array.isArray(usersData.data)) return usersData.data;
    if (usersData.results && Array.isArray(usersData.results)) return usersData.results;
    return getRows(usersData) || [];
  }, [usersData]);

  const getUserName = (userId: any) => {
    if (!userId) return '-';
    const user = usersList.find((u: any) =>
      String(u.id) === String(userId) ||
      String(u.UserId) === String(userId) ||
      String(u.pk) === String(userId)
    );
    if (user) {
      return user.first_name || user.username || user.Participant_Name || user.name || userId;
    }
    return userId;
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
  }, [viewMode, statusFilter, debouncedSearchQuery, module]);

  // Main Query
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['store-module-page', module, currentPage, debouncedSearchQuery, statusFilter],
    queryFn: async () => {
      const req = config.request(currentPage, debouncedSearchQuery, statusFilter);
      return fetchFromApi(req.endpoint, req.options);
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const rawRows = useMemo(() => getRows(data), [data]);

  // Filter rows both server-side and robust client-side search fallback
  const rows = useMemo(() => {
    let result = rawRows;

    // Search query text filtering across all string/number fields
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(row => {
        return Object.entries(row).some(([k, val]) => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Status Filter (for return-management, filter by exact Status field)
    if (statusFilter !== 'All') {
      result = result.filter(row => {
        if (module === 'return-management' || module === 'replacement-management' || module === 'refund-management') {
          const workflowStatus = row.Status || row.Refund_Status || row.Replacement_Status || row.status || '';
          return String(workflowStatus).toLowerCase() === statusFilter.toLowerCase();
        }
        const val = getRowStatus(row);
        return val === statusFilter.toLowerCase() || (statusFilter === 'Active' && (val === 'true' || val === '1' || val === 'active' || val === 'approved'));
      });
    }

    // View Mode Filter
    if (viewMode === 'Active Items' && !['return-management', 'replacement-management', 'refund-management'].includes(module)) {
      result = result.filter(row => {
        const val = getRowStatus(row);
        return val === 'true' || val === '1' || val === 'active' || val === 'approved';
      });
    }

    return result;
  }, [rawRows, debouncedSearchQuery, statusFilter, viewMode, module]);

  const totalRecords = debouncedSearchQuery.trim() ? rows.length : getTotal(data, rawRows);

  // Store Products Dynamic Table Handlers
  const handleAddProductRow = () => {
    setProductRows(prev => [
      ...prev,
      { Product_Id: '', Product_Name: '', UOM: '', Opening_Balance: '', Reorder_Level: '', Min_Stock_Level: '' }
    ]);
  };

  const handleRemoveProductRow = (index: number) => {
    setProductRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleProductRowChange = (index: number, field: keyof StoreProductRow, value: any) => {
    setProductRows(prev => prev.map((row, idx) => idx === index ? { ...row, [field]: value } : row));
  };

  const handleSelectProductForRow = (index: number, selectedProductId: string | null) => {
    if (!selectedProductId) return;
    const selectedProd = productList.find(p => String(p.id || p.Product_Id) === selectedProductId);
    if (!selectedProd) return;
    setProductRows(prev => prev.map((row, idx) => {
      if (idx === index) {
        return {
          ...row,
          Product_Id: selectedProd.id || selectedProd.Product_Id || selectedProductId,
          Product_Name: selectedProd.Product_Name || selectedProd.name || '',
          UOM: selectedProd.UOM || selectedProd.Uom || selectedProd.Unit || 'PCS',
          Opening_Balance: selectedProd.Opening_Balance ?? row.Opening_Balance ?? '',
          Reorder_Level: selectedProd.Reorder_Level ?? row.Reorder_Level ?? '',
          Min_Stock_Level: selectedProd.Min_Stock_Level ?? row.Min_Stock_Level ?? ''
        };
      }
      return row;
    }));
  };

  // Handlers
  const handleOpenCreate = () => {
    setFormData({});
    setProductRows([{ Product_Id: '', Product_Name: '', UOM: '', Opening_Balance: '', Reorder_Level: '', Min_Stock_Level: '' }]);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (row: StoreRow) => {
    if (!config.crudEndpoint) {
      toast.error('Edit functionality is not available for this module.');
      return;
    }
    setActiveRow(row);
    setFormData({ ...row });
    if (module === 'store') {
      const existingItems = row.Store_Items || row.items || row.Products || [];
      if (Array.isArray(existingItems) && existingItems.length > 0) {
        setProductRows(existingItems.map((item: any) => ({
          Product_Id: item.Product_Id || item.id || '',
          Product_Name: item.Product_Name || item.name || '',
          UOM: item.UOM || item.Uom || 'PCS',
          Opening_Balance: item.Opening_Balance ?? '',
          Reorder_Level: item.Reorder_Level ?? '',
          Min_Stock_Level: item.Min_Stock_Level ?? ''
        })));
      } else {
        setProductRows([{ Product_Id: '', Product_Name: '', UOM: '', Opening_Balance: '', Reorder_Level: '', Min_Stock_Level: '' }]);
      }
    }
    setIsEditOpen(true);
  };

  const handleOpenDetails = (row: StoreRow) => {
    setActiveRow(row);
    setIsDetailsOpen(true);
  };

  const handleOpenSingleDelete = (row: StoreRow) => {
    setActiveRow(row);
    setDeleteMode('single');
    setIsDeleteOpen(true);
  };

  const handleOpenBulkDelete = () => {
    if (selectedRows.length === 0) return;
    setDeleteMode('bulk');
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent, isEdit = false) => {
    e.preventDefault();
    if (!config.crudEndpoint) {
      toast.info('Create/Edit is not supported for this module endpoint.');
      return;
    }
    setIsSubmitting(true);
    try {
      let payload: Record<string, any> = isEdit && activeRow ? { ...activeRow, ...formData } : { ...formData };
      if (payload.Active_Status !== undefined) {
        payload.Active_Status = payload.Active_Status === 'true' || payload.Active_Status === true;
      }
      if (module === 'store') {
        const items = productRows.filter(p => p.Product_Id || p.Product_Name);
        if (items.length > 0) {
          payload.Store_Items = items;
        } else {
          delete payload.Store_Items;
        }
      }

      // Inject required fields for CRUD operations
      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('userId');
        const orgId = localStorage.getItem('Organization_Id') || localStorage.getItem('orgDetail');

        if (userId) {
          if (!isEdit) payload.Created_By = userId;
          payload.Updated_By = userId;
        }
        if (orgId) {
          payload.Organization_Id = orgId;
        }
      }

      // Generic sanitizer: Flatten nested object foreign keys to their raw ID for DRF compatibility
      if (isEdit) {
        Object.keys(payload).forEach(key => {
          if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
            if ('id' in payload[key]) {
              payload[key] = payload[key].id;
            } else if ('UserId' in payload[key]) {
              payload[key] = payload[key].UserId;
            } else if ('pk' in payload[key]) {
              payload[key] = payload[key].pk;
            }
          }
        });
      }

      const recordId = activeRow?.[config.idField] || activeRow?.id;
      if (isEdit && !recordId) {
        throw new Error('Record ID not found for update.');
      }

      const updateEndpoint = config.updateEndpointFormat === 'query'
        ? `${config.crudEndpoint}?id=${recordId}`
        : config.updateEndpointFormat === 'none'
          ? config.crudEndpoint
          : `${config.crudEndpoint}${recordId}/`;

      await fetchFromApi(isEdit ? updateEndpoint : config.crudEndpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      toast.success(`${config.title} record ${isEdit ? 'updated' : 'created'} successfully!`);
      setIsCreateOpen(false);
      setIsEditOpen(false);
      setFormData({});
      queryClient.invalidateQueries({ queryKey: ['store-module-page', module] });
      // Also invalidate any specific query keys for this module
      queryClient.invalidateQueries({ queryKey: ['store-module-page'] });
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err?.message || `Failed to ${isEdit ? 'update' : 'create'} record.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (config.crudEndpoint) {
        const delPath = config.deleteEndpointFormat === 'path'
          ? (id: any) => `${config.crudEndpoint}${id}/`
          : (id: any) => `${config.crudEndpoint}?id=${id}`;

        if (deleteMode === 'single' && activeRow) {
          const id = activeRow[config.idField] || activeRow.id;
          await fetchFromApi(delPath(id), { method: 'DELETE' });
          toast.success('Record deleted successfully.');
        } else if (deleteMode === 'bulk' && selectedRows.length > 0) {
          await Promise.all(selectedRows.map(id => fetchFromApi(delPath(id), { method: 'DELETE' })));
          toast.success(`Deleted ${selectedRows.length} records successfully.`);
        }
      } else {
        toast.info('Delete API not configured for this module.');
      }
      setSelectedRows([]);
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['store-module-page', module] });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete record(s).');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInlineEditSave = async (row: StoreRow, field: string, value: any) => {
    if (!config.crudEndpoint) {
      toast.error('Edit is not supported for this module endpoint.');
      return;
    }

    const id = row[config.idField] || row.id;
    if (!id) {
      toast.error('Record ID not found');
      return;
    }

    console.log('Inline edit save:', { module, id, field, value, row });

    try {
      const payload: Record<string, any> = { ...row, [field]: value };

      // Inject required fields for CRUD operations
      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('userId');
        const orgId = localStorage.getItem('Organization_Id') || localStorage.getItem('orgDetail');

        if (userId) {
          payload.Updated_By = userId;
        }
        if (orgId) {
          payload.Organization_Id = orgId;
        }
      }

      // Flatten nested object foreign keys to their raw ID for DRF compatibility
      Object.keys(payload).forEach(key => {
        if (payload[key] && typeof payload[key] === 'object' && !Array.isArray(payload[key])) {
          if ('id' in payload[key]) {
            payload[key] = payload[key].id;
          } else if ('UserId' in payload[key]) {
            payload[key] = payload[key].UserId;
          } else if ('pk' in payload[key]) {
            payload[key] = payload[key].pk;
          }
        }
      });

      console.log('Sending payload:', payload);
      const updateEndpoint = config.updateEndpointFormat === 'query'
        ? `${config.crudEndpoint}?id=${id}`
        : config.updateEndpointFormat === 'none'
          ? config.crudEndpoint
          : `${config.crudEndpoint}${id}/`;
      console.log('API endpoint:', updateEndpoint);

      const result = await fetchFromApi(updateEndpoint, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      console.log('API response:', result);

      toast.success('Field updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['store-module-page', module] });
      queryClient.invalidateQueries({ queryKey: ['store-module-page'] });
    } catch (err: any) {
      console.error('Inline edit save error:', err);
      console.error('Error details:', JSON.stringify(err, null, 2));
      if (err?.message?.includes('404') || err?.message?.includes('not found')) {
        toast.error('Update endpoint not available (404). Please use the Edit button in the Actions menu.');
      } else {
        toast.error(`Failed to update field: ${err?.message || 'Unknown error'}`);
      }
    }
  };

  const handleExportCSV = () => {
    if (rows.length === 0) {
      toast.info('No data available to export');
      return;
    }
    const sample = rows[0];
    const keys = Object.keys(sample).filter(k => typeof sample[k] !== 'object');
    const csvContent = [
      keys.join(','),
      ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replaceAll('"', '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} records to CSV!`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(rows.map((r, i) => String(r[config.idField] || r.id || i)));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(item => item !== id));
    }
  };

  // Helper avatar styling matching Leads section
  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/30',
      'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30',
      'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/30',
      'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/30',
      'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30',
      'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30',
      'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/30',
      'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900/30'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getStatusBadge = (row: StoreRow) => {
    const status = getRowStatus(row);

    if (status === 'true' || status === '1' || status === 'active' || status === 'approved') {
      return (
        <Badge variant="outline" className="rounded-md font-semibold text-[10px] lg:text-xs py-0.5 px-2 lg:px-2.5 whitespace-nowrap bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30">
          Active
        </Badge>
      );
    }
    if (status === 'pending') {
      return (
        <Badge variant="outline" className="rounded-md font-semibold text-[10px] lg:text-xs py-0.5 px-2 lg:px-2.5 whitespace-nowrap bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30">
          Pending
        </Badge>
      );
    }
    if (status === 'rejected') {
      return (
        <Badge variant="outline" className="rounded-md font-semibold text-[10px] lg:text-xs py-0.5 px-2 lg:px-2.5 whitespace-nowrap bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30">
          Rejected
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="rounded-md font-semibold text-[10px] lg:text-xs py-0.5 px-2 lg:px-2.5 whitespace-nowrap bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400">
        Inactive
      </Badge>
    );
  };

  // Dynamic Columns Configuration per Module
  const tableColumns = useMemo<ColumnConfig<StoreRow>[]>(() => {
    const checkHeader = (
      <Checkbox
        checked={rows.length > 0 && selectedRows.length === rows.length}
        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
      />
    );

    const checkCol: ColumnConfig<StoreRow> = {
      key: 'select_col',
      header: checkHeader as any,
      className: 'w-10 text-center',
      render: (row, index) => {
        const idStr = String(row[config.idField] || row.id || index);
        return (
          <Checkbox
            checked={selectedRows.includes(idStr)}
            onCheckedChange={(checked) => handleSelectRow(idStr, Boolean(checked))}
          />
        );
      }
    };

    let moduleSpecificCols: ColumnConfig<StoreRow>[] = [];

    if (module === 'store') {
      moduleSpecificCols = [
        {
          key: 'Created_Date',
          header: 'Date',
          className: 'w-[120px]',
          render: (row) => {
            const dt = row.Created_Date || row.GI_Date || row.Date;
            return dt ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{new Date(dt).toLocaleDateString()}</span>
              </div>
            ) : <span className="text-xs text-slate-400">-</span>;
          }
        },
        {
          key: 'Store_Id',
          header: 'Store ID',
          className: 'w-[120px]',
          render: (row) => <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{String(row.Store_Id || row.id || '-')}</span>
        },
        {
          key: 'Store_Name',
          header: 'Store Name',
          className: 'w-[200px]',
          render: (row) => {
            const name = row.Store_Name || row.name || 'Unnamed Store';
            return (
              <div className="flex flex-col">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger render={
                      <button type="button" onClick={() => handleOpenDetails(row)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline block truncate text-left cursor-pointer">
                        {name}
                      </button>
                    } />
                    <TooltipContent side="top" className="bg-slate-900 text-white dark:bg-slate-955 dark:text-slate-100 border border-slate-800 text-xs px-2.5 py-1">
                      {name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          }
        },
        {
          key: 'Store_Inchange',
          header: 'Store Inchange',
          className: 'w-[150px]',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate block">{row.Store_Inchange || row.manager || 'Unassigned'}</span>
            </div>
          )
        },
        {
          key: 'Location',
          header: 'Location',
          className: 'w-[180px]',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate block">{row.Location || row.City || '-'}</span>
            </div>
          )
        },
        {
          key: 'State',
          header: 'State',
          className: 'w-[100px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate block">{row.State || '-'}</span>
        }
      ];
    } else if (module === 'supplier') {
      moduleSpecificCols = [
        {
          key: 'Company_Name',
          header: 'Company / Vendor',
          className: 'min-w-[220px]',
          render: (row) => {
            const company = row.Company_Name || 'Supplier';
            return (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`h-7 w-7 lg:h-7.5 lg:w-7.5 rounded-full flex items-center justify-center font-bold text-[10px] lg:text-xs shrink-0 ${getAvatarColor(company)}`}>
                  {getInitials(company)}
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={
                        <button type="button" onClick={() => handleOpenDetails(row)} className="text-xs lg:text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline block truncate text-left cursor-pointer">
                          {company}
                        </button>
                      } />
                      <TooltipContent side="top" className="bg-slate-900 text-white border border-slate-800 text-xs px-2.5 py-1">
                        {company}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-[11px] text-slate-400 font-mono">ID: {row.id || '-'}</span>
                </div>
              </div>
            );
          }
        },
        {
          key: 'contact',
          header: 'Contact Person',
          render: (row) => {
            const name = `${row.ContactPerson_FirstName || ''} ${row.ContactPerson_LastName || ''}`.trim() || '-';
            return <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{name}</span>;
          }
        },
        { key: 'Mobile_No', header: 'Phone', render: (row) => <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{row.Mobile_No || '-'}</span> },
        { key: 'Email_Id', header: 'Email', render: (row) => <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{row.Email_Id || '-'}</span> }
      ];
    } else if (module === 'product-item') {
      moduleSpecificCols = [
        {
          key: 'Product_Name',
          header: 'Product Name',
          className: 'min-w-[200px]',
          render: (row) => {
            const name = row.Product_Name || 'Product';
            return (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`h-7 w-7 lg:h-7.5 lg:w-7.5 rounded-full flex items-center justify-center font-bold text-[10px] lg:text-xs shrink-0 ${getAvatarColor(name)}`}>
                  {getInitials(name)}
                </div>
                <div className="min-w-0 flex-1 truncate">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger render={
                        <button type="button" onClick={() => handleOpenDetails(row)} className="text-xs lg:text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline block truncate text-left cursor-pointer">
                          {name}
                        </button>
                      } />
                      <TooltipContent side="top" className="bg-slate-900 text-white border border-slate-800 text-xs px-2.5 py-1">
                        {name}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-[11px] text-slate-400 font-mono">SKU: {row.SKU_Code || row.id || '-'}</span>
                </div>
              </div>
            );
          }
        },
        { key: 'Product_Categry_Name', header: 'Category', render: (row) => <Badge variant="secondary" className="text-[10px] font-semibold">{row.Product_Categry_Name || '-'}</Badge> },
        {
          key: 'Price',
          header: 'Price',
          render: (row) => {
            const val = Number(row.Price || 0);
            return <span className="text-xs font-bold text-slate-900 dark:text-white">₹{val.toFixed(2)}</span>;
          }
        },
        { key: 'Opening_Balance', header: 'Stock Balance', render: (row) => <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{row.Opening_Balance ?? 0} units</span> },
        { key: 'status', header: 'Status', render: getStatusBadge }
      ];
    } else if (module === 'product-tracking') {
      moduleSpecificCols = [
        { key: 'ProductName', header: 'Product Name', render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{row.ProductName || '-'}</span> },
        { key: 'StoreName', header: 'Store', render: (row) => <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{row.StoreName || '-'}</span> },
        { key: 'OpeningStock', header: 'Opening Stock', render: (row) => <span className="text-xs font-medium">{row.OpeningStock ?? 0}</span> },
        { key: 'CurrentStock', header: 'Current Stock', render: (row) => <Badge variant="outline" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20 font-bold">{row.CurrentStock ?? 0}</Badge> },
        { key: 'Revenue', header: 'Total Value', render: (row) => <span className="text-xs font-bold text-emerald-600">₹{Number(row.Revenue || 0).toLocaleString()}</span> }
      ];
    } else if (module === 'product-inward') {
      moduleSpecificCols = [
        {
          key: 'ProductInward_Id',
          header: 'Product Inward Id',
          className: 'min-w-[150px]',
          render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{String(row.ProductInward_Id || row.id || '-')}</span>
        },
        {
          key: 'GI_No',
          header: 'GI/Dispatch No',
          render: (row) => <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{String(row.GI_No || row.Dispatch_No || '-')}</span>
        },
        {
          key: 'GI_Date',
          header: 'GI Date',
          render: (row) => {
            const dt = row.GI_Date;
            return <span className="text-xs text-slate-500">{dt ? new Date(dt).toLocaleDateString() : '-'}</span>;
          }
        },
        {
          key: 'Inward_Source',
          header: 'Inward Source',
          render: (row) => <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{String(row.Inward_Source || '-')}</span>
        },
        {
          key: 'Supplier_Name',
          header: 'Supplier/Factory Name',
          className: 'min-w-[200px]',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <span className="truncate max-w-[180px]">{String(row.Supplier_Name || row.Factory_Name || '-')}</span>
            </div>
          )
        },
        {
          key: 'Store_Name',
          header: 'Store Name',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <span className="truncate max-w-[150px]">{String(row.Store_Name || '-')}</span>
            </div>
          )
        },
        {
          key: 'Received_By',
          header: 'Received By',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <span className="truncate max-w-[150px]">{String(getUserName(row.Received_By) || row.received_by || '-')}</span>
            </div>
          )
        }
      ];
    } else if (module === 'store-adjustment') {
      moduleSpecificCols = [
        {
          key: 'Reference_No',
          header: 'Reference',
          className: 'min-w-[150px]',
          render: (row) => (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{String(row.Reference_No || row.id || '-')}</span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {String(row.id || '-')}</span>
            </div>
          )
        },
        {
          key: 'Store_Id',
          header: 'Store',
          render: (row) => (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Store_Id?.Store_Name || row.Store_Name || '-')}</span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">Code: {String(row.Store_Id?.Store_Id || row.Store_Id || row.Store_Code || '-')}</span>
            </div>
          )
        },
        {
          key: 'Created_Date',
          header: 'Date',
          render: (row) => {
            const dt = row.Adjustment_Date || row.Created_Date || row.Date;
            return <span className="text-xs text-slate-500">{dt ? new Date(dt).toLocaleDateString() : '-'}</span>;
          }
        },
        { key: 'status', header: 'Status', render: (row) => getStatusBadge(row) },
        {
          key: 'Total_Items',
          header: 'Items',
          render: (row) => <span className="text-xs font-medium">{String(row.Total_Items || row.Items?.length || 0)}</span>
        },
        {
          key: 'Total_Value',
          header: 'Value Impact',
          render: (row) => {
            const val = Number(row.Total_Value || 0);
            const isPositive = val > 0;
            const isNegative = val < 0;

            return (
              <div className="flex items-center gap-0.5">
                {isPositive && <TrendingUp className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                {isNegative && <TrendingDown className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
                <span className={`text-xs font-bold ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-500'}`}>
                  {Math.abs(val).toFixed(2)}
                  {isPositive && " +"}
                  {isNegative && " -"}
                </span>
              </div>
            );
          }
        },
        {
          key: 'Prepared_By',
          header: 'Prepared By',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Prepared_By || '-')}</span>
        }
      ];
    } else if (module === 'product-category') {
      moduleSpecificCols = [
        {
          key: 'ProductCategory_Id',
          header: 'Product Category ID',
          className: 'min-w-[150px]',
          render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{String(row.ProductCategory_Id || row.Category_Code || row.id || '-')}</span>
        },
        {
          key: 'Category_Name',
          header: 'Category Name',
          className: 'min-w-[150px]',
          render: (row) => {
            const name = String(row.Category_Name || '-');
            return (
              <button type="button" onClick={() => handleOpenDetails(row)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline block text-left cursor-pointer">
                {name}
              </button>
            );
          }
        },
        {
          key: 'Category_Description',
          header: 'Description',
          render: (row) => {
            let desc = String(row.Category_Description || '-');
            desc = desc.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
            return <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[250px] inline-block" title={desc}>{desc}</span>;
          }
        },
        {
          key: 'Created_Date',
          header: 'Created Date',
          render: (row) => <span className="text-xs text-slate-500">{row.Created_Date ? new Date(row.Created_Date).toLocaleDateString() : '-'}</span>
        }
      ];
    } else if (module === 'product-group') {
      moduleSpecificCols = [
        {
          key: 'ProductItemGroup_Id',
          header: 'Group ID',
          className: 'min-w-[150px]',
          render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{String(row.ProductItemGroup_Id || row.id || '-')}</span>
        },
        {
          key: 'ProductItemGroup_Name',
          header: 'Group Name',
          render: (row) => (
            <button type="button" onClick={() => handleOpenDetails(row)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline block text-left cursor-pointer">
              {String(row.ProductItemGroup_Name || '-')}
            </button>
          )
        },
        {
          key: 'Category_Description',
          header: 'Group Description',
          render: (row) => {
            let desc = String(row.Category_Description || row.Product_Description || '-');
            desc = desc.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
            return <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[250px] inline-block" title={desc}>{desc}</span>;
          }
        },
        {
          key: 'Category_Name',
          header: 'Category Name',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Category_Name || '-')}</span>
        },
        {
          key: 'Created_Date',
          header: 'Created Date',
          render: (row) => <span className="text-xs text-slate-500">{row.Created_Date ? new Date(row.Created_Date).toLocaleDateString() : '-'}</span>
        }
      ];
    } else if (module === 'counter') {
      moduleSpecificCols = [
        {
          key: 'Counter_Id',
          header: 'Counter ID',
          className: 'w-[130px]',
          render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{String(row.Counter_Id || row.id || '-')}</span>
        },
        {
          key: 'Counter_Name',
          header: 'Counter Name',
          className: 'w-[150px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Counter_Name || row.name || 'Counter')}</span>
        },
        {
          key: 'Store_Name',
          header: 'Store',
          className: 'w-[150px]',
          render: (row) => {
            // Store_Id may be a nested object { id, Store_Name } or a flat name string
            const storeName = row.Store_Id?.Store_Name || row.Store_Id?.name || row.Store_Name || row.store_name || row.Store || '-';
            return <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(storeName)}</span>;
          }
        },
        {
          key: 'Counter_Incharge',
          header: 'Incharge',
          className: 'w-[120px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Counter_Incharge || row.incharge || '-')}</span>
        },
        {
          key: 'Floor_No',
          header: 'Floor / No',
          className: 'w-[100px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Floor_No || row.Floor || '-')}</span>
        },
        {
          key: 'Counter_Type',
          header: 'Type',
          className: 'w-[80px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Counter_Type || row.Type || 'Cash')}</span>
        },
        {
          key: 'status',
          header: 'Status',
          className: 'w-[90px]',
          render: (row) => {
            const rowId = row[config.idField] || row.id;
            const isEditing = editingField?.rowId === rowId && editingField?.field === 'Status';
            const status = row.Status || row.status;

            if (isEditing) {
              return (
                <Select
                  value={editingValue}
                  onValueChange={(val) => {
                    handleInlineEditSave(row, 'Status', val);
                    setEditingField(null);
                  }}
                  onOpenChange={(open) => {
                    if (!open) setEditingField(null);
                  }}
                >
                  <SelectTrigger className="h-7 w-[85px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              );
            }

            return (
              <button
                type="button"
                onClick={() => {
                  setEditingField({ rowId, field: 'Status' });
                  setEditingValue(status || 'Active');
                }}
                className="cursor-pointer"
              >
                {getStatusBadge(row)}
              </button>
            );
          }
        },
        {
          key: 'Today_Sales',
          header: 'Today Sales',
          className: 'w-[100px]',
          render: (row) => <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{Number(row.Today_Sales || 0).toLocaleString('en-IN')}</span>
        }
      ];
    } else if (module === 'refund-management') {
      moduleSpecificCols = [
        {
          key: 'Refund_Id',
          header: 'Refund ID',
          className: 'min-w-[150px]',
          render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{String(row.Refund_Id || row.Refund_Number || row.id || '-')}</span>
        },
        {
          key: 'Customer_Name',
          header: 'Customer',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[150px]">{String(row.Customer_Name || '-')}</span>
            </div>
          )
        },
        {
          key: 'Product_Name',
          header: 'Product',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[150px]">{String(row.Product_Name || row.Product?.Product_Name || row.Product?.name || row.Return_Item_Id?.Product_Name || row.Return_Item_Id?.name || row.Return_Item_Id || '-')}</span>
            </div>
          )
        },
        {
          key: 'Quantity',
          header: 'Qty',
          render: (row) => <span className="text-xs font-semibold">{String(row.Quantity ?? row.Refund_Quantity ?? row.Return_Quantity ?? row.Return_Item_Id?.Quantity ?? 0)}</span>
        },
        {
          key: 'Refund_Amount',
          header: 'Refund Amount',
          render: (row) => {
            const val = Number(row.Refund_Amount || 0);
            return <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{String(val.toFixed(2))}</span>;
          }
        },
        {
          key: 'Refund_Type',
          header: 'Type',
          render: (row) => {
            const type = String(row.Refund_Type || 'Refund');
            return (
              <Badge variant="secondary" className={`text-[10px] font-semibold ${type.toLowerCase() === 'return' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                {type}
              </Badge>
            );
          }
        },
        {
          key: 'Status',
          header: 'Status',
          className: 'min-w-[140px]',
          render: (row) => {
            const status = String(row.Status || row.Refund_Status || row.status || 'Initiated');
            const colors: Record<string, string> = {
              Initiated: 'bg-amber-50 text-amber-600 border-amber-100',
              Pending: 'bg-amber-50 text-amber-600 border-amber-100',
              Processing: 'bg-blue-50 text-blue-600 border-blue-100',
              Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              Failed: 'bg-rose-50 text-rose-600 border-rose-100',
              Rejected: 'bg-rose-50 text-rose-600 border-rose-100',
            };
            return <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{status}</Badge>;
          }
        },
        {
          key: 'Approval_Status',
          header: 'Approval',
          className: 'min-w-[140px]',
          render: (row) => {
            const approval = String(row.Approval_Status || row.Approval || row.Approval_Status_Name || 'Pending');
            const colors: Record<string, string> = {
              Pending: 'bg-amber-50 text-amber-600 border-amber-100',
              Approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              Rejected: 'bg-rose-50 text-rose-600 border-rose-100',
            };
            return <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[approval] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{approval}</Badge>;
          }
        }
      ];
    } else if (module === 'return-management') {
      moduleSpecificCols = [
        {
          key: 'Return_Item_Id',
          header: 'Return ID',
          className: 'min-w-[140px]',
          render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{String(row.Return_Item_Id || row.Return_Number || row.id || '-')}</span>
        },
        {
          key: 'Customer_Name',
          header: 'Customer',
          render: (row) => {
            const name = String(row.Customer_Id?.Organization_Name || row.Customer_Id?.Full_Name || row.Customer_Name || row.customer || '');
            const orderId = String(row.Sales_Order?.Sale_Id || row.Sales_Invoice?.Invoice_Id || row.Sales_Order_Id || row.orderId || '');
            const initial = name && name !== '-' ? name.charAt(0).toUpperCase() : '?';
            // Pick a stable color based on first char
            const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'];
            const colorIdx = name ? name.charCodeAt(0) % colors.length : 0;
            return (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`h-8 w-8 rounded-full ${colors[colorIdx]} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                  {initial}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">{name || '-'}</span>
                  {orderId && orderId !== '' ? (
                    <span className="inline-flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">#{orderId}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-300 dark:text-slate-600 font-mono">No order ref</span>
                  )}
                </div>
              </div>
            );
          }
        },
        {
          key: 'Product_Name',
          header: 'Product',
          render: (row) => (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <Package className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[150px]">{String(row.Product_Name || row.product || '-')}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 ml-5">Qty: {String(row.Quantity ?? row.quantity ?? 0)}</span>
            </div>
          )
        },
        {
          key: 'Refund_Amount',
          header: 'Refund Amount',
          render: (row) => {
            const val = Number(row.Refund_Amount || 0);
            return <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₹{val.toFixed(2)}</span>;
          }
        },
        {
          key: 'Return_Reason',
          header: 'Reason',
          render: (row) => <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[150px] inline-block">{String(row.Return_Reason || '-')}</span>
        },
        {
          key: 'Condition_Status',
          header: 'Condition',
          render: (row) => {
            const cond = String(row.Condition_Status || '-');
            const colorMap: Record<string, string> = {
              Good: 'bg-emerald-100 text-emerald-700 border-emerald-200',
              Damaged: 'bg-red-100 text-red-700 border-red-200',
              Opened: 'bg-amber-100 text-amber-700 border-amber-200',
              Used: 'bg-orange-100 text-orange-700 border-orange-200',
            };
            return <Badge variant="outline" className={`text-[10px] font-semibold border ${colorMap[cond] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{cond}</Badge>;
          }
        },
        {
          key: 'Inspection_Status',
          header: 'Inspection',
          render: (row) => {
            const ins = String(row.Inspection_Status || '-');
            const colorMap: Record<string, string> = {
              Pending: 'bg-amber-100 text-amber-700 border-amber-200',
              'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
              Completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
              Passed: 'bg-green-100 text-green-700 border-green-200',
              Failed: 'bg-red-100 text-red-700 border-red-200',
            };
            return <Badge variant="outline" className={`text-[10px] font-semibold border ${colorMap[ins] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{ins}</Badge>;
          }
        },
        {
          key: 'Status',
          header: 'Status',
          render: (row) => {
            const s = String(row.Status || '-');
            const colorMap: Record<string, string> = {
              Initiated: 'bg-slate-100 text-slate-700 border-slate-200',
              Pending: 'bg-amber-100 text-amber-700 border-amber-200',
              Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
              Processing: 'bg-blue-100 text-blue-700 border-blue-200',
              Completed: 'bg-green-100 text-green-700 border-green-200',
              Rejected: 'bg-red-100 text-red-700 border-red-200',
            };
            return <Badge variant="outline" className={`text-[10px] font-semibold border ${colorMap[s] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{s}</Badge>;
          }
        },
      ];
    } else if (module === 'replacement-management') {
      moduleSpecificCols = [
        {
          key: 'Replacement_Id',
          header: 'Replacement ID',
          className: 'min-w-[150px]',
          render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{String(row.Replacement_Number || row.Replacement_Id || row.id || '-')}</span>
        },
        {
          key: 'Original_Product',
          header: 'Original Product',
          className: 'min-w-[230px]',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <Package className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate max-w-[190px]">{String(row.Original_Product?.Product_Name || row.Original_Product?.name || row.Original_Product || row.Return_Item_Id?.Product_Name || row.Return_Item_Id?.name || row.Return_Item_Id || '-')}</span>
            </div>
          )
        },
        {
          key: 'Replacement_Product',
          header: 'Replacement Product',
          className: 'min-w-[230px]',
          render: (row) => (
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <ArrowLeftRight className="h-4 w-4 text-emerald-500 shrink-0" />
              <Package className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[170px]">{String(row.Replacement_Product?.Product_Name || row.Replacement_Product?.name || row.Replacement_Product || '-')}</span>
            </div>
          )
        },
        {
          key: 'Quantity',
          header: 'Qty',
          className: 'w-[100px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Quantity ?? row.Qty ?? row.Replacement_Qty ?? row.Return_Quantity ?? 1)}</span>
        },
        {
          key: 'Status',
          header: 'Status',
          className: 'w-[140px]',
          render: (row) => {
            const status = String(row.Status || 'Initiated');
            const colors: Record<string, string> = {
              Initiated: 'bg-slate-100 text-slate-600 border-slate-200',
              Pending: 'bg-amber-50 text-amber-600 border-amber-100',
              Approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              Shipped: 'bg-blue-50 text-blue-600 border-blue-100',
              Delivered: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              Rejected: 'bg-rose-50 text-rose-600 border-rose-100',
            };
            return <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{status}</Badge>;
          }
        },
        {
          key: 'Created_Date',
          header: 'Created Date',
          className: 'min-w-[165px]',
          render: (row) => {
            const date = row.Created_Date || row.Created_At || row.created_at || row.CreatedAt;
            return date ? <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"><CalendarDays className="h-4 w-4 text-slate-500 shrink-0" /><span>{new Date(date).toLocaleDateString()}</span></div> : <span className="text-xs text-slate-400">-</span>;
          }
        },
      ];
    } else if (module === 'refund-policy') {
      moduleSpecificCols = [
        {
          key: 'Policy_Name',
          header: 'Policy Name',
          className: 'min-w-[260px]',
          render: (row) => {
            const active = row.Is_Active === true || row.Is_Active === 'true' || row.Is_Active === 1;
            const returnable = row.Is_Returnable ?? row.Returnable ?? true;
            return (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{String(row.Policy_Name || row.id || '-')}</span>
                <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border-0 ${active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>{active ? 'Active' : 'Inactive'}</Badge>
                {Boolean(returnable) && <Badge variant="outline" className="rounded-full border-0 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">Returnable</Badge>}
              </div>
            );
          }
        },
        {
          key: 'Restocking_Fee',
          header: 'Restocking Fee',
          render: (row) => {
            const rowId = row[config.idField] || row.id;
            const isEditing = editingField?.rowId === rowId && editingField?.field === 'Restocking_Fee_Percent';
            const fee = Number(row.Restocking_Fee_Percent || 0);

            if (isEditing) {
              return (
                <Input
                  type="number"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => {
                    handleInlineEditSave(row, 'Restocking_Fee_Percent', editingValue);
                    setEditingField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleInlineEditSave(row, 'Restocking_Fee_Percent', editingValue);
                      setEditingField(null);
                    } else if (e.key === 'Escape') {
                      setEditingField(null);
                    }
                  }}
                  className="h-7 w-20 text-xs"
                  autoFocus
                />
              );
            }

            return (
              <span
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                onClick={() => {
                  setEditingField({ rowId, field: 'Restocking_Fee_Percent' });
                  setEditingValue(fee);
                }}
              >
                {fee}%
              </span>
            );
          }
        },
        {
          key: 'Refund_Type',
          header: 'Refund Type',
          className: 'min-w-[140px]',
          render: (row) => <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{String(row.Refund_Type || row.Refund_Method || row.Payment_Method || 'Any')}</span>
        },
        {
          key: 'Category',
          header: 'Category',
          className: 'min-w-[140px]',
          render: (row) => <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{String(row.Category_Name || row.Category?.Category_Name || row.Category?.name || row.Category || '-')}</span>
        },
        {
          key: 'Product',
          header: 'Product',
          className: 'min-w-[220px]',
          render: (row) => {
            const product = row.Product_Name || row.Product?.Product_Name || row.Product?.name || row.Product || row.Product_Id?.Product_Name || row.Product_Id?.name || row.Product_Id;
            return product ? <Badge variant="outline" className="max-w-[190px] gap-1.5 rounded-lg border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"><Package className="h-4 w-4 shrink-0 text-slate-500" /><span className="truncate">{String(product)}</span></Badge> : <span className="text-xs text-slate-400">-</span>;
          }
        },
        {
          key: 'Rules',
          header: 'Rules',
          className: 'min-w-[180px]',
          render: (row) => {
            const rules = row.Rules || row.Return_Rules || row.Policy_Rules || row.Rules_List;
            const values = Array.isArray(rules) ? rules : rules ? String(rules).split(',').map((rule) => rule.trim()).filter(Boolean) : [];
            return values.length ? <div className="flex flex-wrap gap-1">{values.map((rule, index) => <Badge key={`${rule}-${index}`} variant="outline" className="rounded-lg border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">{typeof rule === 'object' ? String(rule.Rule_Name || rule.name || `Rule ${index + 1}`) : rule}</Badge>)}</div> : <span className="text-xs text-slate-400">-</span>;
          }
        }
      ];
    } else if (module === 'counter') {
      moduleSpecificCols = [
        {
          key: 'Counter_Id',
          header: 'Counter ID',
          className: 'min-w-[130px]',
          render: (row) => <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">{String(row.Counter_Id || row.id || '-')}</span>
        },
        {
          key: 'Counter_Name',
          header: 'Counter Name',
          className: 'min-w-[150px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Counter_Name || row.name || 'Counter')}</span>
        },
        {
          key: 'Store_Name',
          header: 'Store',
          className: 'min-w-[150px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(row.Store_Name || '-')}</span>
        },
        {
          key: 'Counter_Incharge',
          header: 'Incharge',
          className: 'min-w-[150px]',
          render: (row) => {
            const inchargeName = String(row.Counter_Incharge || row.assigned_user || '-');
            const initial = inchargeName.charAt(0).toUpperCase();
            return (
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {initial}
                </div>
                <span className="truncate max-w-[120px]">{inchargeName}</span>
              </div>
            );
          }
        },
        {
          key: 'Floor_No',
          header: 'Floor / No',
          className: 'min-w-[100px]',
          render: (row) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Floor {row.Floor_No || 0} / No {row.Counter_No || 0}</span>
        },
        {
          key: 'Counter_Type',
          header: 'Type',
          className: 'min-w-[100px]',
          render: (row) => {
            const type = row.Counter_Type || 'Cash';
            return (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/50">
                {type}
              </span>
            );
          }
        },
        {
          key: 'Status',
          header: 'Status',
          className: 'min-w-[100px]',
          render: (row) => {
            const isActive = row.Active_Status === true || row.Active_Status === 'true' || row.Status === 'Active';
            return (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                isActive
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                  : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
              )}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            );
          }
        },
        {
          key: 'Today_Sales',
          header: 'Today Sales',
          className: 'min-w-[120px]',
          render: (row) => {
            const sales = Number(row.Today_Sales || row.Total_Sales || row.sales || 0);
            const orders = Number(row.Today_Orders || row.Total_Orders || row.orders || 0);
            return (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">₹{sales.toLocaleString('en-IN')}</span>
                <span className="text-[10px] text-slate-400">{orders} orders</span>
              </div>
            );
          }
        }
      ];
    } else {
      // Default columns for Category, Group, Employee, Inward
      moduleSpecificCols = [
        {
          key: 'name_col',
          header: `${config.title.slice(0, -1)} Name`,
          className: 'min-w-[200px]',
          render: (row) => {
            const name = String(row[config.nameField] || row.Name || row.Category_Name || row.ProductItemGroup_Name || row.Employees || row.ProductInward_Id || 'Record');
            return (
              <div className="flex flex-col min-w-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger render={
                      <button type="button" onClick={() => handleOpenDetails(row)} className="text-xs lg:text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline block truncate text-left cursor-pointer">
                        {name}
                      </button>
                    } />
                    <TooltipContent side="top" className="bg-slate-900 text-white border border-slate-800 text-xs px-2.5 py-1">
                      {name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {row[config.idField] || row.id || '-'}</span>
              </div>
            );
          }
        },
        {
          key: 'desc_col',
          header: 'Details / Scope',
          render: (row) => {
            let desc = row.Category_Description || row.Category_Name || row.Store_Name || row.Supplier_Name || row.Designation || '-';
            if (typeof desc === 'string') {
              desc = desc.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
            }
            return <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[250px] inline-block" title={desc}>{desc}</span>;
          }
        },
        {
          key: 'Created_Date',
          header: 'Date Created',
          render: (row) => {
            const dt = row.Created_Date || row.GI_Date || row.Date;
            return dt ? (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{new Date(dt).toLocaleDateString()}</span>
              </div>
            ) : <span className="text-xs text-slate-400">-</span>;
          }
        },
        { key: 'status', header: 'Status', render: getStatusBadge }
      ];
    }

    return [checkCol, ...moduleSpecificCols];
  }, [module, rows, selectedRows, config]);

  // Stat metrics computation
  const activeCount = useMemo(() => {
    return rawRows.filter(r => {
      const val = getRowStatus(r);
      return val === 'true' || val === '1' || val === 'active' || val === 'approved';
    }).length;
  }, [rawRows]);

  const secondaryCount = useMemo(() => {
    return rawRows.length - activeCount;
  }, [rawRows, activeCount]);

  const pageContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-2.5 lg:space-y-3 text-left"
    >
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>pegatto</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{config.category}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{config.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Top Header Block */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-3 lg:p-4 rounded-2xl border dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <h1 className="text-lg lg:text-xl font-bold tracking-tight text-slate-909 dark:text-white">{config.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:gap-2.5">
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-lg px-2 lg:px-2.5 py-0.5 lg:py-1 gap-2 text-xs font-medium">
            <span className="text-slate-400 font-normal">View:</span>
            <Select value={viewMode || "All Records"} onValueChange={(val) => { setViewMode(val || 'All Records'); setCurrentPage(1); }}>
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 font-semibold text-slate-808 dark:text-slate-200 cursor-pointer">
                <SelectValue placeholder="All Records" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Records">All Records</SelectItem>
                <SelectItem value="Active Items">Active Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="h-8 lg:h-8 gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="h-8 lg:h-8 gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> Import
          </Button>

          {module === 'product-item' && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedProductForBarcode(null);
                setIsBarcodeDialogOpen(true);
              }}
              className="h-8 lg:h-8 gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-blue-600" /> Print Barcodes
            </Button>
          )}

          {config.crudEndpoint && (
            <Button
              onClick={handleOpenCreate}
              style={{ backgroundColor: primaryColor }}
              className="text-white font-semibold rounded-lg h-8 lg:h-8 px-3 lg:px-3.5 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> {config.actionLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Metric Overview Cards Row (5 Cards grid like Leads section) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 lg:gap-3">
        <ModuleStatCard
          title={`Total ${config.title.replace(' Management', '')}`}
          value={totalRecords}
          icon={Users}
          color="bg-blue-50 text-blue-500 dark:bg-blue-500/15 dark:text-blue-400"
        />
        <ModuleStatCard
          title="Active Records"
          value={activeCount}
          icon={UserPlus}
          color="bg-emerald-50 text-emerald-500 dark:bg-emerald-500/15 dark:text-emerald-400"
        />
        <ModuleStatCard
          title="Inactive Records"
          value={secondaryCount}
          icon={Phone}
          color="bg-amber-50 text-amber-500 dark:bg-amber-500/15 dark:text-amber-400"
          isGood={false}
        />
        <ModuleStatCard
          title="Verified Entities"
          value={activeCount}
          icon={Shield}
          color="bg-purple-50 text-purple-500 dark:bg-purple-500/15 dark:text-purple-400"
        />
        <ModuleStatCard
          title="Health Status"
          value="100%"
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
        />
      </div>

      {/* Main Data Table Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Table View Tabs Header */}
        <div className="flex border-b dark:border-slate-800 px-3 lg:px-4 pt-1 lg:pt-1.5 gap-3 lg:gap-4 bg-slate-50/20 dark:bg-slate-955/10 overflow-x-auto">
          {(module === 'return-management'
            ? [
              { id: 'All', label: 'All Requests', count: rawRows.length },
              { id: 'Pending', label: 'Pending', count: rawRows.filter(r => String(r.Status).toLowerCase() === 'pending').length },
              { id: 'Approved', label: 'Approved', count: rawRows.filter(r => String(r.Status).toLowerCase() === 'approved').length },
              { id: 'Processing', label: 'Processing', count: rawRows.filter(r => String(r.Status).toLowerCase() === 'processing').length },
              { id: 'Completed', label: 'Completed', count: rawRows.filter(r => String(r.Status).toLowerCase() === 'completed').length },
              { id: 'Rejected', label: 'Rejected', count: rawRows.filter(r => String(r.Status).toLowerCase() === 'rejected').length },
            ]
            : ['replacement-management', 'refund-management'].includes(module)
              ? [
                { id: 'All Records', label: `All ${config.title}`, count: totalRecords },
              ]
              : [
                { id: 'All Records', label: `All ${config.title}`, count: totalRecords },
                { id: 'Active Items', label: 'Active Only', count: activeCount }
              ]
          ).map((tab) => {
            const isActive = module === 'return-management' ? statusFilter === tab.id : viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (module === 'return-management') {
                    setStatusFilter(tab.id);
                  } else {
                    setViewMode(tab.id);
                  }
                  setCurrentPage(1);
                }}
                className={`py-2 lg:py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer relative flex items-center gap-2 whitespace-nowrap ${isActive ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                style={isActive ? { borderBottomColor: primaryColor, color: primaryColor } : {}}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  style={isActive ? { backgroundColor: `${primaryColor}18`, color: primaryColor } : {}}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table Filter/Search Header (visible when no records are selected) */}
        <AnimatePresence mode="wait">
          {selectedRows.length === 0 ? (
            <motion.div
              key="default-header"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-2 md:flex-row md:items-center justify-between p-2.5 lg:p-3 border-b dark:border-slate-800"
            >
              <div className="relative w-full md:w-[280px] lg:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder={`Search ${config.title.toLowerCase()} by name, code...`}
                  className="pl-9 h-8 lg:h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-slate-300"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <div className="flex items-center gap-2 lg:gap-2.5">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || 'All'); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[120px] lg:w-[130px] h-8 lg:h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-lg font-medium">
                    <SelectValue placeholder="Status Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    {module === 'refund-management' ? (
                      <>
                        <SelectItem value="Initiated">Initiated</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </>
                    ) : module === 'replacement-management' ? (
                      <>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Shipped">Shipped</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </>
                    ) : module === 'return-management' ? (
                      <>
                        <SelectItem value="Initiated">Initiated</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(true)}
                  className="h-8 lg:h-9 px-2.5 lg:px-3 gap-1.5 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Filter className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Multi-Select Action Bar */
            <motion.div
              key="selected-header"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-slate-50/80 dark:bg-slate-955/60 border-b dark:border-slate-800"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-1">
                  <Checkbox
                    checked={selectedRows.length === rows.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                  <span className="text-xs font-bold text-slate-707 dark:text-slate-300">
                    {selectedRows.length} selected
                  </span>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 gap-1.5 h-9 rounded-lg px-2.5"
                    onClick={handleOpenBulkDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 gap-1.5 h-9 rounded-lg px-2.5 ml-2"
                    onClick={() => setSelectedRows([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>

              {/* Top Mini-Pagination in Selected Bar */}
              <div className="flex items-center gap-3 text-xs text-slate-505 font-medium self-end md:self-auto">
                <span>{(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalRecords)} of {totalRecords}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-slate-200 dark:border-slate-800 cursor-pointer"
                    disabled={currentPage === 1 || isLoading}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  >
                    &lt;
                  </Button>
                  <Button variant="outline" className="h-7 px-2.5 rounded-lg border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 font-bold text-blue-600 dark:text-blue-400">
                    {currentPage}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-slate-200 dark:border-slate-800 cursor-pointer"
                    disabled={rows.length < 10 || isLoading}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Table */}
        <ReusableTable
          columns={tableColumns}
          data={rows}
          loading={isLoading}
          borderless
          showGear={false}
          title={config.title}
          page={currentPage}
          totalRecords={totalRecords}
          onChangePage={setCurrentPage}
          pageSize={10}
          actions={(row) => module === 'replacement-management' ? (
            <div className="flex items-center justify-center gap-1">
              <Button variant="ghost" size="icon" title="View replacement" onClick={() => handleOpenDetails(row)} className="h-8 w-8 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Edit replacement" onClick={() => handleOpenEdit(row)} className="h-8 w-8 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                  <DropdownMenuItem
                    onClick={() => handleOpenDetails(row)}
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 mr-2 text-blue-500" />
                    View Details
                  </DropdownMenuItem>
                  {config.crudEndpoint && (
                    <DropdownMenuItem
                      onClick={() => handleOpenEdit(row)}
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Edit className="h-3.5 w-3.5 mr-2 text-amber-500" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {config.crudEndpoint && (
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  )}
                  {config.crudEndpoint && (
                    <DropdownMenuItem
                      onClick={() => handleOpenSingleDelete(row)}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/30 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        />
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("rounded-2xl max-h-[90vh] overflow-y-auto", module === 'store' ? "sm:max-w-[850px]" : "sm:max-w-[500px]")}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{config.actionLabel}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Fill in the details to create a new {config.title.toLowerCase()} record.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleFormSubmit(e, false)} className="space-y-4 py-2">
            {config.customFormComponent ? (
              <config.customFormComponent
                formData={formData}
                setFormData={setFormData}
                isEdit={false}
                productRows={productRows}
                setProductRows={setProductRows}
                productList={productList}
              />
            ) : (
              <>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Form Details</h3>
                  </div>
                  <div className={cn("grid gap-y-5 gap-x-6", module === 'store' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                    {config.formFields.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>
                        {field.type === 'textarea' ? (
                          <textarea
                            required={field.required}
                            placeholder={field.placeholder}
                            value={formData[field.key] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="w-full min-h-[90px] rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-hidden"
                          />
                        ) : field.type === 'select' ? (
                          <Select value={String(formData[field.key] ?? '')} onValueChange={(val) => setFormData({ ...formData, [field.key]: val ?? '' })}>
                            <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950">
                              <SelectValue placeholder={`Select ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type || 'text'}
                            required={field.required}
                            placeholder={field.placeholder}
                            value={formData[field.key] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* DYNAMIC STORE PRODUCTS & STOCK PARAMETERS TABLE FOR STORE CREATION */}
                {module === 'store' && (
                  <div className="space-y-3 pt-3 border-t dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Store Products & Stock Parameters</h4>
                        <p className="text-[11px] text-slate-400">Configure initial product stock levels, opening balance, reorder, and minimum thresholds for this store.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddProductRow}
                        className="h-8 gap-1.5 rounded-xl text-xs font-semibold text-blue-600 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Product
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[170px]">Product Name</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[100px]">Product Id</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[80px]">Uom</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[120px]">Opening Balance</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[120px]">Reorder Level</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[130px]">Min Stock Level</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 w-[60px] text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {productRows.map((pRow, idx) => (
                            <tr key={idx} className="hover:bg-white/50 dark:hover:bg-slate-900/50">
                              <td className="p-2">
                                <Select
                                  value={pRow.Product_Id ? String(pRow.Product_Id) : ''}
                                  onValueChange={(val) => handleSelectProductForRow(idx, val)}
                                >
                                  <SelectTrigger className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="Select Product" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-56">
                                    {productList.map((prod: any) => (
                                      <SelectItem key={prod.id || prod.Product_Id} value={String(prod.id || prod.Product_Id)}>
                                        {prod.Product_Name || prod.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2">
                                <Input
                                  readOnly
                                  placeholder="Product Id"
                                  value={pRow.Product_Id || ''}
                                  className="h-9 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  placeholder="UOM"
                                  value={pRow.UOM || ''}
                                  onChange={(e) => handleProductRowChange(idx, 'UOM', e.target.value)}
                                  className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  placeholder="Opening Balance"
                                  value={pRow.Opening_Balance ?? ''}
                                  onChange={(e) => handleProductRowChange(idx, 'Opening_Balance', e.target.value)}
                                  className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  placeholder="Reorder Level"
                                  value={pRow.Reorder_Level ?? ''}
                                  onChange={(e) => handleProductRowChange(idx, 'Reorder_Level', e.target.value)}
                                  className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  placeholder="Min_Stock_Level"
                                  value={pRow.Min_Stock_Level ?? ''}
                                  onChange={(e) => handleProductRowChange(idx, 'Min_Stock_Level', e.target.value)}
                                  className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductRow(idx)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: primaryColor }} className="text-white rounded-xl h-9 text-xs font-bold">
                {isSubmitting ? 'Saving...' : 'Create Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className={cn("rounded-2xl max-h-[90vh] overflow-y-auto", module === 'store' ? "sm:max-w-[850px]" : "sm:max-w-[500px]")}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit {config.title.slice(0, -1)}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Update the properties of this record.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => handleFormSubmit(e, true)} className="space-y-4 py-2">
            {config.customFormComponent ? (
              <config.customFormComponent
                formData={formData}
                setFormData={setFormData}
                isEdit={true}
                productRows={productRows}
                setProductRows={setProductRows}
                productList={productList}
              />
            ) : (
              <>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Form Details</h3>
                  </div>
                  <div className={cn("grid gap-y-5 gap-x-6", module === 'store' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                    {config.formFields.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{field.label}</Label>
                        {field.type === 'textarea' ? (
                          <textarea
                            placeholder={field.placeholder}
                            value={formData[field.key] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="w-full min-h-[90px] rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs bg-slate-50 dark:bg-slate-950 focus:outline-hidden"
                          />
                        ) : field.type === 'select' ? (
                          <Select value={String(formData[field.key] ?? '')} onValueChange={(val) => setFormData({ ...formData, [field.key]: val ?? '' })}>
                            <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950">
                              <SelectValue placeholder={`Select ${field.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={field.type || 'text'}
                            placeholder={field.placeholder}
                            value={formData[field.key] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                            className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* DYNAMIC STORE PRODUCTS TABLE FOR EDITING STORE */}
                {module === 'store' && (
                  <div className="space-y-3 pt-3 border-t dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Store Products & Stock Parameters</h4>
                        <p className="text-[11px] text-slate-400">Configure product inventory parameters for this store location.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddProductRow}
                        className="h-8 gap-1.5 rounded-xl text-xs font-semibold text-blue-600 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Product
                      </Button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[170px]">Product Name</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[100px]">Product Id</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[80px]">Uom</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[120px]">Opening Balance</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[120px]">Reorder Level</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 min-w-[130px]">Min Stock Level</th>
                            <th className="p-2.5 font-bold text-slate-700 dark:text-slate-300 w-[60px] text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {productRows.map((pRow, idx) => (
                            <tr key={idx} className="hover:bg-white/50 dark:hover:bg-slate-900/50">
                              <td className="p-2">
                                <Select
                                  value={pRow.Product_Id ? String(pRow.Product_Id) : ''}
                                  onValueChange={(val) => handleSelectProductForRow(idx, val)}
                                >
                                  <SelectTrigger className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900">
                                    <SelectValue placeholder="Select Product" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-56">
                                    {productList.map((prod: any) => (
                                      <SelectItem key={prod.id || prod.Product_Id} value={String(prod.id || prod.Product_Id)}>
                                        {prod.Product_Name || prod.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-2">
                                <Input
                                  readOnly
                                  placeholder="Product Id"
                                  value={pRow.Product_Id || ''}
                                  className="h-9 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  placeholder="UOM"
                                  value={pRow.UOM || ''}
                                  onChange={(e) => handleProductRowChange(idx, 'UOM', e.target.value)}
                                  className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  placeholder="Opening Balance"
                                  value={pRow.Opening_Balance ?? ''}
                                  onChange={(e) => handleProductRowChange(idx, 'Opening_Balance', e.target.value)}
                                  className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  placeholder="Reorder Level"
                                  value={pRow.Reorder_Level ?? ''}
                                  onChange={(e) => handleProductRowChange(idx, 'Reorder_Level', e.target.value)}
                                  className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  placeholder="Min_Stock_Level"
                                  value={pRow.Min_Stock_Level ?? ''}
                                  onChange={(e) => handleProductRowChange(idx, 'Min_Stock_Level', e.target.value)}
                                  className="h-9 text-xs rounded-lg bg-white dark:bg-slate-900"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductRow(idx)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} style={{ backgroundColor: primaryColor }} className="text-white rounded-xl h-9 text-xs font-bold">
                {isSubmitting ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW DETAILS DIALOG */}
      {module === 'store' ? (
        <StoreOverviewModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          activeRow={activeRow}
        />
      ) : (
        <GenericOverviewModal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          activeRow={activeRow}
          title={config.title}
          icon={Icon}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {deleteMode === 'single'
                ? 'Are you sure you want to delete this record? This action cannot be undone.'
                : `Are you sure you want to delete ${selectedRows.length} selected records?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl h-9 text-xs">Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting} className="rounded-xl h-9 text-xs font-bold">
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADVANCED FILTER DIALOG */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Filter {config.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Refine the record list using specific module criteria.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Status</Label>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'All')}>
                <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-950">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStatusFilter('All'); setIsFilterOpen(false); }} className="rounded-xl h-9 text-xs">Reset</Button>
            <Button onClick={() => setIsFilterOpen(false)} style={{ backgroundColor: primaryColor }} className="text-white rounded-xl h-9 text-xs font-bold">Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IMPORT DIALOG */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Import {config.title}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Upload a CSV or Excel file containing record data.</DialogDescription>
          </DialogHeader>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3">
            <Upload className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Drag and drop your data file or browse</p>
            <Input type="file" accept=".csv,.xlsx" className="text-xs" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)} className="rounded-xl h-9 text-xs">Cancel</Button>
            <Button onClick={() => { toast.success('Import simulated successfully.'); setIsImportOpen(false); }} style={{ backgroundColor: primaryColor }} className="text-white rounded-xl h-9 text-xs font-bold">Upload & Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodePrintDialog
        open={isBarcodeDialogOpen}
        onClose={() => setIsBarcodeDialogOpen(false)}
        products={selectedRows.length > 0 ? rawRows.filter(r => selectedRows.includes(String(r.id || r.Product_Id))) : rawRows}
        selectedProduct={selectedProductForBarcode}
      />
    </motion.div>
  );

  if (module === 'counter') {
    return <CounterManagementDashboard onAddCounter={handleOpenCreate}>{pageContent}</CounterManagementDashboard>;
  }

  return pageContent;
}
