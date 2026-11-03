'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Plus, 
  Upload, 
  ChevronDown, 
  Calendar, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  User, 
  Globe, 
  FileText, 
  Bookmark, 
  X, 
  Save, 
  ChevronRight,
  Sparkles,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/store/useStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchContactDetails, 
  updateContact, 
  getLoggedInUserId, 
  ContactModel 
} from '@/service/api/contacts/api';
import { fetchAccountFullList } from '@/service/api/Company';
import { fetchUsersList } from '@/service/api/Leads/api';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';


export default function EditContactPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { primaryColor } = useStore();
  const { canEditContact } = usePermission();

  useEffect(() => {
    if (!canEditContact) {
      toast.error('You do not have permission to access the Edit Contact page.');
      router.push('/contacts');
    }
  }, [canEditContact, router]);

  if (!canEditContact) {
    return null;
  }
  const userId = getLoggedInUserId() || 72;
  const queryClient = useQueryClient();

  const { data: contactData, isLoading: isContactLoading } = useQuery({
    queryKey: ['contactDetails', id],
    queryFn: () => fetchContactDetails(Number(id)),
    enabled: !!id
  });

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
      'bg-emerald-950 text-emerald-200 dark:bg-emerald-900 dark:text-emerald-300',
      'bg-blue-950 text-blue-200 dark:bg-blue-900 dark:text-blue-300',
      'bg-pink-950 text-pink-200 dark:bg-pink-900 dark:text-pink-300'
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

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [accountName, setAccountName] = useState('');
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [picFile, setPicFile] = useState<string>('');
  const [picFileName, setPicFileName] = useState<string>('');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const rawBase64 = base64String.split(',')[1];
      setPicFile(rawBase64);
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

  // Dynamic Dialog input states
  const [newListInput, setNewListInput] = useState('');

  // Dropdown lists
  const [customAccounts, setCustomAccounts] = useState<string[]>([]);
  const accounts = useMemo(() => {
    const fetched = companyListData 
      ? (Array.isArray(companyListData) ? companyListData : (companyListData.results || companyListData.data || [])).map((c: any) => c.Organization_Name).filter(Boolean)
      : [];
    return Array.from(new Set([...fetched, ...customAccounts]));
  }, [companyListData, customAccounts]);

  const [lists, setLists] = useState<string[]>([]);

  // Pre-fill states when contact is loaded
  useEffect(() => {
    if (contactData) {
      setFirstName(contactData.FirstName || '');
      setLastName(contactData.LastName || '');
      setEmail(contactData.Email_Id || '');
      setAccountName(contactData.Company_Name || '');
      setPhoneCountry(contactData.MobileCountry_Id || '+91');
      setPhone(contactData.Mobile_Number || '');
      setWorkPhoneCountry('+91');
      setWorkPhone(contactData.AlternatePhoneNo || '');
      setDob(contactData.DateOfBirth || '');
      setJobTitle(contactData.Job_Title || '');
      setLeadSource(contactData.LeadSource || '');
      setDepartment(contactData.Department || '');
      
      const rIdVal = contactData.Reportingto_Id;
      if (rIdVal) {
        if (typeof rIdVal === 'object') {
          const rObj = rIdVal as any;
          const rIdNum = Number(rObj.id || 0);
          const rFirstName = rObj.first_name || rObj.FirstName || '';
          const rLastName = rObj.last_name || rObj.LastName || '';
          const rNameStr = `${rFirstName} ${rLastName}`.trim() || rObj.username || rObj.Name || '';
          setReportsTo(rNameStr);
          setReportsToId(rIdNum);
        } else if (users.length > 0) {
          const found = users.find(u => u.id === Number(rIdVal));
          if (found) {
            setReportsTo(found.name);
            setReportsToId(found.id);
          } else {
            setReportsTo(String(rIdVal));
            setReportsToId(Number(rIdVal));
          }
        } else {
          setReportsTo(String(rIdVal));
          setReportsToId(Number(rIdVal));
        }
      } else {
        setReportsTo('');
        setReportsToId(null);
      }

      let ownerNameStr = '';
      if (contactData.Contact_Owner) {
        if (typeof contactData.Contact_Owner === 'object') {
          const ownerObj = contactData.Contact_Owner as any;
          const oFirstName = ownerObj.first_name || ownerObj.FirstName || '';
          const oLastName = ownerObj.last_name || ownerObj.LastName || '';
          ownerNameStr = `${oFirstName} ${oLastName}`.trim() || ownerObj.username || ownerObj.email || '';
        } else {
          ownerNameStr = String(contactData.Contact_Owner);
        }
      }
      setOwner(ownerNameStr);

      const ownerIdNum = contactData.Contact_Owner_Id;
      if (ownerIdNum) {
        setOwnerId(Number(ownerIdNum));
      } else if (users.length > 0) {
        const foundOwner = users.find(u => u.name === ownerNameStr);
        setOwnerId(foundOwner ? foundOwner.id : undefined);
      }
      
      setAddress(contactData.Address || '');
      setCity(contactData.City || '');
      setState(contactData.State || '');
      setCountry(contactData.Country || 'India');
      setPinCode(contactData.Pincode || '');
      setNotes(contactData.Description || '');
      setTags(Array.isArray(contactData.Tags)
        ? contactData.Tags
        : (typeof contactData.Tags === 'string' && contactData.Tags
            ? contactData.Tags.split(',').map(t => t.trim()).filter(Boolean)
            : []));
      
      const jsonPrefs = contactData.Contact_Json;
      setCommPrefs({
        email: jsonPrefs?.email || false,
        phone: jsonPrefs?.phone || false,
        sms: jsonPrefs?.sms || false,
        whatsapp: jsonPrefs?.whatsapp || false,
      });
      setTargetList(jsonPrefs?.targetList || '');
      setStatus(contactData.Status || 'Active');
    }
  }, [contactData, users]);

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

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<ContactModel> & { id: number }) => updateContact(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contactDetails', id] });
      toast.success(`Contact "${fullName}" updated successfully!`);
      router.push('/contacts');
    },
    onError: (err: any) => {
      toast.error(`Failed to update contact: ${err.message}`);
    }
  });

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

    const payload: Partial<ContactModel> & { id: number } = {
      id: Number(id),
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
      City: city,
      State: state,
      Country: country || 'India',
      Pincode: pinCode,
      Tags: tags,
      Description: notes,
      LeadSource: leadSource || 'Website',
      Contact_Owner: owner,
      Contact_Owner_Id: ownerId || userId,
      Reportingto_Id: reportsToId,
      Status: status,
      File: picFile || undefined,
      FileName: picFile ? (picFileName || 'pic.png') : undefined,
      Contact_Json: {
        Source: leadSource,
        ...commPrefs,
        targetList
      },
      Updated_By: userId
    };

    updateMutation.mutate(payload);
  };

  if (isContactLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-500 font-bold text-sm">Loading contact details...</p>
      </div>
    );
  }

  if (!contactData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-500 font-bold text-sm">Contact record not found.</p>
        <Button onClick={() => router.push('/contacts')} style={{ backgroundColor: primaryColor }} className="text-white rounded-lg text-xs font-bold px-4 h-9">
          Back to Contacts
        </Button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Breadcrumb Navigation */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/contacts">Contacts</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Contact</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowLeft onClick={() => router.push('/contacts')} className="h-6 w-6 cursor-pointer text-slate-400 hover:text-slate-650 shrink-0 mr-1" />
            Edit Contact: {fullName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update details for this CRM contact.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/contacts')}
            className="font-bold text-xs h-10 px-5 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer shadow-xs"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveContact}
            style={{ backgroundColor: primaryColor }}
            className="font-bold text-xs h-10 px-5 text-white rounded-lg shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all duration-200"
          >
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-10">
        
        {/* Left Side: Main Form Fields (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Card: Personal Information */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b pb-3 dark:border-slate-800">
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
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">
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
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Company Name</label>
                </div>
                <Select value={accountName || ""} onValueChange={(val) => setAccountName(val || '')}>
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
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Job Title</label>
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

              {/* Reports To */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Reports To</label>
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
                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 resize-none leading-relaxed"
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
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest block">Country</label>
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
                  className="min-h-11 p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg flex items-center justify-between flex-wrap gap-1.5 cursor-pointer shadow-2xs"
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
                      <span className="text-xs text-slate-400 ml-1">Select tags...</span>
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

                      <div className="flex flex-wrap gap-1.5 border-t pt-2 dark:border-slate-800">
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
                                  ? 'bg-slate-50 border-slate-100 text-slate-350 dark:bg-slate-950 dark:border-slate-900 dark:text-slate-650'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-355'
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
                className="w-full text-xs p-3 rounded-lg border border-slate-200 dark:border-slate-855 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700 resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Preview Cards & Settings (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card: Profile Preview */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs flex flex-col items-center text-center space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 self-start">
              Profile Preview
            </h2>

            <div className="space-y-3 flex flex-col items-center w-full">
              {/* Circular Avatar Badge */}
              <div 
                className="h-20 w-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-md select-none transition-all duration-300 overflow-hidden bg-slate-100 dark:bg-slate-800"
                style={{ 
                  background: picFile ? 'transparent' : (contactData?.User_Photo ? 'transparent' : `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor})`)
                }}
              >
                {picFile ? (
                  <img src={`data:image/png;base64,${picFile}`} alt="Preview" className="h-full w-full object-cover" />
                ) : (contactData?.User_Photo ? (
                  <img src={contactData.User_Photo.startsWith('http') ? contactData.User_Photo : `https://backend.crmfarm.app${contactData.User_Photo}`} alt="Existing" className="h-full w-full object-cover" />
                ) : (
                  avatarInitials
                ))}
              </div>

              <div className="space-y-1 w-full px-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight truncate">
                  {fullName}
                </h3>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                  {jobTitle || 'Job Title'}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate">
                  {accountName || 'Company Name'}
                </p>
              </div>

              <div className="pt-3 border-t dark:border-slate-800 w-full text-left space-y-2 text-[11px] font-semibold text-slate-550 dark:text-slate-455 px-2">
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full font-bold text-xs h-9.5 rounded-lg border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <Upload className="h-3.5 w-3.5 text-slate-400" /> {picFileName ? 'Change Photo' : 'Upload Photo'}
            </Button>
          </div>

          {/* Card: Contact Owner */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-455 dark:text-slate-500">
              Contact Owner
            </h2>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-455 dark:text-slate-455 uppercase tracking-widest block">
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
              Add to List
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
    </motion.div>
  );
}
