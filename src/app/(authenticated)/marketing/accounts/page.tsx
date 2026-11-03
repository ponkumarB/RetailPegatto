'use client';
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
  Globe,
  MapPin,
  Briefcase,
  AlertCircle
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { motion } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';

interface Account {
  id: string;
  name: string;
  industry: string;
  website: string;
  location: string;
  opportunitiesCount: number;
  pipelineValue: number;
  assignedRep: string;
  createdAt: string;
}

const initialAccounts: Account[] = [
  { id: 'ACC-201', name: 'Acme Corporation', industry: 'Manufacturing', website: 'www.acme.com', location: 'Amsterdam, NL', opportunitiesCount: 3, pipelineValue: 45000, assignedRep: 'John Doe', createdAt: '2026-04-10' },
  { id: 'ACC-202', name: 'Nexus Logistics', industry: 'Logistics', website: 'www.nexus.com', location: 'Rotterdam, NL', opportunitiesCount: 2, pipelineValue: 31000, assignedRep: 'Jane Smith', createdAt: '2026-04-15' },
  { id: 'ACC-203', name: 'Global Solutions Group', industry: 'Technology', website: 'www.globalsol.nl', location: 'Utrecht, NL', opportunitiesCount: 4, pipelineValue: 82000, assignedRep: 'John Doe', createdAt: '2026-04-20' },
  { id: 'ACC-204', name: 'Dutch Trading Company', industry: 'Retail', website: 'www.dutchtrade.nl', location: 'Eindhoven, NL', opportunitiesCount: 1, pipelineValue: 12000, assignedRep: 'Unassigned', createdAt: '2026-05-02' },
  { id: 'ACC-205', name: 'Vanguard Industrial', industry: 'Manufacturing', website: 'www.vanguard.com', location: 'Groningen, NL', opportunitiesCount: 2, pipelineValue: 28000, assignedRep: 'Jane Smith', createdAt: '2026-05-05' }
];

export default function AccountsPage() {
  const { primaryColor } = useStore();
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create form states
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Technology');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [assignedRep, setAssignedRep] = useState('Unassigned');

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');
  const [editIndustry, setEditIndustry] = useState('Technology');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAssignedRep, setEditAssignedRep] = useState('Unassigned');

  const openEditDialog = (account: Account) => {
    setEditingAccount(account);
    setEditName(account.name);
    setEditIndustry(account.industry);
    setEditWebsite(account.website);
    setEditLocation(account.location);
    setEditAssignedRep(account.assignedRep);
    setIsEditOpen(true);
  };

  const handleEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setAccounts(accounts.map(a =>
      a.id === editingAccount.id
        ? { ...a, name: editName, industry: editIndustry, website: editWebsite, location: editLocation, assignedRep: editAssignedRep }
        : a
    ));
    toast.success(`Account ${editingAccount.id} updated successfully!`);
    setIsEditOpen(false);
    setEditingAccount(null);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !website || !location) {
      toast.error('Please fill in Account Name, Website, and Location.');
      return;
    }

    const newAccount: Account = {
      id: `ACC-${Math.floor(200 + Math.random() * 800)}`,
      name,
      industry,
      website,
      location,
      opportunitiesCount: 0,
      pipelineValue: 0,
      assignedRep,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAccounts([newAccount, ...accounts]);
    setIsCreateOpen(false);
    toast.success(`Account ${newAccount.id} created successfully!`);

    // Reset fields
    setName('');
    setIndustry('Technology');
    setWebsite('');
    setLocation('');
    setAssignedRep('Unassigned');
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter(a => a.id !== id));
    toast.success(`Account ${id} has been deleted.`);
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Industry', 'Website', 'Location', 'Opportunities Count', 'Pipeline Value', 'Assigned Rep', 'Created At'];
    const data = accounts.map(a => [a.id, a.name, a.industry, a.website, a.location, a.opportunitiesCount, a.pipelineValue, a.assignedRep, a.createdAt]);
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Accounts list exported successfully!');
  };

  const filteredAccounts = accounts.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = industryFilter === 'All' || a.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

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
              <BreadcrumbPage>Accounts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Accounts Management</h1>
          <p className="text-muted-foreground text-sm">Manage business relationships, corporate accounts, and corporate statistics.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              className="pl-10 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={industryFilter || "All"} onValueChange={(val) => setIndustryFilter(val || 'All')}>
            <SelectTrigger className="w-[160px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Industries</SelectItem>
              <SelectItem value="Manufacturing">Manufacturing</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Logistics">Logistics</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button style={{ backgroundColor: primaryColor }} className="text-white font-bold gap-2">
                <Plus className="h-4 w-4" /> Create Account
              </Button>
            } />
            <DialogContent className="max-w-md dark:bg-slate-900">
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Create Corporate Account</DialogTitle>
                  <DialogDescription>Add a new company/organisation account.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Account Name *</label>
                    <Input placeholder="e.g. Acme Corporation" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Industry</label>
                      <Select value={industry || "Technology"} onValueChange={(val) => setIndustry(val || 'Technology')}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Logistics">Logistics</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Website *</label>
                      <Input placeholder="www.acme.com" value={website} onChange={(e) => setWebsite(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-505 uppercase">Location *</label>
                    <Input placeholder="e.g. Amsterdam, NL" value={location} onChange={(e) => setLocation(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-505 uppercase">Assign Account Manager</label>
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
                  <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white">Save Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-550">Total Accounts</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-slate-800 dark:text-white">{accounts.length}</p>
        </div>
        <div className="p-4 bg-blue-50/55 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-505">Pipeline Value</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-blue-700 dark:text-blue-400">
            €{accounts.reduce((acc, curr) => acc + curr.pipelineValue, 0).toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-505">Total Deals Stage</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-emerald-700 dark:text-emerald-400">
            {accounts.reduce((acc, curr) => acc + curr.opportunitiesCount, 0)} Active
          </p>
        </div>
        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-505">Avg Pipeline per Account</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-purple-700 dark:text-purple-400">
            €{Math.round(accounts.reduce((acc, curr) => acc + curr.pipelineValue, 0) / accounts.length).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-background/50 border dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b pb-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Active Corporate Accounts</h2>
          <Button variant="outline" onClick={handleExport} className="h-9 px-4 gap-2 border-slate-200 dark:border-slate-700">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 dark:bg-slate-900/30">
                <TableHead className="w-24 text-[10px] font-bold uppercase tracking-wider">Account ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Account Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Industry</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Website</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Location</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-center">Active Deals</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right pr-6">Pipeline Value</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider">Manager</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => (
                <TableRow key={account.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                  <TableCell className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">{account.id}</TableCell>
                  <TableCell className="font-bold text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400" />
                      {account.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-605 dark:text-slate-400">{account.industry}</TableCell>
                  <TableCell>
                    <a href={`https://${account.website}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1" style={{ color: primaryColor }}>
                      <Globe className="h-3.5 w-3.5 shrink-0" /> {account.website}
                    </a>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-605 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {account.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-800 dark:text-white font-mono">{account.opportunitiesCount}</TableCell>
                  <TableCell className="text-right font-extrabold text-slate-900 dark:text-white pr-6 font-mono">
                    €{account.pipelineValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-slate-700 dark:text-slate-300">{account.assignedRep}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-48 dark:bg-slate-800">
                        <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEditDialog(account)}>
                          <Edit className="h-4 w-4" /> Edit Account
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Briefcase className="h-4 w-4 text-blue-600" /> Create Opportunity
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600" onClick={() => handleDeleteAccount(account.id)}>
                          <Trash2 className="h-4 w-4" /> Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-505 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-slate-400" />
                      <span>No accounts found matching search filters.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Account Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <form onSubmit={handleEditAccount} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Edit Account</DialogTitle>
              <DialogDescription>Update the account details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Account Name *</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Industry</label>
                  <Select value={editIndustry || "Technology"} onValueChange={(val) => setEditIndustry(val || 'Technology')}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="Logistics">Logistics</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Website *</label>
                  <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 uppercase">Location *</label>
                <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-505 uppercase">Assigned Manager</label>
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
