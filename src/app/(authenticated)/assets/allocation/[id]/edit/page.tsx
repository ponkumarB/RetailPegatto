'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { fetchUsersList } from '@/service/api/Leads/api';
import { fetchAssetMasterWithoutPagination, fetchAssetTransactionById } from '@/service/api/Assets';
import { useQuery } from '@tanstack/react-query';
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
  AlertCircle,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AssetAllocation, Asset } from '@/types/asset';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditAllocationPage() {
  const params = useParams();
  const router = useRouter();
  const allocationId = params.id as string;
  const { updateAllocation, rawCategories } = useAssetStore();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all assets from master list without pagination immediately for Edit page
  const { data: rawAssets, isLoading: isAssetsLoading } = useQuery({
    queryKey: ['assetsMasterListWithoutPagination'],
    queryFn: fetchAssetMasterWithoutPagination,
  });

  const availableAssets = React.useMemo(() => {
    if (!Array.isArray(rawAssets)) return [];
    const nonDeleted = rawAssets.filter(item => !item.Is_Deleted);
    return nonDeleted.map(item => {
      const catObj = rawCategories.find(c => Number(c.id) === Number(item.Category_Id));
      const categoryName = catObj ? catObj.Category_Name : 'Laptop';
      
      let type: Asset['type'] = 'Hardware';
      if (categoryName.toLowerCase() === 'software') type = 'Software';
      else if (categoryName.toLowerCase() === 'mobile') type = 'Mobile';
      else if (categoryName.toLowerCase() === 'mouse' || categoryName.toLowerCase() === 'keyboard') type = 'Peripheral';

      return {
        id: item.id.toString(),
        name: item.Asset_Name,
        tagId: item.Asset_Code || item.id.toString(),
        type,
        category: categoryName,
        serialNumber: item.Serial_Number || '',
        status: (item.Asset_Status || 'Available') as Asset['status']
      } as Asset;
    });
  }, [rawAssets, rawCategories]);

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [manager, setManager] = useState('');
  
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [costCenter, setCostCenter] = useState('');
  
  const [allocationDate, setAllocationDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [comments, setComments] = useState('');
  const [status, setStatus] = useState('Allocated');

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
        email: u.email || `${u.username || 'user'}@crmfarmit.com`,
        phone: u.phone || '+91 98765 43210',
        dept: u.department || 'IT Department',
        manager: 'CEO'
      }));
    }
    return [];
  }, [usersRaw]);

  // Load allocation data by ID
  useEffect(() => {
    if (!allocationId) return;
    let isMounted = true;
    setIsDataLoading(true);

    fetchAssetTransactionById(Number(allocationId))
      .then((txData) => {
        if (isMounted) {
          if (txData) {
            setSelectedAssetId(txData.Asset_Id?.toString() || '');
            setUserName(txData.Employee_Name || '');
            setEmail(txData.Email || '');
            setPhone(txData.Mobile_Number || '');
            setDepartment(txData.Department || '');
            setLocation(txData.Location || '');
            setAddress(txData.Address || '');
            setCostCenter(txData.Cost_Center || '');
            setAllocationDate(txData.Transaction_Date || '');
            setExpectedReturnDate(txData.Expected_Return || '');
            setComments(txData.Remarks || '');
            setStatus(txData.Transaction_Type === 'ALLOCATE' ? 'Allocated' : 'Returned');
          } else {
            setError('Allocation record not found.');
          }
          setIsDataLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching allocation details:', err);
        if (isMounted) {
          setError('Failed to load allocation details.');
          setIsDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [allocationId]);

  // Handle asset select change
  useEffect(() => {
    const asset = availableAssets.find(a => a.id === selectedAssetId);
    setSelectedAsset(asset || null);
  }, [selectedAssetId, availableAssets]);

  // Handle user select change
  const handleUserSelect = (name: string) => {
    setUserName(name);
    const user = users.find(u => u.name === name);
    if (user) {
      setEmail(user.email);
      setPhone(user.phone);
      setDepartment(user.dept);
      setManager(user.manager);
    } else {
      setEmail('');
      setPhone('');
      setDepartment('');
      setManager('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.error('Please select an asset.');
      return;
    }
    if (!userName) {
      toast.error('Please select a user.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedAllocation: Partial<AssetAllocation> = {
        assetId: selectedAsset?.id || '',
        assetName: selectedAsset?.name || '',
        assetTag: selectedAsset?.tagId || '',
        assetType: selectedAsset?.type || 'Hardware',
        allocatedTo: userName,
        email,
        phone,
        department,
        reportingManager: manager,
        location,
        address,
        costCenter,
        allocationDate,
        expectedReturnDate: expectedReturnDate || '',
        status: status as any,
        purposeComments: comments
      };

      await updateAllocation(allocationId, updatedAllocation);
      toast.success('Asset allocation updated successfully!');
      router.push('/assets/allocation');
    } catch (err: any) {
      console.error('Failed to update asset allocation:', err);
      toast.error(err?.message || 'Failed to update asset allocation.');
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
        <p className="text-sm text-center text-slate-400">The allocation record could not be retrieved.</p>
        <Button variant="outline" className="h-9 rounded-[5px]" onClick={() => router.push('/assets/allocation')}>
          Back to Allocation List
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-455 font-semibold mb-0.5">
            <span>Assets</span>
            <span>&gt;</span>
            <span className="hover:text-slate-655 cursor-pointer" onClick={() => router.push('/assets/allocation')}>Asset Management</span>
            <span>&gt;</span>
            <span className="hover:text-slate-655 cursor-pointer" onClick={() => router.push('/assets/allocation')}>Asset Allocation</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Edit Allocation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Allocation</h1>
          <p className="text-xs text-slate-455 mt-1">Modify details for this asset allocation.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
            onClick={() => router.push('/assets/allocation')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="h-9.5 px-5 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-3.5 w-3.5" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Columns Form fields */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Section 1: Select Asset */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">1. Select Asset</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset *</label>
                  <div className="relative">
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">
                        {isAssetsLoading ? "Loading assets..." : "Search by asset..."}
                      </option>
                      {availableAssets.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.tagId} - Serial: {a.serialNumber}) [{a.status}]
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Type</label>
                  <div className="h-9.5 rounded-[5px] border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 flex items-center text-xs text-slate-600 dark:text-slate-400 font-semibold">
                    {selectedAsset ? selectedAsset.type : 'Select an asset'}
                  </div>
                </div>

              </div>
              
              {selectedAsset && (() => {
                const statusVal = selectedAsset.status || 'Available';
                const statusStyles: Record<string, { bg: string; border: string; iconColor: string; badgeBg: string; badgeText: string }> = {
                  'Available': {
                    bg: 'bg-emerald-50/30 dark:bg-emerald-955/10',
                    border: 'border-emerald-100 dark:border-emerald-955/20',
                    iconColor: 'text-emerald-500',
                    badgeBg: 'bg-emerald-50 dark:bg-emerald-955/20',
                    badgeText: 'text-emerald-700 dark:text-emerald-400'
                  },
                  'In Use': {
                    bg: 'bg-blue-50/30 dark:bg-blue-955/10',
                    border: 'border-blue-100 dark:border-blue-955/20',
                    iconColor: 'text-blue-505',
                    badgeBg: 'bg-blue-50 dark:bg-blue-955/20',
                    badgeText: 'text-blue-700 dark:text-blue-400'
                  },
                  'Maintenance': {
                    bg: 'bg-amber-50/30 dark:bg-amber-955/10',
                    border: 'border-amber-100 dark:border-amber-955/20',
                    iconColor: 'text-amber-500',
                    badgeBg: 'bg-amber-50 dark:bg-amber-955/20',
                    badgeText: 'text-amber-700 dark:text-amber-400'
                  },
                  'Retired': {
                    bg: 'bg-slate-100/50 dark:bg-slate-800/20',
                    border: 'border-slate-200 dark:border-slate-700',
                    iconColor: 'text-slate-400',
                    badgeBg: 'bg-slate-100 dark:bg-slate-800',
                    badgeText: 'text-slate-655 dark:text-slate-400'
                  },
                  'Disposed': {
                    bg: 'bg-rose-50/30 dark:bg-rose-955/10',
                    border: 'border-rose-100 dark:border-rose-955/20',
                    iconColor: 'text-rose-450',
                    badgeBg: 'bg-rose-50 dark:bg-rose-955/20',
                    badgeText: 'text-rose-700 dark:text-rose-400'
                  }
                };
                const style = statusStyles[statusVal] || statusStyles['Available'];
                return (
                  <div className={`mt-4 p-4 rounded-[5px] ${style.bg} border ${style.border} flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <Laptop className={`h-5 w-5 ${style.iconColor}`} />
                      <div className="text-xs font-semibold">
                        <p className="font-bold text-slate-850 dark:text-white">{selectedAsset.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {selectedAsset.tagId} &bull; Serial: {selectedAsset.serialNumber} &bull; {selectedAsset.category}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${style.badgeBg} ${style.badgeText}`}>
                      {statusVal}
                    </span>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Section 2: Allocate To */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">2. Allocate To User</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User *</label>
                  <div className="relative">
                    <select
                      value={userName}
                      onChange={(e) => handleUserSelect(e.target.value)}
                      required
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="">Select User...</option>
                      {users.map(u => (
                        <option key={u.id || u.name} value={u.name}>{u.name} ({u.dept})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
                  <Input 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="User email"
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</label>
                  <Input 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="User phone"
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="User department"
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reporting Manager</label>
                  <div className="relative">
                    <select
                      value={manager}
                      onChange={(e) => setManager(e.target.value)}
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

              </div>
            </CardContent>
          </Card>

          {/* Section 3: Location */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">3. Location</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location *</label>
                  <Input
                    placeholder="e.g. Office Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</label>
                  <textarea
                    placeholder="Physical address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cost Center</label>
                  <Input
                    placeholder="e.g. IT Department"
                    value={costCenter}
                    onChange={(e) => setCostCenter(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Section 4: Allocation Details */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">4. Allocation Details</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Allocation Date *</label>
                  <Input 
                    type="date"
                    required
                    value={allocationDate}
                    onChange={(e) => setAllocationDate(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Expected Return Date</label>
                  <Input 
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="h-9.5 rounded-[5px] border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Allocated">Allocated</option>
                      <option value="Returned">Returned</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Purpose / Comments</label>
                  <textarea 
                    placeholder="Enter allocation details or remarks..."
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none"
                  />
                </div>

              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Side Column: Summary Preview */}
        <div className="space-y-6">
          
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden text-xs">
            <div className="border-b dark:border-slate-855 px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200 font-extrabold">Allocation Summary</h3>
            </div>
            <CardContent className="p-5 space-y-5">
              
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Asset Details</p>
                {selectedAsset ? (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-[5px] bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800">
                    <Laptop className="h-4.5 w-4.5 text-blue-500" />
                    <div>
                      <p className="font-bold text-slate-855 dark:text-white truncate">{selectedAsset.name}</p>
                      <p className="text-[9px] text-slate-450 font-semibold">{selectedAsset.category} &bull; Tag: {selectedAsset.tagId}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No asset selected</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Allocate To</p>
                {userName ? (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-[5px] bg-slate-50 dark:bg-slate-955/20 border dark:border-slate-800">
                    <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-2xs">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </span>
                    <div>
                      <p className="font-bold text-slate-850 dark:text-white">{userName}</p>
                      <p className="text-[9px] text-slate-455 font-semibold">{department || 'Employee'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No user selected</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                <div className="p-2.5 rounded-[5px] bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 space-y-1">
                  <p className="font-bold text-slate-805 dark:text-white">{location || '-'}</p>
                  {address && <p className="text-[9px] text-slate-455 leading-relaxed truncate">{address}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Allocation Details</p>
                <div className="space-y-1 font-semibold text-slate-655 dark:text-slate-400">
                  <div className="flex justify-between py-1 border-b dark:border-slate-850">
                    <span className="text-slate-455">Allocation Date</span>
                    <span className="text-slate-800 dark:text-slate-205">{allocationDate || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b dark:border-slate-850">
                    <span className="text-slate-455">Expected Return</span>
                    <span className="text-slate-800 dark:text-slate-205">{expectedReturnDate || 'Indefinite'}</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

    </form>
  );
}
