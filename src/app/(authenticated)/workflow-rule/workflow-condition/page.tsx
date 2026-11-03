'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCode,
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
  fetchWorkflowConditions,
  searchWorkflowConditions,
  createWorkflowCondition,
  updateWorkflowCondition,
  deleteWorkflowCondition,
  filterWorkflowConditions,
  fetchWorkflowRulesWithoutPagination
} from '@/service/api/Workflow/api';

interface WorkflowRule {
  id: string | number;
  Workflow_Name: string;
}

interface WorkflowCondition {
  id: string | number;
  Condition_Id: string;
  Workflow: string | number;
  Workflow_Name?: string;
  Field_Name: string;
  Operator: string;
  Value: string;
  Join_With: 'AND' | 'OR';
  Sequence: number;
  Parent_Group: number;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
}

export default function WorkflowConditionPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Mode state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [conditions, setConditions] = useState<WorkflowCondition[]>([]);
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [loading, setLoading] = useState(false);

  // Layout toggle
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterFieldName, setFilterFieldName] = useState('');
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active editing condition reference
  const [editingCondition, setEditingCondition] = useState<WorkflowCondition | null>(null);

  // Dialog State for Delete Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Form Inputs
  const [formWorkflowId, setFormWorkflowId] = useState('');
  const [formFieldName, setFormFieldName] = useState('');
  const [formOperator, setFormOperator] = useState('equals');
  const [formValue, setFormValue] = useState('');
  const [formJoinWith, setFormJoinWith] = useState<'AND' | 'OR'>('AND');
  const [formSequence, setFormSequence] = useState(1);
  const [formParentGroup, setFormParentGroup] = useState(0);
  const [formOrgId, setFormOrgId] = useState<number>(1);
  const [formConditionId, setFormConditionId] = useState<string>('');

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
      const hasFilters = filterFieldName || filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterFieldName) payload.Field_Name = filterFieldName;
        if (filterOrgId) payload.Organization_Id = Number(filterOrgId);
        if (statusFilter !== 'All') {
          payload.Is_Active = statusFilter === 'Active';
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [filterStartDate || '', filterEndDate || ''];
        }
        res = await filterWorkflowConditions(payload);
      } else if (searchQuery) {
        res = await searchWorkflowConditions(searchQuery);
      } else {
        res = await fetchWorkflowConditions(pageToLoad);
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setConditions(data);
      setTotalRecords(res?.count || data.length);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load workflow conditions');
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
    return conditions;
  }, [conditions]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((c) => ({
      'ID': c.Condition_Id || c.id,
      'Workflow ID': c.Workflow || '',
      'Field Name': c.Field_Name || '',
      'Operator': c.Operator || '',
      'Value': c.Value || '',
      'Join With': c.Join_With || 'AND',
      'Sequence': c.Sequence || 1,
      'Parent Group': c.Parent_Group || 0,
      'Organization ID': c.Organization_Id || 1
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow Conditions");
    XLSX.writeFile(wb, "WorkflowConditions.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Workflow', 'Field Name', 'Operator', 'Value', 'Join', 'Seq', 'Org ID']],
      body: filteredData.map((c) => [
        c.Condition_Id || String(c.id),
        String(c.Workflow || ''),
        c.Field_Name || '',
        c.Operator || '',
        c.Value || '',
        c.Join_With || 'AND',
        String(c.Sequence || 1),
        String(c.Organization_Id || 1)
      ])
    });
    doc.save('WorkflowConditions.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const handleOpenForm = (cnd: WorkflowCondition | null = null) => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const fallbackOrgId = storedOrgId ? Number(storedOrgId) : 1;

    if (cnd) {
      const workflowId = typeof cnd.Workflow === 'object' && cnd.Workflow ? String((cnd.Workflow as any).id) : String(cnd.Workflow || '');
      const field = cnd.Field_Name || '';
      const op = cnd.Operator || 'equals';
      const val = cnd.Value || '';
      const join = cnd.Join_With || 'AND';
      const seq = cnd.Sequence || 1;
      const parent = cnd.Parent_Group || 0;
      const cId = cnd.Condition_Id || '';

      let orgId = fallbackOrgId;
      const rawOrg = (cnd as any).Organization_Id ?? (cnd as any).Organization_Id_id ?? (cnd as any).organization_id ?? (cnd as any).organization_id_id;
      if (rawOrg !== undefined && rawOrg !== null) {
        if (typeof rawOrg === 'object') {
          orgId = rawOrg.id ?? rawOrg.Organization_Id ?? rawOrg.organization_id ?? fallbackOrgId;
        } else {
          orgId = Number(rawOrg);
        }
      }

      setEditingCondition(cnd);
      setFormWorkflowId(workflowId);
      setFormFieldName(field);
      setFormOperator(op);
      setFormValue(val);
      setFormJoinWith(join);
      setFormSequence(seq);
      setFormParentGroup(parent);
      setFormConditionId(cId);
      setFormOrgId(orgId);
      setViewMode('edit');
    } else {
      setEditingCondition(null);
      setFormWorkflowId(rules[0]?.id ? String(rules[0].id) : '');
      setFormFieldName('');
      setFormOperator('equals');
      setFormValue('');
      setFormJoinWith('AND');
      setFormSequence(conditions.length + 1);
      setFormParentGroup(0);
      setFormConditionId('');
      setFormOrgId(fallbackOrgId);
      setViewMode('create');
    }
  };

  // logWorkflowChange helper is imported directly from api.ts

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFieldName.trim() || !formOperator || !formValue.trim() || !formWorkflowId) {
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
        Field_Name: formFieldName,
        Operator: formOperator,
        Value: formValue,
        Join_With: formJoinWith,
        Sequence: Number(formSequence),
        Parent_Group: Number(formParentGroup),
        Organization_Id: formOrgId,
        Updated_By: parsedUserId
      };

      if (editingCondition) {
        payload.id = editingCondition.id;
        payload.Condition_Id = editingCondition.Condition_Id;
        payload.Created_By = getRelationId((editingCondition as any).Created_By ?? (editingCondition as any).Created_By_id) ?? parsedUserId;

        await updateWorkflowCondition(payload);
        toast.success('Workflow Condition updated successfully');
      } else {
        payload.Created_By = parsedUserId;

        const res = await createWorkflowCondition(payload);
        toast.success('Workflow Condition created successfully');
      }
      setViewMode('list');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save workflow condition');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      setLoading(true);
      try {
        await deleteWorkflowCondition(deletingId);
        toast.success('Workflow Condition deleted successfully');
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete condition');
      } finally {
        setDeletingId(null);
        setIsDeleteOpen(false);
        setLoading(false);
      }
    }
  };

  const tableColumns: ColumnConfig<WorkflowCondition>[] = [
    {
      key: 'Condition_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white pl-2">{row.Condition_Id || row.id}</span>
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
          <span className="inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-955/40 text-purple-705 dark:text-purple-450 border border-purple-200 dark:border-purple-900/40">
            {displayName}
          </span>
        );
      }
    },
    {
      key: 'Field_Name',
      header: 'Field Name',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-200">{row.Field_Name}</span>
    },
    {
      key: 'Operator',
      header: 'Operator',
      sortable: true,
      render: (row) => <span className="px-2 py-0.5 bg-slate-105 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-700 dark:text-slate-350">{row.Operator}</span>
    },
    {
      key: 'Value',
      header: 'Value',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-800 dark:text-slate-205">{row.Value}</span>
    },
    {
      key: 'Join_With',
      header: 'Join With',
      sortable: true,
      render: (row) => (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${row.Join_With === 'AND' ? 'bg-blue-50 text-blue-600 dark:bg-blue-955/30' : 'bg-orange-50 text-orange-600 dark:bg-orange-955/30'}`}>
          {row.Join_With}
        </span>
      )
    },
    {
      key: 'Sequence',
      header: 'Sequence',
      sortable: true,
      render: (row) => <span className="font-mono text-xs text-slate-700 dark:text-slate-355">{row.Sequence}</span>
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
            className="h-7 w-7 text-slate-400 hover:text-rose-605"
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
              <BreadcrumbPage>Workflow Condition</BreadcrumbPage>
            </BreadcrumbItem>
            {viewMode !== 'list' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewMode === 'edit' ? 'Edit Condition' : 'Create Condition'}</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Conditions</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Setup filters and matching expressions to dictate execution conditions for active rules.
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
                <Plus className="h-4 w-4" /> Create Condition
              </Button>
            </div>
          </div>


          {/* Table Container using ReusableTable */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Expression List</h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                  {filteredData.length} Items
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
                    placeholder="Search field names..."
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
              <ReusableTable<WorkflowCondition>
                columns={tableColumns}
                data={filteredData}
                loading={loading}
                initialPageSize={10}
                showGear={true}
                rowKey="id"
                borderless={true}
                title="Workflow Conditions"
                page={currentPage}
                totalRecords={totalRecords}
                onChangePage={handlePageChange}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {filteredData.map((c) => {
                    const name = c.Field_Name || 'Unnamed';
                    const op = c.Operator || '';
                    const val = c.Value || '';
                    const join = c.Join_With;

                    return (
                      <Card key={c.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
                        <div className="p-5 space-y-3.5 text-left">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider font-mono">
                              Sequence: {c.Sequence}
                            </Badge>
                            <Badge className={`text-[9px] font-bold rounded-full ${join === 'AND' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-605'}`}>
                              Join: {join}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-205">{name} {op}</h3>
                            <p className="text-xs text-slate-500 font-semibold">{val}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-3.5 border-t dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {c.Condition_Id || c.id}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleOpenForm(c)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-rose-650"
                              onClick={() => {
                                setDeletingId(c.id);
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
                      No conditions match the filter criteria.
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
                {viewMode === 'edit' ? 'Edit Workflow Condition' : 'Workflow Condition Setup'}
              </h1>
              <p className="text-sm text-slate-505 dark:text-slate-400">
                Setup conditions, comparison operators, and value parameters for active rules.
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
                    <p className="text-[10px] text-slate-400 font-medium">Link this condition to a specific organization ID.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Condition ID (System Generated)
                    </Label>
                     <Input
                      value={viewMode === 'edit' ? formConditionId || String(editingCondition?.id || '') : 'Auto-Generated'}
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
                    className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                  >
                    <option value="">Select Workflow Rule</option>
                    {rules.map(r => (
                      <option key={r.id} value={String(r.id)}>{r.Workflow_Name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field Name *</Label>
                    <Input
                      value={formFieldName}
                      onChange={(e) => setFormFieldName(e.target.value)}
                      placeholder="e.g. Lead_Source"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operator *</Label>
                    <select
                      value={formOperator}
                      onChange={e => setFormOperator(e.target.value)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-350 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="equals">Equals (=)</option>
                      <option value="not_equals">Not Equals (!=)</option>
                      <option value="contains">Contains</option>
                      <option value="starts_with">Starts With</option>
                      <option value="ends_with">Ends With</option>
                      <option value="greater_than">Greater Than (&gt;)</option>
                      <option value="less_than">Less Than (&lt;)</option>
                      <option value="changed">Changed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Value *</Label>
                    <Input
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      placeholder="e.g. Web Search"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Join With *</Label>
                    <select
                      value={formJoinWith}
                      onChange={e => setFormJoinWith(e.target.value as any)}
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
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
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parent Group</Label>
                    <Input
                      type="number"
                      value={formParentGroup}
                      onChange={(e) => setFormParentGroup(Number(e.target.value))}
                      placeholder="e.g. 0"
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                    />
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
              <Filter className="h-4 w-4 text-slate-505" />
              Workflow Condition Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              Apply filters to search through matching conditions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Field Name</Label>
                <Input
                  placeholder="e.g. Lead_Source"
                  value={filterFieldName}
                  onChange={(e) => setFilterFieldName(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Organization ID</Label>
                <Input
                  placeholder="e.g. 1"
                  value={filterOrgId}
                  onChange={(e) => setFilterOrgId(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-805 text-xs font-semibold rounded-xl"
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
                <Label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">From Date</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-805 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">To Date</Label>
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
                setFilterFieldName('');
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  const res = await fetchWorkflowConditions();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setConditions(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load conditions');
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
        itemType="workflow condition"
      />
    </div>
  );
}
