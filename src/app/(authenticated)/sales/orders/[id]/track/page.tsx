'use client';

import React, { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSalesOrderStore } from '@/store/useSalesOrderStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  Calendar, 
  Phone, 
  ShieldAlert, 
  ShieldCheck, 
  Info, 
  ExternalLink,
  Package,
  Layers,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { useEffect } from 'react';

export default function TrackSalesOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { salesOrders } = useSalesOrderStore();
  const { canViewSalesOrderOverview, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewSalesOrderOverview) {
      toast.error('You do not have permission to view Sales Order tracking.');
      router.push('/sales/orders');
    }
  }, [canViewSalesOrderOverview, isLoaded, router]);

  const orderId = params.id as string;
  const order = useMemo(() => salesOrders.find(o => o.id === orderId), [salesOrders, orderId]);

  const currentStep = useMemo(() => {
    if (!order) return -1;
    switch (order.status) {
      case 'Draft': return 0;
      case 'Confirmed': return 1;
      case 'Partially Delivered': return 3;
      case 'Delivered': return 5;
      case 'Cancelled': return -1;
      default: return 2;
    }
  }, [order?.status]);

  const orderProjects = useMemo(() => {
    if (!order) return [];
    return order.projects || [];
  }, [order]);

  if (isLoaded && !canViewSalesOrderOverview) {
    return null;
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-left max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Order Record Missing</h3>
        <p className="text-sm text-center text-slate-400">Shipment tracking cannot be displayed as this order does not exist.</p>
        <Button variant="outline" className="h-9 rounded-[5px]" onClick={() => router.push('/sales/orders')}>
          Back to Sales Orders
        </Button>
      </div>
    );
  }

  // Stepper definition
  const steps = [
    { label: 'Confirmed', desc: 'Order validated' },
    { label: 'Processing', desc: 'Preparing cargo' },
    { label: 'Shipped', desc: 'Cargo dispatched' },
    { label: 'Out for Delivery', desc: 'With courier agent' },
    { label: 'Delivered', desc: 'Cycle complete' }
  ];

  const handleOpenCarrierLink = () => {
    toast.success('Navigating to courier tracking gateway...');
    window.open('https://www.fedex.com', '_blank');
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/sales/orders/${order.id}`)} className="h-7 px-2 gap-1 text-xs rounded-[5px] border border-transparent">
          <ArrowLeft className="h-3 w-3" /> Back
        </Button>
        <span>/</span>
        <Link href="/sales/orders" className="hover:underline">Sales Orders</Link>
        <span>/</span>
        <Link href={`/sales/orders/${order.id}`} className="hover:underline">{order.id}</Link>
        <span>/</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">Track Shipment</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Shipment Tracking</h1>
        <p className="text-xs text-slate-450 mt-1">Real-time status updates of logistics courier consignments and delivery route pipelines.</p>
      </div>

      {/* Horizontal Progress Stepper Card */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
        <CardContent className="p-8">
          {order.status === 'Cancelled' ? (
            <div className="flex items-center gap-3 bg-rose-50/50 dark:bg-rose-955/10 p-4 rounded-[5px] border border-rose-150">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
              <div className="text-xs font-semibold">
                <span className="font-bold text-rose-700 block">Order Cancelled</span>
                <span className="text-slate-500">Logistics dispatch has been terminated and shipment items returned to stock.</span>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2">
              {/* Stepper connecting line */}
              <div className="absolute top-[18px] left-[5%] right-[5%] h-1 bg-slate-100 dark:bg-slate-800 hidden md:block z-0" />
              
              {/* Colored progress line */}
              {currentStep > 0 && (
                <div 
                  className="absolute top-[18px] left-[5%] h-1 bg-blue-500 hidden md:block z-0 transition-all duration-500" 
                  style={{ width: `${Math.min((currentStep - 1) * 22.5, 90)}%` }}
                />
              )}

              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = currentStep >= stepNum;
                const isActive = currentStep === stepNum || (currentStep === 0 && idx === 0);

                return (
                  <div key={idx} className="flex flex-row md:flex-col items-center gap-3 md:gap-2 text-center z-10 w-full md:w-auto">
                    {/* Circle Indicator */}
                    <div className={cn(
                      "h-9.5 w-9.5 rounded-[5px] flex items-center justify-center text-xs font-bold transition-all duration-300 border shadow-2xs shrink-0",
                      isCompleted 
                        ? "bg-blue-500 border-blue-500 text-white font-extrabold" 
                        : isActive
                          ? "bg-white dark:bg-slate-950 border-blue-600 text-blue-600 ring-4 ring-blue-50 dark:ring-blue-950/20"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                    )}>
                      {isCompleted ? (
                        <ShieldCheck className="h-4.5 w-4.5" />
                      ) : (
                        <span>{stepNum}</span>
                      )}
                    </div>

                    {/* Metadata text */}
                    <div className="text-left md:text-center">
                      <h4 className={cn(
                        "text-xs font-bold",
                        isCompleted || isActive ? "text-slate-900 dark:text-white" : "text-slate-400"
                      )}>
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium whitespace-nowrap mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Grid: Left projects checklist, Right courier summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Associated Delivery Projects */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b dark:border-slate-800 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-blue-600 dark:text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Delivery Project Checklist</h3>
            </div>
            
            <CardContent className="p-6 space-y-5">
              {orderProjects.map((proj, idx) => (
                <div key={proj.id} className="border dark:border-slate-800 rounded-[5px] p-4.5 space-y-4 bg-slate-50/20 dark:bg-slate-950/5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-left">
                      <span className="text-[10px] font-mono text-slate-400 font-bold block">{proj.id}</span>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm">{proj.name}</h4>
                    </div>
                    <span className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold uppercase border",
                      proj.status === 'Delivered' ? 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30' : 'text-blue-700 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30'
                    )}>
                      {proj.status}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-455">
                      <span>Delivery Completion Rate</span>
                      <span className="text-slate-800 dark:text-white">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-[5px] overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-[5px] transition-all duration-500" style={{ width: `${proj.progress}%` }} />
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t dark:border-slate-800 font-medium">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] text-slate-400 font-bold">Schedule Delivery Date</span>
                      <p className="text-slate-700 dark:text-slate-350">{proj.scheduleDate}</p>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="text-[10px] text-slate-400 font-bold">Consignment Address</span>
                      <p className="text-slate-700 dark:text-slate-350 truncate" title={proj.deliveryAddress}>{proj.deliveryAddress}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Card 2: Items Summary */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b dark:border-slate-800 flex items-center gap-2">
              <Package className="h-4.5 w-4.5 text-blue-600 dark:text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Delivered Items Summary</h3>
            </div>
            
            <div className="overflow-x-auto text-left">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-955/20 border-b dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-center">Ordered Qty</th>
                    <th className="px-6 py-3 text-center">Delivered Qty</th>
                    <th className="px-6 py-3 text-center pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  {order.items.map((item, idx) => {
                    const isDelivered = order.status === 'Delivered';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-950/5">
                        <td className="px-6 py-3.5 text-slate-900 dark:text-white font-extrabold">{item.product}</td>
                        <td className="px-6 py-3.5 text-slate-450 font-medium">{item.description}</td>
                        <td className="px-6 py-3.5 text-center font-bold">{item.quantity}</td>
                        <td className="px-6 py-3.5 text-center font-bold text-blue-600">
                          {isDelivered ? item.quantity : (order.status === 'Partially Delivered' ? Math.ceil(item.quantity * 0.6) : 0)}
                        </td>
                        <td className="px-6 py-3.5 text-center pr-6">
                          <span className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold uppercase border",
                            isDelivered ? "text-blue-700 bg-blue-50 border-blue-100 dark:border-blue-900/30" : (order.status === 'Partially Delivered' ? "text-amber-705 bg-amber-50 border-amber-100 dark:border-amber-900/30" : "text-slate-500 bg-slate-100 border-slate-200 dark:border-slate-800")
                          )}>
                            {isDelivered ? 'Fulfilled' : (order.status === 'Partially Delivered' ? 'In-Transit' : 'Awaiting Cargo')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Section (1/3 width) */}
        <div className="space-y-6">
          {/* Card 3: Shipment details */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-4.5 border-b dark:border-slate-800 flex items-center gap-2">
              <Truck className="h-4.5 w-4.5 text-blue-600 dark:text-blue-505" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-202 font-extrabold">Shipment Details</h3>
            </div>
            
            <CardContent className="p-5 space-y-4 text-xs font-semibold text-slate-550 dark:text-slate-400 text-left">
              <div className="space-y-3.5">
                <div className="flex justify-between py-1 border-b dark:border-slate-800">
                  <span className="text-slate-455">Courier Vendor</span>
                  <span className="text-slate-900 dark:text-white font-bold">FarmFast Logistics</span>
                </div>
                <div className="flex justify-between py-1 border-b dark:border-slate-800">
                  <span className="text-slate-455">Tracking Number</span>
                  <span className="text-slate-900 dark:text-white font-mono font-bold">TRK123456789</span>
                </div>
                <div className="flex justify-between py-1 border-b dark:border-slate-800">
                  <span className="text-slate-455">Order Date</span>
                  <span className="text-slate-700 dark:text-slate-300">{order.orderDate}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-455">Estimated Handover</span>
                  <span className="text-slate-700 dark:text-slate-300">{order.deliveryDate}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleOpenCarrierLink}
                  variant="outline" 
                  size="sm" 
                  className="h-8.5 rounded-[5px] border border-slate-200 dark:border-slate-800 w-full text-xs font-bold gap-1"
                >
                  Track on Carrier Site
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Order Summary Summary */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <CardContent className="p-5 space-y-4 text-xs text-left font-semibold text-slate-550">
              <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider">Transaction Summary</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-455">Billing Account</span>
                  <span className="text-slate-900 dark:text-white font-bold">{order.customer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Total Valuation</span>
                  <span className="text-blue-600 dark:text-blue-450 font-bold font-mono">USD {order.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-455">Payment Terms</span>
                  <span className="text-slate-805 dark:text-slate-300 font-bold">{order.paymentTerms || 'Net 30'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Need Help */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <CardContent className="p-5 text-left space-y-3.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-[5px] bg-blue-50 dark:bg-blue-955/20 text-blue-600 flex items-center justify-center shrink-0">
                  <Info className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">Need Shipping Assistance?</h4>
              </div>
              <p className="text-slate-455 font-semibold leading-relaxed">
                Contact our customer support desk regarding custom freight delivery details or change of shipping address queries.
              </p>
              <div className="flex items-center gap-1.5 text-blue-600 font-extrabold">
                <Phone className="h-4 w-4" />
                <span>+1 555-CRM-SHIP</span>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
