'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Smartphone,
  MessageSquare,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Activity,
  Download,
  Filter,
  List,
  LayoutGrid,
  RefreshCcw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from 'sonner';
import {
  fetchNotificationLogsWithoutPagination,
  searchNotificationLogs,
  filterNotificationLogs,
  fetchNotificationTemplatesWithoutPagination
} from '@/service/api/Workflow/api';

interface NotificationTemplate {
  id: string | number;
  Notification_Name: string;
}

interface NotificationLog {
  id: string | number;
  NotificationLog_Id: string;
  Notification: string | number;
  Notification_Template_Name?: string;
  Recipient: string;
  Channel: 'Email' | 'SMS' | 'WhatsApp' | 'Push';
  Status: 'Sent' | 'Delivered' | 'Opened' | 'Failed' | 'Pending';
  Sent_Date: string;
  Response: string;
  Organization_Id?: number;
  Created_Date?: string;
}

export default function WorkflowNotificationLogPage() {
  const { primaryColor } = useStore();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Sent' | 'Delivered' | 'Opened' | 'Failed' | 'Pending'>('All');
  const [loading, setLoading] = useState(false);

  // Layout toggle
  const [viewFormat, setViewFormat] = useState<'list' | 'grid'>('list');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterRecipient, setFilterRecipient] = useState('');
  const [filterOrgId, setFilterOrgId] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const loadTemplates = async () => {
    try {
      const res = await fetchNotificationTemplatesWithoutPagination();
      setTemplates(Array.isArray(res) ? res : (res?.data || res?.results || []));
    } catch (err) {
      console.error('Failed to load notification templates', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let res;
      const hasFilters = filterRecipient || filterOrgId || filterStartDate || filterEndDate || statusFilter !== 'All';

      if (hasFilters) {
        const payload: any = {};
        if (filterRecipient) payload.Recipient = filterRecipient;
        if (filterOrgId) payload.Organization_Id = Number(filterOrgId);
        if (statusFilter !== 'All') {
          payload.Status = statusFilter;
        }
        if (filterStartDate || filterEndDate) {
          payload.Created_Date = [filterStartDate || '', filterEndDate || ''];
        }
        res = await filterNotificationLogs(payload);
      } else if (searchQuery) {
        res = await searchNotificationLogs(searchQuery);
      } else {
        res = await fetchNotificationLogsWithoutPagination();
      }
      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setLogs(data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter]);

  const filteredData = useMemo(() => {
    return logs;
  }, [logs]);

  // Export handlers
  const exportToExcel = () => {
    const data = filteredData.map((l) => ({
      'Log ID': l.NotificationLog_Id || l.id,
      'Template ID': l.Notification || '',
      'Recipient': l.Recipient || '',
      'Channel': l.Channel || '',
      'Status': l.Status || '',
      'Sent Date': l.Sent_Date || '',
      'Response': l.Response || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notification Logs");
    XLSX.writeFile(wb, "NotificationLogs.xlsx");
    toast.success("Excel sheet downloaded successfully");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [['ID', 'Template', 'Recipient', 'Channel', 'Status', 'Sent Date']],
      body: filteredData.map((l) => [
        l.NotificationLog_Id || String(l.id),
        String(l.Notification || ''),
        l.Recipient || '',
        l.Channel || '',
        l.Status || '',
        l.Sent_Date ? new Date(l.Sent_Date).toLocaleString() : ''
      ])
    });
    doc.save('NotificationLogs.pdf');
    toast.success("PDF report downloaded successfully");
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Email':
        return <Mail className="h-3.5 w-3.5 text-blue-505" />;
      case 'SMS':
        return <Smartphone className="h-3.5 w-3.5 text-amber-505" />;
      case 'WhatsApp':
        return <MessageSquare className="h-3.5 w-3.5 text-emerald-505" />;
      default:
        return <ArrowUpRight className="h-3.5 w-3.5 text-purple-505" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Delivered':
      case 'Opened':
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-955/35 text-emerald-700 dark:text-emerald-450 border border-emerald-205">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            {status}
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 dark:bg-rose-955/35 text-rose-700 dark:text-rose-455 border border-rose-205">
            <XCircle className="h-3 w-3 text-rose-500" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 dark:bg-blue-955/30 text-blue-700 dark:text-blue-450 border border-blue-205">
            <Clock className="h-3 w-3 text-blue-500" />
            {status}
          </span>
        );
    }
  };

  const tableColumns: ColumnConfig<NotificationLog>[] = [
    {
      key: 'NotificationLog_Id',
      header: 'ID',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900 dark:text-white pl-2">{row.NotificationLog_Id || row.id}</span>
    },
    {
      key: 'Notification',
      header: 'Notification Template',
      sortable: true,
      render: (row) => {
        const templateId = typeof row.Notification === 'object' && row.Notification ? (row.Notification as any).id : row.Notification;
        const found = templates.find(t => String(t.id) === String(templateId));
        const displayName = found ? found.Notification_Name : (typeof row.Notification === 'object' && row.Notification ? (row.Notification as any).Notification_Name : row.Notification_Template_Name || String(row.Notification || ''));
        return (
          <div>
            <span className="font-extrabold text-slate-805 dark:text-slate-205 block">
              {row.Response || displayName}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5 max-w-md truncate">
              Template: {displayName} | Recipient: {row.Recipient}
            </span>
          </div>
        );
      }
    },
    {
      key: 'Recipient',
      header: 'Recipient',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700 dark:text-slate-355">{row.Recipient}</span>
    },
    {
      key: 'Channel',
      header: 'Channel',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-650">
          {getChannelIcon(row.Channel)}
          {row.Channel}
        </div>
      )
    },
    {
      key: 'Status',
      header: 'Status',
      align: 'center',
      render: (row) => getStatusBadge(row.Status)
    },
    {
      key: 'Sent_Date',
      header: 'Sent Date',
      sortable: true,
      render: (row) => <span className="font-semibold text-xs text-slate-705 dark:text-slate-300">{row.Sent_Date ? new Date(row.Sent_Date).toLocaleString() : ''}</span>
    }
  ];

  return (
    <div className="space-y-6 text-left p-6">
      {/* Breadcrumbs Header */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">{getTenantName().toUpperCase()}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Automation</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Notification Log</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="space-y-6">
        {/* Main Header Panel */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
          <div className="space-y-1 text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Notification Logs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Audit log histories of automated SMS, WhatsApp, In-App, and Email delivery pipelines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button
                  variant="outline"
                  className="h-9 px-3 border-slate-205 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 shadow-lg">
                <DropdownMenuItem onClick={exportToExcel} className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Export to Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF} className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={loadData}
              variant="outline"
              className="h-9 px-3 border-slate-205 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Refresh logs
            </Button>
          </div>
        </div>


        {/* Table Container using ReusableTable */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Dispatch Audit</h2>
              <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505 border-slate-200 dark:border-slate-700">
                {filteredData.length} Logs
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Status select filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs font-bold border dark:border-slate-855 bg-slate-50 dark:bg-slate-955 p-2 px-3 rounded-xl text-slate-655 dark:text-slate-350 focus:outline-none h-8.5 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Delivered">Delivered</option>
                <option value="Opened">Opened</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>

              {/* Grid / List view toggles */}
              <div className="flex items-center border dark:border-slate-800 rounded-xl overflow-hidden h-8.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewFormat('list')}
                  className={`h-full w-8.5 rounded-none cursor-pointer ${viewFormat === 'list' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900' : 'text-slate-400'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewFormat('grid')}
                  className={`h-full w-8.5 rounded-none cursor-pointer ${viewFormat === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900' : 'text-slate-400'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>

              <div className="relative w-full sm:w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450" />
                <Input
                  placeholder="Search recipient address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8.5 bg-slate-50 dark:bg-slate-955 border-slate-205 dark:border-slate-800 font-medium text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
                />
              </div>

              {/* Filter Panel Toggle */}
              <Button
                variant="outline"
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className={`h-8.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${isFilterVisible ? 'bg-slate-100 dark:bg-slate-800 text-slate-900' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-855'
                  }`}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
              </Button>
            </div>
          </div>

          {/* Grid / List render content toggler */}
          {viewFormat === 'list' ? (
            <ReusableTable<NotificationLog>
              columns={tableColumns}
              data={filteredData}
              loading={loading}
              initialPageSize={10}
              showGear={true}
              rowKey="id"
              borderless={true}
              title="Notification Logs"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
              {filteredData.map((l) => {
                const templateId = typeof l.Notification === 'object' && l.Notification ? (l.Notification as any).id : l.Notification;
                const found = templates.find(t => String(t.id) === String(templateId));
                const displayName = found ? found.Notification_Name : (typeof l.Notification === 'object' && l.Notification ? (l.Notification as any).Notification_Name : l.Notification_Template_Name || String(l.Notification || ''));
                const cardTitle = l.Response || displayName;
                const cardSubtitle = `Template: ${displayName} | Recipient: ${l.Recipient}`;

                return (
                  <Card key={l.id} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-all duration-200">
                    <div className="p-5 space-y-3.5 text-left">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                          {getChannelIcon(l.Channel)}
                          {l.Channel}
                        </Badge>
                        {getStatusBadge(l.Status)}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-extrabold text-sm text-slate-805 dark:text-slate-200 truncate" title={cardTitle}>{cardTitle}</h3>
                        <p className="text-xs text-slate-505 leading-relaxed truncate" title={cardSubtitle}>{cardSubtitle}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-3.5 border-t dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">ID: {l.NotificationLog_Id || l.id}</span>
                      <span className="text-[10px] font-semibold text-slate-450">{l.Sent_Date ? new Date(l.Sent_Date).toLocaleString() : ''}</span>
                    </div>
                  </Card>
                );
              })}
              {filteredData.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-505 text-xs font-semibold">
                  No notification logs match the filter criteria.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal Dialog */}
      <Dialog open={isFilterVisible} onOpenChange={setIsFilterVisible}>
        <DialogContent className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl max-w-md animate-in fade-in zoom-in duration-200">
          <DialogHeader className="text-left">
            <DialogTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500" />
              Workflow Notification Log Filter
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-405 pt-1">
              Apply filters to search through notification delivery history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Recipient Target</Label>
                <Input
                  placeholder="e.g. user@email.com"
                  value={filterRecipient}
                  onChange={(e) => setFilterRecipient(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">Organization ID</Label>
                <Input
                  placeholder="e.g. 1"
                  value={filterOrgId}
                  onChange={(e) => setFilterOrgId(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Status Preset</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full text-xs font-semibold border dark:border-slate-805 bg-white dark:bg-slate-955 p-2.5 rounded-xl text-slate-705 dark:text-slate-355 focus:outline-none h-10 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Sent">Sent only</option>
                <option value="Delivered">Delivered only</option>
                <option value="Opened">Opened only</option>
                <option value="Failed">Failed only</option>
                <option value="Pending">Pending only</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wider">From Date</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-850 text-xs font-semibold rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-555 dark:text-slate-400 uppercase tracking-wider">To Date</Label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="h-10 border-slate-200 dark:border-slate-850 text-xs font-semibold rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center gap-2 justify-end pt-3 border-t dark:border-slate-800">
            <Button
              variant="ghost"
              onClick={async () => {
                setFilterRecipient('');
                setFilterOrgId('');
                setFilterStartDate('');
                setFilterEndDate('');
                setStatusFilter('All');
                setIsFilterVisible(false);
                setLoading(true);
                try {
                  // const res = await fetchNotificationLogs();
                  const res = await fetchNotificationLogsWithoutPagination();
                  const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
                  setLogs(data);
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to load logs');
                } finally {
                  setLoading(false);
                }
              }}
              className="text-xs font-bold text-slate-555 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer h-9 px-4"
            >
              Reset
            </Button>
            <Button
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                setIsFilterVisible(false);
                loadData();
              }}
              className="text-white text-xs font-bold rounded-xl px-4 h-9 border-0 cursor-pointer"
            >
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
