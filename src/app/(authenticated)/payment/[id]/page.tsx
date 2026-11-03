'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { usePaymentStore } from '@/store/usePaymentStore';
import { PaymentRecord } from '@/types/payment';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Edit2,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Hash,
  DollarSign,
  FileText,
  Building,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { primaryColor } = useStore();
  const { getPaymentById } = usePaymentStore();

  const id = params.id as string;
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await getPaymentById(id);
        if (data) {
          setPayment(data);
        }
      } catch (err) {
        console.error('Failed to load payment detail:', err);
        toast.error('Failed to load payment details.');
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [id, getPaymentById]);

  const formatCurrency = (amount?: number) => {
    const val = Number(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="h-7 w-7 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Loading payment overview...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Receipt className="h-12 w-12 text-slate-300 mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Payment Record Not Found</h3>
        <p className="text-sm mt-1 text-slate-500">The requested payment record does not exist or has been deleted.</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => router.push('/payment')}>
          Back to Payments
        </Button>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 text-left max-w-4xl mx-auto"
      style={{ '--theme-primary': primaryColor } as React.CSSProperties}
    >
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/payment')}
          className="h-7 px-2 gap-1 text-xs cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <span>/</span>
        <span className="cursor-pointer hover:underline" onClick={() => router.push('/payment')}>
          Payments
        </span>
        <span>/</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          {payment.Payment_Id || `PAY-${payment.id}`}
        </span>
      </div>

      {/* Main Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Payment {payment.Payment_Id || `#${payment.id}`}
          </h1>
          <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold border-0">
            Received
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => router.push(`/payment/create?edit=${payment.id || payment.Payment_Id}`)}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-bold rounded-xl gap-2 h-9 text-xs cursor-pointer hover:opacity-90 shadow-xs"
          >
            <Edit2 className="h-4 w-4" /> Edit Payment
          </Button>
        </div>
      </div>

      {/* Details Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Customer Information Card */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardHeader className="pb-2 border-b dark:border-slate-800">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" style={{ color: primaryColor }} /> Customer Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs font-semibold">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">Customer Name</span>
              <span className="text-sm font-extrabold text-primary block" style={{ color: primaryColor }}>
                {payment.Customer_Name || '—'}
              </span>
            </div>
            <div className="space-y-1 pt-2 border-t dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Account ID</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{payment.Account_Id || '—'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Info Card */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardHeader className="pb-2 border-b dark:border-slate-800">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-primary" style={{ color: primaryColor }} /> Payment Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs font-semibold">
            <div className="flex justify-between py-1 border-b dark:border-slate-800">
              <span className="text-slate-400">Payment Date</span>
              <span className="font-mono">{payment.Payment_Date || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b dark:border-slate-800">
              <span className="text-slate-400">Payment Mode</span>
              <Badge variant="outline" className="text-[10px] font-bold py-0.5 border-0 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                {payment.Mode_of_Payment || 'Cash'}
              </Badge>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Transaction No</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{payment.Transaction_No || '—'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Amount Card */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardHeader className="pb-2 border-b dark:border-slate-800">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" style={{ color: primaryColor }} /> Amount Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs font-semibold">
            <div className="space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase">Paid Amount</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block font-mono">
                {formatCurrency(payment.Paid_Amount)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t dark:border-slate-800">
              <span className="text-slate-400">Linked Invoice</span>
              <span className="font-bold text-slate-900 dark:text-white">{payment.Invoice_No || '—'}</span>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
