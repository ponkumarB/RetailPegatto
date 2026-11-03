'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { ArrowLeft, Save, Target } from 'lucide-react';
import { useCreateCompetitorMaster } from '@/service/api/CompetitorTracking/queries';

export default function CreateCompetitorPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const createMutation = useCreateCompetitorMaster();

  const [formData, setFormData] = useState({
    Competitor_Name: '',
    Website: '',
    Category: 'CRM',
    Starting_Price: '',
    Tracking_Status: 'Active',
    Description: '',
  });

  const handleChange = (field: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value || '' }));
  };

  const handleSave = () => {
    if (!formData.Competitor_Name.trim()) return toast.error('Competitor Name is required.');
    if (!formData.Website.trim()) return toast.error('Website is required.');

    const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) || 1 : 1;

    const payload: any = {
      ...formData,
      Created_By: userId,
      Updated_By: userId,
    };

    if (formData.Starting_Price) {
      payload.Starting_Price = Number(formData.Starting_Price);
    } else {
      delete payload.Starting_Price;
    }

    if (!payload.Description) delete payload.Description;

    createMutation.mutate(payload, {
      onSuccess: () => {
        router.push('/administration/competitor-tracking');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 text-left pb-24 max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="hover:text-slate-600 transition-colors">Administration</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/administration/competitor-tracking" className="hover:text-slate-600 transition-colors">
              Competitor Tracking
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Create Competitor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="h-6 w-6" style={{ color: primaryColor }} />
              Create Competitor
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Add a new competitor profile to your tracking index.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-9 font-bold text-xs"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            className="h-9 font-bold text-xs text-white flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
            onClick={handleSave}
            disabled={createMutation.isPending}
          >
            <Save className="h-4 w-4" />
            {createMutation.isPending ? 'Saving...' : 'Save Competitor'}
          </Button>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border dark:border-slate-800 shadow-sm rounded-xl">
        <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl">
          <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            General Information
          </CardTitle>
          <CardDescription className="text-xs font-semibold">
            Essential tracking details and category tags.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Competitor Name *</Label>
              <Input
                placeholder="e.g. Zoho CRM"
                value={formData.Competitor_Name}
                onChange={(e) => handleChange('Competitor_Name', e.target.value)}
                className="h-10 text-xs rounded-lg bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white focus:ring-1 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Website *</Label>
              <Input
                placeholder="e.g. zoho.com/crm"
                value={formData.Website}
                onChange={(e) => handleChange('Website', e.target.value)}
                className="h-10 text-xs rounded-lg bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white focus:ring-1 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</Label>
              <Select value={formData.Category} onValueChange={(val) => handleChange('Category', val)}>
                <SelectTrigger className="h-10 text-xs rounded-lg bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="CRM">CRM</SelectItem>
                  <SelectItem value="ERP">ERP</SelectItem>
                  <SelectItem value="HRM">HRM</SelectItem>
                  <SelectItem value="Billing">Billing</SelectItem>
                  <SelectItem value="Analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Starting Price ($)</Label>
              <Input
                type="number"
                placeholder="e.g. 14"
                value={formData.Starting_Price}
                onChange={(e) => handleChange('Starting_Price', e.target.value)}
                className="h-10 text-xs rounded-lg bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:bg-white focus:ring-1 transition-all"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tracking Status</Label>
              <Select value={formData.Tracking_Status} onValueChange={(val) => handleChange('Tracking_Status', val)}>
                <SelectTrigger className="h-10 text-xs rounded-lg bg-slate-50/50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2 mt-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Profile Summary & Notes</Label>
              <textarea
                placeholder="Provide a brief summary profile, strengths, weaknesses, etc..."
                value={formData.Description}
                onChange={(e) => handleChange('Description', e.target.value)}
                className="h-32 p-3 text-xs bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg resize-none focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all"
              />
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
