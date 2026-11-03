'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDealStore, Deal } from '@/store/useDealStore';
import { useStore } from '@/store/useStore';
import { createDeal as createDealApi } from '@/service/api/deal/api';
import { fetchCustomForms } from '@/service/api/Customization/api';
import { fetchUserQualifiedLeadListWithoutPagination, fetchUsersList } from '@/service/api/Leads/api';
import { fetchAccountFullList } from '@/service/api/Company/api';
import {
  Building,
  User,
  Mail,
  Calendar,
  Plus,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  AlertCircle,
  FileText,
  AlignLeft,
  AlignCenter,
  ArrowLeft,
  Split
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';
import { motion, AnimatePresence } from 'motion/react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function CreateDealPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { addDeal } = useDealStore();
  const { canCreateDeal } = usePermission();

  useEffect(() => {
    if (!canCreateDeal) {
      toast.error('You do not have permission to access the Create Deal page.');
      router.push('/Deal');
    }
  }, [canCreateDeal, router]);

  if (!canCreateDeal) {
    return null;
  }

  const [isLoading, setIsLoading] = useState(true);

  // Trigger Skeleton Loading on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Basic Information States
  const [dealName, setDealName] = useState('');
  const [stage, setStage] = useState<'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'>('Qualification');
  const [currency, setCurrency] = useState('BDT (₹)');
  const [dealValue, setDealValue] = useState('');
  const [expectedClose, setExpectedClose] = useState('');
  const [probability, setProbability] = useState('10');
  const [owner, setOwner] = useState('');
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);

  // Related Information States
  const [company, setCompany] = useState('');
  const [accountList, setAccountList] = useState<Array<{ id: number; name: string }>>([]);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('Website');

  const [qualifiedLeads, setQualifiedLeads] = useState<any[]>([]);
  const [sourceOptions, setSourceOptions] = useState<string[]>([
    'Select source',
    'Website',
    'Referral',
    'Google Ads',
    'Cold Email',
    'Organic'
  ]);

  // Notes & Description
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<number | null>(null);
  const [contactId, setContactId] = useState<number | null>(null);

  // Custom Form States
  const [activeForm, setActiveForm] = useState<any | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});

  const renderCustomField = (field: any) => {
    if (field.type === 'section') {
      return (
        <div key={field.id} className="col-span-1 md:col-span-2 pt-3 pb-1 border-b border-slate-150 dark:border-slate-800 mt-2 text-left">
          <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Split className="h-3.5 w-3.5 text-blue-500" />
            {field.label}
          </h4>
          {field.helpText && (
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {field.helpText}
            </p>
          )}
        </div>
      );
    }

    const hasError = customErrors[field.id];

    return (
      <div key={field.id} className={`space-y-1 text-left ${field.type === 'textarea' ? 'col-span-1 md:col-span-2' : ''}`}>
        <div className="flex justify-between items-center">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </label>
          {hasError && (
            <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
              <AlertCircle className="h-3 w-3 animate-pulse" />
              {hasError}
            </span>
          )}
        </div>

        {/* Render inputs based on type */}
        {field.type === 'textarea' ? (
          <textarea
            value={customValues[field.id] || ''}
            onChange={(e) => {
              setCustomValues({ ...customValues, [field.id]: e.target.value });
              if (customErrors[field.id]) {
                setCustomErrors({ ...customErrors, [field.id]: '' });
              }
            }}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            className={`w-full min-h-[80px] p-3 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 dark:text-slate-200 ${hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
              }`}
          />
        ) : field.type === 'dropdown' ? (
          <div className="relative">
            <select
              value={customValues[field.id] || ''}
              onChange={(e) => {
                setCustomValues({ ...customValues, [field.id]: e.target.value });
                if (customErrors[field.id]) {
                  setCustomErrors({ ...customErrors, [field.id]: '' });
                }
              }}
              className={`w-full h-10 pl-3 pr-10 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-855 dark:text-slate-100 cursor-pointer ${hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
                }`}
            >
              <option value="">Select option</option>
              {field.options && field.options.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        ) : field.type === 'checkbox' || field.type === 'radio' ? (
          <div className="flex flex-col gap-2 pt-2 pb-1">
            {(field.options && field.options.length > 0 ? field.options : [field.placeholder || `Check if ${field.label.toLowerCase()}`]).map((opt: string, oIdx: number) => (
              <div key={oIdx} className="flex items-center gap-2">
                <input
                  type={field.type}
                  id={`custom-${field.id}-${oIdx}`}
                  name={`custom-${field.id}`}
                  value={opt}
                  checked={field.type === 'radio' ? customValues[field.id] === opt : (customValues[field.id] || '').split(',').includes(opt)}
                  onChange={(e) => {
                    if (field.type === 'radio') {
                      setCustomValues({ ...customValues, [field.id]: opt });
                    } else {
                      let current = (customValues[field.id] || '').split(',').filter(Boolean);
                      if (e.target.checked) current.push(opt);
                      else current = current.filter((c: string) => c !== opt);
                      setCustomValues({ ...customValues, [field.id]: current.join(',') });
                    }
                    if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
                  }}
                  className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
                />
                <label htmlFor={`custom-${field.id}-${oIdx}`} className="text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer select-none">
                  {opt}
                </label>
              </div>
            ))}
          </div>
        ) : field.type === 'multi-select' ? (
          <select
            multiple
            value={(customValues[field.id] || '').split(',').filter(Boolean)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              setCustomValues({ ...customValues, [field.id]: selected.join(',') });
              if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
            }}
            className={`w-full text-xs p-2 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 dark:text-slate-100 cursor-pointer ${
              hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
            }`}
            style={{ minHeight: '80px' }}
          >
            {(field.options && field.options.length > 0 ? field.options : ['Option 1']).map((opt: string) => (
              <option key={opt} value={opt} className="p-1 mb-0.5">{opt}</option>
            ))}
          </select>
        ) : field.type === 'date' || field.type === 'datetime' || field.type === 'time' ? (
          <Input
            type={field.type === 'time' ? 'time' : field.type === 'datetime' ? 'datetime-local' : 'date'}
            value={customValues[field.id] || ''}
            onChange={(e) => {
              setCustomValues({ ...customValues, [field.id]: e.target.value });
              if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
            }}
            className={`h-10 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-slate-800 dark:text-slate-100 ${
              hasError ? 'border-red-500 focus-visible:ring-red-400' : 'border-slate-200 dark:border-slate-800'
            }`}
          />
        ) : (
          // Default input text / email / phone / number
          <Input
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
            value={customValues[field.id] || ''}
            onChange={(e) => {
              setCustomValues({ ...customValues, [field.id]: e.target.value });
              if (customErrors[field.id]) {
                setCustomErrors({ ...customErrors, [field.id]: '' });
              }
            }}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            className={`h-10 text-xs bg-slate-50 dark:bg-slate-900 border rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-slate-800 dark:text-slate-100 ${hasError ? 'border-red-500 focus-visible:ring-red-400' : 'border-slate-200 dark:border-slate-800'
              }`}
          />
        )}

        {field.helpText && !hasError && (
          <p className="text-[10px] text-slate-405 font-medium pl-0.5 mt-0.5">
            {field.helpText}
          </p>
        )}
      </div>
    );
  };

  useEffect(() => {
    async function loadActiveForm() {
      try {
        const formsList = await fetchCustomForms();
        const activeDealsForm = formsList.find(f => f.module === 'Deals' && f.status === 'Active');
        if (activeDealsForm) {
          setActiveForm(activeDealsForm);
          const initialVals: Record<string, string> = {};
          activeDealsForm.fields.forEach((f: any) => {
            initialVals[f.id] = '';
          });
          setCustomValues(initialVals);
        }
      } catch (e) {
        console.error("Failed to load active custom form for Deals:", e);
      }
    }
    async function loadQualifiedLeads() {
      try {
        const data = await fetchUserQualifiedLeadListWithoutPagination();
        if (Array.isArray(data)) {
          setQualifiedLeads(data);
        }
      } catch (e) {
        console.error("Failed to load qualified leads:", e);
      }
    }
    async function loadCompanies() {
      try {
        const data = await fetchAccountFullList();
        const list = Array.isArray(data) ? data : (data?.results || data?.data || []);
        const mapped = list.map((a: any) => ({
          id: a.id,
          name: a.Organization_Name || a.Company_Name || a.companyName || a.Account_Name || a.Contact_Name || a.Lead_Name || ''
        })).filter((item: any) => item.name && item.id);
        setAccountList(mapped);
      } catch (e) {
        console.error("Failed to load company list:", e);
      }
    }
    async function loadUsers() {
      try {
        const res = await fetchUsersList();
        const list = res?.results || res || [];
        const mapped = list.map((u: any) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'Unknown'
        })).filter((u: any) => u.name);
        setUsers(mapped);
      } catch (e) {
        console.error('Failed to load users:', e);
      }
    }
    loadActiveForm();
    loadQualifiedLeads();
    loadCompanies();
    loadUsers();
  }, []);

  const handleOwnerChange = (val: string) => {
    if (val.startsWith('lead-')) {
      const leadIdVal = parseInt(val.replace('lead-', ''), 10);
      const selectedLead = qualifiedLeads.find(l => l.id === leadIdVal);
      if (selectedLead) {
        setLeadId(leadIdVal);
        setContactId(selectedLead.Contact_Id || null);
        setOwner(selectedLead.Lead_Owner || 'Sadia Afrin');
        setCompany(selectedLead.CompanyName || '');
        setContact(`${selectedLead.LeadFirstName || ''} ${selectedLead.LeadLastName || ''}`.trim());
        setPhone(selectedLead.PhoneNo || '');

        if (selectedLead.LeadSource) {
          if (!sourceOptions.includes(selectedLead.LeadSource)) {
            setSourceOptions(prev => [...prev, selectedLead.LeadSource]);
          }
          setSource(selectedLead.LeadSource);
        }

        toast.success(`Autofilled details for lead ${selectedLead.LeadFirstName} ${selectedLead.LeadLastName}`);
      }
    } else {
      setOwner(val);
    }
  };

  // Right column states
  const [pipeline, setPipeline] = useState('Default Pipeline');
  const [isCustomFieldsOpen, setIsCustomFieldsOpen] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName.trim() || !company.trim() || !dealValue || !expectedClose) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }

    // Validate custom fields
    let hasCustomErrors = false;
    const errors: Record<string, string> = {};
    if (activeForm && activeForm.fields) {
      activeForm.fields.forEach((f: any) => {
        if (f.type !== 'section' && f.required && !(customValues[f.id] || '').trim()) {
          errors[f.id] = `${f.label} is required.`;
          hasCustomErrors = true;
        }
      });
    }
    if (hasCustomErrors) {
      setCustomErrors(errors);
      toast.error('Please fill in all required custom fields.');
      return;
    }

    // Build Deal_Json payload
    const dealJson: Record<string, any> = {};
    if (activeForm && activeForm.fields) {
      activeForm.fields.forEach((field: any) => {
        if (field.type !== 'section') {
          if (field.type === 'checkbox') {
            dealJson[field.label] = customValues[field.id] === 'true';
          } else {
            dealJson[field.label] = customValues[field.id] || "";
          }
        }
      });
    }

    const valueNum = parseFloat(dealValue) || 0;
    const probNum = parseInt(probability) || 10;
    const initials = company.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
    const contInitials = contact ? contact.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'CT';

    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId) : 71;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;

    const apiPayload = {
      Deal_Code: "",
      Deal_Name: dealName,
      Deal_Type: stage === 'Closed Won' ? 'Won' : stage === 'Closed Lost' ? 'Lost' : 'Open',
      Account_Name: company,
      Account_Id: accountId || null,
      Lead_Name: company,
      Contact_Person: contact || 'N/A',
      Phoene: phone || null,
      Amount: valueNum,
      Deal_Owner: owner,
      DealScore: 0.0,
      ApproxDealAmount: 0.0,
      ActualDealAmount: 0.0,
      MinimumTurnOver: 0.0,
      Current_Status: null,
      Deal_Stage: stage,
      Lost_Reason: null,
      Lead_Source: source,
      Deal_Competitor: {},
      Deal_Probablity: `${probNum} %`,
      Probability_Id: 0,
      Next_Step: null,
      Deal_Note: description || `${dealName} opportunity for ${company}.`,
      ExpClosing_Date: expectedClose ? `${expectedClose}T00:00:00Z` : new Date().toISOString(),
      Recommaned_Action: null,
      Prediction: null,
      Active_Flag: true,
      Is_Deleted: false,
      Deal_Json: dealJson,
      Won_Deal_Date: stage === 'Closed Won' ? new Date().toISOString().split('T')[0] : null,
      Created_Date: new Date().toISOString().split('T')[0],
      Updated_Date: new Date().toISOString().split('T')[0],
      Pipeline_Name: null,
      Campaign_Name: null,
      Organization_Id: 1,
      Lead_Id: leadId,
      Created_By: userId,
      Contact_Id: contactId,
      UserLeadfromCampaign_Id: null,
      SocialMediaCampaign_Id: null,
      Updated_By: userId
    };

    createDealApi(apiPayload, token)
      .then((res) => {
        // Invalidate Zustand cache
        useDealStore.getState().clearCache();

        const newDeal: Deal = {
          id: (res.id || `DEAL-${Math.floor(810 + Math.random() * 190)}`).toString(),
          name: dealName,
          stage,
          company,
          companyInitials: initials || 'CO',
          companyBgColor: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400',
          contactName: contact || 'N/A',
          contactEmail: contact ? `${contact.toLowerCase().replace(/ /g, '')}@company.com` : 'N/A',
          contactPhone: phone || 'N/A',
          contactRole: contact ? `Representative, ${company}` : 'N/A',
          contactInitials: contInitials || 'CT',
          contactBgColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
          dealValue: valueNum,
          expectedClose,
          probability: probNum,
          owner,
          ownerInitials: owner ? owner.split(' ').map(w => w[0]).join('').toUpperCase() : 'OW',
          ownerAvatarColor: 'bg-emerald-500 text-white',
          createdOn: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString().split('T')[0],
          currency,
          currencySymbol: currency.includes('BDT') ? '₹' : '$',
          summary: description || `${dealName} opportunity for ${company}. Estimated project requirements and licensing structure.`,
          source,
          internalNotes: 'Initial contact made. Detailed notes will follow commercial negotiations.',
          activities: [
            {
              id: `EV-${Date.now()}`,
              type: 'Deal created',
              details: `Deal record initialized with BDT ${valueNum.toLocaleString()} value.`,
              date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              user: owner,
              color: 'bg-emerald-500',
              category: 'create'
            }
          ],
          tasksList: [],
          documentsList: [],
          Deal_Json: dealJson
        };

        addDeal(newDeal);
        toast.success(`Deal created successfully!`);

        if (createAnother) {
          // Clear forms
          setDealName('');
          setDealValue('');
          setExpectedClose('');
          setProbability('10');
          setCompany('');
          setContact('');
          setPhone('');
          setDescription('');
          const cleared: Record<string, string> = {};
          if (activeForm && activeForm.fields) {
            activeForm.fields.forEach((f: any) => {
              cleared[f.id] = '';
            });
          }
          setCustomValues(cleared);
          setCustomErrors({});
        } else {
          router.push('/Deal');
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to create deal on server.');
      });
  };

  const getUnifiedFieldsForSection = (section: string) => {
    let stdFields: any[] = [];
    if (section === 'Basic Information') {
      stdFields = [
        {
          id: 'std-deal-name', sectionPlacement: 'Basic Information', isStandard: true, orderIndex: 10, render: () => (
            <div className="space-y-1" key="std-deal-name">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Deal Name <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="Enter deal name"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                required
                className="h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          )
        },
        {
          id: 'std-deal-stage', sectionPlacement: 'Basic Information', isStandard: true, orderIndex: 20, render: () => (
            <div className="space-y-1" key="std-deal-stage">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Pipeline Stage <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full h-10 pl-3 pr-10 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer"
                >
                  <option value="Qualification">Qualification</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Closed Won">Closed Won</option>
                  <option value="Closed Lost">Closed Lost</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )
        },
        {
          id: 'std-deal-value', sectionPlacement: 'Basic Information', isStandard: true, orderIndex: 30, render: () => (
            <div className="space-y-1" key="std-deal-value">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Deal Value <span className="text-rose-500">*</span>
              </label>
              <div className="flex border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                <div className="relative shrink-0 border-r border-slate-200 dark:border-slate-800">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="h-10 pl-3 pr-8 bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="BDT (₹)">BDT (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
                <Input
                  placeholder="0.00"
                  type="number"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  required
                  className="h-10 text-xs bg-transparent border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 font-mono font-bold text-slate-850 dark:text-slate-100"
                />
              </div>
            </div>
          )
        },
        {
          id: 'std-deal-close', sectionPlacement: 'Basic Information', isStandard: true, orderIndex: 40, render: () => (
            <div className="space-y-1" key="std-deal-close">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Expected Close Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  value={expectedClose}
                  onChange={(e) => setExpectedClose(e.target.value)}
                  required
                  className="h-10 pl-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                />
              </div>
            </div>
          )
        },
        {
          id: 'std-deal-prob', sectionPlacement: 'Basic Information', isStandard: true, orderIndex: 50, render: () => (
            <div className="space-y-1" key="std-deal-prob">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                Probability (%)
                <HelpCircle className="h-3.5 w-3.5 text-slate-400 opacity-60" />
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(e.target.value)}
                  className="h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl pr-10 font-mono font-bold text-slate-850 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
              </div>
            </div>
          )
        },
        {
          id: 'std-deal-owner', sectionPlacement: 'Basic Information', isStandard: true, orderIndex: 60, render: () => (
            <div className="space-y-1" key="std-deal-owner">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Deal Owner <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={ownerId?.toString() || ''}
                  onChange={(e) => {
                    const selectedId = parseInt(e.target.value, 10);
                    const selectedUser = users.find(u => u.id === selectedId);
                    setOwnerId(selectedId || null);
                    setOwner(selectedUser?.name || '');
                  }}
                  className="w-full h-10 pl-3 pr-10 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-855 dark:text-slate-100 cursor-pointer"
                >
                  <option value="">Select Deal Owner</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id.toString()}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )
        }
      ];
    } else if (section === 'Related Information') {
      stdFields = [
        {
          id: 'std-deal-company', sectionPlacement: 'Related Information', isStandard: true, orderIndex: 70, render: () => (
            <div className="space-y-1" key="std-deal-company">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Company <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={company}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setCompany(selectedName);
                    const found = accountList.find(acc => acc.name === selectedName);
                    setAccountId(found ? found.id : null);
                  }}
                  required
                  className="w-full h-10 pl-3 pr-10 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-855 dark:text-slate-100 cursor-pointer"
                >
                  <option value="">Select Company Name</option>
                  {company && !accountList.some(acc => acc.name === company) && (
                    <option value={company}>{company}</option>
                  )}
                  {accountList.map((acc) => (
                    <option key={`${acc.id}-${acc.name}`} value={acc.name}>
                      {acc.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )
        },
        {
          id: 'std-deal-contact', sectionPlacement: 'Related Information', isStandard: true, orderIndex: 80, render: () => (
            <div className="space-y-1" key="std-deal-contact">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Contact
              </label>
              <Input
                placeholder="Search and select contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          )
        },
        {
          id: 'std-deal-phone', sectionPlacement: 'Related Information', isStandard: true, orderIndex: 90, render: () => (
            <div className="space-y-1" key="std-deal-phone">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Contact Number
              </label>
              <Input
                placeholder="Enter contact number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 text-slate-800 dark:text-slate-100"
              />
            </div>
          )
        },
        {
          id: 'std-deal-source', sectionPlacement: 'Related Information', isStandard: true, orderIndex: 100, render: () => (
            <div className="space-y-1" key="std-deal-source">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                Source
              </label>
              <div className="relative">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full h-10 pl-3 pr-10 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-850 dark:text-slate-100 cursor-pointer"
                >
                  {sourceOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )
        }
      ];
    } else if (section === 'Description / Notes') {
      stdFields = [
        {
          id: 'std-deal-desc', sectionPlacement: 'Description / Notes', isStandard: true, orderIndex: 110, render: () => (
            <div className="space-y-4 col-span-1 md:col-span-2" key="std-deal-desc">
              <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 p-1.5 rounded-xl">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg">
                  <Underline className="h-4 w-4" />
                </Button>
                <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg">
                  <List className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg">
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg">
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <span className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg">
                  <Link className="h-4 w-4" />
                </Button>
              </div>

              <textarea
                placeholder="Write deal description or any notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[120px] p-3.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 dark:text-slate-200"
              />
            </div>
          )
        }
      ];
    }

    const customFields = activeForm?.fields || [];
    const unified = [...stdFields, ...customFields];

    unified.sort((a, b) => {
      const sectionA = a.sectionPlacement || '';
      const sectionB = b.sectionPlacement || '';
      if (sectionA !== sectionB) return sectionA.localeCompare(sectionB);
      
      const orderA = a.orderIndex !== undefined ? a.orderIndex : 999;
      const orderB = b.orderIndex !== undefined ? b.orderIndex : 999;
      return orderA - orderB;
    });

    return unified.filter(f => (!f.sectionPlacement && section === 'Basic Information') || f.sectionPlacement === section || (section === 'Description / Notes' && f.sectionPlacement === 'Description & Notes'));
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">

        {/* SKELETON LOADER VIEW */}
        {isLoading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
          >
            {/* Header section skeleton */}
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0" />
                <div className="space-y-2">
                  <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
              </div>
            </div>

            {/* Grid forms skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-955 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
                </div>
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-4 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* FORM CONTENT VIEW */}
        {!isLoading && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
          >
            {/* Top Breadcrumb & Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-1.5">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                  onClick={() => router.push('/Deal')}
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </Button>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-semibold space-x-1 flex items-center">
                    <span className="hover:text-slate-700 cursor-pointer transition-colors" onClick={() => router.push('/Deal')}>Deals</span>
                    <span>&gt;</span>
                    <span className="text-slate-600 dark:text-slate-300">New Deal</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">Create New Deal</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">Add deal details and track your sales opportunity.</p>
                </div>
              </div>

              {/* Cancel / Save actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 mr-1">
                  <Checkbox
                    id="create-another-top"
                    checked={createAnother}
                    onCheckedChange={(checked) => setCreateAnother(!!checked)}
                    className="border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="create-another-top" className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none whitespace-nowrap">
                    Create another deal
                  </label>
                </div>
                <Button
                  variant="outline"
                  className="h-10 px-4 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  onClick={() => router.push('/Deal')}
                >
                  Cancel
                </Button>
                <div className="flex items-center shadow-xs rounded-xl overflow-hidden">
                  <Button
                    style={{ backgroundColor: primaryColor }}
                    className="h-10 px-5 text-xs font-bold text-white rounded-r-none hover:opacity-90 border-r border-white/10"
                    onClick={handleSave}
                  >
                    Save Deal
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button
                        style={{ backgroundColor: primaryColor }}
                        size="icon"
                        className="h-10 w-9 text-white rounded-l-none hover:opacity-90 flex items-center justify-center cursor-pointer"
                      >
                        <ChevronDown className="h-4 w-4 text-white" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-44 dark:bg-slate-900 border dark:border-slate-800 text-xs font-semibold">
                      <DropdownMenuItem className="cursor-pointer" onClick={handleSave}>
                        Save & View List
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => { setCreateAnother(true); toast.info('Selected: Create another deal'); }}>
                        Save & Create Another
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Main Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Forms (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">

                {(() => {
                  const defaultOrder = ['Basic Information', 'Related Information', 'Description / Notes'];
                  const customSections = Array.from(new Set(
                    (activeForm?.fields || [])
                      .map((f: any) => f.sectionPlacement)
                      .filter((sp: any) => typeof sp === 'string' && !defaultOrder.includes(sp) && sp !== 'New Section' && sp.trim() !== '')
                  )) as string[];
                  
                  const savedOrder = activeForm?.sectionOrder || (activeForm?.FormSTR && activeForm.FormSTR.sectionOrder) || [];
                  const validSavedOrder = savedOrder.filter((s: string) => defaultOrder.includes(s) || customSections.includes(s));
                  
                  const missingDefaults = defaultOrder.filter(s => !validSavedOrder.includes(s));
                  const missingCustoms = customSections.filter(s => !validSavedOrder.includes(s));
                  
                  const orderedSections = [...validSavedOrder, ...missingDefaults, ...missingCustoms];
                  
                  return orderedSections.map(heading => {
                    const fieldsForSection = getUnifiedFieldsForSection(heading);
                    
                    // Don't render empty custom sections
                    if (fieldsForSection.length === 0 && !defaultOrder.includes(heading)) return null;

                    const sectionField = (activeForm?.fields || []).find((f: any) => f.type === 'section' && f.label === heading);

                    return (
                      <div key={heading} className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-5">
                        <div className="border-b dark:border-slate-900 pb-2">
                          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                            {heading}
                          </h3>
                          {sectionField?.helpText && (
                            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-1">
                              {sectionField.helpText}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {fieldsForSection.map((field: any) => {
                            if (field.isStandard) return field.render();
                            return renderCustomField(field);
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}

              </div>

              {/* Right Sidebar Details (1/3 width) */}
              <div className="space-y-6">

                {/* Pipeline Card */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-850 dark:text-white pb-0.5">
                      Pipeline
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-400">Select the pipeline for this deal.</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Pipeline *</label>
                    <div className="relative">
                      <select
                        value={pipeline}
                        onChange={(e) => setPipeline(e.target.value)}
                        className="w-full h-10 pl-3 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none text-slate-850 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="Default Pipeline">Default Pipeline</option>
                        <option value="Sales Pipeline">Sales Pipeline</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Quick Tips Card */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl p-5 shadow-2xs space-y-4 text-left">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white pb-1">
                    Quick Tips
                  </h3>
                  <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/60 dark:border-blue-900/30 rounded-xl p-4">
                    <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <span>Add accurate deal value for better forecasting.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0 mt-2 ml-1.5" />
                        <span className="pl-0.5">Assign the right owner to keep your team accountable.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0 mt-2 ml-1.5" />
                        <span className="pl-0.5">Update the stage as your deal progresses.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0 mt-2 ml-1.5" />
                        <span className="pl-0.5">Add notes to keep important details in one place.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Custom Fields Card */}
                <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl shadow-2xs overflow-hidden text-left">
                  <button
                    type="button"
                    onClick={() => setIsCustomFieldsOpen(!isCustomFieldsOpen)}
                    className="w-full px-5 py-4 flex items-center justify-between border-b dark:border-slate-900 focus:outline-none cursor-pointer"
                  >
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Custom Fields</span>
                    {isCustomFieldsOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </button>
                  <AnimatePresence initial={false}>
                    {isCustomFieldsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 space-y-3.5 text-xs font-semibold">
                          <div className="flex items-center gap-3">
                            <Checkbox id="field-1" className="border-slate-300" />
                            <label htmlFor="field-1" className="text-slate-700 dark:text-slate-300 cursor-pointer">Requires NDA Signed</label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox id="field-2" className="border-slate-300" />
                            <label htmlFor="field-2" className="text-slate-700 dark:text-slate-300 cursor-pointer">Third-party integration required</label>
                          </div>
                          <div className="flex items-center gap-3">
                            <Checkbox id="field-3" className="border-slate-300" />
                            <label htmlFor="field-3" className="text-slate-700 dark:text-slate-300 cursor-pointer">Multi-year contract potential</label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
