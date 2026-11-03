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
  fetchWorkflowNotifications,
  searchWorkflowNotifications,
  createWorkflowNotification,
  updateWorkflowNotification,
  deleteWorkflowNotification,
  filterWorkflowNotifications,
  fetchWorkflowRulesWithoutPagination,
  fetchNotificationTemplatesWithoutPagination
} from '@/service/api/Workflow/api';

interface WorkflowRule {
  id: string | number;
  Workflow_Name: string;
}

interface NotificationTemplate {
  id: string | number;
  Notification_Name: string;
  Notification_Type?: 'In-App' | 'SMS' | 'WhatsApp' | 'Email';
}

interface WorkflowNotification {
  id: string | number;
  WorkflowNotification_Id: string;
  Workflow: string | number;
  Workflow_Name?: string;
  Notification: string | number;
  Notification_Template_Name?: string;
  Send_Email: boolean;
  Send_SMS: boolean;
  Send_Whatsapp: boolean;
  Send_Push: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
}

export default function WorkflowNotificationPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Mode state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [loading, setLoading] = useState(false);

  // Layout toggle
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active editing reference
  const [editingNotification, setEditingNotification] = useState<WorkflowNotification | null>(null);

  // Dialog State for Delete Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Form Inputs
  const [formWorkflowId, setFormWorkflowId] = useState('');
  const [formTemplateId, setFormTemplateId] = useState('');
  const [formSendEmail, setFormSendEmail] = useState(true);
  const [formSendSMS, setFormSendSMS] = useState(false);
  const [formSendWhatsapp, setFormSendWhatsapp] = useState(false);
  const [formSendPush, setFormSendPush] = useState(false);
  const [formOrgId, setFormOrgId] = useState<number>(1);
  const [formWorkflowNotificationId, setFormWorkflowNotificationId] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadDependencies = async () => {
    try {
      const [rRes, tRes] = await Promise.all([
        fetchWorkflowRulesWithoutPagination(),
        fetchNotificationTemplatesWithoutPagination()
      ]);
      setRules(Array.isArray(rRes) ? rRes : (rRes?.data || rRes?.results || []));
      setTemplates(Array.isArray(tRes) ? tRes : (tRes?.data || tRes?.results || []));
    } catch (err) {
      console.error('Failed to load rules and templates', err);
    }
  };

  const loadData = async (pageToLoad = currentPage) => {
    setLoading(true);
    try {
      let res;
      const hasFilters = filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterOrgId) payload.Organization_Id = Number(filterOrgId);
        if (statusFilter !== 'All') {
          payload.Is_Active = statusFilter === 'Active';
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [filterStartDate || '', filterEndDate || ''];
        }
        res = await filterWorkflowNotifications(payload);
      } else if (searchQuery) {
        res = await searchWorkflowNotifications(searchQuery);
      } else {
        res = await fetchWorkflowNotifications(pageToLoad);
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setNotifications(data);
      setTotalRecords(res?.count || data.length);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load workflow notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
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
    return notifications;
  }, [notifications]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((n) => ({
      'ID': n.WorkflowNotification_Id || n.id,
      'Workflow ID': n.Workflow || '',
      'Notification ID': n.Notification || '',
      'Send Email': n.Send_Email ? 'Yes' : 'No',
      'Send SMS': n.Send_SMS ? 'Yes' : 'No',
      'Send Whatsapp': n.Send_Whatsapp ? 'Yes' : 'No',
      'Send Push': n.Send_Push ? 'Yes' : 'No',
      'Organization ID': n.Organization_Id || 1
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow Notifications");
    XLSX.writeFile(wb, "WorkflowNotifications.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Workflow', 'Template', 'Channels', 'Org ID']],
      body: filteredData.map((n) => [
        n.WorkflowNotification_Id || String(n.id),
        String(n.Workflow || ''),
        String(n.Notification || ''),
        [
          n.Send_Email ? 'Email' : '',
          n.Send_SMS ? 'SMS' : '',
          n.Send_Whatsapp ? 'Whatsapp' : '',
          n.Send_Push ? 'Push' : ''
        ].filter(Boolean).join(', '),
        String(n.Organization_Id || 1)
      ])
    });
    doc.save('WorkflowNotifications.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const handleOpenForm = (notif: WorkflowNotification | null = null) => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const fallbackOrgId = storedOrgId ? Number(storedOrgId) : 1;

    if (notif) {
      const workflowId = typeof notif.Workflow === 'object' && notif.Workflow ? String((notif.Workflow as any).id) : String(notif.Workflow || '');
      const templateId = typeof notif.Notification === 'object' && notif.Notification ? String((notif.Notification as any).id) : String(notif.Notification || '');
      const sEmail = notif.Send_Email;
      const sSMS = notif.Send_SMS;
      const sWhatsapp = notif.Send_Whatsapp;
      const sPush = notif.Send_Push;
      const wnId = notif.WorkflowNotification_Id || '';

      let orgId = fallbackOrgId;
      const rawOrg = (notif as any).Organization_Id ?? (notif as any).Organization_Id_id ?? (notif as any).organization_id ?? (notif as any).organization_id_id;
      if (rawOrg !== undefined && rawOrg !== null) {
        if (typeof rawOrg === 'object') {
          orgId = rawOrg.id ?? rawOrg.Organization_Id ?? rawOrg.organization_id ?? fallbackOrgId;
        } else {
          orgId = Number(rawOrg);
        }
      }

      setEditingNotification(notif);
      setFormWorkflowId(workflowId);
      setFormTemplateId(templateId);
      setFormSendEmail(sEmail);
      setFormSendSMS(sSMS);
      setFormSendWhatsapp(sWhatsapp);
      setFormSendPush(sPush);
      setFormWorkflowNotificationId(wnId);
      setFormOrgId(orgId);
      setViewMode('edit');
    } else {
      setEditingNotification(null);
      setFormWorkflowId(rules[0]?.id ? String(rules[0].id) : '');
      setFormTemplateId(templates[0]?.id ? String(templates[0].id) : '');
      setFormSendEmail(true);
      setFormSendSMS(false);
      setFormSendWhatsapp(false);
      setFormSendPush(false);
      setFormWorkflowNotificationId('');
      setFormOrgId(fallbackOrgId);
      setViewMode('create');
    }
  };

  // logWorkflowChange helper is imported directly from api.ts

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWorkflowId || !formTemplateId) {
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
        Workflow: Number(formWorkflowId),
        Notification: Number(formTemplateId),
        Send_Email: formSendEmail,
        Send_SMS: formSendSMS,
        Send_Whatsapp: formSendWhatsapp,
        Send_Push: formSendPush,
        Organization_Id: formOrgId,
        Updated_By: parsedUserId
      };

      if (editingNotification) {
        payload.id = editingNotification.id;
        payload.WorkflowNotification_Id = editingNotification.WorkflowNotification_Id;
        payload.Created_By = getRelationId((editingNotification as any).Created_By ?? (editingNotification as any).Created_By_id) ?? parsedUserId;

        await updateWorkflowNotification(payload);
        toast.success('Workflow Notification updated successfully');
      } else {
        payload.Created_By = parsedUserId;

        const res = await createWorkflowNotification(payload);
        toast.success('Workflow Notification created successfully');
      }
      setViewMode('list');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save workflow notification');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      setLoading(true);
      try {
        await deleteWorkflowNotification(deletingId);
        toast.success('Workflow Notification deleted successfully');
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete notification');
      } finally {
        setDeletingId(null);
        setIsDeleteOpen(false);
        setLoading(false);
      }
    }
  };

  const tableColumns: ColumnConfig<WorkflowNotification>[] = [
    {
      key: 'WorkflowNotification_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white pl-2">{row.WorkflowNotification_Id || row.id}</span>
    },
    {
      key: 'Workflow',
      header: 'Workflow Rule',
      sortable: true,
      render: (row) => {
        const workflowId = typeof row.Workflow === 'object' && row.Workflow ? (row.Workflow as any).id : row.Workflow;
        const found = rules.find(r => String(r.id) === String(workflowId));
        const displayName = found ? found.Workflow_Name : (typeof row.Workflow === 'object' && row.Workflow ? (row.Workflow as any).Workflow_Name : row.Workflow_Name || String(row.Workflow || ''));
        return (
          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-955/40 text-purple-700 dark:text-purple-450 border border-purple-200 dark:border-purple-900/40">
            {displayName}
          </span>
        );
      }
    },
    {
      key: 'Notification',
      header: 'Template',
      sortable: true,
      render: (row) => {
        const templateId = typeof row.Notification === 'object' && row.Notification ? (row.Notification as any).id : row.Notification;
        const found = templates.find(t => String(t.id) === String(templateId));
        const templateName = found ? found.Notification_Name : (typeof row.Notification === 'object' && row.Notification ? (row.Notification as any).Notification_Name : row.Notification_Template_Name || String(row.Notification || ''));
        const displayType = found ? found.Notification_Type : (typeof row.Notification === 'object' && row.Notification ? (row.Notification as any).Notification_Type : undefined);
        const displayName = displayType ? `${templateName} (${displayType})` : templateName;
        return (
          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-955/40 text-blue-700 dark:text-blue-450 border border-blue-200 dark:border-blue-900/40">
            {displayName}
          </span>
        );
      }
    },

    {
      key: 'Channels',
      header: 'Channels',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-1">
          {row.Send_Email && <Badge variant="outline" className="text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-650">Email</Badge>}
          {row.Send_SMS && <Badge variant="outline" className="text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-650">SMS</Badge>}
          {row.Send_Whatsapp && <Badge variant="outline" className="text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-650">Whatsapp</Badge>}
          {row.Send_Push && <Badge variant="outline" className="text-[9px] bg-slate-50 dark:bg-slate-800 text-slate-650">Push</Badge>}
        </div>
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
              <BreadcrumbPage>Workflow Notification</BreadcrumbPage>
            </BreadcrumbItem>
            {viewMode !== 'list' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewMode === 'edit' ? 'Edit Notification' : 'Create Notification'}</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Notifications</h1>
              <p className="text-sm text-slate-505 dark:text-slate-400">
                Bind notification templates to rule events and dispatch across SMS, Whatsapp, In-App, or Email.
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
                <Plus className="h-4 w-4" /> Create Notification
              </Button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Bindings</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{notifications.length}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl shrink-0">
                <Bell className="h-5 w-5 text-blue-505" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Channels</span>
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-455">{notifications.filter(n => n.Send_Email).length}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-955/30 rounded-2xl shrink-0">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SMS Channels</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {notifications.filter(n => n.Send_SMS).length}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl shrink-0">
                <Zap className="h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WhatsApp Channels</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {notifications.filter(n => n.Send_Whatsapp).length}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-955/30 rounded-2xl shrink-0">
                <Zap className="h-5 w-5 text-indigo-505" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Push Channels</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {notifications.filter(n => n.Send_Push).length}
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-955/30 rounded-2xl shrink-0">
                <Zap className="h-5 w-5 text-orange-505" />
              </div>
            </div>
          </div>

          {/* Table Container using ReusableTable */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Dispatch Map</h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                  {filteredData.length} Bindings
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {/* Status select filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-bold border dark:border-slate-805 bg-slate-50 dark:bg-slate-950 p-2 px-3 rounded-xl text-slate-655 dark:text-slate-350 focus:outline-none h-8.5 cursor-pointer"
                >
                  <option value="All">All Channels</option>
                  <option value="Active">Email Enabled</option>
                  <option value="Inactive">Email Disabled</option>
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
                    placeholder="Search bindings..."
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
              <ReusableTable<WorkflowNotification>
                columns={tableColumns}
                data={filteredData}
                loading={loading}
                initialPageSize={10}
                showGear={true}
                rowKey="id"
                borderless={true}
                title="Workflow Notifications"
                page={currentPage}
                totalRecords={totalRecords}
                onChangePage={handlePageChange}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                   {filteredData.map((n) => {
                    const workflowId = typeof n.Workflow === 'object' && n.Workflow ? (n.Workflow as any).id : n.Workflow;
                    const foundRule = rules.find(r => String(r.id) === String(workflowId));
                    const ruleName = foundRule ? foundRule.Workflow_Name : 'Rule Context';

                    const templateId = typeof n.Notification === 'object' && n.Notification ? (n.Notification as any).id : n.Notification;
                    const foundTpl = templates.find(t => String(t.id) === String(templateId));
                    const templateName = foundTpl 
                      ? (foundTpl.Notification_Type ? `${foundTpl.Notification_Name} (${foundTpl.Notification_Type})` : foundTpl.Notification_Name)
                      : 'Template Context';

                    return (
                      <Card key={n.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
                        <div className="p-5 space-y-3.5 text-left">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider font-mono">
                              Notification
                            </Badge>
                            <Badge className="text-[9px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-955/35 text-emerald-605 border border-emerald-205">
                              Active
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{templateName}</h3>
                            <p className="text-xs text-slate-505 font-semibold mt-1">Rule: {ruleName}</p>
                            <p className="text-xs text-slate-505 font-semibold">Template: {templateName}</p>
                            <div className="flex flex-wrap items-center gap-1 pt-1.5">
                              {n.Send_Email && <Badge variant="outline" className="text-[8px] uppercase tracking-wide">Email</Badge>}
                              {n.Send_SMS && <Badge variant="outline" className="text-[8px] uppercase tracking-wide">SMS</Badge>}
                              {n.Send_Whatsapp && <Badge variant="outline" className="text-[8px] uppercase tracking-wide">WhatsApp</Badge>}
                              {n.Send_Push && <Badge variant="outline" className="text-[8px] uppercase tracking-wide">Push</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-3.5 border-t dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {n.WorkflowNotification_Id || n.id}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleOpenForm(n)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-rose-605"
                              onClick={() => {
                                setDeletingId(n.id);
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
                      No notifications match the filter criteria.
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
                {viewMode === 'edit' ? 'Edit Workflow Notification' : 'Workflow Notification Setup'}
              </h1>
              <p className="text-sm text-slate-505 dark:text-slate-400">
                Setup recipient rules, communication targets, and channel limits for automated messages.
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
                    <p className="text-[10px] text-slate-400 font-medium">Link this notification to a specific organization ID.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Notification ID (System Generated)
                    </Label>
                     <Input
                      value={viewMode === 'edit' ? formWorkflowNotificationId || String(editingNotification?.id || '') : 'Auto-Generated'}
                      disabled
                      className="h-10 bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-505 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Automatic system-assigned code for integration references.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow Rule *</Label>
                    <select
                      value={formWorkflowId}
                      onChange={e => setFormWorkflowId(e.target.value)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="">Select Workflow Rule</option>
                      {rules.map(r => (
                        <option key={r.id} value={String(r.id)}>{r.Workflow_Name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Notification Template *</Label>
                    <select
                      value={formTemplateId}
                      onChange={e => setFormTemplateId(e.target.value)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="">Select Template</option>
                      {templates.map(t => (
                        <option key={t.id} value={String(t.id)}>
                          {t.Notification_Name}{t.Notification_Type ? ` (${t.Notification_Type})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>



                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enabled Communication Channels</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Checkbox
                        id="formSendEmail"
                        checked={formSendEmail}
                        onCheckedChange={(checked) => setFormSendEmail(!!checked)}
                      />
                      <label htmlFor="formSendEmail" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                        Send Email
                      </label>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Checkbox
                        id="formSendSMS"
                        checked={formSendSMS}
                        onCheckedChange={(checked) => setFormSendSMS(!!checked)}
                      />
                      <label htmlFor="formSendSMS" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                        Send SMS
                      </label>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Checkbox
                        id="formSendWhatsapp"
                        checked={formSendWhatsapp}
                        onCheckedChange={(checked) => setFormSendWhatsapp(!!checked)}
                      />
                      <label htmlFor="formSendWhatsapp" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                        Send WhatsApp
                      </label>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Checkbox
                        id="formSendPush"
                        checked={formSendPush}
                        onCheckedChange={(checked) => setFormSendPush(!!checked)}
                      />
                      <label htmlFor="formSendPush" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                        Send Push
                      </label>
                    </div>
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
              Workflow Notification Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              Apply filters to search through notification bindings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">Organization ID</Label>
              <Input
                placeholder="e.g. 1"
                value={filterOrgId}
                onChange={(e) => setFilterOrgId(e.target.value)}
                className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
              />
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
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  const res = await fetchWorkflowNotifications();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setNotifications(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load notifications');
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
        itemType="workflow notification"
      />
    </div>
  );
}
