'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { createAddStorageRequest } from '@/service/api/add-ons/additionstorage-api';
import { getStorageMasterListAPI, postAdditionalStorageRequest, getTenantSubscriptionListAPI } from '@/service/api/add-ons/superadmin-addon/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  HardDrive,
  Cloud,
  Server,
  Calendar,
  Layers,
  UploadCloud,
  ChevronDown,
  X,
  Send,
  Info,
  Award,
  CheckCircle,
  HelpCircle,
  CloudUpload
} from 'lucide-react';
import { toast } from 'sonner';

export default function StorageCreatePage() {
  const router = useRouter();
  const { primaryColor, user } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Config/Form State
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const currentPlan = subscription?.Plan_name || subscription?.Plan_Id?.Plan_Name || 'Loading...';
  const currentStorageCount = subscription?.Base_storage || subscription?.Storage_Size || 0;

  const [selectedStoragePlan, setSelectedStoragePlan] = useState<any>(null);
  const [justification, setJustification] = useState<string>('');

  // Storage Plans Pagination State
  const [storagePlans, setStoragePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const data = await getStorageMasterListAPI(page);
        if (data && data.results) {
          setStoragePlans(prev => page === 1 ? data.results : [...prev, ...data.results]);
          setTotalPages(Math.ceil((data.count || 0) / 10)); // assuming 10 per page or derived from next
        }
      } catch (err) {
        console.error('Failed to fetch storage plans', err);
        toast.error('Failed to load storage plans');
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [page]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = Math.abs(e.currentTarget.scrollHeight - e.currentTarget.scrollTop - e.currentTarget.clientHeight) < 2;
    if (bottom && !loadingPlans && page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoadingSubscription(true);
        const res = await getTenantSubscriptionListAPI();
        if (res?.results?.length > 0) {
          setSubscription(res.results[0]);
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        toast.error('Could not load current subscription plan');
      } finally {
        setLoadingSubscription(false);
      }
    };
    fetchSubscription();
  }, []);

  // Derived calculations
  const totalStorage = useMemo(() => {
    return currentStorageCount + (selectedStoragePlan?.Storage_Size || 0);
  }, [currentStorageCount, selectedStoragePlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStoragePlan) {
      toast.error('Please select a storage plan.');
      return;
    }

    if (!subscription) {
      toast.error('Subscription data not loaded yet.');
      return;
    }

    let currentUserId = user?.id;
    if (!currentUserId && typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const parsedUser = JSON.parse(userDataStr);
          currentUserId = parsedUser?.id;
        }
      } catch (e) {
        console.error('Failed to parse userData from localStorage', e);
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        Subscription_Id: subscription.Subscription_id || subscription.id,
        storageMasterid: selectedStoragePlan.id,
        Plan_Id: subscription.Plan_Id?.id || subscription.Plan_Id,
        TenantSubscription_Id: subscription.id, 
        Customer_Id: subscription.Customer_Id?.id || subscription.Customer_Id,
        Customername: subscription.Customername || subscription.Customer_Id?.Contact_Name || subscription.Customer_Id?.Organization_Name || "Customer",
        Planname: subscription.Plan_name || subscription.Plan_Id?.Plan_Name || "Plan",
        RequestDate: new Date().toISOString().split('T')[0],
        Requested_By: "admin",
        Requestedstorage: selectedStoragePlan.Storage_Size,
        storagePerAmount: selectedStoragePlan.Price,
        storageTotalAmount: selectedStoragePlan.Price,
        Currency_code: selectedStoragePlan.Currency || "INR",
        Country: "India",
        proformaInvoiceflg: true,
        Invoiceflg: false,
        Paymentsflg: false,
        sync_status: "Pending"
      };

      await postAdditionalStorageRequest(payload);
      toast.success(`Storage request submitted successfully!`);
      router.push('/add-ons/additional-storage');
    } catch (error) {
      console.error('Failed to submit storage request:', error);
      toast.error('Failed to submit storage request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Title Header with Document Green Icon */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full shrink-0 border border-emerald-100 dark:border-emerald-900/50">
          <HardDrive className="h-6 w-6 text-emerald-600 dark:text-emerald-450" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Additional Storage in GB Request
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Request additional storage to securely store more data, files and documents.
          </p>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column - Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5 bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-850 rounded-3xl">
          <h2 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-850 pb-2">
            Request Details
          </h2>

          {/* Current Plan & Current Storage (Inline row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Current Plan</label>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold border rounded-xl bg-slate-50/50 dark:bg-slate-955/60 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Award className="h-4 w-4 text-emerald-650 shrink-0" />
                <span>{currentPlan}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Current Storage</label>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold border rounded-xl bg-slate-50/50 dark:bg-slate-955/60 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <HardDrive className="h-4 w-4 text-blue-500 shrink-0" />
                <span>{currentStorageCount} GB Used</span>
              </div>
            </div>
          </div>

          {/* Storage Plans Grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Select Additional Storage Plan *</label>
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar"
              onScroll={handleScroll}
            >
              {storagePlans.length === 0 && !loadingPlans ? (
                <div className="col-span-full p-4 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  No Storage Plans Available
                </div>
              ) : (
                storagePlans.map((plan) => {
                  const isSelected = selectedStoragePlan?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedStoragePlan(plan)}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 dark:border-emerald-500/50 shadow-sm ring-1 ring-emerald-500' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          <CloudUpload className="h-4.5 w-4.5" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {plan.Currency || 'INR'} {plan.Price}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                            {plan.Storage_Id}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1">
                        <h3 className={`text-sm font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {plan.Name} ({plan.Storage_Size} GB)
                        </h3>
                      </div>
                    </div>
                  );
                })
              )}
              {loadingPlans && (
                <div className="col-span-full py-4 flex justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-755 dark:text-slate-350">Total Storage After Request</label>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-extrabold border rounded-xl bg-blue-50/20 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
                <span>{totalStorage} GB</span>
              </div>
            </div>
          </div>



          {/* Business Justification */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Business Justification / Notes</label>
            <textarea
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Provide notes or business reasons for this request..."
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
            />
          </div>



          {/* Buttons row */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-850">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/add-ons/additional-storage')}
              className="h-10 px-5 text-sm font-bold border rounded-xl hover:bg-slate-50 transition-colors text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loadingSubscription}
              className="h-10 px-5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors border-none flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
            </Button>
          </div>
        </form>

        {/* Right Column - Storage Summary & How It Works */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 space-y-5">
            <h2 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-855 pb-2 text-left">
              Storage Summary
            </h2>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              
              {/* Current Storage Used */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-955/50 rounded-lg text-blue-600 shrink-0">
                  <Server className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current Storage</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{currentStorageCount} GB</p>
                  <span className="text-[9px] font-semibold text-slate-400">Used</span>
                </div>
              </div>

              {/* Additional Requested */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 shrink-0">
                  <CloudUpload className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Additional Requested</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{selectedStoragePlan?.Storage_Size || 0} GB</p>
                  <span className="text-[9px] font-semibold text-slate-400">Requested</span>
                </div>
              </div>

              {/* Total After Request */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 bg-purple-50 dark:bg-purple-955/50 rounded-lg text-purple-600 shrink-0">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total After Request</p>
                  <p className="text-xs font-black text-slate-850 dark:text-white mt-0.5 truncate">{totalStorage} GB</p>
                  <span className="text-[9px] font-semibold text-slate-400">GB</span>
                </div>
              </div>

            </div>
          </div>

          {/* What You Get Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 text-left space-y-4 relative overflow-hidden">
            <h3 className="text-sm font-bold text-blue-650 dark:text-blue-400">
              What You Get
            </h3>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">More space to store files, documents and attachments</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Seamless performance and data management</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Secure and reliable cloud storage</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Scalable storage as your business grows</p>
                </div>
              </div>

              {/* Cloud Server Rack vector-like graphic */}
              <div className="hidden sm:flex flex-col items-center justify-center bg-blue-50/20 dark:bg-slate-950/30 border border-blue-100/50 dark:border-slate-850 p-3.5 rounded-2xl w-36 shrink-0 relative overflow-hidden">
                <div className="relative mb-2">
                  <Cloud className="h-14 w-14 text-blue-500 fill-blue-500/10" />
                  <CloudUpload className="h-6 w-6 text-white absolute left-4 top-4 bg-blue-600 rounded-full p-1" />
                </div>
                <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 space-y-1 shadow-md">
                  <div className="h-1.5 w-full bg-slate-800 rounded-xs flex items-center justify-between px-1">
                    <span className="h-1 w-1 bg-green-500 rounded-full animate-ping" />
                    <span className="h-0.5 w-4 bg-slate-705 rounded-xs" />
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-xs flex items-center justify-between px-1">
                    <span className="h-1 w-1 bg-green-500 rounded-full" />
                    <span className="h-0.5 w-6 bg-slate-705 rounded-xs" />
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-xs flex items-center justify-between px-1">
                    <span className="h-1 w-1 bg-blue-500 rounded-full animate-pulse" />
                    <span className="h-0.5 w-5 bg-slate-705 rounded-xs" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Note Box */}
          <div className="bg-amber-50/20 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/50 rounded-3xl p-6 text-left space-y-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
              <span className="text-md">💡</span>
              <h4 className="text-sm">Note</h4>
            </div>
            <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-400 font-medium list-disc pl-4">
              <li>Additional storage will be billed as per your current plan rates.</li>
              <li>You can upgrade or downgrade storage anytime.</li>
              <li>For any queries, contact <span className="text-blue-600 dark:text-blue-400 hover:underline">support@crmfarmit.com</span></li>
            </ul>
          </div>

        </div>

      </div>

      {/* Footer Banner Info */}
      <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 text-left">
        <Info className="h-5 w-5 text-blue-500 shrink-0" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          Click Submit Request to send your storage request for admin approval. You will receive a notification once your request is processed.
        </p>
      </div>

    </div>
  );
}
