'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Building,
  Globe,
  Star,
  Plus,
  Trash2,
  Users,
  Compass,
  FileText,
  User,
  MapPin,
  Linkedin,
  Twitter,
  Printer,
  CalendarDays,
  Gauge,
  Tag,
  Paperclip,
  Save,
  CheckCircle,
  Eye,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { createUserQualifiedLead, fetchUsersList } from '@/service/api/Leads/api';
import { fetchCustomForms } from '@/service/api/Customization/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Split, CheckSquare, AlertCircle, ChevronDown } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

const leadFormSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  phone: z.string().min(1, 'Phone is required'),
  mobile: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  leadSource: z.string().min(1, 'Lead Source is required'),
  rating: z.string().optional(),
  address: z.string().optional(),

  // Additional info
  noOfEmployees: z.string().optional(),
  annualRevenue: z.string().optional(),
  location: z.string().optional(),
  linkedinProfile: z.string().optional(),
  twitterProfile: z.string().optional(),
  fax: z.string().optional(),
  dateOfBirth: z.string().optional(),
  leadScore: z.string().optional(),
  preferredContactMethod: z.string().optional(),

  // Sidebar info
  owner: z.string().min(1, 'Owner is required'),
  sourceDetails: z.string().optional(),
  noteText: z.string().optional(),
});

type FormValues = z.infer<typeof leadFormSchema>;

export default function LeadCreatePage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { canCreateLead } = usePermission();

  useEffect(() => {
    if (!canCreateLead) {
      toast.error('You do not have permission to access the Create Lead page.');
      router.push('/marketing/leads');
    }
  }, [canCreateLead, router]);

  if (!canCreateLead) {
    return null;
  }

  // Load Lead Owners dynamically
  const [owners, setOwners] = useState<any[]>([]);
  useEffect(() => {
    const loadOwners = async () => {
      try {
        const res = await fetchUsersList();
        setOwners(res.results || res || []);
      } catch (err) {
        console.error('Failed to load owners', err);
      }
    };
    loadOwners();
  }, []);

  // Tags list state
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // File attachments state (base64)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');

  // Custom Form States
  const [activeForm, setActiveForm] = useState<any | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadActiveLeadForm() {
      try {
        const formsList = await fetchCustomForms();
        const activeLeadsForm = formsList.find((f: any) => f.module === 'Leads' && f.status === 'Active');
        if (activeLeadsForm) {
          setActiveForm(activeLeadsForm);
        }
      } catch (e) {
        console.error('Failed to load active custom form for Leads:', e);
      }
    }
    loadActiveLeadForm();
  }, []);

  const renderCustomField = (field: any) => {
    if (field.type === 'section') {
      return (
        <div key={field.id} className="col-span-1 sm:col-span-3 pt-3 pb-1 border-b border-slate-150 dark:border-slate-800 mt-2 text-left">
          <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Split className="h-3.5 w-3.5 text-blue-500" />
            {field.label}
          </h4>
          {field.helpText && (
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{field.helpText}</p>
          )}
        </div>
      );
    }

    const hasError = customErrors[field.id];

    return (
      <div key={field.id} className={`space-y-1 text-left ${field.type === 'textarea' ? 'col-span-1 sm:col-span-3' : ''}`}>
        <div className="flex justify-between items-center">
          <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </Label>
          {hasError && (
            <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
              <AlertCircle className="h-3 w-3 animate-pulse" />
              {hasError}
            </span>
          )}
        </div>

        {field.type === 'textarea' ? (
          <textarea
            value={customValues[field.id] || ''}
            onChange={(e) => {
              setCustomValues({ ...customValues, [field.id]: e.target.value });
              if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
            }}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            className={`w-full min-h-[80px] p-3 text-xs bg-white dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 dark:text-slate-200 ${hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
              }`}
          />
        ) : field.type === 'dropdown' ? (
          <div className="relative">
            <select
              value={customValues[field.id] || ''}
              onChange={(e) => {
                setCustomValues({ ...customValues, [field.id]: e.target.value });
                if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
              }}
              className={`w-full h-10 pl-3 pr-10 text-xs bg-white dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold appearance-none text-slate-855 dark:text-slate-100 cursor-pointer ${hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
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
            className={`w-full text-xs p-2 bg-white dark:bg-slate-900 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800 dark:text-slate-100 cursor-pointer ${hasError ? 'border-red-500 focus:ring-red-400' : 'border-slate-200 dark:border-slate-800'
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
            className={`h-10 border-slate-200 dark:border-slate-800 ${hasError ? 'border-red-500' : ''
              }`}
          />
        ) : (
          <Input
            type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
            value={customValues[field.id] || ''}
            onChange={(e) => {
              setCustomValues({ ...customValues, [field.id]: e.target.value });
              if (customErrors[field.id]) setCustomErrors({ ...customErrors, [field.id]: '' });
            }}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
            className={`h-10 border-slate-200 dark:border-slate-800 ${hasError ? 'border-red-500' : ''
              }`}
          />
        )}

        {field.helpText && !hasError && (
          <p className="text-[10px] text-slate-405 font-medium pl-0.5 mt-0.5">{field.helpText}</p>
        )}
      </div>
    );
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(leadFormSchema) as any,
    defaultValues: {
      status: 'New',
      leadSource: 'Website',
      rating: '3',
      owner: '',
      preferredContactMethod: 'Email',
      leadScore: '70'
    }
  });

  // Sync react-hook-form selects
  const watchedStatus = watch('status');
  const watchedLeadSource = watch('leadSource');
  const watchedRating = watch('rating');
  const watchedOwner = watch('owner');
  const watchedEmployees = watch('noOfEmployees');
  const watchedRevenue = watch('annualRevenue');
  const watchedContactMethod = watch('preferredContactMethod');

  const getUnifiedFieldsForSection = (section: string) => {
    let stdFields: any[] = [];

    if (section === 'Lead Information') {
      stdFields = [
        {
          id: 'std-lead-first', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 10, render: () => (
            <div className="space-y-1.5" key="std-lead-first">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name *</Label>
              <Input
                {...register('firstName')}
                placeholder="Enter first name"
                className={`h-10 ${errors.firstName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
              />
              {errors.firstName && <p className="text-[10px] text-rose-500 font-bold">{errors.firstName.message}</p>}
            </div>
          )
        },
        {
          id: 'std-lead-last', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 20, render: () => (
            <div className="space-y-1.5" key="std-lead-last">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name *</Label>
              <Input
                {...register('lastName')}
                placeholder="Enter last name"
                className={`h-10 ${errors.lastName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
              />
              {errors.lastName && <p className="text-[10px] text-rose-500 font-bold">{errors.lastName.message}</p>}
            </div>
          )
        },
        {
          id: 'std-lead-email', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 30, render: () => (
            <div className="space-y-1.5" key="std-lead-email">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email *</Label>
              <Input
                {...register('email')}
                type="email"
                placeholder="Enter email address"
                className={`h-10 ${errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
              />
              {errors.email && <p className="text-[10px] text-rose-505 font-bold">{errors.email.message}</p>}
            </div>
          )
        },
        {
          id: 'std-lead-phone', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 40, render: () => (
            <div className="space-y-1.5" key="std-lead-phone">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone *</Label>
              <div className="flex gap-2">
                <Select defaultValue="+91">
                  <SelectTrigger className="w-[85px] h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">🇮🇳 +91</SelectItem>
                    <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    <SelectItem value="+31">🇳🇱 +31</SelectItem>
                    <SelectItem value="+44">🇬🇧 +44</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  {...register('phone')}
                  placeholder="Enter phone number"
                  className={`h-10 flex-1 ${errors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                />
              </div>
              {errors.phone && <p className="text-[10px] text-rose-505 font-bold">{errors.phone.message}</p>}
            </div>
          )
        },
        {
          id: 'std-lead-mobile', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 50, render: () => (
            <div className="space-y-1.5" key="std-lead-mobile">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile</Label>
              <div className="flex gap-2">
                <Select defaultValue="+91">
                  <SelectTrigger className="w-[85px] h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">🇮🇳 +91</SelectItem>
                    <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    <SelectItem value="+31">🇳🇱 +31</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  {...register('mobile')}
                  placeholder="Enter mobile number"
                  className="h-10 flex-1 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          )
        },
        {
          id: 'std-lead-company', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 60, render: () => (
            <div className="space-y-1.5" key="std-lead-company">
              <Label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Company</Label>
              <Input
                {...register('company')}
                placeholder="Enter company name"
                className="h-10 border-slate-200 dark:border-slate-800"
              />
            </div>
          )
        },
        {
          id: 'std-lead-job', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 70, render: () => (
            <div className="space-y-1.5" key="std-lead-job">
              <Label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Job Title</Label>
              <Input
                {...register('jobTitle')}
                placeholder="Enter job title"
                className="h-10 border-slate-200 dark:border-slate-800"
              />
            </div>
          )
        },
        {
          id: 'std-lead-website', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 80, render: () => (
            <div className="space-y-1.5" key="std-lead-website">
              <Label className="text-xs font-bold text-slate-550 uppercase tracking-wider flex items-center gap-1">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  {...register('website')}
                  placeholder="Enter website URL"
                  className="h-10 pl-9 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          )
        },
        {
          id: 'std-lead-industry', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 90, render: () => (
            <div className="space-y-1.5" key="std-lead-industry">
              <Label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Industry</Label>
              <Input
                {...register('industry')}
                placeholder="e.g. Technology"
                className="h-10 border-slate-200 dark:border-slate-800"
              />
            </div>
          )
        },
        {
          id: 'std-lead-status', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 100, render: () => (
            <div className="space-y-1.5" key="std-lead-status">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Lead Status *</Label>
              <Select value={watchedStatus || ""} onValueChange={(val) => setValue('status', val || '')}>
                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                  <SelectItem value="Disqualified">Disqualified</SelectItem>
                  <SelectItem value="Nurturing">Nurturing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        },
        {
          id: 'std-lead-source', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 110, render: () => (
            <div className="space-y-1.5" key="std-lead-source">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Lead Source *</Label>
              <Select value={watchedLeadSource || ""} onValueChange={(val) => setValue('leadSource', val || '')}>
                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Website">Website</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Email Campaign">Email Campaign</SelectItem>
                  <SelectItem value="Cold Call">Cold Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        },
        {
          id: 'std-lead-rating', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 120, render: () => (
            <div className="space-y-1.5" key="std-lead-rating">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Rating</Label>
              <Select value={watchedRating || ""} onValueChange={(val) => setValue('rating', val || '')}>
                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <SelectValue placeholder="Select Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        },
        {
          id: 'std-lead-address', sectionPlacement: 'Lead Information', isStandard: true, orderIndex: 130, render: () => (
            <div className="space-y-1.5 sm:col-span-3" key="std-lead-address">
              <Label className="text-xs font-bold text-slate-550 uppercase tracking-wider">Address</Label>
              <Textarea
                {...register('address')}
                placeholder="Enter full address"
                className="min-h-[80px] border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
          )
        }
      ];
    } else if (section === 'Additional Information') {
      stdFields = [
        {
          id: 'std-lead-employees', sectionPlacement: 'Additional Information', isStandard: true, orderIndex: 140, render: () => (
            <div className="space-y-1.5" key="std-lead-employees">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Number of Employees</Label>
              <Select value={watchedEmployees || ""} onValueChange={(val) => setValue('noOfEmployees', val || '')}>
                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <SelectValue placeholder="Select employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 – 50</SelectItem>
                  <SelectItem value="120">51 – 200</SelectItem>
                  <SelectItem value="500">201 – 1000</SelectItem>
                  <SelectItem value="2000">1000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        },
        {
          id: 'std-lead-revenue', sectionPlacement: 'Additional Information', isStandard: true, orderIndex: 150, render: () => (
            <div className="space-y-1.5" key="std-lead-revenue">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Annual Revenue</Label>
              <Select value={watchedRevenue || ""} onValueChange={(val) => setValue('annualRevenue', val || '')}>
                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <SelectValue placeholder="Select revenue range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Under $1M</SelectItem>
                  <SelectItem value="51 - 200">$2M – $10M</SelectItem>
                  <SelectItem value="15">$10M – $50M</SelectItem>
                  <SelectItem value="100">$50M+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        },
        {
          id: 'std-lead-location', sectionPlacement: 'Additional Information', isStandard: true, orderIndex: 160, render: () => (
            <div className="space-y-1.5" key="std-lead-location">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  {...register('location')}
                  placeholder="Enter city / state / country"
                  className="h-10 pl-9 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          )
        },
        {
          id: 'std-lead-linkedin', sectionPlacement: 'Additional Information', isStandard: true, orderIndex: 170, render: () => (
            <div className="space-y-1.5" key="std-lead-linkedin">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  {...register('linkedinProfile')}
                  placeholder="Enter LinkedIn profile URL"
                  className="h-10 pl-9 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          )
        },
        {
          id: 'std-lead-twitter', sectionPlacement: 'Additional Information', isStandard: true, orderIndex: 180, render: () => (
            <div className="space-y-1.5" key="std-lead-twitter">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Twitter Profile</Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  {...register('twitterProfile')}
                  placeholder="Enter Twitter profile URL"
                  className="h-10 pl-9 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          )
        },
        {
          id: 'std-lead-fax', sectionPlacement: 'Additional Information', isStandard: true, orderIndex: 190, render: () => (
            <div className="space-y-1.5" key="std-lead-fax">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Fax</Label>
              <div className="relative">
                <Printer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  {...register('fax')}
                  placeholder="Enter fax number"
                  className="h-10 pl-9 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>
          )
        },
        {
          id: 'std-lead-dob', sectionPlacement: 'Additional Information', isStandard: true, orderIndex: 200, render: () => (
            <div className="space-y-1.5" key="std-lead-dob">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Date of Birth</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  {...register('dateOfBirth')}
                  type="date"
                  className="h-10 pl-9 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                />
              </div>
            </div>
          )
        },

        {
          id: 'std-lead-contact-method', sectionPlacement: 'Additional Information', isStandard: true, orderIndex: 220, render: () => (
            <div className="space-y-1.5" key="std-lead-contact-method">
              <Label className="text-xs font-bold text-slate-555 uppercase tracking-wider">Preferred Contact Method</Label>
              <Select value={watchedContactMethod || ""} onValueChange={(val) => setValue('preferredContactMethod', val || '')}>
                <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )
        }
      ];
    }

    const customFieldsForSection = activeForm?.fields?.filter((f: any) => f.sectionPlacement === section && f.type !== 'section') || [];
    const unified = [...stdFields, ...customFieldsForSection];
    unified.sort((a, b) => (a.orderIndex || 999) - (b.orderIndex || 999));
    return unified;
  };


  // Submit Handler
  const onSubmit = async (data: FormValues) => {
    try {
      // Validate custom fields
      let hasCustomErrors = false;
      const newCustomErrors: Record<string, string> = {};
      if (activeForm && activeForm.fields) {
        activeForm.fields.forEach((f: any) => {
          if (f.type !== 'section' && f.required && !(customValues[f.id] || '').trim()) {
            newCustomErrors[f.id] = `${f.label} is required.`;
            hasCustomErrors = true;
          }
        });
      }
      if (hasCustomErrors) {
        setCustomErrors(newCustomErrors);
        toast.error('Please fill in all required custom fields.');
        return;
      }

      // Build Lead_Json payload
      const leadJson: Record<string, any> = {};
      if (activeForm && activeForm.fields) {
        activeForm.fields.forEach((field: any) => {
          if (field.type !== 'section') {
            if (field.type === 'checkbox') {
              leadJson[field.label] = customValues[field.id] === 'true';
            } else {
              leadJson[field.label] = customValues[field.id] || "";
            }
          }
        });
      }

      const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '';
      const userId = userIdStr ? parseInt(userIdStr, 10) : 1;

      const locationParts = data.location ? data.location.split(',').map(s => s.trim()) : [];
      const city = locationParts[0] || '';
      const state = locationParts[1] || '';
      const country = locationParts[2] || '';

      const selectedOwnerUser = owners.find(o => o.id.toString() === data.owner);
      const ownerName = selectedOwnerUser ? `${selectedOwnerUser.first_name} ${selectedOwnerUser.last_name || ''}`.trim() : '';

      const payload: any = {
        Organization_Id: 1,
        LeadFirstName: data.firstName,
        LeadLastName: data.lastName,
        EmailId: data.email,
        PhoneNo: data.phone,
        Mobile_No: data.mobile || undefined,
        CompanyName: data.company || undefined,
        Job_Title: data.jobTitle || undefined,
        Designation: data.jobTitle || undefined,
        WebsiteURL: data.website || undefined,
        Lead_Industry: data.industry || undefined,
        Lead_Status: data.status,
        LeadSource: data.leadSource,
        Ratings: data.rating || undefined,
        StreetName: data.address || undefined,
        City: city || undefined,
        State: state || undefined,
        Country: country || undefined,
        LeadNoOfEmployees: data.noOfEmployees ? parseInt(data.noOfEmployees, 10) : undefined,
        LeadCompanyTurnOver: data.annualRevenue ? parseFloat(data.annualRevenue) : undefined,
        LinkedIn_Profile: data.linkedinProfile || undefined,
        Twitter_Profile: data.twitterProfile || undefined,
        Fax: data.fax || undefined,
        Date_Of_Birth: data.dateOfBirth || undefined,
        LeadScore: data.leadScore ? parseInt(data.leadScore, 10) : undefined,
        Prefered_Contact_Method: data.preferredContactMethod || undefined,
        Lead_Owner: ownerName,
        Lead_Owner_Id: data.owner ? parseInt(data.owner, 10) : undefined,
        Source_Details: data.sourceDetails || undefined,
        Notes: data.noteText || undefined,
        Tags: selectedTags,
        Lead_Json: leadJson,
        File: fileBase64 || undefined,
        FileName: selectedFile ? selectedFile.name : undefined,
        Created_By: userId,
        Updated_By: userId,
      };

      await createUserQualifiedLead(payload);
      toast.success('Lead created successfully!');
      router.push('/marketing/leads');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save lead information');
    }
  };

  // Add tags helper
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput.trim()) return;
    if (!selectedTags.includes(tagInput.trim())) {
      setSelectedTags([...selectedTags, tagInput.trim()]);
    }
    setTagInput('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  // Attachments base64 helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result as string);
      };
      reader.readAsDataURL(file);

      toast.success(`File "${file.name}" attached successfully.`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 pb-28 text-left"
    >
      {/* Breadcrumbs & Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          onClick={() => router.push('/marketing/leads')}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </Button>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
            <NavLink to="/marketing/leads" className="hover:text-slate-650 transition-colors">Leads</NavLink>
            <span>&gt;</span>
            <span>Create New Lead</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create New Lead
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side forms (2 columns span) */}
        <div className="lg:col-span-2 space-y-6">

          {(() => {
            const defaultOrder = ['Lead Information', 'Additional Information'];
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

              if (fieldsForSection.length === 0 && !defaultOrder.includes(heading)) return null;

              const sectionField = (activeForm?.fields || []).find((f: any) => f.type === 'section' && f.label === heading);

              return (
                <Card key={heading} className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden mb-6">
                  <div className="p-5 border-b dark:border-slate-800">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-808 dark:text-slate-200">
                      {heading}
                    </h3>
                    {sectionField?.helpText && (
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-1">
                        {sectionField.helpText}
                      </p>
                    )}
                  </div>
                  <CardContent className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {fieldsForSection.map((field: any) => {
                        if (field.isStandard) return field.render();
                        return renderCustomField(field);
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}

        </div>

        {/* Right Side Widgets (1 column span) */}
        <div className="space-y-6">

          {/* Widget 1: Lead Owner & Source Details */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-808 dark:text-slate-200">Lead Owner & Source</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500 tracking-wider uppercase">Owner *</Label>
                <Select value={watchedOwner || ""} onValueChange={(val) => setValue('owner', val || '')}>
                  <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold flex gap-2 items-center">
                    {(() => {
                      const selectedOwnerUser = owners.find(o => o.id.toString() === watchedOwner);
                      return selectedOwnerUser ? `${selectedOwnerUser.first_name} ${selectedOwnerUser.last_name || ''}`.trim() : 'Select Owner';
                    })()}
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5.5 w-5.5">
                            <AvatarFallback className="text-[8px] bg-sky-100 text-sky-700">
                              {user.first_name ? user.first_name.substring(0, 2).toUpperCase() : 'US'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.first_name} {user.last_name || ''}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.owner && <p className="text-[10px] text-rose-500 font-bold">{errors.owner.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-505 uppercase tracking-wider">Source Details</Label>
                <Textarea
                  {...register('sourceDetails')}
                  placeholder="Enter source details"
                  className="min-h-[80px] border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </CardContent>
          </Card>

          {/* Widget 2: Tags */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-808 dark:text-slate-200">Tags</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-505 uppercase tracking-wider">Tags Selector</Label>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowTagInput(!showTagInput)}
                    className="text-blue-650 h-auto p-0 font-bold text-[10px] uppercase"
                  >
                    {showTagInput ? 'Hide' : '+ Add Custom'}
                  </Button>
                </div>

                {showTagInput && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="h-8.5 text-xs"
                    />
                    <Button type="button" onClick={handleAddTag} className="h-8.5 text-xs text-white" style={{ backgroundColor: primaryColor }}>
                      Add
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Software', 'B2B', 'High Potential', 'Enterprise', 'Partner'].map((defaultTag) => {
                    const isSelected = selectedTags.includes(defaultTag);
                    return (
                      <button
                        type="button"
                        key={defaultTag}
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveTag(defaultTag);
                          } else {
                            setSelectedTags([...selectedTags, defaultTag]);
                          }
                        }}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-all ${isSelected
                          ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20'
                          : 'bg-slate-50 text-slate-505 border-slate-200 dark:bg-slate-950 dark:border-slate-800'
                          }`}
                      >
                        {defaultTag}
                      </button>
                    );
                  })}
                </div>

                {selectedTags.length > 0 && (
                  <div className="pt-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Selected Tags</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold px-2 py-0.5 rounded text-slate-655">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-slate-600 ml-0.5">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Widget 3: Notes Card */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-808 dark:text-slate-200">Notes</h3>
            </div>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-3 border dark:border-slate-800 rounded-lg p-1.5 bg-slate-55 dark:bg-slate-955 text-slate-400">
                <span className="font-extrabold hover:text-slate-700 text-xs px-1.5 cursor-pointer">B</span>
                <span className="italic hover:text-slate-700 text-xs px-1.5 cursor-pointer">I</span>
                <span className="underline hover:text-slate-700 text-xs px-1.5 cursor-pointer">U</span>
                <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800" />
                <span className="hover:text-slate-700 text-xs px-1.5 cursor-pointer">&bull;=</span>
                <span className="hover:text-slate-700 text-xs px-1.5 cursor-pointer">1=</span>
                <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800" />
                <span className="hover:text-slate-700 text-[11px] cursor-pointer">🔗</span>
              </div>

              <Textarea
                {...register('noteText')}
                placeholder="Enter notes about the lead..."
                className="min-h-[100px] border-slate-205 dark:border-slate-800 text-xs leading-relaxed"
              />
            </CardContent>
          </Card>

          {/* Widget 4: Attachments */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-808 dark:text-slate-200">Attachments</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative">
                <Paperclip className="h-6 w-6 text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drag and drop files here or</p>
                <div className="mt-2.5">
                  <Button type="button" variant="outline" className="h-8 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 relative pointer-events-none">
                    Browse Files
                  </Button>
                </div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed text-center">
                Allowed files: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max 10MB)
              </p>

              {selectedFile && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attached File</Label>
                  <div className="flex items-center justify-between text-xs py-1 border-b dark:border-slate-800/40">
                    <span className="truncate max-w-[150px] font-semibold text-slate-700 dark:text-slate-350">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileBase64('');
                      }}
                      className="text-rose-505 hover:text-rose-700 ml-2 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/marketing/leads')}
            className="px-6 border-slate-200 dark:border-slate-800 h-10.5 font-bold text-slate-700 dark:text-slate-300 text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10.5 px-8 gap-2 shadow-sm text-white font-bold text-xs rounded-xl cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

      </form>
    </motion.div>
  );
}
