'use client';

import React, { useState, useMemo } from 'react';
import { useLoyaltyStore, LoyaltyRule } from '@/store/useLoyaltyStore';
import {
  Award,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Gift,
  Calendar,
  Clock,
  Edit2,
  SquarePen,
  Trash2,
  Layers,
  Stars,
  TrendingUp,
  AlertTriangle,
  X,
  GripVertical,
  ArrowUpDown,
  Settings,
  MoreHorizontal,
  Eye,
  RefreshCw,
  FileText,
  CheckSquare,
  Mail,
  PhoneCall,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoyaltyRuleModal } from '@/components/loyalty/LoyaltyRuleModal';
import { toast } from 'sonner';

export default function LoyaltyRulesPage() {
  const { rules, addRule, updateRule, deleteRule, loadRules, isLoading } = useLoyaltyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  React.useEffect(() => {
    loadRules({ search: searchTerm, LoyaltyRule_Type: typeFilter, Status: statusFilter });
  }, [loadRules, searchTerm, typeFilter, statusFilter]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedRule, setSelectedRule] = useState<LoyaltyRule | null>(null);

  // Delete dialog state
  const [ruleToDelete, setRuleToDelete] = useState<LoyaltyRule | null>(null);

  // Filtered rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.ruleCode && r.ruleCode.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q));

      const matchType =
        typeFilter === 'ALL' ||
        r.type.toLowerCase() === typeFilter.toLowerCase();

      const matchStatus =
        statusFilter === 'ALL' ||
        r.status.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchType && matchStatus;
    });
  }, [rules, searchTerm, typeFilter, statusFilter]);

  const handleOpenCreate = () => {
    setSelectedRule(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: LoyaltyRule) => {
    setSelectedRule(rule);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: Partial<LoyaltyRule>) => {
    if (modalMode === 'edit' && selectedRule) {
      updateRule(selectedRule.id, data);
      toast.success('Loyalty rule updated successfully');
    } else {
      const nextCode = `LR-00${rules.length + 1}`;
      addRule({
        ruleCode: nextCode,
        name: data.name || 'New Rule',
        type: data.type || 'Standard',
        pointsPerAmount: data.pointsPerAmount || 0,
        earningMultiplier: data.earningMultiplier || 0,
        minPurchase: data.minPurchase || 0,
        maxPoints: data.maxPoints,
        maxPointsPerDay: data.maxPointsPerDay,
        priority: data.priority || 0,
        applicableTo: data.applicableTo || 'All Customers',
        applicableTiers: data.applicableTiers || [],
        applicableCategories: data.applicableCategories || [],
        validFrom: data.validFrom || '2026-01-01',
        validTo: data.validTo || '2026-12-31',
        expiryDays: data.expiryDays || 0,
        reminderDays: data.reminderDays || 0,
        status: data.status || 'Draft',
        description: data.description || '',
        termsConditions: data.termsConditions || ''
      });
      toast.success('Loyalty rule created successfully');
    }
  };

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      deleteRule(ruleToDelete.id);
      toast.success('Loyalty rule deleted successfully');
      setRuleToDelete(null);
    }
  };

  const getTypeIcon = (typeStr: string) => {
    const t = (typeStr || '').toUpperCase();
    if (t.includes('BONUS')) return <TrendingUp className="w-3.5 h-3.5 text-amber-500" />;
    if (t.includes('PROMOTIONAL')) return <Sparkles className="w-3.5 h-3.5 text-purple-500" />;
    if (t.includes('BIRTHDAY')) return <Gift className="w-3.5 h-3.5 text-pink-500" />;
    return <Stars className="w-3.5 h-3.5 text-blue-500" />;
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return 'Always';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 lg:p-6 pb-20">
      <div className="max-w-[1400px] w-full mx-auto space-y-4">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Loyalty Rules Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure and manage point earning rules for your loyalty program
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Count - {filteredRules.length}
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
            {/* Rule Type Filter */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Rule Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] focus:border-[#2A7D5B]"
              >
                <option value="ALL">Select rule type (All)</option>
                <option value="Standard">Standard</option>
                <option value="Promotional">Promotional</option>
                <option value="Bonus">Bonus</option>
                <option value="Tier Based">Tier Based</option>
                <option value="Birthday">Birthday</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] focus:border-[#2A7D5B]"
              >
                <option value="ALL">Select status (All)</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Search */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by rule name or description..."
                  className="w-full h-9 pl-9 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2A7D5B] focus:border-[#2A7D5B]"
                />
              </div>
            </div>

            {/* Create Button */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create New Rule
              </button>
            </div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr className="border-0">
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap min-w-[220px]">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>RULE NAME</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap w-32">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>TYPE</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap w-24">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>POINTS</span>
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap w-24 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>MULTIPLIER</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap w-32 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>MIN PURCHASE</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap w-24 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>PRIORITY</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap w-28 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>STATUS</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap w-40">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      <GripVertical className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>VALIDITY</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider select-none whitespace-nowrap w-16 text-center">
                    <div className="flex items-center justify-center">
                      <Settings className="h-4 w-4 text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredRules.map((rule) => {
                  const statusUpper = (rule.status || '').toUpperCase();
                  const isDraft = statusUpper === 'DRAFT';
                  const isActive = statusUpper === 'ACTIVE';

                  return (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors text-xs"
                    >
                      {/* Rule Name & Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                          {getTypeIcon(rule.type)}
                          <span>{rule.name}</span>
                        </div>
                        {rule.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {rule.description}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {rule.type}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-3.5 px-4 font-bold text-[#10B981]">
                        {rule.pointsPerAmount} pts
                      </td>

                      {/* Multiplier */}
                      <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">
                        {rule.earningMultiplier}x
                      </td>

                      {/* Min Purchase */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                        {rule.minPurchase ? `₹${Number(rule.minPurchase).toFixed(2)}` : '—'}
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {rule.priority ?? 0}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                              : isDraft
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                          }`}
                        >
                          {rule.status}
                        </span>
                      </td>

                      {/* Validity */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-600 dark:text-slate-400">
                        <div>{formatDateDisplay(rule.validFrom)}</div>
                        <div className="text-slate-400">→ {formatDateDisplay(rule.validTo)}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <button
                              type="button"
                              className="h-8 w-8 mx-auto flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              title="Rule Actions"
                            >
                              <MoreHorizontal className="h-4.5 w-4.5" />
                            </button>
                          } />
                          <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-1 z-50 text-left">
                            <DropdownMenuLabel className="text-slate-400 font-bold text-[10px] uppercase tracking-wider px-2 py-1.5">
                              RULE ACTIONS
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => handleOpenEdit(rule)}
                            >
                              <Eye className="h-4 w-4 text-slate-500" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                              onClick={() => handleOpenEdit(rule)}
                            >
                              <SquarePen className="h-4 w-4 text-slate-500" /> Edit Rule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-1" />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                              onClick={() => setRuleToDelete(rule)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Delete Rule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}

                {filteredRules.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                      No loyalty rules found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800 gap-2">
          <div>
            Copyright <span className="text-sky-500 font-medium">CRMFARM</span> © 2025 - 2026
          </div>
          <div>
            Developed by <span className="text-sky-500 font-medium">@ Foyer Technology</span>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      <LoyaltyRuleModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialRule={selectedRule}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* Delete Confirmation Dialog */}
      {ruleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Delete Loyalty Rule
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete this rule?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs">
              <span className="font-semibold text-slate-900 dark:text-white block">
                {ruleToDelete.name}
              </span>
              <span className="text-slate-500 text-[11px]">
                Type: {ruleToDelete.type} &bull; Multiplier: {ruleToDelete.earningMultiplier}x
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRuleToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
