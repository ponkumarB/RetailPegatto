'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Globe,
  Compass,
  Linkedin,
  Phone,
  Mail,
  UserCheck,
  Calendar,
  Share2,
  SlidersHorizontal,
  ChevronDown,
  ListChecks,
  Users,
  Activity,
  Percent,
  Check,
  LayoutGrid,
  List,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterPopover, FilterField } from '@/components/ui/FilterPopover';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { useLeadListStore, LeadList } from '@/store/useLeadListStore';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';

// Helper to render source icon and color
const getSourceDetails = (source: string) => {
  switch (source) {
    case 'Website':
      return { icon: Globe, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' };
    case 'Google Ads':
      return { icon: Compass, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' };
    case 'LinkedIn Ads':
      return { icon: Linkedin, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20' };
    case 'Cold Call':
      return { icon: Phone, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' };
    case 'Email':
      return { icon: Mail, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20' };
    case 'Referral':
      return { icon: UserCheck, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/20' };
    case 'Event':
      return { icon: Calendar, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/20' };
    case 'Social Media':
      return { icon: Share2, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-950/20' };
    default:
      return { icon: Globe, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-950/20' };
  }
};

const statusStyles = {
  Active: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  Paused: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
  Inactive: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  Archived: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
};

export default function LeadGenerationPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { lists, deleteList } = useLeadListStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive' | 'Archived'>('All');
  const [selectedSource, setSelectedSource] = useState<string>('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('All');
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const handleToggleSelectAll = () => {
    if (selectedListIds.length === filteredLists.length) {
      setSelectedListIds([]);
    } else {
      setSelectedListIds(filteredLists.map(l => l.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    if (selectedListIds.includes(id)) {
      setSelectedListIds(selectedListIds.filter(item => item !== id));
    } else {
      setSelectedListIds([...selectedListIds, id]);
    }
  };

  const handleDelete = (id: string) => {
    deleteList(id);
    setSelectedListIds(selectedListIds.filter(item => item !== id));
    toast.success('Lead generation list deleted.');
  };

  // Filtered lists logic
  const filteredLists = lists.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSource = selectedSource === 'All' || item.source === selectedSource;

    return matchesSearch && matchesTab && matchesSource;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'List Name', 'Source', 'Total Leads', 'New Leads', 'Conversion Rate (%)', 'Status', 'Created On', 'Created By'];
    const data = filteredLists.map(l => [
      l.id,
      l.name,
      l.source,
      l.totalLeads,
      l.newLeads,
      `${l.conversionRate}%`,
      l.status,
      l.createdOn,
      l.createdBy
    ]);
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_generation_lists.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Lead generation lists exported successfully!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Breadcrumb Navigation */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Marketing</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Lead Generation</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Lists</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Lead Generation Lists</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage lists to generate leads from various sources and campaigns.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="font-bold gap-2 text-xs h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Download className="h-4 w-4" /> Import Leads
          </Button>
          <Button
            onClick={() => router.push('/marketing/lead-generation/create')}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-extrabold gap-2 text-xs h-10 px-5 shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create New List
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Total Lists Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-3xs flex items-center gap-4.5">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <ListChecks className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Lists</p>
            <h3 className="text-2xl font-extrabold font-mono text-slate-850 dark:text-white mt-1">24</h3>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              ▲ 14.3% <span className="text-slate-400 font-normal">vs Apr 2024</span>
            </span>
          </div>
        </div>

        {/* Total Leads Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-3xs flex items-center gap-4.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Leads</p>
            <h3 className="text-2xl font-extrabold font-mono text-slate-850 dark:text-white mt-1">12,458</h3>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              ▲ 18.7% <span className="text-slate-400 font-normal">vs Apr 2024</span>
            </span>
          </div>
        </div>

        {/* Active Lists Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-3xs flex items-center gap-4.5">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Lists</p>
            <h3 className="text-2xl font-extrabold font-mono text-slate-850 dark:text-white mt-1">16</h3>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5 mt-1">
              ▲ 10.5% <span className="text-slate-400 font-normal">vs Apr 2024</span>
            </span>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-3xs flex items-center gap-4.5">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-450 rounded-xl">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
            <h3 className="text-2xl font-extrabold font-mono text-slate-850 dark:text-white mt-1">8.62%</h3>
            <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5 mt-1">
              ▼ -1.2% <span className="text-slate-400 font-normal">vs Apr 2024</span>
            </span>
          </div>
        </div>

      </div>

      {/* Interactive Controls & Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b dark:border-slate-800 pb-2">
        {/* Left Tabs */}
        <div className="flex items-center gap-6 text-sm font-semibold">
          {[
            { id: 'All', label: 'All Lists' },
            { id: 'Active', label: 'Active' },
            { id: 'Inactive', label: 'Inactive' },
            { id: 'Archived', label: 'Archived' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 border-b-2 transition-all relative ${activeTab === tab.id
                ? 'text-slate-900 dark:text-white font-extrabold'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent'
                }`}
              style={activeTab === tab.id ? { borderColor: primaryColor } : {}}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right Filtering Bar */}
        <div className="flex flex-wrap items-center gap-3">

          <div className="relative w-full sm:w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
            />
          </div>

          <FilterPopover
            fields={[
              {
                id: 'source',
                label: 'Lead Source',
                type: 'select',
                value: selectedSource,
                onChange: setSelectedSource,
                options: [
                  { value: 'All', label: 'All Sources' },
                  { value: 'Website', label: 'Website' },
                  { value: 'Google Ads', label: 'Google Ads' },
                  { value: 'LinkedIn Ads', label: 'LinkedIn Ads' },
                  { value: 'Cold Call', label: 'Cold Call' },
                  { value: 'Email', label: 'Email' },
                  { value: 'Referral', label: 'Referral' },
                  { value: 'Event', label: 'Event' },
                  { value: 'Social Media', label: 'Social Media' }
                ]
              },
              {
                id: 'dateFilter',
                label: 'Created Date',
                type: 'select',
                value: selectedDateFilter,
                onChange: setSelectedDateFilter,
                options: [
                  { value: 'All', label: 'Created Date: All' },
                  { value: 'Today', label: 'Today' },
                  { value: 'Yesterday', label: 'Yesterday' },
                  { value: 'Last7Days', label: 'Last 7 Days' },
                  { value: 'Last30Days', label: 'Last 30 Days' }
                ]
              }
            ]}
            onClear={() => {
              setSelectedSource('All');
              setSelectedDateFilter('All');
              setSearchQuery('');
            }}
          />


          <div className="flex border rounded-lg overflow-hidden h-9.5 shrink-0 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 transition-colors ${viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-400'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 transition-colors ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-400'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

        </div >
      </div >

      {/* View Content */}
      < AnimatePresence mode="wait" >
        {viewMode === 'table' ? (
          <motion.div
            key="table-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-3xs overflow-hidden"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-950/20">
                  <TableRow className="border-b dark:border-slate-800">
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        checked={selectedListIds.length === filteredLists.length && filteredLists.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 accent-primary h-4 w-4 cursor-pointer"
                        style={{ '--primary-theme': primaryColor } as React.CSSProperties}
                      />
                    </TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">List Name</TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Source</TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-right font-semibold">Total Leads</TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-right font-semibold">New Leads (This Month)</TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-right font-semibold">Conversion Rate</TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Created On</TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Created By</TableHead>
                    <TableHead className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLists.map((list) => {
                    const sourceInfo = getSourceDetails(list.source);
                    const SourceIcon = sourceInfo.icon;
                    const isSelected = selectedListIds.includes(list.id);

                    return (
                      <TableRow
                        key={list.id}
                        className={`border-b dark:border-slate-800 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/10 ${isSelected ? 'bg-slate-50/70 dark:bg-slate-800/10' : ''
                          }`}
                      >
                        <TableCell className="text-center py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(list.id)}
                            className="rounded border-slate-300 accent-primary h-4 w-4 cursor-pointer"
                          />
                        </TableCell>

                        <TableCell className="py-4">
                          <div>
                            <span className="font-extrabold text-sm text-slate-850 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                              {list.name}
                            </span>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">{list.description}</p>
                          </div>
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-lg border ${sourceInfo.bg} ${sourceInfo.color} shrink-0`}>
                              <SourceIcon className="h-4 w-4" />
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{list.source}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-extrabold text-slate-850 dark:text-white font-mono py-4">
                          {list.totalLeads.toLocaleString()}
                        </TableCell>

                        <TableCell className="text-right font-bold text-slate-500 dark:text-slate-400 font-mono py-4">
                          {list.newLeads.toLocaleString()}
                        </TableCell>

                        <TableCell className="text-right font-bold text-slate-850 dark:text-white font-mono py-4 pr-6">
                          {list.conversionRate}%
                        </TableCell>

                        <TableCell className="text-center py-4">
                          <Badge variant="outline" className={`rounded-md font-bold text-[10px] py-0.5 px-2 ${statusStyles[list.status]}`}>
                            {list.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs font-semibold text-slate-650 dark:text-slate-400 font-mono py-4">
                          {new Date(list.createdOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>

                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-100 border dark:border-slate-800 flex items-center justify-center text-[9px] font-extrabold text-slate-600 dark:text-slate-300">
                              {list.createdBy.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{list.createdBy}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-650 rounded-lg cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-800">
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-400">List Options</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold">
                                <Edit className="h-4 w-4 text-slate-500" /> Edit Configuration
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold">
                                <ListChecks className="h-4 w-4 text-slate-500" /> View Leads list
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold" onClick={() => handleDelete(list.id)}>
                                <Trash2 className="h-4 w-4 text-rose-600" /> Delete List
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredLists.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-slate-450 font-semibold">
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-slate-350" />
                          <span>No lead lists found matching filters.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination details */}
            <div className="p-4.5 border-t dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs font-bold text-slate-400">
              <span>Showing 1 to {filteredLists.length} of {lists.length} entries</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button className="h-8 px-2 border rounded-lg bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 cursor-not-allowed" disabled>
                    ‹
                  </button>
                  <button className="h-8 w-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center shadow-xs" style={{ backgroundColor: primaryColor }}>
                    1
                  </button>
                  <button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800">
                    2
                  </button>
                  <button className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800">
                    3
                  </button>
                  <button className="h-8 px-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
                    ›
                  </button>
                </div>

                <Select defaultValue="10">
                  <SelectTrigger className="w-[100px] h-8 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="25">25 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredLists.map(list => {
              const sourceInfo = getSourceDetails(list.source);
              const SourceIcon = sourceInfo.icon;
              return (
                <div
                  key={list.id}
                  className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-3xs flex flex-col justify-between hover:shadow-xs transition-shadow relative overflow-hidden group text-left"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg border ${sourceInfo.bg} ${sourceInfo.color} shrink-0`}>
                          <SourceIcon className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{list.source}</span>
                      </div>
                      <Badge variant="outline" className={`rounded-md font-bold text-[9px] py-0.5 px-2 ${statusStyles[list.status]}`}>
                        {list.status}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-base text-slate-850 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {list.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{list.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-t dark:border-slate-800 pt-3 text-left">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Leads</span>
                        <span className="text-sm font-extrabold text-slate-850 dark:text-white font-mono block mt-0.5">{list.totalLeads}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">New Leads</span>
                        <span className="text-sm font-bold text-slate-500 dark:text-slate-350 font-mono block mt-0.5">+{list.newLeads}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Conversion</span>
                        <span className="text-sm font-extrabold text-slate-850 dark:text-white font-mono block mt-0.5">{list.conversionRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t dark:border-slate-800 pt-3.5 mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-5 w-5 rounded-full bg-slate-100 border dark:border-slate-800 flex items-center justify-center text-[8px] font-extrabold text-slate-650">
                        {list.createdBy.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[11px] font-bold text-slate-450">{list.createdBy}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-400 hover:text-slate-650">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20" onClick={() => handleDelete(list.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                </div>
              );
            })}
          </motion.div>
        )
        }
      </AnimatePresence >
    </motion.div >
  );
}
