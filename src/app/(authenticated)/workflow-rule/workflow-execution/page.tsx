'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
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
  fetchWorkflowExecutionsWithoutPagination,
  searchWorkflowExecutions,
  updateWorkflowExecution,
  filterWorkflowExecutions,
  fetchWorkflowRulesWithoutPagination
} from '@/service/api/Workflow/api';

interface WorkflowRule {
  id: string | number;
  Workflow_Name: string;
}

interface WorkflowExecution {
  id: string | number;
  Execution_Id: string;
  Workflow: string | number;
  Workflow_Name?: string;
  Record_Id: string;
  Module: string;
  Status: 'Success' | 'Failed' | 'Running' | 'Pending';
  Started_On: string;
  Finished_On: string;
  Duration: number;
  Error: string;
  Retry_Count: number;
  Organization_Id?: number;
  Created_Date?: string;
}

export default function WorkflowExecutionPage() {
  const { primaryColor } = useStore();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Failed' | 'Running' | 'Pending'>('All');
  const [loading, setLoading] = useState(false);

  // Layout toggle
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterWorkflowName, setFilterWorkflowName] = useState('');
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const loadRules = async () => {
    try {
      const res = await fetchWorkflowRulesWithoutPagination();
      setRules(Array.isArray(res) ? res : (res?.data || res?.results || []));
    } catch (err) {
      console.error('Failed to load rules', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      const hasFilters = filterWorkflowName || filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterWorkflowName) payload.Workflow_Name = filterWorkflowName;
        if (filterOrgId) payload.Organization_Id = Number(filterOrgId);
        if (statusFilter !== 'All') {
          payload.Status = statusFilter;
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [filterStartDate || '', filterEndDate || ''];
        }
        res = await filterWorkflowExecutions(payload);
      } else if (searchQuery) {
        res = await searchWorkflowExecutions(searchQuery);
      } else {
        res = await fetchWorkflowExecutionsWithoutPagination();
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setExecutions(data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load execution logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter]);

  const filteredData = useMemo(() => {
    return executions;
  }, [executions]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((e) => ({
      'Execution ID': e.Execution_Id || e.id,
      'Workflow ID': e.Workflow || '',
      'Record ID': e.Record_Id || '',
      'Module': e.Module || '',
      'Status': e.Status || '',
      'Started On': e.Started_On || '',
      'Finished On': e.Finished_On || '',
      'Duration (ms)': e.Duration || 0,
      'Retry Count': e.Retry_Count || 0,
      'Error': e.Error || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow Executions");
    XLSX.writeFile(wb, "WorkflowExecutions.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Workflow', 'Record', 'Module', 'Status', 'Duration (ms)']],
      body: filteredData.map((e) => [
        e.Execution_Id || String(e.id),
        String(e.Workflow || ''),
        e.Record_Id || '',
        e.Module || '',
        e.Status || '',
        String(e.Duration || 0)
      ])
    });
    doc.save('WorkflowExecutions.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const handleRetry = async (row: WorkflowExecution) => {
    setLoading(true);
    try {
      await updateWorkflowExecution({
        ...row,
        Status: 'Pending',
        Error: '',
        Retry_Count: (row.Retry_Count || 0) + 1
      });
      toast.success('Execution queued for retry successfully');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to trigger retry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-955/35 text-emerald-705 dark:text-emerald-450 border border-emerald-205">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            Success
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-955/35 text-rose-705 dark:text-rose-455 border border-rose-205">
            <XCircle className="h-3 w-3 text-rose-500" />
            Failed
          </span>
        );
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-955/35 text-blue-705 dark:text-blue-450 border border-blue-205">
            <RefreshCcw className="h-3 w-3 animate-spin text-blue-500" />
            Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-955/30 text-amber-705 dark:text-amber-450 border border-amber-205">
            <Clock className="h-3 w-3 text-amber-500" />
            Pending
          </span>
        );
    }
  };

  const tableColumns: ColumnConfig<WorkflowExecution>[] = [
    {
      key: 'Execution_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white pl-2">{row.Execution_Id || row.id}</span>
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
          <div>
            <span className="font-extrabold text-slate-805 dark:text-slate-205 block">
              {row.Error || displayName}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 max-w-md truncate">
              Workflow: {displayName} | Module: {row.Module} | Record: {row.Record_Id}
            </span>
          </div>
        );
      }
    },
    {
      key: 'Status',
      header: 'Status',
      sortable: true,
      render: (row) => getStatusBadge(row.Status)
    },
    {
      key: 'Started_On',
      header: 'Execution window',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <span className="block text-slate-700 dark:text-slate-300 font-semibold">{row.Started_On ? new Date(row.Started_On).toLocaleString() : ''}</span>
          <span className="block text-[10px] text-slate-400">Duration: {row.Duration} ms</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Retry',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2 pr-2">
          {row.Status === 'Failed' && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              onClick={() => handleRetry(row)}
              title="Retry Execution"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          )}
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
              <BreadcrumbPage>Workflow Execution</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="space-y-6">
        {/* Main Header Panel */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="space-y-1 text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Executions</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Audit trails and trace execution logs of automatically mapped automation triggers.
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
              onClick={loadData}
              variant="outline"
              className="h-9 px-3 border-slate-205 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh logs
            </Button>
          </div>
        </div>


        {/* Table Container using ReusableTable */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Audit Logs</h2>
              <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                {filteredData.length} Runs
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Status select filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs font-bold border dark:border-slate-850 bg-slate-50 dark:bg-slate-955 p-2 px-3 rounded-xl text-slate-655 dark:text-slate-350 focus:outline-none h-8.5 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Running">Running</option>
                <option value="Pending">Pending</option>
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
                  placeholder="Search execution log..."
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
            <ReusableTable<WorkflowExecution>
              columns={tableColumns}
              data={filteredData}
              loading={loading}
              initialPageSize={10}
              showGear={true}
              rowKey="id"
              borderless={true}
              title="Workflow Executions"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
              {filteredData.map((e) => {
                const workflowId = typeof e.Workflow === 'object' && e.Workflow ? (e.Workflow as any).id : e.Workflow;
                const found = rules.find(r => String(r.id) === String(workflowId));
                const displayName = found ? found.Workflow_Name : (typeof e.Workflow === 'object' && e.Workflow ? (e.Workflow as any).Workflow_Name : e.Workflow_Name || String(e.Workflow || ''));
                const cardTitle = e.Error || displayName;
                const cardSubtitle = `Workflow: ${displayName} | Module: ${e.Module} | Record: ${e.Record_Id}`;

                return (
                  <Card key={e.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
                    <div className="p-5 space-y-3.5 text-left">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider font-mono">
                          Duration: {e.Duration} ms
                        </Badge>
                        {getStatusBadge(e.Status)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-sm text-slate-855 dark:text-slate-200 truncate" title={cardTitle}>{cardTitle}</h3>
                        <p className="text-xs text-slate-505 leading-relaxed truncate" title={cardSubtitle}>{cardSubtitle}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-3.5 border-t dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {e.Execution_Id || e.id}</span>
                      {e.Status === 'Failed' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          onClick={() => handleRetry(e)}
                          title="Retry Execution"
                        >
                          <RefreshCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
              {filteredData.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-505 text-xs font-semibold">
                  No execution logs match the filter criteria.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal Dialog */}
      <Dialog open={isFilterVisible} onOpenChange={setIsFilterVisible}>
        <DialogContent className="bg-white dark:bg-slate-900 border dark:border-slate-805 rounded-2xl max-w-md animate-in fade-in zoom-in duration-200">
          <DialogHeader className="text-left">
            <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              Workflow Execution Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-405 pt-1">
              Apply filters to search through execution history logs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Workflow Name</Label>
                <Input
                  placeholder="e.g. Lead Assigned"
                  value={filterWorkflowName}
                  onChange={(e) => setFilterWorkflowName(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">Organization ID</Label>
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
                className="w-full text-xs font-semibold border dark:border-slate-805 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Success">Success only</option>
                <option value="Failed">Failed only</option>
                <option value="Running">Running only</option>
                <option value="Pending">Pending only</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">From Date</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-850 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">To Date</Label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-850 text-xs font-semibold rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2 justify-end pt-3 border-t dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={async () => {
                setFilterWorkflowName('');
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  const res = await fetchWorkflowExecutionsWithoutPagination();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setExecutions(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load logs');
                } finally {
                  setLoading(false);
                }
              }}
              className="text-xs font-bold text-slate-555 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer h-9 px-4"
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
    </div>
  );
}
