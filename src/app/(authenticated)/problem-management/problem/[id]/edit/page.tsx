'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProblem, useSaveProblem } from '@/service/api/Problem/queries';
import { Problem } from '@/service/api/Problem/api';
import { toast } from 'sonner';
import { useProblemCategoriesList } from '@/service/api/ProblemCategory/queries';
import { ArrowLeft, Save, AlertOctagon, Info } from 'lucide-react';
import { z } from 'zod';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const schema = z.object({
  Problem_Title: z.string().min(1, 'Problem Title is required'),
  Status: z.string().min(1, 'Status is required'),
  Source: z.string().min(1, 'Source is required'),
  Impact: z.string().min(1, 'Impact is required'),
  Urgency: z.string().min(1, 'Urgency is required'),
  Priority: z.string().min(1, 'Priority is required'),
  Affected_Service: z.string().min(1, 'Affected Service is required'),
  Configuration_Item: z.string().min(1, 'Configuration Item is required'),
  Description: z.string().optional().nullable(),
  Symptoms: z.string().optional().nullable(),
  Business_Impact: z.string().optional().nullable(),
  Assignment_Group: z.string().min(1, 'Assignment Group is required'),
  Vendor: z.string().min(1, 'Vendor is required'),
  Due_Date: z.string().min(1, 'Due Date is required'),
  Detected_By: z.string().min(1, 'Detected By is required'),
  Detected_On: z.string().optional().nullable(),
  Root_Cause: z.string().optional().nullable(),
  Category: z.number(),
});

type FormData = z.infer<typeof schema>;

export default function EditProblemPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const { data: problem, isLoading } = useProblem(id);
  const saveMutation = useSaveProblem();
  const { data: categories = [] } = useProblemCategoriesList();
  
  const { register, handleSubmit, reset, formState: { errors } } = useReactHookForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      Problem_Title: '',
      Status: '',
      Source: '',
      Impact: '',
      Urgency: '',
      Priority: '',
      Affected_Service: '',
      Configuration_Item: '',
      Description: '',
      Symptoms: '',
      Business_Impact: '',
      Assignment_Group: '',
      Vendor: '',
      Due_Date: '',
      Detected_By: '',
      Detected_On: '',
      Root_Cause: '',
      Category: undefined as unknown as number,
    }
  });

  useEffect(() => {
    if (problem) {
      reset({
        Problem_Title: problem.Problem_Title || '',
        Status: problem.Status || '',
        Source: problem.Source || '',
        Impact: problem.Impact || '',
        Urgency: problem.Urgency || '',
        Priority: problem.Priority || '',
        Affected_Service: problem.Affected_Service || '',
        Configuration_Item: problem.Configuration_Item || '',
        Description: problem.Description || '',
        Symptoms: problem.Symptoms || '',
        Business_Impact: problem.Business_Impact || '',
        Assignment_Group: problem.Assignment_Group || '',
        Vendor: problem.Vendor || '',
        Due_Date: problem.Due_Date || '',
        Detected_By: problem.Detected_By || '',
        Detected_On: problem.Detected_On || '',
        Root_Cause: problem.Root_Cause || '',
        Category: problem.Category ? Number(problem.Category) : undefined as unknown as number,
      });
    }
  }, [problem, reset]);

  const onSubmit = async (values: FormData) => {
    try {
      const payload: Problem = {
        ...problem,
        Problem_Title: values.Problem_Title,
        Status: values.Status,
        Source: values.Source || null,
        Impact: values.Impact,
        Urgency: values.Urgency || null,
        Priority: values.Priority || null,
        Affected_Service: values.Affected_Service || null,
        Configuration_Item: values.Configuration_Item || null,
        Description: values.Description || null,
        Symptoms: values.Symptoms || null,
        Business_Impact: values.Business_Impact || null,
        Assignment_Group: values.Assignment_Group || null,
        Vendor: values.Vendor || null,
        Due_Date: values.Due_Date || null,
        Detected_By: values.Detected_By || null,
        Detected_On: values.Detected_On || null,
        Root_Cause: values.Root_Cause || null,
        id,
        Reported_By: problem?.Reported_By ?? (typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1),
        Assign_To: problem?.Assign_To ?? null,
        Category: values.Category || null,
        Sub_Category: problem?.Sub_Category ?? null,
        Reference_Incidents: problem?.Reference_Incidents ?? null,
        Updated_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
      };
      await saveMutation.mutateAsync(payload);
      toast.success('Problem updated successfully');
      router.push('/problem-management/problem');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <span className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></span>
          <p className="mt-4 text-sm text-slate-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20 p-6 font-sans">
      
      {/* Premium Header */}
      <div className="flex items-center justify-between pb-6 border-b dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-full h-10 w-10 border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Edit Problem {problem?.Problem_Id && `- ${problem.Problem_Id}`}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Update details for the selected problem</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Information panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-none bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-6">
                <AlertOctagon className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Update Problem Info</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Ensure all details accurately reflect the problem's current state. This helps the team resolve issues faster.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5"><Info className="h-4 w-4 text-rose-500" /></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Status</strong> should be updated as the problem progresses.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Form */}
        <div className="lg:col-span-8">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Problem Title <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Problem_Title')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Problem_Title ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Unable to Access CRM Application"
                    />
                    {errors.Problem_Title && <p className="text-xs text-rose-500 font-medium">{errors.Problem_Title.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Status <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Status')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Status ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Active"
                    />
                    {errors.Status && <p className="text-xs text-rose-500 font-medium">{errors.Status.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Impact <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Impact')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Impact ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., High"
                    />
                    {errors.Impact && <p className="text-xs text-rose-500 font-medium">{errors.Impact.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Urgency <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Urgency')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Urgency ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., High"
                    />
                    {errors.Urgency && <p className="text-xs text-rose-500 font-medium">{errors.Urgency.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Priority <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Priority')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Priority ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Critical"
                    />
                    {errors.Priority && <p className="text-xs text-rose-500 font-medium">{errors.Priority.message}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Source <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Source')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Source ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Email"
                    />
                    {errors.Source && <p className="text-xs text-rose-500 font-medium">{errors.Source.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Affected Service <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Affected_Service')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Affected_Service ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., CRM Application"
                    />
                    {errors.Affected_Service && <p className="text-xs text-rose-500 font-medium">{errors.Affected_Service.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Category <span className="text-rose-500">*</span></label>
                    <select
                      {...register('Category', { valueAsNumber: true })}
                      className={`w-full h-11 px-3 rounded-md border ${errors.Category ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-100 dark:focus:ring-indigo-900'} bg-slate-50/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2`}
                    >
                      <option value="">Select a Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.Category_Name} {cat.Category_Code ? `(${cat.Category_Code})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.Category && <p className="text-xs text-rose-500 font-medium">{errors.Category.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Configuration Item <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Configuration_Item')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Configuration_Item ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., CRM Production Server"
                    />
                    {errors.Configuration_Item && <p className="text-xs text-rose-500 font-medium">{errors.Configuration_Item.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Assignment Group <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Assignment_Group')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Assignment_Group ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Application Support"
                    />
                    {errors.Assignment_Group && <p className="text-xs text-rose-500 font-medium">{errors.Assignment_Group.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Vendor <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Vendor')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Vendor ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., CRMFarm Technologies"
                    />
                    {errors.Vendor && <p className="text-xs text-rose-500 font-medium">{errors.Vendor.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Due Date <span className="text-rose-500">*</span></label>
                    <Input
                      type="date"
                      {...register('Due_Date')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Due_Date ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                    />
                    {errors.Due_Date && <p className="text-xs text-rose-500 font-medium">{errors.Due_Date.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Detected By <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Detected_By')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Detected_By ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Monitoring Tool"
                    />
                    {errors.Detected_By && <p className="text-xs text-rose-500 font-medium">{errors.Detected_By.message}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Description</label>
                  <Textarea
                    {...register('Description')}
                    rows={4}
                    className="bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900 resize-none"
                    placeholder="Provide a detailed description..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Symptoms</label>
                  <Textarea
                    {...register('Symptoms')}
                    rows={3}
                    className="bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900 resize-none"
                    placeholder="Describe the symptoms..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Business Impact</label>
                  <Textarea
                    {...register('Business_Impact')}
                    rows={3}
                    className="bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900 resize-none"
                    placeholder="Describe the impact on business..."
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Root Cause</label>
                  <Textarea
                    {...register('Root_Cause')}
                    rows={3}
                    className="bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900 resize-none"
                    placeholder="Enter the root cause if known..."
                  />
                </div>

                <div className="pt-8 border-t dark:border-slate-800 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/problem-management/problem')}
                    className="h-11 px-6 font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                  >
                    {saveMutation.isPending ? (
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
