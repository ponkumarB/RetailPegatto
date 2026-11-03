'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  ChevronDown, 
  Mail, 
  Phone, 
  X, 
  Save, 
  Bookmark, 
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { useQuery } from '@tanstack/react-query';
import { getLoggedInUserId, ContactModel } from '@/service/api/contacts/api';
import { fetchAccountFullList } from '@/service/api/Company/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { NavLink } from '@/components/layout/NavLink';

export interface ContactFormProps {
  defaultCompanyName?: string;
  onSubmit: (payload: ContactModel) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  cancelButtonText?: string;
  showBreadcrumbsAndHeader?: boolean;
  disableCompanyEdit?: boolean;
}

export default function ContactForm({
  defaultCompanyName = '',
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = 'Save Contact',
  cancelButtonText = 'Cancel',
  showBreadcrumbsAndHeader = true,
  disableCompanyEdit = false,
}: ContactFormProps) {
  const { primaryColor } = useStore();
  const userId = getLoggedInUserId();

  const { data: companyListData } = useQuery({
    queryKey: ['accountFullList'],
    queryFn: fetchAccountFullList
  });

  const { data: usersListData } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
  });

  const users = useMemo(() => {
    const list = usersListData
      ? (Array.isArray(usersListData) ? usersListData : (usersListData.results || usersListData.data || []))
      : [];
    
    const colorsList = [
      'bg-slate-900 text-slate-100 dark:bg-slate-800 dark:text-slate-200',
      'bg-indigo-950 text-indigo-200 dark:bg-indigo-900 dark:text-indigo-300',
      'bg-emerald-955 text-emerald-200 dark:bg-emerald-900 dark:text-emerald-300',
      'bg-blue-955 text-blue-200 dark:bg-blue-900 dark:text-blue-300',
      'bg-pink-955 text-pink-200 dark:bg-pink-900 dark:text-pink-300'
    ];

    return list.map((u: any, idx: number) => {
      const id = u.id || u.User_Id || 0;
      const firstName = u.first_name || u.FirstName || '';
      const lastName = u.last_name || u.LastName || '';
      const name = u.name || `${firstName} ${lastName}`.trim() || u.username || u.email || 'Unknown';
      const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) || 'US';
      const bg = colorsList[idx % colorsList.length];
      return { id, name, initials, bg };
    });
  }, [usersListData]);

  // Dialog State
  const [isNewListOpen, setIsNewListOpen] = useState(false);

  // Form states - Empty initially to show placeholders
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [accountName, setAccountName] = useState(defaultCompanyName);
  const [phoneCountry, setPhoneCountry] = useState('+91');
  const [phone, setPhone] = useState('');
  const [workPhoneCountry, setWorkPhoneCountry] = useState('+91');
  const [workPhone, setWorkPhone] = useState('');
  const [dob, setDob] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [leadSource, setLeadSource] = useState('');
  const [department, setDepartment] = useState('');
  const [reportsTo, setReportsTo] = useState('');
  const [reportsToId, setReportsToId] = useState<number | null>(null);
  const [status, setStatus] = useState('Active');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [picFile, setPicFile] = useState<string>('');
  const [picFileName, setPicFileName] = useState<string>('');

  // Sync with defaultCompanyName if it changes
  useEffect(() => {
    if (defaultCompanyName) {
      setAccountName(defaultCompanyName);
    }
  }, [defaultCompanyName]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPicFile(base64String);
      toast.success(`Photo "${file.name}" uploaded successfully!`);
    };
    reader.readAsDataURL(file);
  };

  // Additional Information states
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [notes, setNotes] = useState('');

  // Tag selection states
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

  // Right column states
  const [owner, setOwner] = useState('');
  const [ownerId, setOwnerId] = useState<number | undefined>(undefined);
  const [commPrefs, setCommPrefs] = useState({
    email: false,
    phone: false,
    sms: false,
    whatsapp: false,
  });
  const [targetList, setTargetList] = useState('');

  // Pre-fill default owner once users list is loaded
  useEffect(() => {
    if (users.length > 0 && !owner) {
      const foundDefault = users.find(u => u.id === userId);
      if (foundDefault) {
        setOwner(foundDefault.name);
        setOwnerId(foundDefault.id);
      } else {
        setOwner(users[0].name);
        setOwnerId(users[0].id);
      }
    }
  }, [users, userId, owner]);

  // Dynamic Dialog input states
  const [newListInput, setNewListInput] = useState('');

  // Dropdown lists
  const [customAccounts, setCustomAccounts] = useState<string[]>([]);
  const accounts = useMemo(() => {
    const fetched = companyListData 
      ? (Array.isArray(companyListData) ? companyListData : (companyListData.results || companyListData.data || [])).map((c: any) => c.Organization_Name).filter(Boolean)
      : [];
    const listSet = new Set([...fetched, ...customAccounts]);
    if (defaultCompanyName) {
      listSet.add(defaultCompanyName);
    }
    return Array.from(listSet);
  }, [companyListData, customAccounts, defaultCompanyName]);

  const [lists, setLists] = useState<string[]>([]);

  // Computed Full Name for live preview
  const fullName = useMemo(() => {
    const f = firstName.trim();
    const l = lastName.trim();
    return f || l ? `${f} ${l}`.trim() : 'New Contact';
  }, [firstName, lastName]);

  // Initials for avatar
  const avatarInitials = useMemo(() => {
    const f = firstName.trim().substring(0, 1).toUpperCase();
    const l = lastName.trim().substring(0, 1).toUpperCase();
    return f || l ? `${f}${l}` : 'CO';
  }, [firstName, lastName]);

  // Selected owner details
  const selectedOwnerDetails = useMemo(() => {
    return users.find(o => o.name === owner) || { name: 'Select Owner', initials: 'SO', bg: 'bg-slate-900 text-slate-100' };
  }, [owner, users]);

  // Checkbox toggles
  const handleTogglePref = (key: keyof typeof commPrefs) => {
    setCommPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Add new Tag
  const handleAddTag = (tag: string) => {
    const formatted = tag.trim();
    if (formatted && !tags.includes(formatted)) {
      setTags([...tags, formatted]);
    }
    setNewTagInput('');
    setIsTagDropdownOpen(false);
  };

  // Remove Tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Dialog list creator
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newListInput.trim();
    if (formatted && !lists.includes(formatted)) {
      setLists([...lists, formatted]);
      setTargetList(formatted);
      toast.success(`Mailing list "${formatted}" created successfully!`);
    }
    setNewListInput('');
    setIsNewListOpen(false);
  };

  // Submit Handler
  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First Name and Last Name are required.');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone number is required.');
      return;
    }

    // Resolve Account_Id from selected company name (accountName)
    let resolvedAccountId: number | null = null;
    if (accountName && companyListData) {
      const companiesList = Array.isArray(companyListData)
        ? companyListData
        : (companyListData.results || companyListData.data || []);
      const matchedCompany = companiesList.find((c: any) => c.Organization_Name === accountName);
      if (matchedCompany && matchedCompany.id) {
        resolvedAccountId = Number(matchedCompany.id);
      }
    }

    const payload: ContactModel = {
      Organization_Id: 1,
      Account_Id: resolvedAccountId,
      FirstName: firstName.trim(),
      LastName: lastName.trim(),
      Company_Name: accountName,
      MobileCountry_Id: phoneCountry,
      Mobile_Number: phone,
      AlternatePhoneNo: workPhone,
      Email_Id: email,
      Job_Title: jobTitle,
      Department: department,
      DateOfBirth: dob || '1995-01-01',
      Address: address,
      Country: country || 'India',
      State: state,
      City: city,
      Pincode: pinCode,
      LeadSource: leadSource || 'Website',
      Contact_Owner: owner,
      Contact_Owner_Id: ownerId || userId,
      Reportingto_Id: reportsToId,
      Tags: tags,
      Description: notes,
      Lead_Flag: true,
      Status: status,
      User_Photo: picFile || undefined,
      File: undefined,
      FileName: picFile ? (picFileName || 'pic.png') : undefined,
      Contact_Json: {
        Source: leadSource,
        ...commPrefs,
        targetList
      },
      Created_By: userId,
      Updated_By: userId
    };

    onSubmit(payload);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Breadcrumb Navigation */}
      {showBreadcrumbsAndHeader && (
        <>
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<NavLink to="/contacts">Contacts</NavLink>} />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Create Contact</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header bar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Create Contact</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Add a new contact to your CRM.</p>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="font-bold text-xs h-10 px-5 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer shadow-xs"
              >
                {cancelButtonText}
              </Button>
              <Button 
                onClick={handleSaveContact}
                disabled={isSubmitting}
                style={{ backgroundColor: primaryColor }}
                className="font-bold text-xs h-10 px-5 text-white rounded-lg shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all duration-200"
              >
                <Save className="h-4 w-4" /> {submitButtonText}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
        
        {/* Left Side: Main Form Fields (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: Personal Information */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200 border-b pb-3 dark:border-slate-800">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <Input 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)} 
                  required
                  placeholder="e.g. Rohit"
                  className="h-10 text-xs rounded-lg"
                />
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <Input 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)} 
                  required
                  placeholder="e.g. Sharma"
                  className="h-10 text-xs rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                  Email <span className="text-rose-500">*</span>
                </label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  placeholder="name@company.com"
                  className="h-10 text-xs rounded-lg"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">Company Name</label>
                </div>
                <Select value={accountName || ""} onValueChange={(val) => setAccountName(val || '')} disabled={disableCompanyEdit}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg">
                    <SelectValue placeholder="Select Company Name" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc} value={acc}>{acc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                  Phone <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Select value={phoneCountry} onValueChange={(val) => setPhoneCountry(val || '+91')}>
                    <SelectTrigger className="w-28 !h-10 text-xs rounded-lg shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+91">🇮🇳 +91</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+49">🇩🇪 +49</SelectItem>
                      <SelectItem value="+31">🇳🇱 +31</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="98765 43210"
                    required
                    className="flex-1 h-10 text-xs rounded-lg"
                  />
                </div>
              </div>

              {/* Work Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Work Phone</label>
                <div className="flex gap-2">
                  <Select value={workPhoneCountry} onValueChange={(val) => setWorkPhoneCountry(val || '+91')}>
                    <SelectTrigger className="w-28 !h-10 text-xs rounded-lg shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+91">🇮🇳 +91</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+49">🇩🇪 +49</SelectItem>
                      <SelectItem value="+31">🇳🇱 +31</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    value={workPhone} 
                    onChange={e => setWorkPhone(e.target.value)} 
                    placeholder="011 4123 4567"
                    className="flex-1 h-10 text-xs rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Date of Birth</label>
                <Input 
                  type="date"
                  value={dob} 
                  onChange={e => setDob(e.target.value)} 
                  className="h-10 text-xs rounded-lg"
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
                  Status <span className="text-rose-500">*</span>
                </label>
                <Select value={status} onValueChange={(val) => setStatus(val || 'Active')}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="In Active">In Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Job Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">Job Title</label>
                <Input 
                  value={jobTitle} 
                  onChange={e => setJobTitle(e.target.value)} 
                  placeholder="e.g. Marketing Manager"
                  className="h-10 text-xs rounded-lg"
                />
              </div>

              {/* Lead Source */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Lead Source</label>
                <Select value={leadSource || ""} onValueChange={(val) => setLeadSource(val || '')}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg">
                    <SelectValue placeholder="Select Lead Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Department</label>
                <Input 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                  placeholder="e.g. Marketing"
                  className="h-10 text-xs rounded-lg"
                />
              </div>

              Reports To
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">Reports To</label>
                <Select value={reportsTo || ""} onValueChange={(val) => {
                  setReportsTo(val || '');
                  const foundUser = users.find(u => u.name === val);
                  setReportsToId(foundUser ? foundUser.id : null);
                }}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Card: Additional Information */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b pb-3 dark:border-slate-800">
              Additional Information
            </h2>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Address</label>
              <textarea
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
                placeholder="Enter postal address..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* City */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">City</label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Noida" className="h-10 text-xs rounded-lg" />
              </div>

              {/* State */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">State</label>
                <Input value={state} onChange={e => setState(e.target.value)} placeholder="Uttar Pradesh" className="h-10 text-xs rounded-lg" />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-400 uppercase tracking-widest block">Country</label>
                <Select value={country || ""} onValueChange={(val) => setCountry(val || 'India')}>
                  <SelectTrigger className="w-full !h-10 text-xs rounded-lg">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="Netherlands">Netherlands</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Pin Code */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Pin Code</label>
                <Input value={pinCode} onChange={e => setPinCode(e.target.value)} placeholder="201309" className="h-10 text-xs rounded-lg" />
              </div>
            </div>

            {/* Tags Badges Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Tags</label>
              
              <div className="relative">
                <div 
                  onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                  className="min-h-11 p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 rounded-lg flex items-center justify-between flex-wrap gap-1.5 cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {tags.length > 0 ? (
                      tags.map(tag => (
                        <Badge 
                          key={tag} 
                          className="bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-foreground border-0 py-0.5 px-2 rounded-md font-bold text-[10px] gap-1 flex items-center"
                          style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
                        >
                          {tag}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTag(tag);
                            }}
                            className="rounded-full hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-450 ml-1">Select tags...</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mr-1" />
                </div>

                <AnimatePresence>
                  {isTagDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute left-0 right-0 mt-1 border dark:border-slate-800 bg-white dark:bg-slate-900 p-3 rounded-xl shadow-lg z-20 space-y-2.5"
                    >
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Create custom tag..." 
                          value={newTagInput} 
                          onChange={e => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag(newTagInput);
                            }
                          }}
                          className="h-8.5 text-xs rounded-lg"
                        />
                        <Button 
                          type="button" 
                          onClick={() => handleAddTag(newTagInput)}
                          style={{ backgroundColor: primaryColor }}
                          className="h-8.5 text-xs text-white rounded-lg font-bold cursor-pointer"
                        >
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 border-t pt-2 dark:border-slate-850">
                        {['Important', 'Hot Lead', 'Campaign 2024', 'Partner', 'Prospect', 'Follow-up'].map(presetTag => {
                          const isSel = tags.includes(presetTag);
                          return (
                            <button
                              type="button"
                              key={presetTag}
                              disabled={isSel}
                              onClick={() => handleAddTag(presetTag)}
                              className={`py-1 px-2.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                isSel
                                  ? 'bg-slate-50 border-slate-100 text-slate-350 dark:bg-slate-955 dark:border-slate-900 dark:text-slate-650'
                                  : 'bg-white hover:bg-slate-55 border-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-350'
                              }`}
                            >
                              {presetTag}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Description / Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter descriptive comments or remarks..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Preview Cards & Settings (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
           {/* Card: Profile Preview */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs flex flex-col items-center text-center space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 self-start">
              Profile Preview
            </h2>

            <div className="space-y-3 flex flex-col items-center w-full">
              {/* Circular Avatar Badge */}
              <div 
                className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-md select-none transition-all duration-300 overflow-hidden bg-slate-100 dark:bg-slate-800"
                style={{ 
                  background: picFile ? 'transparent' : `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor})`
                }}
              >
                {picFile ? (
                  <img src={picFile} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  avatarInitials
                )}
              </div>

              <div className="space-y-1 w-full px-2">
                <h3 className="font-bold text-slate-850 dark:text-slate-100 text-lg leading-tight truncate">
                  {fullName}
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                  {jobTitle || 'Job Title'}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-550 truncate">
                  {accountName || 'Company Name'}
                </p>
              </div>

              <div className="pt-3 border-t dark:border-slate-850 w-full text-left space-y-2 text-[11px] font-semibold text-slate-550 dark:text-slate-455 px-2">
                <div className="flex items-center gap-2.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{email || 'email@example.com'}</span>
                </div>
                <div className="flex items-center gap-2.5 truncate">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{phone ? `${phoneCountry} ${phone}` : 'Phone Number'}</span>
                </div>
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
            />
            <div className="flex gap-2 mt-2">
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 font-bold text-xs h-9.5 rounded-lg border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" /> {picFile ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {picFile && (
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setPicFile('');
                    setPicFileName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-3 font-bold text-xs h-9.5 rounded-lg border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-955/20 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Remove
                </Button>
              )}
            </div>
          </div>

          {/* Card: Contact Owner */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500">
              Contact Owner
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-455 dark:text-slate-450 uppercase tracking-widest block">
                Owner <span className="text-rose-500">*</span>
              </label>
              <Select value={owner} onValueChange={(val) => {
                setOwner(val || '');
                const foundUser = users.find(u => u.name === val);
                if (foundUser) {
                  setOwnerId(foundUser.id);
                }
              }}>
                <SelectTrigger className="w-full !h-10 text-xs rounded-lg flex items-center gap-2.5">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${selectedOwnerDetails.bg}`}>
                    {selectedOwnerDetails.initials}
                  </div>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.name}>
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
          </div>

          {/* Card: Communication Preferences */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500">
              Communication Preferences
            </h2>

            <div className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-350">
              {[
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone Call' },
                { key: 'sms', label: 'SMS' },
                { key: 'whatsapp', label: 'WhatsApp' }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id={`pref-${item.key}`}
                    checked={commPrefs[item.key as keyof typeof commPrefs]} 
                    onChange={() => handleTogglePref(item.key as keyof typeof commPrefs)}
                    className="h-4.5 w-4.5 border-slate-355 accent-primary rounded cursor-pointer" 
                  />
                  <label htmlFor={`pref-${item.key}`} className="cursor-pointer">
                    {item.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Add to List */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500">
              Add to Mailing List
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Select List</label>
              <Select value={targetList || ""} onValueChange={(val) => setTargetList(val || '')}>
                <SelectTrigger className="w-full !h-10 text-xs rounded-lg">
                  <SelectValue placeholder="Select a list" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map(lst => (
                    <SelectItem key={lst} value={lst}>{lst}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <button 
              type="button"
              onClick={() => setIsNewListOpen(true)}
              className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer pt-1"
              style={{ color: primaryColor }}
            >
              <Plus className="h-3 w-3" /> Create New List
            </button>
          </div>

        </div>

      </div>

      {/* Bottom Bar Actions (Wizard Mode) */}
      {!showBreadcrumbsAndHeader && (
        <div className="col-span-1 lg:col-span-12 flex items-center justify-end gap-3.5 border-t dark:border-slate-800 pt-5 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-[5px] h-9.5 px-5 text-xs font-bold border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {cancelButtonText}
          </Button>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveContact}
            style={{ backgroundColor: primaryColor }}
            className="rounded-[5px] h-9.5 px-6 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            {submitButtonText}
          </Button>
        </div>
      )}

      {/* DIALOG: Create New Mailing List Modal */}
      <Dialog open={isNewListOpen} onOpenChange={setIsNewListOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
          <form onSubmit={handleCreateList} className="space-y-4">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" style={{ color: primaryColor }} /> Create Mailing List
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-455 mt-1">
                Enter label to construct a new mailing category.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase block">Mailing List Title *</label>
              <Input 
                placeholder="e.g. Partner Updates" 
                value={newListInput} 
                onChange={e => setNewListInput(e.target.value)} 
                required 
                className="h-10 text-xs rounded-lg"
              />
            </div>

            <DialogFooter className="pt-3 border-t dark:border-slate-800 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsNewListOpen(false)} className="rounded-lg h-9 text-xs">Cancel</Button>
              <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white rounded-lg h-9 text-xs">Create List</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
