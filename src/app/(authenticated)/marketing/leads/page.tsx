'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  UserCheck2,
  AlertCircle,
  Users,
  TrendingUp,
  Shield,
  CheckCircle2,
  Filter,
  UserPlus,
  Tag,
  RefreshCw,
  Eye,
  FileText,
  CheckSquare,
  PhoneCall,
  GitMerge,
  Megaphone,
  X,
  MapPin,
  CalendarDays,
  Target,
  Sparkles,
  Loader2
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
import { Label } from '@/components/ui/label';
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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  fetchUserQualifiedLeadsList,
  searchUserQualifiedLeads,
  filterUserQualifiedLeads,
  deleteUserQualifiedLead,
  patchUserQualifiedLead,
  uploadLeadsExcel,
  fetchCEOLeadsSalesPipeline,
  fetchUsersList,
  createUserLeadNote,
  createTask,
  createUserLeadMail,
  bulkUpdateLeadStatus,
  assignLeadsToAgent,
  fetchLeadStageWiseLeads,
  generateEmailContent,
  downloadLeadExcelTemplate
} from '@/service/api/Leads/api';
import { useKnowlarity } from '@/store/KnowlarityContext';
import { usePermission } from '@/hooks/usePermission';



export default function LeadsPage() {
  const { primaryColor , user} = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { makeCall, isPlacingCall } = useKnowlarity();
  const {
    canCreateLead,
    canEditLead,
    canDeleteLead,
    canViewLeadOverview,
    canImportLead,
    canExportLead,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewLeadOverview) {
      toast.error('You do not have permission to view Leads.');
      router.push('/');
    }
  }, [canViewLeadOverview, isLoaded, router]);

  // State management for API integration
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<string>('All Leads');
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignLead, setAssignLead] = useState<any | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);

  // Bulk operation states
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [selectedBulkOwnerId, setSelectedBulkOwnerId] = useState<string>('');
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);

  // Delete confirmation dialog states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<number | string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk'>('single');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteMode === 'single' && leadToDelete !== null) {
        await deleteUserQualifiedLead(leadToDelete);
        toast.success(`Lead has been deleted successfully.`);
        setSelectedLeads(prev => prev.filter(item => String(item) !== String(leadToDelete)));
      } else if (deleteMode === 'bulk' && selectedLeads.length > 0) {
        await Promise.all(selectedLeads.map(id => deleteUserQualifiedLead(id)));
        toast.success(`Deleted ${selectedLeads.length} leads successfully.`);
        setSelectedLeads([]);
      }
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      fetchPipelineData();
      setIsDeleteOpen(false);
      setLeadToDelete(null);
    } catch (err) {
      toast.error('Failed to delete lead(s)');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Invalidate query cache on mount to ensure fresh data after editing/navigating back
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
  }, [queryClient]);

  const handleBulkAssignSubmit = async () => {
    if (selectedLeads.length === 0 || !selectedBulkOwnerId) return;
    setIsBulkAssigning(true);
    try {
      const selectedUser = users.find(u => u.id.toString() === selectedBulkOwnerId);
      if (!selectedUser) return;
      const agentId = parseInt(selectedBulkOwnerId, 10);
      const leadIds = selectedLeads.map(id => parseInt(id, 10));

      await assignLeadsToAgent({
        lead_ids: leadIds,
        lead_owner_id: agentId
      });

      toast.success(`Successfully assigned ${selectedLeads.length} leads to ${`${selectedUser.first_name} ${selectedUser.last_name || ''}`.trim()}`);
      setIsBulkAssignOpen(false);
      setSelectedBulkOwnerId('');
      setSelectedLeads([]);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      fetchPipelineData();
    } catch (err) {
      toast.error('Failed to assign leads');
      console.error(err);
    } finally {
      setIsBulkAssigning(false);
    }
  };

  // State to hold the current selected row lead for note/task/mail popups
  const [activeLead, setActiveLead] = useState<any | null>(null);

  // Note Popup Handlers & States
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [popupNoteSubject, setPopupNoteSubject] = useState('');
  const [popupNoteContent, setPopupNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [popupNoteSubjectError, setPopupNoteSubjectError] = useState('');
  const [popupNoteContentError, setPopupNoteContentError] = useState('');

  useEffect(() => {
    if (!isNoteOpen) {
      setPopupNoteSubjectError('');
      setPopupNoteContentError('');
    }
  }, [isNoteOpen]);

  const handlePopupNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!popupNoteSubject.trim()) {
      setPopupNoteSubjectError('Subject is required');
      hasError = true;
    } else {
      setPopupNoteSubjectError('');
    }

    if (!popupNoteContent.trim()) {
      setPopupNoteContentError('Note details are required');
      hasError = true;
    } else {
      setPopupNoteContentError('');
    }

    if (hasError) return;
    if (!activeLead) return;

    setIsSavingNote(true);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';
      const userId = parseInt(userIdStr, 10);
      await createUserLeadNote({
        Organization_Id: activeLead.Organization_Id || 1,
        Lead_Id: activeLead.id,
        Subject: popupNoteSubject || 'General Note',
        Notes: popupNoteContent,
        Active_Flag: true,
        Is_Deleted: false,
        Created_By: userId,
        Updated_By: userId
      });
      toast.success('Note added successfully!');
      setPopupNoteSubject('');
      setPopupNoteContent('');
      setIsNoteOpen(false);
    } catch (err) {
      toast.error('Failed to add note');
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Task Popup Handlers & States
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [popupTaskName, setPopupTaskName] = useState('');
  const [popupTaskDesc, setPopupTaskDesc] = useState('');
  const [popupTaskStartDate, setPopupTaskStartDate] = useState('');
  const [popupTaskDueDate, setPopupTaskDueDate] = useState('');
  const [popupTaskPriority, setPopupTaskPriority] = useState('Medium');
  const [popupTaskStatus, setPopupTaskStatus] = useState('Pending');
  const [popupTaskAssignedTo, setPopupTaskAssignedTo] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);

  const handlePopupTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead || !popupTaskName.trim()) return;
    setIsSavingTask(true);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';
      const userId = parseInt(userIdStr, 10);
      await createTask({
        Lead_Id: activeLead.id,
        TaskName: popupTaskName,
        Task_Desc: popupTaskDesc,
        Start_Date: popupTaskStartDate ? `${popupTaskStartDate}T00:00:00Z` : new Date().toISOString(),
        Due_Date: popupTaskDueDate ? `${popupTaskDueDate}T00:00:00Z` : new Date().toISOString(),
        Priority: popupTaskPriority,
        Status: popupTaskStatus,
        Assigned_To: popupTaskAssignedTo ? parseInt(popupTaskAssignedTo, 10) : userId,
        Created_By: userId,
        Updated_By: userId,
        UserReminder: null,
        Organization_Id: activeLead.Organization_Id ? Number(activeLead.Organization_Id) : 1
      });
      toast.success('Task created successfully!');
      setPopupTaskName('');
      setPopupTaskDesc('');
      setPopupTaskStartDate('');
      setPopupTaskDueDate('');
      setPopupTaskPriority('Medium');
      setPopupTaskStatus('Pending');
      setPopupTaskAssignedTo('');
      setIsTaskOpen(false);
    } catch (err) {
      toast.error('Failed to create task');
      console.error(err);
    } finally {
      setIsSavingTask(false);
    }
  };

  // Mail Popup Handlers & States
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [popupMailSubject, setPopupMailSubject] = useState('');
  const [popupMailBody, setPopupMailBody] = useState('');
  const [isSavingMail, setIsSavingMail] = useState(false);
  const [isGeneratingAiMail, setIsGeneratingAiMail] = useState(false);

  const handleGenerateAiMail = async () => {
    if (!popupMailSubject.trim()) {
      toast.error('Please enter a subject to generate email content using AI');
      return;
    }
    setIsGeneratingAiMail(true);
    try {
      const res = await generateEmailContent(popupMailSubject.trim());
      const aiResult = res?.Result || res?.result || res?.data?.Result || (typeof res === 'string' ? res : '');
      if (aiResult) {
        setPopupMailBody(aiResult);
        toast.success('AI Email content generated successfully!');
      } else {
        toast.error('No email content returned from AI');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate AI email content');
      console.error(err);
    } finally {
      setIsGeneratingAiMail(false);
    }
  };

  const handlePopupMailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) {
      toast.error('No active lead selected');
      return;
    }
    if (!popupMailSubject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!popupMailBody.trim()) {
      toast.error('Email body is required');
      return;
    }
    setIsSavingMail(true);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';
      const userId = parseInt(userIdStr, 10);
      const orgIdStr = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';
      const orgId = parseInt(orgIdStr, 10);
      await createUserLeadMail({
        Lead_Id: activeLead.id,
        RecevierMailId: activeLead.EmailId || '',
        MailSubject: popupMailSubject.trim(),
        MailBody: popupMailBody.trim(),
        cc: null,
        Organization_Id: orgId,
        Created_By: userId,
        Updated_By: userId
      });
      toast.success('Email activity logged successfully!');
      setPopupMailSubject('');
      setPopupMailBody('');
      setIsMailOpen(false);
    } catch (err) {
      toast.error('Failed to log email');
      console.error(err);
    } finally {
      setIsSavingMail(false);
    }
  };

  // Excel Import dialog state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Advanced Filter dialog state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [filterParams, setFilterParams] = useState({
    Country: '',
    State: '',
    City: '',
    Industry_Type: '',
    Lead_Name: '',
    Lead_Source: '',
    Lead_Owner: '',
    Lead_Status: '',
    fromdate: '',
    todate: ''
  });

  // Details dialog state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailLead, setDetailLead] = useState<any | null>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, statusFilter, isFilterApplied]);

  // TanStack Query for Leads List
  const { data: leadsData, isLoading: loading } = useQuery({
    queryKey: ['leads', debouncedSearchQuery, statusFilter, viewMode, isFilterApplied, filterParams, currentPage],
    queryFn: async () => {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
      const userId = userIdStr ? parseInt(userIdStr, 10) : 1;

      if (viewMode === 'Right Time to Call') {
        return fetchLeadStageWiseLeads({
          Lead_Stage: 'Hot',
          page: currentPage
        });
      }

      if (debouncedSearchQuery.trim() !== '') {
        return searchUserQualifiedLeads({
          User_id: viewMode === 'My Leads' ? userId : undefined,
          search: debouncedSearchQuery
        });
      } else if (isFilterApplied) {
        return filterUserQualifiedLeads({
          ...filterParams,
          User_Id: viewMode === 'My Leads' ? userId : undefined,
          User_id: viewMode === 'My Leads' ? userId : undefined,
          page: currentPage
        });
      } else {
        return fetchUserQualifiedLeadsList({
          User_Id: viewMode === 'My Leads' ? userId : undefined,
          Lead_Status: statusFilter === 'All' ? undefined : statusFilter,
          page: currentPage
        });
      }
    },
    placeholderData: keepPreviousData,
  });

  const leadsList = leadsData?.results || [];
  const totalCount = leadsData?.count || 0;
  const hasNext = !!leadsData?.next;
  const hasPrev = !!leadsData?.previous;

  // Dedicated count query for Right Time to Call leads
  const { data: rightTimeToCallData } = useQuery({
    queryKey: ['leads', 'count', 'right-time-to-call'],
    queryFn: async () => {
      return fetchLeadStageWiseLeads({
        Lead_Stage: 'Hot',
        page: 1
      });
    },
    staleTime: 30 * 1000,
  });

  // Dedicated count query for All Leads (baseline count when navigating between views)
  const { data: allLeadsCountData } = useQuery({
    queryKey: ['leads', 'count', 'all-leads', viewMode === 'My Leads' ? 'my' : 'all'],
    queryFn: async () => {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
      const userId = userIdStr ? parseInt(userIdStr, 10) : 1;
      return fetchUserQualifiedLeadsList({
        User_Id: viewMode === 'My Leads' ? userId : undefined,
        page: 1
      });
    },
    staleTime: 30 * 1000,
  });

  const allLeadsCount = viewMode !== 'Right Time to Call'
    ? (leadsData?.count ?? allLeadsCountData?.count ?? 0)
    : (allLeadsCountData?.count ?? 0);

  const rightTimeToCallCount = viewMode === 'Right Time to Call'
    ? (leadsData?.count ?? rightTimeToCallData?.count ?? 0)
    : (rightTimeToCallData?.count ?? 0);


  // Load users list for Lead Owner assignment
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetchUsersList();
        setUsers(res.results || res || []);
      } catch (err) {
        console.error('Failed to load users list', err);
      }
    };
    loadUsers();
  }, []);

  const handleAssignSubmit = async () => {
    if (!assignLead || !selectedOwnerId) return;
    try {
      const selectedUser = users.find(u => u.id.toString() === selectedOwnerId);
      if (!selectedUser) return;
      const ownerName = `${selectedUser.first_name} ${selectedUser.last_name || ''}`.trim();

      await patchUserQualifiedLead(assignLead.id, {
        id: assignLead.id,
        Lead_Owner_Id: parseInt(selectedOwnerId, 10),
        Lead_Owner: ownerName
      });

      toast.success(`Lead successfully assigned to ${ownerName}`);
      setIsAssignOpen(false);
      setAssignLead(null);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      fetchPipelineData();
    } catch (err) {
      toast.error('Failed to assign lead owner');
      console.error(err);
    }
  };

  const fetchPipelineData = async () => {
    try {
      const res = await fetchCEOLeadsSalesPipeline({});
      if (res && res.status) {
        setPipelineData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline data', err);
    }
  };

  // Fetch pipeline data on mount or when viewMode changes
  useEffect(() => {
    fetchPipelineData();
  }, [viewMode]);

  const handleDeleteLead = (id: number | string) => {
    setLeadToDelete(id);
    setDeleteMode('single');
    setIsDeleteOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedLeads.length === 0) return;
    setDeleteMode('bulk');
    setIsDeleteOpen(true);
  };

  const handleExport = () => {
    const listToExport = selectedLeads.length > 0
      ? leadsList.filter(l => selectedLeads.includes(l.id))
      : leadsList;

    if (listToExport.length === 0) {
      toast.info('No leads available to export');
      return;
    }

    const headers = [
      'ID', 'Lead Name', 'Company', 'Email', 'Phone', 'Status', 'Source', 'Owner', 'Created Date'
    ];
    const data = listToExport.map(l => [
      l.id, `${l.LeadFirstName || ''} ${l.LeadLastName || ''}`, l.CompanyName,
      l.EmailId, l.PhoneNo, l.Lead_Status, l.LeadSource, l.Lead_Owner, l.Created_Date
    ]);
    const csvContent = [headers.join(','), ...data.map(row => row.map(val => `"${val || ''}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(`${listToExport.length} leads exported successfully!`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leadsList.map(l => l.id));
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

  const openDetailsDialog = (lead: any) => {
    setDetailLead(lead);
    setIsDetailsOpen(true);
  };

  // Excel template upload & download handlers
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [importLeadType, setImportLeadType] = useState('New');
  const [importLeadSource, setImportLeadSource] = useState('Website');
  const [importResult, setImportResult] = useState<{
    Total: number;
    Success: number;
    Failed: number;
    Failures?: { row: number; error: string }[];
  } | null>(null);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadLeadExcelTemplate();
      toast.success("Excel template downloaded successfully!");
    } catch (err) {
      toast.error("Failed to download excel template");
      console.error(err);
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // Excel template upload submit
  const handleImportSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setImportResult(null);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '111' : '111';
      const formData = new FormData();
      formData.append('Lead_template', selectedFile);
      formData.append('OrganizationId', '1');
      formData.append('CreatedBy', userIdStr);
      formData.append('UpdatedBy', userIdStr);
      formData.append('LeadType', importLeadType || 'New');
      formData.append('LeadSource', importLeadSource || 'Website');

      const res = await uploadLeadsExcel(formData);

      if (res && typeof res === 'object' && ('Total' in res || 'Success' in res || 'Failed' in res)) {
        setImportResult(res);
        if (res.Success > 0) {
          toast.success(`${res.Success} lead(s) imported successfully!`);
        }
        if (res.Failed > 0) {
          toast.error(`${res.Failed} row(s) failed to import.`);
        }
      } else {
        toast.success("Leads imported successfully!");
        setIsImportOpen(false);
        setSelectedFile(null);
      }

      queryClient.invalidateQueries({ queryKey: ['leads'] });
      fetchPipelineData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to import leads file");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Advanced Filter Submit
  const handleApplyFilters = () => {
    setIsFilterApplied(true);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setFilterParams({
      Country: '',
      State: '',
      City: '',
      Industry_Type: '',
      Lead_Name: '',
      Lead_Source: '',
      Lead_Owner: '',
      Lead_Status: '',
      fromdate: '',
      todate: ''
    });
    setIsFilterApplied(false);
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  // Define filteredLeads alias so we don't break existing JSX selectors
  const filteredLeads = leadsList;

  // Avatar styling helpers
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(p => p !== '');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/30',
      'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/30',
      'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/30',
      'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/30',
      'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/30',
      'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30',
      'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/30',
      'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:border-fuchsia-900/30'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getOwnerInitials = (owner: string) => {
    return owner.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const getOwnerBgColor = (owner: string) => {
    if (owner === 'John Smith') return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400';
    if (owner === 'Sarah Davis') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-955/30 dark:text-amber-400';
    return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400';
  };

  // Status and Source specific styles
  const statusStyles: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    'Open': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30',
    'Contacted': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30',
    'Qualified': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30',
    'Unqualified': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30',
    'Proposal Sent': 'bg-rose-50 text-rose-505 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30',
    'Negotiation': 'bg-sky-50 text-sky-505 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30',
    'Converted': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
    'Disqualified': 'bg-slate-105 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    'Nurturing': 'bg-pink-50 text-pink-505 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30'
  };

  const sourceStyles: Record<string, string> = {
    'Website': 'bg-blue-50 text-blue-600 dark:bg-blue-950/10 dark:text-blue-400',
    'Referral': 'bg-amber-50 text-amber-600 dark:bg-amber-955/10 dark:text-amber-400',
    'LinkedIn': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-955/10 dark:text-indigo-400',
    'Email Campaign': 'bg-pink-50 text-pink-600 dark:bg-pink-955/10 dark:text-pink-400',
    'Cold Call': 'bg-teal-50 text-teal-600 dark:bg-teal-955/10 dark:text-teal-400'
  };

  const leadColumns = useMemo(() => [
    {
      key: 'LeadFirstName',
      header: 'Lead Name',
      sortable: true,
      className: 'min-w-[190px] max-w-[240px]',
      render: (lead: any) => {
        const leadName = `${lead.LeadFirstName || ''} ${lead.LeadLastName || ''}`.trim() || 'No Name';
        return (
          <div className="flex items-center gap-2.5 max-w-full min-w-0">
            <div className={`h-7 w-7 lg:h-7.5 lg:w-7.5 rounded-full flex items-center justify-center font-bold text-[10px] lg:text-xs shrink-0 ${getAvatarColor(leadName)}`}>
              {getInitials(leadName)}
            </div>
            <div className="min-w-0 flex-1 truncate">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={
                    <NavLink
                      to={`/marketing/leads/${lead.id}`}
                      title={leadName}
                      className="text-xs lg:text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-left transition-colors cursor-pointer block truncate"
                    >
                      {leadName}
                    </NavLink>
                  } />
                  <TooltipContent side="top" className="bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-100 border border-slate-800 text-xs px-2.5 py-1">
                    {leadName}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      }
    },
    {
      key: 'CompanyName',
      header: 'Company',
      sortable: true,
      className: 'min-w-[170px] max-w-[210px]',
      render: (lead: any) => {
        const company = lead.CompanyName || '-';
        return (
          <div className="flex items-center gap-1.5 max-w-full min-w-0">
            <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={
                    <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300 block truncate" title={company}>
                      {company}
                    </span>
                  } />
                  {company !== '-' && (
                    <TooltipContent side="top" className="bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-100 border border-slate-800 text-xs px-2.5 py-1">
                      {company}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      }
    },
    {
      key: 'EmailId',
      header: 'Email',
      sortable: false,
      className: 'min-w-[230px] max-w-[270px]',
      render: (lead: any) => {
        const email = lead.EmailId;
        return email ? (
          <div className="flex items-center gap-1.5 max-w-full min-w-0">
            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLead(lead);
                        setIsMailOpen(true);
                      }}
                      title={email}
                      className="text-xs lg:text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300 font-medium text-left transition-colors cursor-pointer block truncate max-w-full"
                    >
                      {email}
                    </button>
                  } />
                  <TooltipContent side="top" className="bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-100 border border-slate-800 text-xs px-2.5 py-1">
                    {email}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : (
          <span className="text-xs lg:text-sm text-slate-400 font-medium">-</span>
        );
      }
    },
    {
      key: 'PhoneNo',
      header: 'Phone',
      sortable: false,
      className: 'min-w-[150px] whitespace-nowrap',
      render: (lead: any) => {
        const leadName = `${lead.LeadFirstName || ''} ${lead.LeadLastName || ''}`.trim() || 'No Name';
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-xs lg:text-sm font-semibold text-slate-600 dark:text-slate-300">{lead.PhoneNo || '-'}</span>
            {lead.PhoneNo && (
              <button
                type="button"
                onClick={() => makeCall(lead.PhoneNo, leadName, lead.id, lead.Organization_Id, lead.CompanyName, 'Lead')}
                disabled={isPlacingCall}
                className="p-1 hover:bg-blue-50 dark:hover:bg-blue-955/30 rounded-full transition-colors inline-block text-blue-600 dark:text-blue-400 cursor-pointer disabled:opacity-50"
                title="Call Lead via Knowlarity"
              >
                <Phone className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
              </button>
            )}
          </div>
        );
      }
    },
    {
      key: 'Lead_Status',
      header: 'Lead Status',
      sortable: false,
      className: 'min-w-[130px] whitespace-nowrap',
      render: (lead: any) => (
        <Badge variant="outline" className={`rounded-md font-semibold text-[10px] lg:text-xs py-0.5 px-2 lg:px-2.5 whitespace-nowrap ${statusStyles[lead.Lead_Status] || ''}`}>
          {lead.Lead_Status || 'New'}
        </Badge>
      )
    },
    {
      key: 'LeadSource',
      header: 'Source',
      sortable: false,
      className: 'min-w-[120px] whitespace-nowrap',
      render: (lead: any) => (
        <span className={`inline-block px-2 lg:px-2.5 py-0.5 rounded-full text-[10px] lg:text-xs font-semibold whitespace-nowrap ${sourceStyles[lead.LeadSource] || 'bg-slate-100 dark:bg-slate-800'}`}>
          {lead?.LeadSource || '-'}
        </span>
      )
    },
    {
      key: 'Lead_Owner',
      header: 'Owner',
      sortable: false,
      className: 'min-w-[150px]',
      render: (lead: any) => (
        <div className="flex items-center gap-1.5 lg:gap-2 max-w-[150px] min-w-0">
          <Avatar className="h-6 w-6 lg:h-6.5 lg:w-6.5 border shadow-2xs shrink-0">
            <AvatarFallback className={`font-bold text-[9px] lg:text-[10px] ${getOwnerBgColor(lead.Lead_Owner || '')}`}>
              {getOwnerInitials(lead.Lead_Owner || 'UN')}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{lead.Lead_Owner || 'Unassigned'}</span>
        </div>
      )
    },
    {
      key: 'Created_Date',
      header: 'Created On',
      sortable: false,
      className: 'min-w-[130px] whitespace-nowrap',
      render: (lead: any) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-xs lg:text-sm text-slate-550 dark:text-slate-400 font-semibold">
            {lead.Created_Date ? new Date(lead.Created_Date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }) : '-'}
          </span>
        </div>
      )
    },
    {
      key: 'Country',
      header: 'Country',
      sortable: true,
      className: 'min-w-[130px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">{lead.Country || '-'}</span>
      )
    },
    {
      key: 'State',
      header: 'State',
      sortable: true,
      className: 'min-w-[130px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">{lead.State || '-'}</span>
      )
    },
    {
      key: 'City',
      header: 'City',
      sortable: true,
      className: 'min-w-[130px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">{lead.City || '-'}</span>
      )
    },
    {
      key: 'Lead_Industry',
      header: 'Industry',
      sortable: true,
      bool: false,
      className: 'min-w-[130px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">{lead.Lead_Industry || '-'}</span>
      )
    },
    {
      key: 'WebsiteURL',
      header: 'Website',
      sortable: true,
      bool: false,
      className: 'min-w-[150px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-medium text-blue-600 dark:text-blue-400">{lead.WebsiteURL || '-'}</span>
      )
    },
    {
      key: 'LeadScore',
      header: 'Score',
      sortable: true,
      bool: false,
      className: 'min-w-[100px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-300">{lead.LeadScore || '-'}</span>
      )
    },
    {
      key: 'Ratings',
      header: 'Rating',
      sortable: true,
      bool: false,
      className: 'min-w-[100px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-300">{lead.Ratings || '-'}</span>
      )
    },
    {
      key: 'LeadNoOfEmployees',
      header: 'Employees',
      sortable: true,
      bool: false,
      className: 'min-w-[100px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">{lead.LeadNoOfEmployees || '-'}</span>
      )
    },
    {
      key: 'StreetName',
      header: 'Street',
      sortable: false,
      bool: false,
      className: 'min-w-[150px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">{lead.StreetName || '-'}</span>
      )
    },
    {
      key: 'Pincode',
      header: 'Pincode',
      sortable: false,
      bool: false,
      className: 'min-w-[100px] whitespace-nowrap',
      render: (lead: any) => (
        <span className="text-xs lg:text-sm font-medium text-slate-700 dark:text-slate-300">{lead.Pincode || '-'}</span>
      )
    }
  ], [statusStyles, sourceStyles]);

  // Extract counts from pipelineData API response
  const totalLeadsCount = pipelineData?.TotalLeads ?? allLeadsCount ?? totalCount;
  const newLeadsCount = pipelineData?.NewLeadsThisMonth ?? leadsList.filter(l => l.Lead_Status === 'New' || l.Lead_Status === 'Open').length;

  const contactedCount = pipelineData?.SalesPipeline?.find((item: any) => item.Metric === 'Contacted')?.Count
    ?? leadsList.filter(l => l.Lead_Status === 'Contacted').length;

  const qualifiedCount = pipelineData?.SalesPipeline?.find((item: any) => item.Metric === 'Qualified')?.Count
    ?? leadsList.filter(l => l.Lead_Status === 'Qualified').length;

  const convertedLeadsCount = pipelineData?.ConvertedLeads
    ?? leadsList.filter(l => l.Lead_Status === 'Converted').length;

  const conversionRate = pipelineData?.LeadConversionRate ?? '0%';
  const newLeadsLast7Days = pipelineData?.NewLeadsLast7Days ?? 0;
  if (isLoaded && !canViewLeadOverview) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-2.5 text-left"
    >
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{getTenantName().toUpperCase()}</BreadcrumbPage>

            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Sales & CRM</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Leads</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Top Header Block */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-3 lg:p-3.5 rounded-xl border dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-909 dark:text-white">Lead List</h1>

        </div>

        <div className="flex flex-wrap items-center gap-2.5 lg:gap-3">
          {viewMode !== 'Right Time to Call' && (
            <div className="flex items-center bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl px-2.5 lg:px-3 py-1 lg:py-1.5 gap-2 text-xs lg:text-sm font-medium">
              <span className="text-slate-400 font-normal">View:</span>
              <Select value={viewMode || "All Leads"} onValueChange={(val) => setViewMode(val || 'All Leads')}>
                <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0 font-semibold text-slate-808 dark:text-slate-200 cursor-pointer">
                  <SelectValue placeholder="All Leads" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Leads">All Leads</SelectItem>
                  <SelectItem value="My Leads">My Leads</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Add Lead Primary Action */}
          {canCreateLead && (
            <Button
              onClick={() => router.push('/marketing/leads/create')}
              style={{ backgroundColor: primaryColor }}
              className="text-white font-semibold rounded-xl h-8.5 lg:h-9 px-3.5 lg:px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add Lead
            </Button>
          )}

          {/* Import Lead Button */}
          {canImportLead && (
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
              className="h-8.5 lg:h-9 gap-1.5 lg:gap-2 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <Upload className="h-4 w-4" /> Import
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* Total Leads */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Leads</span>
            <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{totalLeadsCount}</p>
          </div>
          <div className="p-2.5 lg:p-3 bg-blue-50 dark:bg-blue-955/30 rounded-xl lg:rounded-2xl shrink-0">
            <Users className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-blue-505" />
          </div>
        </div>

        {/* New Leads */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider block">New Leads</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {newLeadsCount}
              </p>
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-955/30 px-1.5 py-0.5 rounded-full text-[9px] lg:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                <TrendingUp className="h-3 w-3" /> {newLeadsLast7Days} in 7d
              </div>
            </div>
          </div>
          <div className="p-2.5 lg:p-3 bg-blue-50 dark:bg-blue-955/30 rounded-xl lg:rounded-2xl shrink-0">
            <UserPlus className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-blue-505" />
          </div>
        </div>

        {/* Contacted */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider block">Contacted</span>
            <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {contactedCount}
            </p>
          </div>
          <div className="p-2.5 lg:p-3 bg-amber-50 dark:bg-amber-955/30 rounded-xl lg:rounded-2xl shrink-0">
            <Phone className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-amber-505" />
          </div>
        </div>

        {/* Qualified */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider block">Qualified</span>
            <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {qualifiedCount}
            </p>
          </div>
          <div className="p-2.5 lg:p-3 bg-purple-50 dark:bg-purple-955/30 rounded-xl lg:rounded-2xl shrink-0">
            <Shield className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-purple-550" />
          </div>
        </div>

        {/* Converted */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2 hover:shadow-xs transition-all duration-200">
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[10px] lg:text-xs font-semibold text-slate-400 uppercase tracking-wider block">Converted</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {convertedLeadsCount}
              </p>
              <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-955/30 px-1.5 py-0.5 rounded-full text-[9px] lg:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                <TrendingUp className="h-3 w-3" /> {conversionRate}
              </div>
            </div>
          </div>
          <div className="p-2.5 lg:p-3 bg-emerald-50 dark:bg-emerald-955/30 rounded-xl lg:rounded-2xl shrink-0">
            <CheckCircle2 className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Table Tabs Header */}
        <div className="flex border-b dark:border-slate-800 px-3 lg:px-4 pt-1 gap-3 lg:gap-4 bg-slate-50/20 dark:bg-slate-955/10">
          {[
            { id: 'All Leads', label: 'All Leads', count: allLeadsCount },
            { id: 'Right Time to Call', label: 'Right Time to Call', count: rightTimeToCallCount }
          ].map((tab) => {
            const isActive = viewMode === tab.id || (tab.id === 'All Leads' && viewMode === 'My Leads');
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setViewMode(tab.id);
                  setCurrentPage(1);
                }}
                className={`py-2.5 lg:py-3 text-xs lg:text-sm font-bold border-b-2 transition-all cursor-pointer relative flex items-center gap-2 ${isActive ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                style={isActive ? { borderBottomColor: primaryColor, color: primaryColor } : {}}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] lg:text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  style={isActive ? { backgroundColor: `${primaryColor}18`, color: primaryColor } : {}}
                >
                  {typeof tab.count === 'number' ? tab.count.toLocaleString() : (tab.count ?? 0)}
                </span>
              </button>
            );
          })}
        </div>
        {/* Table Filter/Search Header (visible when no leads are selected) */}
        <AnimatePresence mode="wait">
          {selectedLeads.length === 0 ? (
            <motion.div
              key="default-header"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-2.5 md:flex-row md:items-center justify-between p-2 lg:p-3 border-b dark:border-slate-800"
            >
              <div className="relative w-full md:w-[300px] lg:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 lg:h-4 lg:w-4 text-slate-400" />
                <Input
                  placeholder="Search leads by name, email, phone..."
                  className="pl-9 h-8.5 lg:h-9.5 bg-slate-50 dark:bg-slate-950 border-slate-205 dark:border-slate-800 font-medium text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2.5 lg:gap-3">
                <Select value={statusFilter || "All"} onValueChange={(val) => { setStatusFilter(val || 'All'); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[130px] lg:w-[140px] h-8.5 lg:h-9.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs rounded-xl font-medium">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                    <SelectItem value="Disqualified">Disqualified</SelectItem>
                    <SelectItem value="Nurturing">Nurturing</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(true)}
                  className={`h-8.5 lg:h-9.5 px-3 lg:px-3.5 gap-1.5 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 ${isFilterApplied ? 'bg-blue-50 text-blue-600 dark:bg-blue-955/20' : ''}`}
                >
                  <Filter className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </Button>

                {canExportLead && (
                  <Button variant="outline" onClick={handleExport} className="h-8.5 lg:h-9.5 px-3 lg:px-3.5 gap-1.5 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Download className="h-3.5 w-3.5 lg:h-4 lg:w-4" /> Export CSV
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Multi-Select Action Bar */
            <motion.div
              key="selected-header"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-slate-50/80 dark:bg-slate-955/60 border-b dark:border-slate-800"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-1">
                  <Checkbox
                    checked={selectedLeads.length === filteredLeads.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  />
                  <span className="text-xs font-bold text-slate-707 dark:text-slate-300">
                    {selectedLeads.length} selected
                  </span>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />

                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold text-slate-600 dark:text-slate-400 gap-1.5 h-8.5 rounded-lg px-2.5 cursor-pointer"
                    onClick={() => {
                      setSelectedBulkOwnerId('');
                      setIsBulkAssignOpen(true);
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Assign
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-600 dark:text-slate-400 gap-1.5 h-8.5 rounded-lg px-2.5 cursor-pointer">
                        <RefreshCw className="h-3.5 w-3.5" /> Change Status
                      </Button>
                    } />
                    <DropdownMenuContent className="w-44 dark:bg-slate-900 border dark:border-slate-800">
                      {(['New', 'Open', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Disqualified', 'Nurturing'] as const).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={async () => {
                            try {
                              const leadIds = selectedLeads.map(id => parseInt(id, 10));
                              await bulkUpdateLeadStatus({
                                Lead_Status: status,
                                lead_ids: leadIds
                              });
                              toast.success(`Successfully updated status to ${status} for ${selectedLeads.length} leads`);
                              setSelectedLeads([]);
                              queryClient.invalidateQueries({ queryKey: ['leads'] });
                              fetchPipelineData();
                            } catch (err) {
                              toast.error('Failed to bulk update status');
                              console.error(err);
                            }
                          }}
                          className="cursor-pointer text-xs font-medium"
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {canExportLead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 gap-1.5 h-8.5 rounded-lg px-2.5"
                      onClick={handleExport}
                    >
                      <Download className="h-3.5 w-3.5" /> Export
                    </Button>
                  )}

                  {canDeleteLead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 dark:hover:bg-rose-955/20 gap-1.5 h-8.5 rounded-lg px-2.5"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 gap-1.5 h-8.5 rounded-lg px-2.5 ml-2"
                    onClick={() => setSelectedLeads([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>

              {/* Top Mini-Pagination in Selected Bar */}
              <div className="flex items-center gap-3 text-xs text-slate-505 font-medium self-end md:self-auto">
                <span>{(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalCount)} of {totalCount}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-slate-200 dark:border-slate-800"
                    disabled={!hasPrev || loading}
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  >
                    &lt;
                  </Button>
                  <Button variant="outline" className="h-7 px-2.5 rounded-lg border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 font-bold text-blue-600 dark:text-blue-400">
                    {currentPage}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 rounded-lg border-slate-200 dark:border-slate-800"
                    disabled={!hasNext || loading}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reusable Table View */}
        <ReusableTable
          columns={leadColumns}
          data={leadsList}
          loading={loading}
          enableSelection={true}
          selectedRowIds={selectedLeads}
          onSelectionChange={(selected) => setSelectedLeads(selected.map(item => item.id))}
          rowIdKey="id"
          borderless={true}
          actions={(lead: any) => (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer">
                  <MoreHorizontal className="h-4.5 w-4.5" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-52 dark:bg-slate-900 border dark:border-slate-800 shadow-lg">
                <DropdownMenuLabel className="text-slate-405 font-bold text-[10px] uppercase">Lead Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {canViewLeadOverview && (
                  <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => router.push(`/marketing/leads/${lead.id}`)}>
                    <Eye className="h-4 w-4 text-slate-500" /> View Details
                  </DropdownMenuItem>
                )}

                {canEditLead && (
                  <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => router.push(`/marketing/leads/${lead.id}/edit`)}>
                    <Edit className="h-4 w-4 text-slate-500" /> Edit Lead
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                  setAssignLead(lead);
                  setSelectedOwnerId(lead.Lead_Owner_Id ? lead.Lead_Owner_Id.toString() : '');
                  setIsAssignOpen(true);
                }}>
                  <UserPlus className="h-4 w-4 text-slate-505" /> Assign Lead
                </DropdownMenuItem>

                {/* Nested Submenu for Changing Status */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 cursor-pointer text-xs font-medium">
                    <RefreshCw className="h-4 w-4 text-slate-505" /> Change Status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44 dark:bg-slate-900">
                    {(['New', 'Open', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted', 'Disqualified', 'Nurturing'] as const).map((status) => (
                      <DropdownMenuItem
                        key={status}
                        onClick={async () => {
                          try {
                            await patchUserQualifiedLead(lead.id, { Lead_Status: status });
                            toast.success(`Lead status updated to ${status}`);
                            queryClient.invalidateQueries({ queryKey: ['leads'] });
                            fetchPipelineData();
                          } catch (err) {
                            toast.error('Failed to update status');
                          }
                        }}
                        className="cursor-pointer text-xs font-medium"
                      >
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                  setActiveLead(lead);
                  setIsNoteOpen(true);
                }}>
                  <FileText className="h-4 w-4 text-slate-505" /> Add Note
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                  setActiveLead(lead);
                  setIsTaskOpen(true);
                }}>
                  <CheckSquare className="h-4 w-4 text-slate-505" /> Add Task
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => {
                  setActiveLead(lead);
                  setIsMailOpen(true);
                }}>
                  <Mail className="h-4 w-4 text-slate-505" /> Send Email
                </DropdownMenuItem>

                <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-medium" onClick={() => window.open(`tel:${lead.PhoneNo}`)}>
                  <PhoneCall className="h-4 w-4 text-slate-505" /> Make Call
                </DropdownMenuItem>

                {canDeleteLead && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-xs font-bold" onClick={() => handleDeleteLead(lead.id)}>
                      <Trash2 className="h-4 w-4 text-rose-600" /> Delete Lead
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          page={currentPage}
          totalRecords={totalCount}
          onChangePage={(p) => setCurrentPage(p)}
          pageSize={10}
          showGear={true}
          title="Leads"
        />
      </div>

      {/* Advanced Filter Modal */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold dark:text-white">Filter Leads</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">Apply advanced filters to leads list.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Lead Name</label>
              <Input
                placeholder="First/Last Name"
                value={filterParams.Lead_Name}
                onChange={(e) => setFilterParams({ ...filterParams, Lead_Name: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Owner</label>
              <Input
                placeholder="Lead Owner Name"
                value={filterParams.Lead_Owner}
                onChange={(e) => setFilterParams({ ...filterParams, Lead_Owner: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Country</label>
              <Input
                placeholder="Country"
                value={filterParams.Country}
                onChange={(e) => setFilterParams({ ...filterParams, Country: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">State</label>
              <Input
                placeholder="State"
                value={filterParams.State}
                onChange={(e) => setFilterParams({ ...filterParams, State: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">City</label>
              <Input
                placeholder="City"
                value={filterParams.City}
                onChange={(e) => setFilterParams({ ...filterParams, City: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Industry Type</label>
              <Input
                placeholder="e.g. Technology"
                value={filterParams.Industry_Type}
                onChange={(e) => setFilterParams({ ...filterParams, Industry_Type: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Lead Source</label>
              <Input
                placeholder="e.g. Website"
                value={filterParams.Lead_Source}
                onChange={(e) => setFilterParams({ ...filterParams, Lead_Source: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">Lead Status</label>
              <Input
                placeholder="e.g. New"
                value={filterParams.Lead_Status}
                onChange={(e) => setFilterParams({ ...filterParams, Lead_Status: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">From Date</label>
              <Input
                type="date"
                value={filterParams.fromdate}
                onChange={(e) => setFilterParams({ ...filterParams, fromdate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-500">To Date</label>
              <Input
                type="date"
                value={filterParams.todate}
                onChange={(e) => setFilterParams({ ...filterParams, todate: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>Reset</Button>
            <Button size="sm" style={{ backgroundColor: primaryColor }} className="text-white" onClick={handleApplyFilters}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel Modal */}
      <Dialog open={isImportOpen} onOpenChange={(open) => {
        setIsImportOpen(open);
        if (!open) {
          setSelectedFile(null);
          setImportResult(null);
        }
      }}>
        <DialogContent className={`${importResult ? 'max-w-lg' : 'max-w-md'} dark:bg-slate-900 border dark:border-slate-800 transition-all`}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold dark:text-white">
              {importResult ? 'Import Results Summary' : 'Import Leads'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {importResult
                ? 'Review total processed records and any row failure errors.'
                : 'Select an Excel file (.xlsx, .xls) containing leads data to upload.'}
            </DialogDescription>
          </DialogHeader>

          {importResult ? (
            <div className="py-2 space-y-4 text-xs">
              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total</span>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{importResult.Total}</p>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/30 text-center">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Success</span>
                  <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{importResult.Success}</p>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30 text-center">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">Failed</span>
                  <p className="text-xl font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">{importResult.Failed}</p>
                </div>
              </div>

              {/* Failures List */}
              {importResult.Failures && importResult.Failures.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Failures Log ({importResult.Failures.length} rows)
                  </span>
                  <div className="max-h-56 overflow-y-auto border border-rose-200 dark:border-rose-900/40 rounded-xl bg-rose-50/30 dark:bg-rose-950/20 p-3 space-y-2">
                    {importResult.Failures.map((fail, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs pb-2 border-b border-rose-100 dark:border-rose-900/20 last:border-0 last:pb-0">
                        <Badge variant="outline" className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold border-none shrink-0 text-[10px]">
                          Row {fail.row}
                        </Badge>
                        <span className="text-slate-700 dark:text-slate-300 font-medium break-words">
                          {fail.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImportResult(null);
                    setSelectedFile(null);
                  }}
                  className="text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Upload Another File
                </Button>
                <Button
                  size="sm"
                  style={{ backgroundColor: primaryColor }}
                  className="text-white font-bold rounded-xl cursor-pointer"
                  onClick={() => {
                    setIsImportOpen(false);
                    setSelectedFile(null);
                    setImportResult(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="py-4 space-y-4">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Excel Template</p>
                    <p className="text-[11px] text-slate-400 font-medium">Download sample format for lead import</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isDownloadingTemplate}
                    onClick={handleDownloadTemplate}
                    className="h-8 gap-1.5 text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:hover:bg-blue-950/50 cursor-pointer shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {isDownloadingTemplate ? 'Downloading...' : 'Download Template'}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Lead Type</label>
                    <Select value={importLeadType} onValueChange={(val) => setImportLeadType(val || 'New')}>
                      <SelectTrigger className="w-full h-9 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                        <SelectValue placeholder="New" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 font-semibold text-xs">
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Existing">Existing</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="MQL">MQL</SelectItem>
                        <SelectItem value="SQL">SQL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Lead Source</label>
                    <Select value={importLeadSource} onValueChange={(val) => setImportLeadSource(val || 'Website')}>
                      <SelectTrigger className="w-full h-9 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                        <SelectValue placeholder="Website" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 font-semibold text-xs">
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Cold Call">Cold Call</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-center relative hover:bg-slate-50 dark:hover:bg-slate-950/20 cursor-pointer">
                  <Plus className="h-6 w-6 text-slate-400 mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {selectedFile ? selectedFile.name : "Choose Excel file..."}
                  </p>
                  <Input
                    type="file"
                    accept=".xlsx, .xls"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { setIsImportOpen(false); setSelectedFile(null); setImportResult(null); }}>Cancel</Button>
                <Button
                  size="sm"
                  style={{ backgroundColor: primaryColor }}
                  className="text-white"
                  disabled={!selectedFile || isUploading}
                  onClick={handleImportSubmit}
                >
                  {isUploading ? "Uploading..." : "Upload & Import"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Lead Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold dark:text-white">Assign Lead Owner</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Assign {assignLead ? `${assignLead.LeadFirstName || ''} ${assignLead.LeadLastName || ''}`.trim() : 'the lead'} to a new owner.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-xs">
            {assignLead && (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-2 border dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Lead Name:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-semibold">
                    {`${assignLead.LeadFirstName || ''} ${assignLead.LeadLastName || ''}`.trim() || 'No Name'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Company:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-semibold">{assignLead.CompanyName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Current Owner:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-semibold">{assignLead.Lead_Owner || 'Unassigned'}</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Select New Owner</label>
              <Select value={selectedOwnerId} onValueChange={(val) => setSelectedOwnerId(val || '')}>
                <SelectTrigger className="w-full h-10 border-slate-205 dark:border-slate-800 rounded-lg text-xs font-semibold">
                  {(() => {
                    const selectedUser = users.find(u => u.id.toString() === selectedOwnerId);
                    return selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name || ''}`.trim() : 'Choose owner...';
                  })()}
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()} className="font-semibold text-xs">
                      {`${u.first_name} ${u.last_name || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setIsAssignOpen(false); setAssignLead(null); }}>Cancel</Button>
            <Button
              size="sm"
              style={{ backgroundColor: primaryColor }}
              className="text-white font-semibold"
              disabled={!selectedOwnerId}
              onClick={handleAssignSubmit}
            >
              Assign Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Leads Modal */}
      <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold dark:text-white">Bulk Assign Leads</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Assign {selectedLeads.length} selected leads to an agent.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 text-xs">
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Select Agent</label>
              <Select value={selectedBulkOwnerId} onValueChange={(val) => setSelectedBulkOwnerId(val || '')}>
                <SelectTrigger className="w-full h-10 border-slate-205 dark:border-slate-800 rounded-lg text-xs font-semibold">
                  {(() => {
                    const selectedBulkUser = users.find(u => u.id.toString() === selectedBulkOwnerId);
                    return selectedBulkUser ? `${selectedBulkUser.first_name} ${selectedBulkUser.last_name || ''}`.trim() : 'Choose agent...';
                  })()}
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 font-semibold text-xs">
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()} className="font-semibold text-xs">
                      {`${u.first_name} ${u.last_name || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setIsBulkAssignOpen(false); setSelectedBulkOwnerId(''); }}>Cancel</Button>
            <Button
              size="sm"
              style={{ backgroundColor: primaryColor }}
              className="text-white font-semibold"
              disabled={!selectedBulkOwnerId || isBulkAssigning}
              onClick={handleBulkAssignSubmit}
            >
              {isBulkAssigning ? 'Assigning...' : 'Assign Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Note Popup Modal */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold dark:text-white">Add Note</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Create a note for {activeLead ? `${activeLead.LeadFirstName || ''} ${activeLead.LeadLastName || ''}`.trim() : 'the lead'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePopupNoteSubmit} className="space-y-4 text-xs py-2">
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Price negotiation summary"
                value={popupNoteSubject}
                onChange={(e) => {
                  setPopupNoteSubject(e.target.value);
                  if (popupNoteSubjectError) setPopupNoteSubjectError('');
                }}
                className={`h-10 text-xs rounded-lg ${popupNoteSubjectError ? 'border-red-500 focus:ring-red-400 focus-visible:ring-red-400' : ''
                  }`}
              />
              {popupNoteSubjectError && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">{popupNoteSubjectError}</p>
              )}
            </div>
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                Note Details <span className="text-red-500">*</span>
              </label>
              <textarea
                placeholder="Write note details..."
                value={popupNoteContent}
                onChange={(e) => {
                  setPopupNoteContent(e.target.value);
                  if (popupNoteContentError) setPopupNoteContentError('');
                }}
                className={`w-full text-xs p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg min-h-[120px] focus:outline-none focus:border-slate-350 ${popupNoteContentError ? 'border-red-500 focus:border-red-500' : 'border-slate-205 dark:border-slate-800'
                  }`}
              />
              {popupNoteContentError && (
                <p className="text-[10px] text-red-500 font-semibold mt-0.5">{popupNoteContentError}</p>
              )}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNoteOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                size="sm"
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold"
                disabled={isSavingNote}
              >
                {isSavingNote ? 'Saving...' : 'Add Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Task Popup Modal */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold dark:text-white">Add Task</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Create a task for {activeLead ? `${activeLead.LeadFirstName || ''} ${activeLead.LeadLastName || ''}`.trim() : 'the lead'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePopupTaskSubmit} className="space-y-4 text-xs py-2">
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Task Name</label>
              <Input
                placeholder="e.g. Schedule introduction call"
                value={popupTaskName}
                onChange={(e) => setPopupTaskName(e.target.value)}
                className="h-10 text-xs rounded-lg"
                required
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Description</label>
              <textarea
                placeholder="Provide task details..."
                value={popupTaskDesc}
                onChange={(e) => setPopupTaskDesc(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-lg min-h-[70px] focus:outline-none focus:border-slate-350"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Start Date</label>
                <Input
                  type="date"
                  value={popupTaskStartDate}
                  onChange={(e) => setPopupTaskStartDate(e.target.value)}
                  className="h-10 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Due Date</label>
                <Input
                  type="date"
                  value={popupTaskDueDate}
                  onChange={(e) => setPopupTaskDueDate(e.target.value)}
                  className="h-10 text-xs rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Priority</label>
                <Select value={popupTaskPriority} onValueChange={(val) => setPopupTaskPriority(val || '')}>
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                    <SelectValue placeholder="Medium" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    <SelectItem value="Low" className="font-semibold text-xs">Low</SelectItem>
                    <SelectItem value="Medium" className="font-semibold text-xs">Medium</SelectItem>
                    <SelectItem value="High" className="font-semibold text-xs">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status</label>
                <Select value={popupTaskStatus} onValueChange={(val) => setPopupTaskStatus(val || '')}>
                  <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                    <SelectValue placeholder="Pending" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900">
                    <SelectItem value="Pending" className="font-semibold text-xs">Pending</SelectItem>
                    <SelectItem value="In Progress" className="font-semibold text-xs">In Progress</SelectItem>
                    <SelectItem value="Completed" className="font-semibold text-xs">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5 text-left font-semibold">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Assign To</label>
              <Select value={popupTaskAssignedTo} onValueChange={(val) => setPopupTaskAssignedTo(val || '')}>
                <SelectTrigger className="w-full h-10 border-slate-205 dark:border-slate-800 rounded-lg text-xs font-semibold">
                  <SelectValue placeholder="Choose user..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900">
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()} className="font-semibold text-xs">
                      {`${u.first_name} ${u.last_name || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsTaskOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                size="sm"
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold"
                disabled={isSavingTask}
              >
                {isSavingTask ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Email Popup Modal */}
      <Dialog open={isMailOpen} onOpenChange={setIsMailOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold dark:text-white">Send Email</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Log an email sent to {activeLead ? `${activeLead.LeadFirstName || ''} ${activeLead.LeadLastName || ''}`.trim() : 'the lead'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePopupMailSubmit} className="space-y-4 text-xs py-2">
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Receiver Email</label>
              <Input
                value={activeLead ? activeLead.EmailId || '' : ''}
                disabled
                className="h-10 text-xs rounded-lg bg-slate-50/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 cursor-not-allowed font-semibold text-slate-500"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Subject <span className="text-red-500">*</span></label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingAiMail || !popupMailSubject.trim()}
                  onClick={handleGenerateAiMail}
                  className="h-7 text-[11px] px-2.5 rounded-lg border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/60 font-semibold gap-1.5 cursor-pointer shadow-2xs transition-all"
                >
                  {isGeneratingAiMail ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-purple-600 dark:text-purple-400" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      Create AI Assistant
                    </>
                  )}
                </Button>
              </div>
              <Input
                placeholder="Enter email subject (e.g. leave, proposal, meeting)..."
                value={popupMailSubject}
                onChange={(e) => setPopupMailSubject(e.target.value)}
                className="h-10 text-xs rounded-lg"
                required
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Email Body <span className="text-red-500">*</span></label>
              <textarea
                placeholder="Enter email message body..."
                value={popupMailBody}
                onChange={(e) => setPopupMailBody(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg min-h-[120px] focus:outline-none focus:border-slate-350"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsMailOpen(false)}>Cancel</Button>
              <Button
                type="submit"
                size="sm"
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold"
                disabled={isSavingMail}
              >
                {isSavingMail ? 'Sending...' : 'Send'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-909 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              {deleteMode === 'single'
                ? 'Are you sure you want to permanently delete this lead? This action cannot be undone.'
                : `Are you sure you want to permanently delete the ${selectedLeads.length} selected leads? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsDeleteOpen(false); setLeadToDelete(null); }}
              className="text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
