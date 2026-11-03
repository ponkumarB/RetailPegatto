'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useSalesTargetStore } from '@/store/useSalesTargetStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Building2,
  MapPin,
  Users,
  Target,
  FileText,
  CalendarDays
} from 'lucide-react';
import { toast } from 'sonner';
import { SalesTargetBreakdown } from '@/types/salesTarget';
import { useTerritoryStore } from '@/store/useTerritoryStore';
import { usePermission } from '@/hooks/usePermission';

const MONTHS_LIST = [
  { value: 'Jan-2024', label: 'January 2024' },
  { value: 'Feb-2024', label: 'February 2024' },
  { value: 'Mar-2024', label: 'March 2024' },
  { value: 'Apr-2024', label: 'April 2024' },
  { value: 'May-2024', label: 'May 2024' },
  { value: 'Jun-2024', label: 'June 2024' },
  { value: 'Jul-2024', label: 'July 2024' },
  { value: 'Aug-2024', label: 'August 2024' },
  { value: 'Sep-2024', label: 'September 2024' },
  { value: 'Oct-2024', label: 'October 2024' },
  { value: 'Nov-2024', label: 'November 2024' },
  { value: 'Dec-2024', label: 'December 2024' },
];

const QUARTERS_LIST = [
  { value: 'Q1-2024', label: 'Q1 FY 2024 (Jan - Mar)' },
  { value: 'Q2-2024', label: 'Q2 FY 2024 (Apr - Jun)' },
  { value: 'Q3-2024', label: 'Q3 FY 2024 (Jul - Sep)' },
  { value: 'Q4-2024', label: 'Q4 FY 2024 (Oct - Dec)' },
];

interface FormBreakdownRow {
  id: string;
  userId?: number;
  userName: string;
  periodName: string;
  region: string;
  branch: string;
  targetAmount: number;
}

function CreateSalesTargetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get('id');
  const isEdit = !!editId;

  const { canCreateSalesTarget, canEditSalesTarget, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded) {
      if (isEdit && !canEditSalesTarget) {
        toast.error('You do not have permission to edit Sales Targets.');
        router.push('/sales/target');
      } else if (!isEdit && !canCreateSalesTarget) {
        toast.error('You do not have permission to create Sales Targets.');
        router.push('/sales/target');
      }
    }
  }, [isLoaded, isEdit, canEditSalesTarget, canCreateSalesTarget, router]);

  const { primaryColor } = useStore();
  const { addTarget, usersList, loadUsersList, saveSalesTarget } = useSalesTargetStore();
  const { territories, assignments, quotas, loadAllData: loadTerritoryData } = useTerritoryStore();

  // Form Field States
  const [targetName, setTargetName] = useState('');
  const [targetPeriod, setTargetPeriod] = useState('');
  const [targetType, setTargetType] = useState('REVENUE');
  const [measure, setMeasure] = useState('INR');
  const [salesManager, setSalesManager] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-split settings
  const [selectedTerritory, setSelectedTerritory] = useState('');
  const [targetQuotaValue, setTargetQuotaValue] = useState<number | ''>('');
  const [splitFrequency, setSplitFrequency] = useState<'Yearly' | 'Quarterly' | 'Half-Yearly' | ''>('');

  // Load store data on mount
  useEffect(() => {
    loadTerritoryData();
    loadUsersList();
  }, [loadTerritoryData, loadUsersList]);

  // Load existing target if in edit mode
  useEffect(() => {
    if (isEdit && editId) {
      const tgt = useSalesTargetStore.getState().targets.find(t => t.id === editId);
      if (tgt) {
        setTargetName(tgt.targetName);
        setTargetPeriod(tgt.targetPeriod);
        setTargetType(tgt.targetType);
        setMeasure(tgt.measure);
        setSalesManager(tgt.salesManager);
        setNotes(tgt.notes || '');
        if (tgt.breakdown && tgt.breakdown.length > 0) {
          const matchTerr = territories.find(t => t.region === tgt.breakdown[0].region);
          if (matchTerr) {
            setSelectedTerritory(matchTerr.name);
          }
        }
      }
    }
  }, [isEdit, editId, territories]);

  // Sync quota target value and manager name when territory selection changes
  useEffect(() => {
    if (!selectedTerritory) {
      setSalesManager('');
      setTargetQuotaValue('');
      return;
    }
    const territoryObj = territories.find(t => t.name === selectedTerritory);
    setSalesManager(territoryObj?.managerName || '');

    const quotaObj = quotas.find(q => q.territory.toLowerCase() === selectedTerritory.toLowerCase());
    setTargetQuotaValue(quotaObj ? Number(quotaObj.revenueTarget) : '');
  }, [selectedTerritory, territories, quotas]);

  // Initial breakdown rows (dynamically calculated)
  const [breakdown, setBreakdown] = useState<FormBreakdownRow[]>([]);

  // Unique list of salespersons extracted from assignments for dropdown selection
  const allSalespersons = useMemo(() => {
    const unique = new Map<number, { id: number; name: string }>();
    assignments.forEach(asg => {
      if (asg.user && asg.user.name) {
        const id = asg.user.id || 15;
        unique.set(id, { id, name: asg.user.name });
      }
    });
    if (unique.size === 0 && usersList.length > 0) {
      usersList.forEach(u => {
        const name = u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username;
        unique.set(u.id, { id: u.id, name });
      });
    }
    if (unique.size === 0) {
      unique.set(15, { id: 15, name: 'Karthik' });
      unique.set(16, { id: 16, name: 'Prakash N' });
    }
    return Array.from(unique.values());
  }, [assignments, usersList]);

  // Extract selected year from targetPeriod
  const targetYear = useMemo(() => {
    const match = targetPeriod.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 2026;
  }, [targetPeriod]);

  // Helper to calculate exact dates starting January 1st of targetYear
  const getPeriodDates = (frequency: string, periodName: string, year: number) => {
    if (frequency === 'Yearly') {
      return {
        from_date: `${year}-01-01`,
        to_date: `${year}-12-31`
      };
    }

    if (frequency === 'Quarterly') {
      switch (periodName) {
        case 'Q1':
          return { from_date: `${year}-01-01`, to_date: `${year}-03-31` };
        case 'Q2':
          return { from_date: `${year}-04-01`, to_date: `${year}-06-30` };
        case 'Q3':
          return { from_date: `${year}-07-01`, to_date: `${year}-09-30` };
        case 'Q4':
          return { from_date: `${year}-10-01`, to_date: `${year}-12-31` };
      }
    }
    if (frequency === 'Half-Yearly') {
      switch (periodName) {
        case 'H1':
          return { from_date: `${year}-01-01`, to_date: `${year}-06-30` };
        case 'H2':
          return { from_date: `${year}-07-01`, to_date: `${year}-12-31` };
      }
    }
    return {
      from_date: `${year}-01-01`,
      to_date: `${year}-12-31`
    };
  };

  // Regenerate target allocation table when quota or frequency changes
  useEffect(() => {
    if (!selectedTerritory || !splitFrequency) {
      setBreakdown([]);
      return;
    }

    const territoryObj = territories.find(t => t.name === selectedTerritory);
    if (!territoryObj) return;

    const territoryAssignments = assignments.filter(asg => asg.territory.toLowerCase() === selectedTerritory.toLowerCase() && asg.isActive);
    let assignedUsers = territoryAssignments.map(asg => ({
      id: asg.user.id || 15,
      name: asg.user.name
    }));

    if (assignedUsers.length === 0) {
      assignedUsers = [{ id: 15, name: 'Karthik' }];
    }

    let intervals: string[] = [];
    if (splitFrequency === 'Yearly') {
      intervals = ['Yearly'];
    } else if (splitFrequency === 'Quarterly') {
      intervals = ['Q1', 'Q2', 'Q3', 'Q4'];
    } else if (splitFrequency === 'Half-Yearly') {
      intervals = ['H1', 'H2'];
    }

    const R = assignedUsers.length * intervals.length;
    const quotaNum = Number(targetQuotaValue || 0);
    const targetAmt = R > 0 ? Math.round(quotaNum / R) : quotaNum;

    const newBreakdown: FormBreakdownRow[] = [];
    let rowCount = 1;
    assignedUsers.forEach(userObj => {
      intervals.forEach(interval => {
        newBreakdown.push({
          id: `BD-${selectedTerritory}-${rowCount++}`,
          userId: userObj.id,
          userName: userObj.name,
          periodName: interval,
          region: territoryObj.region || '',
          branch: territoryObj.country || '',
          targetAmount: targetAmt
        });
      });
    });

    setBreakdown(newBreakdown);
  }, [selectedTerritory, targetQuotaValue, splitFrequency, territories, assignments]);

  // Sync Target Name with chosen Territory and Period
  useEffect(() => {
    if (selectedTerritory) {
      setTargetName(`${selectedTerritory} Target - ${targetPeriod || '2026'}`);
    }
  }, [selectedTerritory, targetPeriod]);

  // Derived calculations for Summary section
  const totalTarget = useMemo(() => {
    return breakdown.reduce((sum, item) => sum + Number(item.targetAmount || 0), 0);
  }, [breakdown]);

  const salesPersonsCount = breakdown.length;

  const handleAddRow = () => {
    const newId = `BD-${Date.now()}-${breakdown.length}`;
    setBreakdown(prev => [
      ...prev,
      {
        id: newId,
        userId: allSalespersons[0]?.id || 15,
        userName: allSalespersons[0]?.name || 'Sales Representative',
        periodName: splitFrequency === 'Yearly' ? 'Yearly' : (splitFrequency === 'Quarterly' ? 'Q1' : 'H1'),
        region: 'South',
        branch: 'Delhi Branch',
        targetAmount: 1000000
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (breakdown.length <= 1) {
      toast.error('At least one salesperson breakdown is required.');
      return;
    }
    setBreakdown(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof FormBreakdownRow, value: any) => {
    setBreakdown(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'targetAmount') {
          return { ...item, [field]: Number(value) };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: measure,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getMonthDaysCount = (monthNum: number, year: number) => {
    return new Date(year, monthNum, 0).getDate();
  };

  const generateMonthsPayload = (frequency: string, periodName: string, periodTarget: number, year: number) => {
    const months: any[] = [];

    if (frequency === 'Yearly') {
      const calendarMonths = [
        { no: 1, name: 'January', year: year, monthIdx: 1 },
        { no: 2, name: 'February', year: year, monthIdx: 2 },
        { no: 3, name: 'March', year: year, monthIdx: 3 },
        { no: 4, name: 'April', year: year, monthIdx: 4 },
        { no: 5, name: 'May', year: year, monthIdx: 5 },
        { no: 6, name: 'June', year: year, monthIdx: 6 },
        { no: 7, name: 'July', year: year, monthIdx: 7 },
        { no: 8, name: 'August', year: year, monthIdx: 8 },
        { no: 9, name: 'September', year: year, monthIdx: 9 },
        { no: 10, name: 'October', year: year, monthIdx: 10 },
        { no: 11, name: 'November', year: year, monthIdx: 11 },
        { no: 12, name: 'December', year: year, monthIdx: 12 }
      ];

      calendarMonths.forEach(m => {
        const monthStr = String(m.monthIdx).padStart(2, '0');
        const lastDay = getMonthDaysCount(m.monthIdx, m.year);
        const monthlyTarget = Math.round(periodTarget / 12);

        months.push({
          month_no: m.no,
          month_name: m.name,
          month_key: `${m.year}-${monthStr}`,
          from_date: `${m.year}-${monthStr}-01`,
          to_date: `${m.year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
          target_amount: monthlyTarget
        });
      });
    } else if (frequency === 'Quarterly') {
      let targetMonths: { no: number; name: string; year: number; monthIdx: number }[] = [];
      if (periodName === 'Q1') {
        targetMonths = [
          { no: 1, name: 'January', year: year, monthIdx: 1 },
          { no: 2, name: 'February', year: year, monthIdx: 2 },
          { no: 3, name: 'March', year: year, monthIdx: 3 }
        ];
      } else if (periodName === 'Q2') {
        targetMonths = [
          { no: 4, name: 'April', year: year, monthIdx: 4 },
          { no: 5, name: 'May', year: year, monthIdx: 5 },
          { no: 6, name: 'June', year: year, monthIdx: 6 }
        ];
      } else if (periodName === 'Q3') {
        targetMonths = [
          { no: 7, name: 'July', year: year, monthIdx: 7 },
          { no: 8, name: 'August', year: year, monthIdx: 8 },
          { no: 9, name: 'September', year: year, monthIdx: 9 }
        ];
      } else if (periodName === 'Q4') {
        targetMonths = [
          { no: 10, name: 'October', year: year, monthIdx: 10 },
          { no: 11, name: 'November', year: year, monthIdx: 11 },
          { no: 12, name: 'December', year: year, monthIdx: 12 }
        ];
      }

      targetMonths.forEach(m => {
        const monthStr = String(m.monthIdx).padStart(2, '0');
        const lastDay = getMonthDaysCount(m.monthIdx, m.year);
        const monthlyTarget = Math.round(periodTarget / 3);
        months.push({
          month_no: m.no,
          month_name: m.name,
          month_key: `${m.year}-${monthStr}`,
          from_date: `${m.year}-${monthStr}-01`,
          to_date: `${m.year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
          target_amount: monthlyTarget
        });
      });
    } else if (frequency === 'Half-Yearly') {
      let targetMonths: { no: number; name: string; year: number; monthIdx: number }[] = [];
      if (periodName === 'H1') {
        targetMonths = [
          { no: 1, name: 'January', year: year, monthIdx: 1 },
          { no: 2, name: 'February', year: year, monthIdx: 2 },
          { no: 3, name: 'March', year: year, monthIdx: 3 },
          { no: 4, name: 'April', year: year, monthIdx: 4 },
          { no: 5, name: 'May', year: year, monthIdx: 5 },
          { no: 6, name: 'June', year: year, monthIdx: 6 }
        ];
      } else if (periodName === 'H2') {
        targetMonths = [
          { no: 7, name: 'July', year: year, monthIdx: 7 },
          { no: 8, name: 'August', year: year, monthIdx: 8 },
          { name: 'September', year: year, monthIdx: 9, no: 9 },
          { no: 10, name: 'October', year: year, monthIdx: 10 },
          { no: 11, name: 'November', year: year, monthIdx: 11 },
          { no: 12, name: 'December', year: year, monthIdx: 12 }
        ];
      }

      targetMonths.forEach(m => {
        const monthStr = String(m.monthIdx).padStart(2, '0');
        const lastDay = getMonthDaysCount(m.monthIdx, m.year);
        const monthlyTarget = Math.round(periodTarget / 6);
        months.push({
          month_no: m.no,
          month_name: m.name,
          month_key: `${m.year}-${monthStr}`,
          from_date: `${m.year}-${monthStr}-01`,
          to_date: `${m.year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
          target_amount: monthlyTarget
        });
      });
    }

    return months;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetName.trim()) {
      toast.error('Target Name is required.');
      return;
    }

    for (let i = 0; i < breakdown.length; i++) {
      const row = breakdown[i];
      if (!row.userName.trim()) {
        toast.error(`Row ${i + 1}: Please select a salesperson.`);
        return;
      }
      if (Number(row.targetAmount || 0) <= 0) {
        toast.error(`Row ${i + 1}: Target amount must be greater than 0.`);
        return;
      }
    }

    const territoryObj = territories.find(t => t.name === selectedTerritory);
    const territoryId = territoryObj?.id || 5;
    const territoryName = territoryObj?.name || 'Chennai North';

    let managerId = territoryObj?.managerId || 8;
    if (salesManager && usersList.length > 0) {
      const matchedUser = usersList.find(u => {
        const fullName = (u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username).toLowerCase();
        return fullName === salesManager.toLowerCase() || u.username.toLowerCase() === salesManager.toLowerCase();
      });
      if (matchedUser) {
        managerId = matchedUser.id;
      }
    }

    const groupedSalespersons = new Map<number, { salesperson_id: number; periods: any[] }>();

    breakdown.forEach(row => {
      const spId = row.userId || 15;
      if (!groupedSalespersons.has(spId)) {
        groupedSalespersons.set(spId, {
          salesperson_id: spId,
          periods: []
        });
      }

      const dates = getPeriodDates(splitFrequency, row.periodName, targetYear);
      const targetAmountNum = Number(row.targetAmount || 0);
      const months = generateMonthsPayload(splitFrequency, row.periodName, targetAmountNum, targetYear);

      groupedSalespersons.get(spId)!.periods.push({
        period_name: row.periodName === 'Yearly' ? `FY${targetYear}` : row.periodName,
        from_date: dates.from_date,
        to_date: dates.to_date,
        target_amount: targetAmountNum,
        months
      });
    });

    const salesperson_allocations_api = Array.from(groupedSalespersons.values());
    const currentDateStr = new Date().toISOString().split('T')[0];

    const payload: any = {
      Year: null,
      Target_Type: targetType.toUpperCase(),
      Measure: measure,
      Start_Date: `${targetYear}-01-01`,
      End_Date: `${targetYear}-12-31`,
      Status: 'Draft',
      Is_Active: true,
      Notes: notes || '',
      Target: salesperson_allocations_api,
      Target_Name: targetName,
      Territery_Name: territoryName,
      Is_Deleted: false,
      Created_Date: currentDateStr,
      Updated_Date: currentDateStr,
      Organization_Id: Number(localStorage.getItem('Organization_Id') || '1'),
      Sales_Manager: managerId,
      Territery_Id: territoryId,
      Created_By: Number(localStorage.getItem('userId') || '72'),
      Updated_By: Number(localStorage.getItem('userId') || '72')
    };

    if (isEdit && editId) {
      payload.id = Number(editId);
    }

    const legacyBreakdown = breakdown.map(row => ({
      id: row.id,
      salesPerson: `${row.userName} (${row.periodName})`,
      region: row.region,
      branch: row.branch,
      targetAmount: Number(row.targetAmount)
    }));

    const groupedSalespersonsLocal = new Map<number, { salesperson_id: number; salesperson_Name: string; periods: any[]; region: string; branch: string }>();

    breakdown.forEach(row => {
      const spId = row.userId || 15;
      if (!groupedSalespersonsLocal.has(spId)) {
        groupedSalespersonsLocal.set(spId, {
          salesperson_id: spId,
          salesperson_Name: row.userName,
          region: row.region,
          branch: row.branch,
          periods: []
        });
      }

      const dates = getPeriodDates(splitFrequency, row.periodName, targetYear);
      groupedSalespersonsLocal.get(spId)!.periods.push({
        period_name: row.periodName,
        from_date: dates.from_date,
        to_date: dates.to_date,
        target_amount: Number(row.targetAmount)
      });
    });

    const localTarget = {
      id: isEdit && editId ? String(editId) : `TGT-${Date.now().toString().slice(-4)}`,
      targetName,
      targetPeriod,
      targetType,
      measure,
      salesManager,
      salesPersonsCount,
      regionsCount: 1,
      branchesCount: 1,
      totalTarget,
      notes: notes || undefined,
      breakdown: legacyBreakdown,
      salesperson_allocations: Array.from(groupedSalespersonsLocal.values()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveSalesTarget(payload, isEdit)
      .then(() => {
        toast.success(isEdit ? 'Sales Target updated successfully!' : 'Sales Target created successfully!');
        if (isEdit && editId) {
          useSalesTargetStore.getState().updateTarget(String(editId), localTarget);
        } else {
          addTarget(localTarget);
        }
        router.push('/sales/target');
      })
      .catch((err) => {
        console.error('Failed to save sales target:', err);
        toast.error('Failed to save sales target. Please check inputs and try again.');
      });
  };

  if (isLoaded && ((isEdit && !canEditSalesTarget) || (!isEdit && !canCreateSalesTarget))) {
    return null;
  }

  return (
    <div className="space-y-6 text-left" style={{ '--theme-primary': primaryColor } as React.CSSProperties}>
      {/* Breadcrumbs */}
      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
        <span className="cursor-pointer hover:underline" onClick={() => router.push('/sales/target')}>Sales Organization</span>
        <span>/</span>
        <span className="cursor-pointer hover:underline" onClick={() => router.push('/sales/target')}>Sales Target</span>
        <span>/</span>
        <span className="font-semibold text-slate-700 dark:text-slate-300">{isEdit ? 'Edit Target' : 'Add Target'}</span>
      </div>

      {/* Title section with Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/sales/target')}
            className="h-9 w-9 border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {isEdit ? 'Edit Sales Target' : 'Add New Sales Target'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Establish sales period goals and outline salesperson realization expectations.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                <Target className="h-4.5 w-4.5" style={{ color: primaryColor }} /> General Target Settings
              </CardTitle>
              <CardDescription className="text-xs dark:text-slate-400 font-medium">
                Provide details regarding the sales target name, period, and default managers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Choose Territory */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-400">Select Territory <span className="text-rose-500">*</span></label>
                  <Select value={selectedTerritory} onValueChange={(val) => val && setSelectedTerritory(val)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-background font-semibold">
                      <SelectValue placeholder="Choose a territory..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                      {territories.map(t => (
                        <SelectItem key={t.code} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Split Frequency */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-400">Allocation Flow / Frequency <span className="text-rose-500">*</span></label>
                  <Select value={splitFrequency} onValueChange={(val) => val && setSplitFrequency(val as any)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-background font-semibold">
                      <SelectValue placeholder="Select target interval type..." />
                    </SelectTrigger>
                    <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <SelectItem value="Yearly">Yearly (Jan - Dec)</SelectItem>
                      <SelectItem value="Quarterly">Quarterly (Q1 - Q4)</SelectItem>
                      <SelectItem value="Half-Yearly">Half-Yearly (6 Months)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-slate-800/60 pt-4">
                {/* Quota Target Value */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-400">Quota Target Value ({measure === 'INR' ? '₹' : '$'})</label>
                  <Input
                    type="number"
                    value={targetQuotaValue}
                    onChange={(e) => setTargetQuotaValue(Number(e.target.value))}
                    placeholder="Enter quota target amount..."
                    className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950 font-bold"
                    min={0}
                  />
                </div>

                {/* Sales Manager */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-400">Sales Manager (Auto-assigned)</label>
                  <Input
                    value={salesManager || 'No manager assigned'}
                    disabled
                    readOnly
                    className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/40 font-semibold cursor-not-allowed text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t dark:border-slate-800/60 pt-4">
                {/* Target Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-400">Target Title</label>
                  <Input
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder="Enter sales target name..."
                    className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950 font-bold"
                    required
                  />
                </div>

                {/* Measure Currency */}
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-550 dark:text-slate-400">Currency / Unit</label>
                  <Select value={measure} onValueChange={(val) => val && setMeasure(val)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800 bg-background font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 text-left border-t dark:border-slate-800/60 pt-4">
                <label className="text-xs font-bold text-slate-550 dark:text-slate-400">Target description or internal notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide context regarding this period's target expectations, assumptions or incentives..."
                  className="min-h-[70px] text-xs rounded-xl border-slate-200 dark:border-slate-800 font-medium"
                />
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Table Section */}
          <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
                <div>
                  <CardTitle className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                    <Users className="h-4.5 w-4.5" style={{ color: primaryColor }} /> Salesperson Target Allocation
                  </CardTitle>
                  <CardDescription className="text-xs dark:text-slate-400 font-semibold">
                    Allocate target figures to specific salespeople, branches, and regions.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={handleAddRow}
                  size="sm"
                  variant="outline"
                  className="h-8 text-[11px] font-bold border-slate-200 dark:border-slate-800 rounded-lg gap-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Salesperson
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[700px]">
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
                    <TableRow>
                      <TableHead className="py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-4 w-[200px]">Sales Person Name</TableHead>
                      <TableHead className="py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[130px]">Region</TableHead>
                      <TableHead className="py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[160px]">Branch</TableHead>
                      <TableHead className="py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 w-[150px] text-right">Target Amount ({measure === 'INR' ? '₹' : '$'})</TableHead>
                      <TableHead className="py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center pr-4 w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdown.map((row) => (
                      <TableRow key={row.id} className="border-b border-slate-50 dark:border-slate-800/80 hover:bg-slate-50/10">
                        <TableCell className="py-2.5 pl-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Select
                                value={row.userName}
                                onValueChange={(val) => {
                                  const found = allSalespersons.find(sp => sp.name === val);
                                  if (found) {
                                    handleUpdateRow(row.id, 'userId', found.id);
                                    handleUpdateRow(row.id, 'userName', found.name);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-background font-semibold">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-40 overflow-y-auto">
                                  {allSalespersons.map(sp => (
                                    <SelectItem key={sp.id} value={sp.name}>{sp.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0 font-extrabold border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950">
                              {row.periodName}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="py-2.5">
                          <Input
                            value={row.region}
                            onChange={(e) => handleUpdateRow(row.id, 'region', e.target.value)}
                            className="h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-background font-semibold"
                            placeholder="Region"
                          />
                        </TableCell>

                        <TableCell className="py-2.5">
                          <Input
                            value={row.branch}
                            onChange={(e) => handleUpdateRow(row.id, 'branch', e.target.value)}
                            className="h-8.5 text-xs rounded-lg border-slate-200 dark:border-slate-800 bg-background font-semibold"
                            placeholder="Branch"
                          />
                        </TableCell>

                        <TableCell className="py-2.5">
                          <Input
                            type="number"
                            value={row.targetAmount || ''}
                            onChange={(e) => handleUpdateRow(row.id, 'targetAmount', e.target.value)}
                            className="h-8.5 text-xs text-right font-mono rounded-lg border-slate-200 dark:border-slate-800 font-bold"
                            placeholder="0"
                            required
                          />
                        </TableCell>

                        <TableCell className="py-2.5 text-center pr-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRow(row.id)}
                            className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side Summary Card */}
        <div className="space-y-6 text-left">
          <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs sticky top-6">
            <CardHeader className="pb-4 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-base font-bold text-slate-850 dark:text-white">Target Summary</CardTitle>
              <CardDescription className="text-xs dark:text-slate-400 font-semibold">Live computation of allocated targets</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850/80 rounded-xl">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Total allocated Target ({measure})</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block tracking-tight">
                  {formatCurrency(totalTarget)}
                </span>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400" /> Salespersons Count
                  </span>
                  <Badge className="bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-extrabold border-none">{salesPersonsCount}</Badge>
                </div>
              </div>

              <div className="border-t border-slate-50 dark:border-slate-800 pt-4 space-y-2.5">
                <Button
                  type="submit"
                  style={{ backgroundColor: primaryColor }}
                  className="w-full text-white font-bold rounded-xl gap-2 h-9.5 text-xs cursor-pointer hover:opacity-90"
                >
                  <Save className="h-4 w-4" /> Save Sales Target
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/sales/target')}
                  className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl h-9.5 text-xs cursor-pointer text-slate-750 dark:text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default function CreateSalesTargetPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading form...</div>}>
      <CreateSalesTargetForm />
    </Suspense>
  );
}
