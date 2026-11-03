'use client';

import React, { useState, useMemo } from 'react';
import { useLoyaltyStore, LoyaltyTransaction } from '@/store/useLoyaltyStore';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  XCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  HelpCircle,
  Coins,
  Wallet,
  GripVertical,
  ArrowUpDown,
  Settings,
  MoreHorizontal,
  RotateCcw,
  CheckSquare,
  Mail,
  PhoneCall,
  SquarePen,
} from 'lucide-react';
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
import { NewTransactionModal } from '@/components/loyalty/NewTransactionModal';
import { TransactionDetailsModal } from '@/components/loyalty/TransactionDetailsModal';
import { ReverseTransactionModal } from '@/components/loyalty/ReverseTransactionModal';
import { toast } from 'sonner';

export default function LoyaltyTransactionsPage() {
  const { transactions, wallets, loadTransactions, isLoading } = useLoyaltyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    loadTransactions({ search: searchTerm, type: filterType });
  }, [loadTransactions, searchTerm, filterType]);

  // Modals state
  const [isNewTxOpen, setIsNewTxOpen] = useState(false);
  const [selectedTxForDetails, setSelectedTxForDetails] = useState<LoyaltyTransaction | null>(null);
  const [selectedTxForReverse, setSelectedTxForReverse] = useState<LoyaltyTransaction | null>(null);

  // Summary Metrics matching screenshot
  const summary = useMemo(() => {
    let earned = 0;
    let redeemed = 0;

    transactions.forEach((tx) => {
      const type = (tx.type || '').toUpperCase();
      const points = Math.abs(tx.points || 0);

      if (type === 'CREDIT' || type === 'BONUS' || type === 'EARNED') {
        earned += points;
      } else if (type === 'DEBIT' || type === 'REDEEMED' || type === 'EXPIRED') {
        redeemed += points;
      }
    });

    // Current balance is the balance of the latest completed transaction or first wallet balance
    const latestTx = transactions.find((t) => t.status !== 'REVERSED');
    const currentBalance = latestTx?.balance ?? (wallets[0]?.currentBalance ?? 20);

    return {
      totalTransactions: transactions.length,
      totalEarned: earned,
      totalRedeemed: redeemed,
      currentBalance
    };
  }, [transactions, wallets]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchTerm.toLowerCase().trim();
      const txId = (tx.transactionId || tx.id || '').toLowerCase();
      const refNum = (tx.referenceNumber || tx.invoiceRef || '').toLowerCase();
      const custName = (tx.customerName || '').toLowerCase();

      const matchesSearch = !q || txId.includes(q) || refNum.includes(q) || custName.includes(q);

      const typeUpper = (tx.type || '').toUpperCase();
      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'CREDIT' && (typeUpper === 'CREDIT' || typeUpper === 'EARNED')) ||
        (filterType === 'DEBIT' && (typeUpper === 'DEBIT' || typeUpper === 'REDEEMED')) ||
        (filterType === 'BONUS' && typeUpper === 'BONUS') ||
        (filterType === 'ADJUSTMENT' && (typeUpper === 'ADJUSTMENT' || typeUpper === 'ADJUSTED'));

      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, filterType]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Loyalty transactions refreshed');
    }, 400);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 lg:p-6 pb-20">
      <div className="max-w-[1400px] w-full mx-auto space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Loyalty Transaction
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage and track all loyalty point transactions
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewTxOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded-md bg-[#2A7D5B] hover:bg-[#23674b] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </button>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4">
          {/* Total Transactions */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl lg:rounded-2xl p-3.5 lg:p-4 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
            <div className="space-y-0.5 min-w-[90px]">
              <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Transactions
              </span>
              <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {summary.totalTransactions}
              </p>
            </div>
            <div className="p-2.5 lg:p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl lg:rounded-2xl shrink-0">
              <FileText className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-blue-500" />
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl lg:rounded-2xl p-3.5 lg:p-4 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
            <div className="space-y-0.5 min-w-[90px]">
              <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Earned
              </span>
              <div className="flex items-center gap-1.5">
                <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {summary.totalEarned.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded-full text-[9px] lg:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  <TrendingUp className="h-3 w-3" /> pts
                </div>
              </div>
            </div>
            <div className="p-2.5 lg:p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl lg:rounded-2xl shrink-0">
              <TrendingUp className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-emerald-600" />
            </div>
          </div>

          {/* Total Redeemed */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl lg:rounded-2xl p-3.5 lg:p-4 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
            <div className="space-y-0.5 min-w-[90px]">
              <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Redeemed
              </span>
              <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {summary.totalRedeemed.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 lg:p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl lg:rounded-2xl shrink-0">
              <TrendingDown className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-amber-500" />
            </div>
          </div>

          {/* Current Balance */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl lg:rounded-2xl p-3.5 lg:p-4 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
            <div className="space-y-0.5 min-w-[90px]">
              <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Balance
              </span>
              <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {summary.currentBalance.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 lg:p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl lg:rounded-2xl shrink-0">
              <Coins className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            {/* Search input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Transaction ID or Reference Number..."
                className="w-full h-10 pl-9 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] focus:border-[#2A7D5B]"
              />
            </div>

            {/* Type Filter */}
            <div className="relative w-full sm:w-56">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full h-10 pl-8 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] focus:border-[#2A7D5B] appearance-none cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
                <option value="BONUS">Bonus</option>
                <option value="ADJUSTMENT">Adjustment</option>
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-md bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr className="border-0">
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>TRANSACTION ID</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>TYPE</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>POINTS</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>REFERENCE</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>DATE</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>BALANCE</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>STATUS</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap text-center w-16">
                    <div className="flex items-center justify-center">
                      <Settings className="h-4 w-4 text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredTransactions.map((tx) => {
                  const typeUpper = (tx.type || '').toUpperCase();
                  const isCredit = typeUpper === 'CREDIT' || typeUpper === 'BONUS' || typeUpper === 'EARNED';
                  const balanceVal = tx.balance !== undefined ? tx.balance : tx.balanceAfter;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Transaction ID */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800/60">
                        {tx.transactionId || tx.id}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase text-white shadow-2xs ${
                            typeUpper === 'CREDIT' || typeUpper === 'EARNED'
                              ? 'bg-[#14B8A6]'
                              : typeUpper === 'DEBIT' || typeUpper === 'REDEEMED'
                              ? 'bg-rose-500'
                              : typeUpper === 'BONUS'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>

                      {/* Points */}
                      <td
                        className={`py-3.5 px-4 text-xs font-semibold ${
                          isCredit ? 'text-[#10B981]' : 'text-rose-500'
                        }`}
                      >
                        {isCredit ? `+${Math.abs(tx.points)}` : `-${Math.abs(tx.points)}`}
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        {tx.referenceNumber || tx.invoiceRef || '-'}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {tx.date}
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-white">
                        {balanceVal.toLocaleString()}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase text-white shadow-2xs ${
                            tx.status === 'COMPLETED'
                              ? 'bg-[#14B8A6]'
                              : tx.status === 'REVERSED'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        >
                          {tx.status || 'COMPLETED'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Transaction Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                              TRANSACTION ACTIONS
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => setSelectedTxForDetails(tx)}
                            >
                              <Eye className="h-4 w-4 text-slate-500" /> View Details
                            </DropdownMenuItem>
                            {tx.status !== 'REVERSED' && (
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400"
                                onClick={() => setSelectedTxForReverse(tx)}
                              >
                                <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" /> Reverse Points
                              </DropdownMenuItem>
                            )}

                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No loyalty transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 gap-2">
          <div>
            Copyright <span className="text-sky-500 font-medium">CRMFARM</span> © 2025 - 2026
          </div>
          <div>
            Developed by <span className="text-sky-500 font-medium">@ Foyer Technology</span>
          </div>
        </div>
      </div>

      {/* Floating Help Button */}
      <button
        type="button"
        title="Help & Documentation"
        onClick={() => toast.info('Loyalty Transaction module: track customer points earned, redeemed, and reversed.')}
        className="fixed bottom-5 right-5 z-40 w-10 h-10 rounded-full bg-[#9333ea] hover:bg-[#7e22ce] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Modals */}
      <NewTransactionModal
        isOpen={isNewTxOpen}
        onClose={() => setIsNewTxOpen(false)}
      />

      <TransactionDetailsModal
        isOpen={!!selectedTxForDetails}
        onClose={() => setSelectedTxForDetails(null)}
        transaction={selectedTxForDetails}
      />

      <ReverseTransactionModal
        isOpen={!!selectedTxForReverse}
        onClose={() => setSelectedTxForReverse(null)}
        transaction={selectedTxForReverse}
      />
    </div>
  );
}
