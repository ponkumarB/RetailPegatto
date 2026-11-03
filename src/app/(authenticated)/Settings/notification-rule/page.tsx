'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
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
  Search,
  RefreshCw,
  Trash2,
  SlidersHorizontal,
  ChevronRight,
  Settings,
  MessageSquare,
  Eye,
  BellRing,
  CheckCircle2,
  Clock,
  MoreVertical,
  Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { fetchFromApi } from '@/service/apiClient';
import { fetchUsersList } from '@/service/api/Leads/api';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

type ActiveTab = 'rules' | 'templates' | 'notifications';
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

interface NotificationRule {
  id: string;
  Rule_Name: string;
  Module: string;
  Conditions: string;
  Recipients: string[];
  Channels: string[];
  Priority: string;
  Delay: string;
  Status: 'Active' | 'Inactive';
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: string;
  module: string;
  subject: string;
  message: string;
  channels?: string[];
  variables?: { name: string; description: string }[];
  language: string;
  status: 'Active' | 'Inactive';
  priority: string;
}

interface NotificationItem {
  id: string;
  name: string;
  type: string;
  module: string;
  subject: string;
  message: string;
  channels?: string[];
  language: string;
  status: 'Active' | 'Inactive';
  priority: string;
  variables: { name: string; description: string }[];
  templateId?: string;
  useTemplate?: boolean;
  NotificationRule_Id?: number | null;
}

const CONDITION_FIELDS = [
  { value: 'Lead_Status', label: 'Lead Status' },
  { value: 'Lead_Source', label: 'Lead Source' },
  { value: 'Lead_Priority', label: 'Lead Priority' },
  { value: 'Lead_Score', label: 'Lead Score' },
  { value: 'Lead_Value', label: 'Lead Value' },
  { value: 'Assigned_User', label: 'Assigned User' },
  { value: 'Lead_Owner', label: 'Lead Owner' },
  { value: 'Follow_Up_Date', label: 'Follow Up Date' },
  { value: 'Created_Date', label: 'Created Date' },
  { value: 'Region', label: 'Region' },
  { value: 'Customer_Type', label: 'Customer Type' },
  { value: 'Industry', label: 'Industry' },
  { value: 'Company_Size', label: 'Company Size' },
  // Existing ones for compatibility
  { value: 'Opportunity_Value', label: 'Opportunity Value' },
  { value: 'Stage', label: 'Stage' },
  { value: 'Priority', label: 'Priority' },
  { value: 'Status', label: 'Status' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Overdue_Days', label: 'Overdue Days' },
  { value: 'Category', label: 'Category' },
];

export default function NotificationRulePage() {
  const router = useRouter();
  const { primaryColor, user } = useStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('rules');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [fieldSearchQuery, setFieldSearchQuery] = useState('');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  // Rule Form toggle
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);

  // Modals
  const [ruleToDelete, setRuleToDelete] = useState<{ id: string; name: string } | null>(null);

  // Local state storage (prefilled default values)
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [dropdownTemplates, setDropdownTemplates] = useState<NotificationTemplate[]>([]);
  const [dropdownRules, setDropdownRules] = useState<any[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');

  // Template Form Toggle & States
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('Alert');
  const [templateModule, setTemplateModule] = useState('Opportunity');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');
  const [templateLanguage, setTemplateLanguage] = useState('English');
  const [templateStatus, setTemplateStatus] = useState('Active');
  const [templatePriority, setTemplatePriority] = useState('High');
  const [templateChannels, setTemplateChannels] = useState({ email: true, sms: false, whatsapp: false, inApp: true });

  // Variables list state
  const [templateVariables, setTemplateVariables] = useState<{ name: string; description: string }[]>([
    { name: '{{CustomerName}}', description: 'Customer Full Name' },
    { name: '{{InvoiceNo}}', description: 'Invoice Number' },
    { name: '{{DueDate}}', description: 'Due Date' },
    { name: '{{Amount}}', description: 'Invoice Amount' }
  ]);
  const [isAddingVarInline, setIsAddingVarInline] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarDesc, setNewVarDesc] = useState('');

  // Preview modals & tabs
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewChannelTab, setPreviewChannelTab] = useState<'email' | 'mobile' | 'inapp'>('email');

  // ── Notifications Tab ──
  const [notificationItems, setNotificationItems] = useState<NotificationItem[]>([]);
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationItem | null>(null);
  const [notifName, setNotifName] = useState('');
  const [notifType, setNotifType] = useState('Alert');
  const [notifModule, setNotifModule] = useState('Opportunity');
  const [notifSubject, setNotifSubject] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifLanguage, setNotifLanguage] = useState('English');
  const [notifStatus, setNotifStatus] = useState('Active');
  const [notifPriority, setNotifPriority] = useState('High');
  const [notifChannels, setNotifChannels] = useState({ email: true, sms: false, whatsapp: false, inApp: false });
  const [notifVariables, setNotifVariables] = useState<{ name: string; description: string }[]>([
    { name: '{{CustomerName}}', description: 'Customer Full Name' },
    { name: '{{InvoiceNo}}', description: 'Invoice Number' },
  ]);
  const [isAddingNotifVar, setIsAddingNotifVar] = useState(false);
  const [newNotifVarName, setNewNotifVarName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [newNotifVarDesc, setNewNotifVarDesc] = useState('');
  const [notifSearchQuery, setNotifSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Rule Form States
  const [ruleName, setRuleName] = useState('');
  const [model, setModel] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [conditionsText, setConditionsText] = useState('');
  const [conditionsList, setConditionsList] = useState<ConditionItem[]>([]);
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('users');
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [newInputVal, setNewInputVal] = useState('');
  const [selectedUserSelectId, setSelectedUserSelectId] = useState('');
  const [channels, setChannels] = useState({ email: true, sms: false, whatsapp: false, inApp: true, push: false });
  const [delayValue, setDelayValue] = useState('');
  const [delayUnit, setDelayUnit] = useState('Minutes');
  const [delayType, setDelayType] = useState('After Event');
  const [priority, setPriority] = useState('Medium');
  const [retryCount, setRetryCount] = useState('3');
  const [expiryDate, setExpiryDate] = useState('');
  const [ruleStatus, setRuleStatus] = useState('Active');

  // Clean up any lingering localStorage fallback keys
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('crm_notification_rules');
      localStorage.removeItem('crm_notification_templates');
      localStorage.removeItem('crm_notifications');
    }
  }, []);

  // Load default preset values
  useEffect(() => {
    // 1. Rules loading from API
    const loadRules = async () => {
      try {
        const orgId = user?.organizationId || 1;
        const res = await fetchFromApi(`/user/NotificationRuleList/?page=1&Organization_Id=${orgId}`, { method: 'GET' });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        if (list.length > 0) {
          const mapped = list.map((r: any) => {
            const recipientsList: string[] = [];
            if (Array.isArray(r.Recipients)) {
              r.Recipients.forEach((rec: any) => {
                if (rec && typeof rec === 'object') {
                  // API returns full user objects
                  const displayName =
                    rec.username ||
                    `${rec.first_name || ''} ${rec.last_name || ''}`.trim() ||
                    rec.email ||
                    `User ${rec.id}`;
                  recipientsList.push(displayName);
                } else {
                  // Fallback: rec is a plain ID
                  const u = usersList.find(user => user.id === rec);
                  recipientsList.push(u ? u.name : `User ${rec}`);
                }
              });
            }
            if (Array.isArray(r.Recipient_Roles)) recipientsList.push(...r.Recipient_Roles);
            if (Array.isArray(r.Recipient_Teams)) recipientsList.push(...r.Recipient_Teams);
            if (Array.isArray(r.Recipient_Departments)) recipientsList.push(...r.Recipient_Departments);
            if (Array.isArray(r.Custom_Emails)) recipientsList.push(...r.Custom_Emails);
            if (Array.isArray(r.Distribution_Lists)) recipientsList.push(...r.Distribution_Lists);

            if (recipientsList.length === 0) {
              recipientsList.push('Assigned User');
            }

            return {
              id: String(r.id),
              Rule_Name: r.Rule_Name || 'Unnamed Rule',
              Module: r.Module || r.Event || 'Unknown Module',
              Conditions: Array.isArray(r.Condition)
                ? r.Condition.map((c: any) => `${c.Field || c.field} ${c.Operator || c.operator} '${c.Value || c.value}'`).join(' AND ')
                : (r.Conditions || 'None'),
              Recipients: recipientsList,
              Channels: Array.isArray(r.Channels)
                ? r.Channels
                : ([
                    r.Email && 'Email',
                    r.SMS && 'SMS',
                    r.WhatsApp && 'WhatsApp',
                    (r.In_App || r.In_App_Notification) && 'In-App',
                    (r.Push_Notification || r.Push) && 'Push'
                  ].filter(Boolean) as string[]),
              Priority: r.Priority || 'Medium',
              Delay: r.Delay_Value ? `${r.Delay_Value} ${r.Delay_Type} ${r.Delay_After}` : 'Immediate',
              Status: r.Status || 'Active'
            };
          });
          setRules(mapped);
          return;
        }
      } catch (err) {
        console.error('Failed to load rules from API:', err);
      }
      setRules([]);
    };

    // 2. Templates loading from API
    const loadTemplates = async () => {
      try {
        const orgId = user?.organizationId || 1;
        const res = await fetchFromApi(`/user/NotificationTemplateList/?page=1&Organization_Id=${orgId}`, { method: 'GET' });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mapped = list.map((t: any) => ({
          id: String(t.id),
          name: t.Template_Name || 'Unnamed Template',
          type: t.Notification_Type || 'Alert',
          module: t.Module || 'Opportunity',
          subject: t.Subject || '',
          message: t.Message || '',
          channels: t.Channels || [],
          variables: Array.isArray(t.Variables) 
            ? t.Variables.map((v: any) => ({ name: v.Variable_Name || v.name, description: v.Description || v.description }))
            : [],
          language: t.Language || 'English',
          status: t.Status || 'Active',
          priority: t.Priority || 'High'
        }));
        setTemplates(mapped);
      } catch (err) {
        console.error('Failed to load templates from API:', err);
        setTemplates([]);
      }
    };

    // 3. Notifications loading from API
    const loadNotifications = async () => {
      try {
        const orgId = user?.organizationId || 1;
        const res = await fetchFromApi(`/user/CreateNotificationList/?page=1&Organization_Id=${orgId}`, { method: 'GET' });
        const list = Array.isArray(res) ? res : (res?.results || res?.data || []);
        const mapped = list.map((n: any) => ({
          id: String(n.id),
          name: n.Notification_Name || 'Unnamed Notification',
          type: n.Notification_Type || 'Alert',
          module: n.Module || 'Opportunity',
          subject: n.Subject || '',
          message: n.Message || '',
          channels: n.Channels || [],
          language: n.Language || 'English',
          status: n.Status || 'Active',
          priority: n.Priority || 'High',
          variables: Array.isArray(n.Variables)
            ? n.Variables.map((v: any) => ({ name: v.Variable_Name || v.name, description: v.Description || v.description }))
            : [],
          NotificationRule_Id: n.NotificationRule_Id ? Number(n.NotificationRule_Id) : null
        }));
        setNotificationItems(mapped);
      } catch (err) {
        console.error('Failed to load notifications from API:', err);
        setNotificationItems([]);
      }
    };

    loadRules();
    loadTemplates();
    loadNotifications();
  }, [usersList, user?.organizationId]);

  // Load live users list
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetchUsersList();
        const list = Array.isArray(response) ? response : (response?.results || response?.data || []);
        const mapped: UserOption[] = list.map((u: any) => ({
          id: u.id,
          name: u.username || u.Name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'User',
          email: u.email || ''
        }));
        setUsersList(mapped);
      } catch (err) {
        console.error('Failed to load user list:', err);
        setUsersList([
          { id: 72, name: 'Santhosh Narayanan', email: 'santhosh@company.com' },
          { id: 73, name: 'Priya M.', email: 'priya@company.com' },
          { id: 85, name: 'CEO Office', email: 'ceo@company.com' }
        ]);
      }
    };
    loadUsers();
  }, []);

  // Load unpaginated templates and rules specifically for form dropdown selection on-demand
  useEffect(() => {
    if (!isCreatingNotification) return;

    const loadDropdownData = async () => {
      const orgId = user?.organizationId || 1;

      // Load Templates
      try {
        const resUnpaginated = await fetchFromApi(`/user/NotificationTemplatewithoutpagination/?Organization_Id=${orgId}`, { method: 'GET' });
        const list = Array.isArray(resUnpaginated) ? resUnpaginated : (resUnpaginated?.results || resUnpaginated?.data || []);
        const mapped = list.map((t: any) => ({
          id: String(t.id),
          name: t.Template_Name || 'Unnamed Template',
          type: t.Notification_Type || 'Alert',
          module: t.Module || 'Opportunity',
          subject: t.Subject || '',
          message: t.Message || '',
          channels: t.Channels || [],
          variables: Array.isArray(t.Variables) 
            ? t.Variables.map((v: any) => ({ name: v.Variable_Name || v.name, description: v.Description || v.description }))
            : [],
          language: t.Language || 'English',
          status: t.Status || 'Active',
          priority: t.Priority || 'High'
        }));
        setDropdownTemplates(mapped);
      } catch (err) {
        console.warn('Failed to load unpaginated templates:', err);
      }

      // Load Rules
      try {
        const resRules = await fetchFromApi(`/user/NotificationRulelistwithoutpagination/?Organization_Id=${orgId}`, { method: 'GET' });
        const listRules = Array.isArray(resRules) ? resRules : (resRules?.results || resRules?.data || []);
        setDropdownRules(listRules);
      } catch (err) {
        console.warn('Failed to load unpaginated rules:', err);
      }
    };

    loadDropdownData();
  }, [isCreatingNotification, user?.organizationId]);

  // Fetch raw rule from API by id and prefill form for editing
  const startEditRule = async (rule: NotificationRule) => {
    // Optimistically open form and set the rule reference so the user sees it loading
    setEditingRule(rule);
    setIsCreatingRule(true);

    try {
      const ruleId = rule.id;
      const raw = await fetchFromApi(`/user/NotificationRuleCRUD/?id=${ruleId}`, { method: 'GET' });
      // API may return an object directly or wrap it in results/data
      const data: any = Array.isArray(raw) ? raw[0] : (raw?.results?.[0] ?? raw?.data?.[0] ?? raw);

      if (!data || !data.id) {
        throw new Error('No rule data returned from API');
      }

      // Basic fields
      setRuleName(data.Rule_Name || '');
      setModel(
        data.Module
          ? data.Module.toLowerCase()
          : (data.Event
              ? data.Event.split(' ')[0].toLowerCase()
              : rule.Module.split(' ')[0].toLowerCase() || 'incident')
      );
      setIsActive((data.Status || 'Active') === 'Active');
      setRuleStatus(data.Status || 'Active');
      setPriority(data.Priority || 'Medium');
      setRetryCount(String(data.Retry_Count ?? 3));
      setExpiryDate(data.Expiry_Date || '');

      // Conditions
      if (Array.isArray(data.Condition) && data.Condition.length > 0) {
        const mapped = data.Condition.map((c: any, idx: number) => ({
          id: String(idx + 1),
          field: c.Field || c.field || '',
          operator: c.Operator || c.operator || '=',
          value: c.Value || c.value || ''
        }));
        setConditionsList(mapped);
        setConditionsText(
          mapped.map((c: ConditionItem) => `${c.field} ${c.operator} '${c.value}'`).join(' AND ')
        );
      } else {
        setConditionsList([]);
        setConditionsText(data.Conditions || '');
      }

      // Recipients – API returns full user objects; map directly to UserOption shape
      const recipientUsers: UserOption[] = Array.isArray(data.Recipients)
        ? data.Recipients.map((rec: any) => {
            if (rec && typeof rec === 'object') {
              return {
                id: rec.id,
                name:
                  rec.username ||
                  `${rec.first_name || ''} ${rec.last_name || ''}`.trim() ||
                  rec.email ||
                  `User ${rec.id}`,
                email: rec.email || ''
              } as UserOption;
            }
            // Fallback: rec is a plain ID — try to find in usersList
            const found = usersList.find(u => u.id === rec);
            return found ?? ({ id: rec, name: `User ${rec}`, email: '' } as UserOption);
          })
        : [];
      setSelectedUsers(recipientUsers);

      // Roles, Teams, Departments, Custom Emails, Distribution Lists
      setSelectedRoles(Array.isArray(data.Recipient_Roles) ? data.Recipient_Roles : []);
      setSelectedTeams(Array.isArray(data.Recipient_Teams) ? data.Recipient_Teams : []);
      setSelectedDepartments(Array.isArray(data.Recipient_Departments) ? data.Recipient_Departments : []);
      setSelectedEmails(Array.isArray(data.Custom_Emails) ? data.Custom_Emails : []);
      setSelectedLists(Array.isArray(data.Distribution_Lists) ? data.Distribution_Lists : []);

      // Channels
      const apiChannels: string[] = Array.isArray(data.Channels)
        ? data.Channels
        : ([
            data.Email && 'Email',
            data.SMS && 'SMS',
            data.WhatsApp && 'WhatsApp',
            (data.In_App || data.In_App_Notification) && 'In-App',
            (data.Push_Notification || data.Push) && 'Push'
          ].filter(Boolean) as string[]);
      setChannels({
        email: apiChannels.includes('Email'),
        sms: apiChannels.includes('SMS'),
        whatsapp: apiChannels.includes('WhatsApp'),
        inApp: apiChannels.includes('In-App') || apiChannels.includes('In-App Notification'),
        push: apiChannels.includes('Push')
      });

      // Delay
      const delayVal = data.Delay_Value != null ? String(data.Delay_Value) : '';
      setDelayValue(delayVal);
      setDelayUnit(data.Delay_Type || 'Minutes');
      setDelayType(data.Delay_After || 'After Event');

    } catch (err) {
      console.error('Failed to fetch rule for editing, falling back to list data:', err);
      toast.error('Could not load rule details. Using cached data.');

      // Fallback: use the already-mapped display row
      setRuleName(rule.Rule_Name);
      setModel(rule.Module.split(' ')[0].toLowerCase() || 'incident');
      setIsActive(rule.Status === 'Active');
      setRuleStatus(rule.Status);
      setConditionsText(rule.Conditions);
      setConditionsList([
        { id: '1', field: rule.Conditions.split(' ')[0] || '', operator: '>', value: '' }
      ]);
      const users = usersList.filter(u => rule.Recipients.includes(u.email) || rule.Recipients.includes(u.name));
      setSelectedUsers(users);
      setSelectedRoles(rule.Recipients.filter(r => !r.includes('@') && !users.some(u => u.name === r)));
      setChannels({
        email: rule.Channels.includes('Email'),
        sms: rule.Channels.includes('SMS'),
        whatsapp: rule.Channels.includes('WhatsApp'),
        inApp: rule.Channels.includes('In-App') || rule.Channels.includes('In-App Notification'),
        push: rule.Channels.includes('Push')
      });
      setPriority(rule.Priority);
    }
  };


  const resetRuleForm = () => {
    setEditingRule(null);
    setRuleName('');
    setModel('');
    setIsActive(true);
    setConditionsText('');
    setConditionsList([]);
    setSelectedUsers([]);
    setSelectedRoles([]);
    setSelectedTeams([]);
    setSelectedDepartments([]);
    setSelectedEmails([]);
    setSelectedLists([]);
    setChannels({ email: true, sms: false, whatsapp: false, inApp: true, push: false });
    setDelayValue('');
    setPriority('Medium');
    setExpiryDate('');
    setRuleStatus('Active');
    setIsCreatingRule(false);
  };

  const handleAddCondition = () => {
    const newCond: ConditionItem = {
      id: Date.now().toString(),
      field: '',
      operator: '=',
      value: ''
    };
    setConditionsList(prev => [...prev, newCond]);
  };

  const handleUpdateCondition = (id: string, key: 'field' | 'operator' | 'value', val: string) => {
    setConditionsList(prev => prev.map(c => c.id === id ? { ...c, [key]: val } : c));
  };

  const handleRemoveCondition = (condId: string) => {
    setConditionsList(prev => prev.filter(c => c.id !== condId));
  };

  const handleRemoveChip = (tab: RecipientTab, item: string | number) => {
    if (tab === 'users') setSelectedUsers(selectedUsers.filter(u => u.id !== item));
    else if (tab === 'roles') setSelectedRoles(selectedRoles.filter(r => r !== item));
    else if (tab === 'teams') setSelectedTeams(selectedTeams.filter(t => t !== item));
    else if (tab === 'departments') setSelectedDepartments(selectedDepartments.filter(d => d !== item));
    else if (tab === 'emails') setSelectedEmails(selectedEmails.filter(e => e !== item));
    else if (tab === 'lists') setSelectedLists(selectedLists.filter(l => l !== item));
  };

  const handleAddSelectedUser = (userIdStr: string) => {
    if (!userIdStr) return;
    const foundUser = usersList.find(u => String(u.id) === userIdStr);
    if (foundUser && !selectedUsers.some(u => u.id === foundUser.id)) {
      setSelectedUsers([...selectedUsers, foundUser]);
    }
    setSelectedUserSelectId('');
  };

  const handleAddChip = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newInputVal.trim();
    if (!val) return;

    if (recipientTab === 'roles' && !selectedRoles.includes(val)) setSelectedRoles([...selectedRoles, val]);
    else if (recipientTab === 'teams' && !selectedTeams.includes(val)) setSelectedTeams([...selectedTeams, val]);
    else if (recipientTab === 'departments' && !selectedDepartments.includes(val)) setSelectedDepartments([...selectedDepartments, val]);
    else if (recipientTab === 'emails') {
      if (!val.includes('@')) {
        toast.error('Invalid email address');
        return;
      }
      if (!selectedEmails.includes(val)) setSelectedEmails([...selectedEmails, val]);
    } else if (recipientTab === 'lists' && !selectedLists.includes(val)) setSelectedLists([...selectedLists, val]);

    setNewInputVal('');
  };

  // Rule Save logic
  const handleSaveRule = async (isDraft: boolean) => {
    if (!ruleName.trim()) {
      toast.error('Rule Name is required.');
      return;
    }
    if (!model) {
      toast.error('Please select a model/module.');
      return;
    }

    setIsSubmitting(true);
    const textLoader = editingRule ? 'Updating rule...' : 'Creating notification rule...';
    const saveToast = toast.loading(textLoader);

    try {
      const mappedChannels: string[] = [];
      if (channels.email) mappedChannels.push('Email');
      if (channels.sms) mappedChannels.push('SMS');
      if (channels.whatsapp) mappedChannels.push('WhatsApp');
      if (channels.inApp) mappedChannels.push('In-App');
      if (channels.push) mappedChannels.push('Push');

      const recipientsNames = [
        ...selectedUsers.map(u => u.name),
        ...selectedRoles,
        ...selectedTeams,
        ...selectedDepartments,
        ...selectedEmails,
        ...selectedLists
      ];

      if (recipientsNames.length === 0) {
        recipientsNames.push('Assigned User');
      }

      const orgId = user?.organizationId || 1;
      const creatorId = Number(user?.id) || 72;

      const conditionPayload = conditionsList
        .filter(c => c.field.trim() && c.value.trim())
        .map(c => ({
          Field: c.field.trim(),
          Operator: c.operator,
          Value: c.value.trim()
        }));

      const payload = {
        Organization_Id: orgId,
        Rule_Name: ruleName,
        Module: model.charAt(0).toUpperCase() + model.slice(1),
        Condition: conditionPayload,
        Recipients: selectedUsers.map(u => u.id),
        Recipient_Roles: selectedRoles,
        Recipient_Teams: selectedTeams,
        Recipient_Departments: selectedDepartments,
        Custom_Emails: selectedEmails,
        Distribution_Lists: selectedLists,
        Email: channels.email,
        SMS: channels.sms,
        WhatsApp: channels.whatsapp,
        In_App: channels.inApp,
        Push_Notification: channels.push,
        Delay_Value: delayValue ? Number(delayValue) : 0,
        Delay_Type: delayUnit,
        Delay_After: delayType,
        Priority: priority,
        Retry_Count: Number(retryCount) || 3,
        Expiry_Date: expiryDate || null,
        Status: isActive ? 'Active' : 'Inactive',
        Is_Draft: isDraft,
        Is_Deleted: false,
        Created_By: creatorId,
        Updated_By: creatorId
      };

      let response: Awaited<ReturnType<typeof fetchFromApi>>;
      if (editingRule) {
        const ruleId = editingRule.id;
        const payloadWithId = {
          ...payload,
          id: typeof ruleId === 'string' && ruleId.startsWith('rule-') ? null : (typeof ruleId === 'string' ? parseInt(ruleId, 10) : ruleId)
        };
        try {
          response = await fetchFromApi('/user/NotificationRuleCRUD/', {
            method: 'PUT',
            body: JSON.stringify(payloadWithId),
          });
        } catch (err) {
          console.warn('PUT failed, trying URL detail path:', err);
          response = await fetchFromApi(`/user/NotificationRuleCRUD/${ruleId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
        }
      } else {
        response = await fetchFromApi('/user/NotificationRuleCRUD/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const savedBackendRule = response;
      const updatedRule: NotificationRule = {
        id: String(savedBackendRule.id),
        Rule_Name: savedBackendRule.Rule_Name || ruleName,
        Module: savedBackendRule.Module || model.charAt(0).toUpperCase() + model.slice(1),
        Conditions: Array.isArray(savedBackendRule.Condition)
          ? savedBackendRule.Condition.map((c: any) => `${c.Field || c.field} ${c.Operator || c.operator} '${c.Value || c.value}'`).join(' AND ')
          : (conditionsText.trim() || 'None'),
        Recipients: recipientsNames,
        Channels: Array.isArray(savedBackendRule.Channels)
          ? savedBackendRule.Channels
          : ([
              savedBackendRule.Email && 'Email',
              savedBackendRule.SMS && 'SMS',
              savedBackendRule.WhatsApp && 'WhatsApp',
              (savedBackendRule.In_App || savedBackendRule.In_App_Notification) && 'In-App',
              (savedBackendRule.Push_Notification || savedBackendRule.Push) && 'Push'
            ].filter(Boolean) as string[]),
        Priority: savedBackendRule.Priority || priority,
        Delay: savedBackendRule.Delay_Value ? `${savedBackendRule.Delay_Value} ${savedBackendRule.Delay_Type} ${savedBackendRule.Delay_After}` : 'Immediate',
        Status: savedBackendRule.Status || (isActive ? 'Active' : 'Inactive')
      };

      let newRulesList: NotificationRule[] = [];
      if (editingRule) {
        newRulesList = rules.map(r => r.id === editingRule.id ? updatedRule : r);
        toast.success('Notification rule updated successfully');
      } else {
        newRulesList = [updatedRule, ...rules];
        toast.success('Notification rule created successfully!');
      }

      setRules(newRulesList);
      resetRuleForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving rule');
    } finally {
      toast.dismiss(saveToast);
      setIsSubmitting(false);
    }
  };

  // Rule Delete logic
  const handleDeleteRule = async (id: string) => {
    try {
      if (!id.startsWith('rule-')) {
        try {
          await fetchFromApi(`/user/NotificationRuleCRUD/?id=${id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.warn(`DELETE with query param failed, trying URL detail path:`, error);
          await fetchFromApi(`/user/NotificationRuleCRUD/${id}/`, {
            method: 'DELETE',
          });
        }
      }
    } catch (err: any) {
      console.error('API deletion failed:', err);
    }

    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    toast.success('Notification rule deleted successfully');
    setRuleToDelete(null);
  };

  // Template Edit & Reset
  const startEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateType(template.type);
    setTemplateModule(template.module);
    setTemplateSubject(template.subject);
    setTemplateMessage(template.message);
    setTemplateLanguage(template.language);
    setTemplateStatus(template.status);
    setTemplatePriority(template.priority);
    setTemplateChannels({
      email: template.channels?.includes('Email') || false,
      sms: template.channels?.includes('SMS') || false,
      whatsapp: template.channels?.includes('WhatsApp') || false,
      inApp: template.channels?.includes('In-App') || false
    });
    setIsCreatingTemplate(true);
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateType('Alert');
    setTemplateModule('Opportunity');
    setTemplateSubject('');
    setTemplateMessage('');
    setTemplateLanguage('English');
    setTemplateStatus('Active');
    setTemplatePriority('High');
    setTemplateChannels({ email: true, sms: false, whatsapp: false, inApp: true });
    setIsCreatingTemplate(false);
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-message-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      setTemplateMessage(prev => prev + variable);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setTemplateMessage(before + variable + after);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }, 0);
  };

  // Template Save logic
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Template Name is required.');
      return;
    }
    if (!templateSubject.trim()) {
      toast.error('Subject is required.');
      return;
    }
    if (!templateMessage.trim()) {
      toast.error('Message content is required.');
      return;
    }

    setIsSubmitting(true);
    const saveToast = toast.loading(editingTemplate ? 'Updating template...' : 'Creating template...');

    try {
      const mappedChannels: string[] = [];
      if (templateChannels.email) mappedChannels.push('Email');
      if (templateChannels.sms) mappedChannels.push('SMS');
      if (templateChannels.whatsapp) mappedChannels.push('WhatsApp');
      if (templateChannels.inApp) mappedChannels.push('In-App');

      const variablesPayload = templateVariables.map(v => ({
        Variable_Name: v.name,
        Description: v.description
      }));

      const orgId = user?.organizationId || 1;
      const creatorId = Number(user?.id) || 72;

      const payload = {
        Organization_Id: orgId,
        Template_Name: templateName,
        Notification_Type: templateType,
        Module: templateModule,
        Subject: templateSubject,
        Message: templateMessage,
        Variables: variablesPayload,
        Channels: mappedChannels,
        Language: templateLanguage,
        Priority: templatePriority,
        Status: templateStatus,
        Is_Draft: false,
        Created_By: creatorId,
        Updated_By: creatorId
      };

      let response: any;
      if (editingTemplate) {
        const templateId = editingTemplate.id;
        const payloadWithId = {
          ...payload,
          id: typeof templateId === 'string' && templateId.startsWith('temp-') ? null : (typeof templateId === 'string' ? parseInt(templateId, 10) : templateId)
        };
        try {
          response = await fetchFromApi('/user/NotificationTemplateCRUD/', {
            method: 'PUT',
            body: JSON.stringify(payloadWithId),
          });
        } catch (err) {
          console.warn('PUT failed, trying URL detail path:', err);
          response = await fetchFromApi(`/user/NotificationTemplateCRUD/${templateId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
        }
      } else {
        response = await fetchFromApi('/user/NotificationTemplateCRUD/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const savedBackendTemplate = response;
      const updatedTemplate: NotificationTemplate = {
        id: String(savedBackendTemplate.id),
        name: savedBackendTemplate.Template_Name || templateName,
        type: savedBackendTemplate.Notification_Type || templateType,
        module: savedBackendTemplate.Module || templateModule,
        subject: savedBackendTemplate.Subject || templateSubject,
        message: savedBackendTemplate.Message || templateMessage,
        channels: savedBackendTemplate.Channels || mappedChannels,
        variables: Array.isArray(savedBackendTemplate.Variables)
          ? savedBackendTemplate.Variables.map((v: any) => ({ name: v.Variable_Name || v.name, description: v.Description || v.description }))
          : templateVariables,
        language: savedBackendTemplate.Language || templateLanguage,
        status: savedBackendTemplate.Status || (templateStatus as 'Active' | 'Inactive'),
        priority: savedBackendTemplate.Priority || templatePriority
      };

      let updatedTemplates: NotificationTemplate[] = [];
      if (editingTemplate) {
        updatedTemplates = templates.map(t => t.id === editingTemplate.id ? updatedTemplate : t);
        toast.success('Template updated successfully');
      } else {
        updatedTemplates = [updatedTemplate, ...templates];
        toast.success('Template created successfully');
      }

      setTemplates(updatedTemplates);
      
      // Update dropdown templates state too
      const updatedDropdown = dropdownTemplates.some(t => t.id === updatedTemplate.id)
        ? dropdownTemplates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t)
        : [updatedTemplate, ...dropdownTemplates];
      setDropdownTemplates(updatedDropdown);

      resetTemplateForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving template');
    } finally {
      toast.dismiss(saveToast);
      setIsSubmitting(false);
    }
  };

  // Template Delete
  const handleDeleteTemplate = async (id: string) => {
    try {
      if (!id.startsWith('temp-')) {
        try {
          await fetchFromApi(`/user/NotificationTemplateCRUD/?id=${id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.warn(`DELETE with query param failed, trying URL detail path:`, error);
          await fetchFromApi(`/user/NotificationTemplateCRUD/${id}/`, {
            method: 'DELETE',
          });
        }
      }
    } catch (err: any) {
      console.error('API deletion failed:', err);
    }

    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    setDropdownTemplates(dropdownTemplates.filter(t => t.id !== id));
    toast.success('Template deleted successfully');
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setModuleFilter('all');
  };

  // ── Notification Item Handlers ──
  const resetNotificationForm = () => {
    setEditingNotification(null);
    setNotifName('');
    setNotifType('Alert');
    setNotifModule('Opportunity');
    setNotifSubject('');
    setNotifMessage('');
    setNotifLanguage('English');
    setNotifStatus('Active');
    setNotifPriority('High');
    setSelectedTemplateId('');
    setSelectedRuleId('');
    setNotifVariables([{ name: '{{CustomerName}}', description: 'Customer Full Name' }, { name: '{{InvoiceNo}}', description: 'Invoice Number' }]);
    setIsAddingNotifVar(false);
    setNewNotifVarName('');
    setNewNotifVarDesc('');
    setIsCreatingNotification(false);
  };

  const startEditNotificationItem = (item: NotificationItem) => {
    setEditingNotification(item);
    setNotifName(item.name);
    setNotifType(item.type);
    setNotifModule(item.module);
    setNotifSubject(item.subject);
    setNotifMessage(item.message);
    setNotifLanguage(item.language);
    setNotifStatus(item.status);
    setNotifPriority(item.priority);
    setSelectedTemplateId(item.templateId || '');
    setSelectedRuleId(item.NotificationRule_Id ? String(item.NotificationRule_Id) : '');
    setNotifVariables(item.variables || []);
    setIsCreatingNotification(true);
  };

  const handleSaveNotification = async () => {
    if (!notifName.trim()) { toast.error('Notification Name is required.'); return; }
    if (!notifSubject.trim()) { toast.error('Subject is required.'); return; }
    if (!notifMessage.trim()) { toast.error('Message content is required.'); return; }

    setIsSubmitting(true);
    const saveToast = toast.loading(editingNotification ? 'Updating notification...' : 'Creating notification...');

    try {
      const orgId = user?.organizationId || 1;
      const creatorId = Number(user?.id) || 72;
      const payload = {
        Organization_Id: orgId,
        Use_Template: !!selectedTemplateId,
        NotificationTemplate_Id: selectedTemplateId ? parseInt(selectedTemplateId, 10) : null,
        NotificationRule_Id: selectedRuleId ? parseInt(selectedRuleId, 10) : null,
        Notification_Name: notifName,
        Notification_Type: notifType,
        Module: notifModule,
        Subject: notifSubject,
        Message: notifMessage,
        Language: notifLanguage,
        Status: notifStatus,
        Priority: notifPriority,
        Is_Draft: false,
        Created_By: creatorId,
        Updated_By: creatorId
      };

      let response: any;
      if (editingNotification) {
        const notifId = editingNotification.id;
        const payloadWithId = {
          ...payload,
          id: typeof notifId === 'string' && notifId.startsWith('notif-') ? null : (typeof notifId === 'string' ? parseInt(notifId, 10) : notifId)
        };
        try {
          response = await fetchFromApi('/user/CreateNotificationCRUD/', {
            method: 'PUT',
            body: JSON.stringify(payloadWithId),
          });
        } catch (err) {
          console.warn('PUT failed, trying URL detail path:', err);
          response = await fetchFromApi(`/user/CreateNotificationCRUD/${notifId}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          });
        }
      } else {
        response = await fetchFromApi('/user/CreateNotificationCRUD/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const savedBackendNotif = response;
      const updatedNotif: NotificationItem = {
        id: String(savedBackendNotif.id),
        name: savedBackendNotif.Notification_Name || notifName,
        type: savedBackendNotif.Notification_Type || notifType,
        module: savedBackendNotif.Module || notifModule,
        subject: savedBackendNotif.Subject || notifSubject,
        message: savedBackendNotif.Message || notifMessage,
        language: savedBackendNotif.Language || notifLanguage,
        status: savedBackendNotif.Status || (notifStatus as 'Active' | 'Inactive'),
        priority: savedBackendNotif.Priority || notifPriority,
        variables: notifVariables,
        templateId: savedBackendNotif.NotificationTemplate_Id ? String(savedBackendNotif.NotificationTemplate_Id) : undefined,
        NotificationRule_Id: savedBackendNotif.NotificationRule_Id ? Number(savedBackendNotif.NotificationRule_Id) : (selectedRuleId ? parseInt(selectedRuleId, 10) : null)
      };

      let updated: NotificationItem[];
      if (editingNotification) {
        updated = notificationItems.map(n => n.id === editingNotification.id ? updatedNotif : n);
        toast.success('Notification updated successfully');
      } else {
        updated = [updatedNotif, ...notificationItems];
        toast.success('Notification created successfully');
      }

      setNotificationItems(updated);
      resetNotificationForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving notification');
    } finally {
      toast.dismiss(saveToast);
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotificationItem = async (id: string) => {
    try {
      if (!id.startsWith('notif-')) {
        try {
          await fetchFromApi(`/user/CreateNotificationCRUD/?id=${id}`, {
            method: 'DELETE',
          });
        } catch (error) {
          console.warn(`DELETE with query param failed, trying URL detail path:`, error);
          await fetchFromApi(`/user/CreateNotificationCRUD/${id}/`, {
            method: 'DELETE',
          });
        }
      }
    } catch (err: any) {
      console.error('API deletion failed:', err);
    }

    const updated = notificationItems.filter(n => n.id !== id);
    setNotificationItems(updated);
    toast.success('Notification deleted successfully');
  };

  const filteredRules = useMemo(() => {
    return rules.filter(r => {
      const matchesSearch = r.Rule_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.Module || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = moduleFilter === 'all' || (r.Module || '').toLowerCase().includes(moduleFilter.toLowerCase());
      return matchesSearch && matchesModule;
    });
  }, [rules, searchQuery, moduleFilter]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModule = moduleFilter === 'all' || t.module.toLowerCase() === moduleFilter.toLowerCase();
      return matchesSearch && matchesModule;
    });
  }, [templates, searchQuery, moduleFilter]);

  const filteredNotifications = useMemo(() => {
    return notificationItems.filter(n => {
      const matchesSearch = n.name.toLowerCase().includes(notifSearchQuery.toLowerCase()) ||
        n.subject.toLowerCase().includes(notifSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [notificationItems, notifSearchQuery]);

  const tabsList = [
    { id: 'rules', label: 'Rules', icon: SlidersHorizontal },
    { id: 'templates', label: 'Templates', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: BellRing }
  ];

  const ruleColumns: ColumnConfig<NotificationRule>[] = [
    {
      key: 'Rule_Name',
      header: 'Rule Name',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-800 dark:text-slate-205">{row.Rule_Name}</span>
          <span className="text-[10px] text-slate-500 font-medium">Trigger: {row.Module}</span>
        </div>
      )
    },
    {
      key: 'Conditions',
      header: 'Conditions',
      render: (row) => (
        <div className="max-w-[250px] truncate text-slate-650 dark:text-slate-400 font-mono text-[10px] bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-[5px] border dark:border-slate-800">
          {row.Conditions}
        </div>
      )
    },
    {
      key: 'Recipients',
      header: 'Recipients',
      render: (row) => {
        const MAX_VISIBLE = 3;
        const visible = row.Recipients.slice(0, MAX_VISIBLE);
        const hidden = row.Recipients.slice(MAX_VISIBLE);
        return (
          <TooltipProvider delay={150}>
            <div className="flex flex-wrap gap-1 max-w-[220px]">
              {visible.map((rec, i) => (
                <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-[5px] font-medium">
                  {rec}
                </Badge>
              ))}
              {hidden.length > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <span className="inline-flex items-center cursor-pointer text-[9px] font-bold px-1.5 py-0.5 rounded-[5px] bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors select-none">
                      +{hidden.length} more
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="z-50 p-0 border-0 shadow-xl"
                  >
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-3 min-w-[160px] max-w-[260px]">
                      <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">All Recipients</p>
                      <div className="flex flex-wrap gap-1">
                        {row.Recipients.map((rec, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        );
      }
    },
    {
      key: 'Channels',
      header: 'Channels',
      render: (row) => (
        <div className="flex gap-1.5">
          {row.Channels.map((ch, i) => (
            <Badge key={i} className="text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900 rounded-[5px]">
              {ch}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'Priority',
      header: 'Priority',
      render: (row) => {
        const isCrit = row.Priority === 'Critical';
        return (
          <Badge className={`text-[10px] font-bold rounded-[5px] ${isCrit ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}>
            {row.Priority}
          </Badge>
        );
      }
    },
    {
      key: 'Status',
      header: 'Status',
      render: (row) => {
        const isActiveStatus = row.Status === 'Active';
        return (
          <Badge className={`text-[10px] font-bold rounded-[5px] ${isActiveStatus ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-550 dark:bg-slate-800'
            }`}>
            {row.Status}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="h-7 w-7 flex items-center justify-center rounded-[5px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-0 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {openMenuId === row.id && (
            <div className="absolute right-0 top-8 z-50 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[5px] shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => { startEditRule(row); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer bg-transparent border-0"
              >
                <Pencil className="h-3.5 w-3.5 text-blue-500" /> Edit
              </button>
              <button
                type="button"
                onClick={() => { setRuleToDelete({ id: row.id, name: row.Rule_Name }); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer bg-transparent border-0"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  const templateColumns: ColumnConfig<NotificationTemplate>[] = [
    {
      key: 'name',
      header: 'Template Name',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-850 dark:text-slate-205">{row.name}</span>
          <span className="text-[10px] text-slate-500 font-semibold">{row.module} Module ({row.language})</span>
        </div>
      )
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{row.subject}</span>
    },
    {
      key: 'message',
      header: 'Message Body',
      render: (row) => (
        <p className="max-w-[320px] truncate text-[11px] text-slate-500 dark:text-slate-400 font-medium font-mono" title={row.message}>
          {row.message}
        </p>
      )
    },

    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge className={`text-[10px] font-bold rounded-[5px] ${row.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
          }`}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="h-7 w-7 flex items-center justify-center rounded-[5px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-0 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {openMenuId === row.id && (
            <div className="absolute right-0 top-8 z-50 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[5px] shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => { startEditTemplate(row); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer bg-transparent border-0"
              >
                <Pencil className="h-3.5 w-3.5 text-blue-500" /> Edit
              </button>
              <button
                type="button"
                onClick={() => { handleDeleteTemplate(row.id); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer bg-transparent border-0"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  const notificationColumns: ColumnConfig<NotificationItem>[] = [
    {
      key: 'name',
      header: 'Notification',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{row.name}</span>
          <span className="text-[10px] text-slate-450 font-semibold">{row.type}</span>
        </div>
      )
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => <p className="text-[11px] text-slate-550 dark:text-slate-400 font-semibold truncate max-w-[200px]" title={row.subject}>{row.subject}</p>
    },
    {
      key: 'module',
      header: 'Module',
      render: (row) => (
        <Badge className="text-[9px] font-bold rounded-[5px] border px-1.5 py-0.5 w-fit bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900">{row.module}</Badge>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge className={`text-[9px] font-bold rounded-[5px] border px-1.5 py-0.5 w-fit ${row.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border-rose-200' :
          row.priority === 'High' ? 'bg-amber-50 text-amber-600 border-amber-200' :
            row.priority === 'Medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
              'bg-slate-50 text-slate-500 border-slate-200'
          }`}>{row.priority}</Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge className={`text-[9px] font-bold rounded-[5px] px-1.5 py-0.5 w-fit ${row.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>{row.status}</Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenuId(openMenuId === row.id ? null : row.id)}
            className="h-7 w-7 flex items-center justify-center rounded-[5px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-0 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {openMenuId === row.id && (
            <div className="absolute right-0 top-8 z-50 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[5px] shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={() => { startEditNotificationItem(row); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer bg-transparent border-0"
              >
                <Pencil className="h-3.5 w-3.5 text-blue-500" /> Edit
              </button>
              <button
                type="button"
                onClick={() => { handleDeleteNotificationItem(row.id); setOpenMenuId(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer bg-transparent border-0"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1700px] mx-auto p-4 space-y-6 text-left pb-24"
    >
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[5px] border dark:border-slate-800 shadow-3xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-[5px]">
            <Bell className="h-6.5 w-6.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Notification Rules & Administration
            </h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Configure event triggers, design multi-channel message templates, and track delivery logs.
            </p>
          </div>
        </div>
        <div className="text-[11px] font-bold text-slate-450 dark:text-slate-400 self-start md:self-center">
          <span>Settings</span>
          <span className="mx-1.5">›</span>
          <span className="text-slate-700 dark:text-slate-300">Notification Rule Hub</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-[5px]">
        {tabsList.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as ActiveTab);
              setIsCreatingRule(false);
              setIsCreatingNotification(false);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold whitespace-nowrap transition-all rounded-[5px] cursor-pointer ${activeTab === tab.id
              ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-3xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
              }`}
            style={activeTab === tab.id ? { color: primaryColor } : undefined}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Switcher Body */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (isCreatingRule ? '-create' : '-list')}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {/* TAB 2: RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">

              {!isCreatingRule ? (
                <>
                  {/* Search and Action Bar */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-[5px] shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search rules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9.5 text-xs rounded-[5px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                      />
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        className="h-9.5 text-xs font-bold rounded-[5px] border-slate-200 hover:bg-slate-50 dark:border-slate-800 cursor-pointer"
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={() => {
                          resetRuleForm();
                          setIsCreatingRule(true);
                        }}
                        style={{ backgroundColor: primaryColor }}
                        className="h-9.5 text-white font-bold text-xs rounded-[5px] shadow-md hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Create Rule
                      </Button>
                    </div>
                  </div>

                  {/* Rules Grid Table */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4">
                    <ReusableTable
                      columns={ruleColumns}
                      data={filteredRules}
                      loading={false}
                      initialPageSize={10}
                    />
                  </div>
                </>
              ) : (
                /* RULE CREATION FORM */
                <div className="space-y-6">
                  {/* Form Title */}
                  <div className="flex items-center justify-between border-b dark:border-slate-850 pb-4">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5 text-blue-500" />
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {editingRule ? 'Modify Notification Rule' : 'Build Custom Notification Rule'}
                      </h2>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={resetRuleForm}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer h-8 px-2 rounded-[5px]"
                    >
                      ‹ Back to Rules List
                    </Button>
                  </div>

                  {/* Basic Config */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[5px] shadow-3xs">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      <div className="space-y-1.5 md:col-span-5 text-xs">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                          Rule Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="e.g. Leave Request Approved SMS"
                          value={ruleName}
                          onChange={(e) => setRuleName(e.target.value)}
                          className="h-10 text-xs font-semibold rounded-[5px] border-slate-200 dark:border-slate-700 dark:bg-slate-950 focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-5">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                          Event Model Category <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-850 dark:text-slate-200 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                          >
                            <option value="">Choose Model</option>
                            <option value="opportunity">Opportunity (Sales)</option>
                            <option value="lead">Lead (Marketing)</option>
                            <option value="finance">Invoice & Payments (Finance)</option>
                            <option value="ticket">Helpdesk Support (Support)</option>
                            <option value="incident">Incidents (Administration)</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5 md:col-span-2 flex flex-col justify-end">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">Status</label>
                        <div className="flex items-center gap-2.5 h-10">
                          <button
                            type="button"
                            onClick={() => setIsActive(!isActive)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${isActive ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Condition Builder */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[5px] shadow-3xs">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">Conditions</label>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                        {conditionsList.length} active condition{conditionsList.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {conditionsList.length > 0 && (
                      <div className="mb-3 rounded-[5px] border border-slate-200 dark:border-slate-700 relative z-20">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1fr_140px_1fr_36px] bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Field</div>
                          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700">Operator</div>
                          <div className="px-3 py-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-l border-slate-200 dark:border-slate-700">Value</div>
                          <div className="px-2 py-2 border-l border-slate-200 dark:border-slate-700" />
                        </div>
                        {/* Condition Rows */}
                        {conditionsList.map((cond, idx) => (
                          <div 
                            key={cond.id} 
                            className={`grid grid-cols-[1fr_140px_1fr_36px] ${idx < conditionsList.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''} relative ${activeDropdownId === cond.id ? 'z-30' : 'z-10'}`}
                          >
                            {/* Field */}
                            <div className="px-2 py-1.5">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activeDropdownId === cond.id) {
                                      setActiveDropdownId(null);
                                    } else {
                                      setActiveDropdownId(cond.id);
                                      setFieldSearchQuery('');
                                    }
                                  }}
                                  className="w-full h-8 px-2 text-left text-[11px] font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-blue-500 flex items-center justify-between cursor-pointer"
                                >
                                  <span className="truncate">
                                    {CONDITION_FIELDS.find(f => f.value === cond.field)?.label || cond.field || 'Select Field'}
                                  </span>
                                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-1" />
                                </button>

                                {activeDropdownId === cond.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40 cursor-default" 
                                      onClick={() => setActiveDropdownId(null)} 
                                    />
                                    
                                    <div className="absolute left-0 right-0 top-9 z-50 min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[4px] shadow-lg p-1 space-y-1">
                                      <div className="relative flex items-center border-b dark:border-slate-800 pb-1">
                                        <Search className="absolute left-2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                        <input
                                          type="text"
                                          placeholder="Search field..."
                                          value={fieldSearchQuery}
                                          onChange={(e) => setFieldSearchQuery(e.target.value)}
                                          className="w-full h-7 pl-7 pr-2 text-[11px] font-semibold bg-transparent focus:outline-none border-0 text-slate-800 dark:text-slate-200 placeholder-slate-450"
                                          autoFocus
                                        />
                                        {fieldSearchQuery && (
                                          <button
                                            type="button"
                                            onClick={() => setFieldSearchQuery('')}
                                            className="absolute right-2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        )}
                                      </div>
                                      
                                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                                        {CONDITION_FIELDS.filter(f => 
                                          f.label.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
                                          f.value.toLowerCase().includes(fieldSearchQuery.toLowerCase())
                                        ).length === 0 ? (
                                          <div className="text-[10px] text-slate-400 text-center py-2 font-medium">
                                            No fields found
                                          </div>
                                        ) : (
                                          CONDITION_FIELDS.filter(f => 
                                            f.label.toLowerCase().includes(fieldSearchQuery.toLowerCase()) ||
                                            f.value.toLowerCase().includes(fieldSearchQuery.toLowerCase())
                                          ).map(f => (
                                            <button
                                              key={f.value}
                                              type="button"
                                              onClick={() => {
                                                handleUpdateCondition(cond.id, 'field', f.value);
                                                setActiveDropdownId(null);
                                              }}
                                              className={`w-full h-7 px-2 text-left text-[11px] font-semibold rounded-[3px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between border-0 cursor-pointer ${
                                                cond.field === f.value 
                                                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-955/40 dark:text-blue-400' 
                                                  : 'text-slate-700 dark:text-slate-300 bg-transparent'
                                              }`}
                                            >
                                              <span>{f.label}</span>
                                              {cond.field === f.value && <Check className="h-3 w-3 shrink-0 ml-1" />}
                                            </button>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            {/* Operator */}
                            <div className="px-2 py-1.5 border-l border-slate-200 dark:border-slate-700">
                              <div className="relative">
                                <select
                                  value={cond.operator}
                                  onChange={(e) => handleUpdateCondition(cond.id, 'operator', e.target.value)}
                                  className="w-full h-8 pl-2 pr-7 text-[11px] font-semibold text-slate-800 dark:text-slate-200 bg-transparent border border-slate-200 dark:border-slate-700 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                                >
                                  <option value="=">Equals</option>
                                  <option value="!=">Not Equals</option>
                                  <option value=">">Greater Than</option>
                                  <option value=">=">Greater or Equal</option>
                                  <option value="<">Less Than</option>
                                  <option value="<=">Less or Equal</option>
                                  <option value="contains">Contains</option>
                                  <option value="starts_with">Starts With</option>
                                  <option value="ends_with">Ends With</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
                              </div>
                            </div>
                            {/* Value */}
                            <div className="px-2 py-1.5 border-l border-slate-200 dark:border-slate-700">
                              <input
                                type="text"
                                value={cond.value}
                                onChange={(e) => handleUpdateCondition(cond.id, 'value', e.target.value)}
                                placeholder="Enter value"
                                className="w-full h-8 px-2 text-[11px] font-semibold text-slate-800 dark:text-slate-200 bg-transparent border border-slate-200 dark:border-slate-700 rounded-[4px] focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                              />
                            </div>
                            {/* Delete */}
                            <div className="px-1 py-1.5 border-l border-slate-200 dark:border-slate-700 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveCondition(cond.id)}
                                className="h-7 w-7 flex items-center justify-center rounded-[4px] text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {conditionsList.length === 0 && (
                      <div className="mb-3 flex flex-col items-center justify-center py-6 rounded-[5px] border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600">
                        <SlidersHorizontal className="h-5 w-5 mb-1.5 opacity-50" />
                        <p className="text-[11px] font-semibold">No conditions added yet</p>
                        <p className="text-[10px] mt-0.5">Click &quot;Add Condition&quot; to define filter rules</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddCondition}
                      className="flex items-center gap-1.5 h-9 px-4 text-[11px] font-bold rounded-[5px] border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Condition
                    </button>
                  </div>

                  {/* Recipients & Channels */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[5px] shadow-3xs space-y-4">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                        Recipients <span className="text-rose-500">*</span>
                      </label>

                      <div className="relative">
                        <select
                          value={selectedUserSelectId}
                          onChange={(e) => handleAddSelectedUser(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-855 dark:text-slate-250 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Select Users</option>
                          {usersList.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1.5 min-h-[40px]">
                        {selectedUsers.map(user => (
                          <div key={user.id} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border dark:border-slate-750 rounded-[5px] text-[11px] font-bold text-slate-800 dark:text-slate-355">
                            <span>{user.name}</span>
                            <button type="button" onClick={() => handleRemoveChip('users', user.id)} className="text-slate-400 hover:text-rose-500">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[5px] shadow-3xs space-y-4">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">
                        Delivery Channels <span className="text-rose-500">*</span>
                      </label>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <label className="flex items-center gap-2.5 px-4 py-3 border dark:border-slate-800 rounded-[5px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <Checkbox
                            checked={channels.email}
                            onCheckedChange={(val) => setChannels({ ...channels, email: !!val })}
                          />
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span>Email SMTP</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 px-4 py-3 border dark:border-slate-800 rounded-[5px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <Checkbox
                            checked={channels.whatsapp}
                            onCheckedChange={(val) => setChannels({ ...channels, whatsapp: !!val })}
                          />
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            <MessageSquare className="h-4 w-4 text-emerald-500" />
                            <span>WhatsApp API</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 px-4 py-3 border dark:border-slate-800 rounded-[5px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <Checkbox
                            checked={channels.inApp}
                            onCheckedChange={(val) => setChannels({ ...channels, inApp: !!val })}
                          />
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            <Bell className="h-4 w-4 text-violet-500" />
                            <span>In-App Bell</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 px-4 py-3 border dark:border-slate-800 rounded-[5px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                          <Checkbox
                            checked={channels.push}
                            onCheckedChange={(val) => setChannels({ ...channels, push: !!val })}
                          />
                          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            <Bell className="h-4 w-4 text-amber-500 animate-bounce" />
                            <span>Mobile Push</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Delay, Priority & Retry policy */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[5px] shadow-3xs space-y-4">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">Dispatch Delay Scheduler</label>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          type="number"
                          placeholder="e.g. 5"
                          value={delayValue}
                          onChange={(e) => setDelayValue(e.target.value)}
                          className="h-10 text-xs font-semibold rounded-[5px] border-slate-200 dark:border-slate-700 dark:bg-slate-955"
                        />
                        <div className="relative">
                          <select
                            value={delayUnit}
                            onChange={(e) => setDelayUnit(e.target.value)}
                            className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-250 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
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
                            className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-800 dark:text-slate-250 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="After Event">After Event</option>
                            <option value="Before Event">Before Event</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-450 font-bold">
                        Leave blank for immediate delivery logs. Supports scheduled trigger delays.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[5px] shadow-3xs space-y-4">
                      <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">Notification Priority</label>
                      <div className="relative">
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full h-10 pl-10 pr-8 text-xs font-semibold text-slate-855 dark:text-slate-250 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="Low">Low Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="High">High Priority</option>
                          <option value="Critical">Critical Priority</option>
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                          <Flag className={`h-4 w-4 ${priority === 'High' || priority === 'Critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                        </div>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                      <p className="text-[10px] text-slate-450 font-bold">
                        Critical notifications bypass regular queues to process instantly.
                      </p>
                    </div>
                  </div>

                  {/* Expiry & Retry Counts */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[5px] shadow-3xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">Delivery Retry Max Limit</label>
                        <Input
                          type="number"
                          value={retryCount}
                          onChange={(e) => setRetryCount(e.target.value)}
                          className="h-10 text-xs font-semibold rounded-[5px] border-slate-200 dark:border-slate-705 dark:bg-slate-955"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">Rule Expiration Date</label>
                        <Input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="h-10 text-xs font-semibold rounded-[5px] border-slate-200 dark:border-slate-705 dark:bg-slate-955"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] p-4 flex justify-end gap-3 shadow-3xs">
                    <Button
                      variant="outline"
                      onClick={resetRuleForm}
                      disabled={isSubmitting}
                      className="h-10 border-slate-200 hover:bg-slate-50 dark:border-slate-800 text-xs font-bold rounded-[5px] cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSaveRule(true)}
                      disabled={isSubmitting}
                      className="h-10 border-slate-200 hover:bg-slate-50 dark:border-slate-800 text-xs font-bold rounded-[5px] cursor-pointer"
                    >
                      Save Draft
                    </Button>
                    <Button
                      onClick={() => handleSaveRule(false)}
                      disabled={isSubmitting}
                      style={{ backgroundColor: primaryColor }}
                      className="text-white font-bold rounded-[5px] h-10 px-6 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" /> {isSubmitting ? 'Processing...' : (editingRule ? 'Update Notification Rule' : 'Deploy Notification Rule')}
                    </Button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {!isCreatingTemplate ? (
                <>
                  {/* Search & Actions Bar */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-[5px] shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9.5 text-xs rounded-[5px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                        className="h-9.5 text-xs font-bold rounded-[5px] border-slate-200 dark:border-slate-800 cursor-pointer"
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={() => {
                          resetTemplateForm();
                          setIsCreatingTemplate(true);
                        }}
                        style={{ backgroundColor: primaryColor }}
                        className="h-9.5 text-white font-bold text-xs rounded-[5px] shadow-md hover:opacity-90 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Add Template
                      </Button>
                    </div>
                  </div>

                  {/* Templates Table */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4">
                    <ReusableTable
                      columns={templateColumns}
                      data={filteredTemplates}
                      loading={false}
                      initialPageSize={10}
                    />
                  </div>
                </>
              ) : (
                /* FULL PAGE TEMPLATE CREATOR FORM */
                <div className="space-y-6">
                  {/* Form Title & Breadcrumbs */}
                  <div className="flex items-center justify-between border-b dark:border-slate-850 pb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                          {editingTemplate ? 'Modify Notification Template' : 'Create Notification Template'}
                        </h2>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Create and manage notification templates</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={resetTemplateForm}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer h-8 px-2 rounded-[5px]"
                    >
                      ‹ Back to Templates List
                    </Button>
                  </div>

                  {/* Form Fields Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column fields */}
                    <div className="space-y-4">
                      {/* Template Name */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-1.5 text-left">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                          Template Name <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="Enter template name"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="h-10 text-xs font-semibold rounded-[5px] border-slate-200 dark:border-slate-700 dark:bg-slate-950 focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                      </div>

                      {/* Module */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-1.5 text-left">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                          Module <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={templateModule}
                            onChange={(e) => setTemplateModule(e.target.value)}
                            className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-855 dark:text-slate-200 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="">Select module</option>
                            <option value="Opportunity">Opportunity (Sales)</option>
                            <option value="Lead">Lead (Marketing)</option>
                            <option value="Finance">Invoice & Payments (Finance)</option>
                            <option value="Support">Helpdesk Support (Support)</option>
                            <option value="Project">Project Delivery (Project)</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Message Editor Container */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-2 text-left">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">
                          Message Body <span className="text-rose-500">*</span>
                        </label>

                        {/* Editor Rich Toolbar mock */}
                        <div className="border border-slate-200 dark:border-slate-800 rounded-[5px] overflow-hidden bg-slate-50 dark:bg-slate-950">
                          <div className="flex flex-wrap items-center gap-1 p-2 bg-white dark:bg-slate-900 border-b dark:border-slate-800 text-xs">
                            {/* Paragraph select */}
                            <select className="h-7 text-[11px] font-bold bg-white dark:bg-slate-850 border rounded-[3px] px-1.5 mr-1.5 focus:outline-none appearance-none">
                              <option>Paragraph</option>
                              <option>Heading 1</option>
                              <option>Heading 2</option>
                            </select>

                            {/* Editor action buttons */}
                            <button type="button" className="h-7 w-7 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[3px] border dark:border-slate-800">B</button>
                            <button type="button" className="h-7 w-7 flex items-center justify-center italic text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[3px] border dark:border-slate-800">I</button>
                            <button type="button" className="h-7 w-7 flex items-center justify-center underline text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[3px] border dark:border-slate-800">U</button>

                            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

                            <button type="button" className="h-7 px-1.5 flex items-center justify-center text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[3px] text-[11px] font-bold border dark:border-slate-800">List</button>
                            <button type="button" className="h-7 px-1.5 flex items-center justify-center text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[3px] text-[11px] font-bold border dark:border-slate-800">Link</button>
                            <button type="button" className="h-7 px-1.5 flex items-center justify-center text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[3px] text-[11px] font-bold border dark:border-slate-800">Image</button>

                            {/* Insert variable bracket trigger */}
                            <button
                              type="button"
                              onClick={() => insertVariable('{{CustomerName}}')}
                              className="h-7 px-2 flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-[3px] text-[11px] font-bold border border-blue-200 dark:border-blue-900 cursor-pointer gap-1"
                              title="Insert variable placeholder"
                            >
                              <span>{`{}`}</span> Variable
                            </button>
                          </div>

                          <textarea
                            id="template-message-textarea"
                            placeholder="Enter message content..."
                            value={templateMessage}
                            onChange={(e) => setTemplateMessage(e.target.value)}
                            className="w-full text-xs font-semibold border-0 bg-transparent p-4 focus:outline-none focus:ring-0 min-h-[160px] text-slate-800 dark:text-slate-200 resize-y"
                          />

                          {/* Character count footer */}
                          <div className="px-3 py-1.5 bg-white dark:bg-slate-900 border-t dark:border-slate-800 text-right text-[10px] text-slate-450 font-bold">
                            {templateMessage.length} characters
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-1.5 text-left">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">
                          Status <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={templateStatus}
                            onChange={(e) => setTemplateStatus(e.target.value)}
                            className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-855 dark:text-slate-205 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Right Column fields */}
                    <div className="space-y-4">
                      {/* Notification Type */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-1.5 text-left">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                          Notification Type <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={templateType}
                            onChange={(e) => setTemplateType(e.target.value)}
                            className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-855 dark:text-slate-200 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="">Select notification type</option>
                            <option value="Alert">Alert Notification</option>
                            <option value="Approval">Approval Request</option>
                            <option value="Success">Success notice</option>
                            <option value="Information">Information alert</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-1.5 text-left">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-350">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          placeholder="Enter subject"
                          value={templateSubject}
                          onChange={(e) => setTemplateSubject(e.target.value)}
                          className="h-10 text-xs font-semibold rounded-[5px] border-slate-200 dark:border-slate-700 dark:bg-slate-950 focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                      </div>

                      {/* Variables list & table builder */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-3 text-left">
                        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355 flex items-center gap-1">
                            Variables <span title="These placeholders replace dynamically when notification goes out"><Info className="h-3.5 w-3.5 text-slate-400 cursor-help" /></span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setNewVarName('{{}}');
                              setNewVarDesc('');
                              setIsAddingVarInline(true);
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-transparent border-0"
                          >
                            + Add Variable
                          </button>
                        </div>

                        {/* Variables sub-table */}
                        <div className="border dark:border-slate-800 rounded-[5px] overflow-hidden bg-slate-50 dark:bg-slate-950">
                          <table className="w-full text-left text-xs font-semibold border-collapse">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-900 border-b dark:border-slate-800 text-slate-500 text-[10px] uppercase font-black">
                                <th className="p-2 w-2/5">Variable Name</th>
                                <th className="p-2 w-1/2">Description</th>
                                <th className="p-2 text-center w-12">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {templateVariables.map((v, i) => (
                                <tr key={i} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900">
                                  <td className="p-2 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                                    <button
                                      type="button"
                                      onClick={() => insertVariable(v.name)}
                                      className="hover:underline text-left cursor-pointer bg-transparent border-0"
                                      title="Click to insert at cursor"
                                    >
                                      {v.name}
                                    </button>
                                  </td>
                                  <td className="p-2 text-[10px] text-slate-650 dark:text-slate-400">{v.description}</td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => setTemplateVariables(templateVariables.filter((_, idx) => idx !== i))}
                                      className="text-slate-400 hover:text-rose-600 cursor-pointer bg-transparent border-0"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}

                              {/* Inline Variable creation row */}
                              {isAddingVarInline && (
                                <tr className="bg-blue-50/40 dark:bg-blue-950/20">
                                  <td className="p-1">
                                    <Input
                                      value={newVarName}
                                      onChange={(e) => setNewVarName(e.target.value)}
                                      className="h-7 text-[10px] rounded-[3px] border-slate-200 dark:border-slate-800"
                                      placeholder="e.g. {{CustomerName}}"
                                      autoFocus
                                    />
                                  </td>
                                  <td className="p-1">
                                    <Input
                                      value={newVarDesc}
                                      onChange={(e) => setNewVarDesc(e.target.value)}
                                      className="h-7 text-[10px] rounded-[3px] border-slate-200 dark:border-slate-800"
                                      placeholder="e.g. Customer Full Name"
                                    />
                                  </td>
                                  <td className="p-1 flex items-center justify-center gap-1.5 h-9">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!newVarName.trim()) {
                                          toast.error('Variable Name required');
                                          return;
                                        }
                                        let finalName = newVarName;
                                        if (!finalName.startsWith('{{')) finalName = '{{' + finalName;
                                        if (!finalName.endsWith('}}')) finalName = finalName + '}}';

                                        setTemplateVariables([...templateVariables, { name: finalName, description: newVarDesc }]);
                                        setIsAddingVarInline(false);
                                      }}
                                      className="text-emerald-600 hover:text-emerald-700 font-bold bg-transparent border-0 cursor-pointer"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setIsAddingVarInline(false)}
                                      className="text-slate-400 hover:text-rose-500 bg-transparent border-0 cursor-pointer"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Language */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-1.5 text-left">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">
                          Language <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <select
                            value={templateLanguage}
                            onChange={(e) => setTemplateLanguage(e.target.value)}
                            className="w-full h-10 pl-3 pr-8 text-xs font-semibold text-slate-855 dark:text-slate-250 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="English">English</option>
                            <option value="Spanish">Spanish</option>
                            <option value="Tamil">Tamil</option>
                            <option value="Hindi">Hindi</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[5px] shadow-3xs space-y-1.5 text-left">
                        <label className="text-xs font-extrabold text-slate-700 dark:text-slate-355">Priority <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <select
                            value={templatePriority}
                            onChange={(e) => setTemplatePriority(e.target.value)}
                            className="w-full h-10 pl-10 pr-8 text-xs font-semibold text-slate-855 dark:text-slate-250 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-700 rounded-[5px] focus:outline-none appearance-none cursor-pointer"
                          >
                            <option value="Low">Low Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="High">High Priority</option>
                            <option value="Critical">Critical Priority</option>
                          </select>
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                            <Flag className={`h-4 w-4 ${templatePriority === 'High' || templatePriority === 'Critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                          </div>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px] p-4 flex justify-between gap-3 shadow-3xs">
                    {/* Left: Preview Trigger */}
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="h-10 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 text-xs font-bold rounded-[5px] cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="h-4 w-4" /> Preview Notification
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={resetTemplateForm}
                        disabled={isSubmitting}
                        className="h-10 border-slate-200 hover:bg-slate-50 dark:border-slate-800 text-xs font-bold rounded-[5px] cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveTemplate}
                        disabled={isSubmitting}
                        style={{ backgroundColor: primaryColor }}
                        className="text-white font-bold rounded-[5px] h-10 px-6 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="h-4 w-4" /> {isSubmitting ? 'Processing...' : (editingTemplate ? 'Update Template' : 'Save Template')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ─── TAB: NOTIFICATIONS ─── */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {!isCreatingNotification ? (
                <>
                  {/* List toolbar */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-[5px] shadow-3xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search notifications..."
                        value={notifSearchQuery}
                        onChange={e => setNotifSearchQuery(e.target.value)}
                        className="pl-9 h-9 text-xs rounded-[5px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus-visible:ring-1"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        resetNotificationForm();
                        setIsCreatingNotification(true);
                      }}
                      style={{ backgroundColor: primaryColor }}
                      className="text-white font-bold text-xs h-9 px-4 rounded-[5px] flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-all"
                    >
                      <Plus className="h-4 w-4" /> Create Notification
                    </Button>
                  </div>

                  {/* Notifications list table */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4">
                    <ReusableTable
                      columns={notificationColumns}
                      data={filteredNotifications}
                      loading={false}
                      initialPageSize={10}
                    />
                  </div>
                </>
              ) : (
                /* ─── CREATE / EDIT FORM ─── */
                <div className="space-y-4">
                  {/* Form header */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-black text-slate-800 dark:text-slate-100">
                        {editingNotification ? 'Edit Notification' : 'Create Notification'}
                      </h2>
                      <p className="text-[11px] text-slate-450 font-semibold mt-0.5">Create and manage notification templates</p>
                    </div>
                    <div className="text-[11px] font-bold text-slate-450">
                      <span className="text-blue-500 cursor-pointer" onClick={resetNotificationForm}>Notifications</span>
                      <span className="mx-1.5">›</span>
                      <span className="text-slate-600 dark:text-slate-300">{editingNotification ? 'Edit Notification' : 'Create Notification'}</span>
                    </div>
                  </div>

                  {/* Template Picker */}
                  <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-[5px] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <MessageSquare className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">Use Template</span>
                    </div>
                    <div className="relative flex-1 w-full">
                      <select
                        value={selectedTemplateId}
                        onChange={e => {
                          const id = e.target.value;
                          setSelectedTemplateId(id);
                          if (!id) return;
                          const tpl = dropdownTemplates.find(t => t.id === id);
                          if (!tpl) return;
                          setNotifName(tpl.name);
                          setNotifType(tpl.type);
                          setNotifModule(tpl.module);
                          setNotifSubject(tpl.subject);
                          setNotifMessage(tpl.message);
                          setNotifLanguage(tpl.language);
                          setNotifPriority(tpl.priority);
                          setNotifStatus(tpl.status);
                        }}
                        className="w-full h-9 pl-3 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-955 border border-blue-200 dark:border-blue-800 rounded-[5px] focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer"
                      >
                        <option value="">— Select a template to auto-fill —</option>
                        {dropdownTemplates.map(t => (
                          <option key={t.id} value={t.id}>{t.name} ({t.type})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => setSelectedTemplateId('')}
                        className="text-[10px] font-black text-slate-400 hover:text-rose-500 flex items-center gap-1 shrink-0 bg-transparent border-0 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Clear
                      </button>
                    )}
                  </div>

                  {/* Row 1: Name + Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Notification Name <span className="text-rose-500">*</span></label>
                      <Input
                        placeholder="Enter notification name"
                        value={notifName}
                        onChange={e => setNotifName(e.target.value)}
                        className="h-9 text-xs rounded-[5px] border-slate-200 dark:border-slate-800 focus-visible:ring-1"
                      />
                    </div>
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Notification Type <span className="text-rose-500">*</span></label>
                      <select
                        value={notifType}
                        onChange={e => setNotifType(e.target.value)}
                        className="w-full h-9 text-xs rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-3 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                      >
                        {['Alert', 'Approval', 'Success', 'Information', 'Reminder', 'Warning'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Module + Subject */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Module <span className="text-rose-500">*</span></label>
                      <select
                        value={notifModule}
                        onChange={e => setNotifModule(e.target.value)}
                        className="w-full h-9 text-xs rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-3 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                      >
                        {['Opportunity', 'Leads', 'Finance', 'Sales', 'Support', 'Project', 'Marketing', 'HR', 'Inventory'].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Subject <span className="text-rose-500">*</span></label>
                      <Input
                        placeholder="Enter subject"
                        value={notifSubject}
                        onChange={e => setNotifSubject(e.target.value)}
                        className="h-9 text-xs rounded-[5px] border-slate-200 dark:border-slate-800 focus-visible:ring-1"
                      />
                    </div>
                  </div>

                  {/* Row 3: Message */}
                  <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Message <span className="text-rose-500">*</span></label>
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 border border-slate-200 dark:border-slate-800 rounded-t-[5px] bg-slate-50 dark:bg-slate-950">
                      {[{ label: 'B', cls: 'font-black' }, { label: 'I', cls: 'italic' }, { label: 'U', cls: 'underline' }].map(btn => (
                        <button key={btn.label} type="button" className={`w-7 h-7 text-xs ${btn.cls} text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[5px] cursor-pointer flex items-center justify-center transition-colors`}>
                          {btn.label}
                        </button>
                      ))}
                      <span className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                      <Globe className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600 ml-1" />
                      <Flag className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-slate-600 ml-1" />
                    </div>
                    <textarea
                      id="notif-message-textarea"
                      rows={7}
                      value={notifMessage}
                      onChange={e => setNotifMessage(e.target.value)}
                      placeholder="Enter message content..."
                      className="w-full text-xs border border-t-0 border-slate-200 dark:border-slate-800 rounded-b-[5px] p-3 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <p className="text-[10px] text-slate-400 text-right font-semibold">{notifMessage.length} characters</p>
                  </div>

                  {/* Row 4: Language + Notification Rule */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Language <span className="text-rose-500">*</span></label>
                      <select
                        value={notifLanguage}
                        onChange={e => setNotifLanguage(e.target.value)}
                        className="w-full h-9 text-xs rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-3 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                      >
                        {['English', 'Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Arabic', 'French'].map(l => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Notification Rule</label>
                      <div className="relative">
                        <select
                          value={selectedRuleId}
                          onChange={e => setSelectedRuleId(e.target.value)}
                          className="w-full h-9 pl-3 pr-8 text-xs rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none cursor-pointer"
                        >
                          <option value="">— Select a Notification Rule —</option>
                          {dropdownRules.map(r => (
                            <option key={r.id} value={r.id}>{r.Rule_Name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Status + Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Status <span className="text-rose-500">*</span></label>
                      <select
                        value={notifStatus}
                        onChange={e => setNotifStatus(e.target.value)}
                        className="w-full h-9 text-xs rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-3 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4 space-y-2">
                      <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Priority <span className="text-rose-500">*</span></label>
                      <select
                        value={notifPriority}
                        onChange={e => setNotifPriority(e.target.value)}
                        className="w-full h-9 text-xs rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-3 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
                      >
                        {[
                          { value: 'Critical', label: '🔴 Critical' },
                          { value: 'High', label: '🚩 High' },
                          { value: 'Medium', label: '🔵 Medium' },
                          { value: 'Low', label: '⚪ Low' }
                        ].map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px] p-4 flex justify-end gap-3 shadow-3xs">
                    <Button
                      variant="outline"
                      onClick={resetNotificationForm}
                      className="h-10 border-slate-200 hover:bg-slate-50 dark:border-slate-800 text-xs font-bold rounded-[5px] cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { resetNotificationForm(); toast.success('Saved as draft'); }}
                      className="h-10 border-slate-300 hover:bg-slate-50 dark:border-slate-700 text-xs font-bold rounded-[5px] cursor-pointer"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      onClick={handleSaveNotification}
                      style={{ backgroundColor: primaryColor }}
                      className="text-white font-bold rounded-[5px] h-10 px-6 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" /> {editingNotification ? 'Update Notification' : 'Save Notification'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* TEMPLATE PREVIEW MODAL */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-[5px] p-6 text-left">
          <DialogHeader className="border-b dark:border-slate-850 pb-3">
            <DialogTitle className="text-sm font-black flex items-center gap-2">
              <Eye className="h-4.5 w-4.5 text-blue-500" />
              Live Preview: {templateName || 'Untitled Notification'}
            </DialogTitle>
          </DialogHeader>

          {/* Preview Channels Selector Tabs */}
          <div className="flex gap-2 py-3">
            {templateChannels.email && (
              <button
                type="button"
                onClick={() => setPreviewChannelTab('email')}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-[5px] flex items-center gap-1.5 cursor-pointer border-0 ${previewChannelTab === 'email'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent'
                  }`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
            )}

            {(templateChannels.sms || templateChannels.whatsapp) && (
              <button
                type="button"
                onClick={() => setPreviewChannelTab('mobile')}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-[5px] flex items-center gap-1.5 cursor-pointer border-0 ${previewChannelTab === 'mobile'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent'
                  }`}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            )}

            {templateChannels.inApp && (
              <button
                type="button"
                onClick={() => setPreviewChannelTab('inapp')}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-[5px] flex items-center gap-1.5 cursor-pointer border-0 ${previewChannelTab === 'inapp'
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent'
                  }`}
              >
                <Bell className="h-3.5 w-3.5" /> In-App Alert
              </button>
            )}
          </div>

          {/* Preview simulated containers */}
          <div className="py-2 min-h-[300px] flex items-center justify-center bg-slate-50 dark:bg-slate-950/50 rounded-[5px] border dark:border-slate-850 p-4">
            {/* Email Preview Client */}
            {previewChannelTab === 'email' && (
              <div className="w-full bg-white dark:bg-slate-900 border dark:border-slate-850 rounded-[5px] shadow-sm overflow-hidden text-xs">
                {/* Email Client Header */}
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 border-b dark:border-slate-800 font-semibold space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-450">Subject:</span>
                    <span className="text-slate-855 dark:text-white font-extrabold">
                      {templateSubject || 'No Subject entered'}
                    </span>
                  </div>
                </div>
                {/* Email Client HTML Body */}
                <div className="p-5 text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-line text-left min-h-[150px]">
                  {templateMessage || 'Enter message template details on the editor form to generate preview.'}
                </div>
              </div>
            )}

            {/* Mobile Device Preview Mock */}
            {previewChannelTab === 'mobile' && (
              <div className="w-[300px] h-[360px] border-[6px] border-slate-800 dark:border-slate-700 rounded-[28px] bg-slate-955 flex flex-col overflow-hidden relative shadow-md">
                {/* Phone Speaker & Notch */}
                <div className="h-5 bg-slate-800 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <div className="w-16 h-2 bg-slate-955 rounded-full" />
                </div>

                {/* Phone Screen body */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-3 flex flex-col justify-end pb-8 relative pt-10">
                  {/* Simulated App header */}
                  <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md absolute top-0 left-0 right-0 p-2 text-center text-[10px] font-black border-b border-slate-200 dark:border-slate-700 z-10">
                    {templateChannels.whatsapp ? 'WhatsApp Business' : 'SMS Messages'}
                  </div>

                  {/* Chat bubble mock */}
                  <div className="max-w-[85%] bg-white dark:bg-slate-800 border dark:border-slate-750 text-slate-800 dark:text-slate-200 p-3 rounded-[12px] rounded-bl-none text-[11px] font-medium leading-relaxed whitespace-pre-line text-left shadow-2xs">
                    {templateMessage || 'Message body placeholder...'}
                    <span className="block text-[8px] text-slate-400 text-right mt-1.5">12:30 PM</span>
                  </div>
                </div>
              </div>
            )}

            {/* In-App Bell banner toast */}
            {previewChannelTab === 'inapp' && (
              <div className="w-80 bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-[5px] shadow-md text-xs text-left space-y-2 flex items-start gap-3">
                <div className="p-2 bg-blue-50 dark:bg-slate-800 rounded-full shrink-0">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-855 dark:text-white">
                    {templateSubject || 'In-App Notification Title'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                    {templateMessage || 'No message entered'}
                  </p>
                  <span className="block text-[9px] text-slate-400 font-bold">Just Now</span>
                </div>
              </div>
            )}

          </div>

          <DialogFooter className="mt-4 border-t dark:border-slate-850 pt-3 flex justify-end">
            <Button
              onClick={() => setIsPreviewOpen(false)}
              className="text-xs font-semibold rounded-[5px]"
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE MODAL */}
      {ruleToDelete && (
        <ConfirmDeleteDialog
          isOpen={!!ruleToDelete}
          onClose={() => setRuleToDelete(null)}
          onConfirm={() => handleDeleteRule(ruleToDelete.id)}
          title="Remove Notification Rule"
          description={`Are you sure you want to permanently delete the rule "${ruleToDelete.name}"? This action cannot be undone.`}
        />
      )}
    </motion.div>
  );
}
