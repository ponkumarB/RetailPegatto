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
  ExternalLink,
  BarChart3,
  Store,
  Layers,
  ArrowRight,
  Eye,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  User,
  Phone,
  Hash
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchTallyReportInvoices, syncInvoiceToTally, syncMultipleInvoicesToTally } from '@/api/transactions';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import TallyConfigurationModal from '@/components/layout/TallyConfigurationModal';

export default function TallySyncReportPage() {
  const { primaryColor } = useStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isMultiSyncing, setIsMultiSyncing] = useState(false);
  const [multiSyncProgress, setMultiSyncProgress] = useState({ current: 0, total: 0, currentInvoiceId: '' });
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [activeView, setActiveView] = useState<'records' | 'overview'>('records');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Single Record Overview Modal state
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isRecordOverviewOpen, setIsRecordOverviewOpen] = useState(false);

  // Load Invoices from all real sources without arbitrary restrictions
  const loadInvoices = async () => {
    setLoading(true);
    try {
      const list = await fetchTallyReportInvoices();
      setInvoices(Array.isArray(list) ? list : []);
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
  const handleSyncToTally = async (rowOrId: any) => {
    if (!rowOrId) return;
    const isObj = typeof rowOrId === 'object' && rowOrId !== null;
    const invoiceIdStr = isObj ? String(rowOrId.Invoice_Id || rowOrId.id || '') : String(rowOrId);
    setSyncingId(invoiceIdStr);

    try {
      const res = await syncInvoiceToTally(rowOrId);
      if (res?.success === true || (res?.status === 200 && res?.success !== false) || res?.status === 'success') {
        const tallyId = res?.tally_id || res?.Tally_Id || invoiceIdStr;
        toast.success(res?.message || `Invoice ${invoiceIdStr} synced to Tally successfully!`, {
          description: `Tally ID: ${tallyId} has been generated and recorded.`,
        });
        setConnectionError(null);

        // Optimistically update local invoice state with Tally_Id and SUCCESS
        setInvoices((prev) =>
          prev.map((inv) =>
            (inv.Invoice_Id === invoiceIdStr || inv.id === (isObj ? rowOrId.id : undefined))
              ? {
                  ...inv,
                  Tally_Sync_Status: 'SUCCESS',
                  Tally_Id: String(tallyId),
                  Tally_Sync_Date: new Date().toISOString(),
                  Tally_Sync_Error: '',
                }
              : inv
          )
        );

        // Optimistically update selectedRecord if modal is currently open
        setSelectedRecord((prev: any) =>
          prev && (prev.Invoice_Id === invoiceIdStr || prev.id === (isObj ? rowOrId.id : undefined))
            ? {
                ...prev,
                Tally_Sync_Status: 'SUCCESS',
                Tally_Id: String(tallyId),
                Tally_Sync_Date: new Date().toISOString(),
                Tally_Sync_Error: '',
              }
            : prev
        );
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

  // Multi Sync Invoices to Tally
  const handleMultiSyncToTally = async () => {
    // Only proceed if at least one invoice checkbox is selected
    if (selectedInvoices.length === 0) {
      toast.warning('Please select at least one invoice checkbox to sync.');
      return;
    }

    const targetInvoices = selectedInvoices;

    setIsMultiSyncing(true);
    setMultiSyncProgress({ current: 0, total: targetInvoices.length, currentInvoiceId: '' });

    try {
      const { successCount, failCount, lastError, results } = await syncMultipleInvoicesToTally(
        targetInvoices,
        (current, total, currentInvoiceId) => {
          setMultiSyncProgress({ current, total, currentInvoiceId: String(currentInvoiceId) });
          setSyncingId(String(currentInvoiceId));
        }
      );

      // Optimistically update all successfully synced invoices locally
      setInvoices((prev) =>
        prev.map((inv) => {
          const match = results.find(
            (r) => r.success && (r.invoiceId === inv.Invoice_Id || r.invoiceId === inv.id)
          );
          if (match) {
            return {
              ...inv,
              Tally_Sync_Status: 'SUCCESS',
              Tally_Id: String(match.tallyId || inv.Tally_Id || inv.Invoice_Id),
              Tally_Sync_Date: new Date().toISOString(),
              Tally_Sync_Error: '',
            };
          }
          return inv;
        })
      );

      setSelectedInvoices([]);

      if (failCount === 0) {
        toast.success(`Successfully synced all ${successCount} invoice(s) to Tally Prime!`, {
          description: 'All vouchers and Tally IDs recorded successfully.',
        });
        setConnectionError(null);
      } else if (successCount > 0) {
        toast.warning(`Multi-sync completed: ${successCount} synced successfully, ${failCount} failed.`);
        if (lastError && (lastError.toLowerCase().includes('connect') || lastError.toLowerCase().includes('tally'))) {
          setConnectionError(lastError);
        }
      } else {
        const errMsg = lastError || 'Failed to sync invoices to Tally';
        if (errMsg.toLowerCase().includes('connect') || errMsg.toLowerCase().includes('tally')) {
          setConnectionError(errMsg);
          toast.error(errMsg, {
            description: 'Ensure Tally Prime is open with port 9000 enabled, or verify Tally URL in configuration.',
            duration: 8000,
          });
        } else {
          toast.error(errMsg);
        }
      }

      await loadInvoices();
    } catch (err: any) {
      console.error('Multi Sync Error:', err);
      toast.error('An unexpected error occurred during multi-sync.');
    } finally {
      setIsMultiSyncing(false);
      setSyncingId(null);
    }
  };

  // Filtered list based on search and period (shows all real invoices without dropping zero-tax)
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
      // 1. Filter by search query (Invoice ID, Customer Name, or Tally ID)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesInvoice = (inv.Invoice_Id || '').toLowerCase().includes(query);
        const matchesCustomer = (inv.Customer_Name || '').toLowerCase().includes(query);
        const matchesTally = (inv.Tally_Id || '').toLowerCase().includes(query);
        const matchesStore = (inv.Store_Name || '').toLowerCase().includes(query);
        if (!matchesInvoice && !matchesCustomer && !matchesTally && !matchesStore) return false;
      }

      // 2. Filter by date range (only if a specific period is selected, not 'All Time')
      if (selectedPeriod !== 'All Time' && start && end && inv.Invoice_Date) {
        const invDate = moment(inv.Invoice_Date);
        if (invDate.isValid()) {
          return invDate.isBetween(start, end, 'day', '[]');
        }
      }

      return true;
    });
  }, [invoices, selectedPeriod, searchQuery]);

  // Metric stats calculated from all filtered real invoices
  const stats = useMemo(() => {
    const totalCount = filteredInvoices.length;
    const totalGstCollected = filteredInvoices.reduce(
      (sum, inv) => sum + Number(inv.Tax_Amount || 0),
      0
    );
    const successCount = filteredInvoices.filter(
      (inv) => String(inv.Tally_Sync_Status || '').trim().toUpperCase() === 'SUCCESS'
    ).length;
    const pendingCount = filteredInvoices.filter(
      (inv) => String(inv.Tally_Sync_Status || '').trim().toUpperCase() !== 'SUCCESS'
    ).length;

    return {
      totalCount,
      totalGstCollected,
      successCount,
      pendingCount,
    };
  }, [filteredInvoices]);

  // Store distribution summary for Overview
  const storeBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalAmount: number; syncedCount: number; pendingCount: number }>();
    filteredInvoices.forEach((inv) => {
      const store = inv.Store_Name || 'Default Store';
      const cur = map.get(store) || { count: 0, totalAmount: 0, syncedCount: 0, pendingCount: 0 };
      cur.count += 1;
      cur.totalAmount += Number(inv.Net_Amount || inv.Invoice_Amount || 0);
      const isSynced = String(inv.Tally_Sync_Status || '').trim().toUpperCase() === 'SUCCESS';
      if (isSynced) {
        cur.syncedCount += 1;
      } else {
        cur.pendingCount += 1;
      }
      map.set(store, cur);
    });
    return Array.from(map.entries()).map(([store, data]) => ({
      store,
      ...data,
    }));
  }, [filteredInvoices]);

  // Tax distribution breakdown for Overview
  const taxBreakdown = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalNet = 0;

    filteredInvoices.forEach((inv) => {
      totalTaxable += Number(inv.Invoice_Amount || 0);
      totalCgst += Number(inv.Tax_Amount || 0) / 2;
      totalSgst += Number(inv.Tax_Amount || 0) / 2;
      totalNet += Number(inv.Net_Amount || 0);
    });

    return {
      totalTaxable,
      totalCgst,
      totalSgst,
      totalNet,
    };
  }, [filteredInvoices]);

  // ReusableTable Columns Configuration (Responsive & Streamlined)
  const columns: ColumnConfig<any>[] = useMemo(() => [
    {
      key: 'Customer_Name',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <div
          className="flex flex-col py-0.5 min-w-[130px] cursor-pointer group/cust"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRecord(row);
            setIsRecordOverviewOpen(true);
          }}
          title="Click to view record overview"
        >
          <div className="flex items-center gap-1.5 max-w-[220px]">
            <span className="font-semibold text-slate-850 dark:text-slate-100 text-xs sm:text-sm truncate group-hover/cust:text-blue-600 dark:group-hover/cust:text-blue-400 group-hover/cust:underline transition-colors" title={row.Customer_Name || 'Walk-in Customer'}>
              {row.Customer_Name || 'Walk-in Customer'}
            </span>
            <Eye className="w-3.5 h-3.5 text-blue-500 shrink-0 opacity-0 group-hover/cust:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5 flex-wrap">
            <span className="group-hover/cust:text-slate-700 dark:group-hover/cust:text-slate-200">{row.Invoice_Id}</span>
            {row.Tally_Id && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-sans font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  Tally: #{row.Tally_Id}
                </span>
              </>
            )}
            {row.Invoice_Date && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400 font-sans">
                  {moment(row.Invoice_Date).isValid() ? moment(row.Invoice_Date).format('DD MMM YYYY') : row.Invoice_Date}
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
          {row.Invoice_Date && moment(row.Invoice_Date).isValid() ? moment(row.Invoice_Date).format('DD MMM YYYY') : row.Invoice_Date || '-'}
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
            <div className="flex flex-col items-center gap-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white shrink-0" />
                <span>SYNCED</span>
              </span>
              {row.Tally_Id && (
                <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400" title={`Tally Voucher ID: ${row.Tally_Id}`}>
                  ID: {row.Tally_Id}
                </span>
              )}
            </div>
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
      'Tally ID': inv.Tally_Id || inv.Invoice_Id || '-',
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
      head: [['Customer', 'Invoice No', 'Tally ID', 'Date', 'Taxable Value', 'CGST', 'SGST', 'Net Amount', 'Tally Status']],
      body: filteredInvoices.map((inv) => [
        inv.Customer_Name || 'Walk-in Customer',
        inv.Invoice_Id || '',
        inv.Tally_Id || inv.Invoice_Id || '-',
        inv.Invoice_Date && moment(inv.Invoice_Date).isValid() ? moment(inv.Invoice_Date).format('DD MMM YYYY') : (inv.Invoice_Date || ''),
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

  // Index of currently selected record in filtered invoices for next/prev navigation
  const currentRecordIndex = useMemo(() => {
    if (!selectedRecord) return -1;
    return filteredInvoices.findIndex(
      (inv) =>
        (inv.Invoice_Id && inv.Invoice_Id === selectedRecord.Invoice_Id) ||
        (inv.id && inv.id === selectedRecord.id)
    );
  }, [selectedRecord, filteredInvoices]);

  const handlePrevRecord = () => {
    if (currentRecordIndex > 0) {
      setSelectedRecord(filteredInvoices[currentRecordIndex - 1]);
    }
  };

  const handleNextRecord = () => {
    if (currentRecordIndex >= 0 && currentRecordIndex < filteredInvoices.length - 1) {
      setSelectedRecord(filteredInvoices[currentRecordIndex + 1]);
    }
  };

  // Export single record overview to PDF
  const handleExportSingleRecordPDF = (record: any) => {
    if (!record) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Tax Invoice / GST Transaction Overview', 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Invoice ID: ${record.Invoice_Id || record.id} | Generated: ${moment().format('YYYY-MM-DD HH:mm')}`,
      14,
      25
    );

    autoTable(doc, {
      startY: 32,
      head: [['Field', 'Details']],
      body: [
        ['Customer Name', record.Customer_Name || 'Walk-in Customer'],
        ['Invoice Number', record.Invoice_Id || '-'],
        ['Tally ERP ID', record.Tally_Id ? `#${record.Tally_Id}` : 'Not Generated'],
        [
          'Date',
          record.Invoice_Date && moment(record.Invoice_Date).isValid()
            ? moment(record.Invoice_Date).format('DD MMM YYYY')
            : record.Invoice_Date || '-',
        ],
        ['Store Name', record.Store_Name || 'Default Store'],
        ['Payment Method', record.Payment_Method || 'Cash'],
        ['Taxable Value (Base)', `Rs. ${Number(record.Invoice_Amount || 0).toFixed(2)}`],
        ['CGST (Central Tax)', `Rs. ${(Number(record.Tax_Amount || 0) / 2).toFixed(2)}`],
        ['SGST (State Tax)', `Rs. ${(Number(record.Tax_Amount || 0) / 2).toFixed(2)}`],
        ['Total GST Tax', `Rs. ${Number(record.Tax_Amount || 0).toFixed(2)}`],
        ['Net Total Amount', `Rs. ${Number(record.Net_Amount || 0).toFixed(2)}`],
        ['Tally Sync Status', record.Tally_Sync_Status || 'PENDING'],
      ],
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 9,
        cellPadding: 3.5,
      },
    });

    doc.save(`Invoice_${record.Invoice_Id || 'record'}.pdf`);
    toast.success(`PDF for Invoice ${record.Invoice_Id} downloaded!`);
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
              <option value="All Time">All Time</option>
              <option value="This Year">This Year</option>
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Today">Today</option>
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

          {/* Overview Page Link */}
          <Link
            href="/analytics/reports?report=tally-sync"
            className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
            title="View Tally Report Overview in Report Center"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Overview Page</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
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
              Total Invoices
            </span>
            <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {stats.totalCount}
            </p>
            <span className="text-[10px] text-slate-400 block font-medium truncate">
              Transactions available
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

      {/* 3. View Switcher: Transaction Records vs Overview Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveView('records')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeView === 'records'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Transaction Records</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
              activeView === 'records'
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            )}>
              {filteredInvoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('overview')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeView === 'overview'
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Overview Dashboard</span>
          </button>
        </div>

        <Link
          href="/analytics/reports?report=tally-sync"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
        >
          <span>Open Full Report Center Overview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4. Main Body: Overview Dashboard or Transaction Records Table */}
      {activeView === 'overview' ? (
        <div className="space-y-3">
          {/* Top Row: ERP Sync Health Progress & Report Center Link Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Sync Completion Rate Card */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tally ERP Sync Health</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time posting status of sales vouchers into Tally Prime
                  </p>
                </div>
                <Badge variant="outline" className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
                  {stats.totalCount > 0 ? Math.round((stats.successCount / stats.totalCount) * 100) : 0}% Synchronized
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${stats.totalCount > 0 ? (stats.successCount / stats.totalCount) * 100 : 0}%` }}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${stats.totalCount > 0 ? (stats.pendingCount / stats.totalCount) * 100 : 0}%` }}
                />
              </div>

              {/* Sync Breakdown Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Invoices</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{stats.totalCount}</span>
                </div>
                <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Synced to ERP</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{stats.successCount}</span>
                </div>
                <div className="p-2.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[10px] uppercase font-semibold text-amber-600 block">Pending Sync</span>
                  <span className="text-base font-bold text-amber-700 dark:text-amber-400">{stats.pendingCount}</span>
                </div>
                <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/40">
                  <span className="text-[10px] uppercase font-semibold text-blue-600 block">Net Revenue</span>
                  <span className="text-base font-bold text-blue-700 dark:text-blue-400">
                    ₹{taxBreakdown.totalNet.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Report Center Link Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-white to-blue-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-blue-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-4 shadow-xs flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Report Center Overview
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Analyze full cross-module sales reports, customer engagement, and export consolidated GST records.
                </p>
              </div>

              <div className="pt-3 space-y-2">
                <Link
                  href="/analytics/reports?report=tally-sync"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2e7d32] hover:bg-[#256628] text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                >
                  <span>Go to Report Center Overview</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveView('records')}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all cursor-pointer"
                >
                  <span>View Transaction Records Table</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Tax Breakdown & Store Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* GST Tax Slabs Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>GST Tax Breakdown</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Period: {selectedPeriod}</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">Taxable Value (Base)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{taxBreakdown.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">CGST (Central Tax)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{taxBreakdown.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs">
                  <span className="font-medium text-slate-600 dark:text-slate-400">SGST (State Tax)</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ₹{taxBreakdown.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-lg text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  <span>Total Tax Collected</span>
                  <span>
                    ₹{stats.totalGstCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Store Distribution Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Store-Wise Distribution</span>
                </h3>
                <span className="text-[11px] text-slate-400">{storeBreakdown.length} Store(s)</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {storeBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No store data available</div>
                ) : (
                  storeBreakdown.map((item) => (
                    <div
                      key={item.store}
                      className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.store}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>{item.count} invoices</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium">{item.syncedCount} synced</span>
                          {item.pendingCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 font-medium">{item.pendingCount} pending</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
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
                {/* Multi Sync to Tally Button - Disabled if no checkbox is selected */}
                <Button
                  size="sm"
                  onClick={handleMultiSyncToTally}
                  disabled={isMultiSyncing || loading || selectedInvoices.length === 0}
                  className={cn(
                    "h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs flex-1 sm:flex-initial transition-all",
                    selectedInvoices.length > 0
                      ? "bg-[#1b5e20] hover:bg-[#154a19] text-white cursor-pointer"
                      : "bg-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                  )}
                  title={
                    selectedInvoices.length > 0
                      ? `Sync ${selectedInvoices.length} selected invoice(s) to Tally Prime`
                      : "Select at least one invoice checkbox to enable Multi Sync"
                  }
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isMultiSyncing && "animate-spin")} />
                  <span>
                    {isMultiSyncing
                      ? `Syncing (${multiSyncProgress.current}/${multiSyncProgress.total})...`
                      : selectedInvoices.length > 0
                      ? `Multi Sync (${selectedInvoices.length})`
                      : `Multi Sync To Tally`}
                  </span>
                </Button>

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

          {/* Real-time Multi Sync Progress Banner */}
          {isMultiSyncing && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-800 dark:text-blue-200 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <span className="font-bold">Multi-sync in progress:</span> syncing invoice{' '}
                  <strong className="font-mono text-blue-900 dark:text-blue-100">{multiSyncProgress.currentInvoiceId}</strong>{' '}
                  ({multiSyncProgress.current} of {multiSyncProgress.total})...
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="font-bold text-[11px] bg-blue-200/80 dark:bg-blue-900 px-2.5 py-0.5 rounded-full font-mono">
                  {Math.round((multiSyncProgress.current / Math.max(multiSyncProgress.total, 1)) * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Selected Rows Bulk Actions Toolbar */}
          {!isMultiSyncing && selectedInvoices.length > 0 && (
            <div className="p-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong>{selectedInvoices.length}</strong> invoice(s) selected for bulk sync
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedInvoices([])}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer mr-1"
                >
                  Deselect all
                </button>
                <Button
                  size="sm"
                  onClick={handleMultiSyncToTally}
                  className="h-7 px-3 text-xs font-semibold gap-1.5 bg-[#1b5e20] hover:bg-[#154a19] text-white shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync Selected ({selectedInvoices.length})</span>
                </Button>
              </div>
            </div>
          )}

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
              selectable={true}
              rowKey="Invoice_Id"
              selectedRows={selectedInvoices}
              onRowSelectChange={(rows) => setSelectedInvoices(rows)}
              onRowClick={(row) => {
                setSelectedRecord(row);
                setIsRecordOverviewOpen(true);
              }}
              actionsHeader="Actions"
              actions={(row) => {
                const isSynced = String(row.Tally_Sync_Status || '').trim().toUpperCase() === 'SUCCESS';
                const isSyncing = syncingId === row.Invoice_Id || syncingId === String(row.id);

                return (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecord(row);
                        setIsRecordOverviewOpen(true);
                      }}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                      title="View record overview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Overview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSyncToTally(row)}
                      disabled={isSyncing || isMultiSyncing}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap",
                        isSynced
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                          : "bg-[#2e7d32] hover:bg-[#256628] text-white",
                        (isSyncing || isMultiSyncing) && "opacity-75 cursor-wait"
                      )}
                    >
                      <RefreshCw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
                      <span>{isSyncing ? 'Syncing...' : isSynced ? 'Re-sync' : 'Sync To Tally'}</span>
                    </button>
                  </div>
                );
              }}
            />
          </div>
        </div>
      )}

      {/* 5. Single Record Overview Modal */}
      <Dialog
        open={isRecordOverviewOpen}
        onOpenChange={(open) => {
          setIsRecordOverviewOpen(open);
          if (!open) setSelectedRecord(null);
        }}
      >
        <DialogContent showCloseButton={false} className="max-w-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          {selectedRecord && (
            <div className="flex flex-col max-h-[90vh]">
              {/* Modal Top Header */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Invoice Record Overview
                      </h3>
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200/70 dark:bg-slate-750 px-2 py-0.5 rounded">
                        #{selectedRecord.Invoice_Id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedRecord.Customer_Name || 'Walk-in Customer'} • {selectedRecord.Invoice_Date ? moment(selectedRecord.Invoice_Date).format('DD MMMM YYYY') : 'Date N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Badges */}
                  {String(selectedRecord.Tally_Sync_Status || '').toUpperCase() === 'SUCCESS' ? (
                    <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-xs font-bold gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                      <span>Synced (Tally #{selectedRecord.Tally_Id})</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs font-bold gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Pending Tally Sync</span>
                    </Badge>
                  )}

                  <button
                    onClick={() => setIsRecordOverviewOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                
                {/* 1. Financial KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Taxable Base</span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      ₹{Number(selectedRecord.Invoice_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">CGST (Central)</span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      ₹{(Number(selectedRecord.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">SGST (State)</span>
                    <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      ₹{(Number(selectedRecord.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">Net Total</span>
                    <p className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300">
                      ₹{Number(selectedRecord.Net_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* 2. Record Details Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Customer & Store Details */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Customer & Billing Info</span>
                    </h4>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Customer Name:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecord.Customer_Name || 'Walk-in Customer'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Contact Mobile:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{selectedRecord.Customer_Phone || selectedRecord.Customer_Mobile || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Store / Branch:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{selectedRecord.Store_Name || 'Default Store'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Payment Method:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedRecord.Payment_Method || 'Cash'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Payment Status:</span>
                        <span className={cn("font-bold", selectedRecord.Is_Paid ? "text-emerald-600" : "text-amber-600")}>
                          {selectedRecord.Is_Paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tally ERP Sync Details */}
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                      <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tally ERP Voucher Details</span>
                    </h4>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Sync Status:</span>
                        <span className={cn(
                          "font-bold px-2 py-0.5 rounded text-[11px]",
                          String(selectedRecord.Tally_Sync_Status || '').toUpperCase() === 'SUCCESS'
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        )}>
                          {selectedRecord.Tally_Sync_Status || 'PENDING'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Tally ID / Voucher:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {selectedRecord.Tally_Id ? `#${selectedRecord.Tally_Id}` : 'Not Generated'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Invoice Date:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {selectedRecord.Invoice_Date ? moment(selectedRecord.Invoice_Date).format('YYYY-MM-DD') : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                        <span className="text-slate-400">Sync Timestamp:</span>
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {selectedRecord.Tally_Sync_Date ? moment(selectedRecord.Tally_Sync_Date).format('DD MMM YYYY, HH:mm') : 'Not yet synced'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Voucher Type:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">Sales Voucher (GST)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Items or Consolidated Tax Breakdown */}
                <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Tax Slabs & Accounting Breakdown</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {Array.isArray(selectedRecord.items) && selectedRecord.items.length > 0
                        ? `${selectedRecord.items.length} items`
                        : 'Voucher tax details'}
                    </span>
                  </h4>

                  {Array.isArray(selectedRecord.items) && selectedRecord.items.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="p-2">Item</th>
                            <th className="p-2 text-center">Qty</th>
                            <th className="p-2 text-right">Price</th>
                            <th className="p-2 text-right">Tax</th>
                            <th className="p-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {selectedRecord.items.map((it: any, i: number) => (
                            <tr key={i}>
                              <td className="p-2 text-slate-800 dark:text-slate-200">{it.name || it.item_name || it.title || `Item #${i + 1}`}</td>
                              <td className="p-2 text-center">{it.quantity || it.qty || 1}</td>
                              <td className="p-2 text-right">₹{Number(it.price || it.rate || 0).toFixed(2)}</td>
                              <td className="p-2 text-right">₹{Number(it.tax || it.taxAmount || 0).toFixed(2)}</td>
                              <td className="p-2 text-right font-bold">₹{Number(it.total || it.totalAmount || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Taxable Sales Amount (Base):</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          ₹{Number(selectedRecord.Invoice_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Central Tax (CGST):</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          ₹{(Number(selectedRecord.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">State Tax (SGST):</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          ₹{(Number(selectedRecord.Tax_Amount || 0) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white">
                        <span>Total Invoice Net Amount:</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          ₹{Number(selectedRecord.Net_Amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer Controls */}
              <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                {/* Prev / Next navigation */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrevRecord}
                    disabled={currentRecordIndex <= 0}
                    className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </Button>
                  <span className="text-[11px] text-slate-400 font-medium px-1">
                    {currentRecordIndex + 1} of {filteredInvoices.length}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNextRecord}
                    disabled={currentRecordIndex >= filteredInvoices.length - 1}
                    className="h-8 px-2.5 text-xs gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportSingleRecordPDF(selectedRecord)}
                    className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download PDF</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleSyncToTally(selectedRecord)}
                    disabled={syncingId === selectedRecord.Invoice_Id || isMultiSyncing}
                    className={cn(
                      "h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs cursor-pointer",
                      String(selectedRecord.Tally_Sync_Status || '').toUpperCase() === 'SUCCESS'
                        ? "bg-slate-700 hover:bg-slate-800 text-white"
                        : "bg-[#1b5e20] hover:bg-[#154a19] text-white"
                    )}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", syncingId === selectedRecord.Invoice_Id && "animate-spin")} />
                    <span>
                      {syncingId === selectedRecord.Invoice_Id
                        ? 'Syncing...'
                        : String(selectedRecord.Tally_Sync_Status || '').toUpperCase() === 'SUCCESS'
                        ? 'Re-sync to Tally'
                        : 'Sync to Tally'}
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tally Configuration Modal */}
      <TallyConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

    </div>
  );
}
