'use client';

import React, { useState, useMemo } from 'react';
import { useLoyaltyStore, LoyaltyWallet } from '@/store/useLoyaltyStore';
import {
  Wallet,
  Star,
  Clock,
  TrendingUp,
  Search,
  Plus,
  User,
  Eye,
  Pencil,
  SquarePen,
  Trash2,
  Filter,
  CheckCircle2,
  Calendar,
  GripVertical,
  ArrowUpDown,
  Settings,
  MoreHorizontal,
  RefreshCw,
  FileText,
  CheckSquare,
  Mail,
  PhoneCall,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateWalletModal } from '@/components/loyalty/CreateWalletModal';
import { ManagePointsModal } from '@/components/loyalty/ManagePointsModal';
import { WalletDetailsModal } from '@/components/loyalty/WalletDetailsModal';
import { DeleteWalletModal } from '@/components/loyalty/DeleteWalletModal';
import { toast } from 'sonner';

export default function LoyaltyWalletPage() {
  const { wallets, createWallet, updateWallet, deleteWallet, loadWallets, isLoading } = useLoyaltyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCustomer, setFilterCustomer] = useState('ALL');
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRING'>('ALL');

  React.useEffect(() => {
    loadWallets({ search: searchTerm, status: filterStatus });
  }, [loadWallets, searchTerm, filterStatus]);

  // Selection & Sorting states matching CRM Leads table style
  const [selectedWalletIds, setSelectedWalletIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('walletId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<LoyaltyWallet | null>(null);
  const [walletToManagePoints, setWalletToManagePoints] = useState<LoyaltyWallet | null>(null);
  const [walletToView, setWalletToView] = useState<LoyaltyWallet | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<LoyaltyWallet | null>(null);

  // Customer options list from existing wallets
  const customerOptions = useMemo(() => {
    const map = new Map<string, string>();
    wallets.forEach((w) => {
      if (w.customerName) {
        map.set(w.customerName, w.customerName);
      }
    });
    return Array.from(map.values());
  }, [wallets]);

  // Tab & Filter logic
  const filteredWallets = useMemo(() => {
    return wallets.filter((w) => {
      // 1. Tab filter
      if (selectedTab === 'ACTIVE' && w.status !== 'ACTIVE') return false;
      if (selectedTab === 'SUSPENDED' && w.status !== 'SUSPENDED') return false;
      if (selectedTab === 'EXPIRING') {
        if (!w.nextExpiryDate) return false;
        const expiryDate = new Date(w.nextExpiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        if (expiryDate > thirtyDaysFromNow) return false;
      }

      // 2. Status dropdown filter
      if (filterStatus !== 'ALL' && w.status !== filterStatus) return false;

      // 3. Customer dropdown filter
      if (filterCustomer !== 'ALL' && w.customerName !== filterCustomer) return false;

      // 4. Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesWalletId = (w.walletId || '').toLowerCase().includes(q);
        const matchesWalletCode = (w.walletCode || '').toLowerCase().includes(q);
        const matchesCustomer = (w.customerName || '').toLowerCase().includes(q);
        const matchesPhone = (w.customerPhone || '').includes(q);
        const matchesEmail = (w.customerEmail || '').toLowerCase().includes(q);
        if (!matchesWalletId && !matchesWalletCode && !matchesCustomer && !matchesPhone && !matchesEmail) {
          return false;
        }
      }

      return true;
    });
  }, [wallets, selectedTab, filterStatus, filterCustomer, searchTerm]);

  // Sorted Wallets matching column sort
  const sortedWallets = useMemo(() => {
    if (!sortField) return filteredWallets;
    return [...filteredWallets].sort((a: any, b: any) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredWallets, sortField, sortOrder]);

  // Dynamic Statistics
  const stats = useMemo(() => {
    const totalWallets = wallets.length;
    const activeWallets = wallets.filter((w) => w.status === 'ACTIVE').length;
    const totalPoints = wallets.reduce((sum, w) => sum + (w.totalPoints ?? w.currentBalance ?? 0), 0);
    const pendingPoints = wallets.reduce((sum, w) => sum + (w.pendingPoints ?? 0), 0);
    const activeRate = totalWallets > 0 ? ((activeWallets / totalWallets) * 100).toFixed(1) : '100.0';

    return {
      totalWallets,
      activeWallets,
      totalPoints,
      pendingPoints,
      activeRate
    };
  }, [wallets]);

  // Modal Handlers
  const handleOpenCreate = () => {
    setWalletToEdit(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (wallet: LoyaltyWallet) => {
    setWalletToEdit(wallet);
    setIsCreateOpen(true);
  };

  const handleSaveWallet = (data: {
    customerId: string;
    customerRawId?: number;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    walletCode: string;
    initialPoints: number;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CLOSED';
  }) => {
    if (walletToEdit) {
      updateWallet(walletToEdit.id, {
        customerId: data.customerId,
        customerRawId: data.customerRawId,
        customerName: data.customerName || walletToEdit.customerName,
        customerPhone: data.customerPhone || walletToEdit.customerPhone,
        customerEmail: data.customerEmail || walletToEdit.customerEmail,
        walletCode: data.walletCode,
        status: data.status,
        availablePoints: data.initialPoints,
        currentBalance: data.initialPoints,
        totalPoints: data.initialPoints + (walletToEdit.redeemedPoints || 0)
      });
      toast.success('Wallet updated successfully');
    } else {
      createWallet(data);
      toast.success(`Wallet ${data.walletCode} created successfully`);
    }
    setIsCreateOpen(false);
    setWalletToEdit(null);
  };

  const handleConfirmDelete = () => {
    if (walletToDelete) {
      deleteWallet(walletToDelete.id);
      toast.success(`Wallet ${walletToDelete.walletId || walletToDelete.walletCode} deleted successfully`);
      setWalletToDelete(null);
    }
  };

  // Color helper for customer initial avatar
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-purple-500',
      'bg-indigo-500',
      'bg-violet-500',
      'bg-blue-500',
      'bg-emerald-500',
      'bg-teal-500'
    ];
    const code = (name || 'C').charCodeAt(0) || 0;
    return colors[code % colors.length];
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 lg:p-6 pb-20 select-none">
      <div className="max-w-[1400px] w-full mx-auto space-y-4">
        {/* Header Section */}
        <div className="mb-1">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Loyalty Wallet Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer loyalty points, track balances, and monitor wallet activities
          </p>
        </div>

        {/* 4 Statistics Cards matching screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Wallets */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-[#2A7D5B]/50 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Total Wallets
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#2A7D5B] dark:text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalWallets}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Active: {stats.activeWallets}
            </div>
          </div>

          {/* Card 2: Total Points */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-[#2A7D5B]/50 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Total Points
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.totalPoints.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Across {stats.totalWallets} wallet(s)
            </div>
          </div>

          {/* Card 3: Pending Points */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-[#2A7D5B]/50 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pending Points
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.pendingPoints.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Awaiting confirmation
            </div>
          </div>

          {/* Card 4: Active Rate */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-[#2A7D5B]/50 transition-all">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Active Rate
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#2A7D5B] dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.activeRate}%
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Wallet activation rate
            </div>
          </div>
        </div>

        {/* Search and Filter Section matching screenshot */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            {/* Search input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Wallet ID or Customer Name..."
                className="w-full pl-9 pr-3 h-9 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:ring-1 focus:ring-[#2A7D5B]"
              />
            </div>

            {/* Filter by Status */}
            <div className="w-full sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:ring-1 focus:ring-[#2A7D5B] text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="ALL">Filter by Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            {/* Filter by Customer */}
            <div className="relative w-full sm:w-56">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="w-full h-9 pl-8 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:ring-1 focus:ring-[#2A7D5B] text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value="ALL">Filter by Customer</option>
                {customerOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* + Create Wallet Button */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-lg bg-[#2A7D5B] hover:bg-[#23674b] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Create Wallet
          </button>
        </div>

        {/* Tabs and Table Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
          {/* Tabs Section */}
          <div className="flex items-center gap-6 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedTab('ALL')}
              className={`py-3 transition-colors border-b-2 cursor-pointer ${
                selectedTab === 'ALL'
                  ? 'border-[#2A7D5B] text-[#2A7D5B] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Wallets
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('ACTIVE')}
              className={`py-3 transition-colors border-b-2 cursor-pointer ${
                selectedTab === 'ACTIVE'
                  ? 'border-[#2A7D5B] text-[#2A7D5B] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('SUSPENDED')}
              className={`py-3 transition-colors border-b-2 cursor-pointer ${
                selectedTab === 'SUSPENDED'
                  ? 'border-[#2A7D5B] text-[#2A7D5B] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Suspended
            </button>
            <button
              type="button"
              onClick={() => setSelectedTab('EXPIRING')}
              className={`py-3 transition-colors border-b-2 cursor-pointer ${
                selectedTab === 'EXPIRING'
                  ? 'border-[#2A7D5B] text-[#2A7D5B] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Expiring Soon
            </button>
          </div>

          {/* CRM Leads Table Header Style */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr className="border-0">
                  {/* Selection Checkbox Header */}
                  <th className="w-10 p-0 sticky left-0 z-30 bg-slate-50/80 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-center">
                    <div className="flex items-center justify-center w-10 h-10">
                      <Checkbox
                        checked={sortedWallets.length > 0 && selectedWalletIds.length === sortedWallets.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedWalletIds(sortedWallets.map((w) => w.id));
                          } else {
                            setSelectedWalletIds([]);
                          }
                        }}
                        className="border-slate-300 dark:border-slate-700 data-checked:bg-blue-600 data-checked:border-blue-600 data-checked:text-white"
                      />
                    </div>
                  </th>

                  {/* WALLET ID */}
                  <th
                    onClick={() => handleSort('walletId')}
                    className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>WALLET ID</span>
                      <ArrowUpDown
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          sortField === 'walletId' ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </th>

                  {/* CUSTOMER */}
                  <th
                    onClick={() => handleSort('customerName')}
                    className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>CUSTOMER</span>
                      <ArrowUpDown
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          sortField === 'customerName' ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </th>

                  {/* TOTAL POINTS */}
                  <th
                    onClick={() => handleSort('totalPoints')}
                    className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>TOTAL POINTS</span>
                      <ArrowUpDown
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          sortField === 'totalPoints' ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </th>

                  {/* AVAILABLE */}
                  <th
                    onClick={() => handleSort('availablePoints')}
                    className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>AVAILABLE</span>
                      <ArrowUpDown
                        className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                          sortField === 'availablePoints' ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </th>

                  {/* REDEEMED */}
                  <th
                    onClick={() => handleSort('redeemedPoints')}
                    className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>REDEEMED</span>
                    </div>
                  </th>

                  {/* PENDING */}
                  <th
                    onClick={() => handleSort('pendingPoints')}
                    className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap cursor-pointer hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>PENDING</span>
                    </div>
                  </th>

                  {/* STATUS */}
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>STATUS</span>
                    </div>
                  </th>

                  {/* NEXT EXPIRY */}
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>NEXT EXPIRY</span>
                    </div>
                  </th>

                  {/* ACTION */}
                  <th className="px-4 py-3 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center w-16">
                    <div className="flex items-center justify-center">
                      <Settings className="h-4 w-4 text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {sortedWallets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                      No loyalty wallets found matching the selected criteria.
                    </td>
                  </tr>
                ) : (
                  sortedWallets.map((wallet) => (
                    <tr
                      key={wallet.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors border-b border-slate-100 dark:border-slate-800/60"
                    >
                      {/* Checkbox Column */}
                      <td className="w-10 p-0 border-r border-slate-100 dark:border-slate-800/60 text-center">
                        <div className="flex items-center justify-center w-10">
                          <Checkbox
                            checked={selectedWalletIds.includes(wallet.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedWalletIds((prev) => [...prev, wallet.id]);
                              } else {
                                setSelectedWalletIds((prev) =>
                                  prev.filter((id) => id !== wallet.id)
                                );
                              }
                            }}
                            className="border-slate-300 dark:border-slate-700 data-checked:bg-blue-600 data-checked:border-blue-600 data-checked:text-white"
                          />
                        </div>
                      </td>

                      {/* Wallet ID & Code */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-[13px] text-slate-900 dark:text-white leading-tight">
                          {wallet.walletId || wallet.walletCode}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal uppercase mt-0.5">
                          {wallet.walletCode || 'WALLET001'}
                        </div>
                      </td>

                      {/* Customer Avatar & Name */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${getAvatarBg(wallet.customerName)}`}
                          >
                            {wallet.customerName?.[0] || 'C'}
                          </div>
                          {wallet.customerName && (
                            <div>
                              <div className="font-semibold text-[13px] text-slate-800 dark:text-slate-200">
                                {wallet.customerName}
                              </div>
                              {wallet.customerEmail && (
                                <div className="text-[11px] text-slate-400">
                                  {wallet.customerEmail}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Total Points */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-[13px] text-slate-900 dark:text-white">
                        {(wallet.totalPoints ?? wallet.currentBalance ?? 0).toLocaleString()}
                      </td>

                      {/* Available Points */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-[13px] text-[#10B981] dark:text-emerald-400">
                        {(wallet.availablePoints ?? wallet.currentBalance ?? 0).toLocaleString()}
                      </td>

                      {/* Redeemed Points */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-[13px] text-[#EF4444] dark:text-rose-400">
                        {(wallet.redeemedPoints ?? wallet.lifetimeRedeemed ?? 0).toLocaleString()}
                      </td>

                      {/* Pending Points */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-medium text-[13px] text-[#F59E0B] dark:text-amber-400">
                        {(wallet.pendingPoints ?? 0).toLocaleString()}
                      </td>

                      {/* Status Chip */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                            wallet.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : wallet.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          }`}
                        >
                          {wallet.status || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Next Expiry */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                        {wallet.nextExpiryDate ? wallet.nextExpiryDate : '-'}
                      </td>

                      {/* Actions Column matching the Action header */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Wallet Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                              WALLET ACTIONS
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => setWalletToView(wallet)}
                            >
                              <Eye className="h-4 w-4 text-slate-500" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => handleOpenEdit(wallet)}
                            >
                              <SquarePen className="h-4 w-4 text-slate-500" /> Edit Wallet
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600"
                              onClick={() => setWalletToManagePoints(wallet)}
                            >
                              <Plus className="h-4 w-4 text-emerald-600" /> Add Points
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                              onClick={() => setWalletToDelete(wallet)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Delete Wallet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* 1. Create/Edit Wallet Modal */}
      <CreateWalletModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setWalletToEdit(null);
        }}
        wallet={walletToEdit}
        onSubmit={handleSaveWallet}
      />

      {/* 2. Manage Points Modal */}
      <ManagePointsModal
        isOpen={!!walletToManagePoints}
        onClose={() => setWalletToManagePoints(null)}
        wallet={walletToManagePoints}
      />

      {/* 3. Wallet Details Modal */}
      <WalletDetailsModal
        isOpen={!!walletToView}
        onClose={() => setWalletToView(null)}
        wallet={walletToView}
      />

      {/* 4. Delete Confirmation Modal */}
      <DeleteWalletModal
        isOpen={!!walletToDelete}
        onClose={() => setWalletToDelete(null)}
        onConfirm={handleConfirmDelete}
        wallet={walletToDelete}
      />
    </div>
  );
}
