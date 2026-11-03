'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database,
  ArrowLeft,
  ArrowRight,
  Info,
  CheckCircle,
  AlertTriangle,
  FileText,
  Save,
  X
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

interface DbSchemaItem {
  id: string;
  name: string;
  owner: string;
  server: string;
  characterSet: string;
  collation: string;
  createdAt: string;
}

interface MasterTable {
  id: string;
  name: string;
  count: number;
}

const initialMasterTables: MasterTable[] = [
  { id: 'tbl-1', name: 'Countries', count: 250 },
  { id: 'tbl-2', name: 'States', count: 1250 },
  { id: 'tbl-3', name: 'Cities', count: 12450 },
  { id: 'tbl-4', name: 'Industries', count: 980 },
  { id: 'tbl-5', name: 'Salutations', count: 12 },
  { id: 'tbl-6', name: 'Currencies', count: 180 },
  { id: 'tbl-7', name: 'Time Zones', count: 439 },
  { id: 'tbl-8', name: 'Email Templates', count: 56 }
];

export default function CreateDbSchemaPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Active step state: 1, 2, or 3
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Wizard fields
  const [schemaName, setSchemaName] = useState('greenfield_school');
  const [schemaOwner, setSchemaOwner] = useState('crmadmin');
  const [dbServer, setDbServer] = useState('AWS - Mumbai (ap-south-1)');
  const [characterSet, setCharacterSet] = useState('UTF8 (utf8mb4)');
  const [collation, setCollation] = useState('utf8mb4_unicode_ci');
  const [description, setDescription] = useState('Schema for Greenfield International School');
  const [sourceSchema, setSourceSchema] = useState('crmfarm_master');

  // Checklist table states
  const [selectedTables, setSelectedTables] = useState<string[]>(initialMasterTables.map(t => t.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTables(initialMasterTables.map(t => t.id));
    } else {
      setSelectedTables([]);
    }
  };

  const handleToggleTable = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTables(prev => [...prev, id]);
    } else {
      setSelectedTables(prev => prev.filter(tId => tId !== id));
    }
  };

  const totalSelectedRecords = useMemo(() => {
    let sum = 0;
    initialMasterTables.forEach(t => {
      if (selectedTables.includes(t.id)) sum += t.count;
    });
    return sum;
  }, [selectedTables]);

  const handleCreateSchema = () => {
    if (!schemaName.trim()) return toast.error('Schema Name is required.');
    
    // Simulate process loader
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Compiling DB Schema definitions & copying master datasets...',
        success: () => {
          const newSchema: DbSchemaItem = {
            id: `sch-${Date.now()}`,
            name: schemaName.trim(),
            owner: schemaOwner,
            server: dbServer,
            characterSet,
            collation,
            createdAt: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
          };

          let schemasList: DbSchemaItem[] = [];
          const saved = localStorage.getItem('crm_db_schemas');
          if (saved) {
            try {
              schemasList = JSON.parse(saved);
            } catch {
              schemasList = [];
            }
          }

          const updated = [newSchema, ...schemasList];
          localStorage.setItem('crm_db_schemas', JSON.stringify(updated));
          router.push('/administration/db-schema');
          return 'Database schema created & master tables copied successfully.';
        },
        error: 'Schema instantiation failed.'
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
            <BreadcrumbLink href="/administration/db-schema" className="hover:text-slate-655 transition-colors">DB Schema</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Create Schema</BreadcrumbPage>
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
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Create DB Schema</h1>
            <p className="text-xs text-slate-455 font-semibold mt-0.5">
              Define database configuration schemas and clone global standard datasets.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => router.push('/administration/db-schema')}
          className="h-9 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Schemas</span>
        </Button>
      </div>

      {/* Stepper progress bar with 3 steps */}
      <div className="relative flex items-center justify-between w-full max-w-xl mx-auto py-4 select-none mb-6">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 z-0 transition-all duration-350 ease-out" 
          style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
        />
        
        {/* Step 1 badge */}
        <div className="relative z-10 flex flex-col items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5">
          <span className={`h-7.5 w-7.5 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
            step >= 1 ? 'bg-blue-500 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            1
          </span>
          <span className={`text-[10px] font-bold ${step >= 1 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>Create DB Schema</span>
        </div>
        
        {/* Step 2 badge */}
        <div className="relative z-10 flex flex-col items-center gap-1.5 bg-slate-50 dark:bg-slate-955 px-2.5">
          <span className={`h-7.5 w-7.5 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
            step >= 2 ? 'bg-blue-500 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            2
          </span>
          <span className={`text-[10px] font-bold ${step >= 2 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>Append Master Data</span>
        </div>

        {/* Step 3 badge */}
        <div className="relative z-10 flex flex-col items-center gap-1.5 bg-slate-50 dark:bg-slate-955 px-2.5">
          <span className={`h-7.5 w-7.5 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
            step >= 3 ? 'bg-blue-500 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
          }`}>
            3
          </span>
          <span className={`text-[10px] font-bold ${step >= 3 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>Summary Overview</span>
        </div>
      </div>

      {/* Forms Multi-Step Wizard Panels */}
      <div className="flex flex-col items-center justify-center w-full min-h-[300px]">
        
        {step === 1 && (
          <Card className="border dark:border-slate-800 shadow-xl rounded-[5px] bg-white dark:bg-slate-900 text-left w-full animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b dark:border-slate-850 pb-3.5">
                <span className="h-6 w-6 rounded-full bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center">1</span>
                <h3 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">Create DB Schema</h3>
              </div>

              {/* 2-Column Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Schema Name */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Schema Name <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Input
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    className="h-10 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
                  />
                </div>

                {/* Owner */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Schema Owner <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Select value={schemaOwner} onValueChange={(val) => setSchemaOwner(val || '')}>
                    <SelectTrigger className="h-10 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select Owner" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="crmadmin">crmadmin</SelectItem>
                      <SelectItem value="saadmin">saadmin</SelectItem>
                      <SelectItem value="dbadmin">dbadmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Database Server */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Database Server <span className="text-rose-500 font-bold">*</span>
                  </Label>
                  <Select value={dbServer} onValueChange={(val) => setDbServer(val || '')}>
                    <SelectTrigger className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select Server" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="AWS - Mumbai (ap-south-1)">AWS - Mumbai (ap-south-1)</SelectItem>
                      <SelectItem value="GCP - Iowa (us-central1)">GCP - Iowa (us-central1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Character Set */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Character Set</Label>
                  <Select value={characterSet} onValueChange={(val) => setCharacterSet(val || '')}>
                    <SelectTrigger className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select character set" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="UTF8 (utf8mb4)">UTF8 (utf8mb4)</SelectItem>
                      <SelectItem value="ASCII">ASCII</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Collation */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Collation</Label>
                  <Select value={collation} onValueChange={(val) => setCollation(val || '')}>
                    <SelectTrigger className="h-10 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]">
                      <SelectValue placeholder="Select collation" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[5px]">
                      <SelectItem value="utf8mb4_unicode_ci">utf8mb4_unicode_ci</SelectItem>
                      <SelectItem value="utf8mb4_general_ci">utf8mb4_general_ci</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Description (Optional)</Label>
                  <textarea
                    placeholder="Enter schema description notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="h-10 p-2.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px] resize-none focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>

              {/* Banner info */}
              <div className="flex items-center gap-2 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-[5px] text-[10px] font-bold text-blue-650 dark:text-blue-400">
                <Info className="h-4.5 w-4.5 shrink-0" />
                <span>A new schema will be created in the selected database server.</span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-3 border-t dark:border-slate-800 pt-5 mt-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/administration/db-schema')}
                  className="h-9.5 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px] px-6"
                >
                  <X className="h-4 w-4 text-slate-500" />
                  <span>Cancel</span>
                </Button>
                <Button
                  onClick={() => {
                    if (!schemaName.trim()) return toast.error('Schema Name is required.');
                    setStep(2);
                  }}
                  className="h-9.5 text-xs font-bold text-white shadow-md gap-1.5 hover:opacity-90 rounded-[5px] px-6"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Next Step</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border dark:border-slate-800 shadow-xl rounded-[5px] bg-white dark:bg-slate-900 text-left w-full animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b dark:border-slate-855 pb-3.5">
                <span className="h-6 w-6 rounded-full bg-blue-500 text-white font-bold text-[11px] flex items-center justify-center">2</span>
                <h3 className="text-xs font-black text-slate-855 dark:text-white uppercase tracking-wider">Append Master Data</h3>
              </div>

              {/* Source Schema */}
              <div className="flex flex-col gap-2 max-w-md">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Source Schema <span className="text-rose-500 font-bold">*</span>
                </Label>
                <Select value={sourceSchema} onValueChange={(val) => setSourceSchema(val || '')}>
                  <SelectTrigger className="h-10 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]">
                    <SelectValue placeholder="Select Source Schema" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[5px]">
                    <SelectItem value="crmfarm_master">crmfarm_master</SelectItem>
                    <SelectItem value="global_template_db">global_template_db</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-slate-450 mt-1 font-semibold leading-relaxed">
                  Master data will be copied from the selected source schema.
                </span>
              </div>

              {/* Master Data checklist layout in 2 columns */}
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-center justify-between border-b dark:border-slate-850 pb-2">
                  <span className="text-xs font-extrabold text-slate-805 dark:text-slate-200">Select Master Data to Append</span>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTables.length === initialMasterTables.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="accent-primary h-3.5 w-3.5 rounded"
                    />
                    <span>Select All</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1">
                  {initialMasterTables.map((tbl) => (
                    <div key={tbl.id} className="flex items-center justify-between p-3.5 text-xs font-bold border dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 rounded-[5px] hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                      <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-slate-300 w-full">
                        <input
                          type="checkbox"
                          checked={selectedTables.includes(tbl.id)}
                          onChange={(e) => handleToggleTable(tbl.id, e.target.checked)}
                          className="accent-primary h-4 w-4 rounded"
                        />
                        <span>{tbl.name}</span>
                      </label>
                      <span className="px-2.5 py-0.5 rounded-[3px] bg-blue-50 text-blue-700 dark:bg-blue-950/25 dark:text-blue-450 text-[10px] font-extrabold shrink-0 border dark:border-blue-900/10">
                        {tbl.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Banner info */}
              <div className="flex items-center gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-[5px] text-[10px] font-bold text-emerald-650 dark:text-emerald-450">
                <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                <span>Only reference/master data will be appended. Transactional data is not included.</span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-3 border-t dark:border-slate-800 pt-5 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-9.5 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px] px-6"
                >
                  <ArrowLeft className="h-4 w-4 text-slate-500" />
                  <span>Back</span>
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="h-9.5 text-xs font-bold text-white shadow-md gap-1.5 hover:opacity-90 rounded-[5px] px-6"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span>Next Step</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border dark:border-slate-800 shadow-xl rounded-[5px] bg-white dark:bg-slate-900 text-left w-full animate-in fade-in zoom-in-95 duration-200">
            <CardContent className="p-8 flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b dark:border-slate-855 pb-3.5">
                <FileText className="h-4.5 w-4.5 text-slate-455" />
                <h4 className="text-xs uppercase tracking-wider font-black">Summary Overview</h4>
              </div>

              {/* 2-Column Summary Panels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b dark:border-slate-850 pb-6">
                
                {/* Column 1: Schema Config */}
                <div className="flex flex-col gap-3.5">
                  <span className="font-extrabold text-[10px] text-blue-500 uppercase tracking-wider leading-none">New Schema Config</span>
                  
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
                    <span>Schema Name</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{schemaName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Owner</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{schemaOwner}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Database Server</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{dbServer}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Character Set</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{characterSet}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Collation</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{collation}</span>
                  </div>
                </div>

                {/* Column 2: Master Dataset summary */}
                <div className="flex flex-col gap-3.5">
                  <span className="font-extrabold text-[10px] text-blue-500 uppercase tracking-wider leading-none">Master Dataset summary</span>
                  
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
                    <span>Source Schema</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{sourceSchema}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Selected Tables</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{selectedTables.length} tables</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                    <span>Total Cloned Records</span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{totalSelectedRecords.toLocaleString()} approx.</span>
                  </div>

                  {/* warning banner inside Col 2 to balance layout height */}
                  <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded-[5px] text-[9px] font-bold text-amber-600 leading-normal mt-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>Cloned reference datasets will be appended after creation.</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-9.5 text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 gap-1.5 rounded-[5px] px-6"
                >
                  <ArrowLeft className="h-4 w-4 text-slate-500" />
                  <span>Back</span>
                </Button>
                <Button
                  onClick={handleCreateSchema}
                  className="h-9.5 text-xs font-bold text-white shadow-md gap-1.5 hover:opacity-90 rounded-[5px] px-6 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="h-4 w-4" />
                  <span>Create Schema &amp; Append Data</span>
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

      </div>

    </div>
  );
}
