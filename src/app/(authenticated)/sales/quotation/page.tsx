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
  ShoppingCart,
  RotateCcw,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ArrowUpDown,
  AlertTriangle,
  Check,
  Eye,
  Settings,
  MoreHorizontal,
  FileText,
  CheckSquare,
  Mail,
  PhoneCall,
  RefreshCw
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
  SalesQuotation,
  SalesOrder,
  ProductLineItem,
  fetchQuotationsAPI,
  createQuotationAPI,
  updateQuotationAPI,
  deleteQuotationAPI,
  searchQuotationsAPI,
  filterQuotationsAPI,
  fetchAccountsLookupAPI,
  fetchProductsLookupAPI,
  getEnquiriesList,
  getPriceBooks,
  createSalesOrderAPI,
  DEFAULT_CUSTOMER_ACCOUNTS,
  DEFAULT_SALES_PRODUCTS,
} from '@/service/api/sales/api';
import { getLocalData, upsertLocalItem, deleteLocalItem, mergeWithLocalData } from '@/utils/persistentStorage';

const ITEMS_PER_PAGE = 10;

export default function QuotationPage() {
  const router = useRouter();

  // Dynamic State with persistent localStorage cache
  const [quotations, setQuotations] = useState<SalesQuotation[]>(() => getLocalData<SalesQuotation>('pegatto_quotations'));
  const [customerOptions, setCustomerOptions] = useState<{ id: number; name: string; address?: string }[]>([]);
  const [enquiryOptions, setEnquiryOptions] = useState<any[]>([]);
  const [isManualEnquiry, setIsManualEnquiry] = useState(false);
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [masterProducts, setMasterProducts] = useState<{ name: string; id: string; uom: string; desc: string; price: number }[]>([]);
  const [manualProductRows, setManualProductRows] = useState<{ [index: number]: boolean }>({});
  const [priceBookOptions, setPriceBookOptions] = useState<{ id: string | number; name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Load lookups dynamically from API
  React.useEffect(() => {
    async function loadLookups() {
      try {
        const [accountsData, productsData, enquiriesData, priceBooksData] = await Promise.all([
          fetchAccountsLookupAPI().catch(() => []),
          fetchProductsLookupAPI().catch(() => []),
          getEnquiriesList().catch(() => []),
          getPriceBooks().catch(() => [])
        ]);

        const rawAccounts = (Array.isArray(accountsData) && accountsData.length > 0)
          ? accountsData
          : DEFAULT_CUSTOMER_ACCOUNTS;

        const localEnquiries = getLocalData<any>('pegatto_customer_enquiries') || [];
        const localCusts = localEnquiries
          .map((e: any) => ({
            id: Number(e.CustomerId || e.AccountId || e.id || 1),
            name: e.CustomerName || e.Customer_Name || '',
            address: e.Delivery_Address || ''
          }))
          .filter((c: any) => Boolean(c.name));

        const accs = rawAccounts
          .map((a: any) => ({
            id: Number(a.id),
            name: String(a.Organization_Name || a.Company_Name || a.Account_Name || a.name || '').trim(),
            address: String(a.Shipping_Address || a.Billing_Address || a.Address || '').trim()
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

        const rawEnqs = Array.isArray(enquiriesData) ? enquiriesData : (enquiriesData?.results || enquiriesData?.data || []);
        const seenEnqs = new Set<string>();
        const mergedEnqs: any[] = [];
        [...rawEnqs, ...localEnquiries].forEach((enq: any) => {
          const num = String(enq.Enquiry_No || enq.EnquiryId || enq.Enquiry_Id || enq.id || '').trim();
          if (num && !seenEnqs.has(num)) {
            seenEnqs.add(num);
            mergedEnqs.push(enq);
          }
        });
        setEnquiryOptions(mergedEnqs);

        const pbList = Array.isArray(priceBooksData) ? priceBooksData : (priceBooksData?.results || priceBooksData?.data || []);
        const pbs = pbList.map((pb: any) => ({
          id: pb.id,
          name: String(pb.Price_Book_Name || pb.Name || pb.name || pb.PriceBook_Name || '').trim()
        })).filter((p: any) => Boolean(p.name));
        setPriceBookOptions(pbs);
      } catch (err) {
        console.error('Failed to load quotation lookups:', err);
      }
    }
    loadLookups();
  }, []);

  // Filter Popover State matching old retail MyOffer.js
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterForm, setFilterForm] = useState({
    offerId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    offerId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });

  const loadQuotations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeFilters.offerId || activeFilters.customerName || activeFilters.fromDate || activeFilters.toDate) {
        const res = await filterQuotationsAPI({
          fromdate: activeFilters.fromDate || undefined,
          todate: activeFilters.toDate || undefined,
          Customer_Name: activeFilters.customerName || undefined,
          Offer_No: activeFilters.offerId || undefined,
        });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setQuotations(list.map((item: any) => ({
            id: item.id,
            Offer_No: item.Offer_No || item.Offer_Id || `QT-${item.id}`,
            Offer_Date: item.Offer_Date?.split('T')[0] || item.Created_Date?.split('T')[0] || '',
            CustomerName: item.Customer_Name || item.CustomerName || '',
            Enquiry_No: item.Enquiry_No || '',
            PriceBook: item.Price_Book || 'Standard Retail Pricebook 2026',
            Price_Book: item.Price_Book || 'Standard Retail Pricebook 2026',
            Valid_Until: item.Valid_Until?.split('T')[0] || item.Valid_Date?.split('T')[0] || '',
            Total_Amount: Number(item.Total_Amount || item.Net_Amount || 0),
            Status: item.Status || 'Quotation Sent',
            Delivery_Address: item.Delivery_Address || '',
            products: Array.isArray(item.ProductOffer_Details) ? item.ProductOffer_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || '',
              quantity: Number(p.Quantity || 1),
              unit_price: Number(p.Unit_Price || 0),
              subtotal: Number(p.Total_Price || (p.Quantity || 1) * (p.Unit_Price || 0)),
            })) : [],
          })));
        }
      } else if (searchTerm.trim()) {
        const res = await searchQuotationsAPI(searchTerm.trim());
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setQuotations(list.map((item: any) => ({
            id: item.id,
            Offer_No: item.Offer_No || item.Offer_Id || `QT-${item.id}`,
            Offer_Date: item.Offer_Date?.split('T')[0] || item.Created_Date?.split('T')[0] || '',
            CustomerName: item.Customer_Name || item.CustomerName || '',
            Enquiry_No: item.Enquiry_No || '',
            PriceBook: item.Price_Book || 'Standard Retail Pricebook 2026',
            Price_Book: item.Price_Book || 'Standard Retail Pricebook 2026',
            Valid_Until: item.Valid_Until?.split('T')[0] || item.Valid_Date?.split('T')[0] || '',
            Total_Amount: Number(item.Total_Amount || item.Net_Amount || 0),
            Status: item.Status || 'Quotation Sent',
            Delivery_Address: item.Delivery_Address || '',
            products: Array.isArray(item.ProductOffer_Details) ? item.ProductOffer_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || '',
              quantity: Number(p.Quantity || 1),
              unit_price: Number(p.Unit_Price || 0),
              subtotal: Number(p.Total_Price || (p.Quantity || 1) * (p.Unit_Price || 0)),
            })) : [],
          })));
        }
      } else {
        const res = await fetchQuotationsAPI(currentPage);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedBackend = list.map((item: any) => ({
          id: item.id,
          Offer_No: item.Offer_No || item.Offer_Id || `QT-${item.id}`,
          Offer_Date: item.Offer_Date?.split('T')[0] || item.Created_Date?.split('T')[0] || '',
          CustomerName: item.Customer_Name || item.CustomerName || '',
          Enquiry_No: item.Enquiry_No || '',
          PriceBook: item.Price_Book || 'Standard Retail Pricebook 2026',
          Price_Book: item.Price_Book || 'Standard Retail Pricebook 2026',
          Valid_Until: item.Valid_Until?.split('T')[0] || item.Valid_Date?.split('T')[0] || '',
          Total_Amount: Number(item.Total_Amount || item.Net_Amount || 0),
          Status: item.Status || 'Quotation Sent',
          Delivery_Address: item.Delivery_Address || '',
          products: Array.isArray(item.ProductOffer_Details) ? item.ProductOffer_Details.map((p: any) => ({
            id: p.id,
            product_name: p.Product_Name || '',
            product_id: p.Product_Id || '',
            uom: p.UOM || '',
            quantity: Number(p.Quantity || 1),
            unit_price: Number(p.Unit_Price || 0),
            subtotal: Number(p.Total_Price || (p.Quantity || 1) * (p.Unit_Price || 0)),
          })) : [],
        }));
        const merged = mergeWithLocalData<SalesQuotation>('pegatto_quotations', mappedBackend, ['id', 'Offer_No']);
        setQuotations(merged);
      }
    } catch (e) {
      console.error('Failed to load quotations from API:', e);
      const local = getLocalData<SalesQuotation>('pegatto_quotations');
      if (local.length > 0) setQuotations(local);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, searchTerm, currentPage]);

  React.useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // Dialog & View State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [selectedQuotation, setSelectedQuotation] = useState<SalesQuotation | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form State matching Image 1
  const [formState, setFormState] = useState<{
    Offer_No?: string;
    CustomerName: string;
    Enquiry_No: string;
    Offer_Date: string;
    Valid_Until: string;
    Price_Book: string;
    Delivery_Address: string;
    Terms_Conditions: string;
    Special_Discount: number;
    products: ProductLineItem[];
  }>({
    CustomerName: '',
    Enquiry_No: '',
    Offer_Date: new Date().toISOString().split('T')[0],
    Valid_Until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Price_Book: '',
    Delivery_Address: 'undefined,',
    Terms_Conditions: 'Terms and Conditions',
    Special_Discount: 0,
    products: [
      { id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0, subtotal: 0 }
    ]
  });

  // Calculate total amounts
  const totalProductsAmount = useMemo(() => {
    return formState.products.reduce((acc, p) => acc + (p.subtotal || (p.quantity || 1) * (p.unit_price || 0)), 0);
  }, [formState.products]);

  const finalCalculatedAmount = useMemo(() => {
    const disc = Number(formState.Special_Discount) || 0;
    return Math.max(0, totalProductsAmount - disc);
  }, [totalProductsAmount, formState.Special_Discount]);

  // Handle Enquiry selection & auto-fill
  const handleEnquiryChange = (enquiryId: string) => {
    if (enquiryId === '__CUSTOM__') {
      setIsManualEnquiry(true);
      setFormState((prev) => ({
        ...prev,
        Enquiry_No: '',
      }));
      return;
    }

    const found = enquiryOptions.find((e) => (e.Enquiry_No || e.EnquiryId || e.Enquiry_Id || String(e.id)) === enquiryId);
    if (found) {
      const details = Array.isArray(found.ProductEnquiry_Details) ? found.ProductEnquiry_Details : (found.products || []);
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

      const custName = found.Customer_Name || found.CustomerName || found.Account_Name || '';
      const address = found.Delivery_Address || found.Shipping_Address || '';

      setFormState((prev) => ({
        ...prev,
        Enquiry_No: enquiryId,
        CustomerName: custName || prev.CustomerName,
        Delivery_Address: address || (prev.Delivery_Address === 'undefined,' ? '' : prev.Delivery_Address),
        products: mapped.length > 0 ? mapped : prev.products
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        Enquiry_No: enquiryId,
      }));
    }

    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.Enquiry_No;
      return copy;
    });
  };

  // Handle Customer Name selection & auto-fill
  const handleCustomerChange = (custName: string) => {
    if (custName === '__CUSTOM__') {
      setIsManualCustomer(true);
      setFormState((prev) => ({
        ...prev,
        CustomerName: '',
      }));
      return;
    }

    const cust = customerOptions.find((c) => c.name.toLowerCase() === custName.toLowerCase());
    const foundEnq = enquiryOptions.find((e) => (e.Customer_Name || e.CustomerName || '').toLowerCase() === custName.toLowerCase());
    
    let mappedProducts: ProductLineItem[] = [];
    if (foundEnq) {
      const details = Array.isArray(foundEnq.ProductEnquiry_Details) ? foundEnq.ProductEnquiry_Details : (foundEnq.products || []);
      mappedProducts = details.map((p: any, idx: number) => ({
        id: Date.now() + idx,
        product_name: p.Product_Name || p.product_name || p.name || '',
        product_id: p.Product_Id || p.product_id || p.id || '',
        uom: p.UOM || p.uom || 'Unit',
        description: p.Description || p.description || '',
        quantity: Number(p.Quantity || p.quantity || 1),
        unit_price: Number(p.Unit_Price || p.unit_price || p.price || 0),
        subtotal: Number(p.Total_Price || p.subtotal || ((p.Quantity || 1) * (p.Unit_Price || 0)))
      }));
    }

    setFormState((prev) => ({
      ...prev,
      CustomerName: custName,
      Enquiry_No: foundEnq ? (foundEnq.Enquiry_No || foundEnq.EnquiryId || foundEnq.Enquiry_Id || '') : prev.Enquiry_No,
      Delivery_Address: cust?.address || (foundEnq?.Delivery_Address || foundEnq?.Shipping_Address) || (prev.Delivery_Address === 'undefined,' ? '' : prev.Delivery_Address),
      products: mappedProducts.length > 0 ? mappedProducts : prev.products
    }));

    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.CustomerName;
      delete copy.Enquiry_No;
      delete copy.Delivery_Address;
      delete copy.Price_Book;
      return copy;
    });
  };

  // Open Create Dialog / View
  const handleOpenCreate = () => {
    const nextSeq = quotations.length + 1;
    setIsManualEnquiry(false);
    setIsManualCustomer(false);
    setFormErrors({});
    setFormState({
      Offer_No: `QT-2026-${String(nextSeq).padStart(3, '0')}`,
      CustomerName: '',
      Enquiry_No: '',
      Offer_Date: new Date().toISOString().split('T')[0],
      Valid_Until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Price_Book: '',
      Delivery_Address: '',
      Terms_Conditions: 'Terms and Conditions',
      Special_Discount: 0,
      products: [
        { id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0, subtotal: 0 }
      ]
    });
    setManualProductRows({});
    setIsCreateOpen(true);
  };

  // Open Edit Dialog / View
  const handleOpenEdit = (quotation: SalesQuotation) => {
    setSelectedQuotation(quotation);
    const isCustomEnq = !enquiryOptions.some((e) => (e.Enquiry_No || e.EnquiryId || e.Enquiry_Id || String(e.id)) === quotation.Enquiry_No);
    const isCustomCust = !customerOptions.some((c) => c.name === quotation.CustomerName);
    setIsManualEnquiry(Boolean(quotation.Enquiry_No && isCustomEnq));
    setIsManualCustomer(Boolean(quotation.CustomerName && isCustomCust));
    setFormErrors({});
    setFormState({
      Offer_No: quotation.Offer_No,
      CustomerName: quotation.CustomerName,
      Enquiry_No: quotation.Enquiry_No || '',
      Offer_Date: quotation.Offer_Date,
      Valid_Until: quotation.Valid_Until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Price_Book: quotation.Price_Book || '',
      Delivery_Address: quotation.Delivery_Address === 'undefined,' ? '' : (quotation.Delivery_Address || ''),
      Terms_Conditions: quotation.Terms || (quotation as any).Terms_Conditions || 'Terms and Conditions',
      Special_Discount: (quotation as any).Special_Discount || 0,
      products: quotation.products && quotation.products.length > 0
        ? [...quotation.products]
        : [{ id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0, subtotal: 0 }]
    });
    const manualMap: { [index: number]: boolean } = {};
    (quotation.products || []).forEach((p, idx) => {
      if (p.product_name && !masterProducts.some((mp) => mp.name.toLowerCase().trim() === p.product_name.toLowerCase().trim())) {
        manualMap[idx] = true;
      }
    });
    setManualProductRows(manualMap);
    setIsEditOpen(true);
  };

  // Check entered/modified fields
  const getModifiedFields = (): string[] => {
    const fields: string[] = [];

    if (isEditOpen && selectedQuotation) {
      if (formState.CustomerName !== selectedQuotation.CustomerName) fields.push(`Customer Name ("${formState.CustomerName}")`);
      if (formState.Enquiry_No !== (selectedQuotation.Enquiry_No || '')) fields.push(`Enquiry No ("${formState.Enquiry_No}")`);
      if (formState.Offer_Date !== selectedQuotation.Offer_Date) fields.push(`Quotation Date ("${formState.Offer_Date}")`);
      if (formState.Valid_Until !== (selectedQuotation.Valid_Until || '')) fields.push(`Validity ("${formState.Valid_Until}")`);
      if (formState.Price_Book !== (selectedQuotation.Price_Book || '')) fields.push(`Price Book ("${formState.Price_Book}")`);
      if (formState.Delivery_Address !== (selectedQuotation.Delivery_Address === 'undefined,' ? '' : (selectedQuotation.Delivery_Address || ''))) fields.push(`Delivery Address`);
      if (formState.Terms_Conditions !== 'Terms and Conditions') fields.push(`Terms & Conditions`);
      if (Number(formState.Special_Discount) !== 0) fields.push(`Special Discount (₹${formState.Special_Discount})`);
      if (JSON.stringify(formState.products) !== JSON.stringify(selectedQuotation.products || [])) {
        fields.push(`Product line items`);
      }
      return fields;
    }

    // In Create mode:
    if (formState.Enquiry_No) fields.push(`Enquiry No ("${formState.Enquiry_No}")`);
    if (formState.CustomerName?.trim()) fields.push(`Customer Name ("${formState.CustomerName}")`);
    if (formState.Price_Book) fields.push(`Price Book ("${formState.Price_Book}")`);
    if (formState.Delivery_Address && formState.Delivery_Address !== 'undefined,' && formState.Delivery_Address.trim()) {
      fields.push(`Delivery Address ("${formState.Delivery_Address}")`);
    }
    if (formState.Terms_Conditions && formState.Terms_Conditions !== 'Terms and Conditions' && formState.Terms_Conditions.trim()) {
      fields.push(`Terms & Conditions`);
    }
    if (Number(formState.Special_Discount) > 0) fields.push(`Special Discount (₹${formState.Special_Discount})`);

    const modifiedProducts = formState.products.filter(
      (p) => p.product_name || (p.unit_price || 0) > 0 || (p.quantity && p.quantity > 1) || p.description
    );
    if (modifiedProducts.length > 0) {
      fields.push(`${modifiedProducts.length} Product line item(s)`);
    }

    return fields;
  };

  // Cancel button click handler
  const handleCancelClick = () => {
    const modified = getModifiedFields();
    if (modified.length > 0) {
      setShowCancelWarning(true);
    } else {
      handleConfirmCancel();
    }
  };

  // Cancel confirmation
  const handleConfirmCancel = () => {
    setShowCancelWarning(false);
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setSelectedQuotation(null);
  };

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.Offer_No.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Enquiry_No || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.Price_Book || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Status.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Popover filters
      if (activeFilters.offerId && !item.Offer_No.toLowerCase().includes(activeFilters.offerId.toLowerCase())) {
        return false;
      }
      if (activeFilters.customerName && !item.CustomerName.toLowerCase().includes(activeFilters.customerName.toLowerCase())) {
        return false;
      }
      if (activeFilters.fromDate) {
        const itemDate = new Date(item.Offer_Date);
        const fromD = new Date(activeFilters.fromDate);
        if (itemDate < fromD) return false;
      }
      if (activeFilters.toDate) {
        const itemDate = new Date(item.Offer_Date);
        const toD = new Date(activeFilters.toDate);
        if (itemDate > toD) return false;
      }

      return true;
    });
  }, [quotations, searchTerm, activeFilters]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredQuotations.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedQuotations = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuotations.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredQuotations, safeCurrentPage]);

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
    const empty = { offerId: '', customerName: '', fromDate: '', toDate: '' };
    setFilterForm(empty);
    setActiveFilters(empty);
    setCurrentPage(1);
    toast.info('Filters reset');
  };



  // Open Delete Dialog
  const handleOpenDelete = (quotation: SalesQuotation) => {
    setSelectedQuotation(quotation);
    setIsDeleteOpen(true);
  };

  // Open Convert to Order Dialog
  const handleOpenConvert = (quotation: SalesQuotation) => {
    setSelectedQuotation(quotation);
    setIsConvertOpen(true);
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
    setFormState((prev) => {
      const updated = prev.products.filter((_, idx) => idx !== index);
      return {
        ...prev,
        products: updated.length > 0 ? updated : [
          { id: Date.now(), product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0, subtotal: 0 }
        ]
      };
    });
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
    if (!formState.Offer_Date) {
      errors.Offer_Date = 'Quotation Date is required';
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

    const newQuotation: SalesQuotation = {
      id: Date.now(),
      Offer_No: formState.Offer_No || `QT-2026-${String(quotations.length + 1).padStart(3, '0')}`,
      CustomerName: formState.CustomerName,
      Enquiry_No: formState.Enquiry_No,
      Offer_Date: formState.Offer_Date,
      Valid_Until: formState.Valid_Until,
      Price_Book: formState.Price_Book,
      Delivery_Address: formState.Delivery_Address !== 'undefined,' ? formState.Delivery_Address : '',
      Total_Amount: finalCalculatedAmount,
      Status: 'Quotation Created',
      products: formState.products
    };

    upsertLocalItem('pegatto_quotations', newQuotation, ['id', 'Offer_No']);
    setQuotations((prev) => [newQuotation, ...prev.filter(q => q.id !== newQuotation.id)]);
    setIsCreateOpen(false);
    toast.success(`Quotation ${newQuotation.Offer_No} created successfully`);

    try {
      await createQuotationAPI({
        id: newQuotation.id,
        Offer_No: newQuotation.Offer_No,
        Offer_Id: newQuotation.Offer_No,
        Customer_Name: formState.CustomerName,
        CustomerName: formState.CustomerName,
        Enquiry_No: formState.Enquiry_No,
        Offer_Date: formState.Offer_Date,
        Valid_Until: formState.Valid_Until,
        Price_Book: formState.Price_Book,
        Total_Amount: finalCalculatedAmount,
        ProductOffer_Details: formState.products.map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Total_Price: (p.quantity || 1) * (p.unit_price || 0),
        })),
      } as any);
      loadQuotations();
    } catch (err) {
      console.warn('Backend quotation save notice (persisted locally):', err);
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuotation || !validateForm()) return;

    const updated: SalesQuotation = {
      ...selectedQuotation,
      CustomerName: formState.CustomerName,
      Enquiry_No: formState.Enquiry_No,
      Offer_Date: formState.Offer_Date,
      Valid_Until: formState.Valid_Until,
      Price_Book: formState.Price_Book,
      Delivery_Address: formState.Delivery_Address !== 'undefined,' ? formState.Delivery_Address : '',
      Total_Amount: finalCalculatedAmount,
      products: formState.products
    };

    upsertLocalItem('pegatto_quotations', updated, ['id', 'Offer_No']);
    setQuotations((prev) =>
      prev.map((item) => (item.id === selectedQuotation.id ? updated : item))
    );
    setIsEditOpen(false);
    toast.success(`Quotation ${selectedQuotation.Offer_No} updated`);

    try {
      await updateQuotationAPI({
        id: selectedQuotation.id,
        Customer_Name: formState.CustomerName,
        Enquiry_No: formState.Enquiry_No,
        Offer_Date: formState.Offer_Date,
        Valid_Until: formState.Valid_Until,
        Price_Book: formState.Price_Book,
        Total_Amount: finalCalculatedAmount,
        ProductOffer_Details: formState.products.map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Total_Price: (p.quantity || 1) * (p.unit_price || 0),
        })),
      } as any);
      loadQuotations();
    } catch (err) {
      console.warn('Backend quotation update notice (persisted locally):', err);
    }
    setSelectedQuotation(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedQuotation) return;
    const delId = selectedQuotation.id;
    deleteLocalItem('pegatto_quotations', delId, ['id', 'Offer_No']);
    setQuotations((prev) => prev.filter((item) => item.id !== delId));
    setIsDeleteOpen(false);
    toast.success(`Quotation ${selectedQuotation.Offer_No} deleted`);

    try {
      await deleteQuotationAPI(delId);
      loadQuotations();
    } catch (err) {
      console.warn('Backend quotation delete notice (persisted locally):', err);
    }
    setSelectedQuotation(null);
  };

  // Confirm convert to sales order
  const handleConfirmOrderConversion = async () => {
    if (!selectedQuotation) return;
    const orderNo = `SO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const updatedQuotation = { ...selectedQuotation, Status: 'Order Created' as const };
    upsertLocalItem('pegatto_quotations', updatedQuotation, ['id', 'Offer_No']);

    setQuotations((prev) =>
      prev.map((item) =>
        item.id === selectedQuotation.id ? updatedQuotation : item
      )
    );

    const newOrder: SalesOrder = {
      id: Date.now(),
      Sales_OrderNo: orderNo,
      CustomerName: selectedQuotation.CustomerName,
      Enquiry_No: selectedQuotation.Enquiry_No,
      Quotation_No: selectedQuotation.Offer_No,
      Quotation_Date: selectedQuotation.Offer_Date,
      Order_Date: new Date().toISOString().split('T')[0],
      Total_Amount: selectedQuotation.Total_Amount,
      Status: 'Confirmed',
      products: selectedQuotation.products || []
    };
    upsertLocalItem('pegatto_sales_orders', newOrder, ['id', 'Sales_OrderNo']);

    setIsConvertOpen(false);
    setSelectedQuotation(null);
    toast.success(`Sales Order ${orderNo} generated from Quotation ${selectedQuotation.Offer_No}`);

    try {
      await createSalesOrderAPI({
        Po_Number: orderNo,
        Customer_Name: selectedQuotation.CustomerName,
        Quotation_No: selectedQuotation.Offer_No,
        Po_Date: newOrder.Order_Date,
        Total_Amount: selectedQuotation.Total_Amount,
        Status: 'Confirmed',
        Sales_Details: (selectedQuotation.products || []).map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Final_Price: (p.quantity || 1) * (p.unit_price || 0)
        }))
      } as any);
    } catch (e) {
      console.warn('Backend order sync notice (persisted locally):', e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen p-6 space-y-6">
      {isCreateOpen || isEditOpen ? (
        /* CREATE / EDIT QUOTATION FORM VIEW (MATCHING IMAGE 1) */
        <div className="space-y-3">
          <h1 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {isCreateOpen ? 'Create Quotation' : 'Edit Quotation'}
          </h1>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-2xs [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg">
            <form onSubmit={isCreateOpen ? handleSaveCreate : handleSaveEdit}>
              {/* 2-Column Grid matching Screenshot 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Enquiry No */}
                  <div className="flex items-center gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Enquiry No <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex-1">
                      <select
                        value={formState.Enquiry_No}
                        onChange={(e) => handleEnquiryChange(e.target.value)}
                        className={`w-full appearance-none px-3 py-2 pr-8 text-xs rounded border ${
                          formErrors.Enquiry_No ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                        } bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                      >
                        <option value="">Select Enquiry No</option>
                        {enquiryOptions.map((enq) => {
                          const val = enq.Enquiry_No || enq.EnquiryId || enq.Enquiry_Id || String(enq.id);
                          return (
                            <option key={val} value={val}>{val}</option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      {formErrors.Enquiry_No && (
                        <p className="text-[11px] text-red-500 mt-1">{formErrors.Enquiry_No}</p>
                      )}
                    </div>
                  </div>

                  {/* Quotation Date */}
                  <div className="flex items-center gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Quotation Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formState.Offer_Date}
                      onChange={(e) => setFormState((prev) => ({ ...prev, Offer_Date: e.target.value }))}
                      className={`flex-1 px-3 py-2 text-xs rounded border ${
                        formErrors.Offer_Date ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                      } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                    />
                  </div>

                  {/* Price Book */}
                  <div className="flex items-center gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Price Book <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex-1">
                      <select
                        value={formState.Price_Book}
                        onChange={(e) => setFormState((prev) => ({ ...prev, Price_Book: e.target.value }))}
                        className={`w-full px-3 py-2 text-xs rounded border ${
                          formErrors.Price_Book ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                        } bg-transparent text-slate-900 dark:text-slate-100 appearance-none pr-8 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                      >
                        <option value="">Select Price Book</option>
                        {priceBookOptions.length > 0 ? (
                          priceBookOptions.map((pb) => (
                            <option key={pb.id || pb.name} value={pb.name}>
                              {pb.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Standard Retail Pricebook 2026">Standard Retail Pricebook 2026</option>
                            <option value="Corporate Tech Pricing">Corporate Tech Pricing</option>
                            <option value="Institutional Pricebook">Institutional Pricebook</option>
                            <option value="Wholesale Enterprise Book">Wholesale Enterprise Book</option>
                          </>
                        )}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
                      Terms & Conditions <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Terms and Conditions"
                      value={formState.Terms_Conditions}
                      onChange={(e) => setFormState((prev) => ({ ...prev, Terms_Conditions: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                  </div>

                  {/* Total Amount */}
                  <div className="flex items-center gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Total Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled
                      value={finalCalculatedAmount.toFixed(2)}
                      className="flex-1 px-3 py-2 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Customer Name */}
                  <div className="flex items-center gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Customer Name"
                        list="quotation-customer-suggestions"
                        value={formState.CustomerName}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded border ${
                          formErrors.CustomerName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                        } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                      />
                      <datalist id="quotation-customer-suggestions">
                        {customerOptions.map((c) => (
                          <option key={c.id || c.name} value={c.name} />
                        ))}
                      </datalist>
                      {formErrors.CustomerName && (
                        <p className="text-[11px] text-red-500 mt-1">{formErrors.CustomerName}</p>
                      )}
                    </div>
                  </div>

                  {/* Quotation Validity */}
                  <div className="flex items-center gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Quotation Validity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formState.Valid_Until}
                      onChange={(e) => setFormState((prev) => ({ ...prev, Valid_Until: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                  </div>

                  {/* Delivery Address */}
                  <div className="flex items-start gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Delivery Address"
                      value={formState.Delivery_Address}
                      onChange={(e) => setFormState((prev) => ({ ...prev, Delivery_Address: e.target.value }))}
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                  </div>

                  {/* Special Discount */}
                  <div className="flex items-center gap-3">
                    <label className="w-36 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Special Discount
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={formState.Special_Discount === 0 ? '0' : formState.Special_Discount}
                      onChange={(e) => setFormState((prev) => ({ ...prev, Special_Discount: parseFloat(e.target.value) || 0 }))}
                      className="flex-1 px-3 py-2 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table matching Screenshot 1 */}
              <div className="mt-8 border border-slate-200 dark:border-slate-800 rounded-md overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#f8f9fa] dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[170px]">Product Name</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Product Id</th>
                      <th className="py-2.5 px-3 min-w-[90px]">Uom</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Description</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Quantity</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Unit Price</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Net Amount</th>
                      <th className="py-2.5 px-3 text-center min-w-[60px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formState.products.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
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
                                    <option key={p.name + p.id} value={p.name}>
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
                            disabled
                            placeholder="Product Id"
                            value={row.product_id || ''}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled
                            placeholder="UOM"
                            value={row.uom || ''}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Description"
                            value={row.description || ''}
                            onChange={(e) => handleProductFieldChange(idx, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={1}
                            placeholder="Enter Quantity"
                            value={row.quantity || ''}
                            onChange={(e) => handleProductFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={0}
                            placeholder="Unit Price"
                            value={row.unit_price || ''}
                            onChange={(e) => handleProductFieldChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            disabled
                            placeholder="Net Amount"
                            value={row.subtotal ? row.subtotal.toFixed(2) : ''}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProductRow(idx)}
                            className="text-slate-700 hover:text-red-600 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* + Add Product */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleAddProductRow}
                  className="text-[#2A7D5B] hover:text-[#23674b] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  + Add Product
                </button>
              </div>

              {/* Centered Actions: Preview, Save, Cancel */}
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-5 py-2 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>

                <button
                  type="submit"
                  className="bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold px-6 py-2 rounded shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>

                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-5 py-2 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* QUOTATION LIST VIEW */
        <>
          {/* Top Header */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Quotation List
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
                  <span>( {filteredQuotations.length} ) Quotations</span>
                </button>

                {/* Filter Popover matching old retail MyOffer.js */}
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
                          <label className="text-slate-600 dark:text-slate-400 font-medium">Quotation Id</label>
                          <input
                            type="text"
                            placeholder="Quotation Id"
                            value={filterForm.offerId}
                            onChange={(e) => setFilterForm({ ...filterForm, offerId: e.target.value })}
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

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="submit"
                          className="bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold px-4 py-1.5 rounded transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Filter className="h-3.5 w-3.5" />
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

          {/* Main Table with existing header style */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                  <tr className="border-0">
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
                        <span>QUOTATION ID</span>
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
                        <span>PRICE BOOK</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                      <div className="flex items-center gap-1.5 flex-nowrap">
                        <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>TOTAL AMOUNT</span>
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[140px]">
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
                  {paginatedQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No quotations found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedQuotations.map((quotation) => {
                      const isConverted =
                        (quotation.Status as string) === 'Order Created' ||
                        (quotation.Status as string) === 'Sales Order Created';

                      return (
                        <tr
                          key={quotation.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                            {quotation.Offer_Date}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                            {quotation.Offer_No}
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-medium">
                            {quotation.CustomerName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            {quotation.Price_Book || 'Price A'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-medium">
                            {Number(quotation.Total_Amount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                            {isConverted ? 'Sales Order Created' : quotation.Status}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <button
                                  type="button"
                                  className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                                  title="Quotation Actions"
                                >
                                  <MoreHorizontal className="h-4.5 w-4.5" />
                                </button>
                              } />
                              <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                                <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                                  Quotation Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                  onClick={() => handleOpenEdit(quotation)}
                                >
                                  <SquarePen className="h-4 w-4 text-slate-500" /> Edit Quotation
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                  onClick={() => {
                                    toast.success(`Quotation mail sent for ${quotation.Offer_No}`);
                                  }}
                                >
                                  <Send className="h-4 w-4 text-cyan-600" /> Send Mail
                                </DropdownMenuItem>

                                {!isConverted && (
                                  <DropdownMenuItem
                                    className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600"
                                    onClick={() => handleOpenConvert(quotation)}
                                  >
                                    <ShoppingCart className="h-4 w-4 text-blue-600" /> Convert to Sales Order
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                                <DropdownMenuItem
                                  className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1.5 rounded-lg"
                                  onClick={() => handleOpenDelete(quotation)}
                                >
                                  <Trash2 className="h-4 w-4 text-rose-600" /> Delete Quotation
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

            {/* Bottom Pagination Controls */}
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
                      className={`h-8 w-8 rounded text-xs font-semibold cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7] font-bold dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                          : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
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
        </>
      )}

      {/* WARNING MODAL ON CANCEL (MATCHING IMAGE 2) */}
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

            {/* Action buttons matching screenshot 2 */}
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

      {/* QUOTATION PREVIEW MODAL */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-2xl p-6 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg">
          <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Quotation Preview
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-3 rounded border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-500">Enquiry No:</span>{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formState.Enquiry_No || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Customer Name:</span>{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formState.CustomerName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Quotation Date:</span>{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formState.Offer_Date || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Valid Until:</span>{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formState.Valid_Until || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Price Book:</span>{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formState.Price_Book || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500">Delivery Address:</span>{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formState.Delivery_Address || '-'}</span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200">
                  <tr>
                    <th className="p-2">Product Name</th>
                    <th className="p-2">Product ID</th>
                    <th className="p-2">UOM</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {formState.products.map((p, i) => (
                    <tr key={i}>
                      <td className="p-2 font-medium">{p.product_name || '-'}</td>
                      <td className="p-2 text-slate-500">{p.product_id || '-'}</td>
                      <td className="p-2 text-slate-500">{p.uom || '-'}</td>
                      <td className="p-2 text-right">{p.quantity}</td>
                      <td className="p-2 text-right">₹{(p.unit_price || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-semibold">₹{((p.quantity || 1) * (p.unit_price || 0)).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 font-semibold text-xs border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400">Special Discount: ₹{formState.Special_Discount || 0}</span>
              <span className="text-sm font-bold text-[#2A7D5B]">
                Total Amount: ₹{finalCalculatedAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONVERT TO SALES ORDER MODAL */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-blue-600 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Generate Sales Order
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 dark:text-slate-400 py-2">
            Are you sure you want to convert Quotation{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedQuotation?.Offer_No}
            </span>{' '}
            for <span className="font-semibold">{selectedQuotation?.CustomerName}</span> into a Sales Order?
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsConvertOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmOrderConversion}
              className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Confirm Order
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
            Are you sure you want to delete quotation{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {selectedQuotation?.Offer_No}
            </span>{' '}
            for <span className="font-semibold">{selectedQuotation?.CustomerName}</span>?
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
    </div>
  );
}
