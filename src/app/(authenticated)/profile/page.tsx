'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Briefcase,
  Handshake,
  CheckCircle2,
  Calendar,
  User,
  Settings,
  Activity,
  Users,
  Camera,
  Check,
  X,
  Pencil,
  PlusCircle,
  LogIn,
  Globe,
  BellRing,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchFromApi } from '@/service/apiClient';
import { updateUser } from '@/service/api/useradmin/api';

// Tab type definition
type ProfileTab = 'overview' | 'preferences' | 'notifications' | 'api';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUserProfile, primaryColor, mode, setMode, setPrimaryColor } = useStore();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);

  // Tab control
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

  // Inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [isCustomAvatarOpen, setIsCustomAvatarOpen] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // Local form state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [jobTitle, setJobTitle] = useState(user.jobTitle);
  const [role, setRole] = useState(user.role);
  const [location, setLocation] = useState(user.location);
  const [bio, setBio] = useState(user.bio);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);



  // API tab states
  const [apiKeys, setApiKeys] = useState<{ id: string; name: string; key: string; created: string }[]>([
    { id: '1', name: 'Production Dashboard API', key: 'crm_live_sk_89ab...56cd', created: '14 Feb 2026' },
    { id: '2', name: 'Mobile App Sync Token', key: 'crm_live_sk_12xy...78zw', created: '03 Apr 2026' }
  ]);
  const [newKeyName, setNewKeyName] = useState('');

  // Notifications toggles
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    pushAlerts: true,
    weeklyDigest: false,
    leadAssign: true,
    dealMilestone: true
  });

  // Simulated activity feed
  const [activities, setActivities] = useState([
    { id: 1, type: 'project', text: 'Updated project "CRM Implementation"', time: '2 hours ago', icon: Briefcase, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { id: 2, type: 'task', text: 'Completed task "Client Review Meeting"', time: '1 day ago', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { id: 3, type: 'deal', text: 'Created new deal "Tech Solutions Deal"', time: '2 days ago', icon: Handshake, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
    { id: 4, type: 'login', text: 'Logged in to CRMFarm IT', time: '24 May 2024, 10:45 AM', icon: LogIn, color: 'text-slate-500 bg-slate-50 dark:bg-slate-950/20' }
  ]);

  // Profile stats states
  const [profileStats, setProfileStats] = useState({
    Projects_Assigned: 0,
    Deals_Managed: 0,
    Tasks_Completed: 0,
    Experience: '—'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userId = localStorage.getItem('userId') || '72';
        const res = await fetchFromApi(`/user/EmployeeProfileSummaryAPIView/?user_id=${userId}`);
        if (res) {
          setProfileStats({
            Projects_Assigned: res.Projects_Assigned || 0,
            Deals_Managed: res.Deals_Managed || 0,
            Tasks_Completed: res.Tasks_Completed || 0,
            Experience: res.Experience || '—'
          });
        }
      } catch (err) {
        console.error('Failed to fetch summary stats:', err);
      }
    };
    fetchStats();
  }, []);

  // Simulate skeleton loading on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  // Update local inputs when user store changes
  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setJobTitle(user.jobTitle);
    setRole(user.role);
    setLocation(user.location);
    setBio(user.bio);
    setAvatarUrl(user.avatarUrl);
  }, [user]);

  // Get initials for Avatar Fallback
  const getInitials = (nameStr: string) => {
    if (!nameStr) return 'RJ';
    return nameStr
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Profile Image Upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Please select an image smaller than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
          updateUserProfile({ avatarUrl: reader.result });
          toast.success("Profile photo uploaded successfully!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Profile Form handler
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (!email.trim()) {
      toast.error("Email cannot be empty.");
      return;
    }

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

    try {
      await updateUser({
        id: userId ? parseInt(userId, 10) : undefined,
        first_name: firstName,
        last_name: lastName,
        email: email.trim(),
        username: firstName, // Set username to first name based on the log
        PhoneNo: phone.trim(),
        Designation: jobTitle.trim(),
        Roll_Name: role.trim() || "Admin",
        City: location.trim(),
        Area: user?.Area,
        BuildingHuseNo: user?.BuildingHuseNo,
        Chatcount: user?.Chatcount,
        CounselorCourse: user?.CounselorCourse,
        Country: user?.Country,
        Edu_Reporter_Name: user?.Edu_Reporter_Name,
        Edu_Reporting_to: user?.Edu_Reporting_to,
        Navigate_Status: user?.Navigate_Status,
        Organization_Id: user?.Organization_Id,
        Password_Status: user?.Password_Status,
        State: user?.State,
        Street: user?.Street,
        Url: user?.Url,
        UserId: user?.UserId,
      });

      updateUserProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        jobTitle: jobTitle.trim(),
        role: role.trim(),
        location: location.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl
      });

      setIsEditing(false);
      toast.success("Profile information updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    }
  };



  // Generate API key handler
  const handleCreateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API Key.");
      return;
    }
    const randChars = Math.random().toString(36).substring(2, 10);
    const keyString = `crm_live_sk_${randChars}...${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const formattedDate = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

    setApiKeys([
      ...apiKeys,
      { id: Date.now().toString(), name: newKeyName.trim(), key: keyString, created: formattedDate }
    ]);
    setNewKeyName('');
    toast.success("New API key generated!");
  };

  // Copy API key placeholder helper
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API Key copied to clipboard!");
  };

  // Delete API key handler
  const handleDeleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== id));
    toast.success("API key revoked.");
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ────────────────────────────────────────────────────────
            1. SKELETON LOADER STATE
            ──────────────────────────────────────────────────────── */}
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 p-1"
          >
            {/* Breadcrumbs Skeleton */}
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />

            {/* Title Block Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
            </div>

            {/* Profile Summary Card Skeleton */}
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-6 flex flex-col lg:flex-row gap-6 animate-pulse">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-24 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-3">
                  <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:w-1/2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-3 space-y-2 border-l border-slate-100 dark:border-slate-800 first:border-0">
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs Header Skeleton */}
            <div className="h-10 w-full border-b dark:border-slate-800 flex gap-4">
              <div className="h-full w-24 bg-slate-200 dark:bg-slate-800 rounded-t-lg" />
              <div className="h-full w-32 bg-slate-200 dark:bg-slate-800 rounded-t-lg" />
              <div className="h-full w-24 bg-slate-200 dark:bg-slate-800 rounded-t-lg" />
            </div>

            {/* Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-6 col-span-1">
                <div className="h-80 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 animate-pulse" />
                <div className="h-60 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 animate-pulse" />
              </div>
              <div className="space-y-6 col-span-1">
                <div className="h-44 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 animate-pulse" />
                <div className="h-96 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 animate-pulse" />
              </div>
              <div className="space-y-6 col-span-1">
                <div className="h-64 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 animate-pulse" />
                <div className="h-72 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 animate-pulse" />
              </div>
            </div>
          </motion.div>
        ) : (

          /* ────────────────────────────────────────────────────────
              2. REAL PAGE VIEW
              ──────────────────────────────────────────────────────── */
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-4 text-left p-1"
          >

            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList className="text-xs font-semibold text-slate-400">
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => router.back()} className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-350">My Profile</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-[1.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  My Profile
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
                  View and manage your personal information and preferences.
                </p>
              </div>

              <div>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-xs hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-400" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        // Reset forms and cancel
                        setIsEditing(false);
                        setName(user.name);
                        setEmail(user.email);
                        setPhone(user.phone);
                        setJobTitle(user.jobTitle);
                        setRole(user.role);
                        setLocation(user.location);
                        setBio(user.bio);
                        setAvatarUrl(user.avatarUrl);
                      }}
                      variant="outline"
                      className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-650 dark:text-slate-350"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSaveProfile()}
                      style={{ backgroundColor: primaryColor }}
                      className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex flex-col lg:flex-row gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              {/* Profile Card Left: Avatar & Contact details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1 text-center sm:text-left">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar className="!h-24 !w-24 rounded-full border-4 border-slate-50 dark:border-slate-900 shadow-md bg-white">
                    <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                    <AvatarFallback className="bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-extrabold text-3xl flex items-center justify-center">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Photo Edit Trigger overlay */}
                  <label
                    className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors cursor-pointer flex items-center justify-center"
                    title="Change Photo"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                {/* Info Text */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-xl font-extrabold text-slate-900 dark:text-white border-b border-slate-250 dark:border-slate-800 focus:outline-none focus:border-primary px-1.5 py-0.5 max-w-[200px]"
                        placeholder="Full name"
                      />
                    ) : (
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        {name}
                      </h2>
                    )}

                    {isEditing ? (
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="text-[10px] font-bold text-slate-500 uppercase tracking-wide bg-slate-50 dark:bg-slate-800 rounded px-2 py-0.5 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-primary"
                      />
                    ) : (
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-50 border-0 rounded font-bold uppercase text-[9px] tracking-wider py-0.5 px-2 self-center sm:self-start">
                        {jobTitle}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-[11px] font-mono">✉</span>
                      {isEditing ? (
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="border-b border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary px-1 py-0.5 w-[200px]"
                        />
                      ) : (
                        <span>{email}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-[11px] font-mono">☎</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="border-b border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary px-1 py-0.5 w-[200px]"
                        />
                      ) : (
                        <span>{phone || 'Add phone number'}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-[11px] font-mono">📍</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="border-b border-slate-200 dark:border-slate-700 bg-transparent focus:outline-none focus:border-primary px-1 py-0.5 w-[200px]"
                        />
                      ) : (
                        <span>{location || 'Add location details'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Card Right: 4 Statistical widgets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:w-1/2 justify-center py-2 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800">

                {/* Stat 1 */}
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
                    <Briefcase className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">{profileStats.Projects_Assigned}</span>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1 block">Projects Assigned</span>
                </div>

                {/* Stat 2 */}
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                    <Handshake className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">{profileStats.Deals_Managed}</span>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1 block">Deals Managed</span>
                </div>

                {/* Stat 3 */}
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <div className="h-10 w-10 rounded-full bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1.5">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 leading-none">{profileStats.Tasks_Completed}</span>
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-1 block">Tasks Completed</span>
                </div>

                {/* Stat 4 */}
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5">
                    <Calendar className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 leading-none mb-1">{profileStats.Experience}</span>
                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-center block">Experience</span>
                </div>

              </div>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto select-none no-scrollbar">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'preferences', label: 'Preferences' },
                { id: 'notifications', label: 'Notifications' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ProfileTab)}
                    className="py-3 text-xs md:text-[13px] font-bold border-b-2 px-5 whitespace-nowrap transition-all cursor-pointer"
                    style={{
                      borderColor: isActive ? primaryColor : 'transparent',
                      color: isActive ? primaryColor : 'inherit'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tabs Content Panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >

                {/* ────────────────────────────────────────────────────────
                    TAB: OVERVIEW
                    ──────────────────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Overview Column 1 */}
                    <div className="space-y-4">

                      {/* Card: Personal Information */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                          <User className="h-4 w-4 text-slate-400" />
                          <h3 className="text-[13px] font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                            Personal Information
                          </h3>
                        </div>
                        <div className="space-y-3.5 text-xs text-left">
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Full Name</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-300">{name}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Email Address</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-300">{email}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Phone Number</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-slate-850 dark:text-slate-300">{phone || '—'}</span>
                              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-0 rounded font-bold uppercase text-[8px] tracking-wider py-0.2 px-1.5">
                                Verified
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Job Title</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-300">{jobTitle}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Department</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-300">{role}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Location</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-300">{location || '—'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Date of Joining</span>
                              <span className="font-semibold text-slate-850 dark:text-slate-300">15 Jan 2021</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Employee ID</span>
                              <span className="font-semibold text-slate-850 dark:text-slate-300">CRM-EMP-1024</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card: Preferences summary */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                          <Settings className="h-4 w-4 text-slate-400" />
                          <h3 className="text-[13px] font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                            Preferences
                          </h3>
                        </div>
                        <div className="space-y-3.5 text-xs text-left mb-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Language</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-300">English (US)</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Date Format</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-300">24 May 2024</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Time Zone</span>
                            <span className="font-semibold text-slate-850 dark:text-slate-300">(GMT+05:30) Asia/Kolkata</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">Theme</span>
                            <span className="font-semibold capitalize text-slate-850 dark:text-slate-300">{mode} Mode</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setActiveTab('preferences')}
                          variant="outline"
                          className="w-full text-xs font-bold h-9 rounded-xl border border-slate-250 cursor-pointer"
                        >
                          Manage Preferences
                        </Button>
                      </div>

                    </div>

                    {/* Overview Column 2 */}
                    <div className="space-y-6">

                      {/* Card: About Me */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                          <User className="h-4 w-4 text-slate-400" />
                          <h3 className="text-[13px] font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                            About Me
                          </h3>
                        </div>

                        {isEditing ? (
                          <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 resize-none mb-4"
                            placeholder="Add brief description..."
                          />
                        ) : (
                          <p className="text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400 mb-5">
                            {bio || 'Add a brief biography here.'}
                          </p>
                        )}

                        <Button
                          onClick={() => {
                            if (isEditing) {
                              handleSaveProfile();
                            } else {
                              setIsEditing(true);
                            }
                          }}
                          variant="outline"
                          className="w-full text-xs font-bold h-9 rounded-xl border border-slate-250 cursor-pointer"
                        >
                          {isEditing ? 'Save About Me' : 'Edit About Me'}
                        </Button>
                      </div>

                      {/* Card: Recent Activity */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-slate-400" />
                            <h3 className="text-[13px] font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                              Recent Activity
                            </h3>
                          </div>
                          <span
                            onClick={() => {
                              toast.info('Viewing detailed logs history panel.');
                            }}
                            className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer uppercase tracking-wider"
                          >
                            View All
                          </span>
                        </div>

                        {/* Activity List Timeline */}
                        <div className="space-y-4">
                          {activities.map((item) => (
                            <div key={item.id} className="flex gap-3 items-start text-xs">
                              <div className={`p-1.5 rounded-lg shrink-0 ${item.color}`}>
                                <item.icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 dark:text-slate-300 leading-tight">
                                  {item.text}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 block mt-0.5">
                                  {item.time}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Overview Column 3 */}
                    <div className="space-y-6">



                      {/* Card: My Teams */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <h3 className="text-[13px] font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider">
                              My Teams
                            </h3>
                          </div>
                          <span
                            onClick={() => {
                              toast.info('Opening CRM teams layout.');
                            }}
                            className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer uppercase tracking-wider"
                          >
                            View All
                          </span>
                        </div>

                        {/* Teams List */}
                        <div className="space-y-3.5 text-xs text-left">
                          {[
                            { name: 'Project Management Team', role: 'Team Lead', initials: 'PM', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
                            { name: 'Delivery Team', role: 'Member', initials: 'DT', bg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' },
                            { name: 'Client Success Team', role: 'Member', initials: 'CT', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
                            { name: 'QA & Testing Team', role: 'Member', initials: 'QA', bg: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300' }
                          ].map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between border-b last:border-0 pb-2.5 last:pb-0">
                              <div className="flex items-center gap-2.5">
                                <div className={`h-6.5 w-6.5 rounded-md font-extrabold flex items-center justify-center text-[10px] ${t.bg}`}>
                                  {t.initials}
                                </div>
                                <span className="font-bold text-slate-700 dark:text-slate-350">{t.name}</span>
                              </div>
                              <Badge className="bg-slate-105 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[8px] font-bold uppercase rounded border-0 py-0.2 px-1.5 shadow-none">
                                {t.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                  </div>
                )}



                {/* ────────────────────────────────────────────────────────
                    TAB: PREFERENCES
                    ──────────────────────────────────────────────────────── */}
                {activeTab === 'preferences' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl text-left">
                    {/* Theme & Color Preferences */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                        <Settings className="h-4.5 w-4.5 text-slate-400" />
                        <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">
                          Theme Settings
                        </h3>
                      </div>

                      <div className="space-y-5">

                        {/* Theme Select */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Color Mode</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'light', icon: Check, label: 'Light' },
                              { id: 'dark', icon: Check, label: 'Dark' },
                              { id: 'system', icon: Check, label: 'System' }
                            ].map((m) => {
                              const isSel = mode === m.id;
                              return (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => setMode(m.id as any)}
                                  className={`py-2 px-3 flex items-center justify-between rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${isSel
                                    ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900'
                                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                  <span>{m.label}</span>
                                  {isSel && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Primary Color Select */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Primary Color Scheme</label>
                          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 pt-1">
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
                                onClick={() => {
                                  setPrimaryColor(color.value);
                                  toast.success(`Primary color switched to ${color.name}!`);
                                }}
                                className={`h-8 w-8 rounded-full border transition-all hover:scale-110 flex items-center justify-center shrink-0 cursor-pointer ${primaryColor === color.value
                                  ? 'border-slate-800 dark:border-white ring-1 ring-slate-800 dark:ring-white scale-110'
                                  : 'border-transparent'
                                  }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              >
                                {primaryColor === color.value && (
                                  <span className="text-[9px] text-white">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Regional & System settings */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] text-left flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                          <Globe className="h-4.5 w-4.5 text-slate-400" />
                          <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">
                            Regional Preferences
                          </h3>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider block">Language</label>
                            <select
                              defaultValue="en-us"
                              className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-350"
                            >
                              <option value="en-us">English (United States)</option>
                              <option value="en-gb">English (United Kingdom)</option>
                              <option value="de-de">Deutsch (German)</option>
                              <option value="fr-fr">Français (French)</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-450 uppercase tracking-wider block">Time Zone Selection</label>
                            <select
                              defaultValue="kolkata"
                              className="w-full text-xs h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-350"
                            >
                              <option value="kolkata">(GMT+05:30) Asia/Kolkata</option>
                              <option value="utc">(GMT+00:00) UTC Standard</option>
                              <option value="est">(GMT-05:00) New York / EST</option>
                              <option value="cet">(GMT+01:00) Frankfurt / CET</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-6">
                        <Button
                          onClick={() => {
                            toast.success('Regional configurations synchronized.');
                          }}
                          style={{ backgroundColor: primaryColor }}
                          className="w-full h-9 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer"
                        >
                          Save Preferences
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ────────────────────────────────────────────────────────
                    TAB: NOTIFICATIONS
                    ──────────────────────────────────────────────────────── */}
                {activeTab === 'notifications' && (
                  <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.01)] text-left">
                    <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-50 dark:border-slate-850">
                      <BellRing className="h-4.5 w-4.5 text-slate-400" />
                      <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200">
                        Alert Frequencies & Channels
                      </h3>
                    </div>

                    <div className="space-y-4 text-xs font-medium">

                      {/* Toggle 1 */}
                      <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 dark:border-slate-850">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Email Alerts</h4>
                          <p className="text-[10px] text-slate-450">Receive notifications via registered email inbox.</p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({ ...notificationSettings, emailAlerts: !notificationSettings.emailAlerts })}
                          className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notificationSettings.emailAlerts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-850'}`}
                        >
                          <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform transform ${notificationSettings.emailAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Toggle 2 */}
                      <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 dark:border-slate-850">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Desktop Push Notifications</h4>
                          <p className="text-[10px] text-slate-450">Alert banners on computer notifications panel.</p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({ ...notificationSettings, pushAlerts: !notificationSettings.pushAlerts })}
                          className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notificationSettings.pushAlerts ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-850'}`}
                        >
                          <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform transform ${notificationSettings.pushAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Toggle 3 */}
                      <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 dark:border-slate-850">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Weekly Performance Digest</h4>
                          <p className="text-[10px] text-slate-450">Get summary report on deals generated and projects completed.</p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({ ...notificationSettings, weeklyDigest: !notificationSettings.weeklyDigest })}
                          className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notificationSettings.weeklyDigest ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-850'}`}
                        >
                          <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform transform ${notificationSettings.weeklyDigest ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Toggle 4 */}
                      <div className="flex items-center justify-between pb-3.5 border-b border-slate-50 dark:border-slate-850">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Lead Assignment Alerts</h4>
                          <p className="text-[10px] text-slate-450">Ping instantly when a new lead/contact is assigned to you.</p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({ ...notificationSettings, leadAssign: !notificationSettings.leadAssign })}
                          className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notificationSettings.leadAssign ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-850'}`}
                        >
                          <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform transform ${notificationSettings.leadAssign ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Toggle 5 */}
                      <div className="flex items-center justify-between pb-1">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Deal Milestone Change Alerts</h4>
                          <p className="text-[10px] text-slate-450">Get alerts on won/lost updates or stage movements.</p>
                        </div>
                        <button
                          onClick={() => setNotificationSettings({ ...notificationSettings, dealMilestone: !notificationSettings.dealMilestone })}
                          className={`h-6 w-11 rounded-full p-0.5 transition-colors focus:outline-none ${notificationSettings.dealMilestone ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-850'}`}
                        >
                          <div className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform transform ${notificationSettings.dealMilestone ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                    </div>

                    <Button
                      onClick={() => toast.success("Notification configurations saved successfully!")}
                      style={{ backgroundColor: primaryColor }}
                      className="h-9 px-5 font-bold text-white text-xs rounded-xl shadow-xs cursor-pointer w-full mt-6"
                    >
                      Save Preferences
                    </Button>
                  </div>
                )}



              </motion.div>
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
