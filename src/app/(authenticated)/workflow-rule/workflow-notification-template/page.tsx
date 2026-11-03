'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Plus,
  Edit3,
  Trash2,
  Search,
  Zap,
  Info,
  Download,
  Filter,
  List,
  LayoutGrid
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from 'sonner';
import {
  fetchNotificationTemplates,
  searchNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  filterNotificationTemplates,
  fetchEmailTemplatesWithoutPagination
} from '@/service/api/Workflow/api';

interface EmailTemplate {
  id: string | number;
  Template_Name: string;
}

interface NotificationTemplate {
  id: string | number;
  Notification_Id: string;
  Notification_Name: string;
  Notification_Type: 'In-App' | 'SMS' | 'WhatsApp' | 'Email';
  Subject: string;
  Message_Template: string;
  Body?: string;
  Email_Template?: string | number;
  Email_Template_Name?: string;
  Is_Active: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
}

export default function WorkflowNotificationTemplatePage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Mode state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [loading, setLoading] = useState(false);

  // Layout toggle
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterTemplateName, setFilterTemplateName] = useState('');
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active editing template reference
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  // Dialog State for Delete Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'In-App' | 'SMS' | 'WhatsApp' | 'Email'>('In-App');
  const [formSubject, setFormSubject] = useState('');
  const [formMsgTemplate, setFormMsgTemplate] = useState('');
  const [formEmailTplId, setFormEmailTplId] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOrgId, setFormOrgId] = useState<number>(1);
  const [formNotificationId, setFormNotificationId] = useState<string>('');

  const [selectedModuleCode, setSelectedModuleCode] = useState('LEAD');
  const [availableFields, setAvailableFields] = useState<{ name: string; label: string }[]>([]);

  const subjectRef = React.useRef<HTMLInputElement>(null);
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  const loadAvailableFields = async (moduleCode: string) => {
    try {
      const { fetchFromApi } = await import('@/service/apiClient');
      const res = await fetchFromApi(`/useradmin/available_fields_view/?module_code=${moduleCode}`);
      if (res && Array.isArray(res.fields)) {
        setAvailableFields(res.fields);
      } else {
        setAvailableFields([]);
      }
    } catch (err) {
      console.error('Failed to load available fields:', err);
      setAvailableFields([]);
    }
  };

  useEffect(() => {
    if (viewMode === 'create' || viewMode === 'edit') {
      loadAvailableFields(selectedModuleCode);
    }
  }, [selectedModuleCode, viewMode]);

  const insertField = (target: 'subject' | 'body', fieldName: string) => {
    if (target === 'subject') {
      const input = subjectRef.current;
      if (!input) return;
      const start = input.selectionStart ?? formSubject.length;
      const end = input.selectionEnd ?? formSubject.length;
      const text = formSubject;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newValue = before + `{{${fieldName}}}` + after;
      setFormSubject(newValue);
      setTimeout(() => {
        input.focus();
        const newCursorPos = start + fieldName.length + 4;
        input.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    } else {
      const textarea = bodyRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart ?? formMsgTemplate.length;
      const end = textarea.selectionEnd ?? formMsgTemplate.length;
      const text = formMsgTemplate;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newValue = before + `{{${fieldName}}}` + after;
      setFormMsgTemplate(newValue);
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + fieldName.length + 4;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadEmailTemplates = async () => {
    try {
      const res = await fetchEmailTemplatesWithoutPagination();
      setEmailTemplates(Array.isArray(res) ? res : (res?.data || res?.results || []));
    } catch (err) {
      console.error('Failed to load email templates', err);
    }
  };

  const loadData = async (pageToLoad = currentPage) => {
    setLoading(true);
    try {
      let res;
      const hasFilters = filterTemplateName || filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterTemplateName) payload.Notification_Name = filterTemplateName;
        if (filterOrgId) payload.Organization_Id = Number(filterOrgId);
        if (statusFilter !== 'All') {
          payload.Is_Active = statusFilter === 'Active';
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [filterStartDate || '', filterEndDate || ''];
        }
        res = await filterNotificationTemplates(payload);
      } else if (searchQuery) {
        res = await searchNotificationTemplates(searchQuery);
      } else {
        res = await fetchNotificationTemplates(pageToLoad);
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setTemplates(data);
      setTotalRecords(res?.count || data.length);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailTemplates();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadData(1);
  }, [searchQuery, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData(newPage);
  };

  const filteredData = useMemo(() => {
    return templates;
  }, [templates]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((t) => ({
      'ID': t.Notification_Id || t.id,
      'Name': t.Notification_Name || '',
      'Type': t.Notification_Type || '',
      'Subject': t.Subject || '',
      'Message Template': t.Message_Template || '',
      'Email Template ID': t.Email_Template || '',
      'Status': t.Is_Active ? 'Active' : 'Inactive',
      'Organization ID': t.Organization_Id || 1
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notification Templates");
    XLSX.writeFile(wb, "NotificationTemplates.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Name', 'Type', 'Subject', 'Status', 'Org ID']],
      body: filteredData.map((t) => [
        t.Notification_Id || String(t.id),
        t.Notification_Name || '',
        t.Notification_Type || '',
        t.Subject || '',
        t.Is_Active ? 'Active' : 'Inactive',
        String(t.Organization_Id || 1)
      ])
    });
    doc.save('NotificationTemplates.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const handleOpenForm = (tpl: NotificationTemplate | null = null) => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const fallbackOrgId = storedOrgId ? Number(storedOrgId) : 1;

    if (tpl) {
      const name = tpl.Notification_Name || '';
      const type = tpl.Notification_Type || 'In-App';
      const subject = tpl.Subject || '';
      const msgTpl = tpl.Body || tpl.Message_Template || '';
      const emailTplId = tpl.Email_Template ? String(tpl.Email_Template) : '';
      const active = tpl.Is_Active;
      const nId = tpl.Notification_Id || '';

      let orgId = fallbackOrgId;
      const rawOrg = (tpl as any).Organization_Id ?? (tpl as any).Organization_Id_id ?? (tpl as any).organization_id ?? (tpl as any).organization_id_id;
      if (rawOrg !== undefined && rawOrg !== null) {
        if (typeof rawOrg === 'object') {
          orgId = rawOrg.id ?? rawOrg.Organization_Id ?? rawOrg.organization_id ?? fallbackOrgId;
        } else {
          orgId = Number(rawOrg);
        }
      }

      setEditingTemplate(tpl);
      setFormName(name);
      setFormType(type);
      setFormSubject(subject);
      setFormMsgTemplate(msgTpl);
      setFormEmailTplId(emailTplId);
      setFormActive(active);
      setFormNotificationId(nId);
      setFormOrgId(orgId);
      setViewMode('edit');
    } else {
      setEditingTemplate(null);
      setFormName('');
      setFormType('In-App');
      setFormSubject('');
      setFormMsgTemplate('');
      setFormEmailTplId(emailTemplates[0]?.id ? String(emailTemplates[0].id) : '');
      setFormActive(true);
      setFormNotificationId('');
      setFormOrgId(fallbackOrgId);
      setViewMode('create');
    }
  };

  // logWorkflowChange helper is imported directly from api.ts

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formType || !formMsgTemplate.trim()) {
      toast.error('All required fields must be completed');
      return;
    }

    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const parsedUserId = storedUserId ? Number(storedUserId) : 1;

    const getRelationId = (field: any) => {
      if (!field) return null;
      if (typeof field === 'object') return field.id ?? field.Organization_Id ?? field.Created_By ?? field.Updated_By ?? null;
      return Number(field);
    };

    setLoading(true);
    try {
      const payload: any = {
        Notification_Name: formName,
        Notification_Type: formType,
        Subject: formSubject,
        Message_Template: formMsgTemplate,
        Body: formMsgTemplate,
        Email_Template: formType === 'Email' && formEmailTplId ? Number(formEmailTplId) : null,
        Is_Active: formActive,
        Organization_Id: formOrgId,
        Updated_By: parsedUserId
      };

      if (editingTemplate) {
        payload.id = editingTemplate.id;
        payload.Notification_Id = editingTemplate.Notification_Id;
        payload.Created_By = getRelationId((editingTemplate as any).Created_By ?? (editingTemplate as any).Created_By_id) ?? parsedUserId;

        await updateNotificationTemplate(payload);
        toast.success('Notification Template updated successfully');
      } else {
        payload.Created_By = parsedUserId;

        const res = await createNotificationTemplate(payload);
        toast.success('Notification Template created successfully');
      }
      setViewMode('list');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save notification template');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (row: NotificationTemplate) => {
    try {
      await updateNotificationTemplate({
        ...row,
        Is_Active: !row.Is_Active
      });
      toast.success('Status updated successfully');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle status');
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      setLoading(true);
      try {
        await deleteNotificationTemplate(deletingId);
        toast.success('Notification Template deleted successfully');
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete template');
      } finally {
        setDeletingId(null);
        setIsDeleteOpen(false);
        setLoading(false);
      }
    }
  };

  const tableColumns: ColumnConfig<NotificationTemplate>[] = [
    {
      key: 'Notification_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white pl-2">{row.Notification_Id || row.id}</span>
    },
    {
      key: 'Notification_Name',
      header: 'Template Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-805 dark:text-slate-200 block">{row.Notification_Name}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5 max-w-xs truncate">{row.Subject}</span>
        </div>
      )
    },
    {
      key: 'Notification_Type',
      header: 'Type',
      sortable: true,
      render: (row) => (
        <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-955/40 text-blue-700 dark:text-blue-450 border border-blue-200 dark:border-blue-900/40">
          {row.Notification_Type}
        </span>
      )
    },
    {
      key: 'Is_Active',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
            row.Is_Active ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.Is_Active ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          {row.Is_Active ? 'Active' : 'Inactive'}
        </button>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => handleOpenForm(row)}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-450"
            onClick={() => {
              setDeletingId(row.id);
              setIsDeleteOpen(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 text-left p-6">
      {/* Breadcrumbs Header */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">{getTenantName().toUpperCase()}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Automation</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Notification Template</BreadcrumbPage>
            </BreadcrumbItem>
            {viewMode !== 'list' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewMode === 'edit' ? 'Edit Template' : 'Create Template'}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Main Header Panel */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="space-y-1 text-left">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notification Templates</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Setup rich templates for SMS, WhatsApp, In-App notifications, and emails.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button
                    variant="outline"
                    className="h-9 px-3 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-lg">
                  <DropdownMenuItem onClick={exportToExcel} className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF} className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    Export to PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => handleOpenForm(null)}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold rounded-xl h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-1.5 border-0"
              >
                <Plus className="h-4 w-4" /> Create Template
              </Button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Templates</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{templates.length}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl shrink-0">
                <Bell className="h-5 w-5 text-blue-505" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {templates.filter(t => t.Is_Active).length}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-955/30 rounded-2xl shrink-0">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactive</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {templates.filter(t => !t.Is_Active).length}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl shrink-0">
                <Zap className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Table Container using ReusableTable */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Templates Catalog</h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                  {filteredData.length} Templates
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {/* Status select filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-bold border dark:border-slate-805 bg-slate-50 dark:bg-slate-950 p-2 px-3 rounded-xl text-slate-655 dark:text-slate-350 focus:outline-none h-8.5 cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                {/* Grid / List view toggles */}
                <div className="flex items-center border dark:border-slate-800 rounded-xl overflow-hidden h-8.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewFormat('list')}
                    className={`h-full w-8.5 rounded-none cursor-pointer ${viewFormat === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900' : 'text-slate-400'}`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewFormat('grid')}
                    className={`h-full w-8.5 rounded-none cursor-pointer ${viewFormat === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900' : 'text-slate-400'}`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>

                <div className="relative w-full sm:w-[220px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-405" />
                  <Input
                    placeholder="Search template name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8.5 bg-slate-50 dark:bg-slate-955 border-slate-205 dark:border-slate-800 font-medium text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
                  />
                </div>

                {/* Filter Panel Toggle */}
                <Button
                  variant="outline"
                  onClick={() => setIsFilterVisible(!isFilterVisible)}
                  className={`h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    isFilterVisible ? 'bg-slate-100 dark:bg-slate-800 text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-855'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Grid / List render content toggler */}
            {viewFormat === 'list' ? (
              <ReusableTable<NotificationTemplate>
                columns={tableColumns}
                data={filteredData}
                loading={loading}
                initialPageSize={10}
                showGear={true}
                rowKey="id"
                borderless={true}
                title="Notification Templates"
                page={currentPage}
                totalRecords={totalRecords}
                onChangePage={handlePageChange}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {filteredData.map((t) => {
                    const name = t.Notification_Name || 'Unnamed';
                    const type = t.Notification_Type || 'In-App';
                    const active = t.Is_Active;

                    return (
                      <Card key={t.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
                        <div className="p-5 space-y-3.5 text-left">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider font-mono">
                              Type: {type}
                            </Badge>
                            <Badge className={`text-[9px] font-bold rounded-full ${active ? 'bg-emerald-50 dark:bg-emerald-955/35 text-emerald-605 border border-emerald-205' : 'bg-slate-50 dark:bg-slate-800 text-slate-505 border border-slate-200'}`}>
                              {active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{name}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed truncate">{t.Body || t.Message_Template || 'No template context'}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-3.5 border-t dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {t.Notification_Id || t.id}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleOpenForm(t)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-rose-605"
                              onClick={() => {
                                setDeletingId(t.id);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {filteredData.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-505 text-xs font-semibold">
                      No templates match the filter criteria.
                    </div>
                  )}
                </div>

                {totalRecords > 10 && (
                  <div className="flex items-center justify-between border-t dark:border-slate-800 pt-4 mt-2">
                    <span className="text-xs font-semibold text-slate-500">
                      Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalRecords)} of {totalRecords} records
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs cursor-pointer"
                        disabled={currentPage === 1 || loading}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="text-xs font-bold px-2">Page {currentPage} of {Math.ceil(totalRecords / 10)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs cursor-pointer"
                        disabled={currentPage >= Math.ceil(totalRecords / 10) || loading}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Main Header Panel for Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="space-y-1 text-left">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {viewMode === 'edit' ? 'Edit Notification Template' : 'Notification Template Setup'}
              </h1>
              <p className="text-sm text-slate-505 dark:text-slate-400">
                Setup variables and templates to render notification formats dynamically.
              </p>
            </div>
          </div>

          {/* Form Content Layout - Full Width */}
          <form onSubmit={handleFormSubmit} className="space-y-6 text-left">
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Organization ID <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formOrgId}
                      onChange={(e) => setFormOrgId(Number(e.target.value))}
                      placeholder="e.g. 1"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Link this template to a specific organization ID.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Template ID (System Generated)
                    </Label>
                    <Input
                      value={viewMode === 'edit' ? formNotificationId || String(editingTemplate?.id || '') : 'Auto-Generated'}
                      disabled
                      className="h-10 bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-505 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Automatic system-assigned code for integration references.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Name *</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Lead Assigned In-App"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notification Type *</Label>
                    <select
                      value={formType}
                      onChange={e => setFormType(e.target.value as any)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-955 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="In-App">In-App</option>
                      <option value="SMS">SMS</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Merge Fields Module *</Label>
                    <select
                      value={selectedModuleCode}
                      onChange={e => setSelectedModuleCode(e.target.value)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-955 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="LEAD">Lead</option>
                      <option value="DEAL">Deal</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject Line</Label>
                    {availableFields.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-5 px-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer p-0"
                            >
                              Insert Field ▾
                            </Button>
                          }
                        />
                        <DropdownMenuContent className="max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-md min-w-[180px] z-50">
                          {availableFields.map((field) => (
                            <DropdownMenuItem
                              key={field.name}
                              onClick={() => insertField('subject', field.name)}
                              className="text-xs font-semibold px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              {field.label} ({field.name})
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <Input
                    ref={subjectRef}
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. New Lead Notification"
                    className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                  />
                </div>
              </div>

              {formType === 'Email' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Template Mapping</Label>
                  <select
                    value={formEmailTplId}
                    onChange={e => setFormEmailTplId(e.target.value)}
                    className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                  >
                    <option value="">Select Email Template</option>
                    {emailTemplates.map(et => (
                      <option key={et.id} value={String(et.id)}>{et.Template_Name}</option>
                    ))}
                  </select>
                </div>
              )}



              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Template Body *</Label>
                  {availableFields.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-5 px-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer p-0"
                          >
                            Insert Field ▾
                          </Button>
                        }
                      />
                      <DropdownMenuContent className="max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-md min-w-[180px] z-50">
                        {availableFields.map((field) => (
                          <DropdownMenuItem
                            key={field.name}
                            onClick={() => insertField('body', field.name)}
                            className="text-xs font-semibold px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {field.label} ({field.name})
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                  <Textarea
                    ref={bodyRef}
                    value={formMsgTemplate}
                    onChange={(e) => setFormMsgTemplate(e.target.value)}
                    placeholder="Enter template message context. Use double brackets {{lead_name}} for dynamic mappings..."
                    required
                    className="min-h-[120px] border-slate-200 dark:border-slate-800 text-xs leading-relaxed rounded-xl font-mono"
                  />
                </div>

                {/* Status Toggle */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Template Settings</Label>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <Checkbox
                      id="formActive"
                      checked={formActive}
                      onCheckedChange={(checked) => setFormActive(!!checked)}
                    />
                    <label htmlFor="formActive" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                      Mark this notification template as active for messaging pipelines
                    </label>
                  </div>
                </div>

                {/* Cancel & Save Form buttons placed at bottom */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-4 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-330 cursor-pointer active:scale-95 transition-all"
                    onClick={() => setViewMode('list')}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    style={{ backgroundColor: primaryColor }}
                    className="text-white font-semibold rounded-xl h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer border-0"
                  >
                    {viewMode === 'edit' ? 'Save Changes' : 'Save & Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </>
      )}

      {/* Filter Modal Dialog */}
      <Dialog open={isFilterVisible} onOpenChange={setIsFilterVisible}>
        <DialogContent className="bg-white dark:bg-slate-900 border dark:border-slate-805 rounded-2xl max-w-md animate-in fade-in zoom-in duration-200">
          <DialogHeader className="text-left">
            <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              Workflow Notification Template Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              Apply filters to search through notification layouts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Template Name</Label>
                <Input
                  placeholder="e.g. Lead Assigned"
                  value={filterTemplateName}
                  onChange={(e) => setFilterTemplateName(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Organization ID</Label>
                <Input
                  placeholder="e.g. 1"
                  value={filterOrgId}
                  onChange={(e) => setFilterOrgId(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Status Preset</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-xs font-semibold border dark:border-slate-805 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-700 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active only</option>
                <option value="Inactive">Inactive only</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">From Date</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-805 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">To Date</Label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-805 text-xs font-semibold rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2 justify-end pt-3 border-t dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={async () => {
                setFilterTemplateName('');
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  const res = await fetchNotificationTemplates();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setTemplates(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load templates');
                } finally {
                  setLoading(false);
                }
              }}
              className="text-xs font-bold text-slate-505 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer h-9 px-4"
            >
              Reset
            </Button>
            <Button
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                setIsFilterVisible(false);
                loadData();
              }}
              className="text-white text-xs font-bold rounded-xl px-4 h-9 border-0 cursor-pointer"
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        itemType="notification template"
      />
    </div>
  );
}
