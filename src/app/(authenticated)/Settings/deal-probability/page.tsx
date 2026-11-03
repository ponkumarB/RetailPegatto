'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { useDealProbabilities, useDeleteDealProbability } from '@/service/api/Settings/dealProbability/queries';
import { DealProbability } from '@/service/api/Settings/dealProbability/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { toast } from 'sonner';

export default function DealProbabilityListPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useDealProbabilities();
  const deleteMutation = useDeleteDealProbability();

  const [selectedDeal, setSelectedDeal] = useState<DealProbability | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<number | null>(null);

  const columns: ColumnConfig<DealProbability>[] = [
    { key: 'Stage_Name', header: 'Stage Name' },
    { key: 'Probability', header: 'Probability (%)' },
    { key: 'Forecast_Type', header: 'Forecast Type' },
    { key: 'Description', header: 'Description' },
    { key: 'Created_Date', header: 'Created Date' },
  ];

  const handleView = (row: DealProbability) => {
    setSelectedDeal(row);
    setIsOverviewOpen(true);
  };

  const handleEdit = (row: DealProbability) => {
    router.push(`/Settings/deal-probability/${row.id}/edit`);
  };

  const handleDelete = (row: DealProbability) => {
    if (!row.id) return;
    setDealToDelete(row.id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (dealToDelete) {
      deleteMutation.mutate(dealToDelete);
    }
  };

  const renderActions = (row: DealProbability) => (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="icon" onClick={() => handleView(row)}>
        <Eye className="h-4 w-4 text-blue-500" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleEdit(row)}>
        <Edit2 className="h-4 w-4 text-emerald-500" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleDelete(row)}>
        <Trash2 className="h-4 w-4 text-rose-500" />
      </Button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Deal Probability</h1>
          <p className="text-sm text-slate-500">Manage pipeline stages and forecast probability.</p>
        </div>
        <Button onClick={() => router.push('/Settings/deal-probability/create')} className="gap-2">
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>

      <ReusableTable
        columns={columns}
        data={data?.results || []}
        loading={isLoading}
        actions={renderActions}
      />

      {/* Overview Dialog */}
      <Dialog open={isOverviewOpen} onOpenChange={setIsOverviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deal Probability Overview</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4 py-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Stage Name</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Stage_Name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Probability</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Probability}%</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Forecast Type</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Forecast_Type}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedDeal.Description || 'No description provided.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Created Date</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedDeal.Created_Date}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Updated Date</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedDeal.Updated_Date}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        itemType="deal probability stage"
      />
    </div>
  );
}
