'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  History, Shield, Download, Filter, Search, Calendar, ChevronDown,
  X, Check, AlertCircle, RefreshCw, User, Laptop, MapPin, Eye,
  ArrowUpRight, ArrowDownRight, UserPlus, UserMinus, FileText, Settings, Key, Lock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { fetchFromApi } from '@/service/apiClient';

const colors = [
  'bg-blue-100 text-blue-700 dark:bg-blue-955/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-955/40 dark:text-emerald-300',
  'bg-purple-100 text-purple-700 dark:bg-purple-955/40 dark:text-purple-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-955/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-955/40 dark:text-amber-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-955/40 dark:text-cyan-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-955/40 dark:text-pink-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-955/40 dark:text-teal-300',
];

const getColorForUser = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function UserHistoryPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-07-07');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const [topCards, setTopCards] = useState<any>({
    total_activities: { count: 0, percentage: 0, trend: 'neutral' },
    login_activities: { count: 0, percentage: 0, trend: 'neutral' },
    changes_made: { count: 0, percentage: 0, trend: 'neutral' },
    user_created: { count: 0, percentage: 0, trend: 'neutral' },
    user_deleted: { count: 0, percentage: 0, trend: 'neutral' },
  });

  const [activitySummary, setActivitySummary] = useState<any>({
    logins: { count: 0, percentage: 0, trend: 'neutral' },
    updates: { count: 0, percentage: 0, trend: 'neutral' },
    creates: { count: 0, percentage: 0, trend: 'neutral' },
    deletes: { count: 0, percentage: 0, trend: 'neutral' },
    permission_changes: { count: 0, percentage: 0, trend: 'neutral' },
    password_changes: { count: 0, percentage: 0, trend: 'neutral' },
  });

  const fetchHistoryAndKPIs = async () => {
    setLoading(true);
    try {
      const orgId = typeof window !== 'undefined' ? (Number(localStorage.getItem('Organization_Id')) || 1) : 1;

      // Fetch signed in users list
      const listRes = await fetchFromApi('/user/SignedInUsersList/', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: orgId,
          period: [startDate, endDate],
        }),
      });

      if (listRes && listRes.success && Array.isArray(listRes.data)) {
        const mappedList = listRes.data.map((item: any, idx: number) => {
          const name = item.user_name || 'Unknown User';
          return {
            id: idx + 1,
            name: name,
            email: item.email || '',
            action: item.action || 'Unknown',
            desc: item.description || '',
            ip: '-',
            loc: item.location || '',
            device: '-',
            time: `${item.date || ''} ${item.time || ''}`.trim(),
            initial: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
            color: getColorForUser(name),
            sessionId: '-',
            loginMethod: '-',
            mfaUsed: '-',
            status: 'Success',
            userAgent: '-',
            referrer: '-',
          };
        });
        setActivities(mappedList);
        if (mappedList.length > 0) {
          setSelectedActivity(mappedList[0]);
        } else {
          setSelectedActivity(null);
        }
      } else {
        setActivities([]);
        setSelectedActivity(null);
      }

      // Fetch activity dashboard cards
      const cardRes = await fetchFromApi('/user/UserActivityDashboard/', {
        method: 'POST',
        body: JSON.stringify({
          organization_id: orgId,
          period: [startDate, endDate],
        }),
      });

      if (cardRes && cardRes.success && cardRes.data) {
        if (cardRes.data.top_cards) {
          setTopCards(cardRes.data.top_cards);
        }
        if (cardRes.data.activity_summary) {
          setActivitySummary(cardRes.data.activity_summary);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch user history data:', err);
      toast.error('Failed to load user history activity data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryAndKPIs();
  }, [startDate, endDate]);

  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.desc.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'All' || a.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const pageSize = 10;
  const totalPages = Math.ceil(filteredActivities.length / pageSize) || 1;
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedActivities = filteredActivities.slice((currentPageIndex - 1) * pageSize, currentPageIndex * pageSize);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'Login':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 font-bold text-[9.5px]">Login</Badge>;
      case 'Update':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 font-bold text-[9.5px]">Update</Badge>;
      case 'Create':
        return <Badge className="bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-955/20 font-bold text-[9.5px]">Create</Badge>;
      case 'Delete':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-955/20 font-bold text-[9.5px]">Delete</Badge>;
      case 'Login Failed':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/20 font-bold text-[9.5px]">Login Failed</Badge>;
      case 'Permission Change':
        return <Badge className="bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-955/20 font-bold text-[9.5px]">Permission Change</Badge>;
      case 'Logout':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 font-bold text-[9.5px]">Logout</Badge>;
      default:
        return <Badge className="bg-slate-50 text-slate-700 border-slate-150 font-bold text-[9.5px]">{action}</Badge>;
    }
  };

  const renderTrend = (trendObj: { percentage: number; trend: string }) => {
    if (!trendObj) return null;
    const isUp = trendObj.trend === 'up';
    const isDown = trendObj.trend === 'down';
    const percentage = trendObj.percentage;

    if (isUp) {
      return (
        <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-emerald-600">
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>{percentage}%</span>
          <span className="text-slate-400 font-medium ml-0.5">active</span>
        </div>
      );
    }
    if (isDown) {
      return (
        <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-red-600">
          <ArrowDownRight className="h-3.5 w-3.5" />
          <span>{percentage}%</span>
          <span className="text-slate-400 font-medium ml-0.5">active</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 mt-1 text-[10.5px] font-bold text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 inline-block mr-1" />
        <span>{percentage}%</span>
        <span className="text-slate-400 font-medium ml-0.5">active</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            User History
            <Shield className="h-5 w-5 text-blue-600" />
          </h1>
          <p className="text-xs text-slate-450 mt-1">
            View and monitor user activities, logins, changes and actions performed in the system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => toast.success('User History Report download started!')}
            variant="outline"
            className="rounded-xl border-slate-200 text-slate-700 font-bold text-xs gap-1.5 px-4 py-2 cursor-pointer bg-white"
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>

        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Activities */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Total Activities</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-955/20 rounded-full text-blue-600">
              <History className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {topCards.total_activities?.count?.toLocaleString() ?? '0'}
            </h3>
            {renderTrend(topCards.total_activities)}
          </div>
        </div>

        {/* Login Activities */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-455">Login Activities</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-955/20 rounded-full text-emerald-600">
              <Key className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {topCards.login_activities?.count?.toLocaleString() ?? '0'}
            </h3>
            {renderTrend(topCards.login_activities)}
          </div>
        </div>

        {/* Changes Made */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">Changes Made</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-955/20 rounded-full text-purple-600">
              <Settings className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {topCards.changes_made?.count?.toLocaleString() ?? '0'}
            </h3>
            {renderTrend(topCards.changes_made)}
          </div>
        </div>

        {/* User Created */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">User Created</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-955/20 rounded-full text-amber-600">
              <UserPlus className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {topCards.user_created?.count?.toLocaleString() ?? '0'}
            </h3>
            {renderTrend(topCards.user_created)}
          </div>
        </div>

        {/* User Deleted */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-450">User Deleted</span>
            <div className="p-2 bg-red-50 dark:bg-red-955/20 rounded-full text-red-655">
              <UserMinus className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {topCards.user_deleted?.count?.toLocaleString() ?? '0'}
            </h3>
            {renderTrend(topCards.user_deleted)}
          </div>
        </div>
      </div>

      {/* Main List Section & Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Main Log Table */}
        <div className={`xl:col-span-3 transition-all ${selectedActivity ? 'xl:col-span-3' : 'xl:col-span-4'}`}>
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">User Activity History</h3>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:flex-none md:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by user name, email or action..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl outline-none focus:border-blue-500 transition-colors placeholder:text-slate-450"
                  />
                </div>

                {/* Real Date Range Picker */}
                <div className="flex items-center gap-2 border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl px-2.5 py-1 text-slate-750 dark:text-slate-350">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent border-none text-[11px] font-bold outline-none text-slate-800 dark:text-slate-150 cursor-pointer"
                  />
                  <span className="text-slate-450 font-bold text-xs">-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent border-none text-[11px] font-bold outline-none text-slate-800 dark:text-slate-150 cursor-pointer"
                  />
                </div>

                {/* Action Filter */}
                <select
                  value={actionFilter}
                  onChange={(e) => {
                    setActionFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-[11px] font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-955 rounded-xl px-2.5 py-1.5 text-slate-750 dark:text-slate-350 outline-none cursor-pointer"
                >
                  <option value="All">All Actions</option>
                  <option value="Login">Login</option>
                  <option value="Update">Update</option>
                  <option value="Create">Create</option>
                  <option value="Delete">Delete</option>
                  <option value="Login Failed">Login Failed</option>
                  <option value="Permission Change">Permission Change</option>
                  <option value="Logout">Logout</option>
                </select>


              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">
                    <th className="pb-3 pt-1">User</th>
                    <th className="pb-3 pt-1">Action</th>
                    <th className="pb-3 pt-1">Description</th>
                    <th className="pb-3 pt-1">IP Address</th>
                    <th className="pb-3 pt-1">Location</th>
                    <th className="pb-3 pt-1">Device / Browser</th>
                    <th className="pb-3 pt-1">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-855 font-bold">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                          <span>Loading activities from server...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                        No activities matching search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedActivities.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedActivity(a)}
                        className={`cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-805/10 transition-colors ${selectedActivity?.id === a.id ? 'bg-slate-50 dark:bg-slate-900/40' : ''
                          }`}
                      >
                        {/* User */}
                        <td className="py-3 flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs ${a.color} shrink-0`}>
                            {a.initial}
                          </div>
                          <div className="min-w-0">
                            <span className="text-slate-800 dark:text-slate-205 block text-xs font-bold leading-normal truncate">{a.name}</span>
                            <span className="text-[10px] text-slate-400 font-semibold block truncate leading-normal mt-0.5">{a.email}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3">
                          {getActionBadge(a.action)}
                        </td>

                        {/* Description */}
                        <td className="py-3 text-slate-655 dark:text-slate-400 text-xs font-medium max-w-[200px] truncate">
                          {a.desc}
                        </td>

                        {/* IP */}
                        <td className="py-3 font-mono text-slate-500 text-xs">
                          {a.ip}
                        </td>

                        {/* Location */}
                        <td className="py-3 text-slate-600 dark:text-slate-400 text-xs">
                          {a.loc}
                        </td>

                        {/* Device */}
                        <td className="py-3 text-slate-550 dark:text-slate-400 text-xs font-medium">
                          {a.device}
                        </td>

                        {/* Time */}
                        <td className="py-3 text-slate-500 dark:text-slate-505 text-xs font-semibold">
                          {a.time}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredActivities.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t dark:border-slate-800">
                <span className="text-[10.5px] font-bold text-slate-455">
                  Showing {(currentPageIndex - 1) * pageSize + 1} to {Math.min(currentPageIndex * pageSize, filteredActivities.length)} of {filteredActivities.length} activities
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
                        className={`h-7 w-7 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer ${pageNum === currentPageIndex
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
        </div>

        {/* Sidebar Activity Details Drawer */}
        {selectedActivity && (
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 text-left h-fit relative">
            <button
              onClick={() => setSelectedActivity(null)}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="pb-3 border-b dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-450">Activity Details</h3>
            </div>

            {/* Profile Block */}
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-full flex items-center justify-center font-black text-sm ${selectedActivity.color} shrink-0`}>
                {selectedActivity.initial}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 block leading-tight">{selectedActivity.name}</span>
                <span className="text-[10px] text-slate-450 font-semibold block mt-0.5 truncate leading-tight">{selectedActivity.email}</span>
                <Badge className="bg-emerald-50 text-emerald-705 border-0 font-extrabold text-[9px] mt-1.5 py-0 px-1.5">Active</Badge>
              </div>
            </div>

            {/* Properties */}
            <div className="space-y-3.5 text-xs font-bold pt-1">
              <div className="flex justify-between items-start">
                <span className="text-slate-450 shrink-0">Action</span>
                <span className="text-right text-slate-800 dark:text-slate-205">{selectedActivity.action}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-455 shrink-0">Description</span>
                <span className="text-right text-slate-655 dark:text-slate-355 font-medium max-w-[150px] leading-relaxed">{selectedActivity.desc}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-450 shrink-0">Date & Time</span>
                <span className="text-right text-slate-500 dark:text-slate-400 font-semibold">{selectedActivity.time}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-455 shrink-0">IP Address</span>
                <span className="text-right font-mono text-slate-505">{selectedActivity.ip}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-450 shrink-0">Location</span>
                <span className="text-right text-slate-700 dark:text-slate-300">{selectedActivity.loc}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-455 shrink-0">Device / Browser</span>
                <span className="text-right text-slate-550 dark:text-slate-405 font-medium">{selectedActivity.device}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-450 shrink-0">Session ID</span>
                <span className="text-right font-mono text-[10px] text-slate-450 truncate max-w-[130px]">{selectedActivity.sessionId}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-455 shrink-0">Login Method</span>
                <span className="text-right text-slate-650">{selectedActivity.loginMethod}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-450 shrink-0">MFA Used</span>
                <span className="text-right text-slate-800 dark:text-slate-205 flex items-center gap-1">
                  {selectedActivity.mfaUsed === 'Yes' ? '🟢 Yes' : '🔴 No'}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-slate-455 shrink-0">Status</span>
                <span className={`text-right ${selectedActivity.status === 'Success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {selectedActivity.status}
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-3.5 pt-4 border-t dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-450">Additional Information</h4>
              <div className="space-y-3 text-[11px] font-bold">
                <div className="space-y-1">
                  <span className="text-slate-450 text-[10px] block">User Agent</span>
                  <p className="text-slate-500 dark:text-slate-400 leading-normal font-medium bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border dark:border-slate-850 break-words font-mono text-[9.5px]">
                    {selectedActivity.userAgent}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-455 text-[10px] block">Referrer</span>
                  <p className="text-slate-550 dark:text-slate-400 font-mono text-[10px] truncate">{selectedActivity.referrer}</p>
                </div>
              </div>
            </div>

            {/* View Profile */}
            <div className="pt-2">
              <Button
                onClick={() => toast.success(`Viewing profile of ${selectedActivity.name}`)}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <User className="h-4 w-4" /> View User Profile
              </Button>
            </div>

          </div>
        )}
      </div>

      {/* Activity Summary (This Week) */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-4 text-left">Activity Summary (This Week)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Logins', key: 'logins', icon: Key, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-955/20' },
            { label: 'Updates', key: 'updates', icon: Settings, color: 'bg-blue-50 text-blue-600 dark:bg-blue-955/20' },
            { label: 'Creates', key: 'creates', icon: UserPlus, color: 'bg-purple-50 text-purple-650 dark:bg-purple-955/20' },
            { label: 'Deletes', key: 'deletes', icon: UserMinus, color: 'bg-red-50 text-red-600 dark:bg-red-955/20' },
            { label: 'Permission Changes', key: 'permission_changes', icon: Shield, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-955/20' },
            { label: 'Password Changes', key: 'password_changes', icon: Lock, color: 'bg-amber-50 text-amber-600 dark:bg-amber-955/20' }
          ].map((stat, i) => {
            const data = activitySummary[stat.key] || { count: 0, percentage: 0, trend: 'neutral' };
            const isUp = data.trend === 'up';
            const isDown = data.trend === 'down';

            return (
              <div key={i} className="border dark:border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-455 uppercase tracking-wider">{stat.label}</span>
                  <div className={`p-1.5 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-black text-slate-850 dark:text-slate-105">{data.count?.toLocaleString() ?? '0'}</span>
                  <span className={`text-[9.5px] font-bold flex items-center gap-0.5 mt-1 ${isUp ? 'text-emerald-600' : isDown ? 'text-red-600' : 'text-slate-500'}`}>
                    {isUp ? <ArrowUpRight className="h-3 w-3" /> : isDown ? <ArrowDownRight className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-0.5 inline-block" />}
                    {data.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
