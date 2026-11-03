'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Calculator,
  FileText,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Printer,
  LineChart,
  Clock,
  DollarSign,
  Briefcase,
  Copy,
  Building,
  Layers,
  X,
  CheckCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { fetchSoftwareEstimations, deleteSoftwareEstimation } from '@/service/api/SoftwareEstimation/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function EstimationsListPage() {
  const { primaryColor , user} = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    canCreateEstimation,
    canEditEstimation,
    canDeleteEstimation,
    canViewEstimationOverview,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewEstimationOverview) {
      toast.error('You do not have permission to view Software Estimations.');
      router.push('/');
    }
  }, [canViewEstimationOverview, isLoaded, router]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (isLoaded && !canViewEstimationOverview) {
    return null;
  }

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: estimationsData, isLoading, isError } = useQuery({
    queryKey: ['softwareEstimations', currentPage, pageSize],
    queryFn: () => fetchSoftwareEstimations({ page: currentPage, page_size: pageSize }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSoftwareEstimation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['softwareEstimations'] });
      toast.success('Software estimation deleted successfully.');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete estimation: ${error?.message || 'Unknown error'}`);
    },
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');

  // Numeric safety helper
  const safeNumber = (value: any) => {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const getCustomerDisplayName = (est: any): string => {
    if (!est) return '-';
    if (typeof est.Customer_Name === 'string' && est.Customer_Name.trim()) return est.Customer_Name;
    if (typeof est.customer_name === 'string' && est.customer_name.trim()) return est.customer_name;
    if (typeof est.clientName === 'string' && est.clientName.trim()) return est.clientName;
    if (typeof est.client_name === 'string' && est.client_name.trim()) return est.client_name;

    if (est.Customer_Id && typeof est.Customer_Id === 'object') {
      const cObj = est.Customer_Id;
      const name = cObj.Customer_Name || cObj.Lead_Name || cObj.Contact_Name || cObj.Account_Name || cObj.Name;
      if (name) return name;
    }

    if (est.Project_Id && typeof est.Project_Id === 'object') {
      const pObj = est.Project_Id;
      if (typeof pObj.Customer_Name === 'string' && pObj.Customer_Name.trim()) return pObj.Customer_Name;
      if (pObj.Customer_Id && typeof pObj.Customer_Id === 'object') {
        const cObj = pObj.Customer_Id;
        const name = cObj.Customer_Name || cObj.Lead_Name || cObj.Contact_Name || cObj.Account_Name || cObj.Name;
        if (name) return name;
      }
    }

    return '-';
  };

  const rawEstimations = Array.isArray(estimationsData)
    ? estimationsData
    : estimationsData?.results || estimationsData?.data || [];

  const normalizedEstimations = rawEstimations.map((est: any) => {
    const effortHours = safeNumber(est.effortHours ?? est.effort_hours ?? est.effort_hrs ?? est.effort ?? est.hours ?? est.Effort);
    const costPerHour = safeNumber(est.costPerHour ?? est.cost_per_hour ?? est.cost_hour ?? est.Cost_Per_Hour ?? 1200);
    const contingencyPercent = safeNumber(est.contingencyPercent ?? est.contingency_percentage ?? est.contingency_percent ?? est.Contingency_Percentage ?? 10);
    const baseCost = safeNumber(est.baseCost ?? est.base_cost) || (effortHours * costPerHour);
    const contingencyAmount = safeNumber(est.contingencyAmount ?? est.contingency_amount) || (baseCost * (contingencyPercent / 100));
    const totalCost = safeNumber(est.totalCost ?? est.total_cost ?? est.total_estimated_cost ?? est.Total_Cost ?? est.total) || (baseCost + contingencyAmount);

    return {
      id: String(est.id ?? est.SoftwareEstimation_Id ?? est.softwareEstimationId ?? est.SOFTWARE_ESTIMATION_ID ?? ''),
      projectName: est.projectName ?? est.project_name ?? est.Project_Name ?? est.project ?? '',
      clientName: getCustomerDisplayName(est),
      projectType: est.projectType ?? est.project_type ?? est.Project_Type ?? est.technology_type ?? '',
      estimationDate: est.estimationDate ?? est.estimation_date ?? est.date ?? est.created_at ?? '',
      roundedAFP: safeNumber(est.roundedAFP ?? est.rounded_afp ?? est.afp ?? est.AFP ?? est.AFP_FP),
      effortHours,
      costPerHour,
      contingencyPercent,
      baseCost,
      contingencyAmount,
      totalCost,
      version: est.Project_Version ?? est.version ?? est.Version ?? est.softwareVersion ?? est.version_name ?? '',
      technologyStack: est.technologyStack ?? est.technology_stack ?? est.technology ?? est.TechStack ?? '',
      status: est.status ?? est.Status ?? 'Draft',
      currency: est.Currency ?? est.currency ?? '',
      Project_Id: est?.Project_Id,
      ...est,
    };
  });

  const totalCount = Number(
    estimationsData?.count ?? estimationsData?.totalCount ?? estimationsData?.total ?? normalizedEstimations.length
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Filtered estimations list
  const filteredEstimations = useMemo(() => {
    return normalizedEstimations.filter((est: any) => {
      const matchesSearch =
        est.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        est.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        est.technologyStack?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'All Types' || est.projectType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [normalizedEstimations, searchQuery, selectedType]);

  // Cost formatting helper
  const getCurrencySymbol = (currencyStr?: string) => {
    if (currencyStr) {
      const match = currencyStr.match(/\((.*?)\)/);
      if (match && match[1]) return match[1];
      if (currencyStr.includes('USD')) return '$';
      if (currencyStr.includes('EUR')) return '€';
      if (currencyStr.includes('INR')) return '₹';
    }
    return '₹';
  };

  const getCurrencyLocale = (currencyStr?: string) => {
    if (currencyStr?.includes('USD')) return 'en-US';
    if (currencyStr?.includes('EUR')) return 'de-DE';
    return 'en-IN';
  };

  const formatDynamicCurrency = (amount: number, currencyStr?: string) => {
    const locale = getCurrencyLocale(currencyStr);
    try {
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return amount.toLocaleString();
    }
  };

  const formatIndianCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Date formatting helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '--';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Delete handler - opens dialog instead of confirm
  const handleDeleteClick = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  // Get status badge
  const getStatusBadge = (status?: string) => {
    const statusMap: Record<string, { className: string; dotColor: string }> = {
      'Approved': {
        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
        dotColor: 'bg-emerald-500'
      },
      'Draft': {
        className: 'bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400 border border-slate-200 dark:border-slate-600',
        dotColor: 'bg-slate-400'
      },
      'Submitted': {
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
        dotColor: 'bg-amber-500 animate-pulse'
      },
      'Rejected': {
        className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30',
        dotColor: 'bg-rose-500'
      }
    };
    const config = statusMap[status || 'Draft'] || statusMap['Draft'];
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all duration-200",
        config.className
      )}>
        <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", config.dotColor)} />
        {status || 'Draft'}
      </span>
    );
  };

  // Define columns for ReusableTable
  const columns: ColumnConfig<any>[] = useMemo(() => [
    {
      key: 'projectName',
      header: 'Project Name',
      sortable: true,
      width: 200,
      render: (row) => (
        <button
          onClick={() => router.push(`/project/estimations/${row.id}/edit`)}
          className="hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors cursor-pointer font-semibold text-slate-800 dark:text-slate-200 truncate block"
        >
          {row.projectName}
        </button>
      )
    },
    {
      key: 'clientName',
      header: 'Client / Customer',
      sortable: true,
      width: 180,
      render: (row) => (
        <div className="flex items-center gap-2">
          <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
            {row.clientName || getCustomerDisplayName(row)}
          </span>
        </div>
      )
    },
    {
      key: 'projectType',
      header: 'Project Type',
      sortable: true,
      width: 140,
      render: (row) => (
        <Badge variant="outline" className="rounded-md font-bold text-[10px] uppercase bg-blue-50/50 text-blue-600 border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-800/30">
          {row.projectType}
        </Badge>
      )
    },
    {
      key: 'estimated_start_date',
      header: 'Start Date',
      sortable: true,
      width: 120,
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(row.estimated_start_date ?? row.Estimated_StartDate)}
        </div>
      )
    },
    {
      key: 'estimated_end_date',
      header: 'End Date',
      sortable: true,
      width: 120,
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(row.estimated_end_date ?? row.Estimated_EndDate)}
        </div>
      )
    },
    {
      key: 'roundedAFP',
      header: 'AFP FP',
      sortable: true,
      width: 100,
      align: 'center',
      render: (row) => (
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
          {row.roundedAFP}
        </span>
      )
    },
    {
      key: 'effortHours',
      header: 'Effort (Hrs)',
      sortable: true,
      width: 120,
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
            {row.effortHours.toLocaleString()}
          </span>
        </div>
      )
    },
    {
      key: 'version',
      header: 'Version',
      sortable: true,
      width: 90,
      align: 'center',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          <Layers className="h-3 w-3" />
          {row.version}
        </span>
      )
    },
    // {
    //   key: 'status',
    //   header: 'Status',
    //   sortable: true,
    //   width: 110,
    //   align: 'center',
    //   render: (row) => getStatusBadge(row.status)
    // },
    {
      key: 'totalCost',
      header: 'Total Cost',
      sortable: true,
      width: 150,
      align: 'right',
      render: (row) => {
        const symbol = getCurrencySymbol(row.currency);
        const effort = row.effortHours;
        const rate = row.costPerHour;
        const base = row.baseCost || (effort * rate);
        const pct = row.contingencyPercent ?? 10;
        const contingency = row.contingencyAmount || (base * (pct / 100));
        const total = row.totalCost || (base + contingency);

        return (
          <TooltipProvider delay={100}>
            <Tooltip>
              <TooltipTrigger>
                <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 font-mono bg-blue-50/70 dark:bg-blue-955/40 px-2.5 py-1 rounded-full cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all border border-blue-200/60 dark:border-blue-800/50 inline-flex items-center gap-1 shadow-2xs">
                  {symbol} {formatDynamicCurrency(total, row.currency)}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                sideOffset={10}
                className="z-50 flex flex-col w-72 max-w-none p-0 bg-slate-900 dark:bg-slate-950 text-white rounded-xl shadow-2xl border border-slate-700/80 overflow-hidden text-xs font-sans"
              >
                <div className="p-3.5 space-y-2.5 w-full flex flex-col text-left">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 w-full">
                    <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400">Cost Breakdown</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">{symbol} {formatDynamicCurrency(total, row.currency)}</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] w-full flex flex-col">
                    <div className="flex justify-between items-center w-full text-slate-300">
                      <span className="text-slate-400 font-medium">Effort (Hours)</span>
                      <span className="font-mono font-semibold text-slate-200">{effort ? effort.toLocaleString() : 0} hrs</span>
                    </div>
                    <div className="flex justify-between items-center w-full text-slate-300">
                      <span className="text-slate-400 font-medium">Cost / Hour</span>
                      <span className="font-mono font-semibold text-slate-200">{symbol} {formatDynamicCurrency(rate, row.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center w-full text-slate-300 pt-1.5 border-t border-slate-800">
                      <span className="text-slate-400 font-medium">Base Cost</span>
                      <span className="font-mono font-semibold text-slate-200">{symbol} {formatDynamicCurrency(base, row.currency)}</span>
                    </div>
                    <div className="flex justify-between items-center w-full text-slate-300">
                      <span className="text-slate-400 font-medium">Contingency ({pct}%)</span>
                      <span className="font-mono font-semibold text-slate-200">{symbol} {formatDynamicCurrency(contingency, row.currency)}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-700/80 pt-2 flex justify-between items-center w-full">
                    <span className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Total Cost</span>
                    <span className="font-mono font-extrabold text-emerald-400 text-xs">{symbol} {formatDynamicCurrency(total, row.currency)}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
    }
  ], [router, canEditEstimation]);

  // Row actions - Alternative without asChild
  const renderRowActions = (row: any) => {
    const hasAnyAction = canViewEstimationOverview || canEditEstimation || canDeleteEstimation;
    if (!hasAnyAction) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <MoreHorizontal className="h-4.5 w-4.5" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canViewEstimationOverview && (
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/project/estimations/${row.id}/report`);
              }}
            >
              <FileText className="h-3.5 w-3.5 text-blue-500" /> Generate Report
            </DropdownMenuItem>
          )}
          {canEditEstimation && (
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs font-semibold"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/project/estimations/${row.id}/edit`);
              }}
            >
              <Edit className="h-3.5 w-3.5" /> Edit Estimation
            </DropdownMenuItem>
          )}
          {canDeleteEstimation && (
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/30"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(row.id, row.projectName);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete Estimation
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Header actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search projects, clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 w-100 rounded-md border-slate-200 dark:border-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading software estimations...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-rose-500" />
          </div>
          <p className="text-sm text-red-500 font-semibold">Unable to load software estimations.</p>
          <p className="text-xs text-slate-400 mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 text-left pb-20 p-1">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{getTenantName().toUpperCase()}</BreadcrumbPage>

            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Sales</BreadcrumbPage>

            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Software Estimation</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Block */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            Software Estimation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View, analyze, and manage software sizing estimations based on function point calculations.
          </p>
        </div>

        {canCreateEstimation && (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push('/project/estimations/create')}
              style={{ backgroundColor: primaryColor }}
              className="text-white font-semibold rounded-sm h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> New Estimation
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Estimations */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Estimations</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{normalizedEstimations.length}</p>
            <span className="text-[10px] text-slate-400 font-bold">All Time</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-955/50 rounded-2xl">
            <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Avg FP Sizing */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Function Points</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {normalizedEstimations.length > 0
                ? Math.round(
                  normalizedEstimations.reduce((acc, est) => acc + safeNumber(est.roundedAFP), 0) / normalizedEstimations.length
                )
                : 0}
            </p>
            <span className="text-[10px] text-emerald-600 font-bold">Adjusted FP</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-955/50 rounded-2xl">
            <LineChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* Total Effort Hours */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Effort (Hours)</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {normalizedEstimations.reduce((acc, est) => acc + safeNumber(est.effortHours), 0).toLocaleString()}
            </p>
            <span className="text-[10px] text-blue-600 font-bold">Person-Hours</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-955/50 rounded-2xl">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Total Cost Valuation */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected Valuation</span>
            <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
              ₹ {formatIndianCurrency(normalizedEstimations.reduce((acc, est) => acc + safeNumber(est.totalCost), 0))}
            </p>
            <span className="text-[10px] text-slate-400 font-bold">Total Cost</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-955/50 rounded-2xl">
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>

      {/* Reusable Table */}
      <Card className='p-4 space-y-4'>
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Estimations: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{filteredEstimations.length}</span>
          </div>
          {headerActions}
        </div>
        <ReusableTable
          data={filteredEstimations}
          columns={columns}
          loading={isLoading}
          title="No software estimations found matching current query or filters."
          enableSelection={false}
          showGear={true}
          stickyHeader={true}
          borderless={false}
          rowKey="id"
          rowIdKey="id"
          initialPageSize={10}
          page={currentPage}
          totalRecords={totalCount}
          pageSize={pageSize}
          onChangePage={setCurrentPage}
          onChangePageSize={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          rowClassName={(row) => (
            `hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors duration-150 
          ${row.status === 'Approved' ? 'border-l-2 border-l-emerald-500' : ''} 
          ${row.status === 'Rejected' ? 'border-l-2 border-l-rose-500 opacity-60' : ''}`
          )}
          actions={renderRowActions}

        />
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={deleteDialogOpen}
        isLoading={deleteMutation.isPending}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Software Estimation?"
        description={`This action cannot be undone. This will permanently delete the estimation for "${itemToDelete?.name || ''}" and remove it from our servers.`}
        itemType="estimation"
      />
    </div>
  );
}