'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  HelpCircle, 
  Save, 
  Trash2, 
  CheckCircle2, 
  User, 
  RefreshCw, 
  Clock, 
  Info, 
  Facebook,
  Eye,
  EyeOff,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { fetchFacebookConfig, saveFacebookConfig, deleteFacebookConfig, FacebookConfigPayload } from '@/service/api/Settings/facebookConfig/api';

// Custom Facebook Logo SVG
const FacebookLogo = () => (
  <svg className="h-9 w-9 shrink-0" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path d="M16 12H13.5V21H10V12H8V9H10V7.2C10 5.2 11.2 4 13.2 4C14.2 4 15 4.1 15 4.1V6.2H14C13 6.2 12.6 6.8 12.6 7.5V9H15.5L15 12Z" fill="white" />
  </svg>
);

const formSchema = z.object({
  App_Id: z.string().min(1, 'App Id is required'),
  Secret_Id: z.string().min(1, 'Secret Id is required'),
  Page_No: z.string().min(1, 'Facebook Page No is required'),
  Access_Token: z.string().min(1, 'Access Token is required'),
});

type FormValues = z.infer<typeof formSchema>;

export default function FacebookConfigurationPage() {
  const router = useRouter();
  const { primaryColor } = useStore();

  // State Management
  const [configData, setConfigData] = useState<FacebookConfigPayload & { id?: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { App_Id: '', Secret_Id: '', Page_No: '', Access_Token: '' },
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFacebookConfig(1);
      const config = Array.isArray(data) ? data[0] : data;
      
      if (config && config.App_Id) {
        setConfigData(config);
        setValue('App_Id', config.App_Id);
        setValue('Secret_Id', config.Secret_Id);
        setValue('Page_No', config.Page_No);
        setValue('Access_Token', config.Access_Token);
      } else {
        setConfigData(null);
        reset();
      }
    } catch (error: any) {
      // If it's the expected "does not exist" error, it just means not configured
      const errMsg = error?.message || '';
      if (!errMsg.includes('matching query does not exist')) {
        console.error('Failed to load Facebook configuration', error);
      }
      setConfigData(null);
      reset();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [setValue]);

  const onFormSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      const payload: FacebookConfigPayload = {
        ...values,
        Organization_Id: 1,
        UserId: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
        Created_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
        Updated_By: typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) : 1,
      };
      
      if (configData && configData.id) {
        payload.id = configData.id;
      }
      
      const response = await saveFacebookConfig(payload);
      toast.success('Facebook configuration saved successfully.');
      
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

    toast.warning("Are you sure you want to delete this Facebook configuration?", {
      action: {
        label: 'Disconnect',
        onClick: async () => {
          try {
            await deleteFacebookConfig(configData.id!);
            toast.success('Facebook configuration deleted successfully.');
            setConfigData(null);
            reset();
          } catch (error) {
            toast.error('Failed to delete configuration.');
          }
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto p-8 flex justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left font-sans">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-2 border-b dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <FacebookLogo />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Facebook Configuration
            </h1>
            <p className="text-xs text-slate-450 font-semibold mt-0.5">
              Connect and manage your Facebook integration.
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
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Connect Facebook</h3>
                <p className="text-[11px] text-slate-455 font-semibold mt-1">
                  Provide your app credentials to integrate Facebook.
                </p>
              </div>

              <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    App Id <span className="text-rose-500">*</span>
                  </label>
                  <Input {...register('App_Id')} className="w-full h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200" />
                  {errors.App_Id && <p className="text-xs text-rose-500">{errors.App_Id.message}</p>}
                </div>

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

                <div className="space-y-2">
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Facebook Page No <span className="text-rose-500">*</span>
                  </label>
                  <Input {...register('Page_No')} className="w-full h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200" />
                  {errors.Page_No && <p className="text-xs text-rose-500">{errors.Page_No.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-700 dark:text-slate-300">
                    Access Token <span className="text-rose-500">*</span>
                  </label>
                  <Input {...register('Access_Token')} className="w-full h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg text-slate-800 dark:text-slate-200" />
                  {errors.Access_Token && <p className="text-xs text-rose-500">{errors.Access_Token.message}</p>}
                </div>

                <div className="flex justify-start pt-2">
                  <Button type="submit" disabled={isSaving} className="h-10 px-8 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all gap-2 border-none" style={{ backgroundColor: primaryColor }}>
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : (configData ? 'Update Configuration' : 'Save Configuration')}
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
                  <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    <Facebook className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-405">App ID</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{configData.App_Id}</p>
                  </div>
                </div>

                <div className="py-2 border-b dark:border-slate-850">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-405 flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Facebook Page No
                  </span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">{configData.Page_No}</p>
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
                    Fill out the form on the left to set up your Facebook integration. Configuration details will appear here once connected.
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
