'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Plus,
  Download,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Cloud,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';

interface BackupItem {
  id: string;
  name: string;
  type: 'Full Backup' | 'Schema Only';
  size: string;
  storage: string;
  createdAt: string;
  status: 'Success' | 'Failed' | 'In Progress';
}

const initialBackups: BackupItem[] = [
  {
    id: 'bak-1',
    name: 'greenfield_school_backup_2024_05_23',
    type: 'Full Backup',
    size: '12.45 GB',
    storage: 'AWS S3',
    createdAt: '23 May 2024, 11:30 AM',
    status: 'Success'
  },
  {
    id: 'bak-2',
    name: 'greenfield_school_backup_2024_05_15',
    type: 'Full Backup',
    size: '12.40 GB',
    storage: 'AWS S3',
    createdAt: '15 May 2024, 09:30 AM',
    status: 'Success'
  },
  {
    id: 'bak-3',
    name: 'greenfield_school_schema_2024_05_10',
    type: 'Schema Only',
    size: '45.2 MB',
    storage: 'Google Cloud',
    createdAt: '10 May 2024, 02:15 PM',
    status: 'Success'
  },
  {
    id: 'bak-4',
    name: 'greenfield_school_backup_2024_05_01',
    type: 'Full Backup',
    size: '12.35 GB',
    storage: 'AWS S3',
    createdAt: '01 May 2024, 09:30 AM',
    status: 'Success'
  }
];

export default function DbBackupPage() {
  const { primaryColor } = useStore();
  const router = useRouter();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load from localStorage or defaults
  useEffect(() => {
    const saved = localStorage.getItem('crm_db_backups');
    if (saved) {
      try {
        setBackups(JSON.parse(saved));
      } catch {
        setBackups(initialBackups);
      }
    } else {
      setBackups(initialBackups);
      localStorage.setItem('crm_db_backups', JSON.stringify(initialBackups));
    }
  }, []);

  const saveToStorage = (updatedList: BackupItem[]) => {
    setBackups(updatedList);
    localStorage.setItem('crm_db_backups', JSON.stringify(updatedList));
  };

  const handleDeleteBackup = (id: string) => {
    if (confirm('Are you sure you want to delete this backup file?')) {
      const updated = backups.filter(b => b.id !== id);
      saveToStorage(updated);
      toast.success('Backup file deleted.');
    }
  };

  // Filtered Backups
  const filteredBackups = useMemo(() => {
    return backups.filter(b => {
      const query = searchQuery.toLowerCase();
      return (
        (b.name || '').toLowerCase().includes(query) ||
        (b.type || '').toLowerCase().includes(query) ||
        (b.storage || '').toLowerCase().includes(query)
      );
    });
  }, [backups, searchQuery]);

  // Table Columns config
  const columns = useMemo<ColumnConfig<BackupItem>[]>(() => [
    {
      key: 'name',
      header: 'Backup File Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 shrink-0 border dark:border-slate-850">
            <Database className="h-4 w-4 text-slate-455" />
          </div>
          <span className="font-bold text-slate-850 dark:text-slate-200 text-xs">{row.name}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Backup Type',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-0.5 rounded-[3px] text-[10px] font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border dark:border-slate-855">
          {row.type}
        </span>
      )
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      render: (row) => <span className="font-extrabold text-slate-700 dark:text-slate-300">{row.size}</span>
    },
    {
      key: 'storage',
      header: 'Destination Storage',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-655 dark:text-slate-400 flex items-center gap-1">
          <Cloud className="h-3.5 w-3.5 text-slate-400" />
          {row.storage}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created At',
      sortable: true,
      render: (row) => <span className="text-slate-505 font-medium">{row.createdAt}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => {
        const activeStyles = row.status === 'Success'
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450'
          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450';
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${activeStyles}`}>
            {row.status === 'Success' ? <CheckCircle className="h-3 w-3 shrink-0" /> : <XCircle className="h-3 w-3 shrink-0" />}
            {row.status}
          </span>
        );
      }
    }
  ], []);

  const tableActions = (row: BackupItem) => (
    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-850 rounded-[5px]"
        onClick={() => toast.success(`Downloading backup package: ${row.name}.zip`)}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-[5px]"
        onClick={() => handleDeleteBackup(row.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

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
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">DB Backup</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
            <Database className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Database Backups</span>
              <Sparkles className="h-4.5 w-4.5 text-blue-500 fill-blue-500" />
            </h1>
            <p className="text-xs text-slate-450 font-semibold mt-0.5">
              Manage and schedule database backups to secure your CRM data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => router.push('/administration/db-backup/create')}
            className="h-9.5 text-xs font-bold text-white shadow-md gap-1.5 hover:opacity-90 rounded-[5px]"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4 w-4" />
            <span>Create Backup</span>
          </Button>
        </div>
      </div>

      <Card className="border dark:border-slate-800 shadow-3xs overflow-hidden rounded-[5px] bg-white dark:bg-slate-900 text-left">
        <CardContent className="p-0">
          <div className="p-5 border-b dark:border-slate-850 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-855 dark:text-slate-200">Historical Backups</h3>
              <p className="text-[10px] text-slate-455 mt-0.5">Directory listing all manual and automatic backup snapshots.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search backup records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 h-8.5 w-[200px] text-[10px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
                />
              </div>

              <Button
                variant="ghost"
                onClick={() => setSearchQuery('')}
                className="h-8.5 w-8.5 p-0 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-[5px]"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-505" />
              </Button>
            </div>
          </div>

          <ReusableTable
            columns={columns}
            data={filteredBackups}
            actions={tableActions}
            borderless={true}
            showGear={false}
          />
        </CardContent>
      </Card>

    </div>
  );
}
