'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Users, UserCheck, UserPlus, UserMinus,
  Search, ChevronDown, ChevronRight, Edit, Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  fetchITUserTeamsCards,
  fetchITUserTeamsTeamByDepartment,
  fetchITUserTeamsList,
  filterITUserTeams,
  deleteITUserTeam
} from '@/service/api/teams/api';
import { ReusableTable } from '@/components/ui/ReusableTable';

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
        className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl animate-pulse flex items-center justify-center text-xs font-bold text-slate-450"
        style={{ height: props.height || '150px' }}
      >
        Loading chart...
      </div>
    );
  }
  return <ApexChart {...props} />;
}

export default function TeamsListPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [leadFilter, setLeadFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // API-only data states
  const [cardsData, setCardsData] = useState<any>(null);
  const [deptData, setDeptData] = useState<any>(null);

  // Load KPI cards + dept chart once on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';
        const [cards, dept] = await Promise.all([
          fetchITUserTeamsCards(orgId).catch(() => null),
          fetchITUserTeamsTeamByDepartment(orgId).catch(() => null)
        ]);
        if (cards) setCardsData(cards);
        if (dept) setDeptData(dept);
      } catch (err) {
        console.error('Failed to load teams metadata:', err);
      }
    }
    loadMetadata();
  }, []);

  // Load teams list — uses filter API when any filter/search is active, list API otherwise
  const loadTeams = async () => {
    setLoading(true);
    try {
      const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';
      let res;

      if (search.trim() || deptFilter !== 'All' || statusFilter !== 'All' || leadFilter !== 'All') {
        const payload = {
          Team_Name: search || '',
          Team_Code: '',
          Department: deptFilter === 'All' ? '' : deptFilter,
          Status: statusFilter === 'All' ? '' : statusFilter,
          Team_Lead: leadFilter === 'All' ? null : Number(leadFilter),
          Organization_Id: Number(orgId),
          Created_By: null,
          page: currentPage
        };
        res = await filterITUserTeams(payload);
      } else {
        res = await fetchITUserTeamsList({ Organization_Id: orgId, page: currentPage });
      }

      const dataArr = res?.results ?? res?.data ?? res?.Data ?? (Array.isArray(res) ? res : []);
      setTeams(Array.isArray(dataArr) ? dataArr : []);
    } catch (err) {
      console.error('Failed to load teams list:', err);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, [search, deptFilter, statusFilter, leadFilter, currentPage]);

  const handleDelete = async (id: number) => {
    try {
      await deleteITUserTeam(id);
      toast.success('Team deleted successfully!');
      loadTeams();
    } catch (err: any) {
      console.error('Failed to delete team:', err);
      toast.error(err?.message || 'Failed to delete team');
    }
  };

  // ── KPI values — from cardsData API only, no frontend calculations ──
  const totalTeamsCount    = cardsData?.Data?.total_teams           ?? cardsData?.data?.total_teams           ?? cardsData?.total_teams;
  const activeTeamsCount   = cardsData?.Data?.active_teams          ?? cardsData?.data?.active_teams          ?? cardsData?.active_teams;
  const inactiveTeamsCount = cardsData?.Data?.inactive_teams        ?? cardsData?.data?.inactive_teams        ?? cardsData?.inactive_teams;
  const totalMembersCount  = cardsData?.Data?.total_members         ?? cardsData?.data?.total_members         ?? cardsData?.total_members;
  const avgMembersPerTeam  = cardsData?.Data?.average_members_per_team ?? cardsData?.data?.average_members_per_team ?? cardsData?.average_members_per_team;

  // ── Chart: Teams by Department — from deptData API only ──
  const { deptLabels, deptSeries, deptColors } = useMemo(() => {
    const baseColors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444'];
    const list = deptData?.Data ?? deptData?.data ?? deptData?.results;

    if (Array.isArray(list) && list.length > 0) {
      const labels: string[] = [];
      const series: number[] = [];
      const colors: string[] = [];
      list.forEach((item: any, idx: number) => {
        labels.push(item.department || '');
        series.push(Number(item.count || 0));
        colors.push(baseColors[idx % baseColors.length]);
      });
      return { deptLabels: labels, deptSeries: series, deptColors: colors };
    }
    return { deptLabels: [], deptSeries: [], deptColors: [] };
  }, [deptData]);

  const deptTotal = deptSeries.reduce((a, b) => a + b, 0);

  const deptDonutOptions = {
    chart: { type: 'donut' as const, fontFamily: 'Inter, sans-serif' },
    labels: deptLabels,
    colors: deptColors,
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true, label: 'Total',
              formatter: () => String(deptTotal),
              style: { fontSize: '11px', fontWeight: 600, color: '#94a3b8' }
            },
            value: {
              show: true, fontSize: '22px', fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => String(deptTotal)
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  // ── Badge helpers ──
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 font-bold text-[10px]">Active</Badge>;
      case 'Inactive':
        return <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-350 border-rose-100 dark:border-rose-800 font-bold text-[10px]">Inactive</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-100 dark:border-slate-855 font-bold text-[10px]">{status}</Badge>;
    }
  };

  // ── Table columns — display only API values ──
  const columns = useMemo(() => [
    {
      key: 'Team_Name', header: 'Team Name', sortable: true,
      render: (t: any) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-650 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-slate-800 dark:text-slate-200 text-xs font-bold">{t.Team_Name}</span>
            {t.Team_Code && <span className="text-[10px] text-slate-400 font-semibold">Code: {t.Team_Code}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'Team_Lead', header: 'Team Lead', sortable: true,
      render: (t: any) => {
        const lead = t.Team_Lead;
        if (!lead) return <span className="text-slate-400 text-xs">-</span>;
        const name = (lead.first_name || lead.last_name)
          ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
          : lead.username || '';
        const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
        return (
          <div className="flex items-center gap-2 text-left">
            <div className="h-6 w-6 rounded-full flex items-center justify-center font-black text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400 shrink-0">
              {initials}
            </div>
            <span className="text-slate-700 dark:text-slate-300 text-xs">{name}</span>
          </div>
        );
      }
    },
    {
      key: 'Department', header: 'Department', sortable: true,
      render: (t: any) => <span className="text-slate-600 dark:text-slate-400 text-xs">{t.Department}</span>
    },
    {
      key: 'Team_Members', header: 'Members',
      render: (t: any) => (
        <span className="text-slate-700 dark:text-slate-300 text-xs">
          {Array.isArray(t.Team_Members) ? t.Team_Members.length : '-'}
        </span>
      )
    },
    {
      key: 'Status', header: 'Status', sortable: true,
      render: (t: any) => getStatusBadge(t.Status)
    },
    {
      key: 'Created_Date', header: 'Created On', sortable: true,
      render: (t: any) => (
        <span className="text-slate-500 text-xs font-semibold">
          {t.Created_Date
            ? new Date(t.Created_Date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
            : '-'}
        </span>
      )
    }
  ], []);

  const tableActions = (t: any) => (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={(e) => { e.stopPropagation(); router.push(`/system/teams/${t.id}/edit`); }}
        title="Edit Team"
        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this team?')) handleDelete(t.id);
        }}
        title="Delete Team"
        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-450 transition-colors cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Teams <Users className="h-5 w-5 text-blue-600" />
          </h1>
          <p className="text-xs text-slate-450 mt-1">Manage teams, view team performance and manage team members.</p>
        </div>
        <Button
          onClick={() => router.push('/system/teams/create')}
          className="text-white font-extrabold gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-705 text-xs px-4 py-2.5 cursor-pointer shadow-sm shadow-blue-500/10 flex items-center shrink-0 w-fit"
        >
          <UserPlus className="h-4 w-4" /> Create Team
          <ChevronDown className="h-3.5 w-3.5 border-l border-blue-500/50 pl-1 ml-0.5" />
        </Button>
      </div>

      {/* KPI Cards — values from cardsData API only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Teams',       value: totalTeamsCount,    icon: <Users className="h-4 w-4" />,     bg: 'bg-blue-50 dark:bg-blue-955/30 text-blue-600' },
          { label: 'Active Teams',      value: activeTeamsCount,   icon: <UserCheck className="h-4 w-4" />, bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' },
          { label: 'Total Members',     value: totalMembersCount,  icon: <UserPlus className="h-4 w-4" />,  bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600' },
          { label: 'Avg. Members/Team', value: avgMembersPerTeam,  icon: <Users className="h-4 w-4" />,     bg: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600' },
          { label: 'Inactive Teams',    value: inactiveTeamsCount, icon: <UserMinus className="h-4 w-4" />, bg: 'bg-red-50 dark:bg-red-950/30 text-red-600' }
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">{label}</span>
              <div className={`p-2.5 rounded-full ${bg}`}>{icon}</div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{value ?? '-'}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Table + Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Teams Table */}
        <div className="xl:col-span-3">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">All Teams</h3>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search teams..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
                  />
                </div>

                {/* Dept Filter */}
                <select
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                  className="text-[11px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-350 outline-none cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  <option value="IT">IT</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Support">Support</option>
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="text-[11px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl px-2.5 py-1.5 text-slate-705 dark:text-slate-350 outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(''); setDeptFilter('All'); setStatusFilter('All'); setLeadFilter('All'); setCurrentPage(1); }}
                  className="rounded-xl border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer px-3"
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="w-full text-left min-h-[350px]">
              <ReusableTable
                columns={columns}
                data={teams}
                actions={tableActions}
                loading={loading}
                title="All Teams"
                initialPageSize={8}
                rowKey="id"
              />
            </div>
          </div>
        </div>

        {/* Sidebar: Teams by Department */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Teams by Department</h3>
            {deptLabels.length > 0 ? (
              <div className="flex flex-col items-center justify-between gap-3 flex-1">
                <div className="relative h-[110px] w-[110px] shrink-0">
                  <Chart options={deptDonutOptions} series={deptSeries} type="donut" height="110px" />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-bold w-full pt-2 border-t dark:border-slate-800">
                  {deptLabels.map((label, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: deptColors[idx] }} />
                        <span className="truncate">{label}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 shrink-0 ml-1">{deptSeries[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium text-center py-6">No department data available.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
