'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  Info,
  Calendar,
  Layers,
  BarChart,
  Lightbulb,
  Globe,
  Mail,
  Link,
  Download,
  Clock,
  RotateCcw,
  ShieldCheck,
  Zap,
  Gauge,
  Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';

// Import ReusableTable and ColumnConfig
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Import lead score API methods
import {
  createLeadScoring,
  fetchLeadScoringById,
  updateLeadScoring,
  deleteLeadScoring,
  NewITLeadScoringListwithoutpagination,
  LeadScoringPayload,
  LeadScoringRule,
  LeadScoringGrade
} from '@/service/api/LeadScore/api';

interface ScoringRule {
  id: number;
  criteria: string;
  condition: string;
  value: number;
  unit: string;
  points: number; // positive or negative
}

const defaultRules: ScoringRule[] = [
  { id: 1, criteria: 'Visited Pricing Page', condition: 'at least', value: 1, unit: 'time', points: 15 },
  { id: 2, criteria: 'Email Opened', condition: 'at least', value: 5, unit: 'times', points: 10 },
  { id: 3, criteria: 'Email Link Clicked', condition: 'at least', value: 2, unit: 'times', points: 20 },
  { id: 4, criteria: 'Downloaded Resource', condition: 'at least', value: 1, unit: 'time', points: 15 },
  { id: 5, criteria: 'Inactivity', condition: 'is more than', value: 7, unit: 'days', points: -10 },
];

export default function LeadScoringSetupPage() {
  const { primaryColor } = useStore();
  const router = useRouter();

  // Mode state: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [scoringSetups, setScoringSetups] = useState<LeadScoringPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSetupId, setSelectedSetupId] = useState<number | null>(null);

  // General Settings States (for Form)
  const [scoringName, setScoringName] = useState('Website Engagement Score');
  const [description, setDescription] = useState('Score leads based on website activity, demographic fit and engagement level.');
  const [applyTo, setApplyTo] = useState('Leads');
  const [scoreType, setScoreType] = useState<'Total Points' | 'Grade'>('Total Points');
  const [minScore, setMinScore] = useState(0);
  const [maxScore, setMaxScore] = useState(100);
  const [showInDetails, setShowInDetails] = useState(true);
  const [showToPortal, setShowToPortal] = useState(false);

  // Grade Config state
  const [grades, setGrades] = useState<LeadScoringGrade[]>([
    { grade: 'Hot', min: 80, max: 100 },
    { grade: 'Warm', min: 50, max: 79 },
    { grade: 'Cold', min: 0, max: 49 }
  ]);

  // Scoring Rules State
  const [rules, setRules] = useState<ScoringRule[]>(defaultRules);

  // Dialog State for Rule CRUD
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ScoringRule | null>(null);

  // Rule Form States
  const [ruleCriteria, setRuleCriteria] = useState('');
  const [ruleCondition, setRuleCondition] = useState('at least');
  const [ruleValue, setRuleValue] = useState(1);
  const [ruleUnit, setRuleUnit] = useState('time');
  const [rulePoints, setRulePoints] = useState(10);

  // Load setups on mount
  useEffect(() => {
    loadScoringSetups();
  }, []);

  const loadScoringSetups = async () => {
    setLoading(true);
    try {
      const data = await NewITLeadScoringListwithoutpagination();
      if (Array.isArray(data)) {
        setScoringSetups(data);
      } else if (data && Array.isArray(data.results)) {
        setScoringSetups(data.results);
      } else {
        setScoringSetups([]);
      }
    } catch (error) {
      console.error("Failed to load lead scoring setups", error);
      toast.error("Failed to load lead scoring configurations.");
    } finally {
      setLoading(false);
    }
  };

  // Mappers
  const mapApiRuleToUi = (rule: any): ScoringRule => {
    const val = rule.values;
    let value = 1;
    let unit = 'time';
    if (val && typeof val === 'object') {
      value = Number(val.value ?? 1);
      unit = String(val.unit ?? 'time');
    } else if (val) {
      value = Number(val);
    }
    return {
      id: rule.id ?? Math.floor(Math.random() * 100000),
      criteria: rule.criteria ?? '',
      condition: rule.condition ?? 'at least',
      value,
      unit,
      points: Number(rule.points ?? 0)
    };
  };

  // Prepopulate form states
  const handleLoadEditSetup = async (id: number) => {
    setLoading(true);
    try {
      const data = await fetchLeadScoringById(id);
      const setup = Array.isArray(data) ? data[0] : data;
      if (setup) {
        setSelectedSetupId(setup.id ?? null);
        setScoringName(setup.ScoreName ?? '');
        setDescription(setup.ScoreSummary ?? '');
        setApplyTo(setup.ApplyTo ?? 'Leads');
        setScoreType(setup.ScoreType ?? 'Total Points');
        setMinScore(setup.MinScore ?? 0);
        setMaxScore(setup.MaxScore ?? 100);
        setShowInDetails(setup.ShowScoreLeadDetails ?? true);
        setShowToPortal(setup.ShowScorePortalUsers ?? false);
        
        const loadedRules = (setup.Rules || []).map((r: any) => mapApiRuleToUi(r));
        setRules(loadedRules);

        const loadedGrades = setup.GradeConfiguration && setup.GradeConfiguration.length > 0
          ? setup.GradeConfiguration
          : [
              { grade: 'Hot', min: 80, max: 100 },
              { grade: 'Warm', min: 50, max: 79 },
              { grade: 'Cold', min: 0, max: 49 }
            ];
        setGrades(loadedGrades);
        
        setViewMode('edit');
      }
    } catch (error) {
      console.error("Failed to load lead scoring setup detail", error);
      toast.error("Failed to retrieve configuration details.");
    } finally {
      setLoading(false);
    }
  };

  // Delete configuration
  const handleDeleteSetup = async (id: number) => {
    if (confirm("Are you sure you want to delete this lead scoring configuration?")) {
      setLoading(true);
      try {
        await deleteLeadScoring(id);
        toast.success("Lead scoring configuration deleted successfully.");
        loadScoringSetups();
      } catch (error) {
        console.error("Failed to delete lead scoring configuration", error);
        toast.error("Failed to delete lead scoring configuration.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Save all (create or update)
  const handleSaveAll = async (isDraftOption: boolean = false) => {
    if (!scoringName.trim()) {
      toast.error("Please enter a Scoring Name.");
      return;
    }

    setLoading(true);
    try {
      const apiRules: LeadScoringRule[] = rules.map(r => ({
        id: typeof r.id === 'number' && r.id < 100000 ? r.id : undefined,
        criteria: r.criteria,
        condition: r.condition,
        values: { value: r.value, unit: r.unit },
        points: String(r.points)
      }));

      const payload: LeadScoringPayload = {
        ScoreName: scoringName,
        ScoreSummary: description,
        ApplyTo: applyTo,
        ScoreType: scoreType,
        MinScore: minScore,
        MaxScore: maxScore,
        ShowScoreLeadDetails: showInDetails,
        ShowScorePortalUsers: showToPortal,
        Rules: apiRules,
        GradeConfiguration: grades,
        IsDraft: isDraftOption,
        IsActive: !isDraftOption,
      };

      if (viewMode === 'edit' && selectedSetupId !== null) {
        await updateLeadScoring(selectedSetupId, payload);
        toast.success("Lead scoring configuration updated successfully.");
      } else {
        await createLeadScoring(payload);
        toast.success("Lead scoring configuration created successfully.");
      }

      setViewMode('list');
      loadScoringSetups();
    } catch (error) {
      console.error("Failed to save lead scoring setup", error);
      toast.error("Failed to save lead scoring configuration.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered configs for list view
  const filteredSetups = useMemo(() => {
    return scoringSetups.filter(s => 
      (s.ScoreName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [scoringSetups, searchQuery]);

  // Table Columns configuration
  const tableColumns = useMemo<ColumnConfig<LeadScoringPayload>[]>(() => [
    {
      key: 'id',
      header: 'Setup ID',
      sortable: true,
      render: (row) => (
        <span className="text-blue-650 dark:text-blue-450 font-bold pl-2">
          LSC-{row.id}
        </span>
      )
    },
    {
      key: 'ScoreName',
      header: 'Scoring Name',
      sortable: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => row.id && handleLoadEditSetup(row.id)}
          className="hover:underline text-slate-900 dark:text-white font-bold text-left cursor-pointer"
        >
          {row.ScoreName}
        </button>
      )
    },
    {
      key: 'ApplyTo',
      header: 'Applies To',
      sortable: true,
    },
    {
      key: 'ScoreType',
      header: 'Score Type',
      sortable: true,
    },
    {
      key: 'Range',
      header: 'Range (Min - Max)',
      sortable: false,
      render: (row) => (
        <span className="font-mono text-slate-550 dark:text-slate-400">
          {row.MinScore} - {row.MaxScore}
        </span>
      )
    },
    {
      key: 'IsActive',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant="outline" className={
          row.IsActive 
            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 font-bold'
            : 'text-slate-705 bg-slate-50 dark:bg-slate-850 dark:text-slate-400 border-slate-200'
        }>
          {row.IsActive ? 'Active' : 'Draft'}
        </Badge>
      )
    }
  ], []);

  const renderActions = (row: LeadScoringPayload) => (
    <div className="flex items-center justify-end gap-2 text-slate-450 mr-2">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => row.id && handleLoadEditSetup(row.id)}
        className="p-1 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md cursor-pointer h-7"
      >
        <Edit3 className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => row.id && handleDeleteSetup(row.id)}
        className="p-1 hover:text-rose-605 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-md cursor-pointer h-7 text-rose-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  // Score Summaries Calculations (Recalculates in real-time)
  const positivePointsSum = rules
    .filter(r => r.points > 0)
    .reduce((sum, r) => sum + r.points, 0);

  const negativePointsSum = rules
    .filter(r => r.points < 0)
    .reduce((sum, r) => sum + r.points, 0);

  // Rule actions
  const handleDeleteRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success("Scoring rule deleted.");
  };

  const handleOpenAddModal = () => {
    setEditingRule(null);
    setRuleCriteria('');
    setRuleCondition('at least');
    setRuleValue(1);
    setRuleUnit('time');
    setRulePoints(10);
    setIsRuleModalOpen(true);
  };

  const handleOpenEditModal = (rule: ScoringRule) => {
    setEditingRule(rule);
    setRuleCriteria(rule.criteria);
    setRuleCondition(rule.condition);
    setRuleValue(rule.value);
    setRuleUnit(rule.unit);
    setRulePoints(rule.points);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleCriteria.trim()) {
      toast.error("Please enter a criteria name.");
      return;
    }

    if (editingRule) {
      // Edit mode
      setRules(prev => prev.map(r => r.id === editingRule.id ? {
        ...r,
        criteria: ruleCriteria,
        condition: ruleCondition,
        value: Number(ruleValue),
        unit: ruleUnit,
        points: Number(rulePoints)
      } : r));
      toast.success("Scoring rule updated.");
    } else {
      // Add mode
      const newId = rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1;
      setRules(prev => [...prev, {
        id: newId,
        criteria: ruleCriteria,
        condition: ruleCondition,
        value: Number(ruleValue),
        unit: ruleUnit,
        points: Number(rulePoints)
      }]);
      toast.success("Scoring rule added.");
    }
    setIsRuleModalOpen(false);
  };

  const handleResetToDefault = () => {
    setRules(defaultRules);
    toast.success("Rules reset to system defaults.");
  };

  // Rule criteria icon mapper
  const getCriteriaIcon = (criteria: string) => {
    const text = criteria.toLowerCase();
    if (text.includes('pricing') || text.includes('page') || text.includes('website')) {
      return <Globe className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
    }
    if (text.includes('email open') || text.includes('opened')) {
      return <Mail className="h-4 w-4 text-purple-550 shrink-0 mt-0.5" />;
    }
    if (text.includes('click') || text.includes('link')) {
      return <Link className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
    }
    if (text.includes('download') || text.includes('resource') || text.includes('file')) {
      return <Download className="h-4 w-4 text-blue-505 shrink-0 mt-0.5" />;
    }
    return <Clock className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
    >
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Automation</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Lead Scoring</BreadcrumbPage>
            </BreadcrumbItem>
            {viewMode !== 'list' && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{viewMode === 'edit' ? 'Edit Score' : 'Create Score'}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-6">
          {/* Main Header Panel */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Lead Scoring Setup</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Define scoring rules to identify and prioritize your most qualified leads.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setSelectedSetupId(null);
                  setScoringName('');
                  setDescription('');
                  setApplyTo('Leads');
                  setScoreType('Total Points');
                  setMinScore(0);
                  setMaxScore(100);
                  setShowInDetails(true);
                  setShowToPortal(false);
                  setRules(defaultRules);
                  setGrades([
                    { grade: 'Hot', min: 80, max: 100 },
                    { grade: 'Warm', min: 50, max: 79 },
                    { grade: 'Cold', min: 0, max: 49 }
                  ]);
                  setViewMode('create');
                }}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold rounded-xl h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Create Setup
              </Button>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Setups</span>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{scoringSetups.length}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-955/30 rounded-2xl">
                <Gauge className="h-5 w-5 text-blue-550" />
              </div>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active</span>
                <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-450">{scoringSetups.filter(s => s.IsActive).length}</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-955/30 rounded-2xl">
                <Zap className="h-5 w-5 text-emerald-655" />
              </div>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl p-5 flex items-center justify-between hover:shadow-xs transition-all duration-200">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Drafts</span>
                <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">{scoringSetups.filter(s => s.IsDraft).length}</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-955/30 rounded-2xl">
                <Layers className="h-5 w-5 text-amber-550" />
              </div>
            </Card>
          </div>

          {/* Table Container using ReusableTable */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-xs p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-805 dark:text-slate-200">Lead Scoring Rulesets</h2>
                <Badge variant="outline" className="text-[10px] font-bold bg-slate-105 dark:bg-slate-800 text-slate-505">
                  {filteredSetups.length} Rulesets
                </Badge>
              </div>

              <div className="relative w-full md:w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search score setup name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8.5 bg-slate-50 dark:bg-slate-950 border-slate-205 dark:border-slate-800 font-medium text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 w-full"
                />
              </div>
            </div>

            <ReusableTable<LeadScoringPayload>
              columns={tableColumns}
              data={filteredSetups}
              actions={renderActions}
              loading={loading}
              initialPageSize={10}
              showGear={true}
              rowKey="id"
              borderless={true}
              title="Lead Scoring rulesets"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Main Header Panel for Form */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm transition-all duration-300">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {viewMode === 'edit' ? 'Edit Lead Scoring Configuration' : 'Lead Scoring Setup'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Define scoring rules to identify and prioritize your most qualified leads.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-9 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-330 cursor-pointer active:scale-95 transition-all"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </Button>

              <Button
                onClick={() => handleSaveAll(false)}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-semibold rounded-xl h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
              >
                Save & Activate
              </Button>
            </div>
          </div>

          {/* Two Column Setup Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Rules & Setup form (~2/3 width) */}
            <div className="lg:col-span-2 space-y-6">

              {/* General Scoring Setup Card */}
              <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
                <CardContent className="p-6 space-y-5 text-left">

                  {/* Score Name & Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scoring Name *</Label>
                      <Input
                        value={scoringName}
                        onChange={(e) => setScoringName(e.target.value)}
                        required
                        className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                      />
                      <p className="text-[10px] text-slate-400 font-medium">Give a unique name to this lead score.</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[64px] border-slate-200 dark:border-slate-800 text-xs leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Apply To & Score Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                    {/* Apply To */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Apply To *</Label>
                      <Select value={applyTo} onValueChange={(val) => val && setApplyTo(val)}>
                        <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-blue-505" />
                            <span>{applyTo}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Leads">Leads</SelectItem>
                          <SelectItem value="Contacts">Contacts</SelectItem>
                          <SelectItem value="Accounts">Accounts</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400 font-medium">Select the module to which this scoring will apply.</p>
                    </div>

                    {/* Score Type Selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score Type</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Total Points */}
                        <div
                          onClick={() => setScoreType('Total Points')}
                          className={`border rounded-xl p-3 flex flex-col justify-center gap-1 cursor-pointer transition-all duration-200 ${scoreType === 'Total Points'
                            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-955/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                            }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              checked={scoreType === 'Total Points'}
                              onChange={() => setScoreType('Total Points')}
                              className="text-blue-505 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                            />
                            <span className="text-xs font-bold text-slate-855 dark:text-slate-200">Total Points</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium ml-5">Add or subtract points</span>
                        </div>

                        {/* Grade */}
                        <div
                          onClick={() => setScoreType('Grade')}
                          className={`border rounded-xl p-3 flex flex-col justify-center gap-1 cursor-pointer transition-all duration-200 ${scoreType === 'Grade'
                            ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-955/20'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855'
                            }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              checked={scoreType === 'Grade'}
                              onChange={() => setScoreType('Grade')}
                              className="text-blue-505 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                            />
                            <span className="text-xs font-bold text-slate-850 dark:text-slate-200">Grade</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium ml-5">A, B, C, D based scoring</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score Range & Visibility */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                    {/* Score Range */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score Range</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-semibold">Min Score</span>
                          <Input
                            type="number"
                            value={minScore}
                            onChange={(e) => setMinScore(Number(e.target.value))}
                            className="h-9 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-semibold">Max Score</span>
                          <Input
                            type="number"
                            value={maxScore}
                            onChange={(e) => setMaxScore(Number(e.target.value))}
                            className="h-9 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Set the minimum and maximum score range.</p>
                    </div>

                    {/* Score Visibility */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score Visibility</Label>
                      <div className="space-y-2 pt-1 text-xs">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="show-in-details"
                            checked={showInDetails}
                            onCheckedChange={(checked) => setShowInDetails(!!checked)}
                          />
                          <label htmlFor="show-in-details" className="font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                            Show score in lead details
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="show-to-portal"
                            checked={showToPortal}
                            onCheckedChange={(checked) => setShowToPortal(!!checked)}
                          />
                          <label htmlFor="show-to-portal" className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
                            Show score to portal users
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              {/* Scoring Rules Card */}
              <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
                <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Scoring Rules</h3>
                    <p className="text-[11px] text-slate-400 font-medium">Add rules to score leads based on their actions and attributes.</p>
                  </div>

                  <Button
                    onClick={handleOpenAddModal}
                    variant="outline"
                    className="h-8.5 text-xs font-bold rounded-lg border-slate-200 dark:border-slate-800 gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" /> Add Rule
                  </Button>
                </div>
                <CardContent className="p-0">

                  {/* Rules List Table */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b dark:border-slate-855">
                        <TableRow className="border-b dark:border-slate-800 hover:bg-transparent">
                          <TableHead className="w-12 px-5 font-bold uppercase tracking-wider text-slate-400 text-xs py-3.5">#</TableHead>
                          <TableHead className="font-bold uppercase tracking-wider text-slate-400 text-xs py-3.5">Criteria</TableHead>
                          <TableHead className="font-bold uppercase tracking-wider text-slate-400 text-xs py-3.5 w-36">Condition</TableHead>
                          <TableHead className="font-bold uppercase tracking-wider text-slate-400 text-xs py-3.5 w-36">Value</TableHead>
                          <TableHead className="font-bold uppercase tracking-wider text-slate-400 text-xs py-3.5 w-24 text-center">Points</TableHead>
                          <TableHead className="font-bold uppercase tracking-wider text-slate-400 text-xs py-3.5 text-center w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rules.map((rule, idx) => (
                          <TableRow key={rule.id} className="border-b dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                            {/* Index */}
                            <TableCell className="px-5 font-semibold text-slate-500 text-xs py-3">
                              {idx + 1}
                            </TableCell>

                            {/* Criteria */}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                {getCriteriaIcon(rule.criteria)}
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {rule.criteria}
                                </span>
                              </div>
                            </TableCell>

                            {/* Condition */}
                            <TableCell className="py-3">
                              <Select value={rule.condition} onValueChange={(val) => {
                                if (val) {
                                  setRules(prev => prev.map(r => r.id === rule.id ? { ...r, condition: val } : r));
                                  toast.info("Condition updated.");
                                }
                              }}>
                                <SelectTrigger className="h-8 border-slate-200 dark:border-slate-855 text-[11px] font-bold rounded-lg py-1 px-2.5">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="at least">at least</SelectItem>
                                  <SelectItem value="is more than">is more than</SelectItem>
                                  <SelectItem value="equals">equals</SelectItem>
                                  <SelectItem value="less than">less than</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>

                            {/* Value & Unit */}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                <Input
                                  type="number"
                                  value={rule.value}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, value: val } : r));
                                  }}
                                  className="h-8 w-16 border-slate-200 dark:border-slate-855 text-xs font-semibold py-1 px-2"
                                />
                                <span>{rule.unit}</span>
                              </div>
                            </TableCell>

                            {/* Points */}
                            <TableCell className="py-3 text-center text-xs font-bold">
                              <span className={rule.points >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-650 dark:text-rose-455'}>
                                {rule.points >= 0 ? `+${rule.points}` : rule.points}
                              </span>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5 text-slate-400">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(rule)}
                                  className="p-1 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-all cursor-pointer"
                                  title="Edit Scoring Rule"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="p-1 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-md transition-all cursor-pointer"
                                  title="Delete Scoring Rule"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                        {rules.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-xs font-medium text-slate-400">
                              No scoring rules defined. Click "Add Rule" to create one.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Bottom reset actions */}
                  <div className="p-4 border-t dark:border-slate-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-400 hover:text-blue-505 hover:underline cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reset to Default
                    </button>
                  </div>

                </CardContent>
              </Card>

            </div>

            {/* Right Column: Score Summary & Score Interpretation sidebars (~1/3 width) */}
            <div className="space-y-6">

              {/* Score Summary Card */}
              <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
                <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
                  <BarChart className="h-4.5 w-4.5 text-blue-650" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-805 dark:text-slate-200">Score Summary</h3>
                </div>
                <CardContent className="p-6 space-y-4 text-xs font-bold text-slate-500">

                  <div className="flex items-center justify-between border-b dark:border-slate-850 pb-2.5">
                    <span>Rules</span>
                    <span className="text-slate-855 dark:text-slate-200 font-extrabold text-sm">{rules.length}</span>
                  </div>

                  <div className="flex items-center justify-between border-b dark:border-slate-850 pb-2.5">
                    <span>Positive Points</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">+{positivePointsSum}</span>
                  </div>

                  <div className="flex items-center justify-between border-b dark:border-slate-855 pb-2.5">
                    <span>Negative Points</span>
                    <span className="text-rose-650 dark:text-rose-450 font-extrabold text-sm">{negativePointsSum}</span>
                  </div>

                  <div className="flex items-center justify-between border-b dark:border-slate-855 pb-2.5">
                    <span>Max Possible Score</span>
                    <span className="text-slate-850 dark:text-slate-200 font-extrabold text-sm">{maxScore}</span>
                  </div>

                  <div className="flex items-center justify-between pb-1">
                    <span>Min Possible Score</span>
                    <span className="text-slate-855 dark:text-slate-200 font-extrabold text-sm">{minScore}</span>
                  </div>

                </CardContent>
              </Card>

              {/* Score Interpretation Card */}
              <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
                <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-4.5 w-4.5 text-blue-650" />
                    <div className="space-y-0.5 text-left">
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Score Interpretation</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Define score ranges and their meaning.</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setGrades([...grades, { grade: 'New Grade', min: 0, max: 10 }])}
                    className="text-[10px] text-blue-650 hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1 h-7 rounded-md font-bold cursor-pointer"
                  >
                    + Add
                  </Button>
                </div>
                <CardContent className="p-6 space-y-4 text-xs text-left">
                  {grades.map((g, idx) => (
                    <div key={idx} className="space-y-2 border-b dark:border-slate-855 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Grade #{idx + 1}</span>
                        {grades.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setGrades(grades.filter((_, i) => i !== idx))}
                            className="text-slate-455 hover:text-rose-605 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[9px] text-slate-400 uppercase font-semibold">Label</Label>
                          <Input
                            value={g.grade}
                            onChange={(e) => {
                              const updated = [...grades];
                              updated[idx] = { ...updated[idx], grade: e.target.value };
                              setGrades(updated);
                            }}
                            className="h-8 text-xs font-semibold py-1 px-2 border-slate-205 dark:border-slate-800"
                            placeholder="e.g. Hot"
                          />
                        </div>
                        <div>
                          <Label className="text-[9px] text-slate-400 uppercase font-semibold">Min</Label>
                          <Input
                            type="number"
                            value={g.min}
                            onChange={(e) => {
                              const updated = [...grades];
                              updated[idx] = { ...updated[idx], min: Number(e.target.value) };
                              setGrades(updated);
                            }}
                            className="h-8 text-xs font-semibold py-1 px-2 border-slate-205 dark:border-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <Label className="text-[9px] text-slate-400 uppercase font-semibold">Max</Label>
                          <Input
                            type="number"
                            value={g.max}
                            onChange={(e) => {
                              const updated = [...grades];
                              updated[idx] = { ...updated[idx], max: Number(e.target.value) };
                              setGrades(updated);
                            }}
                            className="h-8 text-xs font-semibold py-1 px-2 border-slate-205 dark:border-slate-800 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {grades.length === 0 && (
                    <div className="text-center py-4 text-slate-400 italic">
                      No grades set. Click "+ Add" to create one.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
                <div className="p-5 border-b dark:border-slate-800 flex items-center gap-2">
                  <Lightbulb className="h-4.5 w-4.5 text-blue-650" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Tips</h3>
                </div>
                <CardContent className="p-6 text-xs text-left">
                  <ul className="list-disc pl-4 space-y-2 text-slate-500 leading-relaxed font-semibold">
                    <li>Keep rules simple and relevant.</li>
                    <li>Use both positive and negative scoring.</li>
                    <li>Review and update rules regularly.</li>
                    <li>Test the scoring with sample data.</li>
                  </ul>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Rule Add/Edit modal dialog */}
          <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
            <DialogContent className="max-w-md dark:bg-slate-900 dark:border-slate-800">
              <form onSubmit={handleSaveRule}>
                <DialogHeader>
                  <DialogTitle className="text-slate-900 dark:text-white font-extrabold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    {editingRule ? 'Edit Scoring Rule' : 'Add Scoring Rule'}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">
                    {editingRule ? 'Modify properties of this scoring rule.' : 'Define criteria to auto-assign scoring points.'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-3 text-slate-700 dark:text-slate-350 text-xs text-left">

                  {/* Criteria Name */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Criteria Name *</Label>
                    <Input
                      value={ruleCriteria}
                      onChange={(e) => setRuleCriteria(e.target.value)}
                      placeholder="e.g. Visited Pricing Page"
                      required
                      className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                    />
                  </div>

                  {/* Grid: Condition & Value */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Condition</Label>
                      <Select value={ruleCondition} onValueChange={(val) => val && setRuleCondition(val)}>
                        <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="at least">at least</SelectItem>
                          <SelectItem value="is more than">is more than</SelectItem>
                          <SelectItem value="equals">equals</SelectItem>
                          <SelectItem value="less than">less than</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Value</Label>
                      <Input
                        type="number"
                        value={ruleValue}
                        onChange={(e) => setRuleValue(Number(e.target.value))}
                        required
                        className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Grid: Unit & Points */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unit</Label>
                      <Select value={ruleUnit} onValueChange={(val) => val && setRuleUnit(val)}>
                        <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">time</SelectItem>
                          <SelectItem value="times">times</SelectItem>
                          <SelectItem value="days">days</SelectItem>
                          <SelectItem value="visits">visits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Points (+/-)</Label>
                      <Input
                        type="number"
                        value={rulePoints}
                        onChange={(e) => setRulePoints(Number(e.target.value))}
                        placeholder="e.g. 15 or -10"
                        required
                        className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                      />
                      <span className="text-[9px] text-slate-400 font-semibold block leading-none">Use negative values to subtract points.</span>
                    </div>
                  </div>

                </div>

                <DialogFooter className="mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-slate-250 dark:border-slate-800 rounded-lg text-xs"
                    onClick={() => setIsRuleModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-9 rounded-lg text-xs text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Save Rule
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </motion.div>
  );
}
