'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getAdditionalLicenseRequestListAPI } from '@/service/api/add-ons/superadmin-addon/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { FilterPopover, FilterField } from '@/components/ui/FilterPopover';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AddReduceUsersListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState({
    Licensereqid: '',
    Subscription_Id: '',
    fromdate: '',
    todate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 8;

  const fetchRecords = async (query: string = '', currentFilters = filterState) => {
    setLoading(true);
    try {
      const response = await getAdditionalLicenseRequestListAPI(currentPage);
      if (response?.results) {
        setRecords(response.results);
        setTotalCount(response.count || 0);
      } else {
        setRecords([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching license requests:', error);
      toast.error('Failed to fetch user adjustment requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRecords(searchTerm, filterState);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, filterState, currentPage]);

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete request ${id}?`)) {
      toast.success(`Request ${id} deletion is not connected to API yet.`);
    }
  };

  const getStatusBadge = (status: any) => {
    if (status === true || status === 'Completed' || status === 'Active' || status?.toLowerCase() === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-955/40 text-emerald-755 border border-emerald-100 dark:border-emerald-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active
        </span>
      );
    } else if (status === false || status === 'Pending' || status?.toLowerCase() === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-955/40 text-amber-755 border border-amber-100 dark:border-amber-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-955/40 text-rose-755 border border-rose-100 dark:border-rose-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Cancelled
        </span>
      );
    }
  };

  const columns: ColumnConfig<any>[] = [
    {
      key: 'RequestDate',
      header: 'Date',
      render: (item) => (
        <span className="text-slate-650">{item.RequestDate}</span>
      ),
    },
    {
      key: 'Licensereqid',
      header: 'Request No',
      render: (item) => (
        <span className="font-bold text-slate-900 dark:text-white">{item.Licensereqid}</span>
      ),
    },
    {
      key: 'Planname',
      header: 'Plan Name',
      render: (item) => (
        <span className="font-semibold text-slate-650">{item.Planname}</span>
      ),
    },
    {
      key: 'Subscription_Id',
      header: 'Subscription Id',
      render: (item) => (
        <span className="text-slate-550">{item.Subscription_Id?.Subscription_Id || 'N/A'}</span>
      ),
    },
    {
      key: 'TotalUserLicense',
      header: 'Total User License',
      render: (item) => (
        <span className="font-semibold text-slate-650">{item.Subscription_Id?.Base_Users || 0}</span>
      ),
    },
    {
      key: 'Requestedusers',
      header: 'Requested License',
      render: (item) => (
        <span className="font-semibold text-slate-550">{item.Requestedusers || 0}</span>
      ),
    },
    {
      key: 'UserPerAmount',
      header: 'Rate',
      render: (item) => (
        <span className="font-semibold text-slate-650">{item.Currency_code} {item.UserPerAmount || 0}</span>
      ),
    },
    {
      key: 'UserTotalAmount',
      header: 'Total Amount',
      render: (item) => (
        <span className="font-semibold text-slate-650">{item.Currency_code} {item.UserTotalAmount || 0}</span>
      ),
    },
    {
      key: 'Requested_By',
      header: 'Requested By',
      render: (item) => (
        <span className="text-slate-650">{item.Requested_By}</span>
      ),
    },
    {
      key: 'sync_status',
      header: 'Status',
      render: (item) => getStatusBadge(item.sync_status),
    },
  ];

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Top Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl w-full sm:w-auto flex-1">
          <div className="p-3 bg-blue-50 dark:bg-blue-955/40 rounded-full shrink-0 border border-blue-100 dark:border-blue-900/50">
            <Sparkles className="h-6 w-6 text-blue-650 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              User Adjustment Requests
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage and track add/reduce user requests on subscription instances
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => router.push('/add-ons/add-reduce-users/create')}
            style={{ backgroundColor: primaryColor }}
            className="h-10 px-4 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-all border-none gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add/Reduce Users</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              placeholder="Search by Instance or Plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs font-semibold rounded-xl pl-9 h-10"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <FilterPopover
              triggerLabel="Filter"
              fields={[
                {
                  id: 'Licensereqid',
                  label: 'License Req ID',
                  type: 'text',
                  value: filterState.Licensereqid,
                  onChange: (val) => setFilterState((prev) => ({ ...prev, Licensereqid: val })),
                  placeholder: 'e.g. AC1000...',
                },
                {
                  id: 'Subscription_Id',
                  label: 'Subscription ID',
                  type: 'text',
                  value: filterState.Subscription_Id,
                  onChange: (val) => setFilterState((prev) => ({ ...prev, Subscription_Id: val })),
                  placeholder: 'e.g. SUB...',
                },
                {
                  id: 'fromdate',
                  label: 'From Date',
                  type: 'date',
                  value: filterState.fromdate,
                  onChange: (val) => setFilterState((prev) => ({ ...prev, fromdate: val })),
                },
                {
                  id: 'todate',
                  label: 'To Date',
                  type: 'date',
                  value: filterState.todate,
                  onChange: (val) => setFilterState((prev) => ({ ...prev, todate: val })),
                },
              ]}
              onClear={() => setFilterState({ Licensereqid: '', Subscription_Id: '', fromdate: '', todate: '' })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Requests Table Card */}
      <Card className="border border-slate-100 dark:border-slate-855 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-0">
          <ReusableTable<any>
            data={records}
            columns={columns}
            loading={loading}
            page={currentPage}
            onChangePage={(p) => setCurrentPage(p)}
            totalRecords={totalCount}
            pageSize={itemsPerPage}
            borderless
            rowKey="id"
            onRowClick={(row) => router.push(`/add-ons/add-reduce-users/${row.id}/edit`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
