'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useProblems, useDeleteProblem } from '@/service/api/Problem/queries';
import { Problem } from '@/service/api/Problem/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';

export default function ProblemListPage() {
  const router = useRouter();
  const { data, isLoading } = useProblems();
  const deleteMutation = useDeleteProblem();

  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<number | null>(null);

  const columns: ColumnConfig<Problem>[] = [
    { key: 'Problem_Id', header: 'Problem ID' },
    { key: 'Problem_Title', header: 'Title' },
    { key: 'Status', header: 'Status' },
    { key: 'Priority', header: 'Priority' },
    { key: 'Assignment_Group', header: 'Assignment Group' },
  ];

  const handleView = (row: Problem) => {
    setSelectedProblem(row);
    setIsOverviewOpen(true);
  };

  const handleDelete = (row: Problem) => {
    if (!row.id) return;
    setProblemToDelete(row.id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (problemToDelete) {
      deleteMutation.mutate(problemToDelete);
      setIsDeleteDialogOpen(false);
    }
  };

  const renderActions = (row: Problem) => (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleView(row)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 w-10"
        title="Overview"
      >
        <Eye className="w-4 h-4 text-slate-500" />
      </button>
      <button 
        onClick={() => router.push(`/problem-management/problem/${row.id}/edit`)}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Problem Management</h1>
          <p className="text-sm text-slate-500">View and manage system problems and issues.</p>
        </div>
        <Button onClick={() => router.push('/problem-management/problem/create')} className="gap-2">
          <Plus className="h-4 w-4" /> Add New
        </Button>
      </div>

      <ReusableTable 
        data={data?.results || []}
        columns={columns}
        loading={isLoading}
        actions={renderActions}
      />

      {/* Overview Dialog */}
      <Dialog open={isOverviewOpen} onOpenChange={setIsOverviewOpen}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Problem Overview</DialogTitle>
          </DialogHeader>
          
          {selectedProblem && (
            <div className="space-y-4 py-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Problem Title</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Problem_Title || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Problem ID</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Problem_Id}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Status}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Priority</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Priority || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Urgency</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Urgency || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Impact</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Impact || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Assignment Group</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Assignment_Group || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Affected Service</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Affected_Service || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Configuration Item</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedProblem.Configuration_Item || '-'}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">{selectedProblem.Description || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Symptoms</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">{selectedProblem.Symptoms || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Root Cause</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">{selectedProblem.Root_Cause || '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Problem"
        description="Are you sure you want to delete this problem? This action cannot be undone."
      />
    </div>
  );
}
