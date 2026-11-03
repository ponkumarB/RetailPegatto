'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { LoyaltyRule } from '@/store/useLoyaltyStore';
import { toast } from 'sonner';

interface LoyaltyRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ruleData: Partial<LoyaltyRule>) => void;
  initialRule?: LoyaltyRule | null;
  mode?: 'create' | 'edit';
}

export function LoyaltyRuleModal({
  isOpen,
  onClose,
  onSubmit,
  initialRule,
  mode = 'create'
}: LoyaltyRuleModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'points' | 'applicability' | 'validity'>('basic');

  // Tab 1: Basic Info
  const [ruleName, setRuleName] = useState('');
  const [ruleType, setRuleType] = useState('Standard');
  const [status, setStatus] = useState('Draft');
  const [description, setDescription] = useState('');
  const [termsConditions, setTermsConditions] = useState('');

  // Tab 2: Points & Conditions
  const [pointsPerAmount, setPointsPerAmount] = useState<number | string>(0);
  const [earningMultiplier, setEarningMultiplier] = useState<number | string>(0);
  const [minPurchase, setMinPurchase] = useState<number | string>('');
  const [maxPoints, setMaxPoints] = useState<number | string>('');
  const [maxPointsPerDay, setMaxPointsPerDay] = useState<number | string>('');
  const [priority, setPriority] = useState<number | string>(0);

  // Tab 3: Applicability
  const [applicableTo, setApplicableTo] = useState('All Customers');
  const [applicableTiers, setApplicableTiers] = useState<string[]>([]);
  const [applicableCategories, setApplicableCategories] = useState<string[]>([]);

  // Tab 4: Validity & Metadata
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [expiryDays, setExpiryDays] = useState<number | string>(0);
  const [reminderDays, setReminderDays] = useState<number | string>(0);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableCategories = ['Electronics', 'Clothing', 'Grocery', 'Beauty', 'Furniture'];
  const availableTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialRule) {
        setRuleName(initialRule.name || '');
        setRuleType(initialRule.type || 'Standard');
        setStatus(initialRule.status || 'Draft');
        setDescription(initialRule.description || '');
        setTermsConditions(initialRule.termsConditions || '');
        setPointsPerAmount(initialRule.pointsPerAmount ?? 0);
        setEarningMultiplier(initialRule.earningMultiplier ?? 0);
        setMinPurchase(initialRule.minPurchase ?? '');
        setMaxPoints(initialRule.maxPoints ?? '');
        setMaxPointsPerDay(initialRule.maxPointsPerDay ?? '');
        setPriority(initialRule.priority ?? 0);
        setApplicableTo(initialRule.applicableTo || 'All Customers');
        setApplicableTiers(initialRule.applicableTiers || []);
        setApplicableCategories(initialRule.applicableCategories || []);
        setValidFrom(initialRule.validFrom || '');
        setValidTo(initialRule.validTo || '');
        setExpiryDays(initialRule.expiryDays ?? 0);
        setReminderDays(initialRule.reminderDays ?? 0);
      } else {
        // Reset defaults
        setRuleName('');
        setRuleType('Standard');
        setStatus('Draft');
        setDescription('');
        setTermsConditions('');
        setPointsPerAmount(0);
        setEarningMultiplier(0);
        setMinPurchase('');
        setMaxPoints('');
        setMaxPointsPerDay('');
        setPriority(0);
        setApplicableTo('All Customers');
        setApplicableTiers([]);
        setApplicableCategories([]);
        setValidFrom('');
        setValidTo('');
        setExpiryDays(0);
        setReminderDays(0);
      }
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, mode, initialRule]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!ruleName.trim()) {
      newErrors.ruleName = 'Rule name is required';
    } else if (ruleName.trim().length < 3) {
      newErrors.ruleName = 'Rule name must be at least 3 characters';
    } else if (ruleName.trim().length > 150) {
      newErrors.ruleName = 'Rule name cannot exceed 150 characters';
    }

    if (pointsPerAmount === '' || isNaN(Number(pointsPerAmount)) || Number(pointsPerAmount) < 0) {
      newErrors.pointsPerAmount = 'Points per amount cannot be negative';
    }

    if (earningMultiplier === '' || isNaN(Number(earningMultiplier)) || Number(earningMultiplier) < 0) {
      newErrors.earningMultiplier = 'Multiplier cannot be negative';
    }

    if (priority === '' || isNaN(Number(priority)) || Number(priority) < 0) {
      newErrors.priority = 'Priority must be 0 or greater';
    }

    if (validFrom && validTo && new Date(validTo) < new Date(validFrom)) {
      newErrors.validTo = 'Valid To date must be after Valid From date';
    }

    if (description.length > 250) {
      newErrors.description = 'Description cannot exceed 250 characters';
    }

    if (termsConditions.length > 250) {
      newErrors.termsConditions = 'Terms & conditions cannot exceed 250 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix errors in the form before saving');
      return;
    }

    const payload: Partial<LoyaltyRule> = {
      name: ruleName.trim(),
      type: ruleType,
      status,
      description: description.trim(),
      termsConditions: termsConditions.trim(),
      pointsPerAmount: Number(pointsPerAmount) || 0,
      earningMultiplier: Number(earningMultiplier) || 0,
      minPurchase: minPurchase !== '' ? Number(minPurchase) : null,
      maxPoints: maxPoints !== '' ? Number(maxPoints) : null,
      maxPointsPerDay: maxPointsPerDay !== '' ? Number(maxPointsPerDay) : null,
      priority: Number(priority) || 0,
      applicableTo,
      applicableTiers,
      applicableCategories,
      validFrom: validFrom || undefined,
      validTo: validTo || undefined,
      expiryDays: Number(expiryDays) || 0,
      reminderDays: Number(reminderDays) || 0
    };

    onSubmit(payload);
    onClose();
  };

  const toggleCategory = (cat: string) => {
    if (applicableCategories.includes(cat)) {
      setApplicableCategories(applicableCategories.filter((c) => c !== cat));
    } else {
      setApplicableCategories([...applicableCategories, cat]);
    }
  };

  const toggleTier = (tier: string) => {
    if (applicableTiers.includes(tier)) {
      setApplicableTiers(applicableTiers.filter((t) => t !== tier));
    } else {
      setApplicableTiers([...applicableTiers, tier]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {mode === 'edit' ? 'Edit Loyalty Rule' : 'Create New Loyalty Rule'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto gap-8 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-3.5 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'basic'
                ? 'text-[#2A7D5B] border-[#2A7D5B] font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            Basic Info
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('points')}
            className={`py-3.5 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'points'
                ? 'text-[#2A7D5B] border-[#2A7D5B] font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            Points & Conditions
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('applicability')}
            className={`py-3.5 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'applicability'
                ? 'text-[#2A7D5B] border-[#2A7D5B] font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            Applicability
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('validity')}
            className={`py-3.5 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'validity'
                ? 'text-[#2A7D5B] border-[#2A7D5B] font-semibold'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            Validity & Metadata
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Rule Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rule Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => {
                    setRuleName(e.target.value);
                    setErrors((prev) => ({ ...prev, ruleName: '' }));
                  }}
                  placeholder="Enter rule name"
                  className={`w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none ${
                    errors.ruleName
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#2A7D5B]/30'
                  }`}
                />
                {errors.ruleName && (
                  <p className="mt-1 text-[11px] text-red-500">{errors.ruleName}</p>
                )}
              </div>

              {/* Rule Type & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rule Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value)}
                      className="w-full h-10 px-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30 appearance-none cursor-pointer"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Promotional">Promotional</option>
                      <option value="Bonus">Bonus</option>
                      <option value="Tier Based">Tier Based</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-10 px-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30 appearance-none cursor-pointer"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  maxLength={250}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose and conditions of this rule"
                  className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30 resize-none"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] text-slate-400">
                    {description.length}/250 characters
                  </span>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Terms & Conditions
                </label>
                <input
                  type="text"
                  value={termsConditions}
                  maxLength={250}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  placeholder="Enter any terms and conditions for this rule"
                  className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] text-slate-400">
                    {termsConditions.length}/250 characters
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POINTS & CONDITIONS */}
          {activeTab === 'points' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Points Per Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={pointsPerAmount}
                    onChange={(e) => {
                      setPointsPerAmount(e.target.value);
                      setErrors((prev) => ({ ...prev, pointsPerAmount: '' }));
                    }}
                    className={`w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none ${
                      errors.pointsPerAmount
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#2A7D5B]/30'
                    }`}
                  />
                  {errors.pointsPerAmount && (
                    <p className="mt-1 text-[11px] text-red-500">{errors.pointsPerAmount}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Earning Multiplier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={earningMultiplier}
                    onChange={(e) => {
                      setEarningMultiplier(e.target.value);
                      setErrors((prev) => ({ ...prev, earningMultiplier: '' }));
                    }}
                    className={`w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none ${
                      errors.earningMultiplier
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#2A7D5B]/30'
                    }`}
                  />
                  {errors.earningMultiplier && (
                    <p className="mt-1 text-[11px] text-red-500">{errors.earningMultiplier}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Minimum Purchase Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    placeholder=""
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Maximum Points per Transaction
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={maxPoints}
                    onChange={(e) => setMaxPoints(e.target.value)}
                    placeholder=""
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Maximum Points per Day
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={maxPointsPerDay}
                    onChange={(e) => setMaxPointsPerDay(e.target.value)}
                    placeholder=""
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      setErrors((prev) => ({ ...prev, priority: '' }));
                    }}
                    className={`w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none ${
                      errors.priority
                        ? 'border-red-500 ring-1 ring-red-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#2A7D5B]/30'
                    }`}
                  />
                  {errors.priority && (
                    <p className="mt-1 text-[11px] text-red-500">{errors.priority}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APPLICABILITY */}
          {activeTab === 'applicability' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Applicable To <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={applicableTo}
                    onChange={(e) => setApplicableTo(e.target.value)}
                    className="w-full h-10 px-3 pr-8 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30 appearance-none cursor-pointer"
                  >
                    <option value="All Customers">All Customers</option>
                    <option value="Specific Tiers Only">Specific Tiers Only</option>
                    <option value="New Customers Only">New Customers Only</option>
                    <option value="Loyalty Members Only">Loyalty Members Only</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Specific Tiers Multi-select if applicable */}
              {applicableTo === 'Specific Tiers Only' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Applicable Tiers
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    {availableTiers.map((tier) => {
                      const isSelected = applicableTiers.includes(tier);
                      return (
                        <button
                          type="button"
                          key={tier}
                          onClick={() => toggleTier(tier)}
                          className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2A7D5B] text-white border-[#2A7D5B]'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {tier}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Applicable Categories */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Applicable Categories
                </label>
                <div className="flex flex-wrap items-center gap-1.5 p-2 min-h-10 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                  {applicableCategories.length === 0 ? (
                    <span className="text-xs text-slate-400">
                      Select categories (leave empty for all)
                    </span>
                  ) : (
                    applicableCategories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {availableCategories.map((cat) => {
                    const isSelected = applicableCategories.includes(cat);
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {cat}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Leave empty to apply to all categories
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: VALIDITY & METADATA */}
          {activeTab === 'validity' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Valid From
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Valid To
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={validTo}
                      onChange={(e) => {
                        setValidTo(e.target.value);
                        setErrors((prev) => ({ ...prev, validTo: '' }));
                      }}
                      placeholder="dd-mm-yyyy"
                      className={`w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none ${
                        errors.validTo
                          ? 'border-red-500 ring-1 ring-red-500'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#2A7D5B]/30'
                      }`}
                    />
                  </div>
                  {errors.validTo && (
                    <p className="mt-1 text-[11px] text-red-500">{errors.validTo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Points Expiry (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">0 = Never expires</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Expiry Reminder (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2A7D5B]/30"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Days before expiry to send reminder
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-5 rounded-md bg-[#2A7D5B] hover:bg-[#23674b] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
