'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Shield,
  ChevronRight,
  Copy,
  Users,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─────────────────────────────────────
// Types & seed data
// ─────────────────────────────────────
type PermKey = 'view' | 'create' | 'edit' | 'delete' | 'import' | 'export' | 'print';

interface Privilege {
  id: string;
  name: string;
  module: string;
  description: string;
  active: boolean;
  assignedRoles: number;
  permissions: Record<PermKey, boolean>;
  createdAt: string;
}

const SEED: Privilege[] = [
  {
    id: 'PRV-001', name: 'Administrator Full Access', module: 'All Modules',
    description: 'Full access to all CRM modules with all permissions.',
    active: true, assignedRoles: 3,
    permissions: { view: true, create: true, edit: true, delete: true, import: true, export: true, print: true },
    createdAt: '2024-01-10',
  },
  {
    id: 'PRV-002', name: 'Sales Manager', module: 'Deals, Leads',
    description: 'Manage deals and leads. View contacts and reports.',
    active: true, assignedRoles: 6,
    permissions: { view: true, create: true, edit: true, delete: false, import: true, export: true, print: true },
    createdAt: '2024-02-05',
  },
  {
    id: 'PRV-003', name: 'Sales Representative', module: 'Leads, Contacts',
    description: 'Create and view leads and contacts, limited editing.',
    active: true, assignedRoles: 12,
    permissions: { view: true, create: true, edit: true, delete: false, import: false, export: false, print: false },
    createdAt: '2024-02-20',
  },
  {
    id: 'PRV-004', name: 'Support Agent', module: 'Contacts, Tickets',
    description: 'Handle support tickets and view customer contacts.',
    active: true, assignedRoles: 8,
    permissions: { view: true, create: true, edit: true, delete: false, import: false, export: false, print: true },
    createdAt: '2024-03-01',
  },
  {
    id: 'PRV-005', name: 'Marketing Executive', module: 'Leads, Reports',
    description: 'Access leads and generate marketing reports.',
    active: false, assignedRoles: 2,
    permissions: { view: true, create: false, edit: false, delete: false, import: true, export: true, print: false },
    createdAt: '2024-03-15',
  },
  {
    id: 'PRV-006', name: 'Read-Only Analyst', module: 'Reports, Dashboard',
    description: 'View-only access to reports and dashboard analytics.',
    active: true, assignedRoles: 4,
    permissions: { view: true, create: false, edit: false, delete: false, import: false, export: true, print: true },
    createdAt: '2024-04-08',
  },
];

const PERM_KEYS: PermKey[] = ['view', 'create', 'edit', 'delete', 'import', 'export', 'print'];

// ─────────────────────────────────────
// Component
// ─────────────────────────────────────
export default function PrivilegesListPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [privileges, setPrivileges] = useState<Privilege[]>(SEED);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const handleToggle = (id: string) => {
    setPrivileges(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    toast.success('Privilege status updated');
  };

  const handleDelete = (id: string, name: string) => {
    setPrivileges(prev => prev.filter(p => p.id !== id));
    toast.success(`"${name}" deleted`);
  };

  const handleDuplicate = (priv: Privilege) => {
    const copy: Privilege = {
      ...priv,
      id: `PRV-${Date.now()}`,
      name: `${priv.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setPrivileges(prev => [copy, ...prev]);
    toast.success(`"${priv.name}" duplicated`);
  };

  const filtered = privileges.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.module.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || (statusFilter === 'Active' ? p.active : !p.active);
    return matchSearch && matchStatus;
  });

  const activeCount = privileges.filter(p => p.active).length;
  const inactiveCount = privileges.filter(p => !p.active).length;
  const totalRoles = privileges.reduce((a, p) => a + p.assignedRoles, 0);

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ── SKELETON ── */}
        {isLoading ? (
          <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 p-1">
            <div className="h-4 w-56 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            <div className="flex justify-between items-center py-2">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl animate-pulse" />)}
            </div>
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
              {[1,2,3,4,5].map(i => <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-800 rounded" />)}
            </div>
          </motion.div>
        ) : (

          /* ── FULL VIEW ── */
          <motion.div key="content" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-5 text-left p-1">

            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList className="text-xs font-semibold text-slate-400">
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => router.push('/Settings')} className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200">Setup</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-350">Privilege Master</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Privilege Master
                  </h1>
                </div>
                <p className="text-muted-foreground text-xs md:text-sm font-medium pl-11">
                  Manage access privileges that control what users can see and do.
                </p>
              </div>
              <Button
                onClick={() => router.push('/Settings/privileges/create')}
                className="h-10 px-5 bg-[#0062ff] hover:bg-[#0052df] active:scale-[0.99] text-white font-bold text-xs rounded-xl gap-1.5 shadow-lg shadow-blue-500/10 transition-all cursor-pointer border-none shrink-0"
              >
                <Plus className="h-4 w-4 stroke-[3px]" /> Create Privilege
              </Button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Privileges', value: privileges.length, icon: Shield, bg: 'bg-blue-50 dark:bg-blue-950/30', color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Active Privileges', value: activeCount, icon: ShieldCheck, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Roles Assigned', value: totalRoles, icon: Users, bg: 'bg-purple-50 dark:bg-purple-950/30', color: 'text-purple-600 dark:text-purple-400' },
              ].map(card => (
                <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.025)]">
                  <div className={`h-11 w-11 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.025)] overflow-hidden">

              {/* Toolbar */}
              <div className="px-5 py-4 border-b border-slate-100/90 dark:border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">All Privileges</h2>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      placeholder="Search privileges..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-8 h-9 text-xs font-semibold bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
                    />
                  </div>
                  {/* Status filter */}
                  {(['All', 'Active', 'Inactive'] as const).map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className={`h-9 px-3.5 rounded-lg text-xs font-bold transition-all ${statusFilter === f
                        ? 'bg-[#0062ff] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/75 dark:bg-slate-900/60 border-b border-slate-100/90 dark:border-slate-850">
                    <TableRow className="border-b-0">
                      <TableHead className="text-[10.5px] font-extrabold uppercase text-slate-400 py-4 pl-6 w-[240px]">Privilege Name</TableHead>
                      <TableHead className="text-[10.5px] font-extrabold uppercase text-slate-400 py-4 w-[160px]">Module</TableHead>
                      <TableHead className="text-[10.5px] font-extrabold uppercase text-slate-400 py-4">Permissions</TableHead>
                      <TableHead className="text-[10.5px] font-extrabold uppercase text-slate-400 py-4 w-[100px] text-center">Roles</TableHead>
                      <TableHead className="text-[10.5px] font-extrabold uppercase text-slate-400 py-4 w-[100px] text-center">Status</TableHead>
                      <TableHead className="text-[10.5px] font-extrabold uppercase text-slate-400 py-4 w-[80px] text-center pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-sm text-slate-400 font-semibold">
                          <div className="flex flex-col items-center gap-2">
                            <Lock className="h-8 w-8 text-slate-300" />
                            No privileges found
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filtered.map(priv => (
                      <TableRow key={priv.id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors">

                        {/* Name */}
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${priv.active ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                              {priv.active
                                ? <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                : <ShieldOff className="h-4 w-4 text-slate-400" />}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">{priv.name}</p>
                              <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">{priv.id}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Module */}
                        <TableCell className="py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 text-[10.5px] font-bold text-blue-700 dark:text-blue-400">
                            {priv.module}
                          </span>
                        </TableCell>

                        {/* Permissions dots */}
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {PERM_KEYS.map(key => (
                              <span key={key} title={key}
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-bold uppercase border ${priv.permissions[key]
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-350 dark:text-slate-600 border-slate-150 dark:border-slate-700 line-through'}`}>
                                {key}
                              </span>
                            ))}
                          </div>
                        </TableCell>

                        {/* Roles */}
                        <TableCell className="py-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {priv.assignedRoles}
                          </div>
                        </TableCell>

                        {/* Status toggle */}
                        <TableCell className="py-4 text-center">
                          <button onClick={() => handleToggle(priv.id)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${priv.active ? 'bg-[#0062ff]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${priv.active ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-4 text-center pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            } />
                            <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border dark:border-slate-800 text-xs font-semibold">
                              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => router.push(`/Settings/privileges/${priv.id}/edit`)}>
                                <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleDuplicate(priv)}>
                                <Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer gap-2 text-rose-600 dark:text-rose-400" onClick={() => handleDelete(priv.id, priv.name)}>
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Footer count */}
              <div className="px-6 py-3.5 border-t border-slate-100/90 dark:border-slate-850 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-400">
                  Showing <span className="font-bold text-slate-600 dark:text-slate-300">{filtered.length}</span> of <span className="font-bold text-slate-600 dark:text-slate-300">{privileges.length}</span> privileges
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> {activeCount} active &nbsp;
                  <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" /> {inactiveCount} inactive
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
