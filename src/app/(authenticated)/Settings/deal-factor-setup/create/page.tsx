'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { useDealFactorStore } from '@/store/useDealFactorStore';
import { createDealFactor, ApiDealFactor } from '@/service/api/Settings/deal-factor/api';

export default function CreateDealFactorPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { factors, addFactor } = useDealFactorStore();

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDataType, setFormDataType] = useState('Picklist');
  const [formImpact, setFormImpact] = useState('Positive');
  const [formWeight, setFormWeight] = useState<number>(1.0);
  const [formMandatory, setFormMandatory] = useState(false);
  const [formActive, setFormActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const parseAndShowError = (err: any, defaultMsg: string) => {
    console.error(err);
    const msg = err?.message || '';
    if (msg.includes('{') && msg.includes('}')) {
      try {
        const jsonStart = msg.indexOf('{');
        const jsonEnd = msg.lastIndexOf('}');
        const jsonStr = msg.substring(jsonStart, jsonEnd + 1);
        const errObj = JSON.parse(jsonStr);
        Object.entries(errObj).forEach(([key, val]) => {
          const message = Array.isArray(val) ? val.join(', ') : String(val);
          toast.error(`${key}: ${message}`);
        });
        return;
      } catch (e) {
        console.error('Failed to parse error JSON from message:', e);
      }
    }
    toast.error(msg || defaultMsg);
  };

  // Submit Handler
  const handleCreateFactor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDescription.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 1;

    setIsSaving(true);

    const newPayload: Partial<ApiDealFactor> = {
      Organization_Id: 1,
      Factor_Name: formName,
      Description: formDescription,
      Data_Type: formDataType,
      Impact: formImpact,
      Weight: formWeight,
      Is_Mandatory: formMandatory,
      Sort_Order: factors.length + 1,
      Active_Flag: formActive,
      Is_Deleted: false,
      Created_By: userId,
      Updated_By: userId
    };

    createDealFactor(newPayload, token)
      .then((created) => {
        addFactor(created);
        toast.success(`Factor "${formName}" created successfully.`);
        router.push('/Settings/deal-factor-setup');
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to create factor on server.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 text-left p-1">

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => router.push('/')} className="cursor-pointer hover:text-slate-600">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-slate-400">Sales</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => router.push('/Settings/deal-factor-setup')} className="cursor-pointer hover:text-slate-600">Deal Factor Setup</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-350">Add Factor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Section */}
      <div className="py-2 border-b dark:border-slate-900">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Add New Deal Factor
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">
          Set up variables to weight and evaluate deal pipeline win success probabilities.
        </p>
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl shadow-2xs overflow-hidden max-w-2xl"
      >
        <div className="px-6 py-5 border-b dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
          <h3 className="text-sm font-extrabold text-slate-850 dark:text-white">
            New Factor Details
          </h3>
        </div>
        <form onSubmit={handleCreateFactor} className="p-6 space-y-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Factor Name *</label>
              <Input 
                placeholder="e.g. Budget Fit" 
                value={formName} 
                onChange={(e) => setFormName(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description *</label>
              <textarea 
                className="w-full min-h-[100px] p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-805 dark:text-slate-105"
                placeholder="Describe what this factor measures..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Data Type</label>
                <select 
                  value={formDataType} 
                  onChange={(e) => setFormDataType(e.target.value)}
                  className="w-full h-9.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800 dark:text-white"
                >
                  <option value="Picklist">Picklist</option>
                  <option value="Boolean">Boolean</option>
                  <option value="Number">Number</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Impact</label>
                <select 
                  value={formImpact} 
                  onChange={(e) => setFormImpact(e.target.value)}
                  className="w-full h-9.5 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-800 dark:text-white"
                >
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Weight *</label>
              <Input 
                type="number"
                step="0.1"
                placeholder="e.g. 8.5"
                value={formWeight} 
                onChange={(e) => setFormWeight(parseFloat(e.target.value) || 0)} 
                required 
              />
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="form-mandatory" 
                  checked={formMandatory}
                  onCheckedChange={(checked) => setFormMandatory(!!checked)}
                  className="border-slate-300 rounded"
                />
                <label htmlFor="form-mandatory" className="text-xs font-semibold text-slate-650 dark:text-slate-450 cursor-pointer">
                  Mandatory Factor
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="form-active" 
                  checked={formActive}
                  onCheckedChange={(checked) => setFormActive(!!checked)}
                  className="border-slate-300 rounded"
                />
                <label htmlFor="form-active" className="text-xs font-semibold text-slate-650 dark:text-slate-450 cursor-pointer">
                  Active Status
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-900">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/Settings/deal-factor-setup')}
              className="h-10 px-5 text-xs font-bold rounded-xl border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              style={{ backgroundColor: primaryColor }} 
              className="h-10 px-6 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-all shadow-xs"
              disabled={isSaving}
            >
              {isSaving ? 'Creating...' : 'Add Factor'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
