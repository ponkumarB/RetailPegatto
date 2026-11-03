'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  CreditCard,
  Plus,
  Minus,
  Gift,
  SlidersHorizontal,
  AlertCircle,
  Search,
  ChevronDown,
  Check,
  Edit3,
  ListFilter
} from 'lucide-react';
import { LoyaltyWallet, useLoyaltyStore } from '@/store/useLoyaltyStore';
import { getAvailableOrderReferences, OrderReferenceOption } from '@/utils/orderReferences';
import { toast } from 'sonner';

interface ManagePointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: LoyaltyWallet | null;
}

export function ManagePointsModal({ isOpen, onClose, wallet }: ManagePointsModalProps) {
  const { processLoyaltyTransaction } = useLoyaltyStore();

  const [transactionType, setTransactionType] = useState<'CREDIT' | 'DEBIT' | 'BONUS' | 'ADJUSTMENT'>('CREDIT');
  const [referenceType, setReferenceType] = useState('PURCHASE');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [points, setPoints] = useState('');
  const [remarks, setRemarks] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Choosable Order Reference State
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const [orderSearchText, setOrderSearchText] = useState('');
  const [isManualReference, setIsManualReference] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderReferenceOption | null>(null);
  const orderDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        orderDropdownRef.current &&
        !orderDropdownRef.current.contains(event.target as Node)
      ) {
        setIsOrderDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableOrders = useMemo(() => {
    if (!isOpen || !wallet) return [];
    return getAvailableOrderReferences(wallet.customerName, wallet.customerPhone);
  }, [isOpen, wallet?.customerName, wallet?.customerPhone]);

  const filteredOrders = useMemo(() => {
    const query = orderSearchText.toLowerCase().trim();
    if (!query) return availableOrders;
    return availableOrders.filter((ord) =>
      ord.orderNumber.toLowerCase().includes(query) ||
      (ord.customerName && ord.customerName.toLowerCase().includes(query)) ||
      ord.type.toLowerCase().includes(query) ||
      (ord.status && ord.status.toLowerCase().includes(query))
    );
  }, [availableOrders, orderSearchText]);

  useEffect(() => {
    if (wallet) {
      setReferenceNumber('');
      setPoints('');
      setRemarks('');
      setErrors({});
      setTransactionType('CREDIT');
      setReferenceType('PURCHASE');
      setIsOrderDropdownOpen(false);
      setOrderSearchText('');
      setIsManualReference(false);
      setSelectedOrder(null);
    }
  }, [wallet, isOpen]);

  if (!isOpen || !wallet) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const ptsNum = parseFloat(points);
    if (!points || isNaN(ptsNum) || ptsNum <= 0) {
      newErrors.points = 'Points must be greater than 0';
    } else if (transactionType === 'DEBIT' && ptsNum > (wallet.availablePoints ?? wallet.currentBalance)) {
      newErrors.points = `Cannot redeem more than available balance (${wallet.availablePoints ?? wallet.currentBalance} pts)`;
    }

    if (!referenceNumber.trim()) {
      newErrors.referenceNumber = 'Reference number is required';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    processLoyaltyTransaction({
      walletId: wallet.id,
      type: transactionType,
      points: ptsNum,
      referenceType,
      referenceNumber: referenceNumber.trim(),
      remarks: remarks.trim() || `${transactionType} transaction`
    });

    toast.success(`Transaction of ${ptsNum} points processed for ${wallet.customerName}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Manage Points
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {wallet.walletId || wallet.walletCode} • {wallet.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Available Balance:</span>
          <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
            {(wallet.availablePoints ?? wallet.currentBalance).toLocaleString()} pts
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Transaction Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransactionType('CREDIT')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  transactionType === 'CREDIT'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Add Points
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('DEBIT')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  transactionType === 'DEBIT'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Redeem Points
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('BONUS')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  transactionType === 'BONUS'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Gift className="w-3.5 h-3.5" /> Bonus Points
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('ADJUSTMENT')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  transactionType === 'ADJUSTMENT'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Adjust Points
              </button>
            </div>
          </div>

          {/* Points input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Points Amount <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="e.g. 50"
              className={`w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all ${
                errors.points ? 'border-rose-400 ring-rose-300' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.points && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.points}
              </p>
            )}
          </div>

          {/* Reference Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reference Type
            </label>
            <select
              value={referenceType}
              onChange={(e) => setReferenceType(e.target.value)}
              className="w-full h-9 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="PURCHASE">Purchase</option>
              <option value="RETURN">Return</option>
              <option value="REFERRAL">Referral</option>
              <option value="BIRTHDAY">Birthday</option>
              <option value="CAMPAIGN">Campaign</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          {/* Reference Number (Choosable Order / Custom) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reference / Order Number <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsManualReference(!isManualReference);
                  setIsOrderDropdownOpen(false);
                }}
                className="text-[11px] font-medium text-[#2A7D5B] hover:text-[#23674b] dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                {isManualReference ? (
                  <>
                    <ListFilter className="w-3 h-3" />
                    Choose from Orders
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    Enter Manually
                  </>
                )}
              </button>
            </div>

            {!isManualReference ? (
              <div className="relative" ref={orderDropdownRef}>
                <div
                  onClick={() => setIsOrderDropdownOpen((prev) => !prev)}
                  className={`w-full min-h-[38px] px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    errors.referenceNumber
                      ? 'border-rose-400 ring-1 ring-rose-300'
                      : isOrderDropdownOpen
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap flex-1 mr-2 overflow-hidden">
                    {referenceNumber ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {referenceNumber}
                        </span>
                        {selectedOrder && (
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium ${
                              selectedOrder.type === 'POS Bill'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                : selectedOrder.type === 'Sales Order'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            }`}
                          >
                            {selectedOrder.type}
                          </span>
                        )}
                        {selectedOrder?.amount !== undefined && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            • ₹{selectedOrder.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        Select an order or invoice number...
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                      isOrderDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {isOrderDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search order #, customer..."
                          value={orderSearchText}
                          onChange={(e) => setOrderSearchText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredOrders.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-xs text-slate-400">No orders found</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualReference(true);
                              setIsOrderDropdownOpen(false);
                            }}
                            className="mt-2 text-[11px] text-[#2A7D5B] font-medium hover:underline cursor-pointer"
                          >
                            Type reference manually instead
                          </button>
                        </div>
                      ) : (
                        filteredOrders.map((ord) => {
                          const isSelected = referenceNumber === ord.orderNumber;
                          const isCustomerMatch =
                            wallet?.customerName &&
                            ord.customerName?.toLowerCase().includes(wallet.customerName.toLowerCase());

                          return (
                            <div
                              key={ord.id}
                              onClick={() => {
                                setReferenceNumber(ord.orderNumber);
                                setSelectedOrder(ord);
                                setReferenceType('PURCHASE');
                                setErrors((prev) => ({ ...prev, referenceNumber: '' }));
                                setIsOrderDropdownOpen(false);

                                if (!points && ord.amount) {
                                  const suggestedPts = Math.max(10, Math.round(ord.amount * 0.05));
                                  setPoints(String(suggestedPts));
                                  setErrors((prev) => ({ ...prev, points: '' }));
                                }
                              }}
                              className={`p-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-emerald-50/70 dark:bg-emerald-950/40' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                    {ord.orderNumber}
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium ${
                                      ord.type === 'POS Bill'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                        : ord.type === 'Sales Order'
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                                    }`}
                                  >
                                    {ord.type}
                                  </span>
                                  {isCustomerMatch && (
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                      Customer Match
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  {ord.customerName && <span>{ord.customerName}</span>}
                                  {ord.amount !== undefined && (
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      ₹{ord.amount.toLocaleString()}
                                    </span>
                                  )}
                                  {ord.date && <span>• {ord.date}</span>}
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#2A7D5B] shrink-0" />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualReference(true);
                          setIsOrderDropdownOpen(false);
                        }}
                        className="text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-[#2A7D5B] flex items-center justify-center gap-1 mx-auto cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        Type custom reference manually
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => {
                    setReferenceNumber(e.target.value);
                    setSelectedOrder(null);
                    setErrors((prev) => ({ ...prev, referenceNumber: '' }));
                  }}
                  placeholder="e.g. INV-1002"
                  className={`w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                    errors.referenceNumber ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
            )}
            {errors.referenceNumber && (
              <p className="text-[11px] text-rose-500 mt-0.5">{errors.referenceNumber}</p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Counter discount redemption"
              className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-9 rounded-xl bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Submit Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
