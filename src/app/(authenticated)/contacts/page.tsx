'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Plus,
  Search,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  UserCheck2,
  AlertCircle,
  Briefcase,
  Star,
  Grid,
  List,
  Settings,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle,
  X,
  Calendar,
  RotateCcw,
  Eye
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import { useKnowlarity } from '@/store/KnowlarityContext';

import { Contact } from '@/store/useContactStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchContactsList,
  fetchRecentlyAddedContacts,
  fetchFavoriteContacts,
  searchContacts,
  filterContacts,
  fetchContactDashboardCards,
  deleteContact,
  updateContact,
  createContact,
  downloadContactTemplate,
  uploadContactTemplate,
  getLoggedInUserId,
  ContactModel,
  ContactFilterPayload,
  fetchContactListWithoutPagination
} from '@/service/api/contacts/api';
import { fetchUsersList } from '@/service/api/Leads/api';

export default function ContactsPage() {
  const router = useRouter();
  const { makeCall, isPlacingCall } = useKnowlarity();
  const { primaryColor , user} = useStore();
  const {
    canCreateContact,
    canEditContact,
    canDeleteContact,
    canViewContactOverview,
    canImportContact,
    canExportContact,
    isLoaded
  } = usePermission();

  useEffect(() => {
  
  if (isLoaded && !canViewContactOverview) {

      toast.error('You do not have permission to view Contacts.');
      router.push('/');
    }
  }, [canViewContactOverview, isLoaded, router]);
  const userId = getLoggedInUserId() || 72; // default fallback
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'recent' | 'favorites'>('all');
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');

  // Modal Dialog States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);

  // Applied Filter States
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [ownerFilter, setOwnerFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [createdFromDate, setCreatedFromDate] = useState<string>('');
  const [createdToDate, setCreatedToDate] = useState<string>('');

  // Draft / Temp Filter States for Modal Editing
  const [tempStatusFilter, setTempStatusFilter] = useState<string>('All');
  const [tempOwnerFilter, setTempOwnerFilter] = useState<string>('All');
  const [tempSourceFilter, setTempSourceFilter] = useState<string>('All');
  const [tempCreatedFromDate, setTempCreatedFromDate] = useState<string>('');
  const [tempCreatedToDate, setTempCreatedToDate] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // TanStack Queries
  // Fetch users for filters
  const { data: usersListData } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
  });

  // Fetch all contacts without pagination for filters
  const { data: contactsWithoutPagination } = useQuery({
    queryKey: ['contactsWithoutPagination'],
    queryFn: () => fetchContactListWithoutPagination(),
  });

  const users = useMemo(() => {
    const list = usersListData
      ? (Array.isArray(usersListData) ? usersListData : (usersListData.results || usersListData.data || []))
      : [];

    return list.map((u: any) => {
      const firstName = u.first_name || u.FirstName || '';
      const lastName = u.last_name || u.LastName || '';
      return u.name || `${firstName} ${lastName}`.trim() || u.username || u.email || 'Unknown';
    }).filter(Boolean);
  }, [usersListData]);

  const uniqueOwners = useMemo(() => {
    const list = contactsWithoutPagination
      ? (Array.isArray(contactsWithoutPagination) ? contactsWithoutPagination : [])
      : [];

    const owners = new Set<string>();
    list.forEach((c: any) => {
      let ownerName = '';
      if (c.Contact_Owner) {
        if (typeof c.Contact_Owner === 'object') {
          const oFirstName = c.Contact_Owner.first_name || c.Contact_Owner.FirstName || '';
          const oLastName = c.Contact_Owner.last_name || c.Contact_Owner.LastName || '';
          ownerName = `${oFirstName} ${oLastName}`.trim() || c.Contact_Owner.username || c.Contact_Owner.email || '';
        } else {
          ownerName = String(c.Contact_Owner);
        }
      }
      if (ownerName) {
        owners.add(ownerName);
      }
    });
    return Array.from(owners).sort();
  }, [contactsWithoutPagination]);

  const uniqueSources = useMemo(() => {
    const list = contactsWithoutPagination
      ? (Array.isArray(contactsWithoutPagination) ? contactsWithoutPagination : [])
      : [];

    const sources = new Set<string>();
    list.forEach((c: any) => {
      if (c.LeadSource) {
        sources.add(String(c.LeadSource));
      }
    });
    return Array.from(sources).sort();
  }, [contactsWithoutPagination]);

  // 1. Fetch Dashboard KPI Cards
  const { data: dashboardCards } = useQuery({
    queryKey: ['contactsDashboardCards'],
    queryFn: () => fetchContactDashboardCards(),
  });

  // Tab count queries
  const { data: allCountData } = useQuery({
    queryKey: ['contacts', 'count', 'all'],
    queryFn: () => fetchContactsList(1),
  });

  const { data: myCountData } = useQuery({
    queryKey: ['contacts', 'count', 'my', userId],
    queryFn: () => fetchContactsList(1, userId),
  });

  const { data: recentCountData } = useQuery({
    queryKey: ['contacts', 'count', 'recent', userId],
    queryFn: () => fetchRecentlyAddedContacts(1, userId),
  });

  const { data: favoritesCountData } = useQuery({
    queryKey: ['contacts', 'count', 'favorites'],
    queryFn: () => fetchFavoriteContacts(1),
  });

  const getTabCount = (tabId: string) => {
    switch (tabId) {
      case 'all': return allCountData?.count ?? 0;
      case 'my': return myCountData?.count ?? 0;
      case 'recent': return recentCountData?.count ?? 0;
      case 'favorites': return favoritesCountData?.count ?? 0;
      default: return 0;
    }
  };

  // Helper mapping backend model to UI contact structure
  const mapBackendToFrontendContact = (backend: ContactModel): Contact => {
    const firstName = backend.FirstName || '';
    const lastName = backend.LastName || '';
    const name = `${firstName} ${lastName}`.trim() || '';
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '';

    const colorsList = [
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
      'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
      'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
      'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
      'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
      'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
      'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800',
      'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
    ];
    const contactId = String(backend.id || backend.Contact_Id || backend.Email_Id || name);
    const hash = `${name}-${contactId}`.split('').reduce((acc, char) => Math.abs((acc * 31 + char.charCodeAt(0)) | 0), 0);
    const fallbackBg = colorsList[hash % colorsList.length];

    let ownerName = '';
    if (backend.Contact_Owner) {
      if (typeof backend.Contact_Owner === 'object') {
        const ownerObj = backend.Contact_Owner as any;
        const oFirstName = ownerObj.first_name || ownerObj.FirstName || '';
        const oLastName = ownerObj.last_name || ownerObj.LastName || '';
        ownerName = `${oFirstName} ${oLastName}`.trim() || ownerObj.username || ownerObj.email || '';
      } else {
        ownerName = String(backend.Contact_Owner);
      }
    }
    const ownerInitials = ownerName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '';
    const ownerColorsList = [
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
      'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
      'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
      'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
      'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
      'bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
      'bg-pink-100 text-pink-800 dark:bg-pink-950/50 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
      'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
      'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800',
      'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
    ];
    const ownerHash = `${ownerName}-${contactId}`.split('').reduce((acc, char) => Math.abs((acc * 37 + char.charCodeAt(0)) | 0), 0);
    const ownerBg = ownerColorsList[ownerHash % ownerColorsList.length];

    let reportsToName = '';
    if (backend.Reportingto_Id) {
      if (typeof backend.Reportingto_Id === 'object') {
        const rObj = backend.Reportingto_Id as any;
        const rFirstName = rObj.first_name || rObj.FirstName || '';
        const rLastName = rObj.last_name || rObj.LastName || '';
        reportsToName = `${rFirstName} ${rLastName}`.trim() || rObj.username || rObj.Name || `Contact ID: ${rObj.id || ''}`;
      } else {
        reportsToName = `Contact ID: ${backend.Reportingto_Id}`;
      }
    }

    return {
      id: String(backend.id || backend.Contact_Id || ''),
      name,
      firstName,
      lastName,
      avatarFallback: initials,
      fallbackBg,
      accountName: backend.Company_Name || '',
      email: backend.Email_Id || '',
      phone: backend.Mobile_Number || '',
      phoneCountry: backend.MobileCountry_Id || '',
      workPhone: backend.AlternatePhoneNo || '',
      workPhoneCountry: '',
      mobile: backend.Mobile_Number || '',
      mobileCountry: backend.MobileCountry_Id || '',
      dob: backend.DateOfBirth || '',
      jobTitle: backend.Job_Title || '',
      ownerName: ownerName,
      ownerInitials,
      ownerBg,
      leadSource: backend.LeadSource || '',
      department: backend.Department || '',
      reportsTo: reportsToName,
      address: backend.Address || '',
      city: backend.City || '',
      state: backend.State || '',
      country: backend.Country || '',
      pinCode: backend.Pincode || '',
      notes: backend.Description || '',
      tags: Array.isArray(backend.Tags)
        ? backend.Tags
        : (typeof backend.Tags === 'string' && backend.Tags
          ? backend.Tags.split(',').map(t => t.trim()).filter(Boolean)
          : []),
      commPrefs: {
        email: backend.Contact_Json?.email || false,
        phone: backend.Contact_Json?.phone || false,
        sms: backend.Contact_Json?.sms || false,
        whatsapp: backend.Contact_Json?.whatsapp || false,
      },
      targetList: backend.Contact_Json?.targetList || '',
      status: (backend.Status as 'Active' | 'In Active' | '') || '',
      lastContacted: backend.Last_Call_Date || '',
      isFavorite: backend.Is_Favorites || false
    };
  };

  // 2. Fetch Paginated Contacts list based on states
  const { data: contactsData } = useQuery({
    queryKey: ['contacts', activeTab, currentPage, searchQuery, statusFilter, ownerFilter, sourceFilter, createdFromDate, createdToDate],
    queryFn: async () => {
      if (searchQuery.trim().length > 0) {
        if (activeTab === 'my') {
          return searchContacts(searchQuery, currentPage, userId);
        } else if (activeTab === 'favorites') {
          return searchContacts(searchQuery, currentPage, undefined, true);
        } else if (activeTab === 'recent') {
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          const formatDate = (d: Date) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          };

          return searchContacts(
            searchQuery,
            currentPage,
            undefined,
            undefined,
            formatDate(startOfMonth),
            formatDate(endOfMonth)
          );
        } else {
          return searchContacts(searchQuery, currentPage);
        }
      }

      const hasDateFilter = createdFromDate.trim().length > 0 && createdToDate.trim().length > 0;
      const hasAdvancedFilters = statusFilter !== 'All' || ownerFilter !== 'All' || sourceFilter !== 'All' || hasDateFilter;
      if (hasAdvancedFilters) {
        const payload: ContactFilterPayload = {
          page: currentPage,
          LeadSource: sourceFilter === 'All' ? undefined : sourceFilter,
          Contact_Owner: ownerFilter === 'All' ? undefined : ownerFilter,
          Status: statusFilter === 'All' ? undefined : statusFilter,
          Is_Favorites: activeTab === 'favorites' ? true : undefined,
          Created_Date: hasDateFilter
            ? [createdFromDate.trim(), createdToDate.trim()] as [string, string]
            : activeTab === 'recent' ? (() => {
              const today = new Date();
              const start = new Date(today.getFullYear(), today.getMonth(), 1);
              const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              return [fmt(start), fmt(end)] as [string, string];
            })() : undefined,
          Created_By: activeTab === 'my' ? String(userId) : undefined,
        };
        return filterContacts(payload);
      }

      if (activeTab === 'my') {
        return fetchContactsList(currentPage, userId);
      } else if (activeTab === 'recent') {
        return fetchRecentlyAddedContacts(currentPage, userId);
      } else if (activeTab === 'favorites') {
        return fetchFavoriteContacts(currentPage);
      } else {
        return fetchContactsList(currentPage);
      }
    }
  });

  // Map backend contacts list to frontend schema
  const currentTabContacts = useMemo(() => {
    const backendResults = contactsData?.results || [];
    return backendResults.map(mapBackendToFrontendContact);
  }, [contactsData]);

  // Since filtering/searching is done server side, filteredContacts is identical to the paginated list fetched from server
  const filteredContacts = currentTabContacts;
  const paginatedContacts = currentTabContacts;

  const totalCount = contactsData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  const cardStats = useMemo(() => {
    const stats = {
      total: 0,
      newThisMonth: 0,
      emailOpens: 0,
      phoneCalls: 0,
      active: 0,
    };
    if (dashboardCards) {
      dashboardCards.forEach(card => {
        const metric = card.Metric || '';
        const count = card.Count || 0;
        if (metric.includes('Total Contacts')) stats.total = count;
        else if (metric.includes('New Contacts')) stats.newThisMonth = count;
        else if (metric.includes('Email Opens')) stats.emailOpens = count;
        else if (metric.includes('Phone Calls') || metric.includes('Calls connected') || metric.includes('Connected')) stats.phoneCalls = count;
        else if (metric.includes('Active Contacts')) stats.active = count;
      });
    }
    return stats;
  }, [dashboardCards]);

  // Mutations
  // Delete Contact Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contactsWithoutPagination'] });
      queryClient.invalidateQueries({ queryKey: ['contactsDashboardCards'] });
      toast.success('Contact deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    }
  });

  // Toggle Favorite Mutation
  const favoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: number; isFavorite: boolean }) => {
      return updateContact({ id, Is_Favorites: isFavorite });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contactsWithoutPagination'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update favorite: ${error.message}`);
    }
  });

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    const contact = currentTabContacts.find(c => c.id === id);
    if (contact) {
      favoriteMutation.mutate({ id: Number(id), isFavorite: !contact.isFavorite });
    }
  };

  // Toggle Checkbox select
  const handleSelectContact = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  // Select All Toggle
  const handleSelectAll = () => {
    if (selectedContacts.length === currentTabContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(currentTabContacts.map(c => c.id));
    }
  };



  // Open Edit Contact Route
  const openEditModal = (contact: Contact) => {
    router.push(`/contacts/${contact.id}/edit`);
  };

  // Delete Contact logic
  const handleDeleteContact = (id: string) => {
    deleteMutation.mutate(Number(id));
    setSelectedContacts(prev => prev.filter(cId => cId !== id));
  };

  // Export Contacts to CSV
  const handleExport = () => {
    const headers = ['Contact ID', 'Name', 'Company Name', 'Email', 'Phone', 'Job Title', 'Owner', 'Lead Source', 'Status', 'Last Contacted', 'Favorite'];
    const rows = filteredContacts.map(c => [
      c.id,
      c.name,
      c.accountName,
      c.email,
      c.phone,
      c.jobTitle,
      c.ownerName,
      c.leadSource,
      c.status,
      c.lastContacted,
      c.isFavorite ? 'Yes' : 'No'
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Contacts exported to CSV successfully!');
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (formData: FormData) => uploadContactTemplate(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contactsWithoutPagination'] });
      queryClient.invalidateQueries({ queryKey: ['contactsDashboardCards'] });
      toast.success(data?.message || 'Contacts imported successfully!');
      setIsImportOpen(false);
      setImportFile(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to import contacts: ${error.message}`);
    }
  });

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select an XLSX template file first.');
      return;
    }
    const formData = new FormData();
    formData.append('file', importFile);
    importMutation.mutate(formData);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadContactTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contacts_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded successfully!');
    } catch (err: any) {
      toast.error(`Failed to download template: ${err.message}`);
    }
  };

  // Filter Modal Handlers
  const handleOpenFilterModal = () => {
    setTempStatusFilter(statusFilter);
    setTempOwnerFilter(ownerFilter);
    setTempSourceFilter(sourceFilter);
    setTempCreatedFromDate(createdFromDate);
    setTempCreatedToDate(createdToDate);
    setIsFilterOpen(true);
  };

  const handleApplyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setOwnerFilter(tempOwnerFilter);
    setSourceFilter(tempSourceFilter);
    setCreatedFromDate(tempCreatedFromDate);
    setCreatedToDate(tempCreatedToDate);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  // Clear all advanced filters
  const handleResetFilters = () => {
    setTempStatusFilter('All');
    setTempOwnerFilter('All');
    setTempSourceFilter('All');
    setTempCreatedFromDate('');
    setTempCreatedToDate('');
    setStatusFilter('All');
    setOwnerFilter('All');
    setSourceFilter('All');
    setCreatedFromDate('');
    setCreatedToDate('');
    setCurrentPage(1);
    toast.success('Filters reset to default.');
  };


  if (isLoaded && !canViewContactOverview) {

    return null;
  }

  const columns = useMemo<ColumnConfig<Contact>[]>(() => [
    {
      key: 'favorite',
      header: '',
      sortable: false,
      className: 'w-10 text-center',
      render: (contact) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleFavorite(contact.id); }}
          className="cursor-pointer transition-transform hover:scale-110"
        >
          <Star
            className={`h-4 w-4 ${contact.isFavorite
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-300 dark:text-slate-700 hover:text-amber-400'
              }`}
          />
        </button>
      )
    },
    {
      key: 'name',
      header: 'Contact Name',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-3">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={contact.name}
              className="h-8 w-8 rounded-full object-cover border dark:border-slate-800 shadow-sm"
            />
          ) : (
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-extrabold font-sans shadow-sm ${contact.fallbackBg}`}>
              {contact.avatarFallback}
            </div>
          )}
          <span className="font-bold text-slate-850 dark:text-slate-100 block truncate max-w-[150px]">
            {contact.name}
          </span>
        </div>
      )
    },
    {
      key: 'accountName',
      header: 'Company Name',
      sortable: true,
      render: (contact) => (
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {contact.accountName}
        </span>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
          {contact.email}
        </span>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-1.5">
          <span>{contact.phone || '-'}</span>
          {contact.phone && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); makeCall(contact.phone, contact.name, contact.id, 1, contact.accountName, 'Contact'); }}
              disabled={isPlacingCall}
              className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-955/30 rounded-full transition-colors inline-block text-emerald-600 dark:text-emerald-400 cursor-pointer disabled:opacity-50"
              title="Call Contact via Knowlarity"
            >
              <Phone className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )
    },
    {
      key: 'jobTitle',
      header: 'Job Title',
      sortable: true,
      render: (contact) => (
        <span className="text-sm font-medium text-slate-650 dark:text-slate-400">
          {contact.jobTitle}
        </span>
      )
    },
    {
      key: 'ownerName',
      header: 'Owner',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-2">
          <div className={`h-6.5 w-6.5 rounded-full flex items-center justify-center text-[9px] font-extrabold font-mono ${contact.ownerBg}`}>
            {contact.ownerInitials}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block whitespace-nowrap">
            {contact.ownerName}
          </span>
        </div>
      )
    },
    {
      key: 'leadSource',
      header: 'Lead Source',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">
          {contact.leadSource}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (contact) => (
        contact.status ? (
          <Badge
            variant="outline"
            className={`font-extrabold text-[9px] uppercase tracking-wider rounded-md py-0.5 px-2 select-none border-0 ${contact.status === 'Active'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
              : contact.status === 'In Active'
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
              }`}
          >
            {contact.status}
          </Badge>
        ) : null
      )
    },
    {
      key: 'lastContacted',
      header: 'Last Contacted',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
          {contact.lastContacted}
        </span>
      )
    },
    {
      key: 'city',
      header: 'City',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.city || '-'}</span>
      )
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.state || '-'}</span>
      )
    },
    {
      key: 'country',
      header: 'Country',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.country || '-'}</span>
      )
    },
    {
      key: 'pinCode',
      header: 'Pincode',
      sortable: true,
      bool: false,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.pinCode || '-'}</span>
      )
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      bool: false,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.department || '-'}</span>
      )
    }
  ], [isPlacingCall, makeCall]);

  const handleActions = (contact: Contact) => (
    <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer rounded-full">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-800">
          {canEditContact && (
            <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => openEditModal(contact)}>
              <Edit className="h-4 w-4" /> Edit Details
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => handleToggleFavorite(contact.id)}>
            <Star className="h-4 w-4" /> {contact.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
          </DropdownMenuItem>
          {contact.phone && (
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-xs font-semibold"
              onClick={(e) => { e.stopPropagation(); makeCall(contact.phone, contact.name, contact.id, 1, contact.accountName, 'Contact'); }}
              disabled={isPlacingCall}
            >
              <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Call Contact
            </DropdownMenuItem>
          )}
          {canDeleteContact && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 dark:text-rose-400 font-semibold text-xs" onClick={(e) => { e.stopPropagation(); handleDeleteContact(contact.id); }}>
                <Trash2 className="h-4 w-4" /> Delete Record
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Breadcrumb section */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{getTenantName().toUpperCase()}</BreadcrumbPage>

            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Contacts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Page Header and Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" style={{ color: primaryColor }} />
            Contacts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
            Manage and view all your contacts in one place.
          </p>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {canImportContact && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
              className="font-semibold text-xs h-10 px-4 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="h-4 w-4" /> Import
            </Button>
          )}

          {canExportContact && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="font-semibold text-xs h-10 px-4 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          )}

          {canCreateContact && (
            <Button
              onClick={() => router.push('/contacts/create')}
              style={{ backgroundColor: primaryColor }}
              className="font-bold text-xs h-10 px-4 text-white rounded-lg shadow-md hover:opacity-90 flex items-center gap-1.5 cursor-pointer transition-all duration-200"
            >
              <Plus className="h-4 w-4" /> Add Contact
            </Button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-1.5 xl:gap-2.5">
        {/* KPI: Total Contacts */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-lg p-2.5 lg:p-2 xl:p-3 flex items-center gap-2 lg:gap-1.5 xl:gap-2.5 shadow-xs">
          <div className="h-9 w-9 lg:h-8 lg:w-8 xl:h-10 xl:w-10 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="h-4.5 w-4.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] lg:text-[9.5px] xl:text-[10px] font-bold text-slate-400 uppercase tracking-normal block whitespace-nowrap">Total Contacts</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white block mt-0.5 leading-none">{cardStats.total.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI: New This Month */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-lg p-2.5 lg:p-2 xl:p-3 flex items-center gap-2 lg:gap-1.5 xl:gap-2.5 shadow-xs">
          <div className="h-9 w-9 lg:h-8 lg:w-8 xl:h-10 xl:w-10 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <UserPlus className="h-4.5 w-4.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] lg:text-[9.5px] xl:text-[10px] font-bold text-slate-400 uppercase tracking-normal block whitespace-nowrap">New This Month</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white block mt-0.5 leading-none">{cardStats.newThisMonth.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI: Email Opens */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-lg p-2.5 lg:p-2 xl:p-3 flex items-center gap-2 lg:gap-1.5 xl:gap-2.5 shadow-xs">
          <div className="h-9 w-9 lg:h-8 lg:w-8 xl:h-10 xl:w-10 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Mail className="h-4.5 w-4.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] lg:text-[9.5px] xl:text-[10px] font-bold text-slate-400 uppercase tracking-normal block whitespace-nowrap">Email Opens</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white block mt-0.5 leading-none">{cardStats.emailOpens.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI: Phone Calls */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-lg p-2.5 lg:p-2 xl:p-3 flex items-center gap-2 lg:gap-1.5 xl:gap-2.5 shadow-xs">
          <div className="h-9 w-9 lg:h-8 lg:w-8 xl:h-10 xl:w-10 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <PhoneCall className="h-4.5 w-4.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] lg:text-[9.5px] xl:text-[10px] font-bold text-slate-400 uppercase tracking-normal block whitespace-nowrap">Phone Calls</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white block mt-0.5 leading-none">{cardStats.phoneCalls.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI: Active Contacts */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-lg p-2.5 lg:p-2 xl:p-3 flex items-center gap-2 lg:gap-1.5 xl:gap-2.5 shadow-xs">
          <div className="h-9 w-9 lg:h-8 lg:w-8 xl:h-10 xl:w-10 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <CheckCircle className="h-4.5 w-4.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] lg:text-[9.5px] xl:text-[10px] font-bold text-slate-400 uppercase tracking-normal block whitespace-nowrap">Active Contacts</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white block mt-0.5 leading-none">{cardStats.active.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Container: Tab bar + Contacts Records Grid */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/60 rounded-xl p-4 md:p-5 shadow-xs relative">

        {/* Tab switcher + Search Bar */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between border-b pb-4 mb-2 dark:border-slate-800">

          {/* Tabs selectors list */}
          <div className="flex items-center gap-2 overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            {[
              { id: 'all', label: 'All Contacts' },
              { id: 'my', label: 'My Contacts' },
              { id: 'recent', label: 'Recently Added' },
              { id: 'favorites', label: 'Favorites' }
            ].map(tab => {
              const isSel = activeTab === tab.id;
              const displayCount = getTabCount(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setCurrentPage(1);
                  }}
                  className={`py-2 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${isSel
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
                    }`}
                  style={isSel ? { borderColor: primaryColor, color: primaryColor } : {}}
                >
                  {tab.label} ({displayCount})
                </button>
              );
            })}
          </div>

          {/* Search, view toggle, and gear controls */}
          <div className="flex items-center gap-2.5 flex-wrap self-end xl:self-auto">
            <div className="relative w-full sm:w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium w-full"
              />
            </div>

            <div className="flex items-center gap-1 border dark:border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewType('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewType === 'list'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewType('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewType === 'grid'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                title="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFilterModal}
              className={`font-semibold text-xs h-9 px-3.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ${statusFilter !== 'All' || ownerFilter !== 'All' || sourceFilter !== 'All' || (createdFromDate && createdToDate)
                ? 'border-primary text-primary bg-primary/5 hover:bg-primary/10'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                }`}
            >
              <Filter className="h-4 w-4" /> Filters
              {(statusFilter !== 'All' || ownerFilter !== 'All' || sourceFilter !== 'All' || (createdFromDate && createdToDate)) && (
                <span className="h-2 w-2 rounded-full bg-primary" style={{ backgroundColor: primaryColor }} />
              )}
            </Button>
          </div>
        </div>

        {/* Contacts View Container (List or Grid) */}
        {viewType === 'list' ? (
          <ReusableTable
            data={filteredContacts}
            setData={() => {}}
            columns={columns}
            selectable={true}
            selectedRowIds={selectedContacts}
            onSelectionChange={(selectedRows) => setSelectedContacts(selectedRows.map(row => row.id))}
            actions={handleActions}
            onRowClick={(row) => router.push(`/contacts/${row.id}`)}
            page={currentPage}
            totalRecords={totalCount}
            onChangePage={(p) => setCurrentPage(p)}
            pageSize={itemsPerPage}
              borderless={true}
            showGear={true}
            title="Contacts"
          />
        ) : (
          /* Grid View Layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedContacts.map((contact) => (
              <div
                key={contact.id}
                className="border dark:border-slate-800/80 rounded-xl p-4 bg-white dark:bg-slate-950/20 hover:shadow-md transition-all duration-200 relative group flex flex-col justify-between min-h-[200px]"
              >
                {/* Favorite Star & Top checkbox */}
                <div className="flex items-center justify-between">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onChange={() => handleSelectContact(contact.id)}
                    className="h-4 w-4 border-slate-350 dark:border-slate-700 accent-primary rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleToggleFavorite(contact.id)} className="cursor-pointer transition-transform hover:scale-110">
                      <Star className={`h-4 w-4 ${contact.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700 hover:text-amber-400'}`} />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-450 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border dark:border-slate-800">
                        {canEditContact && (
                          <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => openEditModal(contact)}>
                            <Edit className="h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                        )}
                        {contact.phone && (
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-xs font-semibold"
                            onClick={() => makeCall(contact.phone, contact.name, contact.id, 1, contact.accountName, 'Contact')}
                            disabled={isPlacingCall}
                          >
                            <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Call Contact
                          </DropdownMenuItem>
                        )}
                        {canDeleteContact && (
                          <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 dark:text-rose-450 text-xs font-semibold" onClick={() => handleDeleteContact(contact.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Main details */}
                <div className="flex flex-col items-center text-center mt-2 space-y-2">
                  {contact.avatarUrl ? (
                    <img src={contact.avatarUrl} alt={contact.name} className="h-14 w-14 rounded-full object-cover border-2 dark:border-slate-850 shadow-sm" />
                  ) : (
                    <div className={`h-14 w-14 rounded-full flex items-center justify-center text-sm font-extrabold shadow-sm ${contact.fallbackBg}`}>
                      {contact.avatarFallback}
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                      {contact.name}
                    </span>
                    <p className="text-xs text-slate-400 font-semibold">{contact.jobTitle} @ {contact.accountName}</p>
                  </div>
                </div>

                {/* Footer specs */}
                <div className="mt-4 pt-3 border-t dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold ${contact.ownerBg}`}>
                      {contact.ownerInitials}
                    </div>
                    <span className="truncate max-w-[80px]" title={contact.ownerName}>{contact.ownerName}</span>
                  </div>

                  {contact.status && (
                    <Badge
                      variant="outline"
                      className={`font-bold text-[8px] uppercase tracking-wider rounded-md py-0.5 px-1.5 select-none border-0 ${contact.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20'
                        : contact.status === 'In Active'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20'
                        }`}
                    >
                      {contact.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {filteredContacts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium">
                No contacts found matching criteria.
              </div>
            )}
          </div>
        )}


      </div>





      {/* MODAL: Import Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-xl dark:bg-slate-900 border dark:border-slate-800">
          <form onSubmit={handleImport} className="space-y-4">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" style={{ color: primaryColor }} /> Import Contacts
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                Upload your contact records using our spreadsheet template.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-lg">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Step 1: Download Template</span>
                <span className="text-[11px] text-slate-500 font-medium">Get the required XLSX format to fill in your contact list.</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="mt-1 font-bold text-xs h-9 rounded-lg border-slate-200 hover:bg-slate-50 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <Download className="h-3.5 w-3.5" /> Download Template
                </Button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">Step 2: Select XLSX File *</span>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={e => setImportFile(e.target.files?.[0] || null)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 font-medium"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 flex items-center justify-end gap-2 border-t dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsImportOpen(false);
                  setImportFile(null);
                }}
                className="h-9 px-4 font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-xs rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={importMutation.isPending}
                style={{ backgroundColor: primaryColor }}
                className="h-9 px-5 font-bold text-white text-xs rounded-lg shadow-xs cursor-pointer disabled:opacity-50"
              >
                {importMutation.isPending ? 'Uploading...' : 'Import Data'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Filter Side Panel Dialog */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 text-left shadow-2xl">
          <DialogHeader className="border-b dark:border-slate-800 pb-4">
            <DialogTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Filter className="h-4.5 w-4.5 text-primary" style={{ color: primaryColor }} /> Filter Contacts
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Specify criteria to filter your customer contact records.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
            {/* Filter: Status */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Status</label>
              <Select value={tempStatusFilter} onValueChange={(val) => setTempStatusFilter(val || 'All')}>
                <SelectTrigger className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="In Active">In Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter: Contact Owner */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Contact Owner</label>
              <Select value={tempOwnerFilter} onValueChange={(val) => setTempOwnerFilter(val || 'All')}>
                <SelectTrigger className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Owners</SelectItem>
                  {uniqueOwners.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter: Lead Source */}
            <div className="space-y-1.5 text-left sm:col-span-2">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Lead Source</label>
              <Select value={tempSourceFilter} onValueChange={(val) => setTempSourceFilter(val || 'All')}>
                <SelectTrigger className="h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sources</SelectItem>
                  {uniqueSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter: Created Date (From) */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Created Date (From)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  value={tempCreatedFromDate}
                  onChange={(e) => setTempCreatedFromDate(e.target.value)}
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Filter: Created Date (To) */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10.5px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Created Date (To)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  value={tempCreatedToDate}
                  onChange={(e) => setTempCreatedToDate(e.target.value)}
                  className="pl-9 h-9.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t dark:border-slate-800 pt-4 gap-2 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleResetFilters}
              className="h-9 px-3 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFilterOpen(false)}
                className="h-9 px-4 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleApplyFilters}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-bold h-9 px-5 text-xs rounded-xl cursor-pointer hover:opacity-90 transition-all"
              >
                Apply Filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
