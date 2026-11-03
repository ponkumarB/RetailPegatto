'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { LoyaltyWallet } from '@/store/useLoyaltyStore';

interface DeleteWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  wallet: LoyaltyWallet | null;
}

export function DeleteWalletModal({ isOpen, onClose, onConfirm, wallet }: DeleteWalletModalProps) {
  if (!isOpen || !wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Wallet
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to delete this wallet?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Wallet ID:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {wallet.walletId || wallet.walletCode}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Customer Name:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {wallet.customerName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                {wallet.status || 'ACTIVE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Points Balance:</span>
              <span className="font-bold text-rose-500">
                {(wallet.availablePoints ?? wallet.currentBalance).toLocaleString()} points
              </span>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Consequences:</p>
            <ul className="space-y-1.5 list-disc list-inside text-slate-500 dark:text-slate-400">
              <li>Permanently remove all points from this wallet</li>
              <li>Delete all transaction history associated with this wallet</li>
              <li>Remove all rewards and redemption records</li>
              <li className="font-semibold text-rose-600 dark:text-rose-400">This action cannot be reversed</li>
            </ul>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px]">
            Tip: If you want to temporarily disable this wallet, consider changing its status to 'INACTIVE' or 'SUSPENDED' instead.
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
