'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useStore } from '@/store/useStore';
import { useCallStore } from '@/store/useCallStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  MapPin,
  Eye,
  Check,
  ChevronRight,
  X,
  Users,
  Compass,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  fetchUserQualifiedLeadsList,
  searchUserQualifiedLeads,
  fetchUsersList,
} from '@/service/api/Leads/api';
import { postCallCenterLeadFilter, createUserCallCenterList } from '@/service/api/CallCenter/api';

interface CreateLeadMock {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  owner: string;
  ownerId?: number | null;
  location?: string;
  industry?: string;
}

export default function CreateCallListWizardPage() {
  const router = useRouter();
  const {
    canCreateCallList,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canCreateCallList) {
      toast.error('You do not have permission to create Call Lists.');
      router.push('/call-management/call-lists');
    }
  }, [canCreateCallList, isLoaded, router]);

  const { primaryColor, user } = useStore();
  const { callLists, addCallList } = useCallStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic user and organization IDs
  const userId = useMemo(() => {
    return user?.id || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
  }, [user]);

  const orgId = useMemo(() => {
    return user?.organizationId || (typeof window !== 'undefined' ? (localStorage.getItem('orgDetail') || localStorage.getItem('Organization_Id')) : null);
  }, [user]);

  // Step 1: Selected Leads state (persisted as objects to handle pagination)
  const [selectedLeads, setSelectedLeads] = useState<CreateLeadMock[]>([]);
  const selectedLeadIds = useMemo(() => selectedLeads.map(l => l.id), [selectedLeads]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [debouncedLocationFilter, setDebouncedLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<any[]>([]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchTerm);
      setCurrentPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Debounce location filter
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocationFilter(locationFilter);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [locationFilter]);

  // Load users list for Lead Owner filter dropdown
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

  // TanStack Query to fetch leads from API
  const { data: leadsData, isLoading: loading } = useQuery({
    queryKey: ['callWizardLeads', debouncedSearchQuery, sourceFilter, statusFilter, ownerFilter, debouncedLocationFilter, currentPage],
    queryFn: async () => {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
      const userId = userIdStr ? parseInt(userIdStr, 10) : undefined;

      if (debouncedSearchQuery.trim() !== '') {
        return searchUserQualifiedLeads({
          User_id: userId,
          search: debouncedSearchQuery,
          page: currentPage
        });
      }

      const hasActiveFilters =
        sourceFilter !== 'All' ||
        statusFilter !== 'All' ||
        ownerFilter !== 'All' ||
        debouncedLocationFilter.trim() !== '';

      if (hasActiveFilters) {
        return postCallCenterLeadFilter({
          Lead_Status: statusFilter === 'All' ? undefined : statusFilter,
          Lead_Owner: ownerFilter === 'All' ? undefined : ownerFilter,
          LeadSource: sourceFilter === 'All' ? undefined : sourceFilter,
          City: debouncedLocationFilter.trim() !== '' ? debouncedLocationFilter.trim() : undefined,
          page: currentPage
        });
      } else {
        return fetchUserQualifiedLeadsList({
          page: currentPage
        });
      }
    },
    placeholderData: keepPreviousData,
  });

  // Map API leads to expected CreateLeadMock structure
  const apiLeads: CreateLeadMock[] = useMemo(() => {
    const results = leadsData?.results || [];
    return results.map((lead: any) => ({
      id: String(lead.id),
      name: `${lead.LeadFirstName || ''} ${lead.LeadLastName || ''}`.trim() || 'Unnamed Lead',
      company: lead.CompanyName || 'N/A',
      email: lead.EmailId || 'N/A',
      phone: lead.PhoneNo || 'N/A',
      status: lead.Lead_Status || 'New',
      source: lead.LeadSource || 'N/A',
      owner: lead.Lead_Owner || 'Unassigned',
      ownerId: lead.Lead_Owner_Id !== undefined && lead.Lead_Owner_Id !== null ? Number(lead.Lead_Owner_Id) : null,
      location: lead.LeadLocation || lead.City || '',
      industry: lead.Lead_Industry || ''
    }));
  }, [leadsData]);

  

  const totalCount = leadsData?.count || 0;
  const hasNext = !!leadsData?.next;
  const hasPrev = !!leadsData?.previous;
  const totalPages = Math.ceil(totalCount / 10) || 1; // Backend typically uses pagination of 10

  // Step 2: Call Details state
  const [callName, setCallName] = useState('');
  const [description, setDescription] = useState('');
  // Preset callDate to today (yyyy-MM-dd format)
  const [callDate, setCallDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Modal to view selected leads
  const [showSelectedModal, setShowSelectedModal] = useState(false);

  // Handle single lead checkbox toggle
  const handleToggleLead = (lead: CreateLeadMock) => {
    setSelectedLeads(prev =>
      prev.some(item => item.id === lead.id)
        ? prev.filter(item => item.id !== lead.id)
        : [...prev, lead]
    );
  };


  // Handle Select All toggle
  const handleToggleSelectAll = () => {
    const allCurrentPageSelected = apiLeads.length > 0 && apiLeads.every(l => selectedLeadIds.includes(l.id));

    if (allCurrentPageSelected) {
      setSelectedLeads(prev => prev.filter(item => !apiLeads.some(l => l.id === item.id)));
    } else {
      const toAdd = apiLeads.filter(l => !selectedLeadIds.includes(l.id));
      setSelectedLeads(prev => [...prev, ...toAdd]);
    }
  };


  const handleNextStep = () => {
    if (currentStep === 1) {
      if (selectedLeadIds.length === 0) {
        toast.error('Please select at least one lead to continue.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!callName.trim()) {
        toast.error('Call Name is required.');
        return;
      }
      if (!callDate) {
        toast.error('Call Date is required.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      handleCreateCallList();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.push('/call-management/call-lists');
    }
  };

  // Final Action: Create and save Call List
  const handleCreateCallList = async () => {
    if (!userId) {
      toast.error('User session not found. Please log in again.');
      return;
    }
    if (!orgId) {
      toast.error('Organization ID not found. Please verify your workspace.');
      return;
    }

    setIsSubmitting(true);

    try {
      const numericUserId = parseInt(String(userId), 10);
      const numericOrgId = parseInt(String(orgId), 10);

      if (isNaN(numericUserId)) {
        toast.error('Invalid User ID. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }
      if (isNaN(numericOrgId)) {
        toast.error('Invalid Organization ID. Please check your workspace configuration.');
        setIsSubmitting(false);
        return;
      }

      // Extract unique locations from selected leads
      const locations = Array.from(
        new Set(selectedLeads.map(l => l.location).filter(Boolean))
      ) as string[];

      const payload = {
        ListName: callName,
        Location: locations,
        Vennilacontact: selectedLeads.map(l => Number(l.id)),
        Contact: [],
        Callconnected: true,
        Organization_Id: numericOrgId,
        Created_By: numericUserId,
        Updated_By: numericUserId,
        Call_Date: callDate,
        Description: description || `Call list containing ${selectedLeads.length} leads.`,
        Industry: selectedLeads.map(l => ({
          id: Number(l.id),
          Lead_Name: l.name,
          Call_Status: 'Pending',
          Assign_Id: l.ownerId !== undefined && l.ownerId !== null ? Number(l.ownerId) : null,
          Assign_Name: l.owner || 'Unassigned',
          Company: l.company || 'N/A',
          Phone_No: l.phone || 'N/A',
          Assign_Status: (l.ownerId !== undefined && l.ownerId !== null) ? 'Assigned' : 'Unassigned',
        })),
      };

      await createUserCallCenterList(payload);
      toast.success(`Call List "${callName}" created successfully!`);
      router.push('/call-management/call-lists');
    } catch (err: any) {
      console.error('Failed to create call list:', err);
      toast.error(err?.message || 'Failed to create Call List. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'Contacted': return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      case 'Qualified': return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      default: return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/30 dark:text-rose-350 dark:border-rose-800';
    }
  };

  const stepsList = [
    { num: 1, label: 'Select Leads', desc: 'Choose leads to include' },
    { num: 2, label: 'Call List Details', desc: 'Fill metadata' },
    { num: 3, label: 'Review Leads', desc: 'Check selected items' },
    { num: 4, label: 'Confirm & Create', desc: 'Finalize creation' }
  ];

  if (isLoaded && !canCreateCallList) {
    return null;
  }

  return (
    <div className="space-y-4 text-left pb-6">

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Create Call List from Existing Leads
        </h1>
        <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
          <span className="hover:underline cursor-pointer" onClick={() => router.push('/')}>Home</span>
          <span>/</span>
          <span className="hover:underline cursor-pointer" onClick={() => router.push('/call-management/call-lists')}>Call Lists</span>
          <span>/</span>
          <span className="text-green-600 font-bold dark:text-green-400">Create Call List</span>
        </nav>
      </div>

      {/* Stepper Wizard Indicator Header */}
      <div className="bg-white dark:bg-slate-905 border dark:border-slate-850 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-xs">
        {stepsList.map((s, idx) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border shrink-0 transition-all ${currentStep === s.num
                ? 'text-white border-blue-600'
                : currentStep > s.num
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
                style={currentStep === s.num ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
              >
                {currentStep > s.num ? <Check className="h-4.5 w-4.5" /> : s.num}
              </span>
              <div className="flex flex-col text-left">
                <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${currentStep === s.num ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-400'
                  }`}>
                  {s.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">{s.desc}</span>
              </div>
            </div>
            {idx < stepsList.length - 1 && (
              <div className="hidden md:block flex-1 h-[2px] bg-slate-100 dark:bg-slate-800 mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Main Stepper Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Left main form section (col span 2) */}
        <div className="lg:col-span-3 space-y-4">
          <AnimatePresence mode="wait">

            {/* Step 1: Select Leads */}
            {currentStep === 1 && (
              <motion.div
                key="step-select-leads"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <Card className="border-slate-100 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Step 1: Select Leads</h3>
                  </div>
                  <CardContent className="p-3 space-y-3">

                    {/* Filters bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">

                      <div className="text-left">
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Lead Source</label>
                        <Select value={sourceFilter} onValueChange={(val) => { setSourceFilter(val || ''); setCurrentPage(1); }}>
                          <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 border-slate-250 dark:border-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                            <SelectItem value="All">All Sources</SelectItem>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                            <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                            <SelectItem value="Cold Call">Cold Call</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-left">
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            type="text"
                            placeholder="e.g. Chennai"
                            value={locationFilter}
                            onChange={(e) => {
                              setLocationFilter(e.target.value);
                            }}
                            className="pl-8 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 border-slate-250 dark:border-slate-800"
                          />
                        </div>
                      </div>

                      <div className="text-left">
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Lead Status</label>
                        <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || ''); setCurrentPage(1); }}>
                          <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 border-slate-250 dark:border-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                            <SelectItem value="All">All Status</SelectItem>
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Qualified">Qualified</SelectItem>
                            <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                            <SelectItem value="Negotiation">Negotiation</SelectItem>
                            <SelectItem value="Converted">Converted</SelectItem>
                            <SelectItem value="Disqualified">Disqualified</SelectItem>
                            <SelectItem value="Nurturing">Nurturing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="text-left">
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Owner</label>
                        <Select value={ownerFilter} onValueChange={(val) => { setOwnerFilter(val || ''); setCurrentPage(1); }}>
                          <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-355 border-slate-250 dark:border-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                            <SelectItem value="All">All Owners</SelectItem>
                            {users.map((u) => {
                              const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                              return (
                                <SelectItem key={u.id} value={fullName}>
                                  {fullName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                    </div>

                    {/* Search & Apply Filters */}
                    <div className="flex gap-2.5 items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Search by name, email, phone..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="pl-9 h-10 text-xs rounded-xl border-slate-200 dark:border-slate-800"
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setSourceFilter('All');
                          setStatusFilter('All');
                          setOwnerFilter('All');
                          setLocationFilter('');
                          setDebouncedLocationFilter('');
                          setCurrentPage(1);
                        }}
                        className="h-10 text-xs font-semibold px-4 border rounded-xl hover:bg-slate-50 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-1"
                      >
                        <AlertCircle className="h-4 w-4 text-slate-500" />
                        <span>Reset Filters</span>
                      </Button>
                    </div>

                    {/* Leads Checkbox List Table */}
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
                      <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                          <TableRow className="border-b border-slate-100 dark:border-slate-850">
                            <TableHead className="py-1.5 pl-4 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={apiLeads.length > 0 && apiLeads.every(l => selectedLeadIds.includes(l.id))}
                                onChange={handleToggleSelectAll}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500 pl-2">
                              Select All ({selectedLeads.length} selected)
                              <span className="text-[10px] text-slate-400 font-semibold lowercase normal-case ml-2">({totalCount} leads found)</span>
                            </TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Company</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Location</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Location</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Email</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500 font-mono">Phone</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500 text-center">Lead Status</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Lead Source</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Owner</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={9} className="py-3 text-center text-slate-450">
                                <div className="flex flex-col items-center gap-2 py-3">
                                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs font-semibold">Loading leads data...</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : apiLeads.length > 0 ? (
                            apiLeads.map((lead) => {
                              const isChecked = selectedLeadIds.includes(lead.id);
                              return (
                                <TableRow
                                  key={lead.id}
                                  className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${isChecked ? 'bg-green-50/15 dark:bg-green-950/5' : ''
                                    }`}
                                >
                                  <TableCell className="py-1.5 text-center pl-4">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => handleToggleLead(lead)}
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </TableCell>
                                  <TableCell className="py-1.5 pl-2">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-450">{lead.name}</span>
                                  </TableCell>
                                  <TableCell className="py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-355">{lead.company}</TableCell>
                                  <TableCell className="py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span className="truncate max-w-[100px]">{lead.location || '-'}</span></div></TableCell>
                                  <TableCell className="py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{lead.email}</TableCell>
                                  <TableCell className="py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-355 font-mono">{lead.phone}</TableCell>
                                  <TableCell className="py-1.5 text-center">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(lead.status)}`}>
                                      {lead.status}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-1.5 text-xs font-semibold text-slate-650 dark:text-slate-400">{lead.source}</TableCell>
                                  <TableCell className="py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">{lead.owner}</TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={9} className="py-3 text-center text-slate-450">
                                No leads found matching the filters.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Left Sidebar showing entries */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Showing {totalCount > 0 ? (currentPage - 1) * 10 + 1 : 0} to {Math.min(currentPage * 10, totalCount)} of {totalCount} leads
                      </span>

                      {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!hasPrev || loading}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="px-2.5 py-1 text-xs border rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-40 cursor-pointer border-slate-200 dark:border-slate-800"
                          >
                            ←
                          </button>
                          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(page => (
                            <button
                              type="button"
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 text-xs border rounded-lg cursor-pointer ${currentPage === page
                                ? 'bg-green-500 text-white border-green-500 dark:bg-green-600 dark:border-green-600 font-extrabold'
                                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355'
                                }`}
                            >
                              {page}
                            </button>
                          ))}
                          <button
                            type="button"
                            disabled={!hasNext || loading}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="px-2.5 py-1 text-xs border rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 disabled:opacity-40 cursor-pointer border-slate-200 dark:border-slate-800"
                          >
                            →
                          </button>
                        </div>
                      )}
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Call List Details (Call Name, Description, Call Date) */}
            {currentStep === 2 && (
              <motion.div
                key="step-details"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <Card className="border-slate-100 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Step 2: Call List Details</h3>
                  </div>
                  <CardContent className="p-6 space-y-5 text-xs font-semibold text-slate-700 dark:text-slate-300">

                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="callName" className="text-xs font-bold text-slate-650 dark:text-slate-300">Call Name *</Label>
                      <Input
                        id="callName"
                        placeholder="e.g. June 2024 - Priority Leads"
                        value={callName}
                        onChange={(e) => setCallName(e.target.value)}
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-800"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="callDate" className="text-xs font-bold text-slate-650 dark:text-slate-300">Call Date *</Label>
                      <Input
                        id="callDate"
                        type="date"
                        value={callDate}
                        onChange={(e) => setCallDate(e.target.value)}
                        className="h-10 rounded-xl border-slate-200 dark:border-slate-800 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <Label htmlFor="description" className="text-xs font-bold text-slate-650 dark:text-slate-300">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Enter description of this call list..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px] rounded-xl border-slate-200 dark:border-slate-800"
                      />
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Review Leads */}
            {currentStep === 3 && (
              <motion.div
                key="step-review"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <Card className="border-slate-100 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Step 3: Review Selected Leads</h3>
                  </div>
                  <CardContent className="p-3">
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
                      <Table>
                        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                          <TableRow className="border-b border-slate-100 dark:border-slate-850">
                            <TableHead className="py-1.5 pl-4 w-12 text-center">#</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Lead Name</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Company</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Location</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Email</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Phone</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500 text-center">Status</TableHead>
                            <TableHead className="py-1.5 font-bold uppercase text-[9px] tracking-wider text-slate-500">Owner</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedLeads.map((lead, idx) => (
                            <TableRow key={lead.id} className="border-b border-slate-100 dark:border-slate-800">
                              <TableCell className="py-1.5 text-center pl-4 font-mono text-[11px] text-slate-400 font-bold">{idx + 1}</TableCell>
                              <TableCell className="py-1.5 text-xs font-bold text-slate-900 dark:text-white">{lead.name}</TableCell>
                              <TableCell className="py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">{lead.company}</TableCell>
                              <TableCell className="py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"><div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /><span className="truncate max-w-[100px]">{lead.location || '-'}</span></div></TableCell>
                              <TableCell className="py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">{lead.email}</TableCell>
                              <TableCell className="py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350 font-mono">{lead.phone}</TableCell>
                              <TableCell className="py-1.5 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(lead.status)}`}>
                                  {lead.status}
                                </span>
                              </TableCell>
                              <TableCell className="py-1.5 text-xs font-bold text-slate-750 dark:text-slate-300">{lead.owner}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Confirm & Create */}
            {currentStep === 4 && (
              <motion.div
                key="step-confirm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <Card className="border-slate-100 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Step 4: Confirm & Create</h3>
                  </div>
                  <CardContent className="p-6 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">

                    <div className="space-y-4 text-left">
                      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-850 pb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Call List Name</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-white">{callName}</span>
                      </div>

                      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-850 pb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Call Date</span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 font-mono">{callDate}</span>
                      </div>

                      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-850 pb-3">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Leads Selected</span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-350">{selectedLeadIds.length} leads</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Description</span>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-850 mt-1">
                          {description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Stepper Buttons Panel */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handlePrevStep}
              className="font-bold text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer h-10 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleNextStep}
              style={{ backgroundColor: primaryColor }}
              className="text-white text-xs font-bold cursor-pointer h-10 px-5 rounded-xl flex items-center gap-1.5 hover:opacity-90 shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting && <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />}
              <span>{isSubmitting ? 'Creating...' : currentStep === 4 ? 'Create Call List' : `Next: ${stepsList[currentStep].label}`}</span>
              {!isSubmitting && currentStep < 4 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>

        </div>

        {/* Right sidebars (col span 1) */}
        <div className="space-y-4">

          {/* Card 1: Selection Summary */}
          <Card className="border-slate-100 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900 shadow-xs text-left">
            <div className="p-3 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-blue-500" />
              <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200">Selection Summary</h3>
            </div>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Total Leads</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{totalCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Selected Leads</span>
                <span className="font-extrabold text-green-600 dark:text-green-450">{selectedLeadIds.length}</span>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowSelectedModal(true)}
                className="w-full text-xs font-bold h-9 border rounded-xl hover:bg-slate-50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-1.5"
              >
                <Eye className="h-4 w-4" />
                <span>View Selected Leads</span>
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Tips */}
          <Card className="border-emerald-50 dark:border-emerald-950/20 rounded-2xl bg-emerald-50/15 dark:bg-emerald-950/5 text-left">
            <div className="p-3 border-b border-emerald-50 dark:border-emerald-950/20 flex items-center gap-2">
              <Compass className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400">Tips</h3>
            </div>
            <CardContent className="p-3">
              <ul className="text-xs font-semibold text-emerald-800/80 dark:text-emerald-400/80 list-disc pl-4 space-y-2.5">
                <li>You can filter leads by source, status or owner.</li>
                <li>Only active leads will be included in the call list.</li>
              </ul>
            </CardContent>
          </Card>

        </div>

      </div>

      {/* Modal: View Selected Leads */}
      <AnimatePresence>
        {showSelectedModal && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-50 transition-opacity"
              onClick={() => setShowSelectedModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto max-w-xl max-h-[80vh] w-[90%] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 z-55 flex flex-col justify-between text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="font-extrabold text-slate-900 dark:text-white">Selected Leads ({selectedLeadIds.length})</h4>
                <button
                  onClick={() => setShowSelectedModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-[55vh]">
                {selectedLeads.length > 0 ? (
                  selectedLeads.map((lead, idx) => (
                    <div key={lead.id} className="p-2.5 rounded-xl border border-slate-50 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/40 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{idx + 1}. {lead.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">{lead.company} • {lead.email}</p>
                      </div>
                      <button
                        onClick={() => handleToggleLead(lead)}
                        className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-semibold text-slate-400 text-center py-6">No leads selected yet.</p>
                )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-end">
                <Button
                  onClick={() => setShowSelectedModal(false)}
                  style={{ backgroundColor: primaryColor }}
                  className="text-white text-xs font-bold h-9 px-4 rounded-xl cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
