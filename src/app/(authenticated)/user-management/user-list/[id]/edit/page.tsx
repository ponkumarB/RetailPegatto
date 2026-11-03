'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Users,
  X,
  Save,
  ChevronLeft,
  Info,
  AlertCircle
} from 'lucide-react';
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
import { fetchUserAdditional, updateUser } from '@/service/api/useradmin/api';
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

export default function EditUserPage() {
  const { primaryColor } = useStore();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  // Form Fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<AppUser['status']>('Active');
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastLogin, setLastLogin] = useState('Never');

  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);

  // Load roles from API
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const rolesRes = await fetchRoleListWithoutPagination();
        if (rolesRes) {
          const list = Array.isArray(rolesRes) ? rolesRes : (rolesRes.data || rolesRes.results || []);
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
    loadRoles();
  }, []);

  // Load user data from API
  useEffect(() => {
    if (!userId) return;
    const loadUserData = async () => {
      try {
        const orgId = localStorage.getItem('Organization_Id') || '1';
        // Try fetching active users first
        const activeRes = await fetchUserAdditional({ Organization_Id: orgId, is_active: 'True' });
        let match = activeRes?.results?.find((u: any) => String(u.id) === userId);
        
        // If not found, try fetching inactive users
        if (!match) {
          const inactiveRes = await fetchUserAdditional({ Organization_Id: orgId, is_active: 'False' });
          match = inactiveRes?.results?.find((u: any) => String(u.id) === userId);
        }
        
        if (match) {
          setName(`${match.first_name || ''} ${match.last_name || ''}`.trim() || match.username || '');
          setUsername(match.username || '');
          setEmail(match.email || '');
          setRole(match.Designation || match.UserType || '');
          setDepartment(match.City || '');
          setStatus(match.is_active ? 'Active' : 'Inactive');
          setIsAdmin(!!match.is_superuser);
          setLastLogin(match.last_login ? new Date(match.last_login).toLocaleString() : 'Never');
        } else {
          toast.error('User not found.');
          router.push('/user-management/user-list');
        }
      } catch (error) {
        console.error('Failed to load user info:', error);
        toast.error('Could not load user data from API.');
      }
    };
    loadUserData();
  }, [userId, router]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required.');
    if (!username.trim()) return toast.error('Username is required.');
    if (!email.trim()) return toast.error('Email is required.');
    if (!role) return toast.error('Role is required.');

    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payload = {
      id: Number(userId),
      username: username,
      first_name: firstName,
      last_name: lastName,
      email: email,
      UserType: 'User',
      user_permissions: [],
      Designation: role,
      Edu_Reporter_Name: name,
      Edu_Reporting_to: Number(userId)
    };

    try {
      await updateUser(payload);
      toast.success('User updated successfully.');
      router.push('/user-management/user-list');
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user details.');
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
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Edit User</BreadcrumbPage>
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
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Edit User</h1>
            <p className="text-xs text-slate-450 font-medium">Update platform permissions, roles, and status.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/user-management/user-list')}
            className="h-8.5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-855 gap-1.5 rounded-[5px]"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to List</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/user-management/user-list')}
            className="h-8.5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-855 gap-1.5 rounded-[5px]"
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancel</span>
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            className="h-8.5 text-xs font-bold text-white hover:opacity-90 gap-1.5 rounded-[5px]"
            style={{ backgroundColor: primaryColor }}
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Form Card Layout */}
      <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900 max-w-2xl mx-auto w-full">
        <CardContent className="p-6 flex flex-col gap-5">
          
          <div className="flex items-center gap-2 border-b dark:border-slate-800 pb-3 mb-1">
            <Info className="h-4.5 w-4.5" style={{ color: primaryColor }} />
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: primaryColor }}>User Settings</h2>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Full Name <span className="text-rose-500 font-extrabold">*</span>
            </Label>
            <Input
              placeholder="e.g. Raghav S."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
            />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Username <span className="text-rose-500 font-extrabold">*</span>
            </Label>
            <Input
              placeholder="e.g. raghav.s"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-9 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Email Address <span className="text-rose-500 font-extrabold">*</span>
            </Label>
            <Input
              type="email"
              placeholder="e.g. raghav.s@crmfarm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
              System Role <span className="text-rose-500 font-extrabold">*</span>
            </Label>
            <Select value={role} onValueChange={(val) => setRole(val || '')}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                <SelectValue placeholder="Select Role" />
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

          {/* Department */}
          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Department <span className="text-rose-500 font-extrabold">*</span>
            </Label>
            <Select value={department} onValueChange={(val) => setDepartment(val || '')}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent className="rounded-[5px]">
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5 text-left">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Account Status <span className="text-rose-500 font-extrabold">*</span>
            </Label>
            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent className="rounded-[5px]">
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Locked">Locked</SelectItem>
                <SelectItem value="Pending">Pending Invitation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Flag Checkbox toggle */}
          <div className="flex items-center gap-2 mt-1 border-t dark:border-slate-800 pt-4">
            <input
              type="checkbox"
              id="isAdminCheckbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="h-4 w-4 border-slate-300 dark:border-slate-800 rounded bg-white dark:bg-slate-950 focus:ring-primary accent-primary cursor-pointer"
            />
            <Label htmlFor="isAdminCheckbox" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
              Grant Global System Administrator Permissions
            </Label>
          </div>

        </CardContent>
      </Card>

      {/* Bottom disclaimer notice */}
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-455 uppercase tracking-wide mt-4 max-w-2xl mx-auto pl-2">
        <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
        <span>Fields marked with an asterisk (*) are mandatory.</span>
      </div>
    </div>
  );
}
