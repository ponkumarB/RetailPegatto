'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Search,
  ChevronRight,
  ChevronDown,
  Filter,
  Columns,
  Eye,
  MoreVertical,
  User,
  Phone,
  Settings,
  FileText,
  Check,
  Trophy,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Skeleton } from '@/components/ui/skeleton';

// Hooks from API service
import { useLeadConversionCards, useLeadConversionList } from '@/service/api/LeadConversionTracking/queries';
import { LeadConversionListRecord } from '@/service/api/LeadConversionTracking/api';

// Stage Icon Mapper
const STAGE_ICONS: Record<string, any> = {
  'Total Leads': User,
  'New Leads This Month': User,
  'Contacted': Phone,
  'Qualified': Settings,
  'Proposal Sent': FileText,
  'Converted': Check,
  'Won': Trophy,
};

export default function LeadConversionTrackingPage() {
  const { primaryColor } = useStore();

  const [dateRange, setDateRange] = useState('2026-01-01 - 2026-12-31');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hardcoded owner for this specific payload requirement, ideally from context
  const owner_id = 72;
  const start_date = dateRange.split(' - ')[0];
  const end_date = dateRange.split(' - ')[1];
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: cardsResponse, isLoading: isLoadingCards } = useLeadConversionCards({
    owner_id,
    start_date,
    end_date,
  });

  const { data: listResponse, isLoading: isLoadingList } = useLeadConversionList({
    owner_id,
    start_date,
    end_date,
    page,
  });

  const cardsData = cardsResponse?.data || [];
  const listData = listResponse?.results || [];
  const totalRecords = listResponse?.count || 0;

  // Filter list data locally for search since API doesn't specify search param
  const filteredList = useMemo(() => {
    if (!searchQuery) return listData;
    const lowerQ = searchQuery.toLowerCase();
    return listData.filter(item => 
      item.Lead_Name.toLowerCase().includes(lowerQ) ||
      item.Company.toLowerCase().includes(lowerQ)
    );
  }, [listData, searchQuery]);

  // Export report simulation
  const handleExport = async () => {
    setIsExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsExporting(false);
    toast.success('Export Successful', {
      description: `Lead Conversion Report for ${dateRange} exported as CSV.`,
    });
  };

  // Reusable Table Columns setup
  const columns: ColumnConfig<LeadConversionListRecord>[] = useMemo(() => [
    {
      key: 'Lead_Name',
      header: 'Lead Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <span className="font-extrabold text-slate-900 dark:text-white cursor-pointer hover:underline truncate">
            {row.Lead_Name}
          </span>
        </div>
      ),
    },
    {
      key: 'Company',
      header: 'Company',
      render: (row) => <span className="font-bold text-slate-700 dark:text-slate-300">{row.Company}</span>,
    },
    {
      key: 'Lead_Source',
      header: 'Lead Source',
      render: (row) => {
        let sourceBg = 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
        if (row.Lead_Source.includes('Website') || row.Lead_Source.includes('Digital')) sourceBg = 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100/30';
        else if (row.Lead_Source.includes('Email')) sourceBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/30';
        else if (row.Lead_Source.includes('Referral')) sourceBg = 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-100/30';
        
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${sourceBg}`}>
            {row.Lead_Source}
          </span>
        );
      },
    },
    {
      key: 'Owner',
      header: 'Owner',
      render: (row) => <span className="font-semibold text-slate-600 dark:text-slate-400">{row.Owner}</span>,
    },
    {
      key: 'Current_Stage',
      header: 'Current Stage',
      render: (row) => {
        let stageBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/30';
        if (row.Current_Stage === 'Contacted') stageBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-100/30';
        else if (row.Current_Stage === 'Qualified' || row.Current_Stage === 'Open') stageBg = 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-100/30';
        else if (row.Current_Stage === 'Proposal Sent' || row.Current_Stage === 'New Opportunity') stageBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-100/30';
        
        return (
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${stageBg}`}>
            {row.Current_Stage}
          </span>
        );
      },
    },
    {
      key: 'Days_In_Stage',
      header: 'Days in Stage',
      align: 'center',
      render: (row) => <span className="font-bold text-slate-700 dark:text-slate-300">{row.Days_In_Stage}</span>,
    },
    {
      key: 'Last_Activity',
      header: 'Last Activity',
      align: 'center',
      render: (row) => <span className="font-semibold text-slate-500 dark:text-slate-400 text-[11px]">{row.Last_Activity}</span>,
    },
  ], []);

  return (
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">Lead Tracking</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Conversion</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Heading Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Lead Conversion Tracking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and manage your leads as they move through the conversion process.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          {/* Date Picker select */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-3xs transition-all outline-none"
            >
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-1">
                {['2026-01-01 - 2026-12-31', '2026-05-01 - 2026-05-31', '2026-06-01 - 2026-06-30'].map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDatePicker(false);
                      toast.info(`Selected date range: ${range}`);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Report */}
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="flex items-center gap-2 px-4 h-10.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-3xs transition-all"
          >
            <Download className="h-4 w-4 text-slate-400" />
            <span>{isExporting ? 'Exporting...' : 'Export Report'}</span>
          </Button>
        </div>
      </div>

      {/* Stepper Conversion Flow (Visual Progress component) */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-3xs overflow-x-auto">
        {isLoadingCards ? (
          <div className="flex gap-5 min-w-[950px] p-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="flex-1 h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-5 min-w-[950px] p-2">
            {cardsData.map((stage, idx) => {
              const IconComponent = STAGE_ICONS[stage.Metric] || User;
              
              // Setup dynamic style variables based on stage theme color
              let badgeBg = 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400';
              if (stage.Metric === 'Contacted') badgeBg = 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400';
              else if (stage.Metric === 'Qualified') badgeBg = 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/30 dark:text-purple-400';
              else if (stage.Metric === 'Proposal Sent') badgeBg = 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400';
              else if (stage.Metric === 'Converted') badgeBg = 'bg-teal-50 text-teal-600 border-teal-100 dark:bg-teal-950/30 dark:text-teal-400';

              return (
                <React.Fragment key={stage.Metric}>
                  {/* Stepper Card */}
                  <div className="flex-1 flex flex-col justify-between gap-2 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 bg-slate-50/20 dark:bg-slate-950/30 min-w-[140px] max-w-[200px] h-full min-h-[110px] shadow-sm hover:shadow transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-snug">
                        {stage.Metric}
                      </span>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center border shrink-0 ${badgeBg}`}>
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="mt-1">
                      <span className="text-2xl font-black text-slate-900 dark:text-white block leading-none">
                        {stage.Count}
                      </span>
                    </div>
                  </div>

                  {/* Connecting arrow */}
                  {idx < cardsData.length - 1 && (
                    <div className="flex flex-row lg:flex-col items-center justify-center gap-1.5 shrink-0 px-2">
                      <div className="hidden lg:flex items-center gap-1">
                        <div className="h-0.5 w-10 border-t border-dashed border-slate-300 dark:border-slate-700" />
                        <ArrowRight className="h-3 w-3 text-slate-455" />
                      </div>
                      <div className="lg:hidden h-5 w-0.5 border-l border-dashed border-slate-300 dark:border-slate-700" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Card - Table list */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-3xs rounded-3xl overflow-hidden">
        {/* Header Toolbar */}
        <div className="p-5 border-b dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Lead Conversion Details
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs font-bold h-10 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-slate-350"
              />
            </div>

            <button
              onClick={() => toast.info('Filter options opened')}
              className="h-10 px-3.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-300 flex items-center justify-center gap-1.5 text-xs font-bold outline-none"
            >
              <Filter className="h-4 w-4 text-slate-400" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Lead Table */}
        <ReusableTable
          columns={columns}
          data={filteredList}
          loading={isLoadingList}
          page={page}
          pageSize={pageSize}
          totalRecords={totalRecords}
          onChangePage={setPage}
          onChangePageSize={setPageSize}
          borderless
          className="text-xs"
          headerActions={null}
        />
      </Card>
    </div>
  );
}
