'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Plus,
  Trash2,
  Users,
  FileText,
  User,
  Tag,
  Save,
  CheckCircle,
  Eye,
  Info,
  Clock,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Paperclip,
  Check,
  Building,
  ChevronDown,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { useTaskStore } from '@/store/useTaskStore';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Task, Subtask } from '@/types/tasks';
import { fetchUsersList, createTask as apiCreateTask, updateTask as apiUpdateTask, fetchTaskById } from '@/service/api/Leads/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AvatarImage } from '@/components/ui/avatar';

function getInitials(name: string): string {
  if (!name) return '';
  return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
}

function avatarBg(name: string): string {
  if (!name) return 'bg-slate-500';
  const palette = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500'
  ];
  return palette[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
}

function formatTimeFromISO(isoStr: string): string {
  try {
    const timePart = isoStr.split('T')[1];
    if (!timePart) return '09:30 AM';
    const parts = timePart.split(':');
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return '09:30 AM';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const hFormatted = h < 10 ? '0' + h : String(h);
    const mFormatted = m < 10 ? '0' + m : String(m);
    return `${hFormatted}:${mFormatted} ${ampm}`;
  } catch {
    return '09:30 AM';
  }
}

function formatTime24hFromISO(isoStr: string): string {
  try {
    const timePart = isoStr.split('T')[1] || isoStr.split(' ')[1];
    if (!timePart) return '09:30';
    const parts = timePart.split(':');
    const h = parts[0];
    const m = parts[1];
    if (!h || !m) return '09:30';
    return `${h}:${m}`;
  } catch {
    return '09:30';
  }
}

function combineDateAndTime(dateStr: string, timeStr: string): string {
  let hours = 9;
  let minutes = 30;
  try {
    const cleanTime = timeStr.trim().toLowerCase();
    const isPM = cleanTime.includes('pm');
    const isAM = cleanTime.includes('am');
    const digits = cleanTime.replace(/[ap]m/, '').trim();
    const parts = digits.split(':');
    if (parts.length >= 1) {
      hours = parseInt(parts[0], 10);
    }
    if (parts.length >= 2) {
      minutes = parseInt(parts[1], 10);
    }
    if (isPM && hours < 12) {
      hours += 12;
    }
    if (isAM && hours === 12) {
      hours = 0;
    }
  } catch (e) {
    console.error("Error parsing time string", timeStr, e);
  }
  const hFormatted = hours < 10 ? '0' + hours : String(hours);
  const mFormatted = minutes < 10 ? '0' + minutes : String(minutes);
  return `${dateStr}T${hFormatted}:${mFormatted}:00`;
}


const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Task Title is required'),
  type: z.enum(['Call', 'Email', 'Meeting', 'Task']),
  category: z.string().trim().min(1, 'Category is required'),
  relatedTo: z.string().optional(),
  relatedToType: z.enum(['Company', 'Lead', 'Contact', 'Deal', 'Project']).optional().default('Company'),
  assignedTo: z.string().trim().min(1, 'Please assign the task to a user'),
  priority: z.enum(['High', 'Medium', 'Low']).optional().default('High'),
  status: z.enum(['Not Started', 'In Progress', 'Pending', 'Completed', 'Overdue']).optional().default('Not Started'),
  completion: z.string().optional(),

  // Schedule
  startDate: z.string().optional(),
  startTime: z.string().optional(),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  repeat: z.string().optional(),

  // Description
  description: z.string().optional()
});

type FormValues = z.infer<typeof taskFormSchema>;

export default function TaskFormPage() {
  const { id } = useParams() as { id?: string };
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const { primaryColor, isSidebarOpen } = useStore();
  const { tasks, addTask, updateTask } = useTaskStore();
  const queryClient = useQueryClient();

  const isEditMode = !!id;

  // Fetch users from backend
  const { data: usersRaw } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
  });

  const users = React.useMemo(() => {
    if (Array.isArray(usersRaw)) {
      return usersRaw.map((u: any) => ({
        id: u.id,
        name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username || 'Unknown',
        email: u.email || `${u.username || 'user'}@crmfarmit.com`,
      }));
    }
    return [];
  }, [usersRaw]);

  // Fetch task from backend if editing
  const { data: apiTaskData, isLoading: isLoadingTask } = useQuery({
    queryKey: ['task', id],
    queryFn: () => fetchTaskById(id!),
    enabled: isEditMode && !!id,
  });

  const [selectedAssignedUserId, setSelectedAssignedUserId] = useState<number | null>(null);

  // Subtasks checklist state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  // Tags state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Reminders state (New Design)
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderBeforeValue, setReminderBeforeValue] = useState('1');
  const [reminderBeforeUnit, setReminderBeforeUnit] = useState('Hrs');
  const [reminderRepeatEnabled, setReminderRepeatEnabled] = useState(true);
  const [reminderRepeatValue, setReminderRepeatValue] = useState('10');
  const [reminderRepeatUnit, setReminderRepeatUnit] = useState('Mins');
  const [reminderStatus, setReminderStatus] = useState('Pending');
  const [reminderMessage, setReminderMessage] = useState('');

  // "Create another task" checkbox state
  const [createAnother, setCreateAnother] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(taskFormSchema) as any,
    mode: 'onTouched',
    defaultValues: {
      type: 'Task',
      category: 'Follow Up',
      relatedTo: '',
      relatedToType: 'Company',
      assignedTo: '',
      priority: 'High',
      status: 'Not Started',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:30',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '10:00',
      repeat: 'Does not repeat',
      completion: '0',
      description: ''
    }
  });

  // Sync edits if in edit mode (from API data)
  useEffect(() => {
    if (isEditMode && apiTaskData) {
      let assignedName = '';
      let assignedIdStr = '';
      if (apiTaskData.Assigned_To) {
        if (typeof apiTaskData.Assigned_To === 'object') {
          const u = apiTaskData.Assigned_To;
          assignedName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || '';
          assignedIdStr = String(u.id);
        } else {
          assignedIdStr = String(apiTaskData.Assigned_To);
          const foundUser = users.find(u => String(u.id) === assignedIdStr);
          if (foundUser) {
            assignedName = foundUser.name;
          } else {
            assignedName = apiTaskData.Assigned_person || '';
          }
        }
      } else {
        assignedName = apiTaskData.Assigned_person || '';
      }

      if (assignedIdStr) {
        setSelectedAssignedUserId(Number(assignedIdStr));
      }

      reset({
        title: apiTaskData.TaskName || '',
        type: (apiTaskData.Task_Type || 'Task') as any,
        category: apiTaskData.Task_Category || 'Follow Up',
        relatedTo: apiTaskData.Task_Resource || '',
        relatedToType: (apiTaskData.Related_To || 'Company') as any,
        assignedTo: assignedName,
        priority: (apiTaskData.Priority || 'High') as any,
        status: (apiTaskData.Status || 'Not Started') as any,
        startDate: apiTaskData.Start_Date ? apiTaskData.Start_Date.split('T')[0] : new Date().toISOString().split('T')[0],
        startTime: apiTaskData.Start_Date ? formatTime24hFromISO(apiTaskData.Start_Date) : '09:30',
        dueDate: apiTaskData.Due_Date ? apiTaskData.Due_Date.split('T')[0] : new Date().toISOString().split('T')[0],
        dueTime: apiTaskData.Due_Date ? formatTime24hFromISO(apiTaskData.Due_Date) : '10:00',
        repeat: apiTaskData.repeat || 'Does not repeat',
        completion: apiTaskData.Completion ? String(apiTaskData.Completion) : '0',
        description: apiTaskData.Task_Desc || ''
      });

      if (apiTaskData.UserReminder && typeof apiTaskData.UserReminder === 'object') {
        const rem = apiTaskData.UserReminder;
        setReminderEnabled(true);
        
        if (rem.RemainderDueDate) {
          const parts = rem.RemainderDueDate.trim().split(' ');
          if (parts.length >= 2 && ['Mins', 'Hrs', 'Days'].includes(parts[1])) {
            setReminderBeforeValue(parts[0]);
            setReminderBeforeUnit(parts[1]);
          } else {
            setReminderBeforeValue('1');
            setReminderBeforeUnit('Hrs');
          }
        } else {
          setReminderBeforeValue('1');
          setReminderBeforeUnit('Hrs');
        }

        if (rem.Repeat_EveryDay && rem.Repeat_EveryDay !== 'No') {
          setReminderRepeatEnabled(true);
          const parts = rem.Repeat_EveryDay.trim().split(' ');
          if (parts.length >= 2) {
            setReminderRepeatValue(parts[0]);
            setReminderRepeatUnit(parts[1]);
          } else {
            setReminderRepeatValue('10');
            setReminderRepeatUnit('Mins');
          }
        } else {
          setReminderRepeatEnabled(false);
          setReminderRepeatValue('10');
          setReminderRepeatUnit('Mins');
        }

        setReminderStatus(rem.Status || 'Pending');
        setReminderMessage(rem.RemainderMessage || '');
      } else {
        setReminderEnabled(false);
        setReminderBeforeValue('1');
        setReminderBeforeUnit('Hrs');
        setReminderRepeatEnabled(true);
        setReminderRepeatValue('10');
        setReminderRepeatUnit('Mins');
        setReminderStatus('Pending');
        setReminderMessage('');
      }

      if (Array.isArray(apiTaskData.Sub_Task)) {
        setSubtasks(apiTaskData.Sub_Task.map((st: any, idx: number) => ({
          id: `SUB-${idx}-${Date.now()}`,
          title: st.Sub_Task_Name || '',
          completed: st.Status === 'Completed',
          assignedTo: assignedName,
          dueDate: apiTaskData.Due_Date ? apiTaskData.Due_Date.split('T')[0] : ''
        })));
      }

      if (Array.isArray(apiTaskData.Tags)) {
        setSelectedTags(apiTaskData.Tags);
      }
    }
  }, [isEditMode, apiTaskData, reset, users]);

  // Prefill dates from query parameters when creating a task
  useEffect(() => {
    if (!isEditMode && dateParam) {
      setValue('startDate', dateParam);
      setValue('dueDate', dateParam);
    }
  }, [isEditMode, dateParam, setValue]);

  // Watched values to sync select buttons
  const watchedType = watch('type');
  const watchedCategory = watch('category');
  const watchedRelatedType = watch('relatedToType');
  const watchedAssigned = watch('assignedTo');
  const watchedPriority = watch('priority');
  const watchedStatus = watch('status');
  const watchedRepeat = watch('repeat');
  const watchedCompletion = watch('completion');



  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    if (!selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
    }
    setTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const onInvalid = (fieldErrors: any) => {
    console.warn("Task form validation errors:", fieldErrors);
    if (fieldErrors.title?.message) {
      toast.error(fieldErrors.title.message);
    } else if (fieldErrors.assignedTo?.message) {
      toast.error(fieldErrors.assignedTo.message);
    } else if (fieldErrors.type?.message) {
      toast.error(fieldErrors.type.message);
    } else if (fieldErrors.category?.message) {
      toast.error(fieldErrors.category.message);
    } else {
      const firstErr = Object.values(fieldErrors)[0] as any;
      toast.error(firstErr?.message || 'Please fill in all mandatory fields.');
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (!data.title || !data.title.trim()) {
        toast.error('Task Title is required');
        return;
      }
      if (!data.assignedTo || !data.assignedTo.trim()) {
        toast.error('Please assign the task to a user');
        return;
      }

      const loggedInUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 1) : 1;
      const getPkValue = (val: any, defaultVal: any = 1): any => {
        if (val === null || val === undefined) return defaultVal;
        if (typeof val === 'object') {
          if (Array.isArray(val)) {
            return getPkValue(val[0], defaultVal);
          }
          return val.id || val.id_user || defaultVal;
        }
        return val;
      };
      const createdById = getPkValue(apiTaskData?.Created_By, loggedInUserId);

      let finalAssignedToId = selectedAssignedUserId;
      if (!finalAssignedToId && data.assignedTo) {
        const found = users.find(u => u.name === data.assignedTo);
        if (found) finalAssignedToId = found.id;
      }

      let reminderVal: any = null;
      if (reminderEnabled) {
        const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
        const userId = storedUserId ? parseInt(storedUserId, 10) : 71;

        const existingReminder = apiTaskData?.UserReminder;
        reminderVal = {
          id: existingReminder && typeof existingReminder === 'object' ? existingReminder.id : null,
          Created_By: existingReminder && typeof existingReminder === 'object' ? existingReminder.Created_By : userId,
          Updated_By: userId,
          ReminderFor: `Reminder for ${data.title}`,
          Repeat_EveryDay: reminderRepeatEnabled ? `${reminderRepeatValue} ${reminderRepeatUnit}` : 'No',
          RemainderDueDate: `${reminderBeforeValue} ${reminderBeforeUnit}`,
          RemainderMessage: reminderMessage || 'Test',
          Status: reminderStatus
        };
      }

      // Helper: always send only the pk for FK fields (API returns them as objects)
      const toId = (val: any) => (val && typeof val === 'object' ? val.id ?? null : val ?? null);

      const payload = {
        ...(apiTaskData || {}),
        Organization_Id: typeof window !== 'undefined' ? Number(localStorage.getItem('Organization_Id') || 1) : 1,
        Lead_Id: toId(apiTaskData?.Lead_Id),
        Deal_Id: toId(apiTaskData?.Deal_Id),
        Project: toId(apiTaskData?.Project),
        CRMUserLeadMeeting_id: toId(apiTaskData?.CRMUserLeadMeeting_id),
        EducationalLead_Id: toId(apiTaskData?.EducationalLead_Id),
        RealestateLead_Id: toId(apiTaskData?.RealestateLead_Id),
        RealestateDeal_Id: toId(apiTaskData?.RealestateDeal_Id),
        TaskName: data.title.trim(),
        Task_Desc: data.description || '',
        Task_Type: data.type,
        Task_Category: data.category,
        Task_Resource: data.relatedTo,
        Task_Related: data.relatedTo,
        Related_To: data.relatedToType,
        Assigned_To: finalAssignedToId,
        Assigned_person: data.assignedTo,
        Priority: data.priority,
        Status: data.status,
        Start_Date: combineDateAndTime(data.startDate || new Date().toISOString().split('T')[0], data.startTime || '09:30'),
        Due_Date: combineDateAndTime(data.dueDate || new Date().toISOString().split('T')[0], data.dueTime || '10:00'),
        Tags: selectedTags,
        UserReminder: reminderVal,
        Completion: data.completion || '0',
        Sub_Task: subtasks.map(st => ({
          Sub_Task_Name: st.title,
          Status: st.completed ? 'Completed' : 'Pending',
          Completion: st.completed ? '100' : '0'
        })),
        Created_By: createdById,
        Updated_By: loggedInUserId,
      };

      console.log("React Hook Form data submitted:", data);
      console.log("Original apiTaskData:", apiTaskData);
      console.log("Final task payload constructed for API:", payload);

      if (isEditMode && id) {
        await apiUpdateTask(id, payload as any);
        toast.success(`Task updated successfully`);
        queryClient.invalidateQueries({ queryKey: ['allTasksNew'] });
        queryClient.invalidateQueries({ queryKey: ['task', id] });
        if (dateParam) {
          router.push('/tasks/calendar');
        } else {
          router.push('/tasks');
        }
      } else {
        await apiCreateTask(payload as any);
        toast.success(`Task created successfully`);
        queryClient.invalidateQueries({ queryKey: ['allTasksNew'] });
        if (createAnother) {
          reset({
            title: '',
            description: '',
            assignedTo: '',
            completion: '0'
          });
          setSubtasks([]);
          setSelectedTags([]);
          setReminderEnabled(false);
          setReminderBeforeValue('1');
          setReminderBeforeUnit('Hrs');
          setReminderRepeatEnabled(true);
          setReminderRepeatValue('10');
          setReminderRepeatUnit('Mins');
          setReminderStatus('Pending');
          setReminderMessage('');
          setSelectedAssignedUserId(null);
        } else {
          if (dateParam) {
            router.push('/tasks/calendar');
          } else {
            router.push('/tasks');
          }
        }
      }
    } catch (err) {
      toast.error('Failed to save task.');
    }
  };

  if (isEditMode && isLoadingTask) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500 font-semibold text-sm">Loading task details...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 pb-28 text-left"
    >
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-[5px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => {
              if (dateParam) {
                router.push('/tasks/calendar');
              } else {
                router.push('/tasks');
              }
            }}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
              <NavLink to="/tasks" className="hover:text-slate-600 transition-colors">Tasks</NavLink>
              <span className="text-slate-300">&gt;</span>
              <span className="text-slate-500 font-medium">{isEditMode ? 'Edit Task' : 'Create Task'}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isEditMode ? 'Edit Task Details' : 'Create New Task'}
            </h1>
            <p className="text-xs text-slate-450 mt-1">
              {isEditMode ? 'Modify task properties, schedule details, and checklists.' : 'Add a new task to keep track of your follow-ups and activities.'}
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            className="h-9.5 px-6 rounded-[5px] text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            onClick={() => router.push('/tasks')}
          >
            Cancel
          </Button>

          {/* Save Task Split Button */}
          <div className="flex items-center overflow-hidden rounded-[5px] shadow-sm">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit, onInvalid)}
              className="h-9.5 px-5 rounded-none text-xs font-semibold text-white hover:opacity-95 transition-all border-r border-blue-500/20"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Save Task')}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Columns (Form content) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Task Information */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Task Information</h3>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

                {/* Row 1 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Task Title *</Label>
                  <Input
                    {...register('title')}
                    placeholder="Enter task title"
                    className={`h-10 rounded-[5px] ${errors.title ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                  />
                  {errors.title && <p className="text-[10px] text-rose-500 font-bold">{errors.title.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type *</Label>
                  <Select value={watchedType} onValueChange={(val) => setValue('type', val as any, { shouldValidate: true })}>
                    <SelectTrigger className={`h-10 text-xs font-semibold rounded-[5px] ${errors.type ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Task">Task</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-[10px] text-rose-500 font-bold">{errors.type.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category *</Label>
                  <Select value={watchedCategory} onValueChange={(val) => setValue('category', val || '', { shouldValidate: true })}>
                    <SelectTrigger className={`h-10 text-xs font-semibold rounded-[5px] ${errors.category ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Follow Up">Follow Up</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="Planning">Planning</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-[10px] text-rose-500 font-bold">{errors.category.message}</p>}
                </div>

                {/* Row 2 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Related To</Label>
                  <div className="relative flex items-center">
                    {/* Type selector icon dropdown */}
                    <div className="absolute left-3 z-10 flex items-center gap-1 border-r pr-2 border-slate-200 dark:border-slate-850">
                      <Select value={watchedRelatedType} onValueChange={(val) => setValue('relatedToType', val as any, { shouldValidate: true })}>
                        <SelectTrigger className="h-6 border-0 bg-transparent p-0 w-auto text-xs focus:ring-0 shadow-none font-semibold hover:bg-transparent flex items-center gap-0.5">
                          <div className="flex items-center gap-1 text-slate-500">
                            {watchedRelatedType === 'Company' && <Building className="h-4 w-4" />}
                            {watchedRelatedType === 'Lead' && <Users className="h-4 w-4" />}
                            {watchedRelatedType === 'Contact' && <User className="h-4 w-4" />}
                            {watchedRelatedType === 'Deal' && <FileText className="h-4 w-4" />}
                            {watchedRelatedType === 'Project' && <FolderOpen className="h-4 w-4" />}
                          </div>
                          <ChevronDown className="h-3 w-3 text-slate-400" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Company">Company</SelectItem>
                          <SelectItem value="Lead">Lead</SelectItem>
                          <SelectItem value="Contact">Contact</SelectItem>
                          <SelectItem value="Deal">Deal</SelectItem>
                          <SelectItem value="Project">Project</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* The actual related to input */}
                    <Input
                      {...register('relatedTo')}
                      placeholder="Select or search..."
                      className={`h-10 pl-[68px] rounded-[5px] ${errors.relatedTo ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                    />
                  </div>
                  {errors.relatedTo && <p className="text-[10px] text-rose-500 font-bold">{errors.relatedTo.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Assign To *</Label>
                  <Select value={watchedAssigned} onValueChange={(val) => {
                    setValue('assignedTo', val || '', { shouldValidate: true });
                    const found = users.find(u => u.name === val);
                    if (found) {
                      setSelectedAssignedUserId(found.id);
                    } else {
                      setSelectedAssignedUserId(null);
                    }
                  }}>
                    <SelectTrigger className={`h-10 text-xs font-semibold rounded-[5px] px-3 ${errors.assignedTo ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}>
                      {watchedAssigned ? (
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                              avatarBg(watchedAssigned)
                            )}>
                              {getInitials(watchedAssigned)}
                            </span>
                            <span className="text-slate-700 dark:text-slate-250 font-semibold">{watchedAssigned}</span>
                            <span
                              role="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setValue('assignedTo', '', { shouldValidate: true });
                                setSelectedAssignedUserId(null);
                              }}
                              className="text-slate-400 hover:text-slate-655 font-bold ml-1 text-[11px] cursor-pointer select-none"
                            >
                              &times;
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Assign to</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.assignedTo && <p className="text-[10px] text-rose-500 font-bold">{errors.assignedTo.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-505 uppercase tracking-wider">Priority</Label>
                  <Select value={watchedPriority} onValueChange={(val) => setValue('priority', val as any, { shouldValidate: true })}>
                    <SelectTrigger className={`h-10 text-xs font-semibold rounded-[5px] ${errors.priority ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}>
                      {watchedPriority ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            watchedPriority === 'High' ? 'bg-red-500' :
                              watchedPriority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                          )} />
                          <span>{watchedPriority}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Select priority</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">🔴 High</SelectItem>
                      <SelectItem value="Medium">🟡 Medium</SelectItem>
                      <SelectItem value="Low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && <p className="text-[10px] text-rose-500 font-bold">{errors.priority.message}</p>}
                </div>

                {/* Row 3 */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Status</Label>
                  <Select value={watchedStatus} onValueChange={(val) => setValue('status', val as any, { shouldValidate: true })}>
                    <SelectTrigger className={`h-10 text-xs font-semibold rounded-[5px] ${errors.status ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}>
                      {watchedStatus ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "h-2 w-2 rounded-full",
                            watchedStatus === 'Not Started' ? 'bg-blue-500' :
                              watchedStatus === 'In Progress' ? 'bg-amber-500' :
                                watchedStatus === 'Pending' ? 'bg-yellow-500' :
                                  watchedStatus === 'Completed' ? 'bg-emerald-500' : 'bg-rose-500'
                          )} />
                          <span>{watchedStatus}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Select status</span>
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Started">Not Started</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-[10px] text-rose-500 font-bold">{errors.status.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion</Label>
                  <Select value={watchedCompletion} onValueChange={(val) => setValue('completion', val || undefined, { shouldValidate: true })}>
                    <SelectTrigger className={`h-10 text-xs font-semibold rounded-[5px] ${errors.completion ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-200 dark:border-slate-800'}`}>
                      {watchedCompletion !== undefined ? `${watchedCompletion}%` : '0%'}
                    </SelectTrigger>
                    <SelectContent>
                      {['0', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100'].map((pct) => (
                        <SelectItem key={pct} value={pct}>{pct}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.completion && <p className="text-[10px] text-rose-500 font-bold">{errors.completion.message}</p>}
                </div>

                {/* Empty column to keep alignment since tags is moved to full row */}
                <div className="hidden sm:block" />

                {/* Row 4 */}
                <div className="col-span-1 sm:col-span-3 space-y-1.5">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</Label>
                  <div
                    className="min-h-10 w-full border border-slate-200 dark:border-slate-800 rounded-[5px] bg-white dark:bg-slate-900 px-3 py-1.5 flex flex-wrap items-center gap-1.5 cursor-text focus-within:ring-1 focus-within:ring-slate-450 transition-all"
                    onClick={() => document.getElementById('tags-inline-input')?.focus()}
                  >
                    {selectedTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-[3px] text-slate-700 dark:text-slate-300">
                        {tag}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTag(tag);
                          }}
                          className="text-slate-400 hover:text-slate-655 ml-0.5 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <input
                      id="tags-inline-input"
                      type="text"
                      placeholder={selectedTags.length === 0 ? "Select or add tags" : ""}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          if (tagInput.trim()) {
                            if (!selectedTags.includes(tagInput.trim())) {
                              setSelectedTags([...selectedTags, tagInput.trim()]);
                            }
                            setTagInput('');
                          }
                        } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
                          handleRemoveTag(selectedTags[selectedTags.length - 1]);
                        }
                      }}
                      className="flex-1 bg-transparent border-0 p-0 text-xs focus:ring-0 outline-none placeholder-slate-400 min-w-[120px]"
                    />
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 2: Reminders */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="remind-me-toggle"
                  checked={reminderEnabled}
                  onCheckedChange={(checked) => setReminderEnabled(!!checked)}
                  className="h-5 w-5 rounded-full border-slate-350 dark:border-slate-850 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
                />
                <label htmlFor="remind-me-toggle" className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                  Remind Me (Optional)
                </label>
              </div>
            </div>
            <CardContent className="p-6">
              {reminderEnabled ? (
                <div className="space-y-5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Reminder Settings
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* First Reminder Before Due */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-extrabold text-slate-505 dark:text-slate-400 uppercase tracking-wider">
                        First Reminder Before Due
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={reminderBeforeValue}
                          onChange={(e) => setReminderBeforeValue(e.target.value)}
                          className="h-10 w-24 rounded-[8px] border-slate-200 dark:border-slate-855 text-xs font-semibold text-center"
                        />
                        <Select value={reminderBeforeUnit} onValueChange={(val) => setReminderBeforeUnit(val || 'Hrs')}>
                          <SelectTrigger className="h-10 w-32 border-slate-200 dark:border-slate-855 text-xs font-semibold rounded-[8px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mins">Mins</SelectItem>
                            <SelectItem value="Hrs">Hrs</SelectItem>
                            <SelectItem value="Days">Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Repeat Every */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="reminder-repeat-toggle"
                          checked={reminderRepeatEnabled}
                          onCheckedChange={(checked) => setReminderRepeatEnabled(!!checked)}
                          className="h-4 w-4 rounded-full border-slate-350 dark:border-slate-855 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 cursor-pointer"
                        />
                        <label htmlFor="reminder-repeat-toggle" className="text-[10px] font-extrabold text-slate-505 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none">
                          Repeat Every
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          disabled={!reminderRepeatEnabled}
                          value={reminderRepeatValue}
                          onChange={(e) => setReminderRepeatValue(e.target.value)}
                          className="h-10 w-24 rounded-[8px] border-slate-200 dark:border-slate-855 text-xs font-semibold text-center disabled:opacity-50"
                        />
                        <Select
                          disabled={!reminderRepeatEnabled}
                          value={reminderRepeatUnit}
                          onValueChange={(val) => setReminderRepeatUnit(val || 'Mins')}
                        >
                          <SelectTrigger className="h-10 w-32 border-slate-200 dark:border-slate-855 text-xs font-semibold rounded-[8px] disabled:opacity-50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mins">Mins</SelectItem>
                            <SelectItem value="Hrs">Hrs</SelectItem>
                            <SelectItem value="Days">Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Reminder Status */}
                  <div className="space-y-2 max-w-[280px]">
                    <Label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                      Reminder Status
                    </Label>
                    <Select value={reminderStatus} onValueChange={(val) => setReminderStatus(val || 'Pending')}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-855 text-xs font-semibold rounded-[8px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reminder Message */}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-wider">
                      Reminder Message
                    </Label>
                    <Textarea
                      placeholder="Enter reminder content..."
                      value={reminderMessage}
                      onChange={(e) => setReminderMessage(e.target.value)}
                      className="min-h-[80px] rounded-[8px] border-slate-200 dark:border-slate-855 text-xs p-3 focus-visible:ring-1 focus-visible:ring-slate-450"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 py-1">
                  <Info className="h-4.5 w-4.5 text-slate-400" />
                  <p className="text-xs">Reminders are disabled for this task.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 3: Description */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Description</h3>
            </div>
            <CardContent className="p-6">
              <div className="border border-slate-200 dark:border-slate-800 rounded-[5px] overflow-hidden flex flex-col bg-white dark:bg-slate-900">
                {/* Rich text editor likeness toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-955 text-slate-500">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px]" title="Bold"><Bold className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px]" title="Italic"><Italic className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px]" title="Underline"><Underline className="h-4 w-4" /></Button>

                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px] line-through text-xs font-semibold" title="Strikethrough">U</Button>

                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px]" title="Bullet List"><List className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px]" title="Ordered List"><ListOrdered className="h-4 w-4" /></Button>

                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px]" title="Add Link"><Link2 className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px]" title="Insert Image"><ImageIcon className="h-4 w-4" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-slate-200/50 rounded-[5px]" title="Insert Document"><Paperclip className="h-4 w-4" /></Button>
                </div>

                <div className="relative">
                  <Textarea
                    {...register('description')}
                    placeholder="Enter task description..."
                    className="min-h-[160px] w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-xs leading-relaxed rounded-none p-3 pb-8"
                  />
                  <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 font-medium pointer-events-none">
                    {(watch('description') || '').length} / 2000
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Columns (Widgets) */}
        <div className="space-y-6">

          {/* Widget 1: Quick Tips */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Quick Tips</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex gap-2.5 items-start">
                  <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Well-defined tasks help you and your team stay organized and never miss important follow-ups.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Be clear and specific with the task title.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Set the right priority and due date.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Assign to the right person.</span>
                </li>
                <li className="flex gap-2.5 items-start">
                  <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Use reminders to stay on track.</span>
                </li>
              </ul>
            </CardContent>
          </Card>



        </div>

      </form>


    </motion.div>
  );
}
