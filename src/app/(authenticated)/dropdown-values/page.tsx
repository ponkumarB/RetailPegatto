'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sliders,
  Settings,
  Plus,
  Search,
  ChevronRight,
  Star,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Info,
  Lock,
  AlertTriangle,
  GripVertical,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';
import {
  fetchUserLookupListWithPagination,
  createUserLookup,
  updateUserLookup,
  deleteUserLookup
} from '@/service/api/Resource/api';
import { DropdownValue } from '@/store/useDropdownValuesStore';
import { ReusableTable } from '@/components/ui/ReusableTable';

const getCurrentUserId = (): number => {
  if (typeof window === 'undefined') return 1;
  const token = localStorage.getItem('token');
  if (!token) return 1;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.user_id || 1;
    }
  } catch (e) {
    console.error('Error decoding token:', e);
  }
  return 1;
};

const getValuesArrayForLookup = (lookup: any): DropdownValue[] => {
  if (!lookup) return [];
  const item = lookup;
  let valuesArray: DropdownValue[] = [];
  if (item.Values && typeof item.Values === 'object' && !Array.isArray(item.Values)) {
    valuesArray = Object.entries(item.Values).map(([key, val]) => ({
      id: key,
      value: String(val),
      isDefault: key === item.Defaultvalue || String(val) === item.Defaultvalue,
      isActive: true
    }));
  } else if (Array.isArray(item.Values)) {
    valuesArray = item.Values.map((v: any, index: number) => {
      if (typeof v === 'object' && v !== null) {
        return {
          id: String(v.id || index),
          value: String(v.value || v.name || ''),
          isDefault: String(v.value) === item.Defaultvalue || v.isDefault === true,
          isActive: true
        };
      }
      return {
        id: String(index),
        value: String(v),
        isDefault: String(v) === item.Defaultvalue,
        isActive: true
      };
    });
  }
  return valuesArray;
};

const updateLookupValues = (lookup: any, newValuesArray: DropdownValue[]): any => {
  const isOriginalArray = Array.isArray(lookup?.Values);
  
  if (isOriginalArray) {
    return newValuesArray.map((v, idx) => {
      const originalObj = lookup.Values.find((orig: any) => String(orig.id) === v.id);
      if (originalObj) {
        return { ...originalObj, value: v.value };
      }
      const numericId = Number(v.id) || (idx + 1);
      return { id: numericId, value: v.value };
    });
  } else {
    const dict: Record<string, string> = {};
    newValuesArray.forEach(v => {
      dict[v.value] = v.value;
    });
    return dict;
  }
};

export default function DropdownValuesPage() {
  const { primaryColor } = useStore();
  
  const [originalLookups, setOriginalLookups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLookupId, setActiveLookupId] = useState<string | null>(null);
  const [searchCategory, setSearchCategory] = useState('');

  // Modals state
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [newDropdownName, setNewDropdownName] = useState('');
  const [newDropdownIsSystem, setNewDropdownIsSystem] = useState(false);
  const [newDropdownInitialValues, setNewDropdownInitialValues] = useState('Option 1\nOption 2');

  const [activeAddValueGroupId, setActiveAddValueGroupId] = useState<string | null>(null);
  const [newValueInput, setNewValueInput] = useState('');

  const [activeEditValue, setActiveEditValue] = useState<{
    groupId: string;
    valueId: string;
    valueText: string;
    isActive: boolean;
  } | null>(null);

  const [deleteGroupConfirmId, setDeleteGroupConfirmId] = useState<{ categoryId: string; groupId: string; name: string } | null>(null);
  const [deleteValueConfirmId, setDeleteValueConfirmId] = useState<{ groupId: string; valueId: string; text: string } | null>(null);

  const loadLookups = async () => {
    try {
      const data = await fetchUserLookupListWithPagination(1, 100);
      const results = data?.results || [];
      setOriginalLookups(results);

      if (results.length > 0) {
        const exists = results.some((r: any) => String(r.id) === activeLookupId);
        if (!exists) {
          setActiveLookupId(String(results[0].id));
        }
      } else {
        setActiveLookupId(null);
      }
    } catch (error) {
      console.error('Error fetching lookups:', error);
      toast.error('Failed to load dropdown values.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  // Filter lookups based on search input
  const filteredLookups = useMemo(() => {
    return originalLookups.filter((lookup) =>
      lookup.Lookupname.toLowerCase().includes(searchCategory.toLowerCase())
    );
  }, [originalLookups, searchCategory]);

  const activeLookup = useMemo(() => {
    if (activeLookupId) {
      return originalLookups.find((l) => String(l.id) === activeLookupId);
    }
    return originalLookups[0];
  }, [originalLookups, activeLookupId]);

  const activeValues = useMemo(() => {
    return getValuesArrayForLookup(activeLookup);
  }, [activeLookup]);

  // Reorder values: move up/down
  const handleMoveValue = async (groupId: string, index: number, direction: 'up' | 'down') => {
    const lookup = originalLookups.find(l => String(l.id) === groupId);
    if (!lookup) return;

    const values = getValuesArrayForLookup(lookup);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= values.length) return;

    // Swap elements
    const temp = values[index];
    values[index] = values[targetIndex];
    values[targetIndex] = temp;

    const updatedValues = updateLookupValues(lookup, values);
    const userId = getCurrentUserId();

    try {
      await updateUserLookup({
        id: lookup.id,
        Lookupname: lookup.Lookupname,
        Values: updatedValues,
        Defaultvalue: lookup.Defaultvalue || '',
        Purpose: lookup.Purpose || `to maintain ${lookup.Lookupname.toLowerCase()}`,
        Is_Deleted: lookup.Is_Deleted ?? false,
        Created_By: lookup.Created_By || userId,
        Updated_By: userId
      });
      toast.success('Option reordered successfully.');
      await loadLookups();
    } catch (err) {
      console.error('Error reordering values:', err);
      toast.error('Failed to save reordered options.');
    }
  };

  // Add new Dropdown list handler
  const handleAddDropdownList = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDropdownName.trim()) {
      toast.error('Please enter a dropdown name.');
      return;
    }

    const valuesArray = newDropdownInitialValues
      .split('\n')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    if (valuesArray.length === 0) {
      toast.error('Please enter at least one initial option value.');
      return;
    }

    const valuesDict: Record<string, string> = {};
    valuesArray.forEach(val => {
      valuesDict[val] = val;
    });

    const defaultVal = valuesArray[0];
    const userId = getCurrentUserId();

    try {
      const newLookup = await createUserLookup({
        Lookupname: newDropdownName.trim(),
        Values: valuesDict,
        Defaultvalue: defaultVal,
        Purpose: `to maintain ${newDropdownName.trim().toLowerCase()}`,
        Is_Deleted: false,
        Created_By: userId,
        Updated_By: userId
      });
      
      toast.success(`Dropdown list "${newDropdownName}" created successfully!`);

      // Reset state
      setNewDropdownName('');
      setNewDropdownInitialValues('Option 1\nOption 2');
      setIsAddDropdownOpen(false);
      
      await loadLookups();
      
      if (newLookup && newLookup.id) {
        setActiveLookupId(String(newLookup.id));
      }
    } catch (err) {
      console.error('Error creating lookup:', err);
      toast.error('Failed to create dropdown list.');
    }
  };

  // Delete dropdown group handler
  const handleDeleteGroup = async () => {
    if (deleteGroupConfirmId) {
      try {
        await deleteUserLookup(deleteGroupConfirmId.groupId);
        toast.success(`Dropdown list "${deleteGroupConfirmId.name}" deleted successfully.`);
        setDeleteGroupConfirmId(null);
        await loadLookups();
      } catch (err) {
        console.error('Error deleting lookup group:', err);
        toast.error('Failed to delete dropdown list.');
      }
    }
  };

  // Add value to active group handler
  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newValueInput.trim() || !activeAddValueGroupId) {
      toast.error('Please enter a value.');
      return;
    }

    const lookup = originalLookups.find(l => String(l.id) === activeAddValueGroupId);
    if (!lookup) {
      toast.error('Lookup group not found.');
      return;
    }

    const newValue = newValueInput.trim();
    const key = newValue;
    
    const currentValues = getValuesArrayForLookup(lookup);
    const updatedValuesArray = [...currentValues, { id: key, value: newValue, isDefault: false, isActive: true }];
    
    const updatedValues = updateLookupValues(lookup, updatedValuesArray);
    const defaultVal = lookup.Defaultvalue || key;
    const userId = getCurrentUserId();

    try {
      await updateUserLookup({
        id: lookup.id,
        Lookupname: lookup.Lookupname,
        Values: updatedValues,
        Defaultvalue: defaultVal,
        Purpose: lookup.Purpose || `to maintain ${lookup.Lookupname.toLowerCase()}`,
        Is_Deleted: lookup.Is_Deleted ?? false,
        Created_By: lookup.Created_By || userId,
        Updated_By: userId
      });
      
      toast.success(`Option "${newValue}" added.`);
      setNewValueInput('');
      setActiveAddValueGroupId(null);
      
      await loadLookups();
    } catch (err) {
      console.error('Error adding lookup value:', err);
      toast.error('Failed to add dropdown value.');
    }
  };

  // Edit value handler
  const handleEditValueSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditValue) return;

    if (!activeEditValue.valueText.trim()) {
      toast.error('Option text cannot be empty.');
      return;
    }

    const lookup = originalLookups.find(l => String(l.id) === activeEditValue.groupId);
    if (!lookup) {
      toast.error('Lookup group not found.');
      return;
    }

    const currentValues = getValuesArrayForLookup(lookup);
    const updatedValuesArray = currentValues.map(v => {
      if (v.id === activeEditValue.valueId) {
        return { ...v, value: activeEditValue.valueText.trim() };
      }
      return v;
    });

    const updatedValues = updateLookupValues(lookup, updatedValuesArray);
    const userId = getCurrentUserId();

    try {
      await updateUserLookup({
        id: lookup.id,
        Lookupname: lookup.Lookupname,
        Values: updatedValues,
        Defaultvalue: lookup.Defaultvalue === activeEditValue.valueId ? activeEditValue.valueText.trim() : (lookup.Defaultvalue || ''),
        Purpose: lookup.Purpose || `to maintain ${lookup.Lookupname.toLowerCase()}`,
        Is_Deleted: lookup.Is_Deleted ?? false,
        Created_By: lookup.Created_By || userId,
        Updated_By: userId
      });
      
      toast.success('Option updated successfully.');
      setActiveEditValue(null);
      
      await loadLookups();
    } catch (err) {
      console.error('Error updating lookup value:', err);
      toast.error('Failed to update dropdown value.');
    }
  };

  // Delete value handler
  const handleDeleteValueConfirm = async () => {
    if (deleteValueConfirmId) {
      const lookup = originalLookups.find(l => String(l.id) === deleteValueConfirmId.groupId);
      if (!lookup) return;

      const currentValues = getValuesArrayForLookup(lookup);
      const updatedValuesArray = currentValues.filter(v => v.id !== deleteValueConfirmId.valueId);

      const updatedValues = updateLookupValues(lookup, updatedValuesArray);

      let defaultVal = lookup.Defaultvalue;
      if (defaultVal === deleteValueConfirmId.valueId) {
        defaultVal = updatedValuesArray.length > 0 ? updatedValuesArray[0].id : '';
      }
      const userId = getCurrentUserId();

      try {
        await updateUserLookup({
          id: lookup.id,
          Lookupname: lookup.Lookupname,
          Values: updatedValues,
          Defaultvalue: defaultVal,
          Purpose: lookup.Purpose || `to maintain ${lookup.Lookupname.toLowerCase()}`,
          Is_Deleted: lookup.Is_Deleted ?? false,
          Created_By: lookup.Created_By || userId,
          Updated_By: userId
        });
        
        toast.success(`Option "${deleteValueConfirmId.text}" deleted.`);
        setDeleteValueConfirmId(null);
        
        await loadLookups();
      } catch (err) {
        console.error('Error deleting value:', err);
        toast.error('Failed to delete option value.');
      }
    }
  };

  // Status Badge Toggle Handler
  const handleToggleStatus = async (groupId: string, valueItem: any) => {
    const lookup = originalLookups.find(l => String(l.id) === groupId);
    if (!lookup) return;

    if (valueItem.isActive) {
      const currentValues = getValuesArrayForLookup(lookup);
      const updatedValuesArray = currentValues.filter(v => v.id !== valueItem.id);

      const updatedValues = updateLookupValues(lookup, updatedValuesArray);

      let defaultVal = lookup.Defaultvalue;
      if (defaultVal === valueItem.id) {
        defaultVal = updatedValuesArray.length > 0 ? updatedValuesArray[0].id : '';
      }
      const userId = getCurrentUserId();

      try {
        await updateUserLookup({
          id: lookup.id,
          Lookupname: lookup.Lookupname,
          Values: updatedValues,
          Defaultvalue: defaultVal,
          Purpose: lookup.Purpose || `to maintain ${lookup.Lookupname.toLowerCase()}`,
          Is_Deleted: lookup.Is_Deleted ?? false,
          Created_By: lookup.Created_By || userId,
          Updated_By: userId
        });
        toast.info(`Option "${valueItem.value}" has been deactivated and removed.`);
        await loadLookups();
      } catch (err) {
        console.error('Error toggling status:', err);
        toast.error('Failed to deactivate option.');
      }
    }
  };

  const setDefaultValue = async (categoryId: string, groupId: string, valueId: string) => {
    const lookup = originalLookups.find(l => String(l.id) === groupId);
    if (!lookup) return;

    const userId = getCurrentUserId();

    try {
      await updateUserLookup({
        id: lookup.id,
        Lookupname: lookup.Lookupname,
        Values: lookup.Values,
        Defaultvalue: valueId,
        Purpose: lookup.Purpose || `to maintain ${lookup.Lookupname.toLowerCase()}`,
        Is_Deleted: lookup.Is_Deleted ?? false,
        Created_By: lookup.Created_By || userId,
        Updated_By: userId
      });
      const values = getValuesArrayForLookup(lookup);
      const targetValObj = values.find(v => v.id === valueId);
      toast.success(`Default option set to "${targetValObj ? targetValObj.value : valueId}".`);
      await loadLookups();
    } catch (err) {
      console.error('Error setting default value:', err);
      toast.error('Failed to set default value.');
    }
  };

  // ReusableTable configuration
  const tableColumns = useMemo(() => [
    {
      key: 'value',
      header: 'Value',
      className: 'font-bold text-slate-900 dark:text-white pl-4',
      render: (row: any) => (
        <span>{row.value}</span>
      )
    },
    {
      key: 'default',
      header: 'Default',
      align: 'center' as const,
      className: 'w-24 text-center justify-center',
      render: (row: any) => (
        <button
          type="button"
          onClick={() => setDefaultValue('general', String(activeLookup.id), row.id)}
          className="p-1.5 rounded-[5px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-300 hover:text-slate-500"
          style={row.isDefault ? { color: primaryColor } : {}}
        >
          <Star className={`h-4.5 w-4.5 ${row.isDefault ? 'fill-current' : ''}`} style={row.isDefault ? { color: primaryColor } : {}} />
        </button>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center' as const,
      className: 'w-28 text-center justify-center',
      render: (row: any) => (
        <button
          type="button"
          onClick={() => handleToggleStatus(String(activeLookup.id), row)}
          className="text-[9.5px] font-extrabold uppercase px-2.5 py-0.5 rounded-[5px] border transition-all cursor-pointer bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-500/20"
        >
          Active
        </button>
      )
    }
  ], [activeLookup, primaryColor]);

  const tableData = useMemo(() => {
    return activeValues.map((val) => ({
      id: val.id,
      value: val.value,
      isDefault: val.isDefault,
      isActive: val.isActive
    }));
  }, [activeValues]);

  const tableActions = (row: any) => {
    const idx = activeValues.findIndex(v => v.id === row.id);
    return (
      <div className="flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-[5px] cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-36 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-lg rounded-[5px] p-1">
            <DropdownMenuItem
              disabled={idx === 0}
              onClick={() => handleMoveValue(String(activeLookup.id), idx, 'up')}
              className="flex items-center gap-2 cursor-pointer text-xs font-semibold py-1.5 focus:bg-slate-50 dark:focus:bg-slate-800 rounded-[5px] pl-2"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Move Up</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={idx === activeValues.length - 1}
              onClick={() => handleMoveValue(String(activeLookup.id), idx, 'down')}
              className="flex items-center gap-2 cursor-pointer text-xs font-semibold py-1.5 focus:bg-slate-50 dark:focus:bg-slate-800 rounded-[5px] pl-2"
            >
              <ArrowDown className="h-3.5 w-3.5" />
              <span>Move Down</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setActiveEditValue({
                  groupId: String(activeLookup.id),
                  valueId: row.id,
                  valueText: row.value,
                  isActive: true
                })
              }
              className="flex items-center gap-2 cursor-pointer text-xs font-semibold py-1.5 focus:bg-slate-50 dark:focus:bg-slate-800 rounded-[5px] pl-2"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Option</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                setDeleteValueConfirmId({
                  groupId: String(activeLookup.id),
                  valueId: row.id,
                  text: row.value
                })
              }
              className="flex items-center gap-2 cursor-pointer text-xs font-semibold py-1.5 text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-955/20 rounded-[5px] pl-2"
            >
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span>Delete Option</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" style={{ color: primaryColor }} />
        <p className="text-sm font-semibold text-slate-500">Loading dropdown values from server...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left pb-10 dropdown-values-page-container"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .dropdown-values-page-container,
        .dropdown-values-page-container *,
        div[role="dialog"],
        div[role="dialog"] *,
        button,
        input,
        textarea,
        span.badge,
        .DialogContent,
        .DialogContent * {
          border-radius: 5px !important;
        }
      `}} />

      {/* Breadcrumbs */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/customer-segmentation">Settings</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dropdown Values Settings</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Split-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column Sidebar: Lookups List (4 Columns) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-3xs overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b dark:border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search dropdowns..."
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="pl-9 text-xs font-semibold h-9 border-slate-200 dark:border-slate-800 focus-visible:ring-offset-0 rounded-[5px]"
                />
              </div>
            </div>

            {/* Menu List of Lookups */}
            <div className="p-2 space-y-1 max-h-[550px] overflow-y-auto">
              {filteredLookups.length > 0 ? (
                filteredLookups.map((lookup) => {
                  const isActive = activeLookupId === String(lookup.id);
                  const isSystem = lookup.Lookupid?.startsWith('SYS_') || false;
                  const IconComponent = isSystem ? Settings : Sliders;
                  const valuesCount = getValuesArrayForLookup(lookup).length;
                  
                  return (
                    <button
                      key={lookup.id}
                      onClick={() => setActiveLookupId(String(lookup.id))}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[5px] text-xs font-bold transition-all text-left relative group ${
                        isActive
                          ? 'text-blue-655 bg-blue-50/35 border-l-4 border-blue-600 dark:bg-blue-955/20 dark:text-blue-400'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                      }`}
                      style={isActive ? { color: primaryColor, borderLeftColor: primaryColor } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent className={`h-4.5 w-4.5 ${isActive ? 'text-blue-600' : 'text-slate-455 group-hover:text-slate-655'}`} style={isActive ? { color: primaryColor } : {}} />
                        <span className="truncate max-w-[130px]">{lookup.Lookupname}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 font-bold shrink-0 rounded-[5px]">
                          {valuesCount}
                        </Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  No lookups found.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Selected Lookup Editor (9 Columns) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header Panel */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-[5px] border dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-6.5 w-6.5 text-blue-600" style={{ color: primaryColor }} />
                Dropdown Values Settings
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage and customize dropdown values used across CRMFarm IT.
              </p>
            </div>

            <Button
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                setIsAddDropdownOpen(true);
              }}
              className="text-white text-xs font-bold gap-2 px-4 rounded-[5px] h-9 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add New Dropdown
            </Button>
          </div>

          {/* Selected Lookup Details Card */}
          {activeLookup ? (
            <Card className="border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-[5px] overflow-hidden transition-all duration-300 shadow-3xs">
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b dark:border-slate-800 bg-slate-50/20 dark:bg-slate-955/20">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-slate-855 dark:text-white leading-tight">
                    {activeLookup.Lookupname}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-[5px] ${
                      activeLookup.Lookupid?.startsWith('SYS_')
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-150 dark:bg-emerald-955/20 dark:text-emerald-455 dark:border-emerald-900'
                        : 'bg-blue-50 text-blue-600 border-blue-150 dark:bg-blue-955/20 dark:text-blue-400 dark:border-blue-900'
                    }`}
                  >
                    {activeLookup.Lookupid?.startsWith('SYS_') ? 'System' : 'Custom'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                  <span>{activeValues.length} Values</span>
                  {!activeLookup.Lookupid?.startsWith('SYS_') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-[5px] shrink-0 cursor-pointer"
                      onClick={() => {
                        setDeleteGroupConfirmId({
                          categoryId: 'general',
                          groupId: String(activeLookup.id),
                          name: activeLookup.Lookupname
                        });
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Content Panel */}
              <div className="p-4 space-y-4">
                {/* Inner Info and Add option */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 dark:bg-slate-955/20 p-3 rounded-[5px] border dark:border-slate-855">
                  <span className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Manage option values for <strong className="text-slate-800 dark:text-slate-200">{activeLookup.Lookupname}</strong>.
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveAddValueGroupId(String(activeLookup.id))}
                    className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-955/20 text-xs font-bold gap-1.5 rounded-[5px] shrink-0 cursor-pointer"
                    style={{ color: primaryColor, borderColor: `${primaryColor}60` }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Value
                  </Button>
                </div>

                {/* Reusable Options Table */}
                <div className="overflow-hidden border dark:border-slate-800 rounded-[5px]">
                  <ReusableTable
                    columns={tableColumns}
                    data={tableData}
                    actions={tableActions}
                    initialPageSize={50}
                    title="Options"
                    showGear={false}
                    className="border-none"
                  />
                </div>

                {/* drag notice info */}
                <div className="flex items-center gap-2 text-[10.5px] font-semibold text-slate-400 pl-1">
                  <Info className="h-3.5 w-3.5 text-blue-500" style={{ color: primaryColor }} />
                  <span>Drag or reorder values using up/down arrows. Click the star icon to set the default value. Toggle status badges to activate/deactivate.</span>
                </div>
              </div>
            </Card>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs text-slate-400 text-sm font-semibold">
              Select a dropdown list from the left menu to manage its values.
            </div>
          )}

          {/* Locked Footer Notice */}
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-[5px] border dark:border-slate-855">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            <span>Only admins can add, edit or delete dropdown values. All operations are local-simulation only.</span>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* DIALOG MODALS SECTION                                          */}
      {/* ============================================================== */}

      {/* Modal 1: Add New Dropdown Group */}
      <Dialog open={isAddDropdownOpen} onOpenChange={setIsAddDropdownOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-955 rounded-[5px] border dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Add New Dropdown list
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Create a custom dropdown category to hold user selection values.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddDropdownList} className="space-y-4 py-2 text-left">
            {/* Dropdown Group Name */}
            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-500 uppercase tracking-wider block">Dropdown List Name *</label>
              <Input
                placeholder="e.g. Lead Industry Sector"
                value={newDropdownName}
                onChange={(e) => setNewDropdownName(e.target.value)}
                required
                className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-[5px]"
              />
            </div>

            {/* Custom/System toggle */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-655 dark:text-slate-355 pt-1">
              <input
                id="is-system-checkbox"
                type="checkbox"
                checked={newDropdownIsSystem}
                onChange={(e) => setNewDropdownIsSystem(e.target.checked)}
                className="h-4 w-4 rounded-[5px] border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="is-system-checkbox" className="cursor-pointer">Mark as System Dropdown (Only modified by code)</label>
            </div>

            {/* Initial values list */}
            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-500 uppercase tracking-wider block">Initial Options (One per line) *</label>
              <Textarea
                placeholder="Option A&#10;Option B&#10;Option C"
                value={newDropdownInitialValues}
                onChange={(e) => setNewDropdownInitialValues(e.target.value)}
                required
                className="min-h-[100px] border-slate-200 dark:border-slate-800 text-xs leading-relaxed rounded-[5px]"
              />
            </div>

            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDropdownOpen(false)}
                className="text-xs font-semibold h-9 rounded-[5px] border-slate-200 dark:border-slate-855"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="text-white text-xs font-bold rounded-[5px] h-9 px-4"
              >
                Save Dropdown List
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Add Option Value to active Group */}
      <Dialog open={activeAddValueGroupId !== null} onOpenChange={(open) => !open && setActiveAddValueGroupId(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-955 rounded-[5px] border dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Add Dropdown Value
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Insert a new dropdown selection value.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddValue} className="space-y-4 py-2 text-left">
            <div className="space-y-1.5 text-xs font-bold">
              <label className="text-slate-500 uppercase tracking-wider block">Option Value Text *</label>
              <Input
                placeholder="e.g. In Contact"
                value={newValueInput}
                onChange={(e) => setNewValueInput(e.target.value)}
                required
                className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-[5px]"
              />
            </div>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveAddValueGroupId(null)}
                className="text-xs font-semibold h-9 rounded-[5px] border-slate-200 dark:border-slate-855"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="text-white text-xs font-bold rounded-[5px] h-9 px-4"
              >
                Add Option
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Edit Option Value */}
      <Dialog open={activeEditValue !== null} onOpenChange={(open) => !open && setActiveEditValue(null)}>
        <DialogContent className="max-w-sm bg-white dark:bg-slate-955 rounded-[5px] border dark:border-slate-850">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white">
              Edit Dropdown Value
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-400">
              Modify the option label or active status.
            </DialogDescription>
          </DialogHeader>
          {activeEditValue && (
            <form onSubmit={handleEditValueSave} className="space-y-4 py-2 text-left">
              {/* Option Value Text */}
              <div className="space-y-1.5 text-xs font-bold">
                <label className="text-slate-500 uppercase tracking-wider block">Option Value Text *</label>
                <Input
                  value={activeEditValue.valueText}
                  onChange={(e) => setActiveEditValue({ ...activeEditValue, valueText: e.target.value })}
                  required
                  className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-[5px]"
                />
              </div>

              {/* Status active switch */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-655 dark:text-slate-355 pt-1">
                <input
                  id="edit-active-checkbox"
                  type="checkbox"
                  checked={activeEditValue.isActive}
                  onChange={(e) => setActiveEditValue({ ...activeEditValue, isActive: e.target.checked })}
                  className="h-4 w-4 rounded-[5px] border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="edit-active-checkbox" className="cursor-pointer">Mark Option as Active</label>
              </div>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveEditValue(null)}
                  className="text-xs font-semibold h-9 rounded-[5px] border-slate-200 dark:border-slate-855"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="text-white text-xs font-bold rounded-[5px] h-9 px-4"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 4: Delete Dropdown list confirmation */}
      <Dialog open={deleteGroupConfirmId !== null} onOpenChange={(open) => !open && setDeleteGroupConfirmId(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-955 rounded-[5px] border dark:border-slate-850 p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Confirm Dropdown List Deletion
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-400 pt-1 leading-relaxed">
              Are you sure you want to delete the dropdown list "{deleteGroupConfirmId?.name}"? All custom option values inside it will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteGroupConfirmId(null)}
              className="text-xs font-semibold rounded-[5px] h-9 border-slate-200 dark:border-slate-855"
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-[5px] h-9 text-xs px-4"
              onClick={handleDeleteGroup}
            >
              Delete List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Delete Option Value confirmation */}
      <Dialog open={deleteValueConfirmId !== null} onOpenChange={(open) => !open && setDeleteValueConfirmId(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-955 rounded-[5px] border dark:border-slate-850 p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Confirm Option Deletion
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-400 pt-1 leading-relaxed">
              Are you sure you want to delete the option value "{deleteValueConfirmId?.text}"? This dropdown option will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteValueConfirmId(null)}
              className="text-xs font-semibold rounded-[5px] h-9 border-slate-200 dark:border-slate-855"
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-[5px] h-9 text-xs px-4"
              onClick={handleDeleteValueConfirm}
            >
              Delete Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
