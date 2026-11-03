'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Save,
  X,
  Trash2,
  ChevronDown
} from 'lucide-react';
import {
  ManagePriceItem,
  ManagePriceDetail,
  StoreOption,
  createManagePrice,
  updateManagePrice,
  fetchStoresList,
  fetchProductMasterList
} from '@/service/api/manage-price/api';
import { toast } from 'sonner';

interface ManagePriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceBook?: ManagePriceItem | null;
  onSuccess: () => void;
}

export function ManagePriceDialog({
  open,
  onOpenChange,
  priceBook,
  onSuccess
}: ManagePriceDialogProps) {
  const isEdit = Boolean(priceBook && priceBook.id);

  const [bookName, setBookName] = useState('');
  const [priceBookType, setPriceBookType] = useState('List Price');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [stateName, setStateName] = useState('');
  const [cityName, setCityName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [percentage, setPercentage] = useState('0');
  const [markups, setMarkups] = useState('0');

  // Stores selection
  const [allStores, setAllStores] = useState<StoreOption[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<number[]>([]);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  // Product Master & rows
  const [productMaster, setProductMaster] = useState<any[]>([]);
  const [productRows, setProductRows] = useState<ManagePriceDetail[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  // Close store dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        storeDropdownRef.current &&
        !storeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load stores & product catalog
  useEffect(() => {
    if (open) {
      Promise.all([fetchStoresList(), fetchProductMasterList()])
        .then(([stores, products]) => {
          setAllStores(stores);
          setProductMaster(products);
        })
        .catch((err) => {
          console.warn('Failed to load stores or product master:', err);
        });
    }
  }, [open]);

  // Initialize form state
  useEffect(() => {
    if (open) {
      setTouched(false);
      setStoreSearchQuery('');
      setIsStoreDropdownOpen(false);

      if (priceBook) {
        setBookName(priceBook.Book_Name || '');
        setPriceBookType(priceBook.PriceBook_Type || 'List Price');
        setStartDate(priceBook.Start_Date ? priceBook.Start_Date.split('T')[0] : '');
        setEndDate(priceBook.End_Date ? priceBook.End_Date.split('T')[0] : '');
        setStateName(priceBook.State || '');
        setCityName(priceBook.City || '');
        setCurrency(priceBook.Currency || 'INR');
        setPercentage(priceBook.Percentage !== undefined ? String(priceBook.Percentage) : '0');
        setMarkups(priceBook.Markups !== undefined ? String(priceBook.Markups) : '0');

        if (Array.isArray(priceBook.Store_Id)) {
          setSelectedStoreIds(
            priceBook.Store_Id.map((s: any) => (typeof s === 'object' ? s.id : s))
          );
        } else {
          setSelectedStoreIds([]);
        }

        if (priceBook.ManagePrice_Details && priceBook.ManagePrice_Details.length > 0) {
          setProductRows(
            priceBook.ManagePrice_Details.map((item) => ({
              id: item.id || '',
              Product_Id: item.Product_Id || '',
              Product_Name: item.Product_Name || '',
              UOM: item.UOM || 'Unit',
              Unit_Price: item.Unit_Price || 0,
              Tax: item.Tax || 0,
              Price: item.Price || 0
            }))
          );
        } else {
          setProductRows([
            {
              Product_Id: '',
              Product_Name: '',
              UOM: '',
              Unit_Price: '',
              Tax: 0,
              Price: ''
            }
          ]);
        }
      } else {
        // Defaults for Create
        const today = new Date().toISOString().split('T')[0];
        const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
        setBookName('');
        setPriceBookType('List Price');
        setStartDate(today);
        setEndDate(nextYear);
        setStateName('');
        setCityName('');
        setCurrency('INR');
        setPercentage('0');
        setMarkups('0');
        setSelectedStoreIds([]);
        setProductRows([
          {
            Product_Id: '',
            Product_Name: '',
            UOM: '',
            Unit_Price: '',
            Tax: 0,
            Price: ''
          }
        ]);
      }
    }
  }, [open, priceBook]);

  // Handle product selection in a table row
  const handleProductSelect = (index: number, selectedValue: string) => {
    if (!selectedValue) {
      setProductRows((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          Product_Id: '',
          Product_Name: '',
          UOM: '',
          Unit_Price: '',
          Tax: 0,
          Price: ''
        };
        return updated;
      });
      return;
    }

    const prod = productMaster.find(
      (p) => String(p.Product_Id) === String(selectedValue) || String(p.id) === String(selectedValue)
    );
    if (!prod) return;

    const unitPrice = Number(prod.Price || prod.Unit_Price || 0);
    const tax = Number(prod.Tax || 0);
    const finalPrice = unitPrice + (unitPrice * tax) / 100;

    setProductRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        Product_Id: prod.Product_Id || prod.id || '',
        Product_Name: prod.Product_Name || prod.name || '',
        UOM: prod.UOM || 'Unit',
        Unit_Price: unitPrice || '',
        Tax: tax,
        Price: unitPrice > 0 ? Number(finalPrice.toFixed(2)) : ''
      };
      return updated;
    });
  };

  // Handle Unit Price or Tax change
  const handleRowChange = (index: number, field: keyof ManagePriceDetail, value: any) => {
    setProductRows((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      if (field === 'Unit_Price' || field === 'Tax') {
        const uPrice = parseFloat(String(field === 'Unit_Price' ? value : current.Unit_Price)) || 0;
        const taxRate = parseFloat(String(field === 'Tax' ? value : current.Tax)) || 0;
        current.Price = uPrice > 0 ? Number((uPrice + (uPrice * taxRate) / 100).toFixed(2)) : '';
      }

      updated[index] = current;
      return updated;
    });
  };

  const addProductRow = () => {
    setProductRows((prev) => [
      ...prev,
      {
        Product_Id: '',
        Product_Name: '',
        UOM: '',
        Unit_Price: '',
        Tax: 0,
        Price: ''
      }
    ]);
  };

  const deleteProductRow = (index: number) => {
    if (productRows.length === 1) {
      toast.info('At least one product revision row is required');
      return;
    }
    setProductRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Store multi-selection helpers
  const toggleStore = (id: number) => {
    setSelectedStoreIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const removeStore = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStoreIds((prev) => prev.filter((item) => item !== id));
  };

  const filteredStores = allStores.filter((s) => {
    const name = (s.Store_Name || s.name || '').toLowerCase();
    return name.includes(storeSearchQuery.toLowerCase());
  });

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!bookName.trim()) {
      toast.error('Price Book Name is required');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Start Date and End Date are required');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End Date cannot be earlier than Start Date');
      return;
    }

    if (selectedStoreIds.length === 0) {
      toast.error('Please select at least one store');
      return;
    }

    const hasEmptyProduct = productRows.some(
      (r) => !r.Product_Name || !r.Product_Id || Number(r.Unit_Price) <= 0
    );
    if (hasEmptyProduct) {
      toast.error('Please select valid products with positive unit prices');
      return;
    }

    const selectedStoreObjects = allStores.filter((s) => selectedStoreIds.includes(s.id));

    setIsSubmitting(true);
    try {
      const payload: Partial<ManagePriceItem> = {
        Book_Name: bookName.trim(),
        PriceBook_Type: priceBookType,
        Start_Date: startDate,
        End_Date: endDate,
        Currency: currency,
        Percentage: percentage || '0',
        Markups: markups || '0',
        City: cityName,
        State: stateName,
        Store_Id: selectedStoreObjects,
        Store_Names: selectedStoreObjects.map((s) => s.Store_Name || s.name).join(', '),
        ManagePrice_Details: productRows
      };

      if (isEdit && priceBook) {
        await updateManagePrice(priceBook.id, {
          ...payload,
          id: priceBook.id,
          ManagePrice_Id: priceBook.ManagePrice_Id
        });
        toast.success('Price Book updated successfully');
      } else {
        await createManagePrice(payload);
        toast.success('Price Book created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Submit price book failed:', err);
      toast.error(err?.message || 'Failed to save price book');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl max-h-[92vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl sm:rounded-2xl"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Price Book' : 'Create Price Book'}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Top Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Price Book Name */}
            <div className="flex items-center gap-3">
              <label className="w-36 text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                Price Book Name <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <Input
                  value={bookName}
                  onChange={(e) => setBookName(e.target.value)}
                  placeholder="Price Book Name"
                  className="h-9 text-sm border-slate-300 dark:border-slate-700 rounded-md focus-visible:ring-1 focus-visible:ring-slate-400"
                  required
                />
              </div>
            </div>

            {/* Price Book Type */}
            <div className="flex items-center gap-3">
              <label className="w-36 text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                Price Book Type <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <Select value={priceBookType} onValueChange={(val) => setPriceBookType(val || 'List Price')}>
                  <SelectTrigger className="h-9 text-sm border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Select Price Book Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="List Price">List Price</SelectItem>
                    <SelectItem value="Special Price">Special Price</SelectItem>
                    <SelectItem value="City Based">City Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* City Based extra fields */}
            {priceBookType === 'City Based' && (
              <>
                <div className="flex items-center gap-3">
                  <label className="w-36 text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    State <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1">
                    <Input
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="State"
                      className="h-9 text-sm border-slate-300 dark:border-slate-700 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-36 text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="flex-1">
                    <Input
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      placeholder="City"
                      className="h-9 text-sm border-slate-300 dark:border-slate-700 rounded-md"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Start Date */}
            <div className="flex items-center gap-3">
              <label className="w-36 text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="MM-dd-yyyy"
                  className="h-9 text-sm border-slate-300 dark:border-slate-700 rounded-md"
                  required
                />
              </div>
            </div>

            {/* End Date */}
            <div className="flex items-center gap-3">
              <label className="w-36 text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="flex-1">
                <Input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="MM-dd-yyyy"
                  className="h-9 text-sm border-slate-300 dark:border-slate-700 rounded-md"
                  required
                />
              </div>
            </div>
          </div>

          {/* Product Items Table */}
          <div className="mt-4">
            <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <th className="py-2.5 px-3 min-w-[220px]">Product Name</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Product Id</th>
                    <th className="py-2.5 px-3 min-w-[90px]">Uom</th>
                    <th className="py-2.5 px-3 min-w-[110px]">Unit Price</th>
                    <th className="py-2.5 px-3 min-w-[90px]">Tax %</th>
                    <th className="py-2.5 px-3 min-w-[110px]">Final Price</th>
                    <th className="py-2.5 px-3 w-[60px] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {productRows.map((row, index) => {
                    const availableProducts = productMaster.filter(
                      (p) =>
                        String(p.Product_Id) === String(row.Product_Id) ||
                        !productRows.some(
                          (r, rIdx) => rIdx !== index && String(r.Product_Id) === String(p.Product_Id)
                        )
                    );

                    return (
                      <tr key={index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                        {/* Product Name */}
                        <td className="py-2 px-2.5">
                          <select
                            value={row.Product_Id || ''}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="w-full h-8 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 px-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-500"
                          >
                            <option value="">Select Product</option>
                            {availableProducts.map((p) => (
                              <option key={p.id || p.Product_Id} value={p.Product_Id || p.id}>
                                {p.Product_Name || p.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Product Id */}
                        <td className="py-2 px-2.5">
                          <Input
                            readOnly
                            value={row.Product_Id || ''}
                            placeholder="Product Id"
                            className="h-8 text-xs border-slate-300 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-800/30"
                          />
                        </td>

                        {/* Uom */}
                        <td className="py-2 px-2.5">
                          <Input
                            readOnly
                            value={row.UOM || ''}
                            placeholder="UOM"
                            className="h-8 text-xs border-slate-300 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-800/30"
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="py-2 px-2.5">
                          <Input
                            type="number"
                            value={row.Unit_Price}
                            onChange={(e) => handleRowChange(index, 'Unit_Price', e.target.value)}
                            placeholder="Unit Price"
                            className="h-8 text-xs border-slate-300 dark:border-slate-700 rounded"
                          />
                        </td>

                        {/* Tax % */}
                        <td className="py-2 px-2.5">
                          <Input
                            type="number"
                            value={row.Tax}
                            onChange={(e) => handleRowChange(index, 'Tax', e.target.value)}
                            placeholder="0"
                            className="h-8 text-xs border-slate-300 dark:border-slate-700 rounded"
                          />
                        </td>

                        {/* Final Price */}
                        <td className="py-2 px-2.5">
                          <Input
                            readOnly
                            value={row.Price}
                            placeholder="Price"
                            className="h-8 text-xs border-slate-300 dark:border-slate-700 rounded bg-slate-50/50 dark:bg-slate-800/30 font-medium"
                          />
                        </td>

                        {/* Action */}
                        <td className="py-2 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => deleteProductRow(index)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* + Add Product button */}
            <button
              type="button"
              onClick={addProductRow}
              className="text-[#10b981] hover:text-[#059669] font-medium text-sm mt-2.5 block transition-colors"
            >
              + Add Product
            </button>
          </div>

          {/* Applicable to Stores Section */}
          <div className="space-y-1.5" ref={storeDropdownRef}>
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              Applicable to Stores <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              {/* Box holding chips and input */}
              <div
                onClick={() => setIsStoreDropdownOpen(true)}
                className="min-h-[38px] w-full border border-slate-300 dark:border-slate-700 rounded-md p-1.5 flex flex-wrap items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900"
              >
                {selectedStoreIds.map((id) => {
                  const s = allStores.find((store) => store.id === id);
                  const name = s ? s.Store_Name || s.name : `Store #${id}`;
                  return (
                    <span
                      key={id}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs px-2.5 py-1 rounded-md flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={(e) => removeStore(id, e)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}

                <input
                  type="text"
                  value={storeSearchQuery}
                  onChange={(e) => {
                    setStoreSearchQuery(e.target.value);
                    if (!isStoreDropdownOpen) setIsStoreDropdownOpen(true);
                  }}
                  onFocus={() => setIsStoreDropdownOpen(true)}
                  placeholder={
                    selectedStoreIds.length === 0 ? 'Search and select stores...' : ''
                  }
                  className="flex-1 min-w-[140px] text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                />

                <ChevronDown className="h-4 w-4 text-slate-400 ml-auto shrink-0" />
              </div>

              {/* Dropdown Menu */}
              {isStoreDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg max-h-52 overflow-y-auto p-1">
                  {filteredStores.length === 0 ? (
                    <div className="p-2 text-xs text-slate-400 text-center">
                      No stores found
                    </div>
                  ) : (
                    filteredStores.map((s) => {
                      const isSelected = selectedStoreIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggleStore(s.id)}
                          className={`flex items-center justify-between px-3 py-1.5 text-xs rounded cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-slate-100'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{s.Store_Name || s.name}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Validation text */}
            {selectedStoreIds.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Please select at least one store</p>
            )}
          </div>

          {/* Action Buttons (Centered, exact screenshot match) */}
          <div className="flex items-center justify-center gap-3 pt-6 pb-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-6 py-2 rounded-md font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 px-6 py-2 rounded-md font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
