'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { useStore } from '@/store/useStore';
import { fetchUsersList } from '@/service/api/Leads/api';
import { createAssetRequest } from '@/service/api/Assets/api';
import { fetchFromApi } from '@/service/apiClient';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Building, 
  Calendar, 
  Clock, 
  ChevronDown, 
  Upload,
  ArrowLeft,
  X,
  FileText,
  User,
  Info,
  Laptop,
  CheckCircle,
  Briefcase,
  HelpCircle,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';


const getUserId = (): number => {
  if (typeof window !== 'undefined') {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const id = Number(userData?.id);
        if (!isNaN(id) && id > 0) return id;
      }
    } catch { }
  }
  return 116;
};

export default function RequestNewAssetPage() {
  const router = useRouter();
  const { fetchRequestsPage, requestsPage } = useAssetStore();
  const { user: currentUser } = useStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [requestedBy, setRequestedBy] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [manager, setManager] = useState('');
  
  const [costCenter, setCostCenter] = useState('IT Department');
  const [location, setLocation] = useState('Bangalore (Office)');
  
  const [assetType, setAssetType] = useState('Laptop');
  const [brand, setBrand] = useState('Dell');
  const [model, setModel] = useState('Latitude 5420');
  const [configuration, setConfiguration] = useState('i5 Processor, 16GB RAM, 512GB SSD, Windows 11 Pro');
  
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [requiredFor, setRequiredFor] = useState('Project Work');
  const [requiredDate, setRequiredDate] = useState('2024-06-15');
  const [purpose, setPurpose] = useState('Required for client project work and data analysis tasks.');
  
  const [allocatedSpecific, setAllocatedSpecific] = useState<'Yes' | 'No'>('Yes');
  const [expectedDuration, setExpectedDuration] = useState('More than 1 year');

  // Attachments State
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 5 * 1024 * 1024);
    if (valid.length < files.length) toast.warning('Some files exceed 5MB and were skipped.');
    setAttachments(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter(f => f.size <= 5 * 1024 * 1025);
    if (valid.length < files.length) toast.warning('Some files exceed 5MB and were skipped.');
    setAttachments(prev => [...prev, ...valid]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Str = result.split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Fetch users from backend
  const { data: usersRaw } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
  });

  const users = React.useMemo(() => {
    if (Array.isArray(usersRaw)) {
      return usersRaw.map((u: any) => ({
        id: u.id,
        name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username || 'Unknown',
        email: u.email || `-`,
        phone: u.PhoneNo || '-',
        dept: u.Designation || '-',
        manager: '-',
        state: u.State || u.state || ''
      }));
    }
    return [];
  }, [usersRaw]);

  // Auto-fill form state with logged-in user profile details
  useEffect(() => {
    if (currentUser && currentUser.name) {
      setRequestedBy(currentUser.name);
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setDepartment(currentUser.jobTitle || 'IT Department');
      setManager('');
    }
  }, [currentUser]);

  const handleUserSelect = (name: string) => {
    setRequestedBy(name);
    const user = users.find(u => u.name === name);
    if (user) {
      setDepartment(user.dept);
      setEmail(user.email);
      setPhone(user.phone);
      if (user.state) {
        setLocation(user.state);
      }
      setManager(''); // Reporting manager should not be prefilled
    } else {
      setDepartment('');
      setEmail('');
      setPhone('');
      setLocation('Bangalore (Office)');
      setManager('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedBy) {
      toast.warning('Please select a requester.');
      return;
    }
    if (!assetType) {
      toast.warning('Please select an asset type.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload attachments first (if any), collect first file ID
      let attachmentId: number | null = null;
      if (attachments.length > 0) {
        const file = attachments[0];
        const base64Data = await fileToBase64(file);
        const orgId = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
        const fileRecord = await fetchFromApi('/user/UserFilesandUrlsCRUD/', {
          method: 'POST',
          body: JSON.stringify({
            File_Type: 'Document',
            Organization_Id: orgId,
            FileName: file.name,
            File: base64Data,
            Urls: '',
            Description: `Asset request attachment: ${file.name}`,
            Created_By: getUserId(),
            Updated_By: getUserId(),
          }),
        });
        if (fileRecord?.id) {
          attachmentId = fileRecord.id;
        }
      }

      await createAssetRequest({
        Requested_By: requestedBy,
        Department: department,
        Email: email,
        Phone: phone,
        Reporting_Manager: manager,
        Location: location,
        Asset_Type: assetType,
        Preferred_Brand: brand,
        Preferred_Model: model,
        Configuration: configuration,
        Quantity: quantity.toString(),
        Priority: priority,
        Purpose: purpose,
        Required_Date: requiredDate,
        Expected_Duration: expectedDuration,
        Status: 'Pending',
        Created_By: getUserId(),
        Updated_By: getUserId(),
        Attachment: attachmentId ? [attachmentId] : null,
      });

      toast.success('Asset request submitted successfully!');
      // Refresh the requests list so the new entry appears immediately
      await fetchRequestsPage(1);
      router.push('/assets/request');
    } catch (error: any) {
      console.error('Failed to submit asset request:', error);
      if (error?.message !== 'Content file too large') {
        toast.error(error?.message || 'Failed to submit request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Assets</span>
            <span>&gt;</span>
            <span className="hover:text-slate-655 cursor-pointer" onClick={() => router.push('/assets/request')}>Asset Management</span>
            <span>&gt;</span>
            <span className="hover:text-slate-655 cursor-pointer" onClick={() => router.push('/assets/request')}>Assets Request</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">New Request</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Request New Asset</h1>
          <p className="text-xs text-slate-450 mt-1">Fill in the details below to request an asset.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
            onClick={() => router.push('/assets/request')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="h-9.5 px-5 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...</>
            ) : (
              'Submit Request'
            )}
          </Button>
        </div>
      </div>

      {/* Main Form/Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side Form Fields */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section 1: Requester Information */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">1. Requester Information</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Requested By */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Requested By *</label>
                  <div className="relative">
                    <select
                      value={requestedBy}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select Requester...</option>
                      {users.map(u => (
                        <option key={u.id || u.name} value={u.name}>{u.name} ({u.dept})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department *</label>
                  <div className="relative">
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select Department...</option>
                      <option value="Business Analysis">Business Analysis</option>
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Quality Assurance">Quality Assurance</option>
                      <option value="Training">Training</option>
                      <option value="Project Management">Project Management</option>
                      {department && !["Business Analysis", "Development", "Design", "Quality Assurance", "Training", "Project Management"].includes(department) && (
                        <option value={department}>{department}</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email *</label>
                  <Input 
                    placeholder="email@crmfarmit.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone *</label>
                  <Input 
                    placeholder="+91 XXXXX XXXXX"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Reporting Manager */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporting Manager *</label>
                  <div className="relative">
                    <select
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select Manager...</option>
                      {users.map(u => (
                        <option key={u.id || u.name} value={u.name}>{u.name} ({u.dept})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Cost Center */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cost Center</label>
                  <Input 
                    placeholder="e.g. IT Department"
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Location */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location *</label>
                  <Input 
                    placeholder="e.g. Bangalore (Office)"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Section 2: Asset Details */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">2. Asset Details</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Asset Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Type *</label>
                  <Input 
                    placeholder="e.g. Laptop, Monitor"
                    required
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Brand preferred */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Brand (Preferred)</label>
                  <Input 
                    placeholder="e.g. Dell, HP, Logitech"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Model preferred */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Model (Preferred)</label>
                  <Input 
                    placeholder="e.g. Latitude 5420"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

              </div>

              {/* Specs */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Configuration / Specifications (Optional)</label>
                <textarea 
                  placeholder="e.g. i5 Processor, 16GB RAM, 512GB SSD..."
                  rows={2}
                  value={configuration}
                  onChange={(e) => setConfiguration(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quantity *</label>
                  <Input 
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority *</label>
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Required For */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required For *</label>
                  <div className="relative">
                    <select
                      value={requiredFor}
                      onChange={(e) => setRequiredFor(e.target.value)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Project Work">Project Work</option>
                      <option value="Daily Task">Daily Task</option>
                      <option value="Presentation">Presentation</option>
                      <option value="Backup">Backup</option>
                      <option value="Office Setup">Office Setup</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Required Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Required Date *</label>
                  <Input 
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

              </div>

              {/* Purpose / Justification */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Purpose / Justification *</label>
                <textarea 
                  placeholder="Provide details of why you need this asset..."
                  rows={3}
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none"
                />
              </div>

            </CardContent>
          </Card>

          {/* Section 3: Additional Information */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">3. Additional Information</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Specific User Radio */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Will this asset be allocated to a specific user? *</label>
                  <div className="flex items-center gap-6 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="allocatedSpecific" 
                        value="Yes" 
                        checked={allocatedSpecific === 'Yes'}
                        onChange={() => setAllocatedSpecific('Yes')}
                        className="rounded-full border-slate-350 text-blue-600 focus:ring-blue-500" 
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="allocatedSpecific" 
                        value="No" 
                        checked={allocatedSpecific === 'No'}
                        onChange={() => setAllocatedSpecific('No')}
                        className="rounded-full border-slate-350 text-blue-600 focus:ring-blue-500" 
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Duration of Use</label>
                  <div className="relative col-span-2">
                    <select
                      value={expectedDuration}
                      onChange={(e) => setExpectedDuration(e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Less than 3 months">Less than 3 months</option>
                      <option value="3 to 6 months">3 to 6 months</option>
                      <option value="6 months to 1 year">6 months to 1 year</option>
                      <option value="More than 1 year">More than 1 year</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Attachments drag drop */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attachments (Optional)</label>
                <div
                  onClick={handleDropZoneClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-[5px] p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-1.5"
                >
                  <Upload className="h-5 w-5 text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag and drop files here or <span className="text-blue-650 hover:underline">click to upload</span></p>
                  <p className="text-[8px] text-slate-450 font-bold uppercase mt-0.5">Supports: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max. 5MB each)</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {attachments.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-[5px] bg-slate-50 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800 text-xs text-slate-655 dark:text-slate-350">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-semibold">{file.name}</span>
                          <span className="text-slate-400 shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveAttachment(idx); }}
                          className="ml-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Side summary preview & guidelines */}
        <div className="space-y-6">
          
          {/* Summary Preview */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden text-xs">
            <div className="border-b dark:border-slate-855 px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200 font-extrabold">Request Summary</h3>
            </div>
            <CardContent className="p-5 space-y-3.5 text-slate-500 font-semibold">
              <div className="flex justify-between py-1 border-b dark:border-slate-855">
                <span className="text-slate-400 font-medium">Asset Type</span>
                <span className="text-slate-800 dark:text-white font-bold">{assetType || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-855">
                <span className="text-slate-400 font-medium">Preferred Model</span>
                <span className="text-slate-800 dark:text-white">{brand || ''} {model || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-855">
                <span className="text-slate-400 font-medium">Quantity</span>
                <span className="text-slate-805 dark:text-white font-bold">{quantity}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-855">
                <span className="text-slate-400 font-medium">Required Date</span>
                <span className="text-slate-800 dark:text-white">{requiredDate || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-slate-855">
                <span className="text-slate-400 font-medium">Priority</span>
                <span className={cn(
                  "font-bold uppercase tracking-wider text-[10px]",
                  priority === 'High' ? 'text-red-500' : priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'
                )}>{priority}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Purpose</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed truncate">{purpose || 'Not defined'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden text-xs">
            <div className="border-b dark:border-slate-855 px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200 font-extrabold">Guidelines</h3>
            </div>
            <CardContent className="p-5 space-y-3 text-[11px] font-medium leading-relaxed text-slate-550 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>Provide accurate details to help us process your request faster.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>Requests are subject to approval by your reporting manager and IT team.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>You will be notified on the status of your request.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                <span>For urgent requirements, please contact IT Support.</span>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden text-xs">
            <div className="border-b dark:border-slate-855 px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200 font-extrabold">Need Help?</h3>
            </div>
            <CardContent className="p-5 space-y-3.5 text-slate-550 font-semibold">
              <p className="text-[11px] leading-relaxed">For any issues with asset requests, contact IT Support.</p>
              
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">support@crmfarmit.com</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>+91 80 1234 5678</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>

    </form>
  );
}
