'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useCallStore } from '@/store/useCallStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Download,
  Filter,
  Plus,
  Search,
  MoreVertical,
  ChevronDown,
  CalendarCheck,
  User,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { fetchCallAssignmentListDetails } from '@/service/api/CallCenter/api';

// Format helper for dates
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

// Team members avatar mapping for visual excellence
const TEAM_AVATARS: Record<string, string> = {
  'Sarah Miller': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
  'Mike Johnson': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
  'Emily Davis': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
  'David Wilson': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80'
};

export default function CallListDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { primaryColor } = useStore();
  const { callLists, updateCallList } = useCallStore();

  const listId = params.id as string;
  const [listData, setListData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for the scheduled calls table
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    let active = true;
    const loadListDetails = async () => {
      if (!listId) return;
      setLoading(true);
      try {
        const response = await fetchCallAssignmentListDetails(Number(listId));
        if (active && response && response.results && response.results.length > 0) {
          const item = response.results[0];
          const mapped = {
            id: String(item.id),
            name: item.ListName || 'Unnamed List',
            callListId: item.ContactListId || 'N/A',
            totalLeads: item.TotalLeads || 0,
            description: item.Description || 'No description provided',
            createdBy: String(item.Created_By || 'N/A'),
            createdOn: formatDate(item.Created_Date),
            completed: (item.ListIndustry || []).filter((lead: any) => lead.Call_Status === 'Completed').length,
            pending: (item.ListIndustry || []).filter((lead: any) => lead.Call_Status === 'Pending' || lead.Call_Status === 'Unassigned').length,
            overdue: (item.ListIndustry || []).filter((lead: any) => lead.Call_Status === 'Overdue').length,
            scheduledCalls: (item.ListIndustry || []).map((lead: any) => ({
              id: String(lead.id || lead.Assign_Id || Math.random()),
              leadName: lead.Lead_Name || 'N/A',
              company: lead.Company || '-',
              phone: lead.Phone_No || '-',
              email: lead.Email || '-',
              nextCallDateTime: lead.Call_Date || item.Call_Date || '-',
              assignedTo: lead.Assign_Name || 'Unassigned',
              status: lead.Call_Status || 'Pending'
            }))
          };
          setListData(mapped);
        } else if (active) {
          const fallbackList = callLists.find(cl => cl.id === listId);
          if (fallbackList) {
            setListData(fallbackList);
          }
        }
      } catch (err) {
        console.error('Error fetching call assignment details:', err);
        const fallbackList = callLists.find(cl => cl.id === listId);
        if (fallbackList) {
          setListData(fallbackList);
        } else {
          toast.error('Failed to load call list details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadListDetails();
    return () => {
      active = false;
    };
  }, [listId, callLists]);

  // Filter scheduled calls
  const filteredCalls = useMemo(() => {
    if (!listData?.scheduledCalls) return [];
    return listData.scheduledCalls.filter(call => {
      const matchesSearch =
        call.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.phone.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAssigned = assignedFilter === 'All' || call.assignedTo === assignedFilter;
      const matchesStatus = statusFilter === 'All' || call.status === statusFilter;

      return matchesSearch && matchesAssigned && matchesStatus;
    });
  }, [listData, searchTerm, assignedFilter, statusFilter]);

  // Paginated calls
  const totalPages = Math.ceil(filteredCalls.length / itemsPerPage);
  const paginatedCalls = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredCalls.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredCalls, currentPage]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setAssignedFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
    toast.info('Filters cleared');
  };

  const handleAddNextCall = () => {
    toast.success('Redirecting to add a call log...');
  };

  const handleExport = () => {
    toast.success('Scheduled calls details exported successfully.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
            Scheduled
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
            Pending
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
            Completed
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100 dark:bg-slate-900/30 dark:text-slate-350 dark:border-slate-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!listData) {
    return (
      <div className="py-20 text-center font-bold text-slate-500">
        Call list not found.
      </div>
    );
  }

  const list = listData;

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Breadcrumbs & Actions Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/call-management/call-lists')}
            className="h-9 w-9 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 gap-2 items-center">
            <span className="hover:underline cursor-pointer" onClick={() => router.push('/')}>Home</span>
            <span>/</span>
            <span className="hover:underline cursor-pointer" onClick={() => router.push('/call-management/call-lists')}>Call Lists</span>
            <span>/</span>
            <span className="text-green-600 dark:text-green-400 font-bold font-mono">{list.callListId}</span>
            <span>/</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">Next Call List Details</span>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border rounded-xl hover:bg-slate-50 text-slate-750 border-slate-200 dark:border-slate-800"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border rounded-xl hover:bg-slate-50 text-slate-750 border-slate-200 dark:border-slate-800"
          >
            <Filter className="h-4 w-4 text-slate-500" />
            <span>Filters</span>
          </Button>
          <Button
            onClick={handleAddNextCall}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-bold gap-1.5 rounded-xl h-9 px-3.5 hover:opacity-90 shadow-sm cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Next Call</span>
          </Button>
        </div>
      </div>

      {/* Summary Metadata Card (Stunning visual matching) */}
      <Card className="rounded-2xl border-slate-100 dark:border-slate-850 overflow-hidden shadow-xs bg-white dark:bg-slate-900/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            
            {/* Column 1 */}
            <div className="space-y-4 border-r border-slate-100 dark:border-slate-800/80 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Call List Name</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">{list.name}</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Call List ID</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono mt-1">{list.callListId}</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Leads</span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350 mt-1">{list.totalLeads}</span>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4 border-r border-slate-100 dark:border-slate-800/80 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Next Calls</span>
                <span className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">{list.scheduledCalls.length}</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Completed</span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{list.completed}</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 mt-1">{list.pending}</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Overdue</span>
                <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 mt-1">{list.overdue}</span>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-4 border-r border-slate-100 dark:border-slate-800/80 pr-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Created By</span>
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-1">{list.createdBy}</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Created On</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350 font-mono mt-1">{list.createdOn}</span>
              </div>
            </div>

            {/* Column 4 - Description */}
            <div className="flex flex-col text-left h-full">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Description</span>
              <p className="text-xs font-medium text-slate-650 dark:text-slate-350 leading-relaxed mt-2 bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 flex-1">
                {list.description}
              </p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Datagrid & Filters Card */}
      <Card className="rounded-2xl border-slate-100 dark:border-slate-850 overflow-hidden shadow-xs bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          
          {/* Quick Filters Row */}
          <div className="p-4 flex flex-col sm:flex-row flex-wrap items-center gap-3 border-b border-slate-100 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/10">
            
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by lead name, company, email, phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800"
              />
            </div>



            {/* Assigned To dropdown */}
            <div className="w-full sm:w-40 text-left">
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Assigned To</label>
              <Select value={assignedFilter} onValueChange={(val) => { setAssignedFilter(val || 'All'); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-slate-250 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <SelectItem value="All">All Owners</SelectItem>
                  <SelectItem value="Sarah Miller">Sarah Miller</SelectItem>
                  <SelectItem value="Mike Johnson">Mike Johnson</SelectItem>
                  <SelectItem value="Emily Davis">Emily Davis</SelectItem>
                  <SelectItem value="David Wilson">David Wilson</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status dropdown */}
            <div className="w-full sm:w-36 text-left">
              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Status</label>
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || 'All'); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold border-slate-250 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Button */}
            <div className="pt-4">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="h-9 text-xs font-semibold px-4 border rounded-xl hover:bg-slate-50 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                Clear
              </Button>
            </div>

          </div>

          {/* Scheduled Calls List Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                <TableRow className="border-b border-slate-100 dark:border-slate-850">
                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500 pl-4 w-12 text-center">#</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500">Lead Name</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500">Company</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500">Phone</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500">Email</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500 text-center">Next Call Date & Time</TableHead>

                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500">Assigned To</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500 text-center">Status</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[9px] tracking-wider text-slate-500 text-center pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCalls.length > 0 ? (
                  paginatedCalls.map((call, index) => {
                    const absoluteIdx = (currentPage - 1) * itemsPerPage + index + 1;
                    const avatar = TEAM_AVATARS[call.assignedTo] || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80';

                    return (
                      <TableRow
                        key={call.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 transition-colors"
                      >
                        <TableCell className="py-3 font-mono text-[11px] font-bold text-slate-400 text-center pl-4">{absoluteIdx}</TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                            {call.leadName}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-xs font-semibold text-slate-700 dark:text-slate-300">{call.company}</TableCell>
                        <TableCell className="py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">{call.phone}</TableCell>
                        <TableCell className="py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{call.email}</TableCell>
                        <TableCell className="py-3 text-center text-xs font-bold text-slate-700 dark:text-slate-350 font-mono">
                          {call.nextCallDateTime}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <img
                              src={avatar}
                              alt={call.assignedTo}
                              className="h-6 w-6 rounded-full object-cover shrink-0 border border-slate-100 dark:border-slate-800"
                            />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                              {call.assignedTo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">{getStatusBadge(call.status)}</TableCell>
                        <TableCell className="py-3 text-center pr-4">
                          <button className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-pointer">
                            <MoreVertical className="h-4.5 w-4.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">
                      No scheduled calls matched current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-850">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Showing {filteredCalls.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredCalls.length)} of {filteredCalls.length} entries
            </span>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-2.5 py-1 text-xs border rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors border-slate-200 dark:border-slate-800"
                >
                  ←
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-xs border rounded-lg cursor-pointer transition-colors ${
                      currentPage === page
                        ? 'bg-green-500 text-white border-green-500 dark:bg-green-600 dark:border-green-600 font-extrabold'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-2.5 py-1 text-xs border rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors border-slate-200 dark:border-slate-800"
                >
                  →
                </button>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

    </div>
  );
}
