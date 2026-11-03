'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAddReduceUsersStore } from '@/store/useAddReduceUsersStore';
import { getUserAddOrCancelLicenseList, updateAddLicenseRequest } from '@/service/api/add-ons/add-reduce-users';
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
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditAddReduceUsersPage() {
  const router = useRouter();
  const { id } = useParams();
  const { primaryColor } = useStore();
  const { records, updateRecord } = useAddReduceUsersStore();

  const recordIdStr = Array.isArray(id) ? id[0] : id;

  const [existingRecord, setExistingRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Adjust users count state
  const [newUsersCount, setNewUsersCount] = useState(1);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await getUserAddOrCancelLicenseList();
        const apiRecords = response?.results || response?.data || [];
        const record = apiRecords.find((r: any) => String(r.id) === recordIdStr);
        setExistingRecord(record);
        if (record) {
          setNewUsersCount(Number(record.Requestedusers) || (Number(record.Noofusers) || 1));
        }
      } catch (error) {
        console.error('Failed to fetch request:', error);
        toast.error('Failed to fetch request details');
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [recordIdStr]);

  if (loading) {
    return <div className="p-10 text-center">Loading request details...</div>;
  }

  if (!existingRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <h2 className="text-lg font-black text-slate-800 dark:text-white">Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">The request with ID {id} does not exist.</p>
        <Button onClick={() => router.push('/add-ons/add-reduce-users')} style={{ backgroundColor: primaryColor }} className="text-xs text-white rounded-xl">
          Back to List
        </Button>
      </div>
    );
  }

  // Derived calculations
  // Derived calculations
  const currentUsers = Number(existingRecord.Noofusers) || 0;
  const changeValue = newUsersCount - currentUsers;

  const handleIncrement = () => {
    setNewUsersCount(prev => Math.min(500, prev + 1));
  };

  const handleDecrement = () => {
    setNewUsersCount(prev => Math.max(1, prev - 1));
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUsersCount(parseInt(e.target.value) || 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      Licensereqid: existingRecord.Licensereqid,
      Subscription_Id: existingRecord.Subscription_Id?.Subscription_Id || existingRecord.Subscription_Id || "SUB000000003",
      Customer_Id: existingRecord.Customer_Id || 1,
      Plan_Id: existingRecord.Plan_Id?.id || existingRecord.Plan_Id || 2,
      Customername: existingRecord.Customername || "Tesla",
      Planname: existingRecord.Planname || "Platinum",
      Requested_By: existingRecord.Requested_By || "admin",
      Noofusers: currentUsers,
      Addorcancel: changeValue > 0 ? "Add" : "Reduce",
      Addtionalusers: Math.abs(changeValue),
      Requestedusers: String(newUsersCount),
      Organization_Id: existingRecord.Organization_Id || 1,
      Created_By: existingRecord.Created_By || 1,
      Updated_By: existingRecord.Updated_By || 1
    };

    try {
      await updateAddLicenseRequest(payload);
      toast.success(`User modification request updated successfully!`);
      router.push('/add-ons/add-reduce-users');
    } catch (error) {
      console.error('Error saving license request:', error);
      toast.error('Failed to update request');
    }
  };

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header Row (No Breadcrumbs) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl w-full md:w-auto flex-1">
          <div className="p-3 bg-blue-50 dark:bg-blue-955/40 rounded-full shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-450 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Edit User Adjustment Request: {existingRecord.Licensereqid || existingRecord.id}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Modify the requested user count for your subscription.
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
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Info Warning Banner */}
      <div className="flex items-start gap-2.5 p-3.5 border border-blue-100/70 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-950/20 rounded-2xl text-xs font-bold text-blue-800 dark:text-blue-400">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <span>Adjust users from your subscription. Changes will be effective immediately upon approval.</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Selected Instance */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">1</span>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Selected Instance
              </h3>
            </div>
            <CardContent className="p-5">
              <div className="space-y-1.5 max-w-sm">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Instance</Label>
                <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-955/40 text-xs font-semibold text-slate-500">
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">{existingRecord.Customername || existingRecord.Customer_Name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{existingRecord.Subscription_Id?.Subscription_Id || existingRecord.Subscription_Id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Current Usage & Adjust Users */}
          <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">2</span>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Current Usage & Adjust Users
              </h3>
            </div>
            
            <CardContent className="p-6 space-y-6">
              
              {/* Adjuster Flexbox */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* Current Users Panel */}
                <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-955/20 p-5 rounded-2xl text-center space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-455 tracking-wider">Current Users</span>
                  <div className="text-2xl font-black text-blue-605 flex items-center justify-center gap-1.5">
                    <span>{currentUsers}</span>
                  </div>
                  <p className="text-[10px] text-slate-455 font-bold">of {currentUsers} Users</p>
                </div>

                {/* Adjust Users Panel */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <span className="text-[10px] uppercase font-black text-slate-455 tracking-wider">Adjust Number of Users</span>
                  <div className="flex items-center border border-slate-250 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-955 max-w-[160px]">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={newUsersCount}
                      onChange={handleSliderChange}
                      className="w-full text-center text-sm font-black text-slate-900 dark:text-white bg-transparent border-none outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between w-full text-[9px] text-slate-455 font-extrabold px-1">
                    <span>Min: 1</span>
                    <span>Max: 500</span>
                  </div>
                </div>

                {/* New Users Panel */}
                <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-955/20 p-5 rounded-2xl text-center space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-455 tracking-wider">New Users</span>
                  <div className="text-2xl font-black text-blue-605 flex items-center justify-center gap-1.5">
                    <span>{newUsersCount}</span>
                  </div>
                  <p className="text-[10px] text-slate-450 font-bold">Users</p>
                </div>

              </div>

              {/* Slider Input */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="1"
                  max="500"
                  value={newUsersCount}
                  onChange={handleSliderChange}
                  style={{ accentColor: primaryColor }}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-end text-[10px] font-bold text-slate-500 pr-1">
                  <span>{newUsersCount} Users</span>
                </div>
              </div>

              {/* Success Info Banner */}
              <div className="flex items-center gap-2 p-3 border border-emerald-100 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-955/10 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-450">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                <span>Increase or decrease the number of users using the controls above.</span>
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
                  <span className="text-[9px] uppercase font-black text-slate-455 tracking-wider">Plan</span>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white mt-1">{existingRecord.Planname}</p>
                </div>

                <div className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/10 dark:bg-slate-950/10">
                  <span className="text-[9px] uppercase font-black text-slate-455 tracking-wider">Current Users</span>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white mt-1">{currentUsers} Users</p>
                </div>

                <div className="p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/10 dark:bg-slate-950/10">
                  <span className="text-[9px] uppercase font-black text-slate-455 tracking-wider">New Users</span>
                  <p className="text-xs font-extrabold text-slate-850 dark:text-white mt-1">{newUsersCount} Users</p>
                </div>

                <div className="p-3.5 border border-slate-100 dark:border-slate-805 rounded-xl bg-slate-50/10 dark:bg-slate-950/10">
                  <span className="text-[9px] uppercase font-black text-slate-455 tracking-wider">Change</span>
                  <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {changeValue >= 0 ? `+${changeValue}` : changeValue} Users
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
                <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">{existingRecord.Customername || existingRecord.Customer_Name}</p>
                <p className="text-[10px] text-slate-400 font-semibold">{existingRecord.Subscription_Id?.Subscription_Id || existingRecord.Subscription_Id}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Plan / Edition</span>
                <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">{existingRecord.Planname}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Billing Cycle</span>
                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{existingRecord.SubscriptionPeriod || '30 days'}</p>
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
                    {changeValue >= 0 ? `+${changeValue}` : changeValue}
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
