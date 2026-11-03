'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTerritoryStore, TerritoryRule, TerritoryRuleCondition } from '@/store/useTerritoryStore';
import { fetchTerritoryFullList } from '@/service/api/Territory/api';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  ChevronDown,
  Info,
  Sliders,
  Settings,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

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

function RuleCreatorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const { rules, territories, addRule, updateRule, loadRules, loadTerritories } = useTerritoryStore();

  // Full territory list (without pagination) for the dropdown
  const [fullTerritoryList, setFullTerritoryList] = useState<any[]>([]);
  const isEditMode = !!editId;
  const { canCreateTerritoryRules, canEditTerritoryRules, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded) {
      if (isEditMode && !canEditTerritoryRules) {
        toast.error('You do not have permission to edit Territory Rules.');
        router.push('/sales/territory-rules');
      } else if (!isEditMode && !canCreateTerritoryRules) {
        toast.error('You do not have permission to create Territory Rules.');
        router.push('/sales/territory-rules');
      }
    }
  }, [isLoaded, isEditMode, canCreateTerritoryRules, canEditTerritoryRules, router]);

  // Basic Info States
  const [ruleName, setRuleName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  // Group Logic State (AND / OR)
  const [groupLogic, setGroupLogic] = useState<'AND' | 'OR'>('AND');

  // Conditions State
  const [conditions, setConditions] = useState<TerritoryRuleCondition[]>([
    { field: 'State', operator: '=', value: 'Tamil Nadu' }
  ]);

  // Output (THEN) State
  const [targetTerritory, setTargetTerritory] = useState('');     // territory name (value of select)

  const targetTerritoryId = useMemo(() => {
    // Try store territories first
    const t = territories.find(t => t.name === targetTerritory);
    if (t && t.id !== undefined) return String(t.id);
    // Fallback to fullTerritoryList
    const found = fullTerritoryList.find(t => t.TerritoryName === targetTerritory);
    return found ? String(found.id) : '';
  }, [targetTerritory, territories, fullTerritoryList]);

  // Load data on mount — run once only
  useEffect(() => {
    loadRules();
    loadTerritories();
    fetchTerritoryFullList()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.results || []);
        setFullTerritoryList(list);
      })
      .catch((err) => console.error('Failed to load territories:', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prepopulate if editing
  useEffect(() => {
    if (isEditMode && editId && rules.length > 0) {
      const existing = rules.find(r => r.id === editId);
      if (existing) {
        setRuleName(existing.name);
        setDescription(existing.description || '');
        setPriority(existing.priority);
        setIsActive(existing.isActive);
        setValidFrom(existing.validFrom || '');
        setValidTo(existing.validTo === 'No Expiry' ? '' : existing.validTo || '');
        setConditions(existing.conditions.length > 0 ? existing.conditions : [{ field: 'State', operator: '=', value: 'Tamil Nadu' }]);
        // existing.territory = name (from mapper), existing.territoryId = numeric ID
        setTargetTerritory(existing.territory || '');
      } else {
        toast.error(`Rule with ID ${editId} not found.`);
        router.push('/sales/territory-rules');
      }
    }
  }, [isEditMode, editId, rules, router]);

  // Handle condition field changes
  const updateCondition = (index: number, key: keyof TerritoryRuleCondition, val: string) => {
    const next = [...conditions];
    next[index] = { ...next[index], [key]: val };
    setConditions(next);
  };

  // Add condition row
  const addConditionRow = () => {
    setConditions([...conditions, { field: 'Industry', operator: '=', value: 'Manufacturing' }]);
  };

  // Remove condition row
  const removeConditionRow = (index: number) => {
    if (conditions.length === 1) {
      toast.info('At least one condition row is required.');
      return;
    }
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // Territory dropdown options — value = TerritoryName, label = TerritoryName
  const territoryOptions = useMemo(() => {
    return fullTerritoryList.map((t) => ({
      value: t.TerritoryName || `Territory ${t.id}`,
      label: t.TerritoryName || `Territory ${t.id}`,
    }));
  }, [fullTerritoryList]);

  // Generate live Rule Preview pseudo-code
  const previewCodeText = useMemo(() => {
    const conditionText = conditions
      .map((c, idx) => {
        const prefix = idx === 0 ? '' : `\n  ${groupLogic} `;
        return `${prefix}${c.field} ${c.operator} ${c.value || '""'}`;
      })
      .join('');

    return `IF\n  ${conditionText || '(No conditions defined)'}\n\nTHEN\n  Territory = ${targetTerritory || '—'}`;
  }, [conditions, groupLogic, targetTerritory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      toast.error('Rule Name is required.');
      return;
    }
    if (!validFrom) {
      toast.error('Valid From date is required.');
      return;
    }

    const payload: TerritoryRule = {
      id: isEditMode ? editId! : '',
      name: ruleName.trim(),
      description: description.trim(),
      conditions,
      territory: targetTerritory,       // display name
      territoryId: targetTerritoryId,  // numeric ID — mapper uses this directly as Territory
      priority: Number(priority),
      isActive,
      validFrom,
      validTo: validTo.trim() || 'No Expiry'
    };

    try {
      if (isEditMode) {
        await updateRule(editId!, payload);
        toast.success('Territory rule updated successfully.');
      } else {
        await addRule(payload);
        toast.success('Territory rule created successfully.');
      }
      router.push('/sales/territory-rules');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save territory rule.');
    }
  };

  if (isLoaded && ((isEditMode && !canEditTerritoryRules) || (!isEditMode && !canCreateTerritoryRules))) {
    return null;
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20 text-left">
      {/* Breadcrumbs and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-450 font-semibold mb-0.5">
            <span>Territory Management</span>
            <span>&gt;</span>
            <Link href="/sales/territory-rules" className="hover:text-blue-600 transition-colors">Territory Rules</Link>
            <span>&gt;</span>
            <span className="text-slate-505 font-medium">{isEditMode ? 'Edit Territory Rule' : 'Create Territory Rule'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="p-2 bg-blue-50 dark:bg-blue-955/30 rounded-xl">
              <Settings className="h-6 w-6 text-blue-650" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isEditMode ? 'Edit Territory Rule' : 'Create Territory Rule'}
              </h1>
              <p className="text-xs text-slate-450 mt-0.5">Define conditions and allocate leads to the appropriate territory automatically.</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push('/sales/territory-rules')}
            className="h-9 rounded-[5px] text-xs font-semibold border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="h-9 px-5 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm"
          >
            Save Rule
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Basic Information */}
          <Card className="border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-xs font-semibold">
            <CardContent className="p-6 space-y-5">
              <div className="border-b dark:border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="h-4 w-1 bg-blue-600 rounded-full" />
                  Basic Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Rule Name */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="ruleName" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Rule Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="ruleName"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    placeholder="Enter rule name"
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="description" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description (optional)"
                    className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Priority <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="priority"
                    type="number"
                    min={1}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    placeholder="e.g. 1"
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                  />
                  <span className="text-[9px] text-slate-400 font-normal">Lower number = Higher priority</span>
                </div>

                {/* Status Switch */}
                <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Rule Active Status</p>
                    <p className="text-[10px] text-slate-450 font-normal">Active rules will process incoming lead assignments.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Switch checked={isActive} onChange={setIsActive} />
                  </div>
                </div>

                {/* Valid From */}
                <div className="space-y-1.5">
                  <Label htmlFor="validFrom" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Valid From <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                  />
                </div>

                {/* Valid To */}
                <div className="space-y-1.5">
                  <Label htmlFor="validTo" className="text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                    Valid To
                  </Label>
                  <Input
                    id="validTo"
                    type="date"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Conditions (IF) */}
          <Card className="border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-xs font-semibold">
            <CardContent className="p-6 space-y-5">
              <div className="border-b dark:border-slate-800 pb-2 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="h-4 w-1 bg-blue-600 rounded-full" />
                  Conditions (IF)
                </h2>

                {/* Logic Toggle AND/OR */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border dark:border-slate-850">
                  <button
                    type="button"
                    onClick={() => setGroupLogic('AND')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${groupLogic === 'AND'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                        : 'text-slate-450 hover:text-slate-700'
                      }`}
                  >
                    AND
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupLogic('OR')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${groupLogic === 'OR'
                        ? 'bg-white dark:bg-slate-900 text-blue-605 shadow-xs'
                        : 'text-slate-455 hover:text-slate-700'
                      }`}
                  >
                    OR
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {conditions.map((cond, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-end sm:items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-950/20 border dark:border-slate-850 rounded-xl relative group">
                    {/* Index label / AND/OR connector */}
                    <div className="text-[10px] text-slate-400 font-bold uppercase w-12 shrink-0">
                      {idx === 0 ? 'IF' : groupLogic}
                    </div>

                    {/* Field select */}
                    <div className="flex-1 w-full space-y-1">
                      <Select value={cond.field} onValueChange={(val) => updateCondition(idx, 'field', val || 'State')}>
                        <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                          <SelectValue placeholder="Field" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 border">
                          <SelectItem value="State">State</SelectItem>
                          <SelectItem value="Industry">Industry</SelectItem>
                          <SelectItem value="Revenue">Revenue</SelectItem>
                          <SelectItem value="Product Interest">Product Interest</SelectItem>
                          <SelectItem value="Rating">Rating</SelectItem>
                          <SelectItem value="Default">Default (Fallback)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator select */}
                    <div className="w-24 shrink-0 space-y-1">
                      <Select value={cond.operator} onValueChange={(val) => updateCondition(idx, 'operator', val || '=')}>
                        <SelectTrigger className="h-8.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 border">
                          <SelectItem value="=">=</SelectItem>
                          <SelectItem value="!=">!=</SelectItem>
                          <SelectItem value=">">&gt;</SelectItem>
                          <SelectItem value="<">&lt;</SelectItem>
                          <SelectItem value="contains">contains</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Value Input */}
                    <div className="flex-1 w-full space-y-1">
                      {cond.field === 'Default' ? (
                        <Input disabled value="Fallback" className="h-8.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                      ) : (
                        <Input
                          placeholder="Enter value"
                          value={cond.value}
                          onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                          className="h-8.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-600 shadow-none"
                        />
                      )}
                    </div>

                    {/* Delete button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeConditionRow(idx)}
                      disabled={conditions.length === 1}
                      className="h-8.5 w-8.5 shrink-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  onClick={addConditionRow}
                  variant="outline"
                  size="sm"
                  className="h-8.5 text-xs font-bold gap-1 border-slate-205 bg-white dark:bg-slate-900 text-slate-700 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Condition
                </Button>
                <Button
                  type="button"
                  onClick={() => toast.info('Condition Groups are configured globally.')}
                  variant="outline"
                  size="sm"
                  className="h-8.5 text-xs font-bold gap-1 border-slate-205 bg-white dark:bg-slate-900 text-slate-700 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Condition Group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side forms: Output & Preview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 3: Output (THEN) */}
          <Card className="border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-xs font-semibold shadow-xs">
            <CardContent className="p-5 space-y-4">
              <div className="border-b dark:border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="h-4 w-1 bg-blue-650 rounded-full" />
                  Output (THEN)
                </h2>
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-450 uppercase text-[9px] font-bold">Assign Territory <span className="text-rose-500">*</span></Label>
                {fullTerritoryList.length === 0 ? (
                  <div className="h-9 flex items-center px-3 text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950">
                    Loading territories...
                  </div>
                ) : (
                  <>
                    <SearchableSelect
                      id="targetTerritory"
                      options={territoryOptions}
                      value={targetTerritory}
                      placeholder="Search & select territory"
                      onChange={(val) => {
                        setTargetTerritory(val || '');
                      }}
                      triggerClassName="flex h-9 w-full items-center justify-between border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs outline-none text-left rounded-lg text-slate-900 dark:text-white focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                    />
                    {targetTerritory && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Selected Timezone: {
                          fullTerritoryList.find(t => t.TerritoryName === targetTerritory)?.TimeZone || 'N/A'
                        }
                      </p>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Rule Preview */}
          <Card className="border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 text-xs font-semibold shadow-xs">
            <CardContent className="p-5 space-y-4">
              <div className="border-b dark:border-slate-800 pb-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="h-4 w-1 bg-slate-800 dark:bg-slate-100 rounded-full" />
                  Rule Preview
                </h2>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-xl">
                <pre className="font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {previewCodeText}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default function CreateTerritoryRulePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500">
        <span>Loading Form...</span>
      </div>
    }>
      <RuleCreatorForm />
    </Suspense>
  );
}
