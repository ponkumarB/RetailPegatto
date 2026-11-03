'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DiscountItem,
  DiscountDetail,
  createDiscount,
  updateDiscount,
} from '@/service/api/discount/api';
import { fetchProductMasterList } from '@/service/api/manage-price/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'
];

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount?: DiscountItem | null;
  onSuccess: () => void;
}

export function DiscountDialog({
  open,
  onOpenChange,
  discount,
  onSuccess
}: DiscountDialogProps) {
  const isEdit = Boolean(discount && discount.id);

  const [discountId, setDiscountId] = useState('');
  const [discountName, setDiscountName] = useState('');
  const [discountType, setDiscountType] = useState<'Flat' | 'Segment' | 'Range'>('Flat');
  const [percentage, setPercentage] = useState<number | string>('10');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [segmentCity, setSegmentCity] = useState('');

  // Products
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [productRows, setProductRows] = useState<DiscountDetail[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProductMasterList().then((res) => {
      setAvailableProducts(res || []);
    });
  }, []);

  useEffect(() => {
    if (open) {
      if (discount) {
        setDiscountId(discount.Discount_Id || '');
        setDiscountName(discount.Discount_Name || '');
        const type = (discount.Discount_Type as 'Flat' | 'Segment' | 'Range') || 'Flat';
        setDiscountType(type);
        setPercentage(discount.Discount_Percentage || '10');
        setStartDate(discount.Start_Date ? discount.Start_Date.split('T')[0] : '');
        setEndDate(discount.End_Date ? discount.End_Date.split('T')[0] : '');
        setRangeFrom(discount.From_Quantity !== undefined ? String(discount.From_Quantity) : '');
        setRangeTo(discount.To_Quantity !== undefined ? String(discount.To_Quantity) : '');
        setSegmentCity(discount.Segmant || '');

        if (discount.DiscountSetup_Details && discount.DiscountSetup_Details.length > 0) {
          setProductRows(
            discount.DiscountSetup_Details.map((d) => ({
              id: d.id,
              Product_Id: d.Product_Id,
              Product_Name: d.Product_Name,
              Discount: d.Discount !== undefined ? d.Discount : discount.Discount_Percentage || 10,
            }))
          );
        } else {
          setProductRows([
            {
              Product_Id: '',
              Product_Name: '',
              Discount: discount.Discount_Percentage || '10',
            },
          ]);
        }
      } else {
        // Reset for new creation
        setDiscountId('');
        setDiscountName('');
        setDiscountType('Flat');
        setPercentage('10');
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(nextMonth);
        setRangeFrom('');
        setRangeTo('');
        setSelectedState('');
        setSegmentCity('');
        setProductRows([
          {
            Product_Id: '',
            Product_Name: '',
            Discount: '10',
          },
        ]);
      }
    }
  }, [open, discount]);

  const handlePercentageChange = (val: string) => {
    const num = parseFloat(val);
    if (num > 100) {
      toast.warning('Discount percentage cannot exceed 100%');
      return;
    }
    setPercentage(val);
    if (productRows.length > 0) {
      setProductRows((prev) =>
        prev.map((p) => ({
          ...p,
          Discount: val,
        }))
      );
    }
  };

  const handleAddRow = () => {
    const lastRow = productRows[productRows.length - 1];
    if (lastRow && (!lastRow.Product_Id || !lastRow.Product_Name)) {
      toast.warning('Please select a product for the previous row first');
      return;
    }
    setProductRows((prev) => [
      ...prev,
      {
        Product_Id: '',
        Product_Name: '',
        Discount: percentage || 10,
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (productRows.length <= 1) {
      toast.warning('At least one product row is required');
      return;
    }
    setProductRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const found = availableProducts.find((p) => String(p.Product_Id) === String(productId));
    if (!found) return;

    setProductRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        Product_Id: String(found.Product_Id),
        Product_Name: found.Product_Name,
        Discount: copy[index].Discount || percentage || 10,
      };
      return copy;
    });
  };

  const handleRowDiscountChange = (index: number, value: string) => {
    const num = parseFloat(value);
    if (num > 100) {
      toast.warning('Discount percentage cannot exceed 100%');
      return;
    }
    setProductRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        Discount: value,
      };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!discountName.trim()) {
      toast.error('Discount Name is required');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Start Date and End Date are required');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start Date cannot be later than End Date');
      return;
    }

    if (discountType === 'Range') {
      if (rangeFrom === '' || rangeTo === '') {
        toast.error('Quantity Range From and To are required');
        return;
      }
      if (Number(rangeFrom) > Number(rangeTo)) {
        toast.error('Range From cannot be greater than Range To');
        return;
      }
    }

    if (discountType === 'Segment' && !segmentCity) {
      toast.error('City/Segment is required for Segment discount');
      return;
    }

    const invalidRow = productRows.some((r) => !r.Product_Name || !r.Product_Id);
    if (invalidRow) {
      toast.error('Please select valid products for all rows');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<DiscountItem> = {
        Discount_Name: discountName.trim(),
        Discount_Type: discountType,
        Flat: discountType === 'Flat' ? 'Flat' : '',
        Discount_Percentage: percentage || 0,
        Start_Date: startDate,
        End_Date: endDate,
        Segmant: discountType === 'Segment' ? segmentCity : '',
        From_Quantity: discountType === 'Range' ? rangeFrom : '',
        To_Quantity: discountType === 'Range' ? rangeTo : '',
        DiscountSetup_Details: productRows,
      };

      if (isEdit && discount) {
        await updateDiscount(discount.id, {
          ...payload,
          id: discount.id,
          Discount_Id: discount.Discount_Id,
        });
        toast.success('Discount updated successfully');
      } else {
        await createDiscount(payload);
        toast.success('Discount created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Submit discount failed:', err);
      toast.error(err?.message || 'Failed to save discount setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl sm:rounded-2xl"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Setup Discount' : 'Add Setup Discount'}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Discount ID (if edit mode) */}
            {isEdit && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Discount ID
                </label>
                <Input
                  value={discountId}
                  disabled
                  className="h-9 bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-mono text-xs"
                />
              </div>
            )}

            {/* Discount Name */}
            <div className={isEdit ? '' : 'md:col-span-2'}>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Discount Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={discountName}
                onChange={(e) => setDiscountName(e.target.value)}
                placeholder="e.g. Diwali Special, Pongal Offer"
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Discount Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <Select
                value={discountType}
                onValueChange={(val) => setDiscountType(((val as any) || 'Flat'))}
              >
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="Select Discount Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flat">Flat</SelectItem>
                  <SelectItem value="Segment">Segment</SelectItem>
                  <SelectItem value="Range">Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Master Percentage */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Discount Percentage (%) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                step="any"
                value={percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                placeholder="e.g. 10"
                required
                className="h-9 text-xs"
              />
            </div>

            {/* Segment: State and City */}
            {discountType === 'Segment' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={selectedState}
                    onValueChange={(val) => {
                      setSelectedState(val || '');
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {INDIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    City / Segment <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={segmentCity}
                    onChange={(e) => setSegmentCity(e.target.value)}
                    placeholder="Enter City name (e.g. Chennai, Bangalore)"
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </>
            )}

            {/* Range: From and To */}
            {discountType === 'Range' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Quantity Range From <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    placeholder="e.g. 1"
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Quantity Range To <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    placeholder="e.g. 10"
                    required
                    className="h-9 text-xs"
                  />
                </div>
              </>
            )}

            {/* Start Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Products &amp; Discount
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="h-8 gap-1.5 text-xs text-[#28a745] hover:text-[#218838] border-[#28a745]/30 hover:border-[#28a745] hover:bg-[#28a745]/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </Button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f8fafc] dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold text-[#335384] uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[#335384] uppercase tracking-wider w-40">
                      Product ID
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[#335384] uppercase tracking-wider w-32">
                      Discount %
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[#335384] uppercase tracking-wider w-16 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-2">
                        <Select
                          value={row.Product_Id ? String(row.Product_Id) : ''}
                          onValueChange={(val) => handleSelectProduct(idx, val || '')}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder="Select product..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-56">
                            {availableProducts.map((p) => (
                              <SelectItem key={p.Product_Id || p.id} value={String(p.Product_Id || p.id)}>
                                {p.Product_Name} ({p.Product_Id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.Product_Id}
                          disabled
                          placeholder="ID"
                          className="h-8 text-xs bg-slate-50 dark:bg-slate-800 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={row.Discount}
                          onChange={(e) => handleRowDiscountChange(idx, e.target.value)}
                          placeholder="%"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                          title="Delete row"
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-9 px-5 text-xs gap-1.5 bg-[#28a745] hover:bg-[#218838] text-white"
            >
              <Save className="h-3.5 w-3.5" />
              {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
