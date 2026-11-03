'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Shield, Key, Lock, Users, Monitor, ArrowUpRight, ArrowDownRight,
  MoreVertical, ShieldAlert, AlertTriangle, CheckCircle, HelpCircle,
  Eye, Settings, FileText, ChevronRight, ChevronDown, X, ToggleLeft, ToggleRight, Check
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

// Dynamically import ApexCharts to avoid SSR errors in Next.js
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
        style={{ height: props.height || '150px' }}
      >
        Loading chart...
      </div>
    );
  }
  return <ApexChart {...props} />;
}

export default function AuthenticationConfigPage() {
  const router = useRouter();

  // Authentication Methods list
  const [methods, setMethods] = useState([
    { id: 1, name: 'Password', desc: 'Standard email & password authentication', status: 'Enabled', enforcedFor: 'All Users', usage: '1,248 (100%)' },
    { id: 2, name: 'MFA - Authenticator App', desc: 'Time-based one-time password (TOTP)', status: 'Enabled', enforcedFor: 'All Users', usage: '512 (41.0%)' },
    { id: 3, name: 'MFA - Email OTP', desc: 'One-time password via email', status: 'Enabled', enforcedFor: 'All Users', usage: '184 (14.7%)' },
    { id: 4, name: 'MFA - SMS OTP', desc: 'One-time password via SMS', status: 'Enabled', enforcedFor: 'All Users', usage: '88 (7.1%)' },
    { id: 5, name: 'SSO (SAML / OAuth)', desc: 'Single Sign-On using SAML / OAuth', status: 'Enabled', enforcedFor: 'All Users', usage: '28 (2.3%)' },
    { id: 6, name: 'Backup Codes', desc: 'Recovery codes for account access', status: 'Enabled', enforcedFor: 'All Users', usage: '96 (7.7%)' }
  ]);

  // Edit Modal State
  const [editMethod, setEditMethod] = useState<any | null>(null);
  const [modalStatus, setModalStatus] = useState('Enabled');
  const [modalEnforced, setModalEnforced] = useState('All Users');

  const openConfig = (method: any) => {
    setEditMethod(method);
    setModalStatus(method.status);
    setModalEnforced(method.enforcedFor);
  };

  const saveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = methods.map(m => {
      if (m.id === editMethod.id) {
        return { ...m, status: modalStatus, enforcedFor: modalEnforced };
      }
      return m;
    });
    setMethods(updated);
    toast.success(`Configuration for ${editMethod.name} updated successfully!`);
    setEditMethod(null);
  };

  // Sign-in Activity Chart Config (Successful vs Failed Logins)
  const activitySeries = [
    {
      name: 'Successful Logins',
      data: [102, 98, 115, 99, 105, 120, 110]
    },
    {
      name: 'Failed Logins',
      data: [25, 20, 22, 28, 24, 21, 26]
    }
  ];

  const activityOptions = {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif'
    },
    stroke: {
      curve: 'smooth' as const,
      width: [3, 2],
      dashArray: [0, 5],
      colors: ['#3b82f6', '#ef4444']
    },
    colors: ['#3b82f6', '#ef4444'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: [0.25, 0.05],
        opacityTo: [0.01, 0.01],
        stops: [0, 100]
      }
    },
    markers: {
      size: [4, 4],
      colors: ['#ffffff', '#ffffff'],
      strokeColors: ['#3b82f6', '#ef4444'],
      strokeWidth: 2,
      hover: { size: 6 }
    },
    xaxis: {
      categories: ['Apr 16', 'Apr 21', 'Apr 26', 'May 01', 'May 06', 'May 11', 'May 15'],
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      max: 200,
      tickAmount: 4,
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontWeight: 500 } }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      shared: true,
      intersect: false
    }
  };

  // Auth Methods Usage Donut
  const usageLabels = ['Password Only', 'MFA - Authenticator App', 'MFA - Email OTP', 'MFA - SMS OTP', 'SSO (SAML / OAuth)'];
  const usageSeries = [436, 512, 184, 88, 28];
  const usageColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];

  const usageDonutOptions = {
    chart: { type: 'donut' as const, fontFamily: 'Inter, sans-serif' },
    labels: usageLabels,
    colors: usageColors,
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
              label: 'Total Logins',
              formatter: () => '1,248',
              style: { fontSize: '11px', fontWeight: 600, color: '#94a3b8' }
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => '1,248'
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  // MFA Adoption Donut
  const mfaSeries = [812, 436];
  const mfaColors = ['#10b981', '#3b82f6'];
  const mfaLabels = ['MFA Enabled', 'MFA Not Enabled'];

  const mfaDonutOptions = {
    chart: { type: 'donut' as const, fontFamily: 'Inter, sans-serif' },
    labels: mfaLabels,
    colors: mfaColors,
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
              label: 'MFA Enabled',
              formatter: () => '65.1%',
              style: { fontSize: '10px', fontWeight: 600, color: '#94a3b8' }
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => '65.1%'
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  const getMethodStatusBadge = (status: string) => {
    switch (status) {
      case 'Enabled':
        return <Badge className="bg-emerald-50 text-emerald-705 border-emerald-200 font-bold text-[10px]">Enabled</Badge>;
      case 'Disabled':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-250 font-bold text-[10px]">Disabled</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border-slate-200 font-bold text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Authentication
            <Shield className="h-5 w-5 text-blue-600" />
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Manage authentication settings, multi-factor authentication, and sign-in security.
          </p>
        </div>
        
        <Button
          onClick={() => toast.info('Authentication settings are optimized.')}
          className="text-white font-extrabold gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2.5 cursor-pointer shadow-sm shadow-blue-500/10 flex items-center shrink-0 w-fit"
        >
          <Settings className="h-4 w-4" /> Authentication Settings
          <ChevronDown className="h-3.5 w-3.5 border-l border-blue-500/50 pl-1 ml-0.5" />
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Total Users</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-full text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">1,248</h3>
            <button className="text-[10px] text-blue-650 font-bold hover:underline block mt-1.5 text-left">View all users →</button>
          </div>
        </div>

        {/* MFA Enabled Users */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">MFA Enabled Users</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">812 <span className="text-xs font-semibold text-slate-400">(65.1%)</span></h3>
            <button className="text-[10px] text-emerald-650 font-bold hover:underline block mt-1.5 text-left">View details →</button>
          </div>
        </div>

        {/* MFA Enforced Users */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">MFA Enforced Users</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-full text-purple-600">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">642 <span className="text-xs font-semibold text-slate-400">(51.4%)</span></h3>
            <button className="text-[10px] text-purple-650 font-bold hover:underline block mt-1.5 text-left">View policy →</button>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Active Sessions</span>
            <div className="p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-full text-cyan-600">
              <Monitor className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">156</h3>
            <button className="text-[10px] text-cyan-600 font-bold hover:underline block mt-1.5 text-left">View sessions →</button>
          </div>
        </div>

        {/* Failed Logins (30 Days) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Failed Logins (30 Days)</span>
            <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-full text-red-650">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">128</h3>
            <button className="text-[10px] text-red-650 font-bold hover:underline block mt-1.5 text-left">View reports →</button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main Charts & Tables Panel */}
        <div className="xl:col-span-3 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sign-in Activity */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Sign-in Activity (Last 30 Days)</h3>
              <div className="h-[180px] w-full">
                <Chart options={activityOptions} series={activitySeries} type="area" height="170px" />
              </div>
            </div>

            {/* Authentication Methods Usage */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Authentication Methods Usage</h3>
              <div className="flex flex-col items-center justify-between gap-3 flex-1">
                <div className="relative h-[110px] w-[110px] shrink-0">
                  <Chart options={usageDonutOptions} series={usageSeries} type="donut" height="110px" />
                </div>
                <div className="space-y-1 text-[9.5px] font-bold w-full pt-1.5 border-t dark:border-slate-800">
                  {usageLabels.slice(0, 4).map((label, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: usageColors[idx] }}></span>
                        <span className="truncate">{label}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 shrink-0 ml-1">
                        {usageSeries[idx]} <span className="text-[8.5px] text-slate-400 font-medium">({(usageSeries[idx] / 1248 * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Authentication Methods Table */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 text-left">Authentication Methods</h3>
            <p className="text-[10px] text-slate-450 mt-1 mb-4 text-left">Manage authentication methods and their availability for users.</p>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="pb-3 pt-1">Method</th>
                    <th className="pb-3 pt-1">Description</th>
                    <th className="pb-3 pt-1">Status</th>
                    <th className="pb-3 pt-1">Enforced For</th>
                    <th className="pb-3 pt-1">Usage</th>
                    <th className="pb-3 pt-1 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-855 font-bold">
                  {methods.map((method) => (
                    <tr key={method.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-3 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-955/20 text-blue-650 flex items-center justify-center shrink-0">
                          <Key className="h-4 w-4" />
                        </div>
                        <span className="text-slate-855 dark:text-slate-200 block text-xs font-bold">{method.name}</span>
                      </td>
                      <td className="py-3 text-slate-550 dark:text-slate-400 font-medium text-xs max-w-[220px] truncate">
                        {method.desc}
                      </td>
                      <td className="py-3">
                        {getMethodStatusBadge(method.status)}
                      </td>
                      <td className="py-3 text-slate-655 dark:text-slate-355 text-xs font-medium">
                        {method.enforcedFor}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300 text-xs">
                        {method.usage}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => openConfig(method)}
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-100 text-slate-700 font-bold hover:bg-slate-50 text-[10.5px] py-1 cursor-pointer shrink-0"
                          >
                            Configure
                          </Button>
                          <button className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Side-by-Side Tables (Recent Logins & Active Sessions) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recent Login Attempts */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Recent Login Attempts</h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                      <th className="pb-2.5">User</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">IP Address</th>
                      <th className="pb-2.5">Device</th>
                      <th className="pb-2.5 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-855 font-bold">
                    {[
                      { user: 'Rahul Sharma', status: 'Success', ip: '103.21.244.12', device: 'Chrome/Win', time: 'May 15 09:15 AM' },
                      { user: 'Priya Nair', status: 'Success', ip: '125.18.65.34', device: 'Edge/Win', time: 'May 15 08:42 AM' },
                      { user: 'Arjun Patel', status: 'Failed', ip: '203.0.113.45', device: 'Chrome/And', time: 'May 15 08:35 AM' },
                      { user: 'Sneha Iyer', status: 'Success', ip: '117.239.14.22', device: 'Safari/iOS', time: 'May 15 08:22 AM' },
                      { user: 'Vikram Singh', status: 'Failed', ip: '203.0.113.45', device: 'Firefox/Win', time: 'May 15 08:10 AM' }
                    ].map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 text-slate-800 dark:text-slate-200">{log.user}</td>
                        <td className="py-2.5">
                          {log.status === 'Success' ? (
                            <Badge className="bg-emerald-50 text-emerald-705 border-0 text-[9px] font-black py-0 px-1.5">Success</Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 border-0 text-[9px] font-black py-0 px-1.5">Failed</Badge>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-slate-500">{log.ip}</td>
                        <td className="py-2.5 text-slate-550">{log.device}</td>
                        <td className="py-2.5 text-slate-450 text-right font-medium">{log.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => toast.info('Navigating to full Login History')}
                className="w-full text-center text-[11px] text-blue-600 hover:underline font-bold pt-2.5 border-t dark:border-slate-800 flex items-center justify-center gap-1 cursor-pointer mt-3"
              >
                View All Login History →
              </button>
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Active Sessions (156)</h3>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                      <th className="pb-2.5">User</th>
                      <th className="pb-2.5">Device / Browser</th>
                      <th className="pb-2.5">IP Address</th>
                      <th className="pb-2.5">Location</th>
                      <th className="pb-2.5 text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-855 font-bold">
                    {[
                      { user: 'Rahul Sharma', browser: 'Chrome / Windows', ip: '103.21.244.12', loc: 'Mumbai, Ind', duration: '2h 15m' },
                      { user: 'Priya Nair', browser: 'Edge / Windows', ip: '125.18.65.34', loc: 'Blr, Ind', duration: '1h 05m' },
                      { user: 'Arjun Patel', browser: 'Chrome / Android', ip: '203.0.113.45', loc: 'Delhi, Ind', duration: '45m' },
                      { user: 'Sneha Iyer', browser: 'Safari / iOS', ip: '117.239.14.22', loc: 'Hyd, Ind', duration: '1h 32m' },
                      { user: 'Vikram Singh', browser: 'Firefox / Windows', ip: '103.77.12.90', loc: 'Pune, Ind', duration: '3h 10m' }
                    ].map((session, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 text-slate-800 dark:text-slate-200">{session.user}</td>
                        <td className="py-2.5 text-slate-600 dark:text-slate-400">{session.browser}</td>
                        <td className="py-2.5 font-mono text-slate-500">{session.ip}</td>
                        <td className="py-2.5 text-slate-550">{session.loc}</td>
                        <td className="py-2.5 text-slate-800 dark:text-slate-100 text-right font-semibold">{session.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={() => toast.info('Navigating to full Active Sessions')}
                className="w-full text-center text-[11px] text-blue-600 hover:underline font-bold pt-2.5 border-t dark:border-slate-800 flex items-center justify-center gap-1 cursor-pointer mt-3"
              >
                View All Active Sessions →
              </button>
            </div>

          </div>

        </div>

        {/* Sidebar Widgets Column */}
        <div className="space-y-6">
          
          {/* Authentication Security Score */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Authentication Security Score</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 text-emerald-600 font-black text-2xl flex items-center justify-center shrink-0">
                85
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-emerald-705 block">Good</span>
                <p className="text-[10px] text-slate-450 leading-normal mt-0.5">Your authentication security is strong and optimized.</p>
              </div>
            </div>
            <div className="space-y-2 text-xs font-bold text-left pt-3 border-t dark:border-slate-800">
              {[
                { title: 'Multi-Factor Authentication', status: 'Enabled', val: true },
                { title: 'MFA Enforced for Admins', status: 'Enabled', val: true },
                { title: 'Strong Password Policy', status: 'Enabled', val: true },
                { title: 'Session Timeout Policy', status: 'Enabled', val: true },
                { title: 'Login Alerts', status: 'Partially Enabled', val: 'partial' },
                { title: 'IP Restrictions', status: 'Enabled', val: true }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="truncate max-w-[170px]">{item.title}</span>
                  {item.val === true ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[9px] font-extrabold px-1.5 py-0">Enabled</Badge>
                  ) : item.val === 'partial' ? (
                    <Badge className="bg-amber-50 text-amber-705 border-0 text-[9px] font-extrabold px-1.5 py-0">Partially</Badge>
                  ) : (
                    <Badge className="bg-rose-50 text-rose-700 border-0 text-[9px] font-extrabold px-1.5 py-0">Disabled</Badge>
                  )}
                </div>
              ))}
              <button className="w-full text-center text-xs text-blue-600 hover:underline font-bold pt-2 flex items-center justify-center gap-1 cursor-pointer">
                Improve Score <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* MFA Adoption */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">MFA Adoption</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-[110px] w-[110px] shrink-0">
                <Chart options={mfaDonutOptions} series={mfaSeries} type="donut" height="110px" />
              </div>
              <div className="space-y-2 text-xs font-bold w-full pt-1.5 border-t dark:border-slate-800">
                {[
                  { name: 'MFA Enabled', count: 812, pct: '65.1%', color: 'bg-[#10b981]' },
                  { name: 'MFA Not Enabled', count: 436, pct: '24.9%', color: 'bg-[#3b82f6]' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-655 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color} shrink-0`}></span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-extrabold text-slate-850 dark:text-slate-200 shrink-0 ml-2">
                      {item.count} <span className="text-[10px] text-slate-400 font-semibold font-mono">({item.pct})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Quick Actions</h3>
            <div className="space-y-2.5 text-left">
              {[
                { label: 'Enforce MFA for All Users', action: () => toast.success('MFA Enforcement Policy dispatched!') },
                { label: 'Configure Password Policy', action: () => openConfig(methods[0]) },
                { label: 'Manage Allowed IP Addresses', action: () => toast.info('IP configuration active.') },
                { label: 'Configure Login Alerts', action: () => toast.info('Alert triggers updated.') },
                { label: 'View Active Sessions', action: () => toast.info('Rendering active sessions list.') },
                { label: 'Download Auth Report', action: () => toast.success('Authentication audit report generated!') }
              ].map((act, idx) => (
                <button
                  key={idx}
                  onClick={act.action}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-left text-xs font-bold text-slate-705 dark:text-slate-350 cursor-pointer group"
                >
                  <span className="truncate group-hover:text-blue-650 transition-colors">{act.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Edit Config Modal */}
      {editMethod && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-xl max-w-md w-full text-left space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Settings className="h-4.5 w-4.5 text-blue-600" /> Configure {editMethod.name}
              </h3>
              <button onClick={() => setEditMethod(null)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="h-4.5 w-4.5 text-slate-400" />
              </button>
            </div>
            
            <p className="text-xs text-slate-550 leading-relaxed font-semibold">{editMethod.desc}</p>

            <form onSubmit={saveConfig} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400">Method Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none cursor-pointer"
                >
                  <option value="Enabled">Enabled</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400">Enforcement Scope</label>
                <select
                  value={modalEnforced}
                  onChange={(e) => setModalEnforced(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl outline-none cursor-pointer"
                >
                  <option value="All Users">All Users</option>
                  <option value="Admins Only">Admins Only</option>
                  <option value="Specific Roles">Specific Roles</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditMethod(null)}
                  className="rounded-xl font-bold text-xs cursor-pointer px-4 py-2 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer px-4 py-2"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
