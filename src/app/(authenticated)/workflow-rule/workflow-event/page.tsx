'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Plus,
  Edit3,
  Trash2,
  Search,
  Layers,
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
  fetchWorkflowEvents,
  searchWorkflowEvents,
  createWorkflowEvent,
  updateWorkflowEvent,
  deleteWorkflowEvent,
  filterWorkflowEvents,
  fetchWorkflowModulesWithoutPagination
} from '@/service/api/Workflow/api';

interface WorkflowModule {
  id: string | number;
  Module_Name: string;
}

interface WorkflowEvent {
  id: string | number;
  Event_Id: string;
  Module: string | number;
  Module_Id?: string | number;
  Module_Name?: string;
  Event_Name: string;
  Event_Code: string;
  Description: string;
  Is_Active: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
}

const MODULE_EVENTS_MAPPING: Record<string, string[]> = {
  'Dashboards': [
    'Dashboard Viewed',
    'Dashboard Refreshed',
    'KPI Updated',
    'Widget Added',
    'Widget Removed',
    'Dashboard Exported',
    'Dashboard Shared'
  ],
  'Leads': [
    'Lead Created',
    'Lead Updated',
    'Lead Assigned',
    'Lead Reassigned',
    'Lead Status Changed',
    'Lead Qualified',
    'Lead Unqualified',
    'Lead Converted',
    'Lead Follow-up Scheduled',
    'Lead Follow-up Completed',
    'Lead Lost',
    'Lead Won',
    'Lead Deleted',
    'Lead Email Created',
    'Lead Email Sent',
    'Lead Welcome Email Sent',
    'Lead Assignment Email Sent',
    'Lead Follow-up Email Sent',
    'Lead Conversion Email Sent',
    'Lead Reminder Sent',
    'Lead WhatsApp Sent',
    'Lead SMS Sent',
    'Lead Call Logged',
    'Lead Meeting Scheduled',
    'Lead Meeting Completed',
    'Lead Source Changed',
    'Lead Priority Changed',
    'Lead Score Updated',
    'Lead Duplicate Detected',
    'Lead Imported',
    'Lead Exported',
    'Lead Qualification Email Sent',
    'Lead Nurturing Email Sent',
    'Lead Proposal Email Sent',
    'Lead Quote Email Sent',
    'Lead Lost Email Sent',
    'Lead Re-engagement Email Sent'
  ],
  'Company': [
    'Company Created',
    'Company Updated',
    'Company Assigned',
    'Company Status Changed',
    'Company Deleted',
    'Company Email Sent',
    'Company Contact Added',
    'Company Contact Removed'
  ],
  'Contacts': [
    'Contact Created',
    'Contact Updated',
    'Contact Assigned',
    'Contact Converted',
    'Contact Deleted',
    'Contact Email Sent',
    'Contact WhatsApp Sent',
    'Contact Birthday Reminder'
  ],
  'Deals': [
    'Deal Created',
    'Deal Updated',
    'Deal Assigned',
    'Deal Stage Changed',
    'Deal Won',
    'Deal Lost',
    'Deal Closed',
    'Deal Reopened',
    'Deal Approval Requested',
    'Deal Approved',
    'Deal Rejected',
    'Deal Email Sent',
    'Deal Deleted'
  ],
  'Project Estimation': [
    'Estimation Created',
    'Estimation Updated',
    'Estimation Submitted',
    'Estimation Approved',
    'Estimation Rejected',
    'Estimation Sent to Customer'
  ],
  'Sales Orders': [
    'Sales Order Created',
    'Sales Order Updated',
    'Sales Order Approved',
    'Sales Order Cancelled',
    'Sales Order Completed',
    'Sales Order Invoice Generated'
  ],
  'Invoice': [
    'Invoice Created',
    'Invoice Updated',
    'Invoice Approved',
    'Invoice Sent',
    'Invoice Paid',
    'Invoice Partially Paid',
    'Invoice Overdue',
    'Invoice Cancelled',
    'Invoice Refunded'
  ],
  'Sales Target': [
    'Target Created',
    'Target Updated',
    'Target Assigned',
    'Target Achieved',
    'Target Missed'
  ],
  'Territory Management': [
    'Territory Created',
    'Territory Updated',
    'Territory Assigned',
    'Territory Reassigned',
    'Territory Deleted',
    'Territory Rule Updated',
    'Territory Quota Updated'
  ],
  'Analytics': [
    'Report Generated',
    'Dashboard Viewed',
    'Analytics Exported',
    'Forecast Generated',
    'Prediction Completed'
  ],
  'Reports': [
    'Report Generated',
    'Report Scheduled',
    'Report Exported',
    'Report Shared',
    'Report Downloaded'
  ],
  'Campaigns': [
    'Campaign Created',
    'Campaign Started',
    'Campaign Paused',
    'Campaign Completed',
    'Campaign Cancelled',
    'Campaign Email Sent',
    'Campaign SMS Sent',
    'Campaign WhatsApp Sent',
    'Campaign Performance Updated'
  ],
  'Call Management': [
    'Call Assigned',
    'Call Started',
    'Call Completed',
    'Call Missed',
    'Call Cancelled',
    'Call Follow-up Scheduled',
    'Call Recording Uploaded'
  ],
  'Tasks': [
    'Task Created',
    'Task Assigned',
    'Task Reassigned',
    'Task Started',
    'Task In Progress',
    'Task Completed',
    'Task Closed',
    'Task Reopened',
    'Task Overdue',
    'Task Reminder Sent',
    'Task Comment Added'
  ],
  'Presales': [
    'Document Created',
    'Document Updated',
    'Document Approved',
    'Document Rejected',
    'Document Shared',
    'Proposal Sent',
    'Proposal Accepted',
    'Proposal Rejected'
  ],
  'Projects': [
    'Project Created',
    'Project Started',
    'Project Updated',
    'Project On Hold',
    'Project Completed',
    'Project Closed',
    'Project Cancelled',
    'Project Archived'
  ],
  'Milestones': [
    'Milestone Created',
    'Milestone Updated',
    'Milestone Completed',
    'Milestone Delayed'
  ],
  'Deliverables': [
    'Deliverable Created',
    'Deliverable Submitted',
    'Deliverable Approved',
    'Deliverable Rejected'
  ],
  'Project Tasks': [
    'Task Allocated',
    'Task Started',
    'Task Completed',
    'Task Delayed',
    'Task Reassigned'
  ],
  'Resource Management': [
    'Resource Added',
    'Resource Updated',
    'Resource Allocated',
    'Resource Released',
    'Resource Utilization Updated',
    'Resource Over Utilized',
    'Resource Under Utilized'
  ],
  'Sprint': [
    'Sprint Created',
    'Sprint Started',
    'Sprint Completed',
    'Sprint Closed'
  ],
  'Scrum Meeting': [
    'Meeting Scheduled',
    'Meeting Started',
    'Meeting Completed',
    'MOM Generated'
  ],
  'Quality Assurance': [
    'Test Plan Created',
    'Test Case Created',
    'Test Case Updated',
    'Test Executed',
    'Test Passed',
    'Test Failed',
    'Defect Created',
    'Defect Assigned',
    'Defect Fixed',
    'Defect Closed',
    'SLA Violated'
  ],
  'Tickets': [
    'Ticket Created',
    'Ticket Assigned',
    'Ticket Escalated',
    'Ticket Resolved',
    'Ticket Closed',
    'Ticket Reopened'
  ],
  'Incident': [
    'Incident Created',
    'Incident Assigned',
    'Incident Resolved',
    'Incident Closed'
  ],
  'Customer Success': [
    'Customer Onboarded',
    'Customer Retained',
    'Customer Churn Detected',
    'Customer Health Updated'
  ],
  'Feedback': [
    'Feedback Received',
    'Feedback Reviewed',
    'Feedback Closed'
  ],
  'Assets': [
    'Asset Added',
    'Asset Updated',
    'Asset Allocated',
    'Asset Returned',
    'Asset Maintenance Scheduled',
    'Asset Disposed'
  ],
  'Customization': [
    'Form Customized',
    'Template Created',
    'Template Updated'
  ],
  'Roles & Users': [
    'Role Created',
    'Role Updated',
    'User Created',
    'User Updated',
    'User Activated',
    'User Deactivated',
    'User Login',
    'User Logout',
    'Password Changed',
    'Password Reset',
    'User Locked',
    'User Unlocked'
  ],
  'Settings': [
    'Settings Updated',
    'Privileges Updated',
    'Mailbox Configured',
    'Notification Rule Updated',
    'Deal Probability Updated'
  ],
  'Workflow Rules': [
    'Workflow Created',
    'Workflow Updated',
    'Workflow Activated',
    'Workflow Deactivated',
    'Workflow Executed',
    'Workflow Failed'
  ],
  'Email Templates': [
    'Template Created',
    'Template Updated',
    'Template Deleted'
  ],
  'Notifications': [
    'Notification Created',
    'Notification Sent',
    'Notification Delivered',
    'Notification Failed',
    'Notification Read'
  ],
  'Organisation': [
    'Organisation Created',
    'Organisation Updated'
  ],
  'Bench Management': [
    'Employee Added to Bench',
    'Employee Removed from Bench',
    'Bench Duration Updated'
  ],
  'Competitor Tracking': [
    'Competitor Added',
    'Competitor Updated'
  ],
  'Add-ons': [
    'Add-on Requested',
    'Add-on Approved',
    'Add-on Rejected',
    'Storage Increased',
    'User Count Updated'
  ],
  'Problem Management': [
    'Problem Created',
    'Problem Assigned',
    'Problem Resolved',
    'Problem Closed',
    'Troubleshoot Guide Updated'
  ],
  'Customer Segmentation': [
    'Segment Created',
    'Segment Updated',
    'Customer Added to Segment',
    'Customer Removed from Segment'
  ],
  'Dropdown Values': [
    'Dropdown Value Added',
    'Dropdown Value Updated',
    'Dropdown Value Deleted'
  ],
  'Payment Terms': [
    'Payment Terms Created',
    'Payment Terms Updated',
    'Payment Terms Approved'
  ]
};

export default function WorkflowEventPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Mode state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [modules, setModules] = useState<WorkflowModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [loading, setLoading] = useState(false);
  
  // Layout toggle
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterEventName, setFilterEventName] = useState('');
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active editing event reference
  const [editingEvent, setEditingEvent] = useState<WorkflowEvent | null>(null);

  // Dialog State for Delete Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formModuleId, setFormModuleId] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOrgId, setFormOrgId] = useState<number>(1);
  const [formEventId, setFormEventId] = useState<string>('');

  const STATIC_EVENT_NAMES = useMemo(() => {
    return Array.from(new Set(Object.values(MODULE_EVENTS_MAPPING).flat()));
  }, []);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadModules = async () => {
    try {
      const res = await fetchWorkflowModulesWithoutPagination();
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setModules(data);
    } catch (err) {
      console.error('Failed to load modules', err);
    }
  };

  const loadData = async (pageToLoad = currentPage) => {
    setLoading(true);
    try {
      let res;
      const hasFilters = filterEventName || filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterEventName) payload.Event_Name = filterEventName;
        if (filterOrgId) payload.Organization_Id = Number(filterOrgId);
        if (statusFilter !== 'All') {
          payload.Is_Active = statusFilter === 'Active';
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [filterStartDate || '', filterEndDate || ''];
        }
        res = await filterWorkflowEvents(payload);
      } else if (searchQuery) {
        res = await searchWorkflowEvents(searchQuery);
      } else {
        res = await fetchWorkflowEvents(pageToLoad);
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setEvents(data);
      setTotalRecords(res?.count || data.length);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load workflow events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
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
    return events;
  }, [events]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((e) => ({
      'ID': e.Event_Id || e.id,
      'Name': e.Event_Name || '',
      'Code': e.Event_Code || '',
      'Module ID': e.Module || '',
      'Description': e.Description || '',
      'Status': e.Is_Active ? 'Active' : 'Inactive',
      'Organization ID': e.Organization_Id || 1
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow Events");
    XLSX.writeFile(wb, "WorkflowEvents.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Event Name', 'Event Code', 'Module', 'Status', 'Org ID']],
      body: filteredData.map((e) => [
        e.Event_Id || String(e.id),
        e.Event_Name || '',
        e.Event_Code || '',
        String(e.Module || ''),
        e.Is_Active ? 'Active' : 'Inactive',
        String(e.Organization_Id || 1)
      ])
    });
    doc.save('WorkflowEvents.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const handleOpenForm = (evt: WorkflowEvent | null = null) => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const fallbackOrgId = storedOrgId ? Number(storedOrgId) : 1;

    if (evt) {
      const name = evt.Event_Name || '';
      const code = evt.Event_Code || '';
      const moduleId = typeof evt.Module === 'object' && evt.Module ? String((evt.Module as any).id) : String(evt.Module || '');
      const desc = evt.Description || '';
      const active = evt.Is_Active;
      const evtId = evt.Event_Id || '';

      let orgId = fallbackOrgId;
      const rawOrg = (evt as any).Organization_Id ?? (evt as any).Organization_Id_id ?? (evt as any).organization_id ?? (evt as any).organization_id_id;
      if (rawOrg !== undefined && rawOrg !== null) {
        if (typeof rawOrg === 'object') {
          orgId = rawOrg.id ?? rawOrg.Organization_Id ?? rawOrg.organization_id ?? fallbackOrgId;
        } else {
          orgId = Number(rawOrg);
        }
      }

      setEditingEvent(evt);
      setFormName(name);
      setFormCode(code);
      setFormModuleId(moduleId);
      setFormDesc(desc);
      setFormActive(active);
      setFormEventId(evtId);
      setFormOrgId(orgId);
      setViewMode('edit');
    } else {
      setEditingEvent(null);
      setFormName('');
      setFormCode('');
      setFormModuleId('');
      setFormDesc('');
      setFormActive(true);
      setFormEventId('');
      setFormOrgId(fallbackOrgId);
      setViewMode('create');
    }
  };

  // logWorkflowChange helper is imported directly from api.ts

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim() || !formModuleId) {
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
        Event_Name: formName,
        Event_Code: formCode.toUpperCase(),
        Module: Number(formModuleId),
        Description: formDesc,
        Is_Active: formActive,
        Organization_Id: formOrgId,
        Updated_By: parsedUserId
      };

      if (editingEvent) {
        payload.id = editingEvent.id;
        payload.Event_Id = editingEvent.Event_Id;
        payload.Created_By = getRelationId((editingEvent as any).Created_By ?? (editingEvent as any).Created_By_id) ?? parsedUserId;

        await updateWorkflowEvent(payload);
        toast.success('Workflow Event updated successfully');
      } else {
        payload.Created_By = parsedUserId;

        const res = await createWorkflowEvent(payload);
        toast.success('Workflow Event created successfully');
      }
      setViewMode('list');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save workflow event');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (row: WorkflowEvent) => {
    try {
      await updateWorkflowEvent({
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
        await deleteWorkflowEvent(deletingId);
        toast.success('Workflow Event deleted successfully');
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete event');
      } finally {
        setDeletingId(null);
        setIsDeleteOpen(false);
        setLoading(false);
      }
    }
  };

  const tableColumns: ColumnConfig<WorkflowEvent>[] = [
    {
      key: 'Event_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white pl-2">{row.Event_Id || row.id}</span>
    },
    {
      key: 'Event_Name',
      header: 'Event Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{row.Event_Name}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5 max-w-xs truncate">{row.Description}</span>
        </div>
      )
    },
    {
      key: 'Module',
      header: 'Module',
      sortable: true,
      render: (row) => {
        const moduleId = typeof row.Module === 'object' && row.Module ? (row.Module as any).id : row.Module;
        const found = modules.find(m => String(m.id) === String(moduleId));
        const displayName = found ? found.Module_Name : (typeof row.Module === 'object' && row.Module ? (row.Module as any).Module_Name : row.Module_Name || String(row.Module || ''));
        return (
          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-955/40 text-blue-700 dark:text-blue-450 border border-blue-200 dark:border-blue-900/40">
            {displayName}
          </span>
        );
      }
    },
    {
      key: 'Event_Code',
      header: 'Event Code',
      sortable: true,
      render: (row) => <span className="px-2 py-0.5 bg-slate-105 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-700 dark:text-slate-355">{row.Event_Code}</span>
    },
    {
      key: 'Is_Active',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
            row.Is_Active
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-455 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-rose-50 dark:bg-rose-955/35 text-rose-700 dark:text-rose-455 border-rose-200 dark:border-rose-900/60'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.Is_Active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
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
              <BreadcrumbPage>Workflow Event</BreadcrumbPage>
            </BreadcrumbItem>
            {viewMode !== 'list' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewMode === 'edit' ? 'Edit Event' : 'Create Event'}</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Events</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Define trigger actions and operational hooks for automated sequences.
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
                <Plus className="h-4 w-4" /> Create Event
              </Button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Events</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{events.length}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl shrink-0">
                <Layers className="h-5 w-5 text-blue-505" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {events.filter(e => e.Is_Active).length}
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
                  {events.filter(e => !e.Is_Active).length}
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
                <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Trigger Conditions</h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                  {filteredData.length} Events
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                {/* Status select filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="text-xs font-bold border dark:border-slate-805 bg-slate-50 dark:bg-slate-950 p-2 px-3 rounded-xl text-slate-650 dark:text-slate-350 focus:outline-none h-8.5 cursor-pointer"
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search events..."
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
              <ReusableTable<WorkflowEvent>
                columns={tableColumns}
                data={filteredData}
                loading={loading}
                initialPageSize={10}
                showGear={true}
                rowKey="id"
                borderless={true}
                title="Workflow Events"
                page={currentPage}
                totalRecords={totalRecords}
                onChangePage={handlePageChange}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {filteredData.map((e) => {
                    const name = e.Event_Name || 'Unnamed';
                    const code = e.Event_Code || '';
                    const desc = e.Description || 'No description provided';
                    const active = e.Is_Active;

                    return (
                      <Card key={e.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
                        <div className="p-5 space-y-3.5 text-left">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider font-mono">
                              {code}
                            </Badge>
                            <Badge className={`text-[9px] font-bold rounded-full ${active ? 'bg-emerald-50 dark:bg-emerald-955/35 text-emerald-600 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200'}`}>
                              {active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{name}</h3>
                            <p className="text-xs text-slate-505 line-clamp-2">{desc}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-3.5 border-t dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {e.Event_Id || e.id}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleOpenForm(e)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-rose-650"
                              onClick={() => {
                                setDeletingId(e.id);
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
                      No events match the filter criteria.
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
                {viewMode === 'edit' ? 'Edit Workflow Event' : 'Workflow Event Setup'}
              </h1>
              <p className="text-sm text-slate-505 dark:text-slate-400">
                Setup triggers and link operational events to target system models.
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
                    <p className="text-[10px] text-slate-400 font-medium">Link this event to a specific organization ID.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Event ID (System Generated)
                    </Label>
                    <Input
                      value={viewMode === 'edit' ? formEventId || String(editingEvent?.id || '') : 'Auto-Generated'}
                      disabled
                      className="h-10 bg-slate-50 dark:bg-slate-905 border-slate-205 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-505 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Automatic system-assigned code for integration references.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module *</Label>
                  <select
                    value={formModuleId}
                    onChange={e => setFormModuleId(e.target.value)}
                    className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-955 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                  >
                    <option value="">Select Module</option>
                    {modules.map(m => (
                      <option key={m.id} value={String(m.id)}>{m.Module_Name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-medium">Select the system module context for this action hook.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Name *</Label>
                    <select
                      value={formName}
                      onChange={(e) => {
                        const selectedEvent = e.target.value;
                        setFormName(selectedEvent);
                        if (selectedEvent) {
                          setFormCode(selectedEvent.trim().toUpperCase().replace(/\s+/g, '_'));
                        }
                      }}
                      required
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-955 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="">Select Event Name</option>
                      {STATIC_EVENT_NAMES.map(evt => (
                        <option key={evt} value={evt}>{evt}</option>
                      ))}
                      {formName && !STATIC_EVENT_NAMES.includes(formName) && (
                        <option value={formName}>{formName}</option>
                      )}
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium">Select when this trigger event activates.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Code *</Label>
                    <Input
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. LEAD_CREATE"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold font-mono rounded-xl"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">System identifier matching your backend trigger setup.</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                  <Textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Describe the operational actions that prompt this trigger event..."
                    className="min-h-[100px] border-slate-200 dark:border-slate-800 text-xs leading-relaxed rounded-xl"
                  />
                </div>

                {/* Event Status Toggle */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event Settings</Label>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <Checkbox
                      id="formActive"
                      checked={formActive}
                      onCheckedChange={(checked) => setFormActive(!!checked)}
                    />
                    <label htmlFor="formActive" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                      Mark this event as active to enable automatic execution mappings
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
              Workflow Event Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-405 pt-1">
              Apply filters to search through trigger events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Name</Label>
                <Input
                  placeholder="e.g. On Lead Created"
                  value={filterEventName}
                  onChange={(e) => setFilterEventName(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organization ID</Label>
                <Input
                  placeholder="e.g. 1"
                  value={filterOrgId}
                  onChange={(e) => setFilterOrgId(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status Preset</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-xs font-semibold border dark:border-slate-855 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-700 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active only</option>
                <option value="Inactive">Inactive only</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">From Date</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-805 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To Date</Label>
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
                setFilterEventName('');
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  const res = await fetchWorkflowEvents();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setEvents(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load workflow events');
                } finally {
                  setLoading(false);
                }
              }}
              className="text-xs font-bold text-slate-500 hover:bg-slate-550 dark:hover:bg-slate-800 rounded-xl cursor-pointer h-9 px-4"
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
        itemType="workflow event"
      />
    </div>
  );
}
