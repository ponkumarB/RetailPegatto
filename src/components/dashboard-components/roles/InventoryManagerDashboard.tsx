'use client';

import React from 'react';
import {
  useTestCaseDashboardNewQuery,
  useDefectDashboardNewQuery
} from '@/service/dashboardQueries';
import {
  Briefcase,
  ClipboardList,
  Play,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import Chart from './Chart';
import { KPICard } from './KPICard';
import { getXAxisTitle } from './utils';

interface TestLeadDashboardProps {
  startDate: string;
  endDate: string;
  createdBy: number;
  primaryColor: string;
  period: string;
}

export default function InventoryManagerDashboard({
  startDate,
  endDate,
  createdBy,
  primaryColor,
  period
}: TestLeadDashboardProps) {
  const router = useRouter();

  // Test Lead Queries (hooks execute only when component is rendered)
  const { data: testCaseDashboardRes, isLoading: isTestCaseDashboardLoading } = useTestCaseDashboardNewQuery(
    createdBy,
    startDate,
    endDate,
    true
  );
  const { data: defectDashboardRes, isLoading: isDefectDashboardLoading } = useDefectDashboardNewQuery(
    createdBy,
    startDate,
    endDate,
    true
  );

  const testCaseDashboard = testCaseDashboardRes?.data || testCaseDashboardRes;
  const defectDashboard = defectDashboardRes?.data || defectDashboardRes;

  if (isTestCaseDashboardLoading || isDefectDashboardLoading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center text-xs font-bold text-slate-400 gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span>Loading Test Lead Dashboard data...</span>
      </div>
    );
  }

  const testCards = testCaseDashboard?.dashboard_cards || {
    total_projects: 0,
    total_test_cases: 0,
    test_cases_executed: 0,
    execution_progress: 0
  };

  const defectCards = defectDashboard?.dashboard_cards || {
    total_defects: 0,
    closed_defects: 0,
    open_defects: 0
  };

  const testExecution = testCaseDashboard?.test_execution_progress || {
    passed: { count: 0, percentage: 0 },
    failed: { count: 0, percentage: 0 },
    approved: { count: 0, percentage: 0 },
    draft: { count: 0, percentage: 0 }
  };

  const trend = testCaseDashboard?.execution_trend || [];
  const trendDates = trend.map((t: any) => t.date);
  const trendExecuted = trend.map((t: any) => t.executed);

  const testCaseStatusData = testCaseDashboard?.test_case_status || {
    total_test_cases: 0,
    approved: 0,
    draft: 0,
    passed: 0,
    failed: 0,
    sent_for_review: 0
  };

  const recentTestRuns = testCaseDashboard?.recent_test_runs || [];
  const topTesters = testCaseDashboard?.top_testers || [];

  const defectSummary = defectDashboard?.defect_summary || {
    open: 0,
    closed: 0,
    in_progress: 0,
    resolved: 0
  };

  const defectsPriority = defectDashboard?.defects_by_priority || {
    high: 0,
    medium: 0,
    low: 0,
    critical: 0
  };

  const testExecutionProgressOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['Passed', 'Failed', 'Approved', 'Draft'],
    colors: ['#10B981', '#EF4444', '#0565FD', '#94A3B8'],
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
              label: 'Executed',
              formatter: () => String(testCards.test_cases_executed),
              style: { fontSize: '13px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => String(testCards.test_cases_executed)
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const executionTrendOpts = {
    chart: { type: 'line' as const, toolbar: { show: false }, fontFamily: 'Inter' },
    stroke: { width: 3, curve: 'smooth' as const },
    colors: [primaryColor],
    xaxis: {
      categories: trendDates.length > 0 ? trendDates : ['No Data'],
      axisBorder: { show: false },
      axisTicks: { show: false },
      title: {
        text: getXAxisTitle(trendDates, period),
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    yaxis: {
      labels: { formatter: (v: number) => Math.round(v).toString() },
      title: {
        text: 'Executed Count',
        style: { color: '#94A3B8', fontSize: '10px', fontWeight: 600, fontFamily: 'Inter' }
      }
    },
    grid: { borderColor: '#F1F5F9', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    legend: { show: false }
  };

  const totalDefects = defectSummary.open + defectSummary.closed + defectSummary.in_progress + defectSummary.resolved;

  const defectsSummaryOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
    colors: ['#EF4444', '#0565FD', '#10B981', '#94A3B8'],
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
              label: 'Total Defects',
              formatter: () => String(totalDefects),
              style: { fontSize: '13px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => String(totalDefects)
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const priorityTotal = defectsPriority.high + defectsPriority.medium + defectsPriority.low + defectsPriority.critical;

  const defectsPriorityOpts = {
    chart: { type: 'donut' as const, fontFamily: 'Inter' },
    labels: ['High', 'Medium', 'Low', 'Critical'],
    colors: ['#EF4444', '#F59E0B', '#10B981', '#7F1D1D'],
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
              label: 'Total Defects',
              formatter: () => String(priorityTotal),
              style: { fontSize: '13px', fontWeight: 600, color: '#94A3B8' }
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 800,
              color: '#1E293B',
              formatter: () => String(priorityTotal)
            }
          }
        }
      }
    },
    stroke: { show: false }
  };

  const getTestExecutionProgressPercentage = (val: number) => {
    const total = testExecution.passed.count + testExecution.failed.count + testExecution.approved.count + testExecution.draft.count;
    if (total === 0) return '0%';
    return `${Math.round((val / total) * 100)}%`;
  };

  const getDefectSummaryPercentage = (val: number) => {
    if (totalDefects === 0) return '0%';
    return `${Math.round((val / totalDefects) * 100)}%`;
  };

  const getDefectsPriorityPercentage = (val: number) => {
    if (priorityTotal === 0) return '0%';
    return `${Math.round((val / priorityTotal) * 100)}%`;
  };

  return (
    <div className="space-y-4 text-left">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">

        <KPICard title="Test Cases" value={String(testCards.total_test_cases)} growth="Designed test cases" isPositive={true} icon={<ClipboardList className="h-5 w-5" />} iconBg="bg-emerald-50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:emerald-400" period={period} />
        <KPICard title="Cases Executed" value={String(testCards.test_cases_executed)} growth="Runs triggered" isPositive={true} icon={<Play className="h-5 w-5" />} iconBg="bg-purple-50 dark:bg-purple-950/30" iconColor="text-purple-600 dark:text-purple-400" period={period} />
        <KPICard title="Defects Logged" value={String(defectCards.total_defects)} growth="Total issues identified" isPositive={false} icon={<AlertTriangle className="h-5 w-5" />} iconBg="bg-rose-50 dark:bg-rose-950/30" iconColor="text-rose-600 dark:text-rose-400" period={period} />
        <KPICard title="Defects Closed" value={String(defectCards.closed_defects)} growth="Resolved & verified" isPositive={true} icon={<CheckCircle2 className="h-5 w-5" />} iconBg="bg-cyan-50 dark:bg-cyan-950/30" iconColor="text-cyan-600 dark:text-cyan-400" period={period} />
        <KPICard title="Execution Progress" value={`${testCards.execution_progress}%`} growth="Completion rate" isPositive={true} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-pink-50 dark:bg-pink-950/30" iconColor="text-pink-655 dark:text-pink-400" period={period} />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Test Execution Progress */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Test Execution Progress</h4>
            <button onClick={() => router.push('/project/test-plan')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View Execution Report <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center justify-center py-2">
            <Chart options={testExecutionProgressOpts} series={[testExecution.passed.count, testExecution.failed.count, testExecution.approved.count, testExecution.draft.count]} type="donut" height={200} width={240} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Passed ({getTestExecutionProgressPercentage(testExecution.passed.count)})</span>
              <span>{testExecution.passed.count}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"></span>Failed ({getTestExecutionProgressPercentage(testExecution.failed.count)})</span>
              <span>{testExecution.failed.count}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600"></span>Approved ({getTestExecutionProgressPercentage(testExecution.approved.count)})</span>
              <span>{testExecution.approved.count}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-400"></span>Draft ({getTestExecutionProgressPercentage(testExecution.draft.count)})</span>
              <span>{testExecution.draft.count}</span>
            </div>
          </div>
        </div>

        {/* Execution Trend Line Chart */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Execution Trend</h4>
              <p className="text-[10px] text-slate-455 mt-0.5">QA executions logged dynamically</p>
            </div>
            <button onClick={() => router.push('/analytics')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View Trend Report <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <Chart options={executionTrendOpts} series={[{ name: 'Executed Count', data: trendExecuted.length > 0 ? trendExecuted : [0] }]} type="line" height={220} />
        </div>

        {/* Defects Summary Donut */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Defects Summary</h4>
            <button onClick={() => router.push('/defect-management/defects')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View Defects <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center justify-center py-2">
            <Chart options={defectsSummaryOpts} series={[defectSummary.open, defectSummary.in_progress, defectSummary.resolved, defectSummary.closed]} type="donut" height={200} width={240} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 flex justify-between">
              <span className="text-slate-500">Open ({getDefectSummaryPercentage(defectSummary.open)})</span>
              <span className="text-red-500">{defectSummary.open}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-855 flex justify-between">
              <span className="text-slate-500">In Progress ({getDefectSummaryPercentage(defectSummary.in_progress)})</span>
              <span className="text-blue-650">{defectSummary.in_progress}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 flex justify-between">
              <span className="text-slate-500">Resolved ({getDefectSummaryPercentage(defectSummary.resolved)})</span>
              <span className="text-emerald-500">{defectSummary.resolved}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 flex justify-between">
              <span className="text-slate-500">Closed ({getDefectSummaryPercentage(defectSummary.closed)})</span>
              <span className="text-slate-400">{defectSummary.closed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Test Runs Table */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Recent Test Runs</h4>
            <button onClick={() => router.push('/project/test-case')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All Test Runs <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="py-2.5">Test Case ID</th>

                  <th className="py-2.5">Module</th>
                  <th className="py-2.5">Executed By</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Priority</th>
                  <th className="py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-bold">
                {recentTestRuns.slice(0, 5).map((row: any, idx: number) => {
                  const getBadgeClass = (status: string) => {
                    const s = status?.toLowerCase() || '';
                    if (s.includes('approved') || s.includes('passed')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20';
                    if (s.includes('draft') || s.includes('review')) return 'bg-blue-50 text-blue-700 dark:bg-blue-955/20';
                    return 'bg-rose-50 text-rose-750 dark:bg-rose-950/20';
                  };
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-3 font-black text-slate-855 dark:text-slate-200">{row.testcase_id}</td>

                      <td className="py-3">{row.module_name || 'N/A'}</td>
                      <td className="py-3 text-slate-455">{row.executed_by}</td>
                      <td className="py-3"><Badge className={`text-[9px] font-black border-0 ${getBadgeClass(row.status)}`}>{row.status}</Badge></td>
                      <td className="py-3">{row.priority || 'Normal'}</td>
                      <td className="py-3 text-slate-455">{row.created_date}</td>
                    </tr>
                  );
                })}
                {recentTestRuns.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-slate-400 text-xs">No test runs executed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Defects by Priority Donut */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Defects by Priority</h4>
            <button onClick={() => router.push('/defect-management/defects')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All Defects <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center justify-center py-2">
            <Chart options={defectsPriorityOpts} series={[defectsPriority.high, defectsPriority.medium, defectsPriority.low, defectsPriority.critical]} type="donut" height={200} width={240} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-bold">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"></span>High ({getDefectsPriorityPercentage(defectsPriority.high)})</span>
              <span>{defectsPriority.high}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"></span>Medium ({getDefectsPriorityPercentage(defectsPriority.medium)})</span>
              <span>{defectsPriority.medium}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>Low ({getDefectsPriorityPercentage(defectsPriority.low)})</span>
              <span>{defectsPriority.low}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-855">
              <span className="text-slate-500 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-950"></span>Critical ({getDefectsPriorityPercentage(defectsPriority.critical)})</span>
              <span>{defectsPriority.critical}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Testers, Test Case Status & Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Testers */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Top Testers by Execution</h4>
            <button onClick={() => router.push('/resource-master/resource-list')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View Team Performance <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-4">
            {topTesters.slice(0, 5).map((tester: any, idx: number) => {
              const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500'];
              const color = colors[idx % colors.length];
              return (
                <div key={idx} className="space-y-1 text-left text-xs font-bold">
                  <div className="flex justify-between items-center text-slate-755 dark:text-slate-250">
                    <span>{tester.tester}</span>
                    <span className="text-[10px] text-slate-455">{tester.test_cases_executed} Run | {tester.pass_percentage}% Pass</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${tester.pass_percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
            {topTesters.length === 0 && (
              <div className="text-xs text-slate-455 text-center py-4">No tester data available</div>
            )}
          </div>
        </div>

        {/* Test Case Status Bar List */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4">Test Case Status</h4>
          <div className="space-y-4">
            {[
              { label: 'Total Test Cases', value: String(testCaseStatusData.total_test_cases), pct: 100, color: 'bg-blue-600' },
              { label: 'Approved', value: String(testCaseStatusData.approved), pct: testCaseStatusData.total_test_cases > 0 ? Math.round((testCaseStatusData.approved / testCaseStatusData.total_test_cases) * 100) : 0, color: 'bg-emerald-500' },
              { label: 'Draft', value: String(testCaseStatusData.draft), pct: testCaseStatusData.total_test_cases > 0 ? Math.round((testCaseStatusData.draft / testCaseStatusData.total_test_cases) * 100) : 0, color: 'bg-indigo-500' },
              { label: 'Passed', value: String(testCaseStatusData.passed), pct: testCaseStatusData.total_test_cases > 0 ? Math.round((testCaseStatusData.passed / testCaseStatusData.total_test_cases) * 100) : 0, color: 'bg-teal-500' },
              { label: 'Failed', value: String(testCaseStatusData.failed), pct: testCaseStatusData.total_test_cases > 0 ? Math.round((testCaseStatusData.failed / testCaseStatusData.total_test_cases) * 100) : 0, color: 'bg-red-500' },
              { label: 'Sent For Review', value: String(testCaseStatusData.sent_for_review), pct: testCaseStatusData.total_test_cases > 0 ? Math.round((testCaseStatusData.sent_for_review / testCaseStatusData.total_test_cases) * 100) : 0, color: 'bg-purple-500' }
            ].map((status, idx) => (
              <div key={idx} className="space-y-1 text-left text-xs font-bold">
                <div className="flex justify-between items-center text-slate-755 dark:text-slate-250">
                  <span>{status.label}</span>
                  <span>{status.value} ({status.pct}%)</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${status.color} rounded-full`} style={{ width: `${status.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Activities */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Upcoming Activities</h4>
            <button onClick={() => router.push('/tasks')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 hover:underline">
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-xs text-slate-455 text-center py-4">No upcoming activities found</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Create Test Case', icon: ClipboardList, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', path: '/project/test-case/create' },
            { label: 'Create Test Run', icon: Play, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30', path: '/project/test-plan/create' },
            { label: 'Log Defect', icon: AlertTriangle, color: 'text-red-650 bg-red-50 dark:bg-red-950/30', path: '/defect-management/defects/create' },
            { label: 'View Defects', icon: BarChart3, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30', path: '/defect-management/defects' }
          ].map((act, idx) => (
            <button 
              key={idx} 
              onClick={() => router.push(act.path)}
              className="p-4 border dark:border-slate-855 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-all rounded-2xl flex flex-col items-center justify-center gap-2 text-center group cursor-pointer"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${act.color} group-hover:scale-105`}>
                <act.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{act.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
