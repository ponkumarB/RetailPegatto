'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSaveProblemCategory } from '@/service/api/ProblemCategory/queries';
import { ProblemCategory } from '@/service/api/ProblemCategory/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, FolderOpen, Info } from 'lucide-react';
import { z } from 'zod';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const schema = z.object({
  Category_Name: z.string().min(1, 'Category Name is required'),
  Category_Code: z.string().min(1, 'Category Code is required'),
  Parent_Category: z.string().min(1, 'Parent Category is required'),
  Status: z.string().min(1, 'Status is required'),
  Display_Order: z.number(),
  Associated_Service: z.string().min(1, 'Associated Service is required'),
  Default_Priority: z.string().min(1, 'Default Priority is required'),
  Impact: z.string().min(1, 'Impact is required'),
  Affects_Business_Process: z.string().min(1, 'Affects Business Process is required'),
  Description: z.string().optional().nullable(),
  Notes: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export default function CreateProblemCategoryPage() {
  const router = useRouter();
  const saveMutation = useSaveProblemCategory();
  
  const { register, handleSubmit, formState: { errors } } = useReactHookForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      Category_Name: '',
      Category_Code: '',
      Parent_Category: '',
      Status: 'Active',
      Display_Order: 1,
      Associated_Service: '',
      Default_Priority: 'Medium',
      Impact: 'Medium',
      Affects_Business_Process: 'Yes',
      Description: '',
      Notes: '',
    }
  });

  const onSubmit = async (values: FormData) => {
    try {
      const payload: ProblemCategory = {
        Category_Name: values.Category_Name,
        Category_Code: values.Category_Code,
        Parent_Category: values.Parent_Category || null,
        Status: values.Status,
        Display_Order: values.Display_Order || null,
        Associated_Service: values.Associated_Service || null,
        Default_Priority: values.Default_Priority || null,
        Impact: values.Impact || null,
        Affects_Business_Process: values.Affects_Business_Process || null,
        Description: values.Description || null,
        Notes: values.Notes || null,
        Created_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
        Updated_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
      };
      await saveMutation.mutateAsync(payload);
      toast.success('Category created successfully');
      router.push('/problem-management/problem-category');
    } catch (error) {
      // Error is handled by the mutation
    }
  };

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
              Create Category
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Add a new category for system problems</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Information panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-none bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-6">
                <FolderOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Category Info</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Categories help in organizing and filtering problems effectively, allowing for structured reporting and faster root cause analysis.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5"><Info className="h-4 w-4 text-blue-500" /></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Display Order</strong> dictates where this category appears in dropdown lists.</p>
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
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Category Name <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Category_Name')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Category_Name ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Network Issue"
                    />
                    {errors.Category_Name && <p className="text-xs text-rose-500 font-medium">{errors.Category_Name.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Category Code <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Category_Code')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Category_Code ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., NET001"
                    />
                    {errors.Category_Code && <p className="text-xs text-rose-500 font-medium">{errors.Category_Code.message}</p>}
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
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Parent Category <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Parent_Category')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Parent_Category ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Infrastructure"
                    />
                    {errors.Parent_Category && <p className="text-xs text-rose-500 font-medium">{errors.Parent_Category.message}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Display Order <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Display_Order', { valueAsNumber: true })}
                      type="number"
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Display_Order ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., 1"
                    />
                    {errors.Display_Order && <p className="text-xs text-rose-500 font-medium">{errors.Display_Order.message}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Associated Service <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Associated_Service')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Associated_Service ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., IT Infrastructure"
                    />
                    {errors.Associated_Service && <p className="text-xs text-rose-500 font-medium">{errors.Associated_Service.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Default Priority <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Default_Priority')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Default_Priority ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., High"
                    />
                    {errors.Default_Priority && <p className="text-xs text-rose-500 font-medium">{errors.Default_Priority.message}</p>}
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
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Affects Business Process <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Affects_Business_Process')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Affects_Business_Process ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Yes / No"
                    />
                    {errors.Affects_Business_Process && <p className="text-xs text-rose-500 font-medium">{errors.Affects_Business_Process.message}</p>}
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
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Notes</label>
                  <Textarea
                    {...register('Notes')}
                    rows={3}
                    className="bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="pt-8 border-t dark:border-slate-800 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/problem-management/problem-category')}
                    className="h-11 px-6 font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    {saveMutation.isPending ? (
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Category
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
