'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useDealProbability, useSaveDealProbability } from '@/service/api/Settings/dealProbability/queries';
import { DealProbability } from '@/service/api/Settings/dealProbability/api';
import { toast } from 'sonner';

const formSchema = z.object({
  Stage_Name: z.string().min(1, 'Stage Name is required'),
  Probability: z.string().min(1, 'Probability is required'),
  Forecast_Type: z.string().min(1, 'Forecast Type is required'),
  Description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditDealProbabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const id = Number(unwrappedParams.id);
  
  const { data: dealProbability, isLoading } = useDealProbability(id);
  const saveMutation = useSaveDealProbability();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { Stage_Name: '', Probability: '', Forecast_Type: '', Description: '' }
  });

  useEffect(() => {
    if (dealProbability) {
      reset({
        Stage_Name: dealProbability.Stage_Name,
        Probability: dealProbability.Probability,
        Forecast_Type: dealProbability.Forecast_Type,
        Description: dealProbability.Description || '',
      });
    }
  }, [dealProbability, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!dealProbability) return;
    try {
      const payload: DealProbability = {
        ...dealProbability,
        ...values,
        Updated_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
      };
      await saveMutation.mutateAsync(payload);
      toast.success('Deal Probability updated successfully');
      router.push('/Settings/deal-probability');
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-8 pb-20 p-6 font-sans">
        <div className="animate-pulse space-y-8">
          <div className="h-12 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="lg:col-span-8 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          </div>
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
              Edit Deal Stage
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Update pipeline stage properties and forecasting probability.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Information panel */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-none bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Stage Configuration</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Updating deal probability stages will immediately affect any pipeline forecasts using this stage.
              </p>
              
              <div className="mt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-0.5"><Info className="h-4 w-4 text-emerald-500" /></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Probability</strong> directly affects weighted pipeline calculations.</p>
                </div>
                <div className="flex gap-3">
                  <div className="mt-0.5"><Info className="h-4 w-4 text-emerald-500" /></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400"><strong>Forecast Type</strong> helps categorize deals (e.g. Pipeline, Best Case, Commit).</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Form */}
        <div className="lg:col-span-8">
          <Card className="border dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="space-y-6">
                  {/* Stage Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Stage Name <span className="text-rose-500">*</span>
                    </label>
                    <Input 
                      {...register('Stage_Name')} 
                      placeholder="e.g. Value Proposition" 
                      className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 focus:bg-white transition-colors"
                    />
                    {errors.Stage_Name && <p className="text-xs text-rose-500 font-medium">{errors.Stage_Name.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Probability */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Probability (%) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Input 
                          {...register('Probability')} 
                          type="number" 
                          placeholder="0 - 100" 
                          className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 focus:bg-white transition-colors pr-8"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                      </div>
                      {errors.Probability && <p className="text-xs text-rose-500 font-medium">{errors.Probability.message}</p>}
                    </div>
                    
                    {/* Forecast Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        Forecast Type <span className="text-rose-500">*</span>
                      </label>
                      <Input 
                        {...register('Forecast_Type')} 
                        placeholder="e.g. Pipeline, Commit" 
                        className="h-12 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 focus:bg-white transition-colors"
                      />
                      {errors.Forecast_Type && <p className="text-xs text-rose-500 font-medium">{errors.Forecast_Type.message}</p>}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Description
                    </label>
                    <Textarea 
                      {...register('Description')} 
                      placeholder="Briefly describe what this stage entails..." 
                      className="resize-none bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 focus:bg-white transition-colors p-4" 
                      rows={4} 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t dark:border-slate-800 flex items-center justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="h-11 px-6 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveMutation.isPending} 
                    className="h-11 px-8 font-semibold gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  >
                    <Save className="h-4 w-4" /> 
                    {saveMutation.isPending ? 'Saving...' : 'Update Stage'}
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
