'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { motion } from 'motion/react';
import {
  Bell,
  Check,
  ChevronDown,
  Info,
  Plus,
  X,
  Mail,
  Smartphone,
  Globe,
  Flag,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { fetchFromApi } from '@/service/apiClient';
import { fetchUsersList } from '@/service/api/Leads/api';

type RecipientTab = 'users' | 'roles' | 'teams' | 'departments' | 'emails' | 'lists';

interface ConditionItem {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
}

export default function OldNotificationRulePage() {
  const router = useRouter();
  const { primaryColor } = useStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersList, setUsersList] = useState<UserOption[]>([]);

  // Form State
  const [ruleName, setRuleName] = useState('High Value Proposal Notification');
  const [model, setModel] = useState('incident'); // default selection
  const [isActive, setIsActive] = useState(true);

  // Condition Builder State
  const [conditionsText, setConditionsText] = useState("Opportunity_Value > 100000 AND Stage = 'Proposal'");
  const [conditionsList, setConditionsList] = useState<ConditionItem[]>([
    { id: '1', field: 'Opportunity_Value', operator: '>', value: '100000' },
    { id: '2', field: 'Stage', operator: '=', value: 'Proposal' }
  ]);

  // Recipient Tab & Selections State
  const [activeTab, setActiveTab] = useState<RecipientTab>('users');
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Sales Head', 'Regional Manager', 'Account Owner']);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(['Enterprise Sales', 'CRM Team']);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['Sales', 'Marketing']);
  const [selectedEmails, setSelectedEmails] = useState<string[]>(['saleshead@company.com', 'manager@company.com']);
  const [selectedLists, setSelectedLists] = useState<string[]>(['Sales Notification Group', 'Management Team']);

  const [newInputVal, setNewInputVal] = useState('');
  const [selectedUserSelectId, setSelectedUserSelectId] = useState('');

  // Channels Selection
  const [channels, setChannels] = useState({
    email: true,
    whatsapp: true,
    inApp: true,
    push: false
  });

  // Delay Settings
  const [delayValue, setDelayValue] = useState('15');
  const [delayUnit, setDelayUnit] = useState('Minutes');
  const [delayType, setDelayType] = useState('After Event');

  // Priority, Retry, Expiry, Status
  const [priority, setPriority] = useState('High');
  const [retryCount, setRetryCount] = useState('3');
  const [expiryDate, setExpiryDate] = useState('2026-12-31'); // YYYY-MM-DD format
  const [ruleStatus, setRuleStatus] = useState('Active');

  // Load live users list on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchUsersList();
        const list = Array.isArray(response) ? response : (response?.results || response?.data || []);
        
        const mapped: UserOption[] = list.map((u: any) => ({
          id: u.id,
          name: u.username || u.Name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User',
          email: u.email || ''
        }));
        setUsersList(mapped);
        
        // Default selected user IDs for demo/prefill payload if present
        const prefillIds = [72, 73, 85, 96, 110];
        const defaultUsers = mapped.filter(u => prefillIds.includes(u.id));
        if (defaultUsers.length > 0) {
          setSelectedUsers(defaultUsers);
        } else {
          // Mock fallback if user IDs don't exist in system list
          setSelectedUsers([
            { id: 72, name: 'Santhosh Narayanan', email: 'santhosh@company.com' },
            { id: 73, name: 'Priya M.', email: 'priya@company.com' }
          ]);
        }
      } catch (err) {
        console.error('Failed to load user list:', err);
        // offline mockup
        setSelectedUsers([
          { id: 72, name: 'Santhosh Narayanan', email: 'santhosh@company.com' },
          { id: 73, name: 'Priya M.', email: 'priya@company.com' }
        ]);
      }
    };
    loadUsers();
  }, []);

  // Condition Builder actions
  const handleAddCondition = () => {
    const newCond: ConditionItem = {
      id: Date.now().toString(),
      field: 'Field_Name',
      operator: '=',
      value: 'Value'
    };
    const updated = [...conditionsList, newCond];
    setConditionsList(updated);
    
    // Update textual preview representation
    const formatted = updated.map(c => `${c.field} ${c.operator} '${c.value}'`).join(' AND ');
    setConditionsText(formatted);
    toast.success('Condition row added');
  };

  const handleRemoveCondition = (condId: string) => {
    const updated = conditionsList.filter(c => c.id !== condId);
    setConditionsList(updated);
    const formatted = updated.map(c => `${c.field} ${c.operator} '${c.value}'`).join(' AND ');
    setConditionsText(formatted);
  };

  const handleUpdateConditionText = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConditionsText(e.target.value);
  };

  // Recipient item add & remove actions
  const handleRemoveChip = (tab: RecipientTab, item: string | number) => {
    if (tab === 'users') {
      setSelectedUsers(selectedUsers.filter(u => u.id !== item));
    } else if (tab === 'roles') {
      setSelectedRoles(selectedRoles.filter(r => r !== item));
    } else if (tab === 'teams') {
      setSelectedTeams(selectedTeams.filter(t => t !== item));
    } else if (tab === 'departments') {
      setSelectedDepartments(selectedDepartments.filter(d => d !== item));
    } else if (tab === 'emails') {
      setSelectedEmails(selectedEmails.filter(e => e !== item));
    } else if (tab === 'lists') {
      setSelectedLists(selectedLists.filter(l => l !== item));
    }
  };

  const handleAddChip = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newInputVal.trim();
    if (!val) return;

    if (activeTab === 'roles' && !selectedRoles.includes(val)) {
      setSelectedRoles([...selectedRoles, val]);
    } else if (activeTab === 'teams' && !selectedTeams.includes(val)) {
      setSelectedTeams([...selectedTeams, val]);
    } else if (activeTab === 'departments' && !selectedDepartments.includes(val)) {
      setSelectedDepartments([...selectedDepartments, val]);
    } else if (activeTab === 'emails') {
      if (!val.includes('@')) {
        toast.error('Please enter a valid email address');
        return;
      }
      if (!selectedEmails.includes(val)) {
        setSelectedEmails([...selectedEmails, val]);
      }
    } else if (activeTab === 'lists' && !selectedLists.includes(val)) {
      setSelectedLists([...selectedLists, val]);
    }
    setNewInputVal('');
  };

  // Add User specifically from Select dropdown list
  const handleAddSelectedUser = (userIdStr: string) => {
    if (!userIdStr) return;
    const foundUser = usersList.find(u => String(u.id) === userIdStr);
    if (foundUser && !selectedUsers.some(u => u.id === foundUser.id)) {
      setSelectedUsers([...selectedUsers, foundUser]);
    }
    setSelectedUserSelectId('');
  };

  // Form Submit Action -> Calls POST endpoint NotificationRuleCRUD
  const handleSave = async (isDraft: boolean) => {
    if (!ruleName.trim()) {
      toast.error('Rule Name is required.');
      return;
    }
    if (!model) {
      toast.error('Please select a model.');
      return;
    }

    setIsSubmitting(true);
    const saveToast = toast.loading(isDraft ? 'Saving draft...' : 'Creating notification rule...');

    try {
      const orgId = typeof window !== 'undefined' ? Number(localStorage.getItem('Organization_Id')) || 1 : 1;
      const userId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId')) || 72 : 72;

      // Map Active Channels to matching names array
      const mappedChannels: string[] = [];
      if (channels.email) mappedChannels.push('Email');
      if (channels.whatsapp) mappedChannels.push('WhatsApp');
      if (channels.inApp) mappedChannels.push('In-App');
      if (channels.push) mappedChannels.push('Push');

      // Map conditions list fields
      const mappedConditions = conditionsList.map(c => ({
        Field: c.field.trim().replace(/\s+/g, '_'),
        Operator: c.operator,
        Value: c.value
      }));

      // Build target payload
      const payload = {
        Organization_Id: orgId,
        Rule_Name: ruleName,
        Event: model === 'incident' ? 'Proposal Created' : `${model.charAt(0).toUpperCase() + model.slice(1)} Event`, // Map selected model to Event string
        Condition: mappedConditions,
        Recipients: selectedUsers.map(u => u.id),
        Recipient_Roles: selectedRoles,
        Recipient_Teams: selectedTeams,
        Recipient_Departments: selectedDepartments,
        Custom_Emails: selectedEmails,
        Distribution_Lists: selectedLists,
        Channels: mappedChannels,
        Delay_Value: Number(delayValue) || undefined,
        Delay_Type: delayValue ? delayUnit : undefined,
        Delay_After: delayValue ? delayType : undefined,
        Priority: priority || undefined,
        Retry_Count: retryCount ? Number(retryCount) : undefined,
        Expiry_Date: expiryDate || undefined,
        Status: ruleStatus || 'Active',
        Is_Draft: isDraft,
        Is_Deleted: false,
        Created_By: userId,
        Updated_By: userId
      };

      const response = await fetchFromApi('/user/NotificationRuleCRUD/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response && (response.id || response.NotificationRule_Id)) {
        toast.success(
          isDraft 
            ? 'Notification rule saved as draft!' 
            : `Notification rule created successfully! ID: ${response.NotificationRule_Id || response.id}`
        );
        router.push('/Settings/Incident');
      } else {
        toast.error('Failed to create notification rule');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving notification rule');
    } finally {
      toast.dismiss(saveToast);
      setIsSubmitting(false);
    }
  };

  // Layout styling variables
  const cardCls = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[5px] shadow-sm';
  const labelCls = 'text-xs font-extrabold text-slate-700 dark:text-slate-300';
  const inputCls = 'h-10 text-xs font-semibold border-slate-200 dark:border-slate-700 dark:bg-slate-950 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-[5px]';
  const textareaCls = 'text-xs font-semibold border-slate-200 dark:border-slate-700 dark:bg-slate-950 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-[5px] min-h-[100px]';
  const selectCls = 'w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto p-4 space-y-6 text-left"
    >
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[5px] border dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-[5px]">
            <Bell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Create Notification Rule
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              Define rules to automate and deliver notifications based on events and conditions
            </p>
          </div>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 self-start md:self-center">
          <span>Notification Rules</span>
          <span className="mx-1.5">›</span>
          <span className="text-slate-800 dark:text-slate-200">Create Rule</span>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="space-y-6">
        
        {/* Section 1: Top Row Fields (Rule Name, Event, Status Toggle) */}
        <div className={cardCls}>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            
            {/* Rule Name */}
            <div className="space-y-1.5 md:col-span-5">
              <label className={labelCls}>
                Rule Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Enter rule name"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Model / Event dropdown */}
            <div className="space-y-1.5 md:col-span-5">
              <label className={labelCls}>
                Model <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select model</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="deal">Deal</option>
                  <option value="lead">Lead</option>
                  <option value="ticket">Ticket</option>
                  <option value="incident">Incident</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Switch Toggle Status */}
            <div className="space-y-1.5 md:col-span-2 flex flex-col justify-end">
              <label className={labelCls}>
                Status <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2.5 h-10">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                    isActive ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Active</span>
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Condition builder */}
        <div className={cardCls}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Condition Textarea Left Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Condition (Optional)</label>
                <Textarea
                  placeholder="Set conditions for this rule"
                  value={conditionsText}
                  onChange={handleUpdateConditionText}
                  className={textareaCls}
                />
              </div>
              <Button
                variant="outline"
                type="button"
                onClick={handleAddCondition}
                className="h-10 text-xs font-bold rounded-[5px] border-blue-200 hover:bg-blue-50/50 text-blue-600 dark:border-blue-900 dark:text-blue-400 gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Condition
              </Button>
            </div>

            {/* Condition Tips Right Column */}
            <div className="lg:col-span-5">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-[5px] p-5 h-full space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <Info className="h-4.5 w-4.5 shrink-0" />
                  <span className="text-xs font-bold">Condition Builder Tips</span>
                </div>
                <ul className="text-xs text-blue-600 dark:text-blue-300 font-semibold space-y-2 list-disc list-inside">
                  <li>Use conditions to filter when this rule should trigger.</li>
                  <li>Example: Opportunity Value &gt; 100000 AND Stage = &apos;Proposal&apos;</li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Recipients & Channels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recipients Block */}
          <div className={cardCls}>
            <div className="space-y-4">
              <label className={labelCls}>
                Recipients <span className="text-rose-500">*</span>
              </label>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1">
                {(['users', 'roles', 'teams', 'departments', 'emails', 'lists'] as RecipientTab[]).map(tab => {
                  const label = tab === 'users' ? 'Users'
                    : tab === 'roles' ? 'Roles'
                    : tab === 'teams' ? 'Teams'
                    : tab === 'departments' ? 'Departments'
                    : tab === 'emails' ? 'Custom Emails'
                    : 'Distribution Lists';
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px ${
                        active 
                          ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Users search select or search add text fields */}
              {activeTab === 'users' ? (
                <div className="relative">
                  <select
                    value={selectedUserSelectId}
                    onChange={(e) => handleAddSelectedUser(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Search and select users</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <form onSubmit={handleAddChip} className="relative">
                  <Input
                    placeholder={`Enter new ${activeTab === 'emails' ? 'custom email' : activeTab} and press enter`}
                    value={newInputVal}
                    onChange={(e) => setNewInputVal(e.target.value)}
                    className="h-10 pr-10 text-xs font-semibold border-slate-200 rounded-[5px] dark:border-slate-700 dark:bg-slate-950"
                  />
                </form>
              )}

              {/* Recipient Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {/* Users Chips */}
                {activeTab === 'users' && selectedUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-[5px] text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{user.name}</span>
                    <button type="button" onClick={() => handleRemoveChip('users', user.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Roles Chips */}
                {activeTab === 'roles' && selectedRoles.map(role => (
                  <div key={role} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-[5px] text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{role}</span>
                    <button type="button" onClick={() => handleRemoveChip('roles', role)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Teams Chips */}
                {activeTab === 'teams' && selectedTeams.map(teamName => (
                  <div key={teamName} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-[5px] text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{teamName}</span>
                    <button type="button" onClick={() => handleRemoveChip('teams', teamName)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Departments Chips */}
                {activeTab === 'departments' && selectedDepartments.map(dep => (
                  <div key={dep} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-[5px] text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{dep}</span>
                    <button type="button" onClick={() => handleRemoveChip('departments', dep)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Custom Emails Chips */}
                {activeTab === 'emails' && selectedEmails.map(emailStr => (
                  <div key={emailStr} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-[5px] text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{emailStr}</span>
                    <button type="button" onClick={() => handleRemoveChip('emails', emailStr)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Distribution Lists Chips */}
                {activeTab === 'lists' && selectedLists.map(listName => (
                  <div key={listName} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-700 rounded-[5px] text-xs font-bold text-slate-800 dark:text-slate-200">
                    <span>{listName}</span>
                    <button type="button" onClick={() => handleRemoveChip('lists', listName)} className="text-slate-400 hover:text-rose-500 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Channels Block */}
          <div className={cardCls}>
            <div className="space-y-4">
              <label className={labelCls}>
                Channel <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Email */}
                <label className="flex items-center gap-2.5 px-4 py-3 border dark:border-slate-800 rounded-[5px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <Checkbox
                    checked={channels.email}
                    onCheckedChange={(val) => setChannels({ ...channels, email: !!val })}
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span>Email</span>
                  </div>
                </label>

                {/* WhatsApp */}
                <label className="flex items-center gap-2.5 px-4 py-3 border dark:border-slate-800 rounded-[5px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <Checkbox
                    checked={channels.whatsapp}
                    onCheckedChange={(val) => setChannels({ ...channels, whatsapp: !!val })}
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Smartphone className="h-4 w-4 text-green-500" />
                    <span>WhatsApp</span>
                  </div>
                </label>

                {/* In-App */}
                <label className="flex items-center gap-2.5 px-4 py-3 border dark:border-slate-800 rounded-[5px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <Checkbox
                    checked={channels.inApp}
                    onCheckedChange={(val) => setChannels({ ...channels, inApp: !!val })}
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Bell className="h-4 w-4 text-violet-500" />
                    <span>In-App</span>
                  </div>
                </label>

                {/* Push */}
                <label className="flex items-center gap-2.5 px-4 py-3 border dark:border-slate-800 rounded-[5px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <Checkbox
                    checked={channels.push}
                    onCheckedChange={(val) => setChannels({ ...channels, push: !!val })}
                  />
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Bell className="h-4 w-4 text-amber-500" />
                    <span>Push</span>
                  </div>
                </label>
              </div>

            </div>
          </div>

        </div>

        {/* Section 4: Delay & Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Delay settings */}
          <div className={cardCls}>
            <div className="space-y-4">
              <label className={labelCls}>
                Delay (Optional)
              </label>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  value={delayValue}
                  onChange={(e) => setDelayValue(e.target.value)}
                  className={inputCls}
                />
                
                <div className="relative">
                  <select
                    value={delayUnit}
                    onChange={(e) => setDelayUnit(e.target.value)}
                    className={selectCls}
                  >
                    <option value="Minutes">Minutes</option>
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={delayType}
                    onChange={(e) => setDelayType(e.target.value)}
                    className={selectCls}
                  >
                    <option value="After Event">After Event</option>
                    <option value="Before Event">Before Event</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">
                Time to wait before sending notification after the event occurs
              </p>
            </div>
          </div>

          {/* Priority settings */}
          <div className={cardCls}>
            <div className="space-y-4">
              <label className={labelCls}>
                Priority (Optional)
              </label>

              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-10 pl-10 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <Flag className={`h-4 w-4 ${
                    priority === 'High' || priority === 'Critical' ? 'text-rose-500' : 'text-amber-500'
                  }`} />
                </div>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold">
                Set the priority of this notification rule
              </p>
            </div>
          </div>

        </div>

        {/* Section 5: Retry, Expiry & Status */}
        <div className={cardCls}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Retry Count */}
            <div className="space-y-2">
              <label className={labelCls}>
                Retry Count (Optional)
              </label>
              <Input
                type="number"
                value={retryCount}
                onChange={(e) => setRetryCount(e.target.value)}
                className={inputCls}
              />
              <p className="text-[10px] text-slate-400 font-bold">
                Number of times to retry if delivery fails
              </p>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <label className={labelCls}>Expiry (Optional)</label>
              <div className="relative">
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-10 pr-10 text-xs font-semibold border-slate-200 dark:border-slate-700 dark:bg-slate-950 focus-visible:ring-1 focus-visible:ring-blue-500 rounded-[5px]"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold">
                Rule will expire after this date (optional)
              </p>
            </div>

            {/* Rule Status Dropdown */}
            <div className="space-y-2">
              <label className={labelCls}>
                Status (Optional)
              </label>
              <div className="relative">
                <select
                  value={ruleStatus}
                  onChange={(e) => setRuleStatus(e.target.value)}
                  className="w-full h-10 pl-10 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${
                    ruleStatus === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`} />
                </div>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-[5px] border dark:border-slate-800 shadow-sm p-4 flex justify-end gap-3">
          <Button
            variant="outline"
            className="h-10 gap-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-[5px] text-xs font-semibold cursor-pointer w-full sm:w-auto"
            onClick={() => router.push('/Settings/Incident')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            className="h-10 gap-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 rounded-[5px] text-xs font-semibold cursor-pointer w-full sm:w-auto"
            onClick={() => handleSave(true)}
            disabled={isSubmitting}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave(false)}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-semibold rounded-[5px] h-10 px-6 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer gap-2 w-full sm:w-auto"
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save Rule'}
          </Button>
        </div>

      </div>
    </motion.div>
  );
}
