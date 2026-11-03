'use client';

import { Menu, Bell, Sun, Moon, Monitor, Sparkles, Video, Megaphone, LayoutGrid, HelpCircle, ExternalLink, Copy, Check, MessageSquare, CalendarClock, RefreshCw, ClipboardCheck, Mail } from 'lucide-react';
import { fetchApprovedList } from '@/service/api/approvals/api';
import { useStore } from '@/store/useStore';
import { useVideoCallStore } from '@/store/useVideoCallStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

// Brand Logos for Integrations Menu
const GmailLogo = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 4H18V12L12 7.5L6 12V4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H6V10L12 14.5L18 10V20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" fill="#EA4335" />
  </svg>
);

const FacebookLogo = () => (
  <svg className="h-6 w-6 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const LinkedinLogo = () => (
  <svg className="h-6 w-6 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

const InstagramLogo = () => (
  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="ig-grad-header" cx="30%" cy="107%" r="130%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" fill="url(#ig-grad-header)" />
    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8.2c-1.76 0-3.2-1.44-3.2-3.2s1.44-3.2 3.2-3.2 3.2 1.44 3.2 3.2-1.44 3.2-3.2 3.2z M17.3 6.8c0 .44-.36.8-.8.8s-.8-.36-.8-.8.36-.8.8-.8.8.36.8.8z" fill="white" />
  </svg>
);
import { Navigation } from './Navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchFromApi } from '@/service/apiClient';
import MailConfigurationModal from './MailConfigurationModal';

export function Header() {
  const { toggleSidebar, primaryColor, mode, setMode, setPrimaryColor, user } = useStore();
  const {
    status: videoStatus,
    callingURI,
    isPremium,
    startCall,
    joinCall,
    restoreCall,
    endCall,
    setPremium
  } = useVideoCallStore();

  const [joinCode, setJoinCode] = useState('');
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [reminders, setReminders] = useState<any[]>([]);
  const [isLoadingReminders, setIsLoadingReminders] = useState(false);
  const [headerUserId, setHeaderUserId] = useState<string>('');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [isMailConfigOpen, setIsMailConfigOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHeaderUserId(localStorage.getItem('userId') || localStorage.getItem('UserId') || '');
    }
  }, []);

  useEffect(() => {
    if (!headerUserId) return;
    const loadPendingApprovals = async () => {
      try {
        const res = await fetchApprovedList(headerUserId, 1);
        const count = res?.count || (Array.isArray(res?.results) ? res.results.length : 0);
        setPendingApprovalsCount(count);
      } catch (e) {
        // Silently ignore fetch errors
      }
    };
    loadPendingApprovals();

    const handleApprovalUpdated = () => {
      loadPendingApprovals();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('approvalUpdated', handleApprovalUpdated);
      window.addEventListener('focus', handleApprovalUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('approvalUpdated', handleApprovalUpdated);
        window.removeEventListener('focus', handleApprovalUpdated);
      }
    };
  }, [headerUserId]);

  const fetchAllReminders = async () => {
    setIsLoadingReminders(true);
    try {
      const userId = headerUserId || (typeof window !== 'undefined' ? localStorage.getItem('userId') || localStorage.getItem('UserId') || '1' : '1');
      const [tasksRes, userRemindersRes] = await Promise.all([
        fetchFromApi('/user/NewTaskManagemntList/', { method: 'GET' }).catch(() => null),
        fetchFromApi(`/user/UserRemainderMessagesgetcreatedby/?Created_By=${userId}`, { method: 'GET' }).catch(() => null)
      ]);
      const activitiesRes: any = null;

      const list: any[] = [];

      // 1. Process Tasks for UserReminder
      const taskResults = tasksRes?.results || (Array.isArray(tasksRes) ? tasksRes : []);
      taskResults.forEach((task: any) => {
        if (task.UserReminder && typeof task.UserReminder === 'object') {
          const rem = task.UserReminder;
          list.push({
            id: `task-rem-${task.id}`,
            type: 'Task',
            title: task.TaskName || 'Task Reminder',
            message: rem.RemainderMessage || task.Task_Desc || 'No message provided.',
            dueDate: rem.RemainderDueDate || task.Due_Date || '',
            status: rem.Status || 'Pending'
          });
        }
      });

      // 2. Process Direct User Reminders
      const userRemResults = userRemindersRes?.results || (Array.isArray(userRemindersRes) ? userRemindersRes : []);
      userRemResults.forEach((rem: any) => {
        if (rem.RemainderMessage) {
          list.push({
            id: `user-rem-${rem.id || Math.random()}`,
            type: 'Reminder',
            title: rem.Title || rem.RemainderTitle || 'Reminder',
            message: rem.RemainderMessage || 'No message provided.',
            dueDate: rem.RemainderDueDate || rem.Updated_Date || rem.Created_Date || '',
            status: rem.Status || 'Pending'
          });
        }
      });

      // 3. Process Activities for Reminder_Payload
      const activityResults = activitiesRes?.results || (Array.isArray(activitiesRes) ? activitiesRes : []);
      activityResults.forEach((act: any) => {
        if (act.Reminder_Payload && typeof act.Reminder_Payload === 'object') {
          const rem = act.Reminder_Payload;
          list.push({
            id: `act-rem-${act.id}`,
            type: 'Activity',
            title: act.Task || 'Activity Reminder',
            message: rem.RemainderMessage || act.Task_Description || 'No message provided.',
            dueDate: rem.RemainderDueDate || act.Expected_Date || '',
            status: rem.Status || 'Pending'
          });
        } else if (act.Reminder_Payload && typeof act.Reminder_Payload === 'string') {
          try {
            const rem = JSON.parse(act.Reminder_Payload);
            list.push({
              id: `act-rem-${act.id}`,
              type: 'Activity',
              title: act.Task || 'Activity Reminder',
              message: rem.RemainderMessage || act.Task_Description || 'No message provided.',
              dueDate: rem.RemainderDueDate || act.Expected_Date || '',
              status: rem.Status || 'Pending'
            });
          } catch { }
        }
      });

      // Sort reminders: soonest first
      list.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime() || 0;
        const dateB = new Date(b.dueDate).getTime() || 0;
        return dateA - dateB;
      });

      setReminders(list);
    } catch (e) {
      console.error("Failed to load reminders:", e);
    } finally {
      setIsLoadingReminders(false);
    }
  };

  useEffect(() => {
    // Defer initial reminders load slightly so it doesn't compete with main page/dashboard load
    const timer = setTimeout(() => {
      fetchAllReminders();
    }, 3000);

    // Poll reminders every 3 minutes
    const interval = setInterval(fetchAllReminders, 180000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const activeRemindersCount = reminders.filter(r => r.status !== 'Completed').length;

  const currentTheme = mode === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;

  const toggleThemeMode = () => {
    setMode(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="fixed top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side: Hamburger button & Logo */}
        <div className="flex items-center gap-4">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger render={
              <Button
                variant="outline"
                size="icon"
                className="md:hidden h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800"
              />
            }>
              <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[260px] p-0">
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="flex items-center gap-2 select-none">
                  <img src="/login/logo.png" alt="Complete Business solution Logo" className="h-10 w-auto object-contain" />
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-80px)] p-4">
                <React.Suspense fallback={<div className="h-10 w-full animate-pulse bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>}>
                  <Navigation onNavigate={() => setIsSheetOpen(false)} />
                </React.Suspense>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
          >
            <Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Button>

          <div className="flex items-center gap-2 select-none">
            <img src="/login/logo.png" alt="Complete Business solution Logo" className="h-10 w-auto object-contain transition-all" />

          </div>
        </div>

        {/* Right side: Notifications, Settings & User profile */}
        <div className="flex items-center gap-3">
          {/* Application Approvals Shortcut */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/application-approval')}
            className="relative h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            title="Application Approvals"
          >
            <ClipboardCheck className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            {pendingApprovalsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                {pendingApprovalsCount}
              </span>
            )}
          </Button>

          {/* Video Conference Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "relative h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors",
                    videoStatus !== 'idle' && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                  title="Video Conference"
                >
                  <Video className={cn("h-5 w-5 text-slate-600 dark:text-slate-400", videoStatus !== 'idle' && "text-blue-500 animate-pulse")} />
                  {videoStatus !== 'idle' && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 border-2 border-background dark:border-slate-900 animate-pulse" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent className="w-80 p-4 border dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-950" align="end">
              <DropdownMenuLabel className="font-bold flex items-center justify-between pb-2 mb-2 border-b">
                <span className="text-sm">Video Call Options</span>
                {videoStatus !== 'idle' && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    Connected
                  </span>
                )}
              </DropdownMenuLabel>

              {videoStatus === 'idle' ? (
                <div className="space-y-4 pt-1">
                  <div className="space-y-2">
                    <Button
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-5 cursor-pointer font-semibold shadow-sm text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => startCall()}
                    >
                      <Video className="h-4.5 w-4.5" />
                      Start Instant Meeting
                    </Button>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">or join call</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter Room Code or Link"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && joinCode.trim()) {
                            joinCall(joinCode);
                            setJoinCode('');
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full rounded-xl py-5 font-semibold text-xs border-slate-200 dark:border-slate-800 cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
                      disabled={!joinCode.trim()}
                      onClick={() => {
                        joinCall(joinCode);
                        setJoinCode('');
                      }}
                    >
                      Join Meeting
                    </Button>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Connection Mode</span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        {isPremium ? 'Premium (JaaS 8x8)' : 'Standard (Free Jitsi)'}
                      </span>
                    </div>
                    <button
                      onClick={() => setPremium(!isPremium)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                        isPremium ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-800"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                          isPremium ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border dark:border-slate-800 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Active Meeting URL</span>
                    <p className="text-xs font-semibold text-foreground truncate select-all">{callingURI}</p>

                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-[11px] font-semibold h-8 rounded-lg cursor-pointer border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-100/50"
                        onClick={() => {
                          navigator.clipboard.writeText(callingURI || '');
                          toast.success('Meeting link copied to clipboard!');
                        }}
                      >
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 rounded-lg cursor-pointer border-slate-200 dark:border-slate-800"
                        onClick={() => window.open(callingURI || '', '_blank')}
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-5 cursor-pointer font-semibold shadow-sm text-xs bg-amber-500 hover:bg-amber-600 text-white animate-fade-in"
                      onClick={restoreCall}
                    >
                      Restore Video Overlay
                    </Button>
                    <Button
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-5 cursor-pointer font-semibold shadow-sm text-xs bg-rose-500 hover:bg-rose-600 text-white"
                      onClick={endCall}
                    >
                      Disconnect Call
                    </Button>
                  </div>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Chats Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/chats')}
            className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            title="Chats"
          >
            <MessageSquare className="h-5 w-5 text-slate-650 dark:text-slate-400" />
          </Button>

          {/* Reminders Dropdown */}
          <DropdownMenu onOpenChange={(open) => { if (open) fetchAllReminders(); }}>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                  title="Reminders"
                >
                  <CalendarClock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  {activeRemindersCount > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-background dark:border-slate-900 animate-pulse" />
                  )}
                </Button>
              }
            />
            <DropdownMenuContent className="w-80 p-4 border dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-950" align="end">
              <DropdownMenuLabel className="font-bold flex items-center justify-between pb-2 mb-2 border-b">
                <span className="text-sm">Reminders</span>
                {activeRemindersCount > 0 && (
                  <Badge variant="destructive" className="text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {activeRemindersCount} Active
                  </Badge>
                )}
              </DropdownMenuLabel>
              {isLoadingReminders ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span className="text-xs font-semibold">Loading reminders...</span>
                </div>
              ) : reminders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-semibold text-xs">
                  No upcoming reminders found.
                </div>
              ) : (
                <ScrollArea className="h-64 pr-2">
                  <div className="space-y-3">
                    {reminders.map((rem: any) => (
                      <div key={rem.id} className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl flex items-start gap-3 text-left">
                        <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {rem.type === 'Task' ? 'T' : 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block truncate">{rem.title}</span>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{rem.message}</p>
                          <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            <span>{rem.dueDate}</span>
                            <span>•</span>
                            <span style={{ color: primaryColor }}>{rem.type}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="relative h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-blue-600 border-2 border-background dark:border-slate-900" />
                </Button>
              }
            />
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  { id: 1, title: 'New enquiry received', time: '5m ago' },
                  { id: 2, title: 'Shipment delayed', time: '1h ago' },
                  { id: 3, title: 'Task completed', time: '2h ago' },
                  { id: 4, title: 'System update available', time: '3h ago' },
                ].map((n) => (
                  <DropdownMenuItem key={n.id} className="cursor-pointer gap-2 flex flex-col items-start p-3">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.time}</p>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>



          {/* Integrations Grid Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                  title="Integrations & Apps"
                >
                  <LayoutGrid className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </Button>
              }
            />
            <DropdownMenuContent className="w-80 p-4 border dark:border-slate-800 rounded-2xl shadow-xl bg-white dark:bg-slate-950" align="end">
              <div className="grid grid-cols-3 gap-3">
                {[
                  // { label: 'Google Mail', logo: GmailLogo, path: '/Settings/mail-box-setting' },
                  { label: 'Facebook', logo: FacebookLogo, path: '/facebook' },
                  { label: 'Linkedin', logo: LinkedinLogo, path: '/linkedin' },
                  { label: 'Instagram', logo: InstagramLogo, path: '/Settings/instagram-setting' }
                ].map((item, idx) => {
                  const Logo = item.logo;
                  return (
                    <button
                      key={idx}
                      onClick={() => router.push(item.path)}
                      className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all duration-200 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 text-center cursor-pointer group"
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50/50 dark:bg-slate-900/50 group-hover:scale-105 transition-transform duration-200">
                        <Logo />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mt-2 block break-all tracking-tight leading-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Help & Support Button */}
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Button>

          {/* Dark / Light Toggle Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleThemeMode}
            className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors"
            title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {currentTheme === 'dark' ? (
              <Sun className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            )}
          </Button>

          {/* Vertical Divider */}
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="relative h-auto py-1 px-2 flex items-center gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200"
                >
                  <div className="flex flex-col items-end text-right hidden sm:flex">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{user.jobTitle}</span>
                  </div>
                  <Avatar size="lg" className="h-10 w-10 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <AvatarImage
                      src={user.avatarUrl}
                      fallbackSrc="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold text-sm">
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'RJ'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsMailConfigOpen(true)} className="gap-2 cursor-pointer">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span>Mail Configuration</span>
                </DropdownMenuItem>
                {/* <DropdownMenuItem onClick={() => router.push('/customization/customize-forms')}>Customize Forms</DropdownMenuItem> */}

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 cursor-pointer flex items-center">
                    <Sparkles className="h-4 w-4 text-slate-500" />
                    <span>Theme Options</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56 p-2 space-y-3 dark:bg-slate-900 border dark:border-slate-800 shadow-md">

                    {/* Mode Selector */}
                    <div className="space-y-1.5 px-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Color Mode</span>
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        {[
                          { id: 'light', icon: Sun, label: 'Light' },
                          { id: 'dark', icon: Moon, label: 'Dark' },
                          { id: 'system', icon: Monitor, label: 'Sys' }
                        ].map((m) => {
                          const IconComp = m.icon;
                          const isSel = mode === m.id;
                          return (
                            <button
                              type="button"
                              key={m.id}
                              onClick={() => setMode(m.id as any)}
                              className={`py-1.5 flex flex-col items-center justify-center rounded-lg border text-[10px] font-semibold gap-1 transition-all ${isSel
                                ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20'
                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                                }`}
                            >
                              <IconComp className="h-3.5 w-3.5" />
                              {m.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    {/* Primary Color Selector */}
                    <div className="space-y-1.5 px-2 pb-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Primary Color</span>
                      <div className="grid grid-cols-4 gap-2 pt-1.5">
                        {[
                          { name: 'Blue', value: '#0565FD' },
                          { name: 'Indigo', value: '#6366f1' },
                          { name: 'Violet', value: '#8b5cf6' },
                          { name: 'Emerald', value: '#10b981' },
                          { name: 'Orange', value: '#f97316' },
                          { name: 'Rose', value: '#f43f5e' },
                          { name: 'Zinc', value: '#71717a' },
                        ].map((color) => (
                          <button
                            type="button"
                            key={color.value}
                            onClick={() => setPrimaryColor(color.value)}
                            className={`h-6 w-6 rounded-full border transition-all hover:scale-110 flex items-center justify-center shrink-0 ${primaryColor === color.value
                              ? 'border-slate-800 dark:border-white ring-1 ring-slate-800 dark:ring-white'
                              : 'border-transparent'
                              }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {primaryColor === color.value && (
                              <span className="text-[8px] text-white">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Workspaces</DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); router.push('/login'); }} className="text-red-600">Log out</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <MailConfigurationModal isOpen={isMailConfigOpen} onClose={() => setIsMailConfigOpen(false)} />
    </header>
  );
}
