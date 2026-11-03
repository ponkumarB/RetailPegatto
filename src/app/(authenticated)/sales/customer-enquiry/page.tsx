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
  Calendar as CalendarIcon,
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
  CheckSquare,
  Mail,
  PhoneCall,
  RefreshCw,
  FileText,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  CustomerEnquiry,
  SalesQuotation,
  ProductLineItem,
  fetchEnquiriesAPI,
  createEnquiryAPI,
  updateEnquiryAPI,
  deleteEnquiryAPI,
  searchEnquiriesAPI,
  filterEnquiriesAPI,
  fetchAccountsLookupAPI,
  fetchProductsLookupAPI,
  DEFAULT_SALES_PRODUCTS,
  DEFAULT_CUSTOMER_ACCOUNTS,
  createQuotationAPI,
} from '@/service/api/sales/api';
import { getLocalData, upsertLocalItem, deleteLocalItem, mergeWithLocalData } from '@/utils/persistentStorage';

const ITEMS_PER_PAGE = 10;

export default function CustomerEnquiryPage() {
  const router = useRouter();

  // Dynamic State with persistent localStorage cache
  const [enquiries, setEnquiries] = useState<CustomerEnquiry[]>(() => getLocalData<CustomerEnquiry>('pegatto_customer_enquiries'));
  const [customerOptions, setCustomerOptions] = useState<{ id: number; name: string; contact?: string; phone?: string; email?: string }[]>([]);
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [masterProducts, setMasterProducts] = useState<{ name: string; id: string; uom: string; desc: string; price: number }[]>([]);
  const [manualProductRows, setManualProductRows] = useState<{ [index: number]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Load customer and product lookups dynamically from API
  React.useEffect(() => {
    async function loadLookups() {
      try {
        const [accountsData, productsData] = await Promise.all([
          fetchAccountsLookupAPI().catch(() => []),
          fetchProductsLookupAPI().catch(() => [])
        ]);
        const rawAccounts = (Array.isArray(accountsData) && accountsData.length > 0)
          ? accountsData
          : DEFAULT_CUSTOMER_ACCOUNTS;

        const accs = rawAccounts
          .map((a: any) => ({
            id: Number(a.id),
            name: String(a.Organization_Name || a.Company_Name || a.Account_Name || a.name || '').trim(),
            contact: String(a.Contact_Person || a.Contact_Name || a.Lead_Name || a.contact || '').trim(),
            phone: String(a.Phone_Number || a.Mobile_Number || a.phone || '').trim(),
            email: String(a.Email || a.email || '').trim(),
          }))
          .filter((c: any) => Boolean(c.name));
        setCustomerOptions(accs);

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
      } catch (err) {
        console.error('Failed to load lookups:', err);
      }
    }
    loadLookups();
  }, []);

  // Filter Popover State matching old retail EnquiryRightCard.js
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterForm, setFilterForm] = useState({
    enquiryId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });
  const [activeFilters, setActiveFilters] = useState({
    enquiryId: '',
    customerName: '',
    fromDate: '',
    toDate: ''
  });

  const loadEnquiries = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeFilters.enquiryId || activeFilters.customerName || activeFilters.fromDate || activeFilters.toDate) {
        const res = await filterEnquiriesAPI({
          fromdate: activeFilters.fromDate || undefined,
          todate: activeFilters.toDate || undefined,
          Customer_Name: activeFilters.customerName || undefined,
          Enquiry_Id: activeFilters.enquiryId || undefined,
        });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setEnquiries(list.map((item: any) => ({
            id: item.id,
            EnquiryId: item.Enquiry_Id || item.EnquiryId || `ENQ-${item.id}`,
            Enquiry_Name: item.Enquiry_Name || 'Enquiry',
            CustomerName: item.Customer_Name || item.CustomerName || '',
            ContactPerson: item.Contact_Person || item.ContactPerson || '',
            ContactPhone: item.Contact_Phone || item.ContactPhone || '',
            ContactEmail: item.Contact_Email || item.ContactEmail || '',
            EnquiryDate: item.Enquiry_Date?.split('T')[0] || item.EnquiryDate || '',
            QT_Status: item.QT_Status || 'Pending',
            Account_Owner: item.Sales_Person || item.Account_Owner || '',
            Remarks: item.Remarks || '',
            products: Array.isArray(item.ProductEnquiry_Details) ? item.ProductEnquiry_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || '',
              description: p.Description || '',
              quantity: Number(p.Quantity || 1),
              unit_price: Number(p.Unit_Price || 0),
            })) : [],
          })));
        }
      } else if (searchTerm.trim()) {
        const res = await searchEnquiriesAPI(searchTerm.trim());
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          setEnquiries(list.map((item: any) => ({
            id: item.id,
            EnquiryId: item.Enquiry_Id || item.EnquiryId || `ENQ-${item.id}`,
            Enquiry_Name: item.Enquiry_Name || 'Enquiry',
            CustomerName: item.Customer_Name || item.CustomerName || '',
            ContactPerson: item.Contact_Person || item.ContactPerson || '',
            ContactPhone: item.Contact_Phone || item.ContactPhone || '',
            ContactEmail: item.Contact_Email || item.ContactEmail || '',
            EnquiryDate: item.Enquiry_Date?.split('T')[0] || item.EnquiryDate || '',
            QT_Status: item.QT_Status || 'Pending',
            Account_Owner: item.Sales_Person || item.Account_Owner || '',
            Remarks: item.Remarks || '',
            products: Array.isArray(item.ProductEnquiry_Details) ? item.ProductEnquiry_Details.map((p: any) => ({
              id: p.id,
              product_name: p.Product_Name || '',
              product_id: p.Product_Id || '',
              uom: p.UOM || '',
              description: p.Description || '',
              quantity: Number(p.Quantity || 1),
              unit_price: Number(p.Unit_Price || 0),
            })) : [],
          })));
        }
      } else {
        const res = await fetchEnquiriesAPI(currentPage);
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mappedBackend = list.map((item: any) => ({
          id: item.id,
          EnquiryId: item.Enquiry_Id || item.EnquiryId || `ENQ-${item.id}`,
          Enquiry_Name: item.Enquiry_Name || 'Enquiry',
          CustomerName: item.Customer_Name || item.CustomerName || '',
          ContactPerson: item.Contact_Person || item.ContactPerson || '',
          ContactPhone: item.Contact_Phone || item.ContactPhone || '',
          ContactEmail: item.Contact_Email || item.ContactEmail || '',
          EnquiryDate: item.Enquiry_Date?.split('T')[0] || item.EnquiryDate || '',
          QT_Status: item.QT_Status || 'Pending',
          Account_Owner: item.Sales_Person || item.Account_Owner || '',
          Remarks: item.Remarks || '',
          products: Array.isArray(item.ProductEnquiry_Details) ? item.ProductEnquiry_Details.map((p: any) => ({
            id: p.id,
            product_name: p.Product_Name || '',
            product_id: p.Product_Id || '',
            uom: p.UOM || '',
            description: p.Description || '',
            quantity: Number(p.Quantity || 1),
            unit_price: Number(p.Unit_Price || 0),
          })) : [],
        }));
        const merged = mergeWithLocalData<CustomerEnquiry>('pegatto_customer_enquiries', mappedBackend, ['id', 'EnquiryId']);
        setEnquiries(merged);
      }
    } catch (e) {
      console.error('Failed to load enquiries from API:', e);
      const local = getLocalData<CustomerEnquiry>('pegatto_customer_enquiries');
      if (local.length > 0) {
        setEnquiries(local);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, searchTerm, currentPage]);

  React.useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);

  const [selectedEnquiry, setSelectedEnquiry] = useState<CustomerEnquiry | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Form State for Create / Edit
  const [formState, setFormState] = useState<{
    EnquiryId?: string;
    Enquiry_Name: string;
    CustomerName: string;
    ContactPerson: string;
    EnquiryDate: string;
    products: ProductLineItem[];
  }>({
    Enquiry_Name: '',
    CustomerName: '',
    ContactPerson: '',
    EnquiryDate: new Date().toISOString().split('T')[0],
    products: [
      { id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0 }
    ]
  });

  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Check entered/modified fields
  const getModifiedFields = (): string[] => {
    const fields: string[] = [];

    if (isEditOpen && selectedEnquiry) {
      if (formState.Enquiry_Name !== selectedEnquiry.Enquiry_Name) fields.push(`Enquiry Name ("${formState.Enquiry_Name}")`);
      if (formState.CustomerName !== selectedEnquiry.CustomerName) fields.push(`Customer Name ("${formState.CustomerName}")`);
      if (formState.ContactPerson !== selectedEnquiry.ContactPerson) fields.push(`Contact Person ("${formState.ContactPerson}")`);
      if (formState.EnquiryDate !== selectedEnquiry.EnquiryDate) fields.push(`Enquiry Date ("${formState.EnquiryDate}")`);
      if (JSON.stringify(formState.products) !== JSON.stringify(selectedEnquiry.products || [])) {
        fields.push(`Product line items`);
      }
      return fields;
    }

    // In Create mode:
    if (formState.Enquiry_Name.trim()) fields.push(`Enquiry Name ("${formState.Enquiry_Name.trim()}")`);
    if (formState.CustomerName.trim()) fields.push(`Customer Name ("${formState.CustomerName.trim()}")`);
    if (formState.ContactPerson.trim()) fields.push(`Contact Person ("${formState.ContactPerson.trim()}")`);

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
    setSelectedEnquiry(null);
  };

  // Quotation Conversion Form State
  const [quotationForm, setQuotationForm] = useState({
    Offer_No: '',
    CustomerName: '',
    Enquiry_No: '',
    Offer_Date: new Date().toISOString().split('T')[0],
    Valid_Until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    PriceBook: 'Standard Retail Pricebook 2026',
    DeliveryAddress: 'Warehouse Dock A, Main Terminal',
    TermsCondition: '100% against delivery, 30 days valid offer',
    products: [] as ProductLineItem[]
  });

  // Filter logic
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      // Realtime search input
      const matchSearch =
        searchTerm === '' ||
        item.EnquiryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Enquiry_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.CustomerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ContactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.QT_Status.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // Popover filters
      if (activeFilters.enquiryId && !item.EnquiryId.toLowerCase().includes(activeFilters.enquiryId.toLowerCase())) {
        return false;
      }
      if (activeFilters.customerName && !item.CustomerName.toLowerCase().includes(activeFilters.customerName.toLowerCase())) {
        return false;
      }
      if (activeFilters.fromDate) {
        const itemDate = new Date(item.EnquiryDate);
        const fromD = new Date(activeFilters.fromDate);
        if (itemDate < fromD) return false;
      }
      if (activeFilters.toDate) {
        const itemDate = new Date(item.EnquiryDate);
        const toD = new Date(activeFilters.toDate);
        if (itemDate > toD) return false;
      }

      return true;
    });
  }, [enquiries, searchTerm, activeFilters]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEnquiries.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEnquiries = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredEnquiries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEnquiries, safeCurrentPage]);

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
    const empty = { enquiryId: '', customerName: '', fromDate: '', toDate: '' };
    setFilterForm(empty);
    setActiveFilters(empty);
    setCurrentPage(1);
    toast.info('Filters reset');
  };

  // Open Create Dialog
  const handleOpenCreate = () => {
    const nextSeq = enquiries.length + 46;
    const paddedId = `PRE${String(nextSeq).padStart(10, '0')}`;
    setIsManualCustomer(false);
    setFormErrors({});
    setFormState({
      EnquiryId: paddedId,
      Enquiry_Name: '',
      CustomerName: '',
      ContactPerson: '',
      EnquiryDate: new Date().toISOString().split('T')[0],
      products: [
        { id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0 }
      ]
    });
    setIsCreateOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (enquiry: CustomerEnquiry) => {
    setSelectedEnquiry(enquiry);
    const isCustom = !customerOptions.some((c) => c.name === enquiry.CustomerName);
    setIsManualCustomer(Boolean(enquiry.CustomerName && isCustom));
    setFormErrors({});
    setFormState({
      EnquiryId: enquiry.EnquiryId,
      Enquiry_Name: enquiry.Enquiry_Name,
      CustomerName: enquiry.CustomerName,
      ContactPerson: enquiry.ContactPerson,
      EnquiryDate: enquiry.EnquiryDate,
      products: (enquiry.products && enquiry.products.length > 0)
        ? [...enquiry.products]
        : [{ id: 1, product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0 }]
    });
    setIsEditOpen(true);
  };

  // Open Delete Dialog
  const handleOpenDelete = (enquiry: CustomerEnquiry) => {
    setSelectedEnquiry(enquiry);
    setIsDeleteOpen(true);
  };

  // Open Convert to Quotation Dialog
  const handleOpenConvert = (enquiry: CustomerEnquiry) => {
    setSelectedEnquiry(enquiry);
    const offerSeq = Math.floor(1000 + Math.random() * 9000);
    setQuotationForm({
      Offer_No: `QT-2026-${offerSeq}`,
      CustomerName: enquiry.CustomerName,
      Enquiry_No: enquiry.EnquiryId,
      Offer_Date: new Date().toISOString().split('T')[0],
      Valid_Until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      PriceBook: 'Standard Retail Pricebook 2026',
      DeliveryAddress: 'Client Designated Location',
      TermsCondition: '100% advance against PI. Delivery in 7 working days.',
      products: enquiry.products || []
    });
    setIsConvertOpen(true);
  };

  // Product row handlers
  const handleAddProductRow = () => {
    setFormState((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { id: Date.now(), product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0 }
      ]
    }));
  };

  const handleRemoveProductRow = (index: number) => {
    setFormState((prev) => {
      const updated = prev.products.filter((_, idx) => idx !== index);
      return {
        ...prev,
        products: updated.length > 0 ? updated : [
          { id: Date.now(), product_name: '', product_id: '', uom: '', description: '', quantity: 1, unit_price: 0 }
        ]
      };
    });
  };

  const handleCustomerSelect = (custName: string) => {
    const contactInfo = customerOptions.find(
      (c) => c.name.toLowerCase() === custName.trim().toLowerCase()
    );
    setFormState((prev) => ({
      ...prev,
      CustomerName: custName,
      ContactPerson: contactInfo?.contact || prev.ContactPerson || '',
      Enquiry_Name: prev.Enquiry_Name ? prev.Enquiry_Name : (custName ? `${custName} Enquiry` : '')
    }));

    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.CustomerName;
      delete copy.ContactPerson;
      delete copy.Enquiry_Name;
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

    const master = masterProducts.find((p) => p.name === productName);
    setFormState((prev) => {
      const updated = [...prev.products];
      if (master) {
        updated[index] = {
          ...updated[index],
          product_name: master.name,
          product_id: master.id || `PROD-${String(index + 1).padStart(3, '0')}`,
          uom: master.uom || 'Unit',
          description: master.desc || '',
          unit_price: master.price || 0
        };
      } else {
        updated[index] = {
          ...updated[index],
          product_name: productName,
          product_id: updated[index].product_id || `PRD-${String(Date.now()).slice(-4)}`,
          uom: updated[index].uom || 'Unit'
        };
      }
      return { ...prev, products: updated };
    });

    if (productName.trim()) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[`product_${index}`];
        return copy;
      });
    }
  };

  const handleProductFieldChange = (index: number, field: keyof ProductLineItem, value: any) => {
    setFormState((prev) => {
      const updated = [...prev.products];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return { ...prev, products: updated };
    });
  };

  // Validate form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formState.Enquiry_Name.trim()) {
      errors.Enquiry_Name = 'Enquiry Name is required';
    }
    if (!formState.CustomerName.trim()) {
      errors.CustomerName = 'Customer Name is required';
    }
    if (!formState.ContactPerson.trim()) {
      errors.ContactPerson = 'Contact Person is required';
    }
    if (!formState.EnquiryDate) {
      errors.EnquiryDate = 'Enquiry Date is required';
    }

    formState.products.forEach((p, idx) => {
      if (!p.product_name.trim()) {
        errors[`product_${idx}`] = 'Product is required';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save new Enquiry
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const matchedAccount = customerOptions.find(
      (c) => c.name.toLowerCase() === formState.CustomerName.toLowerCase()
    );
    const resolvedAccountId = matchedAccount?.id || (customerOptions.length > 0 ? customerOptions[0].id : 1);

    const newEnquiry: CustomerEnquiry = {
      id: Date.now(),
      EnquiryId: formState.EnquiryId || `PRE${String(enquiries.length + 46).padStart(10, '0')}`,
      Enquiry_Name: formState.Enquiry_Name,
      CustomerName: formState.CustomerName,
      CustomerId: resolvedAccountId,
      AccountId: resolvedAccountId,
      ContactPerson: formState.ContactPerson,
      EnquiryDate: formState.EnquiryDate,
      QT_Status: 'Quotation Not Created',
      Remarks: '',
      products: formState.products
    };

    upsertLocalItem('pegatto_customer_enquiries', newEnquiry, ['id', 'EnquiryId']);
    setEnquiries((prev) => [newEnquiry, ...prev.filter(e => e.id !== newEnquiry.id)]);
    setIsCreateOpen(false);
    toast.success(`Enquiry ${newEnquiry.EnquiryId} created successfully`);

    try {
      await createEnquiryAPI({
        id: newEnquiry.id,
        EnquiryId: newEnquiry.EnquiryId,
        Enquiry_Id: newEnquiry.EnquiryId,
        Enquiry_Name: formState.Enquiry_Name,
        CustomerName: formState.CustomerName,
        ContactPerson: formState.ContactPerson,
        EnquiryDate: formState.EnquiryDate,
        AccountId: resolvedAccountId,
        AccountOwner: matchedAccount?.contact || 'Admin',
        EnquiryDetails: formState.products.map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Description: p.description,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Amount: (p.quantity || 1) * (p.unit_price || 0),
          Discount: 0,
          Tax: 0,
          Final_Price: (p.quantity || 1) * (p.unit_price || 0),
        })),
      } as any);
      loadEnquiries();
    } catch (err) {
      console.warn('Backend enquiry save notice (persisted locally):', err);
    }
  };

  // Save edit Enquiry
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !validateForm()) return;

    const matchedAccount = customerOptions.find(
      (c) => c.name.toLowerCase() === formState.CustomerName.toLowerCase()
    );
    const resolvedAccountId = matchedAccount?.id || (selectedEnquiry as any).AccountId || (customerOptions.length > 0 ? customerOptions[0].id : 1);

    const updated: CustomerEnquiry = {
      ...selectedEnquiry,
      Enquiry_Name: formState.Enquiry_Name,
      CustomerName: formState.CustomerName,
      CustomerId: resolvedAccountId,
      AccountId: resolvedAccountId,
      ContactPerson: formState.ContactPerson,
      EnquiryDate: formState.EnquiryDate,
      products: formState.products
    };

    upsertLocalItem('pegatto_customer_enquiries', updated, ['id', 'EnquiryId']);
    setEnquiries((prev) =>
      prev.map((item) => (item.id === selectedEnquiry.id ? updated : item))
    );
    setIsEditOpen(false);
    toast.success(`Enquiry ${selectedEnquiry.EnquiryId} updated`);

    try {
      await updateEnquiryAPI({
        id: selectedEnquiry.id,
        Enquiry_Name: formState.Enquiry_Name,
        CustomerName: formState.CustomerName,
        ContactPerson: formState.ContactPerson,
        EnquiryDate: formState.EnquiryDate,
        AccountId: resolvedAccountId,
        AccountOwner: matchedAccount?.contact || (selectedEnquiry as any).AccountOwner || 'Admin',
        EnquiryDetails: formState.products.map(p => ({
          id: p.id,
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Description: p.description,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Amount: (p.quantity || 1) * (p.unit_price || 0),
          Discount: 0,
          Tax: 0,
          Final_Price: (p.quantity || 1) * (p.unit_price || 0),
        })),
      } as any);
      loadEnquiries();
    } catch (err) {
      console.warn('Backend enquiry update notice (persisted locally):', err);
    }
  };

  // Delete Enquiry
  const handleConfirmDelete = async () => {
    if (!selectedEnquiry) return;
    const delId = selectedEnquiry.id;
    deleteLocalItem('pegatto_customer_enquiries', delId, ['id', 'EnquiryId']);
    setEnquiries((prev) => prev.filter((item) => item.id !== delId));
    setIsDeleteOpen(false);
    toast.success(`Enquiry ${selectedEnquiry.EnquiryId} deleted`);

    try {
      await deleteEnquiryAPI(delId);
      loadEnquiries();
    } catch (err) {
      console.warn('Backend enquiry delete notice (persisted locally):', err);
    }
  };

  // Convert to Quotation
  const handleConfirmQuotationConversion = async () => {
    if (!selectedEnquiry) return;
    const updatedEnquiry = { ...selectedEnquiry, QT_Status: 'Quotation Created' as const };
    upsertLocalItem('pegatto_customer_enquiries', updatedEnquiry, ['id', 'EnquiryId']);
    setEnquiries((prev) =>
      prev.map((item) =>
        item.id === selectedEnquiry.id ? updatedEnquiry : item
      )
    );

    const totalAmount = (quotationForm.products || []).reduce(
      (sum, p) => sum + (Number(p.quantity || 1) * Number(p.unit_price || 0)),
      0
    );

    const newQuotation: SalesQuotation = {
      id: Date.now(),
      Offer_No: quotationForm.Offer_No || `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      CustomerName: quotationForm.CustomerName || selectedEnquiry.CustomerName,
      Enquiry_No: selectedEnquiry.EnquiryId,
      Offer_Date: quotationForm.Offer_Date,
      Valid_Until: quotationForm.Valid_Until,
      Price_Book: quotationForm.PriceBook,
      Delivery_Address: quotationForm.DeliveryAddress,
      Total_Amount: totalAmount,
      Status: 'Quotation Created',
      products: quotationForm.products || []
    };
    upsertLocalItem('pegatto_quotations', newQuotation, ['id', 'Offer_No']);

    setIsConvertOpen(false);
    toast.success(`Quotation ${newQuotation.Offer_No} generated for ${selectedEnquiry.CustomerName}!`);

    try {
      await createQuotationAPI({
        id: newQuotation.id,
        Offer_No: newQuotation.Offer_No,
        Customer_Name: newQuotation.CustomerName,
        Enquiry_No: selectedEnquiry.EnquiryId,
        Offer_Date: newQuotation.Offer_Date,
        Valid_Until: newQuotation.Valid_Until,
        Price_Book: newQuotation.Price_Book,
        Total_Amount: totalAmount,
        ProductOffer_Details: (quotationForm.products || []).map(p => ({
          Product_Name: p.product_name,
          Product_Id: p.product_id,
          UOM: p.uom,
          Quantity: p.quantity,
          Unit_Price: p.unit_price,
          Total_Price: (p.quantity || 1) * (p.unit_price || 0),
        }))
      } as any);
    } catch (e) {
      console.warn('Backend quotation sync notice (persisted locally):', e);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 min-h-screen p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Customer Enquiry List
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          {/* Subtitle with filter button and active count */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className="flex items-center gap-2 text-[#198754] hover:text-[#146c43] font-semibold text-sm cursor-pointer transition-colors"
              title="Click to toggle filters"
            >
              <Filter className="h-4 w-4 text-[#198754]" />
              <span>( {filteredEnquiries.length} ) Enquiries</span>
            </button>

            {/* Filter Popover matching old retail EnquiryRightCard.js */}
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
                      <label className="text-slate-600 dark:text-slate-400 font-medium">Enquiry Id</label>
                      <input
                        type="text"
                        placeholder="Enquiry Id"
                        value={filterForm.enquiryId}
                        onChange={(e) => setFilterForm({ ...filterForm, enquiryId: e.target.value })}
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

      {/* Main Table matching existing system style and user's screenshot */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr className="border-0">
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>ENQUIRY NO</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[160px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>ENQUIRY NAME</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[170px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>CUSTOMER NAME</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[140px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>CONTACT PERSON</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[130px]">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>ENQUIRY DATE</span>
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
              {paginatedEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No customer enquiries found matching the criteria.
                  </td>
                </tr>
              ) : (
                paginatedEnquiries.map((enquiry) => {
                  const isConverted = enquiry.QT_Status === 'Quotation Created';

                  return (
                    <tr
                      key={enquiry.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {enquiry.EnquiryId}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {enquiry.Enquiry_Name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {enquiry.CustomerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {enquiry.ContactPerson}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {enquiry.EnquiryDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {enquiry.QT_Status}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Enquiry Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                              Enquiry Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => handleOpenEdit(enquiry)}
                            >
                              <SquarePen className="h-4 w-4 text-slate-500" /> Edit Enquiry
                            </DropdownMenuItem>

                            {!isConverted && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600"
                                onClick={() => handleOpenConvert(enquiry)}
                              >
                                <Send className="h-4 w-4 text-blue-600" /> Convert to Quotation
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />

                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-2 py-1.5 rounded-lg"
                              onClick={() => handleOpenDelete(enquiry)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" /> Delete Enquiry
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

        {/* Bottom Pagination Controls matching user screenshot */}
        <div className="p-4 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 select-none">
            {/* First Page button |< */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs"
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>

            {/* Previous Page button < */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="h-8 w-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs"
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {/* Numeric Page Buttons */}
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

            {/* Next Page button > */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-xs"
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            {/* Last Page button >| */}
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

      {/* CREATE / EDIT ENQUIRY MODAL matching Image 2 */}
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
              {isCreateOpen ? 'Create Enquiry' : 'Edit Enquiry'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={isCreateOpen ? handleSaveCreate : handleSaveEdit} className="space-y-6">
            {/* 2-Column Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
              {/* Row 1: Enquiry Name & Customer Name */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Enquiry Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enquiry Name"
                  value={formState.Enquiry_Name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, Enquiry_Name: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs rounded border ${
                    formErrors.Enquiry_Name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                />
                {formErrors.Enquiry_Name && (
                  <p className="text-[11px] text-red-500">{formErrors.Enquiry_Name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    list="customer-suggestions-list"
                    value={formState.CustomerName}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded border ${
                      formErrors.CustomerName ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                  />
                  <datalist id="customer-suggestions-list">
                    {customerOptions.map((c) => (
                      <option key={c.id || c.name} value={c.name} />
                    ))}
                  </datalist>
                </div>
                {formErrors.CustomerName && (
                  <p className="text-[11px] text-red-500">{formErrors.CustomerName}</p>
                )}
              </div>

              {/* Row 2: Contact Person & Enquiry Date */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={formState.ContactPerson}
                  onChange={(e) => setFormState((prev) => ({ ...prev, ContactPerson: e.target.value }))}
                  className={`w-full px-3 py-2 text-xs rounded border ${
                    formErrors.ContactPerson ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                />
                {formErrors.ContactPerson && (
                  <p className="text-[11px] text-red-500">{formErrors.ContactPerson}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-200">
                  Enquiry Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formState.EnquiryDate}
                    onChange={(e) => setFormState((prev) => ({ ...prev, EnquiryDate: e.target.value }))}
                    className={`w-full px-3 py-2 text-xs rounded border ${
                      formErrors.EnquiryDate ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                    } bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]`}
                  />
                </div>
                {formErrors.EnquiryDate && (
                  <p className="text-[11px] text-red-500">{formErrors.EnquiryDate}</p>
                )}
              </div>
            </div>

            {/* Line Items Table matching Image 2 */}
            <div className="space-y-3 pt-2">
              <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 w-32">Product Id</th>
                      <th className="py-2.5 px-3 w-28">UOM</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 w-28">Quantity</th>
                      <th className="py-2.5 px-3 w-14 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                    {formState.products.map((row, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-800/40">
                          {/* Product Name Select or Custom Input */}
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
                                    className="absolute right-1.5 text-xs text-slate-400 hover:text-emerald-600 p-0.5"
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
                                    <option value="">Select Product</option>
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

                          {/* Product ID */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Product ID"
                              value={row.product_id || ''}
                              onChange={(e) => handleProductFieldChange(idx, 'product_id', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>

                          {/* UOM */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="UOM"
                              value={row.uom || ''}
                              onChange={(e) => handleProductFieldChange(idx, 'uom', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>

                          {/* Description */}
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Description"
                              value={row.description || ''}
                              onChange={(e) => handleProductFieldChange(idx, 'description', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>

                          {/* Quantity */}
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

                          {/* Action Delete */}
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

                        {/* Validation message row */}
                        {formErrors[`product_${idx}`] && (
                          <tr>
                            <td colSpan={6} className="px-3 pb-1 text-[11px] text-red-500 font-medium">
                              {formErrors[`product_${idx}`]}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* + Add Product button */}
              <button
                type="button"
                onClick={handleAddProductRow}
                className="text-[#2A7D5B] hover:text-[#23674b] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                + Add Product
              </button>
            </div>

            {/* Centered Save and Cancel buttons matching Image 2 */}
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

      {/* CONVERT TO QUOTATION MODAL */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-2xl p-6 bg-white dark:bg-slate-900 rounded-[24px] shadow-xl [&_input]:rounded-lg [&_select]:rounded-lg [&_textarea]:rounded-lg">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-blue-600" />
              Generate Quotation for Enquiry {selectedEnquiry?.EnquiryId}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-500 font-medium">Quotation No</label>
                <input
                  readOnly
                  value={quotationForm.Offer_No}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">Customer</label>
                <input
                  readOnly
                  value={quotationForm.CustomerName}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">Quotation Date</label>
                <input
                  type="date"
                  value={quotationForm.Offer_Date}
                  onChange={(e) => setQuotationForm((prev) => ({ ...prev, Offer_Date: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="text-slate-500 font-medium">Offer Validity</label>
                <input
                  type="date"
                  value={quotationForm.Valid_Until}
                  onChange={(e) => setQuotationForm((prev) => ({ ...prev, Valid_Until: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-500 font-medium">Price Book</label>
                <input
                  value={quotationForm.PriceBook}
                  onChange={(e) => setQuotationForm((prev) => ({ ...prev, PriceBook: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-500 font-medium">Delivery Address</label>
                <input
                  value={quotationForm.DeliveryAddress}
                  onChange={(e) => setQuotationForm((prev) => ({ ...prev, DeliveryAddress: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
                />
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden mt-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                  <tr>
                    <th className="p-2">Product Name</th>
                    <th className="p-2 w-20">Quantity</th>
                    <th className="p-2 w-24">Unit Price</th>
                    <th className="p-2 w-24 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedEnquiry?.products || []).map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{p.product_name}</td>
                      <td className="p-2">{p.quantity}</td>
                      <td className="p-2">₹{(p.unit_price || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-semibold">
                        ₹{((p.unit_price || 0) * (p.quantity || 1)).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsConvertOpen(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmQuotationConversion}
              className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-4 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              Generate & Send Quotation
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
            Are you sure you want to delete this enquiry ?
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
