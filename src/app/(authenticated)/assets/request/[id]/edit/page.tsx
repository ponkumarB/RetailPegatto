'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';


import { fetchUsersList } from '@/service/api/Leads/api';
import * as api from '@/service/api/Assets/api';
import { fetchUserFile } from '@/service/api/Resource/api';
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
  Loader2,
  AlertCircle,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function EditAssetRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;



  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [requestStatus, setRequestStatus] = useState('Pending');

  // Attachments State
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachmentId, setExistingAttachmentId] = useState<string | null>(null);
  const [existingAttachmentName, setExistingAttachmentName] = useState<string | null>(null);
  const [isAttachmentDeleted, setIsAttachmentDeleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (!requestId) return;
    
    let isMounted = true;
    setIsDataLoading(true);

    api.fetchAssetRequestById(Number(requestId))
      .then(async (reqData) => {
        if (isMounted) {
          if (reqData) {
            setRequestedBy(reqData.Requested_By || '');
            setDepartment(reqData.Department || '');
            setEmail(reqData.Email || '');
            setPhone(reqData.Phone || '');
            setManager(reqData.Reporting_Manager || '');
            setLocation(reqData.Location || '');
            setAssetType(reqData.Asset_Type || '');
            setBrand(reqData.Preferred_Brand || '');
            setModel(reqData.Preferred_Model || '');
            setConfiguration(reqData.Configuration || '');
            setQuantity(Number(reqData.Quantity) || 1);
            setPriority((reqData.Priority as any) || 'Medium');
            setPurpose(reqData.Purpose || '');
            setRequiredDate(reqData.Required_Date || '');
            setExpectedDuration(reqData.Expected_Duration || 'More than 1 year');
            setRequestStatus(reqData.Status || 'Pending');
            
            if (reqData.Attachment && Array.isArray(reqData.Attachment) && reqData.Attachment.length > 0) {
              const firstId = String(reqData.Attachment[0]);
              setExistingAttachmentId(firstId);
              try {
                const fileMeta = await fetchUserFile(firstId);
                if (fileMeta && fileMeta.FileName) {
                  setExistingAttachmentName(fileMeta.FileName);
                } else {
                  setExistingAttachmentName("Attached File");
                }
              } catch (e) {
                console.error("Failed to load attachment metadata:", e);
                setExistingAttachmentName("Attached File (ID: " + firstId + ")");
              }
            }
          } else {
            setError('Request not found.');
          }
          setIsDataLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching request:', err);
        if (isMounted) {
          setError('Failed to load request details.');
          setIsDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [requestId]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.size <= 5 * 1024 * 1025);
    if (valid.length < files.length) toast.warning('Some files exceed 5MB and were skipped.');
    setAttachments(prev => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // If user uploads a new file, we can clear the existing attachment indicator
    setIsAttachmentDeleted(true);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = () => {
    setIsAttachmentDeleted(true);
    setExistingAttachmentId(null);
    setExistingAttachmentName(null);
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter(f => f.size <= 5 * 1024 * 1025);
    if (valid.length < files.length) toast.warning('Some files exceed 5MB and were skipped.');
    setAttachments(prev => [...prev, ...valid]);
    setIsAttachmentDeleted(true);
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
      // Determine attachment ID as a number (or null)
      let attachmentIdNum: number | null = existingAttachmentId ? Number(existingAttachmentId) : null;

      // If the user uploaded new attachments, upload the first one
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
          attachmentIdNum = fileRecord.id;
        }
      } else if (isAttachmentDeleted) {
        // User removed the attachment without uploading a new one
        attachmentIdNum = null;
      }

      // Call the API directly to send Attachment as an array (e.g. [1155])
      await api.updateAssetRequest({
        id: Number(requestId),
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
        Status: requestStatus,
        Attachment: attachmentIdNum ? [attachmentIdNum] : null,
        Is_Deleted: false,
        Created_By: getUserId(),
        Updated_By: getUserId(),
      });

      toast.success('Asset request updated successfully!');
      router.push('/assets/request');
    } catch (error: any) {
      console.error('Failed to update asset request:', error);
      if (error?.message !== 'Content file too large') {
        toast.error(error?.message || 'Failed to update request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDataLoading) {
    return (
      <div className="max-w-[1600px] mx-auto py-20 text-center text-slate-400 space-y-6">
        <Skeleton className="h-10 w-1/4 rounded-[5px]" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-left max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{error}</h3>
        <p className="text-sm text-center text-slate-400">The asset request record you requested could not be retrieved.</p>
        <Button variant="outline" className="h-9 rounded-[5px]" onClick={() => router.push('/assets/request')}>
          Back to Request List
        </Button>
      </div>
    );
  }

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
            <span className="text-slate-505 font-medium">Edit Request</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Asset Request</h1>
          <p className="text-xs text-slate-455 mt-1">Modify pending asset details, requesters, specifications, or duration details.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-355"
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
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-3.5 w-3.5" /> Save Changes</>
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
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
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
                  className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none"
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
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
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
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-335 px-3 pr-8 appearance-none focus:outline-none"
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

                {/* Expected Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Duration of Use</label>
                  <div className="relative col-span-2">
                    <select
                      value={expectedDuration}
                      onChange={(e) => setExpectedDuration(e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-808 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
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
                
                {/* Existing attachment indicator */}
                {existingAttachmentName && (
                  <div className="flex items-center justify-between p-2 rounded-[5px] bg-blue-50/50 dark:bg-blue-955/10 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-400 mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate font-bold">Current: {existingAttachmentName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveExistingAttachment}
                      className="text-blue-500 hover:text-red-500 transition-colors shrink-0"
                      title="Remove Attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div
                  onClick={handleDropZoneClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-[5px] p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center space-y-1.5"
                >
                  <Upload className="h-5 w-5 text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Drag and drop files here or <span className="text-blue-650 hover:underline">click to upload new</span></p>
                  <p className="text-[8px] text-slate-455 font-bold uppercase mt-0.5">Supports: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (Max. 5MB each)</p>
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

        {/* Right Side Panel: Helper instructions */}
        <div className="space-y-6">
          <Card className="border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[5px] bg-blue-50 dark:bg-blue-955/20 text-blue-600 shrink-0">
                <Info className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white">Editing Asset Requests</h4>
                <p className="text-[11px] text-slate-455 mt-1 leading-relaxed">
                  Only requests in 'Pending' status can be modified. Once a request has been approved or processed, details cannot be changed.
                </p>
              </div>
            </div>
            
            <div className="border-t border-slate-200/60 dark:border-slate-800/65 pt-4 space-y-3">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Request Guidelines</h5>
              <ul className="space-y-2 text-[11px] text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Requester Details:</strong> Selecting a requester auto-populates their email, phone, location, and department.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Priority:</strong> High-priority requests require additional justification details.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span><strong>Duration:</strong> Specify the duration of usage to facilitate asset recovery planning.</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>

      </div>
    </form>
  );
}
