'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  List,
  LayoutGrid,
  MoreVertical,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Trash2,
  Edit,
  Eye,
  TrendingUp,
  ChevronDown,
  User,
  Calendar,
  Globe,
  Settings,
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { Company } from '@/types/companies';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePermission } from '@/hooks/usePermission';
import { fetchAccountdashboardcards, fetchAccountmylistwithdealcount, fetchAccountSearch, createAccountfilter, deleteAccountCRUD } from '@/service/api/Company/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function CompaniesPage() {
  const { primaryColor, user } = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { companies: storeCompanies, deleteCompany, updateCompany } = useCompanyStore();
  const {
    canCreateCompany,
    canEditCompany,
    canDeleteCompany,
    canViewCompanyOverview,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewCompanyOverview) {
      toast.error('You do not have permission to view Companies.');
      router.push('/');
    }
  }, [canViewCompanyOverview, isLoaded, router]);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Backend Filter Fields States
  const [filterLeadName, setFilterLeadName] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterMail, setFilterMail] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Debounced filter states
  const [debouncedFilterLeadName, setDebouncedFilterLeadName] = useState('');
  const [debouncedFilterPhone, setDebouncedFilterPhone] = useState('');
  const [debouncedFilterMail, setDebouncedFilterMail] = useState('');
  const [debouncedFilterIndustry, setDebouncedFilterIndustry] = useState('');
  const [debouncedFilterLocation, setDebouncedFilterLocation] = useState('');
  const [debouncedFilterStartDate, setDebouncedFilterStartDate] = useState('');
  const [debouncedFilterEndDate, setDebouncedFilterEndDate] = useState('');

  // Filter Modal Dialog State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilterLeadName(filterLeadName);
      setDebouncedFilterPhone(filterPhone);
      setDebouncedFilterMail(filterMail);
      setDebouncedFilterIndustry(filterIndustry);
      setDebouncedFilterLocation(filterLocation);
      setDebouncedFilterStartDate(filterStartDate);
      setDebouncedFilterEndDate(filterEndDate);
    }, 450);
    return () => clearTimeout(timer);
  }, [filterLeadName, filterPhone, filterMail, filterIndustry, filterLocation, filterStartDate, filterEndDate]);

  const createdDatePayload = useMemo(() => {
    if (debouncedFilterStartDate.trim() && debouncedFilterEndDate.trim()) {
      return [debouncedFilterStartDate.trim(), debouncedFilterEndDate.trim()];
    } else if (debouncedFilterStartDate.trim()) {
      return [debouncedFilterStartDate.trim(), debouncedFilterStartDate.trim()];
    } else if (debouncedFilterEndDate.trim()) {
      return [debouncedFilterEndDate.trim(), debouncedFilterEndDate.trim()];
    }
    return undefined;
  }, [debouncedFilterStartDate, debouncedFilterEndDate]);

  const isFilterActive = useMemo(() => {
    return !!(
      debouncedFilterLeadName.trim() ||
      debouncedFilterPhone.trim() ||
      debouncedFilterMail.trim() ||
      debouncedFilterIndustry.trim() ||
      debouncedFilterLocation.trim() ||
      createdDatePayload
    );
  }, [
    debouncedFilterLeadName,
    debouncedFilterPhone,
    debouncedFilterMail,
    debouncedFilterIndustry,
    debouncedFilterLocation,
    createdDatePayload
  ]);

  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [viewMode, setViewMode] = useState<'List' | 'Card'>('List');
  const [showFilters, setShowFilters] = useState(false);

  // Delete confirm dialog states
  const [companyToDelete, setCompanyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // User resolving ID
  const finalUserId = useMemo(() => {
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : (user?.id || 71);
    return typeof userId === 'string' ? parseInt(userId, 10) : userId;
  }, [user?.id]);

  // Fetch KPI dashboard cards using useQuery
  const { data: kpiCards, isLoading: loadingKpis } = useQuery({
    queryKey: ['accountDashboardCards', finalUserId],
    queryFn: () => fetchAccountdashboardcards(finalUserId),
    enabled: !!finalUserId,
  });

  // Fetch Companies List using useQuery
  const { data: apiCompaniesRaw, isLoading: loadingCompanies } = useQuery({
    queryKey: ['accountMyListWithDealCount', finalUserId],
    queryFn: () => fetchAccountmylistwithdealcount(finalUserId),
    enabled: !!finalUserId && !isFilterActive,
  });

  // Fetch Search results using useQuery
  const { data: searchResultsRaw, isLoading: loadingSearch } = useQuery({
    queryKey: ['accountSearch', debouncedSearchQuery],
    queryFn: () => fetchAccountSearch(debouncedSearchQuery),
    enabled: !!debouncedSearchQuery.trim(),
  });

  // Fetch Filtered results using useQuery
  const { data: filteredResultsRaw, isLoading: loadingFilter } = useQuery({
    queryKey: [
      'accountFilter',
      finalUserId,
      currentPage,
      debouncedFilterLeadName,
      debouncedFilterPhone,
      debouncedFilterMail,
      debouncedFilterIndustry,
      debouncedFilterLocation,
      createdDatePayload
    ],
    queryFn: () => createAccountfilter({
      User_Id: finalUserId,
      Phone_Number: debouncedFilterPhone,
      page: currentPage,
      Lead_Name: debouncedFilterLeadName,
      Location: debouncedFilterLocation,
      Mail: debouncedFilterMail,
      Industry: debouncedFilterIndustry,
      ...(createdDatePayload ? { Created_Date: createdDatePayload } : {})
    }),
    enabled: !!finalUserId && isFilterActive,
  });

  const isTyping = searchQuery !== debouncedSearchQuery;
  const showLoading = (loadingCompanies && !isFilterActive) ||
    (!!debouncedSearchQuery.trim() && loadingSearch) ||
    (isFilterActive && loadingFilter) ||
    isTyping;

  // Map API list response
  const apiCompanies = useMemo<Company[]>(() => {
    let rawList = !!debouncedSearchQuery.trim()
      ? searchResultsRaw
      : (isFilterActive ? filteredResultsRaw : apiCompaniesRaw);
    if (rawList && !Array.isArray(rawList) && typeof rawList === 'object') {
      if (Array.isArray(rawList.results)) {
        rawList = rawList.results;
      } else if (Array.isArray((rawList as any).data)) {
        rawList = (rawList as any).data;
      }
    }
    if (!Array.isArray(rawList)) return [];

    return rawList.map((c: any) => {
      let parsedTags: string[] = [];
      if (c.Tags) {
        if (typeof c.Tags === 'string') {
          try {
            parsedTags = JSON.parse(c.Tags);
          } catch (e) {
            parsedTags = [c.Tags];
          }
        } else if (Array.isArray(c.Tags)) {
          parsedTags = c.Tags;
        }
      }

      return {
        id: c.id.toString(),
        companyName: c.Organization_Name || c.companyName || 'N/A',
        status: 'Active' as const,
        industry: c.Industry || 'IT',
        phone: c.Phone_Number || 'N/A',
        email: c.Mail || 'N/A',
        website: c.Website || '',
        employeeSize: c.Employees || '0',
        annualRevenue: c.Turn_Over ? c.Turn_Over.toString() : '',
        companyType: c.Client_Type || '',
        location: c.Location || 'N/A',
        currency: 'BDT',
        country: c.Country || '',
        city: c.City || '',
        postalCode: '',
        address: c.Address || '',
        source: c.Lead_Source || '',
        owner: c.Account_Owner || c.Lead_Owner || c.Lead_Name || 'Unassigned',
        tags: parsedTags,
        notes: c.About || '',
        deals: Array.from({ length: c.deals || 0 }).map((_, i) => ({
          id: `deal-${i}`,
          dealName: '',
          stage: '',
          dealValue: 0,
          expectedClose: '',
          owner: ''
        })),
        contacts: [],
        notesList: [],
        timeline: [],
        createdAt: c.Created_Date || '',
        updatedAt: c.Updated_Date || c.Created_Date || ''
      };
    });
  }, [apiCompaniesRaw, searchResultsRaw, filteredResultsRaw, debouncedSearchQuery, isFilterActive]);

  const companies = apiCompanies.length > 0 || !loadingCompanies ? apiCompanies : storeCompanies;

  // Dynamic KPI Calculations (fallbacks if API not loaded)
  const totalCompaniesCount = kpiCards?.Total_Companies ?? companies.length;
  const activeCompaniesCount = kpiCards?.Active_Companies ?? companies.filter(c => c.status === 'Active').length;
  const totalDealsCount = kpiCards?.Total_Deals ?? companies.reduce((acc, c) => acc + (c.deals?.length || 0), 0);
  const totalPipelineValue = kpiCards?.Total_Pipeline_Value ?? companies.reduce(
    (acc, c) => acc + (c.deals?.reduce((sum, d) => sum + d.dealValue, 0) || 0),
    0
  );

  // Extract unique industries & owners for filters
  const uniqueIndustries = Array.from(new Set(companies.map(c => c.industry).filter(Boolean)));
  const uniqueOwners = Array.from(new Set(companies.map(c => c.owner).filter(Boolean)));

  // Filter Logic
  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      isFilterActive || debouncedSearchQuery.trim() !== ''
        ? true
        : (company.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Active' && company.status === 'Active') ||
      (activeTab === 'Inactive' && company.status === 'Inactive');

    const matchesIndustry = isFilterActive || industryFilter === 'All' || company.industry === industryFilter;
    const matchesOwner = isFilterActive || ownerFilter === 'All' || company.owner === ownerFilter;
    const matchesStatus = isFilterActive || statusFilter === 'All' || company.status === statusFilter;

    return matchesSearch && matchesTab && matchesIndustry && matchesOwner && matchesStatus;
  });

  // Pagination Logic
  const isServerPaginated = !!debouncedSearchQuery.trim() || isFilterActive;

  const totalItems = isServerPaginated
    ? (!!debouncedSearchQuery.trim() ? (searchResultsRaw?.count ?? 0) : (filteredResultsRaw?.count ?? 0))
    : filteredCompanies.length;

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedCompanies = isServerPaginated
    ? filteredCompanies
    : filteredCompanies.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDelete = (id: string, name: string) => {
    setCompanyToDelete({ id, name });
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    const { id, name } = companyToDelete;
    try {
      await deleteAccountCRUD(id);
      deleteCompany(id);
      setSelectedCompanies(prev => prev.filter(cId => cId !== id));
      toast.success(`Company ${name} has been deleted.`);
      queryClient.invalidateQueries({ queryKey: ['accountMyListWithDealCount', finalUserId] });
      queryClient.invalidateQueries({ queryKey: ['accountDashboardCards', finalUserId] });
      if (isFilterActive) {
        queryClient.invalidateQueries({ queryKey: ['accountFilter', finalUserId] });
      }
      if (debouncedSearchQuery.trim()) {
        queryClient.invalidateQueries({ queryKey: ['accountSearch', debouncedSearchQuery] });
      }
    } catch (err: any) {
      toast.error(`Failed to delete company: ${err.message || err}`);
    } finally {
      setCompanyToDelete(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedCompanies.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const confirmDeleteSelected = async () => {
    try {
      await Promise.all(selectedCompanies.map(id => deleteAccountCRUD(id)));
      selectedCompanies.forEach(id => {
        deleteCompany(id);
      });
      toast.success(`Deleted ${selectedCompanies.length} companies successfully.`);
      setSelectedCompanies([]);
      queryClient.invalidateQueries({ queryKey: ['accountMyListWithDealCount', finalUserId] });
      queryClient.invalidateQueries({ queryKey: ['accountDashboardCards', finalUserId] });
      if (isFilterActive) {
        queryClient.invalidateQueries({ queryKey: ['accountFilter', finalUserId] });
      }
      if (debouncedSearchQuery.trim()) {
        queryClient.invalidateQueries({ queryKey: ['accountSearch', debouncedSearchQuery] });
      }
    } catch (err: any) {
      toast.error(`Failed to delete some selected companies: ${err.message || err}`);
    } finally {
      setShowBulkDeleteConfirm(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === paginatedCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(paginatedCompanies.map(c => c.id));
    }
  };

  const toggleSelectCompany = (id: string) => {
    setSelectedCompanies(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO';
  };

  const handleSelectionChange = (selectedOnCurrentPage: Company[]) => {
    const currentPageIds = new Set(paginatedCompanies.map(c => c.id));
    setSelectedCompanies(prev => {
      const otherPagesSelected = prev.filter(id => !currentPageIds.has(id));
      const currentSelectedIds = selectedOnCurrentPage.map(c => c.id);
      return [...otherPagesSelected, ...currentSelectedIds];
    });
  };

  const tableColumns = useMemo<ColumnConfig<Company>[]>(() => [
    {
      key: 'companyName',
      header: 'Company Name',
      sortable: false,
      render: (company) => (
        <div className="flex items-center gap-3">
          {/* Logo Initial block */}
          <div
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
          >
            {getInitials(company.companyName)}
          </div>
          <div>
            <NavLink
              to={`/companies/${company.id}`}
              className="font-semibold text-slate-800 dark:text-slate-200 hover:text-primary transition-colors hover:underline block"
            >
              {company.companyName}
            </NavLink>
          </div>
        </div>
      )
    },
    {
      key: 'industry',
      header: 'Industry',
      sortable: false,
      render: (company) => (
        <Badge variant="outline" className="rounded-md text-[10px] font-bold bg-slate-50 dark:bg-slate-800/40 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-855 px-2.5">
          {company.industry}
        </Badge>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: false,
      className: 'font-semibold text-xs text-slate-700 dark:text-slate-350'
    },
    {
      key: 'email',
      header: 'Email',
      sortable: false,
      className: 'text-xs text-slate-500 dark:text-slate-400'
    },
    {
      key: 'location',
      header: 'Location',
      sortable: false,
      className: 'text-xs text-slate-655 dark:text-slate-400',
      render: (company) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[120px]">{company.location}</span>
        </div>
      )
    },
    {
      key: 'deals',
      header: 'Deals',
      sortable: false,
      className: 'text-center font-bold font-mono text-slate-850 dark:text-white text-xs',
      render: (company) => company.deals?.length || 0
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: false,
      render: (company) => (
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
            {company.owner ? company.owner.charAt(0) : 'U'}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{company.owner || 'Unassigned'}</span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created On',
      sortable: false,
      className: 'text-xs text-slate-455 dark:text-slate-500'
    }
  ], [primaryColor]);

  if (isLoaded && !canViewCompanyOverview) {
    return null;
  }

  return (
    <div className="space-y-6 text-left">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink >{getTenantName().toUpperCase()}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Sales & CRM</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Companies</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Header Block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Companies</h1>
            <Badge variant="secondary" className="rounded-full text-xs py-0.5 px-2.5 font-bold">
              {companies.length} Total
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">Manage partner companies, view pipelines, track deals, and maintain customer accounts.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filters Button */}
          <Button
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            className={cn(
              "h-9 px-4 gap-2 border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer font-bold text-xs text-slate-700 dark:text-slate-300 relative",
              isFilterActive ? "bg-primary/10 text-primary border-primary/40 font-bold" : ""
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {isFilterActive && (
              <span className="h-2 w-2 rounded-full bg-primary inline-block ml-0.5 animate-pulse" />
            )}
          </Button>

          {/* Add Company Action */}
          {canCreateCompany && (
            <Button
              onClick={() => router.push('/companies/create')}
              style={{ backgroundColor: primaryColor }}
              className="text-white font-semibold rounded-xl h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Company
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Companies */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Companies</span>
            {loadingKpis ? (
              <Skeleton className="h-8 w-16 mt-1 rounded-md" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalCompaniesCount}</p>
            )}
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        {/* Active Companies */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</span>
            {loadingKpis ? (
              <Skeleton className="h-8 w-16 mt-1 rounded-md" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{activeCompaniesCount}</p>
            )}
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
            <Building2 className="h-5 w-5 text-emerald-500" />
          </div>
        </div>

        {/* Total Deals */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Deals</span>
            {loadingKpis ? (
              <Skeleton className="h-8 w-16 mt-1 rounded-md" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalDealsCount}</p>
            )}
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl">
            <Briefcase className="h-5 w-5 text-purple-500" />
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between shadow-xs hover:shadow-sm transition-all duration-200">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Value</span>
            {loadingKpis ? (
              <Skeleton className="h-8 w-32 mt-1 rounded-md" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalPipelineValue.toLocaleString('en-IN')}</p>
            )}
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
            <TrendingUp className="h-5 w-5 text-amber-500" />
          </div>
        </div>
      </div>
      {/* Main Companies Container */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">

        {/* Filter/Search Header */}
        <AnimatePresence mode="wait">
          {selectedCompanies.length === 0 ? (
            <div className="flex flex-col border-b dark:border-slate-800">
              <motion.div
                key="default-header"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-3 md:flex-row md:items-center justify-between px-6 py-2 bg-white dark:bg-slate-900"
              >
                {/* Left Side: Section Title */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">All Companies</span>
                  <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-805 text-slate-600 dark:text-slate-350 font-bold">
                    {companies.length}
                  </Badge>
                </div>

                {/* Right Side: Search and View Mode */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto py-2 md:py-0">
                  <div className="relative w-full md:w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search companies..."
                      className="pl-8.5 h-8.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-350 w-full"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                  </div>

                  {/* View Toggles */}
                  <div className="flex items-center border dark:border-slate-805 rounded-xl p-0.5 bg-slate-50/50 dark:bg-slate-955/30">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('List')}
                      className={cn(
                        "h-7 w-7 rounded-lg cursor-pointer transition-all",
                        viewMode === 'List'
                          ? "bg-white dark:bg-slate-850 text-primary shadow-2xs border dark:border-slate-750 font-semibold"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode('Card')}
                      className={cn(
                        "h-7 w-7 rounded-lg cursor-pointer transition-all",
                        viewMode === 'Card'
                          ? "bg-white dark:bg-slate-850 text-primary shadow-2xs border dark:border-slate-750 font-semibold"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                  </div>


                </div>
              </motion.div>

              {/* Active Filters Bar */}
              {isFilterActive && (
                <div className="flex flex-wrap items-center gap-2 px-6 py-2.5 bg-slate-50/70 dark:bg-slate-900/40 border-t dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Active Filters:
                  </span>
                  {filterLeadName && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
                      Name: <span className="font-bold">{filterLeadName}</span>
                      <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setFilterLeadName('')} />
                    </Badge>
                  )}
                  {filterPhone && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
                      Phone: <span className="font-bold">{filterPhone}</span>
                      <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setFilterPhone('')} />
                    </Badge>
                  )}
                  {filterMail && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
                      Email: <span className="font-bold">{filterMail}</span>
                      <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setFilterMail('')} />
                    </Badge>
                  )}
                  {filterIndustry && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
                      Industry: <span className="font-bold">{filterIndustry}</span>
                      <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setFilterIndustry('')} />
                    </Badge>
                  )}
                  {filterLocation && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
                      Location: <span className="font-bold">{filterLocation}</span>
                      <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setFilterLocation('')} />
                    </Badge>
                  )}
                  {(filterStartDate || filterEndDate) && (
                    <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
                      Created: <span className="font-bold">{filterStartDate || '...'} to {filterEndDate || '...'}</span>
                      <X className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterLeadName('');
                      setFilterPhone('');
                      setFilterMail('');
                      setFilterIndustry('');
                      setFilterLocation('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setCurrentPage(1);
                    }}
                    className="h-6 px-2 text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-md cursor-pointer ml-auto"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              key="selected-header"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-905 border-b dark:border-slate-800 rounded-t-2xl"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  {selectedCompanies.length} selected
                </span>
              </div>
              {canDeleteCompany && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  className="h-8.5 px-4 rounded-xl font-bold text-xs gap-2 flex items-center cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Selected
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="p-0">
          {filteredCompanies.length === 0 && !showLoading ? (
            <div className="py-16 text-center">
              <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-semibold">No companies found matching the filters.</p>
            </div>
          ) : viewMode === 'List' ? (
            showLoading ? (
              <div className="overflow-x-auto w-full">
                <Table className="min-w-[1000px] border-collapse">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b dark:border-slate-800">
                      <TableHead className="w-12 text-center py-4">
                        <Checkbox disabled className="rounded-md h-3.5 w-3.5" />
                      </TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Company Name</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Industry</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Phone</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Email</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Location</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4 text-center">Deals</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Owner</TableHead>
                      <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400 py-4">Created On</TableHead>
                      <TableHead className="w-20 text-center py-4"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx} className="animate-pulse border-b dark:border-slate-800/60">
                        <TableCell className="text-center py-3"><Skeleton className="h-4 w-4 rounded" /></TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-xl" />
                            <div className="space-y-1.5 flex-1 text-left">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3"><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3 text-left">
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="h-3.5 w-3.5 rounded" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center"><Skeleton className="h-4.5 w-8 mx-auto" /></TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell className="py-3 text-center"><Skeleton className="h-8 w-8 rounded-xl ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <ReusableTable
                columns={tableColumns}
                data={paginatedCompanies}
                enableSelection={true}
                selectedRowIds={selectedCompanies}
                onSelectionChange={handleSelectionChange}
                rowIdKey="id"
                page={currentPage}
                totalRecords={totalItems}
                onChangePage={handlePageChange}
                pageSize={itemsPerPage}
                showGear={true}
                actions={(company) => (
                  <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {canEditCompany && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-primary cursor-pointer"
                        onClick={() => router.push(`/companies/${company.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteCompany && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-955/20 dark:hover:text-rose-400 rounded-lg text-slate-500 cursor-pointer"
                        onClick={() => handleDelete(company.id, company.companyName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              />
            )
          ) : (
            /* Card Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-6 bg-slate-50/20 dark:bg-slate-955/5">
              {showLoading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 rounded-2xl p-5 shadow-xs animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11 rounded-xl" />
                      <div className="space-y-2 flex-1 text-left">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                    <div className="space-y-3.5 border-t dark:border-slate-800 pt-3.5">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))
              ) : (
                paginatedCompanies.map((company) => {
                  const isSelected = selectedCompanies.includes(company.id);
                  const dealsCount = company.deals?.length || 0;
                  const pipelineVal = company.deals?.reduce((sum, d) => sum + d.dealValue, 0) || 0;

                  return (
                    <div
                      key={company.id}
                      className={cn(
                        "bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col relative",
                        isSelected ? "ring-1" : ""
                      )}
                      style={isSelected ? { boxShadow: `0 0 0 1px ${primaryColor}` } : {}}
                    >
                      {/* Checkbox and Menu */}
                      <div className="absolute top-4 right-4 flex items-center gap-1.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectCompany(company.id)}
                          className="rounded-md h-3.5 w-3.5"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-36 dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-1">
                            {canViewCompanyOverview && (
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => router.push(`/companies/${company.id}`)}>
                                <Eye className="h-3.5 w-3.5 text-slate-400" /> View
                              </DropdownMenuItem>
                            )}
                            {canEditCompany && (
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => router.push(`/companies/${company.id}/edit`)}>
                                <Edit className="h-3.5 w-3.5 text-slate-400" /> Edit
                              </DropdownMenuItem>
                            )}
                            {canDeleteCompany && (
                              <DropdownMenuItem className="gap-2 cursor-pointer text-xs text-red-650 hover:text-red-750 dark:text-rose-400 dark:hover:text-rose-350" onClick={() => handleDelete(company.id, company.companyName)}>
                                <Trash2 className="h-3.5 w-3.5 text-red-400" /> Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Logo & Name */}
                      <div className="flex items-center gap-3.5 mb-4">
                        <div
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                          className="h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                        >
                          {getInitials(company.companyName)}
                        </div>
                        <div className="pr-6 text-left">
                          <NavLink
                            to={`/companies/${company.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors text-sm hover:underline block truncate max-w-[140px]"
                          >
                            {company.companyName}
                          </NavLink>
                          <span className="text-[10px] text-slate-455 block font-mono mt-0.5">{company.id}</span>
                        </div>
                      </div>

                      {/* Main Specs */}
                      <div className="space-y-3.5 text-xs flex-1 border-t border-slate-100 dark:border-slate-850 pt-3.5 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industry</span>
                          <Badge variant="outline" className="rounded-md text-[10px] font-bold bg-slate-50 dark:bg-slate-800/40 text-slate-650 dark:text-slate-400 border-slate-200 dark:border-slate-850 px-2.5">
                            {company.industry}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                          <span className="truncate">{company.location}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Phone className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                          <span>{company.phone}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-650 dark:text-slate-400">
                          <Mail className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                          <span className="truncate">{company.email}</span>
                        </div>

                        {/* Deals & Pipeline metrics */}
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-955/20 p-2.5 rounded-xl">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Deals</span>
                            <span className="font-bold text-slate-850 dark:text-white font-mono text-sm">{dealsCount}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Pipeline</span>
                            <span className="font-bold text-slate-850 dark:text-white font-mono text-sm">৳ {pipelineVal.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Owner assignment info at bottom */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-400">
                            {company.owner ? company.owner.charAt(0) : 'U'}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-350">{company.owner}</span>
                        </div>                        {/* Active status indicator */}
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border",
                          company.status === 'Active'
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                            : "bg-slate-105 text-slate-505 border-slate-200 dark:bg-slate-805 dark:text-slate-400 dark:border-slate-700"
                        )}>
                          {company.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900">
            <span className="text-xs text-slate-400 font-semibold">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} of {filteredCompanies.length} entries
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-3 text-xs border-slate-205 dark:border-slate-800 text-slate-650 dark:text-slate-350 rounded-xl disabled:opacity-50 cursor-pointer font-bold"
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                const isSelected = currentPage === page;
                return (
                  <Button
                    key={page}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    style={isSelected ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                    className={cn(
                      "h-8 w-8 text-xs font-bold rounded-xl cursor-pointer",
                      isSelected
                        ? "text-white"
                        : "border-slate-205 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-3 text-xs border-slate-205 dark:border-slate-800 text-slate-650 dark:text-slate-350 rounded-xl disabled:opacity-50 cursor-pointer font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* FILTER MODAL DIALOG */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 text-left shadow-2xl">
          <DialogHeader className="border-b dark:border-slate-800 pb-4">
            <DialogTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Filter className="h-4.5 w-4.5 text-primary" /> Filter Companies
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Specify criteria to filter your customer company accounts and records.
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
            {/* Company Name */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Company Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="e.g. TechCorp"
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  value={filterLeadName}
                  onChange={(e) => { setFilterLeadName(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="e.g. 8838528726"
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  value={filterPhone}
                  onChange={(e) => { setFilterPhone(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="e.g. info@company.com"
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  value={filterMail}
                  onChange={(e) => { setFilterMail(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Industry</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="e.g. IT Services"
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  value={filterIndustry}
                  onChange={(e) => { setFilterIndustry(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5 text-left sm:col-span-2">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="e.g. Chennai"
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  value={filterLocation}
                  onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Created Date From */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Created Date (From)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  value={filterStartDate}
                  onChange={(e) => { setFilterStartDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Created Date To */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Created Date (To)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  value={filterEndDate}
                  onChange={(e) => { setFilterEndDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t dark:border-slate-800 pt-4 gap-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFilterLeadName('');
                setFilterPhone('');
                setFilterMail('');
                setFilterIndustry('');
                setFilterLocation('');
                setFilterStartDate('');
                setFilterEndDate('');
                setCurrentPage(1);
              }}
              className="h-9 px-3 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFilterModalOpen(false)}
                className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-bold h-9 px-5 text-xs rounded-xl cursor-pointer hover:opacity-90 transition-all"
              >
                Apply Filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent className="dark:bg-slate-900 border dark:border-slate-805 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-slate-900 dark:text-white">Delete Company</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete <strong>{companyToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 h-9" onClick={() => setCompanyToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-650 hover:bg-red-750 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer active:scale-95 transition-all"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent className="dark:bg-slate-900 border dark:border-slate-805 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-slate-900 dark:text-white">Delete Selected Companies</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-505">
              Are you sure you want to delete the <strong>{selectedCompanies.length}</strong> selected companies? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-slate-200 dark:border-slate-800 h-9" onClick={() => setShowBulkDeleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSelected}
              className="bg-red-650 hover:bg-red-750 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer active:scale-95 transition-all"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
