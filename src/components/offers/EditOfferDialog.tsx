'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tag,
  Percent,
  DollarSign,
  Truck,
  Landmark,
  Package,
  Layers,
  CheckCircle2,
  Calendar,
  Save,
  X,
  ChevronRight,
  ChevronLeft,
  Building2,
  CreditCard,
  Plus
} from 'lucide-react';
import { ProductSelectionDialog } from './ProductSelectionDialog';
import {
  OfferItem,
  updateOfferRecord,
  createBankOfferRecord,
  updateBankOfferRecord,
  fetchBankOfferById,
  fetchOfferTypes,
  fetchBanks,
  fetchCustomerTypes,
  OfferTypeOption,
  CustomerTypeOption
} from '@/service/api/offers/api';
import { toast } from 'sonner';

interface EditOfferDialogProps {
  open: boolean;
  onClose: () => void;
  offer: OfferItem | null;
  onSuccess: (updatedOffer: OfferItem) => void;
}

const CARD_TYPES = [
  { value: 'Credit', label: 'Credit Card' },
  { value: 'Debit', label: 'Debit Card' },
  { value: 'Both', label: 'Both' }
];

const BANK_DISCOUNT_TYPES = [
  { value: 'Percentage', label: 'Percentage' },
  { value: 'instant', label: 'Instant Discount' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'emi', label: 'No Cost EMI' }
];

export function EditOfferDialog({ open, onClose, offer, onSuccess }: EditOfferDialogProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [openProductSelector, setOpenProductSelector] = useState<boolean>(false);

  // Dynamic API lookups
  const [offerTypes, setOfferTypes] = useState<OfferTypeOption[]>([]);
  const [banksList, setBanksList] = useState<any[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerTypeOption[]>([]);

  // Step 0: Basic Info
  const [offerName, setOfferName] = useState<string>('');
  const [offerCode, setOfferCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [offerType, setOfferType] = useState<string>('percentage');

  // Bank specifics (within Step 0 when offerType === 'bank')
  const [existingBankOfferId, setExistingBankOfferId] = useState<number | string | null>(null);
  const [bankName, setBankName] = useState<string>('');
  const [cardType, setCardType] = useState<string>('Both');
  const [minBankTxn, setMinBankTxn] = useState<string>('');
  const [bankDiscountType, setBankDiscountType] = useState<string>('Percentage');
  const [bankTerms, setBankTerms] = useState<string>('');
  const [bankPromoCode, setBankPromoCode] = useState<string>('');

  // Step 1: Offer Details
  const [discountValue, setDiscountValue] = useState<string>('10');
  const [minPurchase, setMinPurchase] = useState<string>('0');
  const [maxDiscount, setMaxDiscount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Step 2: Targeting
  const [customerType, setCustomerType] = useState<string>('all');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [status, setStatus] = useState<string>('Active');

  // Applicable products, categories, stores
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ id: string | number; name: string; Product_Id?: string | number }>
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<Array<{ id: string | number; name: string }>>([]);

  // Fetch API options on dialog open
  useEffect(() => {
    if (open) {
      Promise.all([fetchOfferTypes(), fetchBanks(), fetchCustomerTypes()]).then(
        ([types, banks, custTypes]) => {
          setOfferTypes(types);
          setBanksList(banks);
          setCustomerTypes(custTypes);
        }
      );
    }
  }, [open]);

  // Load offer data when open or offer changes
  useEffect(() => {
    if (offer && open) {
      setActiveStep(0);
      setOfferName(offer.Offer_Name || offer.name || '');
      setOfferCode(offer.Offer_Code || offer.code || '');
      setOfferType((offer.Offer_Type || offer.type || 'percentage').toLowerCase());
      setDescription(offer.Description || offer.description || '');
      setCustomerType((offer.Customer_Type || offer.customer_type || 'all').toLowerCase());
      setStartDate(offer.Start_Date?.split('T')[0] || offer.start_date?.split('T')[0] || '');
      setEndDate(offer.End_Date?.split('T')[0] || offer.end_date?.split('T')[0] || '');
      setStatus(offer.Status || offer.status || 'Active');

      const discVal = Number(offer.Offer_Value || offer.Discount_Value || offer.discount_value || 0);
      setDiscountValue(String(discVal || 10));
      setMinPurchase(String(offer.Min_Purchase || offer.min_purchase || 0));
      setMaxDiscount(offer.Max_Discount ? String(offer.Max_Discount) : '');
      setUsageLimit(offer.Usage_Limit ? String(offer.Usage_Limit) : '');
      setPerUserLimit(Number(offer.Per_User_Limit || offer.Per_Customer_Limit || offer.per_user_limit || 1));

      // Map Applicable Products
      const rawProducts = offer.Applicable_Products || offer.Item_Id || offer.applicable_products || [];
      const mappedProds = rawProducts.map((p: any) => {
        if (typeof p === 'object') {
          return {
            id: p.id || p.Product_Id,
            Product_Id: p.Product_Id || p.id,
            name: p.Product_Name || p.name || `Product #${p.id || p.Product_Id}`
          };
        }
        return { id: p, Product_Id: p, name: `Product #${p}` };
      });
      setSelectedProducts(mappedProds);

      // Map Applicable Categories
      const rawCats = offer.Applicable_Categories || offer.applicable_categories || [];
      const mappedCats = rawCats.map((c: any) => (typeof c === 'object' ? c.name || c.Category_Name : c)).filter(Boolean);
      setSelectedCategories(mappedCats);

      // Map Applicable Stores
      const rawStores = offer.Store_Id || offer.store_id || [];
      const mappedStores = rawStores.map((s: any) => {
        if (typeof s === 'object') {
          return { id: s.id, name: s.Store_Name || s.name || `Store #${s.id}` };
        }
        return { id: s, name: `Store #${s}` };
      });
      setSelectedStores(mappedStores);

      // Map Bank Offer Details
      if (offer.Bank_Offer_Id) {
        let bankId: number | string | null = null;
        let bankData: any = null;
        if (Array.isArray(offer.Bank_Offer_Id) && offer.Bank_Offer_Id.length > 0) {
          if (typeof offer.Bank_Offer_Id[0] === 'object') {
            bankData = offer.Bank_Offer_Id[0];
            bankId = bankData.id || null;
          } else {
            bankId = offer.Bank_Offer_Id[0];
          }
        } else if (typeof offer.Bank_Offer_Id === 'object') {
          bankData = offer.Bank_Offer_Id;
          bankId = bankData.id || null;
        } else if (offer.Bank_Offer_Id) {
          bankId = offer.Bank_Offer_Id;
        }

        if (bankData) {
          setExistingBankOfferId(bankData.id || bankId);
          setBankName(bankData.Bank_Name || '');
          setCardType(bankData.Card_Type || 'Both');
          setBankDiscountType(bankData.Discount_Type || 'Percentage');
          setMinBankTxn(String(bankData.Min_Transaction_Amount || bankData.Min_Transaction || ''));
          setBankTerms(bankData.Terms || '');
          setBankPromoCode(bankData.Promo_Code || offer.Offer_Code || '');
        }

        if (bankId) {
          setExistingBankOfferId(bankId);
          // Query live details from GET user/OfferBankDetailsCRUD/?id=${bankId}
          fetchBankOfferById(bankId).then((fetched) => {
            if (fetched) {
              setBankName(fetched.Bank_Name || bankData?.Bank_Name || '');
              setCardType(fetched.Card_Type || bankData?.Card_Type || 'Both');
              setBankDiscountType(fetched.Discount_Type || bankData?.Discount_Type || 'Percentage');
              setMinBankTxn(String(fetched.Min_Transaction_Amount ?? bankData?.Min_Transaction_Amount ?? ''));
              setBankTerms(fetched.Terms || bankData?.Terms || '');
              setBankPromoCode(fetched.Promo_Code || bankData?.Promo_Code || offer.Offer_Code || '');
            }
          });
        }
      } else {
        setExistingBankOfferId(null);
      }
    }
  }, [offer, open]);

  // When user selects a bank, query GET user/OfferBankDetailsCRUD/?id=${b.id}
  const handleBankChange = async (selectedName: string) => {
    setBankName(selectedName);
    const found = banksList.find((b) => (b.Bank_Name || b.name || b.code) === selectedName);
    if (found && found.id) {
      try {
        const details = await fetchBankOfferById(found.id);
        if (details) {
          if (details.Card_Type) setCardType(details.Card_Type);
          if (details.Discount_Type) setBankDiscountType(details.Discount_Type);
          if (details.Min_Transaction_Amount !== undefined) {
            setMinBankTxn(String(details.Min_Transaction_Amount));
          }
          if (details.Terms) setBankTerms(details.Terms);
          if (details.Promo_Code) setBankPromoCode(details.Promo_Code);
          setExistingBankOfferId(details.id);
        }
      } catch (err) {
        console.warn('Could not fetch bank offer details via OfferBankDetailsCRUD:', err);
      }
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!offerName.trim()) {
        toast.error('Offer Name is required');
        return;
      }
      if (!offerCode.trim()) {
        toast.error('Offer Code is required');
        return;
      }
      if (offerType === 'bank') {
        if (!bankName) {
          toast.error('Please select a participating bank');
          return;
        }

        // Call user/OfferBankDetailsCRUD/ on Step 0 transition
        try {
          const bankPayload = {
            Bank_Name: bankName,
            Card_Type: cardType,
            Discount_Type: bankDiscountType,
            Min_Transaction_Amount: parseFloat(minBankTxn) || 0,
            Terms: bankTerms || `Exclusive offer for ${bankName} cardholders`,
            Promo_Code: bankPromoCode || offerCode.toUpperCase(),
            Is_Active: true
          };
          if (existingBankOfferId) {
            const updated = await updateBankOfferRecord(existingBankOfferId, bankPayload);
            if (updated && updated.id) setExistingBankOfferId(updated.id);
          } else {
            const created = await createBankOfferRecord(bankPayload);
            if (created && (created.id || created.data?.id)) {
              setExistingBankOfferId(created.id || created.data?.id);
            }
          }
        } catch (err) {
          console.warn('Bank offer save note:', err);
        }
      }
      setActiveStep(1);
      return;
    }

    if (activeStep === 1) {
      if (!discountValue || Number(discountValue) <= 0) {
        if (offerType !== 'shipping') {
          toast.error('Please enter a valid discount value');
          return;
        }
      }
      if (!startDate) {
        toast.error('Please select start date');
        return;
      }
      if (!endDate) {
        toast.error('Please select end date');
        return;
      }
      setActiveStep(2);
      return;
    }
  };

  const removeProduct = (id: string | number) => {
    setSelectedProducts((prev) => prev.filter((p) => String(p.id) !== String(id) && String(p.Product_Id) !== String(id)));
  };

  const removeCategory = (cat: string) => {
    setSelectedCategories((prev) => prev.filter((c) => c !== cat));
  };

  const removeStore = (id: string | number) => {
    setSelectedStores((prev) => prev.filter((s) => String(s.id) !== String(id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offer) return;
    setIsSubmitting(true);

    try {
      let bankOfferId: number | string | null = existingBankOfferId;

      // Handle bank offer save / update via user/OfferBankDetailsCRUD/
      if (offerType === 'bank') {
        if (!bankName) {
          toast.error('Please select a bank');
          setIsSubmitting(false);
          return;
        }

        const bankPayload = {
          Bank_Name: bankName,
          Card_Type: cardType,
          Discount_Type: bankDiscountType,
          Min_Transaction_Amount: parseFloat(minBankTxn) || 0,
          Terms: bankTerms || `Exclusive offer for ${bankName} cardholders`,
          Promo_Code: bankPromoCode || offerCode.toUpperCase(),
          Is_Active: true
        };

        if (existingBankOfferId) {
          const updatedBank = await updateBankOfferRecord(existingBankOfferId, bankPayload);
          bankOfferId = updatedBank.id || existingBankOfferId;
        } else {
          const createdBank = await createBankOfferRecord(bankPayload);
          bankOfferId = createdBank.id || createdBank.data?.id;
        }
      }

      // Prepare request data matching API expected format
      const requestData: Partial<OfferItem> = {
        Offer_Name: offerName,
        Offer_Code: offerCode.toUpperCase(),
        Offer_Type: offerType,
        Offer_Value: parseFloat(discountValue) || 0,
        Discount_Type: offerType === 'bank' ? bankDiscountType : offerType,
        Discount_Value: parseFloat(discountValue) || 0,
        Description: description,
        Customer_Type: customerType,
        Start_Date: startDate,
        End_Date: endDate,
        Status: status,
        Is_Active: status === 'Active',
        Min_Purchase: parseFloat(minPurchase) || 0,
        Max_Discount: maxDiscount ? parseFloat(maxDiscount) : null,
        Usage_Limit: usageLimit ? parseInt(usageLimit, 10) : null,
        Per_User_Limit: perUserLimit || 1,
        Applicable_Products: selectedProducts.map((p) => p.id || p.Product_Id),
        Applicable_Categories: selectedCategories,
        Store_Id: selectedStores.map((s) => s.id),
        Bank_Offer_Id:
          offerType === 'bank' && bankOfferId
            ? [bankOfferId]
            : offerType === 'bank'
            ? [
                {
                  id: existingBankOfferId || 1,
                  Bank_Name: bankName,
                  Card_Type: cardType,
                  Discount_Type: bankDiscountType,
                  Min_Transaction_Amount: parseFloat(minBankTxn) || 0,
                  Max_Discount: maxDiscount ? parseFloat(maxDiscount) : null
                }
              ]
            : []
      };

      const offerId = offer.id || offer.OffersMaster_Id;
      if (!offerId) {
        toast.error('Offer ID is missing');
        setIsSubmitting(false);
        return;
      }

      const updated = await updateOfferRecord(offerId, requestData);
      toast.success(`Offer "${updated.Offer_Name || offerName}" updated successfully!`);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update offer in backend:', err);
      toast.error(err?.message || 'Failed to update offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(val) => {
          if (!val) {
            onClose();
          }
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-3xl p-6 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
          {/* Header matching old retail project */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Edit Offer: {offer?.Offer_Name || offer?.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update promotional offer details and targeting rules
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stepper Wizard: Basic Info -> Offer Details -> Targeting */}
          <div className="py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {[
                { step: 0, title: 'Basic Info' },
                { step: 1, title: 'Offer Details' },
                { step: 2, title: 'Targeting' }
              ].map((item) => {
                const isActive = activeStep === item.step;
                const isCompleted = activeStep > item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStep(item.step)}
                    className={`flex items-center gap-2 cursor-pointer transition-colors ${
                      isActive
                        ? 'text-[#2A7D5B]'
                        : isCompleted
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive
                          ? 'bg-[#2A7D5B] text-white shadow-xs'
                          : isCompleted
                          ? 'bg-emerald-100 text-[#2A7D5B] dark:bg-emerald-950/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isCompleted ? '✓' : item.step + 1}
                    </div>
                    <span className="text-xs font-bold">{item.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Steps */}
          <div className="flex-1 overflow-y-auto py-4 px-1 max-h-[520px]">
            {/* STEP 0: BASIC INFO */}
            {activeStep === 0 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Offer Name *
                  </label>
                  <input
                    type="text"
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Offer Code *
                  </label>
                  <input
                    type="text"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-xs font-mono font-bold tracking-wider rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Unique code customers will use to redeem this offer
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Offer Type *
                  </label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                  >
                    {offerTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bank Offer Details card if offerType === 'bank' */}
                {offerType === 'bank' && (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Bank Offer Details
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Bank Name *
                        </label>
                        <select
                          value={bankName}
                          onChange={(e) => handleBankChange(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                        >
                          <option value="">Select bank</option>
                          {banksList.map((b) => {
                            const name = b.Bank_Name || b.name || b.code;
                            return (
                              <option key={b.id || name} value={name}>
                                {name}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Card Type
                        </label>
                        <select
                          value={cardType}
                          onChange={(e) => setCardType(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                        >
                          {CARD_TYPES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Discount Type
                        </label>
                        <select
                          value={bankDiscountType}
                          onChange={(e) => setBankDiscountType(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                        >
                          {BANK_DISCOUNT_TYPES.map((b) => (
                            <option key={b.value} value={b.value}>
                              {b.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Min Transaction Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            value={minBankTxn}
                            onChange={(e) => setMinBankTxn(e.target.value)}
                            placeholder="Minimum transaction amount"
                            className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Promo Code
                      </label>
                      <input
                        type="text"
                        value={bankPromoCode}
                        onChange={(e) => setBankPromoCode(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Terms & Conditions
                      </label>
                      <textarea
                        rows={2}
                        value={bankTerms}
                        onChange={(e) => setBankTerms(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 1: OFFER DETAILS */}
            {activeStep === 1 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {offerType === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-3 py-2 pr-8 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 font-semibold">
                      {offerType === 'percentage' ? '%' : '₹'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Minimum Purchase Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={minPurchase}
                        onChange={(e) => setMinPurchase(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Maximum Discount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={maxDiscount}
                        onChange={(e) => setMaxDiscount(e.target.value)}
                        placeholder="Leave empty for no limit"
                        className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Leave empty for no limit</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: TARGETING */}
            {activeStep === 2 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer Type
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                  >
                    {customerTypes.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Products & Categories
                  </label>
                  <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Select specific products or categories</span>
                      <button
                        type="button"
                        onClick={() => setOpenProductSelector(true)}
                        className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" /> Select Items
                      </button>
                    </div>

                    {/* Selected Stores */}
                    {selectedStores.length > 0 && (
                      <div>
                        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-blue-500" />
                          Selected Stores ({selectedStores.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedStores.map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                            >
                              {s.name}
                              <button
                                type="button"
                                onClick={() => removeStore(s.id)}
                                className="hover:text-red-600 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                      <div>
                        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                          <Package className="h-3.5 w-3.5 text-[#2A7D5B]" />
                          Selected Products ({selectedProducts.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {selectedProducts.map((p) => (
                            <span
                              key={p.id || p.Product_Id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-50 text-[#2A7D5B] border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            >
                              {p.name}
                              <button
                                type="button"
                                onClick={() => removeProduct(p.id || p.Product_Id!)}
                                className="hover:text-red-600 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selected Categories */}
                    {selectedCategories.length > 0 && (
                      <div>
                        <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                          <Tag className="h-3.5 w-3.5 text-purple-500" />
                          Selected Categories ({selectedCategories.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCategories.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800"
                            >
                              {c}
                              <button
                                type="button"
                                onClick={() => removeCategory(c)}
                                className="hover:text-red-600 cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedProducts.length === 0 && selectedCategories.length === 0 && selectedStores.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">
                        Applies to all products across all stores
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Total Usage Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(e.target.value)}
                      placeholder="Leave empty for unlimited"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Maximum times this offer can be redeemed overall
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Usage Limit Per Customer
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={perUserLimit}
                      onChange={(e) => setPerUserLimit(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campaign Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B]"
                  >
                    <option value="Active">Active</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Expired">Expired</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Dialog Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Cancel
              </button>

              {activeStep < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-5 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#2A7D5B] hover:bg-[#23674b] text-white px-6 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Updating...' : 'Update Offer'}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Selection Dialog Modal */}
      <ProductSelectionDialog
        open={openProductSelector}
        onClose={() => setOpenProductSelector(false)}
        selectedProducts={selectedProducts}
        selectedCategories={selectedCategories}
        selectedStores={selectedStores}
        onSave={(prods, cats, stores) => {
          setSelectedProducts(prods);
          setSelectedCategories(cats);
          setSelectedStores(stores);
        }}
      />
    </>
  );
}
