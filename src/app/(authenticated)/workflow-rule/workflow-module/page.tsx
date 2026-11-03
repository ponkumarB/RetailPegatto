'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  Play,
  Pause,
  Plus,
  Edit3,
  Trash2,
  Search,
  Layers,
  Zap,
  Info,
  LayoutGrid,
  List,
  Download,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { toast } from 'sonner';
import {
  fetchWorkflowModules,
  searchWorkflowModules,
  createWorkflowModule,
  updateWorkflowModule,
  deleteWorkflowModule,
  filterWorkflowModules
} from '@/service/api/Workflow/api';

interface WorkflowModule {
  id: string | number;
  Module_Id: string;
  Module_Name: string;
  Module_Code: string;
  Description: string;
  Is_Active: boolean;
  Created_By_Name?: string;
  Created_Date?: string;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
}

export default function WorkflowModulePage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Mode state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [modules, setModules] = useState<WorkflowModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [loading, setLoading] = useState(false);
  
  // Grid/List toggle layout format
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterModuleCode, setFilterModuleCode] = useState('');
  const [filterModuleName, setFilterModuleName] = useState('');
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active editing module reference
  const [editingModule, setEditingModule] = useState<WorkflowModule | null>(null);

  // Dialog State for Delete Confirmation
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formModuleId, setFormModuleId] = useState<string>('');
  const [formOrgId, setFormOrgId] = useState<number>(1);

  const [menuFeatures, setMenuFeatures] = useState<{ id: number; Module_key: string; Module_name: string }[]>([]);

  useEffect(() => {
    const fetchMenuFeatures = async () => {
      try {
        const res = await fetch('https://backend.crmfarm.in/crmfarmsa/superadmin/MenuFeatures/?product=IT');
        const data = await res.json();
        if (Array.isArray(data)) {
          setMenuFeatures(data);
        }
      } catch (err) {
        console.error('Failed to fetch menu features:', err);
      }
    };
    fetchMenuFeatures();
  }, []);



  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadData = async (pageToLoad = currentPage) => {
    setLoading(true);
    try {
      let res;
      // If any of the advanced filter parameters are set, call the POST filter API
      const hasFilters = filterModuleName || filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterModuleName) {
          payload.Module_Name = filterModuleName;
        }
        if (filterOrgId) {
          payload.Organization_Id = Number(filterOrgId);
        }
        if (statusFilter !== 'All') {
          payload.Is_Active = statusFilter === 'Active';
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [
            filterStartDate || '',
            filterEndDate || ''
          ];
        }

        res = await filterWorkflowModules(payload);
      } else if (searchQuery) {
        res = await searchWorkflowModules(searchQuery);
      } else {
        res = await fetchWorkflowModules(pageToLoad);
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setModules(data);
      setTotalRecords(res?.count || data.length);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load workflow modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadData(1);
  }, [searchQuery, statusFilter]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData(newPage);
  };

  // Compute filtered data directly from the API response
  const filteredData = useMemo(() => {
    return modules;
  }, [modules]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((m) => ({
      'ID': m.Module_Id || m.id,
      'Name': m.Module_Name || (m as any).module_name || '',
      'Code': m.Module_Code || (m as any).module_code || '',
      'Description': m.Description || (m as any).description || '',
      'Status': (m.Is_Active ?? (m as any).is_active) ? 'Active' : 'Inactive',
      'Organization ID': m.Organization_Id || (m as any).Organization_Id_id || 1,
      'Created By ID': m.Created_By || (m as any).Created_By_id || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Workflow Modules");
    XLSX.writeFile(wb, "WorkflowModules.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Module Name', 'Module Code', 'Description', 'Status', 'Org ID']],
      body: filteredData.map((m) => [
        m.Module_Id || String(m.id),
        m.Module_Name || (m as any).module_name || '',
        m.Module_Code || (m as any).module_code || '',
        m.Description || (m as any).description || '',
        (m.Is_Active ?? (m as any).is_active) ? 'Active' : 'Inactive',
        String(m.Organization_Id || (m as any).Organization_Id_id || 1),
      ])
    });
    doc.save('WorkflowModules.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const handleOpenForm = (mod: WorkflowModule | null = null) => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const fallbackOrgId = storedOrgId ? Number(storedOrgId) : 1;

    if (mod) {
      const name = mod.Module_Name || (mod as any).module_name || '';
      const code = mod.Module_Code || (mod as any).module_code || '';
      const desc = mod.Description || (mod as any).description || '';
      const active = mod.Is_Active ?? (mod as any).is_active ?? true;
      const modId = mod.Module_Id || (mod as any).module_id || '';

      let orgId = fallbackOrgId;
      const rawOrg = (mod as any).Organization_Id ?? (mod as any).Organization_Id_id ?? (mod as any).organization_id ?? (mod as any).organization_id_id;
      if (rawOrg !== undefined && rawOrg !== null) {
        if (typeof rawOrg === 'object') {
          orgId = rawOrg.id ?? rawOrg.Organization_Id ?? rawOrg.organization_id ?? fallbackOrgId;
        } else {
          orgId = Number(rawOrg);
        }
      }

      setEditingModule(mod);
      setFormName(name);
      setFormCode(code);
      setFormDesc(desc);
      setFormActive(active);
      setFormModuleId(modId);
      setFormOrgId(Number(orgId));
      setViewMode('edit');
    } else {
      setEditingModule(null);
      setFormName('');
      setFormCode('');
      setFormDesc('');
      setFormActive(true);
      setFormModuleId('');
      setFormOrgId(fallbackOrgId);
      setViewMode('create');
    }
  };

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      toast.error('Module Name and Module Code are required');
      return;
    }

    // Auto-map credentials and organization parameters from local storage
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const parsedUserId = storedUserId ? Number(storedUserId) : 1;

    // Helper to get relation ID
    const getRelationId = (field: any) => {
      if (!field) return null;
      if (typeof field === 'object') return field.id ?? field.Organization_Id ?? field.Created_By ?? field.Updated_By ?? null;
      return Number(field);
    };

    setLoading(true);
    try {
      const payload: any = {
        Module_Name: formName,
        Module_Code: formCode.toUpperCase(),
        Description: formDesc,
        Is_Active: formActive,
        Organization_Id: formOrgId,
        Updated_By: parsedUserId
      };

      if (editingModule) {
        payload.id = editingModule.id;
        payload.Module_Id = editingModule.Module_Id;
        payload.Created_By = getRelationId((editingModule as any).Created_By ?? (editingModule as any).Created_By_id) ?? parsedUserId;
        
        const res = await updateWorkflowModule(payload);
        toast.success('Workflow Module updated successfully');
      } else {
        payload.Created_By = parsedUserId;
        
        const res = await createWorkflowModule(payload);
        toast.success('Workflow Module created successfully');
      }
      setViewMode('list');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save workflow module');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (row: WorkflowModule) => {
    try {
      await updateWorkflowModule({
        ...row,
        Is_Active: !(row.Is_Active ?? (row as any).is_active)
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
        await deleteWorkflowModule(deletingId);
        toast.success('Workflow Module deleted successfully');
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete module');
      } finally {
        setDeletingId(null);
        setIsDeleteOpen(false);
        setLoading(false);
      }
    }
  };

  const tableColumns: ColumnConfig<WorkflowModule>[] = [
    {
      key: 'Module_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white">{row.Module_Id || row.id}</span>
    },
    {
      key: 'Module_Name',
      header: 'Module Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-800 dark:text-slate-200 block">{row.Module_Name}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5 max-w-xs truncate">{row.Description}</span>
        </div>
      )
    },
    {
      key: 'Module_Code',
      header: 'Code',
      sortable: true,
      render: (row) => <span className="px-2 py-0.5 bg-slate-105 dark:bg-slate-800 rounded font-mono text-[10px] text-slate-700 dark:text-slate-355">{row.Module_Code}</span>
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
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-455 border-rose-200 dark:border-rose-900/60'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${row.Is_Active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {row.Is_Active ? 'Active' : 'Inactive'}
        </button>
      )
    },
    {
      key: 'Created_By',
      header: 'Created By',
      render: (row) => <span className="font-medium text-slate-600 dark:text-slate-450">Admin</span>
    },
    {
      key: 'Created_Date',
      header: 'Created Date',
      render: (row) => <span className="font-medium text-slate-455">{row.Created_Date ? new Date(row.Created_Date).toLocaleDateString() : 'N/A'}</span>
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
      {/* Breadcrumb Header */}
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
              <BreadcrumbPage>Workflow Module</BreadcrumbPage>
            </BreadcrumbItem>
            {viewMode !== 'list' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewMode === 'edit' ? 'Edit Module' : 'Create Module'}</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Workflow Modules</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure system modules that support automation triggers, criteria, and execution workflows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Export Dropdown in Header */}
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button
                    variant="outline"
                    className="h-9 px-3 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-330 cursor-pointer flex items-center gap-1.5"
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
                <Plus className="h-4 w-4" /> Create Module
              </Button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Modules</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{modules.length}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl shrink-0">
                <FolderOpen className="h-5 w-5 text-blue-505" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
              <div className="space-y-1 min-w-[100px] text-left">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {modules.filter(m => m.Is_Active).length}
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
                  {modules.filter(m => !m.Is_Active).length}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl shrink-0">
                <Pause className="h-5 w-5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Table Container using ReusableTable */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">System Modules</h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                  {filteredData.length} Modules
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
                    placeholder="Search modules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8.5 bg-slate-50 dark:bg-slate-950 border-slate-205 dark:border-slate-800 font-medium text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
                  />
                </div>

                {/* Filter Panel Toggle - Next to Search */}
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
              <ReusableTable<WorkflowModule>
                columns={tableColumns}
                data={filteredData}
                loading={loading}
                initialPageSize={10}
                showGear={true}
                rowKey="id"
                borderless={true}
                title="Workflow Modules"
                page={currentPage}
                totalRecords={totalRecords}
                onChangePage={handlePageChange}
              />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                  {filteredData.map((m) => {
                    const name = m.Module_Name || (m as any).module_name || 'Unnamed';
                    const code = m.Module_Code || (m as any).module_code || '';
                    const desc = m.Description || (m as any).description || 'No description provided';
                    const active = m.Is_Active ?? (m as any).is_active;

                    return (
                      <Card key={m.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
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
                            <p className="text-xs text-slate-500 line-clamp-2">{desc}</p>
                          </div>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-3.5 border-t dark:border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {m.Module_Id || m.id}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              onClick={() => handleOpenForm(m)}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-455"
                              onClick={() => {
                                setDeletingId(m.id);
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
                    <div className="col-span-full py-12 text-center text-slate-500 text-xs font-semibold">
                      No modules match the filter criteria.
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
                {viewMode === 'edit' ? 'Edit Workflow Module' : 'Workflow Module Setup'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Define the module criteria, system codes, and parameters for your workflow triggers.
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
                    <p className="text-[10px] text-slate-400 font-medium">Link this module to a specific organization ID.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Module ID (System Generated)
                    </Label>
                    <Input
                      value={viewMode === 'edit' ? formModuleId || String(editingModule?.id || '') : 'Auto-Generated'}
                      disabled
                      className="h-10 bg-slate-50 dark:bg-slate-905 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Automatic system-assigned code for integration references.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Module Name <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      value={formName}
                      onChange={(e) => {
                        const selectedName = e.target.value;
                        setFormName(selectedName);
                        const foundFeature = menuFeatures.find(f => f.Module_name === selectedName);
                        if (foundFeature) {
                          setFormCode(foundFeature.Module_key.toUpperCase());
                        }
                      }}
                      required
                      className="w-full text-xs font-semibold border dark:border-slate-800 bg-white dark:bg-slate-955 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
                    >
                      <option value="">Select Module Name</option>
                      {menuFeatures.map(f => (
                        <option key={f.id} value={f.Module_name}>{f.Module_name}</option>
                      ))}
                      {formName && !menuFeatures.some(f => f.Module_name === formName) && (
                        <option value={formName}>{formName}</option>
                      )}
                    </select>
                    <p className="text-[10px] text-slate-400 font-medium">Choose from the available application menu features.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Module Code <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="e.g. LEAD"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold font-mono rounded-xl"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">Unique capitalized system reference code (uppercase).</p>
                  </div>
                </div>


                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                  <Textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Add configuration notes or describe this module's function..."
                    className="min-h-[100px] border-slate-200 dark:border-slate-800 text-xs leading-relaxed rounded-xl"
                  />
                </div>

                {/* Module Status Toggle */}
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module Settings</Label>
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <Checkbox
                      id="formActive"
                      checked={formActive}
                      onCheckedChange={(checked) => setFormActive(!!checked)}
                    />
                    <label htmlFor="formActive" className="font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                      Mark this module as active for automation rules
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
              Workflow Module Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 pt-1">
              Apply filters to search through system modules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Module Name</Label>
                <Input
                  placeholder="e.g. Leads"
                  value={filterModuleName}
                  onChange={(e) => setFilterModuleName(e.target.value)}
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
                className="w-full text-xs font-semibold border dark:border-slate-805 bg-white dark:bg-slate-950 p-2.5 rounded-xl text-slate-700 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
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
                setFilterModuleCode('');
                setFilterModuleName('');
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  const res = await fetchWorkflowModules();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setModules(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load workflow modules');
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
        itemType="workflow module"
      />
    </div>
  );
}
