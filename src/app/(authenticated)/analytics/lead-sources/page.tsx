'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { fetchAnalysticLeadSource } from '@/service/api/Analytics/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Users,
  Calendar,
  BarChart3,
  RefreshCw,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Target,
  FileText,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

// Dynamically import ApexCharts to avoid Next.js SSR hydration issues
const ApexChart = dynamic(() => import('react-apexcharts').then((mod) => {
  if (typeof window !== 'undefined') {
    const windowWithApex = window as any;
    if (windowWithApex.ApexCharts && !windowWithApex.ApexCharts.prototype._originalDestroy) {
      windowWithApex.ApexCharts.prototype._originalDestroy = windowWithApex.ApexCharts.prototype.destroy;
      windowWithApex.ApexCharts.prototype.destroy = function () {
        try {
          this._originalDestroy();
        } catch (e) {
          console.debug('Safely intercepted ApexCharts unmount error:', e);
        }
      };
    }
  }
  return mod.default;
}), { ssr: false });

function Chart(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div
        className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-xs font-bold text-slate-400"
        style={{ height: props.height || '220px' }}
      >
        Loading chart...
      </div>
    );
  }
  return <ApexChart {...props} />;
}

// Format date utility
const formatDateString = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getPeriodDates = (period: string) => {
  const now = new Date('2026-07-08'); // System date base
  const year = now.getFullYear();
  
  switch (period) {
    case 'this-year':
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case 'last-year':
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    case 'this-quarter': {
      const month = now.getMonth();
      const quarter = Math.floor(month / 3);
      const startMonth = String(quarter * 3 + 1).padStart(2, '0');
      const endMonth = String(quarter * 3 + 3).padStart(2, '0');
      const lastDay = quarter === 0 ? '31' : quarter === 1 ? '30' : quarter === 2 ? '30' : '31';
      return { from: `${year}-${startMonth}-01`, to: `${year}-${endMonth}-${lastDay}` };
    }
    case 'this-month': {
      const currentMonth = now.getMonth();
      const m = String(currentMonth + 1).padStart(2, '0');
      const days = new Date(year, currentMonth + 1, 0).getDate();
      return { from: `${year}-${m}-01`, to: `${year}-${m}-${days}` };
    }
    default:
      return { from: '2022-01-01', to: '2026-07-08' };
  }
};

export default function LeadSourcesPage() {
  const [period, setPeriod] = useState<string>('this-year');
  const [fromdate, setFromdate] = useState<string>('2022-01-01');
  const [todate, setTodate] = useState<string>('2026-07-08');
  const [userid, setUserid] = useState<string>('all');

  const [users, setUsers] = useState<any[]>([]);
  const [leadData, setLeadData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);
  const [expandedSources, setExpandedSources] = useState<string[]>([]);

  // Fetch user list (Sales Owners / Representatives)
  useEffect(() => {
    setIsUsersLoading(true);
    fetchUsersList()
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        setUsers(list);
      })
      .catch((err) => {
        console.error('Failed to fetch users list', err);
        toast.error('Failed to load Representatives.');
      })
      .finally(() => {
        setIsUsersLoading(false);
      });
  }, []);

  // Fetch lead sources data
  const loadLeadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let apiUserId: string | number = 'all';
      if (userid !== 'all') {
        const found = users.find((u) => {
          const name = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
          return name === userid;
        });
        if (found) {
          apiUserId = Number(found.id);
        }
      }

      const res = await fetchAnalysticLeadSource({
        Is_Deleted: false,
        fromdate,
        todate,
        userid: apiUserId
      });
      if (res && res.lead_sources_within_period) {
        // Sort lead sources by Total Leads descending
        const sorted = [...res.lead_sources_within_period].sort((a, b) => b.Total_Leads - a.Total_Leads);
        setLeadData(sorted);
      } else {
        setLeadData([]);
      }
    } catch (err) {
      console.error('Failed to fetch lead sources analytics', err);
      toast.error('Failed to load Lead Sources data.');
      setLeadData([]);
    } finally {
      setIsLoading(false);
    }
  }, [fromdate, todate, userid, users]);

  useEffect(() => {
    loadLeadData();
  }, [loadLeadData]);

  // Handle Preset Period Change
  const handlePeriodChange = (val: string) => {
    setPeriod(val);
    if (val !== 'custom') {
      const dates = getPeriodDates(val);
      setFromdate(dates.from);
      setTodate(dates.to);
    }
  };

  // Toggle row expansion
  const toggleSourceExpand = (sourceName: string) => {
    setExpandedSources(prev =>
      prev.includes(sourceName)
        ? prev.filter(name => name !== sourceName)
        : [...prev, sourceName]
    );
  };

  // Export report to CSV
  const handleExport = () => {
    if (leadData.length === 0) {
      toast.warning('No data available to export.');
      return;
    }
    const headers = ['Lead Source', 'Lead ID', 'Lead Name', 'Company Name', 'Email ID', 'Score', 'Status', 'Owner', 'Created Date'];
    const rows: any[] = [];

    leadData.forEach((source: any) => {
      const sourceName = source.LeadSource || 'Unknown';
      const details = source.Lead_Details || [];
      if (details.length === 0) {
        rows.push([sourceName, '-', '-', '-', '-', '-', '-', '-', '-']);
      } else {
        details.forEach((lead: any) => {
          const leadName = lead.LeadFirstName ? `${lead.LeadFirstName} ${lead.LeadLastName || ''}`.trim() : 'Unnamed';
          rows.push([
            sourceName,
            lead.LeadId || '-',
            leadName,
            lead.CompanyName || '-',
            lead.EmailId || '-',
            lead.LeadScore ?? '-',
            lead.Lead_Status || '-',
            lead.Lead_Owner || '-',
            formatDateString(lead.Created_Date)
          ]);
        });
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lead_sources_report_${fromdate}_to_${todate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported successfully.');
  };

  // Metric summaries
  const totalLeadsCount = useMemo(() => {
    return leadData.reduce((acc, curr) => acc + (curr.Total_Leads || 0), 0);
  }, [leadData]);

  const topLeadSource = useMemo(() => {
    if (leadData.length === 0) return 'N/A';
    const top = leadData[0];
    return `${top.LeadSource || 'Unknown'} (${top.Total_Leads} leads)`;
  }, [leadData]);

  const activeSourcesCount = leadData.length;

  // Chart configuration (Donut Chart)
  const donutChartOptions = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'Inter, sans-serif',
      toolbar: { show: false }
    },
    labels: leadData.map(d => d.LeadSource || 'Unknown'),
    colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'],
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      fontSize: '11px',
      labels: { colors: '#64748B' }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      dropShadow: { enabled: false }
    },
    stroke: { show: true, width: 2, colors: ['#ffffff'] },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Leads',
              fontSize: '12px',
              color: '#64748B',
              formatter: () => String(totalLeadsCount)
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: (val: string) => val
            }
          }
        }
      }
    },
    tooltip: {
      y: { formatter: (val: number) => `${val} leads` }
    }
  };

  const donutChartSeries = leadData.map(d => d.Total_Leads || 0);

  return (
    <div className="space-y-6">
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            Lead Sources
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Inbound channel performances, total acquisitions, and individual representative mappings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLeadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 h-9 text-xs border-slate-200 dark:border-slate-850 hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleExport}
            disabled={leadData.length === 0}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 shadow-2xs h-9 text-xs px-4 rounded-xl cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Selector Panel */}
      <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs text-left">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            {/* Representative Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Choose Rep
              </label>
              <Select value={userid} onValueChange={(val) => val && setUserid(val)} disabled={isUsersLoading}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-lg">
                  <SelectValue placeholder="Select Rep" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-h-48 overflow-y-auto">
                  <SelectItem value="all">All Sales Owners</SelectItem>
                  {users.map((u) => {
                    const name = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
                    return (
                      <SelectItem key={u.id} value={name}>
                        {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Period Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Choose a Period
              </label>
              <Select value={period} onValueChange={(val) => val && handlePeriodChange(val)}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 rounded-lg">
                  <SelectValue placeholder="Select Period" />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-850 max-h-48 overflow-y-auto">
                  <SelectItem value="this-year">This Year (2026)</SelectItem>
                  <SelectItem value="last-year">Last Year (2025)</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom From Date */}
            {period === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromdate}
                  onChange={(e) => setFromdate(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Custom To Date */}
            {period === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  To Date
                </label>
                <input
                  type="date"
                  value={todate}
                  onChange={(e) => setTodate(e.target.value)}
                  className="w-full h-9 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

          </div>
        </CardContent>
      </Card>

      {/* KPI summaries row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left animate-fade-in">
        
        {/* Total Leads */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Leads Acquired
              </span>
              <div className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                {isLoading ? '...' : totalLeadsCount}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Lead Source */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Top Lead Channel
              </span>
              <div className="text-base font-black text-slate-800 dark:text-white mt-1 leading-snug">
                {isLoading ? '...' : topLeadSource}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sources */}
        <Card className="hover:shadow-md transition-shadow border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Active Channels Count
              </span>
              <div className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                {isLoading ? '...' : activeSourcesCount}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Grid: Interactive Table and Pie/Donut Chart */}
      {isLoading ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-400">Loading Inbound Telemetries...</p>
        </Card>
      ) : leadData.length === 0 ? (
        <Card className="border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs p-12 flex flex-col items-center justify-center min-h-[400px]">
          <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-base font-black text-slate-700 dark:text-slate-350">No Lead Source Data Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Try adjusting your dates or choosing a different representative.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* Left Column: Interactive expandable Table */}
          <Card className="lg:col-span-7 border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                Inbound Channels Breakdown
              </CardTitle>
              <CardDescription className="text-[10px]">
                Click on any source channel row below to audit the active leads list
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-850">
                      <TableHead className="w-10 pl-6 py-3" />
                      <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 py-3">
                        Lead Source
                      </TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 py-3 text-center">
                        Total Leads
                      </TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-slate-400 pr-6 py-3 text-right">
                        Share Share
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadData.map((source, index) => {
                      const isExpanded = expandedSources.includes(source.LeadSource);
                      const sharePct = totalLeadsCount > 0 
                        ? ((source.Total_Leads / totalLeadsCount) * 100).toFixed(1) 
                        : '0';

                      return (
                        <React.Fragment key={index}>
                          
                          {/* Parent Row */}
                          <TableRow
                            onClick={() => toggleSourceExpand(source.LeadSource)}
                            className="border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors cursor-pointer"
                          >
                            <TableCell className="pl-6 py-3.5">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              )}
                            </TableCell>
                            <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-350 py-3.5">
                              {source.LeadSource || 'Unknown'}
                            </TableCell>
                            <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-300 text-center py-3.5">
                              {source.Total_Leads}
                            </TableCell>
                            <TableCell className="font-black text-xs text-slate-800 dark:text-slate-200 pr-6 text-right py-3.5">
                              {sharePct}%
                            </TableCell>
                          </TableRow>

                          {/* Expanded Child Details Table */}
                          {isExpanded && (
                            <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-850">
                              <TableCell colSpan={4} className="bg-slate-50/30 dark:bg-slate-950/20 p-0">
                                <div className="border-t border-b border-slate-100 dark:border-slate-850/60 overflow-x-auto max-h-72">
                                  <Table>
                                    <TableHeader className="bg-slate-50/60 dark:bg-slate-950/40">
                                      <TableRow className="hover:bg-transparent border-transparent">
                                        <TableHead className="font-extrabold text-[9px] uppercase text-slate-400 pl-8 py-2">
                                          Lead ID
                                        </TableHead>
                                        <TableHead className="font-extrabold text-[9px] uppercase text-slate-400 py-2">
                                          Name
                                        </TableHead>
                                        <TableHead className="font-extrabold text-[9px] uppercase text-slate-400 py-2">
                                          Company
                                        </TableHead>
                                        <TableHead className="font-extrabold text-[9px] uppercase text-slate-400 py-2">
                                          Email ID
                                        </TableHead>
                                        <TableHead className="font-extrabold text-[9px] uppercase text-slate-400 py-2 text-center">
                                          Score
                                        </TableHead>
                                        <TableHead className="font-extrabold text-[9px] uppercase text-slate-400 pr-6 py-2 text-right">
                                          Status
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {source.Lead_Details && source.Lead_Details.length > 0 ? (
                                        source.Lead_Details.map((lead: any, lIdx: number) => {
                                          const leadName = lead.LeadFirstName ? `${lead.LeadFirstName} ${lead.LeadLastName || ''}`.trim() : 'Unnamed';
                                          return (
                                            <TableRow key={lIdx} className="hover:bg-slate-50/20 dark:hover:bg-slate-850/10 border-slate-100/50 dark:border-slate-850/30">
                                              <TableCell className="font-mono text-[10px] text-slate-500 pl-8 py-2">
                                                {lead.LeadId || '-'}
                                              </TableCell>
                                              <TableCell className="font-bold text-xs text-slate-700 dark:text-slate-350 py-2">
                                                {leadName}
                                              </TableCell>
                                              <TableCell className="font-semibold text-xs text-slate-500 py-2">
                                                {lead.CompanyName || '-'}
                                              </TableCell>
                                              <TableCell className="font-semibold text-xs text-slate-500 py-2">
                                                {lead.EmailId || '-'}
                                              </TableCell>
                                              <TableCell className="font-bold text-xs text-center py-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${lead.LeadScore >= 70 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-slate-50 text-slate-500 dark:bg-slate-850'}`}>
                                                  {lead.LeadScore ?? '0'}
                                                </span>
                                              </TableCell>
                                              <TableCell className="font-bold text-xs text-right pr-6 py-2 text-slate-650">
                                                {lead.Lead_Status || '-'}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        })
                                      ) : (
                                        <TableRow className="border-transparent">
                                          <TableCell colSpan={6} className="text-center py-6 text-xs text-slate-400 font-bold">
                                            No lead records registered in this channel.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}

                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Donut Contribution Chart */}
          <Card className="lg:col-span-5 border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black text-slate-800 dark:text-slate-200">
                Acquisitions Share
              </CardTitle>
              <CardDescription className="text-[10px]">
                Inbound source contributions calculated as percentage shares
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 flex flex-col justify-center items-center min-h-[350px]">
              <div className="w-full max-w-[340px]">
                <Chart options={donutChartOptions} series={donutChartSeries} type="donut" height="320" />
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
