'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Monitor, Laptop, Users, Clock, ShieldAlert, Key, MoreVertical, Search,
  Filter, RefreshCw, X, Check, Trash2, ArrowUpRight, ArrowDownRight,
  ChevronRight, MapPin, AlertCircle, Info, ChevronDown
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

const initialSessions = [
  { id: 1, name: 'Rahul Sharma', email: 'rahul.sharma@crmfarm.in', device: 'Chrome / Windows', loc: 'Mumbai, India', ip: '103.21.244.12', loginTime: 'May 15, 2024 09:15 AM', lastAct: '2m ago', duration: '1h 24m', status: 'Active', initial: 'RS', color: 'bg-rose-100 text-rose-700' },
  { id: 2, name: 'Priya Nair', email: 'priya.nair@crmfarm.in', device: 'Edge / Windows', loc: 'Bengaluru, India', ip: '125.18.65.34', loginTime: 'May 15, 2024 08:42 AM', lastAct: '1m ago', duration: '2h 05m', status: 'Active', initial: 'PN', color: 'bg-emerald-100 text-emerald-700' },
  { id: 3, name: 'Arjun Patel', email: 'arjun.patel@crmfarm.in', device: 'Chrome / Android', loc: 'Delhi, India', ip: '203.0.113.45', loginTime: 'May 15, 2024 08:35 AM', lastAct: '5m ago', duration: '1h 10m', status: 'Active', initial: 'AP', color: 'bg-blue-100 text-blue-700' },
  { id: 4, name: 'Sneha Iyer', email: 'sneha.iyer@crmfarm.in', device: 'Safari / iOS', loc: 'Hyderabad, India', ip: '117.239.14.22', loginTime: 'May 15, 2024 08:22 AM', lastAct: 'Just now', duration: '45m', status: 'Active', initial: 'SI', color: 'bg-purple-100 text-purple-700' },
  { id: 5, name: 'Vikram Singh', email: 'vikram.singh@crmfarm.in', device: 'Firefox / Windows', loc: 'Pune, India', ip: '103.77.12.90', loginTime: 'May 15, 2024 08:10 AM', lastAct: '3m ago', duration: '1h 32m', status: 'Active', initial: 'VS', color: 'bg-teal-100 text-teal-700' },
  { id: 6, name: 'Meera Kapoor', email: 'meera.kapoor@crmfarm.in', device: 'Chrome / Windows', loc: 'Hyderabad, India', ip: '117.239.14.22', loginTime: 'May 15, 2024 07:45 PM', lastAct: '12m ago', duration: '2h 15m', status: 'Idle', initial: 'MK', color: 'bg-pink-100 text-pink-700' },
  { id: 7, name: 'David George', email: 'david.george@crmfarm.in', device: 'Edge / Windows', loc: 'Pune, India', ip: '203.0.113.200', loginTime: 'May 15, 2024 07:10 AM', lastAct: '25m ago', duration: '3h 05m', status: 'Expired', initial: 'DG', color: 'bg-rose-100 text-rose-700' },
  { id: 8, name: 'Ananya Sen', email: 'ananya.sen@crmfarm.in', device: 'Chrome / macOS', loc: 'Kolkata, India', ip: '139.59.78.11', loginTime: 'May 15, 2024 06:50 AM', lastAct: '1h ago', duration: '1h 40m', status: 'Active', initial: 'AS', color: 'bg-indigo-100 text-indigo-700' }
];

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const handleTerminate = (id: number, name: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    toast.success(`Session for ${name} terminated successfully!`);
    setActiveMenuId(null);
  };

  const handleTerminateAll = () => {
    if (confirm('Are you sure you want to terminate all other active sessions?')) {
      const selfSession = sessions.slice(0, 1); // keep current logged-in user session
      setSessions(selfSession);
      toast.success('All other sessions terminated successfully!');
    }
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                          s.email.toLowerCase().includes(search.toLowerCase()) ||
                          s.device.toLowerCase().includes(search.toLowerCase()) ||
                          s.ip.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Active sessions over time line config
  const overTimeSeries = [
    {
      name: 'Active Sessions',
      data: [102, 115, 110, 120, 118, 128, 156]
    }
  ];

  const overTimeOptions = {
    chart: {
      type: 'area' as const,
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'Inter, sans-serif'
    },
    stroke: {
      curve: 'smooth' as const,
      width: 3,
      colors: ['#0565FD']
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 90, 100],
        colorStops: [
          { offset: 0, color: '#0565FD', opacity: 0.35 },
          { offset: 100, color: '#0565FD', opacity: 0.02 }
        ]
      }
    },
    markers: {
      size: 4,
      colors: ['#ffffff'],
      strokeColors: ['#0565FD'],
      strokeWidth: 2,
      hover: { size: 6 }
    },
    xaxis: {
      categories: ['May 09', 'May 10', 'May 11', 'May 12', 'May 13', 'May 14', 'May 15'],
      labels: { style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 500 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      min: 0,
      max: 200,
      tickAmount: 4,
      labels: { style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 500 } }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      custom: function({ series, seriesIndex, dataPointIndex, w }: any) {
        const val = series[seriesIndex][dataPointIndex];
        const dates = ['May 09', 'May 10', 'May 11', 'May 12', 'May 13', 'May 14', 'May 15'];
        const date = dates[dataPointIndex] || 'Date';
        return `
          <div class="p-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md border-0 text-left">
            <div class="text-[10px] text-slate-400 font-semibold leading-none">${date || 'Date'}</div>
            <div class="flex items-center gap-1.5 mt-1 leading-none">
              <span class="h-2 w-2 rounded-full bg-blue-500"></span>
              <span>Sessions: <span class="text-blue-400 font-extrabold">${val}</span></span>
            </div>
          </div>
        `;
      }
    }
  };

  // Sessions by Device Donut
  const deviceLabels = ['Windows', 'macOS', 'Android', 'iOS', 'Linux'];
  const deviceSeries = [68, 36, 28, 16, 8];
  const deviceColors = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

  const deviceDonutOptions = {
    chart: { type: 'donut' as const, fontFamily: 'Inter, sans-serif' },
    labels: deviceLabels,
    colors: deviceColors,
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
              formatter: () => '156',
              style: { fontSize: '11px', fontWeight: 600, color: '#94a3b8' }
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => '156'
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  // Session Status Donut
  const statusLabels = ['Active', 'Idle', 'Expired', 'Terminated'];
  const statusSeries = [142, 9, 3, 2];
  const statusColors = ['#10b981', '#f59e0b', '#ef4444', '#64748b'];

  const statusDonutOptions = {
    chart: { type: 'donut' as const, fontFamily: 'Inter, sans-serif' },
    labels: statusLabels,
    colors: statusColors,
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
              label: 'Sessions',
              formatter: () => '156',
              style: { fontSize: '11px', fontWeight: 600, color: '#94a3b8' }
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => '156'
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-50 text-emerald-705 border-emerald-100 font-bold text-[10px]">Active</Badge>;
      case 'Idle':
        return <Badge className="bg-amber-50 text-amber-705 border-amber-100 font-bold text-[10px]">Idle</Badge>;
      case 'Expired':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 font-bold text-[10px]">Expired</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border-slate-100 font-bold text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Sessions
            <Monitor className="h-5 w-5 text-blue-600" />
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Monitor active user sessions and manage access in real time.
          </p>
        </div>
        
        <Button
          onClick={handleTerminateAll}
          className="text-white font-extrabold gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2.5 cursor-pointer shadow-sm shadow-blue-500/10 flex items-center shrink-0 w-fit"
        >
          Session Actions
          <ChevronDown className="h-3.5 w-3.5 border-l border-blue-500/50 pl-1 ml-0.5" />
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Sessions */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Active Sessions</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-955/20 rounded-full text-blue-600">
              <Monitor className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{sessions.length}</h3>
            <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-emerald-650">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>12.4%</span>
              <span className="text-slate-400 font-medium ml-0.5">vs last 30 days</span>
            </div>
          </div>
        </div>

        {/* Unique Users Online */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Unique Users Online</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-955/20 rounded-full text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">98</h3>
            <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-emerald-650">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>9.6%</span>
              <span className="text-slate-400 font-medium ml-0.5">vs last 30 days</span>
            </div>
          </div>
        </div>

        {/* Avg. Session Duration */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Avg. Session Duration</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-955/20 rounded-full text-purple-650">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">1h 24m</h3>
            <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-emerald-650">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>8.7%</span>
              <span className="text-slate-400 font-medium ml-0.5">vs last 30 days</span>
            </div>
          </div>
        </div>

        {/* Logins (Today) */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Logins (Today)</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-955/20 rounded-full text-amber-600">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">243</h3>
            <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-emerald-650">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>15.3%</span>
              <span className="text-slate-400 font-medium ml-0.5">vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Blocked Sessions */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Blocked Sessions</span>
            <div className="p-2 bg-red-50 dark:bg-red-955/20 rounded-full text-red-600">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">7</h3>
            <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-red-600">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>40%</span>
              <span className="text-slate-400 font-medium ml-0.5">vs last 30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graphs & Right Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main panels */}
        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Active Sessions Over Time */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Active Sessions Over Time</h3>
                <select className="text-[11px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-2 py-1 outline-none text-slate-700 dark:text-slate-350 cursor-pointer">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-[180px] w-full">
                <Chart options={overTimeOptions} series={overTimeSeries} type="area" height="170px" />
              </div>
            </div>

            {/* Sessions by Device */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Sessions by Device</h3>
              <div className="flex flex-col items-center justify-between gap-3 flex-1">
                <div className="relative h-[110px] w-[110px] shrink-0">
                  <Chart options={deviceDonutOptions} series={deviceSeries} type="donut" height="110px" />
                </div>
                <div className="space-y-1 text-[9.5px] font-bold w-full pt-1.5 border-t dark:border-slate-800">
                  {deviceLabels.slice(0, 4).map((label, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: deviceColors[idx] }}></span>
                        <span className="truncate">{label}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 shrink-0 ml-1.5">
                        {deviceSeries[idx]} <span className="text-[8.5px] text-slate-450 font-medium">({(deviceSeries[idx] / 156 * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Active Sessions List Table */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Active Sessions ({sessions.length})</h3>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-[11px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-350 outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Idle">Idle</option>
                  <option value="Expired">Expired</option>
                </select>

                <Button variant="outline" size="sm" className="rounded-xl border-slate-100 text-slate-650 gap-1.5 hidden sm:flex text-xs cursor-pointer bg-white">
                  <Filter className="h-3.5 w-3.5" /> Filters
                </Button>

                <button
                  onClick={() => toast.success('Sessions list re-synchronized!')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="pb-3 pt-1">User</th>
                    <th className="pb-3 pt-1">Device / Browser</th>
                    <th className="pb-3 pt-1">Location</th>
                    <th className="pb-3 pt-1">IP Address</th>
                    <th className="pb-3 pt-1">Login Time</th>
                    <th className="pb-3 pt-1">Last Activity</th>
                    <th className="pb-3 pt-1">Duration</th>
                    <th className="pb-3 pt-1">Status</th>
                    <th className="pb-3 pt-1 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-855 font-bold">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      {/* User */}
                      <td className="py-3 flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs ${s.color} shrink-0`}>
                          {s.initial}
                        </div>
                        <div className="min-w-0">
                          <span className="text-slate-800 dark:text-slate-200 block text-xs font-bold leading-normal truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block truncate leading-normal mt-0.5">{s.email}</span>
                        </div>
                      </td>

                      {/* Device */}
                      <td className="py-3 text-slate-705 dark:text-slate-400 text-xs font-semibold">
                        {s.device}
                      </td>

                      {/* Location */}
                      <td className="py-3 text-slate-655 dark:text-slate-400 text-xs">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {s.loc}</span>
                      </td>

                      {/* IP */}
                      <td className="py-3 font-mono text-slate-500 text-xs">
                        {s.ip}
                      </td>

                      {/* Login Time */}
                      <td className="py-3 text-slate-500 dark:text-slate-505 text-xs font-semibold">
                        {s.loginTime}
                      </td>

                      {/* Last Activity */}
                      <td className="py-3 text-slate-550 text-xs font-medium">
                        {s.lastAct}
                      </td>

                      {/* Duration */}
                      <td className="py-3 text-slate-800 dark:text-slate-100 text-xs">
                        {s.duration}
                      </td>

                      {/* Status */}
                      <td className="py-3">
                        {getStatusBadge(s.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === s.id && (
                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-lg z-20 py-1.5 text-left">
                            <button
                              onClick={() => handleTerminate(s.id, s.name)}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold block cursor-pointer flex items-center gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Terminate Session
                            </button>
                            <button
                              onClick={() => {
                                toast.info(`Session logs exported for ${s.name}`);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold block cursor-pointer"
                            >
                              Export Logs
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs font-medium">
                        No active sessions matching search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination info */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t dark:border-slate-800">
              <span className="text-[10.5px] font-bold text-slate-455">
                Showing 1 to {filteredSessions.length} of {filteredSessions.length} sessions
              </span>
              <div className="flex items-center gap-1">
                <button className="h-7 w-7 rounded-lg border dark:border-slate-800 flex items-center justify-center font-bold text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed" disabled>&lt;</button>
                <button className="h-7 w-7 rounded-lg bg-blue-600 text-white font-black text-xs">1</button>
                <button className="h-7 w-7 rounded-lg border dark:border-slate-800 flex items-center justify-center font-bold text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed" disabled>&gt;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets Column */}
        <div className="space-y-6">
          
          {/* Session Status Chart */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Session Status</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-[110px] w-[110px] shrink-0">
                <Chart options={statusDonutOptions} series={statusSeries} type="donut" height="110px" />
              </div>
              <div className="space-y-1.5 text-xs font-bold w-full pt-1.5 border-t dark:border-slate-800">
                {statusLabels.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[idx] }}></span>
                      <span className="truncate">{item}</span>
                    </div>
                    <span className="font-extrabold text-slate-850 dark:text-slate-200 shrink-0 ml-2">
                      {statusSeries[idx]} <span className="text-[10px] text-slate-400 font-semibold font-mono">({(statusSeries[idx] / 156 * 100).toFixed(1)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Sessions by Location */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Active Sessions by Location</h3>
            <div className="space-y-2.5 text-left text-xs font-bold text-slate-655 dark:text-slate-350">
              {[
                { loc: 'Mumbai, India', count: 32, pct: '20.5%' },
                { loc: 'Bengaluru, India', count: 28, pct: '17.9%' },
                { loc: 'Delhi, India', count: 24, pct: '15.4%' },
                { loc: 'Hyderabad, India', count: 22, pct: '14.1%' },
                { loc: 'Pune, India', count: 18, pct: '11.5%' }
              ].map((locItem, idx) => (
                <div key={idx} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{locItem.loc}</span>
                  </div>
                  <span>{locItem.count} <span className="text-[10px] font-medium text-slate-400">({locItem.pct})</span></span>
                </div>
              ))}
              <button className="w-full text-center text-xs text-blue-605 hover:underline font-bold pt-2 border-t dark:border-slate-800 flex items-center justify-center gap-1 cursor-pointer">
                View All Locations <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Quick Actions</h3>
            <div className="space-y-2 text-left">
              {[
                { label: 'Terminate Session', action: () => toast.warning('Select a session from the table to terminate.') },
                { label: 'Terminate Other Sessions', action: handleTerminateAll },
                { label: 'Force Logout User', action: () => toast.warning('Select user to logout.') },
                { label: 'View Session Details', action: () => toast.info('Select a session to view details.') },
                { label: 'Export Sessions Report', action: () => toast.success('Active sessions report download started!') }
              ].map((act, idx) => (
                <button
                  key={idx}
                  onClick={act.action}
                  className="w-full flex items-center justify-between p-1.5 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-left text-xs font-bold text-slate-705 dark:text-slate-350 cursor-pointer group"
                >
                  <span className="truncate group-hover:text-blue-650 transition-colors">{act.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Security Tip */}
          <div className="bg-emerald-50/50 dark:bg-emerald-955/10 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 text-left flex gap-3">
            <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-805">Security Tip</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal font-medium">If you see any suspicious activity, terminate the session immediately.</p>
              <button className="text-[10px] font-extrabold text-blue-600 hover:underline flex items-center gap-0.5">Learn more <ChevronRight className="h-3 w-3" /></button>
            </div>
          </div>

        </div>

      </div>

      {/* Recent Session Activity Log Timeline */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs text-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Recent Session Activity</h3>
          <button onClick={() => toast.info('Navigating to full audit log')} className="text-xs text-blue-650 font-bold hover:underline">View All Activity →</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { title: 'New session started', desc: 'Rahul Sharma', time: 'May 15, 2024 09:15 AM', type: 'start' },
            { title: 'Session terminated', desc: 'David George', time: 'May 15, 2024 07:10 AM', type: 'terminate' },
            { title: 'New device login', desc: 'Priya Nair', time: 'May 15, 2024 08:42 AM', type: 'login' },
            { title: 'Multiple failed attempts', desc: 'Unknown IP 45.129.33.10', time: 'May 15, 2024 06:30 AM', type: 'fail' },
            { title: 'Session expired', desc: 'Meera Kapoor', time: 'May 15, 2024 06:20 AM', type: 'expire' }
          ].map((act, i) => (
            <div key={i} className="border dark:border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between h-28 relative bg-slate-50/50 dark:bg-slate-950/20">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block leading-normal">{act.title}</span>
                <span className="text-xs font-bold text-slate-705 dark:text-slate-205 mt-1 block truncate leading-normal">{act.desc}</span>
              </div>
              <span className="text-[9.5px] text-slate-400 font-semibold block mt-2 font-mono leading-none">{act.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
