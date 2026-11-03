'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sliders,
  ShieldCheck,
  Mail,
  Smartphone,
  UserPlus,
  DollarSign,
  CheckSquare,
  MessageSquare,
  TrendingUp,
  Settings,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Plus,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useNotificationTemplateList, useUpdateNotificationTemplate, useDeleteNotificationTemplate } from '@/service/api/NotificationTemplates/queries';
import { NotificationTemplatePayload } from '@/service/api/NotificationTemplates/api';

// Map icon name strings to Lucide icon components based on Module Name
const getIconForModule = (module: string | undefined): React.ElementType => {
  if (!module) return Settings;
  const mod = module.toLowerCase();
  if (mod.includes('finance') || mod.includes('billing')) return DollarSign;
  if (mod.includes('lead') || mod.includes('sales')) return TrendingUp;
  if (mod.includes('user') || mod.includes('account')) return UserPlus;
  if (mod.includes('support') || mod.includes('ticket')) return MessageSquare;
  if (mod.includes('task') || mod.includes('project')) return CheckSquare;
  return Briefcase;
};

// Premium inline SVG illustration representing a developer working at a desk with a giant notification bell
function WorkspaceIllustration({ primaryColor }: { primaryColor: string }) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto mt-6 aspect-[4/3] flex items-center justify-center">
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none"
      >
        {/* Decorative Grid Patterns */}
        <defs>
          <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#E2E8F0" className="dark:fill-slate-800" />
          </pattern>
        </defs>
        <rect width="400" height="260" fill="url(#dot-pattern)" />

        {/* Desk Line */}
        <line x1="20" y1="250" x2="380" y2="250" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" className="dark:stroke-slate-700" />

        {/* Computer Screen / Laptop */}
        <rect x="120" y="160" width="100" height="65" rx="6" fill="#1E293B" stroke="#64748B" strokeWidth="3" className="dark:fill-slate-950 dark:stroke-slate-800" />
        <path d="M110 225h120v10a4 4 0 0 1-4 4H114a4 4 0 0 1-4-4v-10z" fill="#475569" className="dark:fill-slate-800" />
        {/* Laptop screen reflection/lines */}
        <rect x="130" y="170" width="80" height="45" rx="2" fill="#334155" className="dark:fill-slate-900" />
        <rect x="140" y="180" width="45" height="4" rx="2" fill={primaryColor} fillOpacity="0.4" />
        <rect x="140" y="190" width="60" height="4" rx="2" fill="#94A3B8" fillOpacity="0.3" />
        <rect x="140" y="200" width="30" height="4" rx="2" fill="#94A3B8" fillOpacity="0.3" />

        {/* Small Office Plant */}
        <rect x="40" y="220" width="25" height="30" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-slate-700" />
        {/* Leaves */}
        <path d="M42 220c0-15 10-25 10-25s10 10 10 25H42z" fill="#10B981" fillOpacity="0.8" />
        <path d="M35 210c-10-10 0-20 0-20s10 10 5 20h-5z" fill="#059669" fillOpacity="0.8" />
        <path d="M68 215c10-10 0-20 0-20s-10 10-5 20h5z" fill="#059669" fillOpacity="0.8" />

        {/* Programmer Character */}
        {/* Body */}
        <path d="M220 250v-30c0-12 8-22 18-25h44c10 3 18 13 18 25v30H220z" fill={primaryColor} />
        {/* Head */}
        <circle cx="260" cy="165" r="20" fill="#FDBA74" />
        {/* Hair */}
        <path d="M240 160c2-12 10-20 20-20s18 8 20 20c-5-3-12-4-20-4s-15 1-20 4z" fill="#1E293B" />
        {/* Arms typing */}
        <path d="M228 220l-30-10 2-8 30 10-4 8z" fill="#FDBA74" />
        <path d="M292 220l-25-10 2-8 25 10-2 8z" fill="#FDBA74" />

        {/* Floating Message Bubble */}
        <rect x="290" y="90" width="45" height="30" rx="6" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1.5" />
        <path d="M305 120l5 8v-8h-5z" fill="#10B981" />
        {/* Envelope icon inside bubble */}
        <rect x="302" y="99" width="21" height="13" rx="2" fill="none" stroke="#10B981" strokeWidth="1.5" />
        <path d="M302 101l10.5 6 10.5-6" stroke="#10B981" strokeWidth="1.5" />

        {/* Giant Bell Graphic */}
        <g transform="translate(70, 50) scale(1.2)">
          {/* Bell body */}
          <path d="M22 10c0-6.6-5.4-12-12-12S-2 3.4-2 10v10l-4 6h32l-4-6V10z" fill="#FDE047" stroke="#EAB308" strokeWidth="2.5" strokeLinejoin="round" />
          {/* Bell handle */}
          <path d="M26 30c0-5 8-5 8 0" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* Bell Notification Count Badge "1" */}
        <g transform="translate(118, 70)">
          <circle cx="12" cy="12" r="14" fill="#EF4444" stroke="#FFF" strokeWidth="2.5" />
          <text x="12" y="17" fill="#FFF" fontSize="15" fontWeight="bold" textAnchor="middle">1</text>
        </g>
      </svg>
    </div>
  );
}

export default function NotificationPreferencePage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  
  const { data: listResponse, isLoading } = useNotificationTemplateList();
  const updateMutation = useUpdateNotificationTemplate();
  const deleteMutation = useDeleteNotificationTemplate();

  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Local state to track toggled channels before saving
  const [localChannels, setLocalChannels] = useState<Record<number, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const templates = listResponse?.results || [];

  // Initialize local state when templates load
  useEffect(() => {
    if (templates.length > 0) {
      const initial: Record<number, string[]> = {};
      templates.forEach((t: any) => {
        initial[t.id] = t.Channels || [];
      });
      setLocalChannels(initial);
    }
  }, [templates]);

  const toggleChannelPreference = (templateId: number, channel: string) => {
    setLocalChannels(prev => {
      const current = prev[templateId] || [];
      const updated = current.includes(channel)
        ? current.filter(c => c !== channel)
        : [...current, channel];
      
      return { ...prev, [templateId]: updated };
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Find templates that have changed channels
      const modifiedTemplates = templates.filter((t: any) => {
        const originalChannels = [...(t.Channels || [])].sort().join(',');
        const currentChannels = [...(localChannels[t.id] || [])].sort().join(',');
        return originalChannels !== currentChannels;
      });

      if (modifiedTemplates.length === 0) {
        toast.info('No changes to save.');
        setIsSaving(false);
        return;
      }

      // Execute update mutations in parallel for all modified templates
      await Promise.all(
        modifiedTemplates.map((t: any) => {
          const payload = {
            ...t,
            Channels: localChannels[t.id]
          };
          // Extract only the ID for relation fields if needed, or send the whole template.
          return updateMutation.mutateAsync({ id: t.id, payload });
        })
      );

      toast.success('Preferences saved successfully!', {
        description: 'Your changes have been updated in the system.',
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (templates.length > 0) {
      const resetState: Record<number, string[]> = {};
      templates.forEach((t: any) => {
        resetState[t.id] = t.Channels || [];
      });
      setLocalChannels(resetState);
      toast.info('Preferences reset to initial values.', {
        description: 'Click Save to persist changes if any were saved before.',
      });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
        }
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Notification Preferences</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Side Content & Illustrations */}
        <div className="lg:col-span-4 space-y-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Notification Preferences</h1>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Control how you receive alerts, messages, and updates across all modules. Stay focused on what matters without the noise.
            </p>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Three Feature Summary Points */}
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Stay Informed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Get real-time updates about your leads, deals, tasks and more.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Your Preferences</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Choose the types of notifications that matter to you.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-none flex items-center justify-center h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Your Way</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Select your preferred channels and never miss what's important.
                </p>
              </div>
            </div>
          </div>

          {/* Inline Graphic Illustration */}
          <WorkspaceIllustration primaryColor={primaryColor} />
        </div>

        {/* Right Side Settings Panel - Switches Table Card */}
        <div className="lg:col-span-8">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl shadow-sm overflow-hidden">
            {/* Header section inside card */}
            <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-slate-50">Notification Preferences</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage how you receive notifications across various modules.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/Settings/notification-templates/create')}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90 transition-opacity font-bold rounded-xl h-10 px-4 text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Template
              </Button>
            </div>

            <CardContent className="p-0">
              {/* Settings Configuration Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                      <th className="py-4.5 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Notification Type
                      </th>
                      <th className="py-4.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Mail className="h-4.5 w-4.5 text-slate-400" />
                          <span>Email</span>
                        </div>
                      </th>
                      <th className="py-4.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Bell className="h-4.5 w-4.5 text-slate-400" />
                          <span>In-App</span>
                        </div>
                      </th>
                      <th className="py-4.5 px-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Smartphone className="h-4.5 w-4.5 text-slate-400" />
                          <span>SMS</span>
                        </div>
                      </th>
                      <th className="py-4.5 px-4 w-[60px] text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td className="py-5 px-6"><Skeleton className="h-10 w-full max-w-[200px]" /></td>
                          <td className="py-5 px-4"><Skeleton className="h-6 w-12 rounded-full mx-auto" /></td>
                          <td className="py-5 px-4"><Skeleton className="h-6 w-12 rounded-full mx-auto" /></td>
                          <td className="py-5 px-4"><Skeleton className="h-6 w-12 rounded-full mx-auto" /></td>
                          <td className="py-5 px-4"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></td>
                        </tr>
                      ))
                    ) : templates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                          No notification templates configured.
                        </td>
                      </tr>
                    ) : (
                      templates.map((template: any) => {
                        const IconComponent = getIconForModule(template.Module);
                        const currentChannels = localChannels[template.id] || [];
                        
                        return (
                          <tr key={template.id} className="hover:bg-slate-50/35 dark:hover:bg-slate-950/5 transition-colors">
                            {/* Info Column */}
                            <td className="py-5 px-6">
                              <div className="flex items-start gap-4">
                                <div className="flex-none flex items-center justify-center h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mt-0.5 border border-slate-100 dark:border-slate-700">
                                  <IconComponent className="h-5 w-5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                                    {template.Template_Name}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400 block max-w-sm">
                                    {template.Subject || `Settings for ${template.Module} notifications`}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Email Toggle */}
                            <td className="py-5 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => toggleChannelPreference(template.id, 'Email')}
                                  className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${currentChannels.includes('Email')
                                    ? ''
                                    : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                  style={currentChannels.includes('Email') ? { backgroundColor: primaryColor } : {}}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${currentChannels.includes('Email') ? 'translate-x-5.5' : 'translate-x-0'
                                      }`}
                                  />
                                </button>
                              </div>
                            </td>

                            {/* In-App Toggle */}
                            <td className="py-5 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => toggleChannelPreference(template.id, 'In-App')}
                                  className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${currentChannels.includes('In-App')
                                    ? ''
                                    : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                  style={currentChannels.includes('In-App') ? { backgroundColor: primaryColor } : {}}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${currentChannels.includes('In-App') ? 'translate-x-5.5' : 'translate-x-0'
                                      }`}
                                  />
                                </button>
                              </div>
                            </td>

                            {/* SMS Toggle */}
                            <td className="py-5 px-4 text-center">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => toggleChannelPreference(template.id, 'SMS')}
                                  className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${currentChannels.includes('SMS')
                                    ? ''
                                    : 'bg-slate-200 dark:bg-slate-700'
                                    }`}
                                  style={currentChannels.includes('SMS') ? { backgroundColor: primaryColor } : {}}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${currentChannels.includes('SMS') ? 'translate-x-5.5' : 'translate-x-0'
                                      }`}
                                  />
                                </button>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-5 px-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={
                                  <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                                    <MoreVertical className="h-4 w-4 text-slate-500" />
                                  </Button>
                                } />
                                <DropdownMenuContent align="end" className="w-40 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg">
                                  <DropdownMenuItem 
                                    className="font-medium text-xs cursor-pointer py-2"
                                    onClick={() => router.push(`/Settings/notification-templates/${template.id}`)}
                                  >
                                    <Edit className="mr-2 h-3.5 w-3.5" /> Edit Template
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="font-medium text-xs text-rose-600 focus:text-rose-600 cursor-pointer py-2"
                                    onClick={() => setDeleteId(template.id)}
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom control banner and action buttons */}
              <div className="p-6 border-t dark:border-slate-800 space-y-6">
                {/* Emerald message banner */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-950/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">You're in control.</h4>
                    <p className="text-xs text-emerald-600/95 dark:text-emerald-400/90 leading-relaxed">
                      You can change these preferences anytime. Toggle the channels for each specific notification template.
                    </p>
                  </div>
                </div>

                {/* Buttons controls */}
                <div className="flex items-center justify-end gap-3.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="rounded-xl h-11 px-5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Reset to Initial</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-xl h-11 px-6 text-xs font-bold text-white shadow-sm transition-all flex items-center gap-2 disabled:opacity-75"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isSaving ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>{isSaving ? 'Saving Preferences...' : 'Save Preferences'}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
