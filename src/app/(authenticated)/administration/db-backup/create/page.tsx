'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  ArrowLeft,
  Info,
  Calendar,
  Lock,
  Clock,
  Play,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  FileText,
  Save,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

interface BackupItem {
  id: string;
  name: string;
  type: 'Full Backup' | 'Schema Only';
  size: string;
  storage: string;
  createdAt: string;
  status: 'Success' | 'Failed' | 'In Progress';
}

export default function CreateBackupPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Form Inputs (matching the screenshot)
  const [instance, setInstance] = useState('Greenfield International School (greenfield-school.crmfarm.in)');
  const [dbSchema, setDbSchema] = useState('greenfield_school');
  const [backupType, setBackupType] = useState<'full' | 'schema'>('full');
  const [backupName, setBackupName] = useState('greenfield_school_backup_2024_05_23');
  const [description, setDescription] = useState('Manual backup before monthly updates');
  const [compression, setCompression] = useState('GZIP (Recommended)');
  const [enableEncryption, setEnableEncryption] = useState(true);
  const [retentionPolicy, setRetentionPolicy] = useState('Custom');
  const [retainDays, setRetainDays] = useState('30');
  const [notifyEmail, setNotifyEmail] = useState('itadmin@crmfarm.in');
  const [storageLocation, setStorageLocation] = useState('CRMFarm Backup Storage (AWS S3)');
  const [folderPath, setFolderPath] = useState('backups/greenfield_school/');
  const [storageClass, setStorageClass] = useState('Standard');

  const handleCreateBackup = () => {
    if (!backupName.trim()) return toast.error('Backup Name is required.');
    
    // Simulate backup progress
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Initializing database backup stream...',
        success: () => {
          const newBackup: BackupItem = {
            id: `bak-${Date.now()}`,
            name: backupName.trim(),
            type: backupType === 'full' ? 'Full Backup' : 'Schema Only',
            size: backupType === 'full' ? '12.45 GB' : '45.2 MB',
            storage: storageLocation.includes('S3') ? 'AWS S3' : 'Local / Cloud',
            createdAt: new Date().toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            status: 'Success'
          };
          
          let backupsList: BackupItem[] = [];
          const saved = localStorage.getItem('crm_db_backups');
          if (saved) {
            try {
              backupsList = JSON.parse(saved);
            } catch {
              backupsList = [];
            }
          }
          
          const updated = [newBackup, ...backupsList];
          localStorage.setItem('crm_db_backups', JSON.stringify(updated));
          router.push('/administration/db-backup');
          return 'Database backup successfully archived.';
        },
        error: 'Backup execution aborted.'
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 text-left pb-24">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="hover:text-slate-655 transition-colors">Administration</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/administration/db-backup" className="hover:text-slate-655 transition-colors">DB Backup</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Create Backup</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
            <Database className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Create Backup</h1>
            <p className="text-xs text-slate-455 font-semibold mt-0.5">
              Configure database instances, compression methods, and storage destinations.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/administration/db-backup')}
          className="h-9 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Backups</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns Form Options (spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Step 1: Select Source */}
          <Card className="border dark:border-slate-800 shadow-xs rounded-[5px] bg-white dark:bg-slate-900 text-left">
            <CardContent className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-2 border-b dark:border-slate-850">
                <span className="h-5 w-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">Select Source</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instance */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Instance <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Select value={instance} onValueChange={(val) => setInstance(val || '')}>
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select Database Instance" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="Greenfield International School (greenfield-school.crmfarm.in)">
                        Greenfield International School (greenfield-school.crmfarm.in)
                      </SelectItem>
                      <SelectItem value="Starlight Academy (starlight-academy.crmfarm.in)">
                        Starlight Academy (starlight-academy.crmfarm.in)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Schema */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Database (Schema) <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Select value={dbSchema} onValueChange={(val) => setDbSchema(val || '')}>
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select Schema" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="greenfield_school">greenfield_school</SelectItem>
                      <SelectItem value="greenfield_logs">greenfield_logs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Backup Type radio */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-350">
                  <span>Backup Type</span>
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="flex items-center gap-6 mt-1 text-xs font-bold">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="backupType"
                      checked={backupType === 'full'}
                      onChange={() => setBackupType('full')}
                      className="accent-primary h-4 w-4"
                    />
                    <span>Full Backup</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="backupType"
                      checked={backupType === 'schema'}
                      onChange={() => setBackupType('schema')}
                      className="accent-primary h-4 w-4"
                    />
                    <span>Schema Only Backup</span>
                  </label>
                </div>
              </div>

              {/* Info banner */}
              <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-[5px] text-[10px] font-bold text-blue-650 dark:text-blue-400">
                <Info className="h-4 w-4 shrink-0" />
                <span>Full Backup will include schema and all data in the selected database.</span>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Backup Configuration */}
          <Card className="border dark:border-slate-800 shadow-xs rounded-[5px] bg-white dark:bg-slate-900 text-left">
            <CardContent className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-2 border-b dark:border-slate-850">
                <span className="h-5 w-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center">2</span>
                <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">Backup Configuration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Backup Name */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Backup Name <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Input
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                  />
                </div>

                {/* Compression */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-350">
                    <span>Compression</span>
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <Select value={compression} onValueChange={(val) => setCompression(val || '')}>
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select compression" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="GZIP (Recommended)">GZIP (Recommended)</SelectItem>
                      <SelectItem value="BZIP2">BZIP2</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Description (Optional)</Label>
                <textarea
                  placeholder="Enter manual description notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-16 p-2 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px] resize-none focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Retention Policy */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Retention Policy <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Select value={retentionPolicy} onValueChange={(val) => setRetentionPolicy(val || '')}>
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select retention" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="Custom">Custom</SelectItem>
                      <SelectItem value="Keep Forever">Keep Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Retain days */}
                {retentionPolicy === 'Custom' && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Retain For</Label>
                    <div className="flex items-center border dark:border-slate-800 bg-white dark:bg-slate-950 rounded-[5px] pr-3.5">
                      <Input
                        type="number"
                        value={retainDays}
                        onChange={(e) => setRetainDays(e.target.value)}
                        className="h-9.5 border-0 focus-visible:ring-0 text-xs w-full bg-transparent"
                      />
                      <span className="text-xs text-slate-400 font-bold">days</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Encryption switch toggle */}
                <div className="flex items-center gap-3.5 py-2">
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={enableEncryption}
                      onChange={(e) => setEnableEncryption(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500" />
                  </label>
                  <div className="flex flex-col leading-none">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-slate-455" />
                      Enable Encryption
                    </span>
                    <span className="text-[9px] text-slate-450 mt-1 font-semibold">Encrypt archive with AES-256</span>
                  </div>
                </div>

                {/* Notify Completion email input */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Notify On Completion
                  </Label>
                  <Input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Step 3: Backup Destination */}
          <Card className="border dark:border-slate-800 shadow-xs rounded-[5px] bg-white dark:bg-slate-900 text-left">
            <CardContent className="p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 pb-2 border-b dark:border-slate-855">
                <span className="h-5 w-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                <h3 className="text-xs font-black text-slate-855 dark:text-white uppercase tracking-wider">Backup Destination</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Storage Location */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Storage Location <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Select value={storageLocation} onValueChange={(val) => setStorageLocation(val || '')}>
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select storage class" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="CRMFarm Backup Storage (AWS S3)">CRMFarm Backup Storage (AWS S3)</SelectItem>
                      <SelectItem value="Starlight Backups (Google Storage)">Starlight Backups (Google Storage)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Storage Class */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Storage Class</Label>
                  <Select value={storageClass} onValueChange={(val) => setStorageClass(val || '')}>
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Infrequent Access">Infrequent Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Folder Path */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Folder Path (Optional)</Label>
                <Input
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
                />
              </div>

              {/* Status validation indicator */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-[5px] text-[10px] font-bold text-emerald-650 dark:text-emerald-450">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Your backup will be securely stored in the selected location.</span>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Button Actions */}
          <div className="flex items-center justify-between gap-4 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setBackupName('greenfield_school_backup_2024_05_23');
                setDescription('Manual backup before monthly updates');
                setRetentionPolicy('Custom');
                setRetainDays('30');
                setEnableEncryption(true);
              }}
              className="h-9.5 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-505" />
              <span>Reset</span>
            </Button>

            <Button
              onClick={handleCreateBackup}
              className="h-9.5 text-xs font-bold text-white shadow-md gap-2 hover:opacity-90 rounded-[5px] bg-emerald-600 hover:bg-emerald-700"
            >
              <Play className="h-4 w-4 fill-white/10" />
              <span>Create Backup</span>
            </Button>
          </div>

        </div>

        {/* Right Column: Backup Summary and estimated info */}
        <div className="flex flex-col gap-6 text-left">
          
          {/* Backup Summary card */}
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex flex-col gap-4 text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2 border-b dark:border-slate-850 pb-3">
                <FileText className="h-4.5 w-4.5 text-slate-450" />
                <h4 className="text-xs uppercase tracking-wider">Backup Summary</h4>
              </div>

              <div className="flex flex-col gap-3.5">
                {/* Instance */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Instance</span>
                  <span className="font-semibold text-slate-655 dark:text-slate-350">{instance}</span>
                </div>

                {/* Schema */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Database (Schema)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-205">{dbSchema}</span>
                </div>

                {/* Backup Type */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Backup Type</span>
                  <span className="font-bold text-slate-800 dark:text-slate-205">{backupType === 'full' ? 'Full Backup' : 'Schema Only'}</span>
                </div>

                {/* Compression */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Compression</span>
                  <span className="font-bold text-slate-800 dark:text-slate-205">{compression}</span>
                </div>

                {/* Encryption */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Encryption</span>
                  <span className="font-bold text-slate-800 dark:text-slate-205">{enableEncryption ? 'Enabled (AES-256)' : 'Disabled'}</span>
                </div>

                {/* Retention */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Retention</span>
                  <span className="font-bold text-slate-800 dark:text-slate-205">{retentionPolicy === 'Custom' ? `${retainDays} Days` : 'Keep Forever'}</span>
                </div>

                {/* Storage Location */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Storage Location</span>
                  <span className="font-bold text-slate-800 dark:text-slate-205">{storageLocation}</span>
                </div>

                {/* Folder path */}
                <div className="flex flex-col gap-1 text-[10px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Folder Path</span>
                  <span className="font-semibold text-slate-655 dark:text-slate-350">{folderPath || '/'}</span>
                </div>
              </div>

              {/* Estimate details card */}
              <div className="p-4 rounded-[5px] bg-blue-500/5 border border-blue-500/10 flex flex-col gap-2 mt-2">
                <div className="flex items-center gap-1.5 text-blue-500 font-extrabold text-[9px] uppercase tracking-wider leading-none">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Estimated Details</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-605 dark:text-slate-400 mt-1.5">
                  <span>Estimated Size</span>
                  <span className="font-extrabold text-slate-800 dark:text-white">~ {backupType === 'full' ? '12.45 GB' : '45.2 MB'}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-605 dark:text-slate-400">
                  <span>Estimated Time</span>
                  <span className="font-extrabold text-slate-800 dark:text-white">~ {backupType === 'full' ? '15 - 20 mins' : '< 1 min'}</span>
                </div>
              </div>

              {/* warning banner */}
              <div className="flex items-start gap-2 p-3 bg-amber-505/5 border border-amber-500/10 rounded-[5px] text-[9px] font-bold text-amber-600 leading-normal mt-1">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Please ensure sufficient storage space is available in the selected destination.</span>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
