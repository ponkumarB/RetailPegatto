'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Play,
  Pause,
  Activity,
  CheckCircle,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  Edit2,
  MoreVertical,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Zap,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchWorkflowRules,
  fetchWorkflowRulesWithoutPagination,
  searchWorkflowRules,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  filterWorkflowRules,
  fetchWorkflowModulesWithoutPagination,
  fetchWorkflowEventsWithoutPagination,
  fetchWorkflowExecutionsWithoutPagination
} from '@/service/api/Workflow/api';

interface WorkflowModule {
  id: string | number;
  Module_Name: string;
}

interface WorkflowEvent {
  id: string | number;
  Event_Name: string;
  Module: any;
}

interface WorkflowRule {
  id: string | number;
  Workflow_Id: string;
  Workflow_Name: string;
  Module: any;
  Module_Name?: string;
  Event: any;
  Event_Name?: string;
  Description: string;
  Status: boolean;
  Priority: number;
  Effective_Date: string;
  Expiry_Date: string;
  Stop_Other_Workflows: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
}

interface WorkflowExecution {
  id: string | number;
  Workflow: any;
  Status: string;
  Started_On: string;
}

export default function WorkflowRulePage() {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [allRules, setAllRules] = useState<WorkflowRule[]>([]);
  const [modules, setModules] = useState<WorkflowModule[]>([]);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('All Modules');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [loading, setLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const itemsPerPage = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);

  // Ellipsis menu state for each row
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | number | null>(null);

  // Form Fields State
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formModuleId, setFormModuleId] = useState('');
  const [formEventId, setFormEventId] = useState('');
  const [formPriority, setFormPriority] = useState(1);
  const [formEffective, setFormEffective] = useState('');
  const [formExpiry, setFormExpiry] = useState('');
  const [formStopOther, setFormStopOther] = useState(false);
  const [formStatus, setFormStatus] = useState<boolean>(true);
  const [formOrgId, setFormOrgId] = useState<number>(1);

  // Fetch dependency data
  const loadDependencies = async () => {
    try {
      const [modRes, evRes, execRes] = await Promise.all([
        fetchWorkflowModulesWithoutPagination(),
        fetchWorkflowEventsWithoutPagination(),
        fetchWorkflowExecutionsWithoutPagination().catch(() => [])
      ]);
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data || modRes?.results || []));
      setEvents(Array.isArray(evRes) ? evRes : (evRes?.data || evRes?.results || []));
      setExecutions(Array.isArray(execRes) ? execRes : (execRes?.data || execRes?.results || []));
    } catch (err) {
      console.error('Failed to load workflow dependencies', err);
    }
  };

  // Main data loader
  const loadData = async (pageToLoad = currentPage) => {
    setLoading(true);
    try {
      let res;
      const hasFilters = selectedModule !== 'All Modules' || selectedStatus !== 'All Status';

      if (hasFilters) {
        const payload: any = {};
        if (selectedModule !== 'All Modules') {
          payload.Module = Number(selectedModule);
        }
        if (selectedStatus !== 'All Status') {
          payload.Status = selectedStatus === 'Active';
        }
        res = await filterWorkflowRules(payload);
      } else if (searchQuery) {
        res = await searchWorkflowRules(searchQuery);
      } else {
        res = await fetchWorkflowRules(pageToLoad);
      }

      const data = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setRules(data);
      setTotalRecords(res?.count || data.length);

      // Refresh all rules for KPI counters
      const allRulesRes = await fetchWorkflowRulesWithoutPagination();
      setAllRules(Array.isArray(allRulesRes) ? allRulesRes : (allRulesRes?.data || allRulesRes?.results || []));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load workflow rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    loadData(1);
  }, [searchQuery, selectedModule, selectedStatus]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData(newPage);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedModule('All Modules');
    setSelectedStatus('All Status');
  };

  // Open Form Modal
  const openFormModal = (rule: WorkflowRule | null = null) => {
    const storedOrgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const fallbackOrgId = storedOrgId ? Number(storedOrgId) : 1;

    if (rule) {
      const moduleId = typeof rule.Module === 'object' && rule.Module ? String((rule.Module as any).id) : String(rule.Module || '');
      const eventId = typeof rule.Event === 'object' && rule.Event ? String((rule.Event as any).id) : String(rule.Event || '');

      setEditingRule(rule);
      setFormName(rule.Workflow_Name || '');
      setFormDesc(rule.Description || '');
      setFormModuleId(moduleId);
      setFormEventId(eventId);
      setFormPriority(rule.Priority || 1);
      setFormEffective(rule.Effective_Date || '');
      setFormExpiry(rule.Expiry_Date || '');
      setFormStopOther(rule.Stop_Other_Workflows || false);
      setFormStatus(rule.Status);

      let orgId = fallbackOrgId;
      const rawOrg = (rule as any).Organization_Id ?? (rule as any).Organization_Id_id;
      if (rawOrg !== undefined && rawOrg !== null) {
        orgId = typeof rawOrg === 'object' ? (rawOrg.id ?? fallbackOrgId) : Number(rawOrg);
      }
      setFormOrgId(orgId);
    } else {
      setEditingRule(null);
      setFormName('');
      setFormDesc('');
      setFormModuleId('');
      setFormEventId('');
      setFormPriority(1);
      setFormEffective(new Date().toISOString().substring(0, 10));
      setFormExpiry('');
      setFormStopOther(false);
      setFormStatus(true);
      setFormOrgId(fallbackOrgId);
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formModuleId || !formEventId) {
      toast.error('Please complete all required fields');
      return;
    }

    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const parsedUserId = storedUserId ? Number(storedUserId) : 1;

    setLoading(true);
    try {
      const payload: any = {
        Workflow_Name: formName,
        Module: Number(formModuleId),
        Event: Number(formEventId),
        Description: formDesc,
        Status: formStatus,
        Priority: Number(formPriority),
        Effective_Date: formEffective,
        Expiry_Date: formExpiry || null,
        Stop_Other_Workflows: formStopOther,
        Organization_Id: formOrgId,
        Updated_By: parsedUserId
      };

      if (editingRule) {
        payload.id = editingRule.id;
        payload.Workflow_Id = editingRule.Workflow_Id;
        const rawCreatedBy = (editingRule as any).Created_By ?? (editingRule as any).Created_By_id;
        payload.Created_By = rawCreatedBy ? (typeof rawCreatedBy === 'object' ? rawCreatedBy.id : Number(rawCreatedBy)) : parsedUserId;

        await updateWorkflowRule(payload);
        toast.success('Workflow Rule updated successfully');
      } else {
        payload.Created_By = parsedUserId;
        await createWorkflowRule(payload);
        toast.success('Workflow Rule created successfully');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save workflow rule');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (row: WorkflowRule) => {
    try {
      await updateWorkflowRule({
        ...row,
        Status: !row.Status
      });
      toast.success('Status updated successfully');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle status');
    }
  };

  const handleDeleteRule = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this workflow rule?')) {
      try {
        await deleteWorkflowRule(id);
        toast.success('Workflow Rule deleted successfully');
        loadData();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete rule');
      }
    }
  };

  // Close ellipsis menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuRowId(null);
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', handleOutsideClick);
      }
    };
  }, []);

  // Filter events based on selected module in form
  const filteredFormEvents = useMemo(() => {
    if (!formModuleId) return [];
    return events.filter(e => {
      const modId = typeof e.Module === 'object' ? (e.Module as any)?.id : e.Module;
      return String(modId) === String(formModuleId);
    });
  }, [events, formModuleId]);

  // KPI calculations
  const totalCount = allRules.length;
  const activeCount = allRules.filter((r) => r.Status).length;
  const inactiveCount = allRules.filter((r) => !r.Status).length;

  const todayStr = new Date().toISOString().substring(0, 10);
  const executedToday = executions.filter(e => e.Started_On && e.Started_On.substring(0, 10) === todayStr).length;

  const totalExec = executions.length;
  const successExec = executions.filter(e => e.Status === 'Success').length;
  const successRate = totalExec > 0 ? Math.round((successExec / totalExec) * 100) : 100;

  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  return (
    <div className="space-y-6 text-left">
      {/* Header Panel */}
      <div className="flex items-start justify-between flex-wrap gap-4 pt-1 bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 flex items-center gap-2">
            Workflow Rules
          </h1>
          <p className="text-sm text-slate-450 mt-1">
            Create and manage automated workflows to streamline your business processes.
          </p>
        </div>

        <button
          onClick={() => openFormModal(null)}
          className="bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-650 text-white font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm transition-all hover:scale-[1.01]"
        >
          <Plus className="h-4 w-4" />
          Create Workflow Rule
        </button>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Rules */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Total Rules</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{totalCount}</h3>
            <span className="text-[10px] font-bold text-slate-455 block">All workflows</span>
          </div>
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Active Rules */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Active Rules</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{activeCount}</h3>
            <span className="text-[10px] font-bold text-slate-455 block">Currently active</span>
          </div>
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/20 text-blue-500">
            <Play className="h-4 w-4" />
          </div>
        </div>

        {/* Inactive Rules */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Inactive Rules</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{inactiveCount}</h3>
            <span className="text-[10px] font-bold text-slate-455 block">Currently inactive</span>
          </div>
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-955/20 text-amber-500">
            <Pause className="h-4 w-4" />
          </div>
        </div>

        {/* Executed Today */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Executed Today</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{executedToday}</h3>
            <span className="text-[10px] font-bold text-slate-455 block">Total executions</span>
          </div>
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 bg-purple-50 dark:bg-purple-950/20 text-purple-500">
            <Activity className="h-4 w-4" />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex items-center justify-between text-left">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Success Rate</span>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{successRate}%</h3>
            <span className="text-[10px] font-bold text-slate-455 block">All time runs</span>
          </div>
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-500">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative min-w-[240px] flex-1 md:flex-initial">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search workflow rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs font-bold pl-9.5 pr-4 py-2 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-705 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 px-3 rounded-xl text-slate-650 dark:text-slate-355 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          >
            <option value="All Modules">All Modules</option>
            {modules.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.Module_Name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs font-bold border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 px-3 rounded-xl text-slate-655 dark:text-slate-355 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:bg-slate-50 border dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Rules Table Panel */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
            Loading workflow rules...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-slate-700 dark:text-slate-355">
                <thead>
                  <tr className="border-b dark:border-slate-800 text-[10px] uppercase text-slate-400 font-extrabold text-left">
                    <th className="pb-3 w-[20%]">Rule Name</th>
                    <th className="pb-3 text-center">Module</th>
                    <th className="pb-3 text-center">Event Trigger</th>
                    <th className="pb-3">Description</th>
                    <th className="pb-3 text-center">Priority</th>
                    <th className="pb-3 text-center">Stop Other</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {rules.length > 0 ? (
                    rules.map((row) => {
                      const moduleId = typeof row.Module === 'object' && row.Module ? (row.Module as any).id : row.Module;
                      const modName = typeof row.Module === 'object' && row.Module
                        ? (row.Module as any).Module_Name
                        : (modules.find(m => String(m.id) === String(moduleId))?.Module_Name || row.Module_Name || String(row.Module || ''));

                      const eventId = typeof row.Event === 'object' && row.Event ? (row.Event as any).id : row.Event;
                      const evName = typeof row.Event === 'object' && row.Event
                        ? (row.Event as any).Event_Name
                        : (events.find(e => String(e.id) === String(eventId))?.Event_Name || row.Event_Name || String(row.Event || ''));

                      return (
                        <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                          {/* Rule Name */}
                          <td className="py-3.5 pr-2">
                            <span className="font-bold text-slate-850 dark:text-slate-100 block leading-tight">
                              {row.Workflow_Name}
                            </span>
                          </td>

                          {/* Module */}
                          <td className="py-3.5 text-center">
                            <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border dark:border-slate-700">
                              {modName}
                            </span>
                          </td>

                          {/* Event Trigger */}
                          <td className="py-3.5 text-center font-semibold text-slate-600 dark:text-slate-300">
                            {evName}
                          </td>

                          {/* Description */}
                          <td className="py-3.5 text-slate-500 font-bold max-w-[200px] truncate" title={row.Description}>
                            {row.Description || 'No description provided'}
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 text-center font-bold text-slate-600 dark:text-slate-300">
                            {row.Priority}
                          </td>

                          {/* Stop Other */}
                          <td className="py-3.5 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${row.Stop_Other_Workflows ? 'bg-amber-100 dark:bg-amber-955/30 text-amber-705 dark:text-amber-450 border border-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              {row.Stop_Other_Workflows ? 'Yes' : 'No'}
                            </span>
                          </td>

                          {/* Status Pill Toggle */}
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => toggleStatus(row)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border transition-colors ${
                                row.Status
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-705 dark:text-emerald-450 border-emerald-200 dark:border-emerald-900/60'
                                  : 'bg-rose-50 dark:bg-rose-955/30 text-rose-705 dark:text-rose-455 border-rose-205 dark:border-rose-900/60'
                              }`}
                              title="Click to toggle status"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${row.Status ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {row.Status ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 text-right relative">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openFormModal(row)}
                                className="h-7 w-7 rounded-lg border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center transition-colors cursor-pointer text-slate-455 hover:text-slate-700"
                                title="Edit rule"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuRowId(activeMenuRowId === row.id ? null : row.id);
                                }}
                                className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-slate-700"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>

                              {/* Ellipsis menu dropdown */}
                              {activeMenuRowId === row.id && (
                                <div className="absolute right-0 top-11 w-28 rounded-xl bg-white dark:bg-slate-950 border dark:border-slate-850 shadow-md py-1 z-30 text-left text-xs font-bold text-slate-650 dark:text-slate-250">
                                  <button
                                    onClick={() => {
                                      toggleStatus(row);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-left transition-colors cursor-pointer flex items-center gap-1.5"
                                  >
                                    {row.Status ? <Pause className="h-3.5 w-3.5 text-slate-400" /> : <Play className="h-3.5 w-3.5 text-slate-400" />}
                                    <span>{row.Status ? 'Deactivate' : 'Activate'}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeleteRule(row.id);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-955 text-rose-600 text-left transition-colors cursor-pointer flex items-center gap-1.5 border-t dark:border-slate-855"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 font-bold">
                        No workflow rules match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalRecords > itemsPerPage && (
              <div className="flex items-center justify-between mt-5 pt-4 border-t dark:border-slate-800 flex-wrap gap-3">
                <span className="text-xs text-slate-455 font-bold">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} entries
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 rounded-lg border dark:border-slate-850 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-455 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(idx + 1)}
                      className={`h-7 w-7 rounded-lg flex items-center justify-center font-black text-xs cursor-pointer ${
                        currentPage === idx + 1
                          ? 'bg-emerald-500 text-white'
                          : 'border dark:border-slate-850 text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 rounded-lg border dark:border-slate-855 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-455 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden text-left flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b dark:border-slate-800">
              <h3 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-2">
                <Zap className="h-4.5 w-4.5 text-emerald-500" />
                {editingRule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="h-7 w-7 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Rule Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Assignment Rule"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
                  Description
                </label>
                <textarea
                  placeholder="Describe the workflow purpose..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full text-xs font-bold p-2.5 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-705 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              {/* Module & Event dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
                    Module *
                  </label>
                  <select
                    value={formModuleId}
                    onChange={(e) => {
                      setFormModuleId(e.target.value);
                      setFormEventId(''); // Reset selected event on module change
                    }}
                    required
                    className="w-full text-xs font-bold p-2.5 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer"
                  >
                    <option value="">Select Module</option>
                    {modules.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.Module_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
                    Event Trigger *
                  </label>
                  <select
                    value={formEventId}
                    onChange={(e) => setFormEventId(e.target.value)}
                    required
                    disabled={!formModuleId}
                    className="w-full text-xs font-bold p-2.5 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Event</option>
                    {filteredFormEvents.map((ev) => (
                      <option key={ev.id} value={String(ev.id)}>
                        {ev.Event_Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority & Stop Other */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
                    Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    className="w-full text-xs font-bold p-2.5 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end pb-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="formStopOther"
                      type="checkbox"
                      checked={formStopOther}
                      onChange={(e) => setFormStopOther(e.target.checked)}
                      className="h-4.5 w-4.5 rounded-lg border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer accent-emerald-500"
                    />
                    <label htmlFor="formStopOther" className="text-xs font-bold text-slate-655 dark:text-slate-355 cursor-pointer">
                      Stop other workflows
                    </label>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formEffective}
                    onChange={(e) => setFormEffective(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formExpiry}
                    onChange={(e) => setFormExpiry(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400 block">
                  Status
                </label>
                <select
                  value={formStatus ? 'Active' : 'Inactive'}
                  onChange={(e) => setFormStatus(e.target.value === 'Active')}
                  className="w-full text-xs font-bold p-2.5 border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border dark:border-slate-850 text-slate-700 dark:text-slate-350 px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  {editingRule ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
