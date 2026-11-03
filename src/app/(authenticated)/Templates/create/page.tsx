'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Save,
  FileSpreadsheet,
  Layers,
  FileText,
  Mail,
  MessageSquare,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  HelpCircle,
  Lock,
  Settings,
  AlertCircle,
  User,
  Plus,
  Trash2,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { useCreateITTemplate, useITTemplateListWithoutPagination } from '@/service/api/Templates/queries';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const templateFormSchema = z.object({
  name: z.string().min(1, 'Template Name is required'),
  type: z.enum(['Form', 'Report', 'Document', 'Email', 'SMS', 'Workflow']),
  module: z.string().min(1, 'Module is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  baseTemplate: z.string().optional(),
  visibleTo: z.string().optional(),
  
  // Advanced options
  slaHours: z.string().optional(),
  callbackWebhook: z.string().optional(),
  retryAttempts: z.string().optional(),

  // Email specific fields
  subjectLine: z.string().optional(),
  preheaderText: z.string().optional(),
  emailBody: z.string().optional(),
  ccList: z.string().optional(),
  bccList: z.string().optional(),
});

type FormValues = z.infer<typeof templateFormSchema>;

export default function CreateTemplatePage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const createMutation = useCreateITTemplate();
  const { data: baseTemplatesData } = useITTemplateListWithoutPagination();

  // Custom states not handled directly by react-hook-form
  const [isDefault, setIsDefault] = useState(false);
  const [includeSampleData, setIncludeSampleData] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(templateFormSchema) as any,
    defaultValues: {
      type: 'Form',
      module: 'Farmers',
      category: 'Registration',
      baseTemplate: 'None',
      visibleTo: 'All Users',
      description: '',
      slaHours: '24',
      callbackWebhook: '',
      retryAttempts: '3'
    }
  });

  const watchedType = watch('type');
  const watchedName = watch('name') || '';
  const watchedCategory = watch('category') || '';
  const watchedModule = watch('module') || '';
  const watchedDescription = watch('description') || '';
  const watchedBaseTemplate = watch('baseTemplate') || 'None';
  const watchedVisibleTo = watch('visibleTo') || 'All Users';

  // Handle Tag Addition
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Dynamic checklist based on type selection
  const getChecklistItems = (type: string) => {
    switch (type) {
      case 'Form':
        return [
          'Interactive custom form fields & validations',
          'Responsive section layout and grid settings',
          'Conditional display logic & page triggers',
          'Database storage bindings & field mapping',
          'Electronic signature widget integration'
        ];
      case 'Report':
        return [
          'Pre-configured columns and dataset configurations',
          'Sorting, grouping, and metrics aggregation rules',
          'Custom charting layouts (Pie, Bar, Line)',
          'PDF & Excel exporting layout setup',
          'Scheduled delivery report auto-triggers'
        ];
      case 'Document':
        return [
          'Rich-text page formatting editor',
          'Custom letterhead header and footer blocks',
          'Dynamic database merge tags (e.g. {{farmer_name}})',
          'Digital signature line blocks',
          'Multi-page section page-break settings'
        ];
      case 'Email':
        return [
          'Custom Subject line & Preheader details',
          'Responsive HTML email body structure',
          'Dynamic personalization tags integration',
          'System email attachments configurations',
          'Unsubscribe page styling configurations'
        ];
      case 'SMS':
        return [
          '160 character SMS size limit validations',
          'Variable merge tags insertion mappings',
          'Concatenated multi-part SMS configurations',
          'Custom alert notification routing & sender ID',
          'Opt-out reply keywords processing triggers'
        ];
      case 'Workflow':
        return [
          'Approval sequence rules and visual paths',
          'User groups and individual role escalations',
          'Automated background notifications triggers',
          'SLA duration timers & warnings alerts',
          'Status transitions & log recording entries'
        ];
      default:
        return [
          'Standard template variables configuration',
          'Metadata bindings and categorization tags'
        ];
    }
  };

  // Type details for right sidebar quick options
  const templateTypeDetails = [
    { type: 'Form', title: 'Data Form', desc: 'Capture operational records (e.g., soil tests, surveys).', icon: FileSpreadsheet, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { type: 'Report', title: 'Data Report', desc: 'Display statistics, crop charts, and summaries.', icon: Layers, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { type: 'Document', title: 'Document', desc: 'Lease contracts, NDA agreements, and print certificates.', icon: FileText, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { type: 'Workflow', title: 'Workflow Route', desc: 'Setup approval pipelines and automatic status updates.', icon: GitBranch, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' },
    { type: 'Email', title: 'Email Design', desc: 'Rich HTML notification designs for newsletter and alerts.', icon: Mail, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
    { type: 'SMS', title: 'SMS Message', desc: 'Concise, high-throughput text notifications and codes.', icon: MessageSquare, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' }
  ];

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        Template_Name: data.name,
        Template_Type: data.type,
        Module: data.module,
        Template_Category: data.category,
        Description: data.description || '',
        Tags: tags.join(','),
        Base_Template: data.baseTemplate !== 'None' ? data.baseTemplate : undefined,
        Visible_To: data.visibleTo,
        Is_Default: isDefault,
        Include_Sample_Data: includeSampleData,
        Is_Active: true,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`Template "${data.name}" has been created successfully!`);
          router.push('/Templates');
        },
        onError: () => {
          toast.error('Failed to save template. Please verify input fields.');
        }
      });
    } catch (err) {
      toast.error('An unexpected error occurred.');
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'Form': return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
      case 'Report': return <Layers className="h-5 w-5 text-blue-500" />;
      case 'Document': return <FileText className="h-5 w-5 text-amber-500" />;
      case 'Email': return <Mail className="h-5 w-5 text-purple-500" />;
      case 'SMS': return <MessageSquare className="h-5 w-5 text-indigo-500" />;
      case 'Workflow': return <GitBranch className="h-5 w-5 text-cyan-500" />;
      default: return <FileText className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-28 text-left animate-in fade-in duration-300">
      
      {/* Breadcrumbs & Header Panel */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-2">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer"
            onClick={() => router.push('/Templates')}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>

          <div>
            <Breadcrumb className="text-xs text-slate-450 font-semibold mb-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/Templates" className="hover:text-slate-650 transition-colors">
                    Templates
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-slate-300" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-500 font-medium">Create Template</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Create Template
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Build a custom template schema and default settings for your workflows.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3.5 self-end lg:self-auto">
          <Button
            type="button"
            variant="outline"
            className="h-10 px-5 text-xs font-bold rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-350 cursor-pointer shadow-xs"
            onClick={() => router.push('/Templates')}
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            className="h-10 px-6 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-2 cursor-pointer transition-all duration-200 hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="h-4 w-4" /> Save Template
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Forms and Configuration) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Template Details */}
          <Card className="border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-200">Template Details</h3>
            </div>
            
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="space-y-1.5 text-left sm:col-span-2">
                  <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Template Name <span className="text-rose-500">*</span></Label>
                  <Input
                    {...register('name')}
                    placeholder="e.g. Farmer Bio-data Sheet"
                    className={cn(
                      "h-10 text-xs font-semibold rounded-lg",
                      errors.name ? "border-rose-500 focus-visible:ring-rose-500" : "border-slate-200 dark:border-slate-800"
                    )}
                  />
                  {errors.name && <p className="text-[10px] text-rose-500 font-bold">{errors.name.message}</p>}
                </div>

                {/* Type Selection */}
                <div className="space-y-1.5 text-left">
                  <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Template Type <span className="text-rose-500">*</span></Label>
                  <Select
                    value={watchedType}
                    onValueChange={(val) => setValue('type', val as any)}
                  >
                    <SelectTrigger className="h-10 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-950 border dark:border-slate-800">
                      <SelectItem value="Form" className="text-xs font-semibold">Form Layout</SelectItem>
                      <SelectItem value="Report" className="text-xs font-semibold">Report Layout</SelectItem>
                      <SelectItem value="Document" className="text-xs font-semibold">Document Template</SelectItem>
                      <SelectItem value="Email" className="text-xs font-semibold">Email Body</SelectItem>
                      <SelectItem value="SMS" className="text-xs font-semibold">SMS Alert</SelectItem>
                      <SelectItem value="Workflow" className="text-xs font-semibold">Workflow Process</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Module selection */}
                <div className="space-y-1.5 text-left">
                  <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">System Module <span className="text-rose-500">*</span></Label>
                  <Select
                    value={watchedModule}
                    onValueChange={(val) => setValue('module', val || '')}
                  >
                    <SelectTrigger className="h-10 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955">
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-950 border dark:border-slate-800">
                      {['Farmers', 'Fields', 'Crops', 'Activities', 'Irrigation', 'Soil Tests', 'Advisories', 'Tasks', 'Reports', 'Inventory', 'General'].map((m) => (
                        <SelectItem key={m} value={m} className="text-xs font-semibold">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5 text-left">
                  <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Category <span className="text-rose-500">*</span></Label>
                  <Select
                    value={watchedCategory}
                    onValueChange={(val) => setValue('category', val || '')}
                  >
                    <SelectTrigger className="h-10 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-950 border dark:border-slate-800">
                      {['Registration', 'Inspection', 'Analytics', 'Summary', 'Legal', 'Communication', 'Alerts', 'Approval', 'Inventory', 'General'].map((c) => (
                        <SelectItem key={c} value={c} className="text-xs font-semibold">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags input */}
                <div className="space-y-1.5 text-left">
                  <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Tags (Press Enter)</Label>
                  <div className="min-h-10 w-full border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 px-3 py-1.5 flex flex-wrap items-center gap-1.5 cursor-text focus-within:ring-1 focus-within:ring-slate-400 transition-all">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-emerald-500 hover:text-emerald-800 font-bold ml-0.5"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder={tags.length === 0 ? "farmer, checkup" : ""}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      className="flex-1 bg-transparent border-0 p-0 text-xs font-medium focus:ring-0 outline-none placeholder-slate-400 min-w-[80px]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 text-left sm:col-span-2">
                  <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Description</Label>
                  <Textarea
                    {...register('description')}
                    placeholder="Provide a clear description of the template purpose and use cases..."
                    className="min-h-[90px] text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-1">
                    <span>{errors.description && <span className="text-rose-500">{errors.description.message}</span>}</span>
                    <span>{watchedDescription.length} / 500</span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Conditionally rendered Mail Structure when type is Email */}
          {watchedType === 'Email' && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Card className="border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden relative mt-6">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <div className="p-4.5 border-b border-purple-100 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 flex items-center gap-2">
                  <Mail className="h-4.5 w-4.5 text-purple-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-200">Mail Structure Designer</h3>
                </div>
                
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Subject Line */}
                    <div className="space-y-1.5 text-left md:col-span-2">
                      <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex justify-between">
                        Subject Line <span className="text-purple-600 dark:text-purple-400 font-bold">*</span>
                      </Label>
                      <Input
                        {...register('subjectLine')}
                        placeholder="e.g. Action Required: Your Monthly Report"
                        className="h-10 text-xs font-semibold rounded-lg border-purple-100 focus:border-purple-400 dark:border-purple-900 focus:ring-purple-400/20"
                      />
                    </div>

                    {/* Preheader */}
                    <div className="space-y-1.5 text-left md:col-span-2">
                      <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Preheader Text (Optional)</Label>
                      <Input
                        {...register('preheaderText')}
                        placeholder="Preview text shown in email clients..."
                        className="h-10 text-xs font-semibold rounded-lg border-purple-100 focus:border-purple-400 dark:border-purple-900 focus:ring-purple-400/20"
                      />
                    </div>

                    {/* CC List */}
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Default CC</Label>
                      <Input
                        {...register('ccList')}
                        placeholder="comma separated emails..."
                        className="h-10 text-xs font-semibold rounded-lg border-purple-100 focus:border-purple-400 dark:border-purple-900 focus:ring-purple-400/20"
                      />
                    </div>

                    {/* BCC List */}
                    <div className="space-y-1.5 text-left">
                      <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Default BCC</Label>
                      <Input
                        {...register('bccList')}
                        placeholder="comma separated emails..."
                        className="h-10 text-xs font-semibold rounded-lg border-purple-100 focus:border-purple-400 dark:border-purple-900 focus:ring-purple-400/20"
                      />
                    </div>

                    {/* Email Body HTML/Text */}
                    <div className="space-y-1.5 text-left md:col-span-2">
                      <Label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex justify-between">
                        Email Body (HTML/Rich Text) <span className="text-purple-600 dark:text-purple-400 font-bold">*</span>
                      </Label>
                      <Textarea
                        {...register('emailBody')}
                        placeholder="<html><body><h1>Hello {{name}}</h1>...</body></html>"
                        className="min-h-[250px] font-mono text-[11px] font-medium rounded-lg border-purple-100 focus:border-purple-400 dark:border-purple-900 focus:ring-purple-400/20 bg-slate-50/50 dark:bg-slate-950"
                      />
                      <p className="text-[10px] text-slate-400 text-right">Use HTML tags and double curly braces for variables e.g. {'{{ user_name }}'}.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Card 2: Configuration Options */}
          <Card className="border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs overflow-hidden mt-6">
            <div className="p-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center gap-2">
              <SlidersHorizontal className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-200">Template Configuration</h3>
            </div>

            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Base template */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Base on Existing</Label>
                    <span title="Pre-populate elements from another template" className="cursor-help"><HelpCircle className="h-3 w-3 text-slate-400" /></span>
                  </div>
                  <Select
                    value={watchedBaseTemplate}
                    onValueChange={(val) => setValue('baseTemplate', val || 'None')}
                  >
                    <SelectTrigger className="h-10 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-950 border dark:border-slate-800">
                      <SelectItem value="None" className="text-xs font-semibold">None (Start from scratch)</SelectItem>
                      {(baseTemplatesData || []).map((t: any) => (
                        <SelectItem key={t.id} value={t.id.toString()} className="text-xs font-semibold">{t.Template_Name} ({t.Template_Type})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Visible To */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Visibility Scope</Label>
                    <span title="Choose who has access to apply this template" className="cursor-help"><Lock className="h-3 w-3 text-slate-400" /></span>
                  </div>
                  <Select
                    value={watchedVisibleTo}
                    onValueChange={(val) => setValue('visibleTo', val || 'All Users')}
                  >
                    <SelectTrigger className="h-10 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <SelectValue placeholder="All Users" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-950 border dark:border-slate-800">
                      <SelectItem value="All Users" className="text-xs font-semibold">All Users</SelectItem>
                      <SelectItem value="Administrators Only" className="text-xs font-semibold">Administrators Only</SelectItem>
                      <SelectItem value="Field Officers Only" className="text-xs font-semibold">Field Officers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              {/* Toggles Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                
                {/* Toggle 1: Set as default */}
                <div className="flex items-start justify-between p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20">
                  <div className="space-y-0.5 text-left">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Set as Default Template</span>
                    <span className="block text-[11px] text-slate-400">Load automatically in selected modules.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDefault(!isDefault)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 cursor-pointer mt-1",
                      isDefault ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn("h-4 w-4 rounded-full bg-white transition-transform shadow-sm", isDefault ? "translate-x-4.5" : "translate-x-0.5")} />
                  </button>
                </div>

                {/* Toggle 2: Include Sample Data */}
                <div className="flex items-start justify-between p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20">
                  <div className="space-y-0.5 text-left">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">Include Sample Data</span>
                    <span className="block text-[11px] text-slate-400">Pre-fill fields with mock information for setup preview.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeSampleData(!includeSampleData)}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 cursor-pointer mt-1",
                      includeSampleData ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"
                    )}
                  >
                    <div className={cn("h-4 w-4 rounded-full bg-white transition-transform shadow-sm", includeSampleData ? "translate-x-4.5" : "translate-x-0.5")} />
                  </button>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Checklist Box - What will be included */}
          <div className="p-5 rounded-xl border border-emerald-150 bg-emerald-50/30 dark:bg-emerald-950/10 text-left space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-emerald-650 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">What will be included?</span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded">
                1/3 Setup Config
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Depending on the selected template type (<strong>{watchedType}</strong>), the following core assets will be pre-generated in your new template:
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {getChecklistItems(watchedType).map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-slate-650 dark:text-slate-350">
                  <div className="h-4.5 w-4.5 rounded-full bg-emerald-100 dark:bg-emerald-950/45 flex items-center justify-center shrink-0 text-emerald-650 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 leading-tight">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Advanced Options Accordion */}
          <div className="border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors text-left border-0 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Advanced Settings (API & Hooks)</span>
              </div>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-450" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-450" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* SLA Hours */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">SLA Deadline (Hours)</Label>
                    <Input
                      type="number"
                      {...register('slaHours')}
                      className="h-10 text-xs font-semibold rounded-lg"
                    />
                  </div>

                  {/* Retry attempts */}
                  <div className="space-y-1.5 text-left">
                    <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Max Execution Retries</Label>
                    <Input
                      type="number"
                      {...register('retryAttempts')}
                      className="h-10 text-xs font-semibold rounded-lg"
                    />
                  </div>

                  {/* Callback Webhook URL */}
                  <div className="space-y-1.5 text-left sm:col-span-3">
                    <Label className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest">Execution Callback Webhook URL</Label>
                    <Input
                      {...register('callbackWebhook')}
                      placeholder="https://api.yourcrm.com/v1/webhooks/templates"
                      className="h-10 text-xs font-semibold rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Widget Sidebar Panels) */}
        <div className="space-y-6">
          
          {/* Panel 1: Template Live Preview */}
          <Card className="border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-200">Template Live Preview</h3>
              <Badge variant="outline" className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border-emerald-100 rounded-lg">
                Interactive
              </Badge>
            </div>
            
            <CardContent className="p-5 flex flex-col items-stretch">
              <p className="text-[11px] text-slate-450 mb-4 text-center">
                Visualizing how your template will display in the administrative catalog list view.
              </p>

              {/* Simulated Card Preview */}
              <div className="border border-slate-150 dark:border-slate-800 rounded-xl p-4.5 bg-slate-50/30 dark:bg-slate-950/30 space-y-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

                {/* Card Top Row */}
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-xs">
                    {getTemplateIcon(watchedType)}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-55 bg-white border-slate-200 dark:bg-slate-800 text-slate-600 dark:border-slate-700">
                      {watchedCategory || 'General'}
                    </Badge>
                    <Badge className="text-[9px] font-black uppercase bg-emerald-650 hover:bg-emerald-750 text-white rounded px-2">
                      Active
                    </Badge>
                  </div>
                </div>

                {/* Template name and Description */}
                <div className="space-y-1.5 text-left">
                  <h4 className="text-[14px] font-black text-slate-800 dark:text-slate-150 truncate leading-tight">
                    {watchedName.trim() || 'Untitled Template'}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">
                    {watchedDescription.trim() || 'No description provided. Details will show up here as you type in the details form.'}
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-slate-850 my-1" />

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-450">
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-slate-350" />
                    <span>Admin User</span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    {watchedModule || 'General'}
                  </div>
                </div>
              </div>

              {/* Status details indicators */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex flex-wrap gap-2 justify-center">
                {isDefault && (
                  <Badge variant="outline" className="text-[9px] font-extrabold bg-blue-50 text-blue-700 border-blue-100 py-0.5">
                    Default Config
                  </Badge>
                )}
                {includeSampleData && (
                  <Badge variant="outline" className="text-[9px] font-extrabold bg-purple-50 text-purple-700 border-purple-100 py-0.5">
                    Sample Data Included
                  </Badge>
                )}
                {watchedBaseTemplate !== 'None' && (
                  <Badge variant="outline" className="text-[9px] font-extrabold bg-amber-50 text-amber-700 border-amber-100 py-0.5">
                    Based on {watchedBaseTemplate}
                  </Badge>
                )}
                {watchedVisibleTo !== 'All Users' && (
                  <Badge variant="outline" className="text-[9px] font-extrabold bg-cyan-50 text-cyan-700 border-cyan-100 py-0.5">
                    Restricted
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Panel 2: Template Type Reference */}
          <Card className="border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-slate-200">Template Type Index</h3>
            </div>
            
            <CardContent className="p-4.5 space-y-3">
              {templateTypeDetails.map((td) => {
                const isSelected = watchedType === td.type;
                const IconComponent = td.icon;
                return (
                  <div
                    key={td.type}
                    className={cn(
                      "p-3 rounded-lg border text-left flex items-start gap-3 transition-all",
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/25 dark:bg-emerald-950/10 shadow-xs"
                        : "border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                    )}
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs", td.color)}>
                      <IconComponent className="h-4.5 w-4.5" />
                    </div>
                    
                    <div className="space-y-0.5">
                      <span className={cn("block text-xs font-black leading-tight", isSelected ? "text-emerald-700 dark:text-emerald-450" : "text-slate-750 dark:text-slate-200")}>
                        {td.title}
                      </span>
                      <span className="block text-[11px] text-slate-400 leading-normal">
                        {td.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Panel 3: Best Practices (Tips box) */}
          <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 text-left space-y-2.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4.5 w-4.5" />
              <span className="text-xs font-black uppercase tracking-wider">Template Guidelines</span>
            </div>
            <ul className="space-y-2 text-[11px] text-amber-800 dark:text-amber-400/80 list-disc pl-4 font-semibold">
              <li>Keep the template name unique and specific (e.g. "Crop Damage Form v2" instead of "Form").</li>
              <li>Select the correct category to ensure it's easy to locate in filter actions.</li>
              <li>Visible scope controls access. Restricted templates will only load for authorized personnel.</li>
              <li>Toggle "Set as default" to load this template as the standard fallback interface for new projects.</li>
            </ul>
          </div>

        </div>
      </form>
    </div>
  );
}
