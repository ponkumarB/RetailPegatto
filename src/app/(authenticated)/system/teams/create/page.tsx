'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft, Save, X, ChevronDown, Check, Search, Calendar, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { fetchUsersList } from '@/service/api/Leads/api';
import { createITUserTeam } from '@/service/api/teams/api';

export default function CreateTeamPage() {
  const router = useRouter();
  
  // Form states matching backend CRUD payload
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('IT');
  const [teamLead, setTeamLead] = useState<string | number>('');
  const [teamMembers, setTeamMembers] = useState<(string | number)[]>([]);
  const [status, setStatus] = useState('Active');
  
  // Users list state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Search and dropdown state for Team Members
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Users formatting list helper
  const formattedUsers = useMemo(() => {
    const baseColors = [
      'bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200',
      'bg-indigo-950 text-indigo-200 dark:bg-indigo-900 dark:text-indigo-300',
      'bg-emerald-955 text-emerald-200 dark:bg-emerald-900 dark:text-emerald-300',
      'bg-blue-955 text-blue-200 dark:bg-blue-900 dark:text-blue-300',
      'bg-pink-955 text-pink-200 dark:bg-pink-900 dark:text-pink-300'
    ];

    return users.map((u: any, idx: number) => {
      const id = u.id || 0;
      const firstName = u.first_name || '';
      const lastName = u.last_name || '';
      const name = `${firstName} ${lastName}`.trim() || u.username || 'Unknown';
      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'US';
      const bg = baseColors[idx % baseColors.length];
      return { id, name, initials, bg };
    });
  }, [users]);

  // Filtered users list based on search query
  const filteredUsers = useMemo(() => {
    return formattedUsers.filter(u => 
      u.name.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );
  }, [formattedUsers, memberSearchQuery]);

  // Selected Lead details
  const selectedLeadDetails = useMemo(() => {
    return formattedUsers.find(u => String(u.id) === String(teamLead)) || { 
      name: 'Select Lead', 
      initials: 'SL', 
      bg: 'bg-slate-900 text-slate-100' 
    };
  }, [teamLead, formattedUsers]);

  // Team avatar initials helper
  const teamInitials = useMemo(() => {
    const code = teamCode.trim().toUpperCase().substring(0, 2);
    if (code) return code;
    const nameParts = teamName.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return teamName.trim().substring(0, 2).toUpperCase() || 'TM';
  }, [teamName, teamCode]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetchUsersList();
        setUsers(res || []);
      } catch (err) {
        console.error('Failed to load users list:', err);
        toast.error('Failed to load users list');
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  const handleMemberToggle = (userId: string | number) => {
    setTeamMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName.trim()) {
      toast.error('Team Name is required');
      return;
    }
    if (!teamCode.trim()) {
      toast.error('Team Code is required');
      return;
    }
    if (!teamLead) {
      toast.error('Team Lead is required');
      return;
    }

    const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') || '1' : '1';
    const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1';

    const payload = {
      Team_Name: teamName.trim(),
      Team_Code: teamCode.trim(),
      Description: description.trim(),
      Department: department,
      Team_Lead: Number(teamLead),
      Team_Members: teamMembers.map(Number),
      Status: status,
      Organization_Id: Number(orgId),
      Created_By: Number(userId)
    };

    setSubmitting(true);
    try {
      await createITUserTeam(payload);
      toast.success(`Team "${payload.Team_Name}" saved successfully!`);
      router.push('/system/teams');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">

      {/* Header bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Create Team</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure parameters and build a new work team.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/system/teams')}
            disabled={submitting}
            className="font-bold text-xs h-10 px-5 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer shadow-xs"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={submitting}
            className="font-bold text-xs h-10 px-5 text-white rounded-lg shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all duration-200 bg-blue-600 hover:bg-blue-750"
          >
            <Save className="h-4 w-4" /> {submitting ? 'Saving...' : 'Save Team'}
          </Button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
        
        {/* Left Side: Main Form Fields (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b pb-3 dark:border-slate-800">
              Team Information
            </h2>

            {/* Name and Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                  Team Name <span className="text-rose-500">*</span>
                </label>
                <Input 
                  value={teamName} 
                  onChange={e => setTeamName(e.target.value)} 
                  required
                  placeholder="e.g. Sales Operations Core"
                  className="h-10 text-xs rounded-lg"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">
                  Team Code <span className="text-rose-500">*</span>
                </label>
                <Input 
                  value={teamCode} 
                  onChange={e => setTeamCode(e.target.value)} 
                  required
                  placeholder="e.g. SOC-02"
                  className="h-10 text-xs rounded-lg"
                />
              </div>
            </div>

            {/* Department & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                  Department <span className="text-rose-500">*</span>
                </label>
                <Select value={department} onValueChange={(val) => setDepartment(val || 'IT')}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-widest block">
                  Status <span className="text-rose-500">*</span>
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val || 'Active')}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Team Lead & Team Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Team Lead */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-widest block">
                  Team Lead <span className="text-rose-500">*</span>
                </label>
                <Select value={String(teamLead)} onValueChange={(val) => setTeamLead(val || '')}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg flex items-center gap-2.5">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${selectedLeadDetails.bg}`}>
                      {selectedLeadDetails.initials}
                    </div>
                    <span>{teamLead ? selectedLeadDetails.name : 'Select Lead'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {formattedUsers.map(u => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        <div className="flex items-center gap-2.5">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${u.bg}`}>
                            {u.initials}
                          </div>
                          {u.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Searchable Dropdown for Team Members */}
              <div className="space-y-1.5 text-left relative">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Team Members</label>
                
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="min-h-10 p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-lg flex items-center justify-between flex-wrap gap-1.5 cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {teamMembers.length > 0 ? (
                      teamMembers.map(memberId => {
                        const u = formattedUsers.find(user => user.id === memberId);
                        return (
                          <Badge 
                            key={memberId} 
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border-0 py-0.5 px-2 rounded-md font-bold text-[10px] gap-1 flex items-center"
                          >
                            {u?.name || `User ${memberId}`}
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMemberToggle(memberId);
                              }}
                              className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-455 ml-1">Select team members...</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mr-1" />
                </div>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 border dark:border-slate-800 bg-white dark:bg-slate-905 p-3 rounded-xl shadow-lg z-20 space-y-2.5">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                          placeholder="Search users..." 
                          value={memberSearchQuery} 
                          onChange={e => setMemberSearchQuery(e.target.value)}
                          className="h-9.5 text-xs rounded-lg pl-9"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-0.5 pt-1 border-t dark:border-slate-850">
                        {loadingUsers ? (
                          <p className="text-[10px] text-slate-400 font-semibold p-2">Loading users...</p>
                        ) : filteredUsers.length === 0 ? (
                          <p className="text-[10px] text-slate-400 font-semibold p-2">No users found</p>
                        ) : (
                          filteredUsers.map((u, i) => {
                            const isSelected = teamMembers.includes(u.id);
                            return (
                              <div
                                key={u.id || i}
                                onClick={() => handleMemberToggle(u.id)}
                                className="flex items-center justify-between px-3 py-2 text-xs font-bold rounded-lg text-slate-700 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${u.bg}`}>
                                    {u.initials}
                                  </div>
                                  <span>{u.name}</span>
                                </div>
                                {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Enter description..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Preview Cards & Settings (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Team Preview */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs flex flex-col items-center text-center space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 self-start">
              Team Preview
            </h2>

            <div className="space-y-3 flex flex-col items-center w-full">
              {/* Circular Avatar Badge */}
              <div 
                className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-md select-none transition-all duration-300 overflow-hidden bg-slate-100 dark:bg-slate-850"
                style={{ 
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                }}
              >
                {teamInitials}
              </div>

              <div className="space-y-1 w-full px-2">
                <h3 className="font-bold text-slate-850 dark:text-slate-100 text-lg leading-tight truncate">
                  {teamName || 'New Team'}
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                  {teamCode || 'SOC-XX'}
                </p>
                <div className="pt-2 flex justify-center">
                  <Badge className="bg-emerald-50 text-emerald-705 dark:bg-emerald-955/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800 font-bold text-[10px]">
                    {status}
                  </Badge>
                </div>
              </div>

              <div className="pt-3 border-t dark:border-slate-850 w-full text-left space-y-2 text-[11px] font-semibold text-slate-550 dark:text-slate-455 px-2">
                <div className="flex items-center gap-2.5 truncate">
                  <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Dept: <strong className="text-slate-700 dark:text-slate-300">{department}</strong></span>
                </div>
                <div className="flex items-center gap-2.5 truncate">
                  <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>Members: <strong className="text-slate-700 dark:text-slate-300">{teamMembers.length} selected</strong></span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
