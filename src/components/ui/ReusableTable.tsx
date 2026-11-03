'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripVertical,
  Settings,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from './table';
import { Checkbox } from './checkbox';
import { Button } from './button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface ColumnConfig<T> {
  key: string;
  header?: React.ReactNode;
  label?: React.ReactNode; // alias for header
  sort?: string; // alias for key
  sortable?: boolean;
  draggable?: boolean;
  className?: string;
  sticky?: boolean;
  width?: number; // width in pixels to calculate sticky left offset
  align?: 'left' | 'center' | 'right';
  bool?: boolean; // visibility
  render?: (row: T, index: number) => React.ReactNode;
}

interface ReusableTableProps<T> {
  columns: ColumnConfig<T>[];
  setColumns?: React.Dispatch<React.SetStateAction<ColumnConfig<T>[]>>;
  data?: T[];
  setData?: React.Dispatch<React.SetStateAction<T[]>>;
  renderCell?: (row: T, column: ColumnConfig<T>) => React.ReactNode;
  actions?: (row: T) => React.ReactNode;
  actionsHeader?: React.ReactNode;
  stickyHeader?: boolean;
  showGear?: boolean;
  bgColor?: string;
  color?: string;
  fontWeight?: string;
  title?: string;
  selectable?: boolean;
  selectedRows?: T[];
  onRowSelectChange?: (selectedRows: T[]) => void;
  rowKey?: string;

  // Pagination props
  initialPageSize?: number;
  className?: string;
  headerActions?: React.ReactNode;
  enableSelection?: boolean;
  selectedRowIds?: any[];
  onSelectionChange?: (selectedRows: T[]) => void;
  rowIdKey?: string;
  onRowClick?: (row: T, index: number, e: React.MouseEvent) => void;
  rowClassName?: string | ((row: T, index: number) => string);

  // Server-side pagination support
  page?: number;
  totalRecords?: number;
  onChangePage?: (page: number) => void;
  pageSize?: number;
  onChangePageSize?: (pageSize: number) => void;

  // Custom footer row (for summary rows)
  footerRow?: React.ReactNode;

  // Loading state
  loading?: boolean;

  // Borderless style
  borderless?: boolean;
  style?: React.CSSProperties;
  showPageSizeSelector?: boolean;
}

export function ReusableTable<T extends Record<string, any>>({
  columns,
  setColumns,
  data = [],
  setData,
  renderCell,
  actions,
  actionsHeader = 'Action',
  stickyHeader = true,
  showGear = true,
  bgColor,
  color,
  fontWeight,
  title = 'Records',
  selectable = false,
  selectedRows = [],
  onRowSelectChange,
  rowKey = 'id',

  initialPageSize = 10,
  className,
  headerActions,
  enableSelection = false,
  selectedRowIds,
  onSelectionChange,
  rowIdKey = 'id',
  onRowClick,
  rowClassName,

  page,
  totalRecords,
  onChangePage,
  pageSize: propPageSize,
  onChangePageSize,
  footerRow,
  loading = false,
  borderless = false,
  style,
  showPageSizeSelector = true,
}: ReusableTableProps<T>) {
  // Support both internal states or external controllers
  const [localColumns, setLocalColumns] = useState<ColumnConfig<T>[]>(columns);
  const activeColumns = setColumns ? columns : localColumns;
  const updateColumns = (cols: ColumnConfig<T>[]) => {
    if (setColumns) {
      setColumns(cols);
    } else {
      setLocalColumns(cols);
    }
  };

  const [localData, setLocalData] = useState<T[]>(data);
  const activeData = setData ? data : localData;
  const updateData = (d: T[]) => {
    if (setData) {
      setData(d);
    } else {
      setLocalData(d);
    }
  };

  // Sync state with props
  useEffect(() => {
    if (!setData) {
      setLocalData(data);
    }
  }, [data, setData]);

  useEffect(() => {
    if (!setColumns) {
      setLocalColumns(columns);
    }
  }, [columns, setColumns]);

  // Selection logic wrapper
  const isSelectableActive = enableSelection || selectable;
  const activeRowIdKey = rowIdKey || rowKey || 'id';

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<any>>(new Set());

  // Keep selection in sync
  useEffect(() => {
    const nextSet = selectedRowIds
      ? new Set(selectedRowIds)
      : new Set((selectedRows || []).map((r) => r[activeRowIdKey]));

    const areDifferent = selectedIds.size !== nextSet.size ||
      ![...selectedIds].every(val => nextSet.has(val));

    if (areDifferent) {
      setSelectedIds(nextSet);
    }
  }, [selectedRowIds, selectedRows, activeRowIdKey, selectedIds]);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(propPageSize !== undefined ? propPageSize : initialPageSize);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (propPageSize !== undefined) {
      setPageSize(propPageSize);
    }
  }, [propPageSize]);

  // Drag and Drop Row states
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);

  // Drag and Drop Column states
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null);

  // Row Drag handlers
  const handleRowDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRowIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRowDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedRowIndex === null || draggedRowIndex === targetIndex) return;

    let localDragIdx = draggedRowIndex;
    let localTargetIdx = targetIndex;

    if (isServerSide) {
      const pageOffset = (activeCurrentPage - 1) * pageSize;
      localDragIdx = draggedRowIndex - pageOffset;
      localTargetIdx = targetIndex - pageOffset;
    }

    const reorderedData = [...activeData];
    if (localDragIdx < 0 || localDragIdx >= reorderedData.length || localTargetIdx < 0 || localTargetIdx >= reorderedData.length) {
      return;
    }

    const [draggedItem] = reorderedData.splice(localDragIdx, 1);
    reorderedData.splice(localTargetIdx, 0, draggedItem);

    updateData(reorderedData);
    setDraggedRowIndex(null);
  };

  // Column Drag handlers
  const handleColDragStart = (e: React.DragEvent, index: number) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleColDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetIndex) return;

    // Map visibleColumns indices to activeColumns indices
    const draggedCol = visibleColumns[draggedColIndex];
    const targetCol = visibleColumns[targetIndex];
    if (!draggedCol || !targetCol) return;

    const draggedActiveIdx = activeColumns.findIndex(
      (c) => (c.sort || c.key) === (draggedCol.sort || draggedCol.key)
    );
    const targetActiveIdx = activeColumns.findIndex(
      (c) => (c.sort || c.key) === (targetCol.sort || targetCol.key)
    );

    if (draggedActiveIdx === -1 || targetActiveIdx === -1) return;

    const reorderedCols = [...activeColumns];
    const [draggedItem] = reorderedCols.splice(draggedActiveIdx, 1);
    reorderedCols.splice(targetActiveIdx, 0, draggedItem);

    updateColumns(reorderedCols);
    setDraggedColIndex(null);
  };

  // Visibility Filter
  const visibleColumns = useMemo(() => {
    return activeColumns.filter((col) => col.bool !== false);
  }, [activeColumns]);

  // Calculate offsets for sticky columns (shifting right if selection checkbox is present)
  const columnOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let currentLeft = isSelectableActive ? 40 : 0; // Checkbox column takes 40px width
    visibleColumns.forEach((col) => {
      if (col.sticky) {
        const keyName = col.sort || col.key;
        offsets[keyName] = currentLeft;
        currentLeft += col.width || 120; // fallback width
      }
    });
    return offsets;
  }, [visibleColumns, isSelectableActive]);

  // Find the last sticky column key to add right border/shadow
  const lastStickyKey = useMemo(() => {
    let lastKey = '';
    visibleColumns.forEach((col) => {
      if (col.sticky) {
        lastKey = col.sort || col.key;
      }
    });
    return lastKey;
  }, [visibleColumns]);

  // Handle Sorting logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    if (setData) {
      const sorted = [...activeData];
      sorted.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (aStr < bStr) return direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return direction === 'asc' ? 1 : -1;
        return 0;
      });
      setData(sorted);
    }
  };

  // Sort data locally if not server-side sorted
  const sortedData = useMemo(() => {
    if (setData) return activeData; // parent sorting
    if (!sortConfig) return activeData;

    const sorted = [...activeData];
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();

      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [activeData, sortConfig, setData]);

  // Check if pagination is server-side vs. local client-side
  const isServerSide = totalRecords !== undefined || onChangePage !== undefined;
  const activeCurrentPage = isServerSide ? (page || 1) : currentPage;
  const activeTotalRecords = isServerSide ? (totalRecords || 0) : sortedData.length;
  const activeTotalPages = Math.ceil(activeTotalRecords / pageSize) || 1;

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (isServerSide) {
      return sortedData; // Server already sliced it
    }
    const startIndex = (activeCurrentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, activeCurrentPage, pageSize, isServerSide]);

  // Row Selection logic
  const isAllSelected = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every((row) => selectedIds.has(row[activeRowIdKey]));
  }, [paginatedData, selectedIds, activeRowIdKey]);

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedIds);
    paginatedData.forEach((row) => {
      const id = row[activeRowIdKey];
      if (checked) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
    });
    setSelectedIds(newSelected);

    const selectedRowsList = activeData.filter((row) => newSelected.has(row[activeRowIdKey]));
    onSelectionChange?.(selectedRowsList);
    onRowSelectChange?.(selectedRowsList);
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    const id = row[activeRowIdKey];
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);

    const selectedRowsList = activeData.filter((row) => newSelected.has(row[activeRowIdKey]));
    onSelectionChange?.(selectedRowsList);
    onRowSelectChange?.(selectedRowsList);
  };

  const handlePageChange = (newPage: number) => {
    if (isServerSide && onChangePage) {
      onChangePage(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className={cn("space-y-4 w-full relative", className)}>
      {/* Top Header Actions (Only rendered if passed) */}
      {headerActions && (
        <div className="flex items-center justify-end gap-2">
          {headerActions}
        </div>
      )}

      {/* Main Table Card wrapper */}
      <div className={cn(
        !borderless && "bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-xs",
        "overflow-hidden"
      )} style={{ borderRadius: '5px', ...style }}>
        <Table className={cn(stickyHeader && "relative")}>
          <TableHeader className="bg-[#f8fafc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <TableRow className="hover:bg-transparent border-0">
              {/* Optional Selection Checkbox Header */}
              {isSelectableActive && (
                <TableHead
                  className="w-10 p-0 sticky left-0 z-30 bg-[#f8fafc] dark:bg-slate-900 border-r dark:border-slate-850"
                  style={{ left: 0 }}
                >
                  <div className="flex items-center justify-center w-10 h-10">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className="border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 data-checked:bg-blue-600 data-checked:border-blue-600 data-checked:text-white"
                    />
                  </div>
                </TableHead>
              )}

              {visibleColumns?.map((column, idx) => {
                const keyName = column.sort || column.key;
                const isActionCol = keyName === 'actions' || keyName === 'action' || column.header === 'Actions' || column.label === 'Actions';
                const isSortable = column.sortable !== false && !isActionCol;
                const isDraggable = column.draggable !== false && !isActionCol;

                return (
                  <TableHead
                    key={`${keyName}-${idx}`}
                    draggable={isDraggable}
                    onDragStart={isDraggable ? (e) => handleColDragStart(e, idx) : undefined}
                    onDragOver={isDraggable ? handleColDragOver : undefined}
                    onDrop={isDraggable ? (e) => handleColDrop(e, idx) : undefined}
                    className={cn(
                      "text-xs font-bold text-[#335384] dark:text-slate-200 py-3 px-3 uppercase tracking-wider select-none",
                      isSortable && "cursor-pointer hover:text-[#1e3a66] dark:hover:text-white transition-colors",
                      column.sticky && "sticky z-20 bg-[#f8fafc] dark:bg-slate-900 backdrop-blur-xs",
                      column.sticky && keyName === lastStickyKey && "border-r dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                      draggedColIndex === idx && "opacity-40 bg-slate-100 dark:bg-slate-800",
                      column.className
                    )}
                    style={{
                      backgroundColor: bgColor || undefined,
                      color: color || undefined,
                      fontWeight: fontWeight || undefined,
                      ...(column.sticky ? {
                        left: `${columnOffsets[keyName]}px`,
                        width: column.width ? `${column.width}px` : undefined,
                        minWidth: column.width ? `${column.width}px` : undefined
                      } : {})
                    }}
                  >
                    <div
                      className="flex items-center gap-1.5 flex-nowrap"
                      onClick={(e) => {
                        if (isSortable) {
                          handleSort(keyName);
                        }
                      }}
                    >
                      <GripVertical className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 cursor-grab active:cursor-grabbing shrink-0" />
                      <span className="whitespace-nowrap">{column.header || column.label || ''}</span>
                      {isSortable && (
                        <ArrowUpDown className={cn(
                          "h-3.5 w-3.5 transition-colors opacity-80 shrink-0",
                          sortConfig?.key === keyName ? "text-[#335384] dark:text-blue-400 opacity-100" : "text-slate-400 dark:text-slate-500"
                        )} />
                      )}
                    </div>
                  </TableHead>
                );
              })}

              {actions && (
                <TableHead className="w-24 text-center py-3 text-xs font-bold text-[#335384] dark:text-slate-200 uppercase tracking-wider">
                  {actionsHeader || 'ACTIONS'}
                </TableHead>
              )}

              {/* Action/Gear configuration Column Header */}
              {showGear && (
                <TableHead className="w-12 text-center p-0 sticky right-0 bg-slate-50 dark:bg-slate-955/90 border-l dark:border-slate-850 z-20">
                  <div className="relative flex items-center justify-center h-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                        >
                          <Settings className="h-4.5 w-4.5" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-60 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-3 z-50 text-left">
                        <div className="pb-2 mb-2 border-b dark:border-slate-800">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Choose Columns</h4>
                        </div>
                        <div className="space-y-1.5 max-h-60 overflow-y-auto">
                          {activeColumns.map((column, index) => (
                            <label
                              key={`${column.sort || column.key}-${index}`}
                              className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer select-none"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={column.bool !== false}
                                onCheckedChange={() => {
                                  const updated = [...activeColumns];
                                  updated[index] = {
                                    ...updated[index],
                                    bool: column.bool === false ? true : false,
                                  };
                                  updateColumns(updated);
                                }}
                                className="border-slate-300 dark:border-slate-750"
                              />
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                                {typeof column.header === 'string' ? column.header : (typeof column.label === 'string' ? column.label : column.key.replace(/[-_]/g, ' '))}
                              </span>
                            </label>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100 dark:divide-slate-850">
            {loading ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumns.length + (isSelectableActive ? 1 : 0) + (actions ? 1 : 0)}
                  className="py-12 text-center text-xs font-semibold text-slate-505 dark:text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedData?.length > 0 ? (
              paginatedData?.map((row, rowIndex) => {
                const absoluteIndex = (activeCurrentPage - 1) * pageSize + rowIndex;
                const isSelected = selectedIds.has(row[activeRowIdKey]);
                const rowCls = typeof rowClassName === 'function' ? rowClassName(row, rowIndex) : rowClassName;
                return (
                  <TableRow
                    key={`${row[activeRowIdKey] || 'row'}-${absoluteIndex}`}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, absoluteIndex)}
                    onDragOver={handleRowDragOver}
                    onDrop={(e) => handleRowDrop(e, absoluteIndex)}
                    onClick={(e) => onRowClick?.(row, absoluteIndex, e)}
                    className={cn(
                      "group hover:bg-slate-50/50 dark:hover:bg-slate-955/10 transition-colors border-slate-100 dark:border-slate-850",
                      isSelected && "bg-blue-50/30 dark:bg-blue-950/10",
                      onRowClick && "cursor-pointer",
                      draggedRowIndex === absoluteIndex && "opacity-40 bg-slate-100 dark:bg-slate-800",
                      rowCls
                    )}
                  >
                    {/* Optional Selection Checkbox Cell */}
                    {isSelectableActive && (
                      <TableCell
                        className="w-10 p-0 sticky left-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50/70 dark:group-hover:bg-slate-955/70 border-r dark:border-slate-850"
                        style={{ left: 0 }}
                      >
                        <div className="flex items-center justify-center w-10 h-10">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectRow(row, checked)}
                            onClick={(e) => e.stopPropagation()} // Prevent triggering onRowClick
                            className="border-slate-300 dark:border-slate-750 bg-white dark:bg-slate-900 data-checked:bg-blue-600 data-checked:border-blue-600 data-checked:text-white"
                          />
                        </div>
                      </TableCell>
                    )}

                    {visibleColumns?.map((column, colIdx) => {
                      const isSticky = column.sticky;
                      const keyName = column.sort || column.key;
                      return (
                        <TableCell
                          key={`${keyName}-${colIdx}`}
                          className={cn(
                            "py-3 text-xs font-bold text-slate-700 dark:text-slate-200",
                            colIdx !== 0 && "pl-4",
                            isSticky && "sticky z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50/70 dark:group-hover:bg-slate-955/70 transition-colors",
                            isSticky && keyName === lastStickyKey && "dark:border-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                            column.className
                          )}
                          style={isSticky ? { left: `${columnOffsets[keyName]}px`, width: column.width ? `${column.width}px` : undefined, minWidth: column.width ? `${column.width}px` : undefined } : undefined}
                        >
                          <div className="flex flex-row items-center w-full min-w-0">
                            {colIdx === 0 && (
                              <span className="inline-flex items-center mr-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-455">
                                <GripVertical className="h-3 w-3 inline" />
                              </span>
                            )}
                            {column.render
                              ? column.render(row, absoluteIndex)
                              : renderCell
                                ? renderCell(row, column)
                                : row[column.sort || column.key] !== undefined && row[column.sort || column.key] !== null
                                  ? String(row[column.sort || column.key])
                                  : '-'}
                          </div>
                        </TableCell>
                      );
                    })}

                    {/* Actions Column Cell */}
                    {actions && (
                      <TableCell className="w-28 text-center p-2.5">
                        {actions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={visibleColumns.length + (isSelectableActive ? 1 : 0) + (actions ? 1 : 0)}
                  className="h-28 text-center text-xs font-semibold text-slate-400 dark:text-slate-500"
                >
                  {title || 'No entries found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {footerRow && (
            <tfoot className="border-t bg-slate-50/40 dark:bg-slate-900/20 font-bold border-slate-100 dark:border-slate-800">
              {footerRow}
            </tfoot>
          )}
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-1">
        {showPageSizeSelector ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs font-semibold text-slate-555 dark:text-slate-400">
            {!isServerSide || onChangePageSize ? (
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    if (onChangePageSize) {
                      onChangePageSize(newSize);
                    }
                    handlePageChange(1);
                  }}
                  className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-lg py-0.5 px-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
                >
                  {[5, 10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span>Rows per page: {pageSize}</span>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(1)}
            disabled={activeCurrentPage === 1 || loading}
            className="h-8 w-8 border dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            style={{ borderRadius: '5px' }}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(Math.max(activeCurrentPage - 1, 1))}
            disabled={activeCurrentPage === 1 || loading}
            className="h-8 w-8 border dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            style={{ borderRadius: '5px' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center text-xs font-bold px-3 text-slate-700 dark:text-slate-300">
            Page {activeCurrentPage} of {activeTotalPages}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(Math.min(activeCurrentPage + 1, activeTotalPages))}
            disabled={activeCurrentPage === activeTotalPages || loading}
            className="h-8 w-8 border dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            style={{ borderRadius: '5px' }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(activeTotalPages)}
            disabled={activeCurrentPage === activeTotalPages || loading}
            className="h-8 w-8 border dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            style={{ borderRadius: '5px' }}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
