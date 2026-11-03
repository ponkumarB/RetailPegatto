'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, HelpCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NavLink } from '@/components/layout/NavLink';
import { 
  useUpdateNotificationTemplate, 
  useNotificationTemplateById, 
  useDeleteNotificationTemplate 
} from '@/service/api/NotificationTemplates/queries';
import { useStore } from '@/store/useStore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const templateSchema = z.object({
  Template_Name: z.string().min(1, 'Template name is required'),
  Notification_Type: z.string().min(1, 'Type is required'),
  Module: z.string().min(1, 'Module is required'),
  Subject: z.string().min(1, 'Subject is required'),
  Message: z.string().min(1, 'Message is required'),
});

type FormValues = z.infer<typeof templateSchema>;

export default function EditNotificationTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = Number(params.id);
  const { primaryColor } = useStore();
  
  const { data: templateData, isLoading } = useNotificationTemplateById(templateId);
  const updateMutation = useUpdateNotificationTemplate();
  const deleteMutation = useDeleteNotificationTemplate();

  const [channels, setChannels] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      Template_Name: '',
      Notification_Type: 'Information',
      Module: 'Finance',
      Subject: '',
      Message: '',
    }
  });

  useEffect(() => {
    if (templateData) {
      reset({
        Template_Name: templateData.Template_Name || '',
        Notification_Type: templateData.Notification_Type || 'Information',
        Module: templateData.Module || 'Finance',
        Subject: templateData.Subject || '',
        Message: templateData.Message || '',
      });
      if (templateData.Channels) {
        setChannels(templateData.Channels);
      }
    }
  }, [templateData, reset]);

  const watchedModule = watch('Module');

  const toggleChannel = (channel: string) => {
    if (channels.includes(channel)) {
      setChannels(channels.filter(c => c !== channel));
    } else {
      setChannels([...channels, channel]);
    }
  };

  const getVariablesForModule = (module: string) => {
    switch (module) {
      case 'Finance':
        return [
          { name: '{{CustomerName}}', desc: 'Customer Full Name' },
          { name: '{{InvoiceNo}}', desc: 'Invoice Number' },
          { name: '{{Amount}}', desc: 'Invoice Amount' },
          { name: '{{DueDate}}', desc: 'Invoice Due Date' }
        ];
      case 'Lead':
        return [
          { name: '{{SalesExecutive}}', desc: 'Sales User' },
          { name: '{{LeadName}}', desc: 'Lead Name' },
          { name: '{{CompanyName}}', desc: 'Company' },
          { name: '{{ContactNumber}}', desc: 'Customer Phone' },
          { name: '{{FollowUpDate}}', desc: 'Next Follow-up Date' }
        ];
      default:
        return [
          { name: '{{UserName}}', desc: 'Recipient Name' },
          { name: '{{Date}}', desc: 'Current Date' }
        ];
    }
  };

  const variables = getVariablesForModule(watchedModule);

  const onSubmit = (data: FormValues) => {
    const payloadVariables = variables.map(v => ({
      Variable_Name: v.name,
      Description: v.desc
    }));

    const payload = {
      Organization_Id: 1,
      Template_Name: data.Template_Name,
      Notification_Type: data.Notification_Type,
      Module: data.Module,
      Subject: data.Subject,
      Message: data.Message,
      Variables: payloadVariables,
      Channels: channels.length > 0 ? channels : ['Email'],
      Language: templateData?.Language || 'English',
      Priority: templateData?.Priority || 'High',
      Status: templateData?.Status || 'Active',
      Is_Draft: templateData?.Is_Draft || false,
      Created_By: templateData?.Created_By?.id || 1,
      Updated_By: 1
    };

    updateMutation.mutate({ id: templateId, payload }, {
      onSuccess: () => {
        router.push('/Settings/notification-templates');
      }
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(templateId, {
      onSuccess: () => {
        router.push('/Settings/notification-templates');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
          <CardContent className="p-6 space-y-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <NavLink to="/Settings" className="text-slate-500 hover:text-slate-800">Settings</NavLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <NavLink to="/Settings/notification-templates" className="text-slate-500 hover:text-slate-800">Templates</NavLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold text-slate-800 dark:text-slate-200">Edit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Edit Template</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 font-bold rounded-xl h-10 px-4"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={updateMutation.isPending || isSubmitting}
            style={{ backgroundColor: primaryColor }}
            className="font-bold rounded-xl h-10 px-6 text-white hover:opacity-90 transition-opacity"
          >
            <Save className="mr-2 h-4 w-4" /> 
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
            <CardContent className="p-6 space-y-5">
              
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Template Name</Label>
                <Input
                  {...register('Template_Name')}
                  placeholder="e.g. Invoice Payment Reminder"
                  className="h-10 text-sm font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-slate-400"
                />
                {errors.Template_Name && <p className="text-[10px] font-bold text-rose-500">{errors.Template_Name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Module</Label>
                  <Select
                    value={watchedModule}
                    onValueChange={(val) => setValue('Module', val || '')}
                  >
                    <SelectTrigger className="h-10 text-sm font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select Module" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Notification Type</Label>
                  <Select
                    value={watch('Notification_Type')}
                    onValueChange={(val) => setValue('Notification_Type', val || '')}
                  >
                    <SelectTrigger className="h-10 text-sm font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reminder">Reminder</SelectItem>
                      <SelectItem value="Information">Information</SelectItem>
                      <SelectItem value="Alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Channels</Label>
                <div className="flex flex-wrap gap-2">
                  {['Email', 'SMS', 'In-App'].map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        channels.includes(ch)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Subject</Label>
                <Input
                  {...register('Subject')}
                  placeholder="e.g. Invoice Payment Due"
                  className="h-10 text-sm font-semibold rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-slate-400"
                />
                {errors.Subject && <p className="text-[10px] font-bold text-rose-500">{errors.Subject.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex justify-between">
                  Message Body
                </Label>
                <Textarea
                  {...register('Message')}
                  placeholder={`Dear {{CustomerName}},\n\nYour invoice is due.`}
                  className="min-h-[200px] text-sm font-medium rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-slate-400 font-mono leading-relaxed"
                />
                {errors.Message && <p className="text-[10px] font-bold text-rose-500">{errors.Message.message}</p>}
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Sidebar Helpers */}
        <div className="space-y-6">
          <Card className="border border-indigo-100 dark:border-indigo-900/50 shadow-sm rounded-xl bg-indigo-50/30 dark:bg-indigo-950/10">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <HelpCircle className="h-4.5 w-4.5" />
                <h3 className="font-bold text-sm tracking-tight">Available Variables</h3>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Click a variable to copy it, then paste it into your subject or message body. These will be dynamically replaced when sending the notification.
              </p>

              <div className="space-y-2 pt-2">
                {variables.map((v) => (
                  <div key={v.name} className="flex flex-col gap-0.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-300 transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(v.name)}>
                    <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 font-mono">{v.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500">{v.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Template</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete this notification template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-lg font-bold border-slate-200 dark:border-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-lg font-bold bg-rose-600 hover:bg-rose-700 text-white border-none shadow-sm"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
