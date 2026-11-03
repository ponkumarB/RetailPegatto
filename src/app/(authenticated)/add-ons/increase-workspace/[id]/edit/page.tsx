'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useIncreaseWorkspaceStore } from '@/store/useIncreaseWorkspaceStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Database,
  Info,
  X,
  Plus,
  Minus,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditIncreaseWorkspacePage() {
  const router = useRouter();
  const { id } = useParams();
  const { primaryColor } = useStore();
  const { records, updateRecord } = useIncreaseWorkspaceStore();

  const recordIdStr = Array.isArray(id) ? id[0] : id;
  const existingRecord = records.find(r => r.id === recordIdStr);

  // Additional space state
  const [additionalSpace, setAdditionalSpace] = useState(10);
  const [confirmed, setConfirmed] = useState(true);

  useEffect(() => {
    if (existingRecord) {
      setAdditionalSpace(existingRecord.additionalSizeGb);
    }
  }, [existingRecord]);

  if (!existingRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
        <h2 className="text-lg font-black text-slate-805 dark:text-white">Record Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">The request with ID {id} does not exist.</p>
        <Button onClick={() => router.push('/add-ons/increase-workspace')} style={{ backgroundColor: primaryColor }} className="text-xs text-white rounded-xl">
          Back to List
        </Button>
      </div>
    );
  }

  // Derived variables
  const currentSizeGb = existingRecord.currentSizeGb;
  const usedSizeGb = existingRecord.usedSizeGb;
  const availableGb = currentSizeGb - usedSizeGb;
  const newSizeGb = currentSizeGb + additionalSpace;
  const percentUsed = ((usedSizeGb / currentSizeGb) * 100).toFixed(2);

  const handleIncrement = () => {
    setAdditionalSpace(prev => prev + 5);
  };

  const handleDecrement = () => {
    setAdditionalSpace(prev => Math.max(1, prev - 5));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirmed) {
      toast.error('Please confirm you understand the charges before proceeding.');
      return;
    }

    const updatedRecord = {
      additionalSizeGb: additionalSpace,
      newSizeGb,
    };

    updateRecord(existingRecord.id, updatedRecord);
    toast.success(`Request updated successfully!`);
    router.push('/add-ons/increase-workspace');
  };

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header Row (No Breadcrumbs) */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl w-full md:w-auto flex-1">
          <div className="p-3 bg-blue-50 dark:bg-blue-955/40 rounded-full shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Database className="h-6 w-6 text-blue-650 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Edit Workspace Request: {existingRecord.id}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Modify the requested additional workspace size for this instance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/add-ons/increase-workspace')}
            className="h-10 px-4 text-xs font-bold border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Instances</span>
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-2.5 p-3.5 border border-blue-100/70 dark:border-blue-950 bg-blue-50/30 dark:bg-blue-955/20 rounded-2xl text-xs font-bold text-blue-805 dark:text-blue-400">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <span>Modify workspace expansion request size. Changes will be effective upon approval.</span>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Selected Instance */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-650 text-white text-[10px] font-extrabold">1</span>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Selected Instance
              </h3>
            </div>
            <CardContent className="p-5">
              <div className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-955/40 text-xs font-semibold text-slate-500">
                <p className="font-extrabold text-slate-800 dark:text-slate-200">{existingRecord.instanceName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{existingRecord.instanceDomain}</p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Current Workspace Usage */}
          <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-650 text-white text-[10px] font-extrabold">2</span>
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Current Workspace Usage
              </h3>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                
                {/* Size Panel */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-455 tracking-wider">Current Workspace Size</span>
                  <div className="text-2xl font-black text-blue-605">{currentSizeGb} GB</div>
                  
                  {/* Progress bar */}
                  <div className="space-y-1 mt-2">
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${percentUsed}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-455 font-bold block">{usedSizeGb} GB used ({percentUsed}%)</span>
                  </div>
                </div>

                {/* Available space */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-slate-455 tracking-wider block">Available Space</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {availableGb.toFixed(2)} GB
                  </span>
                </div>

                {/* Last increased date */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black text-slate-455 tracking-wider block">Last Increased On</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    15 May 2024, 10:30 AM
                  </span>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Step 3: Increase Workspace */}
          <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-855 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-650 text-white text-[10px] font-extrabold">3</span>
              <h3 className="text-xs font-extrabold text-slate-905 dark:text-white uppercase tracking-wider">
                Increase Workspace
              </h3>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                {/* Left controls */}
                <div className="flex flex-wrap items-center gap-4 flex-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Additional Space *</Label>
                    <div className="flex items-center border border-slate-250 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-955 max-w-[140px]">
                      <button
                        type="button"
                        onClick={handleDecrement}
                        className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={additionalSpace}
                        onChange={(e) => setAdditionalSpace(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-center text-xs font-black text-slate-900 dark:text-white bg-transparent border-none outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleIncrement}
                        className="px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Green Box */}
                <div className="p-5 bg-emerald-50/20 dark:bg-emerald-955/10 border border-emerald-100 dark:border-emerald-950/40 rounded-2xl min-w-[200px] text-center space-y-1">
                  <div className="flex items-center gap-1.5 justify-center text-xs font-extrabold text-emerald-800 dark:text-emerald-450">
                    <CheckCircle className="h-4 w-4" />
                    <span>New Workspace Size</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-450 mt-1">{newSizeGb} GB</div>
                  <p className="text-[10px] text-slate-450 font-bold">({currentSizeGb} GB + {additionalSpace} GB)</p>
                </div>

              </div>

              {/* Blue Info Footer */}
              <div className="flex items-center gap-2 p-3 border border-blue-100 dark:border-blue-955/40 bg-blue-50/20 dark:bg-blue-950/10 rounded-2xl text-xs font-bold text-blue-805 dark:text-blue-400">
                <Info className="h-4.5 w-4.5 shrink-0 text-blue-500" />
                <span>The additional workspace will be allocated immediately and reflected in your instance.</span>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Confirmation */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-855 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-650 text-white text-[10px] font-extrabold">4</span>
              <h3 className="text-xs font-extrabold text-slate-905 dark:text-white uppercase tracking-wider">
                Confirmation
              </h3>
            </div>
            
            <CardContent className="p-5">
              <label className="flex items-start gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded mt-0.5"
                />
                <span>I understand that the workspace will be increased by the specified amount and applicable charges may be incurred.</span>
              </label>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Summary Card */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-855 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <HardDrive className="h-4.5 w-4.5 text-blue-650" />
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Summary
              </h3>
            </div>
            
            <CardContent className="p-5 space-y-4">
              
              {/* Instance Details */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-455 tracking-wider">Instance Details</span>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-405 block font-bold">Instance Name</span>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{existingRecord.instanceName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold">{existingRecord.instanceDomain}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-405 block font-bold">Database (Schema)</span>
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-mono">{existingRecord.databaseSchema}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-405 block font-bold">Plan / Edition</span>
                  <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">{existingRecord.planName}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-405 block font-bold">Database Server</span>
                  <p className="text-xs font-extrabold text-slate-850 dark:text-slate-200">{existingRecord.databaseServer}</p>
                </div>
              </div>

              <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />

              {/* Workspace Details */}
              <div className="space-y-2.5">
                <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Workspace Details</span>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Current Workspace Size</span>
                  <span className="font-extrabold text-slate-855 dark:text-slate-100">{currentSizeGb} GB</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Currently Used</span>
                  <span className="font-extrabold text-slate-855 dark:text-slate-100">{usedSizeGb} GB ({percentUsed}%)</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-500">Additional Space</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">+{additionalSpace} GB</span>
                </div>
              </div>

              <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800 my-2" />

              {/* New Workspace Size */}
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-850 dark:text-slate-200 font-extrabold">New Workspace Size</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{newSizeGb} GB</span>
              </div>

              {/* Yellow Prorated Box */}
              <div className="flex items-start gap-2 p-3 bg-amber-50/30 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/50 rounded-2xl text-[10px] font-bold text-amber-800 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-black">Note</p>
                  <p className="font-semibold leading-relaxed">Billing for the additional workspace will be prorated and added to your next invoice.</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </form>

      {/* Save / Cancel Footer Bar */}
      <div className="flex items-center justify-end gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-2xl">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/add-ons/increase-workspace')}
          className="h-10 px-5 text-xs font-bold border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!confirmed}
          onClick={handleSubmit}
          className="h-10 px-5 text-xs font-bold text-white rounded-xl shadow-md transition-all border-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </Button>
      </div>

    </div>
  );
}
