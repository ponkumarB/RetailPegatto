'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Search,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  Calendar,
  Receipt,
  DollarSign,
  Clock,
  ArrowUpDown,
  Building2,
  ChevronDown,
  Settings,
  X,
  Landmark,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchTallyReportInvoices, syncInvoiceToTally } from '@/api/transactions';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import TallyConfigurationModal from '@/components/layout/TallyConfigurationModal';

export default function TallySyncReportPage() {
  const { primaryColor } = useStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('This Year');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Load Invoices
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await fetchTallyReportInvoices();
      const list = Array.isArray(data)
        ? data
        : (data?.results || data?.Result || data?.data || []);
      setInvoices(list);
    } catch (err: any) {
      console.error('Error fetching invoices for Tally Report:', err);
      toast.error('Failed to load invoices from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Sync a single invoice to Tally
  const handleSyncToTally = async (invoiceId: string) => {
    if (!invoiceId) return;
    setSyncingId(invoiceId);
    try {
      const res = await syncInvoiceToTally(invoiceId);
      if (res?.success === true || (res?.status === 200 && res?.success !== false) || res?.status === 'success') {
        toast.success(res?.message || `Invoice ${invoiceId} synced to Tally successfully!`);
        setConnectionError(null);
      } else {
        const errorMsg = res?.error || res?.details || res?.message || 'Failed to sync invoice to Tally';
        if (errorMsg.toLowerCase().includes('connect') || errorMsg.toLowerCase().includes('tally')) {
          setConnectionError(errorMsg);
          toast.error(errorMsg, {
            description: 'Ensure Tally Prime is open with port 9000 enabled, or verify Tally URL in configuration.',
            duration: 8000
          });
        } else {
          toast.error(errorMsg);
        }
      }
      await loadInvoices();
    } catch (err: any) {
      console.error('Sync Error:', err);
      const errMsg = err?.data?.error || err?.data?.message || err?.message || 'Tally Sync Server Error';
      if (errMsg.toLowerCase().includes('connect') || errMsg.toLowerCase().includes('tally')) {
        setConnectionError(errMsg);
        toast.error(errMsg, {
          description: 'Ensure Tally Prime is open with port 9000 enabled, or verify Tally URL in configuration.',
          duration: 8000
        });
      } else {
        toast.error(errMsg);
      }
    } finally {
      setSyncingId(null);
    }
  };

  // Filtered list based on GST, period, and search query
  const filteredInvoices = useMemo(() => {
    let start: moment.Moment | null = null;
    let end: moment.Moment | null = null;

    if (selectedPeriod === 'This Year') {
      start = moment().startOf('year');
      end = moment().endOf('year');
    } else if (selectedPeriod === 'This Month') {
      start = moment().startOf('month');
      end = moment().endOf('month');
    } else if (selectedPeriod === 'Last Month') {
      start = moment().subtract(1, 'month').startOf('month');
      end = moment().subtract(1, 'month').endOf('month');
    } else if (selectedPeriod === 'This Quarter') {
      start = moment().startOf('quarter');
      end = moment().endOf('quarter');
    } else if (selectedPeriod === 'Today') {
      start = moment().startOf('day');
      end = moment().endOf('day');
    }

    return invoices.filter((inv) => {
      // 1. Only show GST Invoices (Tax Amount > 0)
      if (Number(inv.Tax_Amount || 0) <= 0) return false;

      // 2. Filter by search query (Invoice ID or Customer Name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesInvoice = (inv.Invoice_Id || '').toLowerCase().includes(query);
        const matchesCustomer = (inv.Customer_Name || '').toLowerCase().includes(query);
        if (!matchesInvoice && !matchesCustomer) return false;
      }

      // 3. Filter by date range
      if (start && end && inv.Invoice_Date) {
        const invDate = moment(inv.Invoice_Date);
        if (!invDate.isValid()) return true;
        return invDate.isBetween(start, end, 'day', '[]');
      }

      return true;
    });
  }, [invoices, selectedPeriod, searchQuery]);

  // Metric stats
  const stats = useMemo(() => {
    const totalCount = filteredInvoices.length;
    const totalGstCollected = filteredInvoices.reduce(
      (sum, inv) => sum + Number(inv.Tax_Amount || 0),
      0
    );
    const successCount = filteredInvoices.filter(
      (inv) => inv.Tally_Sync_Status === 'SUCCESS'
    ).length;
    const pendingCount = filteredInvoices.filter(
      (inv) => inv.Tally_Sync_Status !== 'SUCCESS'
    ).length;

    return {
      totalCount,
      totalGstCollected,
      successCount,
      pendingCount,
    };
  }, [filteredInvoices]);

  // ReusableTable Columns Configuration (Responsive & Streamlined)
  const columns: ColumnConfig<any>[] = useMemo(() => [
    {
      key: 'Customer_Name',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col py-0.5 min-w-[130px]">
          <span className="font-semibold text-slate-850 dark:text-slate-100 text-xs sm:text-sm truncate max-w-[200px]" title={row.Customer_Name || 'Walk-in Customer'}>
            {row.Customer_Name || 'Walk-in Customer'}
          </span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
            <span>{row.Invoice_Id}</span>
            {row.Invoice_Date && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400 font-sans">
                  {moment(row.Invoice_Date).format('DD MMM YYYY')}
                </span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'Invoice_Date',
      header: 'Date',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
          {row.Invoice_Date ? moment(row.Invoice_Date).format('DD MMM YYYY') : '-'}
        </span>
      ),
    },
    {
      key: 'Invoice_Amount',
      header: 'Taxable Value',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
          ₹{Number(row.Invoice_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'cgst',
      header: 'CGST',
      sortable: false,
      align: 'right',
      className: 'hidden sm:table-cell',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          ₹{(Number(row.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'sgst',
      header: 'SGST',
      sortable: false,
      align: 'right',
      className: 'hidden sm:table-cell',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          ₹{(Number(row.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'Net_Amount',
      header: 'Net Amount',
      sortable: true,
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end whitespace-nowrap">
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            ₹{Number(row.Net_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 sm:hidden">
            Tax: ₹{Number(row.Tax_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ),
    },
    {
      key: 'Tally_Sync_Status',
      header: 'Tally Status',
      sortable: true,
      align: 'center',
      render: (row) => {
        const isSyncing = syncingId === row.Invoice_Id;
        const status = String(row.Tally_Sync_Status || 'PENDING').trim();
        const lower = status.toLowerCase();
        const isSynced = lower === 'success' || lower === 'synced';
        const isFailed = lower === 'failed' || lower === 'error';

        if (isSyncing) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-xs whitespace-nowrap">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
              <span>SYNCING...</span>
            </span>
          );
        }

        if (isSynced) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs whitespace-nowrap">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0" />
              <span>SYNCED</span>
            </span>
          );
        }

        if (isFailed) {
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-xs whitespace-nowrap"
              title={row.Tally_Sync_Error || 'Sync failed'}
            >
              <XCircle className="w-3.5 h-3.5 fill-rose-500 text-white shrink-0" />
              <span>FAILED</span>
            </span>
          );
        }

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 fill-amber-500 text-white shrink-0 animate-pulse" />
            <span>PENDING</span>
          </span>
        );
      },
    },
  ], [syncingId]);

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      toast.warning('No records to export');
      return;
    }

    const exportData = filteredInvoices.map((inv) => ({
      'Invoice No': inv.Invoice_Id,
      'Date': inv.Invoice_Date ? moment(inv.Invoice_Date).format('YYYY-MM-DD') : '',
      'Customer Name': inv.Customer_Name || 'Walk-in Customer',
      'Taxable Value': Number(inv.Invoice_Amount || 0).toFixed(2),
      'CGST (9%)': (Number(inv.Tax_Amount || 0) / 2).toFixed(2),
      'SGST (9%)': (Number(inv.Tax_Amount || 0) / 2).toFixed(2),
      'Total Tax': Number(inv.Tax_Amount || 0).toFixed(2),
      'Net Amount': Number(inv.Net_Amount || 0).toFixed(2),
      'Tally Status': inv.Tally_Sync_Status || 'PENDING',
      'Sync Date': inv.Tally_Sync_Date ? moment(inv.Tally_Sync_Date).format('YYYY-MM-DD HH:mm') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GST Tally Invoices');
    XLSX.writeFile(wb, `GST_Tally_Report_${moment().format('YYYYMMDD')}.xlsx`);
    toast.success('Excel report downloaded successfully!');
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredInvoices.length === 0) {
      toast.warning('No records to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Tally GST Transactions Report', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')} | Period: ${selectedPeriod}`, 14, 25);

    autoTable(doc, {
      startY: 30,
      head: [['Customer', 'Invoice No', 'Date', 'Taxable Value', 'CGST', 'SGST', 'Net Amount', 'Tally Status']],
      body: filteredInvoices.map((inv) => [
        inv.Customer_Name || 'Walk-in Customer',
        inv.Invoice_Id || '',
        inv.Invoice_Date ? moment(inv.Invoice_Date).format('DD MMM YYYY') : '',
        `Rs. ${Number(inv.Invoice_Amount || 0).toFixed(2)}`,
        `Rs. ${(Number(inv.Tax_Amount || 0) / 2).toFixed(2)}`,
        `Rs. ${(Number(inv.Tax_Amount || 0) / 2).toFixed(2)}`,
        `Rs. ${Number(inv.Net_Amount || 0).toFixed(2)}`,
        inv.Tally_Sync_Status || 'PENDING',
      ]),
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
    });

    doc.save(`GST_Tally_Report_${moment().format('YYYYMMDD')}.pdf`);
    toast.success('PDF report downloaded successfully!');
  };

  return (
    <div className="space-y-3 p-3 sm:p-4.5 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tally GST Reports
            </h1>
            <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
              Tally Prime ERP
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Review and push GST transactions directly into Tally Prime
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none h-8 pl-3 pr-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="This Year">This Year</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Today">Today</option>
              <option value="All Time">All Time</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadInvoices}
            disabled={loading}
            className="h-8 px-2.5 gap-1.5 text-xs border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin text-emerald-600')} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigModalOpen(true)}
            className="h-8 px-2.5 gap-1.5 text-xs border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer bg-white dark:bg-slate-900"
            title="Configure Tally Connection"
          >
            <Settings className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Tally Config</span>
          </Button>
        </div>
      </div>

      {/* Connection Troubleshooting Banner */}
      {connectionError && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800 rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-2.5 shadow-xs animate-in fade-in duration-300">
          <div className="flex items-start gap-2.5">
            <div className="p-1 bg-amber-100 dark:bg-amber-900/50 rounded text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Tally Connection Notice
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                {connectionError}
              </p>
              <div className="pt-0.5 text-xs text-amber-800 dark:text-amber-200">
                <p className="font-semibold text-[10px] uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Quick Fix in Tally Prime:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5">
                  <li>Open <strong>Tally Prime</strong> and select your Company.</li>
                  <li>Press <kbd className="px-1 py-0.5 text-[9px] bg-amber-200/60 dark:bg-amber-900 rounded font-mono font-semibold">F1</kbd> (Help) → <strong>Settings</strong> → <strong>Connectivity</strong>.</li>
                  <li>Set <em>TallyPrime acts as</em> to <strong>Both</strong> or <strong>Server</strong>, and <em>Port</em> to <strong>9000</strong>.</li>
                  <li>Restart Tally Prime, then try syncing again.</li>
                </ol>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 self-end md:self-start shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsConfigModalOpen(true)}
              className="h-7 px-2 text-xs font-semibold border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 cursor-pointer"
            >
              <Settings className="w-3 h-3 mr-1" />
              Tally Settings
            </Button>
            <button
              onClick={() => setConnectionError(null)}
              className="text-amber-500 hover:text-amber-700 dark:text-amber-400 p-0.5 rounded cursor-pointer"
              title="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Modern Metric KPI Cards (matching RetailPegatto design system) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        
        {/* Card 1: Total GST Invoices */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200 min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Total GST Invoices
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {stats.totalCount}
            </p>
            <span className="text-[10px] text-slate-400 block font-medium truncate">
              Taxable transactions
            </span>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Receipt className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Card 2: GST Tax Collected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200 min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              GST Tax Collected
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              ₹{stats.totalGstCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium truncate">
              CGST + SGST total
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Card 3: Synced to Tally */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200 min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Synced to Tally
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 truncate">
              {stats.successCount}
            </p>
            <span className="text-[10px] text-slate-400 block font-medium truncate">
              {stats.totalCount > 0 ? Math.round((stats.successCount / stats.totalCount) * 100) : 0}% pushed to ERP
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Card 4: Pending Sync */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200 min-w-0">
          <div className="space-y-0.5 min-w-0 flex-1 mr-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
              Pending Sync
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-amber-500 dark:text-amber-400 truncate">
              {stats.pendingCount}
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium truncate">
              Requires sync action
            </span>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
        </div>
      </div>

      {/* 3. Main GST Transaction Records using Standard ReusableTable */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-xs space-y-3 min-w-0">
        
        {/* Table Controls Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>GST Transaction Records</span>
              <span className="text-[11px] font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {filteredInvoices.length}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              Review transaction details and click Sync To Tally to post vouchers to Tally ERP.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            {/* Search Box */}
            <div className="relative w-full sm:w-48 md:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice or customer..."
                className="h-8 pl-8 text-xs border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Export PDF Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer flex-1 sm:flex-initial"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Export PDF</span>
              </Button>

              {/* Export Excel Button */}
              <Button
                size="sm"
                onClick={handleExportExcel}
                className="h-8 px-3 text-xs font-semibold gap-1.5 bg-[#2e7d32] hover:bg-[#256628] text-white shadow-xs cursor-pointer flex-1 sm:flex-initial"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Standard ReusableTable with Responsive Wrapper */}
        <div className="overflow-x-auto min-w-0 w-full">
          <ReusableTable
            columns={columns}
            data={filteredInvoices}
            loading={loading}
            initialPageSize={10}
            showPageSizeSelector={true}
            showGear={false}
            borderless={true}
            actionsHeader="Actions"
            actions={(row) => {
              const isSynced = row.Tally_Sync_Status === 'SUCCESS';
              const isSyncing = syncingId === row.Invoice_Id;

              return (
                <button
                  type="button"
                  onClick={() => handleSyncToTally(row.Invoice_Id)}
                  disabled={isSyncing}
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap",
                    isSynced
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      : "bg-[#2e7d32] hover:bg-[#256628] text-white",
                    isSyncing && "opacity-75 cursor-wait"
                  )}
                >
                  <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
                  <span>{isSyncing ? 'Syncing...' : isSynced ? 'Re-sync' : 'Sync To Tally'}</span>
                </button>
              );
            }}
          />
        </div>
      </div>

      {/* Tally Configuration Modal */}
      <TallyConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

    </div>
  );
}
