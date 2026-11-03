'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ArrowLeft,
  Shield,
  Save,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createRole, fetchPlanMenuTree } from '@/service/api/role/api';

import RolePermissionMatrix from '@/components/role/RolePermissionMatrix';

interface BackendFormPermission {
  id?: number;
  FormId: string;
  ModuleName: string;
  FormName: string;
  PermissionName: any;
  Field_Name?: any;
  AllPermission?: boolean;
}


export default function CreateRolePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPlanId = localStorage.getItem('Plan_Id');
      if (storedPlanId) {
        setPlanId(storedPlanId);
      }
    }
  }, []);

  // Fetch Plan Menu Tree from API (using Plan_Id from localStorage dynamically)
  const { data: planMenuData } = useQuery({
    queryKey: ['planMenuTree', planId, 'crm'],
    queryFn: () => fetchPlanMenuTree(planId, 'crm'),
    enabled: !!planId,
  });

  const getUserId = (): number => {
    if (typeof window !== 'undefined') {
      try {
        const userDataStr = localStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const id = Number(userData?.id);
          if (!isNaN(id) && id > 0) {
            return id;
          }
        }
      } catch (e) {
        console.error('Error retrieving userId from localStorage', e);
      }
    }
    return 72; // default fallback
  };

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'System' | 'Custom'>('Custom');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [usersCount, setUsersCount] = useState(0);

  // Map of FormId -> FormPermission object representing user choices
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, BackendFormPermission>>({});

  const getAllAvailableKeysFromMenuTree = (nodes: any[]): string[] => {
    if (!Array.isArray(nodes)) return [];
    const keys: string[] = [];

    const traverse = (node: any) => {
      const name = node.name || node.code || '';
      const code = node.code || node.FormId || name;
      const children = Array.isArray(node.children) ? node.children : [];

      const hasLeafActionChildren =
        children.length > 0 &&
        children.every((child: any) => {
          const childName = child.name || child.code || '';
          return (
            childName.includes('.') ||
            child.menu_type === 'action' ||
            !Array.isArray(child.children) ||
            child.children.length === 0
          );
        });

      if (hasLeafActionChildren) {
        children.forEach((child: any) => {
          const childName = child.name || child.code || '';
          const childCode = child.code || child.FormId || childName;
          keys.push(childCode);
        });
      } else if (children.length > 0) {
        children.forEach((child: any) => traverse(child));
      } else {
        const ACTION_COLUMNS = ['Create', 'Edit', 'Delete', 'Overview', 'Import', 'Export'];
        ACTION_COLUMNS.forEach((actionType) => {
          keys.push(`${code}.${actionType.toLowerCase()}`);
        });
      }
    };

    nodes.forEach((n) => traverse(n));
    return Array.from(new Set(keys));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      // Get all valid available permission keys from current plan menu tree
      const availableKeys = getAllAvailableKeysFromMenuTree(planMenuData?.MenuTree || []);

      // Pass only selected permissions that are currently available in the plan menu tree
      const configurePermissions = Object.keys(selectedPermissions).filter((key) => {
        const lowerKey = key.toLowerCase();
        return availableKeys.some((avail) => {
          const lowerAvail = avail.toLowerCase();
          return (
            lowerKey === lowerAvail ||
            lowerKey === `${lowerAvail}.view` ||
            `${lowerKey}.view` === lowerAvail
          );
        });
      });

      // Create the Role with Configure_Permission embedded — no separate FormPermission call
      const payload = {
        name: name.trim(),
        Role_Name: name.trim(),
        Role_Description: description.trim(),
        Description: description.trim(),
        Role_Type: type,
        Status: status,
        Configure_Permission: configurePermissions,
        Data_Access_Level: 'TEAM',
        Approval_Authority: 'LIMITED',
        Maximum_Approval: 0,
        permissions: [],
        FormNames: [],
        Modelname: [],
        RolePermissions: [],
        FormPermissions: [],
        Company_Id: 1,
        Created_By: getUserId(),
        Updated_By: getUserId()
      };

      await createRole(payload);
      queryClient.invalidateQueries({ queryKey: ['rolesList'] });
      queryClient.invalidateQueries({ queryKey: ['roleDashboardCards'] });
      toast.success('Role created successfully');
      router.push('/system/roles');
    } catch (err: any) {
      toast.error(`Failed to create role: ${err.message || err}`);
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[1400px] mx-auto space-y-6 text-left p-1"
    >
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => router.push('/')}
              className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              System
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-3 w-3" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={() => router.push('/system/roles')}
              className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              Roles
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-3 w-3" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-350">
              Create Role
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push('/system/roles')}
            className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Create New Role
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Set role information and assign granular access permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/system/roles')}
            className="h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Role
          </Button>
        </div>
      </div>

      {/* Role Profile Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Role Profile
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="name" className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Role Name
            </Label>
            <Input
              id="name"
              placeholder="e.g. Lead Developer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="type" className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Role Type
            </Label>
            <Select
              value={type}
              onValueChange={(val) => setType((val || 'Custom') as any)}
            >
              <SelectTrigger className="h-9 text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 w-full">
                <SelectValue placeholder="Custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Custom">Custom</SelectItem>
                <SelectItem value="System">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="users" className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Assigned Users Count
            </Label>
            <Input
              id="users"
              type="number"
              min="0"
              value={usersCount}
              onChange={(e) => setUsersCount(parseInt(e.target.value) || 0)}
              className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 grid gap-1.5">
            <Label htmlFor="description" className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Briefly describe the roles, responsibilities and settings of this role..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs rounded-lg border-slate-200 dark:border-slate-800 h-9 min-h-[36px] resize-none"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Role Status
            </Label>
            <div className="flex gap-6 items-center h-9">
              <div className="flex items-center gap-1.5">
                <input
                  type="radio"
                  id="status-active"
                  name="status"
                  checked={status === 'Active'}
                  onChange={() => setStatus('Active')}
                  className="h-4 w-4 accent-blue-600"
                />
                <Label htmlFor="status-active" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Active
                </Label>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="radio"
                  id="status-inactive"
                  name="status"
                  checked={status === 'Inactive'}
                  onChange={() => setStatus('Inactive')}
                  className="h-4 w-4 accent-blue-600"
                />
                <Label htmlFor="status-inactive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Inactive
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permission Matrix Table */}
      <RolePermissionMatrix
        menuTree={planMenuData?.MenuTree || []}
        selectedPermissions={selectedPermissions}
        onSelectionChange={setSelectedPermissions}
        title="Module & Form Permissions"
      />
    </motion.div>
  );
}
