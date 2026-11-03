'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAssetStore } from '@/store/useAssetStore';
import * as api from '@/service/api/Assets/api';
import { toast } from 'sonner';
import { 
  Building, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  Laptop, 
  CheckCircle, 
  Loader2, 
  AlertTriangle, 
  Trash2, 
  Edit,
  Wrench,
  DollarSign,
  User,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetMaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const maintenanceId = params.id as string;
  const queryClient = useQueryClient();
  const { updateMaintenance, deleteMaintenance, rawAssetsForMapping } = useAssetStore();

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch single maintenance log
  const { data: rawMnt, isLoading, error, refetch } = useQuery({
    queryKey: ['assetMaintenance', maintenanceId],
    queryFn: async () => {
      const res = await api.fetchAssetMaintenanceById(Number(maintenanceId));
      return Array.isArray(res) ? res[0] : res;
    },
    enabled: !!maintenanceId,
  });

  const mnt = React.useMemo(() => {
    if (!rawMnt) return null;
    const assetObj = rawAssetsForMapping.find(a => a.id.toString() === rawMnt.Asset_Id?.toString());
    return {
      id: rawMnt.id?.toString(),
      assetId: rawMnt.Asset_Id?.toString() || '',
      assetName: assetObj ? assetObj.Asset_Name : 'Unknown Asset',
      assetTag: assetObj ? (assetObj.Asset_Code || assetObj.id.toString()) : '—',
      maintenanceType: rawMnt.Maintenance_Type || 'Corrective',
      description: rawMnt.Issue_Description || '—',
      cost: rawMnt.Maintenance_Cost ? `${Number(rawMnt.Maintenance_Cost).toLocaleString()}` : '0',
      startDate: rawMnt.Start_Date ? rawMnt.Start_Date.split('T')[0] : '—',
      endDate: rawMnt.End_Date ? rawMnt.End_Date.split('T')[0] : '—',
      status: (rawMnt.Status as any) || 'Pending',
      performedBy: rawMnt.Vendor_Id ? `Vendor ${rawMnt.Vendor_Id}` : 'IT Support Team',
      notes: rawMnt.Remarks || ''
    };
  }, [rawMnt, rawAssetsForMapping]);

  const handleStatusUpdate = async (status: 'Pending' | 'In Progress' | 'Completed') => {
    if (!mnt) return;
    setIsActionLoading(true);
    try {
      await updateMaintenance(mnt.id, { status });
      toast.success(`Service status updated to ${status}`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['assetMaintenance', maintenanceId] });
    } catch (err: any) {
      toast.error(err?.message || `Failed to update status to ${status}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!mnt) return;
    if (!confirm('Are you sure you want to delete this maintenance log?')) return;
    setIsActionLoading(true);
    try {
      await deleteMaintenance(mnt.id);
      router.push('/assets/maintenance');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete maintenance log');
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left pt-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !mnt) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left pt-10">
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl p-6 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Maintenance Log Not Found</h2>
          <p className="text-xs text-slate-500">The maintenance log ID you are looking for does not exist or has been deleted.</p>
          <Button variant="outline" onClick={() => router.push('/assets/maintenance')}>
            Back to Service Registry
          </Button>
        </div>
      </div>
    );
  }

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'Upgrade': return 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30';
      case 'Preventive': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30';
      case 'Calibration': return 'bg-purple-50 text-purple-700 dark:bg-purple-955/20 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30';
      default: return 'bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-200 dark:border-red-900/30';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Completed':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/30">Completed</span>;
      case 'In Progress':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-200 rounded-md dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/30">In Progress</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-amber-50 text-amber-600 border border-amber-200 rounded-md dark:bg-amber-955/25 dark:text-amber-400 dark:border-amber-900/30">Pending</span>;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left pt-6">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer animate-in fade-in"
            onClick={() => router.push('/assets/maintenance')}
          >
            <ArrowLeft className="h-4.5 w-4.5 text-slate-800 dark:text-white" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
              <span className="hover:text-slate-655 cursor-pointer" onClick={() => router.push('/assets/maintenance')}>Maintenance Log</span>
              <span>&gt;</span>
              <span>Details</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Log #{mnt.id}
              {getStatusBadge(mnt.status)}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push(`/assets/maintenance/${mnt.id}/edit`)}
            variant="outline"
            className="h-9 px-4 rounded-[5px] text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800 cursor-pointer bg-white dark:bg-slate-900"
          >
            <Edit className="h-4 w-4" />
            Edit Service Log
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            className="h-9 px-4 rounded-[5px] text-xs font-bold gap-1.5 border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 cursor-pointer bg-white dark:bg-slate-900"
          >
            <Trash2 className="h-4 w-4" />
            Delete Log
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
              <Laptop className="h-5 w-5 text-blue-650" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-extrabold">Asset & Maintenance Details</h2>
            </div>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 font-semibold block">Asset Name</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-0.5 block">{mnt.assetName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Asset Tag / ID</span>
                  <span className="text-slate-805 dark:text-slate-200 font-bold block mt-0.5">{mnt.assetTag}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Maintenance Type</span>
                  <span className={cn("px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-md inline-block mt-1", getTypeColor(mnt.maintenanceType))}>
                    {mnt.maintenanceType}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 font-semibold block">Service Cost</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-0.5 block flex items-center gap-0.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    {mnt.cost}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Start Date</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5 block">{mnt.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">End Date</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5 block">{mnt.endDate}</span>
                </div>
              </div>

              {mnt.description && (
                <div className="col-span-1 md:col-span-2 pt-4 border-t dark:border-slate-800">
                  <span className="text-slate-400 font-semibold block">Service Description / Issue</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed mt-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-850 whitespace-pre-line">
                    {mnt.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-650" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-extrabold">Remarks & Notes</h2>
            </div>
            <CardContent className="p-6 text-xs space-y-4">
              <div>
                <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-850 whitespace-pre-line">
                  {mnt.notes || 'No remarks recorded.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-650" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-extrabold">Service Agent</h2>
            </div>
            <CardContent className="p-6 text-xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-white shrink-0 shadow-2xs">
                  <Wrench className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{mnt.performedBy}</h4>
                  <span className="text-slate-400 font-semibold">Assigned Service Provider</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Actions */}
          {(mnt.status === 'Pending' || mnt.status === 'In Progress') && (
            <Card className="border border-blue-100 dark:border-slate-800 bg-blue-50/20 dark:bg-slate-900/30 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-blue-50/50 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-extrabold">Workflow Actions</h2>
              </div>
              <CardContent className="p-5 space-y-3">
                {mnt.status === 'Pending' && (
                  <Button
                    onClick={() => handleStatusUpdate('In Progress')}
                    disabled={isActionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-[5px] flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-4 w-4" />}
                    Start Service
                  </Button>
                )}

                {mnt.status === 'In Progress' && (
                  <Button
                    onClick={() => handleStatusUpdate('Completed')}
                    disabled={isActionLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-[5px] flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Complete Service
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
