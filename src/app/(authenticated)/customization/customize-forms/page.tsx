'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  SquarePen,
  Puzzle,
  Eye,
  Database,
  Search,
  Filter,
  Plus,
  GripVertical,
  User,
  Building,
  Handshake,
  Ticket,
  Calendar,
  Pencil,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Check,
  AlertCircle,
  CheckCircle2,
  Info,
  Split
} from 'lucide-react';


import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { fetchCustomForms, deleteCustomForm, updateCustomForm, submitCustomForm } from '@/service/api/Customization/api';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

// Define Form item structure
interface FormItem {
  id: string;
  name: string;
  module: 'Leads' | 'Contacts' | 'Deals' | 'Support' | 'Events';
  description: string;
  lastUpdated: string;
  status: 'Active' | 'Inactive';
  fields?: any[];
  rules?: any[];
  notifications?: any;
}

export default function CustomizeFormsPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Forms data state
  const [forms, setForms] = useState<FormItem[]>([]);
  
  // Filtering & Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('All Modules');

  // Active action menu state (row id)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form fields state for create/edit
  const [editingForm, setEditingForm] = useState<FormItem | null>(null);
  const [inputName, setInputName] = useState('');
  const [inputModule, setInputModule] = useState<'Leads' | 'Contacts' | 'Deals' | 'Support' | 'Events'>('Leads');
  const [inputDescription, setInputDescription] = useState('');
  const [inputStatus, setInputStatus] = useState<'Active' | 'Inactive'>('Active');

  // Preview modal states
  const [previewingForm, setPreviewingForm] = useState<FormItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
  const [isPreviewSubmitted, setIsPreviewSubmitted] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<any>(null);

  // Custom delete modal states
  const [formToDelete, setFormToDelete] = useState<FormItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Load custom forms from API on mount
  useEffect(() => {
    let active = true;
    async function loadForms() {
      try {
        setIsLoading(true);
        const data = await fetchCustomForms();
        if (active) {
          setForms(data);
        }
      } catch (e) {
        console.error("Failed parsing custom forms backend list:", e);
        toast.error("Failed to load custom forms from backend.");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsLoaded(true);
        }
      }
    }
    loadForms();
    return () => {
      active = false;
    };
  }, []);

  // Module configurations helper
  const getModuleConfig = (module: string) => {
    switch (module) {
      case 'Leads':
        return {
          icon: User,
          color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400',
          badge: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30'
        };
      case 'Contacts':
        return {
          icon: Building,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30'
        };
      case 'Deals':
        return {
          icon: Handshake,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400',
          badge: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30'
        };
      case 'Support':
        return {
          icon: Ticket,
          color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30 dark:text-purple-400',
          badge: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-300 dark:border-purple-900/30'
        };
      case 'Events':
      default:
        return {
          icon: Calendar,
          color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30 dark:text-cyan-400',
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-300 dark:border-cyan-900/30'
        };
    }
  };

  // Fallback default form fields config when they are not edited yet
  const getFormFieldsAndRules = (form: FormItem) => {
    return {
      fields: form.fields || [],
      rules: form.rules || [],
      notifications: form.notifications || {}
    };
  };

  // Rule evaluation helper
  const isFieldVisible = (field: any, fields: any[], rules: any[], values: Record<string, string>) => {
    const rulesTargetingThisField = rules.filter(r => r.targetField === field.label);
    if (rulesTargetingThisField.length === 0) return true;

    for (const rule of rulesTargetingThisField) {
      const triggerField = fields.find(f => f.label === rule.ifField);
      if (!triggerField) continue;

      const triggerValue = (values[triggerField.id] || '').trim();
      const isTriggerConditionMet = rule.isCondition === 'empty' ? triggerValue === '' : triggerValue !== '';

      if (isTriggerConditionMet) {
        return rule.thenAction === 'show';
      } else {
        return rule.thenAction === 'hide';
      }
    }
    return true;
  };

  // Handle open preview modal
  const handleOpenPreview = (form: FormItem) => {
    const { fields } = getFormFieldsAndRules(form);
    
    // Set initial values
    const initialVals: Record<string, string> = {};
    fields.forEach((f: any) => {
      initialVals[f.id] = '';
    });

    setPreviewValues(initialVals);
    setPreviewErrors({});
    setIsPreviewSubmitted(false);
    setSubmittedPayload(null);
    setPreviewingForm(form);
    setIsPreviewModalOpen(true);
  };

  // Handle preview form submit
  const handlePreviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewingForm) return;

    const { fields, rules } = getFormFieldsAndRules(previewingForm);
    const errors: Record<string, string> = {};
    let hasErrors = false;

    fields.forEach((f: any) => {
      // Check visibility
      const visible = isFieldVisible(f, fields, rules, previewValues);
      if (visible && f.required && !(previewValues[f.id] || '').trim()) {
        errors[f.id] = `${f.label} is required.`;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setPreviewErrors(errors);
      toast.error("Please fill in all required fields.");
      return;
    }

    const toastId = toast.loading("Submitting form entry...");
    try {
      const formIdParsed = parseInt(previewingForm.id, 10);
      const dataPayload: Record<string, any> = {};
      fields.forEach((f: any) => {
        const visible = isFieldVisible(f, fields, rules, previewValues);
        if (visible) {
          const snakeKey = f.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          dataPayload[snakeKey] = previewValues[f.id] || '';
        }
      });

      const payload = {
        form_id: isNaN(formIdParsed) ? 0 : formIdParsed,
        form_name: previewingForm.name,
        data: dataPayload
      };

      const response = await submitCustomForm(payload);
      setSubmittedPayload(response);
      setIsPreviewSubmitted(true);
      toast.success("Form submitted successfully inside sandbox!", { id: toastId });
    } catch (e: any) {
      console.error("Failed sandbox form submission:", e);
      toast.error(e?.message || "Failed sandbox form submission.", { id: toastId });
    }
  };

  // Toggle status handler
  const handleToggleStatus = async (id: string, currentStatus: 'Active' | 'Inactive') => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const formToUpdate = forms.find(f => f.id === id);
    if (!formToUpdate) return;

    // Check duplicate active forms check
    if (nextStatus === 'Active') {
      const activeDuplicate = forms.find(
        f => f.module === formToUpdate.module && f.status === 'Active' && f.id !== id
      );
      if (activeDuplicate) {
        toast.error(`Cannot activate form. An active form ("${activeDuplicate.name}") already exists for module "${formToUpdate.module}". Only one active form per module is allowed.`);
        return;
      }
    }

    const toastId = toast.loading(`Updating form status to ${nextStatus}...`);
    try {
      await updateCustomForm(id, {
        FormName: formToUpdate.name,
        FormSTR: {
          fields: formToUpdate.fields,
          rules: formToUpdate.rules,
          notifications: formToUpdate.notifications,
          module: formToUpdate.module,
          description: formToUpdate.description
        },
        Is_Active: nextStatus === 'Active'
      });
      setForms(forms.map(f => f.id === id ? { ...f, status: nextStatus } : f));
      toast.success(`Form status set to ${nextStatus}!`, { id: toastId });
    } catch (e: any) {
      console.error("Failed to update status on backend:", e);
      toast.error(e?.message || "Failed to update form status on backend.", { id: toastId });
    }
  };

  // Delete form handler
  const handleDeleteForm = async (id: string) => {
    const toastId = toast.loading("Deleting form...");
    try {
      await deleteCustomForm(id);
      setForms(forms.filter(f => f.id !== id));
      setActiveMenuId(null);
      toast.success("Form deleted successfully.", { id: toastId });
    } catch (e: any) {
      console.error("Failed to delete form from backend:", e);
      toast.error(e?.message || "Failed to delete form from backend.", { id: toastId });
    }
  };

  // Edit modal opener
  const openEditModal = (form: FormItem) => {
    setEditingForm(form);
    setInputName(form.name);
    setInputModule(form.module);
    setInputDescription(form.description);
    setInputStatus(form.status);
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  // Submit Edit handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      toast.error("Form Name is required.");
      return;
    }
    const now = new Date();
    const formattedDate = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}, ${now.getFullYear()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    
    setForms(forms.map(f => f.id === editingForm?.id ? {
      ...f,
      name: inputName.trim(),
      module: inputModule,
      description: inputDescription.trim(),
      status: inputStatus,
      lastUpdated: formattedDate
    } : f));
    
    setIsEditModalOpen(false);
    toast.success("Form updated successfully!");
  };

  // Create modal opener
  const openCreateModal = () => {
    setInputName('');
    setInputModule('Leads');
    setInputDescription('');
    setInputStatus('Active');
    setIsCreateModalOpen(true);
  };

  // Submit Create handler
  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      toast.error("Form Name is required.");
      return;
    }
    const now = new Date();
    const formattedDate = `${now.toLocaleString('default', { month: 'short' })} ${now.getDate()}, ${now.getFullYear()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    const newId = `F-${1000 + forms.length + 1}`;
    
    const newForm: FormItem = {
      id: newId,
      name: inputName.trim(),
      module: inputModule,
      description: inputDescription.trim(),
      status: inputStatus,
      lastUpdated: formattedDate
    };

    setForms([newForm, ...forms]);
    setIsCreateModalOpen(false);
    toast.success("New custom form created!");
  };

  // Filter items
  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          form.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = selectedModule === 'All Modules' || form.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const columnsConfig: ColumnConfig<FormItem>[] = useMemo(() => [
    {
      key: 'icon',
      label: '',
      sortable: false,
      className: 'w-12',
      render: (form) => {
        const moduleConfig = getModuleConfig(form.module);
        const ModuleIcon = moduleConfig.icon;
        return (
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${moduleConfig.color}`}>
            <ModuleIcon className="h-4 w-4" />
          </div>
        );
      }
    },
    {
      key: 'name',
      label: 'Form Name',
      sortable: true,
      render: (form) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-100 block">
            {form.name}
          </span>
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-555 block mt-0.5">
            ID: {form.id}
          </span>
        </div>
      )
    },
    {
      key: 'module',
      label: 'Module',
      sortable: true,
      render: (form) => {
        const moduleConfig = getModuleConfig(form.module);
        return (
          <Badge className={`rounded border-0 font-bold uppercase text-[8.5px] tracking-wider py-0.5 px-2 hover:bg-inherit shadow-none ${moduleConfig.badge}`}>
            {form.module}
          </Badge>
        );
      }
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      className: 'max-w-[280px] truncate',
      render: (form) => (
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {form.description}
        </span>
      )
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (form) => (
        <span className="text-slate-500 dark:text-slate-400 font-medium">
          {form.lastUpdated}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (form) => (
        <button
          onClick={() => handleToggleStatus(form.id, form.status)}
          className="cursor-pointer"
        >
          <Badge className={`rounded border-0 font-extrabold uppercase text-[8.5px] tracking-wider py-0.5 px-2.5 shadow-none transition-all ${
            form.status === 'Active'
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {form.status}
          </Badge>
        </button>
      )
    }
  ], [forms]);

  const renderActions = (form: FormItem) => (
    <div className="flex items-center justify-end gap-1.5 w-full">
      <button
        onClick={() => handleOpenPreview(form)}
        className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-colors cursor-pointer"
        title="Preview Form Sandbox"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => router.push(`/customization/create-form?id=${form.id}`)}
        className="h-7 w-7 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer"
        title="Edit Form"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => {
          setFormToDelete(form);
          setIsDeleteModalOpen(true);
        }}
        className="h-7 w-7 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-655 dark:hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
        title="Delete Form"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ────────────────────────────────────────────────────────
            1. SKELETON LOADER STATE
            ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 p-1"
          >
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2.5">
                <div className="h-8 w-60 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="h-10 w-36 bg-slate-250 dark:bg-slate-800 animate-pulse rounded-xl" />
            </div>

            {/* Feature Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-36 animate-pulse" />
              ))}
            </div>

            {/* Table Section Skeleton */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-6 space-y-5 animate-pulse">
              <div className="flex justify-between items-center pb-3">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="flex gap-3">
                  <div className="h-9 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 w-full bg-slate-100 dark:bg-slate-950 rounded-xl" />
                ))}
              </div>
            </div>
          </motion.div>
        ) : (

          /* ────────────────────────────────────────────────────────
              2. REAL PAGE VIEW
              ──────────────────────────────────────────────────────── */
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
          >
            {/* Page Title Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-[1.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Customize Forms
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
                  Create, edit and manage your custom forms to collect the right information.
                </p>
              </div>

              <Button
                onClick={() => router.push('/customization/create-form')}
                style={{ backgroundColor: primaryColor }}
                className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Create New Form
              </Button>
            </div>

            {/* Feature Promo Grid (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              
              {/* Card 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col items-start text-left">
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <SquarePen className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wider mb-1.5">
                  Tailored to Your Process
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Build forms that match your business workflows and data collection needs.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col items-start text-left">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Puzzle className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wider mb-1.5">
                  Drag & Drop Builder
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Easily add, remove and arrange fields with our simple drag & drop builder.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col items-start text-left">
                <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                  <Eye className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wider mb-1.5">
                  Smart Visibility
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Show or hide fields based on conditions and user roles.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col items-start text-left">
                <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wider mb-1.5">
                  Organized & Reusable
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                  Use forms across modules and teams to keep data consistent.
                </p>
              </div>

            </div>

            {/* Forms Section Box */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
              
              {/* Table header tools */}
              <div className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 dark:border-slate-850">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-slate-850 dark:text-slate-150">
                    Your Forms
                  </h2>
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {forms.length}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search forms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs h-9 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-350"
                    />
                  </div>

                  {/* Filter select */}
                  <div className="relative">
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="text-xs h-9 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-350 cursor-pointer appearance-none min-w-[130px]"
                    >
                      <option>All Modules</option>
                      <option>Leads</option>
                      <option>Contacts</option>
                      <option>Deals</option>
                      <option>Support</option>
                      <option>Events</option>
                    </select>
                    <Filter className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ReusableTable list view */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-850">
                <ReusableTable
                  columns={columnsConfig}
                  data={filteredForms}
                  setData={setForms}
                  initialPageSize={5}
                  actions={renderActions}
                  title="Forms List"
                  showGear={true}
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>      {/* ────────────────────────────────────────────────────────
          5. DIALOG MODAL: LIVE PREVIEW SANDBOX
          ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isPreviewModalOpen && previewingForm && (() => {
          const { fields, rules, notifications } = getFormFieldsAndRules(previewingForm);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsPreviewModalOpen(false)}
                className="absolute inset-0 bg-slate-950"
              />
              
              {/* Modal Dialog Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-[640px] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl shadow-2xl p-6 text-left z-50"
              >
                <div className="flex justify-between items-center pb-3 border-b dark:border-slate-850">
                  <div className="text-left">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Eye className="h-5 w-5 text-blue-500" />
                      Live Form Preview Sandbox
                    </h3>
                    <p className="text-[10px] text-slate-450 font-bold block mt-0.5 uppercase tracking-wide">
                      Form ID: {previewingForm.id} | Module: {previewingForm.module}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {!isPreviewSubmitted ? (
                  <form onSubmit={handlePreviewSubmit} className="mt-5 space-y-5">
                    <div className="border-b dark:border-slate-850 pb-3">
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{previewingForm.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{previewingForm.description}</p>
                    </div>

                    <div className="space-y-4">
                      {fields.map((field: any) => {
                        const visible = isFieldVisible(field, fields, rules, previewValues);
                        if (!visible) return null;

                        if (field.type === 'section') {
                          return (
                            <div key={field.id} className="pt-4 pb-1 border-b border-slate-200 dark:border-slate-800 mt-5 first:mt-1 text-left">
                              <h3 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                                <Split className="h-3.5 w-3.5 text-blue-500" />
                                {field.label}
                              </h3>
                              {field.helpText && (
                                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold block mt-0.5">
                                  {field.helpText}
                                </p>
                              )}
                            </div>
                          );
                        }

                        const hasError = previewErrors[field.id];

                        return (
                          <div key={field.id} className="space-y-1 text-xs font-semibold">
                            <div className="flex justify-between items-center">
                              <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                                {field.label}
                                {field.required && <span className="text-red-500 font-bold">*</span>}
                              </label>
                              {hasError && (
                                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {hasError}
                                </span>
                              )}
                            </div>

                            {/* Render inputs based on type */}
                            {field.type === 'text' && (
                              <input
                                type="text"
                                value={previewValues[field.id] || ''}
                                onChange={(e) => {
                                  setPreviewValues({ ...previewValues, [field.id]: e.target.value });
                                  if (previewErrors[field.id]) {
                                    setPreviewErrors({ ...previewErrors, [field.id]: '' });
                                  }
                                }}
                                placeholder={field.placeholder || 'Enter text...'}
                                className={`w-full text-xs h-9 px-3 rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-350 ${
                                  hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
                                }`}
                              />
                            )}

                            {field.type === 'email' && (
                              <input
                                type="email"
                                value={previewValues[field.id] || ''}
                                onChange={(e) => {
                                  setPreviewValues({ ...previewValues, [field.id]: e.target.value });
                                  if (previewErrors[field.id]) {
                                    setPreviewErrors({ ...previewErrors, [field.id]: '' });
                                  }
                                }}
                                placeholder={field.placeholder || 'name@example.com'}
                                className={`w-full text-xs h-9 px-3 rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-350 ${
                                  hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
                                }`}
                              />
                            )}

                            {field.type === 'phone' && (
                              <input
                                type="text"
                                value={previewValues[field.id] || ''}
                                onChange={(e) => {
                                  setPreviewValues({ ...previewValues, [field.id]: e.target.value });
                                  if (previewErrors[field.id]) {
                                    setPreviewErrors({ ...previewErrors, [field.id]: '' });
                                  }
                                }}
                                placeholder={field.placeholder || '(201) 555-0123'}
                                className={`w-full text-xs h-9 px-3 rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-350 ${
                                  hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
                                }`}
                              />
                            )}

                            {field.type === 'number' && (
                              <input
                                type="number"
                                value={previewValues[field.id] || ''}
                                onChange={(e) => {
                                  setPreviewValues({ ...previewValues, [field.id]: e.target.value });
                                  if (previewErrors[field.id]) {
                                    setPreviewErrors({ ...previewErrors, [field.id]: '' });
                                  }
                                }}
                                placeholder={field.placeholder || '0'}
                                className={`w-full text-xs h-9 px-3 rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-350 ${
                                  hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
                                }`}
                              />
                            )}

                            {field.type === 'dropdown' && (
                              <select
                                value={previewValues[field.id] || ''}
                                onChange={(e) => {
                                  setPreviewValues({ ...previewValues, [field.id]: e.target.value });
                                  if (previewErrors[field.id]) {
                                    setPreviewErrors({ ...previewErrors, [field.id]: '' });
                                  }
                                }}
                                className={`w-full text-xs h-9 px-3 rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-350 cursor-pointer ${
                                  hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <option value="">Select an option</option>
                                {field.options && field.options.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}

                            {field.type === 'textarea' && (
                              <textarea
                                value={previewValues[field.id] || ''}
                                onChange={(e) => {
                                  setPreviewValues({ ...previewValues, [field.id]: e.target.value });
                                  if (previewErrors[field.id]) {
                                    setPreviewErrors({ ...previewErrors, [field.id]: '' });
                                  }
                                }}
                                placeholder={field.placeholder || 'Type description...'}
                                rows={3}
                                className={`w-full text-xs p-2.5 rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-350 resize-none ${
                                  hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
                                }`}
                              />
                            )}

                            {field.type !== 'text' && field.type !== 'email' && field.type !== 'phone' && field.type !== 'number' && field.type !== 'dropdown' && field.type !== 'textarea' && (
                              <div className="p-3 border border-dashed rounded-xl bg-slate-50 dark:bg-slate-955/20 text-slate-450 dark:text-slate-500 font-semibold text-center select-none">
                                [{field.label} Field Simulator]
                              </div>
                            )}

                            {field.helpText && (
                              <span className="text-[10px] text-slate-450 dark:text-slate-500 font-medium block mt-0.5">
                                {field.helpText}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t pt-4 mt-6 dark:border-slate-850">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPreviewModalOpen(false)}
                        className="h-9 px-4 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-650 dark:text-slate-350"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        style={{ backgroundColor: primaryColor }}
                        className="h-9 px-5 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer hover:opacity-95"
                      >
                        Submit Form
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-5 space-y-4">
                    <div className="flex items-center gap-2 border-b dark:border-slate-850 pb-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-bounce" />
                      <h4 className="text-sm font-extrabold text-slate-855 dark:text-slate-100">Simulated Submission Success!</h4>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      Your submission has been captured in sandbox mode. Here is the structured JSON data payload dispatched to the CRM API:
                    </p>

                    <pre className="p-4 bg-slate-50 dark:bg-slate-955 rounded-xl text-[10px] font-mono text-slate-700 dark:text-slate-355 overflow-x-auto max-h-60 border dark:border-slate-800">
                      {JSON.stringify(submittedPayload, null, 2)}
                    </pre>

                    <div className="bg-emerald-50/50 dark:bg-emerald-955/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-[10.5px] text-emerald-700 dark:text-emerald-400 leading-relaxed font-semibold">
                      <div className="font-bold text-emerald-850 dark:text-emerald-350 flex items-center gap-1 mb-1">
                        <Info className="h-3.5 w-3.5" />
                        Active Automation Dispatch Logs:
                      </div>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Mapped and saved to Workspace **{previewingForm.module}** database records.</li>
                        {notifications?.alertRecordOwner !== false && <li>Record owner email alert sent to account coordinators.</li>}
                        {notifications?.alertSlackFeed && <li>Dispatched event payload to slack webhook channel.</li>}
                        {notifications?.alertSysAdmin && <li>System administration activity feed updated.</li>}
                        {notifications?.alertEmails && <li>Sent dispatch copy to: **{notifications.alertEmails}**.</li>}
                      </ul>
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-4 mt-6 dark:border-slate-850">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPreviewSubmitted(false)}
                        className="h-9 px-4 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
                      >
                        Submit Another Entry
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setIsPreviewModalOpen(false)}
                        className="h-9 px-5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-805 dark:hover:bg-slate-750 shadow-sm cursor-pointer"
                      >
                        Close Preview
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Delete Warning Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => { if (!open) setIsDeleteModalOpen(false); }}>
        <DialogContent className="max-w-md rounded-3xl p-6 border-slate-100 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-rose-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-rose-500" />
              <span>Confirm Form Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete form <strong className="text-slate-900 dark:text-white">"{formToDelete?.name}"</strong>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="h-10 text-xs font-bold text-slate-655 dark:text-slate-350 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (formToDelete) {
                  handleDeleteForm(formToDelete.id);
                  setIsDeleteModalOpen(false);
                }
              }}
              className="h-10 text-xs font-bold text-white rounded-xl bg-rose-600 hover:bg-rose-700"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

