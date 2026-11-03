'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, HelpCircle } from 'lucide-react';
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
import { useCreateNotificationTemplate } from '@/service/api/NotificationTemplates/queries';
import { useStore } from '@/store/useStore';

const templateSchema = z.object({
  Template_Name: z.string().min(1, 'Template name is required'),
  Notification_Type: z.string().min(1, 'Type is required'),
  Module: z.string().min(1, 'Module is required'),
  Subject: z.string().min(1, 'Subject is required'),
  Message: z.string().min(1, 'Message is required'),
});

type FormValues = z.infer<typeof templateSchema>;

export default function CreateNotificationTemplatePage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const createMutation = useCreateNotificationTemplate();

  const [channels, setChannels] = useState<string[]>(['Email']);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    // Generate Variable objects from the detected placeholders in the message and subject
    // (A simpler way is to just map all available variables for the module)
    const payloadVariables = variables.map(v => ({
      Variable_Name: v.name,
      Description: v.desc
    }));

    const payload = {
      Organization_Id: 1, // Static for now, usually from context
      Template_Name: data.Template_Name,
      Notification_Type: data.Notification_Type,
      Module: data.Module,
      Subject: data.Subject,
      Message: data.Message,
      Variables: payloadVariables,
      Channels: channels.length > 0 ? channels : ['Email'],
      Language: 'English',
      Priority: 'High',
      Status: 'Active',
      Is_Draft: false,
      Created_By: 1,
      Updated_By: 1
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        router.push('/Settings/notification-templates');
      }
    });
  };

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
                <BreadcrumbPage className="font-bold text-slate-800 dark:text-slate-200">Create</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Create Template</h1>
          </div>
        </div>

        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={createMutation.isPending || isSubmitting}
          style={{ backgroundColor: primaryColor }}
          className="font-bold rounded-xl h-10 px-6 text-white hover:opacity-90 transition-opacity"
        >
          <Save className="mr-2 h-4 w-4" /> 
          {createMutation.isPending ? 'Saving...' : 'Save Template'}
        </Button>
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
    </div>
  );
}
