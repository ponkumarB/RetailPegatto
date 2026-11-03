'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { fetchAssetMasterWithoutPagination, fetchAssetMaintenanceById } from '@/service/api/Assets';
import { useQuery } from '@tanstack/react-query';
import { 
  Wrench,
  ArrowLeft,
  ChevronDown,
  Info,
  Calendar,
  AlertCircle,
  Clock,
  User,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { AssetMaintenance } from '@/types/asset';

export default function EditMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const maintenanceId = params.id as string;

  const { updateMaintenance, rawCategories, fetchInitialData, isLoaded } = useAssetStore();

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data if store is not loaded
  useEffect(() => {
    if (!isLoaded) {
      fetchInitialData();
    }
  }, [isLoaded, fetchInitialData]);

  // Fetch all assets from master list without pagination immediately
  const { data: rawAssets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assetsMasterListWithoutPagination'],
    queryFn: fetchAssetMasterWithoutPagination,
  });

  const availableAssets = React.useMemo(() => {
    if (!Array.isArray(rawAssets)) return [];
    const nonDeleted = rawAssets.filter(item => !item.Is_Deleted);
    return nonDeleted.map(item => {
      const catObj = rawCategories.find(c => Number(c.id) === Number(item.Category_Id));
      const categoryName = catObj ? catObj.Category_Name : 'Laptop';

      return {
        id: item.id.toString(),
        name: item.Asset_Name,
        tagId: item.Asset_Code || item.id.toString(),
        category: categoryName,
        serialNumber: item.Serial_Number || '',
        status: item.Asset_Status || 'Available'
      };
    });
  }, [rawAssets, rawCategories]);

  // Form states
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [maintenanceType, setMaintenanceType] = useState<'Preventive' | 'Corrective' | 'Upgrade' | 'Calibration'>('Corrective');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [performedBy, setPerformedBy] = useState('IT Support Team');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');

  // Load maintenance record by ID
  useEffect(() => {
    if (!maintenanceId) return;
    let isMounted = true;
    setIsDataLoading(true);

    fetchAssetMaintenanceById(Number(maintenanceId))
      .then((mntData) => {
        if (isMounted) {
          if (mntData) {
            setSelectedAssetId(mntData.Asset_Id?.toString() || '');
            setDescription(mntData.Issue_Description || '');
            setCost(mntData.Maintenance_Cost?.toString() || '');
            setStartDate(mntData.Start_Date ? mntData.Start_Date.split('T')[0] : '');
            setEndDate(mntData.End_Date ? mntData.End_Date.split('T')[0] : '');
            setNotes(mntData.Remarks || '');
            setStatus((mntData.Status as any) || 'Pending');
            setPerformedBy(mntData.Vendor_Id ? `Vendor ${mntData.Vendor_Id}` : 'IT Support Team');
          } else {
            setError('Maintenance record not found.');
          }
          setIsDataLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching maintenance details:', err);
        if (isMounted) {
          setError('Failed to load maintenance details.');
          setIsDataLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [maintenanceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      toast.warning('Please select an asset.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAssetObj = availableAssets.find(a => a.id === selectedAssetId);
      
      const updatedLog: Partial<AssetMaintenance> = {
        assetId: selectedAssetId,
        assetName: selectedAssetObj?.name || '',
        assetTag: selectedAssetObj?.tagId || '',
        maintenanceType,
        description,
        cost: cost ? `${Number(cost).toLocaleString()}` : '0',
        startDate,
        endDate: endDate || '-',
        status,
        performedBy,
        notes
      };

      await updateMaintenance(maintenanceId, updatedLog);
      toast.success('Maintenance record updated successfully!');
      router.push('/assets/maintenance');
    } catch (err: any) {
      console.error('Failed to update maintenance details:', err);
      toast.error(err?.message || 'Failed to update maintenance details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAsset = availableAssets.find(a => a.id === selectedAssetId);

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
        <p className="text-sm text-center text-slate-400">The maintenance log record could not be retrieved.</p>
        <Button variant="outline" className="h-9 rounded-[5px]" onClick={() => router.push('/assets/maintenance')}>
          Back to Maintenance List
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
            <span className="hover:text-slate-655 cursor-pointer" onClick={() => router.push('/assets/maintenance')}>Asset Maintenance</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Edit Maintenance Log</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Maintenance Log</h1>
          <p className="text-xs text-slate-455 mt-1">Modify details for this maintenance log entry.</p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <Button 
            type="button" 
            variant="outline" 
            className="h-9.5 px-4 rounded-[5px] text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
            onClick={() => router.push('/assets/maintenance')}
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
          
          {/* Card 1: Select Asset */}
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
                      <option value="">Choose asset...</option>
                      {availableAssets.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.tagId}) - {a.status}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  {selectedAsset && (
                    <div className="p-3 border rounded-[5px] bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold dark:border-slate-800">
                      <p className="text-[9px] uppercase text-slate-400 font-bold">Category</p>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedAsset.category || 'N/A'}</p>
                    </div>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 2: Service Details */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-855 px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">2. Service Details</h3>
            </div>
            <CardContent className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maintenance Type</label>
                  <div className="relative">
                    <select
                      value={maintenanceType}
                      onChange={(e) => setMaintenanceType(e.target.value as any)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Corrective">Corrective (Repair)</option>
                      <option value="Preventive">Preventive (Checkup)</option>
                      <option value="Upgrade">Upgrade (Hardware/Software)</option>
                      <option value="Calibration">Calibration</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Performed By</label>
                  <Input 
                    placeholder="e.g. IT Support Team, external vendor"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    className="h-9.5 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Description</label>
                <textarea
                  placeholder="Explain what repair, upgrade, or checks were performed..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-300 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Service Cost</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 2500"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="h-9.5 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Start Date</label>
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9.5 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">End Date</label>
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9.5 rounded-[5px] text-xs border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-350 px-3 pr-8 appearance-none focus:outline-none"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Additional Remarks / Notes</label>
                <textarea
                  placeholder="Add any additional comments or notes..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-300 focus:outline-none"
                />
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="bg-slate-50/50 dark:bg-slate-955/20 px-5 py-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Summary Info</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-955/20 text-blue-600 flex items-center justify-center border shrink-0 dark:border-blue-900/30">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Logging Guidelines</h4>
                  <p className="text-[10px] text-slate-455 font-semibold mt-1">
                    Updating maintenance records automatically locks the asset status to "Maintenance" to prevent re-allocation until work is complete.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t dark:border-slate-850 pt-4">
                <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-955/20 text-amber-600 flex items-center justify-center border shrink-0 dark:border-amber-900/30">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Update</h4>
                  <p className="text-[10px] text-slate-455 font-semibold mt-1">
                    Once maintenance task is set to 'Completed' in the listing actions, the asset will automatically revert to 'Available' in stock.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

    </form>
  );
}
