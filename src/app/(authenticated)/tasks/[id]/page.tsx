'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';
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
  MoreHorizontal,
  ChevronDown,
  Paperclip,
  CheckSquare,
  MessageSquare,
  History,
  Building,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Task, Subtask, TaskComment } from '@/types/tasks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTaskById, patchTask, updateTask, deleteTask as apiDeleteTask } from '@/service/api/Leads/api';

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

// Convert HH:MM (24h) string to 12-hour AM/PM display format
function convertTo12Hour(hhmm: string): string {
  try {
    const parts = hhmm.split(':');
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return hhmm;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const hf = h < 10 ? '0' + h : String(h);
    const mf = m < 10 ? '0' + m : String(m);
    return `${hf}:${mf} ${ampm}`;
  } catch {
    return hhmm;
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

function mapBackendTaskToFrontend(b: any): Task {
  if (!b) return {} as Task;

  let assignedName = '—';
  if (b.Assigned_To) {
    if (typeof b.Assigned_To === 'object') {
      const u = b.Assigned_To;
      assignedName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Unknown';
    } else {
      assignedName = b.Assigned_person || '—';
    }
  } else {
    assignedName = b.Assigned_person || '—';
  }

  const startDate = b.Start_Date ? b.Start_Date.split('T')[0] : '';
  const startTime = b.Start_Date && b.Start_Date.includes('T') ? formatTimeFromISO(b.Start_Date) : '09:30 AM';
  const dueDate = b.Due_Date ? b.Due_Date.split('T')[0] : '';
  const dueTime = b.Due_Date && b.Due_Date.includes('T') ? formatTimeFromISO(b.Due_Date) : '10:00 AM';

  const subtasks: Subtask[] = Array.isArray(b.Sub_Task)
    ? b.Sub_Task.map((st: any, idx: number) => ({
      id: st.id ? String(st.id) : `SUB-${idx}-${Date.now()}`,
      title: st.Sub_Task_Name || '',
      completed: st.Status === 'Completed',
      assignedTo: assignedName,
      dueDate: dueDate
    }))
    : [];

  let relToLabel = b.Task_Related || '—';
  let relToType: any = b.Related_To || 'Company';
  if (b.Project) {
    relToLabel = b.Project.project_name || 'Project';
    relToType = 'Project';
  } else if (b.Deal_Id) {
    relToLabel = b.Deal_Id.Deal_Name || 'Deal';
    relToType = 'Deal';
  } else if (b.Lead_Id) {
    const l = b.Lead_Id;
    relToLabel = `${l.LeadFirstName || ''} ${l.LeadLastName || ''}`.trim() || l.CompanyName || 'Lead';
    relToType = 'Lead';
  }

  // Parse UserReminder fields
  let reminderEnabled = false;
  let reminderDate: string | undefined;
  let reminderTime: string | undefined;
  let reminderRepeat: string | undefined;
  let repeatLabel = b.repeat || 'Does not repeat';

  if (b.UserReminder && typeof b.UserReminder === 'object') {
    const rem = b.UserReminder;
    reminderEnabled = true;

    if (rem.RemainderDueDate) {
      // Format: "2026-06-30 10:00:00" or ISO
      const parts = rem.RemainderDueDate.split(' ');
      if (parts.length >= 2) {
        reminderDate = parts[0];
        reminderTime = convertTo12Hour(parts[1].substring(0, 5));
      } else {
        const tParts = rem.RemainderDueDate.split('T');
        if (tParts.length >= 2) {
          reminderDate = tParts[0];
          reminderTime = convertTo12Hour(tParts[1].substring(0, 5));
        }
      }
    }

    if (rem.Repeat_EveryDay) {
      reminderRepeat = rem.Repeat_EveryDay === '1 Days' ? 'Daily'
        : rem.Repeat_EveryDay === '7 Days' ? 'Weekly'
        : 'Does not repeat';
      repeatLabel = reminderRepeat;
    }
  }

  return {
    id: String(b.id),
    title: b.TaskName || '',
    type: (b.Task_Type || 'Task') as any,
    category: b.Task_Category || 'Follow Up',
    relatedTo: relToLabel,
    relatedToType: relToType,
    assignedTo: assignedName,
    priority: (b.Priority || 'High') as any,
    status: (b.Status || 'Pending') as any,
    tags: Array.isArray(b.Tags) ? b.Tags : [],
    startDate,
    startTime,
    dueDate,
    dueTime,
    repeat: repeatLabel,
    reminderEnabled,
    reminderDate,
    reminderTime,
    reminderRepeat,
    description: b.Task_Desc || '',
    subtasks,
    comments: [],
    activities: [],
    createdAt: b.Created_At || new Date().toISOString(),
    updatedAt: b.Updated_At || new Date().toISOString()
  };
}

export default function TaskDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { primaryColor } = useStore();
  const queryClient = useQueryClient();

  const { data: apiTaskData, isLoading, refetch } = useQuery({
    queryKey: ['taskDetail', id],
    queryFn: () => fetchTaskById(id),
    enabled: !!id,
  });

  const task = React.useMemo(() => {
    return apiTaskData ? mapBackendTaskToFrontend(apiTaskData) : null;
  }, [apiTaskData]);

  // States
  const [commentInput, setCommentInput] = useState('');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [inlineSubtaskTitle, setInlineSubtaskTitle] = useState('');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [isSavingReminder, setIsSavingReminder] = useState(false);



  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <p className="text-slate-500 font-semibold text-sm">Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Task Not Found</h2>
        <p className="text-slate-400 text-sm">The task you are looking for does not exist or has been deleted.</p>
        <Button onClick={() => router.push('/tasks')} style={{ backgroundColor: primaryColor }} className="text-white">
          Back to Tasks
        </Button>
      </div>
    );
  }

  // Calculate Subtask Progress
  const totalSubtasks = task?.subtasks?.length || 0;
  const completedSubtasks = task?.subtasks?.filter(s => s.completed).length || 0;
  const percentCompleted = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Toggle Subtask
  const handleToggleSubtask = async (subId: string, currentVal: boolean) => {
    if (!task || !apiTaskData) return;

    const subtaskItem = task.subtasks.find(s => s.id === subId);
    if (!subtaskItem) return;

    const updatedSubtasks = task.subtasks.map(s => {
      const isTarget = s.id === subId;
      const comp = isTarget ? !currentVal : s.completed;
      return {
        Sub_Task_Name: s.title,
        Status: comp ? 'Completed' : 'Pending',
        Completion: comp ? '100' : '0'
      };
    });

    const newActivity = {
      id: `ACT-${Date.now()}`,
      type: 'Subtask updated',
      details: `Subtask "${subtaskItem.title}" marked as ${!currentVal ? 'completed' : 'incomplete'}`,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      user: 'Sadia Afrin'
    };

    try {
      await patchTask(id, { Sub_Task: updatedSubtasks });
      queryClient.invalidateQueries({ queryKey: ['allTasksNew'] });
      refetch();
      toast.success(`Subtask marked as ${!currentVal ? 'completed' : 'incomplete'}`);
    } catch {
      toast.error('Failed to update subtask');
    }
  };

  // Add Inline Subtask
  const handleAddSubtaskInline = async () => {
    if (!task || !apiTaskData || !inlineSubtaskTitle.trim()) return;

    const currentSubtasks = Array.isArray(apiTaskData.Sub_Task) ? apiTaskData.Sub_Task : [];
    const updatedSubtasks = [
      ...currentSubtasks.map((st: any) => ({
        Sub_Task_Name: st.Sub_Task_Name,
        Status: st.Status || 'Pending',
        Completion: st.Completion || '0'
      })),
      {
        Sub_Task_Name: inlineSubtaskTitle.trim(),
        Status: 'Pending',
        Completion: '0'
      }
    ];

    const newActivity = {
      id: `ACT-${Date.now()}`,
      type: 'Subtask added',
      details: `Added subtask "${inlineSubtaskTitle.trim()}"`,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      user: 'Sadia Afrin'
    };

    try {
      await patchTask(id, { Sub_Task: updatedSubtasks });
      queryClient.invalidateQueries({ queryKey: ['allTasksNew'] });
      refetch();
      setInlineSubtaskTitle('');
      setShowAddSubtask(false);
      toast.success('Subtask added');
    } catch {
      toast.error('Failed to add subtask');
    }
  };



  // Toggle Complete / Save Task status
  const handleToggleComplete = async () => {
    if (!task) return;
    const isCompleted = task.status === 'Completed';
    const newStatus = isCompleted ? 'In Progress' : 'Completed';

    const newActivity = {
      id: `ACT-${Date.now()}`,
      type: 'Status changed',
      details: `Task status changed to ${newStatus}`,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      user: 'Sadia Afrin'
    };

    try {
      await patchTask(id, { Status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['allTasksNew'] });
      refetch();
      toast.success(`Task marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update task status');
    }
  };

  // Delete Task
  const handleDelete = async () => {
    try {
      await apiDeleteTask(id);
      queryClient.invalidateQueries({ queryKey: ['allTasksNew'] });
      toast.success('Task deleted successfully');
      router.push('/tasks');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Add Reminder
  const handleAddReminderInline = async () => {
    if (!newReminderDate || !newReminderTime) {
      toast.error('Please select both a date and time for the reminder.');
      return;
    }
    if (!apiTaskData) return;

    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : (apiTaskData.Created_By?.id || apiTaskData.Created_By || 72);

    // Build the full PUT payload from existing task data, merging in the new reminder
    const toId = (val: any) => (val && typeof val === 'object' ? val.id ?? null : val ?? null);

    const putPayload = {
      id: typeof id === 'string' ? parseInt(id, 10) : id,
      Organization_Id: toId(apiTaskData.Organization_Id),
      CRMUserLeadMeeting_id: toId(apiTaskData.CRMUserLeadMeeting_id),
      EducationalLead_Id: toId(apiTaskData.EducationalLead_Id),
      Lead_Id: toId(apiTaskData.Lead_Id),
      RealestateLead_Id: toId(apiTaskData.RealestateLead_Id),
      Deal_Id: toId(apiTaskData.Deal_Id),
      RealestateDeal_Id: toId(apiTaskData.RealestateDeal_Id),
      Task_Resource: apiTaskData.Task_Resource ?? '',
      Task_Related: apiTaskData.Task_Related ?? '',
      TaskName: apiTaskData.TaskName ?? '',
      Task_Desc: apiTaskData.Task_Desc ?? '',
      Start_Date: apiTaskData.Start_Date ?? '',
      Due_Date: apiTaskData.Due_Date ?? '',
      Priority: apiTaskData.Priority ?? 'High',
      Completion: apiTaskData.Completion ?? '0',
      Project: toId(apiTaskData.Project),
      Assigned_To: toId(apiTaskData.Assigned_To),
      Assigned_person: apiTaskData.Assigned_person ?? '',
      Status: apiTaskData.Status ?? 'Pending',
      Task_Category: apiTaskData.Task_Category ?? '',
      Task_Type: apiTaskData.Task_Type ?? '',
      Related_To: apiTaskData.Related_To ?? '',
      Tags: Array.isArray(apiTaskData.Tags) ? apiTaskData.Tags : [],
      Sub_Task: Array.isArray(apiTaskData.Sub_Task)
        ? apiTaskData.Sub_Task.map((st: any) => ({
            Sub_Task_Name: st.Sub_Task_Name,
            Status: st.Status || 'Pending',
            Completion: st.Completion || '0'
          }))
        : [],
      Created_By: toId(apiTaskData.Created_By) ?? userId,
      Updated_By: userId,
      UserReminder: {
        Created_By: userId,
        Updated_By: userId,
        ReminderFor: `Reminder for ${apiTaskData.TaskName || 'task'}`,
        Repeat_EveryDay: 'No',
        RemainderDueDate: `${newReminderDate} ${newReminderTime}:00`,
        RemainderMessage: `Remind me for ${apiTaskData.TaskName || 'task'}`
      }
    };

    setIsSavingReminder(true);
    try {
      await updateTask(id, putPayload);
      queryClient.invalidateQueries({ queryKey: ['allTasksNew'] });
      queryClient.invalidateQueries({ queryKey: ['taskDetail', id] });
      refetch();
      setNewReminderDate('');
      setNewReminderTime('');
      setShowAddReminder(false);
      toast.success('Reminder saved successfully');
    } catch {
      toast.error('Failed to save reminder');
    } finally {
      setIsSavingReminder(false);
    }
  };

  // Avatar helper
  const getInitials = (name: string) => {
    return name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  };

  const getOwnerBgColor = (owner: string) => {
    if (owner === 'Sadia Afrin') return 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-305';
    if (owner === 'Jisan Mahmud') return 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-305';
    return 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-305';
  };

  const getTypeStyle = (type: Task['type']) => {
    const styles: Record<Task['type'], string> = {
      'Call': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400',
      'Email': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400',
      'Meeting': 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400',
      'Task': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400',
    };
    return styles[type] || 'bg-slate-50 text-slate-600';
  };

  const getStatusStyle = (status: Task['status']) => {
    const styles: Record<Task['status'], string> = {
      'Not Started': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350',
      'In Progress': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400',
      'Pending': 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400',
      'Completed': 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400',
      'Overdue': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450',
    };
    return styles[status] || 'bg-slate-50 text-slate-650';
  };

  const getPriorityStyle = (priority: Task['priority']) => {
    const styles: Record<Task['priority'], string> = {
      'High': 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400',
      'Medium': 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400',
      'Low': 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-450',
    };
    return styles[priority] || 'bg-slate-50 text-slate-650';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Breadcrumbs & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => router.push('/tasks')}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<NavLink to="/tasks">Tasks</NavLink>} />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Task Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mr-2">
                {task.title}
              </h1>
              <Badge variant="outline" className={`rounded-[5px] font-semibold text-xs py-0.5 px-2.5 ${getStatusStyle(task.status)}`}>
                {task.status}
              </Badge>
              <Badge variant="outline" className={`rounded-[5px] font-semibold text-xs py-0.5 px-2.5 ${getTypeStyle(task.type)}`}>
                {task.type}
              </Badge>
            </div>

            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Created by {task.assignedTo} • {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            variant="outline"
            className="h-9 gap-2 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[5px] text-xs font-semibold text-slate-700 dark:text-slate-350"
            onClick={() => router.push(`/tasks/${task.id}/edit`)}
          >
            Edit Task
          </Button>

          <Button
            variant="outline"
            className="h-9 px-4 rounded-[5px] text-xs font-semibold border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            onClick={handleDelete}
          >
            Delete
          </Button>

          <Button
            onClick={handleToggleComplete}
            style={{ backgroundColor: task.status === 'Completed' ? 'transparent' : primaryColor }}
            className={`h-9 px-4 rounded-[5px] text-xs font-semibold hover:opacity-90 active:scale-95 transition-all ${task.status === 'Completed'
                ? 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                : 'text-white'
              }`}
          >
            {task.status === 'Completed' ? 'Mark Incomplete' : 'Mark Complete'}
          </Button>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side (Details, Description, Subtasks, Comments) - Spans 2 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Task Details */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Task Details</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-semibold">

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Related To</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    {task.relatedToType === 'Company' ? (
                      <Building className="h-4 w-4 text-slate-400" />
                    ) : (
                      <User className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{task.relatedTo}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({task.relatedToType})</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Type</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full mt-0.5 ${getTypeStyle(task.type)}`}>
                    {task.type}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Priority</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full mt-0.5 ${getPriorityStyle(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Assigned To</span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Avatar className="h-6.5 w-6.5 border shadow-2xs">
                      <AvatarFallback className={`text-[10px] font-bold ${getOwnerBgColor(task.assignedTo)}`}>
                        {getInitials(task.assignedTo)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-slate-700 dark:text-slate-300">{task.assignedTo}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Created By</span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Avatar className="h-6.5 w-6.5 border shadow-2xs">
                      <AvatarFallback className="text-[10px] font-bold bg-slate-100 text-slate-700 border">
                        SA
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-slate-700 dark:text-slate-300">Sadia Afrin</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Tags</span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {task.tags.map(t => (
                      <span key={t} className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold px-2.5 py-0.5 rounded text-slate-650">
                        {t}
                      </span>
                    ))}
                    {task.tags.length === 0 && <span className="text-slate-400 font-normal">No tags</span>}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Due Date</span>
                  <span className="text-slate-800 dark:text-slate-200 block pt-0.5">
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {task.dueTime}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Start Date</span>
                  <span className="text-slate-800 dark:text-slate-200 block pt-0.5">
                    {new Date(task.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {task.startTime}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Status</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full mt-0.5 ${getStatusStyle(task.status)}`}>
                    {task.status}
                  </span>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 2: Description */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Description</h3>
            </div>
            <CardContent className="p-6">
              <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                {task.description || 'No description provided for this task.'}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Subtasks Progress */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Subtasks ({completedSubtasks}/{totalSubtasks})
                </h3>
                {totalSubtasks > 0 && (
                  <div className="flex items-center gap-2">
                    {/* Progress Bar */}
                    <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${percentCompleted}%` }} />
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{percentCompleted}%</span>
                  </div>
                )}
              </div>
              <Button
                variant="link"
                onClick={() => setShowAddSubtask(!showAddSubtask)}
                className="text-blue-600 font-bold text-[10px] uppercase h-auto p-0"
              >
                + Add Subtask
              </Button>
            </div>
            <CardContent className="p-6 space-y-4">
              {showAddSubtask && (
                <div className="flex gap-2 max-w-[420px]">
                  <Input
                    placeholder="Enter subtask title..."
                    value={inlineSubtaskTitle}
                    onChange={(e) => setInlineSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtaskInline()}
                    className="h-9 text-xs"
                  />
                  <Button onClick={handleAddSubtaskInline} style={{ backgroundColor: primaryColor }} className="h-9 text-white text-xs px-4">
                    Add
                  </Button>
                </div>
              )}

              {task.subtasks?.length > 0 ? (
                <div className="divide-y dark:divide-slate-800 border dark:border-slate-800 rounded-[5px] overflow-hidden bg-slate-50/20 dark:bg-slate-950/10">
                  {task.subtasks.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all text-xs">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={sub.completed}
                          onCheckedChange={() => handleToggleSubtask(sub.id, sub.completed)}
                        />
                        <span className={`font-semibold ${sub.completed ? 'line-through text-slate-400' : 'text-slate-850 dark:text-slate-205'}`}>
                          {sub.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-slate-400 font-medium">
                        {sub.assignedTo && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 dark:text-slate-400 font-bold px-2 py-0.5 rounded">
                            {sub.assignedTo}
                          </span>
                        )}
                        {sub.dueDate && (
                          <span className="text-[10px]">
                            {new Date(sub.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-2">No subtasks defined. Break this task down to manage complexity.</p>
              )}
            </CardContent>
          </Card>



        </div>

        {/* Right Side Column (Task Info & Timeline) */}
        <div className="space-y-6">

          {/* Card 1: Task Information */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden text-xs">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Task Information</h3>
            </div>
            <CardContent className="p-5 space-y-3.5 font-semibold">
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2.5">
                <span className="text-slate-405">Task ID</span>
                <span className="text-slate-805 dark:text-slate-200 font-extrabold">{task.id}</span>
              </div>
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2.5">
                <span className="text-slate-405">Category</span>
                <span className="text-slate-805 dark:text-slate-200">{task.category}</span>
              </div>
              <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2.5">
                <span className="text-slate-405">Reminder</span>
                <span className="text-slate-805 dark:text-slate-200">
                  {task.reminderEnabled && task.reminderDate ? `${new Date(task.reminderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${task.reminderTime}` : 'Not set'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-405">Repeat</span>
                <span className="text-slate-805 dark:text-slate-200">{task.repeat}</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Reminder Widget */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden text-xs">
            <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-extrabold">Reminder</h3>
              {!task.reminderEnabled && (
                <Button
                  variant="link"
                  onClick={() => setShowAddReminder(!showAddReminder)}
                  className="text-blue-600 font-bold text-[10px] uppercase h-auto p-0"
                >
                  + Add Reminder
                </Button>
              )}
            </div>
            <CardContent className="p-5 space-y-3.5">
              {showAddReminder && !task.reminderEnabled && (
                <div className="space-y-3 p-3.5 border dark:border-slate-800 rounded-[5px] bg-slate-50/50 dark:bg-slate-950/20">
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={newReminderDate} onChange={(e) => setNewReminderDate(e.target.value)} className="h-8.5 text-xs" />
                    <Input type="time" value={newReminderTime} onChange={(e) => setNewReminderTime(e.target.value)} className="h-8.5 text-xs" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddReminder(false)} className="text-[10px] h-7 px-2">Cancel</Button>
                    <Button size="sm" onClick={handleAddReminderInline} disabled={isSavingReminder} style={{ backgroundColor: primaryColor }} className="text-white text-[10px] h-7 px-3">
                      {isSavingReminder ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              )}

              {task.reminderEnabled && task.reminderDate ? (
                <div className="flex items-center gap-2.5 p-3 rounded-[5px] border border-blue-100 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/10 text-slate-700 dark:text-slate-300">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div className="flex-1 font-semibold">
                    <div>{new Date(task.reminderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {task.reminderTime}</div>
                    <span className="text-[10px] font-bold text-blue-600 mt-0.5 inline-block bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">Upcoming</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No reminder set.</p>
              )}
            </CardContent>
          </Card>



          {/* Card 4: Related Items */}
          {task.relatedItems && (task.relatedItems.company || task.relatedItems.deal || task.relatedItems.contact) && (
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden text-xs">
              <div className="p-5 border-b dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Related Items</h3>
              </div>
              <CardContent className="p-5 space-y-3 font-semibold">
                {task.relatedItems.company && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-405">Company</span>
                    <span className="text-blue-600 hover:text-blue-700 dark:text-blue-405 transition-colors cursor-pointer font-bold">{task.relatedItems.company}</span>
                  </div>
                )}
                {task.relatedItems.deal && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-405">Deal</span>
                    <span className="text-blue-600 hover:text-blue-700 dark:text-blue-405 transition-colors cursor-pointer font-bold">{task.relatedItems.deal}</span>
                  </div>
                )}
                {task.relatedItems.contact && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-405">Contact</span>
                    <span className="text-blue-600 hover:text-blue-700 dark:text-blue-405 transition-colors cursor-pointer font-bold">{task.relatedItems.contact}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

      </div>
    </motion.div>
  );
}
