'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useProblems } from '@/service/api/Problem/queries';
import { useProblemCategoriesList } from '@/service/api/ProblemCategory/queries';
import { useSaveTroubleshootGuide, useTroubleshootGuide } from '@/service/api/TroubleshootGuide/queries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  FileText,
  X,
  Save,
  Info,
  Layers,
  AlertTriangle,
  ArrowUp,
  Wrench,
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
  GripVertical,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo2,
  Link,
  Smile,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { TroubleshootGuide } from '@/service/api/TroubleshootGuide/api';

const schema = z.object({
  Guide_Title: z.string().min(1, 'Guide Title is required'),
  Guide_Code: z.string().min(1, 'Guide Code is required'),
  Issue_Problem: z.number(),
  Category: z.string().min(1, 'Category is required'),
  Applies_To: z.string().min(1, 'Applies To is required'),
  Status: z.string().min(1, 'Status is required'),
  Priority: z.string().min(1, 'Priority is required'),
  Description: z.string().min(1, 'Description is required'),
  Symptoms: z.string().optional(),
  Root_Cause: z.string().optional(),
  Prerequisites: z.string().optional(),
  Notes: z.string().optional(),
  Review_Date: z.string().optional(),
  Version: z.string().optional(),
  Visibility: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditTroubleshootGuidePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const { primaryColor } = useStore();
  
  const { data: problemsRes } = useProblems();
  const problems = problemsRes?.results || [];
  const { data: categories = [] } = useProblemCategoriesList();
  
  const { data: guide, isLoading } = useTroubleshootGuide(id);
  const saveMutation = useSaveTroubleshootGuide();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      Guide_Title: '',
      Guide_Code: '',
      Issue_Problem: undefined as unknown as number,
      Category: '',
      Applies_To: '',
      Status: '',
      Priority: '',
      Description: '',
      Symptoms: '',
      Root_Cause: '',
      Prerequisites: '',
      Notes: '',
      Review_Date: '',
      Version: '',
      Visibility: '',
    }
  });

  // Troubleshoot Steps (Interactive list matching mockup)
  const [steps, setSteps] = useState<{ id: string, instruction: string }[]>([]);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // File attachments state
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (guide) {
      reset({
        Guide_Title: guide.Guide_Title || '',
        Guide_Code: guide.Guide_Code || '',
        Issue_Problem: typeof guide.Issue_Problem === 'object' && guide.Issue_Problem !== null ? guide.Issue_Problem.id : guide.Issue_Problem ? Number(guide.Issue_Problem) : undefined as unknown as number,
        Category: guide.Category || '',
        Applies_To: guide.Applies_To || '',
        Status: guide.Status || '',
        Priority: guide.Priority || '',
        Description: guide.Description || '',
        Symptoms: guide.Symptoms || '',
        Root_Cause: guide.Root_Cause || '',
        Prerequisites: guide.Prerequisites || '',
        Notes: guide.Notes || '',
        Review_Date: guide.Review_Date || '',
        Version: guide.Version || '',
        Visibility: guide.Visibility || '',
      });

      if (guide.Troubleshoot_Steps && Array.isArray(guide.Troubleshoot_Steps)) {
        setSteps(guide.Troubleshoot_Steps.map((step, index) => ({
          id: String(index),
          instruction: step
        })));
      }
    }
  }, [guide, reset]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFiles(prev => [...prev, e.target.files![0].name]);
      toast.success(`Attached "${e.target.files[0].name}"`);
    }
  };

  const handleAddStep = () => {
    const newStep = {
      id: Math.random().toString(),
      instruction: `Step ${steps.length + 1} instruction...`
    };
    setSteps(prev => [...prev, newStep]);
    setEditingStepId(newStep.id);
    setEditingText(newStep.instruction);
  };

  const handleDeleteStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId));
  };

  const handleSaveStepText = (stepId: string) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, instruction: editingText } : s));
    setEditingStepId(null);
  };

  const onSubmit: SubmitHandler<FormData> = async (values) => {
    if (!guide) return;
    
    try {
      const payload: TroubleshootGuide = {
        id: guide.id,
        ...values,
        Troubleshoot_Steps: steps.map(s => s.instruction),
        Author: guide.Author,
        Reviewed_By: guide.Reviewed_By,
        Approved_By: guide.Approved_By,
        Organization_Id: guide.Organization_Id,
        Created_By: guide.Created_By,
        Updated_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
      };

      await saveMutation.mutateAsync(payload);
      toast.success(`Guide "${payload.Guide_Title}" updated successfully!`);
      router.push('/problem-management/troubleshoot-guide');
    } catch (e: any) {
      toast.error('Failed to update troubleshoot guide.');
    }
  };

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500 font-semibold">Loading guide details...</div>;
  }

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl w-full md:w-auto flex-1">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-full shrink-0 border border-purple-100 dark:border-purple-900/50">
            <Wrench className="h-6 w-6 text-purple-600 dark:text-purple-450" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Edit Troubleshoot Guide
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Modify step-by-step solutions for {guide?.ITTroubleShootGuide_Id || guide?.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/problem-management/troubleshoot-guide')}
            className="h-10 px-4 text-xs font-bold border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            style={{ backgroundColor: primaryColor }}
            className="h-10 px-4 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-all border-none gap-1.5"
          >
            <Save className="h-4 w-4" />
            <span>Update Guide</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Basic Information */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-purple-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Basic Information
              </h3>
            </div>
            
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Guide Title <span className="text-rose-500">*</span></Label>
                  <Input
                    type="text"
                    {...register('Guide_Title')}
                    placeholder="Enter guide title"
                    className={`text-xs font-semibold rounded-xl ${errors.Guide_Title ? 'border-rose-300 focus-visible:ring-rose-200' : ''}`}
                  />
                  {errors.Guide_Title && <p className="text-[10px] text-rose-500 font-medium">{errors.Guide_Title.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Guide Code <span className="text-rose-500">*</span></Label>
                  <Input
                    type="text"
                    {...register('Guide_Code')}
                    placeholder="Auto generated"
                    className={`text-xs bg-slate-50/50 dark:bg-slate-950/60 font-semibold rounded-xl ${errors.Guide_Code ? 'border-rose-300' : ''}`}
                  />
                  {errors.Guide_Code && <p className="text-[10px] text-rose-500 font-medium">{errors.Guide_Code.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Status <span className="text-rose-500">*</span></Label>
                  <select
                    {...register('Status')}
                    className={`w-full px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 outline-none ${errors.Status ? 'border-rose-300' : 'border-slate-250 dark:border-slate-800'}`}
                  >
                    <option value="Active">🟢 Active</option>
                    <option value="Inactive">🔴 Inactive</option>
                  </select>
                  {errors.Status && <p className="text-[10px] text-rose-500 font-medium">{errors.Status.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Issue / Problem <span className="text-rose-500">*</span></Label>
                  <select
                    {...register('Issue_Problem', { valueAsNumber: true })}
                    className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 outline-none ${errors.Issue_Problem ? 'border-rose-300' : 'border-slate-250 dark:border-slate-800'}`}
                  >
                    <option value="">Search and select problem</option>
                    {problems.map(p => (
                      <option key={p.id} value={p.id}>{p.id} - {p.Problem_Title}</option>
                    ))}
                  </select>
                  {errors.Issue_Problem && <p className="text-[10px] text-rose-500 font-medium">{errors.Issue_Problem.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Category <span className="text-rose-500">*</span></Label>
                  <select
                    {...register('Category')}
                    className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 outline-none ${errors.Category ? 'border-rose-300' : 'border-slate-250 dark:border-slate-800'}`}
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.Category_Name || ''}>{c.Category_Name}</option>
                    ))}
                  </select>
                  {errors.Category && <p className="text-[10px] text-rose-500 font-medium">{errors.Category.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Applies To <span className="text-rose-500">*</span></Label>
                  <select
                    {...register('Applies_To')}
                    className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 outline-none ${errors.Applies_To ? 'border-rose-300' : 'border-slate-250 dark:border-slate-800'}`}
                  >
                    <option value="">Select service / component</option>
                    <option value="Auth Service API">Auth Service API</option>
                    <option value="Stripe Webhook Listener">Stripe Webhook Listener</option>
                    <option value="Sales Analytics Engine">Sales Analytics Engine</option>
                  </select>
                  {errors.Applies_To && <p className="text-[10px] text-rose-500 font-medium">{errors.Applies_To.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-355">Priority <span className="text-rose-500">*</span></Label>
                  <div className="relative">
                    <select
                      {...register('Priority')}
                      className={`w-full pl-9 pr-10 py-2.5 text-xs font-bold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 outline-none appearance-none cursor-pointer ${errors.Priority ? 'border-rose-300' : 'border-slate-250 dark:border-slate-800'}`}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    <ArrowUp className="absolute left-3 top-3 h-4 w-4 text-rose-505 pointer-events-none" />
                  </div>
                  {errors.Priority && <p className="text-[10px] text-rose-500 font-medium">{errors.Priority.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Review Date</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      {...register('Review_Date')}
                      className="text-xs font-semibold rounded-xl pl-9"
                    />
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-355">Version</Label>
                  <Input
                    type="text"
                    {...register('Version')}
                    className="text-xs font-semibold rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Description <span className="text-rose-500">*</span></Label>
                
                {/* Rich Text Toolbar Mock */}
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 mb-2 bg-slate-50/50 dark:bg-slate-955/60 overflow-x-auto">
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><Bold className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><Italic className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><Underline className="h-3.5 w-3.5" /></button>
                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-850 mx-1" />
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><List className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><ListOrdered className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><Undo2 className="h-3.5 w-3.5" /></button>
                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-850 mx-1" />
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><Link className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><Smile className="h-3.5 w-3.5" /></button>
                  <button type="button" className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"><ImageIcon className="h-3.5 w-3.5" /></button>
                </div>

                <textarea
                  rows={4}
                  {...register('Description')}
                  placeholder="Provide a brief description of the issue and the purpose of this guide..."
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-855 dark:text-slate-200 outline-none resize-y ${errors.Description ? 'border-rose-300' : 'border-slate-250 dark:border-slate-800'}`}
                />
                {errors.Description && <p className="text-[10px] text-rose-500 font-medium">{errors.Description.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Guide Details */}
          <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-purple-650" />
              <h3 className="text-sm font-extrabold text-slate-905 dark:text-white uppercase tracking-wider">
                Guide Details
              </h3>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Symptoms</Label>
                    <textarea
                      rows={2}
                      {...register('Symptoms')}
                      placeholder="List the common symptoms observed..."
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Prerequisites (Optional)</Label>
                    <textarea
                      rows={2}
                      {...register('Prerequisites')}
                      placeholder="Mention any access, tools, or configurations required..."
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Root Cause</Label>
                    <textarea
                      rows={2}
                      {...register('Root_Cause')}
                      placeholder="Describe the likely root cause of the issue..."
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Notes (Optional)</Label>
                    <textarea
                      rows={2}
                      {...register('Notes')}
                      placeholder="Add any additional notes or references..."
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Card 4: Troubleshoot Steps */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-850 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Troubleshoot Steps
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Add step-by-step instructions.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddStep}
                className="h-8 px-3 text-[10px] font-bold text-white rounded-lg bg-blue-650 hover:bg-blue-700 transition-colors gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add Step</span>
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2 p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/20 dark:bg-slate-900/40">
                  <GripVertical className="h-4 w-4 text-slate-400 cursor-grab shrink-0" />
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-955 text-blue-650 text-[10px] font-extrabold shrink-0">
                    {index + 1}
                  </div>
                  
                  {editingStepId === step.id ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => handleSaveStepText(step.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveStepText(step.id)}
                        autoFocus
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-xs font-semibold outline-none"
                      />
                    </div>
                  ) : (
                    <span
                      onClick={() => {
                        setEditingStepId(step.id);
                        setEditingText(step.instruction);
                      }}
                      className="text-xs text-slate-800 dark:text-slate-200 font-semibold flex-1 cursor-pointer truncate"
                    >
                      {step.instruction}
                    </span>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStepId(step.id);
                        setEditingText(step.instruction);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStep(step.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 5: Attachments (Optional) */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Attachments (Optional)
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Upload screenshots, documents or logs to help users.
              </p>
            </div>

            <div className="border border-dashed border-slate-250 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-center bg-slate-50/50 dark:bg-slate-905/30 relative hover:bg-slate-100/30 transition-colors">
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center text-center">
                <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} file(s) attached`
                    : 'Drag & drop files here'}
                </p>
                <p className="text-[10px] text-slate-450 mt-0.5">
                  or <span className="text-purple-650 font-bold hover:underline">browse</span>
                </p>
                <p className="text-[9px] text-slate-400 font-semibold mt-1">Max file size: 10MB</p>
              </div>
            </div>
          </Card>

          {/* Card 6: Visibility */}
          <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl p-5 bg-white dark:bg-slate-900 shadow-sm space-y-3">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Visibility
              </h4>
              <p className="text-[10px] text-slate-450 font-semibold mt-0.5">
                Choose who can view this guide.
              </p>
            </div>

            <select
              {...register('Visibility')}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
            >
              <option value="All Users">👥 All Users</option>
              <option value="Internal IT">🔒 Internal IT</option>
              <option value="Restricted">🛡️ Restricted</option>
            </select>
          </Card>

        </div>

        {/* Bottom Bar matching mockup */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row items-center justify-between p-4 border border-blue-100/55 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-955/10 rounded-2xl gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-800 dark:text-blue-400">
            <Info className="h-4.5 w-4.5 shrink-0" />
            <span>All mandatory fields are marked with an asterisk (*).</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/problem-management/troubleshoot-guide')}
              className="h-10 px-5 text-xs font-bold border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={{ backgroundColor: primaryColor }}
              className="h-10 px-5 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-all border-none"
            >
              Update Guide
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
}
