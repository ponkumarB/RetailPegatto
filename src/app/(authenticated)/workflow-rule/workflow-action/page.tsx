'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Play,
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
  fetchWorkflowActions,
  searchWorkflowActions,
  createWorkflowAction,
  updateWorkflowAction,
  deleteWorkflowAction,
  filterWorkflowActions,
  fetchWorkflowRulesWithoutPagination
} from '@/service/api/Workflow/api';

interface WorkflowRule {
  id: string | number;
  Workflow_Name: string;
}

interface WorkflowAction {
  id: string | number;
  Action_Id: string;
  Workflow: string | number;
  Workflow_Name?: string;
  Action_Type: string;
  Sequence: number;
  Delay_Value: number;
  Delay_Type: string;
  Configuration: string;
  Is_Active: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
}

export default function WorkflowActionPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Mode state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [actions, setActions] = useState<WorkflowAction[]>([]);
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [loading, setLoading] = useState(false);

  // Layout toggle
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterActionType, setFilterActionType] = useState('');
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active editing action reference
  const [editingAction, setEditingAction] = useState<WorkflowAction | null>(null);

  // Dialog State for Delete Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Form Inputs
  const [formWorkflowId, setFormWorkflowId] = useState('');
  const [formActionType, setFormActionType] = useState('Email');
  const [formSequence, setFormSequence] = useState(1);
  const [formDelayValue, setFormDelayValue] = useState(0);
  const [formDelayType, setFormDelayType] = useState('Immediate');
  const [formConfig, setFormConfig] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formOrgId, setFormOrgId] = useState<number>(1);
  const [formActionId, setFormActionId] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadRules = async () => {
    try {
      const res = await fetchWorkflowRulesWithoutPagination();
      setRules(Array.isArray(res) ? res : (res?.data || res?.results || []));
    } catch (err) {
      console.error('Failed to load rules', err);
    }
  };

  const loadData = async (pageToLoad = currentPage) => {
    setLoading(true);
    try {
      let res;
      const hasFilters = filterActionType || filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterActionType) payload.Action_Type = filterActionType;
        if (filterOrgId) payload.Organization_Id = Number(filterOrgId);
        if (statusFilter !== 'All') {
          payload.Is_Active = statusFilter === 'Active';
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [filterStartDate || '', filterEndDate || ''];
        }
        res = await filterWorkflowActions(payload);
      } else if (searchQuery) {
        res = await searchWorkflowActions(searchQuery);
      } else {
        res = await fetchWorkflowActions(pageToLoad);
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setActions(data);
      setTotalRecords(res?.count || data.length);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load workflow actions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
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
    return actions;
  }, [actions]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((a) => ({
      'ID': a.Action_Id || a.id,
      'Workflow ID': a.Workflow || '',
      'Action Type': a.Action_Type || '',
      'Sequence': a.Sequence || 1,
      'Delay Value': a.Delay_Value || 0,
      'Delay Type': a.Delay_Type || 'Immediate',
      'Configuration': typeof a.Configuration === 'object' ? JSON.stringify(a.Configuration) : a.Configuration || '',
      'Status': a.Is_Active ? 'Active' : 'Inactive',
      'Organization ID': a.Organization_Id || 1
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow Actions");
    XLSX.writeFile(wb, "WorkflowActions.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Workflow', 'Action Type', 'Sequence', 'Delay', 'Status', 'Org ID']],
      body: filteredData.map((a) => [
        a.Action_Id || String(a.id),
        String(a.Workflow || ''),
        a.Action_Type || '',
        String(a.Sequence || 1),
        `${a.Delay_Value} ${a.Delay_Type}`,
        a.Is_Active ? 'Active' : 'Inactive',
        String(a.Organization_Id || 1)
      ])
    });
    doc.save('WorkflowActions.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const handleOpenForm = (act: WorkflowAction | null = null) => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const fallbackOrgId = storedOrgId ? Number(storedOrgId) : 1;

    if (act) {
      const workflowId = typeof act.Workflow === 'object' && act.Workflow ? String((act.Workflow as any).id) : String(act.Workflow || '');
      const type = act.Action_Type || 'Email';
      const seq = act.Sequence || 1;
      const dValue = act.Delay_Value || 0;
      const dType = act.Delay_Type || 'Immediate';
      const conf = typeof act.Configuration === 'object' ? JSON.stringify(act.Configuration, null, 2) : act.Configuration || '';
      const active = act.Is_Active;
      const aId = act.Action_Id || '';

      let orgId = fallbackOrgId;
      const rawOrg = (act as any).Organization_Id ?? (act as any).Organization_Id_id ?? (act as any).organization_id ?? (act as any).organization_id_id;
      if (rawOrg !== undefined && rawOrg !== null) {
        if (typeof rawOrg === 'object') {
          orgId = rawOrg.id ?? rawOrg.Organization_Id ?? rawOrg.organization_id ?? fallbackOrgId;
        } else {
          orgId = Number(rawOrg);
        }
      }

      setEditingAction(act);
      setFormWorkflowId(workflowId);
      setFormActionType(type);
      setFormSequence(seq);
      setFormDelayValue(dValue);
      setFormDelayType(dType);
      setFormConfig(conf);
      setFormActive(active);
      setFormActionId(aId);
      setFormOrgId(orgId);
      setViewMode('edit');
    } else {
      setEditingAction(null);
      setFormWorkflowId(rules[0]?.id ? String(rules[0].id) : '');
      setFormActionType('Email');
      setFormSequence(actions.length + 1);
      setFormDelayValue(0);
      setFormDelayType('Immediate');
      setFormConfig('');
      setFormActive(true);
      setFormActionId('');
      setFormOrgId(fallbackOrgId);
      setViewMode('create');
    }
  };

  // logWorkflowChange helper is imported directly from api.ts

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formActionType || !formWorkflowId) {
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
        Action_Type: formActionType,
        Sequence: Number(formSequence),
        Delay_Value: Number(formDelayValue),
        Delay_Type: formDelayType,
        Configuration: formConfig,
        Is_Active: formActive,
        Organization_Id: formOrgId,
        Updated_By: parsedUserId
      };

      if (editingAction) {
        payload.id = editingAction.id;
        payload.Action_Id = editingAction.Action_Id;
        payload.Created_By = getRelationId((editingAction as any).Created_By ?? (editingAction as any).Created_By_id) ?? parsedUserId;

        await updateWorkflowAction(payload);
        toast.success('Workflow Action updated successfully');
      } else {
        payload.Created_By = parsedUserId;

        const res = await createWorkflowAction(payload);
        toast.success('Workflow Action created successfully');
      }
      setViewMode('list');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save workflow action');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (row: WorkflowAction) => {
    try {
      await updateWorkflowAction({
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
        await deleteWorkflowAction(deletingId);
        toast.success('Workflow Action deleted successfully');
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete action');
      } finally {
        setDeletingId(null);
        setIsDeleteOpen(false);
        setLoading(false);
      }
    }
  };

  const tableColumns: ColumnConfig<WorkflowAction>[] = [
    {
      key: 'Action_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white pl-2">{row.Action_Id || row.id}</span>
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
      key: 'Action_Type',
      header: 'Action Type',
      sortable: true,
      render: (row) => <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{row.Action_Type}</span>
    },
    {
      key: 'Sequence',
      header: 'Sequence',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-700 dark:text-slate-350">{row.Sequence}</span>
    },
    {
      key: 'Delay',
      header: 'Delay Context',
      sortable: true,
      render: (row) => <span className="px-2 py-0.5 bg-slate-105 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-705 dark:text-slate-350">{row.Delay_Value} {row.Delay_Type}</span>
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
              ? 'bg-emerald-50 dark:bg-emerald-955/35 text-emerald-705 dark:text-emerald-455 border-emerald-205'
              : 'bg-rose-50 dark:bg-rose-955/35 text-rose-705 dark:text-rose-455 border-rose-205'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.Is_Active ? 'bg-emerald-550' : 'bg-rose-550'}`} />
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
              <BreadcrumbPage>Workflow Action</BreadcrumbPage>
            </BreadcrumbItem>
            {viewMode !== 'list' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewMode === 'edit' ? 'Edit Action' : 'Create Action'}</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Actions</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Setup custom execution hooks, email automation actions, and delays attached to rules.
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
                <Plus className="h-4 w-4" /> Create Action
              </Button>
            </div>
          </div>


          {/* Table Container using ReusableTable */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Operation Sequence</h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                  {filteredData.length} Actions
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
                    placeholder="Search action type..."
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
              <ReusableTable<WorkflowAction>
                columns={tableColumns}
                data={filteredData}
                loading={loading}
                initialPageSize={10}
                showGear={true}
                rowKey="id"
                borderless={true}
                title="Workflow Actions"
                page={currentPage}
                totalRecords={totalRecords}
                onChangePage={handlePageChange}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {filteredData.map((a) => {
                    const type = a.Action_Type || 'Email';
                    const seq = a.Sequence || 1;
                    const active = a.Is_Active;

                    return (
                      <Card key={a.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
                        <div className="p-5 space-y-3.5 text-left">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider font-mono">
                              Seq: {seq}
                            </Badge>
                            <Badge className={`text-[9px] font-bold rounded-full ${active ? 'bg-emerald-50 dark:bg-emerald-955/35 text-emerald-600 border border-emerald-205' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200'}`}>
                              {active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">{type}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed truncate">
                              {typeof a.Configuration === 'object' 
                                ? JSON.stringify(a.Configuration) 
                                : a.Configuration || 'No configuration payload'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-3.5 border-t dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {a.Action_Id || a.id}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleOpenForm(a)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-rose-605"
                              onClick={() => {
                                setDeletingId(a.id);
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
                    <div className="col-span-full py-12 text-center text-slate-550 text-xs font-semibold">
                      No actions match the filter criteria.
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
                {viewMode === 'edit' ? 'Edit Workflow Action' : 'Workflow Action Setup'}
              </h1>
              <p className="text-sm text-slate-505 dark:text-slate-400">
                Setup custom execution hooks, configurations, and delays attached to rules.
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
                    <p className="text-[10px] text-slate-400 font-medium">Link this action to a specific organization ID.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Action ID (System Generated)
                    </Label>
                     <Input
                      value={viewMode === 'edit' ? formActionId || String(editingAction?.id || '') : 'Auto-Generated'}
                      disabled
                      className="h-10 bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-505 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Automatic system-assigned code for integration references.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow Rule *</Label>
                  <select
                    value={formWorkflowId}
                    onChange={e => setFormWorkflowId(e.target.value)}
                    className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-350 focus:outline-none h-10 cursor-pointer"
                  >
                    <option value="">Select Workflow Rule</option>
                    {rules.map(r => (
                      <option key={r.id} value={String(r.id)}>{r.Workflow_Name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Action Type *</Label>
                    <select
                      value={formActionType}
                      onChange={e => setFormActionType(e.target.value)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="Email">Email</option>
                      <option value="Task">Task</option>
                      <option value="Notification">Notification</option>
                      <option value="Field_Update">Field Update</option>
                      <option value="Webhook">Webhook</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sequence *</Label>
                    <Input
                      type="number"
                      value={formSequence}
                      onChange={(e) => setFormSequence(Number(e.target.value))}
                      placeholder="e.g. 1"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delay Type *</Label>
                    <select
                      value={formDelayType}
                      onChange={e => setFormDelayType(e.target.value)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="Minutes">Minutes</option>
                      <option value="Hours">Hours</option>
                      <option value="Days">Days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delay Value (Offset)</Label>
                    <Input
                      type="number"
                      value={formDelayValue}
                      onChange={(e) => setFormDelayValue(Number(e.target.value))}
                      placeholder="e.g. 10"
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Configuration Payload</Label>
                  <Textarea
                    value={formConfig}
                    onChange={(e) => setFormConfig(e.target.value)}
                    placeholder="Provide JSON structure or text describing details, updating fields, webhook targets..."
                    className="min-h-[100px] border-slate-200 dark:border-slate-800 text-xs leading-relaxed rounded-xl"
                  />
                </div>

                {/* Status Toggle */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Action Settings</Label>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <Checkbox
                      id="formActive"
                      checked={formActive}
                      onCheckedChange={(checked) => setFormActive(!!checked)}
                    />
                    <label htmlFor="formActive" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                      Mark this action as active for execution pipelines
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
              Workflow Action Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              Apply filters to search through automation hooks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Action Type</Label>
                <Input
                  placeholder="e.g. Email"
                  value={filterActionType}
                  onChange={(e) => setFilterActionType(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Organization ID</Label>
                <Input
                  placeholder="e.g. 1"
                  value={filterOrgId}
                  onChange={(e) => setFilterOrgId(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Status Preset</Label>
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
                setFilterActionType('');
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  const res = await fetchWorkflowActions();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setActions(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load actions');
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
        itemType="workflow action"
      />
    </div>
  );
}
