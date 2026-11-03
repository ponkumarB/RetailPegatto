'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDealStore, Deal } from '@/store/useDealStore';
import { useStore } from '@/store/useStore';
import {
  updateDealApi,
  deleteDealApi,
  fetchDealById,
  mapApiDealToUiDeal,
  fetchDealNotes,
  createDealNote,
  updateDealNote,
  deleteDealNote,
  ApiDealNote,
  fetchDealTasks,
  createDealTask,
  updateDealTask,
  deleteDealTask,
  ApiDealTask,
  fetchDealActivities,
  createDealActivity,
  updateDealActivity,
  deleteDealActivity,
  ApiDealActivity,
  fetchUserDealMeetings,
  createDealMeeting,
  updateDealMeeting,
  deleteDealMeeting
} from '@/service/api/deal/api';
import { fetchContactListWithoutPagination } from '@/service/api/contacts/api';
import { fetchUserQualifiedLeadListWithoutPagination, createUserLeadMeeting, fetchUserLeadMeetings } from '@/service/api/Leads/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building,
  User,
  Mail,
  Calendar,
  Edit,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Check,
  DollarSign,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Plus,
  Trash2,
  History,
  Phone,
  ArrowLeft,
  Briefcase,
  AlertCircle,
  File,
  Trophy,
  Activity,
  MessageSquare,
  Search,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';

const WhatsAppIcon = () => (
  <svg className="h-4 w-4 text-[#25D366] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.416 1.46h.005c5.566 0 10.1-4.532 10.104-10.1.002-2.699-1.047-5.236-2.951-7.143C17.31 1.464 14.773.415 12.008.415 6.43.415 1.895 4.947 1.892 10.528c-.001 1.93.504 3.81 1.462 5.418L2.35 20.358l4.297-1.204zM17.9 14.852c-.322-.16-.1.9-.323-1.6-.16-.322-.59-.516-.913-.677-.323-.16-1.897-.933-2.18-.1.036-.282-.226-.436-.452-.516-.226-.08-1.516-.403-2.58.548-.823.823-1.37 1.823-1.53 2.1-.16.28-.016.43.124.57.126.126.282.322.42.484.14.16.186.274.28.452.093.18.046.338-.023.5-.069.16-.62 1.484-.855 2.048-.228.55-.458.484-.62.476-.153-.008-.33-.008-.508-.008-.18 0-.476.067-.726-.206-.25-.274-.95-.93-.95-2.27 0-1.34.975-2.637 1.112-2.82.137-.184 1.92-2.93 4.65-4.113.65-.28 1.157-.448 1.553-.573.654-.208 1.25-.178 1.72-.25.525-.078 1.62-.663 1.85-.92.228-.258.228-.48.15-.623-.076-.14-.282-.226-.6-.386z" />
  </svg>
);

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

export default function DealDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { primaryColor } = useStore();
  const { deals, updateDeal, deleteDeal } = useDealStore();
  const { canViewDealOverview } = usePermission();

  useEffect(() => {
    if (!canViewDealOverview) {
      toast.error('You do not have permission to view Deal details.');
      router.push('/Deal');
    }
  }, [canViewDealOverview, router]);

  if (!canViewDealOverview) {
    return null;
  }
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Sub-states
  const [activeTab, setActiveTab] = useState('Overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNotesCollapsed, setIsNotesCollapsed] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editValue, setEditValue] = useState(0);
  const [editProbability, setEditProbability] = useState(0);
  const [editExpectedClose, setEditExpectedClose] = useState('');
  const [editSummary, setEditSummary] = useState('');

  // Form states
  const [newNote, setNewNote] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Deal notes state from backend API
  const [notesList, setNotesList] = useState<ApiDealNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteSubject, setEditNoteSubject] = useState('');
  const [editNoteText, setEditNoteText] = useState('');

  // Notes pagination states
  const [notesCurrentPage, setNotesCurrentPage] = useState(1);
  const NOTES_PAGE_SIZE = 5;
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [isDeleteNoteOpen, setIsDeleteNoteOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<number | null>(null);

  // Robust PK helper to handle numbers, string integers, objects, or arrays of items
  const getPkValue = (val: any, defaultVal: any = 1): any => {
    if (val === null || val === undefined) return defaultVal;
    if (Array.isArray(val)) {
      if (val.length === 0) return defaultVal;
      return getPkValue(val[0], defaultVal);
    }
    if (typeof val === 'object') {
      return val.id || defaultVal;
    }
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultVal : parsed;
  };

  const parseAndShowError = (err: any, defaultMsg: string) => {
    console.error(err);
    const msg = err?.message || '';
    if (msg.includes('{') && msg.includes('}')) {
      try {
        const jsonStart = msg.indexOf('{');
        const jsonEnd = msg.lastIndexOf('}');
        const jsonStr = msg.substring(jsonStart, jsonEnd + 1);
        const errObj = JSON.parse(jsonStr);
        Object.entries(errObj).forEach(([key, val]) => {
          const message = Array.isArray(val) ? val.join(', ') : String(val);
          toast.error(`${key}: ${message}`);
        });
        return;
      } catch (e) {
        console.error('Failed to parse error JSON from message:', e);
      }
    }
    toast.error(msg || defaultMsg);
  };

  // Deal tasks state from backend API
  const [tasksList, setTasksList] = useState<ApiDealTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isDeleteTaskOpen, setIsDeleteTaskOpen] = useState(false);
  const [taskIdToDelete, setTaskIdToDelete] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  // Task Create / Edit Fields
  const [taskFormName, setTaskFormName] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState('');
  const [taskFormStartDate, setTaskFormStartDate] = useState('');
  const [taskFormDueDate, setTaskFormDueDate] = useState('');
  const [taskFormPriority, setTaskFormPriority] = useState('Normal');
  const [taskFormStatus, setTaskFormStatus] = useState('Pending');
  const [taskFormCompletion, setTaskFormCompletion] = useState('0%');
  const [taskFormAssignedPerson, setTaskFormAssignedPerson] = useState('');

  // Tasks pagination states
  const [tasksCurrentPage, setTasksCurrentPage] = useState(1);
  const TASKS_PAGE_SIZE = 5;

  // Deal activities state from backend API
  const [activitiesList, setActivitiesList] = useState<ApiDealActivity[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isDeleteActivityOpen, setIsDeleteActivityOpen] = useState(false);
  const [activityIdToDelete, setActivityIdToDelete] = useState<number | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null);

  // Form Fields
  const [activityFormTask, setActivityFormTask] = useState('');
  const [activityFormDesc, setActivityFormDesc] = useState('');
  const [activityFormExpectedDate, setActivityFormExpectedDate] = useState('');
  const [activityFormExpectedTime, setActivityFormExpectedTime] = useState('');
  const [activityFormType, setActivityFormType] = useState('Call');
  const [activityFormActive, setActivityFormActive] = useState(true);

  // Optional Reminder Fields
  const [activityFormHasReminder, setActivityFormHasReminder] = useState(false);
  const [activityFormReminderDate, setActivityFormReminderDate] = useState('');
  const [activityFormReminderTime, setActivityFormReminderTime] = useState('');
  const [activityFormReminderMessage, setActivityFormReminderMessage] = useState('');
  const [activityFormReminderFor, setActivityFormReminderFor] = useState('Deal Follow-up');
  const [activityFormReminderRepeat, setActivityFormReminderRepeat] = useState('No');

  // Activities pagination states
  const [activitiesCurrentPage, setActivitiesCurrentPage] = useState(1);
  const ACTIVITIES_PAGE_SIZE = 5;

  // Query Client & Fetch Deal Appointments
  const queryClient = useQueryClient();
  const { data: dealMeetingsData } = useQuery({
    queryKey: ['dealMeetings', id],
    queryFn: () => fetchUserDealMeetings(getPkValue(id)),
    enabled: !!id,
  });
  const dealMeetingsState = Array.isArray(dealMeetingsData) ? dealMeetingsData : (dealMeetingsData?.results || dealMeetingsData?.data || []);
  const loadDealMeetings = () => queryClient.invalidateQueries({ queryKey: ['dealMeetings', id] });

  // Appointment Form States
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<any>(null);
  const [appointmentSubject, setAppointmentSubject] = useState('');
  const [appointmentLocation, setAppointmentLocation] = useState('');
  const [appointmentVenue, setAppointmentVenue] = useState('');
  const [appointmentExpectedDate, setAppointmentExpectedDate] = useState('');
  const [appointmentFromTime, setAppointmentFromTime] = useState('');
  const [appointmentToTime, setAppointmentToTime] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState('Scheduled');
  const [appointmentDetails, setAppointmentDetails] = useState('');
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);

  // Reminder Form States for Appointment
  const [remindMe, setRemindMe] = useState(false);
  const [reminderBeforeDueVal, setReminderBeforeDueVal] = useState('1');
  const [reminderBeforeDueUnit, setReminderBeforeDueUnit] = useState('Hrs');
  const [repeatEveryChecked, setRepeatEveryChecked] = useState(false);
  const [repeatEveryVal, setRepeatEveryVal] = useState('10');
  const [repeatEveryUnit, setRepeatEveryUnit] = useState('Mins');
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderStatus, setReminderStatus] = useState('Pending');

  const handleOpenAddAppointment = () => {
    setEditingMeeting(null);
    setAppointmentSubject('');
    setAppointmentLocation('');
    setAppointmentVenue('');
    setAppointmentExpectedDate('');
    setAppointmentFromTime('');
    setAppointmentToTime('');
    setAppointmentStatus('Scheduled');
    setAppointmentDetails('');
    setRemindMe(false);
    setReminderBeforeDueVal('1');
    setReminderBeforeDueUnit('Hrs');
    setRepeatEveryChecked(false);
    setRepeatEveryVal('10');
    setRepeatEveryUnit('Mins');
    setReminderMessage('');
    setReminderStatus('Pending');
    setIsAppointmentDialogOpen(true);
  };

  const handleOpenEditAppointment = (meet: any) => {
    setEditingMeeting(meet);
    setAppointmentSubject(meet.Subject || '');
    setAppointmentLocation(meet.Location || '');
    setAppointmentVenue(meet.Venue || '');
    setAppointmentExpectedDate(meet.Date || meet.expected_date || '');
    setAppointmentFromTime(meet.FromDate_Time || '');
    setAppointmentToTime(meet.ToDate_Time || '');
    setAppointmentStatus(meet.Status || 'Scheduled');
    setAppointmentDetails(meet.Details ? meet.Details.replace(/<[^>]*>/g, '') : '');

    // Map existing reminder values — API returns reminder under Reminder_Id as an object
    const reminder = meet.Reminder_Id && typeof meet.Reminder_Id === 'object' && meet.Reminder_Id.id
      ? meet.Reminder_Id
      : null;

    if (reminder) {
      setRemindMe(true);
      setReminderMessage(reminder.RemainderMessage || '');
      setReminderStatus(reminder.Status || 'Pending');

      // Parse RemainderDueDate e.g. "5 Mins" → val="5", unit="Mins"
      const dueParts = (reminder.RemainderDueDate || '').trim().split(' ');
      setReminderBeforeDueVal(dueParts[0] || '1');
      setReminderBeforeDueUnit(dueParts[1] || 'Hrs');

      // Parse Repeat_EveryDay e.g. "10 Mins" or ""
      if (reminder.Repeat_EveryDay && reminder.Repeat_EveryDay.trim()) {
        setRepeatEveryChecked(true);
        const repeatParts = reminder.Repeat_EveryDay.trim().split(' ');
        setRepeatEveryVal(repeatParts[0] || '10');
        setRepeatEveryUnit(repeatParts[1] || 'Mins');
      } else {
        setRepeatEveryChecked(false);
        setRepeatEveryVal('10');
        setRepeatEveryUnit('Mins');
      }
    } else {
      setRemindMe(false);
      setReminderBeforeDueVal('1');
      setReminderBeforeDueUnit('Hrs');
      setRepeatEveryChecked(false);
      setRepeatEveryVal('10');
      setRepeatEveryUnit('Mins');
      setReminderMessage('');
      setReminderStatus('Pending');
    }

    setIsAppointmentDialogOpen(true);
  };

  const handleDeleteMeeting = (meetingId: number | string) => {
    toast.warning('Delete appointment?', {
      description: 'Are you sure you want to delete this appointment? This action cannot be undone.',
      duration: Infinity,
      action: {
        label: 'Yes, delete',
        onClick: async () => {
          try {
            await deleteDealMeeting(meetingId);
            toast.success('Appointment deleted successfully!');
            loadDealMeetings();
          } catch (err: any) {
            toast.error(err?.message || 'Failed to delete appointment');
          }
        },
      },
      cancel: {
        label: 'No, keep it',
        onClick: () => { },
      },
    });
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentSubject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!appointmentLocation.trim()) {
      toast.error('Location is required');
      return;
    }
    if (!appointmentVenue.trim()) {
      toast.error('Venue is required');
      return;
    }
    if (!appointmentExpectedDate.trim()) {
      toast.error('Expected Date is required');
      return;
    }
    if (!appointmentFromTime.trim()) {
      toast.error('From Time is required');
      return;
    }
    if (!appointmentToTime.trim()) {
      toast.error('To Time is required');
      return;
    }

    setIsSubmittingAppointment(true);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '111' : '111';
      const userId = parseInt(userIdStr, 10);
      const dealPk = getPkValue(id);

      const reminderId = editingMeeting?.Reminder_Id && typeof editingMeeting.Reminder_Id === 'object'
        ? editingMeeting.Reminder_Id.id
        : (editingMeeting?.Reminder_Id || null);

      const reminderPayload = remindMe ? {
        id: reminderId,
        Created_By: userId,
        Updated_By: userId,
        ReminderFor: "Reminder for Deal Meeting",
        Repeat_EveryDay: repeatEveryChecked ? `${repeatEveryVal} ${repeatEveryUnit}` : "",
        RemainderDueDate: `${reminderBeforeDueVal} ${reminderBeforeDueUnit}`,
        RemainderMessage: reminderMessage || appointmentSubject,
        Status: reminderStatus
      } : null;

      if (editingMeeting) {
        const editPayload = {
          id: editingMeeting.id,
          DealMeeting_Id: editingMeeting.DealMeeting_Id || "",
          Deal_Id: dealPk,
          Subject: appointmentSubject,
          Location: appointmentLocation,
          Venue: appointmentVenue,
          Date: appointmentExpectedDate,
          FromDate_Time: appointmentFromTime,
          ToDate_Time: appointmentToTime,
          Details: appointmentDetails ? `<p>${appointmentDetails}</p>` : "",
          Organization_Id: typeof editingMeeting.Organization_Id === 'object' ? (editingMeeting.Organization_Id?.id || 1) : (editingMeeting.Organization_Id || 1),
          Created_By: typeof editingMeeting.Created_By === 'object' ? (editingMeeting.Created_By?.id || userId) : (editingMeeting.Created_By || userId),
          Updated_By: userId,
          Reminder_Id: reminderPayload
        };
        await updateDealMeeting(editPayload);
        toast.success('Appointment updated successfully!');
      } else {
        const payload = {
          DealMeeting_Id: "",
          Deal_Id: dealPk,
          Subject: appointmentSubject,
          Location: appointmentLocation,
          Venue: appointmentVenue,
          Date: appointmentExpectedDate,
          FromDate_Time: appointmentFromTime,
          ToDate_Time: appointmentToTime,
          Details: appointmentDetails ? `<p>${appointmentDetails}</p>` : "",
          Organization_Id: 1,
          Created_By: userId,
          Updated_By: userId,
          Reminder_Payload: reminderPayload
        };
        await createDealMeeting(payload);
        toast.success('Appointment scheduled successfully!');
      }

      // Reset form states
      setEditingMeeting(null);
      setAppointmentSubject('');
      setAppointmentLocation('');
      setAppointmentVenue('');
      setAppointmentExpectedDate('');
      setAppointmentFromTime('');
      setAppointmentToTime('');
      setAppointmentStatus('Scheduled');
      setAppointmentDetails('');
      setRemindMe(false);
      setReminderBeforeDueVal('1');
      setReminderBeforeDueUnit('Hrs');
      setRepeatEveryChecked(false);
      setRepeatEveryVal('10');
      setRepeatEveryUnit('Mins');
      setReminderMessage('');
      setReminderStatus('Pending');

      setIsAppointmentDialogOpen(false);
      loadDealMeetings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save appointment');
      console.error(err);
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  const getNoteCategoryDetails = (subject: string) => {
    const sub = (subject || '').toLowerCase();
    if (sub.includes('meeting') || sub.includes('meet') || sub.includes('discuss')) {
      return {
        label: 'Meeting',
        icon: Calendar,
        colorClass: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
        lineColor: 'bg-amber-500',
        glowColor: 'shadow-amber-100 dark:shadow-amber-950/20'
      };
    }
    if (sub.includes('call') || sub.includes('phone') || sub.includes('talk')) {
      return {
        label: 'Call Log',
        icon: Phone,
        colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
        lineColor: 'bg-emerald-500',
        glowColor: 'shadow-emerald-100 dark:shadow-emerald-950/20'
      };
    }
    if (sub.includes('email') || sub.includes('mail') || sub.includes('send') || sub.includes('correspondence')) {
      return {
        label: 'Email',
        icon: Mail,
        colorClass: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-900/50',
        lineColor: 'bg-violet-500',
        glowColor: 'shadow-violet-100 dark:shadow-violet-950/20'
      };
    }
    if (sub.includes('follow') || sub.includes('update') || sub.includes('task') || sub.includes('todo')) {
      return {
        label: 'Follow-up',
        icon: Activity,
        colorClass: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
        lineColor: 'bg-blue-500',
        glowColor: 'shadow-blue-100 dark:shadow-blue-950/20'
      };
    }
    return {
      label: 'General Note',
      icon: MessageSquare,
      colorClass: 'text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
      lineColor: 'bg-slate-450',
      glowColor: 'shadow-slate-100 dark:shadow-slate-950/20'
    };
  };

  // Load deal on mount (first local store, then backend API sync)
  useEffect(() => {
    const localDeal = deals.find(d => d.id === id);
    if (localDeal) {
      setDeal(localDeal);
    } else {
      setIsLoading(true);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    fetchDealById(id, token)
      .then((apiDeal) => {
        const mapped = mapApiDealToUiDeal(apiDeal);
        setDeal(mapped);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch deal:', err);
        setIsLoading(false);
      });
  }, [id]);

  // Resolve missing contact email dynamically
  useEffect(() => {
    if (deal && (deal.contactEmail === 'N/A' || !deal.contactEmail)) {
      fetchContactListWithoutPagination()
        .then((contacts) => {
          if (Array.isArray(contacts)) {
            // Try to match contact by Name or Phone
            const matched = contacts.find(c =>
              (c.Name && c.Name.toLowerCase() === deal.contactName.toLowerCase()) ||
              (c.FirstName && c.LastName && `${c.FirstName} ${c.LastName}`.toLowerCase() === deal.contactName.toLowerCase()) ||
              (c.Mobile_Number && deal.contactPhone !== 'N/A' && c.Mobile_Number.replace(/[^0-9]/g, '').includes(deal.contactPhone.replace(/[^0-9]/g, '')))
            );
            if (matched && matched.Email_Id) {
              setDeal(prev => prev ? { ...prev, contactEmail: matched.Email_Id } : null);
              return null; // Stop chain
            }
          }
          // If not found, try leads
          return fetchUserQualifiedLeadListWithoutPagination();
        })
        .then((leads) => {
          if (Array.isArray(leads)) {
            const matched = leads.find(l =>
              (`${l.LeadFirstName || ''} ${l.LeadLastName || ''}`.trim().toLowerCase() === deal.contactName.toLowerCase()) ||
              (l.PhoneNo && deal.contactPhone !== 'N/A' && l.PhoneNo.replace(/[^0-9]/g, '').includes(deal.contactPhone.replace(/[^0-9]/g, '')))
            );
            if (matched && matched.EmailId) {
              setDeal(prev => prev ? { ...prev, contactEmail: matched.EmailId } : null);
            }
          }
        })
        .catch(err => console.warn("Failed to dynamically resolve contact email:", err));
    }
  }, [deal?.contactName, deal?.contactPhone, deal?.contactEmail]);

  // Load deal notes from backend
  const loadNotes = (dealIdToUse?: string) => {
    const targetId = dealIdToUse || deal?.id || id;
    if (!targetId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    setIsLoadingNotes(true);
    fetchDealNotes(targetId, token)
      .then((notes) => {
        setNotesList(notes);
        setIsLoadingNotes(false);
      })
      .catch((err) => {
        console.error('Failed to fetch deal notes:', err);
        setIsLoadingNotes(false);
        toast.error('Failed to load deal notes from server.');
      });
  };

  // Load deal tasks from backend
  const loadTasks = (dealIdToUse?: string) => {
    const targetId = dealIdToUse || deal?.id || id;
    if (!targetId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    setIsLoadingTasks(true);
    fetchDealTasks(targetId, token)
      .then((tasks) => {
        setTasksList(tasks);
        setIsLoadingTasks(false);
      })
      .catch((err) => {
        console.error('Failed to fetch deal tasks:', err);
        setIsLoadingTasks(false);
        toast.error('Failed to load deal tasks from server.');
      });
  };

  // Load deal activities from backend
  const loadActivities = (dealIdToUse?: string) => {
    const targetId = dealIdToUse || deal?.id || id;
    if (!targetId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    setIsLoadingActivities(true);
    fetchDealActivities(targetId, token)
      .then((acts) => {
        setActivitiesList(acts);
        setIsLoadingActivities(false);
      })
      .catch((err) => {
        console.error('Failed to fetch deal activities:', err);
        setIsLoadingActivities(false);
        toast.error('Failed to load deal activities from server.');
      });
  };

  useEffect(() => {
    if (deal?.id) {
      loadNotes(deal.id);
      loadTasks(deal.id);
      loadActivities(deal.id);
    } else {
      loadNotes(id);
      loadTasks(id);
      loadActivities(id);
    }
  }, [id, deal?.id]);

  // Initialize edit fields with loaded deal data
  useEffect(() => {
    if (deal) {
      setEditName(deal.name);
      setEditCompany(deal.company);
      setEditValue(deal.dealValue);
      setEditProbability(deal.probability);
      setEditExpectedClose(deal.expectedClose);
      setEditSummary(deal.summary);
    }
  }, [deal]);

  if (!deal) {
    if (isLoading) {
      return (
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
            >
              {/* Header controls skeleton */}
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                  <div className="h-9 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                  <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                </div>
              </div>

              {/* Deal Title and badges skeleton */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                </div>
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>

              {/* Stepper Card skeleton */}
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex-1 flex items-center gap-2 w-full">
                      <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                      {i < 5 && <div className="hidden md:block flex-1 h-[2px] bg-slate-200 dark:bg-slate-800 animate-pulse" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats row skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="space-y-1 flex-1">
                      <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Tab header skeleton */}
              <div className="border-b dark:border-slate-900 flex items-center gap-6 py-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-5 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                ))}
              </div>

              {/* Main content split loader */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                  </div>
                  <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-3">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="flex justify-between border-b dark:border-slate-900 py-2">
                          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                          <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500 animate-bounce" />
        <h2 className="text-xl font-bold">Deal Not Found</h2>
        <Button style={{ backgroundColor: primaryColor }} className="text-white" onClick={() => router.push('/Deal')}>
          Back to Deals List
        </Button>
      </div>
    );
  }

  const stagesList = ['Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] as const;

  const staticActivities = deal?.activities || [];
  const documentsList = deal?.documentsList || [];

  // Update deal stage
  const handleStageChange = (newStage: typeof stagesList[number]) => {
    if (!deal) return;
    let prob = deal.probability;
    if (newStage === 'Qualification') prob = 20;
    else if (newStage === 'Proposal') prob = 60;
    else if (newStage === 'Negotiation') prob = 85;
    else if (newStage === 'Closed Won') prob = 100;
    else if (newStage === 'Closed Lost') prob = 0;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const type = newStage === 'Closed Won' ? 'Won' : newStage === 'Closed Lost' ? 'Lost' : 'Open';

    updateDealApi(deal.id, { Deal_Stage: newStage, Deal_Type: type, Deal_Probablity: `${prob} %` }, token)
      .then(() => {
        // Invalidate Zustand cache
        useDealStore.getState().clearCache();

        const now = new Date();
        const event = {
          id: `EV-${Date.now()}`,
          type: `Stage changed to ${newStage}`,
          details: `Deal status updated to ${newStage}. Probability adjusted to ${prob}%.`,
          date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          user: 'Sadia Afrin',
          color: newStage === 'Closed Won' ? 'bg-emerald-500' : newStage === 'Closed Lost' ? 'bg-rose-500' : 'bg-blue-600',
          category: 'stage' as const
        };

        updateDeal(deal.id, {
          stage: newStage,
          probability: prob,
          lastUpdated: now.toISOString().split('T')[0],
          activities: [event, ...staticActivities]
        });
        toast.success(`Stage updated to ${newStage}`);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to update stage on server.');
      });
  };

  // Submit edit form
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    updateDealApi(deal.id, {
      Deal_Name: editName,
      Account_Name: editCompany,
      Lead_Name: editCompany,
      Amount: editValue,
      Deal_Probablity: `${editProbability} %`,
      ExpClosing_Date: editExpectedClose ? `${editExpectedClose}T00:00:00Z` : undefined,
      Deal_Note: editSummary,
      Updated_Date: new Date().toISOString().split('T')[0]
    }, token)
      .then(() => {
        // Invalidate Zustand cache
        useDealStore.getState().clearCache();

        updateDeal(deal.id, {
          name: editName,
          company: editCompany,
          dealValue: editValue,
          probability: editProbability,
          expectedClose: editExpectedClose,
          summary: editSummary
        });
        setIsEditOpen(false);
        toast.success('Deal details updated!');
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to update deal details on server.');
      });
  };

  // Add Task API
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    if (!taskFormName.trim()) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 71;
    const dealIdNum = parseInt(deal.id, 10);

    const payload: Partial<ApiDealTask> = {
      Organization_Id: 1,
      Deal_Id: isNaN(dealIdNum) ? 0 : dealIdNum,
      TaskName: taskFormName,
      Task_Desc: taskFormDesc || taskFormName,
      Start_Date: taskFormStartDate ? `${taskFormStartDate}T00:00:00+05:30` : new Date().toISOString().split('T')[0] + 'T00:00:00+05:30',
      Due_Date: taskFormDueDate ? `${taskFormDueDate}T00:00:00+05:30` : new Date().toISOString().split('T')[0] + 'T00:00:00+05:30',
      Priority: taskFormPriority,
      Status: taskFormStatus,
      Completion: taskFormCompletion,
      Assigned_person: taskFormAssignedPerson || null,
      Is_Deleted: false,
      Created_By: userId,
      Updated_By: userId,
      UserReminder: null
    };

    createDealTask(payload, token)
      .then(() => {
        toast.success('Task logged successfully!');
        setTaskFormName('');
        setTaskFormDesc('');
        setTaskFormStartDate('');
        setTaskFormDueDate('');
        setTaskFormPriority('Normal');
        setTaskFormStatus('Pending');
        setTaskFormCompletion('0%');
        setTaskFormAssignedPerson('');
        setIsAddTaskOpen(false);
        loadTasks();
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to create task.');
      });
  };

  // Start edit task mode
  const handleStartEditTask = (task: ApiDealTask) => {
    setEditingTaskId(task.id);
    setTaskFormName(task.TaskName || '');
    setTaskFormDesc(task.Task_Desc || '');
    setTaskFormStartDate(task.Start_Date ? task.Start_Date.split('T')[0] : '');
    setTaskFormDueDate(task.Due_Date ? task.Due_Date.split('T')[0] : '');
    setTaskFormPriority(task.Priority || 'Normal');
    setTaskFormStatus(task.Status || 'Pending');
    setTaskFormCompletion(task.Completion || '0%');
    setTaskFormAssignedPerson(task.Assigned_person || '');
  };

  // Cancel edit task mode
  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setTaskFormName('');
    setTaskFormDesc('');
    setTaskFormStartDate('');
    setTaskFormDueDate('');
    setTaskFormPriority('Normal');
    setTaskFormStatus('Pending');
    setTaskFormCompletion('0%');
    setTaskFormAssignedPerson('');
  };

  // Update Task API
  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId) return;
    const taskToUpdate = tasksList.find(t => t.id === editingTaskId);
    if (!taskToUpdate) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 71;

    const updatedPayload: ApiDealTask = {
      ...taskToUpdate,
      TaskName: taskFormName,
      Task_Desc: taskFormDesc || taskFormName,
      Start_Date: taskFormStartDate ? `${taskFormStartDate}T00:00:00+05:30` : taskToUpdate.Start_Date,
      Due_Date: taskFormDueDate ? `${taskFormDueDate}T00:00:00+05:30` : taskToUpdate.Due_Date,
      Priority: taskFormPriority,
      Status: taskFormStatus,
      Completion: taskFormCompletion,
      Assigned_person: taskFormAssignedPerson || null,
      Organization_Id: getPkValue(taskToUpdate.Organization_Id, 1),
      Created_By: getPkValue(taskToUpdate.Created_By, userId),
      Updated_By: userId,
      Deal_Id: getPkValue(taskToUpdate.Deal_Id, parseInt(id, 10)),
      UserReminder: getPkValue(taskToUpdate.UserReminder, null)
    };

    updateDealTask(updatedPayload, token)
      .then(() => {
        toast.success('Task updated successfully!');
        handleCancelEditTask();
        loadTasks();
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to update task.');
      });
  };

  // Toggle completion status
  const handleToggleTaskCompletion = (task: ApiDealTask, checked: boolean) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 71;

    const updatedPayload: ApiDealTask = {
      ...task,
      Status: checked ? 'Completed' : 'Pending',
      Completion: checked ? '100%' : '0%',
      Organization_Id: getPkValue(task.Organization_Id, 1),
      Created_By: getPkValue(task.Created_By, userId),
      Updated_By: userId,
      Deal_Id: getPkValue(task.Deal_Id, parseInt(id, 10)),
      UserReminder: getPkValue(task.UserReminder, null)
    };

    updateDealTask(updatedPayload, token)
      .then(() => {
        toast.success(`Task marked as ${checked ? 'completed' : 'incomplete'}`);
        loadTasks();
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to update task completion status.');
      });
  };

  // Delete Task API
  const handleDeleteTask = (taskId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    deleteDealTask(taskId, token)
      .then(() => {
        toast.success('Task deleted successfully!');
        loadTasks();
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to delete task.');
      });
  };

  // Add Activity API
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    if (!activityFormTask.trim()) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 71;
    const dealIdNum = parseInt(deal.id, 10);

    const payload: Partial<ApiDealActivity> = {
      Organization_Id: 1,
      Deal_Id: isNaN(dealIdNum) ? 0 : dealIdNum,
      Task: activityFormTask,
      Task_Description: activityFormDesc || activityFormTask,
      Expected_Date: activityFormExpectedDate || new Date().toISOString().split('T')[0],
      Expected_Time: activityFormExpectedTime ? `${activityFormExpectedTime}:00` : new Date().toTimeString().split(' ')[0],
      Activity_Type: activityFormType,
      Active_Flag: activityFormActive,
      Is_Deleted: false,
      Created_By: userId,
      Updated_By: userId,
      Reminder_Payload: null
    };

    if (activityFormHasReminder && activityFormReminderDate) {
      const reminderTime = activityFormReminderTime || '09:00';
      payload.Reminder_Payload = {
        RemainderDueDate: `${activityFormReminderDate} ${reminderTime}:00`,
        DueDate: activityFormReminderDate,
        Repeat_EveryDay: activityFormReminderRepeat,
        ReminderFor: activityFormReminderFor || 'Deal Follow-up',
        RemainderMessage: activityFormReminderMessage || activityFormTask,
        Status: 'Pending'
      };
    }

    createDealActivity(payload, token)
      .then(() => {
        toast.success('Activity logged successfully!');
        setActivityFormTask('');
        setActivityFormDesc('');
        setActivityFormExpectedDate('');
        setActivityFormExpectedTime('');
        setActivityFormType('Call');
        setActivityFormActive(true);
        setActivityFormHasReminder(false);
        setActivityFormReminderDate('');
        setActivityFormReminderTime('');
        setActivityFormReminderMessage('');
        setActivityFormReminderFor('Deal Follow-up');
        setActivityFormReminderRepeat('No');
        setIsAddActivityOpen(false);
        loadActivities();
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to create activity.');
      });
  };

  // Start edit activity mode
  const handleStartEditActivity = (act: ApiDealActivity) => {
    setEditingActivityId(act.id);
    setActivityFormTask(act.Task || '');
    setActivityFormDesc(act.Task_Description || '');
    setActivityFormExpectedDate(act.Expected_Date || '');
    setActivityFormExpectedTime(act.Expected_Time ? act.Expected_Time.substring(0, 5) : '');
    setActivityFormType(act.Activity_Type || 'Call');
    setActivityFormActive(act.Active_Flag !== undefined ? act.Active_Flag : true);
  };

  // Cancel edit activity mode
  const handleCancelEditActivity = () => {
    setEditingActivityId(null);
    setActivityFormTask('');
    setActivityFormDesc('');
    setActivityFormExpectedDate('');
    setActivityFormExpectedTime('');
    setActivityFormType('Call');
    setActivityFormActive(true);
  };

  // Update Activity API
  const handleUpdateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivityId) return;
    const actToUpdate = activitiesList.find(a => a.id === editingActivityId);
    if (!actToUpdate) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 71;

    let reminderVal = actToUpdate.Reminder_Id;
    if (reminderVal) {
      const expDate = activityFormExpectedDate || actToUpdate.Expected_Date;
      const expTime = activityFormExpectedTime ? (activityFormExpectedTime.length === 5 ? `${activityFormExpectedTime}:00` : activityFormExpectedTime) : actToUpdate.Expected_Time;
      const parsedTime = expTime ? expTime.substring(0, 5) : '09:00';

      if (typeof reminderVal === 'object') {
        reminderVal = {
          ...reminderVal,
          RemainderDueDate: `${expDate} ${parsedTime}:00`,
          DueDate: expDate,
          RemainderMessage: activityFormTask
        };
      } else {
        reminderVal = {
          id: reminderVal,
          RemainderDueDate: `${expDate} ${parsedTime}:00`,
          DueDate: expDate,
          Repeat_EveryDay: 'No',
          ReminderFor: 'Client Meeting',
          RemainderMessage: activityFormTask,
          Status: 'Pending'
        };
      }
    } else {
      reminderVal = null;
    }

    const updatedPayload: ApiDealActivity = {
      ...actToUpdate,
      Task: activityFormTask,
      Task_Description: activityFormDesc || activityFormTask,
      Expected_Date: activityFormExpectedDate || actToUpdate.Expected_Date,
      Expected_Time: activityFormExpectedTime ? (activityFormExpectedTime.length === 5 ? `${activityFormExpectedTime}:00` : activityFormExpectedTime) : actToUpdate.Expected_Time,
      Activity_Type: activityFormType,
      Active_Flag: activityFormActive,
      Organization_Id: getPkValue(actToUpdate.Organization_Id, 1),
      Created_By: getPkValue(actToUpdate.Created_By, userId),
      Updated_By: userId,
      Deal_Id: getPkValue(actToUpdate.Deal_Id, parseInt(id, 10)),
      Reminder_Id: reminderVal
    };

    updateDealActivity(updatedPayload, token)
      .then(() => {
        toast.success('Activity updated successfully!');
        handleCancelEditActivity();
        loadActivities();
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to update activity.');
      });
  };

  // Delete Activity API
  const handleDeleteActivity = (activityId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    deleteDealActivity(activityId, token)
      .then(() => {
        toast.success('Activity deleted successfully!');
        loadActivities();
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to delete activity.');
      });
  };

  // Add notes logs via API
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal) return;
    if (!newNote.trim()) return;

    const finalSubject = newNoteSubject.trim() || 'General Note';

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const dealIdNum = parseInt(deal.id, 10);
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 1;

    createDealNote({
      Organization_Id: 1,
      Deal_Id: isNaN(dealIdNum) ? 0 : dealIdNum,
      Subject: finalSubject,
      Notes: newNote,
      Active_Flag: true,
      Created_By: userId,
      Updated_By: userId
    }, token)
      .then(() => {
        toast.success('Note added successfully!');
        setNewNote('');
        setNewNoteSubject('');
        setIsAddNoteOpen(false);
        loadNotes();
      })
      .catch((err) => {
        console.error('Failed to create note:', err);
        toast.error('Failed to create note on server.');
      });
  };

  // Set note values for editing
  const handleStartEditNote = (note: ApiDealNote) => {
    setEditingNoteId(note.id);
    setEditNoteSubject(note.Subject || '');
    setEditNoteText(note.Notes || '');
  };

  // Cancel editing note
  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditNoteSubject('');
    setEditNoteText('');
  };

  // Submit note update via API
  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteId) return;
    const noteToUpdate = notesList.find(n => n.id === editingNoteId);
    if (!noteToUpdate) return;

    const finalSubject = editNoteSubject.trim() || 'General Note';

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 1;

    const updatedPayload = {
      id: noteToUpdate.id,
      DealNotes_Id: noteToUpdate.DealNotes_Id,
      Subject: finalSubject,
      Notes: editNoteText,
      Active_Flag: noteToUpdate.Active_Flag !== undefined ? noteToUpdate.Active_Flag : true,
      Is_Deleted: noteToUpdate.Is_Deleted || false,
      Organization_Id: noteToUpdate.Organization_Id || 1,
      Deal_Id: noteToUpdate.Deal_Id,
      Created_By: noteToUpdate.Created_By || userId,
      Updated_By: userId,
      Created_Date: noteToUpdate.Created_Date,
      Updated_Date: new Date().toISOString()
    };

    updateDealNote(updatedPayload, token)
      .then(() => {
        toast.success('Note updated successfully!');
        handleCancelEditNote();
        loadNotes();
      })
      .catch((err) => {
        console.error('Failed to update note:', err);
        toast.error('Failed to update note on server.');
      });
  };

  // Delete note via API
  const handleDeleteNote = (noteId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    deleteDealNote(noteId, token)
      .then(() => {
        toast.success('Note deleted!');
        loadNotes();
      })
      .catch((err) => {
        console.error('Failed to delete note:', err);
        toast.error('Failed to delete note on server.');
      });
  };

  // Simulate file upload
  const handleFileUpload = () => {
    if (!deal) return;
    const fileNames = ['Contract_Draft_Signed.pdf', 'Technical_Architecture_Spec.docx', 'Budget_Plan_Excel.xlsx'];
    const randomName = fileNames[Math.floor(Math.random() * fileNames.length)];
    const extension = randomName.split('.').pop() as any;

    const newDoc = {
      id: `F-${Date.now()}`,
      name: randomName,
      size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      type: extension
    };

    const now = new Date();
    const event = {
      id: `EV-${Date.now()}`,
      type: 'File uploaded',
      details: `Uploaded file: ${randomName}`,
      date: now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      user: 'Sadia Afrin',
      color: 'bg-sky-500',
      category: 'email' as const
    };

    updateDeal(deal.id, {
      documentsList: [newDoc, ...documentsList],
      activities: [event, ...staticActivities]
    });
    toast.success(`Uploaded ${randomName}`);
  };

  const getStageColor = (stageName: string) => {
    switch (stageName) {
      case 'Qualification': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40';
      case 'Proposal': return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/40';
      case 'Negotiation': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40';
      case 'Closed Won': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40';
      case 'Closed Lost': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  const getStageIndex = (stageName: typeof stagesList[number]) => {
    return stagesList.indexOf(stageName);
  };

  const handleDelete = () => {
    if (!deal) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    deleteDealApi(deal.id, token)
      .then(() => {
        // Invalidate Zustand cache
        useDealStore.getState().clearCache();

        deleteDeal(deal.id);
        toast.success(`Deal deleted successfully!`);
        router.push('/Deal');
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to delete deal on server.');
      });
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
        >
          {/* Header controls with Back to list */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1.5">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                onClick={() => router.push('/Deal')}
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </Button>
              <div>
                <div className="text-xs text-slate-400 font-semibold space-x-1 flex items-center">
                  <span onClick={() => router.push('/Deal')} className="hover:text-slate-650 cursor-pointer">Deals</span>
                  <span>&gt;</span>
                  <span className="text-slate-600 dark:text-slate-355">Deal Overview</span>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight">Deal Overview</h1>
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-2">
              {/* Edit Button */}
              <Button
                variant="outline"
                className="h-9 px-4 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs rounded-xl gap-2 text-slate-750 dark:text-slate-350 bg-white dark:bg-slate-950"
                onClick={() => router.push(`/Deal/${deal.id}/edit`)}
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>

              {/* Mark as Won Button */}
              <div className="flex items-center shadow-xs rounded-xl overflow-hidden border border-blue-600 dark:border-blue-500">
                <Button
                  style={{ backgroundColor: primaryColor }}
                  className="h-9 px-4 text-xs font-bold text-white rounded-r-none hover:opacity-90 border-r border-blue-700/50"
                  onClick={() => handleStageChange('Closed Won')}
                >
                  {deal.stage === 'Closed Won' ? (
                    <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Won!</span>
                  ) : 'Mark as Won'}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button
                      style={{ backgroundColor: primaryColor }}
                      size="icon"
                      className="h-9 w-8 text-white rounded-l-none hover:opacity-90 flex items-center justify-center"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border dark:border-slate-800">
                    <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold text-emerald-605 dark:text-emerald-450" onClick={() => handleStageChange('Closed Won')}>
                      <Trophy className="h-4 w-4" /> Mark Won
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold text-rose-605 dark:text-rose-450" onClick={() => handleStageChange('Closed Lost')}>
                      <AlertCircle className="h-4 w-4" /> Mark Lost
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => handleStageChange('Negotiation')}>
                      Move to Negotiation
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-semibold" onClick={() => handleStageChange('Proposal')}>
                      Move to Proposal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* More actions */}
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800">
                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-800 text-xs">
                  <DropdownMenuItem onClick={() => toast.info('Deal archived.')} className="cursor-pointer">
                    Archive Deal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-rose-500">
                    Delete Deal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Main Deal Title Row */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {deal.name}
              </h2>
              <Badge variant="outline" className={`rounded-md font-bold text-[10px] py-0.5 px-2.5 uppercase tracking-wide border ${getStageColor(deal.stage)}`}>
                {deal.stage}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-450 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {deal.company}
              </span>
              <span className="text-slate-300 dark:text-slate-800">&bull;</span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {deal.contactName}
              </span>
              <span className="text-slate-300 dark:text-slate-800">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <a href={`mailto:${deal.contactEmail}`} className="hover:text-blue-500 transition-colors">{deal.contactEmail}</a>
              </span>
              <span className="text-slate-300 dark:text-slate-800">&bull;</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                Created on {new Date(deal.createdOn).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Detail Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Stepper Card */}
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs">
                <div className="flex flex-col md:flex-row items-stretch justify-between gap-1 w-full pt-1.5">
                  {stagesList.map((step, idx) => {
                    const currentIdx = getStageIndex(deal.stage);
                    const stepIdx = getStageIndex(step);

                    const isCurrent = deal.stage === step;
                    const isPast = stepIdx < currentIdx && deal.stage !== 'Closed Lost';
                    const isLost = deal.stage === 'Closed Lost' && step === 'Closed Lost';

                    const hasNext = idx < stagesList.length - 1;

                    return (
                      <div key={idx} className="flex-1 flex flex-col md:flex-row items-center relative group">
                        <button
                          onClick={() => handleStageChange(step)}
                          className="flex flex-col items-center focus:outline-none w-full md:w-auto z-10 cursor-pointer"
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all ${isCurrent ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100 dark:ring-blue-950/40 shadow-sm font-extrabold' :
                            isLost ? 'bg-rose-500 text-white border-rose-500 ring-4 ring-rose-100 dark:ring-rose-950/40 shadow-sm font-extrabold' :
                              isPast ? 'bg-emerald-500 text-white border-emerald-500' :
                                'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-650 border-slate-200 dark:border-slate-800'
                            }`}>
                            {isPast ? (
                              <Check className="h-4.5 w-4.5 stroke-[3]" />
                            ) : isCurrent ? (
                              <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                            ) : (
                              <span className="text-[10px] font-bold">{idx + 1}</span>
                            )}
                          </div>

                          <span className={`text-[10px] font-extrabold mt-2 tracking-wide uppercase ${isCurrent ? 'text-blue-600 dark:text-blue-455 font-black' :
                            isLost ? 'text-rose-500 dark:text-rose-455 font-black' :
                              isPast ? 'text-slate-700 dark:text-slate-350' :
                                'text-slate-400 dark:text-slate-605'
                            }`}>
                            {step}
                          </span>
                          {isCurrent && (
                            <span className="text-[8px] text-blue-500/70 font-semibold uppercase tracking-wider block -mt-0.5">
                              Current Stage
                            </span>
                          )}
                        </button>

                        {hasNext && (
                          <div className="hidden md:block flex-1 h-[2px] bg-slate-100 dark:bg-slate-900 mx-4 -mt-6">
                            <div
                              className={`h-full transition-all duration-300 ${stepIdx < currentIdx && deal.stage !== 'Closed Lost' ? 'bg-emerald-450' : 'bg-transparent'
                                }`}
                              style={{ width: stepIdx < currentIdx ? '100%' : '0%' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats Metrics Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50/80 dark:bg-blue-950/20 text-blue-600 dark:text-blue-405 flex items-center justify-center shrink-0">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5 text-left font-semibold">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deal Value</span>
                    <span className="text-sm md:text-base font-extrabold text-slate-850 dark:text-white font-mono">
                      {deal.currencySymbol} {deal.dealValue.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-655 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5 text-left font-semibold">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expected Close</span>
                    <span className="text-sm md:text-base font-extrabold text-slate-850 dark:text-white font-mono">
                      {new Date(deal.expectedClose).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-50/80 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5 text-left font-semibold">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Probability</span>
                    <span className="text-sm md:text-base font-extrabold text-slate-850 dark:text-white font-mono">
                      {deal.probability}%
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-350 flex items-center justify-center shrink-0 font-bold text-sm">
                    {deal.ownerInitials}
                  </div>
                  <div className="space-y-0.5 text-left font-semibold">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Owner</span>
                    <span className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-white block truncate">
                      {deal.owner}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab Menu Header Bar */}
              <div className="border-b dark:border-slate-900 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
                {['Overview', 'Notes', 'Tasks', 'Activities', 'Appointments', 'Emails', 'Invoices'].map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-3 text-xs md:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${isActive ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-slate-400 dark:text-slate-500'
                        }`}
                    >
                      {tab === 'Notes' ? `Notes (${notesList.length})` : tab === 'Tasks' ? `Tasks (${tasksList.length})` : tab === 'Activities' ? `Activities (${activitiesList.length})` : tab === 'Appointments' ? `Appointments (${dealMeetingsState.length})` : tab}
                    </button>
                  );
                })}
              </div>

              {/* Tab contents */}
              <div className="min-h-[250px] text-left">
                {activeTab === 'Overview' && (
                  <div className="space-y-6">

                    <div className="space-y-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Deal Summary</h3>
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-semibold bg-slate-50/50 dark:bg-slate-950/20 p-4 border dark:border-slate-900 rounded-2xl">
                        {deal.summary}
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="px-5 py-3 border-b dark:border-slate-900">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Deal Attributes</h3>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs font-semibold">
                        <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Deal Name</span>
                          <span className="text-slate-800 dark:text-white font-bold">{deal.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Stage</span>
                          <Badge variant="outline" className={`rounded font-bold text-[9px] py-0 px-2 uppercase ${getStageColor(deal.stage)}`}>
                            {deal.stage}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Company</span>
                          <span className="text-slate-800 dark:text-white font-bold">{deal.company}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Probability</span>
                          <span className="text-slate-800 dark:text-white font-mono">{deal.probability}%</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Contact</span>
                          <span className="text-slate-800 dark:text-white font-bold">{deal.contactName}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Expected Close</span>
                          <span className="text-slate-800 dark:text-white font-mono">{deal.expectedClose}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Email</span>
                          <a href={`mailto:${deal.contactEmail}`} className="text-blue-600 dark:text-blue-400 hover:underline">{deal.contactEmail}</a>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Source</span>
                          <span className="text-slate-800 dark:text-white font-bold">{deal.source}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b md:border-b-0 dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Phone</span>
                          <span className="text-slate-800 dark:text-white font-mono">{deal.contactPhone}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b md:border-b-0 dark:border-slate-900">
                          <span className="text-slate-405 font-medium">Owner</span>
                          <span className="text-slate-800 dark:text-white font-bold">{deal.owner}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 md:border-b-0">
                          <span className="text-slate-405 font-medium">Deal Value</span>
                          <span className="text-slate-800 dark:text-white font-mono font-bold">{deal.currencySymbol} {deal.dealValue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 md:border-b-0">
                          <span className="text-slate-405 font-medium">Created On</span>
                          <span className="text-slate-800 dark:text-white font-mono">{deal.createdOn}</span>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible notes card */}
                    <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl shadow-2xs overflow-hidden">
                      <button
                        onClick={() => setIsNotesCollapsed(!isNotesCollapsed)}
                        className="w-full px-5 py-4 flex items-center justify-between border-b dark:border-slate-900 focus:outline-none cursor-pointer"
                      >
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-455 dark:text-slate-300">Internal Notes</span>
                        {isNotesCollapsed ? <ChevronDown className="h-4 w-4 text-slate-405" /> : <ChevronUp className="h-4 w-4 text-slate-405" />}
                      </button>

                    </div>

                  </div>
                )}

                {/* {activeTab === 'Products/Services' && (
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 text-center text-slate-500 font-semibold space-y-4">
                    <Briefcase className="h-8 w-8 text-slate-305 mx-auto" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Products & Services</h3>
                      <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">Associated list of solutions, licenses, or packages with this specific deal opportunity.</p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product / Service Name</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-bold">{deal.name} Delivery</TableCell>
                          <TableCell className="text-right font-mono">{deal.currencySymbol} {(deal.dealValue * 0.85).toLocaleString()}</TableCell>
                          <TableCell className="text-center font-mono">1</TableCell>
                          <TableCell className="text-right font-mono font-bold">{deal.currencySymbol} {(deal.dealValue * 0.85).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-bold">Standard Support & Setup Suite</TableCell>
                          <TableCell className="text-right font-mono">{deal.currencySymbol} {(deal.dealValue * 0.15).toLocaleString()}</TableCell>
                          <TableCell className="text-center font-mono">1</TableCell>
                          <TableCell className="text-right font-mono font-bold">{deal.currencySymbol} {(deal.dealValue * 0.15).toLocaleString()}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )} */}

                {activeTab === 'Notes' && (() => {
                  const allNotes = [...notesList].reverse();

                  const totalNotes = allNotes.length;
                  const totalPages = Math.ceil(totalNotes / NOTES_PAGE_SIZE);
                  const currentPageNormalized = Math.max(1, Math.min(notesCurrentPage, totalPages || 1));
                  const startIndex = (currentPageNormalized - 1) * NOTES_PAGE_SIZE;
                  const paginatedNotes = allNotes.slice(startIndex, startIndex + NOTES_PAGE_SIZE);

                  return (
                    <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 space-y-5 transition-all duration-300">
                      {/* Dashboard Header Panel */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-slate-900 pb-4">
                        <div className="space-y-0.5 text-left">
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            Deal Notes Log
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-455 dark:text-slate-500">
                            Structured records of budget approvals, reviews, client updates, and discussions.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-405 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-100/50 dark:border-blue-900/30">
                            {totalNotes} {totalNotes === 1 ? 'Note' : 'Notes'}
                          </Badge>
                          <Button
                            onClick={() => setIsAddNoteOpen(prev => !prev)}
                            style={{ backgroundColor: isAddNoteOpen ? undefined : primaryColor }}
                            variant={isAddNoteOpen ? "outline" : "default"}
                            className={`h-8 px-3 rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all duration-200 ${isAddNoteOpen
                              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                              : 'text-white hover:opacity-90'
                              }`}
                          >
                            {isAddNoteOpen ? (
                              'Cancel'
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                Add Note
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Add Note Form */}
                      <AnimatePresence>
                        {isAddNoteOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                          >
                            <form onSubmit={handleAddNote} className="relative overflow-hidden p-6 bg-slate-50/40 dark:bg-slate-900/15 border border-slate-200/60 dark:border-slate-850 rounded-2xl space-y-4 text-left shadow-xs mb-2">
                              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600" />

                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                  </div>
                                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Log a New Note</h4>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-455 dark:text-slate-500 hidden sm:inline">Log discussions, updates, and timelines</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5 md:col-span-1">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Note Subject</label>
                                  <Input
                                    placeholder="e.g. Project Scope Review or Client Call"
                                    value={newNoteSubject}
                                    onChange={(e) => setNewNoteSubject(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-950 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Note Details</label>
                                  <textarea
                                    placeholder="Type note details or discussion points here..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="w-full min-h-[90px] p-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    required
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setIsAddNoteOpen(false);
                                    setNewNote('');
                                    setNewNoteSubject('');
                                  }}
                                  className="h-9.5 text-xs font-bold rounded-xl px-4 border-slate-250 dark:border-slate-800 cursor-pointer"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  style={{ backgroundColor: primaryColor }}
                                  className="text-white h-9.5 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                                >
                                  Log Note
                                </Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Notes Table */}
                      {isLoadingNotes ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 w-full bg-slate-50/50 dark:bg-slate-900/40 animate-pulse rounded-xl" />
                          ))}
                        </div>
                      ) : totalNotes === 0 ? (
                        <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3.5 bg-slate-50/10 dark:bg-slate-900/5">
                          <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto border dark:border-slate-800">
                            <MessageSquare className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                          </div>
                          <div className="max-w-md mx-auto space-y-1">
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">No notes logged</h3>
                            <p className="text-xs text-slate-405 dark:text-slate-500 font-semibold leading-relaxed">
                              Log a note below to record discussions with the client.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-900">
                          <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                              <TableRow>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Subject</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Details</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Date</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Logged By</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedNotes.map((note) => {
                                const isEditing = editingNoteId === note.id;
                                const cat = getNoteCategoryDetails(note.Subject || '');
                                const IconComponent = cat.icon;
                                return isEditing ? (
                                  <TableRow key={note.id} className="hover:bg-transparent">
                                    <TableCell colSpan={5} className="p-4 bg-slate-50/30 dark:bg-slate-900/20">
                                      <form onSubmit={handleUpdateNote} className="space-y-4 text-left">
                                        <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
                                          <Edit className="h-4 w-4" />
                                          <span className="text-xs font-bold uppercase tracking-wider">Editing Note ({note.DealNotes_Id || `ID: ${note.id}`})</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          <div className="space-y-1 md:col-span-1">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Subject</label>
                                            <Input
                                              value={editNoteSubject}
                                              onChange={(e) => setEditNoteSubject(e.target.value)}
                                              placeholder="Subject"
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20"
                                              required
                                            />
                                          </div>
                                          <div className="space-y-1 md:col-span-2">
                                            <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Note Details</label>
                                            <textarea
                                              value={editNoteText}
                                              onChange={(e) => setEditNoteText(e.target.value)}
                                              placeholder="Note details..."
                                              className="w-full min-h-[90px] p-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-805 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                              required
                                            />
                                          </div>
                                        </div>

                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancelEditNote}
                                            className="h-9 text-xs font-bold rounded-xl px-4 border-slate-250 dark:border-slate-800"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            type="submit"
                                            style={{ backgroundColor: primaryColor }}
                                            className="text-white h-9 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
                                          >
                                            Save Note
                                          </Button>
                                        </div>
                                      </form>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <TableRow key={note.id} className="border-b dark:border-slate-900 last:border-b-0 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 text-left">
                                    <TableCell className="font-semibold text-slate-850 dark:text-white py-3">
                                      <div className="flex items-center gap-2">
                                        <div className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${cat.colorClass}`}>
                                          <IconComponent className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                          <span className="text-xs font-bold block">{note.Subject || 'Client Note'}</span>
                                          {note.DealNotes_Id && (
                                            <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-1 py-0.2 rounded border dark:border-slate-800 block w-max mt-0.5">
                                              {note.DealNotes_Id}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-medium py-3 max-w-xs truncate md:max-w-md md:whitespace-pre-wrap">
                                      {stripHtml(note.Notes)}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-450 dark:text-slate-400 font-semibold py-3 whitespace-nowrap">
                                      <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        {note.Created_Date ? new Date(note.Created_Date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <span className="text-[10px] font-bold text-slate-505 bg-slate-100/60 dark:bg-slate-900/60 px-2 py-0.5 rounded-full border dark:border-slate-800/40">
                                        {typeof note.Created_By === 'object' && note.Created_By !== null
                                          ? ((note.Created_By as any).first_name || (note.Created_By as any).username || 'User')
                                          : note.Created_By}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right py-3">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          onClick={() => handleStartEditNote(note)}
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          onClick={() => {
                                            setNoteIdToDelete(note.id);
                                            setIsDeleteNoteOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Pagination Footer Controls */}
                      {totalNotes > NOTES_PAGE_SIZE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t dark:border-slate-900 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          <span>
                            Showing <span className="font-bold text-slate-700 dark:text-white">{startIndex + 1}</span> to{' '}
                            <span className="font-bold text-slate-700 dark:text-white">
                              {Math.min(startIndex + NOTES_PAGE_SIZE, totalNotes)}
                            </span>{' '}
                            of <span className="font-bold text-slate-700 dark:text-white">{totalNotes}</span> notes
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPageNormalized === 1}
                              onClick={() => setNotesCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="h-8 text-[11px] font-bold rounded-lg border-slate-205 dark:border-slate-800 px-3 cursor-pointer"
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPageNormalized === totalPages}
                              onClick={() => setNotesCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="h-8 text-[11px] font-bold rounded-lg border-slate-205 dark:border-slate-800 px-3 cursor-pointer"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {activeTab === 'Tasks' && (() => {
                  const allTasks = [...tasksList].reverse();
                  const totalTasks = allTasks.length;
                  const totalPages = Math.ceil(totalTasks / TASKS_PAGE_SIZE);
                  const currentPageNormalized = Math.max(1, Math.min(tasksCurrentPage, totalPages || 1));
                  const startIndex = (currentPageNormalized - 1) * TASKS_PAGE_SIZE;
                  const paginatedTasks = allTasks.slice(startIndex, startIndex + TASKS_PAGE_SIZE);

                  const getPriorityBadgeColor = (priority: string) => {
                    const p = (priority || '').toLowerCase();
                    if (p === 'high') {
                      return 'text-rose-600 bg-rose-50 dark:bg-rose-955/30 border-rose-200 dark:border-rose-900/50';
                    }
                    if (p === 'medium') {
                      return 'text-amber-605 bg-amber-50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-900/50';
                    }
                    return 'text-blue-600 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/50';
                  };

                  return (
                    <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 space-y-5 transition-all duration-300">
                      {/* Dashboard Header Panel */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-slate-900 pb-4">
                        <div className="space-y-0.5 text-left">
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                            Deal Tasks Log
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-455 dark:text-slate-500">
                            Manage and track deal tasks, priorities, follow-ups, and completion status.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-405 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-100/50 dark:border-blue-900/30">
                            {totalTasks} {totalTasks === 1 ? 'Task' : 'Tasks'}
                          </Badge>
                          <Button
                            onClick={() => setIsAddTaskOpen(prev => !prev)}
                            style={{ backgroundColor: isAddTaskOpen ? undefined : primaryColor }}
                            variant={isAddTaskOpen ? "outline" : "default"}
                            className={`h-8 px-3 rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all duration-200 ${isAddTaskOpen
                              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                              : 'text-white hover:opacity-90'
                              }`}
                          >
                            {isAddTaskOpen ? 'Cancel' : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                Add Task
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Add Task Form */}
                      <AnimatePresence>
                        {isAddTaskOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                          >
                            <form onSubmit={handleAddTask} className="relative overflow-hidden p-6 bg-slate-50/40 dark:bg-slate-900/15 border border-slate-200/60 dark:border-slate-850 rounded-2xl space-y-4 text-left shadow-xs mb-2">
                              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600" />

                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                  </div>
                                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Create a New Task</h4>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-455 dark:text-slate-500 hidden sm:inline">Add actions, priorities, and assigned personnel</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Task Name *</label>
                                  <Input
                                    placeholder="e.g. Schedule Product Demo"
                                    value={taskFormName}
                                    onChange={(e) => setTaskFormName(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Task Description</label>
                                  <Input
                                    placeholder="e.g. Review requirements with technical architect"
                                    value={taskFormDesc}
                                    onChange={(e) => setTaskFormDesc(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Start Date</label>
                                  <Input
                                    type="date"
                                    value={taskFormStartDate}
                                    onChange={(e) => setTaskFormStartDate(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Due Date</label>
                                  <Input
                                    type="date"
                                    value={taskFormDueDate}
                                    onChange={(e) => setTaskFormDueDate(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-3 md:col-span-2">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Priority</label>
                                    <select
                                      value={taskFormPriority}
                                      onChange={(e) => setTaskFormPriority(e.target.value)}
                                      className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                      <option value="High">High</option>
                                      <option value="Medium">Medium</option>
                                      <option value="Normal">Normal</option>
                                      <option value="Low">Low</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Status</label>
                                    <select
                                      value={taskFormStatus}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTaskFormStatus(val);
                                        if (val === 'Completed') setTaskFormCompletion('100%');
                                        else if (val === 'Pending') setTaskFormCompletion('0%');
                                      }}
                                      className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Completion</label>
                                    <select
                                      value={taskFormCompletion}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTaskFormCompletion(val);
                                        if (val === '100%') setTaskFormStatus('Completed');
                                        else if (val === '0%') setTaskFormStatus('Pending');
                                        else setTaskFormStatus('In Progress');
                                      }}
                                      className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                      <option value="0%">0%</option>
                                      <option value="25%">25%</option>
                                      <option value="50%">50%</option>
                                      <option value="75%">75%</option>
                                      <option value="100%">100%</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Assigned Person</label>
                                  <Input
                                    placeholder="e.g. Sadia Afrin"
                                    value={taskFormAssignedPerson}
                                    onChange={(e) => setTaskFormAssignedPerson(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setIsAddTaskOpen(false);
                                    setTaskFormName('');
                                    setTaskFormDesc('');
                                    setTaskFormStartDate('');
                                    setTaskFormDueDate('');
                                    setTaskFormPriority('Normal');
                                    setTaskFormStatus('Pending');
                                    setTaskFormCompletion('0%');
                                    setTaskFormAssignedPerson('');
                                  }}
                                  className="h-9.5 text-xs font-bold rounded-xl px-4 border-slate-250 dark:border-slate-800 cursor-pointer"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  style={{ backgroundColor: primaryColor }}
                                  className="text-white h-9.5 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                                >
                                  Log Task
                                </Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Tasks Table */}
                      {isLoadingTasks ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 w-full bg-slate-50/50 dark:bg-slate-900/40 animate-pulse rounded-xl" />
                          ))}
                        </div>
                      ) : totalTasks === 0 ? (
                        <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3.5 bg-slate-50/10 dark:bg-slate-900/5">
                          <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto border dark:border-slate-800">
                            <CheckCircle2 className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                          </div>
                          <div className="max-w-md mx-auto space-y-1">
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">No tasks logged</h3>
                            <p className="text-xs text-slate-405 dark:text-slate-500 font-semibold leading-relaxed">
                              Add a task above to schedule and track deal actions.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-900">
                          <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                              <TableRow>
                                <TableHead className="w-[50px] text-center py-3"></TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Task Details</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Dates</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Priority / Status</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Assigned Person</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedTasks.map((tsk) => {
                                const isEditing = editingTaskId === tsk.id;
                                const isCompleted = tsk.Status === 'Completed';

                                return isEditing ? (
                                  <TableRow key={tsk.id} className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="p-4 bg-slate-50/30 dark:bg-slate-900/20">
                                      <form onSubmit={handleUpdateTask} className="space-y-4 text-left">
                                        <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
                                          <Edit className="h-4 w-4" />
                                          <span className="text-xs font-bold uppercase tracking-wider">Editing Task ({tsk.Task_Id || `ID: ${tsk.id}`})</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Task Name</label>
                                            <Input
                                              value={taskFormName}
                                              onChange={(e) => setTaskFormName(e.target.value)}
                                              placeholder="Task Name"
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2"
                                              required
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Description</label>
                                            <Input
                                              value={taskFormDesc}
                                              onChange={(e) => setTaskFormDesc(e.target.value)}
                                              placeholder="Description"
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Start Date</label>
                                            <Input
                                              type="date"
                                              value={taskFormStartDate}
                                              onChange={(e) => setTaskFormStartDate(e.target.value)}
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Due Date</label>
                                            <Input
                                              type="date"
                                              value={taskFormDueDate}
                                              onChange={(e) => setTaskFormDueDate(e.target.value)}
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2"
                                            />
                                          </div>
                                          <div className="grid grid-cols-3 gap-3 md:col-span-2">
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-bold text-slate-405 tracking-wider block uppercase">Priority</label>
                                              <select
                                                value={taskFormPriority}
                                                onChange={(e) => setTaskFormPriority(e.target.value)}
                                                className="w-full h-9.5 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2"
                                              >
                                                <option value="High">High</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Normal">Normal</option>
                                                <option value="Low">Low</option>
                                              </select>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-bold text-slate-405 tracking-wider block uppercase">Status</label>
                                              <select
                                                value={taskFormStatus}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setTaskFormStatus(val);
                                                  if (val === 'Completed') setTaskFormCompletion('100%');
                                                  else if (val === 'Pending') setTaskFormCompletion('0%');
                                                }}
                                                className="w-full h-9.5 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2"
                                              >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Completed">Completed</option>
                                              </select>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-bold text-slate-405 tracking-wider block uppercase">Completion</label>
                                              <select
                                                value={taskFormCompletion}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setTaskFormCompletion(val);
                                                  if (val === '100%') setTaskFormStatus('Completed');
                                                  else if (val === '0%') setTaskFormStatus('Pending');
                                                  else setTaskFormStatus('In Progress');
                                                }}
                                                className="w-full h-9.5 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2"
                                              >
                                                <option value="0%">0%</option>
                                                <option value="25%">25%</option>
                                                <option value="50%">50%</option>
                                                <option value="75%">75%</option>
                                                <option value="100%">100%</option>
                                              </select>
                                            </div>
                                          </div>
                                          <div className="space-y-1 md:col-span-2">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Assigned Person</label>
                                            <Input
                                              value={taskFormAssignedPerson}
                                              onChange={(e) => setTaskFormAssignedPerson(e.target.value)}
                                              placeholder="Assigned Person"
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancelEditTask}
                                            className="h-9 text-xs font-bold rounded-xl px-4 border-slate-250 dark:border-slate-800"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            type="submit"
                                            style={{ backgroundColor: primaryColor }}
                                            className="text-white h-9 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
                                          >
                                            Save Task
                                          </Button>
                                        </div>
                                      </form>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <TableRow key={tsk.id} className="border-b dark:border-slate-900 last:border-b-0 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 text-left">
                                    <TableCell className="text-center py-3">
                                      <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={(checked) => handleToggleTaskCompletion(tsk, !!checked)}
                                        className="mt-0.5 border-slate-300 rounded cursor-pointer"
                                      />
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div>
                                        <span className={`text-xs font-bold block ${isCompleted ? 'line-through text-slate-400 dark:text-slate-550' : 'text-slate-850 dark:text-white'}`}>
                                          {tsk.TaskName}
                                        </span>
                                        {tsk.Task_Desc && (
                                          <span className="text-[10px] text-slate-450 dark:text-slate-550 font-semibold block mt-0.5 max-w-xs truncate">
                                            {tsk.Task_Desc}
                                          </span>
                                        )}
                                        {tsk.Task_Id && (
                                          <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-1 py-0.2 rounded border dark:border-slate-800 block w-max mt-1">
                                            {tsk.Task_Id}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-semibold py-3 whitespace-nowrap">
                                      <div className="space-y-1">
                                        <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                          <Calendar className="h-3 w-3" />
                                          Start: {tsk.Start_Date ? new Date(tsk.Start_Date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-bold">
                                          <Clock className="h-3.5 w-3.5 text-slate-405" />
                                          Due: {tsk.Due_Date ? new Date(tsk.Due_Date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3 whitespace-nowrap">
                                      <div className="flex flex-col gap-1.5">
                                        <Badge variant="outline" className={`rounded font-bold text-[9px] py-0 px-2 uppercase border w-max ${getPriorityBadgeColor(tsk.Priority)}`}>
                                          {tsk.Priority || 'Normal'}
                                        </Badge>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] font-semibold text-slate-400">Progress:</span>
                                          <span className="text-[10px] font-bold text-slate-705 dark:text-slate-350">{tsk.Completion || '0%'}</span>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {tsk.Assigned_person ? (
                                        <span className="text-[10px] font-bold text-slate-505 bg-slate-100/60 dark:bg-slate-900/60 px-2 py-0.5 rounded-full border dark:border-slate-800/40">
                                          {typeof tsk.Assigned_person === 'object' && tsk.Assigned_person !== null
                                            ? ((tsk.Assigned_person as any).first_name || (tsk.Assigned_person as any).username || 'User')
                                            : tsk.Assigned_person}
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-semibold text-slate-400 italic">Unassigned</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right py-3">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          onClick={() => handleStartEditTask(tsk)}
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          onClick={() => {
                                            setTaskIdToDelete(tsk.id);
                                            setIsDeleteTaskOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Pagination Footer Controls */}
                      {totalTasks > TASKS_PAGE_SIZE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t dark:border-slate-900 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          <span>
                            Showing <span className="font-bold text-slate-700 dark:text-white">{startIndex + 1}</span> to{' '}
                            <span className="font-bold text-slate-700 dark:text-white">
                              {Math.min(startIndex + TASKS_PAGE_SIZE, totalTasks)}
                            </span>{' '}
                            of <span className="font-bold text-slate-700 dark:text-white">{totalTasks}</span> tasks
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPageNormalized === 1}
                              onClick={() => setTasksCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="h-8 text-[11px] font-bold rounded-lg border-slate-205 dark:border-slate-800 px-3 cursor-pointer"
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPageNormalized === totalPages}
                              onClick={() => setTasksCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="h-8 text-[11px] font-bold rounded-lg border-slate-205 dark:border-slate-800 px-3 cursor-pointer"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {activeTab === 'Activities' && (() => {
                  const allActivities = [...activitiesList].reverse();
                  const totalActivities = allActivities.length;
                  const totalPages = Math.ceil(totalActivities / ACTIVITIES_PAGE_SIZE);
                  const currentPageNormalized = Math.max(1, Math.min(activitiesCurrentPage, totalPages || 1));
                  const startIndex = (currentPageNormalized - 1) * ACTIVITIES_PAGE_SIZE;
                  const paginatedActivities = allActivities.slice(startIndex, startIndex + ACTIVITIES_PAGE_SIZE);

                  const getActivityBadgeColor = (type: string) => {
                    const t = (type || '').toLowerCase();
                    if (t === 'call') {
                      return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-955/30 border-emerald-200 dark:border-emerald-900/50';
                    }
                    if (t === 'meeting') {
                      return 'text-amber-605 bg-amber-50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-900/50';
                    }
                    return 'text-blue-600 bg-blue-50 dark:bg-blue-955/30 border-blue-200 dark:border-blue-900/50';
                  };

                  return (
                    <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 space-y-5 transition-all duration-300">
                      {/* Dashboard Header Panel */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b dark:border-slate-900 pb-4">
                        <div className="space-y-0.5 text-left">
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                            Deal Activities Log
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-455 dark:text-slate-500">
                            Log and track activities, expected schedules, types, active states, and reminders.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-955/20 text-blue-600 dark:text-blue-405 font-bold text-xs px-2.5 py-0.5 rounded-full border border-blue-100/50 dark:border-blue-900/30">
                            {totalActivities} {totalActivities === 1 ? 'Activity' : 'Activities'}
                          </Badge>
                          <Button
                            onClick={() => setIsAddActivityOpen(prev => !prev)}
                            style={{ backgroundColor: isAddActivityOpen ? undefined : primaryColor }}
                            variant={isAddActivityOpen ? "outline" : "default"}
                            className={`h-8 px-3 rounded-xl text-[10px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all duration-200 ${isAddActivityOpen
                              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                              : 'text-white hover:opacity-90'
                              }`}
                          >
                            {isAddActivityOpen ? 'Cancel' : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                Log Activity
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Add Activity Form */}
                      <AnimatePresence>
                        {isAddActivityOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                          >
                            <form onSubmit={handleAddActivity} className="relative overflow-hidden p-6 bg-slate-50/40 dark:bg-slate-900/15 border border-slate-200/60 dark:border-slate-850 rounded-2xl space-y-4 text-left shadow-xs mb-2">
                              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600" />

                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                    <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                  </div>
                                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Log a New Activity</h4>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-455 dark:text-slate-500 hidden sm:inline">Set details, types, schedules and optional reminders</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Activity Task Title *</label>
                                  <Input
                                    placeholder="e.g. Call Client regarding negotiation"
                                    value={activityFormTask}
                                    onChange={(e) => setActivityFormTask(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    required
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Task Description</label>
                                  <Input
                                    placeholder="e.g. Details about call duration and response"
                                    value={activityFormDesc}
                                    onChange={(e) => setActivityFormDesc(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Expected Date</label>
                                  <Input
                                    type="date"
                                    value={activityFormExpectedDate}
                                    onChange={(e) => setActivityFormExpectedDate(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Expected Time</label>
                                  <Input
                                    type="time"
                                    value={activityFormExpectedTime}
                                    onChange={(e) => setActivityFormExpectedTime(e.target.value)}
                                    className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Activity Type</label>
                                    <select
                                      value={activityFormType}
                                      onChange={(e) => setActivityFormType(e.target.value)}
                                      className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                      <option value="Call">Call</option>
                                      <option value="Meeting">Meeting</option>
                                      <option value="Deal">Deal</option>
                                      <option value="Email">Email</option>
                                      <option value="General">General</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Active Flag</label>
                                    <select
                                      value={activityFormActive ? "true" : "false"}
                                      onChange={(e) => setActivityFormActive(e.target.value === "true")}
                                      className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                      <option value="true">Active</option>
                                      <option value="false">Inactive</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Reminder Header & Checkbox */}
                                <div className="md:col-span-2 border-t dark:border-slate-850 pt-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      id="activityReminderCheckbox"
                                      checked={activityFormHasReminder}
                                      onCheckedChange={(checked) => setActivityFormHasReminder(!!checked)}
                                      className="border-slate-350 cursor-pointer"
                                    />
                                    <label htmlFor="activityReminderCheckbox" className="text-xs font-bold text-slate-700 dark:text-white cursor-pointer select-none">
                                      Configure a Reminder for this activity
                                    </label>
                                  </div>
                                </div>

                                {activityFormHasReminder && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100/50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800"
                                  >
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Reminder Due Date *</label>
                                      <Input
                                        type="date"
                                        value={activityFormReminderDate}
                                        onChange={(e) => setActivityFormReminderDate(e.target.value)}
                                        className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl"
                                        required={activityFormHasReminder}
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Reminder Due Time</label>
                                      <Input
                                        type="time"
                                        value={activityFormReminderTime}
                                        onChange={(e) => setActivityFormReminderTime(e.target.value)}
                                        className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Reminder Purpose / For</label>
                                      <Input
                                        value={activityFormReminderFor}
                                        onChange={(e) => setActivityFormReminderFor(e.target.value)}
                                        className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl"
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Repeat Everyday?</label>
                                      <select
                                        value={activityFormReminderRepeat}
                                        onChange={(e) => setActivityFormReminderRepeat(e.target.value)}
                                        className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl"
                                      >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Reminder Message</label>
                                      <Input
                                        placeholder="e.g. Follow up with client regarding proposal approval."
                                        value={activityFormReminderMessage}
                                        onChange={(e) => setActivityFormReminderMessage(e.target.value)}
                                        className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </div>

                              <div className="flex gap-2 justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setIsAddActivityOpen(false);
                                    setActivityFormTask('');
                                    setActivityFormDesc('');
                                    setActivityFormExpectedDate('');
                                    setActivityFormExpectedTime('');
                                    setActivityFormType('Call');
                                    setActivityFormActive(true);
                                    setActivityFormHasReminder(false);
                                    setActivityFormReminderDate('');
                                    setActivityFormReminderTime('');
                                    setActivityFormReminderMessage('');
                                    setActivityFormReminderFor('Deal Follow-up');
                                    setActivityFormReminderRepeat('No');
                                  }}
                                  className="h-9.5 text-xs font-bold rounded-xl px-4 border-slate-250 dark:border-slate-800 cursor-pointer"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  style={{ backgroundColor: primaryColor }}
                                  className="text-white h-9.5 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                                >
                                  Log Activity
                                </Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Activities Table */}
                      {isLoadingActivities ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-12 w-full bg-slate-50/50 dark:bg-slate-900/40 animate-pulse rounded-xl" />
                          ))}
                        </div>
                      ) : totalActivities === 0 ? (
                        <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3.5 bg-slate-50/10 dark:bg-slate-900/5">
                          <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto border dark:border-slate-800">
                            <Activity className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                          </div>
                          <div className="max-w-md mx-auto space-y-1">
                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">No activities logged</h3>
                            <p className="text-xs text-slate-405 dark:text-slate-500 font-semibold leading-relaxed">
                              Log an activity above to track expected dates and reminders for this deal.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-900">
                          <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/40">
                              <TableRow>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Task Details</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Expected Schedule</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Type / Active</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3">Reminder</TableHead>
                                <TableHead className="font-extrabold text-xs text-slate-605 dark:text-slate-300 py-3 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedActivities.map((act) => {
                                const isEditing = editingActivityId === act.id;
                                return isEditing ? (
                                  <TableRow key={act.id} className="hover:bg-transparent">
                                    <TableCell colSpan={5} className="p-4 bg-slate-50/30 dark:bg-slate-900/20">
                                      <form onSubmit={handleUpdateActivity} className="space-y-4 text-left">
                                        <div className="flex items-center gap-2 text-blue-500 dark:text-blue-400">
                                          <Edit className="h-4 w-4" />
                                          <span className="text-xs font-bold uppercase tracking-wider">Editing Activity ({act.DealActivities_Id || `ID: ${act.id}`})</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Task Name</label>
                                            <Input
                                              value={activityFormTask}
                                              onChange={(e) => setActivityFormTask(e.target.value)}
                                              placeholder="Activity Task Title"
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl"
                                              required
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Description</label>
                                            <Input
                                              value={activityFormDesc}
                                              onChange={(e) => setActivityFormDesc(e.target.value)}
                                              placeholder="Description details"
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Expected Date</label>
                                            <Input
                                              type="date"
                                              value={activityFormExpectedDate}
                                              onChange={(e) => setActivityFormExpectedDate(e.target.value)}
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Expected Time</label>
                                            <Input
                                              type="time"
                                              value={activityFormExpectedTime}
                                              onChange={(e) => setActivityFormExpectedTime(e.target.value)}
                                              className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-205 dark:border-slate-800 rounded-xl"
                                            />
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-bold text-slate-405 tracking-wider block uppercase">Activity Type</label>
                                              <select
                                                value={activityFormType}
                                                onChange={(e) => setActivityFormType(e.target.value)}
                                                className="w-full h-9.5 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl"
                                              >
                                                <option value="Call">Call</option>
                                                <option value="Meeting">Meeting</option>
                                                <option value="Deal">Deal</option>
                                                <option value="Email">Email</option>
                                                <option value="General">General</option>
                                              </select>
                                            </div>
                                            <div className="space-y-1">
                                              <label className="text-[10px] font-bold text-slate-405 tracking-wider block uppercase">Active State</label>
                                              <select
                                                value={activityFormActive ? "true" : "false"}
                                                onChange={(e) => setActivityFormActive(e.target.value === "true")}
                                                className="w-full h-9.5 px-3 text-xs bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-800 rounded-xl"
                                              >
                                                <option value="true">Active</option>
                                                <option value="false">Inactive</option>
                                              </select>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex gap-2 justify-end">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancelEditActivity}
                                            className="h-9 text-xs font-bold rounded-xl px-4 border-slate-250 dark:border-slate-800"
                                          >
                                            Cancel
                                          </Button>
                                          <Button
                                            type="submit"
                                            style={{ backgroundColor: primaryColor }}
                                            className="text-white h-9 px-5 text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all"
                                          >
                                            Save Activity
                                          </Button>
                                        </div>
                                      </form>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <TableRow key={act.id} className="border-b dark:border-slate-900 last:border-b-0 hover:bg-slate-50/20 dark:hover:bg-slate-900/10 text-left">
                                    <TableCell className="py-3">
                                      <div>
                                        <span className="text-xs font-bold text-slate-850 dark:text-white block">
                                          {act.Task}
                                        </span>
                                        {act.Task_Description && (
                                          <span className="text-[10px] text-slate-455 dark:text-slate-550 font-semibold block mt-0.5 max-w-xs truncate md:max-w-md">
                                            {stripHtml(act.Task_Description)}
                                          </span>
                                        )}
                                        {act.DealActivities_Id && (
                                          <span className="text-[8px] font-mono text-slate-400 dark:text-slate-550 bg-slate-50/80 dark:bg-slate-900/80 px-1 py-0.2 rounded border dark:border-slate-800 block w-max mt-1">
                                            {act.DealActivities_Id}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-605 dark:text-slate-300 font-semibold py-3 whitespace-nowrap">
                                      <div className="space-y-1">
                                        <span className="flex items-center gap-1.5 text-xs text-slate-705 dark:text-slate-305 font-bold">
                                          <Calendar className="h-3.5 w-3.5 text-slate-405" />
                                          {act.Expected_Date ? new Date(act.Expected_Date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                        </span>
                                        {act.Expected_Time && (
                                          <span className="flex items-center gap-1.5 text-[10px] text-slate-450 font-semibold">
                                            <Clock className="h-3 w-3" />
                                            {act.Expected_Time.substring(0, 5)}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3 whitespace-nowrap">
                                      <div className="flex flex-col gap-1.5">
                                        <Badge variant="outline" className={`rounded font-bold text-[9px] py-0 px-2 uppercase border w-max ${getActivityBadgeColor(act.Activity_Type)}`}>
                                          {act.Activity_Type || 'General'}
                                        </Badge>
                                        <div className="flex items-center gap-1 text-[10px]">
                                          <span className="font-semibold text-slate-400">State:</span>
                                          <span className={`font-bold ${act.Active_Flag ? 'text-emerald-505' : 'text-slate-450'}`}>{act.Active_Flag ? 'Active' : 'Inactive'}</span>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      {act.Reminder_Id ? (
                                        <span className="text-[10px] font-bold text-amber-605 bg-amber-50 dark:bg-amber-955/20 border border-amber-100/50 dark:border-amber-900/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                                          Reminder Configured
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-semibold text-slate-400 italic">None</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right py-3">
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          onClick={() => handleStartEditActivity(act)}
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                          onClick={() => {
                                            setActivityIdToDelete(act.id);
                                            setIsDeleteActivityOpen(true);
                                          }}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {/* Pagination Footer Controls */}
                      {totalActivities > ACTIVITIES_PAGE_SIZE && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t dark:border-slate-900 text-xs font-semibold text-slate-400 dark:text-slate-500">
                          <span>
                            Showing <span className="font-bold text-slate-700 dark:text-white">{startIndex + 1}</span> to{' '}
                            <span className="font-bold text-slate-700 dark:text-white">
                              {Math.min(startIndex + ACTIVITIES_PAGE_SIZE, totalActivities)}
                            </span>{' '}
                            of <span className="font-bold text-slate-700 dark:text-white">{totalActivities}</span> activities
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPageNormalized === 1}
                              onClick={() => setActivitiesCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="h-8 text-[11px] font-bold rounded-lg border-slate-205 dark:border-slate-800 px-3 cursor-pointer"
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPageNormalized === totalPages}
                              onClick={() => setActivitiesCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="h-8 text-[11px] font-bold rounded-lg border-slate-205 dark:border-slate-800 px-3 cursor-pointer"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {activeTab === 'Appointments' && (
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Scheduled Appointments</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Manage meetings, venue locations, and follow-up status for this deal.</p>
                      </div>
                      <Button
                        onClick={handleOpenAddAppointment}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white text-xs font-bold h-9 px-4 rounded-xl gap-1.5 cursor-pointer flex items-center"
                      >
                        <Plus className="h-4 w-4" /> Add Appointment
                      </Button>
                    </div>

                    {dealMeetingsState.length === 0 ? (
                      <div className="py-16 text-center border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                        <Calendar className="h-10 w-10 text-slate-350 mx-auto mb-3" />
                        <p className="text-slate-400 text-xs font-semibold">No appointments scheduled yet.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                              <th className="pb-3 pt-2 font-bold">Meeting ID</th>
                              <th className="pb-3 pt-2 font-bold">Subject</th>
                              <th className="pb-3 pt-2 font-bold">Date & Time</th>
                              <th className="pb-3 pt-2 font-bold">Location & Venue</th>
                              <th className="pb-3 pt-2 font-bold">Status</th>
                              <th className="pb-3 pt-2 font-bold">Details</th>
                              <th className="pb-3 pt-2 font-bold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dealMeetingsState.map((meet: any) => (
                              <tr key={meet.id || meet.LeadMeeting_Id || Math.random()} className="border-b dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors">
                                <td className="py-3 font-semibold font-mono text-slate-800 dark:text-white">{meet.LeadMeeting_Id || meet.DealMeeting_Id || `MEET-${meet.id}`}</td>
                                <td className="py-3 font-bold text-slate-800 dark:text-white">{meet.Subject || '-'}</td>
                                <td className="py-3 text-slate-500 font-semibold">
                                  <div>{meet.Date || meet.expected_date || '-'}</div>
                                  <div className="text-slate-400">{meet.FromDate_Time ? `${meet.FromDate_Time} – ${meet.ToDate_Time || ''}` : '-'}</div>
                                </td>
                                <td className="py-3 text-slate-500 font-semibold">
                                  <div>{meet.Location || '-'}</div>
                                  <div className="text-slate-400">{meet.Venue || ''}</div>
                                </td>
                                <td className="py-3">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meet.Status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : meet.Status === 'Cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'}`}>
                                    {meet.Status || 'Scheduled'}
                                  </span>
                                </td>
                                <td className="py-3 text-slate-500 font-semibold max-w-[180px] truncate">{meet.Details ? meet.Details.replace(/<[^>]*>/g, '') : '-'}</td>
                                <td className="py-3 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      }
                                    />
                                    <DropdownMenuContent align="end" className="w-36">
                                      <DropdownMenuItem
                                        onClick={() => handleOpenEditAppointment(meet)}
                                        className="cursor-pointer gap-2 text-xs font-medium"
                                      >
                                        <Pencil className="h-3.5 w-3.5 text-slate-500" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteMeeting(meet.id)}
                                        className="cursor-pointer gap-2 text-xs font-medium text-rose-600 focus:text-rose-600 dark:text-rose-400"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'Emails' && (
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 text-center text-slate-500 font-semibold space-y-3">
                    <Mail className="h-8 w-8 text-slate-300 mx-auto" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Connected Emails</h3>
                      <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">Send and receive correspondence with contact leads. Thread logs automatically align here.</p>
                    </div>
                    <Button variant="outline" className="border-slate-200 dark:border-slate-800 rounded-xl h-9 text-xs font-bold gap-2">Compose Email</Button>
                  </div>
                )}

                {activeTab === 'Invoices' && (
                  <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 text-center text-slate-500 font-semibold space-y-3">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white">Invoices & Billings</h3>
                      <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mt-1">Generate invoices, record payments, and track billing states linked with this deal contract.</p>
                    </div>
                    <Button variant="outline" className="border-slate-200 dark:border-slate-800 rounded-xl h-9 text-xs font-bold gap-2">Create Invoice</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (1/3 width) - Sidebar details */}
            <div className="space-y-6">

              {/* Contact Details Card */}
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 border-b dark:border-slate-900 pb-2 text-left">Contact</h3>
                <div className="flex gap-4 items-start text-left">
                  <div className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${deal.contactBgColor}`}>
                    {deal.contactInitials}
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="text-sm font-bold text-slate-850 dark:text-white leading-tight">{deal.contactName}</h4>
                    <p className="text-[11px] font-semibold text-slate-405">{deal.contactRole}</p>

                    <div className="space-y-2 pt-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <a href={`mailto:${deal.contactEmail}`} className="hover:text-blue-500 transition-colors truncate">{deal.contactEmail}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{deal.contactPhone}</span>
                        <a
                          href={`https://wa.me/${deal.contactPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-0.5 hover:bg-slate-50 dark:hover:bg-slate-900 rounded transition-colors"
                        >
                          <WhatsAppIcon />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                  onClick={() => toast.info(`Viewing contact details for ${deal.contactName}`)}
                >
                  View Contact
                </Button>
              </div>

              {/* Timeline Card */}
              <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-455 border-b dark:border-slate-900 pb-2 text-left">Timeline</h3>
                <div className="relative border-l dark:border-slate-900 pl-4 space-y-5 py-1 text-left">
                  {staticActivities.slice(0, 3).map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-6.5 top-0.5 bg-white dark:bg-slate-950 p-0.5 rounded-full border dark:border-slate-900">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center text-white ${event.category === 'stage' ? 'bg-purple-500' :
                          event.category === 'note' ? 'bg-amber-500' :
                            event.category === 'task' ? 'bg-indigo-500' :
                              'bg-emerald-500'
                          }`}>
                          {event.category === 'stage' ? <TrendingUp className="h-2 w-2" /> :
                            event.category === 'note' ? <MessageSquare className="h-2 w-2" /> :
                              event.category === 'task' ? <Check className="h-2 w-2" /> :
                                <Activity className="h-2 w-2" />}
                        </div>
                      </div>
                      <div className="text-[11px] space-y-0.5 font-semibold">
                        <span className="font-bold text-slate-800 dark:text-white block">{event.type}</span>
                        <p className="text-slate-505 dark:text-slate-400 font-medium leading-relaxed truncate">{event.details}</p>
                        <span className="text-[10px] text-slate-400 block pt-0.5">{event.date} {event.time} &bull; by {event.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                  onClick={() => setActiveTab('Activities')}
                >
                  View Full Timeline
                </Button>
              </div>

              {/* Files Card */}
              <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-5">
                <div className="flex justify-between items-center border-b dark:border-slate-900 pb-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-455">Files</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                    onClick={handleFileUpload}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3.5 text-left">
                  {documentsList.map((file) => (
                    <div key={file.id} className="flex items-center justify-between gap-2 py-0.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 text-white font-bold text-[9px] uppercase ${file.type === 'pdf' ? 'bg-rose-500' :
                          file.type === 'docx' ? 'bg-blue-500' :
                            file.type === 'xlsx' ? 'bg-emerald-500' :
                              'bg-indigo-500'
                          }`}>
                          {file.type}
                        </div>
                        <div className="text-[11px] font-semibold min-w-0">
                          <p className="text-slate-800 dark:text-white truncate font-bold">{file.name}</p>
                          <span className="text-slate-400 text-[10px] font-medium">{file.type.toUpperCase()} &bull; {file.size} &bull; {file.date}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-405 hover:text-slate-705" onClick={() => toast.info(`Downloading ${file.name}...`)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full h-9 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold"
                  onClick={() => toast.info('File attachments dashboard loaded.')}
                >
                  View All Files
                </Button>
              </div>

            </div>
          </div>

          {/* Edit Dialog Modal */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Edit Deal Details</DialogTitle>
                  <DialogDescription>Update the core properties of this sales pipeline item.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Deal Name *</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Company *</label>
                    <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Value (BDT) *</label>
                      <Input type="number" value={editValue} onChange={(e) => setEditValue(parseInt(e.target.value) || 0)} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Probability (%)</label>
                      <Input type="number" min="0" max="100" value={editProbability} onChange={(e) => setEditProbability(parseInt(e.target.value) || 0)} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Expected Close Date *</label>
                    <Input type="date" value={editExpectedClose} onChange={(e) => setEditExpectedClose(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-405 uppercase tracking-wider block">Summary</label>
                    <textarea
                      className="w-full min-h-[80px] p-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded focus:outline-none"
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white font-bold">Save Changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Note Confirmation Dialog Modal */}
          <Dialog open={isDeleteNoteOpen} onOpenChange={setIsDeleteNoteOpen}>
            <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white font-bold">Delete Note</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this note? This action cannot be undone and the note will be permanently removed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-3 gap-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDeleteNoteOpen(false);
                    setNoteIdToDelete(null);
                  }}
                  className="cursor-pointer border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (noteIdToDelete !== null) {
                      handleDeleteNote(noteIdToDelete);
                    }
                    setIsDeleteNoteOpen(false);
                    setNoteIdToDelete(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Confirm Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Task Confirmation Dialog Modal */}
          <Dialog open={isDeleteTaskOpen} onOpenChange={setIsDeleteTaskOpen}>
            <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white font-bold">Delete Task</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this task? This action cannot be undone and the task will be permanently removed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-3 gap-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDeleteTaskOpen(false);
                    setTaskIdToDelete(null);
                  }}
                  className="cursor-pointer border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (taskIdToDelete !== null) {
                      handleDeleteTask(taskIdToDelete);
                    }
                    setIsDeleteTaskOpen(false);
                    setTaskIdToDelete(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Confirm Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Activity Confirmation Dialog Modal */}
          <Dialog open={isDeleteActivityOpen} onOpenChange={setIsDeleteActivityOpen}>
            <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white font-bold">Delete Activity</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this activity? This action cannot be undone and the activity will be permanently removed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-3 gap-2 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDeleteActivityOpen(false);
                    setActivityIdToDelete(null);
                  }}
                  className="cursor-pointer border-slate-200 dark:border-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (activityIdToDelete !== null) {
                      handleDeleteActivity(activityIdToDelete);
                    }
                    setIsDeleteActivityOpen(false);
                    setActivityIdToDelete(null);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Confirm Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Schedule Appointment Modal Dialog */}
          <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
            <DialogContent className="max-w-2xl dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-6 text-slate-800 dark:text-slate-200 overflow-y-auto max-h-[90vh]">
              <DialogHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-3">
                <DialogTitle className="text-lg font-bold dark:text-white text-left">{editingMeeting ? 'Edit Appointment' : 'Add Appointment'}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateAppointment} className="space-y-4 py-3 text-xs text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Deal Name</label>
                    <Input value={deal?.name || ''} disabled className="h-10 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 cursor-not-allowed font-semibold text-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Subject <span className="text-red-500">*</span></label>
                    <Input placeholder="Enter subject" value={appointmentSubject} onChange={(e) => setAppointmentSubject(e.target.value)} className="h-10 text-xs rounded-lg" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Location <span className="text-red-500">*</span></label>
                    <Input placeholder="Enter location" value={appointmentLocation} onChange={(e) => setAppointmentLocation(e.target.value)} className="h-10 text-xs rounded-lg" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Venue <span className="text-red-500">*</span></label>
                    <Input placeholder="Enter venue" value={appointmentVenue} onChange={(e) => setAppointmentVenue(e.target.value)} className="h-10 text-xs rounded-lg" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Expected Date <span className="text-red-500">*</span></label>
                    <Input type="date" value={appointmentExpectedDate} onChange={(e) => setAppointmentExpectedDate(e.target.value)} className="h-10 text-xs rounded-lg" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">From Time <span className="text-red-500">*</span></label>
                    <Input type="time" value={appointmentFromTime} onChange={(e) => setAppointmentFromTime(e.target.value)} className="h-10 text-xs rounded-lg" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">To Time <span className="text-red-500">*</span></label>
                    <Input type="time" value={appointmentToTime} onChange={(e) => setAppointmentToTime(e.target.value)} className="h-10 text-xs rounded-lg" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status <span className="text-red-500">*</span></label>
                    <Select value={appointmentStatus} onValueChange={(val) => setAppointmentStatus(val || '')}>
                      <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                        <SelectValue placeholder="Scheduled" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900">
                        <SelectItem value="Scheduled" className="font-semibold text-xs">Scheduled</SelectItem>
                        <SelectItem value="Completed" className="font-semibold text-xs">Completed</SelectItem>
                        <SelectItem value="Cancelled" className="font-semibold text-xs">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Details</label>
                  <textarea placeholder="Provide appointment details..." value={appointmentDetails} onChange={(e) => setAppointmentDetails(e.target.value)} className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg min-h-[80px] focus:outline-none focus:border-slate-350" />
                </div>

                {/* Remind Me Section */}
                <div className="border-t dark:border-slate-800 pt-4 mt-2 space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox id="dealRemindMe" checked={remindMe} onCheckedChange={(checked) => setRemindMe(!!checked)} className="rounded-md h-4 w-4" />
                    <label htmlFor="dealRemindMe" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Remind Me (Optional)</label>
                  </div>

                  {remindMe && (
                    <div className="space-y-4 bg-slate-50/50 dark:bg-slate-955/20 border dark:border-slate-850 p-4 rounded-xl">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Reminder Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">First Reminder Before Due</label>
                          <div className="flex gap-2">
                            <Input type="number" min="1" value={reminderBeforeDueVal} onChange={(e) => setReminderBeforeDueVal(e.target.value)} className="h-10 text-xs rounded-lg w-24" />
                            <Select value={reminderBeforeDueUnit} onValueChange={(val) => setReminderBeforeDueUnit(val || '')}>
                              <SelectTrigger className="w-28 h-10 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                                <SelectValue placeholder="Hrs" />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-slate-900">
                                <SelectItem value="Mins" className="font-semibold text-xs">Mins</SelectItem>
                                <SelectItem value="Hrs" className="font-semibold text-xs">Hrs</SelectItem>
                                <SelectItem value="Days" className="font-semibold text-xs">Days</SelectItem>
                                <SelectItem value="Weeks" className="font-semibold text-xs">Weeks</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Checkbox id="dealRepeatEveryChecked" checked={repeatEveryChecked} onCheckedChange={(checked) => setRepeatEveryChecked(!!checked)} className="rounded-md h-4 w-4" />
                            <label htmlFor="dealRepeatEveryChecked" className="font-bold text-slate-500 uppercase tracking-wider text-[10px] cursor-pointer">Repeat Every</label>
                          </div>
                          {repeatEveryChecked && (
                            <div className="flex gap-2">
                              <Input type="number" min="1" value={repeatEveryVal} onChange={(e) => setRepeatEveryVal(e.target.value)} className="h-10 text-xs rounded-lg w-24" />
                              <Select value={repeatEveryUnit} onValueChange={(val) => setRepeatEveryUnit(val || '')}>
                                <SelectTrigger className="w-28 h-10 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                                  <SelectValue placeholder="Mins" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-slate-900">
                                  <SelectItem value="Mins" className="font-semibold text-xs">Mins</SelectItem>
                                  <SelectItem value="Hrs" className="font-semibold text-xs">Hrs</SelectItem>
                                  <SelectItem value="Days" className="font-semibold text-xs">Days</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reminder Status</label>
                          <Select value={reminderStatus} onValueChange={(val) => setReminderStatus(val || '')}>
                            <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                              <SelectValue placeholder="Pending" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900">
                              <SelectItem value="Pending" className="font-semibold text-xs">Pending</SelectItem>
                              <SelectItem value="Completed" className="font-semibold text-xs">Completed</SelectItem>
                              <SelectItem value="Cancelled" className="font-semibold text-xs">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Reminder Message</label>
                        <textarea placeholder="Enter reminder content..." value={reminderMessage} onChange={(e) => setReminderMessage(e.target.value)} className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg min-h-[60px] focus:outline-none focus:border-slate-350" />
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t dark:border-slate-800 pt-3 flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAppointmentDialogOpen(false)} className="text-xs h-9 rounded-lg px-4">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingAppointment} style={{ backgroundColor: primaryColor }} className="text-white text-xs h-9 rounded-lg px-4 font-semibold">
                    {isSubmittingAppointment ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
