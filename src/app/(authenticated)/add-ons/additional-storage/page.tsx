'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { userAddStorageList, addStorageSearch, addStorageFilter, deleteAddStorageRequest } from '@/service/api/add-ons/additionstorage-api';
import { getAdditionalStorageRequestList } from '@/service/api/add-ons/superadmin-addon/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { FilterPopover, FilterField } from '@/components/ui/FilterPopover';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  HardDrive,
  CloudLightning,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function StorageListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const [storageRequests, setStorageRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState({
    AddStorageRequestKey: '',
    Subscription_Id: '',
    fromdate: '',
    todate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 8;
  const [totalCount, setTotalCount] = useState(0);

  const fetchRequests = async (currentFilters = filterState) => {
    setLoading(true);
    try {
      const hasFilters = currentFilters.AddStorageRequestKey || currentFilters.Subscription_Id || currentFilters.fromdate || currentFilters.todate;
      
      let response;
      if (hasFilters) {
        response = await addStorageFilter({
          AddStorageRequestKey: currentFilters.AddStorageRequestKey,
          Subscription_Id: currentFilters.Subscription_Id,
          fromdate: currentFilters.fromdate,
          todate: currentFilters.todate,
          Created_By: 1,
        });
      } else if (searchTerm) {
        response = await addStorageSearch(searchTerm);
      } else {
        // Fallback to fetching via new customer wise list API
        response = await getAdditionalStorageRequestList(5, currentPage);
      }

      if (response?.results) {
        setStorageRequests(response.results);
        setTotalCount(response.count || 0);
        setTotalPages(Math.ceil((response.count || 0) / itemsPerPage) || 1);
      } else if (response?.data) {
        setStorageRequests(response.data);
        setTotalCount(response.data.length);
        setTotalPages(Math.ceil(response.data.length / itemsPerPage) || 1);
      } else if (Array.isArray(response)) {
        setStorageRequests(response);
        setTotalCount(response.length);
        setTotalPages(Math.ceil(response.length / itemsPerPage) || 1);
      } else {
        setStorageRequests([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching storage requests:', error);
      toast.error('Failed to fetch storage requests');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRequests(filterState);
  }, [currentPage, filterState, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAddStorageRequest(id);
      toast.success(`Storage request "${id}" has been deleted.`);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to delete storage request');
    }
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

  const columns: ColumnConfig<any>[] = [
    {
      key: 'RequestDate',
      header: 'Date',
      render: (item) => (
        <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">
          {item.RequestDate || '-'}
        </span>
      ),
    },
    {
      key: 'Plan_Name',
      header: 'Plan Name',
      render: (item) => (
        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-700 dark:text-slate-350">
          <span>{item.Planname || item.Plan_Name || item.Plan_Id?.Plan_Name || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'Subscription_Id',
      header: 'Subscription Id',
      render: (item) => (
        <span className="font-semibold text-xs text-slate-700 dark:text-slate-350">
          {item.Subscription_Id?.Subscription_Id || '-'}
        </span>
      ),
    },
    {
      key: 'AllocatedStorage',
      header: 'Current Storage(GB)',
      align: 'center',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          {item.Plan_Id?.AllocatedStorage || item.Subscription_Id?.Basestorage_Size || item.AllocatedStorage || 0}
        </span>
      ),
    },
    {
      key: 'StorageRequested',
      header: 'Add Storage(GB)',
      align: 'center',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          {item.Requestedstorage || item.StorageRequested?.replace(' GB', '') || item.Additionalstorage || 0}
        </span>
      ),
    },
    {
      key: 'Rate',
      header: 'Rate',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          {item.Currency_code || 'INR'} {item.storagePerAmount || 0}
        </span>
      ),
    },
    {
      key: 'TotalAmount',
      header: 'Total Amount',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          {item.Currency_code || 'INR'} {item.storageTotalAmount || 0}
        </span>
      ),
    },
    {
      key: 'Requested_By',
      header: 'Requested By',
      render: (item) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
          {item.Requested_By || '-'}
        </span>
      ),
    },
    {
      key: 'Status',
      header: 'Status',
      align: 'center',
      render: (item) => getStatusBadge(item.sync_status || item.Status || 'Active'),
    },
  ];

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Additional Storage Requests
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>Administration</span>
            <span>/</span>
            <span>Add-ons</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Additional Storage</span>
          </nav>
        </div>

        <Button
          onClick={() => router.push('/add-ons/additional-storage/create')}
          style={{ backgroundColor: primaryColor }}
          className="text-white font-bold gap-2 rounded-xl h-10 px-4 cursor-pointer shadow-sm hover:opacity-90 border-none"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Storage Request</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">Storage Requests</CardTitle>
              <CardDescription className="dark:text-slate-400">Manage, request, and verify team storage expansions and cloud allocations.</CardDescription>
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

              <FilterPopover
                triggerLabel="Filter"
                fields={[
                  {
                    id: 'AddStorageRequestKey',
                    label: 'Request ID',
                    type: 'text',
                    value: filterState.AddStorageRequestKey,
                    onChange: (val) => setFilterState((prev) => ({ ...prev, AddStorageRequestKey: val })),
                    placeholder: 'e.g. REQ...',
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
                onClear={() => setFilterState({ AddStorageRequestKey: '', Subscription_Id: '', fromdate: '', todate: '' })}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <ReusableTable<any>
            columns={columns}
            data={storageRequests}
            loading={loading}
            page={currentPage}
            onChangePage={(p) => setCurrentPage(p)}
            totalRecords={totalCount}
            pageSize={itemsPerPage}
            borderless
            rowKey="id"
          />
        </CardContent>
      </Card>
      
    </div>
  );
}
