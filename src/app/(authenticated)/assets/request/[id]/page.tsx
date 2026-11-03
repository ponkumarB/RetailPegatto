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
  Mail, 
  Phone, 
  Loader2, 
  AlertTriangle, 
  Trash2, 
  Edit,
  XCircle,
  User,
  ClipboardList
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const queryClient = useQueryClient();
  const { updateRequest, deleteRequest } = useAssetStore();

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch single asset request
  const { data: rawRequest, isLoading, error, refetch } = useQuery({
    queryKey: ['assetRequest', requestId],
    queryFn: async () => {
      const res = await api.fetchAssetRequestById(Number(requestId));
      return Array.isArray(res) ? res[0] : res;
    },
    enabled: !!requestId,
  });

  const request = React.useMemo(() => {
    if (!rawRequest) return null;
    return {
      id: rawRequest.id?.toString(),
      requestedBy: rawRequest.Requested_By || '—',
      department: rawRequest.Department || '—',
      email: rawRequest.Email || '—',
      phone: rawRequest.Phone || '—',
      reportingManager: rawRequest.Reporting_Manager || '—',
      location: rawRequest.Location || '—',
      assetType: rawRequest.Asset_Type || '—',
      brand: rawRequest.Preferred_Brand || '—',
      model: rawRequest.Preferred_Model || '—',
      configuration: rawRequest.Configuration || '',
      quantity: rawRequest.Quantity ? parseInt(rawRequest.Quantity, 10) || 0 : 0,
      priority: (rawRequest.Priority as any) || '—',
      requiredFor: rawRequest.Purpose || '',
      requiredDate: rawRequest.Required_Date || '',
      purpose: rawRequest.Purpose || '',
      status: (rawRequest.Status as any) || 'Pending',
      requestDate: rawRequest.Created_Date || '',
      expectedDuration: rawRequest.Expected_Duration || '—'
    };
  }, [rawRequest]);

  const handleStatusUpdate = async (status: 'Approved' | 'Rejected' | 'Issued') => {
    if (!request) return;
    setIsActionLoading(true);
    try {
      await updateRequest(request.id, { status });
      toast.success(`Request successfully marked as ${status}`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['assetRequest', requestId] });
    } catch (err: any) {
      toast.error(err?.message || `Failed to update status to ${status}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!request) return;
    if (!confirm('Are you sure you want to delete this asset request?')) return;
    setIsActionLoading(true);
    try {
      await deleteRequest(request.id);
      router.push('/assets/request');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete request');
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

  if (error || !request) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left pt-10">
        <div className="bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl p-6 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Asset Request Not Found</h2>
          <p className="text-xs text-slate-500">The request ID you are looking for does not exist or has been deleted.</p>
          <Button variant="outline" onClick={() => router.push('/assets/request')}>
            Back to Registry
          </Button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'High': return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-955/25 dark:text-rose-400 dark:border-rose-900/30';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-955/25 dark:text-amber-400 dark:border-amber-900/30';
      default: return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'Approved':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/30">Approved</span>;
      case 'Issued':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-200 rounded-md dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/30">Issued</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-rose-50 text-rose-600 border border-rose-200 rounded-md dark:bg-rose-955/25 dark:text-rose-400 dark:border-rose-900/30">Rejected</span>;
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
            onClick={() => router.push('/assets/request')}
          >
            <ArrowLeft className="h-4.5 w-4.5 text-slate-800 dark:text-white" />
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
              <span className="hover:text-slate-655 cursor-pointer" onClick={() => router.push('/assets/request')}>Asset Requests</span>
              <span>&gt;</span>
              <span>Request Details</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              Request #{request.id}
              {getStatusBadge(request.status)}
            </h1>
          </div>
        </div>

        {/* Action buttons (top right) */}
        <div className="flex items-center gap-3">
          {request.status === 'Pending' && (
            <Button
              onClick={() => router.push(`/assets/request/${request.id}/edit`)}
              variant="outline"
              className="h-9 px-4 rounded-[5px] text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800 cursor-pointer bg-white dark:bg-slate-900"
            >
              <Edit className="h-4 w-4" />
              Edit Request
            </Button>
          )}
          <Button
            onClick={handleDelete}
            variant="outline"
            className="h-9 px-4 rounded-[5px] text-xs font-bold gap-1.5 border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 cursor-pointer bg-white dark:bg-slate-900"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
              <Laptop className="h-5 w-5 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Asset Specification</h2>
            </div>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 font-semibold block">Asset Type</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-0.5 block">{request.assetType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Preferred Brand</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-0.5 block">{request.brand || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Preferred Model</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-0.5 block">{request.model || '—'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 font-semibold block">Quantity</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-0.5 block">{request.quantity}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Priority</span>
                  <span className={cn("px-2 py-0.5 text-[10px] font-bold border rounded-md inline-block mt-1", getPriorityColor(request.priority))}>
                    {request.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block">Expected Duration</span>
                  <span className="text-slate-800 dark:text-slate-200 font-extrabold text-sm mt-0.5 block">{request.expectedDuration}</span>
                </div>
              </div>

              {request.configuration && (
                <div className="col-span-1 md:col-span-2 pt-4 border-t dark:border-slate-800">
                  <span className="text-slate-400 font-semibold block">Requested Configuration</span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed mt-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-850 whitespace-pre-line">
                    {request.configuration}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-650" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Purpose & Justification</h2>
            </div>
            <CardContent className="p-6 text-xs space-y-4">
              <div>
                <span className="text-slate-400 font-semibold block">Purpose / Reason</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed mt-1 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border dark:border-slate-850 whitespace-pre-line">
                  {request.purpose || 'No justification provided.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Requester & Actions */}
        <div className="space-y-6">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-650" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-extrabold">Requester Details</h2>
            </div>
            <CardContent className="p-6 text-xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-2xs">
                  {request.requestedBy ? request.requestedBy.split(' ').map(n => n[0]).join('') : '?'}
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">{request.requestedBy}</h4>
                  <span className="text-slate-400 font-semibold">{request.department}</span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{request.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{request.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Building className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{request.location || '—'}</span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t dark:border-slate-800">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Reporting Manager:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">{request.reportingManager || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Request Date:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">
                    {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-semibold">Required Date:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-200">
                    {request.requiredDate ? new Date(request.requiredDate).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manager approval workflow panel */}
          {(request.status === 'Pending' || request.status === 'Approved') && (
            <Card className="border border-blue-100 dark:border-slate-800 bg-blue-50/20 dark:bg-slate-900/30 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-blue-50/50 dark:border-slate-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-extrabold">Workflow Actions</h2>
              </div>
              <CardContent className="p-5 space-y-3">
                {request.status === 'Pending' && (
                  <div className="flex flex-col gap-2.5 w-full">
                    <Button
                      onClick={() => handleStatusUpdate('Approved')}
                      disabled={isActionLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-[5px] flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      Approve Request
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('Rejected')}
                      disabled={isActionLoading}
                      variant="outline"
                      className="w-full border-rose-250 text-rose-600 hover:bg-rose-50 font-bold text-xs h-10 rounded-[5px] flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-slate-900"
                    >
                      {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Reject Request
                    </Button>
                  </div>
                )}

                {request.status === 'Approved' && (
                  <Button
                    onClick={() => handleStatusUpdate('Issued')}
                    disabled={isActionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-[5px] flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Laptop className="h-4 w-4" />}
                    Issue Asset
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
