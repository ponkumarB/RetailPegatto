'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Globe,
  Lock,
  Plus,
  ArrowLeft,
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import {
  useKnowledgeCategoriesAll,
  useCreateKnowledgeArticle,
  useKnowledgeArticlesAll
} from '@/service/api/KnowledgeBase/queries';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CreateArticlePage() {
  const router = useRouter();
  const { primaryColor, user } = useStore();

  const { data: categoriesData, isLoading: isLoadingCategories } = useKnowledgeCategoriesAll();
  const { data: allArticlesData } = useKnowledgeArticlesAll();
  const createMutation = useCreateKnowledgeArticle();
  const categoriesList = categoriesData || [];

  // Existing articles list for frontend duplicate check
  const existingArticles: any[] = React.useMemo(() => {
    if (!allArticlesData) return [];
    if (Array.isArray(allArticlesData)) return allArticlesData;
    if (Array.isArray(allArticlesData.results)) return allArticlesData.results;
    if (Array.isArray(allArticlesData.data)) return allArticlesData.data;
    return [];
  }, [allArticlesData]);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<number | ''>('');
  const [formTags, setFormTags] = useState('');
  const [formStatus, setFormStatus] = useState<'Draft' | 'Published'>('Draft');
  const [formVisibility, setFormVisibility] = useState<'Public' | 'Internal'>('Public');
  const [formContent, setFormContent] = useState('');

  // Check duplicate title in real-time
  const trimmedTitle = formTitle.trim();
  const isDuplicateTitle = React.useMemo(() => {
    if (!trimmedTitle) return false;
    return existingArticles.some(
      (art: any) =>
        (art.Title || art.title || '')
          .trim()
          .toLowerCase() === trimmedTitle.toLowerCase()
    );
  }, [trimmedTitle, existingArticles]);

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Please enter both an article title and content.');
      return;
    }
    if (isDuplicateTitle) {
      toast.error(`An article with the title "${formTitle.trim()}" already exists. Please choose a unique title.`);
      return;
    }
    if (formCategory === '') {
      toast.error('Please select a category.');
      return;
    }

    const authUserId = Number(
      (typeof window !== 'undefined' && localStorage.getItem('userId')) ||
      (user?.id ? Number(user.id) : 110)
    ) || 110;

    const tagsArr = formTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
      
    const tagsObj = tagsArr.reduce((acc, tag, i) => {
      acc[`tag${i + 1}`] = tag;
      return acc;
    }, {} as Record<string, string>);

    const payload = {
      Category_Id: Number(formCategory),
      Title: formTitle,
      Content: formContent,
      Tags: Object.keys(tagsObj).length > 0 ? tagsObj : { tag1: "admin" },
      Views: 0,
      Helpful_Count: 0,
      Status: formStatus,
      Visibility: formVisibility,
      Attachment: [],
      Created_By: authUserId,
      Updated_By: authUserId
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(`Article "${formTitle}" created successfully.`);
        router.push('/Settings/knowledge-base');
      },
      onError: (error) => {
        console.error('Failed to create article:', error);
        toast.error('Failed to create article');
      }
    });
  };

  return (
    <div className="w-full text-slate-800 dark:text-slate-200">
      <div className="max-w-[1000px] mx-auto space-y-6 text-left p-1">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList className="text-xs font-semibold text-slate-400">
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push('/Settings')} className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push('/Settings/knowledge-base')} className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200">Knowledge Base</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-600 dark:text-slate-350">Create Article</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push('/Settings/knowledge-base')}
                className="h-8 w-8 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
              </button>
              <div className="h-9 w-9 rounded-[5px] bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-450" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Create New Article
              </h1>
            </div>
            <p className="text-muted-foreground text-xs font-medium pl-20">
              Publish a new guide, FAQ, or troubleshooting document.
            </p>
          </div>
        </div>

        {/* Creation Form Card */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleCreateArticle} className="space-y-6">
              <div className="space-y-4 text-xs font-semibold text-slate-500">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Article Title *
                    </label>
                    {isDuplicateTitle && (
                      <span className="text-[10px] font-semibold text-rose-500">
                        Title already exists
                      </span>
                    )}
                  </div>
                  <Input
                    placeholder="e.g. How to Reset Password"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className={`h-10 rounded-[5px] border ${
                      isDuplicateTitle
                        ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200'
                    } font-medium`}
                    required
                  />
                  {isDuplicateTitle && (
                    <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1.5 pt-0.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      An article with this title already exists. Please choose a unique title to avoid duplicate records.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category *</label>
                    {isLoadingCategories ? (
                      <Skeleton className="h-10 w-full rounded-[5px]" />
                    ) : (
                      <Select value={formCategory ? formCategory.toString() : ''} onValueChange={(val) => setFormCategory(Number(val))}>
                        <SelectTrigger className="h-10 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium text-slate-800 dark:text-slate-200">
                          <SelectValue placeholder="Select Category">
                            {formCategory ? categoriesList.find((c: any) => c.id === formCategory)?.Category_Name : 'Select Category'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="dark:bg-slate-900 border dark:border-slate-850 text-xs">
                          {categoriesList.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>{cat.Category_Name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibility</label>
                    <Select value={formVisibility} onValueChange={(val: any) => setFormVisibility(val || 'Public')}>
                      <SelectTrigger className="h-10 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 font-medium text-slate-800 dark:text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 border dark:border-slate-850 text-xs">
                        <SelectItem value="Public">Public (External)</SelectItem>
                        <SelectItem value="Internal">Internal (Private)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                    <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val || 'Published')}>
                      <SelectTrigger className="h-10 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 font-medium text-slate-800 dark:text-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-900 border dark:border-slate-850 text-xs">
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags (comma separated)</label>
                  <Input
                    placeholder="e.g. basics, reset, help"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    className="h-10 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 font-medium text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Article Content *</label>
                  <textarea
                    placeholder="Enter detailed article instructions or guide content..."
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    rows={12}
                    className="w-full text-xs font-semibold p-3 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500 transition-colors font-medium leading-relaxed"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-6 border-t dark:border-slate-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto h-10 px-6 font-bold rounded-[5px]"
                  onClick={() => router.push('/Settings/knowledge-base')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto h-10 px-6 font-bold text-white rounded-[5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                  disabled={createMutation.isPending || isDuplicateTitle}
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {createMutation.isPending ? 'Publishing...' : 'Publish Article'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
