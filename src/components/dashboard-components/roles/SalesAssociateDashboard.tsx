'use client';

import React, { useState } from 'react';
import {
  useDeveloperDashboardNewQuery,
  useDeveloperProjectWorkNewQuery
} from '@/service/dashboardQueries';
import {
  CheckSquare,
  CheckCircle2,
  Bug,
  Clock,
  Code2,
  TrendingUp,
  ChevronRight,
  Send,
  ClipboardList,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Chart from './Chart';
import { KPICard } from './KPICard';
import { getXAxisTitle } from './utils';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { fetchAllTasksNew } from '@/service/api/Leads/api';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function getAssignedName(item: any): string {
  if (item.Assigned_To) {
    const u = item.Assigned_To;
    const full = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return full || u.username || 'Unknown';
  }
  return item.Assigned_person || '—';
}

function getAssignedPhoto(item: any): string | undefined {
  const photo = item.Assigned_To?.User_Photo;
  if (photo && !photo.includes('pngtree-user-icon') && !photo.includes('default.png')) return photo;
  return undefined;
}

function getInitials(name: string): string {
  return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
}

function avatarBg(name: string): string {
  const palette = [
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
    'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
    'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  ];
  return palette[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}

const STATUS_STYLES: Record<string, string> = {
  'Not Started': 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  'In Progress': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400',
  Pending: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400',
  Completed: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400',
  Overdue: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400',
};

const TABS = [
  { key: 'all', label: 'All Tasks' },
  { key: 'my', label: 'My Tasks' },
  { key: 'assigned', label: 'Assigned to Me' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
];

interface DeveloperDashboardProps {
  startDate: string;
  endDate: string;
  createdBy: number;
  primaryColor: string;
  period: string;
}

export default function SalesAssociateDashboard({
  startDate,
  endDate,
  createdBy,
  primaryColor,
  period
}: DeveloperDashboardProps) {
  const router = useRouter();
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

  const [modalActiveTab, setModalActiveTab] = useState<'all' | 'my' | 'assigned' | 'overdue' | 'completed'>('all');
  const [modalPage, setModalPage] = useState(1);

  // Fetch unified tasks for the modal tab-wise
  const { data: modalTasksRes, isLoading: isModalTasksLoading } = useQuery({
    queryKey: ['modalTasks', modalActiveTab, modalPage, createdBy],
    queryFn: () => {
      const statusParam = modalActiveTab === 'overdue' ? 'overdue' : modalActiveTab === 'completed' ? 'Completed' : undefined;
      const createdByParam = modalActiveTab === 'my' ? createdBy : undefined;
      const assignedToParam = modalActiveTab === 'assigned' ? createdBy : undefined;

      return fetchAllTasksNew({
        created_by: createdByParam,
        assigned_to: assignedToParam,
        status: statusParam,
        page: modalPage
      });
    },
    enabled: isTasksModalOpen,
    staleTime: 30_000,
  });

  const modalTasks = modalTasksRes?.results || [];
  const modalTotalCount = modalTasksRes?.count || 0;
  const modalTotalPages = Math.max(1, Math.ceil(modalTotalCount / 10));

  // Developer Queries (hooks execute only when component is rendered)
  const { data: developerDashboardRes, isLoading: isDeveloperDashboardLoading } = useDeveloperDashboardNewQuery(
    createdBy,
    startDate,
    endDate,
    true
  );
  const { data: developerProjectWorkRes, isLoading: isDeveloperProjectWorkLoading } = useDeveloperProjectWorkNewQuery(
    createdBy,
    startDate,
    endDate,
    true
  );

  const developerDashboard = developerDashboardRes?.data || developerDashboardRes;
  const developerProjectWork = developerProjectWorkRes?.data || developerProjectWorkRes;

  if (isDeveloperDashboardLoading || isDeveloperProjectWorkLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-xs font-bold text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span>Loading Developer Dashboard data...</span>
      </div>
    );
  }

  const cards = developerDashboard?.dashboard_cards || {
    my_tasks: 0,
    tasks_completed: 0,
    bugs_assigned: 0,
    hours_logged: 0,
    project_progress: 0
  };

  const tasksOverview = developerDashboard?.my_tasks_overview || {
    in_progress: 0,
    to_do: 0,
    pending: 0,
    completed: 0
  };

  const taskProgressList = developerDashboard?.task_progress || [];
  const currentTasksList = developerDashboard?.my_current_tasks || [];

  const activeProjectsList = (developerProjectWork?.my_active_projects || []).filter((p: any) => p.project_name);
  const bugsList = developerProjectWork?.my_bugs || [];
  const timelog = developerProjectWork?.my_timelog || {
    development: 0,
    testing: 0,
    review: 0,
    others: 0
  };

  const totalTasks = (tasksOverview.in_progress || 0) + (tasksOverview.to_do || 0) + (tasksOverview.pending || 0) + (tasksOverview.completed || 0);

  const myTasksOverviewOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['In Progress', 'To Do', 'Review', 'Completed'],
    colors: ['#0565FD', '#F59E0B', '#8B5CF6', '#10B981'],
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
              label: 'Total',
              formatter: () => String(totalTasks),
              style: { fontSize: '13px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => String(totalTasks)
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const taskProgressCategories = taskProgressList.map((d: any) => {
    if (!d.date) return '';
    const parts = d.date.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[parseInt(parts[1], 10) - 1] || '';
      return `${month} ${parts[2]}`;
    }
    return d.date;
  });
  const taskProgressSeriesData = taskProgressList.map((d: any) => Number(d.task_count || 0));
  const totalCompletedTasksThisWeek = taskProgressSeriesData.reduce((a: number, b: number) => a + b, 0);

  const taskProgressOpts = {
    chart: { type: 'area' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 3, curve: 'smooth' as const },
    colors: [primaryColor],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [50, 100]
      }
    },
    xaxis: {
      categories: taskProgressCategories.length > 0 ? taskProgressCategories : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: getXAxisTitle(taskProgressCategories.length > 0 ? taskProgressCategories : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], period),
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    yaxis: {
      tickAmount: 4,
      labels: { formatter: (v: number) => Math.round(v).toString() },
      title: {
        text: 'Tasks Completed',
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  const codeCommitActivityOpts = {
    chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '45%',
      }
    },
    colors: ['#0565FD'],
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: getXAxisTitle(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], period),
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    yaxis: {
      tickAmount: 4,
      labels: { formatter: (v: number) => Math.round(v).toString() },
      title: {
        text: 'Commits',
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  const totalHours = (timelog.development || 0) + (timelog.testing || 0) + (timelog.review || 0) + (timelog.others || 0);
  const myTimelogOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['Development', 'Testing', 'Review', 'Others'],
    colors: ['#0565FD', '#10B981', '#F59E0B', '#8B5CF6'],
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
              label: 'Total Hours',
              formatter: () => String(totalHours.toFixed(1)),
              style: { fontSize: '11px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => `${totalHours.toFixed(1)}`
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const openBugsCount = bugsList.filter((b: any) => {
    const s = (b.status || '').toLowerCase();
    return s === 'new' || s === 'open' || s === 'in progress' || s === 'in_progress';
  }).length;
  const resolvedBugsCount = bugsList.filter((b: any) => {
    const s = (b.status || '').toLowerCase();
    return s === 'resolved' || s === 'closed' || s === 'complete' || s === 'completed';
  }).length;

  return (
    <div className="space-y-4 text-left">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <KPICard title="My Tasks" value={String(cards.my_tasks)} growth={`${tasksOverview.in_progress || 0} Progress | ${tasksOverview.to_do || 0} To Do`} isPositive={true} icon={<CheckSquare className="h-5 w-5" />} iconBg="bg-blue-50 dark:bg-blue-950/30" iconColor="text-blue-600 dark:text-blue-400" period={period} />
        <KPICard title="Tasks Completed" value={String(cards.tasks_completed)} growth="Total Completed" isPositive={true} icon={<CheckCircle2 className="h-5 w-5" />} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" period={period} />
        <KPICard title="Bugs Assigned" value={String(cards.bugs_assigned)} growth={`${openBugsCount} Open | ${resolvedBugsCount} Resolved`} isPositive={false} icon={<Bug className="h-5 w-5" />} iconBg="bg-orange-50 dark:bg-orange-950/30" iconColor="text-orange-600 dark:text-orange-400" period={period} />
        <KPICard title="Hours Logged" value={`${cards.hours_logged || 0} hrs`} growth="Total Hours Logged" isPositive={true} icon={<Clock className="h-5 w-5" />} iconBg="bg-purple-50 dark:bg-purple-950/30" iconColor="text-purple-600 dark:text-purple-400" period={period} />

      </div>

      {/* Row 2: Charts and current tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Tasks Overview */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">My Tasks Overview</h4>
            <button onClick={() => setIsTasksModalOpen(true)} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All Tasks <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center justify-center py-2">
            <Chart options={myTasksOverviewOpts} series={[tasksOverview.in_progress || 0, tasksOverview.to_do || 0, tasksOverview.pending || 0, tasksOverview.completed || 0]} type="donut" height={200} width={240} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600"></span>In Progress ({totalTasks > 0 ? Math.round((tasksOverview.in_progress || 0) / totalTasks * 100) : 0}%)</span>
              <span>{tasksOverview.in_progress || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span>To Do ({totalTasks > 0 ? Math.round((tasksOverview.to_do || 0) / totalTasks * 100) : 0}%)</span>
              <span>{tasksOverview.to_do || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500"></span>Review ({totalTasks > 0 ? Math.round((tasksOverview.pending || 0) / totalTasks * 100) : 0}%)</span>
              <span>{tasksOverview.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Completed ({totalTasks > 0 ? Math.round((tasksOverview.completed || 0) / totalTasks * 100) : 0}%)</span>
              <span>{tasksOverview.completed || 0}</span>
            </div>
          </div>
        </div>

        {/* Task Progress Area Chart */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Task Progress</h4>
              <p className="text-[10px] text-slate-455 mt-0.5">{totalCompletedTasksThisWeek} Tasks completed this week</p>
            </div>
            <Badge className="bg-blue-50 text-blue-700 border-0 dark:bg-blue-955/20">This Week</Badge>
          </div>
          <Chart options={taskProgressOpts} series={[{ name: 'Tasks Completed', data: taskProgressSeriesData.length > 0 ? taskProgressSeriesData : [0, 0, 0, 0, 0, 0, 0] }]} type="area" height={220} />
        </div>

        {/* My Current Tasks */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">My Current Tasks</h4>
            <button onClick={() => router.push('/tasks')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {currentTasksList.slice(0, 5).map((task: any, idx: number) => {
              const getStatusBadgeClass = (status: string) => {
                const s = (status || '').toLowerCase();
                if (s.includes('progress')) return 'bg-blue-50 text-blue-700 dark:bg-blue-955/20';
                if (s.includes('review') || s.includes('pending')) return 'bg-purple-50 text-purple-700 dark:bg-purple-955/20';
                if (s.includes('completed') || s.includes('done')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20';
                return 'bg-slate-50 text-slate-650 dark:bg-slate-850';
              };
              const formattedDate = task.end_date ? new Date(task.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A';
              return (
                <div key={idx} className="flex justify-between items-center p-2 rounded-2xl border dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all text-left">
                  <div className="space-y-1.5 max-w-[65%]">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block truncate" title={task.task_name}>{task.task_name}</span>
                    <span className="text-[9px] text-slate-400 block truncate">Due: {formattedDate}</span>
                  </div>
                  <Badge className={`text-[9px] font-black border-0 ${getStatusBadgeClass(task.status)}`}>{task.status || 'New'}</Badge>
                </div>
              );
            })}
            {currentTasksList.length === 0 && (
              <div className="text-xs text-slate-455 text-center py-4">No current tasks assigned</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Timelog */}
      <div className="grid grid-cols-1 gap-4">


        {/* My Timelog (This Week) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">My Timelog (This Week)</h4>
            <button onClick={() => router.push('/project/estimations')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View Timesheet <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center justify-center py-2">
            <Chart options={myTimelogOpts} series={[timelog.development || 0, timelog.testing || 0, timelog.review || 0, timelog.others || 0]} type="donut" height={180} width={220} />
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2 text-[10px] font-bold">
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600"></span>Dev ({totalHours > 0 ? Math.round((timelog.development || 0) / totalHours * 100) : 0}%)</span>
              <span>{(timelog.development || 0).toFixed(1)} hrs</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Testing ({totalHours > 0 ? Math.round((timelog.testing || 0) / totalHours * 100) : 0}%)</span>
              <span>{(timelog.testing || 0).toFixed(1)} hrs</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span>Review ({totalHours > 0 ? Math.round((timelog.review || 0) / totalHours * 100) : 0}%)</span>
              <span>{(timelog.review || 0).toFixed(1)} hrs</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500"></span>Others ({totalHours > 0 ? Math.round((timelog.others || 0) / totalHours * 100) : 0}%)</span>
              <span>{(timelog.others || 0).toFixed(1)} hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Bugs, Activities, Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Bugs Table */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">My Bugs</h4>
            <button onClick={() => router.push('/defect-management/defects')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-2.5">Bug ID</th>
                  <th className="py-2.5">Title</th>
                  <th className="py-2.5">Project</th>
                  <th className="py-2.5">Priority</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-855 font-bold">
                {bugsList.slice(0, 5).map((row: any, idx: number) => {
                  const getPriorityBadgeClass = (prio: string) => {
                    const p = (prio || '').toLowerCase();
                    if (p.includes('critical') || p.includes('p0')) return 'bg-red-50 text-red-700 dark:bg-red-950/20';
                    if (p.includes('high') || p.includes('p1')) return 'bg-orange-50 text-orange-700 dark:bg-orange-950/20';
                    if (p.includes('medium') || p.includes('p2')) return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20';
                    return 'bg-slate-50 text-slate-650 dark:bg-slate-855';
                  };
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-3 font-black text-slate-855 dark:text-slate-200">{row.defect_id}</td>
                      <td className="py-3 text-slate-800 dark:text-slate-100">{row.defect_name}</td>
                      <td className="py-3 text-slate-455">{row.project_name || 'N/A'}</td>
                      <td className="py-3"><Badge className={`text-[9px] font-black border-0 ${getPriorityBadgeClass(row.priority)}`}>{row.priority || 'Medium'}</Badge></td>
                      <td className="py-3"><Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-0">{row.status || 'New'}</Badge></td>
                    </tr>
                  );
                })}
                {bugsList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-slate-400 text-xs">No bugs assigned</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Create Task', icon: CheckSquare, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', path: '/tasks/create' },
              { label: 'Team Chat', icon: Send, color: 'text-indigo-655 bg-indigo-50 dark:bg-indigo-950/30', path: '/chats' },
              { label: 'Report Bug', icon: Bug, color: 'text-red-655 bg-red-50 dark:bg-red-955/30', path: '/defect-management/defects/create' },
              { label: 'View Timesheet', icon: ClipboardList, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30', path: '/timesheet' }
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={() => act.path && router.push(act.path)}
                className="p-3 border dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all rounded-2xl flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
              >
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${act.color} group-hover:scale-105`}>
                  <act.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-355">{act.label}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
      {/* All Tasks Modal */}
      <Dialog open={isTasksModalOpen} onOpenChange={setIsTasksModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 border-slate-100 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 text-left">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base font-extrabold text-slate-800 dark:text-slate-105">All Tasks</DialogTitle>
          </DialogHeader>

          {/* Modal Tabs */}
          <div className="flex items-center gap-5 border-b dark:border-slate-800 overflow-x-auto mb-4">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setModalActiveTab(tab.key as any); setModalPage(1); }}
                className={cn(
                  'py-2.5 text-xs font-bold transition-all relative whitespace-nowrap cursor-pointer border-b-2',
                  modalActiveTab === tab.key ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isModalTasksLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs font-bold text-slate-400 gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span>Loading tasks...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                      <th className="py-2.5 text-left">Task Name</th>
                      <th className="py-2.5 text-left">Assigned To</th>
                      <th className="py-2.5 text-left">Progress</th>
                      <th className="py-2.5 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-855 font-bold">
                    {modalTasks.map((row: any, idx: number) => {
                      const completion = Math.min(parseInt(row.Completion || '0') || 0, 100);
                      const progressColor = completion >= 75 ? 'bg-emerald-500' : completion >= 40 ? 'bg-blue-600' : 'bg-amber-500';
                      const aName = getAssignedName(row);
                      const aPhoto = getAssignedPhoto(row);

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                          <td className="py-3 text-left">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[280px]">
                                {row.TaskName || '(Untitled)'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">{row.Task_Id || '—'}</span>
                            </div>
                          </td>
                          <td className="py-3 text-left">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6.5 w-6.5 border shadow-2xs">
                                {aPhoto && <AvatarImage src={aPhoto} />}
                                <AvatarFallback className={cn('font-bold text-[10px]', avatarBg(aName))}>
                                  {getInitials(aName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-semibold text-slate-700 dark:text-slate-355 truncate max-w-[120px]">
                                {aName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 min-w-[120px] text-left">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-400 font-semibold">{completion}%</span>
                              <div className="h-1.5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${progressColor} rounded-full transition-all`} style={{ width: `${completion}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-left">
                            <Badge className={`text-[9px] font-black border-0 ${STATUS_STYLES[row.Status] || STATUS_STYLES.Pending}`}>
                              {row.Status || 'Pending'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {modalTasks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 text-xs">No tasks found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {modalTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-slate-800">
                  <span className="text-xs text-slate-400">
                    Page {modalPage} of {modalTotalPages} ({modalTotalCount} tasks)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={modalPage === 1}
                      onClick={() => setModalPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border dark:border-slate-800 text-xs font-bold disabled:opacity-50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
                    >
                      Previous
                    </button>
                    <button
                      disabled={modalPage === modalTotalPages}
                      onClick={() => setModalPage(p => Math.min(modalTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border dark:border-slate-800 text-xs font-bold disabled:opacity-50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
