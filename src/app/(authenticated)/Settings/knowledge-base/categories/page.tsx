'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { useKnowledgeCategoriesList, useDeleteKnowledgeCategory } from '@/service/api/KnowledgeBase/queries';
import { format } from 'date-fns';

export default function KnowledgeCategoriesPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categoriesData, isLoading, isError } = useKnowledgeCategoriesList(currentPage, pageSize);
  const deleteMutation = useDeleteKnowledgeCategory();

  const categories = categoriesData?.results || [];
  const totalCount = categoriesData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null);

  const handleDelete = (id: number, name: string) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Category deleted successfully');
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error('Failed to delete category');
        setDeleteTarget(null);
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 text-left p-1"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/Settings/knowledge-base')}
            className="h-9 w-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Knowledge Categories</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage the categories for your knowledge base articles.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/Settings/knowledge-base/categories/create')}
            style={{ backgroundColor: primaryColor }}
            className="text-white font-semibold rounded-xl h-9 px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create Category
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 p-5 border-b dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search categories..."
              className="pr-9 h-9.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-semibold text-xs rounded-xl focus-visible:ring-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b dark:border-slate-800">
              <TableRow className="border-b dark:border-slate-800 hover:bg-transparent">
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4 w-[50px]">ID</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Name</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Description</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Status</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4">Created On</TableHead>
                <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-4 text-center w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b dark:border-slate-800">
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-lg mx-auto" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-rose-500 font-medium">
                    Failed to load categories. Please try again.
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat: any) => (
                  <TableRow key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 border-b dark:border-slate-800">
                    <TableCell className="font-medium text-slate-500 text-xs py-4">#{cat.id}</TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200 py-4">
                      {cat.Category_Name}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs py-4 truncate max-w-[200px]">
                      {cat.Description}
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className={cat.Is_Active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'}>
                        {cat.Is_Active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs py-4">
                      {cat.Created_Date ? format(new Date(cat.Created_Date), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                            <MoreHorizontal className="h-4.5 w-4.5" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border dark:border-slate-800">
                          <DropdownMenuItem 
                            className="cursor-pointer text-xs font-medium"
                            onClick={() => router.push(`/Settings/knowledge-base/categories/${cat.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer text-xs font-medium text-rose-600 focus:text-rose-700 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                            onClick={() => handleDelete(cat.id, cat.Category_Name)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Category
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="text-slate-900 dark:text-white font-bold">{categories.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to <span className="text-slate-900 dark:text-white font-bold">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="text-slate-900 dark:text-white font-bold">{totalCount}</span> entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-bold"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  className={`h-8 w-8 p-0 rounded-lg text-xs font-bold ${currentPage === i + 1 ? 'text-white' : 'border-slate-200 dark:border-slate-800'}`}
                  style={currentPage === i + 1 ? { backgroundColor: primaryColor } : {}}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-800 text-xs font-bold"
              disabled={currentPage === totalPages || isLoading || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white font-extrabold text-lg">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-semibold text-slate-500">
              This action cannot be undone. This will permanently delete the category 
              <span className="font-bold text-slate-800 dark:text-slate-300"> "{deleteTarget?.name}" </span> 
              and remove it from the knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9.5 rounded-[5px] text-xs font-bold border-slate-200 dark:border-slate-850">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="h-9.5 rounded-[5px] text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
