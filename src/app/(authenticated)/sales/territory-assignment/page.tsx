'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTerritoryStore, TerritoryAssignment } from '@/store/useTerritoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Globe,
  MapPin,
  UserCheck,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchUserDropdownList } from '@/service/api/Invoice/api';

// Interactive Tree Node Type
interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}




// Map names to specific colors for visual fidelity to screenshot
const getUserAvatarStyle = (name: string) => {
  const n = name.trim().toLowerCase();
  if (n.includes('ramesh')) return 'bg-purple-600 text-white';
  if (n.includes('suresh')) return 'bg-blue-800 text-white';
  if (n.includes('anitha')) return 'bg-orange-500 text-white';
  if (n.includes('vikram')) return 'bg-emerald-600 text-white';
  if (n.includes('meenal')) return 'bg-pink-500 text-white';
  return 'bg-slate-400 text-white';
};

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';

export default function TerritoryAssignmentPage() {
  const router = useRouter();
  const {
    canCreateTerritoryAssignment,
    canEditTerritoryAssignment,
    canDeleteTerritoryAssignment,
    canViewTerritoryAssignmentOverview,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewTerritoryAssignmentOverview) {
      toast.error('You do not have permission to view Territory Assignments.');
      router.push('/');
    }
  }, [canViewTerritoryAssignmentOverview, isLoaded, router]);

  const { territories, assignments, assignmentsCount, addAssignment, deleteAssignment, updateAssignment, loadTerritories, loadAssignments, isLoading, hierarchyNodes } = useTerritoryStore();

  // Search & Filter Panel state
  const [userFilter, setUserFilter] = useState('All');
  const [territoryFilter, setTerritoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState('');

  // Selected Tree Node Filter
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>('Global');
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<string[]>([
    'Global', 'India', 'South India', 'Tamil Nadu', 'Chennai'
  ]);

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TerritoryAssignment | null>(null);

  // Form states for Create / Edit Assignment
  const [formUser, setFormUser] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUserId, setFormUserId] = useState<number | undefined>(undefined);
  const [userList, setUserList] = useState<any[]>([]);
  const [formTerritory, setFormTerritory] = useState('');
  const [formType, setFormType] = useState<'Exclusive' | 'Shared' | 'Backup' | 'Primary Assignment'>('Exclusive');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formActive, setFormActive] = useState(true);

  const isServerSide = userFilter === 'All' && territoryFilter === 'All' && typeFilter === 'All' && statusFilter === 'All' && selectedTreeNode === 'Global';
  const serverPageSize = 10;

  useEffect(() => {
    loadTerritories();
  }, [loadTerritories]);

  useEffect(() => {
    fetchUserDropdownList().then((data) => {
      if (Array.isArray(data)) {
        setUserList(data);
      }
    }).catch((err) => console.error('Failed to load user list:', err));
  }, []);

  useEffect(() => {
    if (isServerSide) {
      loadAssignments(undefined, currentPage);
    } else {
      loadAssignments();
    }
  }, [loadAssignments, currentPage, isServerSide]);

  // Toggle tree node expansion
  const toggleNode = (id: string) => {
    setExpandedNodes(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  // Build the hierarchyTree dynamically from the store's flat hierarchyNodes list
  const hierarchyTree = useMemo(() => {
    const build = (parentId: string | null): TreeNode[] => {
      return hierarchyNodes
        .filter(node => node.parent === parentId)
        .map(node => ({
          id: node.id,
          label: node.name,
          children: build(node.id)
        }));
    };
    return build(null);
  }, [hierarchyNodes]);

  // Recursively collect all territory names under a tree node to filter correctly
  const getSubTerritories = (node: TreeNode): string[] => {
    let result = [node.label];
    if (node.children) {
      node.children.forEach(child => {
        result = [...result, ...getSubTerritories(child)];
      });
    }
    return result;
  };

  // Find a node in the tree by ID
  const findNodeInTree = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id.toLowerCase() === id.toLowerCase()) return node;
      if (node.children) {
        const found = findNodeInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Filter assignments based on all options
  const filteredAssignments = useMemo(() => {
    if (isServerSide) return assignments;
    return assignments.filter(a => {
      // 1. Search & Filter panel
      const matchesUser = userFilter === 'All' || a.user.name.toLowerCase().includes(userFilter.toLowerCase());
      const matchesTerritory = territoryFilter === 'All' || a.territory.toLowerCase() === territoryFilter.toLowerCase();
      const matchesType = typeFilter === 'All' || a.assignmentType === typeFilter;
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Active' && a.isActive) || (statusFilter === 'Inactive' && !a.isActive);

      // 2. Tree node filter (click Global shows all, clicking India shows India + descendants)
      let matchesTree = true;
      if (selectedTreeNode !== 'Global') {
        const node = findNodeInTree(hierarchyTree, selectedTreeNode);
        if (node) {
          const coveredTerritories = getSubTerritories(node).map(t => t.toLowerCase());
          matchesTree = coveredTerritories.includes(a.territory.toLowerCase());
        }
      }

      return matchesUser && matchesTerritory && matchesType && matchesStatus && matchesTree;
    });
  }, [assignments, userFilter, territoryFilter, typeFilter, statusFilter, selectedTreeNode, isServerSide, hierarchyTree]);

  // Pagination
  const paginatedAssignments = useMemo(() => {
    if (isServerSide) return assignments;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssignments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssignments, currentPage, isServerSide]);

  const displayTotal = isServerSide ? assignmentsCount : filteredAssignments.length;
  const totalPages = isServerSide ? (Math.ceil(assignmentsCount / serverPageSize) || 1) : (Math.ceil(filteredAssignments.length / itemsPerPage) || 1);

  // Handle Search & Filter submit
  const handleFilterSearch = () => {
    setCurrentPage(1);
    toast.success('Filters applied.');
  };

  // Reset filters
  const handleResetFilters = () => {
    setUserFilter('All');
    setTerritoryFilter('All');
    setTypeFilter('All');
    setStatusFilter('All');
    setDateRange('');
    setSelectedTreeNode('Global');
    setCurrentPage(1);
    toast.info('Filters reset.');
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteAssignment(id);
      toast.success('Assignment deleted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete assignment.');
    }
  };

  // Open modal for Create Assignment
  const openAssignModal = () => {
    setEditingAssignment(null);
    setFormUser('');
    setFormEmail('');
    setFormUserId(undefined);
    setFormTerritory(territories[0]?.name || 'Chennai North');
    setFormType('Exclusive');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormActive(true);
    setIsAssignOpen(true);
  };

  // Open modal for Edit Assignment
  const openEditModal = (asg: TerritoryAssignment) => {
    setEditingAssignment(asg);
    setFormUser(asg.user.name);
    setFormEmail(asg.user.email);
    setFormUserId(asg.user.id);
    setFormTerritory(asg.territory);
    setFormType(asg.assignmentType);
    setFormStartDate(asg.startDate);
    setFormEndDate(asg.endDate === '—' ? '' : asg.endDate);
    setFormActive(asg.isActive);
    setIsAssignOpen(true);
  };

  // Handle Create / Edit Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formUserId) {
      toast.error('Selecting a User is required.');
      return;
    }
    if (!formUser.trim()) {
      toast.error('User Name is required.');
      return;
    }


    try {
      if (editingAssignment) {
        // Edit
        await updateAssignment(editingAssignment.id, {
          user: { id: formUserId, name: formUser.trim(), email: formEmail.trim() },
          territory: formTerritory,
          assignmentType: formType,
          startDate: formStartDate,
          endDate: formEndDate.trim() || '—',
          isActive: formActive,
          lastModifiedBy: 'System Admin',
          lastModifiedOn: new Date().toLocaleString()
        });
        toast.success('Assignment updated successfully.');
      } else {
        // Add
        await addAssignment({
          id: '',
          user: { id: formUserId, name: formUser.trim(), email: formEmail.trim() },
          territory: formTerritory,
          assignmentType: formType,
          startDate: formStartDate,
          endDate: formEndDate.trim() || '—',
          isActive: formActive,
          createdBy: 'System Admin',
          createdOn: new Date().toLocaleString()
        });
        toast.success('Territory assigned successfully.');
      }
      setIsAssignOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save assignment.');
    }
  };

  // Render tree node recursively
  const renderTree = (node: TreeNode, depth = 0) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedTreeNode === node.id;

    // Filter tree nodes if treeSearchQuery is active
    if (treeSearchQuery.trim() !== '') {
      const matchLabel = node.label.toLowerCase().includes(treeSearchQuery.toLowerCase());
      const matchChildren = node.children?.some(c => c.label.toLowerCase().includes(treeSearchQuery.toLowerCase()));
      if (!matchLabel && !matchChildren) return null;
    }

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors ${isSelected
              ? 'bg-blue-50/80 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setSelectedTreeNode(node.id)}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0.5 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-sm shrink-0 cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-slate-450" />
              ) : (
                <ChevronRight className="h-3 w-3 text-slate-450" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {node.id === 'Global' ? (
            <Globe className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
          ) : (
            <MapPin className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
          )}

          <span className="truncate">{node.label}</span>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children!.map(child => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoaded && !canViewTerritoryAssignmentOverview) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Territory Management</span>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">Territory Assignment</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Territory Assignment</h1>
              <p className="text-xs text-slate-450 mt-0.5">Assign territories to users and manage ownership mappings.</p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {canCreateTerritoryAssignment && (
            <Button
              onClick={openAssignModal}
              size="sm"
              className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Assign Territory
            </Button>
          )}
        </div>
      </div>

      {/* Main Split Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hierarchy Tree */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 text-xs font-semibold">
            <div className="border-b dark:border-slate-800 pb-2 mb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Territory Hierarchy</h2>
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search territory..."
                value={treeSearchQuery}
                onChange={(e) => setTreeSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
              {hierarchyTree.map(rootNode => renderTree(rootNode))}
            </div>
          </Card>
        </div>

        {/* Right Column: Assignments Registry */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between p-4 border-b dark:border-slate-800 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Territory Assignments ({filteredAssignments.length})
                </h2>
                {selectedTreeNode !== 'Global' && (
                  <Badge variant="secondary" className="text-[10px] bg-blue-50 dark:bg-blue-955/20 text-blue-600">
                    Filter: {selectedTreeNode}
                  </Badge>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
                  <TableRow className="border-b dark:border-slate-800">
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">User</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Territory</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Assignment Type</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Start Date</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">End Date</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Status</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5 text-right w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-16 text-center text-slate-505 font-medium">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                          <span className="text-sm">Loading assignments from server...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedAssignments.map(asg => (
                    <TableRow
                      key={asg.id}
                      className="hover:bg-slate-50/30 dark:hover:bg-slate-900/20 border-b dark:border-slate-800 transition-colors duration-150"
                    >
                      {/* User Profile */}
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${getUserAvatarStyle(asg.user.name)}`}>
                            {getInitials(asg.user.name)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{asg.user.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal mt-0.5">{asg.user.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Territory */}
                      <TableCell className="py-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold">
                        {asg.territory}
                      </TableCell>

                      {/* Assignment Type */}
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={
                          asg.assignmentType === 'Exclusive'
                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100'
                            : asg.assignmentType === 'Shared'
                              ? 'text-blue-700 bg-blue-50 dark:bg-blue-955/20 border-blue-100'
                              : 'text-amber-700 bg-amber-50 dark:bg-amber-955/20 border-amber-100'
                        }>
                          {asg.assignmentType}
                        </Badge>
                      </TableCell>

                      {/* Dates */}
                      <TableCell className="py-2.5 text-xs text-slate-550 dark:text-slate-400 font-medium">
                        {asg.startDate}
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-slate-550 dark:text-slate-400 font-medium">
                        {asg.endDate}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className={asg.isActive
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-955/10 border-emerald-100'
                          : 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200'
                        }>
                          {asg.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      {/* Actions */}
                      <TableCell className="py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {canDeleteTerritoryAssignment && (
                            <button
                              onClick={() => handleDeleteAssignment(asg.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg cursor-pointer transition-colors"
                              title="Delete Assignment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!isLoading && filteredAssignments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="px-6 py-12 text-center text-slate-505 font-medium">
                        <div className="flex flex-col items-center gap-1.5">
                          <AlertTriangle className="h-6 w-6 text-slate-400" />
                          <span className="text-xs">No assignments match the filters. Click "Assign Territory" to add one.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t dark:border-slate-800 text-xs font-medium text-slate-505">
              <span>Showing {displayTotal > 0 ? (currentPage - 1) * (isServerSide ? serverPageSize : itemsPerPage) + 1 : 0} to {Math.min(currentPage * (isServerSide ? serverPageSize : itemsPerPage), displayTotal)} of {displayTotal} entries</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8.5 w-8.5 rounded-lg border-slate-200"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </Button>

                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8.5 px-3 rounded-lg text-xs font-semibold ${currentPage === i + 1
                        ? "border-blue-200 bg-blue-50/60 font-bold text-blue-600"
                        : "border-slate-205 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    {i + 1}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8.5 w-8.5 rounded-lg border-slate-200"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Assign Territory Modal Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800 p-6">
          <DialogHeader className="border-b dark:border-slate-850 pb-3">
            <DialogTitle className="text-base font-bold dark:text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              {editingAssignment ? 'Edit Assignment' : 'Assign Territory'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingAssignment
                ? 'Update the assignment parameters and parameters for the user.'
                : 'Map a sales user or representative to a specific territory node.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-3 text-xs font-semibold">
            {/* Select User Dropdown */}
            <div className="space-y-1">
              <Label htmlFor="formUserId" className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Select User <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={formUser}
                onValueChange={(val) => {
                  if (val) {
                    const u = userList.find(user => (user.username || user.Name || `User ${user.id}`) === val);
                    if (u) {
                      setFormUserId(u.id);
                      setFormUser(val);
                      setFormEmail(u.email || u.Email || '');
                    }
                  } else {
                    setFormUserId(undefined);
                    setFormUser('');
                    setFormEmail('');
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-205 dark:border-slate-800 text-left">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                  {userList.map(u => {
                    const name = u.username || u.Name || `User ${u.id}`;
                    return (
                      <SelectItem key={u.id} value={name}>
                        {name}
                      </SelectItem>
                    );
                  })}
                  {userList.length === 0 && (
                    <SelectItem value="" disabled>No users loaded</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* User Email (Read-only) */}
            {formEmail && (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  User Email
                </Label>
                <div className="h-9 px-3 flex items-center text-xs bg-slate-100 dark:bg-slate-950 text-slate-500 rounded-md border border-slate-200 dark:border-slate-850">
                  {formEmail}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Territory */}
              <div className="space-y-1">
                <Label htmlFor="formTerritory" className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Territory <span className="text-rose-500">*</span>
                </Label>
                <Select value={formTerritory} onValueChange={(val) => setFormTerritory(val || '')}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left">
                    <SelectValue placeholder="Select territory" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                    {territories.map(t => (
                      <SelectItem key={t.code} value={t.name}>{t.name}</SelectItem>
                    ))}
                    {territories.length === 0 && (
                      <SelectItem value="Chennai North">Chennai North</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Assignment Type */}
              <div className="space-y-1">
                <Label htmlFor="formType" className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Assignment Type <span className="text-rose-500">*</span>
                </Label>
                <Select value={formType} onValueChange={(val) => setFormType((val || 'Exclusive') as any)}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 border">
                    <SelectItem value="Exclusive">Exclusive</SelectItem>
                    <SelectItem value="Shared">Shared</SelectItem>
                    <SelectItem value="Backup">Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1">
                <Label htmlFor="formStart" className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  Start Date <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="formStart"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1">
                <Label htmlFor="formEnd" className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  End Date
                </Label>
                <Input
                  id="formEnd"
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-lg border dark:border-slate-850">
              <span className="text-slate-700 dark:text-slate-350">Assignment Active Status</span>
              <button
                type="button"
                onClick={() => setFormActive(!formActive)}
                className={`relative inline-flex h-4.5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-hidden ${formActive ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${formActive ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                />
              </button>
            </div>

            <DialogFooter className="border-t dark:border-slate-850 pt-3 mt-4">
              <DialogClose render={<Button variant="outline" className="text-xs" />}>
                Cancel
              </DialogClose>
              <Button type="submit" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                {editingAssignment ? 'Save Changes' : 'Confirm Assignment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
