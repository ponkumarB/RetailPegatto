'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Search, Filter,
  MoreVertical, ChevronDown, ChevronRight, Download, Play, RefreshCw,
  Plus, Key, Lock, Settings, Users, Monitor, ArrowUpRight, ArrowDownRight,
  Info, Eye, Trash2, Edit3, Shield
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

const initialPolicies = [
  { id: 1, name: 'Password Policy', desc: 'Enforces strong password requirements', cat: 'Authentication', status: 'Active', priority: 'High', updated: 'May 10, 2024' },
  { id: 2, name: 'Multi-Factor Authentication', desc: 'Requires MFA for user login', cat: 'Authentication', status: 'Active', priority: 'High', updated: 'May 09, 2024' },
  { id: 3, name: 'Session Timeout Policy', desc: 'Automatically log out inactive users', cat: 'Session Management', status: 'Active', priority: 'Medium', updated: 'May 08, 2024' },
  { id: 4, name: 'IP Restriction Policy', desc: 'Restrict login from unauthorized IPs', cat: 'Access Control', status: 'Active', priority: 'High', updated: 'May 07, 2024' },
  { id: 5, name: 'Login Attempt Limit', desc: 'Limit number of failed login attempts', cat: 'Authentication', status: 'Active', priority: 'High', updated: 'May 07, 2024' },
  { id: 6, name: 'Data Access Policy', desc: 'Control access to sensitive data', cat: 'Data Protection', status: 'Active', priority: 'Medium', updated: 'May 06, 2024' },
  { id: 7, name: 'Device Trust Policy', desc: 'Allow access only from trusted devices', cat: 'Device Management', status: 'Active', priority: 'Medium', updated: 'May 05, 2024' },
  { id: 8, name: 'Password Expiry Policy', desc: 'Require password change after expiry', cat: 'Authentication', status: 'Active', priority: 'Medium', updated: 'May 05, 2024' },
  { id: 9, name: 'Role-Based Access Policy', desc: 'Enforce least privilege access', cat: 'Access Control', status: 'Active', priority: 'High', updated: 'May 04, 2024' },
  { id: 10, name: 'Mobile Access Policy', desc: 'Manage access from mobile devices', cat: 'Device Management', status: 'Inactive', priority: 'Low', updated: 'May 02, 2024' },
  { id: 11, name: 'Encryption Key Rotation', desc: 'Rotate master encryption keys quarterly', cat: 'Data Protection', status: 'Active', priority: 'High', updated: 'Apr 28, 2024' },
  { id: 12, name: 'API Rate Limiting', desc: 'Limit API request frequency', cat: 'Access Control', status: 'Active', priority: 'Medium', updated: 'Apr 25, 2024' },
  { id: 13, name: 'Audit Logging Policy', desc: 'Log all critical user actions', cat: 'Session Management', status: 'Active', priority: 'High', updated: 'Apr 22, 2024' },
  { id: 14, name: 'Single Sign-On (SSO)', desc: 'Enforce SSO login for employees', cat: 'Authentication', status: 'Active', priority: 'High', updated: 'Apr 18, 2024' },
  { id: 15, name: 'Third-Party Access Policy', desc: 'Restrict vendor API access keys', cat: 'Access Control', status: 'Active', priority: 'High', updated: 'Apr 15, 2024' },
  { id: 16, name: 'Removable Media Policy', desc: 'Block USB file transfers', cat: 'Data Protection', status: 'Active', priority: 'Low', updated: 'Apr 10, 2024' },
  { id: 17, name: 'Concurrent Session Limit', desc: 'Max 3 simultaneous logins per user', cat: 'Session Management', status: 'Active', priority: 'Medium', updated: 'Apr 05, 2024' },
  { id: 18, name: 'Remote Wipe Policy', desc: 'Wipe lost mobile corporate data', cat: 'Device Management', status: 'Active', priority: 'Medium', updated: 'Mar 28, 2024' },
  { id: 19, name: 'Backup Encryption', desc: 'Enforce AES-256 for db backups', cat: 'Data Protection', status: 'Active', priority: 'High', updated: 'Mar 20, 2024' },
  { id: 20, name: 'SSH Key Policy', desc: 'Enforce SSH keys instead of passwords', cat: 'Access Control', status: 'Active', priority: 'High', updated: 'Mar 15, 2024' },
  { id: 21, name: 'Inactive Account Lock', desc: 'Lock accounts after 90 days inactivity', cat: 'Authentication', status: 'Active', priority: 'Medium', updated: 'Mar 10, 2024' },
  { id: 22, name: 'Geo-IP Blocking', desc: 'Block logins from high-risk countries', cat: 'Access Control', status: 'Draft', priority: 'High', updated: 'Mar 05, 2024' },
  { id: 23, name: 'Root Access Restriction', desc: 'Restrict SSH root logins', cat: 'Access Control', status: 'Inactive', priority: 'High', updated: 'Feb 28, 2024' },
  { id: 24, name: 'Email Forwarding Policy', desc: 'Block automatic external forwards', cat: 'Data Protection', status: 'Active', priority: 'Medium', updated: 'Feb 20, 2024' }
];

export default function SecurityPoliciesListPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('crm_security_policies');
    if (stored) {
      setPolicies(JSON.parse(stored));
    } else {
      localStorage.setItem('crm_security_policies', JSON.stringify(initialPolicies));
      setPolicies(initialPolicies);
    }
  }, []);

  const handleDelete = (id: number) => {
    const updated = policies.filter(p => p.id !== id);
    setPolicies(updated);
    localStorage.setItem('crm_security_policies', JSON.stringify(updated));
    toast.success('Security policy deleted successfully!');
    setActiveMenuId(null);
  };

  const handleScan = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Scanning policies for compliance...',
        success: 'Policy scan completed. 87% compliance score.',
        error: 'Scan failed.'
      }
    );
  };

  // Filter calculations
  const filteredPolicies = policies.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.desc.toLowerCase().includes(search.toLowerCase()) ||
                          p.cat.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pageSize = 10;
  const totalPages = Math.ceil(filteredPolicies.length / pageSize) || 1;
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedPolicies = filteredPolicies.slice((currentPageIndex - 1) * pageSize, currentPageIndex * pageSize);

  // Stats
  const totalPoliciesCount = policies.length;
  const activePoliciesCount = policies.filter(p => p.status === 'Active').length;
  const inactivePoliciesCount = policies.filter(p => p.status === 'Inactive').length;
  const draftPoliciesCount = policies.filter(p => p.status === 'Draft').length;

  // Chart 1: Policy Compliance Donut
  const complianceLabels = ['Compliant', 'Non-Compliant', 'Not Evaluated'];
  const complianceSeries = [21, 3, 0];
  const complianceColors = ['#10b981', '#ef4444', '#94a3b8'];

  const complianceOptions = {
    chart: { type: 'donut' as const, fontFamily: 'Inter, sans-serif' },
    labels: complianceLabels,
    colors: complianceColors,
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
              label: 'Compliant',
              formatter: () => '87%',
              style: { fontSize: '11px', fontWeight: 605, color: '#94a3b8' }
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => '87%'
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  // Chart 2: Policy Status Overview Donut (Active, Inactive, Draft)
  const statusLabels = ['Active', 'Inactive', 'Draft'];
  const statusSeries = [activePoliciesCount, inactivePoliciesCount, draftPoliciesCount];
  const statusColors = ['#10b981', '#ef4444', '#f59e0b'];

  const statusOptions = {
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
              label: 'Total Policies',
              formatter: () => String(totalPoliciesCount),
              style: { fontSize: '11px', fontWeight: 600, color: '#94a3b8' }
            },
            value: {
              show: true,
              fontSize: '22px',
              fontWeight: 800,
              color: 'var(--foreground)',
              formatter: () => String(totalPoliciesCount)
            }
          }
        }
      }
    },
    stroke: { show: false },
    tooltip: { enabled: true }
  };

  // Chart 3: Top Policies by Violations Horizontal Bar Chart
  const violationsLabels = ['Password Policy', 'Login Attempt Limit', 'IP Restriction', 'Session Timeout', 'Device Trust'];
  const violationsSeries = [
    {
      name: 'Violations',
      data: [12, 8, 5, 3, 2]
    }
  ];

  const violationsOptions = {
    chart: {
      type: 'bar' as const,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif'
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '40%',
        borderRadius: 4,
        colors: {
          ranges: [
            { from: 10, to: 15, color: '#ef4444' }, // Red for password
            { from: 6, to: 9, color: '#10b981' },   // Green
            { from: 4, to: 5, color: '#f59e0b' },   // Orange
            { from: 0, to: 3, color: '#8b5cf6' }    // Purple
          ]
        }
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: violationsLabels,
      labels: { style: { colors: '#94a3b8', fontSize: '10px', fontWeight: 500 } }
    },
    yaxis: {
      labels: { style: { colors: '#475569', fontSize: '10.5px', fontWeight: 700 } }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } }
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'High':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-extrabold text-[10px]">High</Badge>;
      case 'Medium':
        return <Badge className="bg-amber-50 text-amber-705 border-amber-200 font-extrabold text-[10px]">Medium</Badge>;
      case 'Low':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-250 font-extrabold text-[10px]">Low</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border-slate-200 font-extrabold text-[10px]">{prio}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <Badge className="bg-emerald-50 text-emerald-705 border-emerald-200 font-extrabold text-[10px]">Active</Badge>;
      case 'Inactive':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-250 font-extrabold text-[10px]">Inactive</Badge>;
      case 'Draft':
        return <Badge className="bg-amber-50 text-amber-705 border-amber-200 font-extrabold text-[10px]">Draft</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border-slate-200 font-extrabold text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            Security Policies
            <ShieldCheck className="h-5.5 w-5.5 text-blue-600" />
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            Define, manage and enforce security policies to protect your organization's data and ensure compliance.
          </p>
        </div>
        
        <Button
          onClick={() => router.push('/system/security-policies/create')}
          className="text-white font-extrabold gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2.5 cursor-pointer shadow-sm shadow-blue-500/10 flex items-center shrink-0 w-fit"
        >
          <Plus className="h-4 w-4" /> Create Policy
        </Button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Policies */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Total Policies</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-955/20 rounded-full text-blue-600">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalPoliciesCount}</h3>
            <span className="text-[10px] text-slate-400 font-medium block mt-1.5">All security policies</span>
          </div>
        </div>

        {/* Active Policies */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Active Policies</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-955/20 rounded-full text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{activePoliciesCount}</h3>
            <span className="text-[10px] text-slate-400 font-medium block mt-1.5">
              {totalPoliciesCount > 0 ? (activePoliciesCount / totalPoliciesCount * 100).toFixed(1) : 0}% of total policies
            </span>
          </div>
        </div>

        {/* Policies Violated */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Policies Violated (30 Days)</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-955/20 rounded-full text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">8</h3>
            <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-red-600">
              <ArrowDownRight className="h-3.5 w-3.5" />
              <span>20%</span>
              <span className="text-slate-400 font-medium ml-0.5">vs last 30 days</span>
            </div>
          </div>
        </div>

        {/* Policy Exceptions */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Policy Exceptions</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-955/20 rounded-full text-purple-600">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">6</h3>
            <span className="text-[10px] text-slate-400 font-medium block mt-1.5">Approved exceptions</span>
          </div>
        </div>

        {/* Last Scanned */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-855 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Last Scanned</span>
            <div className="p-2 bg-cyan-50 dark:bg-cyan-955/20 rounded-full text-cyan-600">
              <RefreshCw className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Today, 09:15 AM</h3>
            <span className="text-[10px] text-slate-400 font-medium block mt-1.5">All policies scanned</span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Main list & table panel */}
        <div className="xl:col-span-3 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">All Security Policies</h3>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none sm:w-56">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search policies..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-[11px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-2.5 py-1.5 text-slate-705 dark:text-slate-350 outline-none cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Draft">Draft</option>
                </select>

                <Button variant="outline" size="sm" className="rounded-xl border-slate-100 text-slate-650 gap-1.5 hidden sm:flex text-xs cursor-pointer bg-white">
                  <Filter className="h-3.5 w-3.5" /> Filters
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="pb-3 pt-1">Policy Name</th>
                    <th className="pb-3 pt-1">Description</th>
                    <th className="pb-3 pt-1">Category</th>
                    <th className="pb-3 pt-1">Status</th>
                    <th className="pb-3 pt-1">Priority</th>
                    <th className="pb-3 pt-1">Last Updated</th>
                    <th className="pb-3 pt-1 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-855 font-bold">
                  {paginatedPolicies.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      {/* Name */}
                      <td className="py-3 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-955/20 text-blue-650 flex items-center justify-center shrink-0">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <span className="text-slate-850 dark:text-slate-200 block text-xs font-bold">{p.name}</span>
                      </td>

                      {/* Description */}
                      <td className="py-3 text-slate-550 dark:text-slate-400 font-medium text-xs max-w-[200px] truncate">
                        {p.desc}
                      </td>

                      {/* Category */}
                      <td className="py-3">
                        <Badge className="bg-slate-50 text-slate-700 border-0 text-[10px] font-extrabold">{p.cat}</Badge>
                      </td>

                      {/* Status */}
                      <td className="py-3">
                        {getStatusBadge(p.status)}
                      </td>

                      {/* Priority */}
                      <td className="py-3">
                        {getPriorityBadge(p.priority)}
                      </td>

                      {/* Last Updated */}
                      <td className="py-3 text-slate-500 dark:text-slate-505 text-xs font-semibold">
                        {p.updated}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-right relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === p.id && (
                          <div className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-lg z-20 py-1.5 text-left">
                            <button
                              onClick={() => {
                                router.push(`/system/security-policies/${p.id}/edit`);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-705 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold block cursor-pointer flex items-center gap-1.5"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit Policy
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this security policy?')) {
                                  handleDelete(p.id);
                                }
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-955/20 font-bold block cursor-pointer flex items-center gap-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete Policy
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredPolicies.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                        No policies matching search or filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredPolicies.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t dark:border-slate-800">
                <span className="text-[10.5px] font-bold text-slate-455">
                  Showing {(currentPageIndex - 1) * pageSize + 1} to {Math.min(currentPageIndex * pageSize, filteredPolicies.length)} of {filteredPolicies.length} policies
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPageIndex === 1}
                    className="h-7 w-7 rounded-lg border dark:border-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    &lt;
                  </button>
                  
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-7 w-7 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer ${
                          pageNum === currentPageIndex
                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/10'
                            : 'border dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPageIndex === totalPages}
                    className="h-7 w-7 rounded-lg border dark:border-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    &gt;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom widgets row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Policy Status Overview */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Policy Status Overview</h3>
              <div className="flex flex-col items-center gap-3 flex-1 justify-center">
                <div className="relative h-[110px] w-[110px] shrink-0">
                  <Chart options={statusOptions} series={statusSeries} type="donut" height="110px" />
                </div>
                <div className="space-y-1.5 text-[10px] font-bold w-full pt-1.5 border-t dark:border-slate-800">
                  {statusLabels.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: statusColors[idx] }}></span>
                        <span>{item}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold shrink-0">
                        {statusSeries[idx]} <span className="text-[9px] text-slate-400 font-semibold font-mono">({(statusSeries[idx] / totalPoliciesCount * 100).toFixed(1)}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Policies by Violations */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Top Policies by Violations</h3>
              <div className="h-[150px] w-full flex-1">
                <Chart options={violationsOptions} series={violationsSeries} type="bar" height="140px" />
              </div>
            </div>

            {/* Policy Scan History */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Policy Scan History</h3>
              <div className="space-y-3.5 text-left text-xs font-bold">
                {[
                  { time: 'May 15, 2024 09:15 AM', status: 'Compliant' },
                  { time: 'May 14, 2024 09:15 AM', status: 'Compliant' },
                  { time: 'May 13, 2024 09:15 AM', status: 'Compliant' },
                  { time: 'May 12, 2024 09:15 AM', status: 'Compliant' }
                ].map((scan, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-2 text-slate-655 dark:text-slate-355 leading-tight">
                    <div>
                      <span className="text-[10px] text-slate-405 block">⏱️ {scan.time}</span>
                      <span className="font-semibold block mt-0.5">All policies scanned</span>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-705 border-0 font-extrabold text-[9px] py-0 px-1.5 mt-0.5 shrink-0">
                      {scan.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <button
                onClick={() => toast.info('Displaying policy scan archives')}
                className="w-full text-center text-xs text-blue-600 hover:underline font-bold pt-2 border-t dark:border-slate-800 flex items-center justify-center gap-1 cursor-pointer mt-3"
              >
                View Scan History →
              </button>
            </div>

          </div>

        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          
          {/* Policy Compliance */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Policy Compliance</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-[110px] w-[110px] shrink-0">
                <Chart options={complianceOptions} series={complianceSeries} type="donut" height="110px" />
              </div>
              <div className="space-y-2 text-xs font-bold w-full pt-1.5 border-t dark:border-slate-800">
                {[
                  { name: 'Compliant', count: 21, pct: '87.5%', color: 'bg-[#10b981]' },
                  { name: 'Non-Compliant', count: 3, pct: '12.5%', color: 'bg-[#ef4444]' },
                  { name: 'Not Evaluated', count: 0, pct: '0%', color: 'bg-[#94a3b8]' }
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
              <button
                onClick={() => toast.success('Loading full compliance audits')}
                className="w-full text-center text-xs text-blue-600 hover:underline font-bold pt-1.5 flex items-center justify-center gap-1 cursor-pointer"
              >
                View Compliance Report <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Policy Violations list */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Policy Violations (30 Days)</h3>
            <div className="space-y-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-350">
              {[
                { name: 'Password Policy', count: 12 },
                { name: 'Login Attempt Limit', count: 8 },
                { name: 'IP Restriction Policy', count: 5 },
                { name: 'Session Timeout Policy', count: 3 }
              ].map((v, i) => (
                <div key={i} className="flex justify-between items-center text-slate-500">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-red-500">⚠️</span>
                    <span className="truncate">{v.name}</span>
                  </div>
                  <span className="text-red-650 font-extrabold shrink-0 ml-2">{v.count}</span>
                </div>
              ))}
              <button
                onClick={() => toast.info('Loading complete policy violations list')}
                className="w-full text-center text-xs text-blue-600 hover:underline font-bold pt-2 border-t dark:border-slate-800 flex items-center justify-center gap-1 cursor-pointer mt-2"
              >
                View All Violations <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Quick Actions</h3>
            <div className="space-y-2.5 text-left">
              {[
                { label: 'Create New Policy', action: () => router.push('/system/security-policies/create') },
                { label: 'Policy Templates', action: () => {} },
                { label: 'Policy Exceptions', action: () => {} },
                { label: 'Run Policy Scan', action: handleScan },
                { label: 'Export Policies Report', action: () => toast.success('Security policies report download started!') }
              ].map((act, idx) => (
                <button
                  key={idx}
                  onClick={act.action}
                  className="w-full flex items-center justify-between p-2 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-left text-xs font-bold text-slate-705 dark:text-slate-350 cursor-pointer group"
                >
                  <span className="truncate group-hover:text-blue-650 transition-colors">{act.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-350 group-hover:text-slate-505 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Policy Categories */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-3 text-left">Policy Categories</h3>
            <div className="space-y-2.5 text-left text-xs font-bold text-slate-700 dark:text-slate-350">
              {[
                { name: 'Authentication', count: 8 },
                { name: 'Access Control', count: 6 },
                { name: 'Data Protection', count: 4 },
                { name: 'Session Management', count: 3 },
                { name: 'Device Management', count: 3 }
              ].map((cat, i) => (
                <div key={i} className="flex justify-between items-center text-slate-500">
                  <span className="truncate">{cat.name}</span>
                  <Badge className="bg-slate-50 text-slate-800 border-0 text-[10px] font-black">{cat.count}</Badge>
                </div>
              ))}
              <button className="w-full text-center text-xs text-blue-600 hover:underline font-bold pt-2 border-t dark:border-slate-800 flex items-center justify-center gap-1 cursor-pointer">
                View All Categories <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
