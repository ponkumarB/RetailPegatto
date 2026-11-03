'use client';

import React from 'react';
import {
  usePMDashboardNewITQuery,
  usePMDashboardAnalyticsITNewQuery
} from '@/service/dashboardQueries';
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  CheckSquare,
  Calendar,
  ClipboardList,
  Send,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { useRouter } from 'next/navigation';
import Chart from './Chart';
import { KPICard } from './KPICard';

interface PMDashboardProps {
  startDate: string;
  endDate: string;
  createdBy: number;
  primaryColor: string;
  period: string;
}

export default function StoreManagerDashboard({
  startDate,
  endDate,
  createdBy,
  primaryColor,
  period
}: PMDashboardProps) {
  const router = useRouter();

  // PM Queries (hooks execute only when component is rendered)
  const { data: pmDashboardRes, isLoading: isPmDashboardLoading } = usePMDashboardNewITQuery(
    startDate,
    endDate,
    createdBy,
    true
  );
  const { data: pmAnalyticsRes, isLoading: isPmAnalyticsLoading } = usePMDashboardAnalyticsITNewQuery(
    startDate,
    endDate,
    true
  );

  const pmDashboard = pmDashboardRes?.data || pmDashboardRes;
  const pmAnalytics = pmAnalyticsRes?.data || pmAnalyticsRes;

  if (isPmDashboardLoading || isPmAnalyticsLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-xs font-bold text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span>Loading PM Dashboard data...</span>
      </div>
    );
  }

  const kpi = pmDashboard?.kpi_cards || {
    total_projects: 0,
    on_track: 0,
    at_risk: 0,
    overdue_tasks: 0,
    my_tasks: 0,
    issues_open: 0
  };

  const health = pmDashboard?.project_health_overview || {
    total: 0,
    on_track: 0,
    at_risk: 0,
    delayed: 0,
    not_started: 0
  };

  const projectsByProgress = pmDashboard?.projects_by_progress || [];
  const progressCategories = projectsByProgress.map((p: any) => p.project_name) || [];
  const progressSeries = projectsByProgress.map((p: any) => Number(p.progress)) || [];

  const projectHealthOverviewOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['On Track', 'At Risk', 'Delayed', 'Not Started'],
    colors: ['#10B981', '#0565FD', '#EF4444', '#94A3B8'],
    legend: { show: false },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total Projects',
              formatter: () => String(health.total),
              style: { fontSize: '13px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => String(health.total)
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const projectsByProgressOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '55%',
      }
    },
    colors: [primaryColor],
    xaxis: {
      categories: progressCategories.length > 0 ? progressCategories : ['No Data'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: 'Project',
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    yaxis: {
      max: 100,
      labels: { formatter: (v: number) => `${v}%` },
      title: {
        text: 'Progress (%)',
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  const teamUtil = pmAnalytics?.team_utilization || { overall_utilization: 0, departments: [] };
  const teamUtilGaugeOpts = {
    chart: { type: 'radialBar' as const, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        track: {
          background: '#F1F5F9',
          strokeWidth: '97%',
          margin: 5,
        },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: -2,
            fontSize: '30px',
            fontWeight: 800,
            formatter: (val: number) => `${val}%`
          }
        }
      }
    },
    grid: { padding: { top: -10 } },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'horizontal',
        shadeIntensity: 0.5,
        gradientToColors: ['#10B981'],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100]
      }
    },
    colors: ['#0565FD'],
    labels: ['Average Utilization']
  };

  const myTasks = pmDashboard?.my_tasks || [];
  const projectSummaryData = pmAnalytics?.project_summary || [];
  const issuesByPrio = pmAnalytics?.issues_by_priority || { high: 0, normal: 0, low: 0, resolved: 0 };
  
  const issuePriorityCards = [
    { label: 'Critical', value: String(issuesByPrio.high), color: 'bg-red-50 text-red-755 dark:bg-red-950/20' },
    { label: 'Medium', value: String(issuesByPrio.normal), color: 'bg-amber-50 text-amber-755 dark:bg-amber-950/20' },
    { label: 'Low', value: String(issuesByPrio.low), color: 'bg-emerald-50 text-emerald-755 dark:bg-emerald-950/20' },
    { label: 'Resolved', value: String(issuesByPrio.resolved), color: 'bg-blue-50 text-blue-755 dark:bg-blue-950/20' }
  ];

  const milestones = pmAnalytics?.upcoming_milestones || [];
  const activities = pmAnalytics?.recent_activity || [];

  const projectHealthOverviewSeries = [
    health.on_track || 0,
    health.at_risk || 0,
    health.delayed || 0,
    health.not_started || 0
  ];

  interface ProjectSummaryRow {
    project_id: string;
    project_name: string;
    client: string;
    progress: number;
    status: string;
    due_date: string;
  }

  const projectSummaryColumns: ColumnConfig<ProjectSummaryRow>[] = [
    {
      key: 'project_name',
      header: 'Project Name',
      sticky: true,
      width: 160,
      sortable: true,
      render: (row) => <span className="font-black text-slate-850 dark:text-slate-200">{row.project_name}</span>
    },
    {
      key: 'client',
      header: 'Client',
      sticky: true,
      width: 120,
      sortable: true,
      render: (row) => <span className="text-slate-455">{row.client}</span>
    },
    {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      render: (row) => {
        const getStatusColor = (status: string) => {
          if (status?.toLowerCase().includes('track') || status?.toLowerCase().includes('progress') || status?.toLowerCase().includes('active') || status?.toLowerCase().includes('in progress')) return 'bg-emerald-500';
          if (status?.toLowerCase().includes('risk')) return 'bg-blue-600';
          return 'bg-red-500';
        };
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
              <div className={`h-full ${getStatusColor(row.status)}`} style={{ width: `${row.progress}%` }}></div>
            </div>
            <span>{Number(row.progress).toFixed(1)}%</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const getBadgeClass = (status: string) => {
          if (status?.toLowerCase().includes('track') || status?.toLowerCase().includes('progress') || status?.toLowerCase().includes('active') || status?.toLowerCase().includes('in progress')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20';
          if (status?.toLowerCase().includes('risk')) return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20';
          return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20';
        };
        return <Badge className={`text-[9px] font-black border-0 ${getBadgeClass(row.status)}`}>{row.status}</Badge>;
      }
    },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (row) => <span className="text-slate-455">{row.due_date}</span>
    }
  ];

  return (
    <div className="space-y-4 text-left">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <KPICard title="Overdue Tasks" value={String(kpi.overdue_tasks)} growth="Action required" isPositive={false} icon={<ShieldAlert className="h-5 w-5" />} iconBg="bg-rose-50 dark:bg-rose-950/30" iconColor="text-rose-600 dark:text-rose-400" period={period} />
        <KPICard title="My Tasks" value={String(kpi.my_tasks)} growth="Assigned to me" isPositive={true} icon={<CheckSquare className="h-5 w-5" />} iconBg="bg-cyan-50 dark:bg-cyan-950/30" iconColor="text-cyan-600 dark:text-cyan-400" period={period} />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 gap-4">

        {/* My Tasks List */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">My Tasks [{myTasks.length}]</h4>
            <button onClick={() => router.push('/tasks')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {myTasks.slice(0, 5).map((task: any, idx: number) => {
              const getBadgeClass = (status: string) => {
                if (status?.toLowerCase().includes('completed')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20';
                if (status?.toLowerCase().includes('progress')) return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20';
                return 'bg-slate-50 text-slate-655 dark:bg-slate-800 dark:text-slate-400';
              };
              return (
                <div key={idx} className="flex justify-between items-center p-2 rounded-2xl border dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left">
                  <div className="space-y-1.5 max-w-[65%]">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block truncate">{task.task_name}</span>
                    <span className="text-[9px] text-slate-455 block truncate">{task.project_name} • Due: {task.due_date}</span>
                  </div>
                  <Badge className={`text-[9px] font-black border-0 ${getBadgeClass(task.status)}`}>{task.status}</Badge>
                </div>
              );
            })}
            {myTasks.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4">No tasks assigned</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-4">

        {/* Issues by Priority */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Issues by Priority</h4>
            <button onClick={() => router.push('/defect-management/defects')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            {issuePriorityCards.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-855 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">{item.label}</span>
                <span className={`text-xl font-black block ${item.color.split(' ')[1]}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Util & Upcoming Milestones & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Utilization */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Team Utilization</h4>
            <button onClick={() => router.push('/resource-master/resource-list')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View Resource Report <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex justify-center items-center h-[120px] pt-4">
            <Chart options={teamUtilGaugeOpts} series={[teamUtil.overall_utilization || 0]} type="radialBar" height={170} />
          </div>
          <div className="space-y-1.5 text-xs font-bold text-slate-655 dark:text-slate-355 mt-2">
            {(teamUtil.departments || []).map((dep: any, idx: number) => {
              const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-slate-400'];
              const color = colors[idx % colors.length];
              return (
                <div key={idx} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${color}`}></span>{dep.department}</span>
                  <span>{dep.utilization}%</span>
                </div>
              );
            })}
            {(!teamUtil.departments || teamUtil.departments.length === 0) && (
              <div className="text-xs text-slate-400 text-center py-2">No department utilization data available</div>
            )}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Upcoming Milestones</h4>
            <button onClick={() => router.push('/project/milestones')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {milestones.slice(0, 5).map((m: any, idx: number) => {
              const getBadgeClass = (status: string) => {
                if (status?.toLowerCase().includes('track') || status?.toLowerCase().includes('progress')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20';
                if (status?.toLowerCase().includes('pending')) return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20';
                return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20';
              };
              return (
                <div key={idx} className="flex justify-between items-center p-2.5 rounded-2xl border dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left">
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block truncate">{m.milestone_name}</span>
                    <span className="text-[9px] text-slate-455">{m.project_name} • {m.due_date}</span>
                  </div>
                  <Badge className={`text-[9px] font-black border-0 ${getBadgeClass(m.status)}`}>{m.status}</Badge>
                </div>
              );
            })}
            {milestones.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4">No upcoming milestones</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4">Recent Activity</h4>
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity: any, idx: number) => (
              <div key={idx} className="flex gap-3 text-left">
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                  {(activity.updated_by || 'A')[0]}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-105 block">
                    {activity.updated_by} marked "{activity.task_name}" as {activity.status}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Project: {activity.project_name} • {activity.updated_date}</span>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-4">No recent activity</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Create Task', icon: CheckSquare, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', path: '/tasks/create' },
            { label: 'Add Issue', icon: AlertTriangle, color: 'text-red-655 bg-red-50 dark:bg-red-950/30', path: '/defect-management/defects/create' },
            { label: 'Schedule Meeting', icon: Calendar, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30', path: '/marketing/leads' },
            { label: 'View Timesheet', icon: ClipboardList, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30', path: '/timesheet' },
            { label: 'Team Chat', icon: Send, color: 'text-indigo-655 bg-indigo-50 dark:bg-indigo-950/30', path: '/chats' }
          ].map((act, idx) => (
            <button key={idx} 
              onClick={() => act.path && router.push(act.path)}
              className="p-3 border dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all rounded-2xl flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${act.color} group-hover:scale-105`}>
                <act.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-355">{act.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
