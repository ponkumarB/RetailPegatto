'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useLicenseStore } from '@/store/useLicenseStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FilePlus2,
  Users,
  UserPlus,
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
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function LicenseEditPage() {
  const router = useRouter();
  const params = useParams();
  const { primaryColor } = useStore();
  const { licenses, updateLicense } = useLicenseStore();

  const licenseId = params.id as string;
  const license = useMemo(() => licenses.find(l => l.id === licenseId), [licenses, licenseId]);

  // Form State
  const currentPlan = 'Professional Plan';
  const currentLicensesCount = 10;

  const [additionalLicenses, setAdditionalLicenses] = useState<number>(5);
  const [reason, setReason] = useState<string>('Team Expansion');
  const [justification, setJustification] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [duration, setDuration] = useState<string>('12 Months');
  const [fileName, setFileName] = useState<string | null>(null);

  // Pre-populate form when record is retrieved
  useEffect(() => {
    if (license) {
      setAdditionalLicenses(license.additionalLicenses);
      setReason(license.reason);
      setJustification(license.justification || '');
      setDuration(license.duration);
      
      // Parse dates to standard YYYY-MM-DD for input
      let standardDate = '';
      if (license.startDate) {
        const dObj = new Date(license.startDate);
        if (!isNaN(dObj.getTime())) {
          const year = dObj.getFullYear();
          const month = String(dObj.getMonth() + 1).padStart(2, '0');
          const day = String(dObj.getDate()).padStart(2, '0');
          standardDate = `${year}-${month}-${day}`;
        }
      }
      setStartDate(standardDate);
    }
  }, [license]);

  // Derived calculations
  const totalLicenses = useMemo(() => {
    return currentLicensesCount + (additionalLicenses || 0);
  }, [additionalLicenses]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      toast.success(`File "${e.target.files[0].name}" uploaded successfully.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!additionalLicenses || !reason || !startDate || !duration) {
      toast.error('Please fill in all required fields.');
      return;
    }

    updateLicense(licenseId, {
      additionalLicenses,
      totalLicenses,
      reason,
      justification,
      startDate: formattedDate,
      duration,
    });

    toast.success(`CRM license request "${licenseId}" updated successfully!`);
    router.push('/add-ons/crm-license-request');
  };

  if (!license) {
    return (
      <div className="py-20 text-center font-bold text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Info className="h-10 w-10 text-slate-400" />
          <span>License request not found.</span>
          <Button variant="outline" onClick={() => router.push('/add-ons/crm-license-request')}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Title Header with Back Button */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/add-ons/crm-license-request')}
          className="h-9 w-9 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Edit License Request: {license.id}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modify the request details or justification for admin review.
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
                <span>{currentLicensesCount} Users</span>
              </div>
            </div>
          </div>

          {/* Additional Required & Total After Request (Inline row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Additional Licenses Required *</label>
              <input
                type="number"
                min="1"
                required
                value={additionalLicenses}
                onChange={(e) => setAdditionalLicenses(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-750 dark:text-slate-350">Total Licenses After Request</label>
              <div className="flex items-center gap-2 px-3 py-2 text-xs font-extrabold border rounded-xl bg-blue-50/20 dark:bg-blue-950/20 border-blue-100/50 dark:border-blue-900/50 text-blue-600 dark:text-blue-400">
                <span>{totalLicenses} Users</span>
              </div>
            </div>
          </div>

          {/* Reason for Additional License */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Reason for Additional License *</label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none appearance-none cursor-pointer"
              >
                <option value="Team Expansion">Team Expansion</option>
                <option value="Department Growth">Department Growth</option>
                <option value="Temporary Project Staff">Temporary Project Staff</option>
                <option value="Other">Other</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
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

          {/* Preferred Start Date & Expected Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Expected Duration</label>
              <div className="relative">
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-955 text-slate-855 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none appearance-none cursor-pointer"
                >
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="12 Months">12 Months</option>
                  <option value="24 Months">24 Months</option>
                  <option value="Ongoing">Ongoing</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Upload Supporting Document */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Upload Supporting Document (Optional)</label>
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
              onClick={() => router.push('/add-ons/crm-license-request')}
              className="h-10 px-5 text-sm font-bold border rounded-xl hover:bg-slate-50 transition-colors text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 px-5 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors border-none flex items-center gap-1.5"
            >
              <Send className="h-4 w-4" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>

        {/* Right Column - License Summary & How It Works */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 space-y-5">
            <h2 className="text-md font-bold text-emerald-600 dark:text-emerald-400 border-b border-slate-50 dark:border-slate-855 pb-2 text-left">
              License Summary
            </h2>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              
              {/* Current */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-955/50 rounded-lg text-blue-600 shrink-0">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Current Licenses</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{currentLicensesCount}</p>
                  <span className="text-[9px] font-semibold text-slate-400">Active Users</span>
                </div>
              </div>

              {/* Additional Requested */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600 shrink-0">
                  <UserPlus className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Additional Requested</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{additionalLicenses || 0}</p>
                  <span className="text-[9px] font-semibold text-slate-400">Users</span>
                </div>
              </div>

              {/* Total After Request */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 bg-purple-50 dark:bg-purple-955/50 rounded-lg text-purple-600 shrink-0">
                  <Layers className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total After Request</p>
                  <p className="text-xs font-black text-slate-850 dark:text-white mt-0.5 truncate">{totalLicenses}</p>
                  <span className="text-[9px] font-semibold text-slate-400">Users</span>
                </div>
              </div>

              {/* Effective From */}
              <div className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 bg-amber-50 dark:bg-amber-955/50 rounded-lg text-amber-600 shrink-0">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Effective From</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">{formattedDate}</p>
                </div>
              </div>

            </div>
          </div>

          {/* How It Works Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 text-left space-y-4 relative overflow-hidden">
            <h3 className="text-sm font-bold text-blue-650 dark:text-blue-400">
              How It Works
            </h3>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">1</span>
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Submit your additional license request.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">2</span>
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Our team will review your request.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">3</span>
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">You will receive approval & invoice.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-blue-50 dark:bg-blue-955/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">4</span>
                  <p className="text-xs font-semibold text-slate-655 dark:text-slate-350">Licenses will be activated once payment is confirmed.</p>
                </div>
              </div>

              {/* Graphic container */}
              <div className="hidden sm:flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl w-32 shrink-0">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-2">Verified</span>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-1 text-center">Admin Checked</span>
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
              <li>Additional licenses will be billed as per your current plan rates.</li>
              <li>For any queries, contact <span className="text-blue-600 dark:text-blue-400 hover:underline">support@crmfarmit.com</span></li>
            </ul>
          </div>

        </div>

      </div>

      {/* Footer Banner Info */}
      <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 text-left">
        <Info className="h-5 w-5 text-blue-500 shrink-0" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          Click Save Changes to update your additional CRM license request. Your modifications will be reviewed by administrators.
        </p>
      </div>

    </div>
  );
}
