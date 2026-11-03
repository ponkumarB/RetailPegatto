'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  triggerClassName?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  id,
  className,
  triggerClassName,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedLabel = useMemo(() => {
    const opt = options.find((o) => o.value === value);
    return opt ? opt.label : '';
  }, [options, value]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const lower = search.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, search]);

  // Calculate portal dropdown position from trigger rect
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight;

    setDropdownStyle({
      position: 'fixed',
      width: rect.width,
      left: rect.left,
      zIndex: 99999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(document.getElementById('searchable-select-portal')?.contains(target))
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Recalculate position on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    const update = () => calculatePosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, calculatePosition]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleOpen = () => {
    calculatePosition();
    setIsOpen((prev) => !prev);
    setSearch('');
  };

  const dropdownPanel = isOpen ? (
    <div
      id="searchable-select-portal"
      style={{ ...dropdownStyle, maxHeight: '220px' }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl overflow-hidden flex flex-col"
    >
      {/* Search input */}
      <div className="p-1.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type to search..."
          className="w-full px-2 py-1.5 text-xs bg-transparent outline-none placeholder:text-slate-400 text-slate-800 dark:text-white"
        />
      </div>
      {/* Options list */}
      <div className="overflow-y-auto flex-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-3 text-xs text-slate-400 text-center">
            No results found
          </div>
        ) : (
          filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={(e) => {
                // Use mousedown so it fires before the outside-click handler
                e.preventDefault();
                onChange(opt.value);
                setIsOpen(false);
                setSearch('');
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                opt.value === value ? 'bg-slate-100 dark:bg-slate-800 font-semibold' : ''
              }`}
            >
              {opt.value === value ? (
                <svg className="h-3.5 w-3.5 shrink-0 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className="truncate text-slate-800 dark:text-slate-200">{opt.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={`relative ${className || ''}`} id={id}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className={triggerClassName || 'flex h-8 w-full items-center justify-between border border-input bg-transparent px-2.5 py-2 text-sm outline-none text-left'}
      >
        <span className={`truncate ${selectedLabel ? 'text-foreground' : 'text-muted-foreground'}`}>
          {selectedLabel || <span className="text-slate-400 font-normal">{placeholder}</span>}
        </span>
        <svg
          className={`ml-1 h-4 w-4 shrink-0 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Render dropdown via portal so it escapes overflow:hidden parents */}
      {typeof window !== 'undefined' && dropdownPanel
        ? createPortal(dropdownPanel, document.body)
        : null}
    </div>
  );
}
