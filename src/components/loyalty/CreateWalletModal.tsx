'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, ChevronDown, User, Phone, Mail, Hash } from 'lucide-react';
import { toast } from 'sonner';

import { LoyaltyWallet } from '@/store/useLoyaltyStore';
import { fetchAccountFullList } from '@/service/api/Company/api';

export interface CustomerOption {
  id: string | number;
  numericId?: number;
  name: string;
  leadName?: string;
  accountId: string;
  customerId: string;
  phone: string;
  email: string;
  suggestedWalletCode?: string;
  suggestedPoints?: number;
}

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: LoyaltyWallet | null;
  onSubmit: (data: {
    customerId: string;
    customerRawId?: number;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    walletCode: string;
    initialPoints: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
  }) => void;
}

const DEFAULT_CUSTOMER_ACCOUNTS: CustomerOption[] = [
  {
    id: 1,
    numericId: 1,
    name: 'AR INFO PARK',
    leadName: 'AR INFO PARK',
    accountId: 'ACC000000001',
    customerId: 'ACC000000001',
    phone: '+91 98765 43210',
    email: 'info@arinfopark.com',
    suggestedWalletCode: 'WAL-ARINF-001',
    suggestedPoints: 100
  },
  {
    id: 2,
    numericId: 2,
    name: 'Teena Sharma',
    leadName: 'Teena Sharma',
    accountId: 'ACC000000002',
    customerId: 'ACC000000002',
    phone: '+91 98765 43211',
    email: 'teena@example.com',
    suggestedWalletCode: 'WAL-TEENA-002',
    suggestedPoints: 150
  },
  {
    id: 3,
    numericId: 3,
    name: 'Rajesh Kumar',
    leadName: 'Rajesh Kumar',
    accountId: 'ACC000000003',
    customerId: 'ACC000000003',
    phone: '+91 98765 43212',
    email: 'rajesh@example.com',
    suggestedWalletCode: 'WAL-RAJES-003',
    suggestedPoints: 200
  },
  {
    id: 4,
    numericId: 4,
    name: 'Priya Patel',
    leadName: 'Priya Patel',
    accountId: 'ACC000000004',
    customerId: 'ACC000000004',
    phone: '+91 98765 43213',
    email: 'priya@example.com',
    suggestedWalletCode: 'WAL-PRIYA-004',
    suggestedPoints: 250
  }
];

export function CreateWalletModal({ isOpen, onClose, wallet, onSubmit }: CreateWalletModalProps) {
  const isEdit = !!wallet;

  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>(DEFAULT_CUSTOMER_ACCOUNTS);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<CustomerOption | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [walletCode, setWalletCode] = useState('');
  const [initialPoints, setInitialPoints] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED'>('ACTIVE');

  // Error and touch states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch registered CRM accounts to enrich the dropdown
  useEffect(() => {
    let isMounted = true;
    fetchAccountFullList()
      .then((res: any) => {
        if (!isMounted) return;
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          const apiCustomers: CustomerOption[] = list.map((acc: any, idx: number) => {
            // Dropdown display: Lead Name as requested
            const leadName = String(
              acc.Lead_Name ||
              acc.Contact_Name ||
              acc.LeadName ||
              acc.ContactName ||
              acc.Organization_Name ||
              acc.Company_Name ||
              `Account ${acc.Account_Id || acc.id}`
            ).trim();

            const rawId = typeof acc.id === 'number'
              ? acc.id
              : (parseInt(String(acc.id || '').replace(/\D/g, ''), 10) || (idx + 1));

            // Selected Account ID for display and reference
            const accountId = String(
              acc.Account_Id ||
              acc.accountId ||
              `ACC${String(rawId).padStart(9, '0')}`
            ).trim();

            const cleanPrefix = leadName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || 'WAL';
            const wCode = `WAL-${cleanPrefix}-${String(rawId).padStart(3, '0')}`;

            return {
              id: acc.id || rawId,
              numericId: rawId,
              name: leadName,
              leadName,
              accountId,
              customerId: accountId,
              phone: acc.Phone_Number || acc.Phone || acc.Mobile || '',
              email: acc.Mail || acc.Email || '',
              suggestedWalletCode: wCode,
              suggestedPoints: 100
            };
          });

          // Deduplicate by accountId
          const seen = new Set<string>();
          const uniqueCustomers: CustomerOption[] = [];
          apiCustomers.forEach((c) => {
            const key = String(c.accountId || c.id);
            if (!seen.has(key)) {
              seen.add(key);
              uniqueCustomers.push(c);
            }
          });

          setCustomerOptions(uniqueCustomers);
        }
      })
      .catch((err: any) => {
        if (err?.status === 504 || err?.isTimeout) {
          console.warn('Accounts API timed out (using default customer accounts):', err?.message || err);
        } else {
          console.error('Error fetching account list for loyalty wallet:', err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize form when opening modal
  useEffect(() => {
    if (wallet) {
      const cName = wallet.customerName || '';
      setSelectedCustomerName(cName);
      setCustomerId(wallet.customerId || '');
      setWalletCode(wallet.walletCode || '');
      setInitialPoints(String(wallet.availablePoints ?? wallet.currentBalance ?? 0));
      setStatus(wallet.status || 'ACTIVE');

      const found = customerOptions.find(
        (c) =>
          (wallet.customerId && c.customerId.toLowerCase() === wallet.customerId.toLowerCase()) ||
          (cName && c.name.toLowerCase() === cName.toLowerCase())
      );
      if (found) {
        setSelectedCustomerObj(found);
      } else {
        setSelectedCustomerObj({
          id: wallet.id || '1',
          name: cName,
          accountId: wallet.customerId || 'ACC000000001',
          customerId: wallet.customerId || 'ACC000000001',
          phone: wallet.customerPhone || '',
          email: wallet.customerEmail || ''
        });
      }

      setErrors({});
      setTouched({});
    } else {
      setSelectedCustomerName('');
      setSelectedCustomerObj(null);
      setCustomerId('');
      setWalletCode('');
      setInitialPoints('');
      setStatus('ACTIVE');
      setErrors({});
      setTouched({});
    }
  }, [wallet, isOpen, customerOptions]);

  if (!isOpen) return null;

  // Handle Customer Selection -> Auto-populate all fields
  const handleCustomerSelect = (selectedVal: string) => {
    const customer = customerOptions.find(
      (c) => c.customerId === selectedVal || c.accountId === selectedVal || c.name === selectedVal || String(c.id) === selectedVal
    );

    if (customer) {
      setSelectedCustomerObj(customer);
      setSelectedCustomerName(customer.name); // Lead name
      setCustomerId(customer.customerId);     // Selected Account ID
      setWalletCode(customer.suggestedWalletCode || `WAL-${customer.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-001`);
      setInitialPoints(String(customer.suggestedPoints || 100));
      setStatus('ACTIVE');

      // Clear any previous errors
      setErrors({});
      setTouched({
        customerName: true,
        walletCode: true,
        initialPoints: true
      });
    } else {
      setSelectedCustomerObj(null);
      setSelectedCustomerName('');
      setCustomerId('');
      setWalletCode('');
      setInitialPoints('');
    }
  };

  const validateCustomerName = (val: string) => {
    if (!val || !val.trim()) return 'Please select a customer name';
    return '';
  };

  const validateWalletCode = (val: string) => {
    if (!val || !val.trim()) return 'Wallet code is required';
    if (val.trim().length < 3) return 'Wallet code must be at least 3 characters';
    if (val.trim().length > 50) return 'Wallet code cannot exceed 50 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(val.trim())) {
      return 'Wallet code can only contain letters, numbers, hyphens, and underscores';
    }
    return '';
  };

  const validateInitialPoints = (val: string) => {
    if (!val || val.trim() === '') return 'Initial points are required';
    const num = parseFloat(val);
    if (isNaN(num) || num < 1) return 'Initial points must be at least 1';
    if (num > 999999999) return 'Initial points cannot exceed 999,999,999';
    return '';
  };

  const handleBlur = (field: 'customerName' | 'walletCode' | 'initialPoints') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let err = '';
    if (field === 'customerName') err = validateCustomerName(selectedCustomerName);
    if (field === 'walletCode') err = validateWalletCode(walletCode);
    if (field === 'initialPoints') err = validateInitialPoints(initialPoints);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ customerName: true, walletCode: true, initialPoints: true });

    const cErr = validateCustomerName(selectedCustomerName);
    const wErr = validateWalletCode(walletCode);
    const pErr = validateInitialPoints(initialPoints);

    setErrors({ customerName: cErr, walletCode: wErr, initialPoints: pErr });

    if (cErr || wErr || pErr) {
      toast.error('Please complete the required fields');
      return;
    }

    const finalCustomerId = (customerId.trim() || selectedCustomerObj?.customerId || selectedCustomerObj?.accountId || '').trim();
    const rawId = selectedCustomerObj?.numericId ?? (
      parseInt(finalCustomerId.replace(/\D/g, ''), 10) || 1
    );

    onSubmit({
      customerId: finalCustomerId,
      customerRawId: rawId,
      customerName: selectedCustomerName.trim() || selectedCustomerObj?.name || finalCustomerId,
      customerPhone: selectedCustomerObj?.phone,
      customerEmail: selectedCustomerObj?.email,
      walletCode: walletCode.trim().toUpperCase(),
      initialPoints: parseFloat(initialPoints),
      status
    });

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setSelectedCustomerName('');
    setSelectedCustomerObj(null);
    setCustomerId('');
    setWalletCode('');
    setInitialPoints('');
    setStatus('ACTIVE');
    setErrors({});
    setTouched({});
  };

  const isFormValid =
    selectedCustomerName.trim().length > 0 &&
    walletCode.trim().length >= 3 &&
    parseFloat(initialPoints) >= 1 &&
    !errors.customerName &&
    !errors.walletCode &&
    !errors.initialPoints;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 tracking-tight">
            {isEdit ? 'Edit Wallet' : 'Create New Wallet'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors rounded p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Customer Name Dropdown */}
          <div>
            <label className="block text-gray-600 dark:text-slate-300 font-medium mb-1">
              Customer Name (Lead Name) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedCustomerObj?.customerId || customerId || ''}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                onBlur={() => handleBlur('customerName')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-800 appearance-none pr-8 cursor-pointer ${
                  touched.customerName && errors.customerName
                    ? 'border-rose-500'
                    : 'border-gray-300 dark:border-slate-700'
                }`}
              >
                <option value="">Select customer (Lead Name)...</option>
                {customerOptions.map((cust) => (
                  <option key={`${cust.id}-${cust.customerId}`} value={cust.customerId}>
                    {cust.name} {cust.customerId ? `(${cust.customerId})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            {touched.customerName && errors.customerName && (
              <p className="text-rose-500 text-xs mt-1">{errors.customerName}</p>
            )}

            {/* Auto-filled Customer Summary Pill */}
            {selectedCustomerObj && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-900 dark:text-emerald-300">
                <div className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-[#2A7D5B]" />
                  <span className="font-semibold">{customerId || selectedCustomerObj.customerId}</span>
                </div>
                {selectedCustomerObj.phone && (
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCustomerObj.phone}</span>
                  </div>
                )}
                {selectedCustomerObj.email && (
                  <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedCustomerObj.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Wallet Code */}
          <div>
            <label className="block text-gray-600 dark:text-slate-300 font-medium mb-1">
              Wallet Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={walletCode}
              onChange={(e) => {
                setWalletCode(e.target.value);
                if (errors.walletCode) setErrors((prev) => ({ ...prev, walletCode: '' }));
              }}
              onBlur={() => handleBlur('walletCode')}
              placeholder="Enter wallet code (e.g., WALLET001)"
              maxLength={50}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-gray-400 ${
                touched.walletCode && errors.walletCode
                  ? 'border-rose-500'
                  : 'border-gray-300 dark:border-slate-700'
              }`}
            />
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
              Use letters, numbers, hyphens, and underscores only
            </p>
            {touched.walletCode && errors.walletCode && (
              <p className="text-rose-500 text-xs mt-0.5">{errors.walletCode}</p>
            )}
          </div>

          {/* Initial Points */}
          <div>
            <label className="block text-gray-600 dark:text-slate-300 font-medium mb-1">
              Initial Points <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={initialPoints}
              onChange={(e) => {
                setInitialPoints(e.target.value);
                if (errors.initialPoints) setErrors((prev) => ({ ...prev, initialPoints: '' }));
              }}
              onBlur={() => handleBlur('initialPoints')}
              placeholder="Enter initial points (minimum 1)"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-gray-400 ${
                touched.initialPoints && errors.initialPoints
                  ? 'border-rose-500'
                  : 'border-gray-300 dark:border-slate-700'
              }`}
            />
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
              Points will be added to the wallet upon creation
            </p>
            {touched.initialPoints && errors.initialPoints && (
              <p className="text-rose-500 text-xs mt-0.5">{errors.initialPoints}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-gray-600 dark:text-slate-300 font-medium mb-1">
              Status <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] text-gray-800 dark:text-slate-100 bg-white dark:bg-slate-800 appearance-none pr-8 cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CLOSED">Closed</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
              {status === 'ACTIVE' && 'Wallet is active and can be used for transactions'}
              {status === 'INACTIVE' && 'Wallet is inactive and cannot process transactions'}
              {status === 'SUSPENDED' && 'Wallet is suspended due to unusual activity'}
              {status === 'CLOSED' && 'Wallet is permanently closed'}
            </p>
          </div>

          {/* Form Action Buttons matching exact screenshot */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={!isFormValid}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${
                isFormValid
                  ? 'bg-[#2A7D5B] hover:bg-[#23674b] text-white shadow-xs cursor-pointer'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 border border-gray-200 dark:border-slate-700 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" /> {isEdit ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
