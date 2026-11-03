'use client';

import React from 'react';
import { AlertTriangle, X, RotateCcw } from 'lucide-react';
import { LoyaltyTransaction, useLoyaltyStore } from '@/store/useLoyaltyStore';
import { toast } from 'sonner';

interface ReverseTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: LoyaltyTransaction | null;
}

export function ReverseTransactionModal({
  isOpen,
  onClose,
  transaction
}: ReverseTransactionModalProps) {
  const { reverseLoyaltyTransaction } = useLoyaltyStore();

  if (!isOpen || !transaction) return null;

  const handleReverse = () => {
    reverseLoyaltyTransaction(transaction.id || transaction.transactionId);
    toast.success('Transaction reversed successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reverse Transaction
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
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg p-3 text-xs text-rose-800 dark:text-rose-300">
            <span className="font-semibold block mb-0.5">Warning: This action cannot be undone!</span>
            Reversing this transaction will adjust points in the customer&apos;s wallet.
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {transaction.transactionId || transaction.id}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Points:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {transaction.points} points
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 pt-1">
            <p className="font-medium text-slate-800 dark:text-slate-200">Consequences:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>This action will reverse the transaction</li>
              <li>Points will be adjusted in the wallet</li>
              <li>A reversal record will be updated</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleReverse}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reverse Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
