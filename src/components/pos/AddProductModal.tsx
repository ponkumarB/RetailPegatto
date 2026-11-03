'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  ScanLine,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { PosProduct } from '@/store/usePosInvoiceStore';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: PosProduct) => void;
}

const CATEGORIES = [
  {
    name: 'Groceries',
    groups: ['Grains & Pulses', 'Cooking Essentials', 'Spices & Masalas', 'Atta & Flours']
  },
  {
    name: 'Oils & Ghee',
    groups: ['Edible Oils', 'Pure Ghee', 'Mustard Oil', 'Sunflower Oil']
  },
  {
    name: 'Beverages',
    groups: ['Tea & Coffee', 'Health Drinks', 'Juices & Soft Drinks']
  },
  {
    name: 'Snacks & Branded Foods',
    groups: ['Biscuits & Cookies', 'Noodles & Pasta', 'Namkeen & Chips']
  },
  {
    name: 'Personal Care',
    groups: ['Soaps & Body Wash', 'Hair Care', 'Oral Care', 'Skincare']
  },
  {
    name: 'Household Care',
    groups: ['Detergents & Fabric Care', 'Dishwashers', 'Floor & Surface Cleaners']
  },
  {
    name: 'Dairy & Bakery',
    groups: ['Milk & Butter', 'Bread & Buns', 'Cheese & Paneer']
  }
];

const UOM_LIST = ['Pcs', 'Kg', 'Gms', 'Ltr', 'Ml', 'Bag', 'Box', 'Packet', 'Bottle'];
const TAX_LIST = [
  { label: 'GST 0% (Exempt)', rate: 0 },
  { label: 'GST 5%', rate: 5 },
  { label: 'GST 12%', rate: 12 },
  { label: 'GST 18%', rate: 18 },
  { label: 'GST 28%', rate: 28 }
];

export function AddProductModal({ isOpen, onClose, onProductCreated }: AddProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [productGroup, setProductGroup] = useState('');
  const [skuCode, setSkuCode] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [uom, setUom] = useState('');
  const [brand, setBrand] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [price, setPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Checkboxes
  const [isTaxApplicable, setIsTaxApplicable] = useState(false);
  const [selectedTax, setSelectedTax] = useState('GST 5%');
  const [isBatch, setIsBatch] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-generate Product Code & SKU when Product Name changes
  useEffect(() => {
    if (productName.trim() && !productCode) {
      const generated = productName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/__+/g, '_')
        .substring(0, 14);
      setProductCode(generated);
      if (!skuCode) {
        setSkuCode(generated);
      }
    }
  }, [productName]);

  // Available groups based on selected category
  const availableGroups = React.useMemo(() => {
    const cat = CATEGORIES.find((c) => c.name === categoryName);
    return cat ? cat.groups : [];
  }, [categoryName]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, PNG, GIF)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!productCode.trim()) errs.productCode = 'Product Code is required';
    if (!productName.trim()) errs.productName = 'Product Name is required';
    if (!categoryName) errs.categoryName = 'Category Name is required';
    if (!productGroup) errs.productGroup = 'Product Group is required';
    if (!uom) errs.uom = 'UOM is required';
    if (!price || parseFloat(price) <= 0) errs.price = 'Valid price is required';
    if (isTaxApplicable && !selectedTax) errs.tax = 'Tax rate is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill all the required fields');
      return;
    }

    const matchedTax = TAX_LIST.find((t) => t.label === selectedTax);
    const taxRate = isTaxApplicable && matchedTax ? matchedTax.rate : 0;
    const numPrice = parseFloat(price) || 0;

    const newProduct: PosProduct = {
      id: `prod-${Date.now()}`,
      name: productName.trim(),
      sku: (skuCode || productCode).trim().toUpperCase(),
      barcode: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
      category: categoryName,
      price: numPrice,
      costPrice: Number((numPrice * 0.75).toFixed(2)),
      taxRate: taxRate,
      stock: openingBalance ? parseInt(openingBalance) : 50,
      unit: uom || 'Pcs'
    };

    onProductCreated(newProduct);
    toast.success(`Product "${productName}" added successfully!`);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setProductCode('');
    setProductName('');
    setCategoryName('');
    setProductGroup('');
    setSkuCode('');
    setHsnCode('');
    setUom('');
    setBrand('');
    setOpeningBalance('');
    setPrice('');
    setProductDescription('');
    setSelectedImage(null);
    setIsTaxApplicable(false);
    setIsBatch(false);
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F3B2C] text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Add New Product</h2>
            <span className="bg-[#0F3B2C] text-white text-[11px] font-semibold px-2 py-0.5 rounded leading-none">
              New
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-md p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
          {/* Top Checkboxes */}
          <div className="flex items-center justify-end gap-6 pt-1 text-xs sm:text-sm font-medium text-gray-700">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isTaxApplicable}
                onChange={(e) => setIsTaxApplicable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0F3B2C] focus:ring-[#0F3B2C]"
              />
              <span>Tax Applicable</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isBatch}
                onChange={(e) => setIsBatch(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#0F3B2C] focus:ring-[#0F3B2C]"
              />
              <span>Is Batch</span>
            </label>
          </div>

          {/* Row 1: Product Code & Product Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Code <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <ScanLine className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  placeholder="Auto-generated or enter manually"
                  className={`w-full text-xs sm:text-sm pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] ${
                    errors.productCode ? 'border-rose-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.productCode && (
                <p className="text-rose-500 text-[11px] mt-0.5">{errors.productCode}</p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
                className={`w-full text-xs sm:text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] ${
                  errors.productName ? 'border-rose-500' : 'border-gray-300'
                }`}
              />
              {errors.productName && (
                <p className="text-rose-500 text-[11px] mt-0.5">{errors.productName}</p>
              )}
            </div>
          </div>

          {/* Row 2: Category Name & Product Group */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={categoryName}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategoryName(newCat);
                    setProductGroup('');
                  }}
                  className={`w-full text-xs sm:text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] bg-white appearance-none pr-8 ${
                    errors.categoryName ? 'border-rose-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
              {errors.categoryName && (
                <p className="text-rose-500 text-[11px] mt-0.5">{errors.categoryName}</p>
              )}
            </div>

            {/* Product Group */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Group <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={productGroup}
                  disabled={!categoryName}
                  onChange={(e) => setProductGroup(e.target.value)}
                  className={`w-full text-xs sm:text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] bg-white appearance-none pr-8 ${
                    !categoryName ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
                  } ${errors.productGroup ? 'border-rose-500' : 'border-gray-300'}`}
                >
                  <option value="">Select group</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
              {errors.productGroup && (
                <p className="text-rose-500 text-[11px] mt-0.5">{errors.productGroup}</p>
              )}
            </div>
          </div>

          {/* Row 3: SKU Code, HSN Code & UOM */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SKU Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                placeholder="Enter SKU code"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
              />
            </div>

            {/* HSN Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">HSN Code</label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="Enter HSN code"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
              />
            </div>

            {/* UOM */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                UOM <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className={`w-full text-xs sm:text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] bg-white appearance-none pr-8 ${
                    errors.uom ? 'border-rose-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select UOM</option>
                  {UOM_LIST.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
              {errors.uom && <p className="text-rose-500 text-[11px] mt-0.5">{errors.uom}</p>}
            </div>
          </div>

          {/* Row 4: Brand, Opening Balance & Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Brand */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Enter brand name"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
              />
            </div>

            {/* Opening Balance */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Opening Balance
              </label>
              <input
                type="number"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="Enter opening balance"
                className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Price <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs sm:text-sm text-gray-500">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  className={`w-full text-xs sm:text-sm pl-7 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] ${
                    errors.price ? 'border-rose-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.price && <p className="text-rose-500 text-[11px] mt-0.5">{errors.price}</p>}
            </div>
          </div>

          {/* Conditional Tax Rate Dropdown if Tax Applicable is checked */}
          {isTaxApplicable && (
            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <label className="block text-xs font-semibold text-gray-800 mb-1">
                Tax Rate <span className="text-rose-500">*</span>
              </label>
              <div className="relative max-w-sm">
                <select
                  value={selectedTax}
                  onChange={(e) => setSelectedTax(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C] bg-white appearance-none pr-8"
                >
                  {TAX_LIST.map((t) => (
                    <option key={t.label} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Row 5: Product Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Product Description
            </label>
            <textarea
              rows={3}
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Write a detailed description..."
              className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0F3B2C]"
            />
          </div>

          {/* Row 6: Product Image */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Image</label>
            <div className="border border-gray-200 rounded-lg p-4 bg-white flex items-center gap-4">
              {/* Image preview box */}
              <div className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden relative group shrink-0">
                {selectedImage ? (
                  <>
                    <img
                      src={selectedImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <Trash2 className="w-5 h-5 text-rose-400" />
                    </button>
                  </>
                ) : (
                  <ImagePlus className="w-8 h-8 text-gray-400" />
                )}
              </div>

              {/* Upload controls */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A7D5B] hover:bg-[#23684B] text-white text-xs sm:text-sm font-medium rounded-md shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" /> Upload Image
                </button>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Max size: 5MB. Supported: JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50/70 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-medium rounded-md transition-colors"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A7D5B] hover:bg-[#23684B] text-white text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>
    </div>
  );
}
