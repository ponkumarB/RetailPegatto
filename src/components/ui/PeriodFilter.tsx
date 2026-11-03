'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, Info, X, AlertCircle } from 'lucide-react';

export type PeriodPreset =
  | 'Today'
  | 'Yesterday'
  | 'This Week'
  | 'Last Week'
  | 'This Month'
  | 'Last Month'
  | 'This Quarter'
  | 'Last Quarter'
  | 'This Year'
  | 'Last Year'
  | 'Custom';

export interface CustomPreset {
  label: string;
  getRange: () => string;
}

interface PeriodFilterProps {
  value: string;
  period: PeriodPreset | string;
  onChange: (dateRange: string, selectedPeriod: string) => void;
  className?: string;
  style?: React.CSSProperties;
  customPresets?: CustomPreset[];
  hideCustomDate?: boolean;
  dropdownOnly?: boolean;
  defaultRangeLabel?: string;
}

export const parseDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(' ');
  if (parts.length !== 3) return '';
  const day = parts[0].padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = months.indexOf(parts[1]);
  if (monthIdx === -1) return '';
  const month = String(monthIdx + 1).padStart(2, '0');
  const year = parts[2];
  return `${year}-${month}-${day}`;
};

export const formatDateString = (yyyyMmDd: string): string => {
  if (!yyyyMmDd) return '';
  const parts = yyyyMmDd.split('-');
  if (parts.length !== 3) return '';
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[monthIdx];
  const day = String(parseInt(parts[2], 10)).padStart(2, '0');
  return `${day} ${month} ${year}`;
};

export const getPeriodRange = (selectedPeriod: PeriodPreset): string => {
  const today = new Date();

  const formatDate = (d: Date) => {
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  switch (selectedPeriod) {
    case 'Today': {
      return `${formatDate(today)} - ${formatDate(today)}`;
    }
    case 'Yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return `${formatDate(yesterday)} - ${formatDate(yesterday)}`;
    }
    case 'This Week': {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // start on Monday
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    case 'Last Week': {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1) - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    case 'This Month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    case 'Last Month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    case 'This Quarter': {
      const quarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), quarter * 3, 1);
      const end = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    case 'Last Quarter': {
      let quarter = Math.floor(today.getMonth() / 3) - 1;
      let year = today.getFullYear();
      if (quarter < 0) {
        quarter = 3;
        year -= 1;
      }
      const start = new Date(year, quarter * 3, 1);
      const end = new Date(year, (quarter + 1) * 3, 0);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    case 'This Year': {
      const start = new Date(today.getFullYear(), 0, 1);
      const end = new Date(today.getFullYear(), 11, 31);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    case 'Last Year': {
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = new Date(today.getFullYear() - 1, 11, 31);
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    default:
      return '';
  }
};

const presets: PeriodPreset[] = [
  'Today',
  'Yesterday',
  'This Week',
  'Last Week',
  'This Month',
  'Last Month',
  'This Quarter',
  'Last Quarter',
  'This Year',
  'Last Year',
  'Custom',
];

export function PeriodFilter({
  value,
  period,
  onChange,
  className = '',
  customPresets = [],
  hideCustomDate = false,
  dropdownOnly = false,
  defaultRangeLabel,
  style = {}
}: PeriodFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync internal custom date inputs with value prop
  useEffect(() => {
    if (value && value.includes(' - ')) {
      const [startPart = '', endPart = ''] = value.split(' - ');
      const s = parseDateString(startPart);
      const e = parseDateString(endPart);
      setCustomStart(s);
      setCustomEnd(e);
    } else {
      setCustomStart('');
      setCustomEnd('');
    }
  }, [value, period]);

  const handlePresetChange = (presetLabel: string) => {
    if (presetLabel === 'Custom') {
      onChange(value, 'Custom');
      setShowDropdown(false);
      return;
    }

    const custom = customPresets.find(p => p.label === presetLabel);
    if (custom) {
      onChange(custom.getRange(), presetLabel);
      setShowDropdown(false);
      return;
    }

    const calculatedRange = getPeriodRange(presetLabel as PeriodPreset);
    onChange(calculatedRange, presetLabel);
    setShowDropdown(false);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextStart = e.target.value;
    setCustomStart(nextStart);

    if (nextStart && customEnd) {
      if (nextStart <= customEnd) {
        onChange(`${formatDateString(nextStart)} - ${formatDateString(customEnd)}`, 'Custom');
      }
    } else if (!nextStart && !customEnd) {
      onChange('', 'Custom');
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextEnd = e.target.value;
    setCustomEnd(nextEnd);

    if (customStart && nextEnd) {
      if (customStart <= nextEnd) {
        onChange(`${formatDateString(customStart)} - ${formatDateString(nextEnd)}`, 'Custom');
      }
    } else if (!customStart && !nextEnd) {
      onChange('', 'Custom');
    }
  };

  const handleClearCustomDates = () => {
    setCustomStart('');
    setCustomEnd('');
    onChange('', 'Custom');
  };

  const isBothBlank = !customStart && !customEnd;
  const isPartial = (customStart && !customEnd) || (!customStart && customEnd);
  const isInvalid = !!(customStart && customEnd && customStart > customEnd);
  const isValidRange = !!(customStart && customEnd && customStart <= customEnd);

  return (
    <div
      ref={containerRef}
      className={`flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1.5 shadow-xs relative ${className}`}
      style={style}
    >
      <div className="h-7 w-7 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center shrink-0">
        <Calendar className="h-4 w-4 text-slate-500" />
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-xs font-bold px-2 pr-6 text-slate-700 dark:text-slate-200 bg-transparent border-0 p-0 focus:outline-none w-[100px] text-left cursor-pointer flex items-center justify-between"
        >
          <span className="truncate">{period}</span>
          <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 opacity-70" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-3 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-40 text-left text-xs font-bold text-slate-700 dark:text-slate-200 max-h-60 overflow-y-auto">
            {customPresets.length > 0 ? (
              customPresets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePresetChange(p.label)}
                  className={`w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer block ${
                    period === p.label ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''
                  }`}
                >
                  {p.label}
                </button>
              ))
            ) : (
              presets.filter(p => !(hideCustomDate && p === 'Custom')).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePresetChange(p)}
                  className={`w-full px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer block ${
                    period === p ? 'text-blue-600 dark:text-blue-400 font-extrabold' : ''
                  }`}
                >
                  {p}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {!dropdownOnly && (
        <>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

          {period === 'Custom' ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className={`flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-2 py-1 rounded-md border ${
                isInvalid ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}>
                <label htmlFor="custom-from-date" className="text-[10px] font-bold text-slate-400 uppercase select-none">From</label>
                <input
                  id="custom-from-date"
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={handleStartDateChange}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-0 p-0 focus:outline-none w-[105px] cursor-pointer"
                />
              </div>

              <div className={`flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/70 px-2 py-1 rounded-md border ${
                isInvalid ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
              }`}>
                <label htmlFor="custom-to-date" className="text-[10px] font-bold text-slate-400 uppercase select-none">To</label>
                <input
                  id="custom-to-date"
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={handleEndDateChange}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-0 p-0 focus:outline-none w-[105px] cursor-pointer"
                />
              </div>

              {/* Status and feedback badges */}
              {isBothBlank && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap cursor-help"
                  title="Blank values represent the default range"
                >
                  <Info className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>{defaultRangeLabel || 'Default Range (Blank)'}</span>
                </span>
              )}

              {isPartial && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 whitespace-nowrap"
                  title="Both From and To dates are required. Blank values represent the default range."
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>Select {customStart ? 'To' : 'From'} Date</span>
                </span>
              )}

              {isInvalid && (
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 whitespace-nowrap"
                  title="From date cannot be after To date"
                >
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>From date cannot be after To date</span>
                </span>
              )}

              {isValidRange && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 whitespace-nowrap">
                  Active
                </span>
              )}

              {/* Reset to default range button when any date is set */}
              {(customStart || customEnd) && (
                <button
                  type="button"
                  onClick={handleClearCustomDates}
                  title="Reset to default range (blank)"
                  className="h-6 w-6 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center px-2 min-w-[190px]">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap select-none">
                {value}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

