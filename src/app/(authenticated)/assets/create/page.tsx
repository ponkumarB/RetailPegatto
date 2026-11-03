'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { fetchAssetSubCategoriesByCategory, AssetSubCategory } from '@/service/api/Assets';
import { fetchUsersList } from '@/service/api/Leads/api';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Upload,
  X,
  FileText,
  Info,
  Smartphone,
  Monitor,
  Laptop,
  Printer,
  Mouse as MouseIcon,
  Keyboard as KeyboardIcon,
  HardDrive,
  Headphones,
  Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Asset } from '@/types/asset';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchFromApi } from '@/service/apiClient';

export default function CreateAssetPage() {
  const router = useRouter();
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedDocFiles, setSelectedDocFiles] = useState<File[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const {
    addAsset,
    categories,
    paginatedCategories,
    categoriesCount,
    categoriesPage,
    fetchCategoriesPage,
    paginatedSubCategories,
    subcategoriesCount,
    subcategoriesPage,
    fetchSubCategoriesPage,
    addCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    isLoaded,
    fetchInitialData,
    isLoading,
    vendors,
    rawCategories
  } = useAssetStore();

  useEffect(() => {
    if (!isLoaded) {
      fetchInitialData();
    }
  }, [isLoaded, fetchInitialData]);

  const handleDeleteSubcategory = (categoryId: string, name: string, subcategoryId?: string) => {
    toast.warning(`Are you sure you want to delete subcategory "${name}"?`, {
      action: {
        label: 'Delete',
        onClick: () => {
          deleteSubcategory(categoryId, name, subcategoryId).then(() => {
            const catIdNum = Number(categoryId);
            if (!isNaN(catIdNum)) {
              fetchDynamicSubcategories(catIdNum);
            }
          });
        }
      }
    });
  };

  const handleDeleteCategory = (categoryId: string, name: string) => {
    toast.warning(`Are you sure you want to delete category "${name}"? Assets under this category will fall back to "Other".`, {
      action: {
        label: 'Delete',
        onClick: () => {
          deleteCategory(categoryId);
          if (highlightedCategoryName === name) {
            setHighlightedCategoryName('Other');
          }
        }
      }
    });
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    tagId: '',
    type: 'Hardware',
    category: 'Laptop',
    subcategory: 'Gaming Laptop',
    brand: '',
    model: '',
    serialNumber: '',
    barcodeRfid: '',
    status: 'Available',
    purchaseDate: '',
    warrantyExpiryDate: '',
    purchasePrice: '',
    vendorSupplier: '',
    invoiceNumber: '',
    poNumber: '',
    criticality: 'Medium',
    assignedTo: '',
    department: '',
    location: '',
    reportingManager: '',
    description: '',
    configurationSpecification: '',
    operatingSystemSoftware: '',
    ipAddress: '',
    macAddress: '',
    assetValue: '',
    depreciationMethod: 'Straight Line',
    depreciationRate: '',
    notes: '',
    image: ''
  });

  const [documents, setDocuments] = useState<string[]>([]);
  const [docInput, setDocInput] = useState('');

  // Category Management UI States
  const [showCategoryMgmt, setShowCategoryMgmt] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'categories' | 'subcategories'>('categories');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedParentCatId, setSelectedParentCatId] = useState('');
  const setSelectedParentCatIdStr = (val: string) => setSelectedParentCatId(val);

  // Dynamic Subcategories states
  const [dynamicSubcategories, setDynamicSubcategories] = useState<Record<string, AssetSubCategory[]>>({});
  const [formSubcategories, setFormSubcategories] = useState<AssetSubCategory[]>([]);
  const [loadingFormSubcategories, setLoadingFormSubcategories] = useState(false);

  // Helper to load subcategories for a given category ID dynamically
  const fetchDynamicSubcategories = async (categoryId: number) => {
    try {
      const data = await fetchAssetSubCategoriesByCategory(categoryId);
      setDynamicSubcategories(prev => ({
        ...prev,
        [categoryId.toString()]: data
      }));
    } catch (error) {
      console.error(`Failed to fetch subcategories for category ${categoryId}`, error);
    }
  };

  // Synchronize form subcategories based on selected category in Basic Info
  useEffect(() => {
    if (categories.length > 0 && formData.category) {
      const selectedCatObj = categories.find(c => c.name === formData.category);
      if (selectedCatObj) {
        const catIdNum = Number(selectedCatObj.id);
        if (!isNaN(catIdNum)) {
          setLoadingFormSubcategories(true);
          fetchAssetSubCategoriesByCategory(catIdNum)
            .then(data => {
              setFormSubcategories(data);
              setLoadingFormSubcategories(false);

              // Set the default subcategory to the first one in the list if current subcategory is not in the list
              const subName = formData.subcategory;
              const hasSub = data.some(s => s.SubCategory_Name === subName);
              if (!hasSub && data.length > 0) {
                handleInputChange('subcategory', data[0].SubCategory_Name);
              }
            })
            .catch(err => {
              console.error('Failed to fetch subcategories for form', err);
              setLoadingFormSubcategories(false);
            });
        }
      }
    }
  }, [formData.category, categories]);

  // Load subcategories for already expanded categories on initial load/mount
  useEffect(() => {
    if (categories.length > 0) {
      categories.forEach(c => {
        if (expandedCategories[c.id] && !dynamicSubcategories[c.id]) {
          const catIdNum = Number(c.id);
          if (!isNaN(catIdNum)) {
            fetchDynamicSubcategories(catIdNum);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

  // Track expanded categories in the tree view (default open first few)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'cat-1': true,
    'cat-2': true,
    'cat-3': true,
    'cat-4': true
  });

  // Highlighted category in the tree view (for "+ Add Subcategory" default selection)
  const [highlightedCategoryName, setHighlightedCategoryName] = useState<string>('Laptop');

  const handleCategoryClick = async (category: any) => {
    setHighlightedCategoryName(category.name);
    // Expand category when clicked
    setExpandedCategories(prev => ({ ...prev, [category.id]: true }));
    const catIdNum = Number(category.id);
    if (!isNaN(catIdNum)) {
      await fetchDynamicSubcategories(catIdNum);
    }
  };

  const handleToggleCategoryExpand = async (id: string) => {
    const nextState = !expandedCategories[id];
    setExpandedCategories(prev => ({ ...prev, [id]: nextState }));
    if (nextState) {
      const catIdNum = Number(id);
      if (!isNaN(catIdNum)) {
        await fetchDynamicSubcategories(catIdNum);
      }
    }
  };

  // File Input Ref for Image Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof Asset, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Find selected category description
  const selectedCategoryDesc = React.useMemo(() => {
    if (!formData.category || !rawCategories) return '';
    const found = rawCategories.find(
      c => c.Category_Name.toLowerCase() === formData.category?.toLowerCase()
    );
    return found?.Description || '';
  }, [formData.category, rawCategories]);

  // Find selected subcategory description
  const selectedSubCategoryDesc = React.useMemo(() => {
    if (!formData.subcategory || !formSubcategories) return '';
    const found = formSubcategories.find(
      s => s.SubCategory_Name.toLowerCase() === formData.subcategory?.toLowerCase()
    );
    return found?.Description || '';
  }, [formData.subcategory, formSubcategories]);

  // Fetch users from backend
  const { data: usersRaw } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
  });

  const users = React.useMemo(() => {
    if (Array.isArray(usersRaw)) {
      return usersRaw.map((u: any) => ({
        id: u.id,
        name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username || 'Unknown',
        email: u.email || `${u.username || 'user'}@crmfarmit.com`,
        phone: u.phone || '+91 98765 43210',
        dept: u.Designation || u.department || 'IT Department',
        manager: 'CEO',
        location: u.State || u.state || u.location || 'Bangalore (Office)'
      }));
    }
    return [];
  }, [usersRaw]);

  // Handle user selection & auto-mapping of department & location
  const handleUserSelect = (userName: string) => {
    handleInputChange('assignedTo', userName);
    const selectedUser = users.find(u => u.name === userName);
    if (selectedUser) {
      if (selectedUser.dept) {
        handleInputChange('department', selectedUser.dept);
      }
      if (selectedUser.location) {
        handleInputChange('location', selectedUser.location);
      }
    }
  };

  const handleAddDocument = () => {
    if (docInput.trim()) {
      setDocuments(prev => [...prev, docInput.trim()]);
      setDocInput('');
    }
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Handle local image file loading
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getUserId = (): number => {
    if (typeof window !== 'undefined') {
      return Number(localStorage.getItem('UserId')) || 1;
    }
    return 1;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadAttachment = async (file: File, fileType: 'asset image' | 'document') => {
    const base64Data = await fileToBase64(file);
    const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const lastDot = file.name.lastIndexOf('.');
    const baseName = lastDot !== -1 ? file.name.substring(0, lastDot) : file.name;
    const extension = lastDot !== -1 ? file.name.substring(lastDot) : '';
    const uniqueFileName = `${baseName}_${Date.now()}${extension}`;

    const response = await fetchFromApi('/user/UserFilesandUrlsCRUD/', {
      method: 'POST',
      body: JSON.stringify({
        File_Type: fileType,
        type: fileType,
        Organization_Id: orgId,
        FileName: uniqueFileName,
        File: base64Data,
        Urls: '',
        Description: `Asset attachment: ${file.name}`,
        Created_By: getUserId(),
        Updated_By: getUserId(),
      }),
    });
    return response?.id || response?.FileID;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`Image ${file.name} size should be less than 2MB`);
        return;
      }
      setSelectedImageFiles([file]);
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, image: previewUrl }));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFiles([]);
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.tagId || !formData.category || !formData.status || !formData.location || !formData.purchaseDate || !formData.vendorSupplier || !formData.notes) {
      toast.error('Please fill out all required fields: Asset Name, Asset Tag, Category, Status, Location, Purchase Date, Vendor/Supplier, and Remarks.');
      return;
    }

    setIsSubmittingForm(true);
    const uploadToast = toast.loading('Uploading attachments and saving asset...');
    try {
      const attachmentIds: number[] = [];

      // Upload images
      for (const file of selectedImageFiles) {
        const id = await uploadAttachment(file, 'asset image');
        if (id) attachmentIds.push(Number(id));
      }

      // Upload documents
      for (const file of selectedDocFiles) {
        const id = await uploadAttachment(file, 'document');
        if (id) attachmentIds.push(Number(id));
      }

      // Base64 string of the first image for local rendering/compatibility
      let firstImageBase64 = '';
      if (selectedImageFiles.length > 0) {
        const b64 = await fileToBase64(selectedImageFiles[0]);
        firstImageBase64 = `data:${selectedImageFiles[0].type};base64,${b64}`;
      }

      const newAsset: Asset = {
        id: `AST-${Math.floor(100 + Math.random() * 900)}`,
        name: formData.name,
        tagId: formData.tagId,
        type: formData.type || 'Hardware',
        category: formData.category || 'Laptop',
        subcategory: formData.subcategory || '',
        brand: formData.brand || '',
        model: formData.model || '',
        serialNumber: formData.serialNumber || '',
        barcodeRfid: formData.barcodeRfid,
        status: formData.status || 'Available',
        purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
        warrantyExpiryDate: formData.warrantyExpiryDate || '',
        purchasePrice: formData.purchasePrice ? `${Number(formData.purchasePrice).toLocaleString()}` : '0',
        vendorSupplier: formData.vendorSupplier || '',
        invoiceNumber: formData.invoiceNumber || '',
        poNumber: formData.poNumber || '',
        criticality: formData.criticality || 'Medium',
        assignedTo: formData.assignedTo || undefined,
        department: formData.department || undefined,
        location: formData.location || undefined,
        reportingManager: formData.reportingManager || undefined,
        description: formData.description,
        configurationSpecification: formData.configurationSpecification,
        operatingSystemSoftware: formData.operatingSystemSoftware,
        ipAddress: formData.ipAddress,
        macAddress: formData.macAddress,
        assetValue: formData.assetValue ? `${Number(formData.assetValue).toLocaleString()}` : undefined,
        depreciationMethod: formData.depreciationMethod,
        depreciationRate: formData.depreciationRate,
        documents: documents.length > 0 ? documents : undefined,
        notes: formData.notes,
        image: firstImageBase64 || undefined,
        Attachment: attachmentIds
      };

      await addAsset(newAsset);
      toast.success('Asset created successfully!');
      toast.dismiss(uploadToast);
      router.push('/assets/list');
    } catch (err: any) {
      console.error('Error during asset creation:', err);
      toast.dismiss(uploadToast);
      if (err.message !== 'Content file too large') {
        toast.error(`Error saving asset: ${err.message || err}`);
      }
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'laptop':
        return <Laptop className="h-4 w-4 text-slate-500 shrink-0" />;
      case 'mobile':
        return <Smartphone className="h-4 w-4 text-slate-500 shrink-0" />;
      case 'monitor':
        return <Monitor className="h-4 w-4 text-slate-500 shrink-0" />;
      case 'printer':
        return <Printer className="h-4 w-4 text-slate-500 shrink-0" />;
      case 'mouse':
        return <MouseIcon className="h-4 w-4 text-slate-500 shrink-0" />;
      case 'keyboard':
        return <KeyboardIcon className="h-4 w-4 text-slate-500 shrink-0" />;
      case 'storage':
        return <HardDrive className="h-4 w-4 text-slate-500 shrink-0" />;
      case 'headset':
        return <Headphones className="h-4 w-4 text-slate-500 shrink-0" />;
      default:
        return <Folder className="h-4 w-4 text-slate-500 shrink-0" />;
    }
  };

  const totalCategoryPages = Math.ceil(categoriesCount / 10) || 1;
  const handlePrevCategoryPage = () => {
    if (categoriesPage > 1) fetchCategoriesPage(categoriesPage - 1);
  };
  const handleNextCategoryPage = () => {
    if (categoriesPage < totalCategoryPages) fetchCategoriesPage(categoriesPage + 1);
  };

  const totalSubCategoryPages = Math.ceil(subcategoriesCount / 10) || 1;
  const handlePrevSubCategoryPage = () => {
    if (subcategoriesPage > 1) fetchSubCategoriesPage(subcategoriesPage - 1);
  };
  const handleNextSubCategoryPage = () => {
    if (subcategoriesPage < totalSubCategoryPages) fetchSubCategoriesPage(subcategoriesPage + 1);
  };

  const activeCategoryObj = categories.find(c => c.name === formData.category);
  const subcategoriesOptions = activeCategoryObj ? activeCategoryObj.subcategories : [];

  return (
    <form onSubmit={handleSubmit} className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-455 font-semibold mb-0.5">
            <span>Assets</span>
            <span>&gt;</span>
            <span className="hover:text-slate-650 cursor-pointer" onClick={() => router.push('/assets/list')}>Asset Management</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Create Asset</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Asset</h1>
          <p className="text-xs text-slate-450 mt-1">Add a new asset to track and manage your organization's resources.</p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
            onClick={() => router.push('/assets/list')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="h-9.5 px-5 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5"
          >
            Save Asset
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Column Form, Right Sidebar Column */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Left Form Column */}
        <div className={cn(showCategoryMgmt ? "lg:col-span-3" : "lg:col-span-4", "space-y-6")}>

          {/* Card 1: Basic Information */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">Basic Information</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Asset Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Name *</label>
                  <Input
                    placeholder="Enter asset name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Asset Tag ID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Tag / ID *</label>
                  <Input
                    placeholder="Enter asset tag or ID"
                    value={formData.tagId}
                    onChange={(e) => handleInputChange('tagId', e.target.value)}
                    required
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Asset Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Type</label>
                  <div className="relative">
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Peripheral">Peripheral</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Office Supply">Office Supply</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Asset Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Category *</label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleInputChange('category', val);
                      }}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  {selectedCategoryDesc && (
                    <p className="text-[10px] text-slate-500 italic mt-0.5 bg-slate-50 dark:bg-slate-955/20 p-1.5 rounded border border-slate-100 dark:border-slate-850">
                      {selectedCategoryDesc}
                    </p>
                  )}
                </div>

                {/* Asset Subcategory */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Subcategory</label>
                  <div className="relative">
                    <select
                      value={formData.subcategory || ''}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      {loadingFormSubcategories ? (
                        <option value="">Loading subcategories...</option>
                      ) : formSubcategories.length > 0 ? (
                        formSubcategories.map(sub => (
                          <option key={sub.id} value={sub.SubCategory_Name}>{sub.SubCategory_Name}</option>
                        ))
                      ) : (
                        <option value="">No subcategories available</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  {selectedSubCategoryDesc && (
                    <p className="text-[10px] text-slate-500 italic mt-0.5 bg-slate-50 dark:bg-slate-955/20 p-1.5 rounded border border-slate-100 dark:border-slate-850">
                      {selectedSubCategoryDesc}
                    </p>
                  )}
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brand</label>
                  <Input
                    placeholder="Enter brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Model */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model</label>
                  <Input
                    placeholder="Enter model"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Serial Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Serial Number</label>
                  <Input
                    placeholder="Enter serial number"
                    value={formData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Barcode / RFID */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Barcode / RFID</label>
                  <Input
                    placeholder="Enter barcode or RFID"
                    value={formData.barcodeRfid}
                    onChange={(e) => handleInputChange('barcodeRfid', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status *</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Available">Available</option>
                      <option value="In Use">In Use</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Retired">Retired</option>
                      <option value="Disposed">Disposed</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Purchase Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Purchase Date *</label>
                  <Input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    required
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Warranty Expiry */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Warranty Expiry Date</label>
                  <Input
                    type="date"
                    value={formData.warrantyExpiryDate}
                    onChange={(e) => handleInputChange('warrantyExpiryDate', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Purchase Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Purchase Price</label>
                  <Input
                    placeholder="Enter purchase price"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Vendor */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor / Supplier *</label>
                  <div className="relative">
                    <select
                      value={formData.vendorSupplier}
                      onChange={(e) => handleInputChange('vendorSupplier', e.target.value)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select Vendor / Supplier</option>
                      {vendors.map((vend: any) => (
                        <option key={vend.id} value={vend.Vendor_Name}>
                          {vend.Vendor_Name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Invoice Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Invoice Number</label>
                  <Input
                    placeholder="Enter invoice number"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* PO Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PO Number</label>
                  <Input
                    placeholder="Enter PO number"
                    value={formData.poNumber}
                    onChange={(e) => handleInputChange('poNumber', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Criticality */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Criticality</label>
                  <div className="relative">
                    <select
                      value={formData.criticality}
                      onChange={(e) => handleInputChange('criticality', e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 2: Assignment & Ownership */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">Assignment & Ownership</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Assigned To */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assign To</label>
                  <div className="relative">
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select User (Optional)</option>
                      {users.map(u => (
                        <option key={u.id || u.name} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
                  <div className="relative">
                    <select
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select Department (Optional)</option>
                      <option value="Business Analysis">Business Analysis</option>
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Training">Training</option>
                      <option value="Project Management">Project Management</option>
                      <option value="Accounts">Accounts</option>
                      <option value="IT Department">IT Department</option>
                      {formData.department && !["Business Analysis", "Development", "Design", "Quality Assurance", "Training", "Project Management", "Accounts", "IT Department"].includes(formData.department) && (
                        <option value={formData.department}>{formData.department}</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location *</label>
                  <div className="relative">
                    <select
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select Location</option>
                      <option value="Bangalore (Office)">Bangalore (Office)</option>
                      <option value="Hyderabad (Office)">Hyderabad (Office)</option>
                      <option value="Pune (Office)">Pune (Office)</option>
                      <option value="Remote">Remote</option>
                      {formData.location && !["Bangalore (Office)", "Hyderabad (Office)", "Pune (Office)", "Remote"].includes(formData.location) && (
                        <option value={formData.location}>{formData.location}</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Reporting Manager */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporting Manager</label>
                  <div className="relative">
                    <select
                      value={formData.reportingManager}
                      onChange={(e) => handleInputChange('reportingManager', e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-205 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select Manager (Optional)</option>
                      {users.map(u => (
                        <option key={u.id || u.name} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 3: Asset Details */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">Asset Details</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</label>
                  <textarea
                    placeholder="Enter asset description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-805 dark:text-slate-250 focus:outline-none"
                  />
                </div>

                {/* Configuration / Specification */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Configuration / Specifications</label>
                  <textarea
                    placeholder="Enter hardware specifications, software licensing keys, etc."
                    rows={3}
                    value={formData.configurationSpecification}
                    onChange={(e) => handleInputChange('configurationSpecification', e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-805 dark:text-slate-250 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* OS */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operating System / Software</label>
                  <Input
                    placeholder="e.g. Windows 11 Pro, macOS"
                    value={formData.operatingSystemSoftware}
                    onChange={(e) => handleInputChange('operatingSystemSoftware', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* IP Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IP Address</label>
                  <Input
                    placeholder="e.g. 192.168.1.100"
                    value={formData.ipAddress}
                    onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* MAC Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MAC Address</label>
                  <Input
                    placeholder="e.g. 00-B0-D0-63-C2-26"
                    value={formData.macAddress}
                    onChange={(e) => handleInputChange('macAddress', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Asset Value */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Value</label>
                  <Input
                    placeholder="Enter current value"
                    type="number"
                    value={formData.assetValue}
                    onChange={(e) => handleInputChange('assetValue', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Depreciation Method */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Depreciation Method</label>
                  <div className="relative">
                    <select
                      value={formData.depreciationMethod}
                      onChange={(e) => handleInputChange('depreciationMethod', e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Straight Line">Straight Line</option>
                      <option value="Declining Balance">Declining Balance</option>
                      <option value="Sum of Years">Sum of Years Digits</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Depreciation Rate */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Depreciation Rate (%)</label>
                  <Input
                    placeholder="e.g. 10%"
                    type="number"
                    value={formData.depreciationRate}
                    onChange={(e) => handleInputChange('depreciationRate', e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-805 text-xs"
                  />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Group 2: Attachments (Image and Documents side by side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card 4: Asset Image (Functional Upload) */}
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
              <div className="border-b dark:border-slate-855 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200 font-extrabold">Asset Image</h3>
                {formData.image && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemoveImage}
                    className="h-6 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-955/20 px-2 rounded"
                  >
                    Clear Image
                  </Button>
                )}
              </div>
              <CardContent className="p-6">
                {formData.image ? (
                  <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden group aspect-video max-h-[180px] flex items-center justify-center bg-slate-50 dark:bg-slate-955/20">
                    <img src={formData.image} alt="Asset Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="h-8 text-xs gap-1.5 font-bold text-white bg-red-650 hover:bg-red-750"
                      >
                        <X className="h-4 w-4" /> Remove Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleImageUploadClick}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-550 rounded-[5px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 bg-slate-50/20 dark:bg-slate-950/5 hover:bg-slate-50/50 dark:hover:bg-slate-950/10"
                  >
                    <Upload className="h-6 w-6 text-slate-400" />
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload</p>
                      <p className="text-[9px] text-slate-450 font-semibold mt-0.5">or drag and drop here</p>
                    </div>
                    <p className="text-[8px] text-slate-450 font-bold uppercase">PNG, JPG or JPEG (Max. 2MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Card 5: Documents */}
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
              <div className="border-b dark:border-slate-855 px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200 font-extrabold">Documents</h3>
              </div>
              <CardContent className="p-6 space-y-4">
                {/* Add Doc */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Document link/name"
                    value={docInput}
                    onChange={(e) => setDocInput(e.target.value)}
                    className="h-8.5 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDocument();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddDocument}
                    className="h-8.5 rounded-[5px] px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-205 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border dark:border-slate-700"
                  >
                    Add
                  </Button>
                </div>

                {/* Docs list */}
                {documents.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-[5px] bg-slate-50 dark:bg-slate-955/20 border dark:border-slate-800 text-xs text-slate-655 dark:text-slate-350">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doc}</span>
                        </div>
                        <X className="h-3.5 w-3.5 text-slate-450 hover:text-red-500 cursor-pointer shrink-0" onClick={() => handleRemoveDocument(idx)} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[9px] text-slate-450 leading-relaxed font-semibold">
                  <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>Supports PDF, DOC, DOCX, XLS, XLSX formats (Max. 10MB).</span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Card 6: Remarks */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200 font-extrabold font-bold">Remarks *</h3>
            </div>
            <CardContent className="p-6">
              <textarea
                placeholder="Enter remarks..."
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                required
                className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-250 focus:outline-none"
              />
            </CardContent>
          </Card>

        </div>

        {/* Right Side Column: Category Management */}
        {showCategoryMgmt && (
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-905 rounded-2xl shadow-2xs overflow-hidden lg:col-span-1 h-fit">
            <div className="border-b dark:border-slate-850 px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200">Category Management</h3>
                <p className="text-[9px] text-slate-400 mt-0.5 font-semibold leading-tight">Manage asset categories and subcategories.</p>
              </div>
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Tabs */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('categories')}
                  className={cn(
                    "flex-1 pb-1.5 text-center text-[10px] font-bold uppercase tracking-wider",
                    activeCategoryTab === 'categories'
                      ? "text-blue-600 border-b-2 border-blue-600 font-extrabold"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Categories
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategoryTab('subcategories')}
                  className={cn(
                    "flex-1 pb-1.5 text-center text-[10px] font-bold uppercase tracking-wider",
                    activeCategoryTab === 'subcategories'
                      ? "text-blue-600 border-b-2 border-blue-600 font-extrabold"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Subcategories
                </button>
              </div>

              {/* TAB CONTENT: Categories */}
              {activeCategoryTab === 'categories' && (
                <div className="space-y-4">

                  {/* Add Category Button & Inline Form */}
                  {!isAddingCategory ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingCategory(true)}
                      className="w-full h-8.5 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5 text-blue-600" /> Add Category
                    </Button>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-805 rounded-lg space-y-2 text-left">
                      <p className="text-[9px] font-bold text-slate-455 uppercase tracking-wider">Create New Category</p>
                      <Input
                        placeholder="Category name (e.g. Camera)"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCategoryName.trim()) {
                              addCategory(newCategoryName.trim());
                              setNewCategoryName('');
                              setIsAddingCategory(false);
                            }
                          }
                        }}
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingCategory(false);
                            setNewCategoryName('');
                          }}
                          className="h-7 px-2.5 text-[10px] font-semibold"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              addCategory(newCategoryName.trim());
                              setNewCategoryName('');
                              setIsAddingCategory(false);
                            }
                          }}
                          className="h-7 px-3 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tree List */}
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-[5px] border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-955/5 animate-pulse">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded" />
                            <Skeleton className="h-4 w-4 rounded" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      ))
                    ) : paginatedCategories.map((c) => {
                      const isExpanded = !!expandedCategories[c.id];
                      const isHighlighted = highlightedCategoryName === c.name;
                      return (
                        <div key={c.id} className="space-y-1">

                          {/* Category Row */}
                          <div
                            onClick={() => handleCategoryClick(c)}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-[5px] border cursor-pointer transition-colors group",
                              isHighlighted
                                ? "bg-blue-50/60 dark:bg-blue-955/10 border-blue-200 dark:border-blue-900/30"
                                : "border-slate-100 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-950/5"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {/* Chevron expand */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleCategoryExpand(c.id);
                                }}
                                className="h-5 w-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                              </button>
                              {/* Icon */}
                              {getCategoryIcon(c.name)}
                              {/* Label */}
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.name}</span>
                            </div>

                            {/* Delete Category Action */}
                            {c.name !== 'Other' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(c.id, c.name);
                                }}
                                className="opacity-0 group-hover:opacity-100 h-5.5 w-5.5 rounded hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-400 hover:text-red-500 transition-opacity flex items-center justify-center shrink-0"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Subcategory Tree Branches */}
                          {isExpanded && (
                            <div className="pl-8 space-y-0.5 relative">
                              {/* Vertical Line */}
                              <div className="absolute left-4.5 top-0 bottom-3 w-px bg-slate-200 dark:bg-slate-800" />

                              {dynamicSubcategories[c.id] ? (
                                dynamicSubcategories[c.id].map((subObj) => (
                                  <div key={subObj.id} className="relative flex items-center justify-between group py-1">
                                    <div className="flex items-center relative">
                                      {/* Horizontal Line Branch */}
                                      <div className="absolute -left-[14px] top-1/2 w-3.5 h-px bg-slate-200 dark:bg-slate-805 -translate-y-1/2" />
                                      {/* Dot */}
                                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600/80 shrink-0 mr-2 z-10" />
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{subObj.SubCategory_Name}</span>
                                    </div>

                                    {subObj.SubCategory_Name !== 'Other' && subObj.SubCategory_Name !== 'General' && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubcategory(c.id, subObj.SubCategory_Name, subObj.id.toString())}
                                        className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-455 hover:text-red-550 transition-opacity flex items-center justify-center shrink-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              ) : c.subcategories.length > 0 ? (
                                c.subcategories.map((sub) => (
                                  <div key={sub} className="relative flex items-center justify-between group py-1">
                                    <div className="flex items-center relative">
                                      {/* Horizontal Line Branch */}
                                      <div className="absolute -left-[14px] top-1/2 w-3.5 h-px bg-slate-200 dark:bg-slate-805 -translate-y-1/2" />
                                      {/* Dot */}
                                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600/80 shrink-0 mr-2 z-10" />
                                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{sub}</span>
                                    </div>

                                    {sub !== 'Other' && sub !== 'General' && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubcategory(c.id, sub)}
                                        className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-455 hover:text-red-550 transition-opacity flex items-center justify-center shrink-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="relative py-1 text-[10px] text-slate-400 italic">No subcategories</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Category Pagination Controls */}
                  <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800 text-[10px] font-bold text-slate-400">
                    <span>Page {categoriesPage} of {totalCategoryPages}</span>
                    <div className="flex gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handlePrevCategoryPage}
                        disabled={categoriesPage <= 1}
                        className="h-6.5 w-6.5 rounded border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 disabled:text-slate-300"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleNextCategoryPage}
                        disabled={categoriesPage >= totalCategoryPages}
                        className="h-6.5 w-6.5 rounded border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 disabled:text-slate-300"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB CONTENT: Subcategories flat list */}
              {activeCategoryTab === 'subcategories' && (
                <div className="space-y-4">
                  {/* Add Subcategory Inline Form */}
                  {!isAddingSubcategory ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingSubcategory(true);
                        const match = categories.find(c => c.name === highlightedCategoryName);
                        setSelectedParentCatId(match ? match.id : categories[0]?.id || '');
                      }}
                      className="w-full h-8.5 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 text-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5 text-blue-655" /> Add Subcategory
                    </Button>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-805 rounded-lg space-y-2.5 text-left">
                      <p className="text-[9px] font-bold text-slate-455 uppercase tracking-wider">Create New Subcategory</p>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Parent Category</label>
                        <div className="relative">
                          <select
                            value={selectedParentCatId}
                            onChange={(e) => setSelectedParentCatId(e.target.value)}
                            className="w-full h-8 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-2.5 pr-8 appearance-none focus:outline-none"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Subcategory Name</label>
                        <Input
                          placeholder="Subcategory name (e.g. DSLR)"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          className="h-8 text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newSubcategoryName.trim() && selectedParentCatId) {
                                addSubcategory(selectedParentCatId, newSubcategoryName.trim()).then(() => {
                                  const catIdNum = Number(selectedParentCatId);
                                  if (!isNaN(catIdNum)) {
                                    fetchDynamicSubcategories(catIdNum);
                                  }
                                });
                                setExpandedCategories(prev => ({ ...prev, [selectedParentCatId]: true }));
                                setNewSubcategoryName('');
                                setIsAddingSubcategory(false);
                              }
                            }
                          }}
                        />
                      </div>

                      <div className="flex justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setIsAddingSubcategory(false);
                            setNewSubcategoryName('');
                          }}
                          className="h-7 px-2.5 text-[10px] font-semibold"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            if (newSubcategoryName.trim() && selectedParentCatId) {
                              addSubcategory(selectedParentCatId, newSubcategoryName.trim()).then(() => {
                                const catIdNum = Number(selectedParentCatId);
                                if (!isNaN(catIdNum)) {
                                  fetchDynamicSubcategories(catIdNum);
                                }
                              });
                              setExpandedCategories(prev => ({ ...prev, [selectedParentCatId]: true }));
                              setNewSubcategoryName('');
                              setIsAddingSubcategory(false);
                            }
                          }}
                          className="h-7 px-3 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Subcategories List</p>
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/10 dark:bg-slate-955/5 animate-pulse">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-28" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        ))
                      ) : paginatedSubCategories.map((item, idx) => (
                        <div key={`${item.catId}-${item.subName}-${idx}`} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-955/5 text-xs text-slate-600 dark:text-slate-350">
                          <div>
                            <span className="font-bold">{item.subName}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Parent: {item.catName}</span>
                          </div>
                          {item.subName !== 'Other' && item.subName !== 'General' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSubcategory(item.catId, item.subName, item.id)}
                              className="h-5 w-5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-455 hover:text-red-500 flex items-center justify-center transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Subcategory Pagination Controls */}
                    <div className="flex items-center justify-between pt-3 border-t dark:border-slate-800 text-[10px] font-bold text-slate-400">
                      <span>Page {subcategoriesPage} of {totalSubCategoryPages}</span>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handlePrevSubCategoryPage}
                          disabled={subcategoriesPage <= 1}
                          className="h-6.5 w-6.5 rounded border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 disabled:text-slate-300"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleNextSubCategoryPage}
                          disabled={subcategoriesPage >= totalSubCategoryPages}
                          className="h-6.5 w-6.5 rounded border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 disabled:text-slate-300"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </form>
  );
}
