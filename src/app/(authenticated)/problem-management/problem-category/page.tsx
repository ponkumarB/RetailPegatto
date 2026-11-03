'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useProblemCategories, useDeleteProblemCategory } from '@/service/api/ProblemCategory/queries';
import { ProblemCategory } from '@/service/api/ProblemCategory/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { Button } from '@/components/ui/button';

export default function ProblemCategoryListPage() {
  const router = useRouter();
  const { data, isLoading } = useProblemCategories();
  const deleteMutation = useDeleteProblemCategory();

  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  const columns: ColumnConfig<ProblemCategory>[] = [
    { key: 'ProblemCategory_Id', header: 'ID' },
    { key: 'Category_Name', header: 'Name' },
    { key: 'Category_Code', header: 'Code' },
    { key: 'Parent_Category', header: 'Parent Category' },
    { key: 'Status', header: 'Status' },
    { key: 'Display_Order', header: 'Display Order' },
  ];

  const handleView = (row: ProblemCategory) => {
    setSelectedCategory(row);
    setIsOverviewOpen(true);
  };

  const handleDelete = (row: ProblemCategory) => {
    if (!row.id) return;
    setCategoryToDelete(row.id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete);
      setIsDeleteDialogOpen(false);
    }
  };

  const renderActions = (row: ProblemCategory) => (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleView(row)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-slate-100 hover:text-slate-900 h-10 w-10"
        title="Overview"
      >
        <Eye className="w-4 h-4 text-slate-500" />
      </button>
      <button 
        onClick={() => router.push(`/problem-management/problem-category/${row.id}/edit`)}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Problem Categories</h1>
          <p className="text-sm text-slate-500">View and manage categories used for system problems.</p>
        </div>
        <Button onClick={() => router.push('/problem-management/problem-category/create')} className="gap-2">
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
            <DialogTitle>Category Overview</DialogTitle>
          </DialogHeader>
          
          {selectedCategory && (
            <div className="space-y-4 py-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Category Name</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.Category_Name || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Category ID</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.ProblemCategory_Id}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Category Code</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.Category_Code || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Parent Category</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.Parent_Category || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Status</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.Status}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Associated Service</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.Associated_Service || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Default Priority</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.Default_Priority || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Impact</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.Impact || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase">Affects Business Process</span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{selectedCategory.Affects_Business_Process || '-'}</p>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">{selectedCategory.Description || '-'}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Notes</span>
                <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 whitespace-pre-wrap">{selectedCategory.Notes || '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
      />
    </div>
  );
}
