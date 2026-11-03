'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useLicenseStore } from '@/store/useLicenseStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function LicenseListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { licenses, deleteLicense } = useLicenseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter(item => {
      const matchesSearch =
        item.currentPlan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.justification.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [licenses, searchTerm, statusFilter]);

  // Paginated licenses
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage) || 1;
  const paginatedLicenses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredLicenses.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredLicenses, currentPage]);

  const handleDelete = (id: string) => {
    deleteLicense(id);
    toast.success(`License request "${id}" has been deleted.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
            Active
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
            Pending Approval
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800">
            Rejected
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

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            CRM License Requests
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>Administration</span>
            <span>/</span>
            <span>Add-ons</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">CRM License Request</span>
          </nav>
        </div>

        <Button
          onClick={() => router.push('/add-ons/crm-license-request/create')}
          style={{ backgroundColor: primaryColor }}
          className="text-white font-bold gap-2 rounded-xl h-10 px-4 cursor-pointer shadow-sm hover:opacity-90 border-none"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New License Request</span>
        </Button>
      </div>

      {/* Directory Content Card */}
      <Card className="border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">License Requests</CardTitle>
              <CardDescription className="dark:text-slate-400">Manage, request, and verify team license expansions and allocations.</CardDescription>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-44 h-10 px-3 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                <TableRow className="border-b border-slate-100 dark:border-slate-850">
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 pl-4 w-12 text-center">#</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500">Request ID</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500">Plan</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center">Current</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center text-blue-600 dark:text-blue-400">Additional</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center font-extrabold">Total After</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500">Reason</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center">Start Date</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center">Duration</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center">Status</TableHead>
                  <TableHead className="py-3 font-bold uppercase text-[10px] tracking-wider text-slate-500 text-center pr-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLicenses.length > 0 ? (
                  paginatedLicenses.map((item, index) => {
                    const absoluteIdx = (currentPage - 1) * itemsPerPage + index + 1;
                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 transition-colors"
                      >
                        <TableCell className="py-3.5 font-mono text-xs text-slate-400 font-bold text-center pl-4">{absoluteIdx}</TableCell>
                        <TableCell className="py-3.5 font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">{item.id}</TableCell>
                        <TableCell className="py-3.5 font-semibold text-xs text-slate-700 dark:text-slate-350">
                          <div className="flex items-center gap-1.5">
                            <FilePlus2 className="h-4 w-4 text-emerald-600 dark:text-emerald-450" />
                            <span>{item.currentPlan}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{item.currentLicenses} Users</TableCell>
                        <TableCell className="py-3.5 text-center text-xs font-black text-blue-600 dark:text-blue-400">+{item.additionalLicenses} Users</TableCell>
                        <TableCell className="py-3.5 text-center text-xs font-black text-slate-850 dark:text-white bg-slate-50/20 dark:bg-slate-850/10 border-x border-slate-100 dark:border-slate-850">{item.totalLicenses} Users</TableCell>
                        <TableCell className="py-3.5 text-xs text-slate-700 dark:text-slate-350 font-bold">{item.reason}</TableCell>
                        <TableCell className="py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{item.startDate}</TableCell>
                        <TableCell className="py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">{item.duration}</TableCell>
                        <TableCell className="py-3.5 text-center">{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="py-3.5 text-center pr-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => router.push(`/add-ons/crm-license-request/${item.id}/edit`)}
                              title="Edit Request"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Delete Request"
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 dark:text-rose-400 cursor-pointer transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="py-10 text-center text-slate-400 dark:text-slate-500 font-semibold">
                      No license requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-100 dark:border-slate-850">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Showing {filteredLicenses.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredLicenses.length)} of {filteredLicenses.length} entries
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
