'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getAddonRequestList, updateAddonRequest, getFullAddonsList } from '@/service/api/add-ons/addon-purchase-api';
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
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function AddonEditPage() {
  const router = useRouter();
  const params = useParams();
  const { primaryColor } = useStore();

  const addonId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [addonsList, setAddonsList] = useState<any[]>([]);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  // Form State
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch full addons list
        const addonsData = await getFullAddonsList();
        let allAddons: any[] = [];
        if (addonsData && addonsData.results) {
          allAddons = addonsData.results;
        } else if (Array.isArray(addonsData)) {
          allAddons = addonsData;
        }
        setAddonsList(allAddons);

        // Fetch subscription details
        const subData = await getUserSubscriptionList();
        let sub = null;
        if (subData && subData.results && subData.results.length > 0) {
          sub = subData.results[0];
          setSubscription(sub);
        }

        // Fetch existing request
        const reqData = await getAddonRequestList();
        if (reqData && reqData.results) {
          const req = reqData.results.find((r: any) => r.id.toString() === addonId);
          if (req) {
            setExistingRequest(req);
            
            // Set form values based on existing request
            if (req.Addon_Name) {
              let addonIds: string[] = [];
              if (Array.isArray(req.Addon_Name)) {
                addonIds = req.Addon_Name.map((a: any) => a.id?.toString()).filter(Boolean);
                if (req.Addon_Name.length > 0 && req.Addon_Name[0].Started_Date) {
                  setStartDate(req.Addon_Name[0].Started_Date);
                }
              } else {
                addonIds = [req.Addon_Name.id?.toString()].filter(Boolean);
                if (req.Addon_Name.Started_Date) {
                  setStartDate(req.Addon_Name.Started_Date);
                }
              }
              setSelectedAddonIds(addonIds);
            }
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load addon request details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addonId]);

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

    if (!subscription || !existingRequest) {
      toast.error('Subscription or request details not found.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: existingRequest.id, // For PUT requests
        AddonRequest_Id: existingRequest.AddonRequest_Id,
        Subscription_Id: subscription.id,
        Plan_Name: subscription.Plan_Id?.Plan_Name || "Plan",
        Addon_Name: selectedAddons.map(addon => ({
          ...addon,
          NoofUsers: 1,
          Started_Date: startDate,
        })),
        Addon_id: existingRequest.Addon_id || "",
        Addon_Gen_id: existingRequest.Addon_Gen_id || "",
        Requested_By: existingRequest.Requested_By || "admin",
        Created_By: existingRequest.Created_By || 1,
        Updated_By: 1,
        Organization_Id: subscription.Organization_Id || 1
      };

      await updateAddonRequest(payload);
      toast.success(`Purchase request for ${selectedAddons.length} addon(s) updated successfully!`);
      router.push('/add-ons/add-on-purchase');
    } catch (error) {
      console.error('Error submitting addon request:', error);
      toast.error('Failed to update purchase request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;
  }

  if (!existingRequest && !loading) {
    return (
      <div className="py-20 text-center font-bold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Info className="h-10 w-10 text-slate-400" />
          <span>Purchase request not found.</span>
          <Button variant="outline" onClick={() => router.push('/add-ons/add-on-purchase')}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Title Header with Back Action */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/add-ons/add-on-purchase')}
          className="h-9 w-9 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Edit Purchase Request: {existingRequest?.AddonRequest_Id || addonId}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modify the request details or configuration for admin review.
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

          {/* Select Add-on Application */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Select Add-on Application *</label>
            <div className="relative">
              <select
                multiple
                value={selectedAddonIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedAddonIds(values);
                }}
                className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none cursor-pointer h-32"
                disabled={addonsList.length === 0}
              >
                {addonsList.length === 0 && <option value="">No Add-ons Available</option>}
                {addonsList.map((addon) => (
                  <option key={addon.id} value={addon.id}>
                    {addon.Name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1 italic">
              Hold Ctrl (or Cmd on Mac) to select multiple features.
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
              <span>{submitting ? 'Updating...' : 'Save Changes'}</span>
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

    </div>
  );
}
