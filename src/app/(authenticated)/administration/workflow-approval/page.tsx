'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Loader2,
  ArrowLeft,
  CheckCircle,
  Activity,
  Save,
  Trash,
  Sliders,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { fetchUsersList } from '@/service/api/Leads/api';
import {
  fetchWorkflowApprovalList,
  searchWorkflowApproval,
  createWorkflowApproval,
  updateWorkflowApproval,
  deleteWorkflowApproval
} from '@/service/api/Workflow/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ApproverRow {
  Level: string;
  Approver_Name: string;
  Approver_Id: string | number;
  Approver_Role?: string;
  email?: string;
}

export default function WorkflowApprovalPage() {
  const router = useRouter();
  const { user } = useStore();

  const orgIdStr = typeof window !== 'undefined' ? (localStorage.getItem('OrganizationId') || localStorage.getItem('Organization_Id') || '1') : '1';
  const companyId = Number(orgIdStr);
  const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || '1') : 1;

  // View state: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Data states
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [workflowName, setWorkflowName] = useState('');
  const [noOfLevels, setNoOfLevels] = useState(1);
  const [approverRows, setApproverRows] = useState<ApproverRow[]>([
    { Level: 'Level 1', Approver_Name: '', Approver_Id: '' }
  ]);

  // Editing state
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

  // Delete state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedWorkflowToDelete, setSelectedWorkflowToDelete] = useState<any>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch user options
  const loadUsers = useCallback(async () => {
    try {
      const res = await fetchUsersList();
      const list = Array.isArray(res) ? res : (res?.data || res?.results || []);
      setUsersList(list);
    } catch (err) {
      console.error('Failed to fetch user list:', err);
    }
  }, []);

  // Fetch workflows
  const loadWorkflows = useCallback(async (search: string = '') => {
    setIsLoading(true);
    try {
      if (search.trim().length > 0) {
        const searchRes = await searchWorkflowApproval(search.trim());
        const list = Array.isArray(searchRes) ? searchRes : (searchRes?.data || searchRes?.results || []);
        setWorkflows(list);
      } else {
        const listRes = await fetchWorkflowApprovalList(currentPage);
        const list = Array.isArray(listRes) ? listRes : (listRes?.data || listRes?.results || []);
        setWorkflows(list);
      }
    } catch (err: any) {
      console.error('Failed to load workflows:', err);
      toast.error('Failed to load workflow approval list');
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    loadWorkflows(debouncedSearch);
  }, [debouncedSearch, currentPage, loadWorkflows]);

  // Adjust approver rows dynamically when level count changes
  useEffect(() => {
    const levelsCount = Math.max(1, noOfLevels);
    if (levelsCount !== approverRows.length) {
      const newRows: ApproverRow[] = [];
      for (let i = 0; i < levelsCount; i++) {
        const existing = approverRows[i] || {};
        newRows.push({
          Level: `Level ${i + 1}`,
          Approver_Name: existing.Approver_Name || '',
          Approver_Id: existing.Approver_Id || '',
          Approver_Role: existing.Approver_Role || '',
          email: existing.email || '',
        });
      }
      setApproverRows(newRows);
    }
  }, [noOfLevels]);

  const handleCreateNew = () => {
    setWorkflowName('');
    setNoOfLevels(1);
    setApproverRows([{ Level: 'Level 1', Approver_Name: '', Approver_Id: '' }]);
    setEditingWorkflow(null);
    setView('create');
  };

  const handleEditClick = (workflow: any) => {
    setEditingWorkflow(workflow);
    setWorkflowName(workflow.Workflow_Name || '');
    setNoOfLevels(Number(workflow.No_of_levels || 1));

    if (workflow.Approver_details && Array.isArray(workflow.Approver_details)) {
      setApproverRows(
        workflow.Approver_details.map((approver: any, index: number) => ({
          Level: `Level ${approver.Level_Number || index + 1}`,
          Approver_Name: approver.Approver_Name || '',
          Approver_Id: approver.Approver_Id || '',
          Approver_Role: approver.Approver_Role || '',
          email: approver.email || '',
        }))
      );
    } else {
      setApproverRows([{ Level: 'Level 1', Approver_Name: '', Approver_Id: '' }]);
    }
    setView('edit');
  };

  const handleApproverChange = (userIdVal: string | number, rowIndex: number) => {
    const matchedUser = usersList.find((u: any) => String(u.id) === String(userIdVal));
    if (!matchedUser) {
      setApproverRows((prev) => {
        const updated = [...prev];
        updated[rowIndex] = {
          Level: `Level ${rowIndex + 1}`,
          Approver_Id: '',
          Approver_Name: '',
          Approver_Role: '',
          email: '',
        };
        return updated;
      });
      return;
    }

    const name = [matchedUser.first_name, matchedUser.last_name].filter(Boolean).join(' ').trim() || matchedUser.username || '';
    setApproverRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        Level: `Level ${rowIndex + 1}`,
        Approver_Id: matchedUser.id,
        Approver_Name: name,
        Approver_Role: matchedUser.Designation || matchedUser.role || '',
        email: matchedUser.email || '',
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowName.trim()) {
      toast.error('Workflow Name is required');
      return;
    }

    const unassignedRow = approverRows.findIndex((r) => !r.Approver_Id);
    if (unassignedRow !== -1) {
      toast.error(`Approver for Level ${unassignedRow + 1} must be selected`);
      return;
    }

    const payload = {
      Workflow_Name: workflowName,
      No_of_levels: noOfLevels,
      Approver_details: approverRows.map((r, idx) => ({
        Level_Number: idx + 1,
        Approver_Name: r.Approver_Name,
        Approver_Role: r.Approver_Role || '',
        Approver_Id: Number(r.Approver_Id),
        email: r.email || '',
      })),
      Organization_Id: companyId,
      Created_by: userId,
      Updated_by: userId,
    };

    setIsSaving(true);
    try {
      if (view === 'edit' && editingWorkflow) {
        await updateWorkflowApproval({
          id: editingWorkflow.id,
          ...payload,
        });
        toast.success('Workflow approval updated successfully');
      } else {
        await createWorkflowApproval(payload);
        toast.success('Workflow approval created successfully');
      }
      setView('list');
      loadWorkflows(debouncedSearch);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to save workflow approval rules.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWorkflowToDelete) return;
    setIsDeleting(true);
    try {
      await deleteWorkflowApproval(selectedWorkflowToDelete.id);
      toast.success('Workflow approval deleted successfully');
      setIsDeleteOpen(false);
      setSelectedWorkflowToDelete(null);
      loadWorkflows(debouncedSearch);
    } catch (err: any) {
      toast.error(`Failed to delete workflow: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 text-left p-6 font-sans">

      {/* ────────────────────────────────────────────────────────
          LIST VIEW
      ──────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Block */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <Activity className="h-4 w-4" />
                </div>
                <h1 className="text-2xl md:text-[1.65rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Workflow Approval Setup
                </h1>
              </div>
              <p className="text-muted-foreground text-xs md:text-sm mt-1 font-medium">
                Create and manage multi-level workflow approval processes for your organization.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <button
                onClick={() => loadWorkflows(debouncedSearch)}
                className="flex items-center gap-2 px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Workflow</span>
              </button>
            </div>
          </div>

          {/* Table List Card */}
          <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Search Panel */}
            <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="relative w-[280px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total workflows: {workflows.length}
              </span>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="p-16 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : workflows.length === 0 ? (
                <div className="p-16 text-center text-slate-400 font-bold text-xs">
                  No workflow approval setups found. Create one to get started!
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <th className="p-4">Workflow Name</th>
                      <th className="p-4">No. of Levels</th>
                      <th className="p-4">Approvers Sequence</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {workflows.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                          {row.Workflow_Name}
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
                            {row.No_of_levels} Levels
                          </span>
                        </td>
                        <td className="p-4 max-w-[380px]">
                          {row.Approver_details && Array.isArray(row.Approver_details) ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {row.Approver_details.map((approver: any, idx: number) => (
                                <React.Fragment key={idx}>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                                    <span className="text-[9px] text-slate-400 font-bold">L{approver.Level_Number || idx + 1}:</span>
                                    {approver.Approver_Name || 'Approver'}
                                  </span>
                                  {idx < row.Approver_details.length - 1 && (
                                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditClick(row)}
                              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit Workflow"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWorkflowToDelete(row);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Delete Workflow"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────
          CREATE / EDIT VIEW
      ──────────────────────────────────────────────────────── */}
      {(view === 'create' || view === 'edit') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Form Header Block */}
          <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setView('list')}
              className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {view === 'edit' ? 'Edit Workflow Approval Rules' : 'Setup New Workflow Approval'}
              </h1>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5 font-medium">
                Define approval sequence, roles, and levels for this workflow.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xs p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Workflow Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    Workflow Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Publish Exam Result, Fee Refund Approval"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    disabled={isSaving}
                    required
                  />
                </div>

                {/* No. of Levels */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                    Number of Levels <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={noOfLevels}
                    onChange={(e) => setNoOfLevels(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    disabled={isSaving}
                    min={1}
                    max={10}
                    required
                  />
                </div>
              </div>

              {/* Approvers List Table */}
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Configure Approvers Sequence
                </h3>

                <div className="overflow-x-auto border dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-150 dark:border-slate-800 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="p-4 w-[200px]">Level</th>
                        <th className="p-4">Assign Approver User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      {approverRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-950/10 transition-colors">
                          <td className="p-4">
                            <input
                              type="text"
                              value={row.Level}
                              disabled
                              className="w-full px-3.5 py-2 text-xs border border-slate-100 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 select-none"
                            />
                          </td>
                          <td className="p-4">
                            <select
                              value={row.Approver_Id || ''}
                              onChange={(e) => handleApproverChange(e.target.value, idx)}
                              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-600 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                              disabled={isSaving}
                            >
                              <option value="">Select Approver User</option>
                              {usersList.map((usr: any) => {
                                const name = [usr.first_name, usr.last_name].filter(Boolean).join(' ').trim() || usr.username || `User #${usr.id}`;
                                const role = usr.Designation || usr.role || 'Staff';
                                return (
                                  <option key={usr.id} value={usr.id}>
                                    {name} ({role})
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end items-center gap-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-4.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-65"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{view === 'edit' ? 'Update Workflow' : 'Save Workflow'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] font-sans">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <Trash className="h-5 w-5" />
              Delete Workflow Rule
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 leading-relaxed font-semibold">
              Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{selectedWorkflowToDelete?.Workflow_Name}</span>? This action cannot be undone and will stop any active approval tracking on this type of workflow.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-5">
            <button
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Workflow'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
