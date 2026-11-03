'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { useStore } from '@/store/useStore';
import { useTodaysCallsStore } from '@/store/useTodaysCallsStore';
import { useKnowlarity } from '@/store/KnowlarityContext';
import { fetchNewITTodayCallCard, fetchNewITTodayCallList, fetchCallCenterListsWithoutPagination } from '@/service/api/CallCenter/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

// Format helper for dates
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};
import {
  MapPin,
  Phone,
  Calendar,
  Clock,
  Users,
  Search,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Download,
  Filter,
  Plus,
  X,
  Check,
  CheckCircle,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function TodaysCallsPage() {
  const router = useRouter();
  const {
    canViewTodaysCallListOverview,
    canCreateTodaysCallList,
    canExportTodaysCallList,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewTodaysCallListOverview) {
      toast.error("You do not have permission to view Today's Call List.");
      router.push('/');
    }
  }, [canViewTodaysCallListOverview, isLoaded, router]);

  const { primaryColor, user } = useStore();
  const { makeCall, isPlacingCall } = useKnowlarity();

  const userId = useMemo(() => {
    return user?.id || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
  }, [user]);

  const orgId = useMemo(() => {
    return user?.organizationId || (typeof window !== 'undefined' ? (localStorage.getItem('orgDetail') || localStorage.getItem('Organization_Id')) : null);
  }, [user]);

  const convertDDMMYYYYToYYYYMMDD = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const [cardStats, setCardStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0
  });

  const [loadingCards, setLoadingCards] = useState(false);

  const {
    calls,
    selectedDate,
    searchQuery,
    selectedAssignee,
    selectedStatus,
    setFilters,
    resetFilters,
    setSelectedDate,
    shiftDate,
    addCall: storeAddCall,
    updateCallStatus: storeUpdateCallStatus,
    updateCall: storeUpdateCall
  } = useTodaysCallsStore();

  const [calendarOpen, setCalendarOpen] = useState(false);

  // Convert "DD/MM/YYYY" to Date object for the calendar component
  const selectedDateObject = useMemo(() => {
    const parts = selectedDate.split('/');
    if (parts.length !== 3) return new Date();
    return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  }, [selectedDate]);

  // Initially load today's date
  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    setSelectedDate(`${day}/${month}/${year}`);
  }, [setSelectedDate]);

  // Pagination & Modal States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeActionsId, setActiveActionsId] = useState<string | null>(null);
  const [editingCallId, setEditingCallId] = useState<string | null>(null);

  const [newCallForm, setNewCallForm] = useState<{
    leadName: string;
    company: string;
    phone: string;
    nextCallDateTime: string;
    assignedTo: string;
    status: 'Completed' | 'Pending' | 'Overdue';
  }>({
    leadName: '',
    company: '',
    phone: '',
    nextCallDateTime: '24/05/2024 09:00 AM',
    assignedTo: 'Sarah Miller',
    status: 'Pending'
  });

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingCallId(null);
    setNewCallForm({
      leadName: '',
      company: '',
      phone: '',
      nextCallDateTime: `${selectedDate} 09:00 AM`,
      assignedTo: 'Sarah Miller',
      status: 'Pending'
    });
  };

  const [users, setUsers] = useState<any[]>([]);
  const [apiCalls, setApiCalls] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const [dropdownLists, setDropdownLists] = useState<any[]>([]);
  const [selectedCallListId, setSelectedCallListId] = useState<string>('All');

  // Fetch dropdown call lists on mount / when credentials change
  useEffect(() => {
    let active = true;
    const loadDropdownLists = async () => {
      if (!userId || !orgId) return;
      try {
        const data = await fetchCallCenterListsWithoutPagination(userId, orgId);
        if (active && Array.isArray(data)) {
          setDropdownLists(data);
        }
      } catch (err) {
        console.error('Failed to load dropdown call lists', err);
      }
    };
    loadDropdownLists();
    return () => {
      active = false;
    };
  }, [userId, orgId]);

  // Filter dropdown lists by selectedDate on the frontend
  const filteredDropdownLists = useMemo(() => {
    return dropdownLists.filter((list) => {
      const listDate = list.Call_Date || list.Created_Date;
      if (!listDate) return false;
      return formatDate(listDate) === selectedDate;
    });
  }, [dropdownLists, selectedDate]);

  // Auto-reset or auto-select selectedCallListId based on the filtered dropdown lists
  useEffect(() => {
    if (filteredDropdownLists.length === 1) {
      setSelectedCallListId(String(filteredDropdownLists[0].id));
    } else if (selectedCallListId !== 'All') {
      const exists = filteredDropdownLists.some((list) => String(list.id) === selectedCallListId);
      if (!exists) {
        setSelectedCallListId('All');
      }
    }
  }, [filteredDropdownLists, selectedCallListId]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch users list
  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      try {
        const res = await fetchUsersList();
        if (!active) return;
        const list = res
          ? (Array.isArray(res) ? res : (res.results || res.data || []))
          : [];
        const mappedUsers = list.map((u: any) => ({
          id: u.id || u.User_Id || 0,
          name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email || 'Unknown'
        }));
        setUsers(mappedUsers);
      } catch (err) {
        console.error('Failed to load users list:', err);
      }
    };
    loadUsers();
    return () => {
      active = false;
    };
  }, []);

  // Fetch card data & list details
  useEffect(() => {
    if (!userId) return;
    let active = true;

    const loadData = async () => {
      setLoadingCards(true);
      setLoadingList(true);
      try {
        const formattedDate = convertDDMMYYYYToYYYYMMDD(selectedDate);

        // 1. Fetch Cards
        const cardRes = await fetchNewITTodayCallCard({
          user_id: userId,
          start_date: formattedDate,
          end_date: formattedDate,
          ...(selectedAssignee !== 'All' && { assigned_id: selectedAssignee }),
          ...(selectedCallListId !== 'All' && { list_id: selectedCallListId })
        });

        // 2. Fetch List Table
        const listRes = await fetchNewITTodayCallList({
          start_date: formattedDate,
          end_date: formattedDate,
          ...(selectedStatus !== 'All' && { status: selectedStatus }),
          ...(selectedAssignee !== 'All' && { assigned_to: selectedAssignee }),
          ...(debouncedSearchQuery.trim() !== '' && { search: debouncedSearchQuery }),
          ...(selectedCallListId !== 'All' && { list_id: selectedCallListId })
        });

        if (!active) return;

        if (cardRes) {
          setCardStats({
            total: cardRes.total_calls ?? cardRes.total ?? 0,
            completed: cardRes.completed ?? 0,
            pending: cardRes.pending ?? 0,
            overdue: cardRes.overdue ?? 0
          });
        }

        const resultsArray = listRes.results || (Array.isArray(listRes) ? listRes : []);
        const mappedCalls: any[] = [];

        resultsArray.forEach((item: any) => {
          const listIndustry = item.ListIndustry || [];
          listIndustry.forEach((lead: any) => {
            mappedCalls.push({
              id: String(lead.id),
              leadName: lead.Lead_Name || 'Unnamed Contact',
              company: lead.Company || 'N/A',
              location: [lead.City, lead.State, lead.Country].filter(Boolean).join(', ') || 'N/A',
              phone: lead.Phone_No || 'N/A',
              nextCallDateTime: item.Call_Date ? `${item.Call_Date} 09:00 AM` : 'N/A',
              dateStr: selectedDate,
              assignedTo: lead.Assign_Name || 'Unassigned',
              avatarUrl: lead.Assign_Name
                ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(lead.Assign_Name)}`
                : `https://api.dicebear.com/7.x/initials/svg?seed=Unassigned`,
              status: lead.Call_Status || 'Pending'
            });
          });
        });

        setApiCalls(mappedCalls);
      } catch (err) {
        console.error('Failed to load today calls data', err);
      } finally {
        if (active) {
          setLoadingCards(false);
          setLoadingList(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [selectedDate, userId, selectedStatus, selectedAssignee, debouncedSearchQuery, selectedCallListId]);

  const updateCallStatus = (id: string, status: 'Completed' | 'Pending' | 'Overdue') => {
    storeUpdateCallStatus(id, status);
    setApiCalls(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateCall = (id: string, fields: any) => {
    storeUpdateCall(id, fields);
    setApiCalls(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  };

  const addCall = (call: any) => {
    storeAddCall(call);
    const dateStr = call.nextCallDateTime.split(' ')[0];
    setApiCalls(prev => [
      {
        id: 'tc-temp-' + Date.now(),
        leadName: call.leadName,
        company: call.company,
        phone: call.phone,
        nextCallDateTime: call.nextCallDateTime,
        dateStr,
        assignedTo: call.assignedTo,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(call.assignedTo)}`,
        status: call.status
      },
      ...prev
    ]);
  };

  const metrics = cardStats;
  const filteredCalls = apiCalls;

  // Sorted calls (Completed at top, then Pending, then Overdue - or chronological)
  const sortedCalls = useMemo(() => {
    return [...filteredCalls].sort((a, b) => {
      // Completed calls can sit at the top or follow chronological order.
      // Let's sort by time. E.g. "09:30 AM" -> "09:30"
      const getTimeVal = (dtStr: string) => {
        const parts = dtStr.split(' ');
        if (parts.length < 2) return 0;
        const timeParts = parts[1].split(':');
        let hrs = Number(timeParts[0]);
        const mins = Number(timeParts[1]);
        const isPM = parts[2] === 'PM';
        if (isPM && hrs !== 12) hrs += 12;
        if (!isPM && hrs === 12) hrs = 0;
        return hrs * 60 + mins;
      };
      return getTimeVal(a.nextCallDateTime) - getTimeVal(b.nextCallDateTime);
    });
  }, [filteredCalls]);

  // Paginated Calls
  const paginatedCalls = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return sortedCalls.slice(start, end);
  }, [sortedCalls, currentPage, pageSize]);

  const columns: ColumnConfig<any>[] = useMemo(() => [
    {
      key: 'index',
      header: '#',
      sortable: false,
      draggable: false,
      className: 'w-12 text-center pl-4 font-mono text-[11px] font-bold text-slate-500',
      render: (_row: any, index: number) => <span>{index + 1}</span>
    },
    {
      key: 'leadName',
      header: 'Lead Name',
      sortable: false,
      render: (call: any) => (
        <button
          type="button"
          onClick={() => toast.info(`Viewing details for lead ${call.leadName}`)}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
        >
          {call.leadName}
        </button>
      )
    },
    {
      key: 'company',
      header: 'Company',
      sortable: false,
      className: 'text-xs font-semibold text-slate-700 dark:text-slate-350'
    },
    {
      key: 'location',
      header: 'Location',
      sortable: false,
      className: 'text-xs font-semibold text-slate-600 dark:text-slate-400',
      render: (call: any) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[120px]">{call.location}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: false,
      className: 'text-xs font-semibold text-slate-600 dark:text-slate-455 font-mono'
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      sortable: false,
      render: (call: any) => (
        <div className="flex items-center gap-2 text-left">
          <img
            src={call.avatarUrl}
            alt={call.assignedTo}
            className="h-5.5 w-5.5 rounded-full object-cover border border-slate-100 dark:border-slate-850 shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(call.assignedTo)}`;
            }}
          />
          <span className="text-xs font-bold text-slate-750 dark:text-slate-205">{call.assignedTo}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: false,
      className: 'text-center',
      render: (call: any) => {
        if (call.status === 'Completed') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50">
              Completed
            </span>
          );
        }
        if (call.status === 'Pending') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50">
              Pending
            </span>
          );
        }
        if (call.status === 'Overdue') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/50">
              Overdue
            </span>
          );
        }
        return null;
      }
    }
  ], []);

  const tableActions = (call: any) => (
    <div className="flex items-center justify-end gap-1.5">
      {/* Quick call dial trigger */}
      <Button
        variant="outline"
        size="icon-xs"
        onClick={() => {
          if (call.phone && call.phone !== 'N/A') {
            makeCall(call.phone, call.leadName, call.id, orgId || '', call.company || '', 'Lead');
          } else {
            toast.error('Phone number not available for this contact.');
          }
        }}
        disabled={isPlacingCall}
        className={`h-7 w-7 rounded-lg border-slate-200 dark:border-slate-800 transition-colors shrink-0 ${
          call.status === 'Completed'
            ? 'text-slate-400 hover:bg-slate-100'
            : 'text-emerald-600 bg-emerald-50/50 hover:bg-emerald-55 hover:text-emerald-700'
        } disabled:opacity-50`}
        title="Call Lead via Knowlarity"
      >
        <Phone className="h-3.5 w-3.5" />
      </Button>

      {/* Action Options Dropdown */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setActiveActionsId(activeActionsId === call.id ? null : call.id)}
          className="h-7 w-7 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        <AnimatePresence>
          {activeActionsId === call.id && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setActiveActionsId(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-40 text-left"
              >
                <div className="px-3.5 py-1 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Update Status
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateCallStatus(call.id, 'Completed');
                    setActiveActionsId(null);
                    toast.success(`Marked call as Completed.`);
                  }}
                  className="w-full px-3.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Mark Completed</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCallStatus(call.id, 'Pending');
                    setActiveActionsId(null);
                    toast.info(`Marked call as Pending.`);
                  }}
                  className="w-full px-3.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>Mark Pending</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateCallStatus(call.id, 'Overdue');
                    setActiveActionsId(null);
                    toast.error(`Marked call as Overdue.`);
                  }}
                  className="w-full px-3.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span>Mark Overdue</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-900 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setNewCallForm({
                      leadName: call.leadName,
                      company: call.company,
                      phone: call.phone,
                      nextCallDateTime: call.nextCallDateTime,
                      assignedTo: call.assignedTo,
                      status: call.status
                    });
                    setEditingCallId(call.id);
                    setIsAddModalOpen(true);
                    setActiveActionsId(null);
                  }}
                  className="w-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-left"
                >
                  Reschedule Call
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const handleExport = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: 'Generating export document...',
        success: "Today's call list exported successfully!",
        error: 'Export failed.'
      }
    );
  };

  const handleAddCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCallForm.leadName || !newCallForm.company || !newCallForm.phone) {
      toast.error('Please fill in all required fields.');
      return;
    }

    // Extract dateStr from form datetime (e.g. "24/05/2024 09:00 AM" -> "24/05/2024")
    const dateStr = newCallForm.nextCallDateTime.split(' ')[0];

    if (editingCallId) {
      updateCall(editingCallId, {
        leadName: newCallForm.leadName,
        company: newCallForm.company,
        phone: newCallForm.phone,
        nextCallDateTime: newCallForm.nextCallDateTime,
        dateStr,
        assignedTo: newCallForm.assignedTo,
        status: newCallForm.status
      });
      toast.success(`Call for ${newCallForm.leadName} rescheduled successfully.`);
    } else {
      addCall({
        leadName: newCallForm.leadName,
        company: newCallForm.company,
        phone: newCallForm.phone,
        nextCallDateTime: newCallForm.nextCallDateTime,
        dateStr,
        assignedTo: newCallForm.assignedTo,
        status: newCallForm.status
      });
      toast.success(`Call for ${newCallForm.leadName} scheduled successfully.`);
    }

    setIsAddModalOpen(false);
    setEditingCallId(null);

    // Reset Form
    setNewCallForm({
      leadName: '',
      company: '',
      phone: '',
      nextCallDateTime: `${selectedDate} 09:00 AM`,
      assignedTo: 'Sarah Miller',
      status: 'Pending'
    });
  };

  if (isLoaded && !canViewTodaysCallListOverview) {
    return null;
  }

  return (
    <div className="space-y-6 text-left pb-10">

      {/* Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Today's Call List
          </h1>
          <nav className="flex text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 gap-2 items-center">
            <span>{getTenantName().toUpperCase()}</span>
            <span>/</span>
            <span>Call Management</span>
            <span>/</span>
            <span>Call Lists</span>
            <span>/</span>
            <span className="text-green-600 font-bold dark:text-green-400">Today's Call List</span>
          </nav>
        </div>

        {/* Call List & Date Filter on the Top Right */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Call List Selector */}
          <div className="text-left min-w-[160px]">
            <label className="block text-[10px] font-extrabold text-slate-455 uppercase tracking-wider mb-1">Call List</label>
            <div className="relative">
              <select
                value={selectedCallListId}
                onChange={(e) => {
                  setSelectedCallListId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Call Lists</option>
                {filteredDropdownLists.map((list) => (
                  <option key={list.id} value={String(list.id)}>
                    {list.ListName || 'Unnamed List'}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Selector */}
          <div className="text-left min-w-[160px]">
            <label className="block text-[10px] font-extrabold text-slate-455 uppercase tracking-wider mb-1">Date</label>
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 overflow-hidden shadow-xs h-[30px]">
              <button
                type="button"
                onClick={() => {
                  shiftDate(-1);
                  setCurrentPage(1);
                }}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-r border-slate-100 dark:border-slate-900 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-slate-650 dark:text-slate-350" />
              </button>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger className="flex-1 text-center py-1 text-xs font-bold text-slate-855 dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 h-full transition-colors">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{selectedDate}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50">
                  <CalendarPicker
                    mode="single"
                    selected={selectedDateObject}
                    onSelect={(d) => {
                      if (d) {
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        setSelectedDate(`${day}/${month}/${year}`);
                        setCurrentPage(1);
                        setCalendarOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>

              <button
                type="button"
                onClick={() => {
                  shiftDate(1);
                  setCurrentPage(1);
                }}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border-l border-slate-100 dark:border-slate-900 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5 text-slate-655 dark:text-slate-350" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Calls Card */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl">
              <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Calls Today</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{cardStats.total}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Completed Card */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{cardStats.completed}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Pending Card */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-orange-50 dark:bg-orange-950/40 rounded-2xl">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-455" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pending</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{cardStats.pending}</h3>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Card */}
        <Card className="rounded-2xl border-slate-100 dark:border-slate-850 hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue</p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-455 mt-0.5">{cardStats.overdue}</h3>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Unified Filters Container */}
      <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-850 rounded-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* Search bar */}
          <div className="sm:col-span-2 text-left">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                placeholder="Search lead, company, phone, email..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Assigned To selector */}
          <div className="text-left">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Assigned To</label>
            <div className="relative">
              <select
                value={selectedAssignee}
                onChange={(e) => setFilters({ selectedAssignee: e.target.value })}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Assignees</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Status selector */}
          <div className="text-left">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Status</label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setFilters({ selectedStatus: e.target.value })}
                className="w-full pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Clear Button */}
          <div className="text-left flex flex-col justify-end">
            <label className="block text-[10px] font-extrabold text-transparent select-none mb-1">Clear</label>
            <Button
              type="button"
              onClick={() => {
                resetFilters();
                setSelectedCallListId('All');
                toast.success('Filters reset.');
              }}
              variant="outline"
              className="w-full h-[30px] rounded-xl px-3 text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-colors"
            >
              Clear
            </Button>
          </div>

        </div>
      </div>

      {/* Table Section */}
      <ReusableTable
        columns={columns}
        data={paginatedCalls}
        actions={tableActions}
        loading={loadingList}
        title="No scheduled calls on this date matching the current filters."
        rowKey="id"
        page={currentPage}
        totalRecords={sortedCalls.length}
        onChangePage={setCurrentPage}
        pageSize={pageSize}
        onChangePageSize={setPageSize}
        showGear={false}
        style={{ borderRadius: '1rem' }}
      />

      {/* Add/Reschedule Call Dialog Modal overlay */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 dark:bg-black/80"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 text-left"
            >

              {/* Title Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-900">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {editingCallId ? 'Reschedule Call' : "Schedule Today's Call"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form content */}
              <form onSubmit={handleAddCallSubmit} className="mt-4 space-y-4">

                {/* Lead Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Lead Name *</label>
                  <input
                    type="text"
                    required
                    value={newCallForm.leadName}
                    onChange={(e) => setNewCallForm(prev => ({ ...prev, leadName: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newCallForm.company}
                    onChange={(e) => setNewCallForm(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g. IT Solutions"
                    className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newCallForm.phone}
                    onChange={(e) => setNewCallForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +1 555-000-1111"
                    className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>                 {/* DateTime Picker */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Date & Time *</label>
                  <input
                    type="text"
                    required
                    value={newCallForm.nextCallDateTime}
                    onChange={(e) => setNewCallForm(prev => ({ ...prev, nextCallDateTime: e.target.value }))}
                    placeholder="e.g. 24/05/2024 09:30 AM"
                    className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Assigned To */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Assign Caller</label>
                    <select
                      value={newCallForm.assignedTo}
                      onChange={(e) => setNewCallForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none cursor-pointer"
                    >
                      <option value="Sarah Miller">Sarah Miller</option>
                      <option value="Mike Johnson">Mike Johnson</option>
                      <option value="Emily Davis">Emily Davis</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Call Status</label>
                    <select
                      value={newCallForm.status}
                      onChange={(e) => setNewCallForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 text-xs font-semibold border rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 outline-none cursor-pointer"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Completed">Completed</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-900">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm"
                  >
                    Save
                  </Button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
