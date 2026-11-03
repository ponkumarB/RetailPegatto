import React from 'react';
import { RefreshCw } from 'lucide-react';
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

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemType?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you absolutely sure?",
  description,
  itemType = "item",
  isLoading = false
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent className="bg-white dark:bg-slate-900 border dark:border-slate-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900 dark:text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500 dark:text-slate-400">
            {description || `This action cannot be undone. This will permanently delete the ${itemType} and remove it from our servers.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              if (isLoading) {
                e.preventDefault();
                return;
              }
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-rose-600 hover:bg-rose-700 text-white border-transparent disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
