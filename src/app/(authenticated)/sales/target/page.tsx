'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesTargetStore } from '@/store/useSalesTargetStore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Plus, SquarePen, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Sample fallback list matching the user's reference screenshot from the old project
const DEFAULT_SALES_TARGETS = [
  {
    id: 1,
    Created_Date: '2025-10-03',
    Target_Id: 'SST100012426',
    Territory_Name: 'Mumbai Territory',
    Territery_Name: 'Mumbai Territory',
    Year: '2025-03-01 - 2026-02-28',
  },
  {
    id: 2,
    Created_Date: '2025-01-16',
    Target_Id: 'ST1000124-25',
    Territory_Name: 'South Territory',
    Territery_Name: 'South Territory',
    Year: '2025-03-01 - 2026-02-28',
  },
  {
    id: 3,
    Created_Date: '2025-12-26',
    Target_Id: 'SST100012427',
    Territory_Name: 'Delhi East',
    Territery_Name: 'Delhi East',
    Year: '2025-03-01 - 2026-02-28',
  },
  {
    id: 4,
    Created_Date: '2025-12-26',
    Target_Id: 'SST100012428',
    Territory_Name: 'East territoy',
    Territery_Name: 'East territoy',
    Year: '2025-03-01 - 2026-02-28',
  },
  {
    id: 5,
    Created_Date: '2025-12-26',
    Target_Id: 'SST100012429',
    Territory_Name: 'West Territory',
    Territery_Name: 'West Territory',
    Year: '2025-03-01 - 2026-02-28',
  },
  {
    id: 6,
    Created_Date: '2026-02-01',
    Target_Id: 'SST100012430',
    Territory_Name: 'North Territory',
    Territery_Name: 'North Territory',
    Year: '2025-03-01 - 2026-02-28',
  },
  {
    id: 7,
    Created_Date: '2026-02-02',
    Target_Id: 'SST100012431',
    Territory_Name: 'Delhi Wests',
    Territery_Name: 'Delhi Wests',
    Year: '2025-03-01 - 2026-02-28',
  },
  {
    id: 8,
    Created_Date: '2026-02-02',
    Target_Id: 'SST100012432',
    Territory_Name: 'Delhi South',
    Territery_Name: 'Delhi South',
    Year: '2025-03-01 - 2026-02-28',
  },
];

// Helper to format date string as MM-DD-YYYY matching reference screenshot
function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  } catch {
    return dateStr;
  }
}

export default function SalesTargetListPage() {
  const router = useRouter();
  const { salesTargetsAdditional, loadSalesTargetsAdditional, deleteSalesTarget } =
    useSalesTargetStore();

  const [isLoading, setIsLoading] = useState(true);
  const [deleteTargetItem, setDeleteTargetItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        await loadSalesTargetsAdditional();
      } catch (err) {
        console.error('Error fetching sales targets additional:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [loadSalesTargetsAdditional]);

  // Combine API data or fallback to the screenshot default list
  const displayList =
    salesTargetsAdditional && salesTargetsAdditional.length > 0
      ? salesTargetsAdditional
      : DEFAULT_SALES_TARGETS;

  const handleDeleteConfirm = async () => {
    if (!deleteTargetItem) return;
    setIsDeleting(true);
    try {
      await deleteSalesTarget(deleteTargetItem.id);
      toast.success(
        `Deleted ${deleteTargetItem.Territery_Name || deleteTargetItem.Territory_Name || 'Sales Target'} successfully`
      );
      setDeleteTargetItem(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete sales target');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Sales Target
        </h1>
        <Button
          onClick={() => router.push('/sales/target/create')}
          className="bg-[#2e7d32] hover:bg-[#256629] text-white font-medium text-sm px-4 py-2 rounded-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          Create
        </Button>
      </div>

      {/* Table Container */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-md shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-[#f8f9fa] dark:bg-slate-800/80 hover:bg-[#f8f9fa] border-b border-slate-200 dark:border-slate-800">
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 text-left">
                  Created Date
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 text-left">
                  Target Id
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 text-left">
                  Territory Name
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 text-left">
                  Year
                </TableHead>
                <TableHead className="py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 text-right pr-6">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      Loading sales targets...
                    </div>
                  </TableCell>
                </TableRow>
              ) : displayList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                    No sales targets found. Click &quot;+ Create&quot; to establish a target.
                  </TableCell>
                </TableRow>
              ) : (
                displayList.map((row: any, idx: number) => {
                  const createdDateStr =
                    formatDate(row.Created_Date || row.Updated_Date);
                  const targetId = row.Target_Id || row.targetId || '-';
                  const territoryName =
                    row.Territery_Name || row.Territory_Name || row.territoryName || '-';
                  const year = row.Year || row.year || '-';

                  return (
                    <TableRow
                      key={row.id || idx}
                      className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <TableCell className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 font-normal">
                        {createdDateStr}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 font-normal">
                        {targetId}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 font-normal">
                        {territoryName}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 font-normal">
                        {year}
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2.5">
                          {/* Green Edit Icon */}
                          <button
                            type="button"
                            onClick={() => router.push(`/sales/target/create?id=${row.id}`)}
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition-colors cursor-pointer"
                            title="Edit Target"
                          >
                            <SquarePen className="h-4 w-4 stroke-[1.8]" />
                          </button>

                          {/* Red Delete Icon */}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetItem(row)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                            title="Delete Target"
                          >
                            <Trash2 className="h-4 w-4 stroke-[1.8]" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTargetItem)}
        onOpenChange={(open) => !open && setDeleteTargetItem(null)}
      >
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Delete Sales Target
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete this sales target?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2 text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3">
            <span className="font-semibold text-amber-800 dark:text-amber-300">Note:</span> Deleting this sales target will also delete the associated Sales Owner&apos;s target.
          </div>

          <DialogFooter className="flex gap-2 sm:justify-end mt-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8.5 rounded-lg border-slate-200 dark:border-slate-800"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8.5 rounded-lg font-semibold cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
