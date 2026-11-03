'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useTroubleshootGuides, useDeleteTroubleshootGuide, useFilterTroubleshootGuides, useSearchTroubleshootGuides } from '@/service/api/TroubleshootGuide/queries';
import { TroubleshootGuide } from '@/service/api/TroubleshootGuide/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function TroubleshootGuideListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Queries
  const { data: listData, isLoading } = useTroubleshootGuides(1);
  const deleteMutation = useDeleteTroubleshootGuide();

  const handleDelete = async (id: number) => {
    if (confirm(`Are you sure you want to delete guide ${id}?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const guides = listData?.results || [];

  // Client-side filtering logic to handle search and filters
  const filteredGuides = guides.filter((guide) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (guide.ITTroubleShootGuide_Id || '').toLowerCase().includes(term) ||
      guide.Guide_Title.toLowerCase().includes(term) ||
      guide.Guide_Code.toLowerCase().includes(term) ||
      (guide.Description || '').toLowerCase().includes(term) ||
      guide.Applies_To.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'All' || guide.Status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || guide.Priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-955/40 text-emerald-755 border border-emerald-100 dark:border-emerald-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-955/40 text-rose-755 border border-rose-100 dark:border-rose-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {status}
        </span>
      );
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'High':
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-extrabold text-xs">
            <ArrowUp className="h-3.5 w-3.5" />
            {prio}
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 text-amber-500 dark:text-amber-400 font-extrabold text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 text-slate-505 dark:text-slate-400 font-bold text-xs">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl w-full sm:w-auto flex-1">
          <div className="p-3 bg-purple-50 dark:bg-purple-955/40 rounded-full shrink-0 border border-purple-100 dark:border-purple-900/50">
            <Wrench className="h-6 w-6 text-purple-650 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Troubleshoot Guides
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Step-by-step instructions to help resolve recurring system issues quickly
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <nav className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>Problem Management</span>
            <span>&gt;</span>
            <span className="text-purple-650 dark:text-purple-450">Guides</span>
          </nav>

          <Button
            onClick={() => router.push('/problem-management/troubleshoot-guide/create')}
            style={{ backgroundColor: primaryColor }}
            className="h-10 px-4 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-all border-none gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create Guide</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              placeholder="Search guides..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-semibold rounded-xl pl-9 h-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Guides Table Card */}
      <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-4 px-5">ID</th>
                <th className="py-4 px-5">Guide Title</th>
                <th className="py-4 px-5">Code</th>
                <th className="py-4 px-5">Category</th>
                <th className="py-4 px-5">Applies To</th>
                <th className="py-4 px-5">Priority</th>
                <th className="py-4 px-5">Steps</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850 font-medium text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 font-semibold">
                    Loading...
                  </td>
                </tr>
              ) : filteredGuides.length > 0 ? (
                filteredGuides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                      {guide.ITTroubleShootGuide_Id || guide.id}
                    </td>
                    <td className="py-4 px-5">
                      <div className="space-y-0.5 max-w-[280px]">
                        <span className="font-extrabold text-slate-900 dark:text-white block hover:underline cursor-pointer" onClick={() => router.push(`/problem-management/troubleshoot-guide/${guide.id}/edit`)}>
                          {guide.Guide_Title}
                        </span>
                        <span className="text-[10px] text-slate-450 block truncate">
                          {guide.Description}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-650">
                      {guide.Guide_Code}
                    </td>
                    <td className="py-4 px-5 font-semibold">
                      {guide.Category}
                    </td>
                    <td className="py-4 px-5 text-slate-550 font-semibold">
                      {guide.Applies_To}
                    </td>
                    <td className="py-4 px-5">
                      {getPriorityBadge(guide.Priority)}
                    </td>
                    <td className="py-4 px-5 font-extrabold text-purple-650">
                      {guide.Troubleshoot_Steps ? guide.Troubleshoot_Steps.length : 0} steps
                    </td>
                    <td className="py-4 px-5">
                      {getStatusBadge(guide.Status)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/problem-management/troubleshoot-guide/${guide.id}/edit`)}
                          className="h-8 w-8 text-blue-650 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(guide.id as number)}
                          className="h-8 w-8 text-rose-550 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400 dark:text-slate-500 font-semibold">
                    No troubleshoot guides found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
