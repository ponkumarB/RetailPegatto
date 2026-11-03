'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
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
  fetchWorkflowRules,
  searchWorkflowRules,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  filterWorkflowRules,
  fetchWorkflowModulesWithoutPagination,
  fetchWorkflowEventsWithoutPagination
} from '@/service/api/Workflow/api';

interface WorkflowModule {
  id: string | number;
  Module_Name: string;
}

interface WorkflowEvent {
  id: string | number;
  Event_Name: string;
  Module: string | number;
}

interface WorkflowRule {
  id: string | number;
  Workflow_Id: string;
  Workflow_Name: string;
  Module: string | number;
  Module_Name?: string;
  Event: string | number;
  Event_Name?: string;
  Description: string;
  Status: boolean;
  Priority: number;
  Effective_Date: string;
  Expiry_Date: string;
  Stop_Other_Workflows: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
}

export default function WorkflowRuleCreationPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Mode state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [modules, setModules] = useState<WorkflowModule[]>([]);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [loading, setLoading] = useState(false);

  // Layout toggle
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterRuleName, setFilterRuleName] = useState('');
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active editing rule reference
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);

  // Dialog State for Delete Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Form Inputs
  const [formName, setFormName] = useState('');
  const [formModuleId, setFormModuleId] = useState('');
  const [formEventId, setFormEventId] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState(true);
  const [formPriority, setFormPriority] = useState(1);
  const [formEffective, setFormEffective] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formStopOther, setFormStopOther] = useState(false);
  const [formOrgId, setFormOrgId] = useState<number>(1);
  const [formRuleId, setFormRuleId] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadDependencies = async () => {
    try {
      const [modRes, evRes] = await Promise.all([
        fetchWorkflowModulesWithoutPagination(),
        fetchWorkflowEventsWithoutPagination()
      ]);
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data || modRes?.results || []));
      setEvents(Array.isArray(evRes) ? evRes : (evRes?.data || evRes?.results || []));
    } catch (err) {
      console.error('Failed to load dependency selectors', err);
    }
  };

  const loadData = async (pageToLoad = currentPage) => {
    setLoading(true);
    try {
      let res;
      const hasFilters = filterRuleName || filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterRuleName) payload.Workflow_Name = filterRuleName;
        if (filterOrgId) payload.Organization_Id = Number(filterOrgId);
        if (statusFilter !== 'All') {
          payload.Status = statusFilter === 'Active';
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [filterStartDate || '', filterEndDate || ''];
        }
        res = await filterWorkflowRules(payload);
      } else if (searchQuery) {
        res = await searchWorkflowRules(searchQuery);
      } else {
        res = await fetchWorkflowRules(pageToLoad);
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setRules(data);
      setTotalRecords(res?.count || data.length);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load workflow rules');
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
    return rules;
  }, [rules]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((r) => ({
      'ID': r.Workflow_Id || r.id,
      'Name': r.Workflow_Name || '',
      'Module ID': r.Module || '',
      'Event ID': r.Event || '',
      'Description': r.Description || '',
      'Priority': r.Priority || 1,
      'Effective Date': r.Effective_Date || '',
      'Expiry Date': r.Expiry_Date || '',
      'Status': r.Status ? 'Active' : 'Inactive',
      'Organization ID': r.Organization_Id || 1
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow Rules");
    XLSX.writeFile(wb, "WorkflowRules.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Workflow Name', 'Module', 'Event', 'Priority', 'Status', 'Org ID']],
      body: filteredData.map((r) => [
        r.Workflow_Id || String(r.id),
        r.Workflow_Name || '',
        String(r.Module || ''),
        String(r.Event || ''),
        String(r.Priority || 1),
        r.Status ? 'Active' : 'Inactive',
        String(r.Organization_Id || 1)
      ])
    });
    doc.save('WorkflowRules.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const handleOpenForm = (rule: WorkflowRule | null = null) => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const fallbackOrgId = storedOrgId ? Number(storedOrgId) : 1;

    if (rule) {
      const name = rule.Workflow_Name || '';
      const moduleId = typeof rule.Module === 'object' && rule.Module ? String((rule.Module as any).id) : String(rule.Module || '');
      const eventId = typeof rule.Event === 'object' && rule.Event ? String((rule.Event as any).id) : String(rule.Event || '');
      const desc = rule.Description || '';
      const activeStatus = rule.Status;
      const priority = rule.Priority || 1;
      const effective = rule.Effective_Date || '';
      const expiry = rule.Expiry_Date || '';
      const stopOther = rule.Stop_Other_Workflows;
      const wId = rule.Workflow_Id || '';

      let orgId = fallbackOrgId;
      const rawOrg = (rule as any).Organization_Id ?? (rule as any).Organization_Id_id ?? (rule as any).organization_id ?? (rule as any).organization_id_id;
      if (rawOrg !== undefined && rawOrg !== null) {
        if (typeof rawOrg === 'object') {
          orgId = rawOrg.id ?? rawOrg.Organization_Id ?? rawOrg.organization_id ?? fallbackOrgId;
        } else {
          orgId = Number(rawOrg);
        }
      }

      setEditingRule(rule);
      setFormName(name);
      setFormModuleId(moduleId);
      setFormEventId(eventId);
      setFormDesc(desc);
      setFormStatus(activeStatus);
      setFormPriority(priority);
      setFormEffective(effective);
      setFormExpiry(expiry);
      setFormStopOther(stopOther);
      setFormRuleId(wId);
      setFormOrgId(orgId);
      setViewMode('edit');
    } else {
      setEditingRule(null);
      setFormName('');
      setFormModuleId('');
      setFormEventId('');
      setFormDesc('');
      setFormStatus(true);
      setFormPriority(1);
      setFormEffective(new Date().toISOString().substring(0, 10));
      setFormExpiry('');
      setFormStopOther(false);
      setFormRuleId('');
      setFormOrgId(fallbackOrgId);
      setViewMode('create');
    }
  };

  // logWorkflowChange helper is imported directly from api.ts

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formModuleId || !formEventId) {
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
        Workflow_Name: formName,
        Module: Number(formModuleId),
        Event: Number(formEventId),
        Description: formDesc,
        Status: formStatus,
        Priority: Number(formPriority),
        Effective_Date: formEffective,
        Expiry_Date: formExpiry || null,
        Stop_Other_Workflows: formStopOther,
        Organization_Id: formOrgId,
        Updated_By: parsedUserId
      };

      if (editingRule) {
        payload.id = editingRule.id;
        payload.Workflow_Id = editingRule.Workflow_Id;
        payload.Created_By = getRelationId((editingRule as any).Created_By ?? (editingRule as any).Created_By_id) ?? parsedUserId;

        const res = await updateWorkflowRule(payload);
        toast.success('Workflow Rule updated successfully');
      } else {
        payload.Created_By = parsedUserId;

        const res = await createWorkflowRule(payload);
        toast.success('Workflow Rule created successfully');
      }
      setViewMode('list');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save workflow rule');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (row: WorkflowRule) => {
    try {
      await updateWorkflowRule({
        ...row,
        Status: !row.Status
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
        await deleteWorkflowRule(deletingId);
        toast.success('Workflow Rule deleted successfully');
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete rule');
      } finally {
        setDeletingId(null);
        setIsDeleteOpen(false);
        setLoading(false);
      }
    }
  };

  const tableColumns: ColumnConfig<WorkflowRule>[] = [
    {
      key: 'Workflow_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white pl-2">{row.Workflow_Id || row.id}</span>
    },
    {
      key: 'Workflow_Name',
      header: 'Workflow Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{row.Workflow_Name}</span>
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
      key: 'Event',
      header: 'Event',
      sortable: true,
      render: (row) => {
        const eventId = typeof row.Event === 'object' && row.Event ? (row.Event as any).id : row.Event;
        const found = events.find(e => String(e.id) === String(eventId));
        const displayName = found ? found.Event_Name : (typeof row.Event === 'object' && row.Event ? (row.Event as any).Event_Name : row.Event_Name || String(row.Event || ''));
        return (
          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-955/40 text-purple-700 dark:text-purple-450 border border-purple-200 dark:border-purple-900/40">
            {displayName}
          </span>
        );
      }
    },
    {
      key: 'Priority',
      header: 'Priority',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-700 dark:text-slate-350">{row.Priority}</span>
    },
    {
      key: 'Status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <button
          onClick={() => handleToggleStatus(row)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
            row.Status
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-455 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-rose-50 dark:bg-rose-955/35 text-rose-700 dark:text-rose-455 border-rose-200 dark:border-rose-900/60'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.Status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {row.Status ? 'Active' : 'Inactive'}
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
              <BreadcrumbPage>Workflow Rule</BreadcrumbPage>
            </BreadcrumbItem>
            {viewMode !== 'list' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewMode === 'edit' ? 'Edit Rule' : 'Create Rule'}</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Rules</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure workflow rules containing automation logic, priority, active conditions, and tasks.
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
                <Plus className="h-4 w-4" /> Create Rule
              </Button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Rules</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{rules.length}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl shrink-0">
                <FileText className="h-5 w-5 text-blue-505" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {rules.filter(r => r.Status).length}
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
                  {rules.filter(r => !r.Status).length}
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
                <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Rules Catalog</h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                  {filteredData.length} Rules
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search rules..."
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
              <ReusableTable<WorkflowRule>
                columns={tableColumns}
                data={filteredData}
                loading={loading}
                initialPageSize={10}
                showGear={true}
                rowKey="id"
                borderless={true}
                title="Workflow Rules"
                page={currentPage}
                totalRecords={totalRecords}
                onChangePage={handlePageChange}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {filteredData.map((r) => {
                    const name = r.Workflow_Name || 'Unnamed';
                    const code = r.Workflow_Id || '';
                    const desc = r.Description || 'No description provided';
                    const active = r.Status;

                    return (
                      <Card key={r.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
                        <div className="p-5 space-y-3.5 text-left">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider font-mono">
                              Priority: {r.Priority}
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
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {r.Workflow_Id || r.id}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleOpenForm(r)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-rose-650"
                              onClick={() => {
                                setDeletingId(r.id);
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
                      No rules match the filter criteria.
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
                {viewMode === 'edit' ? 'Edit Workflow Rule' : 'Workflow Rule Setup'}
              </h1>
              <p className="text-sm text-slate-505 dark:text-slate-400">
                Setup conditions, expiration boundaries, and parameters for automated logic sequencing.
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
                    <p className="text-[10px] text-slate-400 font-medium">Link this rule to a specific organization ID.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Workflow ID (System Generated)
                    </Label>
                    <Input
                      value={viewMode === 'edit' ? formRuleId || String(editingRule?.id || '') : 'Auto-Generated'}
                      disabled
                      className="h-10 bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-550 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Automatic system-assigned code for integration references.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module *</Label>
                    <select
                      value={formModuleId}
                      onChange={e => setFormModuleId(e.target.value)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-350 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="">Select Module</option>
                      {modules.map(m => (
                        <option key={m.id} value={String(m.id)}>{m.Module_Name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Event *</Label>
                    <select
                      value={formEventId}
                      onChange={e => setFormEventId(e.target.value)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="">Select Event</option>
                      {events.filter(evt => {
                        if (!formModuleId) return true;
                        const modId = typeof evt.Module === 'object' && evt.Module ? String((evt.Module as any).id) : String(evt.Module || '');
                        return modId === formModuleId;
                      }).map(evt => (
                        <option key={evt.id} value={String(evt.id)}>{evt.Event_Name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow Name *</Label>
                    <Input
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Lead Route Logic"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority *</Label>
                    <Input
                      type="number"
                      value={formPriority}
                      onChange={(e) => setFormPriority(Number(e.target.value))}
                      placeholder="e.g. 1"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Effective Date *</Label>
                    <Input
                      type="date"
                      value={formEffective}
                      onChange={(e) => setFormEffective(e.target.value)}
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiry Date</Label>
                    <Input
                      type="date"
                      value={formExpiry}
                      onChange={(e) => setFormExpiry(e.target.value)}
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <div className="space-y-3 pt-6">
                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <Checkbox
                        id="formStopOther"
                        checked={formStopOther}
                        onCheckedChange={(checked) => setFormStopOther(!!checked)}
                      />
                      <label htmlFor="formStopOther" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                        Stop processing other matching rules on evaluation match
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                  <Textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Describe the objective or actions triggered by this automated rule..."
                    className="min-h-[100px] border-slate-200 dark:border-slate-800 text-xs leading-relaxed rounded-xl"
                  />
                </div>

                {/* Status Toggle */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow Settings</Label>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <Checkbox
                      id="formStatus"
                      checked={formStatus}
                      onCheckedChange={(checked) => setFormStatus(!!checked)}
                    />
                    <label htmlFor="formStatus" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                      Mark this workflow rule as active for automatic evaluations
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
              Workflow Rule Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              Apply filters to search through active rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Workflow Name</Label>
                <Input
                  placeholder="e.g. Lead Route"
                  value={filterRuleName}
                  onChange={(e) => setFilterRuleName(e.target.value)}
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
                className="w-full text-xs font-semibold border dark:border-slate-805 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
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
                setFilterRuleName('');
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  const res = await fetchWorkflowRules();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setRules(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load workflow rules');
                } finally {
                  setLoading(false);
                }
              }}
              className="text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer h-9 px-4"
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
        itemType="workflow rule"
      />
    </div>
  );
}
