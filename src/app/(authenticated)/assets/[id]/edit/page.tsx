'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { fetchAssetSubCategoriesByCategory, AssetSubCategory } from '@/service/api/Assets';
import { fetchUsersList } from '@/service/api/Leads/api';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronDown, 
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
  Folder,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Asset } from '@/types/asset';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchFromApi, getTenantName, BASE_URL } from '@/service/apiClient';

export default function EditAssetPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [selectedDocFiles, setSelectedDocFiles] = useState<File[]>([]);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const { 
    assets,
    updateAsset, 
    categories, 
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

  const asset = assets.find(a => a.id === assetId);

  // Form State
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    tagId: '',
    type: 'Hardware',
    category: 'Laptop',
    subcategory: '',
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
  const [isAssetLoaded, setIsAssetLoaded] = useState(false);

  // Dynamic Subcategories states
  const [formSubcategories, setFormSubcategories] = useState<AssetSubCategory[]>([]);
  const [loadingFormSubcategories, setLoadingFormSubcategories] = useState(false);

  // Load existing asset details once loaded from store
  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        tagId: asset.tagId || '',
        type: asset.type || 'Hardware',
        category: asset.category || '',
        subcategory: asset.subcategory || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serialNumber: asset.serialNumber || '',
        barcodeRfid: asset.barcodeRfid || '',
        status: asset.status || 'Available',
        purchaseDate: asset.purchaseDate || '',
        warrantyExpiryDate: asset.warrantyExpiryDate || '',
        purchasePrice: asset.purchasePrice ? asset.purchasePrice.replace(/[^0-9.]/g, '') : '',
        vendorSupplier: asset.vendorSupplier || '',
        invoiceNumber: asset.invoiceNumber || '',
        poNumber: asset.poNumber || '',
        criticality: asset.criticality || 'Medium',
        assignedTo: asset.assignedTo || '',
        department: asset.department || '',
        location: asset.location || '',
        reportingManager: asset.reportingManager || '',
        description: asset.description || '',
        configurationSpecification: asset.configurationSpecification || '',
        operatingSystemSoftware: asset.operatingSystemSoftware || '',
        ipAddress: asset.ipAddress || '',
        macAddress: asset.macAddress || '',
        assetValue: asset.assetValue ? asset.assetValue.replace(/[^0-9.]/g, '') : '',
        depreciationMethod: asset.depreciationMethod || 'Straight Line',
        depreciationRate: asset.depreciationRate || '',
        notes: asset.notes || '',
        image: asset.image || ''
      });
      setDocuments(asset.documents || []);
      setIsAssetLoaded(true);

      const loadAttachments = async () => {
        if (asset.Attachment && asset.Attachment.length > 0) {
          try {
            const fetched = await Promise.all(
              asset.Attachment.map(async (attIdOrObj) => {
                if (attIdOrObj && typeof attIdOrObj === 'object' && (attIdOrObj.File || attIdOrObj.Urls)) {
                  return attIdOrObj;
                }
                const id = typeof attIdOrObj === 'object' ? (attIdOrObj.id || attIdOrObj.FileID) : attIdOrObj;
                if (!id) return null;

                try {
                  const res = await fetchFromApi(`/user/UserFilesandUrlsGetById/?id=${id}`);
                  if (res && (res.File || res.Urls || res.FileName)) {
                    return res;
                  }
                } catch (e) {
                  console.warn(`UserFilesandUrlsGetById failed for ${id}, trying fallback:`, e);
                }

                try {
                  const res = await fetchFromApi(`/user/UserFilesandUrlsCRUD/${id}/`);
                  if (res && (res.File || res.Urls || res.FileName)) {
                    return res;
                  }
                } catch (e) {
                  console.warn(`UserFilesandUrlsCRUD detail failed for ${id}:`, e);
                }

                try {
                  const res = await fetchFromApi(`/user/UserFilesandUrlsCRUD/?id=${id}`);
                  if (res && res.results && res.results.length > 0) {
                    return res.results[0];
                  } else if (res && !res.results && (res.File || res.Urls || res.FileName)) {
                    return res;
                  }
                } catch (e) {
                  console.warn(`UserFilesandUrlsCRUD list failed for ${id}:`, e);
                }

                return null;
              })
            );
            setExistingAttachments(fetched.filter(Boolean));
          } catch (err) {
            console.error('Error fetching attachments details:', err);
            setExistingAttachments([]);
          }
        } else {
          setExistingAttachments([]);
        }
      };
      loadAttachments();
    }
  }, [asset]);

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
              
              // Only set a default if current subcategory is not valid for this category
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
    if (files) {
      const validFiles = Array.from(files).filter((file: any) => {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`Image ${file.name} size should be less than 2MB`);
          return false;
        }
        return true;
      }) as File[];
      setSelectedImageFiles(prev => [...prev, ...validFiles]);
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
      const attachmentIds: number[] = existingAttachments.map(att => Number(att.id || att.FileID)).filter(Boolean);

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
      let firstImageBase64 = formData.image;
      if (selectedImageFiles.length > 0) {
        const b64 = await fileToBase64(selectedImageFiles[0]);
        firstImageBase64 = `data:${selectedImageFiles[0].type};base64,${b64}`;
      }

      const updatedAssetFields: Partial<Asset> = {
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

      await updateAsset(assetId, updatedAssetFields);
      toast.success('Asset updated successfully!');
      toast.dismiss(uploadToast);
      router.push('/assets/list');
    } catch (err: any) {
      console.error('Error during asset update:', err);
      toast.dismiss(uploadToast);
      if (err.message !== 'Content file too large') {
        toast.error(`Error saving asset: ${err.message || err}`);
      }
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (!isLoaded || (isLoaded && !isAssetLoaded)) {
    return (
      <div className="max-w-[1600px] mx-auto py-20 text-center text-slate-400 space-y-6">
        <Skeleton className="h-10 w-1/4 rounded-[5px]" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isLoaded && !asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-left max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-805 dark:text-white">Asset Not Found</h3>
        <p className="text-sm text-center text-slate-400">The asset record you requested could not be retrieved. It may have been deleted.</p>
        <Button variant="outline" className="h-9 rounded-[5px]" onClick={() => router.push('/assets/list')}>
          Back to Asset Inventory
        </Button>
      </div>
    );
  }

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
            <span className="hover:text-slate-650 cursor-pointer" onClick={() => router.push(`/assets/${assetId}`)}>{asset?.tagId}</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Edit Asset</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Asset: {asset?.name}</h1>
          <p className="text-xs text-slate-450 mt-1">Update asset information, specifications, financial logs, and attachments.</p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
            onClick={() => router.push(`/assets/${assetId}`)}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="h-9.5 px-5 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Column Form, Right Sidebar Column */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Form Column */}
        <div className="lg:col-span-3 space-y-6">
          
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
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-305 px-3 pr-8 appearance-none focus:outline-none"
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
                      className="w-full h-9.5 rounded-[5px] border border-slate-205 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
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
            
            {/* Card 4: Asset Image */}
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
              <div className="border-b dark:border-slate-855 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200 font-extrabold">Asset Image</h3>
                {(existingAttachments.filter(att => att.File_Type === 'asset image' || att.type === 'asset image').length > 0 || selectedImageFiles.length > 0) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setExistingAttachments(prev => prev.filter(att => att.File_Type !== 'asset image' && att.type !== 'asset image'));
                      setSelectedImageFiles([]);
                    }}
                    className="h-6 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 rounded"
                  >
                    Clear Images
                  </Button>
                )}
              </div>
              <CardContent className="p-6">
                {(() => {
                  const NEW_BASE_URL = `${BASE_URL}/${getTenantName()}`;
                  const existingImages = existingAttachments.filter(att => att.File_Type === 'asset image' || att.type === 'asset image');
                  
                  return (existingImages.length > 0 || selectedImageFiles.length > 0) ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Existing Images */}
                        {existingImages.map((att, idx) => {
                          const url = att.File ? (att.File.startsWith('http') ? att.File : `${NEW_BASE_URL}${att.File}`) :
                            (att.Urls ? (att.Urls.startsWith('http') ? att.Urls : `${NEW_BASE_URL}${att.Urls}`) : '');
                          return (
                            <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-955/20 aspect-video flex items-center justify-center border dark:border-slate-800">
                              <img src={url} alt={`Existing Image ${idx}`} className="w-full h-full object-contain" />
                              <button
                                type="button"
                                onClick={() => setExistingAttachments(prev => prev.filter(a => a.id !== att.id))}
                                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-650 text-white flex items-center justify-center hover:bg-red-750 shadow-sm"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                        {/* New Images */}
                        {selectedImageFiles.map((file: File, idx: number) => (
                          <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-955/20 aspect-video flex items-center justify-center border dark:border-slate-800">
                            <img src={URL.createObjectURL(file)} alt={`New Image ${idx}`} className="w-full h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => setSelectedImageFiles(prev => prev.filter((_, i: number) => i !== idx))}
                              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-red-650 text-white flex items-center justify-center hover:bg-red-750 shadow-sm"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleImageUploadClick}
                        className="w-full h-8 rounded-[5px] text-xs font-semibold"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add More Images
                      </Button>
                    </div>
                  ) : (
                    <div 
                      onClick={handleImageUploadClick}
                      className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-550 rounded-[5px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2.5 bg-slate-50/20 dark:bg-slate-955/5 hover:bg-slate-50/50 dark:hover:bg-slate-950/10"
                    >
                      <Upload className="h-6 w-6 text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-330">Click to upload images</p>
                        <p className="text-[9px] text-slate-450 mt-0.5">or drag and drop here</p>
                      </div>
                      <p className="text-[8px] text-slate-450 font-bold uppercase">PNG, JPG or JPEG (Max. 2MB)</p>
                    </div>
                  );
                })()}
                <input 
                  type="file" 
                  multiple
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
                {/* Add Doc Link */}
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
                    className="h-8.5 rounded-[5px] px-3 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border dark:border-slate-700"
                  >
                    Add Link
                  </Button>
                </div>

                {/* Docs link list */}
                {documents.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-[5px] bg-slate-50 dark:bg-slate-955/20 border dark:border-slate-800 text-xs text-slate-655 dark:text-slate-350">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doc}</span>
                        </div>
                        <X className="h-3.5 w-3.5 text-slate-455 hover:text-red-500 cursor-pointer shrink-0" onClick={() => handleRemoveDocument(idx)} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing uploaded files list */}
                {(() => {
                  const NEW_BASE_URL = `${BASE_URL}/${getTenantName()}`;
                  const existingDocs = existingAttachments.filter(att => att.File_Type === 'document' || att.type === 'document' || (!att.File_Type && !att.type));
                  
                  return existingDocs.length > 0 && (
                    <div className="space-y-1.5 border-t dark:border-slate-800 pt-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Existing Uploaded Documents ({existingDocs.length})</p>
                      {existingDocs.map((att, idx) => {
                        const url = att.File ? (att.File.startsWith('http') ? att.File : `${NEW_BASE_URL}${att.File}`) :
                          (att.Urls ? (att.Urls.startsWith('http') ? att.Urls : `${NEW_BASE_URL}${att.Urls}`) : '');
                        return (
                          <div key={`existing-doc-${idx}`} className="flex items-center justify-between p-2 rounded-[5px] bg-slate-55 dark:bg-slate-955/10 border dark:border-slate-800 text-xs text-slate-655 dark:text-slate-350">
                            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 truncate text-blue-600 dark:text-blue-450 hover:underline">
                              <FileText className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate font-semibold">{att.FileName || att.name || `Document #${att.id}`}</span>
                            </a>
                            <X 
                              className="h-3.5 w-3.5 text-slate-450 hover:text-red-550 cursor-pointer shrink-0" 
                              onClick={() => setExistingAttachments(prev => prev.filter(a => a.id !== att.id))} 
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Upload Doc Files */}
                <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                  <div 
                    onClick={() => docFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-550 rounded-[5px] p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5 bg-slate-50/20 dark:bg-slate-955/5 hover:bg-slate-50/50"
                  >
                    <Upload className="h-5 w-5 text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Click to upload document files</p>
                  </div>
                  <input 
                    type="file" 
                    multiple 
                    ref={docFileInputRef} 
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        const validFiles = Array.from(files).filter((file: any) => {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error(`File ${file.name} exceeds 10MB limit`);
                            return false;
                          }
                          return true;
                        }) as File[];
                        setSelectedDocFiles(prev => [...prev, ...validFiles]);
                      }
                    }} 
                    className="hidden" 
                  />
                </div>

                {/* Uploaded Doc files list */}
                {selectedDocFiles.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">New Files to upload ({selectedDocFiles.length})</p>
                    {selectedDocFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-[5px] bg-slate-50 dark:bg-slate-955/20 border dark:border-slate-800 text-xs text-slate-655 dark:text-slate-350">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="h-3.5 w-3.5 text-blue-550 shrink-0" />
                          <span className="truncate font-semibold">{file.name}</span>
                          <span className="text-[9px] text-slate-450">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                        <X 
                          className="h-3.5 w-3.5 text-slate-455 hover:text-red-500 cursor-pointer shrink-0" 
                          onClick={() => setSelectedDocFiles(prev => prev.filter((_, i) => i !== idx))} 
                        />
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

        {/* Right Info Column: Reference details */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden h-fit">
            <div className="border-b dark:border-slate-850 px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200">Asset Identifiers</h3>
              <p className="text-[9px] text-slate-400 mt-0.5 font-semibold">Useful configuration notes.</p>
            </div>
            <CardContent className="p-5 text-xs text-slate-500 font-semibold space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Created Date</span>
                <p className="text-slate-800 dark:text-slate-300 font-mono">{asset?.purchaseDate || '-'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Asset Code / Backend ID</span>
                <p className="text-slate-800 dark:text-slate-300 font-mono">{asset?.tagId}</p>
              </div>
              <div className="space-y-1.5 pt-2 border-t dark:border-slate-800">
                <div className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-400">
                  <Info className="h-4 w-4 shrink-0 text-blue-500" />
                  <span>
                    Editing this asset will immediately sync updates across the local inventory dashboards.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </form>
  );
}
