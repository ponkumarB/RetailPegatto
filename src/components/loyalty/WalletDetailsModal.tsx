'use client';

import React from 'react';
import { X, Wallet, User, Phone, Mail, Award, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { LoyaltyWallet, useLoyaltyStore } from '@/store/useLoyaltyStore';

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: LoyaltyWallet | null;
}

export function WalletDetailsModal({ isOpen, onClose, wallet }: WalletDetailsModalProps) {
  const { transactions } = useLoyaltyStore();

  if (!isOpen || !wallet) return null;

  const walletTransactions = transactions.filter(
    (t) => t.walletId === wallet.id || t.walletCode === wallet.walletCode || t.customerPhone === wallet.customerPhone
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center font-bold text-sm">
              {wallet.customerName?.[0] || 'W'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {wallet.customerName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                  {wallet.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {wallet.walletId || wallet.walletCode} • Tier: {wallet.tier}
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
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Points Breakdown Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Available
              </span>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {(wallet.availablePoints ?? wallet.currentBalance).toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center">
              <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider block">
                Redeemed
              </span>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                {(wallet.redeemedPoints ?? wallet.lifetimeRedeemed).toLocaleString()}
              </p>
            </div>

            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center">
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Pending
              </span>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">
                {(wallet.pendingPoints ?? 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Customer & Account Details */}
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Wallet Code
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                {wallet.walletCode || 'WALLET001'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer ID
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {wallet.customerId || 'CUST-001'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Phone
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {wallet.customerPhone}
              </span>
            </div>
            {wallet.customerEmail && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {wallet.customerEmail}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Member Since
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {wallet.memberSince || '2026-01-01'}
              </span>
            </div>
          </div>

          {/* Recent Wallet Transactions */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Recent Transactions ({walletTransactions.length})
            </h3>
            {walletTransactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                No recent transactions for this wallet.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {walletTransactions.slice(0, 5).map((tx) => {
                  const isCredit = tx.type === 'CREDIT' || tx.type === 'BONUS' || tx.type === 'Earned';
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isCredit
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {tx.transactionId || tx.invoiceRef || 'Transaction'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {tx.date} • {tx.type}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-bold ${
                          isCredit ? 'text-emerald-600' : 'text-rose-500'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {tx.points} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
