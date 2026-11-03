'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Search,
  Filter,
  Settings as SettingsIcon,
  Download,
  Plus,
  Eye,
  Edit2,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  Calendar,
  Info,
  Mail,
  Phone,
  FileCode,
  CheckCircle,
  HelpCircle,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useDeploymentStore } from '@/store/useDeploymentStore';
import { DeploymentRequest } from '@/types/deployment';

export default function DeploymentRequestsListPage() {
  const router = useRouter();
  const { requests, deleteRequest } = useDeploymentStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');

  // Modals state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<DeploymentRequest | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setIsMounted(true);
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Stats calculation
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;
  const completedCount = requests.filter((r) => r.status === 'Completed').length;

  // Filter logic
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || req.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesEnv =
        envFilter === 'all' || req.environment.toLowerCase() === envFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesEnv;
    });
  }, [requests, searchQuery, statusFilter, envFilter]);

  // Paginated requests
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, envFilter]);

  const handleOpenView = (req: DeploymentRequest) => {
    setActiveRequest(req);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (req: DeploymentRequest) => {
    setActiveRequest(req);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!activeRequest) return;
    deleteRequest(activeRequest.id);
    setIsDeleteOpen(false);
    toast.success('Deployment Request deleted successfully');
  };

  const handleExport = () => {
    toast.success('Exporting deployment requests logs...');
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="sk"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 p-1"
          >
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-24 animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-[400px] animate-pulse" />
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-[240px] animate-pulse" />
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 h-[160px] animate-pulse" />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-5 text-left p-1"
          >
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList className="text-xs font-semibold text-slate-400">
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => router.push('/')}
                    className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    System
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-350">
                    Deployment Requests
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <FileCode className="h-4 w-4" />
                  </div>
                  <h1 className="text-2xl md:text-[1.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Deployment Requests
                  </h1>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
                  Track, analyze, and manage application deployment pipelines and approvals.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-900 transition-colors shadow-xs"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  Export Logs
                </Button>

                <Button
                  onClick={() => router.push('/system/application-deployment/create')}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Request
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 flex items-center gap-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                <div className="h-11 w-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    Total Requests
                  </span>
                  <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1.5 leading-none">
                    {totalCount}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 leading-none">
                    Overall Submitted
                  </span>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 flex items-center gap-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                <div className="h-11 w-11 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    Pending Approval
                  </span>
                  <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1.5 leading-none">
                    {pendingCount}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 leading-none">
                    Awaiting Workflow
                  </span>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 flex items-center gap-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                <div className="h-11 w-11 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0 text-sky-600 dark:text-sky-400 border border-sky-100/50 dark:border-sky-900/30">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    Approved
                  </span>
                  <span className="text-2xl font-extrabold text-slate-955 dark:text-white mt-1.5 leading-none">
                    {approvedCount}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 leading-none">
                    Ready to Deploy
                  </span>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl p-5 flex items-center gap-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
                <div className="h-11 w-11 rounded-lg bg-emerald-50 dark:bg-emerald-955/40 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                    Completed
                  </span>
                  <span className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1.5 leading-none">
                    {completedCount}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 leading-none">
                    Successfully Deployed
                  </span>
                </div>
              </div>
            </div>

            {/* Split Grid columns */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Left Side: Table (Span 3) */}
              <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
                {/* Table Toolbar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/20 dark:bg-slate-900/40">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus-visible:ring-1 focus-visible:ring-blue-500 w-full"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500">Env:</span>
                      <Select value={envFilter} onValueChange={(val) => setEnvFilter(val || 'all')}>
                        <SelectTrigger className="h-8 text-xs font-bold text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 min-w-[110px]">
                          <SelectValue placeholder="All Environments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Environments</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="uat">UAT</SelectItem>
                          <SelectItem value="development">Development</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Status:</span>
                      <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                        <SelectTrigger className="h-8 text-xs font-bold text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 min-w-[110px]">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/40 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-850">
                      <TableRow className="border-b-0 hover:bg-transparent">
                        <TableHead className="w-10 pl-4 py-3">
                          <Checkbox className="h-3.5 w-3.5 rounded-xs" />
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Request ID
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Application
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Target Env
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Requested By
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3">
                          Target Window
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 text-center">
                          Status
                        </TableHead>
                        <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3 text-right pr-4">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                      {paginatedRequests.length > 0 ? (
                        paginatedRequests.map((req) => (
                          <TableRow
                              key={req.id}
                              className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors"
                          >
                            <TableCell className="pl-4 py-3">
                              <Checkbox className="h-3.5 w-3.5 rounded-xs" />
                            </TableCell>
                            <TableCell className="py-3 font-bold text-slate-900 dark:text-white">
                              {req.id}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-slate-800 dark:text-white">{req.appName}</span>
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{req.appVersion}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-700 border dark:bg-slate-855 dark:text-slate-300 dark:border-slate-800">
                                <Server className="h-3 w-3 text-slate-400" />
                                {req.targetEnv}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex flex-col text-left">
                                <span className="font-bold text-slate-800 dark:text-white">{req.requestedBy}</span>
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">{req.department}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-slate-500 dark:text-slate-400 font-medium">
                              {req.deploymentWindow}
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  req.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/30' :
                                  req.status === 'Approved' ? 'bg-blue-50 text-blue-600 border-blue-100/30' :
                                  req.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100/30' :
                                  'bg-amber-50 text-amber-600 border-amber-100/30'
                                }`}
                              >
                                {req.status}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 pr-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => handleOpenView(req)}
                                  className="h-7 w-7 text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => router.push(`/system/application-deployment/${req.id}/edit`)}
                                  className="h-7 w-7 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>

                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="h-7 w-7 text-slate-400 hover:text-slate-600 hover:bg-slate-55 dark:hover:bg-slate-850"
                                      >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </Button>
                                    }
                                  />
                                  <DropdownMenuContent align="end" className="text-xs">
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/system/application-deployment/${req.id}/edit`)}
                                      className="gap-2 cursor-pointer font-medium"
                                    >
                                      <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                                      Edit Request
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleOpenDelete(req)}
                                      className="gap-2 text-rose-500 focus:text-rose-500 focus:bg-rose-50/50 cursor-pointer font-medium"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                      Delete Request
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="py-12 text-center text-slate-400">
                            No deployment requests found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Table Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/10 dark:bg-slate-900/20">
                  <span>
                    Showing {filteredRequests.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                    {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length}{' '}
                    requests
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className="h-7 w-7 rounded-md border-slate-200 dark:border-slate-850"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="h-7 w-7 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold border-none"
                      >
                        {currentPage}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        disabled={currentPage * pageSize >= filteredRequests.length}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="h-7 w-7 rounded-md border-slate-200 dark:border-slate-850"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(val) => setPageSize(parseInt(val || '10'))}
                      >
                        <SelectTrigger className="h-7 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 min-w-[80px]">
                          <SelectValue placeholder="10 / page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 / page</SelectItem>
                          <SelectItem value="10">10 / page</SelectItem>
                          <SelectItem value="20">20 / page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Sidebar Panels (Span 1) */}
              <div className="lg:col-span-1 space-y-5">
                {/* Deployment Calendar Sync Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5 text-left">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-50 dark:border-slate-850">
                    Quick Actions
                  </h3>
                  <div className="mt-3 space-y-1">
                    {[
                      { title: 'Change Calendar', path: '/system/application-deployment' },
                      { title: 'Application Catalog', path: '/system/application-deployment' },
                      { title: 'Deployment Settings', path: '/system/application-deployment' }
                    ].map((act, index) => (
                      <button
                        key={index}
                        onClick={() => router.push(act.path)}
                        className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>{act.title}</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Help Desk Contact Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5 text-left">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">
                      Need Help?
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                      For any issues with application deployment requests, contact IT Support.
                    </p>

                    <div className="space-y-2.5 pt-2 text-xs font-bold">
                      <a
                        href="mailto:support@crmfarmit.com"
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Mail className="h-4 w-4 text-slate-400" />
                        support@crmfarmit.com
                      </a>
                      <a
                        href="tel:+918012345678"
                        className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <Phone className="h-4 w-4 text-slate-400" />
                        +91 80 1234 5678
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────
                MODALS / DIALOGS
            ───────────────────────────────────────── */}

            {/* VIEW DEPLOYMENT DETAILS DIALOG */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
              <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900 border dark:border-slate-800 max-h-[85vh] overflow-y-auto">
                <DialogHeader className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-650">
                      <FileCode className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {activeRequest?.appName} ({activeRequest?.appVersion})
                      </DialogTitle>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5 block">
                        Request ID: {activeRequest?.id}
                      </span>
                    </div>
                  </div>
                </DialogHeader>

                <div className="py-4 text-left space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-50 dark:border-slate-850 pb-3.5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        activeRequest?.status === 'Completed' ? 'bg-emerald-55 text-emerald-600 border-emerald-100/30' :
                        activeRequest?.status === 'Approved' ? 'bg-blue-50 text-blue-600 border-blue-100/30' :
                        activeRequest?.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100/30' :
                        'bg-amber-50 text-amber-600 border-amber-100/30'
                      }`}>
                        {activeRequest?.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</p>
                      <span className="text-slate-800 dark:text-slate-200">{activeRequest?.priority}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Env</p>
                      <span className="text-slate-800 dark:text-slate-200">{activeRequest?.targetEnv}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estimated Downtime</p>
                      <span className="text-slate-800 dark:text-slate-200">{activeRequest?.estimatedDowntime} mins</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Requested By</p>
                      <p className="text-slate-800 dark:text-slate-200">{activeRequest?.requestedBy} ({activeRequest?.requestedByRole})</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{activeRequest?.department}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Window</p>
                      <p className="text-slate-800 dark:text-slate-200">{activeRequest?.deploymentWindow}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purpose / Justification</p>
                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-55 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      {activeRequest?.purpose}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-50 dark:border-slate-850 pt-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Repository Source</p>
                      <p className="text-slate-700 dark:text-slate-350 font-medium">{activeRequest?.repository}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Artifact Package</p>
                      <p className="text-slate-700 dark:text-slate-350 font-medium">{activeRequest?.artifact}</p>
                    </div>
                  </div>

                  {activeRequest?.dbChanges === 'Yes' && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Database Script</p>
                      <p className="text-slate-600 dark:text-slate-400 font-medium bg-slate-55 dark:bg-slate-955/40 p-2 rounded-lg border border-slate-100 dark:border-slate-855">
                        {activeRequest?.dbScriptsFilename}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rollback Plan</p>
                    <p className="text-slate-600 dark:text-slate-400 font-medium bg-slate-55 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      {activeRequest?.rollbackPlan}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Workflow Approvals</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                      {activeRequest?.approvals.map((app) => (
                        <div key={app.step} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850">
                          <span className="text-[9px] text-slate-400 font-bold border border-slate-200 dark:border-slate-800 h-4 w-4 rounded-full flex items-center justify-center">{app.step}</span>
                          <div className="text-left min-w-0">
                            <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate">{app.approver}</p>
                            <p className="text-[9px] text-slate-400 truncate">{app.role}</p>
                          </div>
                          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                            app.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t dark:border-slate-800 mt-2">
                  <Button
                    onClick={() => setIsViewOpen(false)}
                    className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* DELETE REQUEST CONFIRMATION */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <DialogContent className="sm:max-w-[400px] bg-white dark:bg-slate-900 border dark:border-slate-800">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Delete Request
                  </DialogTitle>
                  <DialogDescription className="text-xs font-medium text-slate-500 mt-1">
                    Are you sure you want to delete deployment request <span className="font-bold text-slate-800 dark:text-slate-200">"{activeRequest?.id}"</span>? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex items-start gap-3 bg-rose-50/50 dark:bg-rose-955/20 p-3 rounded-lg border border-rose-100/50 dark:border-rose-900/30 text-left my-2 text-xs text-rose-600 dark:text-rose-450 font-semibold leading-relaxed">
                  <Info className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                  <p>
                    Deleting this request will remove it permanently from the deployment registry log.
                  </p>
                </div>

                <DialogFooter className="border-t dark:border-slate-800 mt-2">
                  <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-9 text-xs font-bold">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteConfirm}
                    className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Delete Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
