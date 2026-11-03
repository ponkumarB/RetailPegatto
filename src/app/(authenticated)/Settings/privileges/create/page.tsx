'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  Shield,
  Info,
  Check,
  ArrowLeft,
  LayoutDashboard,
  Target,
  Users,
  Building2,
  Handshake,
  CalendarCheck,
  BarChart3,
  Settings2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

// ─────────────────────────────────────
// Permission matrix data
// ─────────────────────────────────────
type PermKey = 'view' | 'create' | 'edit' | 'delete' | 'import' | 'export' | 'print';
const PERM_KEYS: PermKey[] = ['view', 'create', 'edit', 'delete', 'import', 'export', 'print'];

interface ModuleRow {
  id: string;
  name: string;
  description: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  perms: Record<PermKey, boolean>;
}

const MODULES: ModuleRow[] = [
  { id: 'dashboard',  name: 'Dashboard',   description: 'Access to dashboard and widgets',
    Icon: LayoutDashboard, iconBg: 'bg-indigo-50 dark:bg-indigo-950/40',  iconColor: 'text-indigo-500 dark:text-indigo-400',
    perms: { view: true,  create: false, edit: false, delete: false, import: false, export: false, print: false } },
  { id: 'leads',      name: 'Leads',       description: 'Manage leads and related activities',
    Icon: Target,          iconBg: 'bg-blue-50 dark:bg-blue-950/40',      iconColor: 'text-blue-500 dark:text-blue-400',
    perms: { view: true,  create: true,  edit: true,  delete: true,  import: false, export: false, print: false } },
  { id: 'contacts',   name: 'Contacts',    description: 'Manage contacts',
    Icon: Users,           iconBg: 'bg-emerald-50 dark:bg-emerald-950/40', iconColor: 'text-emerald-500 dark:text-emerald-400',
    perms: { view: true,  create: true,  edit: true,  delete: true,  import: true,  export: true,  print: false } },
  { id: 'accounts',   name: 'Accounts',    description: 'Manage accounts',
    Icon: Building2,       iconBg: 'bg-amber-50 dark:bg-amber-950/40',    iconColor: 'text-amber-500 dark:text-amber-400',
    perms: { view: true,  create: true,  edit: true,  delete: false, import: true,  export: true,  print: false } },
  { id: 'deals',      name: 'Deals',       description: 'Manage deals and pipelines',
    Icon: Handshake,       iconBg: 'bg-blue-50 dark:bg-blue-950/40',      iconColor: 'text-blue-600 dark:text-blue-400',
    perms: { view: true,  create: true,  edit: true,  delete: true,  import: true,  export: true,  print: false } },
  { id: 'activities', name: 'Activities',  description: 'Manage activities and calendar',
    Icon: CalendarCheck,   iconBg: 'bg-rose-50 dark:bg-rose-950/40',      iconColor: 'text-rose-500 dark:text-rose-400',
    perms: { view: true,  create: true,  edit: false, delete: false, import: false, export: false, print: false } },
  { id: 'reports',    name: 'Reports',     description: 'View and export reports',
    Icon: BarChart3,       iconBg: 'bg-teal-50 dark:bg-teal-950/40',      iconColor: 'text-teal-500 dark:text-teal-400',
    perms: { view: true,  create: false, edit: false, delete: false, import: false, export: true,  print: true  } },
  { id: 'settings',   name: 'Settings',    description: 'Manage system configuration',
    Icon: Settings2,       iconBg: 'bg-slate-100 dark:bg-slate-800',       iconColor: 'text-slate-500 dark:text-slate-400',
    perms: { view: false, create: false, edit: false, delete: false, import: false, export: false, print: false } },
];

const MODULES_LIST = ['Leads', 'Contacts', 'Accounts', 'Deals', 'Activities', 'Reports', 'Settings', 'All Modules'];

// ─────────────────────────────────────
// Component
// ─────────────────────────────────────
export default function CreatePrivilegePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [privName, setPrivName] = useState('');
  const [module, setModule] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Permission matrix state
  const [matrix, setMatrix] = useState<ModuleRow[]>(MODULES.map(m => ({ ...m, perms: { ...m.perms } })));

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Toggle a single permission cell
  const togglePerm = (moduleId: string, key: PermKey) => {
    setMatrix(prev => prev.map(m =>
      m.id === moduleId ? { ...m, perms: { ...m.perms, [key]: !m.perms[key] } } : m
    ));
  };

  // Select / Clear all
  const selectAll = () => {
    setMatrix(prev => prev.map(m => ({
      ...m,
      perms: Object.fromEntries(PERM_KEYS.map(k => [k, true])) as Record<PermKey, boolean>,
    })));
    toast.success('All permissions selected');
  };

  const clearAll = () => {
    setMatrix(prev => prev.map(m => ({
      ...m,
      perms: Object.fromEntries(PERM_KEYS.map(k => [k, false])) as Record<PermKey, boolean>,
    })));
    toast.info('All permissions cleared');
  };

  // Column select all
  const toggleColumn = (key: PermKey) => {
    const allOn = matrix.every(m => m.perms[key]);
    setMatrix(prev => prev.map(m => ({ ...m, perms: { ...m.perms, [key]: !allOn } })));
  };

  const handleSave = () => {
    if (!privName.trim()) { toast.error('Privilege Name is required'); return; }
    if (!module) { toast.error('Please select a Module'); return; }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Privilege saved successfully!');
      router.push('/Settings/privileges');
    }, 1000);
  };

  // ─────── Checkbox cell ───────
  const PermCell = ({ moduleId, permKey }: { moduleId: string; permKey: PermKey }) => {
    const checked = matrix.find(m => m.id === moduleId)?.perms[permKey] ?? false;
    return (
      <td className="py-3.5 text-center align-middle">
        <button
          type="button"
          onClick={() => togglePerm(moduleId, permKey)}
          className={`h-[18px] w-[18px] rounded border-2 flex items-center justify-center mx-auto transition-all cursor-pointer ${
            checked
              ? 'bg-[#0062ff] border-[#0062ff]'
              : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 hover:border-blue-400'
          }`}
        >
          {checked && <Check className="h-2.5 w-2.5 text-white stroke-[3.5px]" />}
        </button>
      </td>
    );
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* ── SKELETON ── */}
        {isLoading ? (
          <motion.div key="sk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 p-1">
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-80 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="grid grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg" />)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-2xl p-6 h-72 animate-pulse" />
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
                  <BreadcrumbLink onClick={() => router.push('/Settings/privileges')} className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200">Privilege Master</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-350">Create Privilege</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Page header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                {/* Back button */}
                <button
                  onClick={() => router.push('/Settings/privileges')}
                  className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center shrink-0 mt-0.5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-[1.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Create Privilege
                  </h1>
                  <p className="text-muted-foreground text-xs md:text-sm font-medium mt-0.5">
                    Define privileges to control what actions users can perform in the system.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  onClick={() => router.push('/Settings/privileges')}
                  variant="outline"
                  className="h-10 px-5 border-slate-200 dark:border-slate-800 font-bold text-xs rounded-xl text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-50 cursor-pointer shadow-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 px-5 bg-[#0062ff] hover:bg-[#0052df] active:scale-[0.99] text-white font-bold text-xs rounded-xl gap-1.5 shadow-lg shadow-blue-500/10 transition-all cursor-pointer border-none"
                >
                  {isSaving ? 'Saving...' : 'Save Privilege'}
                </Button>
              </div>
            </div>

            {/* ── Section 1: Privilege Details ── */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.025)] overflow-hidden">
              <div className="border-l-[3px] border-[#0062ff] px-5 py-4 border-b border-slate-100/90 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/50">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Privilege Details</h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">

                  {/* Privilege Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                      Privilege Name <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <Input
                      placeholder="Enter privilege name"
                      value={privName}
                      onChange={e => setPrivName(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-xs font-semibold border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
                    />
                  </div>

                  {/* Module */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
                      Module <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <select
                      value={module}
                      onChange={e => setModule(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                    >
                      <option value="" disabled>Select module</option>
                      {MODULES_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description</label>
                    <div className="relative">
                      <textarea
                        placeholder="Enter description (optional)"
                        value={description}
                        onChange={e => setDescription(e.target.value.slice(0, 265))}
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none transition-all"
                      />
                      <span className="absolute bottom-2 right-2 text-[10px] font-semibold text-slate-300 dark:text-slate-600 select-none">
                        {description.length}/265
                      </span>
                    </div>
                  </div>

                  {/* Status toggle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</label>
                    <div className="flex items-center gap-3 h-10">
                      <button
                        type="button"
                        onClick={() => setIsActive(v => !v)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${isActive ? 'bg-[#0062ff]' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-xs font-bold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: Set Permissions ── */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">

              {/* Permission matrix card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.025)] overflow-hidden">
                <div className="border-l-[3px] border-[#0062ff] px-5 py-4 border-b border-slate-100/90 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/50 flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Set Permissions</h2>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      Choose the actions that users with this privilege can perform.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={selectAll}
                      className="text-[11px] font-bold text-[#0062ff] hover:underline cursor-pointer transition-colors">
                      Select All
                    </button>
                    <span className="text-slate-200 dark:text-slate-700">|</span>
                    <button onClick={clearAll}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline cursor-pointer transition-colors">
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/75 dark:bg-slate-900/60 border-b border-slate-100/90 dark:border-slate-850">
                        <th className="text-left text-[10.5px] font-extrabold uppercase text-slate-400 py-3.5 pl-6 w-[240px]">
                          Module / Section
                        </th>
                        {PERM_KEYS.map(key => (
                          <th key={key} className="text-center text-[10.5px] font-extrabold uppercase text-slate-400 py-3.5 px-2 cursor-pointer hover:text-[#0062ff] transition-colors select-none"
                            title={`Toggle all ${key}`}
                            onClick={() => toggleColumn(key)}>
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row, idx) => (
                        <tr key={row.id} className={`border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors ${idx === matrix.length - 1 ? 'border-b-0' : ''}`}>
                          {/* Module info */}
                          <td className="pl-6 py-3.5 align-middle">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${row.iconBg}`}>
                                <row.Icon className={`h-4 w-4 ${row.iconColor}`} />
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-800 dark:text-slate-100 leading-snug">{row.name}</p>
                                <p className="text-[10.5px] font-semibold text-slate-400 mt-0.5">{row.description}</p>
                              </div>
                            </div>
                          </td>
                          {/* Permission checkboxes */}
                          {PERM_KEYS.map(key => (
                            <PermCell key={key} moduleId={row.id} permKey={key} />
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right panel */}
              <div className="space-y-4">

                {/* About Privileges */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100/90 dark:border-slate-850 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.025)]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                      <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">About Privileges</h3>
                  </div>
                  <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                    Privileges control what users can see and do in each module.
                  </p>
                  <ul className="space-y-2">
                    {[
                      ['View', 'Allows viewing records and data'],
                      ['Create', 'Allows creating new records'],
                      ['Edit', 'Allows modifying existing records'],
                      ['Delete', 'Allows deleting records'],
                      ['Import', 'Allows importing data'],
                      ['Export', 'Allows exporting data'],
                      ['Print', 'Allows printing documents'],
                    ].map(([label, desc]) => (
                      <li key={label} className="flex items-start gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <span className="text-slate-300 dark:text-slate-600 leading-none mt-0.5">•</span>
                        <span><span className="font-extrabold text-slate-800 dark:text-slate-200">{label}:</span> {desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Note */}
                <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                      <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-sm font-extrabold text-blue-900 dark:text-blue-300">Note</h3>
                  </div>
                  <p className="text-[11.5px] font-semibold text-blue-700 dark:text-blue-400 leading-relaxed">
                    These permissions will be applied to all users assigned to roles that include this privilege.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
