'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft, Save, X, ChevronDown, Check, Search, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchITUserTeamsListWithoutPagination } from '@/service/api/teams/api';
import { createITUserGroup } from '@/service/api/user-groups/api';

export default function CreateUserGroupPage() {
  const router = useRouter();
  
  // Form states matching backend CRUD payload
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('Custom');
  const [description, setDescription] = useState('');
  const [selectedTeams, setSelectedTeams] = useState<(string | number)[]>([]);
  const [status, setStatus] = useState('Active');
  
  // Teams list state
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search and dropdown state for Associated Teams
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await fetchITUserTeamsListWithoutPagination();
        setAvailableTeams(res?.results || res || []);
      } catch (err) {
        console.error('Failed to load teams list:', err);
        toast.error('Failed to load teams list');
      } finally {
        setLoadingTeams(false);
      }
    }
    loadTeams();
  }, []);

  // Filtered teams list based on search query
  const filteredTeamsList = useMemo(() => {
    return availableTeams.filter(t => 
      (t.Team_Name || '').toLowerCase().includes(teamSearchQuery.toLowerCase())
    );
  }, [availableTeams, teamSearchQuery]);

  const handleTeamToggle = (teamId: string | number) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) 
        : [...prev, teamId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error('Group Name is required');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }

    const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';

    // Generates a mock/temp UserTeams_Id key format matching: USG000000001
    const randomSuffix = Math.floor(Math.random() * 900000000) + 100000000;
    const userTeamsId = `USG${randomSuffix}`;

    const payload = {
      UserTeams_Id: userTeamsId,
      Group_Name: groupName.trim(),
      Group_Type: groupType,
      Description: description.trim(),
      Teams: selectedTeams.map(Number),
      Status: status,
      Organization_Id: Number(orgId),
      Updated_By: Number(userId)
    };

    setSubmitting(true);
    try {
      await createITUserGroup(payload);
      toast.success(`User Group "${payload.Group_Name}" saved successfully!`);
      router.push('/system/user-groups');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create user group');
    } finally {
      setSubmitting(false);
    }
  };

  // Group avatar initials helper
  const groupInitials = useMemo(() => {
    const nameParts = groupName.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return groupName.trim().substring(0, 2).toUpperCase() || 'GP';
  }, [groupName]);

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto p-2">

      {/* Header bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Create User Group</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure bulk permission parameters and assign teams.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/system/user-groups')}
            disabled={submitting}
            className="font-bold text-xs h-10 px-5 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-705 dark:text-slate-355 rounded-lg cursor-pointer shadow-xs"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={submitting}
            className="font-bold text-xs h-10 px-5 text-white rounded-lg shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all duration-200 bg-blue-600 hover:bg-blue-750"
          >
            <Save className="h-4 w-4" /> {submitting ? 'Saving...' : 'Save Group'}
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
        
        {/* Left Side: Main Form Fields (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b pb-3 dark:border-slate-800">
              Group Details
            </h2>

            {/* Name & Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                  Group Name <span className="text-rose-500">*</span>
                </label>
                <Input 
                  value={groupName} 
                  onChange={e => setGroupName(e.target.value)} 
                  required
                  placeholder="e.g. Compliance & Auditors Team"
                  className="h-10 text-xs rounded-lg font-bold"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">
                  Group Type <span className="text-rose-500">*</span>
                </label>
                <Select value={groupType} onValueChange={(val) => setGroupType(val || 'Custom')}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg font-bold">
                    <SelectValue placeholder="Select Group Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Custom">Custom</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-widest block">
                  Status <span className="text-rose-500">*</span>
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val || 'Active')}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                  Description <span className="text-rose-500">*</span>
                </label>
                <Input 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  required
                  placeholder="Describe the purpose of this group..."
                  className="h-10 text-xs rounded-lg font-bold"
                />
              </div>
            </div>

            {/* Associated Teams Selection (Multi-select searchable) */}
            <div className="space-y-1.5 text-left relative">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Associated Teams</label>
              
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="min-h-10 p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-lg flex items-center justify-between flex-wrap gap-1.5 cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedTeams.length > 0 ? (
                    selectedTeams.map(teamId => {
                      const t = availableTeams.find(item => item.id === teamId);
                      return (
                        <Badge 
                          key={teamId} 
                          className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border-0 py-0.5 px-2 rounded-md font-bold text-[10px] gap-1 flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTeamToggle(teamId);
                          }}
                        >
                          {t?.Team_Name || `Team #${teamId}`}
                          <span className="text-[9px] opacity-60">✕</span>
                        </Badge>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 font-medium pl-1">Select teams to add...</span>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 mr-1 shrink-0" />
              </div>

              {isDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-lg z-50 p-2 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input 
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      placeholder="Search teams..."
                      className="pl-8.5 h-9 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
                    {loadingTeams ? (
                      <p className="text-xs text-slate-400 p-2 font-bold text-center">Loading teams...</p>
                    ) : filteredTeamsList.length > 0 ? (
                      filteredTeamsList.map(t => {
                        const isSelected = selectedTeams.includes(t.id);
                        return (
                          <div 
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamToggle(t.id);
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-50/70 text-blue-700 dark:bg-blue-955/20 dark:text-blue-300' 
                                : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-705 dark:text-slate-305'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-[10px]">🏢</span>
                              <span>{t.Team_Name} <span className="text-[10px] text-slate-400">({t.Team_Code || t.Department})</span></span>
                            </div>
                            {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-400 p-2 text-center font-bold">No teams found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Group Preview Card (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-5 shadow-xs space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b pb-3 dark:border-slate-800">
              Live Preview
            </h2>

            <div className="flex flex-col items-center text-center p-4 border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955 rounded-xl gap-2.5">
              <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center font-black text-xl shadow-xs border dark:border-blue-900/10">
                {groupInitials}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">{groupName || 'Group Name'}</h3>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-0 text-[9px] font-extrabold uppercase">
                    {groupType}
                  </Badge>
                  <Badge className={`text-[9px] font-extrabold border-0 uppercase ${status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
                    {status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3.5 text-xs font-bold">
              <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800 text-slate-655 dark:text-slate-400">
                <span>Total Teams</span>
                <span className="text-slate-850 dark:text-slate-100 font-extrabold">{selectedTeams.length}</span>
              </div>
              <div className="flex justify-between items-start pb-2 border-b dark:border-slate-800 text-slate-655 dark:text-slate-400">
                <span>Description</span>
                <span className="text-slate-850 dark:text-slate-100 font-semibold max-w-[180px] text-right truncate">
                  {description || 'No description set'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-655 dark:text-slate-400">
                <span>Created On</span>
                <span className="text-slate-850 dark:text-slate-100 font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Global overlay element to handle dropdown click-away */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

    </div>
  );
}
