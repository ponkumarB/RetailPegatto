'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useRenewalStore } from '@/store/useRenewalStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RefreshCw,
  Users,
  Calendar,
  Layers,
  UploadCloud,
  ChevronDown,
  X,
  Send,
  Info,
  Award,
  CheckCircle,
  ShieldAlert,
  Monitor,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

// Define Plan Packages Catalog
const PLAN_CATALOG: Record<string, { name: string; users: number; costPerMonth: number }> = {
  'Professional Plan - 10 Users': {
    name: 'Professional Plan - 10 Users',
    users: 10,
    costPerMonth: 10000
  },
  'Professional Plan - 20 Users': {
    name: 'Professional Plan - 20 Users',
    users: 20,
    costPerMonth: 18000
  },
  'Starter Plan - 5 Users': {
    name: 'Starter Plan - 5 Users',
    users: 5,
    costPerMonth: 5000
  },
  'Enterprise Plan - 50 Users': {
    name: 'Enterprise Plan - 50 Users',
    users: 50,
    costPerMonth: 45000
  }
};

export default function RenewalCreatePage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { addRenewal } = useRenewalStore();

  // Current Info (Readonly)
  const currentPlan = 'Professional Plan';
  const currentLicenses = 10;

  // Form State
  const [expiryDate, setExpiryDate] = useState<string>('2024-05-20');
  const [renewalDuration, setRenewalDuration] = useState<string>('12 Months');
  const [planPackage, setPlanPackage] = useState<string>('Professional Plan - 10 Users');
  const [numUsers, setNumUsers] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>('2024-05-21');
  const [reason, setReason] = useState<string>(
    'We are satisfied with CRMFarm IT and would like to continue using the platform for our business operations.'
  );
  const [justification, setJustification] = useState<string>(
    'CRMFarm IT helps us manage leads, automate workflows and improve team productivity.'
  );
  const [fileName, setFileName] = useState<string | null>(null);

  // Sync users count when plan package changes
  useEffect(() => {
    const selectedPlan = PLAN_CATALOG[planPackage];
    if (selectedPlan) {
      setNumUsers(selectedPlan.users);
    }
  }, [planPackage]);

  // Sync Start Date to Expiry Date + 1 Day automatically
  useEffect(() => {
    if (expiryDate) {
      const expDate = new Date(expiryDate);
      if (!isNaN(expDate.getTime())) {
        expDate.setDate(expDate.getDate() + 1);
        const year = expDate.getFullYear();
        const month = String(expDate.getMonth() + 1).padStart(2, '0');
        const day = String(expDate.getDate()).padStart(2, '0');
        setStartDate(`${year}-${month}-${day}`);
      }
    }
  }, [expiryDate]);

  // Derived calculations: Duration Months
  const durationMonths = useMemo(() => {
    const months = parseInt(renewalDuration) || 12;
    return months;
  }, [renewalDuration]);

  // Calculated End Date based on Start Date + Duration Months
  const calculatedEndDate = useMemo(() => {
    if (!startDate) return '';
    const stDate = new Date(startDate);
    if (isNaN(stDate.getTime())) return '';
    
    stDate.setMonth(stDate.getMonth() + durationMonths);
    stDate.setDate(stDate.getDate() - 1); // e.g. Start May 21, 2024 -> End May 20, 2025
    
    return stDate.toISOString().split('T')[0];
  }, [startDate, durationMonths]);

  // Format dates for display
  const formattedExpiryDate = useMemo(() => {
    if (!expiryDate) return '';
    const dObj = new Date(expiryDate);
    return isNaN(dObj.getTime()) ? expiryDate : dObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [expiryDate]);

  const formattedStartDate = useMemo(() => {
    if (!startDate) return '';
    const dObj = new Date(startDate);
    return isNaN(dObj.getTime()) ? startDate : dObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [startDate]);

  const formattedEndDate = useMemo(() => {
    if (!calculatedEndDate) return '';
    const dObj = new Date(calculatedEndDate);
    return isNaN(dObj.getTime()) ? calculatedEndDate : dObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [calculatedEndDate]);

  // Calculate Total Amount
  const totalAmount = useMemo(() => {
    const selectedPlan = PLAN_CATALOG[planPackage];
    if (!selectedPlan) return 0;
    return selectedPlan.costPerMonth * durationMonths;
  }, [planPackage, durationMonths]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      toast.success(`File "${e.target.files[0].name}" uploaded successfully.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!expiryDate || !startDate || !planPackage || !reason) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const newRequest = {
      id: `REN-${Math.floor(100 + Math.random() * 900)}`,
      currentPlan,
      currentLicenses,
      expiryDate: formattedExpiryDate,
      renewalDuration,
      planPackage,
      numUsers,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      reason,
      justification,
      totalAmount,
      status: 'Pending Approval' as const,
      createdAt: new Date().toISOString().split('T')[0]
    };

    addRenewal(newRequest);
    toast.success(`Renewal request submitted successfully!`);
    router.push('/add-ons/renewal-request');
  };

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Title Header with Document Green Icon */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-full shrink-0 border border-emerald-100 dark:border-emerald-900/50">
          <RefreshCw className="h-6 w-6 text-emerald-600 dark:text-emerald-450" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            CRMFarm IT Renewal Request
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Submit a renewal request to continue uninterrupted access to CRMFarm IT services.
          </p>
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column - Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5 bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-850 rounded-3xl">
          <h2 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-850 pb-2">
            Renewal Details
          </h2>

          {/* Current Plan & Current Licenses (Inline row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Current Plan</label>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold border rounded-xl bg-slate-50/50 dark:bg-slate-955/60 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Award className="h-4 w-4 text-emerald-650 shrink-0" />
                <span>{currentPlan}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Current Licenses</label>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold border rounded-xl bg-slate-50/50 dark:bg-slate-955/60 border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <Users className="h-4 w-4 text-blue-500 shrink-0" />
                <span>{currentLicenses} Users</span>
              </div>
            </div>
          </div>

          {/* Current Plan Expiry Date & Renewal For (Inline row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Current Plan Expiry Date *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-955 text-slate-855 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-705 dark:text-slate-355">Renewal For</label>
              <div className="relative">
                <select
                  value={renewalDuration}
                  onChange={(e) => setRenewalDuration(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none appearance-none cursor-pointer"
                >
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="12 Months">12 Months</option>
                  <option value="24 Months">24 Months</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Plan / Package select with Captions */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Plan / Package *</label>
            <div className="relative">
              <select
                value={planPackage}
                onChange={(e) => setPlanPackage(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-955 text-slate-855 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none appearance-none cursor-pointer"
              >
                {Object.keys(PLAN_CATALOG).map((key) => (
                  <option key={key} value={key}>
                    {PLAN_CATALOG[key].name} (₹{PLAN_CATALOG[key].costPerMonth.toLocaleString()}/Month)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              ₹ {PLAN_CATALOG[planPackage]?.costPerMonth.toLocaleString()} / Month (excludes taxes)
            </p>
          </div>

          {/* Number of Users & Renewal Start Date (Inline row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-705 dark:text-slate-355">Number of Users</label>
              <input
                type="number"
                min="1"
                required
                value={numUsers}
                onChange={(e) => setNumUsers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
              />
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Total Users: {numUsers}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Renewal Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Reason for Renewal */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Reason for Renewal *</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
            />
          </div>

          {/* Business Justification */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-705 dark:text-slate-350">Business Justification / Notes (Optional)</label>
            <textarea
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Provide a business justification or notes for approval..."
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-855 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
            />
          </div>

          {/* Upload PO / Document */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Upload Purchase Order / Supporting Document (Optional)</label>
            <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/30 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {fileName ? fileName : 'Drag & drop files here or click to browse'}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">PDF, JPG, PNG (Max. 5MB)</p>
            </div>
          </div>

          {/* Buttons row */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-850">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/add-ons/renewal-request')}
              className="h-10 px-5 text-sm font-bold border rounded-xl hover:bg-slate-50 transition-colors text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 px-5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors border-none flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              <span>Submit Renewal Request</span>
            </Button>
          </div>
        </form>

        {/* Right Column - Renewal Summary & How It Works */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 space-y-5">
            <h2 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-855 pb-2 text-left">
              Renewal Summary
            </h2>
            
            <div className="space-y-4 text-left">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Plan Package */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5 col-span-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 shrink-0">
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Plan / Package</p>
                    <p className="text-xs font-black text-slate-850 dark:text-white mt-0.5 truncate">{planPackage}</p>
                  </div>
                </div>

                {/* Number of Users */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5">
                  <div className="p-2 bg-blue-50 dark:bg-blue-955/50 rounded-lg text-blue-600 shrink-0">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Number of Users</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{numUsers}</p>
                  </div>
                </div>

                {/* Duration */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-955/40 rounded-2xl flex items-start gap-2.5">
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg text-purple-600 shrink-0">
                    <Layers className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Duration</p>
                    <p className="text-xs font-black text-slate-850 dark:text-white mt-0.5 truncate">{renewalDuration}</p>
                  </div>
                </div>

                {/* Renewal Start Date */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-955/40 rounded-2xl flex items-start gap-2.5">
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/50 rounded-lg text-purple-600 shrink-0">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Renewal Start Date</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{formattedStartDate}</p>
                  </div>
                </div>

                {/* Renewal End Date */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-955/40 rounded-2xl flex items-start gap-2.5">
                  <div className="p-2 bg-amber-50 dark:bg-amber-955/50 rounded-lg text-amber-600 shrink-0">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Renewal End Date</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{formattedEndDate}</p>
                  </div>
                </div>
              </div>

              {/* Total Amount (Excl Taxes) in Indian standard format */}
              <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl">
                    <span className="font-extrabold text-sm">₹</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Amount (Excl. Taxes)</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-450 mt-0.5">₹ {totalAmount.toLocaleString()}</p>
                  </div>
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
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Continued access to all CRMFarm IT features</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Secure and reliable platform</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Regular updates and new features</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Dedicated support from our team</p>
                </div>
              </div>

              {/* Monitor checkmark shield graphic */}
              <div className="hidden sm:flex flex-col items-center justify-center bg-blue-50/20 dark:bg-slate-955/30 border border-blue-100/50 dark:border-slate-850 p-3.5 rounded-2xl w-36 shrink-0 relative overflow-hidden">
                <div className="relative flex items-center justify-center">
                  <Monitor className="h-16 w-16 text-slate-700 dark:text-slate-400" />
                  <ShieldCheck className="h-7 w-7 text-emerald-500 absolute top-3.5" />
                  <RefreshCw className="h-4 w-4 text-emerald-600 absolute right-2.5 top-1 bg-white dark:bg-slate-900 rounded-full p-0.5 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-2">Verified Secure</span>
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
              <li>Please ensure your renewal request is submitted before the expiry date to avoid any service interruption.</li>
              <li>Renewal will be processed after approval from the admin team.</li>
              <li>For any queries, contact <span className="text-blue-600 dark:text-blue-400 hover:underline">support@crmfarmit.com</span></li>
            </ul>
          </div>

        </div>

      </div>

      {/* Footer Banner Info */}
      <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-955/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 text-left">
        <Info className="h-5 w-5 text-blue-500 shrink-0" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          Click Submit Renewal Request to send your request for admin approval. You will receive a notification once your renewal is processed.
        </p>
      </div>

    </div>
  );
}
