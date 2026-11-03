'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';
import { useLeadStore } from '@/store/useLeadStore';
import { useStore } from '@/store/useStore';
import {
  ArrowLeft,
  Pencil,
  UserCheck,
  CheckSquare,
  Mail,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  Star,
  Plus,
  ExternalLink,
  FileText,
  PhoneCall,
  MessageSquare,
  PlusCircle,
  Trash2,
  MoreVertical,
  History,
  User,
  Target,
  File,
  Download,
  AlertCircle,
  Building,
  Users,
  Compass,
  FileUp,
  Tag,
  ClipboardList,
  Info,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useKnowlarity } from '@/store/KnowlarityContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchUserQualifiedLeadById,
  fetchLeadNotesList,
  fetchLeadTaskListWithoutPagination,
  fetchLeadEmailList,
  fetchLeadActivityList,
  fetchLeadDealList,
  createUserLeadNote,
  createTask,
  createUserLeadMail,
  createUserLeadActivity,
  fetchUsersList,
  patchTask,
  patchUserQualifiedLead,
  fetchLeadScore,
  createUserLeadMeeting,
  updateUserLeadMeeting,
  deleteUserLeadMeeting,
  fetchUserLeadMeetings,
  generateEmailContent
} from '@/service/api/Leads/api';

// Inline WhatsApp logo SVG
const WhatsAppIcon = () => (
  <svg className="h-4 w-4 text-[#25D366] fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.416 1.46h.005c5.566 0 10.1-4.532 10.104-10.1.002-2.699-1.047-5.236-2.951-7.143C17.31 1.464 14.773.415 12.008.415 6.43.415 1.895 4.947 1.892 10.528c-.001 1.93.504 3.81 1.462 5.418L2.35 20.358l4.297-1.204zM17.9 14.852c-.322-.16-.1.9-.323-1.6-.16-.322-.59-.516-.913-.677-.323-.16-1.897-.933-2.18-.1.036-.282-.226-.436-.452-.516-.226-.08-1.516-.403-2.58.548-.823.823-1.37 1.823-1.53 2.1-.16.28-.016.43.124.57.126.126.282.322.42.484.14.16.186.274.28.452.093.18.046.338-.023.5-.069.16-.62 1.484-.855 2.048-.228.55-.458.484-.62.476-.153-.008-.33-.008-.508-.008-.18 0-.476.067-.726-.206-.25-.274-.95-.93-.95-2.27 0-1.34.975-2.637 1.112-2.82.137-.184 1.92-2.93 4.65-4.113.65-.28 1.157-.448 1.553-.573.654-.208 1.25-.178 1.72-.25.525-.078 1.62-.663 1.85-.92.228-.258.228-.48.15-.623-.076-.14-.282-.226-.6-.386z" />
  </svg>
);

export default function LeadOverviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { primaryColor } = useStore();
  const { leads, updateLead } = useLeadStore();
  const { makeCall, isPlacingCall } = useKnowlarity();

  const queryClient = useQueryClient();

  // 1. Fetch Single Lead Query
  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await fetchUserQualifiedLeadById(id);
      return Array.isArray(res) ? res[0] : res;
    },
    enabled: !!id,
  });

  const lead = useMemo(() => {
    if (!leadData) return null;
    return {
      ...leadData,
      id: leadData.id?.toString(),
      leadName: `${leadData.LeadFirstName || ''} ${leadData.LeadLastName || ''}`.trim() || 'No Name',
      companyName: leadData.CompanyName || 'No Company',
      industry: leadData.Lead_Industry || 'Software',
      email: leadData.EmailId || '',
      mobileNumber: leadData.PhoneNo || leadData.Mobile_No || '',
      city: leadData.City || '',
      state: leadData.State || '',
      country: leadData.Country || '',
      assignedTo: leadData.Lead_Owner || 'Unassigned',
      createdAt: leadData.Created_Date,
      updatedAt: leadData.Updated_Date,
      rating: leadData.Ratings ? parseInt(leadData.Ratings, 10) : 0,
      leadSource: leadData.LeadSource || '',
      score: leadData.LeadScore || 0,
      status: leadData.Lead_Status || 'New',
      noOfEmployees: leadData.LeadNoOfEmployees || 0,
      addressLine1: leadData.StreetName || '',
      postalCode: leadData.Pincode || '',
      preferredContactMethod: leadData.Prefered_Contact_Method || '',
      bestTimeToContact: leadData.bestTimeToContact || '',
      leadSourceDetails: leadData.Source_Details || '',
      website: leadData.WebsiteURL || '',
      contactPerson: `${leadData.LeadFirstName || ''} ${leadData.LeadLastName || ''}`.trim() || 'No Name',
    };
  }, [leadData]);

  // 2. Fetch Notes Query
  const { data: notesData } = useQuery({
    queryKey: ['leadNotes', id],
    queryFn: () => fetchLeadNotesList({ Lead_Id: Number(id) }),
    enabled: !!id,
  });
  const notesState = Array.isArray(notesData) ? notesData : (notesData?.results || notesData?.data || []);

  // 3. Fetch Tasks Query
  const { data: tasksData } = useQuery({
    queryKey: ['leadTasks', id],
    queryFn: () => fetchLeadTaskListWithoutPagination({ Lead_Id: Number(id) }),
    enabled: !!id,
  });
  const tasksState = Array.isArray(tasksData) ? tasksData : (tasksData?.results || tasksData?.data || []);

  // 4. Fetch Emails Query
  const { data: emailsData } = useQuery({
    queryKey: ['leadEmails', id],
    queryFn: () => fetchLeadEmailList({ Lead_Id: Number(id) }),
    enabled: !!id,
  });
  console.log("emailsData", emailsData)
  const emailsState = Array.isArray(emailsData) ? emailsData : (emailsData?.results || emailsData?.data || []);

  // 5. Fetch Activities Query
  const { data: activitiesData } = useQuery({
    queryKey: ['leadActivities', id],
    queryFn: () => fetchLeadActivityList({ Lead_Id: Number(id) }),
    enabled: !!id,
  });
  const activitiesState = Array.isArray(activitiesData) ? activitiesData : (activitiesData?.results || activitiesData?.data || []);

  // 6. Fetch Deals Query
  const { data: dealsData } = useQuery({
    queryKey: ['leadDeals', id],
    queryFn: () => fetchLeadDealList({ Lead_Id: Number(id) }),
    enabled: !!id,
  });
  const dealsState = Array.isArray(dealsData) ? dealsData : (dealsData?.results || dealsData?.data || []);

  // 7. Fetch Users Query
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsersList,
  });
  const users = Array.isArray(usersData) ? usersData : (usersData?.results || usersData?.data || []);

  // 8. Fetch Lead Score Query
  const { data: leadScoreData, isLoading: leadScoreLoading } = useQuery({
    queryKey: ['leadScore', id],
    queryFn: () => fetchLeadScore(id),
    enabled: !!id,
  });

  const [showScoreParams, setShowScoreParams] = useState(false);
  const [scoreModalTab, setScoreModalTab] = useState<'Sentimental' | 'Fit Score' | 'Engagement' | 'MQL'>('Sentimental');
  const [showEngagementOverview, setShowEngagementOverview] = useState(false);

  // 9. Fetch Appointments Query
  const { data: meetingsData } = useQuery({
    queryKey: ['leadMeetings', id],
    queryFn: () => {
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
      const twoYearsHence = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];
      return fetchUserLeadMeetings({
        Lead_Id: Number(id),
        period: [oneYearAgo, twoYearsHence]
      });
    },
    enabled: !!id,
  });
  const meetingsState = Array.isArray(meetingsData) ? meetingsData : (meetingsData?.results || meetingsData?.data || []);

  // Invalidation helpers to match existing call sites
  const loadNotes = () => queryClient.invalidateQueries({ queryKey: ['leadNotes', id] });
  const loadTasks = () => queryClient.invalidateQueries({ queryKey: ['leadTasks', id] });
  const loadEmails = () => queryClient.invalidateQueries({ queryKey: ['leadEmails', id] });
  const loadActivities = () => queryClient.invalidateQueries({ queryKey: ['leadActivities', id] });
  const loadDeals = () => queryClient.invalidateQueries({ queryKey: ['leadDeals', id] });
  const loadMeetings = () => queryClient.invalidateQueries({ queryKey: ['leadMeetings', id] });

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

  // Reminder Form States
  const [remindMe, setRemindMe] = useState(false);
  const [reminderBeforeDueVal, setReminderBeforeDueVal] = useState('1');
  const [reminderBeforeDueUnit, setReminderBeforeDueUnit] = useState('Hrs');
  const [repeatEveryChecked, setRepeatEveryChecked] = useState(false);
  const [repeatEveryVal, setRepeatEveryVal] = useState('10');
  const [repeatEveryUnit, setRepeatEveryUnit] = useState('Mins');
  const [reminderMessage, setReminderMessage] = useState('');
  const [reminderStatus, setReminderStatus] = useState('Pending');

  // Page loading state (derived from leadLoading)
  const loading = leadLoading;

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('Overview');

  // Input states for widgets
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');

  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  // Tab Form States
  // Notes
  const [noteSubject, setNoteSubject] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [noteSubjectError, setNoteSubjectError] = useState('');
  const [noteContentError, setNoteContentError] = useState('');

  // Tasks
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskStatus, setTaskStatus] = useState('Pending');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Emails
  const [isMailOpen, setIsMailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isGeneratingAiEmail, setIsGeneratingAiEmail] = useState(false);

  // Activities
  const [activityType, setActivityType] = useState('Call');
  const [activityTask, setActivityTask] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [activityTime, setActivityTime] = useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const getUserName = (userId: any) => {
    if (!userId) return 'System';
    let idVal = userId;
    if (typeof userId === 'object' && userId !== null) {
      const name = `${userId.first_name || ''} ${userId.last_name || ''}`.trim() || userId.username || userId.name || userId.email;
      if (name) return name;
      idVal = userId.id || userId.Id;
    }
    if (!idVal) return 'System';
    const u = users.find(x => x.id.toString() === idVal.toString());
    return u ? `${u.first_name} ${u.last_name || ''}`.trim() : `User ${idVal}`;
  };

  // Generates fallback lists dynamically so other leads also have content
  const activities = (activitiesState && activitiesState.length > 0) ? activitiesState.map((act: any) => ({
    id: act.id,
    type: act.Activity_Type || act.Task || 'Activity',
    details: stripHtml(act.Task_Description || act.Task || ''),
    date: act.Expected_Date ? `${new Date(act.Expected_Date).toLocaleDateString()} ${act.Expected_Time || ''}` : act.Created_Date ? new Date(act.Created_Date).toLocaleString() : '',
    user: getUserName(act.Created_By),
    status: act.status || undefined,
    Organization_Id: act.Organization_Id
  })) : [];

  const tasksList = (tasksState && tasksState.length > 0) ? tasksState.map((tsk: any) => ({
    id: tsk.id,
    title: tsk.TaskName || '',
    dueDate: tsk.Due_Date || 'No Due Date',
    completed: tsk.Status === 'Completed' || tsk.Status === 'Done' || tsk.completed,
    owner: getUserName(tsk.Assigned_To),
    status: tsk.Status || 'Pending'
  })) : [];

  const notesList = (notesState && notesState.length > 0) ? notesState.map((nte: any) => ({
    id: nte.id,
    content: nte.Notes || '',
    subject: nte.Subject || 'General Note',
    date: nte.Created_Date ? new Date(nte.Created_Date).toLocaleDateString() : new Date().toLocaleDateString(),
    user: getUserName(nte.Created_By)
  })) : [];

  const documentsList: any[] = [];

  const tags = (lead?.Tags && Array.isArray(lead.Tags)) ? lead.Tags : (typeof lead?.Tags === 'string' ? (lead.Tags as string).split(',').map((t: string) => t.trim()).filter(Boolean) : []);
  const rating = lead?.rating || 0;
  const followUpDate = lead?.followUpDate;
  const companySize = lead?.companySize;

  // Update task status via patch
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    if (String(taskId).includes('-D')) {
      toast.info('Mock tasks status cannot be updated on server.');
      return;
    }
    try {
      await patchTask(taskId, { Status: newStatus });
      toast.success(`Task status updated to ${newStatus}`);
      loadTasks();
    } catch (err) {
      toast.error('Failed to update task status');
      console.error(err);
    }
  };

  // Add items functions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {

      const userId = localStorage.getItem('userId');
      console.log("lead", lead)
      const payload = {
        Lead_Id: Number(id),
        TaskName: newTaskTitle,
        Task_Desc: 'Created from sidebar widget.',
        Start_Date: new Date().toISOString(),
        Due_Date: newTaskDueDate ? `${newTaskDueDate}T00:00:00Z` : new Date().toISOString(),
        Priority: 'Medium',
        Status: 'Pending',
        Assigned_To: Number(userId),
        Created_By: Number(userId),
        Updated_By: Number(userId),
        UserReminder: null,
        Organization_Id: Number(lead?.Organization_Id || 1),
      };
      console.log("payload", payload)
      await createTask(payload);
      toast.success(`Task "${newTaskTitle}" created successfully!`);
      setNewTaskTitle('');
      setNewTaskDueDate('');
      setShowAddTask(false);
      loadTasks();
    } catch (err) {
      toast.error('Failed to create task');
      console.error(err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';
      const userId = parseInt(userIdStr, 10);
      const payload = {
        Organization_Id: 1,
        Lead_Id: Number(id),
        Subject: 'General Note',
        Notes: newNoteContent,
        Active_Flag: true,
        Is_Deleted: false,
        Created_By: userId,
        Updated_By: userId
      };
      await createUserLeadNote(payload);
      toast.success('Note added successfully!');
      setNewNoteContent('');
      setShowAddNote(false);
      loadNotes();
    } catch (err) {
      toast.error('Failed to add note');
      console.error(err);
    }
  };

  // Tab Submit Handlers
  const handleCreateNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!noteSubject.trim()) {
      setNoteSubjectError('Subject is required');
      hasError = true;
    } else {
      setNoteSubjectError('');
    }

    if (!noteContent.trim()) {
      setNoteContentError('Note details are required');
      hasError = true;
    } else {
      setNoteContentError('');
    }

    if (hasError) return;

    setIsSubmittingNote(true);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';
      const userId = parseInt(userIdStr, 10);
      const payload = {
        Organization_Id: 1,
        Lead_Id: Number(id),
        Subject: noteSubject || 'General Note',
        Notes: noteContent,
        Active_Flag: true,
        Is_Deleted: false,
        Created_By: userId,
        Updated_By: userId
      };
      await createUserLeadNote(payload);
      toast.success('Note added successfully!');
      setNoteSubject('');
      setNoteContent('');
      loadNotes();
    } catch (err) {
      toast.error('Failed to add note');
      console.error(err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleCreateTaskTab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;
    setIsSubmittingTask(true);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';
      const userId = parseInt(userIdStr, 10);
      const assignedUser = users.find((u: any) => `${u.first_name} ${u.last_name || ''}`.trim() === taskAssignedTo);
      const assignedToId = assignedUser ? Number(assignedUser.id) : userId;
      const payload = {
        Lead_Id: Number(id),
        TaskName: taskName,
        Task_Desc: taskDesc,
        Start_Date: taskStartDate ? `${taskStartDate}T00:00:00Z` : new Date().toISOString(),
        Due_Date: taskDueDate ? `${taskDueDate}T00:00:00Z` : new Date().toISOString(),
        Priority: taskPriority,
        Status: taskStatus,
        Assigned_To: assignedToId,
        Created_By: userId,
        Updated_By: userId,
        UserReminder: null,
        Organization_Id: Number(lead?.Organization_Id || 1)
      };
      await createTask(payload);
      toast.success('Task created successfully!');
      setTaskName('');
      setTaskDesc('');
      setTaskStartDate('');
      setTaskDueDate('');
      setTaskPriority('Medium');
      setTaskStatus('Pending');
      setTaskAssignedTo('');
      loadTasks();
    } catch (err) {
      toast.error('Failed to create task');
      console.error(err);
    } finally {
      setIsSubmittingTask(false);
    }
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
        setEmailBody(aiResult);
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

  const handleCreateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!emailBody.trim()) {
      toast.error('Email body is required');
      return;
    }
    setIsSubmittingEmail(true);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';
      const userId = parseInt(userIdStr, 10);
      const orgIdStr = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';
      const orgId = parseInt(orgIdStr, 10);
      const payload = {
        Lead_Id: Number(id),
        RecevierMailId: lead.email || '',
        MailSubject: emailSubject.trim(),
        MailBody: emailBody.trim(),
        cc: null,
        Organization_Id: orgId,
        Created_By: userId,
        Updated_By: userId,
      };
      await createUserLeadMail(payload);
      toast.success('Email activity logged successfully!');
      setEmailSubject('');
      setEmailBody('');
      setIsMailOpen(false);
      loadEmails();
    } catch (err) {
      toast.error('Failed to log email activity');
      console.error(err);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTask.trim()) return;
    setIsSubmittingActivity(true);
    try {
      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';
      const userId = parseInt(userIdStr, 10);
      const payload = {
        Lead_Id: Number(id),
        Task: activityTask,
        Task_Description: activityDesc,
        Expected_Date: activityDate || new Date().toISOString().split('T')[0],
        Expected_Time: activityTime || new Date().toTimeString().split(' ')[0].substring(0, 5),
        Activity_Type: activityType,
        Created_By: userId,
        Updated_By: userId,
        Organization_Id: lead?.Organization_Id
      };
      await createUserLeadActivity(payload);
      toast.success('Activity logged successfully!');
      setActivityTask('');
      setActivityDesc('');
      setActivityDate('');
      setActivityTime('');
      loadActivities();
    } catch (err) {
      toast.error('Failed to log activity');
      console.error(err);
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagText.trim()) return;
    if (tags.includes(newTagText.trim())) {
      toast.error('Tag already exists');
      return;
    }
    const updatedTags = [...tags, newTagText.trim()];
    try {
      await patchUserQualifiedLead(lead.id, { Tags: updatedTags });
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      updateLead(lead.id, { tags: updatedTags });
      toast.success(`Tag "${newTagText.trim()}" added.`);
      setNewTagText('');
      setShowAddTag(false);
    } catch (err) {
      toast.error('Failed to add tag');
    }
  };

  const handleSimulateDocumentUpload = () => {
    const docNames = ['Purchase Order draft.pdf', 'Technical specs.pdf', 'Service Level Agreement.pdf'];
    const randomName = docNames[Math.floor(Math.random() * docNames.length)];
    const newDoc = {
      id: `DOC-${Date.now()}`,
      name: randomName,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: 'pdf'
    };
    updateLead(lead.id, { documentsList: [newDoc, ...documentsList] });
    toast.success(`Document "${randomName}" uploaded successfully!`);
  };

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
            await deleteUserLeadMeeting(meetingId);
            toast.success('Appointment deleted successfully!');
            loadMeetings();
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

      const reminderId = editingMeeting?.Reminder_Id && typeof editingMeeting.Reminder_Id === 'object'
        ? editingMeeting.Reminder_Id.id
        : (editingMeeting?.Reminder_Id || null);

      const reminderPayload = remindMe ? {
        id: reminderId,
        Created_By: userId,
        Updated_By: userId,
        ReminderFor: "Reminder for Appointment",
        Repeat_EveryDay: repeatEveryChecked ? `${repeatEveryVal} ${repeatEveryUnit}` : " ",
        RemainderDueDate: `${reminderBeforeDueVal} ${reminderBeforeDueUnit}`,
        RemainderMessage: reminderMessage || appointmentSubject,
        Status: reminderStatus
      } : null;

      if (editingMeeting) {
        const editPayload = {
          id: editingMeeting.id,
          Lead_Id: id,
          Deal_Id: null,
          Project_Id: null,
          Apartment_Id: null,
          BlockTable_Id: null,
          Booking_Id: null,
          Subject: appointmentSubject,
          Location: appointmentLocation,
          Venue: appointmentVenue,
          expected_date: appointmentExpectedDate,
          FromDate_Time: appointmentFromTime,
          ToDate_Time: appointmentToTime,
          LeadId: null,
          Status: appointmentStatus,
          LeadMeeting_Id: editingMeeting.LeadMeeting_Id || false,
          Date: appointmentExpectedDate,
          Details: appointmentDetails || "",
          Organization_Id: typeof editingMeeting.Organization_Id === 'object' ? String(editingMeeting.Organization_Id?.id || lead?.Organization_Id || 1) : String(editingMeeting.Organization_Id || lead?.Organization_Id || 1),
          Updated_By: userId,
          Created_By: typeof editingMeeting.Created_By === 'object' ? String(editingMeeting.Created_By?.id || userId) : String(editingMeeting.Created_By || userId),
          Appointment_Id: editingMeeting.Appointment_Id || "",
          Meeting_Type: editingMeeting.Meeting_Type || "",
          // Reminder_Id: reminderId,
          Reminder_Id: reminderPayload,
          Assigned_To: editingMeeting.Assigned_To || null
        };
        await updateUserLeadMeeting(editPayload);
        toast.success('Appointment updated successfully!');
      } else {
        const payload = {
          Lead_Id: id,
          Deal_Id: null,
          Project_Id: null,
          Apartment_Id: null,
          BlockTable_Id: null,
          Booking_Id: null,
          Subject: appointmentSubject,
          Location: appointmentLocation,
          Venue: appointmentVenue,
          expected_date: appointmentExpectedDate,
          FromDate_Time: appointmentFromTime,
          ToDate_Time: appointmentToTime,
          LeadId: null,
          Status: appointmentStatus,
          LeadMeeting_Id: "",
          Date: appointmentExpectedDate,
          Details: appointmentDetails || "",
          Organization_Id: lead?.Organization_Id || 1,
          Updated_By: userId,
          Created_By: userId,
          Appointment_Id: "",
          Meeting_Type: "",
          Reminder_Id: null,
          Reminder_Payload: reminderPayload,
          Assigned_To: null
        };
        await createUserLeadMeeting(payload);
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
      loadMeetings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save appointment');
      console.error(err);
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  // Avatar Helpers
  const getInitials = (name: string) => {
    return name.split(' ').filter(p => p !== '').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getAvatarColor = (name: string) => {
    if (name === 'Aarav Rao') return 'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/30';
    return 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/30';
  };

  const getOwnerInitials = (owner: string) => {
    return owner.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const getOwnerBgColor = (owner: string) => {
    if (owner === 'John Smith') return 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400';
    if (owner === 'Sarah Davis') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400';
    return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400';
  };

  const statusStyles: Record<string, string> = {
    'New': 'bg-blue-50 text-blue-600 border-blue-105 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30',
    'Open': 'bg-blue-50 text-blue-600 border-blue-105 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30',
    'Contacted': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
    'Qualified': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-955/20 dark:text-purple-400 dark:border-purple-900/30',
    'Unqualified': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30',
    'Proposal Sent': 'bg-rose-50 text-rose-505 border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30',
    'Negotiation': 'bg-sky-50 text-sky-505 border-sky-100 dark:bg-sky-955/20 dark:text-sky-400 dark:border-sky-900/30',
    'Converted': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400 dark:border-emerald-900/30',
    'Disqualified': 'bg-slate-105 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    'Nurturing': 'bg-pink-50 text-pink-505 border-pink-100 dark:bg-pink-955/20 dark:text-pink-400 dark:border-pink-900/30'
  };

  const tabsList = [
    { name: 'Overview', count: null },
    { name: 'Activity', count: null },
    { name: 'Tasks', count: tasksList.filter(t => !t.completed).length },
    { name: 'Emails', count: emailsState.length },
    { name: 'Notes', count: notesList.length },
    { name: 'Appointments', count: meetingsState.length },
  ];

  const emailScore = leadScoreData?.MLData?.Email?.score ?? 0;
  const audioScore = leadScoreData?.MLData?.Audio?.score ?? 0;
  const engagementScore = leadScoreData?.MLData?.Engagement?.score ?? 0;
  const engagementStatus = leadScoreData?.MLData?.Engagement?.status ?? 'Low Engagement';
  const demographyScore = leadScoreData?.MLData?.Demography?.score ?? 0;
  const firmographyScore = leadScoreData?.MLData?.Firmography?.score ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500 gap-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Lead Not Found</h2>
        <Button onClick={() => router.push('/marketing/leads')}>Back to Leads</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Top Header Row with Back Button & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => router.push('/marketing/leads')}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
              <NavLink to="/marketing/leads" className="hover:text-slate-600 transition-colors">Leads</NavLink>
              <span>&gt;</span>
              <span>Lead Overview</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Lead Overview</h1>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {lead && lead.mobileNumber && (
            <Button
              variant="outline"
              className="h-9.5 px-3.5 gap-1.5 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50"
              onClick={() => makeCall(lead.mobileNumber, lead.leadName, lead.id, lead.Organization_Id || 1, lead.companyName, 'Lead')}
              disabled={isPlacingCall}
            >
              <Phone className="h-4 w-4 text-blue-650 dark:text-blue-400" /> Call Lead
            </Button>
          )}

          <Button
            variant="outline"
            className="h-9.5 px-3.5 gap-1.5 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
            onClick={() => router.push(`/marketing/leads/${lead.id}/edit`)}
          >
            <Pencil className="h-4 w-4" /> Edit Lead
          </Button>

          <Button variant="outline" className="h-9.5 px-3.5 gap-1.5 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300" onClick={() => { setActiveTab('Tasks'); setShowAddTask(true); }}>
            <CheckSquare className="h-4 w-4" /> Add Task
          </Button>
          <Button variant="outline" className="h-9.5 px-3.5 gap-1.5 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300" onClick={() => setIsMailOpen(true)}>
            <Mail className="h-4 w-4" /> Send Email
          </Button>



        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-2xs p-6 flex flex-col lg:flex-row gap-6 justify-between items-start">
        {/* Left Side: Avatar & Core info */}
        <div className="flex gap-4 items-start w-full lg:w-auto">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center font-extrabold text-xl shrink-0 ${getAvatarColor(lead.leadName)}`}>
            {getInitials(lead.leadName)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{lead.leadName}</h2>
              <Badge variant="outline" className={`rounded-md font-semibold text-[10px] py-0 px-2 uppercase ${statusStyles[lead.status]}`}>
                {lead.status}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              {lead.companyName} &bull; {lead.industry || 'Tech Sector'}
            </p>
            {/* <div className="flex items-center gap-3.5 text-xs font-bold text-slate-500 flex-wrap pt-0.5">
              <span>Lead Owner: <span className="text-slate-800 dark:text-slate-200">{lead.assignedTo}</span></span>
              <span>&bull;</span>
              <span>Lead Stage: <span className="text-slate-800 dark:text-slate-200">{lead.status}</span></span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                Lead Score: <span className="text-blue-600 dark:text-blue-400 font-extrabold">{leadScoreLoading ? '...' : (leadScoreData?.LeadScore ?? lead.score)}</span>
                <button
                  type="button"
                  onClick={() => setShowScoreParams(true)}
                  className="text-slate-400 hover:text-slate-650 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="View Score Parameters"
                >
                  <Info className="h-3.5 w-3.5 text-blue-500 inline-block align-middle cursor-pointer" />
                </button>
              </span>
            </div> */}

            <div className="space-y-1.5 pt-1 text-slate-650 dark:text-slate-400 font-medium text-xs">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                <button type="button" onClick={() => setIsMailOpen(true)} className="hover:text-blue-500 transition-colors font-semibold text-left">{lead.email}</button>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                <span className="font-semibold">{lead.mobileNumber}</span>
                {lead.mobileNumber && (
                  <button
                    type="button"
                    onClick={() => makeCall(lead.mobileNumber, lead.leadName, lead.id, lead.Organization_Id || 1, lead.companyName, 'Lead')}
                    disabled={isPlacingCall}
                    className="p-1 hover:bg-blue-50 dark:hover:bg-blue-955/30 rounded-full transition-colors text-blue-600 dark:text-blue-400 cursor-pointer disabled:opacity-50"
                    title="Call Lead via Knowlarity"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-405 shrink-0" />
                <span className="font-semibold">{lead.city}, {lead.state}, {lead.country}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Grid: Metadata Fields */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full lg:w-auto lg:flex-1 max-w-2xl px-2 lg:px-6 py-4 lg:py-0 border-y lg:border-y-0 lg:border-x dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Owner</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Avatar size="sm" className="h-6 w-6">
                <AvatarFallback className={`font-bold text-[9px] ${getOwnerBgColor(lead.assignedTo)}`}>
                  {getOwnerInitials(lead.assignedTo)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{lead.assignedTo}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Created On</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-1">
              {new Date(lead?.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>



          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Status</span>
            <Badge variant="outline" className={`rounded-md font-semibold text-[10px] py-0 px-2 mt-1 uppercase ${statusStyles[lead.status]}`}>
              {lead?.status}
            </Badge>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Modified</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mt-1">
              {new Date(lead?.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating</span>
            <div className="flex items-center gap-0.5 mt-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={async () => {
                    try {
                      await patchUserQualifiedLead(lead.id, { Ratings: String(star) });
                      queryClient.invalidateQueries({ queryKey: ['lead', id] });
                      updateLead(lead.id, { rating: star });
                      toast.success(`Rating updated to ${star} stars`);
                    } catch (err) {
                      toast.error('Failed to update rating');
                    }
                  }}
                  className="focus:outline-none hover:scale-110 transition-transform"
                >
                  <Star className={`h-3.5 w-3.5 ${star <= rating ? 'fill-current' : 'text-slate-200 dark:text-slate-800'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Source</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mt-1">{lead.leadSource}</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Score</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20">
                {leadScoreLoading ? '...' : (leadScoreData?.LeadScore ?? lead.score)}
              </span>
              <button
                type="button"
                onClick={() => setShowScoreParams(true)}
                className="text-slate-400 hover:text-slate-650 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="View Score Parameters"
              >
                <Info className="h-3.5 w-3.5 text-blue-500 cursor-pointer" />
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* Tabs Menu Navigation Bar */}
      <div className="border-b dark:border-slate-800 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
        {tabsList.map((tab) => {
          const isActive = activeTab === tab.name;
          return (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`py-3.5 text-sm font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer relative ${isActive ? 'border-primary text-primary' : 'border-transparent text-slate-505'
                }`}
            >
              {tab.name}
              {tab.count !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-505 dark:bg-slate-800'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panel switcher */}
      <div>
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Hand Column (2 sections wide) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Row 1: Lead Summary & Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Lead Summary Card */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-455 border-b dark:border-slate-800 pb-2">Lead Summary</h3>
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Company Name</span>
                      <span className="text-slate-850 dark:text-slate-250 font-bold">{lead.companyName || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Industry</span>
                      <span className="text-slate-850 dark:text-slate-250 font-bold">{lead.industry || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Company Size</span>
                      <span className="text-slate-850 dark:text-slate-250 font-bold">{lead.noOfEmployees || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Annual Revenue</span>
                      <span className="text-slate-855 dark:text-slate-255 font-bold">
                        {lead.LeadCompanyTurnOver ? `$${lead.LeadCompanyTurnOver.toLocaleString()}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Employees</span>
                      <span className="text-slate-855 dark:text-slate-250 font-bold">{lead.noOfEmployees || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-t dark:border-slate-800/60 pt-2">
                      <span className="text-slate-400">Website</span>
                      {lead.website ? (
                        <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-bold hover:underline">
                          {lead.website} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-550">-</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lead Status Pipeline Stepper */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-455 border-b dark:border-slate-800 pb-2">Lead Status Pipeline</h3>

                  {/* Visual Stepper */}
                  <div className="flex items-center justify-between gap-1 w-full pt-1.5">
                    {['Open', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted'].map((step, idx) => {
                      const pipelineSteps = ['Open', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Converted'];
                      const currentIdx = pipelineSteps.findIndex(s =>
                        lead.status === s ||
                        (s === 'Open' && lead.status === 'New')
                      );
                      const isCurrent = idx === currentIdx;
                      const isPast = currentIdx !== -1 && idx < currentIdx;

                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className={`w-full h-8 flex items-center justify-center text-[10px] font-bold rounded-md relative ${isCurrent ? 'bg-blue-600 text-white font-extrabold shadow-sm' :
                            isPast ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-300' :
                              'bg-slate-50 text-slate-400 dark:bg-slate-950 dark:text-slate-600 border dark:border-slate-800'
                            }`}>
                            {step}
                          </div>
                          {step === 'Open' && lead.createdAt && (
                            <span className="text-[9px] font-bold text-slate-400 mt-1 block text-center">
                              {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Audit details */}
                  <div className="space-y-2 pt-1 text-xs font-semibold">
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Current Status</span>
                      <Badge variant="outline" className={`rounded-md font-semibold text-[10px] py-0 px-2 uppercase ${statusStyles[lead.status]}`}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Changed On</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        }) : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-400">Changed By</span>
                      <div className="flex items-center gap-1.5">
                        <Avatar size="sm" className="h-5 w-5">
                          <AvatarFallback className={`font-bold text-[8px] ${getOwnerBgColor(lead.assignedTo)}`}>
                            {getOwnerInitials(lead.assignedTo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-850 dark:text-slate-200">{lead.assignedTo}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 2: Contact Details & Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Contact Details Card */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-2xs relative space-y-4">
                  <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-455">Contact Details</h3>

                  </div>

                  <div className="space-y-3.5 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Full Name</span>
                      <span className="text-slate-800 dark:text-slate-200 font-bold">{lead.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Email</span>
                      <button type="button" onClick={() => setIsMailOpen(true)} className="text-blue-600 dark:text-blue-400 hover:underline text-left">{lead.email}</button>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Phone</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-800 dark:text-slate-200">{lead.mobileNumber}</span>
                        {lead.mobileNumber && (
                          <button
                            type="button"
                            onClick={() => makeCall(lead.mobileNumber, lead.leadName, lead.id, lead.Organization_Id || 1, lead.companyName, 'Lead')}
                            disabled={isPlacingCall}
                            className="p-1 hover:bg-blue-50 dark:hover:bg-blue-955/30 rounded-full transition-colors text-blue-600 dark:text-blue-400 cursor-pointer disabled:opacity-50"
                            title="Call Lead via Knowlarity"
                          >
                            <PhoneCall className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Mobile</span>
                      <span className="text-slate-800 dark:text-slate-200">{lead.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Job Title</span>
                      <span className="text-slate-850 dark:text-slate-200 font-bold">{lead.designation || 'Representative'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">LinkedIn</span>
                      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                        linkedin.com/in/{lead.leadName.toLowerCase().replace(/ /g, '')} <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Additional Information Card */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-2xs relative space-y-4">
                  <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-455">Additional Information</h3>

                  </div>

                  <div className="space-y-3.5 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Address</span>
                      <span className="text-slate-850 dark:text-slate-200 block leading-relaxed">
                        {lead.addressLine1}, {lead.city}, {lead.state} - {lead.postalCode || '560025'}, {lead.country}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Preferred Contact Method</span>
                      <span className="text-slate-800 dark:text-slate-200">{lead.preferredContactMethod || 'Email'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Best Time to Contact</span>
                      <span className="text-slate-800 dark:text-slate-200">{lead.bestTimeToContact || '10:00 AM - 12:00 PM'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Lead Source Details</span>
                      <span className="text-slate-700 dark:text-slate-400 block leading-relaxed">{lead.leadSourceDetails || 'Demo requested.'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Lead Score</span>
                      <span className="text-slate-800 dark:text-slate-200 font-extrabold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        {lead.score} (High)
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Hand Sidebar */}
            <div className="space-y-6">

              {/* Recent Activity Card */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Recent Activity</h3>
                  <Button variant="link" className="text-blue-650 h-auto p-0 font-bold text-xs" onClick={() => setActiveTab('Activity')}>
                    View All
                  </Button>
                </div>

                {/* Activity Feed Items */}
                <div className="relative border-l dark:border-slate-800 pl-4 space-y-5 py-2">
                  {activities.map((act) => {
                    return (
                      <div key={act.id} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-6.5 top-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-full border dark:border-slate-800">
                          <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-white ${act.type.includes('Call') ? 'bg-emerald-500' :
                            act.type.includes('Email') ? 'bg-indigo-500' :
                              act.type.includes('Note') ? 'bg-amber-500' :
                                act.type.includes('Created') ? 'bg-sky-500' :
                                  'bg-slate-400'
                            }`}>
                            {act.type.includes('Call') ? <Phone className="h-2 w-2" /> :
                              act.type.includes('Email') ? <Mail className="h-2 w-2" /> :
                                act.type.includes('Note') ? <FileText className="h-2 w-2" /> :
                                  act.type.includes('Created') ? <User className="h-2 w-2" /> :
                                    <Compass className="h-2 w-2" />}
                          </div>
                        </div>

                        <div className="text-xs space-y-0.5 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{act.type}</span>
                            {act.status && (
                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded">
                                {act.status}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-650 dark:text-slate-400 leading-relaxed">{act.details}</p>
                          <span className="text-[10px] text-slate-400 font-semibold block pt-0.5">
                            {act.date} {act.user && `• ${act.user}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button variant="outline" className="w-full text-xs font-semibold border-slate-200 dark:border-slate-800 h-9 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl" onClick={() => setActiveTab('Activity')}>
                  View All Activity
                </Button>
              </div>

              {/* Checklist Tasks Widget */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    Tasks
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-505 font-mono">
                      {tasksList.filter(t => !t.completed).length}
                    </span>
                  </h3>
                  <Button variant="link" className="text-blue-650 h-auto p-0 font-bold text-xs" onClick={() => setActiveTab('Tasks')}>
                    View All
                  </Button>
                </div>

                {/* Tasks List */}
                <div className="space-y-3.5">
                  {tasksList.map((tsk) => {
                    return (
                      <div key={tsk.id} className="flex items-start gap-3 justify-between py-0.5">
                        <div className="flex items-start gap-2.5">
                          <div className="text-xs text-left">
                            <p className={`font-semibold ${tsk.completed ? 'line-through text-slate-400 dark:text-slate-605' : 'text-slate-800 dark:text-slate-200'}`}>
                              {tsk.title}
                            </p>
                            <span className={`text-[10px] font-semibold ${tsk.completed ? 'text-slate-405' : 'text-rose-500 font-bold'}`}>
                              Due: {tsk.dueDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${tsk.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20' :
                            tsk.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-950/20' :
                              'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-955/20'
                            }`}>
                            {tsk.status}
                          </span>
                          <Avatar size="sm" className="h-5 w-5 shrink-0">
                            <AvatarFallback className={`font-bold text-[8px] ${getOwnerBgColor(tsk.owner)}`}>
                              {getOwnerInitials(tsk.owner)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Inline Add Task Form */}
                <AnimatePresence>
                  {showAddTask && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddTask}
                      className="space-y-2 border-t dark:border-slate-800 pt-3 text-left overflow-hidden"
                    >
                      <Input
                        placeholder="Task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
                        required
                      />
                      <Input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
                      />
                      <div className="flex gap-2 justify-end pt-1">
                        <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-bold px-2 rounded-lg" onClick={() => setShowAddTask(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" style={{ backgroundColor: primaryColor }} className="text-white h-7 text-[10px] font-bold px-3 rounded-lg">
                          Create
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {!showAddTask && (
                  <Button
                    variant="ghost"
                    className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 h-8 gap-1.5 flex items-center justify-center p-0"
                    onClick={() => setShowAddTask(true)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </Button>
                )}
              </div>

              {/* Sticky Notes Widget */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Notes
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-505 font-mono ml-1">
                      {notesList.length}
                    </span>
                  </h3>
                  <Button variant="link" className="text-blue-650 h-auto p-0 font-bold text-xs" onClick={() => setActiveTab('Notes')}>
                    View All
                  </Button>
                </div>

                {/* Sticky Yellow Notes List */}
                <div className="space-y-3">
                  {notesList.map((nte) => (
                    <div
                      key={nte.id}
                      className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/30 rounded-xl p-4 text-xs relative text-left"
                    >
                      <p className="text-slate-850 dark:text-slate-200 leading-relaxed font-semibold mb-2.5">
                        {nte.content}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase">
                        <span>{nte.date}</span>
                        <span>{nte.user}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Inline Add Note Form */}
                <AnimatePresence>
                  {showAddNote && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddNote}
                      className="space-y-2 border-t dark:border-slate-800 pt-3 text-left overflow-hidden"
                    >
                      <textarea
                        placeholder="Write a note..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[60px] focus:outline-none focus:border-slate-350"
                        required
                      />
                      <div className="flex gap-2 justify-end pt-1">
                        <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-bold px-2 rounded-lg" onClick={() => setShowAddNote(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" style={{ backgroundColor: primaryColor }} className="text-white h-7 text-[10px] font-bold px-3 rounded-lg">
                          Save
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {!showAddNote && (
                  <Button
                    variant="ghost"
                    className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 h-8 gap-1.5 flex items-center justify-center p-0"
                    onClick={() => setShowAddNote(true)}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Note
                  </Button>
                )}
              </div>

              {/* Documents Widget */}
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Documents
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-505 font-mono ml-1">
                      {documentsList.length}
                    </span>
                  </h3>
                  <Button variant="link" className="text-blue-650 h-auto p-0 font-bold text-xs" onClick={() => setActiveTab('Documents')}>
                    View All
                  </Button>
                </div>

                {/* Documents List */}
                <div className="space-y-3">
                  {documentsList.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between border-b dark:border-slate-800/40 pb-2 text-xs">
                      <div className="flex items-center gap-2 text-left">
                        <div className="h-8 w-8 bg-rose-50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 rounded flex items-center justify-center">
                          <File className="h-4.5 w-4.5 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{doc.name}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">{doc.date}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-450 rounded-lg hover:bg-slate-50" onClick={() => toast.success(`Downloading file ${doc.name}`)}>
                        <Download className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="w-full text-xs font-bold text-blue-600 hover:text-blue-700 h-8 gap-1.5 flex items-center justify-center p-0"
                  onClick={handleSimulateDocumentUpload}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Document
                </Button>
              </div>

            </div>

          </div>
        )}

        {/* Tab contents */}
        {/* Activity Tab Panel */}
        {activeTab === 'Activity' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Activity Timeline</h3>
                <Badge variant="outline" className="rounded-md font-semibold text-xs py-0.5 px-2">
                  {activities.length} Activities
                </Badge>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No activities recorded yet.</div>
              ) : (
                <div className="relative border-l dark:border-slate-800 pl-6 space-y-6 py-2 ml-3">
                  {activities.map((act) => (
                    <div key={act.id} className="relative">
                      {/* Dot indicator */}
                      <div className="absolute -left-9.5 top-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-full border dark:border-slate-800">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white ${act.type.toLowerCase().includes('call') ? 'bg-emerald-500' :
                          act.type.toLowerCase().includes('email') || act.type.toLowerCase().includes('mail') ? 'bg-indigo-500' :
                            act.type.toLowerCase().includes('note') ? 'bg-amber-500' :
                              act.type.toLowerCase().includes('created') ? 'bg-sky-500' :
                                'bg-slate-400'
                          }`}>
                          {act.type.toLowerCase().includes('call') ? <Phone className="h-3 w-3" /> :
                            act.type.toLowerCase().includes('email') || act.type.toLowerCase().includes('mail') ? <Mail className="h-3 w-3" /> :
                              act.type.toLowerCase().includes('note') ? <FileText className="h-3 w-3" /> :
                                act.type.toLowerCase().includes('created') ? <User className="h-3 w-3" /> :
                                  <Compass className="h-3 w-3" />}
                        </div>
                      </div>

                      <div className="text-xs space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-white text-sm">{act.type}</span>
                        </div>
                        <p className="text-slate-650 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-850 mt-1">
                          {act.details}
                        </p>
                        <span className="text-[10px] text-slate-400 font-bold block pt-1">
                          {act.date} {act.user && `• Logged by ${act.user}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Log Activity Form */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 h-fit">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b dark:border-slate-800 pb-2">Log New Activity</h3>
              <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Activity Type</label>
                  <Select value={activityType} onValueChange={(val) => setActivityType(val || '')}>
                    <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900">
                      <SelectItem value="Call" className="font-semibold text-xs">Call</SelectItem>
                      <SelectItem value="Meeting" className="font-semibold text-xs">Meeting</SelectItem>
                      <SelectItem value="Email" className="font-semibold text-xs">Email</SelectItem>
                      <SelectItem value="Task" className="font-semibold text-xs">Task</SelectItem>
                      <SelectItem value="Demo" className="font-semibold text-xs">Demo</SelectItem>
                      <SelectItem value="Other" className="font-semibold text-xs">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Activity Title</label>
                  <Input
                    placeholder="e.g. Follow up call, demo presented..."
                    value={activityTask}
                    onChange={(e) => setActivityTask(e.target.value)}
                    className="h-10 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Description</label>
                  <textarea
                    placeholder="Provide details about what happened..."
                    value={activityDesc}
                    onChange={(e) => setActivityDesc(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg min-h-[80px] focus:outline-none focus:border-slate-350"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date</label>
                    <Input
                      type="date"
                      value={activityDate}
                      onChange={(e) => setActivityDate(e.target.value)}
                      className="h-10 text-xs rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Time</label>
                    <Input
                      type="time"
                      value={activityTime}
                      onChange={(e) => setActivityTime(e.target.value)}
                      className="h-10 text-xs rounded-lg"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingActivity}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full text-white font-semibold rounded-lg h-10 hover:opacity-90 active:scale-95 transition-all text-xs"
                >
                  {isSubmittingActivity ? 'Saving...' : 'Log Activity'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Tasks Tab Panel */}
        {activeTab === 'Tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Tasks Checklist</h3>
                <Badge variant="outline" className="rounded-md font-semibold text-xs py-0.5 px-2">
                  {tasksList.length} Total
                </Badge>
              </div>

              {tasksList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No tasks found.</div>
              ) : (
                <div className="space-y-4">
                  {tasksList.map((tsk) => (
                    <div key={tsk.id} className="flex items-start gap-4 justify-between p-4 bg-slate-50/50 dark:bg-slate-955/30 border dark:border-slate-850 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="text-xs text-left space-y-1">
                          <p className={`font-semibold text-sm ${tsk.completed ? 'line-through text-slate-400 dark:text-slate-550' : 'text-slate-800 dark:text-white'}`}>
                            {tsk.title}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold flex-wrap">
                            <span className={tsk.completed ? 'text-slate-400' : 'text-rose-500 font-bold'}>
                              Due: {tsk.dueDate}
                            </span>
                            <span>&bull;</span>
                            <span>Owner: {tsk.owner}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={tsk.status || 'Pending'}
                          onValueChange={(val) => handleUpdateTaskStatus(tsk.id, val)}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-[11px] font-semibold border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 focus:ring-0">
                            <SelectValue placeholder="Pending" />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-slate-900">
                            <SelectItem value="Pending" className="font-semibold text-[11px]">Pending</SelectItem>
                            <SelectItem value="In Progress" className="font-semibold text-[11px]">In Progress</SelectItem>
                            <SelectItem value="Completed" className="font-semibold text-[11px]">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create Task Form */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 h-fit">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b dark:border-slate-800 pb-2">Create New Task</h3>
              <form onSubmit={handleCreateTaskTab} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Task Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Schedule proposal review..."
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="h-10 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Detail task items..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg min-h-[70px] focus:outline-none focus:border-slate-350"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={taskStartDate}
                      onChange={(e) => setTaskStartDate(e.target.value)}
                      className="h-10 text-xs rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="h-10 text-xs rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Priority</label>
                    <Select value={taskPriority} onValueChange={(val) => setTaskPriority(val || '')}>
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
                    <Select value={taskStatus} onValueChange={(val) => setTaskStatus(val || '')}>
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

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Assign To</label>
                  <Select value={taskAssignedTo} onValueChange={(val) => setTaskAssignedTo(val || '')}>
                    <SelectTrigger className="w-full h-10 border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold">
                      <SelectValue placeholder="Choose user..." />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900">
                      {users.map((u: any) => (
                        <SelectItem key={u.id} value={`${u.first_name} ${u.last_name || ''}`.trim()} className="font-semibold text-xs">
                          {`${u.first_name} ${u.last_name || ''}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingTask}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full text-white font-semibold rounded-lg h-10 hover:opacity-90 active:scale-95 transition-all text-xs"
                >
                  {isSubmittingTask ? 'Creating...' : 'Create Task'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Emails Tab Panel */}
        {activeTab === 'Emails' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Emails list */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Emails</h3>
                <Badge variant="outline" className="rounded-md font-semibold text-xs py-0.5 px-2">
                  {emailsState.length} Emails
                </Badge>
              </div>

              {emailsState.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No email activities logged yet.</div>
              ) : (
                <div className="space-y-4">
                  {emailsState.map((em: any) => (
                    <div key={em.id || em.Mail_Id || Math.random()} className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border dark:border-slate-850 rounded-xl space-y-2 text-left">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{em.MailSubject}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold">To: {em.RecevierMailId}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {em.Created_Date ? new Date(em.Created_Date).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-905 p-3 rounded-lg border dark:border-slate-800 whitespace-pre-line">
                        {em.MailBody}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Sent by: {getUserName(em.Created_By)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compose Mail Form */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 h-fit">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b dark:border-slate-800 pb-2">Email</h3>
              <form onSubmit={handleCreateEmail} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">To (Receiver Email)</label>
                  <Input
                    value={lead.email || ''}
                    disabled
                    className="h-10 text-xs rounded-lg bg-slate-50/60 dark:bg-slate-950 border-slate-200 dark:border-slate-800 cursor-not-allowed font-semibold text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Subject <span className="text-red-500">*</span></label>
                  <Input
                    placeholder="Enter email subject..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="h-10 text-xs rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Body <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Enter email body content..."
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg min-h-[120px] focus:outline-none focus:border-slate-350"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingEmail}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full text-white font-semibold rounded-lg h-10 hover:opacity-90 active:scale-95 transition-all text-xs"
                >
                  {isSubmittingEmail ? 'Logging...' : 'Send Email'}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Notes Tab Panel */}
        {activeTab === 'Notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Notes List */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Notes Collection</h3>
                <Badge variant="outline" className="rounded-md font-semibold text-xs py-0.5 px-2">
                  {notesList.length} Notes
                </Badge>
              </div>

              {notesList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No notes added.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {notesList.map((nte) => (
                    <div
                      key={nte.id}
                      className="bg-amber-50/50 dark:bg-amber-955/10 border border-amber-100/50 dark:border-amber-900/30 rounded-2xl p-5 text-xs relative text-left flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-extrabold text-sm text-amber-800 dark:text-amber-400 mb-2 border-b border-amber-100/40 pb-1.5">
                          {nte.subject || 'General Note'}
                        </h4>
                        <p className="text-slate-700 dark:text-slate-305 leading-relaxed font-medium mb-4 whitespace-pre-line">
                          {nte.content}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase border-t dark:border-slate-800/40 pt-2.5">
                        <span>{nte.date}</span>
                        <span>{nte.user}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add Note Form */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-4 h-fit">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b dark:border-slate-800 pb-2">Add New Note</h3>
              <form onSubmit={handleCreateNoteSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Note Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Write your note contents here..."
                    value={noteContent}
                    onChange={(e) => {
                      setNoteContent(e.target.value);
                      if (noteContentError) setNoteContentError('');
                    }}
                    className={`w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border rounded-lg min-h-[120px] focus:outline-none focus:border-slate-350 ${noteContentError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-850'
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
                  className="w-full text-white font-semibold rounded-lg h-10 hover:opacity-90 active:scale-95 transition-all text-xs"
                >
                  {isSubmittingNote ? 'Saving...' : 'Save Note'}
                </Button>
              </form>
            </div>
          </div>
        )}


        {/* Appointments Tab Panel */}
        {activeTab === 'Appointments' && (
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Scheduled Appointments</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage meetings, venue locations, and follow-up status for this lead.</p>
              </div>
              <Button
                onClick={handleOpenAddAppointment}
                style={{ backgroundColor: primaryColor }}
                className="text-white text-xs font-bold h-9 px-4 rounded-xl gap-1.5 cursor-pointer flex items-center"
              >
                <Plus className="h-4 w-4" /> Add Appointment
              </Button>
            </div>

            {meetingsState.length === 0 ? (
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
                    {meetingsState.map((meet: any) => (
                      <tr key={meet.id || meet.LeadMeeting_Id || Math.random()} className="border-b dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors">
                        <td className="py-3 font-semibold font-mono text-slate-800 dark:text-white">{meet.LeadMeeting_Id || `MEET-${meet.id}`}</td>
                        <td className="py-3 font-bold text-slate-800 dark:text-white">{meet.Subject || '-'}</td>
                        <td className="py-3 text-slate-500 font-semibold">
                          <div>{meet.Date ? new Date(meet.Date).toLocaleDateString() : meet.Created_Date || '-'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{meet.FromDate_Time?.substring(0, 5) || ''} - {meet.ToDate_Time?.substring(0, 5) || ''}</div>
                        </td>
                        <td className="py-3 text-slate-500 font-semibold">
                          <div>{meet.Location || '-'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{meet.Venue || ''}</div>
                        </td>
                        <td className="py-3">
                          <Badge className="rounded-md bg-blue-50 text-blue-650 dark:bg-blue-955/20 border-blue-100 dark:border-blue-900/30">
                            {meet.Status || 'Scheduled'}
                          </Badge>
                        </td>
                        <td className="py-3 text-slate-500 max-w-[200px] truncate" title={stripHtml(meet.Details || '')}>
                          {stripHtml(meet.Details || '') || '-'}
                        </td>
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

      </div>

      {/* Add Tag Modal Dialog */}
      <Dialog open={showAddTag} onOpenChange={setShowAddTag}>
        <DialogContent className="max-w-xs dark:bg-slate-900 border dark:border-slate-800">
          <form onSubmit={handleAddTag} className="space-y-4 text-left">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold dark:text-white">Add Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tag Text</label>
              <Input
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                placeholder="e.g. Enterprise, High Value..."
                className="h-10 text-xs rounded-lg"
                required
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddTag(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" style={{ backgroundColor: primaryColor }} className="text-white text-xs px-3 font-semibold">
                Add Tag
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Email Popup Modal */}
      <Dialog open={isMailOpen} onOpenChange={setIsMailOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold dark:text-white text-left">Send Email</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 text-left">
              Log an email sent to {lead ? lead.leadName : 'the lead'}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEmail} className="space-y-4 text-xs py-2">
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Receiver Email</label>
              <Input
                value={lead ? lead.email || '' : ''}
                disabled
                className="h-10 text-xs rounded-lg bg-slate-50/60 dark:bg-slate-950 border-slate-205 dark:border-slate-850 cursor-not-allowed font-semibold text-slate-500"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Subject <span className="text-red-500">*</span></label>
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
                placeholder="Enter email subject (e.g. leave, proposal, meeting)..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="h-10 text-xs rounded-lg"
                required
              />
            </div>
            <div className="space-y-1.5 text-left">
              <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Email Body <span className="text-red-500">*</span></label>
              <textarea
                placeholder="Enter email message body..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-850 rounded-lg min-h-[120px] focus:outline-none focus:border-slate-350"
                required
              />
            </div>
            <DialogFooter className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsMailOpen(false)} className="text-xs rounded-lg h-9">Cancel</Button>
              <Button
                type="submit"
                size="sm"
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold text-xs rounded-lg h-9"
                disabled={isSubmittingEmail}
              >
                {isSubmittingEmail ? 'Sending...' : 'Send'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lead Score Parameters Modal Dialog */}
      <Dialog open={showScoreParams} onOpenChange={setShowScoreParams}>
        <DialogContent className="max-w-2xl dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden p-6 text-slate-800 dark:text-slate-200">
          <DialogHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-50 dark:bg-emerald-955/30 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <DialogTitle className="text-base font-bold dark:text-white text-left">Lead Score Parameters</DialogTitle>
            </div>
          </DialogHeader>

          {/* Modal Tabs Navigation */}
          <div className="flex border-b dark:border-slate-800 mb-4 gap-6">
            {(['Sentimental', 'Fit Score', 'Engagement', 'MQL'] as const).map((tab) => {
              const isActive = scoreModalTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setScoreModalTab(tab)}
                  className={`pb-2.5 text-xs font-bold border-b-2 transition-all relative cursor-pointer ${isActive ? 'border-blue-650 text-blue-650 dark:text-blue-400' : 'border-transparent text-slate-400'
                    }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Modal Tab Content Panel */}
          <div className="min-h-[220px]">
            {scoreModalTab === 'Sentimental' && (
              <div className="overflow-x-auto text-left">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 pt-2 font-bold w-[30%] text-left">Type</th>
                      <th className="pb-3 pt-2 font-bold w-[40%] text-center">Positive/Negative</th>
                      <th className="pb-3 pt-2 font-bold w-[30%] text-right">Sentiment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Email Row */}
                    <tr className="border-b dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-4 font-bold text-blue-600 dark:text-blue-400 text-left">Email</td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${(leadScoreData?.MLData?.Email?.metadata?.Sentiment ?? 'Neutral') === 'Positive' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                          (leadScoreData?.MLData?.Email?.metadata?.Sentiment ?? 'Neutral') === 'Negative' ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30' :
                            'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                          {leadScoreData?.MLData?.Email?.metadata?.Sentiment ?? 'Neutral'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">{leadScoreData?.MLData?.Email?.score ?? 0}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">Total Emails: {leadScoreData?.MLData?.Email?.metadata?.TotalEmails ?? 0}</div>
                      </td>
                    </tr>
                    {/* Audio Row */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-4 font-bold text-blue-600 dark:text-blue-400 text-left">Audio</td>
                      <td className="py-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${(leadScoreData?.MLData?.Audio?.metadata?.Sentiment ?? 'Neutral') === 'Positive' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                          (leadScoreData?.MLData?.Audio?.metadata?.Sentiment ?? 'Neutral') === 'Negative' ? 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/30' :
                            'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                          }`}>
                          {leadScoreData?.MLData?.Audio?.metadata?.Sentiment ?? 'Neutral'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">{leadScoreData?.MLData?.Audio?.score ?? 0}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5">Total Audio: {leadScoreData?.MLData?.Audio?.audio_count ?? 0}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {scoreModalTab === 'Fit Score' && (
              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-850">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Demography Score</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white block mt-1 font-mono">{leadScoreData?.MLData?.Demography?.score ?? 0}</span>
                    <div className="mt-3 space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t dark:border-slate-800 pt-2">
                      <div className="flex justify-between">
                        <span>Country:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{leadScoreData?.MLData?.Demography?.metadata?.Country ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>City:</span>
                        <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{leadScoreData?.MLData?.Demography?.metadata?.City ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-850">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Firmography Score</span>
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white block mt-1 font-mono">{leadScoreData?.MLData?.Firmography?.score ?? 0}</span>
                    <div className="mt-3 space-y-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border-t dark:border-slate-800 pt-2">
                      {!leadScoreData?.MLData?.Firmography?.metadata || Object.keys(leadScoreData.MLData.Firmography.metadata).length === 0 ? (
                        <div className="text-slate-400 text-[11px] font-medium">No firmography metadata available.</div>
                      ) : (
                        Object.entries(leadScoreData.MLData.Firmography.metadata).map(([k, v]: any) => (
                          <div key={k} className="flex justify-between">
                            <span>{k}:</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold font-mono">{v}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {scoreModalTab === 'Engagement' && (
              <div className="overflow-x-auto text-left">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 pt-2 font-bold w-[40%] text-left">Type</th>
                      <th className="pb-3 pt-2 font-bold w-[40%] text-center">Status</th>
                      <th className="pb-3 pt-2 font-bold w-[20%] text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className="border-b dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors cursor-pointer"
                      onClick={() => setShowEngagementOverview(true)}
                    >
                      <td className="py-4 font-bold text-blue-650 dark:text-blue-450 text-left hover:underline">Engagement</td>
                      <td className="py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${engagementStatus.toLowerCase().includes('high') ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' :
                          engagementStatus.toLowerCase().includes('medium') ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900/30' :
                            'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-955/20 dark:text-amber-400 dark:border-amber-900/30'
                          }`}>
                          {engagementStatus}
                        </span>
                      </td>
                      <td className="py-4 text-right font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                        {engagementScore}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {scoreModalTab === 'MQL' && (
              <div className="space-y-4 text-left max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 pt-2 font-bold w-[60%] text-left">Metric</th>
                      <th className="pb-3 pt-2 font-bold w-[40%] text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Email Sentiment Score */}
                    <tr className="border-b dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300 align-middle">Email Sentiment Score</td>
                      <td className="py-3">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 dark:text-white font-mono text-right">{emailScore}</span>
                          <div className="w-44 h-1.5 bg-blue-100 dark:bg-blue-950/40 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, emailScore))}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Audio Sentiment Score */}
                    <tr className="border-b dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300 align-middle">Audio Sentiment Score</td>
                      <td className="py-3">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 dark:text-white font-mono text-right">{audioScore}</span>
                          <div className="w-44 h-1.5 bg-blue-100 dark:bg-blue-950/40 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, audioScore))}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Engagement Score */}
                    <tr className="border-b dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300 align-middle">Engagement Score</td>
                      <td className="py-3">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 dark:text-white font-mono text-right">{engagementScore}</span>
                          <div className="w-44 h-1.5 bg-blue-100 dark:bg-blue-950/40 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, engagementScore))}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Demography Score */}
                    <tr className="border-b dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300 align-middle">Demography Score</td>
                      <td className="py-3">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 dark:text-white font-mono text-right">{demographyScore}</span>
                          <div className="w-44 h-1.5 bg-blue-100 dark:bg-blue-950/40 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, demographyScore))}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Firmography Score */}
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300 align-middle">Firmography Score</td>
                      <td className="py-3">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900 dark:text-white font-mono text-right">{firmographyScore}</span>
                          <div className="w-44 h-1.5 bg-blue-100 dark:bg-blue-950/40 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, firmographyScore))}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Lead Score Formula Box */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border dark:border-slate-850 space-y-2 mt-4 text-left">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Lead Score Formula</div>
                  <div className="text-[11px] font-semibold text-slate-650 dark:text-slate-400 leading-relaxed font-mono">
                    Lead Score = (Email Sentiment × 0.30) + (Engagement × 0.40) + (Demography × 0.20) + (Firmography × 0.10)
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-450 leading-relaxed font-mono">
                    Lead Score = ({emailScore} × 0.30) + ({engagementScore} × 0.40) + ({demographyScore} × 0.20) + ({firmographyScore} × 0.10)
                  </div>
                  <div className="flex flex-col gap-1 pt-2 border-t dark:border-slate-850 mt-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
                      <span>🎯</span>
                      <span>Final Lead Score - {leadScoreData?.LeadScore ?? lead.score}</span>
                    </div>
                    <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                      Engagement Status: <span className="text-slate-800 dark:text-slate-200">{leadScoreData?.MLData?.Engagement?.status ?? 'Not Available'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t dark:border-slate-800 pt-3 flex justify-end">
            <Button type="button" size="sm" onClick={() => setShowScoreParams(false)} className="text-xs h-9 rounded-lg">
              Close
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
                <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Lead Name <span className="text-red-500">*</span></label>
                <Input value={lead.leadName} disabled className="h-10 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 cursor-not-allowed font-semibold text-slate-500" />
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
                <Checkbox id="remindMe" checked={remindMe} onCheckedChange={(checked) => setRemindMe(!!checked)} className="rounded-md h-4 w-4" />
                <label htmlFor="remindMe" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Remind Me (Optional)</label>
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
                        <Checkbox id="repeatEveryChecked" checked={repeatEveryChecked} onCheckedChange={(checked) => setRepeatEveryChecked(!!checked)} className="rounded-md h-4 w-4" />
                        <label htmlFor="repeatEveryChecked" className="font-bold text-slate-500 uppercase tracking-wider text-[10px] cursor-pointer">Repeat Every</label>
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

      {/* Engagement Overview Modal Dialog */}
      <Dialog open={showEngagementOverview} onOpenChange={setShowEngagementOverview}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-6 text-slate-800 dark:text-slate-200">
          <DialogHeader className="flex flex-row items-center justify-between border-b dark:border-slate-800 pb-3">
            <DialogTitle className="text-sm font-bold dark:text-white text-left">Engagement Overview</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-left">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase font-mono">Overall Engagement Score: {engagementScore}</div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-white mt-1">
                Engagement Status:{' '}
                <span className={`font-extrabold ${engagementStatus.toLowerCase().includes('high') ? 'text-emerald-600 dark:text-emerald-400' :
                  engagementStatus.toLowerCase().includes('medium') ? 'text-blue-600 dark:text-blue-450' :
                    'text-amber-600 dark:text-amber-450'
                  }`}>{engagementStatus || 'Low Engagement'}</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t dark:border-slate-800 pt-3 text-xs">
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-700 dark:text-slate-350">Email Engagement</h4>
                <div className="space-y-1 text-slate-500 font-semibold">
                  <div>Total Mail Count: <span className="font-bold text-slate-800 dark:text-slate-200">{leadScoreData?.MLData?.Engagement?.metadata?.TotalMailCount ?? 0}</span></div>
                  <div>Opened Mails Count: <span className="font-bold text-slate-800 dark:text-slate-200">{leadScoreData?.MLData?.Engagement?.metadata?.opened_mails_count ?? 0}</span></div>
                  <div>Download Attachment Count: <span className="font-bold text-slate-800 dark:text-slate-200">{leadScoreData?.MLData?.Engagement?.metadata?.download_attachment_count ?? 0}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-700 dark:text-slate-350">Status Info</h4>
                <div className="space-y-1 text-slate-500 font-semibold">
                  <div>ENG Status: <span className="font-bold text-slate-800 dark:text-slate-200">{engagementStatus || '-'}</span></div>
                  <div>Overall ENG Score: <span className="font-bold text-slate-800 dark:text-slate-200">{engagementScore}</span></div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t dark:border-slate-800 pt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowEngagementOverview(false)}
              className="text-xs h-9 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold px-4 cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
