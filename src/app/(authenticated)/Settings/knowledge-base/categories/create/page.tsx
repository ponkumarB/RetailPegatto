'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { toast } from 'sonner';
import { useStore } from '@/store/useStore';
import { useCreateKnowledgeCategory } from '@/service/api/KnowledgeBase/queries';

export default function CreateCategoryPage() {
  const router = useRouter();
  const { primaryColor, user } = useStore();
  const createMutation = useCreateKnowledgeCategory();

  const [formData, setFormData] = useState({
    Category_Name: '',
    Description: '',
    Is_Active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Category_Name.trim()) {
      toast.error('Category Name is required');
      return;
    }

    const authUserId = Number(
      (typeof window !== 'undefined' && localStorage.getItem('userId')) ||
      (user?.id ? Number(user.id) : 110)
    ) || 110;

    const payload = {
      Category_Name: formData.Category_Name,
      Description: formData.Description,
      Is_Active: formData.Is_Active,
      Is_Deleted: false,
      Created_By: authUserId,
      Updated_By: authUserId,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Category created successfully');
        router.push('/Settings/knowledge-base/categories');
      },
      onError: (error) => {
        console.error('Failed to create category:', error);
        toast.error('Failed to create category');
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6 text-left p-1"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/Settings/knowledge-base/categories')}
            className="h-9 w-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create Category</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Add a new category to organize your knowledge base.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="Category_Name" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Category Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="Category_Name"
              placeholder="e.g. IT Support"
              value={formData.Category_Name}
              onChange={(e) => setFormData({ ...formData, Category_Name: e.target.value })}
              className="h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Description" className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Description
            </Label>
            <Textarea
              id="Description"
              placeholder="Describe what goes into this category..."
              value={formData.Description}
              onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
              className="min-h-[120px] resize-y bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Active Status</Label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Determine if this category is visible in the knowledge base.
              </p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              checked={formData.Is_Active}
              onChange={(e) => setFormData({ ...formData, Is_Active: e.target.checked })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/Settings/knowledge-base/categories')}
              className="h-10 px-6 rounded-xl border-slate-200 dark:border-slate-800 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              style={{ backgroundColor: primaryColor }}
              className="h-10 px-6 rounded-xl text-white font-bold hover:opacity-90 transition-opacity"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {createMutation.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
