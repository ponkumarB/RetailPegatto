'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useIncreaseWorkspaceStore } from '@/store/useIncreaseWorkspaceStore';
import { IncreaseWorkspaceRecord } from '@/types/increase-workspace';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Database,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  HardDrive
} from 'lucide-react';
import { toast } from 'sonner';

export default function IncreaseWorkspaceListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { records, deleteRecord } = useIncreaseWorkspaceStore();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete request ${id}?`)) {
      deleteRecord(id);
      toast.success(`Request ${id} deleted successfully.`);
    }
  };

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.instanceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.instanceDomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.databaseSchema.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: IncreaseWorkspaceRecord['status']) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-955/40 text-emerald-755 border border-emerald-100 dark:border-emerald-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-955/40 text-amber-755 border border-amber-100 dark:border-amber-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Approval
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-955/40 text-rose-755 border border-rose-100 dark:border-rose-900/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Cancelled
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
          <div className="p-3 bg-blue-50 dark:bg-blue-955/40 rounded-full shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Database className="h-6 w-6 text-blue-650 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Workspace Expansion Requests
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track database schema workspace expansion adjustments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => router.push('/add-ons/increase-workspace/create')}
            style={{ backgroundColor: primaryColor }}
            className="h-10 px-4 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-all border-none gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Increase Workspace</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              placeholder="Search by Instance or Schema..."
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
              className="px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table Card */}
      <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-4 px-5">ID</th>
                <th className="py-4 px-5">Instance</th>
                <th className="py-4 px-5">Database Schema</th>
                <th className="py-4 px-5">Current Size</th>
                <th className="py-4 px-5">Additional Space</th>
                <th className="py-4 px-5">New Size</th>
                <th className="py-4 px-5">DB Server</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-855 font-medium text-slate-700 dark:text-slate-300">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                      {rec.id}
                    </td>
                    <td className="py-4 px-5">
                      <div className="space-y-0.5 max-w-[280px]">
                        <span className="font-extrabold text-slate-900 dark:text-white block hover:underline cursor-pointer" onClick={() => router.push(`/add-ons/increase-workspace/${rec.id}/edit`)}>
                          {rec.instanceName}
                        </span>
                        <span className="text-[10px] text-slate-450 block truncate">
                          {rec.instanceDomain}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-500">
                      {rec.databaseSchema}
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-550">
                      {rec.currentSizeGb} GB
                    </td>
                    <td className="py-4 px-5 font-extrabold text-emerald-600 dark:text-emerald-450">
                      +{rec.additionalSizeGb} GB
                    </td>
                    <td className="py-4 px-5 font-semibold text-slate-550">
                      {rec.newSizeGb} GB
                    </td>
                    <td className="py-4 px-5 text-slate-500 font-semibold">
                      {rec.databaseServer}
                    </td>
                    <td className="py-4 px-5">
                      {getStatusBadge(rec.status)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/add-ons/increase-workspace/${rec.id}/edit`)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-955/30 rounded-lg"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rec.id)}
                          className="h-8 w-8 text-rose-550 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/30 rounded-lg"
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
                    No workspace requests found matching filters.
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
