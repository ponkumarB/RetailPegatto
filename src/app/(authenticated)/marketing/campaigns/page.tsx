'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

// ... other imports unchanged ...
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Megaphone,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Percent,
  Mail,
  Facebook,
  Linkedin,
  Instagram,
  Smartphone,
  Globe,
  Eye,
  ChevronLeft,
  ChevronRight
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { useCampaignStore, Campaign } from '@/store/useCampaignStore';
import { motion } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCampaignDashboardKPI,
  fetchCampaignsList,
  fetchMyCampaigns,
  deleteCampaign,
  updateCampaign,
  CampaignModel
} from '@/service/api/campaign/api';
import { getLoggedInUserId } from '@/service/api/contacts/api';

// Custom WhatsApp Icon SVG Component
const WhatsAppIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`${className} text-[#25D366] fill-current`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.416 1.46h.005c5.566 0 10.1-4.532 10.104-10.1.002-2.699-1.047-5.236-2.951-7.143C17.31 1.464 14.773.415 12.008.415 6.43.415 1.895 4.947 1.892 10.528c-.001 1.93.504 3.81 1.462 5.418L2.35 20.358l4.297-1.204zM17.9 14.852c-.322-.16-.1.9-.323-1.6-.16-.322-.59-.516-.913-.677-.323-.16-1.897-.933-2.18-.1.036-.282-.226-.436-.452-.516-.226-.08-1.516-.403-2.58.548-.823.823-1.37 1.823-1.53 2.1-.16.28-.016.43.124.57.126.126.282.322.42.484.14.16.186.274.28.452.093.18.046.338-.023.5-.069.16-.62 1.484-.855 2.048-.228.55-.458.484-.62.476-.153-.008-.33-.008-.508-.008-.18 0-.476.067-.726-.206-.25-.274-.95-.93-.95-2.27 0-1.34.975-2.637 1.112-2.82.137-.184 1.92-2.93 4.65-4.113.65-.28 1.157-.448 1.553-.573.654-.208 1.25-.178 1.72-.25.525-.078 1.62-.663 1.85-.92.228-.258.228-.48.15-.623-.076-.14-.282-.226-.6-.386z" />
  </svg>
);

const CHANNELS = [
  { id: 'Email', name: 'Email Campaign', icon: Mail, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 border-blue-100 hover:border-blue-300 dark:bg-blue-950/20 dark:border-blue-900/30', desc: 'Outbound newsletter & email flows' },
  { id: 'Facebook', name: 'Facebook Ads', icon: Facebook, color: 'text-blue-850 dark:text-blue-405', bg: 'bg-blue-50/50 border-blue-100 hover:border-blue-300 dark:bg-blue-955/20 dark:border-blue-900/30', desc: 'Social feeds, story & messenger ads' },
  { id: 'LinkedIn', name: 'LinkedIn Ads', icon: Linkedin, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50/50 border-indigo-100 hover:border-indigo-300 dark:bg-indigo-950/20 dark:border-indigo-900/30', desc: 'B2B sponsored posts & lead gen' },
  { id: 'WhatsApp', name: 'WhatsApp', icon: WhatsAppIcon, color: 'text-emerald-605 dark:text-emerald-400', bg: 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/30', desc: 'Direct chat alerts & broad messages' },
  { id: 'SMS', name: 'SMS Campaign', icon: Smartphone, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50/50 border-purple-100 hover:border-purple-300 dark:bg-purple-950/20 dark:border-purple-900/30', desc: 'Short SMS notifications & alerts' },
  { id: 'Instagram', name: 'Instagram Campaign', icon: Instagram, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50/50 border-pink-100 hover:border-pink-300 dark:bg-pink-955/20 dark:border-pink-900/30', desc: 'Visual story, reels & feed ads' },
  { id: 'Other', name: 'Other Channel', icon: Globe, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50/50 border-slate-200 hover:border-slate-350 dark:bg-slate-900/20 dark:border-slate-800', desc: 'Custom media, PPC, or directories' }
] as const;

// Helper to map backend channel code to frontend types
const mapChannelType = (channel: string | null | undefined, socialMediaTypes: string[] | null | undefined): Campaign['type'] => {
  const ch = (channel || (socialMediaTypes && socialMediaTypes[0]) || 'Other').toLowerCase().trim();
  if (ch.includes('email')) return 'Email';
  if (ch.includes('facebook')) return 'Facebook';
  if (ch.includes('linkedin')) return 'LinkedIn';
  if (ch.includes('whatsapp')) return 'WhatsApp';
  if (ch.includes('instagram')) return 'Instagram';
  if (ch.includes('sms')) return 'SMS';
  return 'Other';
};

// Helper to map backend status to frontend types
const mapStatus = (status: string | null | undefined): Campaign['status'] => {
  const st = (status || 'Planned').toLowerCase().trim();
  if (st.includes('draft') || st.includes('plan')) return 'Planned';
  if (st.includes('active') || st.includes('live')) return 'Active';
  if (st.includes('pause')) return 'Paused';
  if (st.includes('complete') || st.includes('done')) return 'Completed';
  return 'Planned';
};

export default function CampaignManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'all'; // 'direct' | 'social' | 'all'
  const {
    canCreateCampaign,
    canEditCampaign,
    canDeleteCampaign,
    canViewCampaignOverview,
    canExportCampaign,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewCampaignOverview) {
      toast.error('You do not have permission to view Campaigns.');
      router.push('/');
    }
  }, [canViewCampaignOverview, isLoaded, router]);

  const { primaryColor , user} = useStore();
  const queryClient = useQueryClient();

  const userId = getLoggedInUserId() || 1; // default fallback matching backend simulation
  const itemsPerPage = 10;

  // State controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Warning Delete Dialog State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; dbId: number } | null>(null);

  // ==========================================
  // TanStack queries
  // ==========================================

  // 1. Fetch dashboard KPIs
  const { data: kpiResponse, isLoading: isLoadingKPIs } = useQuery({
    queryKey: ['campaigns', 'kpis'],
    queryFn: () => fetchCampaignDashboardKPI(),
  });

  const kpis = kpiResponse?.data || {
    total_campaigns: 0,
    total_budget: 0,
    total_leads_generated: 0,
    average_roi: 0,
  };

  // 2. Fetch list based on activeTab
  const { data: allCampsResponse, isLoading: isLoadingAll } = useQuery({
    queryKey: ['campaigns', 'all', currentPage],
    queryFn: () => fetchCampaignsList(currentPage),
  });

  const { data: myCampsResponse, isLoading: isLoadingMy } = useQuery({
    queryKey: ['campaigns', 'my', currentPage, userId],
    queryFn: () => fetchMyCampaigns(currentPage, userId),
  });

  const activeResponse = activeTab === 'all' ? allCampsResponse : myCampsResponse;
  const isLoadingList = activeTab === 'all' ? isLoadingAll : isLoadingMy;

  const rawResults = activeResponse?.results || [];
  const totalCount = activeResponse?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const allCount = allCampsResponse?.count || 0;
  const myCount = myCampsResponse?.count || 0;

  // ==========================================
  // Mutations
  // ==========================================

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to delete campaign: ${err.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CampaignModel> & { id: number }) => updateCampaign(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated successfully!');
    },
    onError: (err: any) => {
      toast.error(`Failed to update campaign: ${err.message}`);
    }
  });

  const handleDeleteCampaignClick = (id: string, dbId: number) => {
    setCampaignToDelete({ id, dbId });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (campaignToDelete) {
      deleteMutation.mutate(campaignToDelete.dbId);
      setIsDeleteOpen(false);
      setCampaignToDelete(null);
    }
  };

  // Convert raw API results into Campaign objects matching UI structure
  const mappedCamps = rawResults.map((c: any) => {
    return {
      id: c.Promo_Id || String(c.id),
      dbId: c.id,
      name: c.Promo_Name || 'Unnamed Campaign',
      type: mapChannelType(c.Campaign_Channel, c.SocialMedia_Type),
      status: mapStatus(c.Campaign_Status),
      budget: Number(c.Budget) || 0,
      spend: Number(c.Spend_Amount) || 0,
      leadsGenerated: Number(c.Actual_Leads) || Number(c.Estimated_Leads) || 0,
      roi: Number(c.Actual_ROI) || Number(c.Estimated_ROI) || 0,
      startDate: c.Start_Date || c.Promo_Date || '',
      endDate: c.End_Date || '',
      description: c.Campaign_Description || c.Promo_Content || '',
    };
  });

  const filteredCamps = mappedCamps.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    
    let matchesCategory = true;
    if (category === 'direct') {
      matchesCategory = c.type === 'Email' || c.type === 'WhatsApp';
    } else if (category === 'social') {
      matchesCategory = c.type === 'Facebook' || c.type === 'LinkedIn' || c.type === 'Instagram';
    }
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Type', 'Status', 'Budget', 'Spend', 'Leads Generated', 'ROI (%)', 'Start Date'];
    const data = filteredCamps.map(c => [c.id, c.name, c.type, c.status, c.budget, c.spend, c.leadsGenerated, c.roi, c.startDate]);
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaigns.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Campaigns list exported successfully!');
  };

  const statusStyles = {
    Planned: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    Active: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    Paused: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    Completed: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  };

  if (isLoaded && !canViewCampaignOverview) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Breadcrumbs */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{getTenantName().toUpperCase()}</BreadcrumbPage>

            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Marketing</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Campaigns</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {category === 'direct' ? 'Email & WhatsApp Campaigns' : category === 'social' ? 'Social Media Campaigns' : 'Campaign Management'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {category === 'direct' 
              ? 'Design, track, and measure performance for email and WhatsApp broadcasts.' 
              : category === 'social' 
                ? 'Design, track, and measure performance across Facebook, LinkedIn, and Instagram.' 
                : 'Design, track, and measure performance across all marketing channels.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-10 h-10 bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'All')}>
            <SelectTrigger className="w-[160px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 h-10">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {canCreateCampaign && (
            <Button
              onClick={() => router.push(`/marketing/campaigns/create${category !== 'all' ? `?category=${category}` : ''}`)}
              style={{ backgroundColor: primaryColor }}
              className="text-white font-extrabold gap-2 h-10 shadow-sm px-5"
            >
              <Plus className="h-4 w-4" /> Create Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Campaigns</span>
            <Megaphone className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-slate-850 dark:text-white">
            {isLoadingKPIs ? '...' : kpis.total_campaigns}
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Budget</span>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-blue-600 dark:text-blue-400">
            {isLoadingKPIs ? '...' : `₹${Number(kpis.total_budget || 0).toLocaleString()}`}
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leads Generated</span>
            <Users className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-emerald-600 dark:text-emerald-450">
            {isLoadingKPIs ? '...' : Number(kpis.total_leads_generated || 0).toLocaleString()}
          </p>
        </div>
        <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average ROI</span>
            <Percent className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-3xl font-extrabold mt-2 text-purple-600 dark:text-purple-400">
            {isLoadingKPIs ? '...' : `${Math.round(Number(kpis.average_roi || 0))}%`}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 border-b dark:border-slate-800 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-850 dark:text-white shrink-0">Campaign Details</h2>
            <div className="flex items-center gap-2 border-l pl-4 dark:border-slate-800">
              {[
                { id: 'all', label: 'All Campaigns' },
                { id: 'my', label: 'My Campaigns' }
              ].map(tab => {
                const isSel = activeTab === tab.id;
                const displayCount = tab.id === 'all' ? allCount : myCount;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setCurrentPage(1);
                    }}
                    className={`py-1 px-3 text-xs font-bold transition-all rounded-lg border cursor-pointer ${isSel
                      ? 'bg-primary text-white border-primary'
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 bg-transparent'
                      }`}
                    style={isSel ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                  >
                    {tab.label} ({displayCount})
                  </button>
                );
              })}
            </div>
          </div>
          {canExportCampaign && (
            <Button variant="outline" onClick={handleExport} className="h-9 px-4 gap-2 border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs rounded-xl self-end sm:self-auto">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-955/20">
              <TableRow className="border-b dark:border-slate-800">
                <TableHead className="w-24 text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5">Campaign ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5">Campaign Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5">Channel / Type</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5">Status</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5 text-right">Budget (INR)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5 text-right">Spend (INR)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5 text-center">ROI</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5">Start Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 py-3.5 text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingList ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm">Loading campaigns...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCamps.map((camp) => {
                  const IconComp = CHANNELS.find(ch => ch.id === camp.type)?.icon || Globe;
                  const channelColor = CHANNELS.find(ch => ch.id === camp.type)?.color || 'text-slate-500';
                  const channelBg = CHANNELS.find(ch => ch.id === camp.type)?.bg || 'bg-slate-50';

                  return (<TableRow key={camp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-905/20 border-b dark:border-slate-800 transition-colors">
                    <TableCell className="text-xs font-bold text-slate-400 dark:text-slate-555 py-3.5">{camp.id}</TableCell>
                    <TableCell className="font-bold text-slate-850 dark:text-slate-200 py-3.5">
                      <button
                        onClick={() => router.push(`/marketing/campaigns/${camp.dbId}`)}
                        className="text-left font-bold text-slate-850 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 hover:underline flex items-center gap-2"
                      >
                        <Megaphone className="h-4 w-4 text-slate-400 shrink-0" />
                        {camp.name}
                      </button>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg border ${channelBg} ${channelColor}`}>
                          <IconComp className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-355">{camp.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge variant="outline" className={`rounded-md font-semibold text-[11px] py-0.5 px-2.5 ${statusStyles[camp.status]}`}>
                        {camp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-950 dark:text-white py-3.5">
                      ₹{camp.budget.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-500 dark:text-slate-400 py-3.5">
                      ₹{camp.spend.toLocaleString()}
                    </TableCell>

                    <TableCell className="text-center py-3.5">
                      <Badge variant="outline" className={`font-bold text-[11px] ${camp.roi >= 200 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : camp.roi >= 100 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-655'}`}>
                        {camp.roi}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-600 dark:text-slate-400 py-3.5">{camp.startDate}</TableCell>
                    <TableCell className="text-right py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-52 dark:bg-slate-900 border dark:border-slate-800 shadow-md">
                          <DropdownMenuLabel className="text-[10px] font-bold uppercase text-slate-400">Campaign Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {canEditCampaign && (
                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/marketing/campaigns/${camp.dbId}/edit`)}>
                              <Edit className="h-4 w-4 text-slate-500" /> Edit Details
                            </DropdownMenuItem>
                          )}
                          {canViewCampaignOverview && (
                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => router.push(`/marketing/campaigns/${camp.dbId}`)}>
                              <Eye className="h-4 w-4 text-slate-500" /> View Campaign Preview
                            </DropdownMenuItem>
                          )}
                          {canEditCampaign && (
                            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => {
                              updateMutation.mutate({ id: camp.dbId, Campaign_Status: 'Active' });
                            }}>
                              <TrendingUp className="h-4 w-4 text-emerald-600" /> Launch / Activate
                            </DropdownMenuItem>
                          )}
                          {canDeleteCampaign && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 cursor-pointer text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold" onClick={() => handleDeleteCampaignClick(camp.id, camp.dbId)}>
                                <Trash2 className="h-4 w-4 text-rose-600" /> Delete Campaign
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
              {!isLoadingList && filteredCamps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-slate-400" />
                      <span className="text-sm">No campaigns found matching search filters.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Pagination Controls */}
        {!isLoadingList && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-t dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-455">
              Showing <span className="text-slate-800 dark:text-white font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="text-slate-800 dark:text-white font-bold">
                {Math.min(currentPage * itemsPerPage, totalCount)}
              </span>{' '}
              of <span className="text-slate-800 dark:text-white font-bold">{totalCount}</span> campaigns
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNum = index + 1;
                const isCurrent = pageNum === currentPage;
                return (
                  <Button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    variant={isCurrent ? 'default' : 'outline'}
                    style={isCurrent ? { backgroundColor: primaryColor } : {}}
                    className={`h-8 w-8 rounded-lg text-xs font-bold ${isCurrent
                      ? 'text-white'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="h-8 w-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-500 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Campaign Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 rounded-xl dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600" /> Confirm Campaign Deletion
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to delete campaign <span className="font-bold text-slate-700 dark:text-slate-350">{campaignToDelete?.id}</span>? This action is permanent and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t dark:border-slate-800 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setCampaignToDelete(null);
              }}
              className="h-9 px-4 font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-xs rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={handleConfirmDelete}
              className="h-9 px-5 font-bold text-white bg-rose-600 hover:bg-rose-700 text-xs rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
