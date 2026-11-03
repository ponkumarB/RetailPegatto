'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building,
  UserCheck2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
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

interface Contact {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  isDecisionMaker: boolean;
  assignedRep: string;
  createdAt: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  department?: string;
}

const initialContacts: Contact[] = [
  { id: 'CON-301', name: 'Alice Smith', jobTitle: 'Procurement Director', company: 'Acme Corporation', email: 'alice@acme.com', phone: '+31 6 1234 5678', isDecisionMaker: true, assignedRep: 'John Doe', createdAt: '2026-04-10' },
  { id: 'CON-302', name: 'Robert Johnson', jobTitle: 'Logistics Manager', company: 'Nexus Logistics', email: 'r.johnson@nexus.com', phone: '+31 6 8765 4321', isDecisionMaker: false, assignedRep: 'Jane Smith', createdAt: '2026-04-15' },
  { id: 'CON-303', name: 'Emma Watson', jobTitle: 'Chief Technical Officer', company: 'Global Solutions Group', email: 'emma@globalsol.nl', phone: '+31 6 9876 5432', isDecisionMaker: true, assignedRep: 'John Doe', createdAt: '2026-04-20' },
  { id: 'CON-304', name: 'David Miller', jobTitle: 'Store Director', company: 'Dutch Trading Company', email: 'd.miller@dutchtrade.nl', phone: '+31 6 4567 8901', isDecisionMaker: true, assignedRep: 'Unassigned', createdAt: '2026-05-02' },
  { id: 'CON-305', name: 'Sophia Davis', jobTitle: 'Marketing Head', company: 'Apex Stores Ltd', email: 'sophia@apexstores.co.uk', phone: '+44 7911 123456', isDecisionMaker: false, assignedRep: 'Jane Smith', createdAt: '2026-05-10' },
  { id: 'CON-306', name: 'Michael Brown', jobTitle: 'Operations Manager', company: 'Vanguard Industrial', email: 'm.brown@vanguard.com', phone: '+31 6 5678 1234', isDecisionMaker: false, assignedRep: 'John Doe', createdAt: '2026-05-12' }
];

export default function ContactsPage() {
  const { primaryColor } = useStore();
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [dmFilter, setDmFilter] = useState<string>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create form states
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isDecisionMaker, setIsDecisionMaker] = useState(false);
  const [assignedRep, setAssignedRep] = useState('Unassigned');

  // Edit dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editName, setEditName] = useState('');
  const [editJobTitle, setEditJobTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsDecisionMaker, setEditIsDecisionMaker] = useState(false);
  const [editAssignedRep, setEditAssignedRep] = useState('Unassigned');

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setEditName(contact.name);
    setEditJobTitle(contact.jobTitle);
    setEditCompany(contact.company);
    setEditEmail(contact.email);
    setEditPhone(contact.phone);
    setEditIsDecisionMaker(contact.isDecisionMaker);
    setEditAssignedRep(contact.assignedRep);
    setIsEditOpen(true);
  };

  const handleEditContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    setContacts(contacts.map(c =>
      c.id === editingContact.id
        ? { ...c, name: editName, jobTitle: editJobTitle, company: editCompany, email: editEmail, phone: editPhone, isDecisionMaker: editIsDecisionMaker, assignedRep: editAssignedRep }
        : c
    ));
    toast.success(`Contact ${editingContact.id} updated successfully!`);
    setIsEditOpen(false);
    setEditingContact(null);
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !jobTitle || !company || !email) {
      toast.error('Please fill in Name, Job Title, Company, and Email.');
      return;
    }

    const newContact: Contact = {
      id: `CON-${Math.floor(300 + Math.random() * 700)}`,
      name,
      jobTitle,
      company,
      email,
      phone: phone || 'N/A',
      isDecisionMaker,
      assignedRep,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setContacts([newContact, ...contacts]);
    setIsCreateOpen(false);
    toast.success(`Contact ${newContact.id} created successfully!`);

    // Reset fields
    setName('');
    setJobTitle('');
    setCompany('');
    setEmail('');
    setPhone('');
    setIsDecisionMaker(false);
    setAssignedRep('Unassigned');
  };

  const handleDeleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
    toast.success(`Contact ${id} has been deleted.`);
  };

  const handleExport = () => {
    const headers = ['ID', 'Name', 'Job Title', 'Company', 'Email', 'Phone', 'Decision Maker', 'Assigned Rep', 'Created At'];
    const data = contacts.map(c => [c.id, c.name, c.jobTitle, c.company, c.email, c.phone, c.isDecisionMaker ? 'Yes' : 'No', c.assignedRep, c.createdAt]);
    const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Contacts list exported successfully!');
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDM = true;
    if (dmFilter === 'DM') matchesDM = c.isDecisionMaker;
    if (dmFilter === 'NDM') matchesDM = !c.isDecisionMaker;

    return matchesSearch && matchesDM;
  });


  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const columns = useMemo<ColumnConfig<Contact>[]>(() => [
    {
      key: 'id',
      header: 'Contact ID',
      sortable: true,
      className: 'font-mono text-xs font-bold text-slate-400 dark:text-slate-500 w-24',
      render: (contact) => contact.id
    },
    {
      key: 'name',
      header: 'Contact Details',
      sortable: true,
      render: (contact) => (
        <div className="space-y-0.5">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{contact.name}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <Mail className="h-3 w-3 shrink-0" /> {contact.email}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" /> {contact.phone}
          </div>
        </div>
      )
    },
    {
      key: 'jobTitle',
      header: 'Job Title',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-1.5">
          <Briefcase className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{contact.jobTitle}</span>
        </div>
      )
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{contact.company}</span>
        </div>
      )
    },
    {
      key: 'isDecisionMaker',
      header: 'Decision Maker',
      sortable: true,
      className: 'text-center',
      render: (contact) => (
        <Badge variant="outline" className={contact.isDecisionMaker ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
          {contact.isDecisionMaker ? 'Yes' : 'No'}
        </Badge>
      )
    },
    {
      key: 'assignedRep',
      header: 'Assigned Rep',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-1.5">
          <UserCheck2 className="h-4 w-4 text-slate-400" />
          {contact.assignedRep}
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      className: 'text-sm font-semibold text-slate-600 dark:text-slate-400 font-mono',
      render: (contact) => contact.createdAt
    },
    {
      key: 'city',
      header: 'City',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.city || '-'}</span>
      )
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.state || '-'}</span>
      )
    },
    {
      key: 'country',
      header: 'Country',
      sortable: true,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.country || '-'}</span>
      )
    },
    {
      key: 'pinCode',
      header: 'Pincode',
      sortable: true,
      bool: false,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.pinCode || '-'}</span>
      )
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      bool: false,
      render: (contact) => (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{contact.department || '-'}</span>
      )
    }
  ], []);

  const handleActions = (contact: Contact) => (
    <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        } />
        <DropdownMenuContent align="end" className="w-48 dark:bg-slate-800">
          <DropdownMenuLabel>Contact Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEditDialog(contact)}>
            <Edit className="h-4 w-4" /> Edit Contact
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => {
            setContacts(contacts.map(c => c.id === contact.id ? { ...c, isDecisionMaker: !c.isDecisionMaker } : c));
            toast.success(`Contact status changed.`);
          }}>
            <UserCheck2 className="h-4 w-4 text-purple-600" /> Toggle Decision Maker
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600" onClick={() => handleDeleteContact(contact.id)}>
            <Trash2 className="h-4 w-4" /> Delete Contact
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

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
              <BreadcrumbPage>Contacts</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Contacts Management</h1>
          <p className="text-muted-foreground text-sm">Organise and manage individual leads and key business contacts.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-10 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={dmFilter || "All"} onValueChange={(val) => setDmFilter(val || 'All')}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder="Decision Maker Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Contacts</SelectItem>
              <SelectItem value="DM">Decision Makers</SelectItem>
              <SelectItem value="NDM">Non-Decision Makers</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={
              <Button style={{ backgroundColor: primaryColor }} className="text-white font-bold gap-2">
                <Plus className="h-4 w-4" /> Create Contact
              </Button>
            } />
            <DialogContent className="max-w-md dark:bg-slate-900">
              <form onSubmit={handleCreateContact} className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="dark:text-white">Create New Contact</DialogTitle>
                  <DialogDescription>Add contact details for an individual partner/lead.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Contact Name *</label>
                    <Input placeholder="e.g. John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Job Title *</label>
                    <Input placeholder="e.g. Procurement Director" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Company Name / Account *</label>
                    <Input placeholder="e.g. Acme Corporation" value={company} onChange={(e) => setCompany(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email Address *</label>
                    <Input type="email" placeholder="john@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                    <Input placeholder="+31 6 1234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="dm-checkbox"
                      checked={isDecisionMaker}
                      onChange={(e) => setIsDecisionMaker(e.target.checked)}
                      className="h-4.5 w-4.5 border-slate-350 accent-primary rounded"
                    />
                    <label htmlFor="dm-checkbox" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Key Decision Maker
                    </label>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Assign Contact Owner</label>
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
                  <Button type="submit" style={{ backgroundColor: primaryColor }} className="text-white">Save Contact</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Contacts</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-slate-800 dark:text-white">{contacts.length}</p>
        </div>
        <div className="p-4 bg-purple-50/55 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-500">Key Decision Makers</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-purple-700 dark:text-purple-400">
            {contacts.filter(c => c.isDecisionMaker).length}
          </p>
        </div>
        <div className="p-4 bg-blue-50/55 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Unassigned Contacts</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-blue-700 dark:text-blue-400">
            {contacts.filter(c => c.assignedRep === 'Unassigned').length}
          </p>
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Decision Maker Ratio</p>
          <p className="text-3xl font-extrabold font-mono mt-1 text-emerald-700 dark:text-emerald-400">
            {Math.round((contacts.filter(c => c.isDecisionMaker).length / contacts.length) * 100)}%
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-background/50 border dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b pb-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Contact Records</h2>
          <Button variant="outline" onClick={handleExport} className="h-9 px-4 gap-2 border-slate-200 dark:border-slate-700">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <ReusableTable
            data={filteredContacts}
            setData={setContacts}
            columns={columns}
            selectable={true}
            selectedRowIds={selectedContacts}
            onSelectionChange={(selectedRows) => setSelectedContacts(selectedRows.map(row => row.id))}
            actions={handleActions}
            onRowClick={(row) => openEditDialog(row)}
            pageSize={itemsPerPage}
              borderless={true}
            showGear={true}
            title="Contacts"
          />
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900">
          <form onSubmit={handleEditContact} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Edit Contact</DialogTitle>
              <DialogDescription>Update the contact details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Contact Name *</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Job Title *</label>
                <Input value={editJobTitle} onChange={(e) => setEditJobTitle(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Company Name / Account *</label>
                <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Email Address *</label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="edit-dm-checkbox"
                  checked={editIsDecisionMaker}
                  onChange={(e) => setEditIsDecisionMaker(e.target.checked)}
                  className="h-4.5 w-4.5 border-slate-350 accent-primary rounded"
                />
                <label htmlFor="edit-dm-checkbox" className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Key Decision Maker
                </label>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Assign Contact Owner</label>
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
