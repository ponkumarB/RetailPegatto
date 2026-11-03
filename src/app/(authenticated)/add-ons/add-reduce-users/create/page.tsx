'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAddReduceUsersStore } from '@/store/useAddReduceUsersStore';
import { getAdditionalUserMasterListAPI, postAdditionalLicenseRequest, getTenantSubscriptionListAPI } from '@/service/api/add-ons/superadmin-addon/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Info,
  X,
  Plus,
  Minus,
  CheckCircle,
  FileText,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

// Mock instances data removed, we'll fetch from API

export default function CreateAddReduceUsersPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { addRecord } = useAddReduceUsersStore();

  const [instances, setInstances] = useState<any[]>([]);
  const [userPackages, setUserPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Instance selector
  const [selectedInstanceIdx, setSelectedInstanceIdx] = useState(0);
  const [selectedUserPackage, setSelectedUserPackage] = useState<any>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await getTenantSubscriptionListAPI();
        if (response?.results) {
          setInstances(response.results);
        } else if (response?.data) {
          setInstances(response.data);
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        toast.error('Failed to fetch subscriptions');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchPackages = async () => {
      setLoadingPackages(true);
      try {
        const res = await getAdditionalUserMasterListAPI(1);
        if (res?.results) {
          setUserPackages(res.results);
        }
      } catch (error) {
        console.error('Error fetching user packages:', error);
      } finally {
        setLoadingPackages(false);
      }
    };
    
    fetchSubscriptions();
    fetchPackages();
  }, []);

  const instance = instances[selectedInstanceIdx];

  // Derived calculations
  const currentUsers = instance?.Base_users || instance?.No_Of_Users || 0;
  const newUsersCount = currentUsers + (selectedUserPackage?.No_Of_Users || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instance) return;
    if (!selectedUserPackage) {
      toast.error('Please select an additional user package');
      return;
    }

    const payload = {
      Subscription_Id: String(instance.Subscription_id || instance.id || instance.ID),
      userMasterid: selectedUserPackage.id,
      Plan_Id: parseInt(instance.Plan_Id?.id || instance.Plan_Id?.ID || instance.Plan_Id),
      TenantSubscription_Id: instance.id || instance.TenantSubscription_Id,
      Customer_Id: parseInt(instance.Customer_Id),
      Customername: instance.Customername || instance.Customer_Name,
      Planname: instance.Plan_name || instance.Plan_Id?.Plan_Name || instance.Subscription_Name,
      RequestDate: new Date().toISOString().split('T')[0],
      Requested_By: "admin",
      Requestedusers: selectedUserPackage.No_Of_Users,
      UserPerAmount: selectedUserPackage.Amount_Per_User,
      UserTotalAmount: selectedUserPackage.Total_Amount,
      Currency_code: selectedUserPackage.Currency_code || "INR",
      Country: selectedUserPackage.Country || "India",
      proformaInvoiceflg: true,
      Invoiceflg: false,
      Paymentsflg: false,
      sync_status: "Pending"
    };

    try {
      await postAdditionalLicenseRequest(payload);
      toast.success(`User modification request saved successfully!`);
      router.push('/add-ons/add-reduce-users');
    } catch (error) {
      console.error('Error saving license request:', error);
      toast.error('Failed to save request');
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading subscriptions...</div>;
  }

  if (instances.length === 0) {
    return <div className="p-10 text-center">No subscriptions found.</div>;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header Row (No Breadcrumbs) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl w-full md:w-auto flex-1">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-450 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Add or Reduce Users</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Add or remove users from your subscription. Changes will be effective immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/add-ons/add-reduce-users')}
            className="h-10 px-4 text-xs font-bold border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            style={{ backgroundColor: primaryColor }}
            className="h-10 px-4 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-all border-none gap-1.5"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Update Users</span>
          </Button>
        </div>
      </div>

      {/* Info Warning Banner */}
      <div className="flex items-start gap-2.5 p-3.5 border border-blue-100/70 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl text-xs font-bold text-blue-800 dark:text-blue-400">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <span>Add or remove users from your subscription. Changes will be effective immediately.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6 animate-fadeIn">
          
          {/* Section 1: Select Instance */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">1</span>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Select Instance
              </h3>
            </div>
            <CardContent className="p-5">
              <div className="space-y-1.5 max-w-sm">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Instance *</Label>
                <select
                  value={selectedInstanceIdx}
                  onChange={(e) => setSelectedInstanceIdx(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
                >
                  {instances.map((inst, idx) => (
                    <option key={inst.TenantSubscription_Id || inst.Subscription_Id} value={idx}>
                      {inst.Customername || inst.Customer_Name} ({inst.TenantSubscription_Id || inst.Subscription_Id})
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Select Additional User Package */}
          <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">2</span>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Select Additional User Package
              </h3>
            </div>
            
            <CardContent className="p-6 space-y-6">
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar"
              >
                {userPackages.length === 0 && !loadingPackages ? (
                  <div className="col-span-full p-4 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                    No Additional User Packages Available
                  </div>
                ) : (
                  userPackages.map((pkg) => {
                    const isSelected = selectedUserPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedUserPackage(pkg)}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col gap-2 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500/50 shadow-sm ring-1 ring-blue-500' 
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                            <Users className="h-4.5 w-4.5" />
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                              {pkg.Currency_code || 'INR'} {pkg.Total_Amount}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                              {pkg.AdditionalUser_Id}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1">
                          <h3 className={`text-sm font-bold ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {pkg.No_Of_Users} Users
                          </h3>
                          <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            {pkg.Currency_code} {pkg.Amount_Per_User} per user
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {loadingPackages && (
                  <div className="col-span-full p-4 text-center text-xs text-slate-500">
                    Loading packages...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Impact Preview */}
          <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">3</span>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Impact Preview
              </h3>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                <div className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/10 dark:bg-slate-950/10">
                  <span className="text-[9px] uppercase font-black text-slate-450 tracking-wider">Plan</span>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white mt-1">
                    {instance?.Plan_name || instance?.Plan_Id?.Plan_Name || instance?.Subscription_Name}
                  </p>
                </div>

                <div className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/10 dark:bg-slate-950/10">
                  <span className="text-[9px] uppercase font-black text-slate-455 tracking-wider">Current Users</span>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white mt-1">{currentUsers} Users</p>
                </div>

                <div className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/10 dark:bg-slate-950/10">
                  <span className="text-[9px] uppercase font-black text-slate-455 tracking-wider">New Users</span>
                  <p className="text-xs font-extrabold text-slate-850 dark:text-white mt-1">{newUsersCount} Users</p>
                </div>

                <div className="p-3.5 border border-slate-100 dark:border-slate-850 rounded-xl bg-slate-50/10 dark:bg-slate-950/10">
                  <span className="text-[9px] uppercase font-black text-slate-455 tracking-wider">Change</span>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    +{selectedUserPackage?.No_Of_Users || 0} Users
                  </p>
                </div>

              </div>

              {/* Blue Info Footer */}
              <div className="flex items-center gap-2 p-3 border border-blue-100 dark:border-blue-955/40 bg-blue-50/20 dark:bg-blue-950/10 rounded-2xl text-xs font-bold text-blue-800 dark:text-blue-400">
                <Info className="h-4.5 w-4.5 shrink-0 text-blue-500" />
                <span>Charges will be prorated and reflected in your next invoice.</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Subscription Summary Card */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-855 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Subscription Summary
              </h3>
            </div>
            
            <CardContent className="p-5 space-y-4">
              
              {/* Instance Details */}
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Instance</span>
                <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">{instance?.Customername || instance?.Customer_Name}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{instance?.TenantSubscription_Id || instance?.Subscription_Id}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Plan / Edition</span>
                <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">
                  {instance?.Plan_name || instance?.Plan_Id?.Plan_Name || instance?.Subscription_Name}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Billing Cycle</span>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{instance?.SubscriptionPeriod || 30} days</p>
              </div>

              <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />

              {/* User Summary */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider">User Summary</span>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Current Users</span>
                  <span className="font-extrabold text-slate-850 dark:text-slate-100">{currentUsers}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">New Users</span>
                  <span className="font-extrabold text-slate-850 dark:text-slate-100">{newUsersCount}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Change</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    +{selectedUserPackage?.No_Of_Users || 0}
                  </span>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>



    </div>
  );
}
