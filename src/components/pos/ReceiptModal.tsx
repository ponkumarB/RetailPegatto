'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PosInvoice } from '@/store/usePosInvoiceStore';
import { Printer, Download, CheckCircle2, Store } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: PosInvoice | null;
}

export function ReceiptModal({ isOpen, onClose, invoice }: ReceiptModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Tax Invoice / POS Receipt
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Printable Thermal Receipt Container */}
        <div id="pos-printable-receipt" className="p-6 font-mono text-xs text-slate-800 dark:text-slate-200 select-text max-h-[70vh] overflow-y-auto">
          {/* Header Store Info */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h2 className="text-base font-bold tracking-tight uppercase text-slate-900 dark:text-white">Pegatto Retail Store</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">#42, MG Road, Commercial Complex, Sector 4</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Bangalore, Karnataka - 560001</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Ph: +91 80 4123 4567 | GSTIN: 29AAAAA0000A1Z5</p>
          </div>

          {/* Invoice & Customer Meta */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Invoice No:</span>
              <span className="font-bold text-slate-900 dark:text-white">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Date & Time:</span>
              <span>{invoice.date} {invoice.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Customer:</span>
              <span className="font-medium">{invoice.customerName}</span>
            </div>
            {invoice.customerPhone && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                <span>{invoice.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Cashier:</span>
              <span>{invoice.cashierName}</span>
            </div>
          </div>

          {/* Items Header */}
          <div className="py-2 border-b border-slate-300 dark:border-slate-700 font-bold text-[11px] grid grid-cols-12 gap-1 text-slate-700 dark:text-slate-300">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Rate</span>
            <span className="col-span-2 text-right">Total</span>
          </div>

          {/* Items List */}
          <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-1 text-[11px]">
                <div className="col-span-6">
                  <p className="font-medium truncate">{item.product.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    GST {item.product.taxRate}% {item.discountPercent > 0 && `| Disc ${item.discountPercent}%`}
                  </p>
                </div>
                <div className="col-span-2 text-center">{item.quantity}</div>
                <div className="col-span-2 text-right">₹{item.rate.toFixed(2)}</div>
                <div className="col-span-2 text-right font-medium">₹{item.total.toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Bill Summary */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                <span>Discount:</span>
                <span>- ₹{invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Estimated Tax (GST):</span>
              <span>₹{invoice.taxAmount.toFixed(2)}</span>
            </div>
            {invoice.roundOff !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Round Off:</span>
                <span>{invoice.roundOff > 0 ? `+ ₹${invoice.roundOff.toFixed(2)}` : `- ₹${Math.abs(invoice.roundOff).toFixed(2)}`}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
              <span>GRAND TOTAL:</span>
              <span>₹{invoice.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Payment Mode:</span>
              <span className="font-bold text-slate-900 dark:text-white">{invoice.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Amount Tendered:</span>
              <span>₹{invoice.amountReceived.toFixed(2)}</span>
            </div>
            {invoice.changeReturned > 0 && (
              <div className="flex justify-between font-bold text-blue-600 dark:text-blue-400">
                <span>Change Returned:</span>
                <span>₹{invoice.changeReturned.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Barcode & Footer */}
          <div className="pt-4 text-center space-y-2">
            <div className="inline-block px-4 py-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-[10px] tracking-widest uppercase">
              *{invoice.invoiceNumber}*
            </div>
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              Thank you for shopping with us!
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              Goods once sold can be exchanged within 7 days with original receipt.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
              <Printer className="w-4 h-4" />
              Print Bill
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
