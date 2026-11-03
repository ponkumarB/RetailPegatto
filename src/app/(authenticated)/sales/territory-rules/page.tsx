'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTerritoryStore, TerritoryRule } from '@/store/useTerritoryStore';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Plus,
  Copy,
  Edit2,
  Trash2,
  AlertTriangle,
  SlidersHorizontal,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

// Custom Toggle Switch Component
function Switch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-hidden ${
        checked ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

import { usePermission } from '@/hooks/usePermission';

export default function TerritoryRulesPage() {
  const router = useRouter();
  const {
    canCreateTerritoryRules,
    canEditTerritoryRules,
    canDeleteTerritoryRules,
    canViewTerritoryRulesOverview,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewTerritoryRulesOverview) {
      toast.error('You do not have permission to view Territory Rules.');
      router.push('/');
    }
  }, [canViewTerritoryRulesOverview, isLoaded, router]);

  const { rules, rulesCount, updateRule, deleteRule, cloneRule, loadRules, loadTerritories, isLoading } = useTerritoryStore();

  // Search & Filter states
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [territoryFilter, setTerritoryFilter] = useState('All');
  const [dateRange, setDateRange] = useState('');

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const isServerSide = !searchName && statusFilter === 'All' && territoryFilter === 'All';
  const serverPageSize = 10;

  useEffect(() => {
    loadTerritories();
  }, [loadTerritories]);

  useEffect(() => {
    if (isServerSide) {
      loadRules(undefined, currentPage);
    } else {
      loadRules();
    }
  }, [loadRules, currentPage, isServerSide]);

  // Filtered Rules
  const filteredRules = useMemo(() => {
    if (isServerSide) return rules;
    return rules.filter(rule => {
      const matchesName = (rule.name || '').toLowerCase().includes(searchName.toLowerCase());
      
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && rule.isActive) ||
        (statusFilter === 'Inactive' && !rule.isActive);

      const matchesTerritory =
        territoryFilter === 'All' ||
        (rule.territory || '').toLowerCase() === territoryFilter.toLowerCase();

      return matchesName && matchesStatus && matchesTerritory;
    });
  }, [rules, searchName, statusFilter, territoryFilter, isServerSide]);

  // Pagination
  const paginatedRules = useMemo(() => {
    if (isServerSide) return rules;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRules.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRules, currentPage, isServerSide]);

  const displayTotal = isServerSide ? rulesCount : filteredRules.length;
  const totalPages = isServerSide ? (Math.ceil(rulesCount / serverPageSize) || 1) : (Math.ceil(filteredRules.length / itemsPerPage) || 1);

  // List of unique territories in rules for filter dropdown
  const ruleTerritories = useMemo(() => {
    const list = rules.map(r => r.territory).filter(Boolean);
    return ['All', ...Array.from(new Set(list))];
  }, [rules]);

  // Clone action
  const handleCloneRule = async (id: string, name: string) => {
    try {
      await cloneRule(id);
      toast.success(`Rule "${name}" cloned successfully.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to clone rule.');
    }
  };

  // Delete action — called after user confirms in dialog
  const handleDeleteRule = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule(deleteTarget.id);
      toast.success(`Rule "${deleteTarget.name}" deleted.`);
      if (paginatedRules.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete rule.');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Toggle rule state
  const handleToggleStatus = async (id: string, current: boolean, name: string) => {
    try {
      await updateRule(id, { isActive: !current });
      toast.success(`Rule "${name}" is now ${!current ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleClearFilters = () => {
    setSearchName('');
    setStatusFilter('All');
    setTerritoryFilter('All');
    setDateRange('');
    setCurrentPage(1);
    toast.info('Filters cleared.');
  };

  if (isLoaded && !canViewTerritoryRulesOverview) {
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
            <span className="text-slate-505 font-medium">Territory Rules</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Territory Rules</h1>
          <p className="text-xs text-slate-455 mt-1">Manage and configure rules for automatic territory allocation.</p>
        </div>

        {canCreateTerritoryRules && (
          <div>
            <Link
              href="/sales/territory-rules/create"
              className="inline-flex items-center justify-center h-9 px-4 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Create Rule
            </Link>
          </div>
        )}
      </div>

      {/* Filters Toolbar */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs text-xs font-semibold">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Rule */}
          <div className="flex-1 space-y-1">
            <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Search by rule name</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450" />
              <Input
                placeholder="Search rule..."
                value={searchName}
                onChange={(e) => {
                  setSearchName(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Status */}
          <div className="w-full md:w-40 space-y-1">
            <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Status</Label>
            <Select value={statusFilter} onValueChange={(val) => {
              setStatusFilter(val || 'All');
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 border">
                <SelectItem value="All">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Target Territory */}
          <div className="w-full md:w-52 space-y-1">
            <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Territory</Label>
            <Select value={territoryFilter} onValueChange={(val) => {
              setTerritoryFilter(val || 'All');
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 border max-h-48 overflow-y-auto">
                {ruleTerritories.map(t => (
                  <SelectItem key={t} value={t}>{t === 'All' ? 'All territories' : t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="w-full md:w-52 space-y-1">
            <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Date Range</Label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-450" />
              <Input
                placeholder="Select Date Range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="pl-8 h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-end gap-2 pt-5">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              className="h-8.5 text-xs gap-1 border-slate-205 bg-white dark:bg-slate-900 text-slate-700 shrink-0"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 text-xs gap-1 border-slate-205 bg-white dark:bg-slate-900 text-slate-705 shrink-0"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules Registry Table */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden text-xs font-semibold">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
              <TableRow className="border-b dark:border-slate-800">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5 w-12 text-center">#</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Rule Name</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Conditions</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Territory</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5 text-center w-20">Priority</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5 text-center w-24">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Valid From</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5">Valid To</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-505 py-3.5 text-right w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-16 text-center text-slate-505 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <span className="text-sm">Loading allocation rules from server...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedRules.map((rule, idx) => (
                <TableRow key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b dark:border-slate-800 transition-colors duration-150">
                  {/* Serial Number */}
                  <TableCell className="py-3 text-center text-slate-400 font-bold">
                    {(currentPage - 1) * (isServerSide ? serverPageSize : itemsPerPage) + idx + 1}
                  </TableCell>

                  {/* Rule Name & Desc */}
                  <TableCell className="py-3">
                    <p className="font-bold text-slate-850 dark:text-white">{rule.name}</p>
                    <p className="text-[10px] text-slate-405 font-normal mt-0.5">{rule.description}</p>
                  </TableCell>

                  {/* Conditions Badges */}
                  <TableCell className="py-3">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {rule.conditions.map((cond, cIdx) => (
                        <Badge
                          key={cIdx}
                          variant="outline"
                          className="bg-slate-50/80 dark:bg-slate-950 text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-850 py-0.5 px-2 text-[10px] rounded-md font-medium"
                        >
                          {cond.field === 'Default'
                            ? `${cond.value} Rule`
                            : `${cond.field} ${cond.operator} ${cond.value}`
                          }
                        </Badge>
                      ))}
                    </div>
                  </TableCell>

                  {/* Assigned Territory */}
                  <TableCell className="py-3 font-semibold text-slate-800 dark:text-slate-205">
                    {rule.territory}
                  </TableCell>

                  {/* Priority Circle Badge */}
                  <TableCell className="py-3 text-center">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-955 text-blue-600 dark:text-blue-450 ring-1 ring-blue-100 dark:ring-blue-900/40">
                      {rule.priority}
                    </span>
                  </TableCell>

                  {/* Status Toggle Switch */}
                  <TableCell className="py-3 text-center">
                    <div className="inline-flex items-center justify-center">
                      <Switch
                        checked={rule.isActive}
                        onChange={canEditTerritoryRules ? () => handleToggleStatus(rule.id, rule.isActive, rule.name) : () => toast.error('You do not have permission to edit rules.')}
                      />
                    </div>
                  </TableCell>

                  {/* Valid Dates */}
                  <TableCell className="py-3 text-slate-500 font-medium text-xs">
                    {rule.validFrom}
                  </TableCell>
                  <TableCell className="py-3 text-slate-500 font-medium text-xs">
                    {rule.validTo === 'No Expiry' ? (
                      <span className="text-slate-400 font-normal">No Expiry</span>
                    ) : rule.validTo}
                  </TableCell>

                  {/* Actions column */}
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit */}
                      {canEditTerritoryRules && (
                        <button
                          onClick={() => router.push(`/sales/territory-rules/create?edit=${rule.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Rule"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Clone */}
                      {canCreateTerritoryRules && (
                        <button
                          onClick={() => handleCloneRule(rule.id, rule.name)}
                          className="p-1.5 text-slate-400 hover:text-blue-550 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Clone Rule"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Delete */}
                      {canDeleteTerritoryRules && (
                        <button
                          onClick={() => setDeleteTarget({ id: rule.id, name: rule.name })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {!isLoading && filteredRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="px-6 py-16 text-center text-slate-505 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle className="h-8 w-8 text-slate-400" />
                      <span className="text-sm">No rules match your filters. Click "Create Rule" to add a new allocation rule.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t dark:border-slate-800 text-xs font-medium text-slate-505">
          <span>Showing {displayTotal > 0 ? (currentPage - 1) * (isServerSide ? serverPageSize : itemsPerPage) + 1 : 0} to {Math.min(currentPage * (isServerSide ? serverPageSize : itemsPerPage), displayTotal)} of {displayTotal} entries</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg border-slate-205"
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
                className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all ${
                  currentPage === i + 1
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
              className="h-8 w-8 rounded-lg border-slate-205"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </Button>
          </div>
        </div>
      </div>
      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteRule}
        title="Delete Territory Rule?"
        description={`This will permanently delete the rule "${deleteTarget?.name}". This action cannot be undone.`}
        itemType="rule"
      />
    </div>
  );
}
