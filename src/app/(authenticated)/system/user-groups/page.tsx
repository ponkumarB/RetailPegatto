'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  fetchITUserGroupDashboardCards,
  fetchITUserGroupOverallList,
  filterITUserGroup,
  searchITUserGroup,
  fetchITUserGroupTypeChart,
  fetchITTopGroups,
  deleteITUserGroup
} from '@/service/api/user-groups/api';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Users, UserCheck, UserPlus, Shield, ShieldAlert,
  Search, RefreshCw, ChevronDown, ChevronRight, Edit, Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Dynamically import ApexCharts to avoid SSR errors in Next.js
const ApexChart = dynamic(() => import('react-apexcharts').then((mod) => {
  if (typeof window !== 'undefined') {
    const windowWithApex = window as any;
    if (windowWithApex.ApexCharts && !windowWithApex.ApexCharts.prototype._originalDestroy) {
      windowWithApex.ApexCharts.prototype._originalDestroy = windowWithApex.ApexCharts.prototype.destroy;
      windowWithApex.ApexCharts.prototype.destroy = function () {
        try { this._originalDestroy(); } catch (e) { /* safe unmount */ }
      };
    }
  }
  return mod.default;
}), { ssr: false });

function Chart(props: any) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) {
    return (
      <div
        className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-xs font-bold text-slate-400"
        style={{ height: props.height || '150px' }}
      >
        Loading chart...
      </div>
    );
  }
  return <ApexChart {...props} />;
}

export default function UserGroupsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // API data states — no frontend-derived fallbacks
  const [cardsData, setCardsData] = useState<any>(null);
  const [typeChartData, setTypeChartData] = useState<any>(null);
  const [topGroups, setTopGroups] = useState<any[]>([]);

  // Load dashboard cards + type chart + top groups once on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';
        const [cards, typeChart, topG] = await Promise.all([
          fetchITUserGroupDashboardCards(orgId).catch(() => null),
          fetchITUserGroupTypeChart(orgId).catch(() => null),
          fetchITTopGroups(orgId).catch(() => null)
        ]);
        if (cards) setCardsData(cards);
        if (typeChart) setTypeChartData(typeChart);
        if (topG) {
          const list = topG?.data ?? topG?.Data ?? topG?.results ?? (Array.isArray(topG) ? topG : []);
          setTopGroups(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error('Failed to load user groups metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  /**
   * loadGroups — routes to the correct API based on active search/filter:
   *   - search text present  → ITUserGroupSearch
   *   - type/status filter   → ITUserGroupFilter
   *   - no search/filter     → ITUserGroupOverallList
   */
  const loadGroups = async () => {
    setLoading(true);
    try {
      const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';
      let res;

      if (search.trim()) {
        res = await searchITUserGroup(search.trim());
      } else if (typeFilter !== 'All' || statusFilter !== 'All') {
        const payload = {
          Group_Name: '',
          Group_Type: typeFilter === 'All' ? '' : typeFilter,
          Status: statusFilter === 'All' ? '' : statusFilter,
          Organization_Id: Number(orgId),
          Created_By: null,
          page: currentPage
        };
        res = await filterITUserGroup(payload);
      } else {
        res = await fetchITUserGroupOverallList(orgId);
      }

      // Actual response shape: { status, message, total_count, data: [...] }
      const dataArr = res?.data ?? res?.Data ?? res?.results ?? (Array.isArray(res) ? res : []);
      const list = Array.isArray(dataArr) ? dataArr : [];
      setGroups(list);
      setTotalCount(res?.total_count ?? res?.count ?? list.length);
    } catch (err) {
      console.error('Failed to load groups list:', err);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [search, typeFilter, statusFilter, currentPage]);

  const handleDelete = async (id: number) => {
    try {
      await deleteITUserGroup(id);
      toast.success('User group deleted successfully!');
      loadGroups();
    } catch (err: any) {
      console.error('Failed to delete user group:', err);
      toast.error(err?.message || 'Failed to delete user group');
    }
  };

  // ── KPI values — directly from API, no frontend fallback calculations ──
  const displayTotalGroups  = cardsData?.data?.total_groups  ?? cardsData?.Data?.total_groups  ?? cardsData?.total_groups;
  const displayActiveGroups = cardsData?.data?.active_groups ?? cardsData?.Data?.active_groups ?? cardsData?.active_groups;
  const displayTotalUsers   = cardsData?.data?.total_users   ?? cardsData?.Data?.total_users   ?? cardsData?.total_users;
  const displayCustomGroups = cardsData?.data?.custom_groups ?? cardsData?.Data?.custom_groups ?? cardsData?.custom_groups;
  const displaySystemGroups = cardsData?.data?.system_groups ?? cardsData?.Data?.system_groups ?? cardsData?.system_groups;

  // ── Chart: Groups by Type — from typeChartData API only ──
  const { typeLabels, typeSeries, typeColors } = useMemo(() => {
    const list = typeChartData?.data ?? typeChartData?.Data ?? [];
    const baseColors = ['#0565FD', '#10B981', '#f59e0b', '#8b5cf6'];
    
    if (Array.isArray(list) && list.length > 0) {
      const labels: string[] = [];
      const series: number[] = [];
      const colors: string[] = [];
      
      list.forEach((item: any, idx: number) => {
        labels.push(item.Group_Type || '');
        series.push(Number(item.total || 0));
        colors.push(baseColors[idx % baseColors.length]);
      });
      return { typeLabels: labels, typeSeries: series, typeColors: colors };
    }
    return { typeLabels: [], typeSeries: [], typeColors: [] };
  }, [typeChartData]);

  const typeTotal = typeSeries.reduce((a, b) => a + b, 0);

  const typeDonutOptions = {
    chart: { type: 'donut' as const, fontFamily: 'Inter, sans-serif' },
    labels: typeLabels,
    colors: typeColors,
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => String(typeTotal ?? ''),
              style: { fontSize: '11px', fontWeight: 600, color: '#94a3b8' }
            },
            value: {
              show: true, fontSize: '22px', fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => String(typeTotal ?? '')
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  // ── Chart: Group Health — from cardsData API only ──
  const healthyCount  = cardsData?.data?.healthy_groups  ?? cardsData?.Data?.healthy_groups  ?? cardsData?.healthy_groups  ?? 0;
  const inactiveCount = cardsData?.data?.inactive_groups ?? cardsData?.Data?.inactive_groups ?? cardsData?.inactive_groups ?? 0;
  const healthSeries  = [healthyCount, inactiveCount];
  const healthTotal   = healthyCount + inactiveCount;
  const healthPct     = healthTotal > 0 ? `${Math.round((healthyCount / healthTotal) * 100)}%` : '-';
  const healthColors  = ['#10b981', '#ef4444'];
  const healthLabels  = ['Healthy Groups', 'Inactive Groups'];

  const healthDonutOptions = {
    chart: { type: 'donut' as const, fontFamily: 'Inter, sans-serif' },
    labels: healthLabels,
    colors: healthColors,
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true, label: 'Healthy',
              formatter: () => healthPct,
              style: { fontSize: '10px', fontWeight: 600, color: '#94a3b8' }
            },
            value: {
              show: true, fontSize: '20px', fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => healthPct
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  // ── Badge helpers ──
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'System': return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px]">System</Badge>;
      case 'Custom': return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[10px]">Custom</Badge>;
      default:       return <Badge className="bg-slate-50 text-slate-700 border-slate-200 font-bold text-[10px]">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':   return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[10px]">Active</Badge>;
      case 'Inactive': return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-bold text-[10px]">Inactive</Badge>;
      default:         return <Badge className="bg-slate-50 text-slate-700 border-slate-200 font-bold text-[10px]">{status}</Badge>;
    }
  };

  // ── Table columns — display only what the API returns ──
  const tableColumns: ColumnConfig<any>[] = [
    {
      key: 'Group_Name', header: 'Group Name', sortable: true,
      render: (row) => {
        const gName = row.Group_Name || '';
        const initials = gName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'GP';
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-955/30 dark:text-blue-400 flex items-center justify-center font-extrabold text-[10px] border dark:border-blue-900/10 shrink-0">
              {initials}
            </div>
            <span className="text-slate-800 dark:text-slate-200 font-black">{gName}</span>
          </div>
        );
      }
    },
    {
      key: 'Group_Type', header: 'Group Type', sortable: true,
      render: (row) => getTypeBadge(row.Group_Type)
    },
    {
      key: 'Description', header: 'Description', sortable: true,
      render: (row) => (
        <span className="text-slate-400 dark:text-slate-500 font-medium max-w-[200px] truncate block">
          {row.Description}
        </span>
      )
    },
    {
      key: 'team_count', header: 'Teams', sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="text-slate-400">🏢</span>
          <span>{row.team_count}</span>
        </div>
      )
    },
    {
      key: 'user_count', header: 'Users', sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className="text-slate-400">👥</span>
          <span>{row.user_count}</span>
        </div>
      )
    },
    {
      key: 'Created_Date', header: 'Created On', sortable: true,
      render: (row) => (
        <span className="text-slate-400 dark:text-slate-500 font-medium">
          {row.Created_Date
            ? new Date(row.Created_Date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            : '-'}
        </span>
      )
    },
    {
      key: 'Status', header: 'Status', sortable: true,
      render: (row) => getStatusBadge(row.Status)
    }
  ];

  const renderActions = (row: any) => (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); router.push(`/system/user-groups/${row.id}/edit`); }}
        title="Edit Group"
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
        title="Delete Group"
        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-1.5 sm:p-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            User Groups <Users className="h-5 w-5 text-blue-600" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage user groups, assign permissions and organize users efficiently.</p>
        </div>
        <Button
          onClick={() => router.push('/system/user-groups/create')}
          className="text-white font-extrabold gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2.5 cursor-pointer shadow-sm shadow-blue-500/10 flex items-center shrink-0 w-fit"
        >
          <UserPlus className="h-4 w-4" /> Create Group
          <ChevronDown className="h-3.5 w-3.5 border-l border-blue-500/50 pl-1 ml-0.5" />
        </Button>
      </div>

      {/* KPI Cards Row — values come from cardsData API only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Groups',        value: displayTotalGroups,  icon: <Users className="h-4 w-4" />,       bg: 'bg-blue-50 dark:bg-blue-955/30 text-blue-600' },
          { label: 'Active Groups',       value: displayActiveGroups, icon: <UserCheck className="h-4 w-4" />,   bg: 'bg-emerald-50 dark:bg-emerald-955/30 text-emerald-600' },
          { label: 'Total Users in Groups', value: displayTotalUsers, icon: <UserPlus className="h-4 w-4" />,   bg: 'bg-amber-50 dark:bg-amber-955/30 text-amber-600' },
          { label: 'Custom Groups',       value: displayCustomGroups, icon: <Shield className="h-4 w-4" />,      bg: 'bg-purple-50 dark:bg-purple-955/30 text-purple-600' },
          { label: 'System Groups',       value: displaySystemGroups, icon: <ShieldAlert className="h-4 w-4" />, bg: 'bg-red-50 dark:bg-red-955/30 text-red-600' }
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">{label}</span>
              <div className={`p-2.5 rounded-full ${bg}`}>{icon}</div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {value ?? '-'}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Groups by Type */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Groups by Type</h3>
          <div className="flex flex-col items-center justify-between gap-3 flex-1">
            <div className="relative h-[110px] w-[110px] shrink-0">
              <Chart options={typeDonutOptions} series={typeSeries} type="donut" height="110px" />
            </div>
            <div className="space-y-1.5 text-[10.5px] font-bold w-full pt-1.5 border-t dark:border-slate-800">
              {typeLabels.map((label, idx) => {
                const total = typeTotal;
                const pct = total > 0 ? `${Math.round((typeSeries[idx] / total) * 100)}%` : '-';
                return (
                  <div key={idx} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: typeColors[idx] }} />
                      <span className="truncate">{label}</span>
                    </div>
                    <span className="text-slate-800 dark:text-slate-200 shrink-0 ml-1.5">
                      {typeSeries[idx]} <span className="text-[9.5px] text-slate-400 font-medium">({pct})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Group Health */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Group Health</h3>
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-[110px] w-[110px] shrink-0">
              <Chart options={healthDonutOptions} series={healthSeries} type="donut" height="110px" />
            </div>
            <div className="space-y-2 text-xs font-bold w-full pt-1.5 border-t dark:border-slate-800">
              {[
                { name: 'Healthy',  count: healthyCount,  color: 'bg-[#10b981]' },
                { name: 'Inactive', count: inactiveCount, color: 'bg-[#ef4444]' }
              ].map((item, i) => {
                const pct = healthTotal > 0 ? `${Math.round((item.count / healthTotal) * 100)}%` : '-';
                return (
                  <div key={i} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color} shrink-0`} />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 shrink-0 ml-2">
                      {item.count} <span className="text-[10px] text-slate-400 font-semibold font-mono">({pct})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Groups by Users */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Top Groups by Users</h3>
          <div className="space-y-3 text-left">
            {topGroups.length > 0 ? (
              topGroups.slice(0, 5).map((gItem, idx) => {
                const gName  = gItem.Group_Name || gItem.group_name || gItem.name || '';
                const gCount = gItem.user_count ?? gItem.users ?? gItem.count;
                return (
                  <div key={idx} className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 shrink-0">👥</span>
                      <span className="truncate max-w-[130px]">{gName}</span>
                    </div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100">{gCount}</span>
                  </div>
                );
              })
            ) : (
              <p className="text-xs font-medium text-slate-400">No data available.</p>
            )}
            <button className="w-full text-center text-xs text-blue-600 hover:underline font-bold pt-2 border-t dark:border-slate-800 flex items-center justify-center gap-1 cursor-pointer">
              View All <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* All User Groups Table */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">All User Groups</h3>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none sm:w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search groups..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="text-[11px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-350 outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Custom">Custom</option>
              <option value="System">System</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="text-[11px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-350 outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              onClick={() => { setSearch(''); setTypeFilter('All'); setStatusFilter('All'); setCurrentPage(1); }}
              className="text-xs text-rose-600 hover:underline font-bold ml-1.5 shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          </div>
        </div>

        <ReusableTable
          columns={tableColumns}
          data={groups}
          actions={renderActions}
          showGear={true}
          borderless={true}
          loading={loading}
          rowKey="id"
          page={currentPage}
          totalRecords={totalCount}
          onChangePage={(p) => setCurrentPage(p)}
          pageSize={10}
        />
      </div>
    </div>
  );
}
