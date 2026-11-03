'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  HelpCircle, 
  Save, 
  Trash2, 
  Eye,
  EyeOff,
  Linkedin,
  ShieldAlert,
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { fetchLinkedinConfig, saveLinkedinConfig, deleteLinkedinConfig, LinkedinConfigPayload } from '@/service/api/Settings/linkedinConfig/api';

const formSchema = z.object({
  Client_Id: z.string().min(1, 'Client Id is required'),
  Secret_Id: z.string().min(1, 'Secret Id is required'),
  Access_Token: z.string().min(1, 'Access Token is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function LinkedinConfigurationPage() {
  const { primaryColor } = useStore();

  // State Management
  const [configData, setConfigData] = useState<LinkedinConfigPayload & { id?: number } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { Client_Id: '', Secret_Id: '', Access_Token: '' },
  });

  const loadData = async () => {
    try {
      const data = await fetchLinkedinConfig(1);
      const config = Array.isArray(data) ? data[0] : data;
      
      if (config && config.Client_Id) {
        setConfigData(config);
        setValue('Client_Id', config.Client_Id);
        setValue('Secret_Id', config.Secret_Id || '');
        setValue('Access_Token', config.Access_Token || '');
      } else {
        setConfigData(null);
        reset();
      }
    } catch (error: any) {
      // If it's the expected "does not exist" error, it just means not configured
      const errMsg = error?.message || '';
      if (!errMsg.includes('matching query does not exist')) {
        console.error('Failed to load LinkedIn configuration', error);
      }
      setConfigData(null);
      reset();
    }
  };

  useEffect(() => {
    loadData();
  }, [setValue]);

  const onFormSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const payload: LinkedinConfigPayload = {
        ...values,
        Organization_Id: 1,
        UserId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
        Created_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
        Updated_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
      };
      
      if (configData && configData.id) {
        payload.id = configData.id;
      }
      
      await saveLinkedinConfig(payload);
      toast.success('LinkedIn configuration saved successfully.');
      
      // Reload data to show summary
      loadData();
    } catch (error) {
      toast.error('Failed to save configuration.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = () => {
    if (!configData || !configData.id) return;

    toast.warning("Are you sure you want to delete this LinkedIn configuration?", {
      action: {
        label: 'Disconnect',
        onClick: async () => {
          try {
            await deleteLinkedinConfig(configData.id!);
            toast.success('LinkedIn configuration deleted successfully.');
            setConfigData(null);
            reset();
          } catch (error) {
            toast.error('Failed to delete configuration.');
          }
        }
      }
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 border-b dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="h-9 w-9 rounded-full bg-[#0a66c2]/10 flex items-center justify-center shrink-0">
            <Linkedin className="h-5 w-5 text-[#0a66c2]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              LinkedIn Configuration
            </h1>
            <p className="text-xs text-slate-450 font-semibold mt-0.5">
              Connect and manage your LinkedIn integration.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-350"
            onClick={() => toast.info('Help manual loading...')}
          >
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
        
        {/* Left Section: Form */}
        <div className="lg:col-span-7">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs">
            <CardContent className="p-6 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Connect LinkedIn</h3>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pt-2">
                
                {/* Client Id */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Client Id <span className="text-rose-500">*</span>
                  </label>
                  <Input {...register('Client_Id')} placeholder="Enter Client Id" className="w-full h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200" />
                  {errors.Client_Id && <p className="text-xs text-rose-500">{errors.Client_Id.message}</p>}
                </div>

                {/* Secret Id */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Secret Id <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Input {...register('Secret_Id')} type={showSecret ? 'text' : 'password'} className="w-full h-11 pr-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200" />
                    <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showSecret ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.Secret_Id && <p className="text-xs text-rose-500">{errors.Secret_Id.message}</p>}
                </div>

                {/* Access Token */}
                <div className="space-y-2">
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Access Token <span className="text-rose-500">*</span>
                  </label>
                  <Input {...register('Access_Token')} placeholder="Enter Access Token" className="w-full h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200" />
                  {errors.Access_Token && <p className="text-xs text-rose-500">{errors.Access_Token.message}</p>}
                </div>

                <div className="flex justify-center pt-4">
                  <Button type="submit" disabled={isSaving} variant="outline" className="h-10 px-6 rounded-lg text-sm font-semibold border-slate-300 gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : (configData ? 'Update Configuration' : 'Submit')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Section: Configuration Details */}
        <div className="lg:col-span-5 space-y-6">
          {configData ? (
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
              <div className="bg-slate-50/50 dark:bg-slate-950/20 px-5 py-4 border-b dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Configuration Details</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold border" style={{ color: primaryColor, backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}>
                  Active Connection
                </span>
              </div>
              
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-4 py-2 border-b dark:border-slate-850">
                  <div className="h-12 w-12 rounded-full bg-[#0a66c2]/10 text-[#0a66c2] flex items-center justify-center font-bold text-sm shrink-0">
                    <Linkedin className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-405">Client ID</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{configData.Client_Id}</p>
                  </div>
                </div>

                <div className="py-2 border-b dark:border-slate-850">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-405 flex items-center gap-2">
                    <Key className="h-3 w-3" /> Access Token
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-full">
                    {configData.Access_Token.substring(0, 10)}...
                  </p>
                </div>

                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnect}
                    className="w-full text-rose-600 border-rose-200 hover:text-rose-700 hover:bg-rose-50 rounded-lg h-10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl shadow-none">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Not Configured</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Fill out the form on the left to set up your LinkedIn integration. Configuration details will appear here once connected.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
