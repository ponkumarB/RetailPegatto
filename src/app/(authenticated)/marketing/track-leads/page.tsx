'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState } from 'react';
import {
  Upload,
  Download,
  Filter,
  Plus,
  Search,
  ChevronDown,
  MoreHorizontal,
  Mail,
  Phone,
  Clock,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCheck2,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Sparkles,
  Award,
  Hourglass,
  CheckCircle,
  XCircle,
  FolderOpen
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FilterPopover, FilterField } from '@/components/ui/FilterPopover';


interface LeadItem {
  id: string;
  leadName: string;
  email: string;
  companyName: string;
  location: string;
  leadSource: string;
  assignedTo: string;
  avatarInitials: string;
  avatarBg: string;
  leadStage: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
  score: number;
  lastActivity: string;
  lastActivityType: 'phone' | 'email';
  expectedCloseDate: string;
  status: 'Active' | 'Inactive';
}

const initialMockLeads: LeadItem[] = [
  {
    id: 'LD-201',
    leadName: 'Rohit Sharma',
    email: 'rohit.sharma@email.com',
    companyName: 'ABC Pvt. Ltd.',
    location: 'Noida, India',
    leadSource: 'Website',
    assignedTo: 'Aarav Rao',
    avatarInitials: 'AR',
    avatarBg: 'bg-black text-white dark:bg-slate-800',
    leadStage: 'Qualified',
    score: 85,
    lastActivity: '31 May 2024 10:30 AM',
    lastActivityType: 'phone',
    expectedCloseDate: '15 Jun 2024',
    status: 'Active',
  },
  {
    id: 'LD-202',
    leadName: 'Sneha Verma',
    email: 'sneha.verma@email.com',
    companyName: 'Tech Solutions',
    location: 'Delhi, India',
    leadSource: 'Referral',
    assignedTo: 'Priya Nair',
    avatarInitials: 'PN',
    avatarBg: 'bg-black text-white dark:bg-slate-800',
    leadStage: 'Contacted',
    score: 65,
    lastActivity: '30 May 2024 04:15 PM',
    lastActivityType: 'email',
    expectedCloseDate: '10 Jun 2024',
    status: 'Active',
  },
  {
    id: 'LD-203',
    leadName: 'Amit Singh',
    email: 'amit.singh@email.com',
    companyName: 'Infotech Systems',
    location: 'Bangalore, India',
    leadSource: 'LinkedIn',
    assignedTo: 'Vikram Joshi',
    avatarInitials: 'VJ',
    avatarBg: 'bg-black text-white dark:bg-slate-800',
    leadStage: 'Proposal Sent',
    score: 78,
    lastActivity: '30 May 2024 11:20 AM',
    lastActivityType: 'email',
    expectedCloseDate: '20 Jun 2024',
    status: 'Active',
  },
  {
    id: 'LD-204',
    leadName: 'Neha Patel',
    email: 'neha.patel@email.com',
    companyName: 'Global Enterprises',
    location: 'Mumbai, India',
    leadSource: 'Website',
    assignedTo: 'Aarav Rao',
    avatarInitials: 'AR',
    avatarBg: 'bg-black text-white dark:bg-slate-800',
    leadStage: 'Negotiation',
    score: 92,
    lastActivity: '29 May 2024 02:45 PM',
    lastActivityType: 'phone',
    expectedCloseDate: '05 Jun 2024',
    status: 'Active',
  },
  {
    id: 'LD-205',
    leadName: 'Karan Mehta',
    email: 'karan.mehta@email.com',
    companyName: 'Mehta & Co.',
    location: 'Pune, India',
    leadSource: 'Cold Call',
    assignedTo: 'Priya Nair',
    avatarInitials: 'PN',
    avatarBg: 'bg-black text-white dark:bg-slate-800',
    leadStage: 'Qualified',
    score: 70,
    lastActivity: '29 May 2024 09:10 AM',
    lastActivityType: 'email',
    expectedCloseDate: '18 Jun 2024',
    status: 'Active',
  },
  {
    id: 'LD-206',
    leadName: 'Deepak Solanki',
    email: 'deepak.solanki@email.com',
    companyName: 'Solanki Traders',
    location: 'Ahmedabad, India',
    leadSource: 'Campaign',
    assignedTo: 'Vikram Joshi',
    avatarInitials: 'VJ',
    avatarBg: 'bg-black text-white dark:bg-slate-800',
    leadStage: 'New',
    score: 40,
    lastActivity: '28 May 2024 03:30 PM',
    lastActivityType: 'phone',
    expectedCloseDate: '—',
    status: 'Active',
  },
  {
    id: 'LD-207',
    leadName: 'Meera Nair',
    email: 'meera.nair@email.com',
    companyName: 'Nair Technologies',
    location: 'Kochi, India',
    leadSource: 'Referral',
    assignedTo: 'Aarav Rao',
    avatarInitials: 'AR',
    avatarBg: 'bg-black text-white dark:bg-slate-800',
    leadStage: 'Lost',
    score: 20,
    lastActivity: '27 May 2024 01:00 PM',
    lastActivityType: 'phone',
    expectedCloseDate: '—',
    status: 'Inactive',
  }
];

export default function TrackLeadsPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // State Management
  const [leads, setLeads] = useState<LeadItem[]>(initialMockLeads);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('All Owners');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');

  // Dialog State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<LeadItem | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Lead statistics count
  const totalLeadsCount = 1248;
  const newLeadsCount = 312;
  const inProgressCount = 489;
  const qualifiedCount = 276;
  const convertedCount = 145;
  const lostCount = 26;

  // Pipeline flow metrics mapping (exact values and percentages from screenshot)
  const pipelineStages = [
    { name: 'New', count: 312, percentage: '25.00%', color: '#3B82F6', textBg: 'bg-blue-50/70 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400' },
    { name: 'Contacted', count: 268, percentage: '21.47%', color: '#0EA5E9', textBg: 'bg-sky-50/70 border-sky-200 text-sky-700 dark:bg-sky-950/20 dark:border-sky-900 dark:text-sky-400' },
    { name: 'Qualified', count: 276, percentage: '22.12%', color: '#F59E0B', textBg: 'bg-amber-50/70 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400' },
    { name: 'Proposal Sent', count: 201, percentage: '16.11%', color: '#8B5CF6', textBg: 'bg-purple-50/70 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900 dark:text-purple-400' },
    { name: 'Negotiation', count: 126, percentage: '10.10%', color: '#14B8A6', textBg: 'bg-teal-50/70 border-teal-200 text-teal-700 dark:bg-teal-950/20 dark:border-teal-900 dark:text-teal-400' },
    { name: 'Won', count: 145, percentage: '11.62%', color: '#10B981', textBg: 'bg-emerald-50/70 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400' },
    { name: 'Lost', count: 26, percentage: '2.08%', color: '#EF4444', textBg: 'bg-rose-50/70 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400' },
  ];

  // Handlers
  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLeads(prev => prev.filter(item => item !== id));
    toast.success(`Lead ${id} has been deleted.`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, id]);
    } else {
      setSelectedLeads(prev => prev.filter(item => item !== id));
    }
  };

  const openDetailsDialog = (lead: LeadItem) => {
    setDetailLead(lead);
    setIsDetailsOpen(true);
  };

  const handleExport = () => {
    toast.success("Leads exported successfully as CSV!");
  };

  const handleImport = () => {
    toast.info("Import Leads wizard started.");
  };

  const handleAddLead = () => {
    toast.success("Opening add lead form...");
    router.push('/marketing/leads/create');
  };

  // Filters logic
  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.leadSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOwner = selectedOwner === 'All Owners' || l.assignedTo === selectedOwner;
    const matchesStage = selectedStageFilter === 'All' || l.leadStage === selectedStageFilter;

    return matchesSearch && matchesOwner && matchesStage;
  });

  // Badge styler for lead stages in list table
  const getStageBadgeStyles = (stage: string) => {
    switch (stage) {
      case 'Qualified':
        return 'bg-amber-50/70 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
      case 'Contacted':
        return 'bg-sky-50/70 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900';
      case 'Proposal Sent':
        return 'bg-purple-50/70 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900';
      case 'Negotiation':
        return 'bg-teal-50/70 text-teal-700 border-teal-200 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900';
      case 'New':
        return 'bg-blue-50/70 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900';
      case 'Won':
        return 'bg-emerald-50/70 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
      case 'Lost':
        return 'bg-rose-50/70 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getScoreCircleStyles = (score: number) => {
    if (score >= 80) {
      return 'border-emerald-500 text-emerald-600 bg-emerald-50/30 dark:border-emerald-500/50 dark:text-emerald-400';
    }
    if (score >= 60) {
      return 'border-emerald-500 text-emerald-600 bg-emerald-50/30 dark:border-emerald-500/50 dark:text-emerald-400';
    }
    if (score >= 40) {
      return 'border-amber-500 text-amber-600 bg-amber-50/30 dark:border-amber-500/50 dark:text-amber-400';
    }
    return 'border-rose-500 text-rose-600 bg-rose-50/30 dark:border-rose-500/50 dark:text-rose-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
    >
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/marketing/leads">Leads</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Track Lead</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Top Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Track Lead</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track and monitor lead status across the sales pipeline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="h-9 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-all active:scale-95"
            onClick={handleImport}
          >
            <Upload className="h-4 w-4" /> Import Leads
          </Button>

          <Button
            variant="outline"
            className="h-9 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer transition-all active:scale-95"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" /> Export
          </Button>

          <FilterPopover
            triggerLabel="Filters"
            fields={[
              {
                id: 'owner',
                label: 'Lead Owner',
                type: 'select',
                value: selectedOwner,
                onChange: setSelectedOwner,
                options: [
                  { value: 'All Owners', label: 'All Owners' },
                  { value: 'Aarav Rao', label: 'Aarav Rao' },
                  { value: 'Priya Nair', label: 'Priya Nair' },
                  { value: 'Vikram Joshi', label: 'Vikram Joshi' }
                ]
              },
              {
                id: 'stage',
                label: 'Pipeline Stage',
                type: 'select',
                value: selectedStageFilter,
                onChange: setSelectedStageFilter,
                options: [
                  { value: 'All', label: 'All Stages' },
                  { value: 'New', label: 'New' },
                  { value: 'Contacted', label: 'Contacted' },
                  { value: 'Qualified', label: 'Qualified' },
                  { value: 'Proposal Sent', label: 'Proposal Sent' },
                  { value: 'Negotiation', label: 'Negotiation' },
                  { value: 'Won', label: 'Won' },
                  { value: 'Lost', label: 'Lost' }
                ]
              }
            ]}
            onClear={() => {
              setSelectedOwner('All Owners');
              setSelectedStageFilter('All');
              setSearchQuery('');
            }}
          />


          <Button
            onClick={handleAddLead}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-semibold rounded-xl h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards Row (6 columns matching the image layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Leads Card */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Leads</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">1,248</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3 shrink-0" /> 12.5% vs last month
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-2xl">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* New Leads Card */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Leads</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">312</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3 shrink-0" /> 8.3% vs last month
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl">
            <UserCheck2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        {/* In Progress Card */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">489</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3 shrink-0" /> 15.2% vs last month
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-2xl">
            <Hourglass className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Qualified Card */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualified</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">276</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3 shrink-0" /> 10.4% vs last month
            </div>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-2xl">
            <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        {/* Converted Card */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Converted</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">145</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3 shrink-0" /> 9.1% vs last month
            </div>
          </div>
          <div className="p-3 bg-teal-50 dark:bg-teal-950/50 rounded-2xl">
            <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
        </div>

        {/* Lost Card */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lost</span>
            <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">26</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-3 w-3 shrink-0" /> 3.7% vs last month
            </div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl">
            <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
        </div>
      </div>

      {/* Lead Pipeline Flow Panel */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Lead Pipeline</h2>
          <Select defaultValue="All Time">
            <SelectTrigger className="w-32 h-8.5 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Time">All Time</SelectItem>
              <SelectItem value="This Month">This Month</SelectItem>
              <SelectItem value="This Quarter">This Quarter</SelectItem>
              <SelectItem value="This Year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pipeline horizontal chevron list flow */}
        <div className="flex items-center gap-1 w-full overflow-x-auto pb-4 pt-1">
          {pipelineStages.map((stage, idx) => (
            <React.Fragment key={stage.name}>
              <div
                onClick={() => setSelectedStageFilter(stage.name === selectedStageFilter ? 'All' : stage.name)}
                className={`flex-1 min-w-[140px] bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-300 border-b-4 ${selectedStageFilter === stage.name ? 'ring-2 ring-blue-500 scale-105' : ''
                  }`}
                style={{ borderBottomColor: stage.color }}
              >
                <div className="flex flex-col h-full justify-between gap-1">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stage.name}</div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">{stage.count}</span>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{stage.percentage}</span>
                  </div>
                </div>
              </div>
              {idx < pipelineStages.length - 1 && (
                <div className="flex items-center justify-center px-1 text-slate-300 dark:text-slate-700 text-lg font-bold select-none">
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Conversion Indicators bar */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
          <div>
            Total Leads: <span className="text-slate-900 dark:text-white font-extrabold ml-1">1,248</span>
          </div>
          <div className="flex items-center gap-1">
            Conversion Rate: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">11.62%</span>
          </div>
        </div>
      </div>

      {/* Lead List Section */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">

        {/* Table Filter/Search Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between p-5 border-b dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Lead List</h2>
            {selectedStageFilter !== 'All' && (
              <Badge variant="secondary" className="gap-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold py-0.5 rounded-md">
                Stage: {selectedStageFilter}
                <button onClick={() => setSelectedStageFilter('All')} className="hover:text-red-500 font-extrabold ml-1">×</button>
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Search leads */}
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search lead..."
                className="pr-9 h-9 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-350"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Selected Leads Bulk Actions Bar */}
        <AnimatePresence>
          {selectedLeads.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50/50 dark:bg-slate-950/40 border-b dark:border-slate-800 p-3 px-5 flex items-center justify-between flex-wrap gap-2 text-xs"
            >
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {selectedLeads.length} leads selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 text-xs font-bold"
                  onClick={() => {
                    toast.info(`Changing stages for ${selectedLeads.length} items`);
                  }}
                >
                  Change Stage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900 text-xs font-bold"
                  onClick={() => {
                    setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
                    setSelectedLeads([]);
                    toast.success("Selected leads deleted successfully.");
                  }}
                >
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-bold text-slate-500"
                  onClick={() => setSelectedLeads([])}
                >
                  Clear Selection
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lead Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b dark:border-slate-800">
              <TableRow className="border-b dark:border-slate-800 hover:bg-transparent">
                <TableHead className="w-12 px-5 py-4">
                  <Checkbox
                    checked={filteredLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Lead Name</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Company</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Source</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Owner</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Lead Stage</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4 text-center">Score</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Last Activity</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Expected Close Date</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Status</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4 text-center w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const isSelected = selectedLeads.includes(lead.id);
                return (
                  <TableRow
                    key={lead.id}
                    className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b dark:border-slate-800 transition-colors duration-150 ${isSelected ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                      }`}
                  >
                    {/* Checkbox column */}
                    <TableCell className="px-5 py-3.5">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectRow(lead.id, !!checked)}
                      />
                    </TableCell>

                    {/* Lead Name & Email */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => openDetailsDialog(lead)}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-left transition-colors cursor-pointer"
                        >
                          {lead.leadName}
                        </button>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium leading-none">
                          {lead.email}
                        </span>
                      </div>
                    </TableCell>

                    {/* Company Details */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {lead.companyName}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold leading-none">
                          {lead.location}
                        </span>
                      </div>
                    </TableCell>

                    {/* Source */}
                    <TableCell className="py-3.5">
                      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {lead.leadSource}
                      </span>
                    </TableCell>

                    {/* Owner Avatars & Name */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6.5 w-6.5 border shadow-2xs font-extrabold">
                          <AvatarFallback className="bg-black text-white text-[9px] dark:bg-slate-800 dark:text-slate-200 font-extrabold">
                            {lead.avatarInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {lead.assignedTo}
                        </span>
                      </div>
                    </TableCell>

                    {/* Lead Stage Badges */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant="outline"
                        className={`rounded-md font-bold text-xs py-0.5 px-2.5 tracking-wide ${getStageBadgeStyles(
                          lead.leadStage
                        )}`}
                      >
                        {lead.leadStage}
                      </Badge>
                    </TableCell>

                    {/* Score indicators */}
                    <TableCell className="py-3.5 text-center">
                      <div className="inline-flex justify-center items-center">
                        <span
                          className={`h-7.5 w-7.5 rounded-full border flex items-center justify-center text-xs font-bold shadow-2xs ${getScoreCircleStyles(
                            lead.score
                          )}`}
                        >
                          {lead.score}
                        </span>
                      </div>
                    </TableCell>

                    {/* Last Activity with details */}
                    <TableCell className="py-3.5">
                      <div className="flex items-start gap-2 max-w-[200px]">
                        {lead.lastActivityType === 'phone' ? (
                          <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        ) : (
                          <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-tight">
                          {lead.lastActivity}
                        </span>
                      </div>
                    </TableCell>

                    {/* Expected Close Date */}
                    <TableCell className="py-3.5">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {lead.expectedCloseDate}
                      </span>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant="outline"
                        className={`rounded-md font-bold text-[10px] py-0.5 px-2 tracking-wide border-emerald-100 bg-emerald-50/50 text-emerald-600 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 ${lead.status === 'Inactive'
                          ? 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-500'
                          : ''
                          }`}
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>

                    {/* Dropdown Options */}
                    <TableCell className="py-3.5 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
                          >
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-52 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
                          <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase">
                            Actions
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => openDetailsDialog(lead)}>
                            <Eye className="h-4 w-4 text-slate-500" /> View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs font-medium"
                            onClick={() => {
                              toast.info('Feature coming soon in Next version!');
                            }}
                          >
                            <Edit className="h-4 w-4 text-slate-500" /> Edit Lead
                          </DropdownMenuItem>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-xs font-medium">
                              Change Stage
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-44 dark:bg-slate-900">
                              {(['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'] as const).map(stage => (
                                <DropdownMenuItem
                                  key={stage}
                                  onClick={() => {
                                    setLeads(prev =>
                                      prev.map(l => (l.id === lead.id ? { ...l, leadStage: stage } : l))
                                    );
                                    toast.success(`Stage changed to ${stage}`);
                                  }}
                                  className="cursor-pointer text-xs font-medium"
                                >
                                  {stage}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-xs font-medium">
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-44 dark:bg-slate-900">
                              {(['Active', 'Inactive'] as const).map(status => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() => {
                                    setLeads(prev =>
                                      prev.map(l => (l.id === lead.id ? { ...l, status } : l))
                                    );
                                    toast.success(`Status updated to ${status}`);
                                  }}
                                  className="cursor-pointer text-xs font-medium"
                                >
                                  {status}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" /> Delete Lead
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-slate-400 font-medium">
                    No leads found matching current search filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bottom Pagination controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-t dark:border-slate-800 text-xs font-semibold text-slate-500">
          <span>Showing 1 to {filteredLeads.length} of 1,248 leads</span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800" disabled>
              &lt;
            </Button>
            <Button
              variant="outline"
              className="h-8 px-3 rounded-lg border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 font-extrabold text-blue-600 dark:text-blue-400 shadow-2xs"
              style={{ borderColor: primaryColor + '40', color: primaryColor }}
            >
              1
            </Button>
            <Button variant="ghost" className="h-8 px-3 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850">
              2
            </Button>
            <Button variant="ghost" className="h-8 px-3 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850">
              3
            </Button>
            <span className="px-1 text-slate-300 dark:text-slate-700">...</span>
            <Button variant="ghost" className="h-8 px-3 rounded-lg text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-850">
              125
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
              &gt;
            </Button>
            <Select defaultValue="10">
              <SelectTrigger className="w-24 h-8 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-lg ml-1">
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
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white font-extrabold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              Lead Overview
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Overview of the selected lead details.
            </DialogDescription>
          </DialogHeader>

          {detailLead && (
            <div className="space-y-4 pt-2 text-slate-700 dark:text-slate-350 text-xs">
              <div className="grid grid-cols-2 gap-3.5 border-b dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lead Name</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{detailLead.leadName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email ID</span>
                  <p className="text-sm font-medium mt-0.5 text-slate-800 dark:text-slate-200">{detailLead.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 border-b dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Company</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailLead.companyName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Location</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailLead.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 border-b dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Source</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailLead.leadSource}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Owner Assigned</span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{detailLead.assignedTo}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pb-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lead Stage</span>
                  <div className="mt-1">
                    <Badge variant="outline" className={`rounded-md font-bold text-[10px] py-0.5 px-2 ${getStageBadgeStyles(detailLead.leadStage)}`}>
                      {detailLead.leadStage}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lead Score</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className={`h-6 w-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${getScoreCircleStyles(detailLead.score)}`}>
                      {detailLead.score}
                    </span>
                    <span className="font-semibold text-slate-500">Quality Index</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              className="rounded-lg text-xs font-bold w-full"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setIsDetailsOpen(false)}
            >
              Close Overview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
