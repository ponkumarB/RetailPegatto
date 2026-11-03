'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CreditCard,
  X,
  TrendingUp,
  TrendingDown,
  Gift,
  Sliders,
  Wallet,
  RotateCcw,
  Users,
  Cake,
  Megaphone,
  FileText,
  Save,
  ChevronDown,
  Search,
  Check,
  Receipt,
  ShoppingCart,
  Sparkles,
  Edit3,
  ListFilter
} from 'lucide-react';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';
import { getAvailableOrderReferences, OrderReferenceOption } from '@/utils/orderReferences';
import { toast } from 'sonner';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedWalletId?: string;
}

export function NewTransactionModal({
  isOpen,
  onClose,
  preselectedWalletId
}: NewTransactionModalProps) {
  const { wallets, processLoyaltyTransaction } = useLoyaltyStore();

  const [selectedWalletId, setSelectedWalletId] = useState<string>(preselectedWalletId || '');
  const [transactionType, setTransactionType] = useState<'CREDIT' | 'DEBIT' | 'BONUS' | 'ADJUSTMENT'>('CREDIT');
  const [pointsAmount, setPointsAmount] = useState<string>('');
  const [referenceType, setReferenceType] = useState<string>('PURCHASE');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Dropdown UI states
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [walletSearchText, setWalletSearchText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const walletDropdownRef = useRef<HTMLDivElement>(null);

  // Order Reference UI states
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const [orderSearchText, setOrderSearchText] = useState('');
  const [isManualReference, setIsManualReference] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderReferenceOption | null>(null);
  const orderDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preselectedWalletId) {
      setSelectedWalletId(preselectedWalletId);
    }
  }, [preselectedWalletId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        walletDropdownRef.current &&
        !walletDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWalletDropdownOpen(false);
      }
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleReset();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const selectedWallet = wallets.find(
    (w) => w.id === selectedWalletId || w.walletCode === selectedWalletId
  );

  const availableOrders = useMemo(() => {
    if (!isOpen) return [];
    return getAvailableOrderReferences(selectedWallet?.customerName, selectedWallet?.customerPhone);
  }, [isOpen, selectedWallet?.customerName, selectedWallet?.customerPhone]);

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

  const filteredWallets = wallets.filter((w) => {
    const query = walletSearchText.toLowerCase();
    return (
      w.customerName.toLowerCase().includes(query) ||
      (w.walletCode && w.walletCode.toLowerCase().includes(query)) ||
      (w.customerId && w.customerId.toLowerCase().includes(query)) ||
      w.customerPhone.includes(query)
    );
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedWallet) {
      newErrors.wallet = 'Please select a wallet';
    }
    const pointsNum = parseFloat(pointsAmount);
    if (!pointsAmount || isNaN(pointsNum) || pointsNum <= 0) {
      newErrors.points = 'Points must be greater than 0';
    } else if (transactionType === 'DEBIT' && selectedWallet && pointsNum > selectedWallet.currentBalance) {
      newErrors.points = `Cannot redeem more than available points (${selectedWallet.currentBalance.toLocaleString()})`;
    }
    if (!referenceNumber.trim()) {
      newErrors.referenceNumber = 'Reference number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!selectedWallet) return;

    const pointsNum = parseFloat(pointsAmount);

    processLoyaltyTransaction({
      walletId: selectedWallet.id,
      type: transactionType,
      points: pointsNum,
      referenceType,
      referenceNumber: referenceNumber.trim(),
      remarks: remarks.trim()
    });

    toast.success('Transaction processed successfully');
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedWalletId('');
    setTransactionType('CREDIT');
    setPointsAmount('');
    setReferenceType('PURCHASE');
    setReferenceNumber('');
    setRemarks('');
    setErrors({});
    setIsWalletDropdownOpen(false);
    setWalletSearchText('');
    setIsOrderDropdownOpen(false);
    setOrderSearchText('');
    setIsManualReference(false);
    setSelectedOrder(null);
  };

  const isFormValid =
    !!selectedWallet &&
    parseFloat(pointsAmount) > 0 &&
    (transactionType !== 'DEBIT' || (selectedWallet && parseFloat(pointsAmount) <= selectedWallet.currentBalance)) &&
    referenceNumber.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleReset();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#2A7D5B] dark:text-emerald-400">
              <CreditCard className="w-5 h-5 text-[#2A7D5B]" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              New Transaction
            </h2>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleReset();
              onClose();
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleProcess} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Select Wallet */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Wallet <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={walletDropdownRef}>
              <button
                type="button"
                onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                className={`w-full h-10 px-3 flex items-center justify-between gap-2 rounded-lg border text-xs text-left bg-white dark:bg-slate-800 transition-all ${
                  errors.wallet
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#2A7D5B]/30'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Wallet className="w-4 h-4 text-slate-400 shrink-0" />
                  {selectedWallet ? (
                    <span className="font-medium text-slate-900 dark:text-white truncate">
                      {selectedWallet.walletCode || selectedWallet.id} - {selectedWallet.customerName}{' '}
                      <span className="text-emerald-600 font-semibold">
                        ({selectedWallet.currentBalance.toLocaleString()} pts)
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Search wallet by ID or customer name</span>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* Wallet Dropdown Menu */}
              {isWalletDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden animate-in fade-in-50">
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Type to filter wallets..."
                        value={walletSearchText}
                        onChange={(e) => setWalletSearchText(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-[#2A7D5B]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto p-1 divide-y divide-slate-50 dark:divide-slate-800/60">
                    {filteredWallets.length === 0 ? (
                      <div className="p-3 text-xs text-center text-slate-400">
                        No matching wallets found
                      </div>
                    ) : (
                      filteredWallets.map((w) => {
                        const isSelected = selectedWallet?.id === w.id;
                        return (
                          <div
                            key={w.id}
                            onClick={() => {
                              setSelectedWalletId(w.id);
                              setErrors((prev) => ({ ...prev, wallet: '' }));
                              setIsWalletDropdownOpen(false);
                            }}
                            className={`p-2.5 rounded-md cursor-pointer text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors ${
                              isSelected
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                                : ''
                            }`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Wallet className="w-3.5 h-3.5 text-[#2A7D5B]" />
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {w.walletCode || w.id}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  {w.currentBalance.toLocaleString()} pts
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 ml-5.5">
                                Customer: {w.customerName} ({w.customerPhone})
                              </span>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#2A7D5B]" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.wallet && (
              <p className="mt-1 text-[11px] text-red-500">{errors.wallet}</p>
            )}
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                {transactionType === 'CREDIT' ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : transactionType === 'DEBIT' ? (
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                ) : transactionType === 'BONUS' ? (
                  <Gift className="w-4 h-4 text-amber-500" />
                ) : (
                  <Sliders className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
                className="w-full h-10 pl-9 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30 appearance-none cursor-pointer"
              >
                <option value="CREDIT">Add Points</option>
                <option value="DEBIT">Redeem Points</option>
                <option value="BONUS">Bonus Points</option>
                <option value="ADJUSTMENT">Adjust Points</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Points Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Points Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={pointsAmount}
              onChange={(e) => {
                setPointsAmount(e.target.value);
                setErrors((prev) => ({ ...prev, points: '' }));
              }}
              placeholder="Enter points amount"
              className={`w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none ${
                errors.points
                  ? 'border-red-500 ring-1 ring-red-500'
                  : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#2A7D5B]/30'
              }`}
            />
            {selectedWallet && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Available points: {selectedWallet.currentBalance.toLocaleString()}
              </p>
            )}
            {errors.points && (
              <p className="mt-1 text-[11px] text-red-500">{errors.points}</p>
            )}
          </div>

          {/* Reference Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reference Type
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <CreditCard className="w-4 h-4 text-slate-400" />
              </div>
              <select
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value)}
                className="w-full h-10 pl-9 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30 appearance-none cursor-pointer"
              >
                <option value="PURCHASE">Purchase</option>
                <option value="RETURN">Return</option>
                <option value="REFERRAL">Referral</option>
                <option value="BIRTHDAY">Birthday</option>
                <option value="CAMPAIGN">Campaign</option>
                <option value="MANUAL">Manual</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Reference Number (Choosable Order / Custom) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reference / Order Number <span className="text-red-500">*</span>
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
                  className={`w-full min-h-[40px] px-3 py-2 text-xs bg-white dark:bg-slate-800 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                    errors.referenceNumber
                      ? 'border-red-500 ring-1 ring-red-500'
                      : isOrderDropdownOpen
                      ? 'border-[#2A7D5B] ring-2 ring-[#2A7D5B]/20'
                      : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
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
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
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
                        {selectedOrder?.customerName && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                            ({selectedOrder.customerName})
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
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
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
                            selectedWallet?.customerName &&
                            ord.customerName?.toLowerCase().includes(selectedWallet.customerName.toLowerCase());

                          return (
                            <div
                              key={ord.id}
                              onClick={() => {
                                setReferenceNumber(ord.orderNumber);
                                setSelectedOrder(ord);
                                setReferenceType('PURCHASE');
                                setErrors((prev) => ({ ...prev, referenceNumber: '' }));
                                setIsOrderDropdownOpen(false);

                                if (!pointsAmount && ord.amount) {
                                  const suggestedPts = Math.max(10, Math.round(ord.amount * 0.05));
                                  setPointsAmount(String(suggestedPts));
                                  setErrors((prev) => ({ ...prev, points: '' }));
                                }
                              }}
                              className={`p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-emerald-50/70 dark:bg-emerald-950/40' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2 mb-0.5">
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
                  placeholder="Enter reference number (e.g., ORDER-001)"
                  className={`w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none ${
                    errors.referenceNumber
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#2A7D5B]/30'
                  }`}
                />
              </div>
            )}
            {errors.referenceNumber && (
              <p className="mt-1 text-[11px] text-red-500">{errors.referenceNumber}</p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks (optional)"
              className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30 resize-none"
            />
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <button
            type="button"
            onClick={handleProcess}
            disabled={!isFormValid}
            className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-xs font-semibold transition-all ${
              isFormValid
                ? 'bg-[#2A7D5B] hover:bg-[#23674b] text-white shadow-sm cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-800 dark:text-slate-600 dark:border-slate-700 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Process Transaction
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleReset();
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
