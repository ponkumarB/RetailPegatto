'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { updateAddonRequest } from '@/service/api/add-ons/addon-purchase-api';
import { getAddonListAPI, postAdditionalSubscriptionRequest } from '@/service/api/add-ons/superadmin-addon/api';
import { getUserSubscriptionList } from '@/service/api/add-ons/additionstorage-api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  Puzzle,
  ChevronDown,
  Calendar,
  Layers,
  Send,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AddonCreatePage() {
  const router = useRouter();
  const { primaryColor } = useStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [addonsList, setAddonsList] = useState<any[]>([]);
  // Form State
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch full addons list
        const addonsData = await getAddonListAPI();
        if (addonsData && addonsData.results) {
          setAddonsList(addonsData.results);
        } else if (Array.isArray(addonsData)) {
          setAddonsList(addonsData);
        }

        // Fetch subscription
        const data = await getUserSubscriptionList();
        if (data && data.results && data.results.length > 0) {
          setSubscription(data.results[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load available addons.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Derived Values
  const selectedAddons = useMemo(() => {
    return addonsList.filter(a => selectedAddonIds.includes(a.id.toString()));
  }, [addonsList, selectedAddonIds]);

  // Format date display (e.g. 2024-05-20 -> May 20, 2024)
  const formattedDate = useMemo(() => {
    if (!startDate) return 'Not selected';
    const dateObj = new Date(startDate);
    if (isNaN(dateObj.getTime())) return startDate;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [startDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedAddons.length === 0 || !startDate) {
      toast.error('Please select at least one addon and fill in required fields.');
      return;
    }

    if (!subscription) {
      toast.error('Subscription details not found.');
      return;
    }

    setSubmitting(true);
    try {
      // Perform requests for each selected addon
      const promises = selectedAddons.map(addon => {
        const payload = {
          Subscription_Id: subscription.id,
          addonMasterid: addon.id,
          Plan_Id: subscription.Plan_Id?.id || subscription.Plan_Id,
          TenantSubscription_Id: subscription.id, // Derived from subscription context
          Customer_Id: subscription.Customer_Id?.id || subscription.Customer_Id,
          Customername: subscription.Customer_Id?.Contact_Name || subscription.Customer_Id?.Organization_Name || "Customer",
          Planname: subscription.Plan_Id?.Plan_Name || "Plan",
          RequestDate: startDate,
          Requested_By: "admin",
          Requestedaddon: 1,
          addonPerAmount: addon.Price,
          addonTotalAmount: addon.Price, // assuming quantity 1
          Currency_code: "INR",
          Country: "India",
          proformaInvoiceflg: true,
          Invoiceflg: false,
          Paymentsflg: false,
          sync_status: "Pending"
        };
        return postAdditionalSubscriptionRequest(payload);
      });

      await Promise.all(promises);
      toast.success(`Purchase request for ${selectedAddons.length} addon(s) submitted successfully!`);
      router.push('/add-ons/add-on-purchase');
    } catch (error) {
      console.error('Error submitting addon request:', error);
      toast.error('Failed to submit purchase request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Title Header with Shopping Cart Circle */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full shrink-0 border border-emerald-100 dark:border-emerald-900/50">
          <ShoppingCart className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Purchase Request for Add-on Application
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Request add-on applications to extend the capabilities of CRMfarm IT and enhance your team's productivity.
          </p>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column - Request Details Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5 bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-850 rounded-3xl">
          <h2 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-850 pb-2">
            Request Details
          </h2>

          {/* Select Add-on Application Cards */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Select Add-on Application *</label>
            {addonsList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                No Add-ons Available
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addonsList.map((addon) => {
                  const isSelected = selectedAddonIds.includes(addon.id.toString());
                  return (
                    <div
                      key={addon.id}
                      onClick={() => {
                        setSelectedAddonIds(prev => 
                          isSelected 
                            ? prev.filter(id => id !== addon.id.toString())
                            : [...prev, addon.id.toString()]
                        );
                      }}
                      className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col gap-2 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 dark:border-emerald-500/50 shadow-sm ring-1 ring-emerald-500' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          <Puzzle className="h-4.5 w-4.5" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                            INR {addon.Price}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                            {addon.Addon_Id}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1">
                        <h3 className={`text-sm font-bold ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {addon.Name}
                        </h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-semibold mt-1 italic">
              Click on cards to select or deselect addons.
            </p>
          </div>



          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Preferred Start Date *</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
            />
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-850">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/add-ons/add-on-purchase')}
              className="h-10 px-5 text-sm font-bold border rounded-xl hover:bg-slate-50 transition-colors text-slate-700 dark:text-slate-300"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || addonsList.length === 0}
              className="h-10 px-5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors border-none flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
            </Button>
          </div>
        </form>

        {/* Right Column - Request Summary Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 space-y-5">
            <h2 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-850 pb-2 text-left">
              Request Summary
            </h2>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              
              {/* Addon App */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5 col-span-2 sm:col-span-1">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 shrink-0">
                  <Puzzle className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Add-on Application(s)</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                    {selectedAddons.length > 0 ? selectedAddons.map(a => a.Name).join(', ') : 'None'}
                  </p>
                </div>
              </div>



              {/* Effective From */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5 col-span-2">
                <div className="p-2 bg-pink-50 dark:bg-pink-950/50 rounded-lg text-pink-600 shrink-0">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Effective From</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{formattedDate}</p>
                </div>
              </div>

            </div>
          </div>

          {/* Note Box */}
          <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/50 rounded-3xl p-6 text-left space-y-4">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
              <span className="text-md">💡</span>
              <h4 className="text-sm">Note</h4>
            </div>
            <ul className="space-y-2 text-xs text-slate-650 dark:text-slate-400 font-medium list-disc pl-4">
              <li>Add-on applications will be billed as per your selected plan.</li>
              <li>You can upgrade or downgrade the plan anytime.</li>
              <li>For any queries, contact <span className="text-blue-600 dark:text-blue-400 hover:underline">support@crmfarmit.com</span></li>
            </ul>
          </div>

        </div>

      </div>

      {/* Footer Banner Info */}
      <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 text-left">
        <Info className="h-5 w-5 text-blue-500 shrink-0" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          Click Submit Request to send your add-on application request for admin approval. You will receive a notification once your request is processed.
        </p>
      </div>

    </div>
  );
}
