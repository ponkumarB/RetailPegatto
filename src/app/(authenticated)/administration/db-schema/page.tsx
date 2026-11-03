'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle,
  FileText,
  Sliders,
  Download,
  Layers,
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

interface DbSchemaItem {
  id: string;
  name: string;
  owner: string;
  server: string;
  characterSet: string;
  collation: string;
  createdAt: string;
}

const initialSchemas: DbSchemaItem[] = [
  {
    id: 'sch-1',
    name: 'greenfield_school',
    owner: 'crmadmin',
    server: 'AWS - Mumbai (ap-south-1)',
    characterSet: 'UTF8 (utf8mb4)',
    collation: 'utf8mb4_unicode_ci',
    createdAt: '15 May 2024'
  },
  {
    id: 'sch-2',
    name: 'crmfarm_master',
    owner: 'saadmin',
    server: 'AWS - Mumbai (ap-south-1)',
    characterSet: 'UTF8 (utf8mb4)',
    collation: 'utf8mb4_unicode_ci',
    createdAt: '01 May 2024'
  },
  {
    id: 'sch-3',
    name: 'greenfield_logs',
    owner: 'dbadmin',
    server: 'AWS - Mumbai (ap-south-1)',
    characterSet: 'UTF8 (utf8mb4)',
    collation: 'utf8mb4_unicode_ci',
    createdAt: '15 May 2024'
  }
];

export default function DbSchemaPage() {
  const { primaryColor } = useStore();
  const router = useRouter();
  const [schemas, setSchemas] = useState<DbSchemaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Load schemas
  useEffect(() => {
    const saved = localStorage.getItem('crm_db_schemas');
    if (saved) {
      try {
        setSchemas(JSON.parse(saved));
      } catch {
        setSchemas(initialSchemas);
      }
    } else {
      setSchemas(initialSchemas);
      localStorage.setItem('crm_db_schemas', JSON.stringify(initialSchemas));
    }
  }, []);

  const saveToStorage = (updatedList: DbSchemaItem[]) => {
    setSchemas(updatedList);
    localStorage.setItem('crm_db_schemas', JSON.stringify(updatedList));
  };

  const handleDeleteSchema = (id: string) => {
    if (confirm('Are you sure you want to delete this database schema? All schema tables will be permanently removed.')) {
      const updated = schemas.filter(s => s.id !== id);
      saveToStorage(updated);
      toast.success('Database schema deleted.');
    }
  };

  // Filtered Schemas
  const filteredSchemas = useMemo(() => {
    return schemas.filter(s => {
      const query = searchQuery.toLowerCase();
      return (
        (s.name || '').toLowerCase().includes(query) ||
        (s.owner || '').toLowerCase().includes(query) ||
        (s.server || '').toLowerCase().includes(query)
      );
    });
  }, [schemas, searchQuery]);

  // Columns Configuration
  const columns = useMemo<ColumnConfig<DbSchemaItem>[]>(() => [
    {
      key: 'name',
      header: 'Schema Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-955 shrink-0 border dark:border-slate-850">
            <Layers className="h-4 w-4 text-slate-450" />
          </div>
          <span className="font-bold text-slate-850 dark:text-slate-200 text-xs">{row.name}</span>
        </div>
      )
    },
    {
      key: 'owner',
      header: 'Schema Owner',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-655 dark:text-slate-300">{row.owner}</span>
    },
    {
      key: 'server',
      header: 'Database Server',
      sortable: true,
      render: (row) => <span className="font-medium text-slate-500">{row.server}</span>
    },
    {
      key: 'characterSet',
      header: 'Character Set',
      sortable: true,
      render: (row) => <span className="font-medium text-slate-500">{row.characterSet}</span>
    },
    {
      key: 'collation',
      header: 'Collation',
      sortable: true,
      render: (row) => <span className="font-medium text-slate-505">{row.collation}</span>
    },
    {
      key: 'createdAt',
      header: 'Created At',
      sortable: true,
      render: (row) => <span className="text-slate-450 font-medium">{row.createdAt}</span>
    }
  ], []);

  const tableActions = (row: DbSchemaItem) => (
    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-[5px]"
        onClick={() => handleDeleteSchema(row.id)}
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
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">DB Schema</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[5px]" style={{ backgroundColor: `${primaryColor}15` }}>
            <Database className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Database Schemas</span>
              <Sparkles className="h-4.5 w-4.5 text-blue-500 fill-blue-500" />
            </h1>
            <p className="text-xs text-slate-450 font-semibold mt-0.5">
              Manage database schemas and append master datasets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => router.push('/administration/db-schema/create')}
            className="h-9.5 text-xs font-bold text-white shadow-md gap-1.5 hover:opacity-90 rounded-[5px]"
            style={{ backgroundColor: primaryColor }}
          >
            <Plus className="h-4 w-4" />
            <span>Create Schema</span>
          </Button>
        </div>
      </div>

      {/* ReusableTable Card Container */}
      <Card className="border dark:border-slate-800 shadow-3xs overflow-hidden rounded-[5px] bg-white dark:bg-slate-900 text-left">
        <CardContent className="p-0">
          <div className="p-5 border-b dark:border-slate-850 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-855 dark:text-slate-200">Registered Schemas</h3>
              <p className="text-[10px] text-slate-455 mt-0.5">Directory listing all active database schemas.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Search schema logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 h-8.5 w-[200px] text-[10px] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                />
              </div>

              <Button
                variant="outline"
                className="h-8.5 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px]"
              >
                <Sliders className="h-3.5 w-3.5 text-slate-505" />
                <span>Columns</span>
              </Button>

              <Button
                variant="outline"
                className="h-8.5 text-[10px] p-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-[5px]"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
              </Button>

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
            data={filteredSchemas}
            actions={tableActions}
            borderless={true}
            showGear={false}
          />
        </CardContent>
      </Card>

    </div>
  );
}
