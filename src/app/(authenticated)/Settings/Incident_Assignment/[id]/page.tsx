'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { motion } from 'motion/react';
import {
  Users,
  UserCheck,
  ChevronDown,
  Info,
  Check,
  X,
  FileText,
  Clock,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  fetchIncidentManagementById,
  updateIncidentManagement,
  IncidentManagementModel
} from '@/service/api/Incident/api';
import { fetchUserAdditional } from '@/service/api/useradmin/api';

interface UserOption {
  id: number;
  name: string;
  email: string;
}

const mockUnassignedFallback = {
  id: 1,
  IncidentManagement_Id: 'INC000000001',
  Summary: 'Unable to login to CRMFarm application',
  Priority: 'High',
  Category: 'Application',
  Reported_On: '2026-07-01T10:30:00+05:30',
  Assigned_Person: '',
  Assigned_To: undefined,
  Status: 'Open'
};

export default function AssignIncidentRoutePage() {
  const params = useParams();
  const router = useRouter();
  const { primaryColor } = useStore();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [incidentData, setIncidentData] = useState<IncidentManagementModel | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);

  // Form State
  const [activeAssignTab, setActiveAssignTab] = useState<'Teams' | 'Agents'>('Teams');
  const [selectedTeam, setSelectedTeam] = useState('Application Support Team');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('L2 Support');
  const [assignmentRule, setAssignmentRule] = useState('Round Robin');
  const [notes, setNotes] = useState('');

  // Fetch Data on mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';

        const [incidentRes, userRes] = await Promise.all([
          fetchIncidentManagementById(id).catch(() => null),
          fetchUserAdditional({ Organization_Id: orgId, is_active: 'True' }).catch(() => null)
        ]);

        if (incidentRes) {
          setIncidentData(incidentRes);
          setActiveAssignTab(incidentRes.Assigned_To ? 'Agents' : 'Teams');
          setSelectedTeam(incidentRes.Team || 'Application Support Team');
          setSelectedAgentId(incidentRes.Assigned_To ? String(incidentRes.Assigned_To) : '');
          setSelectedGroup(incidentRes.Assignment_Rule ? 'L3 Support' : 'L2 Support');
          setAssignmentRule(incidentRes.Assignment_Rule || 'Round Robin');
          setNotes(incidentRes.Assignment_Notes || '');
        } else {
          // Fallback if network offline or demo
          setIncidentData(mockUnassignedFallback);
        }

        // Map users
        let userList: any[] = [];
        if (userRes && Array.isArray(userRes)) {
          userList = userRes;
        } else if (userRes && Array.isArray(userRes.data)) {
          userList = userRes.data;
        } else if (userRes && Array.isArray(userRes.results)) {
          userList = userRes.results;
        }

        const mappedUsers: UserOption[] = userList.map((u: any) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Unknown Agent',
          email: u.email || ''
        }));
        setUsers(mappedUsers);
      } catch (err) {
        console.error(err);
        toast.error('Error loading page data');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadAllData();
    }
  }, [id]);

  const handleAssignIncident = async () => {
    if (!incidentData) return;

    setIsAssigning(true);
    try {
      let assigneeName = '';
      let agentIdNumber: number | undefined = undefined;

      if (activeAssignTab === 'Agents') {
        const foundAgent = users.find(u => String(u.id) === selectedAgentId);
        assigneeName = foundAgent ? foundAgent.name : 'Unknown Agent';
        agentIdNumber = Number(selectedAgentId) || undefined;
      }

      // Build payload for PUT
      const payload: IncidentManagementModel = {
        ...incidentData,
        // Override nested objects to plain IDs for API compatibility
        Created_By: typeof incidentData.Created_By === 'object' && incidentData.Created_By !== null
          ? Number((incidentData.Created_By as any).id)
          : Number(incidentData.Created_By) || undefined,
        Requester: typeof incidentData.Requester === 'object' && incidentData.Requester !== null
          ? Number((incidentData.Requester as any).id)
          : Number(incidentData.Requester) || undefined,
        Updated_By: typeof window !== 'undefined' ? (Number(localStorage.getItem('userId')) || 73) : 73,

        // Target assignment modifications
        Assigned_To: activeAssignTab === 'Agents' ? agentIdNumber : undefined,
        Assigned_Person: activeAssignTab === 'Agents' ? assigneeName : '',
        Team: activeAssignTab === 'Teams' ? selectedTeam : '',
        Assignment_Rule: assignmentRule,
        Assignment_Notes: notes,
        Assigned_On: new Date().toISOString()
      };

      // Call Update API
      await updateIncidentManagement(payload);
      toast.success(`Incident ${incidentData.IncidentManagement_Id || incidentData.id} assigned successfully!`);
      router.push('/Settings/Incident_Assignment'); // redirect back to main list page
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to assign incident');
    } finally {
      setIsAssigning(false);
    }
  };

  // Style Helpers
  const getPriorityStyle = (p?: string) => {
    const val = (p || '').toLowerCase();
    if (val === 'high' || val === 'critical') return 'bg-rose-50 text-rose-500 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
    if (val === 'medium') return 'bg-amber-50 text-amber-500 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
    return 'bg-emerald-50 text-emerald-500 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
  };

  const selectCls = 'w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer';

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-sm font-semibold text-slate-500">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1000px] mx-auto p-4 space-y-6 text-left"
    >
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[5px] border dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-[5px]">
            <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assign Incident
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              {incidentData?.IncidentManagement_Id || `INC-${incidentData?.id}`}
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-start md:self-center">
          <span>Incident Management</span>
          <span className="mx-1.5">›</span>
          <span>Incident Assignment</span>
          <span className="mx-1.5">›</span>
          <span className="text-slate-800 dark:text-slate-200">Assign</span>
        </div>
      </div>

      {/* Main Form container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[5px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
        
        {/* Incident Summary Info Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border dark:border-slate-800 rounded-[5px] space-y-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Incident Brief</span>
            {incidentData?.Priority && (
              <Badge variant="outline" className={`font-extrabold text-[10px] px-2.5 py-0.5 rounded-[5px] border ${getPriorityStyle(incidentData.Priority)}`}>
                {incidentData.Priority} Priority
              </Badge>
            )}
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
              {incidentData?.Summary}
            </h4>
            {incidentData?.Description && (
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {incidentData.Description}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs font-bold text-slate-700 dark:text-slate-300 border-t dark:border-slate-800">
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-0.5">Category</span>
              <span>{incidentData?.Category || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-0.5">Sub-Category</span>
              <span>{incidentData?.Sub_Category || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-0.5">Status</span>
              <span className="capitalize">{incidentData?.Status || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-0.5">Reported On</span>
              <span>{incidentData?.Reported_On ? new Date(incidentData.Reported_On).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Assignment tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Assign To</label>
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
            <button 
              type="button"
              className={`text-xs font-extrabold pb-2.5 border-b-2 transition-colors cursor-pointer ${activeAssignTab === 'Teams' ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setActiveAssignTab('Teams')}
            >
              Teams
            </button>
            <button 
              type="button"
              className={`text-xs font-extrabold pb-2.5 border-b-2 transition-colors cursor-pointer ${activeAssignTab === 'Agents' ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
              onClick={() => setActiveAssignTab('Agents')}
            >
              Agents
            </button>
          </div>
        </div>

        {/* Select assignee dropdown field */}
        {activeAssignTab === 'Teams' ? (
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Team *</label>
            <div className="relative">
              <select 
                className={selectCls}
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="Application Support Team">Application Support Team</option>
                <option value="Development Team">Development Team</option>
                <option value="Infrastructure Team">Infrastructure Team</option>
                <option value="Network Team">Network Team</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Agent *</label>
            <div className="relative">
              <select 
                className={selectCls}
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
              >
                <option value="">Select Agent / User</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Group (Optional) */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Select Group (Optional)</label>
          <div className="relative">
            <select 
              className={selectCls}
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="L2 Support">L2 Support</option>
              <option value="L3 Support">L3 Support</option>
              <option value="L1 Support">L1 Support</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Assignment Rule selection */}
        <div className="space-y-2.5 pt-1">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assignment Rule</label>
          <div className="space-y-2">
            {[
              { id: 'Round Robin', label: 'Round Robin (Distribute evenly)' },
              { id: 'Load Based', label: 'Load Based (Assign based on workload)' },
              { id: 'Manual', label: 'Manual (Assign specifically)' }
            ].map(rule => (
              <label key={rule.id} className="flex items-center gap-2.5 cursor-pointer group text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="radio" 
                    name="assignment_rule_route"
                    checked={assignmentRule === rule.id}
                    onChange={() => setAssignmentRule(rule.id)}
                    className="peer sr-only"
                  />
                  <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700 peer-checked:border-blue-600 dark:peer-checked:border-blue-400 flex items-center justify-center transition-colors">
                    {assignmentRule === rule.id && (
                      <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </div>
                </div>
                <span>{rule.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes (Optional)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note for this assignment allocation..."
            className="w-full h-24 p-3 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
        </div>

      </div>

      {/* Footer action buttons */}
      <div className="bg-white dark:bg-slate-900 rounded-[5px] border dark:border-slate-800 shadow-sm p-4 flex justify-end gap-3">
        <Button
          variant="outline"
          className="h-10 text-xs font-bold px-4 border-slate-200 rounded-[5px] cursor-pointer"
          onClick={() => router.push('/Settings/Incident_Assignment')}
          disabled={isAssigning}
        >
          Cancel
        </Button>
        <Button
          className="h-10 text-xs font-bold px-6 text-white rounded-[5px] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          style={{ backgroundColor: primaryColor }}
          onClick={handleAssignIncident}
          disabled={isAssigning || (activeAssignTab === 'Agents' && !selectedAgentId)}
        >
          {isAssigning ? 'Assigning...' : 'Assign Incident'}
        </Button>
      </div>

    </motion.div>
  );
}
