"use client";
import { getTenantName } from '@/service/apiClient';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Building,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { motion } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';

interface Opportunity {
  id: string;
  name: string;
  account: string;
  stage: 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  amount: number;
  probability: number; // percentage 0-100
  expectedClose: string;
  assignedRep: string;
  createdAt: string;
}

const initialOpportunities: Opportunity[] = [
  { id: 'OPP-401', name: 'Standard Supply Agreement', account: 'Acme Corporation', stage: 'Negotiation', amount: 45000, probability: 80, expectedClose: '2026-06-15', assignedRep: 'John Doe', createdAt: '2026-04-10' },
  { id: 'OPP-402', name: 'Warehouse Automation Rollout', account: 'Nexus Logistics', stage: 'Proposal', amount: 31000, probability: 60, expectedClose: '2026-07-01', assignedRep: 'Jane Smith', createdAt: '2026-04-15' },
  { id: 'OPP-403', name: 'Software Licenses Q3', account: 'Global Solutions Group', stage: 'Qualification', amount: 82000, probability: 30, expectedClose: '2026-08-30', assignedRep: 'John Doe', createdAt: '2026-04-20' },
  { id: 'OPP-404', name: 'Retail Packaging Batch', account: 'Dutch Trading Company', stage: 'Closed Won', amount: 12000, probability: 100, expectedClose: '2026-05-10', assignedRep: 'John Doe', createdAt: '2026-05-02' },
  { id: 'OPP-405', name: 'Forklift Spare Parts Order', account: 'Vanguard Industrial', stage: 'Closed Lost', amount: 28000, probability: 0, expectedClose: '2026-05-05', assignedRep: 'Jane Smith', createdAt: '2026-05-05' }
];

export default function OpportunitiesPage() {
  const { primaryColor } = useStore();
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create form states
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [stage, setStage] = useState<'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'>('Qualification');
  const [amount, setAmount] = useState('');
  const [probability, setProbability] = useState('30');
  const [expectedClose, setExpectedClose] = useState('');
  const [assignedRep, setAssignedRep] = useState('Unassigned');

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [editName, setEditName] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editStage, setEditStage] = useState<Opportunity['stage']>('Qualification');
  const [editAmount, setEditAmount] = useState('');
  const [editProbability, setEditProbability] = useState('');
  const [editExpectedClose, setEditExpectedClose] = useState('');
  const [editAssignedRep, setEditAssignedRep] = useState('Unassigned');

  const openEditDialog = (opp: Opportunity) => {
    setEditingOpp(opp);
    setEditName(opp.name);
    setEditAccount(opp.account);
    setEditStage(opp.stage);
    setEditAmount(String(opp.amount));
    setEditProbability(String(opp.probability));
    setEditExpectedClose(opp.expectedClose);
    setEditAssignedRep(opp.assignedRep);
    setIsEditOpen(true);
  };

  const handleEditOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOpp) return;
    setOpportunities(opportunities.map(o =>
      o.id === editingOpp.id
        ? { ...o, name: editName, account: editAccount, stage: editStage, amount: parseFloat(editAmount) || 0, probability: parseInt(editProbability) || 0, expectedClose: editExpectedClose, assignedRep: editAssignedRep }
        : o
    ));
    toast.success(`Opportunity ${editingOpp.id} updated successfully!`);
    setIsEditOpen(false);
    setEditingOpp(null);
  };

  const handleCreateOpportunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !account || !amount || !expectedClose) {
      toast.error('Please fill in Deal Name, Account, Value, and Close Date.');
      return;
    }

    const newOpp: Opportunity = {
      id: `OPP-${Math.floor(400 + Math.random() * 600)}`,
      name,
      account,
      stage,
      amount: parseFloat(amount) || 0,
      probability: parseInt(probability) || 50,
      expectedClose,
      assignedRep,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setOpportunities([newOpp, ...opportunities]);
    setIsCreateOpen(false);
    toast.success(`Opportunity ${newOpp.id} created successfully!`);

    // Reset fields
    setName('');
    setAccount('');
    setStage('Qualification');
    setAmount('');
    setProbability('30');
    setExpectedClose('');
    setAssignedRep('Unassigned');
  };

  const handleDeleteOpportunity = (id: string) => {
    setOpportunities(opportunities.filter(o => o.id !== id));
    toast.success(`Opportunity ${id} has been deleted.`);
  };

  const handleExport = () => {
    const headers = ['ID', 'Deal Name', 'Account', 'Stage', 'Amount', 'Probability (%)', 'Expected Close', 'Assigned Rep', 'Created At'];
    const data = opportunities.map(o => [o.id, o.name, o.account, o.stage, o.amount, o.probability, o.expectedClose, o.assignedRep, o.createdAt]);
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opportunities.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Opportunities pipeline exported successfully!');
  };

  const filteredOpps = opportunities.filter(o => {
    const matchesSearch = o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.account.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'All' || o.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const stageStyles = {
    Qualification: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    Proposal: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
    Negotiation: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    'Closed Won': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    'Closed Lost': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800'
  };

  const totalPipeline = opportunities.reduce((acc, curr) => curr.stage !== 'Closed Lost' ? acc + curr.amount : acc, 0);
  const activeOpps = opportunities.filter(o => o.stage !== 'Closed Won' && o.stage !== 'Closed Lost').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Breadcrumbs */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Marketing</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Opportunities</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Opportunities Pipeline</h1>
          <p className="text-muted-foreground text-sm">Track sales deals, estimate revenues, and calculate win rates.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search opportunities..."
              className="pl-10 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={stageFilter || "All"} onValueChange={(val) => setStageFilter(val || 'All')}>
            <SelectTrigger className="w-[160px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Stages</SelectItem>
              <SelectItem value="Qualification">Qualification</SelectItem>
              <SelectItem value="Proposal">Proposal</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Closed Won">Closed Won</SelectItem>
              <SelectItem value="Closed Lost">Closed Lost</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button style={{ backgroundColor: primaryColor }} className="text-white font-bold gap-2">
                <Plus className="h-4 w-4" /> Create Opportunity
              </Button>
            } />
            <DialogContent className="max-w-md dark:bg-slate-900">
              <form onSubmit={handleCreateOpportunity} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Create New Opportunity</DialogTitle>
                  <DialogDescription>Input new potential sales agreement details.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Opportunity / Deal Name *</label>
                    <Input placeholder="e.g. Q3 Licensing Deal" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Associated Account *</label>
                    <Input placeholder="e.g. Acme Corporation" value={account} onChange={(e) => setAccount(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Deal Value (EUR) *</label>
                      <Input type="number" placeholder="50000" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Probability (%)</label>
                      <Input type="number" min="0" max="100" value={probability} onChange={(e) => setProbability(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Stage</label>
                      <Select value={stage} onValueChange={(val: any) => setStage(val)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Qualification">Qualification</SelectItem>
                          <SelectItem value="Proposal">Proposal</SelectItem>
                          <SelectItem value="Negotiation">Negotiation</SelectItem>
                          <SelectItem value="Closed Won">Closed Won</SelectItem>
                          <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Expected Close *</label>
                      <Input type="date" value={expectedClose} onChange={(e) => setExpectedClose(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Assign Owner</label>
                    <Select value={assignedRep || "Unassigned"} onValueChange={(val) => setAssignedRep(val || 'Unassigned')}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unassigned">Unassigned</SelectItem>
                        <SelectItem value="John Doe">John Doe</SelectItem>
                        <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white">Save Opportunity</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Opportunities</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-slate-800 dark:text-white">{opportunities.length}</p>
        </div>
        <div className="p-4 bg-blue-50/55 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Active Pipeline Value</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-blue-700 dark:text-blue-400">
            €{totalPipeline.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Closed Won Value</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-emerald-700 dark:text-emerald-400">
            €{opportunities.filter(o => o.stage === 'Closed Won').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-500">Win Rate</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-purple-700 dark:text-purple-400">
            {Math.round((opportunities.filter(o => o.stage === 'Closed Won').length / opportunities.filter(o => o.stage === 'Closed Won' || o.stage === 'Closed Lost').length) * 100)}%
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-background/50 border dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b pb-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Deals Status</h2>
          <Button variant="outline" onClick={handleExport} className="h-9 px-4 gap-2 border-slate-200 dark:border-slate-700">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                <TableHead className="w-24 text-[10px] font-bold uppercase tracking-wider">Opp ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Deal / Opportunity Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Account</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Stage</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right font-mono pr-4">Value (EUR)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Probability</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Expected Close</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Assigned Owner</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpps.map((opp) => (
                <TableRow key={opp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <TableCell className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">{opp.id}</TableCell>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-slate-400" />
                      {opp.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{opp.account}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={stageStyles[opp.stage]}>
                      {opp.stage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-extrabold text-slate-900 dark:text-white pr-4 font-mono">
                    €{opp.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-800 dark:text-white font-mono">
                    <div className="flex flex-col items-center justify-center">
                      <span>{opp.probability}%</span>
                      <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${opp.probability}%`,
                            backgroundColor: opp.probability >= 75 ? '#10b981' : opp.probability >= 40 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-600 dark:text-slate-400 font-mono">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {opp.expectedClose}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-700 dark:text-slate-300">{opp.assignedRep}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-48 dark:bg-slate-800">
                        <DropdownMenuLabel>Deal Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEditDialog(opp)}>
                          <Edit className="h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => {
                          setOpportunities(opportunities.map(o => o.id === opp.id ? { ...o, stage: 'Closed Won', probability: 100 } : o));
                          toast.success(`Opportunity ${opp.id} Won!`);
                        }}>
                          <Trophy className="h-4 w-4 text-emerald-600" /> Mark Closed Won
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600" onClick={() => handleDeleteOpportunity(opp.id)}>
                          <Trash2 className="h-4 w-4" /> Delete Opportunity
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOpps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-slate-400" />
                      <span>No deals found matching current filters.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Opportunity Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <form onSubmit={handleEditOpportunity} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Edit Opportunity</DialogTitle>
              <DialogDescription>Update the deal details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Opportunity / Deal Name *</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Associated Account *</label>
                <Input value={editAccount} onChange={(e) => setEditAccount(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Deal Value (EUR) *</label>
                  <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Probability (%)</label>
                  <Input type="number" min="0" max="100" value={editProbability} onChange={(e) => setEditProbability(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Stage</label>
                  <Select value={editStage} onValueChange={(val: any) => setEditStage(val)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Qualification">Qualification</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Closed Won">Closed Won</SelectItem>
                      <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Expected Close *</label>
                  <Input type="date" value={editExpectedClose} onChange={(e) => setEditExpectedClose(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Assign Owner</label>
                <Select value={editAssignedRep || "Unassigned"} onValueChange={(val) => setEditAssignedRep(val || 'Unassigned')}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    <SelectItem value="John Doe">John Doe</SelectItem>
                    <SelectItem value="Jane Smith">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
