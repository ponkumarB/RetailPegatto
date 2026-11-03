'use client';

import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: 'select' | 'text' | 'date';
  value: string;
  onChange: (value: string) => void;
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterPopoverProps {
  fields: FilterField[];
  onClear: () => void;
  triggerLabel?: string;
  align?: 'start' | 'center' | 'end';
}

export function FilterPopover({ fields, onClear, triggerLabel = "Filter", align = "end" }: FilterPopoverProps) {
  const hasActiveFilters = fields.some(f => f.value && f.value !== 'All' && f.value !== 'All Owners' && f.value !== 'All Categories' && f.value !== 'All Priority');

  return (
    <Popover>
      <PopoverTrigger render={
        <Button variant="outline" size="sm" className="h-8.5 px-3 text-xs gap-1 border-slate-300 dark:border-slate-700 cursor-pointer rounded-xl font-bold focus:ring-0 focus-visible:ring-0">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>{triggerLabel}</span>
          {hasActiveFilters && (
            <span className="ml-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
          )}
        </Button>
      } />
      <PopoverContent align={align} className="w-80 p-4 bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col gap-3.5 text-left z-50">
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
          <h3 className="font-bold text-xs text-slate-850 dark:text-white uppercase tracking-wider">Filters</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 gap-1 rounded cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" /> Clear All
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">{field.label}</label>
              {field.type === 'select' ? (
                <Select value={field.value} onValueChange={(val) => val && field.onChange(val)}>
                  <SelectTrigger className="w-full h-8.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-left focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600">
                    <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                    {field.options?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === 'date' ? 'date' : 'text'}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  placeholder={field.placeholder || `Enter ${field.label}`}
                  className="h-8.5 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-none"
                />
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
