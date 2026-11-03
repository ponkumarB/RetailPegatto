'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sliders,
  Settings,
  Plus,
  Play,
  CheckCircle,
  HelpCircle,
  Activity,
  Layers,
  Database,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCustomerSegmentStore } from '@/store/useCustomerSegmentStore';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';

export default function SegmentRulesPage() {
  const { primaryColor } = useStore();
  const { segments } = useCustomerSegmentStore();
  const router = useRouter();

  // Rules builder form mock states
  const [ruleName, setRuleName] = useState('');
  const [category, setCategory] = useState('Behavioral');
  const [field, setField] = useState('appLogins');
  const [operator, setOperator] = useState('gt');
  const [value, setValue] = useState('');

  const handleTestRule = () => {
    if (!ruleName) {
      toast.error('Please enter a rule name first.');
      return;
    }
    toast.success(`Rule "${ruleName}" is valid! Estimated matching customers: ${Math.floor(150 + Math.random() * 800)}.`);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !value) {
      toast.error('Please fill in all required fields.');
      return;
    }
    toast.success(`Rule "${ruleName}" successfully compiled! Add it to a segment to activate it.`);
    setRuleName('');
    setValue('');
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Behavioral':
        return <Activity className="h-5 w-5 text-purple-650" />;
      case 'Transactional':
        return <Database className="h-5 w-5 text-emerald-650" />;
      case 'Demographic':
        return <Layers className="h-5 w-5 text-blue-650" />;
      default:
        return <Settings className="h-5 w-5 text-slate-650" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left pb-10"
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
              <BreadcrumbLink render={<NavLink to="/customer-segmentation">Customer Segmentation</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Rules</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-3xs transition-all duration-300">
        <div className="flex items-center gap-4 text-left">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 border dark:border-slate-800 rounded-xl cursor-pointer"
            onClick={() => router.push('/customer-segmentation')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-6 w-6 text-blue-650" style={{ color: primaryColor }} />
              Rules Configuration Builder
            </h1>
            <p className="text-muted-foreground text-sm">
              Define logical rules and conditional filters to dynamically classify customers based on live activities and history.
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Rule Editor Form (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Rule Creator</h3>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleCreateRule} className="space-y-5">
                {/* Rule Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rule Name *</label>
                  <Input
                    placeholder="e.g. Enterprise login activity trigger"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    required
                    className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  />
                </div>

                {/* Categories & Fields Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left pt-1">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rule Category</label>
                    <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Behavioral">Behavioral Activity</SelectItem>
                        <SelectItem value="Transactional">Transactional / Sales</SelectItem>
                        <SelectItem value="Demographic">Demographic / Profile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Criteria Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Field</label>
                    <Select value={field} onValueChange={(val) => val && setField(val)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {category === 'Behavioral' && (
                          <>
                            <SelectItem value="appLogins">Monthly App Logins</SelectItem>
                            <SelectItem value="supportTickets">Support Ticket Count</SelectItem>
                            <SelectItem value="daysInactive">Days Since Last Active</SelectItem>
                          </>
                        )}
                        {category === 'Transactional' && (
                          <>
                            <SelectItem value="totalPurchases">Total Spent amount</SelectItem>
                            <SelectItem value="orderFrequency">Orders Per Month</SelectItem>
                            <SelectItem value="avgOrderValue">Average Order Value</SelectItem>
                            <SelectItem value="discountUsage">Coupon Usage rate (%)</SelectItem>
                          </>
                        )}
                        {category === 'Demographic' && (
                          <>
                            <SelectItem value="membershipDuration">Membership duration (days)</SelectItem>
                            <SelectItem value="region">Sales Region</SelectItem>
                            <SelectItem value="companySize">Company size (employees)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Condition Operator */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operator</label>
                    <Select value={operator} onValueChange={(val) => val && setOperator(val)}>
                      <SelectTrigger className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">Greater Than (&gt;)</SelectItem>
                        <SelectItem value="lt">Less Than (&lt;)</SelectItem>
                        <SelectItem value="eq">Equals (=)</SelectItem>
                        <SelectItem value="neq">Does Not Equal (!=)</SelectItem>
                        <SelectItem value="inc">Contains / Includes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Target Value Input */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Value *</label>
                  <Input
                    placeholder="Enter value (e.g. 50000, 10, Yes, Europe)"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    className="h-10 border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer"
                    onClick={handleTestRule}
                  >
                    <Play className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    Dry Run Rule
                  </Button>
                  <Button
                    type="submit"
                    style={{ backgroundColor: primaryColor }}
                    className="text-white text-xs font-bold rounded-xl h-9 px-4 cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    Compile Rule
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Core operators guide card */}
          <Card className="border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-blue-500" style={{ color: primaryColor }} />
                Rules Evaluation Engine Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs font-medium text-slate-600 dark:text-slate-400">
              <p>
                Our segmentation rules utilize real-time database indexing to run dynamic queries:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 font-semibold">
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Greater Than (&gt;):</strong> Matches values strictly above target (useful for monetary ranges and transaction frequencies).
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Contains / Includes:</strong> Perfect for checking text attributes like regions, country codes, or account tier levels.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Logical AND/OR:</strong> By default, all rules added within a single segment are combined using the <span className="text-blue-600 dark:text-blue-400">AND</span> operator.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Currently Active Rules list (1/3 width) */}
        <div className="space-y-6">
          <Card className="border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-3xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">Compiled Segment Rules</h3>
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-md">
                Active ({segments.reduce((acc, curr) => acc + curr.rules.length, 0)})
              </Badge>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {segments.map((seg) => (
                  <div key={seg.id} className="space-y-2 border-b last:border-0 pb-3 last:pb-0 border-slate-100 dark:border-slate-800/40">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                      {seg.name} Rules
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {seg.rules.map((rule, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-350"
                        >
                          {getCategoryIcon(seg.type)}
                          <span className="truncate flex-1" title={rule}>{rule}</span>
                          <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
