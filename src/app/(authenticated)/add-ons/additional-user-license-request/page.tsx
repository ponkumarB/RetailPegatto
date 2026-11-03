'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAdditionalUserLicenseStore } from '@/store/useAdditionalUserLicenseStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  UserCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserLicenseListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { requests, deleteRequest } = useAdditionalUserLicenseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(item => {
      const matchesSearch =
        item.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.primaryContact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // Paginated requests
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage) || 1;
  const paginatedRequests = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const handleDelete = (id: string) => {
    deleteRequest(id);
    toast.success(`User license request "${id}" has been deleted.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
            {status}
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
            Pending Approval
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
            Additional User License Requests
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>Administration</span>
            <span>/</span>
            <span>Add-ons</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Additional User License Request</span>
          </nav>
        </div>

        <Button
          onClick={() => router.push('/add-ons/additional-user-license-request/create')}
          style={{ backgroundColor: primaryColor }}
          className="text-white font-bold gap-2 rounded-xl h-10 px-4 cursor-pointer shadow-sm hover:opacity-90 border-none"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Request</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">License Requests</CardTitle>
              <CardDescription className="dark:text-slate-400">Manage, request, and verify team additional user license allocations.</CardDescription>
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
                className="h-10 text-xs px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-305 outline-none cursor-pointer w-full sm:w-40 font-bold"
              >
                <option value="All">All Statuses</option>
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
                <TableRow className="border-slate-100 dark:border-slate-850">
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs py-3.5">ID</TableHead>
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">Organization</TableHead>
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">Primary Contact</TableHead>
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">Licenses</TableHead>
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">Request Type</TableHead>
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">Effective From</TableHead>
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">Status</TableHead>
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs">Created At</TableHead>
                  <TableHead className="font-extrabold text-slate-700 dark:text-slate-300 text-xs text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-xs font-semibold text-slate-400">
                      No additional user license requests found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRequests.map((item) => (
                    <TableRow key={item.id} className="border-slate-100 dark:border-slate-850 hover:bg-slate-50/30 dark:hover:bg-slate-900/10">
                      <TableCell className="font-extrabold text-xs text-slate-900 dark:text-white py-3.5">{item.id}</TableCell>
                      <TableCell className="font-semibold text-xs text-slate-700 dark:text-slate-300">{item.organization}</TableCell>
                      <TableCell className="font-medium text-xs text-slate-600 dark:text-slate-400">{item.primaryContact}</TableCell>
                      <TableCell className="font-extrabold text-xs text-blue-600 dark:text-blue-400">{item.additionalLicenses} Users</TableCell>
                      <TableCell className="font-medium text-xs text-slate-605 dark:text-slate-405">{item.requestType}</TableCell>
                      <TableCell className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                        {item.requiredFromDate ? item.requiredFromDate.split('-').reverse().join('/') : ''}
                      </TableCell>
                      <TableCell className="text-xs">{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="font-medium text-xs text-slate-450 dark:text-slate-500">{item.createdAt}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => router.push(`/add-ons/additional-user-license-request/${item.id}/edit`)}
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Row */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-850">
              <span className="text-xs font-semibold text-slate-400">
                Showing {Math.min(filteredRequests.length, (currentPage - 1) * itemsPerPage + 1)} to{' '}
                {Math.min(filteredRequests.length, currentPage * itemsPerPage)} of {filteredRequests.length} requests
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold px-2">{currentPage} / {totalPages}</span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
