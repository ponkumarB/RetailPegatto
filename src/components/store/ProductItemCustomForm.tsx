import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchFromApi } from '@/service/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

const generateProductCode = (catCode: string, grpCode: string, count: number = 1) => {
  const number = String(count).padStart(4, "0");
  return `${catCode}${grpCode}${number}`;
};

const generateSKU = (category = "", group = "", brand = "", variant = "", count = 1) => {
  const getCode = (val: string, len = 3) =>
    val ? val.replace(/\s+/g, "").substring(0, len).toUpperCase() : "NA";

  const cat = getCode(category);
  const grp = getCode(group);
  const br = getCode(brand);
  const varnt = getCode(variant, 3);
  const number = String(count).padStart(4, "0");

  return `${cat}-${grp}-${br}-${varnt}-${number}`;
};

export function ProductItemCustomForm({
  formData,
  setFormData,
  isEdit,
}: {
  formData: any;
  setFormData: (data: any) => void;
  isEdit: boolean;
}) {
  const [imagePreview, setImagePreview] = useState<string | null>(formData.Product_Image || null);

  const { data: categories } = useQuery({
    queryKey: ['productCategories'],
    queryFn: () => fetchFromApi('/user/ProductCategoryAdditional/?Is_Deleted=False&limit=100'),
    select: (data) => data?.results || [],
  });

  const { data: groups } = useQuery({
    queryKey: ['productGroups', formData.Product_Categry_Name],
    queryFn: () => fetchFromApi(`/user/ProductItemGroupAdditional/?limit=100`),
    select: (data) => data?.results?.filter((g: any) => g.Category_Name === formData.Product_Categry_Name) || [],
    enabled: !!formData.Product_Categry_Name,
  });

  const { data: taxes } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => fetchFromApi('/user/TaxMasterList/'),
    select: (data) => data?.results || [],
  });

  const { data: uomList } = useQuery({
    queryKey: ['uom'],
    queryFn: () => fetchFromApi('/user/UOMMasterList/'),
    select: (data) => data?.results || [],
  });

  // SKU & Code Auto-generation logic
  useEffect(() => {
    if (!isEdit && formData.Product_Categry_Name && formData.Product_Group_Name) {
      // In a real app, 'count' would be fetched from backend based on existing items. Using a random number for demo, or ideally it should be empty for user to fill, or fetched.
      // We will just generate base SKU and allow user to edit.
      const cat = formData.Product_Categry_Name.substring(0, 3).toUpperCase();
      const grp = formData.Product_Group_Name.substring(0, 3).toUpperCase();
      
      if (!formData.Product_Code) {
        setFormData((prev: any) => ({ ...prev, Product_Code: generateProductCode(cat, grp, Math.floor(Math.random() * 1000)) }));
      }
      if (!formData.SKU_Code) {
        setFormData((prev: any) => ({ ...prev, SKU_Code: generateSKU(formData.Product_Categry_Name, formData.Product_Group_Name, formData.Brand, formData.Product_Name, Math.floor(Math.random() * 1000)) }));
      }
    }
  }, [formData.Product_Categry_Name, formData.Product_Group_Name, formData.Brand, formData.Product_Name, isEdit]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        // Base64 string to save
        const base64String = (reader.result as string).split(',')[1];
        setFormData({ ...formData, Product_Image: base64String, productPhotoName: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Image Upload Column */}
          <div className="col-span-1 flex flex-col items-center justify-start space-y-4">
             <div className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 overflow-hidden group flex items-center justify-center bg-slate-50 dark:bg-slate-950">
              {imagePreview ? (
                <>
                  <Image src={imagePreview.startsWith('http') ? imagePreview : `data:image/png;base64,${imagePreview}`} alt="Product" layout="fill" objectFit="cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => { setImagePreview(null); setFormData({ ...formData, Product_Image: '', productPhotoName: '' }); }} className="text-white hover:text-rose-400">
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <span className="text-[10px] text-slate-400">Upload Image</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload Product Image" />
            </div>
            <div className="flex flex-col w-full space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="taxable" checked={formData.checkTax || formData.Tax_Flag} onCheckedChange={(c) => setFormData({ ...formData, checkTax: !!c, Tax_Flag: !!c })} />
                  <Label htmlFor="taxable" className="text-xs font-semibold">Tax Applicable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="batch" checked={formData.checkIsBatch || formData.Is_Batch} onCheckedChange={(c) => setFormData({ ...formData, checkIsBatch: !!c, Is_Batch: !!c })} />
                  <Label htmlFor="batch" className="text-xs font-semibold">Is Batch</Label>
                </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6">
            
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Name <span className="text-rose-500">*</span></Label>
              <Select value={formData.Product_Categry_Name || ''} onValueChange={(val) => setFormData({ ...formData, Product_Categry_Name: val, Product_Group_Name: '', ProductGroup_id: '' })}>
                <SelectTrigger className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c: any) => <SelectItem key={c.id} value={c.Category_Name}>{c.Category_Name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Group <span className="text-rose-500">*</span></Label>
              <Select disabled={!formData.Product_Categry_Name} value={formData.Product_Group_Name || ''} onValueChange={(val) => {
                const grp = groups?.find((g: any) => g.ProductItemGroup_Name === val);
                setFormData({ ...formData, Product_Group_Name: val, ProductGroup_id: grp?.id || '', Product_Group_id: grp?.id || '' });
              }}>
                <SelectTrigger className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((g: any) => <SelectItem key={g.id} value={g.ProductItemGroup_Name}>{g.ProductItemGroup_Name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Code <span className="text-rose-500">*</span></Label>
              <Input required placeholder="# Product Code" value={formData.Product_Code || ''} onChange={(e) => setFormData({ ...formData, Product_Code: e.target.value })} className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Name <span className="text-rose-500">*</span></Label>
              <Input required placeholder="Product Name" value={formData.Product_Name || ''} onChange={(e) => setFormData({ ...formData, Product_Name: e.target.value })} className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">SKU Code</Label>
              <Input placeholder="SKU Code" value={formData.SKU_Code || ''} onChange={(e) => setFormData({ ...formData, SKU_Code: e.target.value })} className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">HSN Code</Label>
              <Input placeholder="HSN Code" value={formData.HSN_Code || ''} onChange={(e) => setFormData({ ...formData, HSN_Code: e.target.value })} className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">UOM <span className="text-rose-500">*</span></Label>
              <Select value={formData.UOM || ''} onValueChange={(val) => setFormData({ ...formData, UOM: val })}>
                <SelectTrigger className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl">
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {uomList?.map((u: any) => <SelectItem key={u.id} value={u.value || u.name || String(u.id)}>{u.value || u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Brand</Label>
              <Input placeholder="Brand" value={formData.Brand || ''} onChange={(e) => setFormData({ ...formData, Brand: e.target.value })} className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Price <span className="text-rose-500">*</span></Label>
              <Input type="number" step="0.01" min="0" required placeholder="0.00" value={formData.Price || ''} onChange={(e) => setFormData({ ...formData, Price: e.target.value })} className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Opening Balance</Label>
              <Input type="number" placeholder="0" value={formData.Opening_Balance || ''} onChange={(e) => setFormData({ ...formData, Opening_Balance: e.target.value })} className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Opening Price</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={formData.Opening_Price || ''} onChange={(e) => setFormData({ ...formData, Opening_Price: e.target.value })} className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>

            {(formData.checkTax || formData.Tax_Flag) && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tax <span className="text-rose-500">*</span></Label>
                <Select value={formData.Tax || ''} onValueChange={(val) => setFormData({ ...formData, Tax: val })}>
                  <SelectTrigger className="h-9.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl">
                    <SelectValue placeholder="Select Tax" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxes?.map((t: any) => <SelectItem key={t.id} value={t.Tax_Name}>{t.Tax_Name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Description <span className="text-rose-500">*</span></Label>
              <Textarea required placeholder="Describe the product..." value={formData.Product_Description || ''} onChange={(e) => setFormData({ ...formData, Product_Description: e.target.value })} className="text-xs bg-slate-50 dark:bg-slate-950 rounded-xl resize-none h-20" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
