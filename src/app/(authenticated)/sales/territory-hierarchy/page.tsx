'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTerritoryStore, HierarchyNode } from '@/store/useTerritoryStore';
import { fetchTerritoryFullList, fetchAssignmentListView } from '@/service/api/Territory/api';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Globe,
  MapPin,
  MoreHorizontal,
  Edit2,
  Trash2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Split,
  Merge,
  Move
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchUserDropdownList } from '@/service/api/Invoice/api';
import { GetCountries, GetState, GetCity } from 'react-country-state-city';
import { SearchableSelect } from '@/components/ui/searchable-select';

// Custom Toggle Switch Component
function Switch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-hidden ${checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
      />
    </button>
  );
}

import { usePermission } from '@/hooks/usePermission';

export default function TerritoryHierarchyPage() {
  const {
    canCreateTerritoryHierarchy,
    canEditTerritoryHierarchy,
    canDeleteTerritoryHierarchy,
    canImportTerritoryHierarchy,
    canExportTerritoryHierarchy,
    canViewTerritoryHierarchyOverview,
    isLoaded
  } = usePermission();

  const router = useRouter(); // Wait! Let's check if useRouter is imported. It is.
  useEffect(() => {
    if (isLoaded && !canViewTerritoryHierarchyOverview) {
      toast.error('You do not have permission to view Territory Hierarchy.');
      router.push('/');
    }
  }, [canViewTerritoryHierarchyOverview, isLoaded, router]);

  const {
    hierarchyNodes,
    territories,
    addHierarchyNode,
    addTerritory,
    updateHierarchyNode,
    deleteHierarchyNode,
    moveHierarchyNode,
    mergeHierarchyNodes,
    splitHierarchyNode,
    loadAllData,
    isLoading
  } = useTerritoryStore();

  // Load territories and full list on mount
  useEffect(() => {
    loadAllData();
    fetchTerritoryFullList()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        setFullTerritoryList(list);
      })
      .catch((err) => console.error('Failed to load territory list:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selected Node State
  const [selectedNodeId, setSelectedNodeId] = useState<string>('Global');
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['Global']);
  const [isEditing, setIsEditing] = useState(false);

  // Full territory list with numeric IDs
  const [fullTerritoryList, setFullTerritoryList] = useState<any[]>([]);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Tab State: 'children' | 'users' | 'stats'
  const [activeTab, setActiveTab] = useState<'children' | 'users' | 'stats'>('children');

  // Bottom Actions Dialog States
  const [parentDialogOpen, setParentDialogOpen] = useState(false);
  const [childDialogOpen, setChildDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);

  // Form Fields States
  const [nodeName, setNodeName] = useState('');
  const [nodeCode, setNodeCode] = useState('');
  const [nodeType, setNodeType] = useState('Geographical');
  const [nodeDesc, setNodeDesc] = useState('');

  // Redesigned Form Fields matching Territory Create
  const [region, setRegion] = useState('South India');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('None');
  const [timezone, setTimezone] = useState('(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi');
  const [isActive, setIsActive] = useState(true);
  const [territoryType, setTerritoryType] = useState('Child'); // 'Parent' | 'Child'
  const [managerId, setManagerId] = useState<number | null>(null);
  const [managerName, setManagerName] = useState('');
  const [parentTerritory, setParentTerritory] = useState('None');

  const [userList, setUserList] = useState<any[]>([]);
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [availableStates, setAvailableStates] = useState<any[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);

  const [assignedUsersForSelectedNode, setAssignedUsersForSelectedNode] = useState<any[]>([]);
  const [isLoadingAssignedUsers, setIsLoadingAssignedUsers] = useState(false);

  // 1. Fetch countries list on mount
  useEffect(() => {
    async function initCountries() {
      try {
        const list = await GetCountries();
        setCountriesList(list || []);
      } catch (err) {
        console.error('Failed to load countries:', err);
      }
    }
    initCountries();
  }, []);

  // 2. Cascade load states when country changes
  useEffect(() => {
    if (!countriesList.length) return;
    const foundCountry = countriesList.find(c => c.name.toLowerCase() === country.toLowerCase());
    if (foundCountry) {
      if (foundCountry.id !== selectedCountryId) {
        setSelectedCountryId(foundCountry.id);
        GetState(foundCountry.id).then(states => {
          setAvailableStates(states || []);
        }).catch(err => console.error(err));
      }
    } else {
      setSelectedCountryId(null);
      setAvailableStates([]);
    }
  }, [country, countriesList, selectedCountryId]);

  // 3. Fetch managers list on mount
  useEffect(() => {
    fetchUserDropdownList().then((data) => {
      if (Array.isArray(data)) {
        setUserList(data);
      }
    }).catch((err) => console.error('Failed to load user list:', err));
  }, []);

  // Memos for select dropdown options
  const countryOptions = useMemo(() => {
    return countriesList.map((c) => ({ value: c.name, label: c.name }));
  }, [countriesList]);

  const stateOptions = useMemo(() => {
    return [
      { value: 'None', label: 'None' },
      ...availableStates.map((s) => ({ value: s.name, label: s.name }))
    ];
  }, [availableStates]);

  // Use useCallback/Memo for Manager and Parent Select Options
  const managerOptions = useMemo(() => {
    return userList.map((u) => {
      const name = u.username || u.Name || `User ${u.id}`;
      return { value: String(u.id), label: name };
    });
  }, [userList]);

  const parentOptions = useMemo(() => {
    const list = territories.map((t) => ({ value: t.name, label: t.name }));
    return [
      { value: 'None', label: 'None' },
      ...list
    ];
  }, [territories]);

  // Move Node Dialog state
  const [moveTargetNode, setMoveTargetNode] = useState('');
  const [moveNewParent, setMoveNewParent] = useState('');

  // Merge Nodes Dialog state
  const [mergeNodeA, setMergeNodeA] = useState('');
  const [mergeNodeB, setMergeNodeB] = useState('');
  const [mergedName, setMergedName] = useState('');
  const [mergedOperation, setMergedOperation] = useState('');

  // Split Node Dialog state
  const [splitSourceNode, setSplitSourceNode] = useState('');
  const [split1Name, setSplit1Name] = useState('');
  const [split2Name, setSplit2Name] = useState('');

  // Find currently selected node object
  const selectedNode = useMemo(() => {
    return hierarchyNodes.find(n => n.id === selectedNodeId) || hierarchyNodes[0] || null;
  }, [hierarchyNodes, selectedNodeId]);

  // Find direct children of the selected node
  const directChildren = useMemo(() => {
    if (!selectedNode) return [];
    return hierarchyNodes.filter(n => n.parent === selectedNode.id);
  }, [hierarchyNodes, selectedNode]);

  // Sibling nodes of selected (for merge choices)
  const siblingNodes = useMemo(() => {
    if (!selectedNode) return [];
    return hierarchyNodes.filter(n => n.parent === selectedNode.parent && n.id !== selectedNode.id);
  }, [hierarchyNodes, selectedNode]);

  // Find parent name for selected details
  const parentNodeName = useMemo(() => {
    if (!selectedNode || !selectedNode.parent) return '—';
    if (selectedNode.parent === 'Global') return 'Global';
    const pNode = hierarchyNodes.find(n => n.id === selectedNode.parent);
    return pNode ? pNode.name : selectedNode.parent;
  }, [hierarchyNodes, selectedNode]);

  // Build Tree Structure recursively
  const buildTree = (parentId: string | null): any[] => {
    return hierarchyNodes
      .filter(node => node.parent === parentId)
      .map(node => ({
        ...node,
        children: buildTree(node.id)
      }));
  };

  const hierarchyTree = useMemo(() => buildTree(null), [hierarchyNodes]);

  // Toggle node expansion
  const toggleNode = (id: string) => {
    setExpandedNodes(prev =>
      prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]
    );
  };

  // Create Parent Node Handler
  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) {
      toast.error('Territory Name is required.');
      return;
    }
    if (!managerId) {
      toast.error('Territory Manager is required.');
      return;
    }
    if (!country.trim()) {
      toast.error('Country is required.');
      return;
    }

    try {
      await addTerritory({
        name: nodeName.trim(),
        type: nodeType,
        parentTerritory: '',
        region,
        country,
        state: state === 'None' ? '' : state,
        timezone,
        isActive,
        description: nodeDesc.trim(),
        createdBy: 'System Admin',
        createdOn: new Date().toLocaleString(),
        territoryType: 'Parent',
        managerName: managerName,
        managerId: managerId || undefined
      });

      toast.success(`Parent Territory "${nodeName}" created.`);
      
      setTimeout(() => {
        const freshNodes = useTerritoryStore.getState().hierarchyNodes;
        const createdNode = freshNodes.find(n => n.name === nodeName.trim());
        if (createdNode) {
          setSelectedNodeId(createdNode.id);
        } else {
          setSelectedNodeId('Global');
        }
      }, 500);

      setParentDialogOpen(false);
      resetFormFields();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create parent territory.');
    }
  };

  // Create Child Node Handler
  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) {
      toast.error('Territory Name is required.');
      return;
    }
    if (!managerId) {
      toast.error('Territory Manager is required.');
      return;
    }
    if (!country.trim()) {
      toast.error('Country is required.');
      return;
    }

    try {
      await addTerritory({
        name: nodeName.trim(),
        type: nodeType,
        parentTerritory: parentTerritory === 'None' ? '' : parentTerritory,
        region,
        country,
        state: state === 'None' ? '' : state,
        timezone,
        isActive,
        description: nodeDesc.trim(),
        createdBy: 'System Admin',
        createdOn: new Date().toLocaleString(),
        territoryType: 'Child',
        managerName: managerName,
        managerId: managerId || undefined
      });

      toast.success(`Child Territory "${nodeName}" created under ${parentTerritory === 'None' ? 'Global' : parentTerritory}.`);

      setTimeout(() => {
        const freshNodes = useTerritoryStore.getState().hierarchyNodes;
        const createdNode = freshNodes.find(n => n.name === nodeName.trim());
        if (createdNode) {
          setSelectedNodeId(createdNode.id);
          if (createdNode.parent && !expandedNodes.includes(createdNode.parent)) {
            setExpandedNodes(prev => [...prev, createdNode.parent!]);
          }
        }
      }, 500);

      setChildDialogOpen(false);
      resetFormFields();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create child territory.');
    }
  };

  // Edit Territory Handler
  const handleEditTerritory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    if (!nodeName.trim()) {
      toast.error('Name is required.');
      return;
    }

    try {
      await updateHierarchyNode(selectedNode.id, {
        name: nodeName.trim(),
        type: nodeType,
        description: nodeDesc.trim(),
        isActive: selectedNode.isActive
      });
      toast.success(`Territory "${nodeName}" updated.`);
      setChildDialogOpen(false);
      resetFormFields();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update territory.');
    }
  };

  // Move Node Handler — uses numeric territory ID from fullTerritoryList
  const handleMoveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveTargetNode || !moveNewParent) {
      toast.error('Please select both the territory to move and the new parent.');
      return;
    }
    if (moveTargetNode === moveNewParent) {
      toast.error('Cannot move a territory under itself.');
      return;
    }

    try {
      const targetNumericId = getNumericId(moveTargetNode);
      const parentNumericId = (moveNewParent === 'None' || moveNewParent === 'Global') ? null : getNumericId(moveNewParent);
      await moveHierarchyNode(targetNumericId, parentNumericId);
      toast.success('Territory moved successfully.');
      setSelectedNodeId(moveTargetNode);
      setMoveDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to move territory.');
    }
  };

  // Merge Nodes Handler — payload: source_territories (numeric IDs), new_territory_name, new_territory_operation
  const handleMergeNodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeNodeA || !mergeNodeB || !mergedName.trim() || !mergedOperation.trim()) {
      toast.error('All merge fields are required.');
      return;
    }
    if (mergeNodeA === mergeNodeB) {
      toast.error('Please select two different territories to merge.');
      return;
    }

    try {
      const numericIdA = getNumericId(mergeNodeA);
      const numericIdB = getNumericId(mergeNodeB);
      await mergeHierarchyNodes(numericIdA, numericIdB, mergedName.trim(), mergedOperation.trim());
      toast.success('Territories merged successfully.');
      setMergeDialogOpen(false);
      setMergedName('');
      setMergedOperation('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to merge territories.');
    }
  };

  // Split Node Handler — payload: territory_id, created_by, updated_by, children [{territory_name}]
  const handleSplitNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitSourceNode || !split1Name.trim() || !split2Name.trim()) {
      toast.error('Source territory and both partition names are required.');
      return;
    }

    try {
      const numericSourceId = getNumericId(splitSourceNode);
      // Pass empty strings for codes — the API doesn't use them in split
      await splitHierarchyNode(numericSourceId, split1Name.trim(), '', split2Name.trim(), '');
      toast.success('Territory split successfully.');
      setSplitDialogOpen(false);
      setSplit1Name('');
      setSplit2Name('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to split territory.');
    }
  };

  const resetFormFields = () => {
    setNodeName('');
    setNodeCode('');
    setNodeDesc('');
    setNodeType('Geographical');
    setRegion('South India');
    setCountry('India');
    setState('None');
    setTimezone('(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi');
    setIsActive(true);
    setManagerId(null);
    setManagerName('');
    setParentTerritory('None');
  };

  // Numeric ID lookup from hierarchyNodes, store territories, and fullTerritoryList
  const getNumericId = (nodeIdOrName: string): string => {
    // 1. Try finding in hierarchyNodes first
    const node = hierarchyNodes.find(n => n.name === nodeIdOrName || n.id === nodeIdOrName);
    if (node && node.id !== 'Global' && !isNaN(Number(node.id))) {
      return node.id;
    }
    // 2. Try finding in store's territories list (always up to date)
    const t = territories.find(t => t.name === nodeIdOrName || String(t.id) === nodeIdOrName || t.code === nodeIdOrName);
    if (t && t.id !== undefined) {
      return String(t.id);
    }
    // 3. Fallback to fullTerritoryList
    const ft = fullTerritoryList.find(ft => 
      String(ft.Territory_Id) === nodeIdOrName || 
      String(ft.id) === nodeIdOrName || 
      ft.TerritoryName === nodeIdOrName
    );
    return ft ? String(ft.id) : nodeIdOrName;
  };

  useEffect(() => {
    if (selectedNodeId && selectedNodeId !== 'Global') {
      setIsLoadingAssignedUsers(true);
      const numericId = getNumericId(selectedNodeId);
      if (numericId && !isNaN(Number(numericId))) {
        fetchAssignmentListView(Number(numericId))
          .then(res => {
            if (res && res.status && Array.isArray(res.data)) {
              setAssignedUsersForSelectedNode(res.data);
            } else {
              setAssignedUsersForSelectedNode([]);
            }
          })
          .catch(err => {
            console.error('Failed to load assignments for selected node:', err);
            setAssignedUsersForSelectedNode([]);
          })
          .finally(() => {
            setIsLoadingAssignedUsers(false);
          });
      } else {
        setAssignedUsersForSelectedNode([]);
        setIsLoadingAssignedUsers(false);
      }
    } else {
      setAssignedUsersForSelectedNode([]);
    }
  }, [selectedNodeId, fullTerritoryList, territories, hierarchyNodes]);

  // Render tree node recursively
  const renderTreeNode = (node: any, depth = 0) => {
    const isExpanded = expandedNodes.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeId === node.id;

    if (treeSearchQuery.trim() !== '') {
      const matchLabel = node.name.toLowerCase().includes(treeSearchQuery.toLowerCase());
      const matchChildren = node.children?.some((c: any) => c.name.toLowerCase().includes(treeSearchQuery.toLowerCase()));
      if (!matchLabel && !matchChildren) return null;
    }

    return (
      <div key={node.id} className="space-y-1">
        <div
          className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors ${isSelected
            ? 'bg-blue-50/80 dark:bg-blue-955/30 text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => setSelectedNodeId(node.id)}
        >
          <div className="flex items-center gap-1.5 truncate">
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

            {node.type === 'Global' ? (
              <Globe className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
            ) : (
              <Folder className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
            )}

            <span className="truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <span className="px-1.5 py-0.5 text-[8.5px] font-bold rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-605">
              {node.assignedUsers?.length || 1}
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map((child: any) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoaded && !canViewTerritoryHierarchyOverview) {
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
            <span className="text-slate-505 font-medium">Territory Hierarchy Management</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Layers className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Territory Hierarchy Management</h1>
              <p className="text-xs text-slate-450 mt-0.5">Manage and organize territories in a hierarchical structure.</p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          {canCreateTerritoryHierarchy && (
            <Button
              onClick={() => {
                resetFormFields();
                setTerritoryType('Child');
                setParentTerritory(selectedNode && selectedNode.id !== 'Global' ? selectedNode.name : 'None');
                setIsEditing(false);
                setChildDialogOpen(true);
              }}
              size="sm"
              className="h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Territory
            </Button>
          )}
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Hierarchy Tree */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 text-xs font-semibold">
            <div className="border-b dark:border-slate-800 pb-2 mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Territory Hierarchy</h2>
              <Filter className="h-4 w-4 text-slate-400 cursor-pointer hover:text-slate-650" />
            </div>

            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search territory..."
                value={treeSearchQuery}
                onChange={(e) => setTreeSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
              />
            </div>

            <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
              {isLoading && hierarchyNodes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <span className="text-[11px] text-slate-450">Loading hierarchy...</span>
                </div>
              ) : hierarchyTree.map(rootNode => renderTreeNode(rootNode))}
            </div>
          </Card>
        </div>

        {/* Right Column: Node Details */}
        <div className="lg:col-span-8 space-y-6">
          {selectedNode ? (
            <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden text-xs font-semibold">
              <div className="p-6 space-y-5">
                {/* Details Header */}
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Territory Details</h3>
                <div className="flex items-center gap-2">
                    {canEditTerritoryHierarchy && (
                      <Button
                        onClick={() => {
                          setNodeName(selectedNode.name);
                          setNodeCode(selectedNode.code);
                          setNodeType(selectedNode.type);
                          setNodeDesc(selectedNode.description);
                          setIsEditing(true);
                          setChildDialogOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1 border-slate-200 bg-white dark:bg-slate-900"
                      >
                        <Edit2 className="h-3 w-3 text-slate-500" />
                        Edit Territory
                      </Button>
                    )}
                    {canDeleteTerritoryHierarchy && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                setDeleteTarget({ id: selectedNode.id, name: selectedNode.name });
                              } catch (err: any) {
                                toast.error(err.message || 'Failed to delete node.');
                              }
                            }}
                            className="text-rose-600 hover:bg-rose-50 text-xs font-bold gap-2 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete Node
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Details Metadata grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 py-1">
                  <div className="flex justify-between border-b dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400">Territory Name</span>
                    <span className="text-slate-900 dark:text-white font-bold">{selectedNode.name}</span>
                  </div>
                  <div className="flex justify-between border-b dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400">Territory Code</span>
                    <span className="text-slate-900 dark:text-white font-mono">{selectedNode.code}</span>
                  </div>
                  <div className="flex justify-between border-b dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400">Territory Type</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedNode.type}</span>
                  </div>
                  <div className="flex justify-between border-b dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400">Parent Territory</span>
                    <span className="text-slate-800 dark:text-slate-200">{parentNodeName}</span>
                  </div>
                  <div className="flex justify-between border-b dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400">Level</span>
                    <span className="text-slate-800 dark:text-slate-200">{selectedNode.level}</span>
                  </div>
                  <div className="flex justify-between border-b dark:border-slate-850 pb-1.5">
                    <span className="text-slate-400">Status</span>
                    <Badge variant="outline" className={selectedNode.isActive
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 font-bold'
                      : 'text-slate-700 bg-slate-50 dark:bg-slate-850 border-slate-200'
                    }>
                      {selectedNode.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <span className="text-slate-400">Description</span>
                    <p className="text-slate-600 dark:text-slate-400 font-normal leading-relaxed">{selectedNode.description || 'No description provided.'}</p>
                  </div>
                </div>

                {/* Tabs */}
                <div className="space-y-4 pt-4 border-t dark:border-slate-800">
                  <div className="flex gap-4 border-b dark:border-slate-800 pb-1">
                    <button
                      onClick={() => setActiveTab('children')}
                      className={`pb-2 border-b-2 font-bold text-xs cursor-pointer transition-all ${activeTab === 'children'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      Children ({directChildren.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className={`pb-2 border-b-2 font-bold text-xs cursor-pointer transition-all ${activeTab === 'users'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      Assigned Users ({assignedUsersForSelectedNode.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className={`pb-2 border-b-2 font-bold text-xs cursor-pointer transition-all ${activeTab === 'stats'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      Statistics
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div>
                    {activeTab === 'children' && (
                      <div className="space-y-2">
                        {directChildren.length > 0 ? (
                          <div className="border dark:border-slate-800 rounded-xl overflow-hidden">
                            <Table>
                              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                <TableRow>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 py-2.5">Territory Name</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 py-2.5">Territory Code</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 py-2.5">Level</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 py-2.5">Type</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 py-2.5">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {directChildren.map(child => (
                                  <TableRow
                                    key={child.id}
                                    onClick={() => setSelectedNodeId(child.id)}
                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 cursor-pointer border-b dark:border-slate-800 text-xs"
                                  >
                                    <TableCell className="py-2.5 font-bold text-blue-600 dark:text-blue-450">{child.name}</TableCell>
                                    <TableCell className="py-2.5 font-mono">{child.code}</TableCell>
                                    <TableCell className="py-2.5">{child.level}</TableCell>
                                    <TableCell className="py-2.5">{child.type}</TableCell>
                                    <TableCell className="py-2.5">
                                      <Badge variant="outline" className="py-0 px-1 text-[9px]">
                                        {child.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="py-12 border border-dashed dark:border-slate-800 rounded-xl text-center text-slate-400 space-y-2">
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-full inline-block">
                              <Folder className="h-6 w-6 text-slate-350" />
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-750 dark:text-slate-300">No child territories</p>
                              <p className="text-[10px] text-slate-400 font-normal">This territory does not have any child territories.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'users' && (
                      <div className="space-y-2">
                        {isLoadingAssignedUsers ? (
                          <div className="flex flex-col items-center gap-2 py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                            <span className="text-[11px] text-slate-450">Loading assigned users...</span>
                          </div>
                        ) : assignedUsersForSelectedNode.length > 0 ? (
                          <div className="border dark:border-slate-800 rounded-xl overflow-hidden">
                            <Table>
                              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                                <TableRow>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 py-2.5">User Name</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 py-2.5">Assignment Type</TableHead>
                                  <TableHead className="text-[10px] uppercase font-bold text-slate-450 py-2.5">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {assignedUsersForSelectedNode.map(asg => (
                                  <TableRow key={asg.id} className="border-b dark:border-slate-800 text-xs">
                                    <TableCell className="py-2.5 font-bold text-slate-800 dark:text-white">{asg.assigned_user_name}</TableCell>
                                    <TableCell className="py-2.5 text-slate-500">{asg.assignment_type}</TableCell>
                                    <TableCell className="py-2.5">
                                      <Badge variant="outline" className={asg.is_active
                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100 py-0 text-[9px]'
                                        : 'text-slate-500 bg-slate-50 border-slate-200 py-0 text-[9px]'
                                      }>
                                        {asg.is_active ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="py-12 border border-dashed dark:border-slate-800 rounded-xl text-center text-slate-400 space-y-2">
                            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-full inline-block">
                              <Info className="h-6 w-6 text-slate-350" />
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-750 dark:text-slate-300">No Assigned Users</p>
                              <p className="text-[10px] text-slate-400 font-normal">There are no sales reps assigned to this territory node.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'stats' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border dark:border-slate-850 rounded-2xl space-y-1">
                          <span className="text-slate-400 uppercase text-[9px] font-bold">Total Leads</span>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">42</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border dark:border-slate-850 rounded-2xl space-y-1">
                          <span className="text-slate-400 uppercase text-[9px] font-bold">Active Opportunities</span>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">18</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/30 border dark:border-slate-850 rounded-2xl space-y-1">
                          <span className="text-slate-400 uppercase text-[9px] font-bold">Deals Pipeline Value</span>
                          <p className="text-xl font-bold text-emerald-650 dark:text-emerald-450">₹32.5 Lakh</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="py-20 text-center text-slate-400">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <span>Select a node in the tree hierarchy to view details.</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom quick actions bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Create Parent Node */}
        {canCreateTerritoryHierarchy && (
          <button
            onClick={() => {
              resetFormFields();
              setTerritoryType('Parent');
              setParentTerritory('None');
              setParentDialogOpen(true);
            }}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-center cursor-pointer transition-colors text-xs font-semibold"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-850 dark:text-white">Create Parent Territory</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">Add a new parent territory</p>
            </div>
          </button>
        )}

        {/* Create Child Node */}
        {canCreateTerritoryHierarchy && (
          <button
            onClick={() => {
              resetFormFields();
              setTerritoryType('Child');
              setParentTerritory(selectedNode && selectedNode.id !== 'Global' ? selectedNode.name : 'None');
              setIsEditing(false);
              setChildDialogOpen(true);
            }}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-center cursor-pointer transition-colors text-xs font-semibold"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Plus className="h-5 w-5 text-blue-505" />
            </div>
            <div>
              <p className="font-bold text-slate-850 dark:text-white">Create Child Territory</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">Add a new child territory</p>
            </div>
          </button>
        )}

        {/* Move Node */}
        {canEditTerritoryHierarchy && (
          <button
            onClick={() => {
              setMoveTargetNode(selectedNode?.name || '');
              setMoveNewParent(parentNodeName === '—' ? 'None' : parentNodeName);
              setMoveDialogOpen(true);
            }}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-center cursor-pointer transition-colors text-xs font-semibold"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Move className="h-5 w-5 text-blue-605" />
            </div>
            <div>
              <p className="font-bold text-slate-850 dark:text-white">Move Territory</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">Move territory to another parent</p>
            </div>
          </button>
        )}

        {/* Merge Nodes */}
        {canEditTerritoryHierarchy && (
          <button
            onClick={() => {
              setMergeNodeA(selectedNode?.name || '');
              setMergeNodeB(siblingNodes[0]?.name || '');
              setMergedName('');
              setMergedOperation('');
              setMergeDialogOpen(true);
            }}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-center cursor-pointer transition-colors text-xs font-semibold"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Merge className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-850 dark:text-white">Merge Territory</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">Merge two sibling territories</p>
            </div>
          </button>
        )}

        {/* Split Node */}
        {canEditTerritoryHierarchy && (
          <button
            onClick={() => {
              setSplitSourceNode(selectedNode?.name || '');
              setSplit1Name('');
              setSplit2Name('');
              setSplitDialogOpen(true);
            }}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-center cursor-pointer transition-colors text-xs font-semibold"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Split className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-850 dark:text-white">Split Territory</p>
              <p className="text-[10px] text-slate-400 font-normal mt-0.5">Split territory into multiple children</p>
            </div>
          </button>
        )}
      </div>

      {/* dialogs */}

      {/* Create Parent Dialog */}
      <Dialog open={parentDialogOpen} onOpenChange={setParentDialogOpen}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader className="border-b dark:border-slate-850 pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-blue-605" />
              Create Parent Territory
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new top-level parent node in the territory hierarchy.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateParent} className="space-y-4 py-2 text-xs font-semibold">
            <div className="max-h-[60vh] overflow-y-auto pr-2 py-1 space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Territory Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input value={nodeName} onChange={(e) => setNodeName(e.target.value)} placeholder="e.g. North India" className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                </div>

                {/* Manager */}
                <div className="space-y-1.5">
                  <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Territory Manager <span className="text-rose-500">*</span>
                  </Label>
                  <SearchableSelect
                    options={managerOptions}
                    value={managerId ? String(managerId) : ''}
                    placeholder="Select Manager"
                    onChange={(val) => {
                      const idNum = Number(val);
                      setManagerId(idNum);
                      const userObj = userList.find((u) => u.id === idNum);
                      setManagerName(userObj ? (userObj.username || userObj.Name || `User ${idNum}`) : '');
                    }}
                    triggerClassName="flex h-9 w-full items-center justify-between border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* Region */}
                <div className="space-y-1.5">
                  <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">Region</Label>
                  <Select value={region} onValueChange={(val) => setRegion(val || 'South India')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 max-h-48 overflow-y-auto">
                      <SelectItem value="South India">South India</SelectItem>
                      <SelectItem value="North India">North India</SelectItem>
                      <SelectItem value="West Coast">West Coast</SelectItem>
                      <SelectItem value="Middle East">Middle East</SelectItem>
                      <SelectItem value="Southeast Asia">Southeast Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Country */}
                <div className="space-y-1.5">
                  <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Country <span className="text-rose-500">*</span>
                  </Label>
                  <SearchableSelect
                    options={countryOptions}
                    value={country}
                    placeholder="Select Country"
                    onChange={(val) => {
                      setCountry(val || 'India');
                      setState('None');
                    }}
                    triggerClassName="flex h-9 w-full items-center justify-between border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* Category Type */}
                <div className="space-y-1.5">
                  <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Territory Type <span className="text-rose-500">*</span>
                  </Label>
                  <Select value={nodeType} onValueChange={(val) => setNodeType(val || 'Geographical')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800">
                      <SelectItem value="Geographical">Geographical</SelectItem>
                      <SelectItem value="Product Segment">Product Segment</SelectItem>
                      <SelectItem value="Industry Segment">Industry Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">State</Label>
                  <SearchableSelect
                    options={stateOptions}
                    value={state}
                    placeholder="Select State"
                    onChange={(val) => setState(val || 'None')}
                    triggerClassName="flex h-9 w-full items-center justify-between border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">Time Zone</Label>
                  <Select value={timezone} onValueChange={(val) => setTimezone(val || '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi')}>
                    <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 max-h-48 overflow-y-auto">
                      <SelectItem value="(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi">(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</SelectItem>
                      <SelectItem value="(UTC-08:00) Pacific Time (US & Canada)">(UTC-08:00) Pacific Time (US & Canada)</SelectItem>
                      <SelectItem value="(UTC+04:00) Gulf Standard Time (Dubai)">(UTC+04:00) Gulf Standard Time (Dubai)</SelectItem>
                      <SelectItem value="(UTC+08:00) Singapore Standard Time">(UTC+08:00) Singapore Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850 md:col-span-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200">Active Status</p>
                    <p className="text-[10px] text-slate-450 font-normal">Controls if assignments and rules are active for this territory.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Switch checked={isActive} onChange={setIsActive} />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">Description</Label>
                  <Input value={nodeDesc} onChange={(e) => setNodeDesc(e.target.value)} placeholder="Node description details..." className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t dark:border-slate-850 pt-3">
              <DialogClose render={<Button variant="outline" className="text-xs" />}>
                Cancel
              </DialogClose>
              <Button type="submit" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                Create Parent
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Child Dialog */}
      <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
        <DialogContent className={isEditing ? "max-w-md p-6" : "max-w-2xl p-6"}>
          <DialogHeader className="border-b dark:border-slate-850 pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit2 className="h-4.5 w-4.5 text-blue-605" />
                  Edit Territory
                </>
              ) : (
                <>
                  <Plus className="h-4.5 w-4.5 text-blue-605" />
                  Create Child Territory
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isEditing ? (
                'Modify territory details.'
              ) : (
                <span>
                  Add a new child territory partition under <strong>{selectedNode?.name}</strong>.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={isEditing ? handleEditTerritory : handleCreateChild} className="space-y-4 py-2 text-xs font-semibold">
            {isEditing ? (
              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400 font-bold">Territory Name</Label>
                  <Input value={nodeName} onChange={(e) => setNodeName(e.target.value)} placeholder="e.g. Chennai North" className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400 font-bold">Territory Code (Read-Only)</Label>
                  <Input value={nodeCode} placeholder="e.g. CHE-WEST" className="h-9 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" disabled />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400 font-bold">Territory Type</Label>
                  <Select value={nodeType} onValueChange={(val) => setNodeType(val || 'Geographical')}>
                    <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border">
                      <SelectItem value="Geographical">Geographical</SelectItem>
                      <SelectItem value="Country">Country</SelectItem>
                      <SelectItem value="Region">Region</SelectItem>
                      <SelectItem value="State">State</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-slate-400 font-bold">Description</Label>
                  <Input value={nodeDesc} onChange={(e) => setNodeDesc(e.target.value)} placeholder="Node description details..." className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none" />
                </div>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2 py-1 space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                      Child Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input value={nodeName} onChange={(e) => setNodeName(e.target.value)} placeholder="e.g. Chennai South" className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none" />
                  </div>

                  {/* Manager */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                      Territory Manager <span className="text-rose-500">*</span>
                    </Label>
                    <SearchableSelect
                      options={managerOptions}
                      value={managerId ? String(managerId) : ''}
                      placeholder="Select Manager"
                      onChange={(val) => {
                        const idNum = Number(val);
                        setManagerId(idNum);
                        const userObj = userList.find((u) => u.id === idNum);
                        setManagerName(userObj ? (userObj.username || userObj.Name || `User ${idNum}`) : '');
                      }}
                      triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                    />
                  </div>

                  {/* Parent Territory */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">Parent Territory</Label>
                    <SearchableSelect
                      options={parentOptions}
                      value={parentTerritory}
                      placeholder="Select Parent Territory"
                      onChange={(val) => setParentTerritory(val || 'None')}
                      triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                    />
                  </div>

                  {/* Region */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">Region</Label>
                    <Select value={region} onValueChange={(val) => setRegion(val || 'South India')}>
                      <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 max-h-48 overflow-y-auto">
                        <SelectItem value="South India">South India</SelectItem>
                        <SelectItem value="North India">North India</SelectItem>
                        <SelectItem value="West Coast">West Coast</SelectItem>
                        <SelectItem value="Middle East">Middle East</SelectItem>
                        <SelectItem value="Southeast Asia">Southeast Asia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Country */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                      Country <span className="text-rose-500">*</span>
                    </Label>
                    <SearchableSelect
                      options={countryOptions}
                      value={country}
                      placeholder="Select Country"
                      onChange={(val) => {
                        setCountry(val || 'India');
                        setState('None');
                      }}
                      triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                    />
                  </div>

                  {/* Category Type */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                      Territory Type <span className="text-rose-500">*</span>
                    </Label>
                    <Select value={nodeType} onValueChange={(val) => setNodeType(val || 'Geographical')}>
                      <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 border dark:border-slate-800">
                        <SelectItem value="Geographical">Geographical</SelectItem>
                        <SelectItem value="Product Segment">Product Segment</SelectItem>
                        <SelectItem value="Industry Segment">Industry Segment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">State</Label>
                    <SearchableSelect
                      options={stateOptions}
                      value={state}
                      placeholder="Select State"
                      onChange={(val) => setState(val || 'None')}
                      triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                    />
                  </div>

                  {/* Timezone */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">Time Zone</Label>
                    <Select value={timezone} onValueChange={(val) => setTimezone(val || '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi')}>
                      <SelectTrigger className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 border dark:border-slate-800 max-h-48 overflow-y-auto">
                        <SelectItem value="(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi">(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</SelectItem>
                        <SelectItem value="(UTC-08:00) Pacific Time (US & Canada)">(UTC-08:00) Pacific Time (US & Canada)</SelectItem>
                        <SelectItem value="(UTC+04:00) Gulf Standard Time (Dubai)">(UTC+04:00) Gulf Standard Time (Dubai)</SelectItem>
                        <SelectItem value="(UTC+08:00) Singapore Standard Time">(UTC+08:00) Singapore Standard Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-855 md:col-span-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-200">Active Status</p>
                      <p className="text-[10px] text-slate-450 font-normal">Controls if assignments and rules are active for this territory.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Switch checked={isActive} onChange={setIsActive} />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">Description</Label>
                    <Input value={nodeDesc} onChange={(e) => setNodeDesc(e.target.value)} placeholder="Node description details..." className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none" />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="border-t dark:border-slate-850 pt-3">
              <DialogClose render={<Button variant="outline" className="text-xs" />}>
                Cancel
              </DialogClose>
              <Button type="submit" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                {isEditing ? 'Save Changes' : 'Create Child'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Node Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="border-b dark:border-slate-850 pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Move className="h-4.5 w-4.5 text-blue-605" />
              Move Territory Node
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Relocate a territory node under a new parent node.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMoveNode} className="space-y-4 py-2 text-xs font-semibold">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Node to Move</Label>
              <Select value={moveTargetNode} onValueChange={(val) => setMoveTargetNode(val || '')}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                  <SelectValue placeholder="Select target node" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                  {hierarchyNodes.map(n => (
                    <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                const targetNode = hierarchyNodes.find(n => n.name === moveTargetNode);
                return targetNode && targetNode.timezone ? (
                  <p className="text-[11px] text-slate-500 mt-1 font-normal">
                    Selected Node Timezone: {targetNode.timezone}
                  </p>
                ) : null;
              })()}
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">New Parent Node</Label>
              <Select value={moveNewParent} onValueChange={(val) => setMoveNewParent(val || 'None')}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                  <SelectValue placeholder="Select new parent" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                  <SelectItem value="None">None (Root level parent)</SelectItem>
                  {hierarchyNodes.filter(n => n.name !== moveTargetNode).map(n => (
                    <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                const parentNode = hierarchyNodes.find(n => n.name === moveNewParent);
                return parentNode && parentNode.timezone ? (
                  <p className="text-[11px] text-slate-500 mt-1 font-normal">
                    Selected Parent Timezone: {parentNode.timezone}
                  </p>
                ) : null;
              })()}
            </div>

            <DialogFooter className="border-t dark:border-slate-850 pt-3">
              <DialogClose render={<Button variant="outline" className="text-xs" />}>
                Cancel
              </DialogClose>
              <Button type="submit" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                Move Territory
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Merge Sibling Nodes Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="border-b dark:border-slate-850 pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Merge className="h-4.5 w-4.5 text-blue-605" />
              Merge Territories
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Combine two sibling territories under the same parent node.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleMergeNodes} className="space-y-4 py-2 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400 font-bold">Territory A</Label>
                <Select value={mergeNodeA} onValueChange={(val) => setMergeNodeA(val || '')}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                    <SelectValue placeholder="Node A" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                    {hierarchyNodes.map(n => (
                      <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(() => {
                  const nodeA = hierarchyNodes.find(n => n.name === mergeNodeA);
                  return nodeA && nodeA.timezone ? (
                    <p className="text-[10px] text-slate-500 mt-1 font-normal">
                      Timezone: {nodeA.timezone}
                    </p>
                  ) : null;
                })()}
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase text-slate-400 font-bold">Territory B</Label>
                <Select value={mergeNodeB} onValueChange={(val) => setMergeNodeB(val || '')}>
                  <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                    <SelectValue placeholder="Node B" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                    {hierarchyNodes.filter(n => n.name !== mergeNodeA).map(n => (
                      <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(() => {
                  const nodeB = hierarchyNodes.find(n => n.name === mergeNodeB);
                  return nodeB && nodeB.timezone ? (
                    <p className="text-[10px] text-slate-500 mt-1 font-normal">
                      Timezone: {nodeB.timezone}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Merged Name <span className="text-rose-500">*</span></Label>
              <Input value={mergedName} onChange={(e) => setMergedName(e.target.value)} placeholder="e.g. Combined Chennai" className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none" />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Territory Operation <span className="text-rose-500">*</span></Label>
              <Input value={mergedOperation} onChange={(e) => setMergedOperation(e.target.value)} placeholder="e.g. Combined South Operations" className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none" />
            </div>

            <DialogFooter className="border-t dark:border-slate-850 pt-3">
              <DialogClose render={<Button variant="outline" className="text-xs" />}>
                Cancel
              </DialogClose>
              <Button type="submit" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                Merge Territories
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Split Node Dialog */}
      <Dialog open={splitDialogOpen} onOpenChange={setSplitDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader className="border-b dark:border-slate-850 pb-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Split className="h-4.5 w-4.5 text-blue-605" />
              Split Territory Node
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Divide a territory node into two child partition nodes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSplitNode} className="space-y-4 py-2 text-xs font-semibold">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400 font-bold">Source Node to Split</Label>
              <Select value={splitSourceNode} onValueChange={(val) => setSplitSourceNode(val || '')}>
                <SelectTrigger className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none">
                  <SelectValue placeholder="Select node" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                  {hierarchyNodes.map(n => (
                    <SelectItem key={n.id} value={n.name}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(() => {
                const sourceNode = hierarchyNodes.find(n => n.name === splitSourceNode);
                return sourceNode && sourceNode.timezone ? (
                  <p className="text-[11px] text-slate-500 mt-1 font-normal">
                    Selected Node Timezone: {sourceNode.timezone}
                  </p>
                ) : null;
              })()}
            </div>

            <div className="border-t dark:border-slate-800 pt-2 space-y-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Partition 1 Name <span className="text-rose-500">*</span></p>
              <Input value={split1Name} onChange={(e) => setSplit1Name(e.target.value)} placeholder="e.g. Chennai East" className="h-8 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none" />
            </div>

            <div className="border-t dark:border-slate-800 pt-2 space-y-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Partition 2 Name <span className="text-rose-500">*</span></p>
              <Input value={split2Name} onChange={(e) => setSplit2Name(e.target.value)} placeholder="e.g. Chennai Central" className="h-8 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none" />
            </div>

            <DialogFooter className="border-t dark:border-slate-850 pt-3">
              <DialogClose render={<Button variant="outline" className="text-xs" />}>
                Cancel
              </DialogClose>
              <Button type="submit" className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700">
                Split Territory
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteHierarchyNode(deleteTarget.id);
            setSelectedNodeId('Global');
            toast.success(`Territory "${deleteTarget.name}" deleted.`);
          } catch (err: any) {
            toast.error(err.message || 'Failed to delete territory.');
          } finally {
            setDeleteTarget(null);
          }
        }}
        title="Delete Territory Node?"
        description={`This will permanently delete "${deleteTarget?.name}" and all its data. This action cannot be undone.`}
        itemType="territory node"
      />
    </div>
  );
}
