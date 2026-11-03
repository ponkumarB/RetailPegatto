'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useTemplateList, useTemplateDashboard, useDeleteITTemplate, useUpdateITTemplate, useSearchITTemplate } from '@/service/api/Templates/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Download,
  Filter,
  RotateCcw,
  MoreHorizontal,
  Trash2,
  ToggleLeft,
  FileText,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  GitBranch,
  Layers,
  ChevronLeft,
  ChevronRight,
  User,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { data: dashboardData, isLoading: isLoadingDashboard } = useTemplateDashboard();
  const deleteMutation = useDeleteITTemplate();
  const updateMutation = useUpdateITTemplate();

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState('10');

  const params: any = {};
  if (moduleFilter !== 'All') params.module = moduleFilter;
  if (typeFilter !== 'All') params.template_type = typeFilter;
  if (statusFilter !== 'All') params.status = statusFilter;

  const { data: listData, isLoading: isLoadingList } = useTemplateList(params);
  const { data: searchData, isLoading: isLoadingSearch } = useSearchITTemplate(searchQuery);

  const isSearchActive = searchQuery.trim().length > 0;
  const activeData = isSearchActive ? searchData : listData;
  const isLoading = isSearchActive ? isLoadingSearch : isLoadingList;

  const handleResetFilters = () => {
    setSearchQuery('');
    setModuleFilter('All');
    setTypeFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
    toast.success('Filters cleared successfully.');
  };

  const filteredTemplates = activeData?.results || [];
  const totalCount = activeData?.count || filteredTemplates.length;
  
  const itemsPerPageNum = parseInt(itemsPerPage) || 10;
  const totalPages = Math.ceil(totalCount / itemsPerPageNum) || 1;

  const paginatedTemplates = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPageNum;
    return filteredTemplates.slice(startIdx, startIdx + itemsPerPageNum);
  }, [filteredTemplates, currentPage, itemsPerPageNum]);

  const metrics = useMemo(() => {
    if (!dashboardData) return { total: 0, forms: 0, reports: 0, documents: 0, emailSms: 0 };
    return {
      total: dashboardData.total_templates || 0,
      forms: dashboardData.template_type_counts?.find((t: any) => t.Template_Type === 'Form')?.count || 0,
      reports: dashboardData.template_type_counts?.find((t: any) => t.Template_Type === 'Report')?.count || 0,
      documents: dashboardData.template_type_counts?.find((t: any) => t.Template_Type === 'Document')?.count || 0,
      emailSms: (dashboardData.template_type_counts?.find((t: any) => t.Template_Type === 'Email')?.count || 0) + (dashboardData.template_type_counts?.find((t: any) => t.Template_Type === 'SMS')?.count || 0),
    };
  }, [dashboardData]);

  const moduleOptions = ['All', 'Farmers', 'Deals', 'Contacts', 'Invoices'];
  const typeOptions = ['All', 'Form', 'Report', 'Document', 'Email', 'SMS', 'Workflow'];

  // Export to CSV helper
  const handleExportCSV = () => {
    const headers = ['Template Name', 'Type', 'Module', 'Category', 'Created By', 'Updated On', 'Status'];
    const rows = filteredTemplates.map((t: any) => [
      t.Template_Name,
      t.Template_Type,
      t.Module,
      t.Template_Category,
      t.Organization_Id?.Organization_Name || 'Admin User',
      t.Updated_Date ? new Date(t.Updated_Date).toLocaleDateString() : 'N/A',
      t.Is_Active ? 'Active' : 'Inactive',
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `templates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Template list exported to CSV!');
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'Form':
        return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
      case 'Report':
        return <Layers className="h-4 w-4 text-blue-500" />;
      case 'Document':
        return <FileText className="h-4 w-4 text-amber-500" />;
      case 'Email':
        return <Mail className="h-4 w-4 text-purple-500" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case 'Workflow':
        return <GitBranch className="h-4 w-4 text-cyan-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Form':
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold rounded-lg px-2 py-0.5">
            Form
          </Badge>
        );
      case 'Report':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 font-bold rounded-lg px-2 py-0.5">
            Report
          </Badge>
        );
      case 'Document':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100 font-bold rounded-lg px-2 py-0.5">
            Document
          </Badge>
        );
      case 'Email':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 font-bold rounded-lg px-2 py-0.5">
            Email
          </Badge>
        );
      case 'SMS':
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold rounded-lg px-2 py-0.5">
            SMS
          </Badge>
        );
      case 'Workflow':
        return (
          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-100 font-bold rounded-lg px-2 py-0.5">
            Workflow
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto space-y-6 text-left p-1 animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-2">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Templates
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage and organize all templates used across your system.
          </p>
        </div>

        <div className="flex items-center gap-3.5 flex-wrap">
          {/* Search bar inside header */}
          <div className="relative w-full sm:w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
            />
          </div>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="h-10 px-4 font-bold text-xs rounded-lg border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="h-4 w-4" /> Export
          </Button>

          <Button
            onClick={() => router.push('/Templates/create')}
            className="h-10 px-5 text-white font-bold text-xs rounded-lg shadow-md flex items-center gap-2 cursor-pointer transition-all duration-200 hover:opacity-90 shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4.5 w-4.5" /> New Template
          </Button>
        </div>
      </div>

      {/* Metrics Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Templates */}
        <Card className="border-slate-150 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-650">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-0.5 text-left">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Templates</span>
              <span className="block text-2xl font-black text-slate-800 dark:text-white leading-none">{metrics.total}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Form Templates */}
        <Card className="border-slate-150 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center text-blue-650">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="space-y-0.5 text-left">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Form Templates</span>
              <span className="block text-2xl font-black text-slate-800 dark:text-white leading-none">{metrics.forms}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Report Templates */}
        <Card className="border-slate-150 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-600">
              <Layers className="h-6 w-6" />
            </div>
            <div className="space-y-0.5 text-left">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Report Templates</span>
              <span className="block text-2xl font-black text-slate-800 dark:text-white leading-none">{metrics.reports}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Document Templates */}
        <Card className="border-slate-150 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center text-purple-650">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-0.5 text-left">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Document Templates</span>
              <span className="block text-2xl font-black text-slate-800 dark:text-white leading-none">{metrics.documents}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Email/SMS Templates */}
        <Card className="border-slate-150 dark:border-slate-800/80 shadow-xs bg-white dark:bg-slate-900">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-teal-50 dark:bg-teal-950/20 flex items-center justify-center text-teal-650">
              <Mail className="h-6 w-6" />
            </div>
            <div className="space-y-0.5 text-left">
              <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email/SMS Templates</span>
              <span className="block text-2xl font-black text-slate-800 dark:text-white leading-none">{metrics.emailSms}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters bar & Table section */}
      <div className="space-y-4">
        {/* Filters bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              
              {/* Modules filter dropdown */}
              <div className="flex flex-col text-left">
                <Select value={moduleFilter} onValueChange={(val) => { setModuleFilter(val || 'All'); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 flex items-center justify-between gap-1.5 min-w-[150px]">
                    <SelectValue placeholder="All Modules" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-950 border dark:border-slate-800">
                    <SelectItem value="All" className="text-xs font-semibold">All Modules</SelectItem>
                    {moduleOptions.filter((m) => m !== 'All').map((m) => (
                      <SelectItem key={m} value={m} className="text-xs font-semibold">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Types filter dropdown */}
              <div className="flex flex-col text-left">
                <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val || 'All'); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 flex items-center justify-between gap-1.5 min-w-[140px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-950 border dark:border-slate-800">
                    <SelectItem value="All" className="text-xs font-semibold">All Types</SelectItem>
                    {typeOptions.filter((t) => t !== 'All').map((t) => (
                      <SelectItem key={t} value={t} className="text-xs font-semibold">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status filter dropdown */}
              <div className="flex flex-col text-left">
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || 'All'); setCurrentPage(1); }}>
                  <SelectTrigger className="h-9 text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 flex items-center justify-between gap-1.5 min-w-[130px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-950 border dark:border-slate-800">
                    <SelectItem value="All" className="text-xs font-semibold">All Status</SelectItem>
                    <SelectItem value="Active" className="text-xs font-semibold">Active</SelectItem>
                    <SelectItem value="Inactive" className="text-xs font-semibold">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right filter controls */}
            <div className="flex items-center gap-2 self-end w-full md:w-auto mt-1 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 font-bold text-xs rounded-lg border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> More Filters
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-3.5 font-bold text-xs rounded-lg border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Clear all filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5 pl-5">Template Name</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Type</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Module</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Category</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Created By</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Updated On</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Status</TableHead>
                  <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-center w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="py-3 pl-5"><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-full mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedTemplates.map((t: any) => (
                  <TableRow
                    key={t.id}
                    className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 border-b border-slate-100 dark:border-slate-800 transition-colors"
                  >
                    {/* Template Name & Icon */}
                    <TableCell className="py-3 pl-5 min-w-[220px]">
                      <div className="flex items-center gap-2.5 text-left">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shrink-0">
                          {getTemplateIcon(t.Template_Type)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-150 text-[13px] hover:text-emerald-650 transition-colors cursor-pointer">
                            {t.Template_Name}
                          </span>
                          {t.Description && (
                            <span className="text-[11px] text-slate-400 mt-0.5 max-w-[280px] truncate" title={t.Description}>
                              {t.Description}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Type Badge */}
                    <TableCell>{getTypeBadge(t.Template_Type)}</TableCell>

                    {/* Module */}
                    <TableCell className="text-[12px] font-medium text-slate-650 dark:text-slate-350">
                      {t.Module}
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-[12px] font-medium text-slate-650 dark:text-slate-350">
                      {t.Template_Category}
                    </TableCell>

                    {/* Created By Avatar */}
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2 text-left">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 border border-emerald-200/50">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">
                          {t.Organization_Id?.Organization_Name || 'Admin User'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Updated On */}
                    <TableCell className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                      {t.Updated_Date ? new Date(t.Updated_Date).toLocaleDateString() : 'N/A'}
                    </TableCell>

                    {/* Status badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        onClick={() => {
                          updateMutation.mutate({ id: t.id, payload: { ...t, Is_Active: !t.Is_Active } }, {
                            onSuccess: () => toast.success(`Template ${t.Template_Name} is now ${!t.Is_Active ? 'Active' : 'Inactive'}.`)
                          });
                        }}
                        className={`text-[10px] font-extrabold uppercase rounded-md py-0.5 px-2 cursor-pointer border ${
                          t.Is_Active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-150 hover:bg-emerald-100'
                            : 'bg-slate-55 bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {t.Is_Active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>

                    {/* Actions dropdown */}
                    <TableCell className="text-center py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-800">
                          <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Options</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              updateMutation.mutate({ id: t.id, payload: { ...t, Is_Active: !t.Is_Active } }, {
                                onSuccess: () => toast.success(`Template status updated.`)
                              });
                            }}
                            className="gap-2 cursor-pointer text-xs font-semibold"
                          >
                            <ToggleLeft className="h-4 w-4" /> Toggle Status
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget({ id: t.id, name: t.Template_Name })}
                            className="gap-2 cursor-pointer text-rose-600 font-semibold text-xs"
                          >
                            <Trash2 className="h-4 w-4" /> Delete Template
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredTemplates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-8 w-8 text-slate-300" />
                        <div className="space-y-1">
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No templates found</p>
                          <p className="text-xs">Adjust your search keyword or filters to find what you need.</p>
                        </div>
                        <Button size="sm" onClick={handleResetFilters} variant="outline" className="mt-2 text-xs rounded-lg font-bold">
                          Clear Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Table Pagination footer */}
          {filteredTemplates.length > 0 && (
            <div className="px-5 py-4 border-t dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/20 dark:bg-slate-900/10 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                Showing {Math.min(filteredTemplates.length, (currentPage - 1) * itemsPerPageNum + 1)} to{' '}
                {Math.min(filteredTemplates.length, currentPage * itemsPerPageNum)} of {filteredTemplates.length} entries
              </span>

              <div className="flex items-center gap-4.5 self-end sm:self-auto">
                {/* Page Selector dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold text-[11px]">Show</span>
                  <Select value={itemsPerPage} onValueChange={(val) => { setItemsPerPage(val || '10'); setCurrentPage(1); }}>
                    <SelectTrigger className="h-7 w-[70px] text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 flex items-center justify-between">
                      <SelectValue placeholder="10" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-955 dark:bg-slate-950 border dark:border-slate-800">
                      <SelectItem value="5" className="text-xs font-semibold">5</SelectItem>
                      <SelectItem value="10" className="text-xs font-semibold">10</SelectItem>
                      <SelectItem value="25" className="text-xs font-semibold">25</SelectItem>
                      <SelectItem value="50" className="text-xs font-semibold">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-slate-400 font-semibold text-[11px]">/ page</span>
                </div>

                {/* Page count navigation links */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer disabled:opacity-50"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 dark:bg-slate-905 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-850'
                        }`}
                        style={isActive ? { backgroundColor: primaryColor } : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer disabled:opacity-50"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white font-extrabold text-lg">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-semibold text-slate-500">
              This action cannot be undone. This will permanently delete the template 
              <span className="font-bold text-slate-800 dark:text-slate-300"> "{deleteTarget?.name}" </span> 
              and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9.5 rounded-[5px] text-xs font-bold border-slate-200 dark:border-slate-850">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    toast.success('Template deleted successfully');
                    setDeleteTarget(null);
                  },
                  onError: () => {
                    toast.error('Failed to delete template');
                    setDeleteTarget(null);
                  }
                });
              }}
              className="h-9.5 rounded-[5px] text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
