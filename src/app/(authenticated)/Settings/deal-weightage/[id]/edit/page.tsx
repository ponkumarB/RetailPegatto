'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDealWeightSetup, useSaveDealWeightSetup } from '@/service/api/Settings/dealWeightage/queries';
import { DealWeightSetup } from '@/service/api/Settings/dealWeightage/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, ShieldCheck, Info } from 'lucide-react';
import { z } from 'zod';
import { useForm as useReactHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';

const schema = z.object({
  Weight: z.string().min(1, 'Weight Name is required'),
  Points: z.number().min(0, 'Points must be at least 0'),
  values: z.string().optional().nullable(),
  Order_No: z.number().optional().nullable(),
  Deal_State_Name: z.string().optional().nullable(),
  Weightage_Percentage: z.number().optional().nullable(),
  Description: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

export default function EditDealWeightagePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);

  const { data: dealWeight, isLoading } = useDealWeightSetup(id);
  const saveMutation = useSaveDealWeightSetup();
  
  const { register, handleSubmit, reset, formState: { errors } } = useReactHookForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      Weight: '',
      Points: 0,
      values: '',
      Order_No: null,
      Deal_State_Name: '',
      Weightage_Percentage: null,
      Description: '',
    }
  });

  useEffect(() => {
    if (dealWeight) {
      reset({
        Weight: dealWeight.Weight,
        Points: dealWeight.Points,
        values: dealWeight.values || '',
        Order_No: dealWeight.Order_No ?? null,
        Deal_State_Name: dealWeight.Deal_State_Name || '',
        Weightage_Percentage: dealWeight.Weightage_Percentage ?? null,
        Description: dealWeight.Description || '',
      });
    }
  }, [dealWeight, reset]);

  const onSubmit = async (values: FormData) => {
    try {
      const payload: DealWeightSetup = {
        ...dealWeight,
        ...values,
        values: values.values || '',
        Updated_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
      };
      await saveMutation.mutateAsync(payload);
      toast.success('Deal Weight updated successfully');
      router.push('/Settings/deal-weightage');
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
              Edit Deal Weight
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Update configuration for {dealWeight?.Weight}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Information panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-none bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Update Info</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Modifying these weights will affect how new deals are scored. Changes will not impact historical deal data.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5"><Info className="h-4 w-4 text-indigo-500" /></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Points</strong> determine how much weight is given to the deal factor.</p>
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
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Weight Name <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Weight')}
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Weight ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., Deal Value"
                    />
                    {errors.Weight && <p className="text-xs text-rose-500 font-medium">{errors.Weight.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Points <span className="text-rose-500">*</span></label>
                    <Input
                      {...register('Points', { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      className={`h-11 bg-slate-50/50 dark:bg-slate-900/50 ${errors.Points ? 'border-rose-300 focus-visible:ring-rose-200' : 'focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900'}`}
                      placeholder="e.g., 25"
                    />
                    {errors.Points && <p className="text-xs text-rose-500 font-medium">{errors.Points.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Values</label>
                    <Input
                      {...register('values')}
                      className="h-11 bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900"
                      placeholder="e.g., >100000"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Order No</label>
                    <Input
                      {...register('Order_No', { valueAsNumber: true })}
                      type="number"
                      className="h-11 bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900"
                      placeholder="e.g., 1"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Deal State Name</label>
                    <Input
                      {...register('Deal_State_Name')}
                      className="h-11 bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900"
                      placeholder="e.g., Qualification"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Weightage Percentage</label>
                    <Input
                      {...register('Weightage_Percentage', { valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      className="h-11 bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900"
                      placeholder="e.g., 25"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-200">Description</label>
                  <Textarea
                    {...register('Description')}
                    rows={4}
                    className="bg-slate-50/50 dark:bg-slate-900/50 focus-visible:ring-indigo-100 dark:focus-visible:ring-indigo-900 resize-none"
                    placeholder="Enter a brief description..."
                  />
                </div>

                <div className="pt-8 border-t dark:border-slate-800 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/Settings/deal-weightage')}
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
