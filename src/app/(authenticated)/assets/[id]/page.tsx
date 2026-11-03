'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssetStore } from '@/store/useAssetStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  Wrench, 
  User, 
  History, 
  FileText, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Info,
  CreditCard,
  TrendingDown,
  Monitor,
  Cpu,
  Trash2,
  Paperclip,
  BookOpen,
  Edit
} from 'lucide-react';
import { fetchFromApi, BASE_URL, getTenantName } from '@/service/apiClient';

export default function AssetOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const { assets, allocations, maintenances, deleteAsset, updateAsset } = useAssetStore();
  
  const assetId = params.id as string;
  const asset = useMemo(() => assets.find(a => a.id === assetId), [assets, assetId]);

  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'allocations' | 'maintenance'>('overview');
  const [newNote, setNewNote] = useState('');

  // Fetch attachment details asynchronously
  const [resolvedAttachments, setResolvedAttachments] = useState<any[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);

  React.useEffect(() => {
    const attachmentsArray = asset?.Attachment;
    if (attachmentsArray && attachmentsArray.length > 0) {
      const loadAttachments = async () => {
        setIsLoadingAttachments(true);
        try {
          const fetched = await Promise.all(
            attachmentsArray.map(async (attIdOrObj) => {
              if (attIdOrObj && typeof attIdOrObj === 'object' && (attIdOrObj.File || attIdOrObj.Urls)) {
                return attIdOrObj;
              }
              const id = typeof attIdOrObj === 'object' ? (attIdOrObj.id || attIdOrObj.FileID) : attIdOrObj;
              if (!id) return null;

              try {
                const res = await fetchFromApi(`/user/UserFilesandUrlsGetById/?id=${id}`);
                if (res && (res.File || res.Urls || res.FileName)) {
                  return res;
                }
              } catch (e) {
                console.warn(`UserFilesandUrlsGetById failed for ${id}, trying fallback:`, e);
              }

              try {
                const res = await fetchFromApi(`/user/UserFilesandUrlsCRUD/${id}/`);
                if (res && (res.File || res.Urls || res.FileName)) {
                  return res;
                }
              } catch (e) {
                console.warn(`UserFilesandUrlsCRUD detail failed for ${id}:`, e);
              }

              try {
                const res = await fetchFromApi(`/user/UserFilesandUrlsCRUD/?id=${id}`);
                if (res && res.results && res.results.length > 0) {
                  return res.results[0];
                } else if (res && !res.results && (res.File || res.Urls || res.FileName)) {
                  return res;
                }
              } catch (e) {
                console.warn(`UserFilesandUrlsCRUD list failed for ${id}:`, e);
              }

              return null;
            })
          );
          setResolvedAttachments(fetched.filter(Boolean));
        } catch (err) {
          console.error('Error fetching asset attachments:', err);
          setResolvedAttachments([]);
        } finally {
          setIsLoadingAttachments(false);
        }
      };
      loadAttachments();
    } else {
      setResolvedAttachments([]);
    }
  }, [asset]);

  // Find related records
  const relatedAllocations = useMemo(() => 
    allocations.filter(a => a.assetId === assetId), 
    [allocations, assetId]
  );

  const relatedMaintenances = useMemo(() => 
    maintenances.filter(m => m.assetId === assetId), 
    [maintenances, assetId]
  );

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-left max-w-md mx-auto space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h3 className="text-lg font-bold text-slate-805 dark:text-white">Asset Not Found</h3>
        <p className="text-sm text-center text-slate-400">The asset record you requested could not be retrieved. It may have been deleted.</p>
        <Button variant="outline" className="h-9 rounded-[5px]" onClick={() => router.push('/assets/list')}>
          Back to Asset Inventory
        </Button>
      </div>
    );
  }

  const handleDelete = () => {
    toast.warning(`Are you sure you want to delete "${asset.name}"?`, {
      action: {
        label: 'Delete',
        onClick: () => {
          deleteAsset(asset.id);
          router.push('/assets/list');
        }
      }
    });
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const timeString = new Date().toLocaleDateString('en-GB') + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const updatedNotes = asset.notes 
      ? `${asset.notes}\n\n[${timeString}]: ${newNote.trim()}`
      : `[${timeString}]: ${newNote.trim()}`;
    
    updateAsset(asset.id, { notes: updatedNotes });
    setNewNote('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[5px] text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            Available
          </span>
        );
      case 'In Use':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[5px] text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-105 dark:border-blue-900/30">
            In Use
          </span>
        );
      case 'Maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[5px] text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
            Maintenance
          </span>
        );
      case 'Retired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[5px] text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border dark:border-slate-700">
            Retired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-[5px] text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
            {status}
          </span>
        );
    }
  };

  const getCriticalityBadge = (criticality: string) => {
    switch (criticality) {
      case 'High':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-955/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400 border dark:border-slate-800">
            Low
          </span>
        );
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      
      {/* Breadcrumbs & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-400">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/assets/list')} 
            className="h-7 px-2 gap-1 text-xs rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350"
          >
            <ArrowLeft className="h-3 w-3" /> Back
          </Button>
          <span>/</span>
          <span className="cursor-pointer hover:underline" onClick={() => router.push('/assets/list')}>Assets</span>
          <span>/</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{asset.tagId}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/assets/${asset.id}/edit`)}
            className="h-9 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-[5px] gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-805"
          >
            <Edit className="h-4 w-4 text-slate-500" /> Edit Asset
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/assets/allocation/create?assetId=${asset.id}`)}
            className="h-9 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-[5px] gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-805"
          >
            <User className="h-4 w-4 text-slate-500" /> Allocate Asset
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push(`/assets/maintenance/create?assetId=${asset.id}`)}
            className="h-9 border border-slate-200 dark:border-slate-800 text-xs font-bold rounded-[5px] gap-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-805"
          >
            <Wrench className="h-4 w-4 text-slate-500" /> Log Maintenance
          </Button>
          <Button 
            onClick={handleDelete}
            className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-red-650 hover:bg-red-700 transition-all gap-1.5 border border-transparent"
          >
            <Trash2 className="h-4 w-4" /> Delete Asset
          </Button>
        </div>
      </div>

      {/* Banner Card - General Info */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
        <CardContent className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 p-6 gap-6 md:gap-0">
          
          {/* Col 1: Asset Core Details */}
          <div className="space-y-2 text-left md:pr-6 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Title & ID</span>
              {getStatusBadge(asset.status)}
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-xl text-blue-600 dark:text-blue-450 leading-tight">
                {asset.name}
              </h4>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Category: <span className="text-blue-600 font-extrabold">{asset.category}</span>
                {asset.subcategory && <span> &gt; <span className="text-slate-500 dark:text-slate-400">{asset.subcategory}</span></span>}
              </p>
              <p className="text-xs text-slate-450 font-semibold">Brand / Model: {asset.brand || '-'} &bull; {asset.model || '-'}</p>
              <p className="text-xs text-slate-450 font-semibold mt-1 font-mono">Serial: {asset.serialNumber}</p>
            </div>
          </div>

          {/* Col 2: Metadata */}
          <div className="space-y-2 text-left md:px-6 pt-6 md:pt-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inventory Status</span>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs font-semibold">
              <span className="text-slate-400">Tag ID</span>
              <span className="text-slate-850 dark:text-white font-mono font-bold">{asset.tagId}</span>
              
              <span className="text-slate-400">Type</span>
              <span className="text-slate-705 dark:text-slate-305">{asset.type}</span>
              
              <span className="text-slate-400">Criticality</span>
              <div>{getCriticalityBadge(asset.criticality)}</div>

              <span className="text-slate-400">Custodian</span>
              <span className="text-slate-705 dark:text-slate-305 truncate" title={asset.assignedTo || 'Unassigned'}>
                {asset.assignedTo || 'Unassigned'}
              </span>
            </div>
          </div>

          {/* Col 3: Valuation */}
          <div className="space-y-2 text-left md:pl-6 pt-6 md:pt-0 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valuation</span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                {asset.purchasePrice}
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              <span className="text-slate-400">Purchase Date:</span>
              <p className="text-slate-705 dark:text-slate-300 font-bold">{asset.purchaseDate}</p>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Main Grid: Left tab details, Right vertical widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Tabs Panel (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            
            {/* Custom Tab selectors */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 overflow-x-auto gap-1">
              {[
                { id: 'overview', label: 'Overview & Purchase' },
                { id: 'specs', label: 'Technical Details' },
                { id: 'allocations', label: `Allocations (${relatedAllocations.length})` },
                { id: 'maintenance', label: `Maintenance (${relatedMaintenances.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "py-3.5 px-4 text-xs font-bold transition-all relative whitespace-nowrap shrink-0 border-b-2",
                    activeTab === tab.id 
                      ? "text-blue-600 border-blue-600 font-extrabold" 
                      : "text-slate-400 border-transparent hover:text-slate-655"
                  )}
                  style={{ marginBottom: '-1px' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <CardContent className="p-6 text-left">
              
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] pb-1 border-b dark:border-slate-800 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                      Detailed Information
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-4 text-xs font-semibold">
                      <div>
                        <span className="text-slate-400 text-[10px]">Asset Name</span>
                        <p className="text-slate-800 dark:text-white mt-0.5 font-bold">{asset.name}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Tag / ID</span>
                        <p className="text-slate-800 dark:text-white mt-0.5 font-mono">{asset.tagId}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Type & Category</span>
                        <p className="text-slate-800 dark:text-white mt-0.5">{asset.type} &bull; {asset.category}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Brand / Model</span>
                        <p className="text-slate-800 dark:text-white mt-0.5">{asset.brand || '-'} &bull; {asset.model || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Serial Number</span>
                        <p className="text-slate-800 dark:text-white mt-0.5 font-mono">{asset.serialNumber}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Barcode / RFID</span>
                        <p className="text-slate-800 dark:text-white mt-0.5 font-mono">{asset.barcodeRfid || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Assigned Custodian</span>
                        <p className="text-slate-800 dark:text-white mt-0.5">{asset.assignedTo || 'Unassigned'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Department</span>
                        <p className="text-slate-800 dark:text-white mt-0.5">{asset.department || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Location</span>
                        <p className="text-slate-800 dark:text-white mt-0.5">{asset.location || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] pb-1 border-b dark:border-slate-800 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                      Procurement & Finance
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3.5 gap-x-4 text-xs font-semibold">
                      <div>
                        <span className="text-slate-400 text-[10px]">Purchase Cost</span>
                        <p className="text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold font-mono">{asset.purchasePrice}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Purchase Date</span>
                        <p className="text-slate-805 dark:text-white mt-0.5">{asset.purchaseDate}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Warranty Expiration</span>
                        <p className="text-slate-805 dark:text-white mt-0.5">{asset.warrantyExpiryDate || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Vendor / Supplier</span>
                        <p className="text-slate-805 dark:text-white mt-0.5">{asset.vendorSupplier || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Invoice Number</span>
                        <p className="text-slate-805 dark:text-white mt-0.5 font-mono">{asset.invoiceNumber || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">PO Number</span>
                        <p className="text-slate-805 dark:text-white mt-0.5 font-mono">{asset.poNumber || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Attached Documents */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] pb-1 border-b dark:border-slate-800 flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5 text-blue-500" />
                      Associated Documents
                    </h4>
                    {(() => {
                      if (isLoadingAttachments) {
                        return <p className="text-xs text-slate-400 italic animate-pulse">Loading documents...</p>;
                      }
                      const NEW_BASE_URL = `${BASE_URL}/${getTenantName()}`;
                      const docAttachments = resolvedAttachments.filter(
                        att => att.File_Type === 'document' || att.type === 'document' || (!att.File_Type && !att.type)
                      );
                      const hasDocLinks = asset.documents && asset.documents.length > 0;
                      const hasDocFiles = docAttachments.length > 0;

                      if (!hasDocLinks && !hasDocFiles) {
                        return <p className="text-xs text-slate-400 italic">No document links or files uploaded for this asset.</p>;
                      }

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {/* Render Links */}
                          {hasDocLinks && asset.documents?.map((doc, idx) => {
                            const isUrl = doc.startsWith('http') || doc.startsWith('www');
                            return (
                              <div key={`link-${idx}`} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-955/5 text-xs text-slate-700 dark:text-slate-350">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                                  <span className="truncate font-semibold">{doc}</span>
                                </div>
                                {isUrl ? (
                                  <a href={doc.startsWith('http') ? doc : `https://${doc}`} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-blue-650 hover:underline uppercase tracking-wider bg-blue-50 dark:bg-blue-955/20 px-1.5 py-0.5 rounded shrink-0">
                                    Open
                                  </a>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                                    Link
                                  </span>
                                )}
                              </div>
                            );
                          })}

                          {/* Render Uploaded Files */}
                          {hasDocFiles && docAttachments.map((att, idx) => {
                            const url = att.File ? (att.File.startsWith('http') ? att.File : `${NEW_BASE_URL}${att.File}`) :
                              (att.Urls ? (att.Urls.startsWith('http') ? att.Urls : `${NEW_BASE_URL}${att.Urls}`) : '');
                            return (
                              <div key={`file-${idx}`} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-955/5 text-xs text-slate-700 dark:text-slate-350">
                                <div className="flex items-center gap-2 truncate">
                                  <FileText className="h-4 w-4 text-blue-550 shrink-0" />
                                  <span className="truncate font-semibold">{att.FileName || att.name || `Document #${att.id}`}</span>
                                </div>
                                <a href={url} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-blue-650 hover:underline uppercase tracking-wider bg-blue-50 dark:bg-blue-955/20 px-1.5 py-0.5 rounded shrink-0">
                                  View
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Tab: Technical Specs */}
              {activeTab === 'specs' && (
                <div className="space-y-6">
                  {/* System configuration */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] pb-1 border-b dark:border-slate-800 flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-blue-500" />
                      System Specifications & Config
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs font-semibold">
                      <div>
                        <span className="text-slate-400 text-[10px]">Operating System</span>
                        <p className="text-slate-805 dark:text-white mt-0.5 font-bold">{asset.operatingSystemSoftware || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">IP Address</span>
                        <p className="text-slate-805 dark:text-white mt-0.5 font-mono">{asset.ipAddress || '-'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">MAC Address</span>
                        <p className="text-slate-805 dark:text-white mt-0.5 font-mono">{asset.macAddress || '-'}</p>
                      </div>
                    </div>

                    {asset.configurationSpecification && asset.configurationSpecification !== asset.description && (
                      <div className="mt-3.5 space-y-1">
                        <span className="text-slate-400 text-[10px]">Specs & Configuration details</span>
                        <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 p-3.5 rounded-xl font-medium">
                          {asset.configurationSpecification}
                        </p>
                      </div>
                    )}

                    {asset.description && (
                      <div className="mt-3 space-y-1">
                        <span className="text-slate-400 text-[10px]">Asset Description / Configuration</span>
                        <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 p-3.5 rounded-xl font-medium">
                          {asset.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Depreciation Specs */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] pb-1 border-b dark:border-slate-800 flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5 text-blue-500" />
                      Depreciation details
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs font-semibold">
                      <div>
                        <span className="text-slate-400 text-[10px]">Depreciation Method</span>
                        <p className="text-slate-805 dark:text-white mt-0.5">{asset.depreciationMethod || 'Straight Line'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Annual Depreciation Rate</span>
                        <p className="text-slate-805 dark:text-white mt-0.5">{asset.depreciationRate ? `${asset.depreciationRate}%` : '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Allocations */}
              {activeTab === 'allocations' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] pb-1 border-b dark:border-slate-800">
                    Allocation History Logs
                  </h4>
                  {relatedAllocations.length > 0 ? (
                    <div className="overflow-x-auto border dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-3">Allocation ID</th>
                            <th className="px-4 py-3">Allocated To</th>
                            <th className="px-4 py-3">Department</th>
                            <th className="px-4 py-3">Allocation Date</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350 font-semibold">
                          {relatedAllocations.map((alc) => (
                            <tr key={alc.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-950/5">
                              <td className="px-4 py-3.5 font-bold font-mono text-slate-500">{alc.id}</td>
                              <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{alc.allocatedTo}</td>
                              <td className="px-4 py-3.5 text-slate-500">{alc.department}</td>
                              <td className="px-4 py-3.5 font-mono">{alc.allocationDate}</td>
                              <td className="px-4 py-3.5">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold",
                                  alc.status === 'Allocated' ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                )}>
                                  {alc.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <Info className="h-8 w-8 text-slate-350 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No allocations found for this asset in the logs.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Maintenance */}
              {activeTab === 'maintenance' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[10px] pb-1 border-b dark:border-slate-800">
                    Maintenance History Log
                  </h4>
                  {relatedMaintenances.length > 0 ? (
                    <div className="overflow-x-auto border dark:border-slate-800 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="px-4 py-3">Log ID</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3">Cost</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350 font-semibold">
                          {relatedMaintenances.map((mnt) => (
                            <tr key={mnt.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-950/5">
                              <td className="px-4 py-3.5 font-bold font-mono text-slate-500">{mnt.id}</td>
                              <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-white">{mnt.maintenanceType}</td>
                              <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate" title={mnt.description}>{mnt.description}</td>
                              <td className="px-4 py-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{mnt.cost}</td>
                              <td className="px-4 py-3.5">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold",
                                  mnt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-400' : (mnt.status === 'In Progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-955/20 dark:text-blue-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400')
                                )}>
                                  {mnt.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <Wrench className="h-8 w-8 text-slate-350 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No maintenance events logged for this asset.</p>
                    </div>
                  )}
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Right Side Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Card: Asset Image */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-850 px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-855 dark:text-slate-200">Asset Image</h3>
            </div>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              {(() => {
                if (isLoadingAttachments) {
                  return (
                    <div className="w-full border-2 border-dashed border-slate-100 dark:border-slate-855 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-slate-50/20 dark:bg-slate-955/5">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <p className="text-xs text-slate-400 mt-2">Loading images...</p>
                    </div>
                  );
                }
                const NEW_BASE_URL = `${BASE_URL}/${getTenantName()}`;
                const imageAttachments = resolvedAttachments.filter(
                  att => att.File_Type === 'asset image' || att.type === 'asset image'
                );

                if (imageAttachments.length > 0) {
                  return (
                    <div className="w-full space-y-3">
                      {imageAttachments.map((att, idx) => {
                        const url = att.File ? (att.File.startsWith('http') ? att.File : `${NEW_BASE_URL}${att.File}`) :
                          (att.Urls ? (att.Urls.startsWith('http') ? att.Urls : `${NEW_BASE_URL}${att.Urls}`) : '');
                        return (
                          <div key={idx} className="w-full border dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-955/20 aspect-video flex items-center justify-center">
                            <img src={url} alt={`${asset.name} - image ${idx + 1}`} className="w-full h-full object-contain" />
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (asset.image) {
                  return (
                    <div className="w-full border dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-955/20 aspect-video flex items-center justify-center">
                      <img src={asset.image} alt={asset.name} className="w-full h-full object-contain" />
                    </div>
                  );
                }

                return (
                  <div className="w-full border-2 border-dashed border-slate-100 dark:border-slate-855 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 bg-slate-50/20 dark:bg-slate-955/5">
                    <Monitor className="h-10 w-10 text-slate-300" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Asset Image</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Edit asset to add a snapshot</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Card: Internal Notes */}
          <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xs overflow-hidden">
            <div className="border-b dark:border-slate-850 px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-850 dark:text-slate-200 font-extrabold">Internal Notes</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              {asset.notes ? (
                <div className="text-xs leading-relaxed text-slate-650 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/20 border dark:border-slate-800 p-3.5 rounded-xl font-medium whitespace-pre-line max-h-56 overflow-y-auto">
                  {asset.notes}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No notes logged yet for this asset.</p>
              )}
              
              <form onSubmit={handleAddNote} className="space-y-3 pt-2">
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type an update or note to log..."
                  rows={3}
                  className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-250 focus:outline-none"
                />
                <div className="flex justify-end">
                  <Button type="submit" className="h-8 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-[5px]">
                    Submit Note
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
