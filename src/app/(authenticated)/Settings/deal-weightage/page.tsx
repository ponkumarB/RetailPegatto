'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useDealWeightSetups, useDeleteDealWeightSetup } from '@/service/api/Settings/dealWeightage/queries';
import { DealWeightSetup } from '@/service/api/Settings/dealWeightage/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';

export default function DealWeightageListPage() {
  const router = useRouter();
  const { data, isLoading } = useDealWeightSetups();
  const deleteMutation = useDeleteDealWeightSetup();

  const [selectedDeal, setSelectedDeal] = useState<DealWeightSetup | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<number | null>(null);

  const columns: ColumnConfig<DealWeightSetup>[] = [
    { key: 'Weight', header: 'Weight Name' },
    { key: 'Points', header: 'Points' },
    { key: 'values', header: 'Values' },
    { key: 'Deal_State_Name', header: 'Deal State' },
    { key: 'Weightage_Percentage', header: 'Weightage %' },
  ];

  const handleView = (row: DealWeightSetup) => {
    setSelectedDeal(row);
    setIsOverviewOpen(true);
  };

  const handleDelete = (row: DealWeightSetup) => {
    if (!row.id) return;
    setDealToDelete(row.id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (dealToDelete) {
      deleteMutation.mutate(dealToDelete);
    }
  };

  const renderActions = (row: DealWeightSetup) => (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleView(row)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 w-10"
        title="Overview"
      >
        <Eye className="w-4 h-4 text-slate-500" />
      </button>
      <button 
        onClick={() => router.push(`/Settings/deal-weightage/${row.id}/edit`)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 w-10"
        title="Edit"
      >
        <Edit className="w-4 h-4 text-slate-500" />
      </button>
      <button 
        onClick={() => handleDelete(row)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 w-10"
        title="Delete"
      >
        <Trash2 className="w-4 h-4 text-rose-500" />
      </button>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Deal Weight Setup</h1>
          <p className="text-sm text-slate-500">Manage and configure weights for your deals.</p>
        </div>
        <button
          onClick={() => router.push('/Settings/deal-weightage/create')}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 hover:bg-slate-900/90 h-10 px-4 py-2 gap-2"
        >
          <Plus className="h-4 w-4" /> Add New
        </button>
      </div>

      <ReusableTable 
        data={data?.results || []}
        columns={columns}
        loading={isLoading}
        actions={renderActions}
      />

      {/* Overview Dialog */}
      <Dialog open={isOverviewOpen} onOpenChange={setIsOverviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deal Weight Overview</DialogTitle>
          </DialogHeader>
          
          {selectedDeal && (
            <div className="space-y-4 py-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Weight Name</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Weight}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Points</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Points}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Values</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.values || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Order No</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Order_No || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Deal State</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Deal_State_Name || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Weightage %</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Weightage_Percentage || '-'}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedDeal.Description || '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onClose={() => setIsDeleteDialogOpen(false)} 
        onConfirm={confirmDelete}
        itemType="deal weight"
      />
    </div>
  );
}
