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
import { Save, X, Tag } from 'lucide-react';
import { toast } from 'sonner';
import {
  CouponItem,
  createCoupon,
  updateCoupon
} from '@/service/api/coupons/api';

interface CouponFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: CouponItem | null;
  onSuccess: () => void;
}

export function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
  onSuccess
}: CouponFormDialogProps) {
  const isEdit = Boolean(coupon && coupon.id);
  const [activeTab, setActiveTab] = useState<'basic' | 'discount' | 'validity'>('basic');

  // Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('FLAT');
  const [status, setStatus] = useState('ACTIVE');
  const [description, setDescription] = useState('');

  // Tab 2: Discount Settings
  const [discountValue, setDiscountValue] = useState<number | string>('0');
  const [maxDiscount, setMaxDiscount] = useState<number | string>('');
  const [minOrderValue, setMinOrderValue] = useState<number | string>('0');

  // Tab 3: Validity & Limits
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | string>('');
  const [usedCount, setUsedCount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setActiveTab('basic');
      if (coupon) {
        setCouponCode(coupon.Counpon_Code || '');
        setCouponType(coupon.Counpon_Type || 'FLAT');
        setStatus(coupon.Status || 'ACTIVE');
        setDescription(coupon.Description || coupon.Counpon_Description || '');
        setDiscountValue(coupon.Discount_Value !== undefined ? coupon.Discount_Value : '0');
        setMaxDiscount(coupon.Max_Discount !== undefined && coupon.Max_Discount !== null ? String(coupon.Max_Discount) : '');
        setMinOrderValue(coupon.Min_Order_Value !== undefined ? String(coupon.Min_Order_Value) : '0');
        setValidFrom(coupon.Valid_From ? coupon.Valid_From.split('T')[0] : '');
        setValidTo(coupon.Valid_To ? coupon.Valid_To.split('T')[0] : '');
        setUsageLimit(coupon.Usage_Limit !== undefined && coupon.Usage_Limit !== null ? String(coupon.Usage_Limit) : '');
        setUsedCount(coupon.Used_Count || 0);
      } else {
        setCouponCode('');
        setCouponType('FLAT');
        setStatus('ACTIVE');
        setDescription('');
        setDiscountValue('0');
        setMaxDiscount('');
        setMinOrderValue('0');
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
        setValidFrom(today);
        setValidTo(nextMonth);
        setUsageLimit('');
        setUsedCount(0);
      }
    }
  }, [open, coupon]);

  // Tab validations
  const isBasicValid = Boolean(couponCode.trim().length >= 3 && couponType);

  const numDiscount = parseFloat(String(discountValue));
  const numMinOrder = parseFloat(String(minOrderValue));
  const isDiscountValid =
    !isNaN(numDiscount) &&
    numDiscount > 0 &&
    (couponType !== 'PERCENTAGE' || numDiscount <= 100) &&
    !isNaN(numMinOrder) &&
    numMinOrder >= 0;

  const isValidityValid =
    Boolean(validFrom) &&
    Boolean(validTo) &&
    new Date(validFrom) <= new Date(validTo);

  // Form is valid only when all required fields from all tabs are filled
  const isFormValid = isBasicValid && isDiscountValid && isValidityValid;

  const handleNextTab = () => {
    if (activeTab === 'basic') {
      if (!couponCode.trim()) {
        toast.error('Coupon code is required');
        return;
      }
      if (couponCode.trim().length < 3) {
        toast.error('Coupon code must be at least 3 characters');
        return;
      }
      setActiveTab('discount');
    } else if (activeTab === 'discount') {
      if (discountValue === '' || isNaN(numDiscount) || numDiscount <= 0) {
        toast.error('Discount value must be greater than 0');
        return;
      }
      if (couponType === 'PERCENTAGE' && numDiscount > 100) {
        toast.error('Percentage discount cannot exceed 100%');
        return;
      }
      if (minOrderValue === '' || isNaN(numMinOrder) || numMinOrder < 0) {
        toast.error('Minimum order value cannot be negative');
        return;
      }
      setActiveTab('validity');
    }
  };

  const handlePrevTab = () => {
    if (activeTab === 'validity') {
      setActiveTab('discount');
    } else if (activeTab === 'discount') {
      setActiveTab('basic');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();

    if (!isFormValid) {
      if (!isBasicValid) {
        toast.error('Please enter a valid coupon code (min 3 characters)');
        setActiveTab('basic');
        return;
      }
      if (!isDiscountValid) {
        toast.error('Please enter a valid discount value (> 0)');
        setActiveTab('discount');
        return;
      }
      if (!isValidityValid) {
        toast.error('Please select valid start and end dates');
        setActiveTab('validity');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<CouponItem> = {
        Counpon_Code: cleanCode,
        Counpon_Type: couponType,
        Discount_Type: couponType === 'PERCENTAGE' ? 'PERCENTAGE' : 'FLAT',
        Discount_Value: parseFloat(String(discountValue)) || 0,
        Max_Discount: maxDiscount !== '' ? parseFloat(String(maxDiscount)) : null,
        Min_Order_Value: parseFloat(String(minOrderValue)) || 0,
        Usage_Limit: usageLimit !== '' ? parseInt(String(usageLimit), 10) : null,
        Valid_From: validFrom ? new Date(validFrom).toISOString() : new Date().toISOString(),
        Valid_To: validTo ? new Date(validTo).toISOString() : new Date().toISOString(),
        Status: status,
        Description: description.trim(),
        Counpon_Description: description.trim(),
      };

      if (isEdit && coupon) {
        await updateCoupon(coupon.id, {
          ...payload,
          id: coupon.id,
          Counpon_Id: coupon.Counpon_Id
        });
        toast.success('Coupon updated successfully');
      } else {
        await createCoupon(payload);
        toast.success('Coupon created successfully');
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Submit coupon failed:', err);
      toast.error(err?.message || 'Failed to save coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isEdit ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs Bar matching screenshot */}
        <div className="flex items-center gap-6 px-6 pt-3 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`pb-2 text-sm font-medium transition-colors relative ${
              activeTab === 'basic'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Basic Info
            {activeTab === 'basic' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discount')}
            className={`pb-2 text-sm font-medium transition-colors relative ${
              activeTab === 'discount'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Discount Settings
            {activeTab === 'discount' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('validity')}
            className={`pb-2 text-sm font-medium transition-colors relative ${
              activeTab === 'validity'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Validity &amp; Limits
            {activeTab === 'validity' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* TAB 1: Basic Info */}
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Coupon Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code (e.g., SUMMER25)"
                      className="pl-9 h-10 text-xs font-mono font-medium rounded-md border-slate-200 dark:border-slate-800"
                      required
                    />
                  </div>
                </div>

                {/* Coupon Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Coupon Type <span className="text-red-500">*</span>
                  </label>
                  <Select value={couponType} onValueChange={(val) => setCouponType(val || 'FLAT')}>
                    <SelectTrigger className="h-10 text-xs w-full rounded-md border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select Coupon Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLAT">Flat Discount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage Discount</SelectItem>
                      <SelectItem value="BUY_GET">Buy X Get Y</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <Select value={status} onValueChange={(val) => setStatus(val || 'ACTIVE')}>
                    <SelectTrigger className="h-10 text-xs w-full rounded-md border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="DISABLED">Disabled</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Enter coupon description (optional)"
                    className="w-full text-xs p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Discount Settings */}
            {activeTab === 'discount' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Discount Value */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Discount Value <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    className="h-10 text-xs rounded-md border-slate-200 dark:border-slate-800"
                    required
                  />
                </div>

                {/* Maximum Discount Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Maximum Discount Amount
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="h-10 text-xs rounded-md border-slate-200 dark:border-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Maximum discount amount applicable
                  </p>
                </div>

                {/* Minimum Order Value (full width matching screenshot 2) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Minimum Order Value <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0"
                    className="h-10 text-xs rounded-md border-slate-200 dark:border-slate-800"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Minimum order value to apply this coupon
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: Validity & Limits */}
            {activeTab === 'validity' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Valid From */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Valid From
                  </label>
                  <Input
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="h-10 text-xs rounded-md border-slate-200 dark:border-slate-800"
                  />
                </div>

                {/* Valid To */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Valid To
                  </label>
                  <Input
                    type="date"
                    value={validTo}
                    min={validFrom}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="h-10 text-xs rounded-md border-slate-200 dark:border-slate-800"
                  />
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Usage Limit
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="h-10 text-xs rounded-md border-slate-200 dark:border-slate-800"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Maximum number of times this coupon can be used
                  </p>
                </div>

                {/* Used Count */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Used Count
                  </label>
                  <Input
                    type="number"
                    value={usedCount}
                    disabled
                    className="h-10 text-xs bg-slate-50 dark:bg-slate-800/50 rounded-md border-slate-200 dark:border-slate-800 text-slate-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Current number of times this coupon has been used
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions with Next / Back navigation and conditional Save */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            {/* Back button (when not on first tab) */}
            <div>
              {activeTab !== 'basic' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrevTab}
                  className="h-9 px-4 text-xs font-medium gap-1.5 rounded-md border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  &larr; Back
                </Button>
              )}
            </div>

            {/* Next, Save, Cancel buttons */}
            <div className="flex items-center gap-2.5">
              {activeTab !== 'validity' && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextTab}
                  className="h-9 px-5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs"
                >
                  Next &rarr;
                </Button>
              )}

              <Button
                type="submit"
                size="sm"
                disabled={!isFormValid || isSubmitting}
                className="h-9 px-5 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed"
                title={!isFormValid ? 'Please fill all required fields across all tabs to enable Save' : 'Save coupon'}
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Save'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 text-xs font-medium gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-0 rounded-md"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
