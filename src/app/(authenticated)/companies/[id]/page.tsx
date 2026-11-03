'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';
import {
  ArrowLeft,
  Phone,
  Mail,
  Plus,
  Trash2,
  User,
  Tag,
  CheckCircle,
  Eye,
  Info,
  Clock,
  ChevronDown,
  MoreVertical,
  ChevronsUpDown,
  Building,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Globe,
  MapPin,
  Calendar,
  History,
  FileText,
  UploadCloud,
  Check,
  Star,
  FileSpreadsheet,
  Coins,
  Send,
  MessageSquare,
  Pencil,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/store/useStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Company, CompanyContact, CompanyDeal, CompanyNote, CompanyTimelineItem } from '@/types/companies';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAccountdealoverview, fetchAccountmylistwithdealcount, fetchAccountCRUD, fetchAccountNotes, createAccountNote, deleteAccountNote, updateAccountNote, ApiAccountNote, fetchAccountActivities, createAccountActivity, deleteAccountActivity, ApiAccountActivity, fetchAccountinvoicelist, uploadAccountFile, updateAccountCRUD, fetchAccountOverviewContacts, fetchAccountSentMails, fetchAccountInboxMails, createAccountMailMaster, uploadUserFileAndUrl, fetchAccountStatusHistory, createAccountMeeting, fetchAccountMeetings, updateAccountMeeting, deleteAccountMeeting } from '@/service/api/Company/api';
import { createUserLeadMeeting, fetchUserLeadMeetings } from '@/service/api/Leads/api';
import { generateEmailContent } from '@/service/api/Leads/api';
import { BASE_URL, getTenantName } from '@/service/apiClient';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { usePermission } from '@/hooks/usePermission';

type TabType = 'Overview' | 'Contacts' | 'Deals' | 'Activities' | 'Notes' | 'Files' | 'Invoices' | 'Emails' | 'Appointments';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const isImageFile = (fileName: string, fileUrl?: string) => {
  const isImg = (str: string) => /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(str);
  return isImg(fileName) || (!!fileUrl && isImg(fileUrl));
};

const formatAddress = (addressStr?: any) => {
  if (!addressStr || typeof addressStr !== 'string') return 'N/A';
  const parts = addressStr.split(',').map(p => p.trim());
  if (parts.length > 2) {
    return (
      <>
        {parts.slice(0, 2).join(', ')}
        <br />
        {parts.slice(2).join(', ')}
      </>
    );
  }
  return addressStr;
};

const premiumTagStyles = [
  'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30',
  'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30',
  'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30',
  'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-955/20 dark:text-sky-400 dark:border-sky-900/30',
  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 dark:bg-fuchsia-950/20 dark:text-fuchsia-400 dark:border-fuchsia-900/30',
  'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30',
  'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/30',
];

const getTagStyle = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % premiumTagStyles.length;
  return premiumTagStyles[index];
};

const getStageBadgeStyle = (stage: string) => {
  const lower = stage.toLowerCase();
  if (lower.includes('proposal') || lower.includes('won')) {
    return 'bg-[#EEFBF3] text-[#107C41] border border-[#D0F0DB] dark:bg-[#107c41]/10 dark:text-emerald-400 dark:border-emerald-900/30';
  }
  if (lower.includes('negotiation')) {
    return 'bg-[#EEF4FE] text-[#1A73E8] border border-[#D2E3FC] dark:bg-[#1a73e8]/10 dark:text-blue-400 dark:border-blue-900/30';
  }
  if (lower.includes('qualification') || lower.includes('lead') || lower.includes('open')) {
    return 'bg-[#FFF8E6] text-[#B06000] border border-[#FFE8B8] dark:bg-[#b06000]/10 dark:text-amber-400 dark:border-amber-900/30';
  }
  return 'bg-[#F8FAFC] text-[#5F6368] border border-[#DADCE0] dark:bg-slate-800/40 dark:text-slate-350 dark:border-slate-800';
};

const getOwnerAvatarBg = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('sadia')) return 'bg-emerald-500';
  if (lower.includes('jisan')) return 'bg-amber-500';
  return 'bg-blue-500';
};

const getTimelineIcon = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes('deal') || lower.includes('won')) return Briefcase;
  if (lower.includes('contact')) return User;
  if (lower.includes('created') || lower.includes('company')) return Building;
  return History;
};

const getTimelineColorClass = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes('deal') || lower.includes('won')) return 'bg-emerald-600 text-white';
  if (lower.includes('contact')) return 'bg-blue-600 text-white';
  if (lower.includes('created') || lower.includes('company')) return 'bg-amber-500 text-white';
  return 'bg-slate-400 text-white';
};

export default function CompanyDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { primaryColor } = useStore();
  const { companies, addCompany, updateCompany, deleteCompany } = useCompanyStore();
  const { canViewCompanyOverview } = usePermission();

  useEffect(() => {
    if (!canViewCompanyOverview) {
      toast.error('You do not have permission to view Company details.');
      router.push('/companies');
    }
  }, [canViewCompanyOverview, router]);

  // States
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [isGeneratingAiEmail, setIsGeneratingAiEmail] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteSubject, setNoteSubject] = useState('');
  const [noteSubjectError, setNoteSubjectError] = useState('');
  const [noteContentError, setNoteContentError] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Note edit states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Overview note edit states
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutInput, setAboutInput] = useState('');

  // Query Client & Fetch Company Appointments
  const queryClient = useQueryClient();
  const numericId = parseInt(id, 10);
  const { data: companyMeetingsData } = useQuery({
    queryKey: ['companyMeetings', numericId],
    queryFn: () => fetchAccountMeetings(numericId),
    enabled: !isNaN(numericId),
  });
  const companyMeetingsState = Array.isArray(companyMeetingsData) ? companyMeetingsData : (companyMeetingsData?.results || companyMeetingsData?.data || []);
  const loadCompanyMeetings = () => queryClient.invalidateQueries({ queryKey: ['companyMeetings', numericId] });

  // Listen for Account Meeting REMINDER WebSocket events
  useEffect(() => {
    const handleAccountMeetingReminder = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (
        detail?.event_type === 'REMINDER' &&
        (detail?.module === 'Account Meeting' || detail?.module === 'AccountMeeting' ||
          detail?.module === 'Company Meeting' || detail?.module === 'CompanyMeeting')
      ) {
        // Refresh the appointments list for this company
        loadCompanyMeetings();
      }
    };
    window.addEventListener('ml-reminder', handleAccountMeetingReminder);
    return () => window.removeEventListener('ml-reminder', handleAccountMeetingReminder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericId]);

  // Appointment Form States
  const [editingMeeting, setEditingMeeting] = useState<any | null>(null);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
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

  const handleOpenCreateAppointment = () => {
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
            await deleteAccountMeeting(meetingId);
            toast.success('Appointment deleted successfully!');
            loadCompanyMeetings();
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

    const doSubmit = async () => {
      setIsSubmittingAppointment(true);
      try {
        const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '111' : '111';
        const userId = parseInt(userIdStr, 10);

        const reminderId = editingMeeting?.Reminder_Id && typeof editingMeeting.Reminder_Id === 'object'
          ? editingMeeting.Reminder_Id.id
          : (editingMeeting?.Reminder_Id || null);

        const reminderPayload = remindMe ? {
          id: reminderId,
          Created_By: userId,
          Updated_By: userId,
          ReminderFor: "Reminder for Appointment",
          Repeat_EveryDay: repeatEveryChecked ? `${repeatEveryVal} ${repeatEveryUnit}` : "",
          RemainderDueDate: `${reminderBeforeDueVal} ${reminderBeforeDueUnit}`,
          RemainderMessage: reminderMessage || appointmentSubject,
          Status: reminderStatus
        } : null;

        if (editingMeeting) {
          const editPayload = {
            id: editingMeeting.id,
            AccountMeeting_Id: editingMeeting.AccountMeeting_Id || false,
            Subject: appointmentSubject,
            ToDate_Time: appointmentToTime,
            FromDate_Time: appointmentFromTime,
            Date: appointmentExpectedDate,
            Location: appointmentLocation,
            Venue: appointmentVenue,
            Details: appointmentDetails ? `<p>${appointmentDetails}</p>` : "",
            Lead_Id: null,
            Active_Flag: true,
            Reminder_Id: reminderPayload,
            // Reminder_Id: reminderId,
            Organization_Id: typeof editingMeeting.Organization_Id === 'object' ? String(editingMeeting.Organization_Id?.id || 1) : String(editingMeeting.Organization_Id || 1),
            Created_By: typeof editingMeeting.Created_By === 'object' ? String(editingMeeting.Created_By?.id || userId) : String(editingMeeting.Created_By || userId),
            Updated_By: String(userId),
            Account_Id: numericId
          };
          await updateAccountMeeting(editPayload);
          toast.success('Appointment updated successfully!');
        } else {
          const payload = {
            AccountMeeting_Id: false,
            Subject: appointmentSubject,
            ToDate_Time: appointmentToTime,
            FromDate_Time: appointmentFromTime,
            Date: appointmentExpectedDate,
            Location: appointmentLocation,
            Venue: appointmentVenue,
            Details: appointmentDetails ? `<p>${appointmentDetails}</p>` : "",
            Lead_Id: null,
            Active_Flag: true,
            Reminder_Payload: reminderPayload,
            Organization_Id: "1",
            Created_By: String(userId),
            Updated_By: String(userId),
            Account_Id: numericId
          };
          await createAccountMeeting(payload);
          toast.success('Appointment scheduled successfully!');
        }

        loadCompanyMeetings();

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

        setIsAppointmentDialogOpen(false);
        loadCompanyMeetings();
      } catch (err: any) {
        toast.error(err.message || 'Failed to schedule appointment');
        console.error(err);
      } finally {
        setIsSubmittingAppointment(false);
      }
    };

    if (!editingMeeting && !remindMe) {
      toast.warning("No reminder set", {
        description: "You haven't set a reminder. You cannot add one to this appointment later. Are you sure you want to proceed?",
        duration: Infinity,
        action: {
          label: "Yes, proceed",
          onClick: () => doSubmit(),
        },
        cancel: {
          label: "No, go back",
          onClick: () => { },
        },
      });
      return;
    }

    await doSubmit();
  };

  const handleStartEditingAbout = () => {
    setAboutInput(company?.about || company?.notes || '');
    setIsEditingAbout(true);
  };

  const handleSaveAbout = () => {
    if (!company) return;
    const updatedFields = {
      about: aboutInput.trim(),
      notes: aboutInput.trim(),
    };

    if (!companies.some(c => c.id === company.id)) {
      addCompany({
        ...company,
        ...updatedFields,
        timeline: [
          {
            id: `TL-${Date.now()}`,
            type: 'Company updated',
            details: `Updated company notes`,
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            user: company.owner
          },
          ...(company.timeline || [])
        ]
      });
    } else {
      updateCompany(company.id, {
        ...updatedFields,
        timeline: [
          {
            id: `TL-${Date.now()}`,
            type: 'Company updated',
            details: `Updated company notes`,
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
            user: company.owner
          },
          ...(company.timeline || [])
        ]
      });
    }

    toast.success('Company notes updated successfully');
    setIsEditingAbout(false);
  };

  const handleEditFromSidebar = () => {
    setActiveTab('Overview');
    handleStartEditingAbout();
  };

  const handleStartEditingNote = (note: CompanyNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const handleSaveNoteEdit = async (noteId: string) => {
    if (!editingNoteContent.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }
    if (!company) {
      toast.error('Company profile not loaded');
      return;
    }
    try {
      const isNumericId = /^\d+$/.test(noteId);
      if (isNumericId) {
        const originalNote = (apiNotesRaw as any[])?.find((n: any) => n.id?.toString() === noteId);
        await updateAccountNote(noteId, {
          Notes: editingNoteContent.trim(),
          Updated_By: finalUserId,
          AccountNotes_Id: originalNote?.AccountNotes_Id || "",
          Organization_Id: originalNote?.Organization_Id || 1,
          Account_Id: originalNote?.Account_Id || (typeof id === 'string' ? parseInt(id, 10) : id),
          Created_By: originalNote?.Created_By?.id || originalNote?.Created_By || finalUserId,
          Subject: originalNote?.Subject || 'Internal Comment Note',
          Active_Flag: originalNote?.Active_Flag !== undefined ? originalNote.Active_Flag : true,
          Is_Deleted: originalNote?.Is_Deleted !== undefined ? originalNote.Is_Deleted : false
        });
        toast.success('Note updated successfully');
        refetchNotes();
      } else {
        const updatedNotesList = (company.notesList || []).map(n =>
          n.id === noteId ? { ...n, content: editingNoteContent.trim() } : n
        );
        updateCompany(company.id, { notesList: updatedNotesList });
        toast.success('Note updated');
      }
      setEditingNoteId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update note');
    }
  };

  // Dialog Open States
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);

  // Form States for Contacts Dialog
  const [newContactName, setNewContactName] = useState('');
  const [newContactRole, setNewContactRole] = useState('Manager');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // Form States for Deals Dialog
  const [newDealName, setNewDealName] = useState('');
  const [newDealStage, setNewDealStage] = useState('Qualification');
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealExpectedClose, setNewDealExpectedClose] = useState('');
  const [newDealOwner, setNewDealOwner] = useState('Sadia Afrin');

  // File Upload State (mockup)
  interface CompanyFile {
    id: string;
    name: string;
    size: string;
    date: string;
    uploader: string;
    url?: string | null;
  }

  const [filesList, setFilesList] = useState<CompanyFile[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Dialog & Form States for Activities
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [newActivityType, setNewActivityType] = useState('Call');
  const [newActivityTask, setNewActivityTask] = useState('');
  const [newActivityDescription, setNewActivityDescription] = useState('');
  const [newActivityExpectedDate, setNewActivityExpectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newActivityExpectedTime, setNewActivityExpectedTime] = useState('09:00');

  // Email states (must be declared here before any early returns)
  const [selectedSentEmailId, setSelectedSentEmailId] = useState<string | number | null>(null);
  const [isComposeMailOpen, setIsComposeMailOpen] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Compose email form states
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailFiles, setEmailFiles] = useState<File[]>([]);
  const [isSendingMail, setIsSendingMail] = useState(false);
  const [emailFrom, setEmailFrom] = useState('');

  // User ID resolving
  const finalUserId = useMemo(() => {
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    return storedUserId ? parseInt(storedUserId, 10) : 71;
  }, []);

  // 1. Fetch Company details using AccountCRUD API using useQuery
  const { data: apiCompanyRaw, isLoading: loadingCompany } = useQuery({
    queryKey: ['accountCRUD', id],
    queryFn: () => fetchAccountCRUD(id),
    enabled: !!id && !companies.some(c => c.id === id),
  });

  // Fetch Account Notes using useQuery
  const { data: apiNotesRaw, isLoading: loadingNotes, refetch: refetchNotes } = useQuery({
    queryKey: ['accountNotes', id],
    queryFn: () => fetchAccountNotes(id),
    enabled: !!id,
  });

  // Fetch Account Activities using useQuery
  const { data: apiActivitiesRaw, isLoading: loadingActivities, refetch: refetchActivities } = useQuery({
    queryKey: ['accountActivities', id],
    queryFn: () => fetchAccountActivities(id),
    enabled: !!id,
  });

  // Fetch Account Invoices using useQuery
  const { data: apiInvoicesRaw, isLoading: loadingInvoices } = useQuery({
    queryKey: ['accountInvoices', id],
    queryFn: () => fetchAccountinvoicelist(id),
    enabled: !!id,
  });

  // Fetch Account Overview Contacts using useQuery
  const { data: apiContactsRaw, isLoading: loadingContacts } = useQuery({
    queryKey: ['accountOverviewContacts', id],
    queryFn: () => fetchAccountOverviewContacts(id),
    enabled: !!id,
  });

  // Fetch Sent Emails using useQuery
  const { data: apiSentEmailsRaw, isLoading: loadingSentEmails } = useQuery({
    queryKey: ['accountSentMails', id],
    queryFn: () => fetchAccountSentMails(id),
    enabled: !!id,
  });

  // Fetch Inbox Emails using useQuery
  const { data: apiInboxEmailsRaw, isLoading: loadingInboxEmails } = useQuery({
    queryKey: ['accountInboxMails', id],
    queryFn: () => fetchAccountInboxMails(id),
    enabled: !!id,
    retry: false,
    throwOnError: false,
  });

  // Fetch Status History (Timeline) using useQuery
  const { data: apiStatusHistory, isLoading: loadingStatusHistory } = useQuery({
    queryKey: ['accountStatusHistory', id],
    queryFn: () => fetchAccountStatusHistory(id),
    enabled: !!id,
    retry: false,
    throwOnError: false,
  });

  const storeCompany = companies.find(c => c.id === id);

  const company = useMemo<Company | null>(() => {
    if (storeCompany) return storeCompany;
    if (!apiCompanyRaw) return null;
    const found = apiCompanyRaw;

    // Parse tags safely (it could be a JSON string, a list, or null)
    let parsedTags: string[] = [];
    if (found.Tags) {
      if (Array.isArray(found.Tags)) {
        parsedTags = found.Tags;
      } else if (typeof found.Tags === 'string') {
        try {
          parsedTags = JSON.parse(found.Tags);
        } catch {
          parsedTags = [found.Tags];
        }
      }
    } else if (found.tags) {
      if (Array.isArray(found.tags)) {
        parsedTags = found.tags;
      } else if (typeof found.tags === 'string') {
        try {
          parsedTags = JSON.parse(found.tags);
        } catch {
          parsedTags = [found.tags];
        }
      }
    }

    return {
      id: found.id?.toString() || id,
      companyName: found.Organization_Name || 'N/A',
      status: found.Active_Flag ? 'Active' as const : 'Inactive' as const,
      industry: found.Industry || 'N/A',
      phone: found.Phone_Number || 'N/A',
      email: found.Mail || 'N/A',
      website: found.Website || '',
      employeeSize: found.Employees ? found.Employees.toString() : '0',
      annualRevenue: found.Turn_Over ? found.Turn_Over.toString() : '',
      companyType: found.Client_Type || '',
      location: found.Location || 'N/A',
      currency: 'BDT',
      country: found.Country || '',
      city: found.City || '',
      postalCode: '',
      address: found.Address || '',
      source: found.Lead_Source || '',
      owner: found.Account_Owner || 'Unassigned',
      tags: parsedTags,
      notes: found.About || '',
      about: found.About || '',
      file: found.File || null,
      fileName: found.FileName || null,
      vatNumber: found.Vat_Number || found.vatNumber || '',
      registrationNumber: found.Reg_Number || found.registrationNumber || '',
      branchOffice: found.Branch_Office || found.branchOffice || '',
      gstNo: found.GST_No || found.gstNo || '',
      decisionMaker: found.Decision_Maker !== undefined ? found.Decision_Maker : false,
      landLine: found.Land_Line || found.landLine || '',
      fax: found.Fax || found.fax || '',
      paymentTerms: found.Payment_Terms || found.paymentTerms || '',
      latitude: found.Latitude || found.latitude || '',
      longitude: found.Longitude || found.longitude || '',
      deals: Array.from({ length: found.deals || 0 }).map((_, i) => ({
        id: `deal-${i}`,
        dealName: '',
        stage: '',
        dealValue: 0,
        expectedClose: '',
        owner: ''
      })),
      contacts: Array.isArray(apiContactsRaw?.results)
        ? apiContactsRaw.results.map((c: any) => ({
          id: c.id,
          contactId: c.Contact_Id || 'N/A',
          name: `${c.FirstName || ''} ${c.LastName || ''}`.trim() || c.Contact_Name || c.name || 'N/A',
          role: c.Job_Title || c.role || 'N/A',
          department: c.Department || '',
          email: c.Email_Id || c.Mail || 'N/A',
          phone: `${c.MobileCountry_Id || ''} ${c.Mobile_Number || ''}`.trim() || c.Phone_Number || 'N/A',
          leadSource: c.LeadSource || 'N/A',
          owner: c.Contact_Owner || 'N/A',
          status: c.Status || (c.Active_Flag ? 'Active' : 'Inactive')
        }))
        : (Array.isArray(apiContactsRaw)
          ? apiContactsRaw.map((c: any) => ({
            id: c.id,
            contactId: c.Contact_Id || 'N/A',
            name: c.Contact_Name || `${c.FirstName || ''} ${c.LastName || ''}`.trim() || c.name || 'N/A',
            role: c.Job_Title || c.Designation || c.role || 'N/A',
            department: c.Department || '',
            email: c.Mail || c.Email_Id || 'N/A',
            phone: c.Phone_Number || `${c.MobileCountry_Id || ''} ${c.Mobile_Number || ''}`.trim() || 'N/A',
            leadSource: c.LeadSource || 'N/A',
            owner: c.Contact_Owner || 'N/A',
            status: c.Status || (c.Active_Flag ? 'Active' : 'Inactive')
          }))
          : []),
      notesList: Array.isArray(apiNotesRaw) ? apiNotesRaw.map((n: any) => ({
        id: n.id?.toString() || '',
        content: n.Notes || '',
        date: n.Created_Date ? new Date(n.Created_Date).toLocaleDateString() + ' ' + new Date(n.Created_Date).toLocaleTimeString() : '',
        user: n.Created_By?.username || n.Created_By?.toString() || 'System'
      })) : [],
      timeline: [],
      createdAt: found.Created_Date || '',
      updatedAt: found.Updated_Date || found.Created_Date || ''
    };
  }, [id, storeCompany, apiCompanyRaw, apiNotesRaw, apiContactsRaw]);

  const contactColumns = useMemo<ColumnConfig<any>[]>(() => [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5 text-left">
          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 font-extrabold flex items-center justify-center text-xs">
            {row.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-bold text-slate-850 dark:text-slate-200">{row.name}</p>
            {row.contactId && (
              <span className="text-[10px] font-mono text-slate-400 block">{row.contactId}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role / Department',
      sortable: true,
      render: (row: any) => (
        <div className="text-left">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{row.role}</span>
          {row.department && (
            <span className="text-slate-400 block text-[10px] mt-0.5">{row.department}</span>
          )}
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row: any) => (
        <a href={`mailto:${row.email}`} className="text-slate-650 hover:text-primary dark:text-slate-400 transition-colors text-left block truncate max-w-[200px]">
          {row.email}
        </a>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      render: (row: any) => (
        <a href={`tel:${row.phone}`} className="text-slate-650 hover:text-primary dark:text-slate-400 transition-colors text-left block">
          {row.phone}
        </a>
      )
    },
    {
      key: 'leadSource',
      header: 'Source',
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-500 font-semibold text-left block">{row.leadSource}</span>
      )
    },
    {
      key: 'owner',
      header: 'Owner',
      sortable: true,
      render: (row: any) => (
        <span className="text-slate-500 font-semibold text-left block">{row.owner}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: any) => {
        const isActive = row.status === 'Active';
        return (
          <span className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
            isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-indigo-900/30"
              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-750"
          )}>
            {row.status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (row: any, index: number) => (
        <Button
          variant="ghost"
          onClick={() => {
            const list = (company?.contacts || []).filter((_, cIdx) => cIdx !== index);
            updateCompany(company!.id, { contacts: list });
            toast.success('Contact removed');
          }}
          className="h-7 px-3 text-red-500 hover:text-red-750 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 rounded-[5px] cursor-pointer"
        >
          Remove
        </Button>
      )
    }
  ], [company, updateCompany]);

  const displayFiles = useMemo(() => {
    const list = [...filesList];
    if (company?.file) {
      let fileUrl = company.file;
      if (!fileUrl.startsWith('http')) {
        const tenant = getTenantName();
        const cleanFile = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
        fileUrl = `${BASE_URL}/${tenant}${cleanFile}`;
      }
      const exists = list.some(f => f.id === 'API-FILE' || f.url === fileUrl);
      if (!exists) {
        list.unshift({
          id: 'API-FILE',
          name: company.fileName || 'Uploaded_Document.pdf',
          size: 'Uploaded',
          date: company.createdAt ? formatDate(company.createdAt) : 'N/A',
          uploader: company.owner || 'System',
          url: fileUrl
        });
      }
    }
    return list;
  }, [filesList, company?.file, company?.fileName, company?.createdAt, company?.owner]);

  // 2. Fetch Deal Overview using useQuery
  const { data: apiDealsRaw, isLoading: loadingDeals } = useQuery({
    queryKey: ['accountDealOverview', id],
    queryFn: () => fetchAccountdealoverview(id),
    enabled: !!id,
  });

  // Map dynamic Deals Overview data & Summary KPIs
  const { displayDeals, apiSummary } = useMemo(() => {
    let mapped: CompanyDeal[] = [];
    let summary: any = null;
    if (apiDealsRaw) {
      if (apiDealsRaw.Summary) {
        summary = apiDealsRaw.Summary;
      }
      const dealsList = apiDealsRaw.Deal_List || apiDealsRaw.results || (Array.isArray(apiDealsRaw) ? apiDealsRaw : []);
      if (Array.isArray(dealsList)) {
        mapped = dealsList.map((d: any) => ({
          id: d.id?.toString() || `DL-${Math.random().toString(36).substr(2, 9)}`,
          dealName: d.Deal_Name || d.dealName || 'N/A',
          stage: d.Deal_Stage || d.stage || 'Qualification',
          dealValue: d.Amount || d.ApproxDealAmount || d.dealValue || 0,
          expectedClose: d.ExpClosing_Date ? new Date(d.ExpClosing_Date).toISOString().split('T')[0] : (d.expectedClose || 'N/A'),
          owner: d.Lead_Name || d.Deal_Owner || d.owner || 'Unassigned'
        }));
      }
    }
    const finalDeals = mapped.length > 0 || !loadingDeals ? mapped : (company?.deals || []);
    return { displayDeals: finalDeals, apiSummary: summary };
  }, [apiDealsRaw, company?.deals, loadingDeals]);

  const getTabLabel = (tab: TabType) => {
    if (!company) return tab;
    switch (tab) {
      case 'Overview':
        return 'Overview';
      case 'Contacts':
        return `Contacts (${company.contacts?.length || 0})`;
      case 'Deals':
        return `Deals (${loadingDeals ? '...' : displayDeals.length})`;
      case 'Activities':
        return `Activities (${loadingActivities ? '...' : (apiActivitiesRaw?.length || 0)})`;
      case 'Notes':
        return `Notes (${company.notesList?.length || 0})`;
      case 'Files':
        return `Files (${displayFiles.length})`;
      case 'Invoices':
        return `Invoices (${loadingInvoices ? '...' : (apiInvoicesRaw?.results?.length || apiInvoicesRaw?.length || 0)})`;
      case 'Emails': {
        const sc = Array.isArray(apiSentEmailsRaw) ? apiSentEmailsRaw.length : 0;
        const ic = Array.isArray(apiInboxEmailsRaw) ? apiInboxEmailsRaw.length : 0;
        return `Emails (${sc + ic})`;
      }
      case 'Appointments':
        return `Appointments (${companyMeetingsState.length})`;
      default:
        return tab;
    }
  };

  if (loadingCompany && !storeCompany) {
    return (
      <div className="space-y-6 text-left animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-4" />
        <div className="flex items-center gap-4 py-3 border-b dark:border-slate-800">
          <Skeleton className="h-14 w-14 rounded-[5px]" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-5 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-[5px]" />
          ))}
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-32 w-full rounded-[5px]" />
          <Skeleton className="h-60 w-full rounded-[5px]" />
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500 animate-bounce" />
        <h2 className="text-xl font-bold">Company Profile Not Found</h2>
        <p className="text-slate-400 text-sm">The company you are looking for does not exist or has been deleted.</p>
        <Button onClick={() => router.push('/companies')} style={{ backgroundColor: primaryColor }} className="text-white rounded-[5px] h-9.5 px-5 cursor-pointer">
          Back to Companies
        </Button>
      </div>
    );
  }

  // KPI calculations
  const totalDeals = apiSummary?.Total_Deals ?? displayDeals.length;
  const pipelineValue = apiSummary?.Total_Pipeline_Value ?? displayDeals.reduce((acc, d) => acc + d.dealValue, 0);
  const wonDeals = apiSummary?.Won_Deals ?? displayDeals.filter(d => d.stage === 'Closed Won').length;
  const lostDeals = apiSummary?.Lost_Deals ?? displayDeals.filter(d => d.stage === 'Closed Lost').length;

  // Add Contact Handler
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactEmail.trim() || !newContactPhone.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const newContact: CompanyContact = {
      name: newContactName.trim(),
      role: newContactRole,
      email: newContactEmail.trim(),
      phone: newContactPhone.trim()
    };

    const newTimelineItem: CompanyTimelineItem = {
      id: `TL-${Date.now()}`,
      type: 'Contact added',
      details: `Added new contact person "${newContact.name}" (${newContact.role})`,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      user: company.owner
    };

    updateCompany(company.id, {
      contacts: [...(company.contacts || []), newContact],
      timeline: [newTimelineItem, ...(company.timeline || [])]
    });

    toast.success(`Contact person ${newContact.name} added successfully.`);
    setIsContactDialogOpen(false);
    // Reset Form
    setNewContactName('');
    setNewContactRole('Manager');
    setNewContactEmail('');
    setNewContactPhone('');
  };

  // Add Deal Handler
  const handleAddDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dealValueParsed = parseFloat(newDealValue);
    if (!newDealName.trim() || isNaN(dealValueParsed) || !newDealExpectedClose) {
      toast.error('Please enter valid deal details');
      return;
    }

    const newDeal: CompanyDeal = {
      id: `DL-${String(Date.now()).slice(-4)}`,
      dealName: newDealName.trim(),
      stage: newDealStage,
      dealValue: dealValueParsed,
      expectedClose: new Date(newDealExpectedClose).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      owner: newDealOwner
    };

    const newTimelineItem: CompanyTimelineItem = {
      id: `TL-${Date.now()}`,
      type: 'Deal created',
      details: `Created new deal "${newDeal.dealName}" worth ৳ ${newDeal.dealValue.toLocaleString('en-IN')}`,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
      user: company.owner
    };

    updateCompany(company.id, {
      deals: [...(company.deals || []), newDeal],
      timeline: [newTimelineItem, ...(company.timeline || [])]
    });

    toast.success(`Deal ${newDeal.dealName} added successfully.`);
    setIsDealDialogOpen(false);
    // Reset Form
    setNewDealName('');
    setNewDealStage('Qualification');
    setNewDealValue('');
    setNewDealExpectedClose('');
  };

  // Add Activity Handler
  const handleAddActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTask.trim()) {
      toast.error('Task title is required');
      return;
    }

    try {
      const payload: ApiAccountActivity = {
        AccountActivities_Id: false,
        Account_Id: typeof id === 'string' ? parseInt(id, 10) : id,
        Activity_Type: newActivityType,
        Expected_Date: newActivityExpectedDate,
        Expected_Time: newActivityExpectedTime,
        Organization_Id: 1,
        Reminder_Payload: null,
        Task: newActivityTask.trim(),
        Task_Description: newActivityDescription.trim() || '<p></p>',
        Created_By: String(finalUserId),
        Updated_By: String(finalUserId)
      };

      await createAccountActivity(payload);
      toast.success(`Activity "${payload.Task}" added successfully.`);
      setIsActivityDialogOpen(false);

      // Reset Form
      setNewActivityTask('');
      setNewActivityDescription('');
      setNewActivityType('Call');
      setNewActivityExpectedDate(new Date().toISOString().split('T')[0]);
      setNewActivityExpectedTime('09:00');

      refetchActivities();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create activity');
    }
  };

  // Add Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!noteSubject.trim()) {
      setNoteSubjectError('Subject is required');
      hasError = true;
    } else {
      setNoteSubjectError('');
    }

    if (!noteInput.trim()) {
      setNoteContentError('Note details are required');
      hasError = true;
    } else {
      setNoteContentError('');
    }

    if (hasError) return;

    setIsSubmittingNote(true);
    try {
      const payload = {
        Organization_Id: 1,
        Account_Id: typeof id === 'string' ? parseInt(id, 10) : id,
        Subject: noteSubject.trim(),
        Notes: noteInput.trim(),
        Active_Flag: true,
        Is_Deleted: false,
        Created_By: finalUserId,
        Updated_By: finalUserId
      };

      await createAccountNote(payload);
      toast.success('Note added successfully!');
      setNoteSubject('');
      setNoteInput('');
      setNoteSubjectError('');
      setNoteContentError('');
      refetchNotes();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Add Tag Handler
  const handleAddTag = async () => {
    if (!company) return;
    if (tagInput.trim() && !company.tags?.includes(tagInput.trim())) {
      const updatedTags = [...(company.tags || []), tagInput.trim()];

      try {
        const formData = new FormData();

        // Copy all metadata from apiCompanyRaw
        if (apiCompanyRaw && typeof apiCompanyRaw === 'object') {
          Object.keys(apiCompanyRaw).forEach((key) => {
            if (key === 'File' || key === 'FileName' || key === 'Tags' || key === 'Attachment' || key === 'attachments' || key === 'Address') return;
            const val = apiCompanyRaw[key];
            if (val === null || val === undefined) return;
            if (typeof val === 'object') {
              if ('id' in val && val.id !== undefined && val.id !== null) {
                formData.append(key, val.id.toString());
              } else {
                formData.append(key, JSON.stringify(val));
              }
            } else {
              formData.append(key, val.toString());
            }
          });
        } else {
          // Fallback to client-side company object fields
          formData.append('Organization_Name', company.companyName || '');
          formData.append('Active_Flag', (company.status === 'Active').toString());
          formData.append('Industry', company.industry || '');
          formData.append('Phone_Number', company.phone || '');
          formData.append('Mail', company.email || '');
          formData.append('Website', company.website || '');
          formData.append('Employees', company.employeeSize || '0');
          formData.append('Turn_Over', company.annualRevenue || '0');
          formData.append('Client_Type', company.companyType || '');
          formData.append('Location', company.location || '');
          formData.append('Country', company.country || '');
          formData.append('City', company.city || '');
          formData.append('Address', JSON.stringify(company.address || ''));
          formData.append('Lead_Source', company.source || '');
          formData.append('Account_Owner', company.owner || '');
          formData.append('About', company.about || company.notes || '');
        }

        // Explicitly set the required validation values
        const orgIdVal = apiCompanyRaw?.Organization_Id || 1;
        const accIdVal = apiCompanyRaw?.Account_Id || apiCompanyRaw?.id || id;
        const createdByVal = apiCompanyRaw?.Created_By?.id || apiCompanyRaw?.Created_By || finalUserId;
        const notesIdVal = apiCompanyRaw?.AccountNotes_Id || '';

        formData.set('Organization_Id', orgIdVal.toString());
        formData.set('Account_Id', accIdVal.toString());
        formData.set('Created_By', createdByVal.toString());
        formData.set('AccountNotes_Id', notesIdVal.toString());
        formData.set('Address', JSON.stringify(company.address || ''));

        // Append the new tags list as a JSON string
        formData.append('Tags', JSON.stringify(updatedTags));

        // Call API (using PUT)
        await updateAccountCRUD(id, formData);

        // Update local state / store
        const newTimelineItem: CompanyTimelineItem = {
          id: `TL-${Date.now()}`,
          type: 'Tag added',
          details: `Added new tag "${tagInput.trim()}"`,
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
          user: company.owner || 'System'
        };

        updateCompany(company.id, {
          tags: updatedTags,
          timeline: [newTimelineItem, ...(company.timeline || [])]
        });

        toast.success(`Tag "${tagInput.trim()}" added successfully.`);
        setTagInput('');
        setShowTagInput(false);

        // Invalidate queries so TanStack Query fetches the latest company details
        await queryClient.invalidateQueries({ queryKey: ['accountCRUD', id] });
      } catch (err: any) {
        toast.error(err.message || 'Failed to add tag');
      }
    }
  };



  const handleOpenComposeMail = () => {
    const primaryContactEmail = company?.contacts?.[0]?.email;
    setEmailTo(company?.email || primaryContactEmail || '');
    setEmailCc('');
    setEmailSubject('');
    setEmailContent('');
    setEmailFiles([]);
    // Read sender email from localStorage userData
    const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('userData') : null;
    const userEmail = userDataStr ? (JSON.parse(userDataStr)?.email || '') : '';
    setEmailFrom(userEmail);
    setIsComposeMailOpen(true);
  };

  const getRandomHexColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleGenerateAiEmail = async () => {
    if (!emailSubject.trim()) {
      toast.error('Please enter a subject to generate email content using AI');
      return;
    }
    setIsGeneratingAiEmail(true);
    try {
      const res = await generateEmailContent(emailSubject.trim());
      const aiResult = res?.Result || res?.result || res?.data?.Result || (typeof res === 'string' ? res : '');
      if (aiResult) {
        setEmailContent(aiResult);
        toast.success('AI Email content generated successfully!');
      } else {
        toast.error('No email content returned from AI');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate AI email content');
      console.error(err);
    } finally {
      setIsGeneratingAiEmail(false);
    }
  };

  const handleSubmitMail = async () => {
    if (!emailTo.trim()) {
      toast.error('Recipient email is required.');
      return;
    }
    if (!emailSubject.trim()) {
      toast.error('Subject is required.');
      return;
    }
    if (!emailContent.trim()) {
      toast.error('Email content is required.');
      return;
    }

    setIsSendingMail(true);
    try {
      const orgId = typeof window !== 'undefined' ? localStorage.getItem('OrganizationId') : null;
      const userId = typeof window !== 'undefined' ? localStorage.getItem('UserId') : null;
      const userDetailsStr = typeof window !== 'undefined' ? localStorage.getItem('UserDetails') : null;
      const senderMail = userDetailsStr ? JSON.parse(userDetailsStr)?.email : '';

      // 1. Upload attachments
      const uploadedFileNames: string[] = [];
      for (const file of emailFiles) {
        const base64 = await fileToBase64(file);
        const uniqueName = getRandomHexColor() + file.name;

        await uploadUserFileAndUrl({
          Organization_Id: orgId ? parseInt(orgId, 10) : 1,
          File: base64,
          FileName: uniqueName,
          Urls: 'url',
          Description: 'Upload File',
          Created_By: userId ? parseInt(userId, 10) : 1,
          Updated_By: userId ? parseInt(userId, 10) : 1,
        });

        uploadedFileNames.push(uniqueName);
      }

      // 2. Build email body HTML content
      const mailBodyContent = `
<div class='card'>
  <div class='card-body'>
    <h4 class="card-subtitle mb-2 text-muted">Dear Sir,</h4>
    <div class='card-text'>
      <p>${emailContent.replace(/\n/g, '<br />')}</p>
      ${uploadedFileNames.length > 0 ? `
      <p>Click the button to download the attachment</p>
      <div>
        ${uploadedFileNames.map((name) => `
          <a href="${BASE_URL}/media/${name}" target="_blank">
            <button
              type="button"
              style="
                background-color:#3c7c33; 
                color: #fff; 
                border: none; 
                border-radius: 4px; 
                padding: 8px 16px; 
                cursor: pointer;
                text-decoration: none;
              "
            >
              Download ${name.slice(7)}
            </button>
          </a>
        `).join('')}
      </div>` : ''}
    </div>
  </div>
</div>`;

      // 3. Post payload to AccountMailMasterCRUD
      const payload = {
        MailSubject: emailSubject,
        Organization_Id: orgId ? parseInt(orgId, 10) : 1,
        MailBody: mailBodyContent,
        file: uploadedFileNames,
        RecevierMailId: emailTo,
        MailId: senderMail,
        UserId: userId ? parseInt(userId, 10) : 1,
        Contact_Id: id ? parseInt(id, 10) : null,
        Account_Id: id ? parseInt(id, 10) : null,
        Cc: emailCc.trim() ? [emailCc.trim()] : [],
      };

      await createAccountMailMaster(payload);

      toast.success('Mail sent successfully!');

      // Reset form and close dialog
      setEmailTo('');
      setEmailCc('');
      setEmailSubject('');
      setEmailContent('');
      setEmailFiles([]);
      setIsComposeMailOpen(false);

      // Invalidate queries to reload sent list
      queryClient.invalidateQueries({ queryKey: ['accountSentMails', id] });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to send mail: ' + (err?.message || 'Error occurred'));
    } finally {
      setIsSendingMail(false);
    }
  };

  const renderAttachments = (fileField: any) => {
    if (!fileField) return null;
    let files: string[] = [];
    if (Array.isArray(fileField)) {
      files = fileField;
    } else if (typeof fileField === 'string') {
      try {
        const parsed = JSON.parse(fileField);
        if (Array.isArray(parsed)) {
          files = parsed;
        } else {
          files = [fileField];
        }
      } catch {
        if (fileField.startsWith('[') && fileField.endsWith(']')) {
          const clean = fileField.slice(1, -1).replace(/['"]/g, '');
          files = clean.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          files = fileField.split(',').map(s => s.trim()).filter(Boolean);
        }
      }
    }

    if (files.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {files.map((filename, idx) => {
          const displayName = filename.startsWith('#') && filename.length > 7 ? filename.slice(7) : filename;
          return (
            <a
              key={idx}
              href={`${BASE_URL}/media/${filename}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-55/50 dark:bg-slate-805 text-[11px] font-semibold rounded-[5px] border dark:border-slate-800 hover:text-primary hover:border-primary/20 transition-all text-slate-655 dark:text-slate-350"
            >
              <FileText className="h-3 w-3 text-slate-400" />
              <span>{displayName}</span>
            </a>
          );
        })}
      </div>
    );
  };

  const formatEmailDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return formatDate(dateStr);
  };

  // Remove Tag Handler
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!company) return;
    const updatedTags = (company.tags || []).filter(t => t !== tagToRemove);

    try {
      const formData = new FormData();

      // Copy all metadata from apiCompanyRaw
      if (apiCompanyRaw && typeof apiCompanyRaw === 'object') {
        Object.keys(apiCompanyRaw).forEach((key) => {
          if (key === 'File' || key === 'FileName' || key === 'Tags' || key === 'Attachment' || key === 'attachments' || key === 'Address') return;
          const val = apiCompanyRaw[key];
          if (val === null || val === undefined) return;
          if (typeof val === 'object') {
            if ('id' in val && val.id !== undefined && val.id !== null) {
              formData.append(key, val.id.toString());
            } else {
              formData.append(key, JSON.stringify(val));
            }
          } else {
            formData.append(key, val.toString());
          }
        });
      } else {
        // Fallback to client-side company object fields
        formData.append('Organization_Name', company.companyName || '');
        formData.append('Active_Flag', (company.status === 'Active').toString());
        formData.append('Industry', company.industry || '');
        formData.append('Phone_Number', company.phone || '');
        formData.append('Mail', company.email || '');
        formData.append('Website', company.website || '');
        formData.append('Employees', company.employeeSize || '0');
        formData.append('Turn_Over', company.annualRevenue || '0');
        formData.append('Client_Type', company.companyType || '');
        formData.append('Location', company.location || '');
        formData.append('Country', company.country || '');
        formData.append('City', company.city || '');
        formData.append('Address', JSON.stringify(company.address || ''));
        formData.append('Lead_Source', company.source || '');
        formData.append('Account_Owner', company.owner || '');
        formData.append('About', company.about || company.notes || '');
      }

      // Explicitly set the required validation values
      const orgIdVal = apiCompanyRaw?.Organization_Id || 1;
      const accIdVal = apiCompanyRaw?.Account_Id || apiCompanyRaw?.id || id;
      const createdByVal = apiCompanyRaw?.Created_By?.id || apiCompanyRaw?.Created_By || finalUserId;
      const notesIdVal = apiCompanyRaw?.AccountNotes_Id || '';

      formData.set('Organization_Id', orgIdVal.toString());
      formData.set('Account_Id', accIdVal.toString());
      formData.set('Created_By', createdByVal.toString());
      formData.set('AccountNotes_Id', notesIdVal.toString());
      formData.set('Address', JSON.stringify(company.address || ''));

      // If updatedTags is empty, we send null (or empty string/list as requested: "when deleting, use post to pass null")
      if (updatedTags.length === 0) {
        formData.append('Tags', 'null');
      } else {
        formData.append('Tags', JSON.stringify(updatedTags));
      }

      // Call API (using PUT)
      await updateAccountCRUD(id, formData);

      // Update local state / store
      const newTimelineItem: CompanyTimelineItem = {
        id: `TL-${Date.now()}`,
        type: 'Tag removed',
        details: `Removed tag "${tagToRemove}"`,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        user: company.owner || 'System'
      };

      updateCompany(company.id, {
        tags: updatedTags,
        timeline: [newTimelineItem, ...(company.timeline || [])]
      });

      toast.success(`Tag "${tagToRemove}" removed.`);

      // Invalidate queries so TanStack Query fetches the latest company details
      await queryClient.invalidateQueries({ queryKey: ['accountCRUD', id] });
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove tag');
    }
  };


  // File Upload Submit
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!newFileName.trim()) {
      toast.error('Please specify a file name');
      return;
    }
    if (!company) {
      toast.error('Company details are not loaded');
      return;
    }

    const fileUploadPromise = async () => {
      const formData = new FormData();

      // Copy all metadata from apiCompanyRaw (Django Model Backend requires them to prevent validation issues)
      if (apiCompanyRaw && typeof apiCompanyRaw === 'object') {
        Object.keys(apiCompanyRaw).forEach((key) => {
          if (key === 'File' || key === 'FileName' || key === 'Attachment' || key === 'attachments' || key === 'Address') return;
          const val = apiCompanyRaw[key];
          if (val === null || val === undefined) return;
          if (typeof val === 'object') {
            if ('id' in val && val.id !== undefined && val.id !== null) {
              formData.append(key, val.id.toString());
            } else {
              formData.append(key, JSON.stringify(val));
            }
          } else {
            formData.append(key, val.toString());
          }
        });
      } else {
        // Fallback to client-side company object fields
        formData.append('Organization_Name', company.companyName || '');
        formData.append('Active_Flag', (company.status === 'Active').toString());
        formData.append('Industry', company.industry || '');
        formData.append('Phone_Number', company.phone || '');
        formData.append('Mail', company.email || '');
        formData.append('Website', company.website || '');
        formData.append('Employees', company.employeeSize || '0');
        formData.append('Turn_Over', company.annualRevenue || '0');
        formData.append('Client_Type', company.companyType || '');
        formData.append('Location', company.location || '');
        formData.append('Country', company.country || '');
        formData.append('City', company.city || '');
        formData.append('Address', JSON.stringify(company.address || ''));
        formData.append('Lead_Source', company.source || '');
        formData.append('Account_Owner', company.owner || '');
        formData.append('Tags', JSON.stringify(company.tags || []));
        formData.append('About', company.about || company.notes || '');
      }

      // Explicitly set the required validation values requested by the user
      const orgIdVal = apiCompanyRaw?.Organization_Id || 1;
      const accIdVal = apiCompanyRaw?.Account_Id || apiCompanyRaw?.id || id;
      const createdByVal = apiCompanyRaw?.Created_By?.id || apiCompanyRaw?.Created_By || finalUserId;
      const notesIdVal = apiCompanyRaw?.AccountNotes_Id || '';

      formData.set('Organization_Id', orgIdVal.toString());
      formData.set('Account_Id', accIdVal.toString());
      formData.set('Created_By', createdByVal.toString());
      formData.set('AccountNotes_Id', notesIdVal.toString());
      formData.set('Address', JSON.stringify(company.address || ''));

      // Append selected file and file name
      formData.append('File', selectedFile);
      formData.append('FileName', newFileName.trim());

      // API Call (using PUT)
      await updateAccountCRUD(id, formData);

      // Invalidate queries so that TanStack Query fetches the latest company details
      await queryClient.invalidateQueries({ queryKey: ['accountCRUD', id] });

      // Update timeline/store
      const newTimelineItem: CompanyTimelineItem = {
        id: `TL-${Date.now()}`,
        type: 'File uploaded',
        details: `Uploaded file "${newFileName.trim()}"`,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        user: company.owner || 'System'
      };

      updateCompany(company.id, {
        file: `/media/accounts/${selectedFile.name}`,
        fileName: newFileName.trim(),
        timeline: [newTimelineItem, ...(company.timeline || [])]
      });
    };

    toast.promise(fileUploadPromise(), {
      loading: 'Uploading document...',
      success: () => {
        setIsFileDialogOpen(false);
        setSelectedFile(null);
        setNewFileName('');
        return `File "${newFileName.trim()}" uploaded successfully.`;
      },
      error: (err: any) => {
        return err.message || 'Failed to upload document';
      }
    });
  };

  const handleFileDelete = async (fileId: string) => {
    if (!company) return;

    if (fileId === 'API-FILE') {
      const fileDeletePromise = async () => {
        const formData = new FormData();

        // Copy all metadata from apiCompanyRaw
        if (apiCompanyRaw && typeof apiCompanyRaw === 'object') {
          Object.keys(apiCompanyRaw).forEach((key) => {
            if (key === 'File' || key === 'FileName' || key === 'Attachment' || key === 'attachments' || key === 'Address') return;
            const val = apiCompanyRaw[key];
            if (val === null || val === undefined) return;
            if (typeof val === 'object') {
              if ('id' in val && val.id !== undefined && val.id !== null) {
                formData.append(key, val.id.toString());
              } else {
                formData.append(key, JSON.stringify(val));
              }
            } else {
              formData.append(key, val.toString());
            }
          });
        } else {
          // Fallback to client-side company object fields
          formData.append('Organization_Name', company.companyName || '');
          formData.append('Active_Flag', (company.status === 'Active').toString());
          formData.append('Industry', company.industry || '');
          formData.append('Phone_Number', company.phone || '');
          formData.append('Mail', company.email || '');
          formData.append('Website', company.website || '');
          formData.append('Employees', company.employeeSize || '0');
          formData.append('Turn_Over', company.annualRevenue || '0');
          formData.append('Client_Type', company.companyType || '');
          formData.append('Location', company.location || '');
          formData.append('Country', company.country || '');
          formData.append('City', company.city || '');
          formData.append('Address', JSON.stringify(company.address || ''));
          formData.append('Lead_Source', company.source || '');
          formData.append('Account_Owner', company.owner || '');
          formData.append('Tags', JSON.stringify(company.tags || []));
          formData.append('About', company.about || company.notes || '');
        }

        // Explicitly set the required validation values requested by the user
        const orgIdVal = apiCompanyRaw?.Organization_Id || 1;
        const accIdVal = apiCompanyRaw?.Account_Id || apiCompanyRaw?.id || id;
        const createdByVal = apiCompanyRaw?.Created_By?.id || apiCompanyRaw?.Created_By || finalUserId;
        const notesIdVal = apiCompanyRaw?.AccountNotes_Id || '';

        formData.set('Organization_Id', orgIdVal.toString());
        formData.set('Account_Id', accIdVal.toString());
        formData.set('Created_By', createdByVal.toString());
        formData.set('AccountNotes_Id', notesIdVal.toString());
        formData.set('Address', JSON.stringify(company.address || ''));

        // Send File as 'null' (since FormData stringifies, we pass 'null' as requested) and FileName as empty
        formData.append('File', 'null');
        formData.append('FileName', '');

        // Call API (using PUT)
        await updateAccountCRUD(id, formData);

        // Update timeline/store
        const newTimelineItem: CompanyTimelineItem = {
          id: `TL-${Date.now()}`,
          type: 'File deleted',
          details: `Deleted file "${company.fileName || 'document'}"`,
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
          user: company.owner || 'System'
        };

        updateCompany(company.id, {
          file: null,
          fileName: null,
          timeline: [newTimelineItem, ...(company.timeline || [])]
        });

        // Invalidate cache
        await queryClient.invalidateQueries({ queryKey: ['accountCRUD', id] });
      };

      toast.promise(fileDeletePromise(), {
        loading: 'Deleting file...',
        success: 'File deleted successfully.',
        error: (err: any) => err.message || 'Failed to delete file'
      });
    } else {
      // Mock list deletion
      setFilesList(filesList.filter(f => f.id !== fileId));

      const newTimelineItem: CompanyTimelineItem = {
        id: `TL-${Date.now()}`,
        type: 'File deleted',
        details: `Deleted file`,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
        user: company.owner || 'System'
      };

      updateCompany(company.id, {
        timeline: [newTimelineItem, ...(company.timeline || [])]
      });

      toast.success('Document deleted');
    }
  };

  if (!canViewCompanyOverview) {
    return null;
  }

  return (
    <div className="space-y-6 text-left">      {/* Top Header Row with Back Button & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-55 dark:hover:bg-slate-800 shrink-0 cursor-pointer"
            onClick={() => router.push('/companies')}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
              <span className="cursor-pointer hover:text-slate-600 transition-colors" onClick={() => router.push('/companies')}>Companies</span>
              <span>&gt;</span>
              <span>Company Overview</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Company Overview</h1>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2">


          <Button
            variant="outline"
            onClick={() => setIsContactDialogOpen(true)}
            className="h-9 px-3.5 gap-1.5 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Contact
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsDealDialogOpen(true)}
            className="h-9 px-3.5 gap-1.5 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Briefcase className="h-4 w-4" /> Add Deal
          </Button>

          <Button
            variant="outline"
            onClick={handleOpenComposeMail}
            className="h-9 px-3.5 gap-1.5 border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Mail className="h-4 w-4" /> Send Email
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button
                style={{ backgroundColor: primaryColor }}
                className="text-white font-bold h-9 px-4 rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs gap-1 cursor-pointer"
              >
                More <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-805 rounded-xl p-1">
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => setIsFileDialogOpen(true)}>
                <UploadCloud className="h-3.5 w-3.5 text-slate-455" /> Upload File
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => setIsActivityDialogOpen(true)}>
                <CheckCircle className="h-3.5 w-3.5 text-slate-455" /> Add Activity
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer text-xs text-red-650 dark:text-rose-455"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${company.companyName}?`)) {
                    deleteCompany(company.id);
                    toast.success('Company profile deleted');
                    router.push('/companies');
                  }
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" /> Delete Company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xs p-6 flex flex-col lg:flex-row gap-6 justify-between items-start">
        {/* Left Side: Avatar & Core info */}
        <div className="flex gap-4 items-start w-full lg:w-auto">
          <div
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            className="h-16 w-16 rounded-full flex items-center justify-center font-extrabold text-xl shrink-0"
          >
            {company.companyName ? company.companyName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CO'}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{company.companyName}</h2>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-md font-bold text-[10px] uppercase tracking-wider py-0.5 px-2 px-2 border-transparent",
                  company.status === 'Active'
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                    : "bg-slate-105 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {company.status}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {company.industry} &bull; {company.companyType || 'Corporate'}
            </p>
            <div className="space-y-1.5 pt-1 text-slate-655 dark:text-slate-400 font-medium text-xs">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                <a href={`mailto:${company.email}`} className="hover:text-blue-500 transition-colors font-semibold text-left">{company.email}</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                <span className="font-semibold">{company.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                <span className="font-semibold">{company.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Grid: Metadata Fields */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full lg:w-auto lg:flex-1 max-w-2xl px-2 lg:px-6 py-4 lg:py-0 border-y lg:border-y-0 lg:border-x dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company Owner</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn("h-5 w-5 rounded-full text-white font-bold flex items-center justify-center text-[9px] shrink-0 font-sans", getOwnerAvatarBg(company.owner || ''))}>
                {company.owner ? company.owner.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'UN'}
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{company.owner || 'Unassigned'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created On</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-1">{formatDate(company.createdAt)}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Modified</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-1">{formatDate(company.updatedAt || company.createdAt)}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Employees</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-1">{company.employeeSize || '0'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Annual Revenue</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-1">
              {company.annualRevenue ? (company.annualRevenue.includes('৳') ? company.annualRevenue : `৳ ${company.annualRevenue}`) : '৳ 0'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Website</span>
            {company.website ? (
              <a
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block mt-1 truncate max-w-[150px]"
              >
                {company.website}
              </a>
            ) : (
              <span className="text-xs font-semibold text-slate-500 block mt-1">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="space-y-6">

        {/* Tabs Menu Navigation Bar */}
        <div className="border-b dark:border-slate-800 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
          {(['Overview', 'Contacts', 'Deals', 'Activities', 'Notes', 'Files', 'Invoices', 'Emails'] as TabType[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer relative ${isActive ? 'border-primary text-primary' : 'border-transparent text-slate-405 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                style={isActive ? { borderBottomColor: primaryColor, color: primaryColor } : {}}
              >
                {getTabLabel(tab)}
              </button>
            );
          })}
        </div>

        {/* Main Tab Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
            >
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'Overview' && (
                <div className="space-y-6">
                  {/* KPI Stats Row inside Overview Tab */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs border dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Deals</span>
                        {loadingDeals ? (
                          <Skeleton className="h-7 w-12 mt-1 rounded-md" />
                        ) : (
                          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">{totalDeals}</p>
                        )}
                      </div>
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
                        <Briefcase className="h-4.5 w-4.5 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs border dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Value</span>
                        {loadingDeals ? (
                          <Skeleton className="h-7 w-24 mt-1 rounded-md" />
                        ) : (
                          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">৳ {pipelineValue.toLocaleString('en-IN')}</p>
                        )}
                      </div>
                      <div className="p-2.5 bg-amber-50 dark:bg-amber-955/30 rounded-xl">
                        <TrendingUp className="h-4.5 w-4.5 text-amber-500" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs border dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Won Deals</span>
                        {loadingDeals ? (
                          <Skeleton className="h-7 w-12 mt-1 rounded-md" />
                        ) : (
                          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">{wonDeals}</p>
                        )}
                      </div>
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-955/30 rounded-xl">
                        <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 flex items-center justify-between shadow-2xs border dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lost Deals</span>
                        {loadingDeals ? (
                          <Skeleton className="h-7 w-12 mt-1 rounded-md" />
                        ) : (
                          <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">{lostDeals}</p>
                        )}
                      </div>
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-955/30 rounded-xl">
                        <AlertCircle className="h-4.5 w-4.5 text-rose-505" />
                      </div>
                    </div>
                  </div>

                  {/* Unified Card: About, Metadata Grid, and Tags */}
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <CardContent className="p-8 space-y-6">
                      {/* About Company */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">About Company</h3>

                        </div>

                        {isEditingAbout ? (
                          <div className="space-y-3 mt-1 max-w-[800px]">
                            <Textarea
                              value={aboutInput}
                              onChange={(e) => setAboutInput(e.target.value)}
                              rows={4}
                              className="rounded-[5px] text-xs resize-none"
                              placeholder="Add about company note..."
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={handleSaveAbout}
                                style={{ backgroundColor: primaryColor }}
                                className="text-white font-bold h-8 px-4 text-xs rounded-[5px] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsEditingAbout(false);
                                  setAboutInput(company.about || company.notes || '');
                                }}
                                className="h-8 px-4 text-xs rounded-[5px] border-slate-200 dark:border-slate-800 cursor-pointer font-bold"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[13px] text-slate-500 dark:text-slate-405 leading-relaxed font-normal mt-1">
                            {company.about || company.notes || 'No overview summary is added. Click the edit icon to provide notes about this customer account.'}
                          </p>
                        )}
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 text-[13px]   pt-6">

                        {/* Left Column */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Company Name</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.companyName}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Industry</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.industry}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Phone</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.phone}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Land Line</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.landLine || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Fax</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.fax || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Email</span>
                            <a href={`mailto:${company.email}`} className="font-semibold text-slate-850 dark:text-slate-200 hover:text-primary hover:underline">{company.email}</a>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Website</span>
                            <a
                              href={company.website ? (company.website.startsWith('http') ? company.website : `https://${company.website}`) : '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {company.website || 'N/A'}
                            </a>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Employee Size</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.employeeSize || '0'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Annual Revenue</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">
                              {company.annualRevenue ? (company.annualRevenue.includes('৳') ? company.annualRevenue : `৳ ${company.annualRevenue}`) : '৳ 0'}
                            </span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Company Type</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.companyType || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Decision Maker</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.decisionMaker ? 'Yes' : 'No'}</span>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Location</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.location}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Address</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200 leading-relaxed">
                              {formatAddress(company.address) || company.location || 'N/A'}
                            </span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Source</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.source || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Owner</span>
                            <div className="flex items-center gap-2">
                              <span className={cn("h-5 w-5 rounded-full text-white font-bold flex items-center justify-center text-[9px] shrink-0 font-sans", getOwnerAvatarBg(company.owner || ''))}>
                                {company.owner ? company.owner.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'UN'}
                              </span>
                              <span className="font-semibold text-slate-850 dark:text-slate-200">{company.owner || 'Unassigned'}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">VAT Number</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.vatNumber || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Reg Number</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.registrationNumber || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">GST No</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.gstNo || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Branch Office</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.branchOffice || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Payment Terms</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{company.paymentTerms || 'N/A'}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Coordinates</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">
                              {company.latitude && company.longitude ? (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${company.latitude},${company.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                >
                                  {company.latitude}, {company.longitude}
                                </a>
                              ) : 'N/A'}
                            </span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Created On</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{formatDate(company.createdAt)}</span>
                          </div>
                          <div className="grid grid-cols-[140px_1fr] gap-2 items-start py-0.5">
                            <span className="text-slate-400 font-semibold dark:text-slate-500">Last Updated</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-200">{formatDate(company.updatedAt || company.createdAt)}</span>
                          </div>
                        </div>

                      </div>


                    </CardContent>
                  </Card>

                  {/* Primary Contact Card */}
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <CardContent className="p-8 space-y-6">
                      <div className="flex items-center justify-between border-b dark:border-slate-850 pb-4">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Primary Contact</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Key contact person associated with this company account.</p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('Contacts')}
                          className="h-8 text-xs font-bold px-4 border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                        >
                          View All Contacts
                        </Button>
                      </div>

                      {(!company.contacts || company.contacts.length === 0) ? (
                        <div className="py-6 text-center text-xs text-slate-400 italic">No contacts added yet.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {company.contacts.slice(0, 3).map((contact: any, idx: number) => (
                            <div key={contact.id || idx} className="p-4 border border-slate-150 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-650 font-bold flex items-center justify-center text-sm dark:bg-purple-950/20 dark:text-purple-400 shrink-0">
                                  {contact.name ? contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'CN'}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-850 dark:text-slate-200 text-sm truncate">{contact.name}</p>
                                  <span className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider block mt-0.5 truncate">{contact.role || 'Primary Contact'}</span>
                                </div>
                              </div>

                              <div className="space-y-1.5 border-t border-slate-200/60 dark:border-slate-800 pt-3 text-xs">
                                {contact.email && contact.email !== 'N/A' && (
                                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 text-slate-600 hover:text-primary dark:text-slate-400 transition-colors group">
                                    <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary shrink-0" />
                                    <span className="truncate">{contact.email}</span>
                                  </a>
                                )}
                                {contact.phone && contact.phone !== 'N/A' && (
                                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 text-slate-600 hover:text-primary dark:text-slate-400 transition-colors group">
                                    <Phone className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary shrink-0" />
                                    <span className="truncate">{contact.phone}</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              )}

              {/* 2. CONTACTS TAB */}
              {activeTab === 'Contacts' && (
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Company Contacts</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Contact persons belonging to {company.companyName} who make purchasing decisions.</p>
                      </div>
                      {/* <Button 
                      onClick={() => setIsContactDialogOpen(true)}
                      style={{ backgroundColor: primaryColor }}
                      className="text-white text-xs font-bold h-9 px-4 rounded-[5px] gap-1.5 cursor-pointer flex items-center"
                    >
                      <Plus className="h-4 w-4" /> Add New Contact
                    </Button> */}
                    </div>

                    {(!company.contacts || company.contacts.length === 0) ? (
                      <div className="py-16 text-center">
                        <User className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-semibold">No contacts registered for this company.</p>
                      </div>
                    ) : (
                      <div className="w-full">
                        <ReusableTable
                          columns={contactColumns}
                          data={company.contacts}
                          showGear={true}
                          stickyHeader={false}
                          initialPageSize={10}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              {/* 3. DEALS TAB */}
              {activeTab === 'Deals' && (
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Deals & Opportunities</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Track financial pipelines, forecast values, and closing dates for {company.companyName}.</p>
                      </div>
                      {/* <Button 
                      onClick={() => setIsDealDialogOpen(true)}
                      style={{ backgroundColor: primaryColor }}
                      className="text-white text-xs font-bold h-9 px-4 rounded-[5px] gap-1.5 cursor-pointer flex items-center"
                    >
                      <Plus className="h-4 w-4" /> Add New Deal
                    </Button> */}
                    </div>

                    {loadingDeals ? (
                      <div className="space-y-3 py-4 text-left">
                        <Skeleton className="h-10 w-full rounded-[3px]" />
                        <Skeleton className="h-10 w-full rounded-[3px]" />
                        <Skeleton className="h-10 w-full rounded-[3px]" />
                        <Skeleton className="h-10 w-full rounded-[3px]" />
                      </div>
                    ) : displayDeals.length === 0 ? (
                      <div className="py-16 text-center">
                        <Briefcase className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-semibold">No deals are recorded for this client account.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <Table className="min-w-[700px] border-collapse">
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b dark:border-slate-850">
                              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Deal Name</TableHead>
                              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Stage</TableHead>
                              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Value (BDT)</TableHead>
                              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Expected Close</TableHead>
                              <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Rep</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {displayDeals.map((deal) => (
                              <TableRow key={deal.id} className="border-b dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-800/35">
                                <TableCell className="font-semibold text-xs text-slate-800 dark:text-slate-200 py-3.5">
                                  {deal.dealName}
                                  <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{deal.id}</span>
                                </TableCell>
                                <TableCell className="py-3.5">
                                  <Badge className="rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
                                    {deal.stage}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-bold text-xs text-slate-800 dark:text-white py-3.5 font-mono">৳ {deal.dealValue.toLocaleString('en-IN')}</TableCell>
                                <TableCell className="text-xs text-slate-500 dark:text-slate-455 py-3.5">{deal.expectedClose}</TableCell>
                                <TableCell className="text-xs font-semibold text-slate-700 dark:text-slate-350 py-3.5">{deal.owner}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 4. ACTIVITIES TAB */}
              {activeTab === 'Activities' && (
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Account Activities</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Schedule tasks, calls, meetings, or emails and follow up on execution.</p>
                      </div>
                      <Button
                        onClick={() => setIsActivityDialogOpen(true)}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white text-xs font-bold h-9 px-4 rounded-xl gap-1.5 cursor-pointer flex items-center"
                      >
                        <Plus className="h-4 w-4" /> Add Activity
                      </Button>
                    </div>

                    {loadingActivities ? (
                      <div className="space-y-3 py-4 text-left">
                        <Skeleton className="h-12 w-full rounded-[3px]" />
                        <Skeleton className="h-12 w-full rounded-[3px]" />
                      </div>
                    ) : (!apiActivitiesRaw || apiActivitiesRaw.length === 0) ? (
                      <div className="py-12 text-center border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                        <CheckCircle className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm font-semibold">No activities scheduled yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-[900px] text-left">
                        {apiActivitiesRaw.map((act) => (
                          <div key={act.id} className="p-4 border dark:border-slate-850 rounded-xl flex items-start justify-between relative group hover:shadow-xs bg-slate-50/20 dark:bg-slate-950/10">
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs.5 text-slate-800 dark:text-slate-200">{act.Task}</span>
                                <Badge className="rounded-[4px] text-[9.5px] font-bold uppercase tracking-wider py-0.5 px-2 bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
                                  {act.Activity_Type}
                                </Badge>
                              </div>
                              {act.Task_Description && (
                                <div
                                  className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans prose prose-sm dark:prose-invert max-w-none"
                                  dangerouslySetInnerHTML={{ __html: act.Task_Description }}
                                />
                              )}
                              <div className="text-[10px] text-slate-450 font-semibold flex items-center gap-2.5 pt-1">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {act.Expected_Date}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {act.Expected_Time}</span>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this activity?')) {
                                  try {
                                    await deleteAccountActivity(act.id!);
                                    toast.success('Activity deleted');
                                    refetchActivities();
                                  } catch (err: any) {
                                    toast.error(err.message || 'Failed to delete activity');
                                  }
                                }
                              }}
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1 shrink-0 ml-2"
                              title="Delete activity"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Account Log History */}
                    <div className="border-t dark:border-slate-850 pt-8 mt-6">
                      <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Account Log History</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Audit log of system events, profile edits, deals creation, and communication logs.</p>
                      </div>

                      {(!company.timeline || company.timeline.length === 0) ? (
                        <div className="py-8 text-center text-xs text-slate-400 italic">
                          No timeline logs recorded.
                        </div>
                      ) : (
                        <div className="space-y-6 max-w-[800px] text-xs pt-2">
                          {company.timeline.map((item) => (
                            <div key={item.id} className="flex gap-4 text-left relative pl-1.5">
                              <div className="flex flex-col items-center">
                                <div className="h-3 w-3 rounded-full mt-1.5 border-2 border-white dark:border-slate-900 shrink-0" style={{ backgroundColor: primaryColor }} />
                                <div className="w-0.5 bg-slate-100 dark:bg-slate-800 flex-1 min-h-[36px]" />
                              </div>
                              <div className="pb-4">
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-xs.5">{item.details}</p>
                                <span className="text-[10px] text-slate-450 block font-semibold mt-1">
                                  Action type: <span className="text-primary font-bold">{item.type}</span> • {item.date} • Logged by {item.user}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 5. NOTES TAB */}
              {activeTab === 'Notes' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Notes List */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
                    <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Notes Collection</h3>
                      <Badge variant="outline" className="rounded-md font-semibold text-xs py-0.5 px-2">
                        {company.notesList?.length || 0} Notes
                      </Badge>
                    </div>

                    {(!company.notesList || company.notesList.length === 0) ? (
                      <div className="text-center py-12 text-slate-400 text-xs">No notes available</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {company.notesList.map((note) => {
                          const isEditing = editingNoteId === note.id;
                          return (
                            <div
                              key={note.id}
                              className="bg-amber-50/50 dark:bg-amber-955/10 border border-amber-100/50 dark:border-amber-900/30 rounded-2xl p-5 text-xs relative text-left flex flex-col justify-between group"
                            >
                              {isEditing ? (
                                <div className="space-y-3 w-full">
                                  <Textarea
                                    value={editingNoteContent}
                                    onChange={(e) => setEditingNoteContent(e.target.value)}
                                    rows={3}
                                    className="rounded-xl text-xs resize-none"
                                  />
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() => handleSaveNoteEdit(note.id)}
                                      style={{ backgroundColor: primaryColor }}
                                      className="text-white font-bold h-7 px-3 text-xs rounded-xl hover:opacity-90 cursor-pointer"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingNoteId(null)}
                                      className="h-7 px-3 text-xs rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer font-bold"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <h4 className="font-extrabold text-sm text-amber-800 dark:text-amber-400 mb-2 border-b border-amber-100/40 pb-1.5 pr-14">
                                      {note.subject || 'General Note'}
                                    </h4>
                                    <p className="text-slate-700 dark:text-slate-305 leading-relaxed font-medium mb-4 whitespace-pre-line">
                                      {note.content}
                                    </p>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase border-t dark:border-slate-800/40 pt-2.5">
                                    <span>{note.date}</span>
                                    <span>{note.user}</span>
                                  </div>
                                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleStartEditingNote(note)}
                                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer p-1"
                                      title="Edit note"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm('Are you sure you want to delete this note?')) {
                                          try {
                                            await deleteAccountNote(note.id);
                                            toast.success('Note deleted');
                                            refetchNotes();
                                          } catch (err: any) {
                                            toast.error(err.message || 'Failed to delete note');
                                          }
                                        }
                                      }}
                                      className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                                      title="Delete note"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Note Form */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 h-fit text-left">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b dark:border-slate-800 pb-2">Add New Note</h3>
                    <form onSubmit={handleAddNote} className="space-y-4 text-xs">
                      <div className="space-y-1.5 text-left">
                        <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Subject <span className="text-red-500">*</span>
                        </label>
                        <Input
                          placeholder="e.g. Call summary, pricing inquiry..."
                          value={noteSubject}
                          onChange={(e) => {
                            setNoteSubject(e.target.value);
                            if (noteSubjectError) setNoteSubjectError('');
                          }}
                          className={`h-10 text-xs rounded-lg ${noteSubjectError ? 'border-red-500 focus:ring-red-400 focus-visible:ring-red-400' : ''
                            }`}
                        />
                        {noteSubjectError && (
                          <p className="text-[10px] text-red-500 font-semibold mt-0.5">{noteSubjectError}</p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Note Details <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          placeholder="Write your note contents here..."
                          value={noteInput}
                          onChange={(e) => {
                            setNoteInput(e.target.value);
                            if (noteContentError) setNoteContentError('');
                          }}
                          className={`w-full text-xs p-3 bg-slate-50 dark:bg-slate-955 border rounded-lg min-h-[120px] focus:outline-none focus:border-slate-350 ${noteContentError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-850'
                            }`}
                        />
                        {noteContentError && (
                          <p className="text-[10px] text-red-500 font-semibold mt-0.5">{noteContentError}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmittingNote}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white font-semibold rounded-lg h-10 hover:opacity-90 active:scale-95 transition-all text-xs w-full cursor-pointer"
                      >
                        {isSubmittingNote ? 'Saving...' : 'Save Note'}
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* 6. FILES TAB */}
              {activeTab === 'Files' && (
                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Shared Documents</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Upload, download, or review corporate licenses, NDA contracts, and project guidelines.</p>
                      </div>
                      <Button
                        onClick={() => setIsFileDialogOpen(true)}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white text-xs font-bold h-9 px-4 rounded-xl gap-1.5 cursor-pointer flex items-center"
                      >
                        <UploadCloud className="h-4 w-4" /> Upload Document
                      </Button>
                    </div>

                    {displayFiles.length === 0 ? (
                      <div className="py-16 text-center border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                        <UploadCloud className="h-10 w-10 text-slate-350 mx-auto mb-3" />
                        <p className="text-slate-400 text-xs font-semibold">Drag and drop file here, or click to upload.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayFiles.map((file) => (
                          <div key={file.id} className="p-4 border dark:border-slate-850 rounded-xl hover:shadow-xs flex items-center justify-between text-left">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {file.url && isImageFile(file.name, file.url) ? (
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="h-10 w-10 object-cover rounded-lg shrink-0 border dark:border-slate-800 cursor-zoom-in"
                                  onClick={() => setPreviewImageUrl(file.url || null)}
                                />
                              ) : (
                                <FileText className="h-8 w-8 text-primary shrink-0" />
                              )}
                              <div className="min-w-0 flex-1">
                                {file.url ? (
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-slate-750 dark:text-slate-200 text-xs truncate max-w-[150px] hover:text-primary block"
                                    title={file.name}
                                  >
                                    {file.name}
                                  </a>
                                ) : (
                                  <p className="font-bold text-slate-750 dark:text-slate-200 text-xs truncate max-w-[150px]" title={file.name}>{file.name}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {file.url && isImageFile(file.name, file.url) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPreviewImageUrl(file.url || null)}
                                  className="h-8.5 w-8.5 hover:bg-slate-105 dark:hover:bg-slate-800 text-slate-450 rounded-lg cursor-pointer"
                                  title="Preview Image"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Image Preview Modal Dialog */}
              <Dialog open={!!previewImageUrl} onOpenChange={(open) => { if (!open) setPreviewImageUrl(null); }}>
                <DialogContent className="max-w-4xl dark:bg-slate-900 border dark:border-slate-800 p-2 overflow-hidden" showCloseButton={false}>
                  {previewImageUrl && (
                    <>
                      <img
                        src={previewImageUrl}
                        alt="Preview"
                        className="max-h-[85vh] max-w-full object-contain rounded-lg mx-auto block"
                      />
                      <button
                        onClick={() => setPreviewImageUrl(null)}
                        className="absolute top-4 right-4 z-50 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full h-8 w-8 flex items-center justify-center cursor-pointer transition-colors shadow-md border border-slate-700/50"
                        title="Close Preview"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* 7. INVOICES TAB */}
              {activeTab === 'Invoices' && (() => {
                const displayInvoices = apiInvoicesRaw?.results || (Array.isArray(apiInvoicesRaw) ? apiInvoicesRaw : []);
                return (
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <CardContent className="p-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Billing & Invoices</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Review history invoices status, billing amounts, and balances due for this organization.</p>
                      </div>

                      {loadingInvoices ? (
                        <div className="space-y-3 py-4 text-left">
                          <Skeleton className="h-10 w-full rounded-[3px]" />
                          <Skeleton className="h-10 w-full rounded-[3px]" />
                        </div>
                      ) : displayInvoices.length === 0 ? (
                        <div className="py-16 text-center">
                          <FileSpreadsheet className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm font-semibold">No invoices found for this company.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto w-full">
                          <Table className="min-w-[650px] border-collapse">
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-b dark:border-slate-850">
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Invoice ID</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Date Issued</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Amount</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</TableHead>
                                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {displayInvoices.map((inv: any) => {
                                const invId = inv.Invoice_Number || inv.InvoiceId || inv.id?.toString() || 'INV-N/A';
                                const dateIssued = inv.Created_Date || inv.Invoice_Date || inv.date || '';
                                const amount = inv.Grand_Total || inv.Amount || inv.Total_Amount || inv.amount || 0;
                                const status = inv.Status || inv.Payment_Status || inv.status || 'Paid';
                                const desc = inv.Subject || inv.Description || inv.desc || 'N/A';
                                return (
                                  <TableRow key={inv.id || invId} className="border-b dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-800/35 text-xs">
                                    <TableCell className="font-bold text-slate-750 dark:text-slate-250 py-3.5 font-mono">{invId}</TableCell>
                                    <TableCell className="text-slate-500 dark:text-slate-455 py-3.5">{formatDate(dateIssued)}</TableCell>
                                    <TableCell className="font-bold text-slate-850 dark:text-white py-3.5 font-mono">৳ {amount.toLocaleString('en-IN')}</TableCell>
                                    <TableCell className="py-3.5">
                                      <Badge className={cn(
                                        "rounded-md text-[10px] font-bold px-2 py-0.5",
                                        status.toLowerCase().includes('paid')
                                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                                          : "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30"
                                      )}>
                                        {status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 dark:text-slate-400 py-3.5">{desc}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* 8. EMAILS TAB */}
              {activeTab === 'Emails' && (() => {
                const sentEmails: any[] = Array.isArray(apiSentEmailsRaw) ? apiSentEmailsRaw : (apiSentEmailsRaw as any)?.results ?? [];

                // Selected email ID handling (default to first sent email if not selected or invalid)
                const selectedEmail = sentEmails.find(
                  (em: any, idx: number) => (em.id?.toString() ?? `email-${idx}`) === selectedSentEmailId
                ) || sentEmails[0] || null;

                const renderAttachments = (filesRaw: any) => {
                  if (!filesRaw) return null;
                  let fileList: string[] = [];
                  if (Array.isArray(filesRaw)) {
                    fileList = filesRaw.map((f: any) => (typeof f === 'string' ? f : f.name || f.fileName || f.File || 'Attachment'));
                  } else if (typeof filesRaw === 'string') {
                    try {
                      const parsed = JSON.parse(filesRaw);
                      if (Array.isArray(parsed)) fileList = parsed;
                      else fileList = [filesRaw];
                    } catch {
                      fileList = [filesRaw];
                    }
                  }

                  if (fileList.length === 0) return null;

                  return (
                    <div className="mt-4 pt-3 border-t dark:border-slate-800 space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <UploadCloud className="h-3.5 w-3.5 text-primary" /> Attachments ({fileList.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fileList.map((fileName, i) => {
                          const cleanName = fileName.replace(/^[\w-]+_/, '');
                          const downloadUrl = fileName.startsWith('http') ? fileName : `${BASE_URL}/media/${fileName}`;
                          return (
                            <a
                              key={i}
                              href={downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-[200px]">{cleanName}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  );
                };

                return (
                  <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
                    <CardContent className="p-6 space-y-5">
                      {/* Header row */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" /> Sent Emails
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">List of sent emails linked to this company account.</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleOpenComposeMail}
                          style={{ backgroundColor: primaryColor }}
                          className="text-white rounded-xl h-9 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="h-3.5 w-3.5" /> Compose Mail
                        </Button>
                      </div>

                      {/* Emails Content Split Grid */}
                      {loadingSentEmails ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
                        </div>
                      ) : sentEmails.length === 0 ? (
                        <div className="py-16 text-center">
                          <Mail className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                          <p className="text-sm font-semibold text-slate-400">No sent emails found</p>
                          <p className="text-xs text-slate-350 dark:text-slate-500 mt-1">
                            Emails you compose and send will appear here.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start text-left">
                          {/* Left Column: Sent Emails List */}
                          <div className="md:col-span-5 space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                            {sentEmails.map((email: any, idx: number) => {
                              const emailId = email.id?.toString() ?? `email-${idx}`;
                              const isSelected = selectedEmail && (selectedEmail.id?.toString() ?? `email-${idx}`) === emailId;
                              const subject = email.MailSubject || email.Subject || email.subject || '(No Subject)';
                              const recipient = email.RecevierMailId || email.To || email.recipient || 'N/A';
                              const dateStr = email.Created_Date || email.Date || email.date || '';
                              const bodyRaw = email.MailBody || email.Body || email.body || '';
                              const preview = bodyRaw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

                              return (
                                <button
                                  key={emailId}
                                  type="button"
                                  onClick={() => setSelectedSentEmailId(emailId)}
                                  className={cn(
                                    'w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2',
                                    isSelected
                                      ? 'bg-primary/10 border-primary shadow-2xs dark:bg-primary/15'
                                      : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                  )}
                                >
                                  <div className="space-y-1 w-full">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={cn('font-bold text-xs truncate', isSelected ? 'text-primary dark:text-primary-foreground' : 'text-slate-800 dark:text-slate-200')}>
                                        {subject}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                                        {formatDate(dateStr)}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                      To: <span className="font-semibold text-slate-700 dark:text-slate-300">{recipient}</span>
                                    </p>
                                  </div>
                                  {preview && (
                                    <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                                      "{preview}..."
                                    </p>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Right Column: Selected Email Preview Card */}
                          <div className="md:col-span-7">
                            {selectedEmail ? (() => {
                              const subject = selectedEmail.MailSubject || selectedEmail.Subject || selectedEmail.subject || '(No Subject)';
                              const sender = selectedEmail.MailId || selectedEmail.SenderMail || selectedEmail.From || selectedEmail.sender || 'N/A';
                              const recipient = selectedEmail.RecevierMailId || selectedEmail.To || selectedEmail.recipient || 'N/A';
                              const cc = selectedEmail.cc || selectedEmail.Cc || selectedEmail.CC || null;
                              const dateStr = selectedEmail.Created_Date || selectedEmail.Date || selectedEmail.date || '';
                              const bodyRaw = selectedEmail.MailBody || selectedEmail.Body || selectedEmail.body || '';
                              const attachments = selectedEmail.file || selectedEmail.File || selectedEmail.Attachments || null;

                              return (
                                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-xs">
                                  {/* Subject Header */}
                                  <div className="border-b dark:border-slate-800 pb-3 space-y-1">
                                    <div className="flex items-start justify-between gap-3">
                                      <h4 className="text-base font-bold text-slate-850 dark:text-white leading-snug">
                                        {subject}
                                      </h4>
                                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 shrink-0">
                                        Sent
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Meta details box */}
                                  <div className="bg-slate-50/80 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 space-y-1.5 text-xs">
                                    <div className="flex justify-between items-center text-[11px] text-slate-400 border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5">
                                      <span className="font-semibold">Email Details</span>
                                      <span>{formatDate(dateStr)}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-1 text-[11.5px]">
                                      <div className="flex items-center gap-2">
                                        <span className="w-12 font-bold text-slate-400 uppercase text-[10px]">From:</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{sender}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-12 font-bold text-slate-400 uppercase text-[10px]">To:</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{recipient}</span>
                                      </div>
                                      {cc && (
                                        <div className="flex items-center gap-2">
                                          <span className="w-12 font-bold text-slate-400 uppercase text-[10px]">CC:</span>
                                          <span className="font-medium text-slate-600 dark:text-slate-300">{cc}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Body content */}
                                  <div className="min-h-[160px] pt-1">
                                    {bodyRaw ? (
                                      <div
                                        className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed prose prose-xs dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: bodyRaw }}
                                      />
                                    ) : (
                                      <p className="text-xs text-slate-400 italic">No email body content.</p>
                                    )}
                                  </div>

                                  {/* Attachments */}
                                  {renderAttachments(attachments)}
                                </div>
                              );
                            })() : (
                              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
                                Select an email from the left list to view details.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* dialog forms */}
      {/* 1. ADD CONTACT DIALOG */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[5px] dark:bg-slate-900 border dark:border-slate-800 p-6 text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-850 dark:text-white">Add Contact Person</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddContactSubmit} className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Full Name *</Label>
              <Input
                placeholder="e.g. Monirul Islam"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="rounded-[5px] text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Role / Designation *</Label>
              <Select value={newContactRole} onValueChange={(val) => setNewContactRole(val || 'Manager')}>
                <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[5px]">
                  <SelectItem value="CEO">CEO</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Purchasing Agent">Purchasing Agent</SelectItem>
                  <SelectItem value="Accountant">Accountant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Email Address *</Label>
              <Input
                type="email"
                placeholder="e.g. monirul@softtech.com"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                className="rounded-[5px] text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Phone Number *</Label>
              <Input
                placeholder="e.g. +880 1711-123456"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                className="rounded-[5px] text-xs h-9.5"
              />
            </div>

            <DialogFooter className="pt-4 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContactDialogOpen(false)}
                className="rounded-[5px] text-xs font-bold h-9.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="text-white rounded-[5px] text-xs font-bold h-9.5 cursor-pointer px-5"
              >
                Save Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. ADD DEAL DIALOG */}
      <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[5px] dark:bg-slate-900 border dark:border-slate-800 p-6 text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-850 dark:text-white">Record New Sale Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDealSubmit} className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Deal Title *</Label>
              <Input
                placeholder="e.g. Cloud ERP Setup"
                value={newDealName}
                onChange={(e) => setNewDealName(e.target.value)}
                className="rounded-[5px] text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Pipeline Stage *</Label>
              <Select value={newDealStage} onValueChange={(val) => setNewDealStage(val || 'Qualification')}>
                <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[5px]">
                  <SelectItem value="Qualification">Qualification</SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Closed Won">Closed Won</SelectItem>
                  <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Value (BDT ৳) *</Label>
              <Input
                type="number"
                placeholder="e.g. 750000"
                value={newDealValue}
                onChange={(e) => setNewDealValue(e.target.value)}
                className="rounded-[5px] text-xs h-9.5 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Expected Closing Date *</Label>
              <Input
                type="date"
                value={newDealExpectedClose}
                onChange={(e) => setNewDealExpectedClose(e.target.value)}
                className="rounded-[5px] text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Assigned Rep *</Label>
              <Select value={newDealOwner} onValueChange={(val) => setNewDealOwner(val || 'Sadia Afrin')}>
                <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-[5px]">
                  <SelectItem value="Sadia Afrin">Sadia Afrin</SelectItem>
                  <SelectItem value="Jisan Mahmud">Jisan Mahmud</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDealDialogOpen(false)}
                className="rounded-[5px] text-xs font-bold h-9.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="text-white rounded-[5px] text-xs font-bold h-9.5 cursor-pointer px-5"
              >
                Add Deal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. UPLOAD FILE DIALOG */}
      <Dialog open={isFileDialogOpen} onOpenChange={(open) => {
        setIsFileDialogOpen(open);
        if (!open) {
          setSelectedFile(null);
          setNewFileName('');
        }
      }}>
        <DialogContent className="sm:max-w-[400px] rounded-[5px] dark:bg-slate-900 border dark:border-slate-800 p-6 text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-850 dark:text-white">Upload Documents</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFileUpload} className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">File Name *</Label>
              <Input
                placeholder="e.g. Sales_Contract_v2"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="rounded-[5px] text-xs h-9.5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Choose File *</Label>
              <div className="relative flex items-center justify-center border border-dashed rounded-[5px] border-slate-200 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 transition-colors cursor-pointer group">
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                    if (file && !newFileName.trim()) {
                      setNewFileName(file.name);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                <div className="text-center flex flex-col items-center justify-center pointer-events-none min-w-0 w-full">
                  <UploadCloud className="h-9 w-9 text-slate-350 mb-2 group-hover:text-primary transition-colors" />
                  <span className="text-[11px] text-slate-500 font-bold block max-w-full truncate px-2">
                    {selectedFile ? selectedFile.name : 'Click to select file'}
                  </span>
                  {selectedFile && (
                    <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFileDialogOpen(false)}
                className="rounded-[5px] text-xs font-bold h-9.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="text-white rounded-[5px] text-xs font-bold h-9.5 cursor-pointer px-5"
              >
                Upload File
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. ADD ACTIVITY DIALOG */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[5px] dark:bg-slate-900 border dark:border-slate-800 p-6 text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-850 dark:text-white">Schedule New Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddActivitySubmit} className="space-y-4 pt-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label className="font-bold text-slate-650 dark:text-slate-400">Activity Type *</Label>
                <Select value={newActivityType} onValueChange={(val) => setNewActivityType(val || 'Call')}>
                  <SelectTrigger className="rounded-[5px] text-xs h-9.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-[5px]">
                    <SelectItem value="Call">Call</SelectItem>
                    <SelectItem value="Meeting">Meeting</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="For Morning">For Morning</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-slate-650 dark:text-slate-400">Expected Date *</Label>
                <Input
                  type="date"
                  value={newActivityExpectedDate}
                  onChange={(e) => setNewActivityExpectedDate(e.target.value)}
                  className="rounded-[5px] text-xs h-9.5"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-slate-650 dark:text-slate-400">Expected Time *</Label>
                <Input
                  type="time"
                  value={newActivityExpectedTime}
                  onChange={(e) => setNewActivityExpectedTime(e.target.value)}
                  className="rounded-[5px] text-xs h-9.5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Task Title *</Label>
              <Input
                placeholder="e.g. Discuss proposal budget details"
                value={newActivityTask}
                onChange={(e) => setNewActivityTask(e.target.value)}
                className="rounded-[5px] text-xs h-9.5"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-slate-650 dark:text-slate-400">Task Description</Label>
              <Textarea
                placeholder="Enter description..."
                value={newActivityDescription}
                onChange={(e) => setNewActivityDescription(e.target.value)}
                rows={3}
                className="rounded-[5px] text-xs resize-none"
              />
            </div>

            <DialogFooter className="pt-4 gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsActivityDialogOpen(false)}
                className="rounded-[5px] text-xs font-bold h-9.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="text-white rounded-[5px] text-xs font-bold h-9.5 cursor-pointer px-5"
              >
                Schedule Activity
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Compose Email Dialog */}
      <Dialog open={isComposeMailOpen} onOpenChange={setIsComposeMailOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-[5px] dark:bg-slate-900 border dark:border-slate-800 p-6 text-left">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-slate-855 dark:text-white">Compose Mail</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs">
            {/* From */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">From</Label>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-955 border dark:border-slate-800 rounded-[5px] text-slate-500 font-semibold select-all">
                {emailFrom || 'N/A'}
              </div>
            </div>

            {/* To */}
            <div className="space-y-1.5">
              <Label htmlFor="email-to" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">To</Label>
              <Input
                id="email-to"
                placeholder="receiver@example.com"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="h-9.5 text-xs rounded-[5px] bg-slate-5/50 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Cc */}
            <div className="space-y-1.5">
              <Label htmlFor="email-cc" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cc</Label>
              <Input
                id="email-cc"
                placeholder="cc@example.com"
                value={emailCc}
                onChange={(e) => setEmailCc(e.target.value)}
                className="h-9.5 text-xs rounded-[5px] bg-slate-5/50 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-subject" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subject</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingAiEmail || !emailSubject.trim()}
                  onClick={handleGenerateAiEmail}
                  className="h-7 text-[11px] px-2.5 rounded-lg border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/60 font-semibold gap-1.5 cursor-pointer shadow-2xs transition-all"
                >
                  {isGeneratingAiEmail ? (
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
                id="email-subject"
                placeholder="Enter email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="h-9.5 text-xs rounded-[5px] bg-slate-5/50 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attachments</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="email-files"
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) {
                      setEmailFiles((prev: File[]) => [...prev, ...Array.from(e.target.files || [])]);
                    }
                  }}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => document.getElementById('email-files')?.click()}
                  className="h-9 px-3 rounded-[5px] text-xs font-semibold gap-1.5 cursor-pointer dark:border-slate-800"
                >
                  <UploadCloud className="h-4 w-4 text-slate-400" /> Browse Files
                </Button>
                <span className="text-[10px] text-slate-455 font-semibold">
                  {emailFiles.length} files attached
                </span>
              </div>

              {emailFiles.length > 0 && (
                <div className="mt-2 border dark:border-slate-800 rounded-[5px] p-2 max-h-[100px] overflow-y-auto space-y-1.5 bg-slate-50/20 dark:bg-slate-950/20">
                  {emailFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border dark:border-slate-850 px-2 py-1 rounded-[3px] text-[11px]">
                      <span className="truncate max-w-[350px] font-medium text-slate-755 dark:text-slate-350">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setEmailFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer hover:bg-slate-55 dark:hover:bg-slate-800 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <Label htmlFor="email-content" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Content</Label>
              <Textarea
                id="email-content"
                placeholder="Write email contents here..."
                rows={5}
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="text-xs rounded-[5px] bg-slate-5/50 border-slate-200 dark:border-slate-800 font-sans leading-relaxed min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsComposeMailOpen(false)}
              disabled={isSendingMail}
              className="rounded-[5px] text-xs font-bold h-9.5 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmitMail}
              disabled={isSendingMail}
              style={{ backgroundColor: primaryColor }}
              className="text-white rounded-[5px] text-xs font-bold h-9.5 cursor-pointer px-5 gap-1.5"
            >
              {isSendingMail ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Send Mail
                </>
              )}
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
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Company Name</label>
                <Input value={company?.companyName || ''} disabled className="h-10 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 cursor-not-allowed font-semibold text-slate-500" />
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
                <Checkbox id="companyRemindMe" checked={remindMe} onCheckedChange={(checked) => setRemindMe(!!checked)} className="rounded-md h-4 w-4" />
                <label htmlFor="companyRemindMe" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Remind Me (Optional)</label>
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
                        <Checkbox id="companyRepeatEveryChecked" checked={repeatEveryChecked} onCheckedChange={(checked) => setRepeatEveryChecked(!!checked)} className="rounded-md h-4 w-4" />
                        <label htmlFor="companyRepeatEveryChecked" className="font-bold text-slate-500 uppercase tracking-wider text-[10px] cursor-pointer">Repeat Every</label>
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
    </div>
  );
}
