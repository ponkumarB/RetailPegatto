'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getRenewalRequestList, getRenewalFormData, createUserRenewalRequest } from '@/service/api/add-ons/renewal-api';
import { getTenantSubscriptionListAPI, getRenewalRequestListCusWiseAPI, getPlanListAPI, postRenewalRequestAPI } from '@/service/api/add-ons/superadmin-addon/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Send,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

export default function RenewalListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const [renewals, setRenewals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscriptions Tab State
  const [activeTab, setActiveTab] = useState<'Subscriptions' | 'Order History' | 'Invoice' | 'Payment'>('Subscriptions');
  const [subscriptionsData, setSubscriptionsData] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState<any[]>([
    { id: 1, Invoice_No: 'INV-1001', Customer: 'Astraa Global school', Date: '2026-06-07', Amount: 1179.9882, Status: 'Paid' },
    { id: 2, Invoice_No: 'INV-1002', Customer: 'Tesla', Date: '2026-08-23', Amount: 5000.00, Status: 'Pending Approval' }
  ]);
  const [paymentData, setPaymentData] = useState<any[]>([
    { id: 1, Transaction_ID: 'TXN-998811', Invoice_No: 'INV-1001', Plan_Name: 'Education Plan', Amount: 1179.9882, Payment_Date: '2026-06-07', Method: 'Credit Card', Status: 'Active' },
    { id: 2, Transaction_ID: 'TXN-998812', Invoice_No: 'INV-1002', Plan_Name: 'Enterprise Plan', Amount: 5000.00, Payment_Date: '2026-08-25', Method: 'Bank Transfer', Status: 'Pending Approval' }
  ]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const itemsPerPage = 8;
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [selectedRowForRenewal, setSelectedRowForRenewal] = useState<any>(null);
  const [planList, setPlanList] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [sendingRenewal, setSendingRenewal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await getRenewalRequestListCusWiseAPI(5);
        if (response && response.results) {
          setRenewals(response.results);
        } else if (Array.isArray(response)) {
          setRenewals(response);
        }
      } catch (error) {
        console.error('Error fetching renewal data:', error);
        toast.error('Failed to load renewal requests');
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'Order History') {
      fetchData();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (activeTab !== 'Subscriptions') return;
      if (subscriptionsData.length > 0) return; // already loaded

      setLoadingSubscriptions(true);
      try {
        const response = await getTenantSubscriptionListAPI();
        if (response && response.results) {
          setSubscriptionsData(response.results);
        }
      } catch (error) {
        console.error('Error fetching subscriptions data:', error);
        toast.error('Failed to load subscriptions');
      } finally {
        setLoadingSubscriptions(false);
      }
    };

    fetchSubscriptions();
  }, [activeTab, subscriptionsData.length]);

  // Filter renewals
  const filteredRenewals = useMemo(() => {
    return renewals.filter((item: any) => {
      const planName = item?.Current_Plan || item?.RenewalProducttype || '';
      const status = item?.status || 'Pending';
      
      const matchesSearch =
        item.Renewal_Id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        planName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [renewals, searchTerm, statusFilter]);

  const handleDelete = (id: string) => {
    toast.success(`Renewal request "${id}" action triggered.`);
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
      case 'Renewal Requested':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F59E0B] text-white border border-[#D97706] dark:bg-[#D97706] dark:border-[#B45309]">
            Renewal Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-700 border border-slate-100 dark:bg-slate-900/30 dark:text-slate-350 dark:border-slate-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const columns: ColumnConfig<any>[] = [
    {
      key: 'Created_Date',
      header: 'Renewal Date',
      render: (row) => {
        if (!row.Created_Date) return '-';
        const date = new Date(row.Created_Date);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return <span className="font-mono text-slate-500 dark:text-slate-400">{`${month}/${day}/${year}`}</span>;
      }
    },
    {
      key: 'Renewal_Id',
      header: 'Renewal ID',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400">{row.Renewal_Id}</span>
      )
    },
    {
      key: 'Producttype',
      header: 'Product Type',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400">{row.Producttype || '-'}</span>
      )
    },
    {
      key: 'PlangrossAmount',
      header: 'Renewal Amount',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400">
          INR {Number(row.PlangrossAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
        </span>
      )
    },
    {
      key: 'Requested_By',
      header: 'Requested By',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400">{row.Requested_By || '-'}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => getStatusBadge(row?.status || 'Pending')
    }
  ];

  const renderActions = (row: any) => (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => router.push(`/add-ons/renewal-request/${row.id}/edit`)}
        title="Edit Request"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
      >
        <Edit3 className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleDelete(row.id)}
        title="Delete Request"
        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-500 dark:text-rose-400 cursor-pointer transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const handleRenew = async (row: any) => {
    setSelectedRowForRenewal(row);
    setIsRenewalModalOpen(true);
    setLoadingPlans(true);
    try {
      const res = await getPlanListAPI(1);
      if (res && res.results) {
        setPlanList(res.results);
      }
    } catch (error) {
      console.error('Error fetching plan list:', error);
      toast.error('Failed to load plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedPlanId || !selectedRowForRenewal) {
      toast.error('Please select a plan');
      return;
    }
    
    setSendingRenewal(true);
    const selectedPlan = planList.find(p => p.id === selectedPlanId);
    
    try {
      const unitPrice = selectedPlan?.UnitPrice;
      
      const payload = {
        old_Subscription_id: parseInt(selectedRowForRenewal.Subscription_id, 10),
        new_Subscription_id: parseInt(selectedRowForRenewal.Subscription_id, 10),
        Customer_Id: parseInt(selectedRowForRenewal.Customer_Id, 10),
        Customer_Name: selectedRowForRenewal.Customername || selectedRowForRenewal.Customer_Name,
        Producttype: null,
        PlanNetAmount: unitPrice,
        PlangrossAmount: unitPrice ? unitPrice * 1.18 : null,
        PlanTaxAmount: unitPrice ? unitPrice * 0.18 : null,
        proformainvoice_Flag: true,
        InvoicegenFlag: true,
        Invoiceemail_Sent_Flag: false,
        proformaemail_Sent_Flag: true,
        Requested_By: 'admin',
        Requestedusers: selectedRowForRenewal.Base_users,
        status: 'Renewal Requested',
        RequestedPlan_Id: selectedPlanId,
        Renewal_Status: 'pending',
        Approved_By: null,
        Approved_Date: null,
        Rejected_Reason: null,
        Payment_Status: 'pending',
        Created_By: 1,
        Updated_By: 1
      };

      await postRenewalRequestAPI(payload);
      toast.success(`Renewal request sent successfully for ${payload.Customer_Name}`);
      setIsRenewalModalOpen(false);
      setSelectedPlanId(null);
      setActiveTab('Order History');
      
      // Refresh order history
      const response = await getRenewalRequestListCusWiseAPI(5);
      if (response && response.results) {
        setRenewals(response.results);
      }
    } catch (error) {
      console.error('Error sending renewal request:', error);
      toast.error('Failed to send renewal request');
    } finally {
      setSendingRenewal(false);
    }
  };

  const getProductDescription = (row: any) => {
    if (row.Subscription_Name) return row.Subscription_Name;
    const plan = plans.find((p) => p.ID === row.Plan_Id || p.id === row.Plan_Id);
    if (plan && plan.Plan_Name) return plan.Plan_Name;
    return 'CRMFarm';
  };

  const calculateDueDate = (row: any) => {
    if (!row.SubscriptionDate) return '-';
    const d = new Date(row.SubscriptionDate);
    d.setDate(d.getDate() + parseInt(row.SubscriptionPeriod || '0', 10));
    return d.toISOString().split('T')[0];
  };

  const subscriptionsColumns: ColumnConfig<any>[] = [
    {
      key: 'Subscription_name',
      header: 'Subscription Name',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-350">{row.Subscription_name || '-'}</span>
      )
    },
    {
      key: 'Subscription_date',
      header: 'Subscription Date',
      render: (row) => (
        <span className="font-mono text-slate-500 dark:text-slate-400">{row.Subscription_date || '-'}</span>
      )
    },
    {
      key: 'Expiry_date',
      header: 'Expiry Date',
      render: (row) => (
        <span className="font-mono text-slate-500 dark:text-slate-400">{row.Expiry_date || '-'}</span>
      )
    },
    {
      key: 'Plan_name',
      header: 'Plan Name',
      render: (row) => (
        <span className="font-semibold text-slate-700 dark:text-slate-350">{row.Plan_name || '-'}</span>
      )
    },
    {
      key: 'Status',
      header: 'Status',
      align: 'center',
      render: (row) => getStatusBadge(row?.Status || row?.status || 'Pending')
    }
  ];

  const renderSubscriptionActions = (row: any) => (
    <div className="flex items-center justify-center gap-1.5">
      <Button 
        onClick={() => handleRenew(row)}
        variant="outline"
        className="h-8 px-3 text-sm flex items-center gap-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
      >
        Renewal <Send className="h-4 w-4" />
      </Button>
    </div>
  );

  const renderInvoiceActions = (row: any) => (
    <div className="flex items-center justify-center gap-1.5">
      <button
        title="Download Invoice"
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer transition-colors"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );

  const invoiceColumns: ColumnConfig<any>[] = [
    {
      key: 'Invoice_No',
      header: 'Invoice No',
      render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-350">{row.Invoice_No}</span>
    },
    {
      key: 'Customer',
      header: 'Customer',
      render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.Customer}</span>
    },
    {
      key: 'Date',
      header: 'Date',
      render: (row) => <span className="font-mono text-slate-500 dark:text-slate-400">{row.Date}</span>
    },
    {
      key: 'Amount',
      header: 'Amount',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400">
          INR {Number(row.Amount || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
        </span>
      )
    },
    {
      key: 'Status',
      header: 'Status',
      align: 'center',
      render: (row) => getStatusBadge(row.Status)
    }
  ];

  const paymentColumns: ColumnConfig<any>[] = [
    {
      key: 'Transaction_ID',
      header: 'Transaction ID',
      render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-350">{row.Transaction_ID}</span>
    },
    {
      key: 'Invoice_No',
      header: 'Invoice No',
      render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.Invoice_No}</span>
    },
    {
      key: 'Plan_Name',
      header: 'Plan Name',
      render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.Plan_Name}</span>
    },
    {
      key: 'Amount',
      header: 'Amount',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400">
          INR {Number(row.Amount || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
        </span>
      )
    },
    {
      key: 'Payment_Date',
      header: 'Payment Date',
      render: (row) => <span className="font-mono text-slate-500 dark:text-slate-400">{row.Payment_Date}</span>
    },
    {
      key: 'Method',
      header: 'Method',
      render: (row) => <span className="text-slate-500 dark:text-slate-400">{row.Method}</span>
    },
    {
      key: 'Status',
      header: 'Status',
      align: 'center',
      render: (row) => getStatusBadge(row.Status)
    }
  ];

  return (
    <div className="space-y-6 text-left pb-10">
      
      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            CRM Renewal Requests
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>Administration</span>
            <span>/</span>
            <span>Add-ons</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Renewal Request</span>
          </nav>
        </div>

        <Button
          onClick={() => router.push('/add-ons/renewal-request/create')}
          style={{ backgroundColor: primaryColor }}
          className="text-white font-bold gap-2 rounded-xl h-10 px-4 cursor-pointer shadow-sm hover:opacity-90 border-none"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Renewal Request</span>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-50 dark:border-slate-900 bg-slate-50/20 dark:bg-slate-900/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-850 dark:text-white">Renewal Requests</CardTitle>
              <CardDescription className="dark:text-slate-400">Manage, request, and verify team software renewals and plan extensions.</CardDescription>
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
                onChange={(e) => setStatusFilter(e.target.value)}
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
        
        {/* Custom Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('Subscriptions')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'Subscriptions' 
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Subscriptions
          </button>
          <button 
            onClick={() => setActiveTab('Order History')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'Order History' 
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Order History
          </button>
          <button 
            onClick={() => setActiveTab('Invoice')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'Invoice' 
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Invoice
          </button>
          <button 
            onClick={() => setActiveTab('Payment')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'Payment' 
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Payment
          </button>
        </div>
        
        <CardContent className="p-0">
          {activeTab === 'Order History' && (
            <ReusableTable
              columns={columns}
              data={filteredRenewals}
              loading={loading}
              actions={renderActions}
              showGear={true}
              initialPageSize={8}
            />
          )}
          {activeTab === 'Subscriptions' && (
            <ReusableTable
              columns={subscriptionsColumns}
              data={subscriptionsData}
              loading={loadingSubscriptions}
              actions={renderSubscriptionActions}
              showGear={true}
              initialPageSize={8}
            />
          )}
          {activeTab === 'Invoice' && (
            <ReusableTable
              columns={invoiceColumns}
              data={invoiceData}
              loading={false}
              actions={renderInvoiceActions}
              showGear={true}
              initialPageSize={8}
            />
          )}
          {activeTab === 'Payment' && (
            <ReusableTable
              columns={paymentColumns}
              data={paymentData}
              loading={false}
              showGear={false}
              initialPageSize={8}
            />
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isRenewalModalOpen} onOpenChange={setIsRenewalModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Renewal Plan</DialogTitle>
            <DialogDescription>
              Choose a plan to renew the subscription for {selectedRowForRenewal?.Customername || selectedRowForRenewal?.Customer_Name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedRowForRenewal && (
              <div className="mb-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wide">Current Active Contract</h3>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{selectedRowForRenewal.Plan_name || selectedRowForRenewal.Subscription_Name || 'Unknown Plan'}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Customer: {selectedRowForRenewal.Customername || selectedRowForRenewal.Customer_Name || '-'}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</span>
                    {getStatusBadge(selectedRowForRenewal.Status || 'Expired')}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Expiry Date</span>
                    <span className="text-[15px] font-medium text-rose-500">{selectedRowForRenewal.Expiry_date || '2026-07-02'}</span>
                  </div>
                </div>
              </div>
            )}

            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-wide">Available Plans</h3>
            {loadingPlans ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {planList.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white">{plan.Plan_Name}</h4>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {plan.Currency_Type} {plan.UnitPrice}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {plan.PlanDetails || plan.Description || 'No description available.'}
                    </p>
                    <div className="mt-2 flex gap-3 text-xs text-slate-500 font-medium">
                      <span>{plan.billing_cycle === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                      <span>•</span>
                      <span>{plan.No_Of_Users} Users</span>
                    </div>
                  </div>
                ))}
                {planList.length === 0 && (
                  <div className="text-center py-8 text-slate-500">No plans available</div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenewalModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendRequest} 
              disabled={!selectedPlanId || sendingRenewal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sendingRenewal ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

