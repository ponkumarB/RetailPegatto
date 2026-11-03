'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getAdditionalSubscriptionRequestList } from '@/service/api/add-ons/superadmin-addon/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Puzzle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AddonListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 8;

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Hardcoded customer_id=5 for now as per instructions
      const response = await getAdditionalSubscriptionRequestList(5, currentPage);
      
      if (response?.results) {
        setPurchaseRequests(response.results);
        setTotalCount(response.count || 0);
        setTotalPages(Math.ceil((response.count || 0) / itemsPerPage) || 1);
      } else if (response?.data) {
        setPurchaseRequests(response.data);
        setTotalCount(response.data.length);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage) || 1);
      } else if (Array.isArray(response)) {
        setPurchaseRequests(response);
        setTotalCount(response.length);
        setTotalPages(Math.ceil(response.length / itemsPerPage) || 1);
      } else {
        setPurchaseRequests([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching addon purchase requests:', error);
      toast.error('Failed to fetch addon purchase requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequests();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm]);

  const handleDelete = (id: string, name: string) => {
    // deleteAddon(id);
    toast.success(`Purchase request for "${name}" deletion is not connected to API yet.`);
  };

  const getStatusBadge = (status: any) => {
    // Handle different status types
    if (status === true || status === 'Active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
          {typeof status === 'string' ? status : 'Pending'}
        </span>
      );
    }
  };

  const columns: ColumnConfig<any>[] = [
    {
      key: 'Created_Date',
      header: 'Date',
      render: (item) => {
        const dateStr = item.Created_Date || item.RequestDate;
        return <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
          {dateStr ? new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
        </span>;
      },
    },
    {
      key: 'Addonsubscriptionid',
      header: 'Request No',
      render: (item) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{item.Addonsubscriptionid || 'N/A'}</span>
      ),
    },
    {
      key: 'Addon_Name',
      header: 'Addon Name',
      render: (item) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {item.addonMasterid?.Addon_Name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'Requestedaddon',
      header: 'Quantity',
      render: (item) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{item.Requestedaddon}</span>
      ),
    },
    {
      key: 'Rate',
      header: 'Rate',
      render: (item) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
          {item.Currency_code} {item.addonPerAmount}
        </span>
      ),
    },
    {
      key: 'Total Amount',
      header: 'Total Amount',
      render: (item) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
          {item.Currency_code} {item.addonTotalAmount}
        </span>
      ),
    },
    {
      key: 'Requested_By',
      header: 'Requested By',
      render: (item) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{item.Requested_By}</span>
      ),
    },
    {
      key: 'Status',
      header: 'Status',
      render: (item) => getStatusBadge(item.sync_status || item.Status),
    },
    /* {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/add-ons/add-on-purchase/${item.id}/edit`);
            }}
            title="Edit Request"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id, item.Addon_Name?.Name);
            }}
            title="Delete Request"
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 dark:text-rose-400 cursor-pointer transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }, */
  ];

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Add-on Applications
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>Administration</span>
            <span>/</span>
            <span>Add-ons</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Add-on Purchase</span>
          </nav>
        </div>

        <Button
          onClick={() => router.push('/add-ons/add-on-purchase/create')}
          style={{ backgroundColor: primaryColor }}
          className="text-white font-bold gap-2 rounded-xl h-10 px-4 cursor-pointer shadow-sm hover:opacity-90 border-none"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Purchase Request</span>
        </Button>
      </div>

      {/* Directory Content Card */}
      <Card className="border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">Purchase Requests</CardTitle>
              <CardDescription className="dark:text-slate-400">Track and manage your requested and active CRM capabilities enhancements.</CardDescription>
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
                  }}
                  className="pl-9 h-10 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
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
          <ReusableTable<any> 
            data={purchaseRequests}
            columns={columns}
            loading={loading}
            page={currentPage}
            onChangePage={(p) => setCurrentPage(p)}
            totalRecords={totalCount}
            pageSize={itemsPerPage}
            borderless
            rowKey="id"
            // emptyMessage="No purchase requests found." // Handled by ReusableTable internally
            onRowClick={(row) => router.push(`/add-ons/add-on-purchase/${row.id}/edit`)}
          />
        </CardContent>
      </Card>
      
    </div>
  );
}
