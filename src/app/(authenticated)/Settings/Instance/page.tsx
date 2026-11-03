'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Plus, Search, Filter, Download, ChevronDown, MoreHorizontal, FileText, Database, Server, ServerCrash, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { useStore } from '@/store/useStore';

interface InstanceData {
  id: string;
  name: string;
  subdomain: string;
  customer: string;
  template: string;
  status: 'Active' | 'Provisioning' | 'Suspended';
  plan: string;
  createdOn: string;
}

const mockInstances: InstanceData[] = [
  { id: 'INST-001', name: 'Greenfield International School', subdomain: 'greenfield-school.crmfarm.in', customer: 'Greenfield Education Trust', template: 'Education', status: 'Active', plan: 'Professional', createdOn: '25/06/2025' },
  { id: 'INST-002', name: 'TechNova Solutions', subdomain: 'technova.crmfarm.in', customer: 'TechNova Corp', template: 'IT & SaaS', status: 'Provisioning', plan: 'Enterprise', createdOn: '26/06/2025' },
  { id: 'INST-003', name: 'Alpha Enterprises', subdomain: 'alpha.crmfarm.in', customer: 'Alpha Group', template: 'Custom', status: 'Active', plan: 'Standard', createdOn: '20/06/2025' },
  { id: 'INST-004', name: 'Retail Chain Pro', subdomain: 'retailpro.crmfarm.in', customer: 'Retail Pro Ltd', template: 'Retail', status: 'Suspended', plan: 'Professional', createdOn: '15/05/2025' }
];

export default function InstanceListPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = mockInstances.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.subdomain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnConfig<InstanceData>[] = [
    {
      header: 'Instance Name',
      key: 'name',
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push(`/Settings/Instance/${item.id}`)}>{item.name}</span>
          <span className="text-[10px] font-semibold text-slate-500">{item.subdomain}</span>
        </div>
      )
    },
    {
      header: 'Customer',
      key: 'customer',
      sortable: true,
      render: (item) => <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.customer}</span>
    },
    {
      header: 'Template',
      key: 'template',
      sortable: true,
      render: (item) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.template}</span>
    },
    {
      header: 'Plan',
      key: 'plan',
      sortable: true,
      render: (item) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.plan}</span>
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (item) => {
        let style = '';
        if (item.status === 'Active') style = 'text-emerald-600 bg-emerald-50 border-emerald-200';
        else if (item.status === 'Provisioning') style = 'text-amber-600 bg-amber-50 border-amber-200';
        else if (item.status === 'Suspended') style = 'text-rose-600 bg-rose-50 border-rose-200';
        
        return <Badge variant="outline" className={`font-bold text-[10px] px-2 py-0.5 rounded-md ${style}`}>{item.status}</Badge>;
      }
    },
    {
      header: 'Created On',
      key: 'createdOn',
      sortable: true,
      render: (item) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{item.createdOn}</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      render: (item) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
            <DropdownMenuItem className="text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300" onClick={() => router.push(`/Settings/Instance/${item.id}`)}>
              View Overview
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300" onClick={() => router.push(`/Settings/Instance/${item.id}/edit`)}>
              Edit Instance
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)] space-y-6 bg-slate-50 dark:bg-slate-950 text-left"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Instances</h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-1">Manage and provision multi-tenant instances across your organization.</p>
          <div className="text-[10px] text-slate-500 font-bold mt-2 flex items-center gap-2 uppercase tracking-wider">
            <span className="text-slate-400">Dashboard</span>
            <span>›</span>
            <span className="text-blue-600">Instances</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-10 gap-2 border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 text-sm font-bold shadow-sm">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => router.push('/Settings/Instance/create')} className="h-10 gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm cursor-pointer">
            <Plus className="h-4 w-4" /> Create Instance
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Instances', value: '42', icon: Server, color: 'blue' },
          { label: 'Active Instances', value: '38', icon: CheckCircle, color: 'emerald' },
          { label: 'Provisioning', value: '3', icon: Clock, color: 'amber' },
          { label: 'Suspended', value: '1', icon: ServerCrash, color: 'rose' }
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 bg-${kpi.color}-50 dark:bg-${kpi.color}-900/30 text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
              <kpi.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Input 
              placeholder="Search instances by name or subdomain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pr-10 text-xs font-semibold border-slate-200 rounded-lg dark:border-slate-700 dark:bg-slate-900"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          <Button variant="outline" className="h-9 gap-2 border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 rounded-lg text-xs font-bold shadow-sm">
            <Filter className="h-3.5 w-3.5" /> Filters <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        <div className="overflow-auto">
          <ReusableTable data={filteredData} columns={columns} pageSize={10} />
        </div>
      </div>
    </motion.div>
  );
}
