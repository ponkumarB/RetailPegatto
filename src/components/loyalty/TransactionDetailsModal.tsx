'use client';

import React from 'react';
import { Receipt, X, CheckCircle, AlertCircle, Calendar, Wallet, Hash, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { LoyaltyTransaction } from '@/store/useLoyaltyStore';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: LoyaltyTransaction | null;
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transaction
}: TransactionDetailsModalProps) {
  if (!isOpen || !transaction) return null;

  const isCredit = transaction.type === 'CREDIT' || transaction.type === 'BONUS' || transaction.type === 'Earned';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-[#2A7D5B]">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Transaction Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Transaction ID
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {transaction.transactionId || transaction.id}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                transaction.status === 'COMPLETED'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {transaction.status === 'COMPLETED' ? (
                <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              {transaction.status || 'COMPLETED'}
            </span>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800" />

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Type</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500 text-white">
                {transaction.type}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Points</span>
              <span
                className={`text-base font-bold font-mono ${
                  isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {isCredit ? '+' : '-'}{Math.abs(transaction.points).toLocaleString()}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Reference</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {transaction.referenceType || 'PURCHASE'} - {transaction.referenceNumber || transaction.invoiceRef || '-'}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Remarks</span>
              <span className="text-slate-700 dark:text-slate-300">
                {transaction.remarks || transaction.notes || '-'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Created Date</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {transaction.date} {transaction.time ? `, ${transaction.time}` : ''}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-1">Running Balance</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                {(transaction.balance !== undefined ? transaction.balance : transaction.balanceAfter).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
