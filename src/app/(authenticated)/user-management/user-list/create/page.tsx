'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ChevronLeft,
  X,
  Mail,
  Send,
  User,
  Users2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { createUserWithMail, checkUserLimit, fetchUserAdditional } from '@/service/api/useradmin/api';
import { getTenantName } from '@/service/apiClient';
import { fetchRoleListWithoutPagination } from '@/service/api/role/api';

interface AppUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive' | 'Locked' | 'Pending';
  lastLogin: string;
  isAdmin?: boolean;
}

export default function InviteUserPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Form Fields
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('User');
  const [role, setRole] = useState('');
  const [reportingTo, setReportingTo] = useState('');
  const [userList, setUserList] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Check entered/modified fields
  const getModifiedFields = (): string[] => {
    const fields: string[] = [];
    if (email.trim()) fields.push(`Email Id ("${email.trim()}")`);
    if (userType && userType !== 'User') fields.push(`User Type ("${userType}")`);
    if (role) fields.push(`Role ("${role}")`);
    if (reportingTo && reportingTo !== 'none_select') {
      const reporter = userList.find((u) => u.id === reportingTo);
      fields.push(`Reporting To ("${reporter ? reporter.name : reportingTo}")`);
    }
    return fields;
  };

  // Cancel button click handler
  const handleCancelClick = () => {
    const modified = getModifiedFields();
    if (modified.length > 0) {
      setShowCancelWarning(true);
    } else {
      router.push('/user-management/user-list');
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelWarning(false);
    router.push('/user-management/user-list');
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const orgId = localStorage.getItem('Organization_Id') || '1';
        const response = await fetchUserAdditional({ Organization_Id: orgId, is_active: 'True' });
        if (response && response.results) {
          const mapped = response.results.map((u: any) => ({
            id: String(u.id),
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username
          }));
          setUserList(mapped);
        }
      } catch (error) {
        console.error('Failed to load user list for reporting selection:', error);
      }

      try {
        const rolesRes = await fetchRoleListWithoutPagination();
        if (rolesRes) {
          const list = Array.isArray(rolesRes) ? rolesRes : (rolesRes.results || []);
          const mappedRoles = list.map((r: any) => ({
            id: String(r.id || r.Role_Id),
            name: r.Role_Name || r.Name || ''
          })).filter((r: any) => r.name);
          setRoles(mappedRoles);
        }
      } catch (error) {
        console.error('Failed to load roles:', error);
      }
    };
    loadData();
  }, []);

  const handleSendInvitation = async () => {
    if (!email.trim()) return toast.error('Email ID is required.');

    // Simple email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return toast.error('Please enter a valid email address.');
    }

    if (!userType) return toast.error('Please select a user type.');
    if (!role) return toast.error('Please select a role.');

    try {
      // 1. Limit Check Function API
      const checkRes = await checkUserLimit();
      if (checkRes && checkRes.status === 'error') {
        return toast.error(checkRes.message || 'User limit reached.');
      }
    } catch (e: any) {
      console.warn('User limit check failed or was bypassed:', e);
    }

    // 2. Prepare payload for UserCreate API
    const orgId = Number(localStorage.getItem('Organization_Id') || '1');
    const createdBy = Number(localStorage.getItem('userId') || '1');
    const tenant = getTenantName() || 'pegatto';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pegatto.crmfarm.app';

    // Find the name of the user chosen as reporting to
    const selectedReporter = userList.find(u => u.id === reportingTo);
    const reporterName = selectedReporter ? selectedReporter.name : '';

    const payload = {
      Organization_Id: orgId,
      email: email.trim(),
      UserType: userType,
      Tenent: tenant,
      Url: baseUrl,
      groups: [],
      user_permissions: [],
      mailhtml: `<div className="card" style={{width: 18}}>\n          <div className="card-body">\n            <h4   className="card-subtitle mb-2 text-muted">Dear User,</h4>\n            <div className="card-text">\n              We are delighted to welcome you to our platform!\n              <br/>\n              <p>1. Go to our website <a href='{{url}}'> Click Here</a>.</p>\n              <p>2. Click on the \"Register\"  button.</p>\n              <p>3. Enter your personal details, including your full name, email address, and a password.</p>\n              <p>Follow the instructions to verify your email address.</p>\n              <p>Once you click register button,  you will be able to log in to your account.</p>\n              <br/>\n              <p>If you have any issues during the registration process or require any assistance, please do not hesitate to contact us at 'nrpatnaik@foyertech.com'.</p>\n              <p>Thank you for choosing our platform, and we look forward to having you as a member.</p>\n              <br/>\n              <p>Best regards,</p>\n              <p>Administrator</p>\n            </div>\n            <br/>\n          </div>\n          </div>`,
      Created_by: createdBy,
      mailsubject: "Mail for registration",
      CounselorCourse: [],
      MailPassword: "Test@123",
      Designation: role,
      permissions: [],
      Edu_Reporting_to: reportingTo ? Number(reportingTo) : null,
      Edu_Reporter_Name: reporterName
    };

    try {
      await createUserWithMail(payload);
      toast.success('User invited and created successfully.');
      router.push('/user-management/user-list');
    } catch (error) {
      console.error('Failed to create/invite user:', error);
      toast.error('Failed to invite user.');
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left pb-24">
      {/* 1. Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="hover:text-slate-655 transition-colors">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" className="hover:text-slate-655 transition-colors">User Management</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/user-management/user-list" className="hover:text-slate-655 transition-colors">User List</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Invite User</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Top Form Header Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
            <Users className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Invite User</h1>
            <p className="text-xs text-slate-450 font-medium">Send an email invitation to invite a new team member.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelClick}
            className="h-8.5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 gap-1.5 rounded-[5px]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to List</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelClick}
            className="h-8.5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 gap-1.5 rounded-[5px]"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center py-6 w-full">
        <Card className="border dark:border-slate-800 shadow-xl rounded-[5px] bg-white dark:bg-slate-900 w-full max-w-sm">
          <CardContent className="p-8 flex flex-col gap-5">

            {/* Centered Heading and Subtitle */}
            <div className="text-center flex flex-col gap-1.5 mb-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Invite a User</h2>
              <p className="text-xs font-semibold text-slate-450 leading-relaxed max-w-[240px] mx-auto">
                Enter the details below to invite a new user.
              </p>
            </div>

            {/* Email ID */}
            <div className="flex flex-col gap-2 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Email Id <span className="text-rose-500 font-bold">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.75 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="Enter user email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px] w-full"
                />
              </div>
            </div>

            {/* User Type */}
            <div className="flex flex-col gap-2 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                User Type <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Select value={userType} onValueChange={(val) => setUserType(val || 'User')}>
                <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px] w-full pl-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Select User Type" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[5px]">
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="flex flex-col gap-2 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Role <span className="text-rose-500 font-bold">*</span>
              </Label>
              <Select value={role} onValueChange={(val) => setRole(val || '')}>
                <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px] w-full pl-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Select a role" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[5px]">
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reporting To */}
            <div className="flex flex-col gap-2 text-left">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Reporting To
              </Label>
              <Select value={reportingTo} onValueChange={(val) => setReportingTo(val || '')}>
                <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px] w-full pl-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Select who user reports to" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[5px]">
                  <SelectItem value="none_select">None</SelectItem>
                  {userList.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Send Invitation Button */}
            <Button
              onClick={handleSendInvitation}
              className="h-10 text-xs font-bold text-white shadow-md gap-2 hover:opacity-90 rounded-[5px] w-full mt-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="h-4.5 w-4.5" />
              <span>Send Invitation</span>
            </Button>

          </CardContent>
        </Card>
      </div>

      {/* WARNING MODAL ON CANCEL */}
      <Dialog open={showCancelWarning} onOpenChange={setShowCancelWarning}>
        <DialogContent className="max-w-[430px] p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Header with soft green banner and warning icon */}
          <div className="bg-[#D4E8DC] dark:bg-emerald-950/70 px-4 py-3 flex items-center gap-2.5 rounded-t-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Warning</h3>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              CRMFarm found that some modification has been made. By cancelling the modification will not be saved
            </p>

            {getModifiedFields().length > 0 && (
              <div className="mt-3.5 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Entered Details:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {getModifiedFields().map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-6">
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold px-4 py-1.5 rounded flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="h-4 w-4" />
                Yes
              </button>

              <button
                type="button"
                onClick={() => setShowCancelWarning(false)}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold px-4 py-1.5 rounded flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
                No
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
