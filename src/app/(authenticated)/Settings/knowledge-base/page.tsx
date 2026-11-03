'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  BookOpen,
  FolderOpen,
  Eye,
  ThumbsUp,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Info,
  Globe,
  Lock,
  CheckCircle2,
  FileCode2,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import {
  useKnowledgeCategoriesAll,
  useKnowledgeArticlesList,
  useKnowledgeArticlesSearch,
  useKnowledgeArticlesFilter,
  useKnowledgeArticlesAll,
  useUpdateKnowledgeArticle,
  useDeleteKnowledgeArticle
} from '@/service/api/KnowledgeBase/queries';

const CATEGORIES_MOCK = [
  { name: 'All Categories', count: 128 },
  { name: 'Getting Started', count: 15 },
  { name: 'Leads', count: 18 },
  { name: 'Call Management', count: 22 },
  { name: 'Customers', count: 12 },
  { name: 'Projects', count: 10 },
  { name: 'Sales', count: 14 },
  { name: 'Reports', count: 13 },
  { name: 'Settings', count: 8 },
  { name: 'Troubleshooting', count: 16 }
];

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { primaryColor, user } = useStore();

  const {
    canViewKnowledgeBaseOverview,
    canCreateKnowledgeBase,
    canEditKnowledgeBase,
    canDeleteKnowledgeBase,
    isLoaded
  } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewKnowledgeBaseOverview) {
      toast.error('You do not have permission to view Knowledge Base.');
      router.push('/');
    }
  }, [canViewKnowledgeBaseOverview, isLoaded, router]);

  const { data: categoriesData, isLoading: isLoadingCategories } = useKnowledgeCategoriesAll();
  const categoriesList = categoriesData || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | 'All Categories'>('All Categories');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // React Query Hooks
  const isSearchActive = searchQuery.trim().length > 0;
  const filterPayload: any = {};
  if (statusFilter !== 'ALL') filterPayload.Status = statusFilter;
  if (visibilityFilter !== 'ALL') filterPayload.Visibility = visibilityFilter;
  // If we wanted to filter by category ID:
  if (categoryFilter !== 'All Categories') filterPayload.Category_Id = categoryFilter;

  const isFilterActive = Object.keys(filterPayload).length > 0;

  const { data: listData, isLoading: isLoadingList } = useKnowledgeArticlesList(currentPage, itemsPerPage);
  const { data: searchData, isLoading: isLoadingSearch } = useKnowledgeArticlesSearch(searchQuery);
  const { data: filterData, isLoading: isLoadingFilter } = useKnowledgeArticlesFilter(filterPayload);
  const { data: allArticlesData } = useKnowledgeArticlesAll();

  const existingArticles: any[] = useMemo(() => {
    if (!allArticlesData) return [];
    if (Array.isArray(allArticlesData)) return allArticlesData;
    if (Array.isArray(allArticlesData.results)) return allArticlesData.results;
    if (Array.isArray(allArticlesData.data)) return allArticlesData.data;
    return [];
  }, [allArticlesData]);

  const updateMutation = useUpdateKnowledgeArticle();
  const deleteMutation = useDeleteKnowledgeArticle();

  let activeData = listData;
  let isLoadingArticles = isLoadingList;

  if (isSearchActive) {
    activeData = searchData;
    isLoadingArticles = isLoadingSearch;
  } else if (isFilterActive) {
    activeData = filterData;
    isLoadingArticles = isLoadingFilter;
  }

  const paginatedArticles = activeData?.results || [];
  const totalCount = activeData?.count || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;

  // Dialog State
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string | number, title: string } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<number | ''>('');
  const [formTags, setFormTags] = useState('');
  const [formStatus, setFormStatus] = useState<'Published' | 'Draft'>('Published');
  const [formVisibility, setFormVisibility] = useState<'Public' | 'Internal'>('Public');
  const [formContent, setFormContent] = useState('');

  // Derived KPI Stats (mocked stats for now since we don't fetch all articles for KPIs)
  const stats = useMemo(() => {
    return {
      published: totalCount > 0 ? totalCount + 120 : 120, // Example fallback stats
      categories: Math.max(categoriesList.length, 12),
      views: 3500,
      helpful: 1000,
      drafts: 7
    };
  }, [totalCount, categoriesList]);

  // Actions
  const handleOpenView = (article: any) => {
    setSelectedArticle(article);
    // incrementViews(article.id);
    setIsViewOpen(true);
  };

  const handleOpenEdit = (article: any) => {
    setSelectedArticle(article);
    setFormTitle(article.Title);
    setFormCategory(article.Category_Id);

    // Parse tags back to string
    const tagsArr: string[] = [];
    if (article.Tags) {
      for (const key in article.Tags) {
        tagsArr.push(article.Tags[key]);
      }
    }
    setFormTags(tagsArr.join(', '));
    setFormStatus(article.Status);
    setFormVisibility(article.Visibility);
    setFormContent(article.Content);
    setIsEditOpen(true);
  };

  // Check duplicate title in real-time when editing
  const trimmedEditTitle = formTitle.trim();
  const isDuplicateTitleOnEdit = useMemo(() => {
    if (!trimmedEditTitle || !selectedArticle) return false;
    return existingArticles.some(
      (art: any) =>
        art.id !== selectedArticle.id &&
        (art.Title || art.title || '')
          .trim()
          .toLowerCase() === trimmedEditTitle.toLowerCase()
    );
  }, [trimmedEditTitle, selectedArticle, existingArticles]);

  const handleEditArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArticle) return;
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error('Title and content cannot be empty.');
      return;
    }
    if (isDuplicateTitleOnEdit) {
      toast.error(`An article with the title "${formTitle.trim()}" already exists. Please choose a unique title.`);
      return;
    }

    const authUserId = Number(
      (typeof window !== 'undefined' && localStorage.getItem('userId')) ||
      (user?.id ? Number(user.id) : 110)
    ) || 110;

    const tagsArr = formTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const tagsObj = tagsArr.reduce((acc, tag, i) => {
      acc[`tag${i + 1}`] = tag;
      return acc;
    }, {} as Record<string, string>);

    updateMutation.mutate({
      id: selectedArticle.id,
      Category_Id: formCategory !== '' ? formCategory : undefined,
      Title: formTitle,
      Content: formContent,
      Tags: Object.keys(tagsObj).length > 0 ? tagsObj : { tag1: "basics" },
      Status: formStatus,
      Visibility: formVisibility,
      Attachment: selectedArticle.Attachment || [],
      Updated_By: authUserId
    }, {
      onSuccess: () => {
        setIsEditOpen(false);
        toast.success(`Article updated successfully.`);
      },
      onError: () => toast.error('Failed to update article')
    });
  };

  const handleDeleteArticle = (id: string | number, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Article deleted.');
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error('Failed to delete article');
        setDeleteTarget(null);
      }
    });
  };

  const handleHelpfulVote = (id: string | number) => {
    // incrementHelpful(id);
    toast.success('Thanks for your feedback!');
  };

  if (isLoaded && !canViewKnowledgeBaseOverview) {
    return null;
  }

  return (
    <div className="w-full text-slate-800 dark:text-slate-200">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header and Breadcrumbs */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-xs transition-all duration-300">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Knowledge Base</h1>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-xs">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/Settings" className="text-xs">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Knowledge Base</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-3">
            {canCreateKnowledgeBase && (
              <Button
                onClick={() => router.push('/Settings/knowledge-base/create')}
                style={{ backgroundColor: primaryColor }}
                className="text-white font-bold rounded-sm h-9 px-4 active:scale-95 transition-all text-xs cursor-pointer border-0 shadow-xs hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-1" /> Create New Article
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Articles', value: stats.published, icon: BookOpen, bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-100 dark:border-blue-900/20', color: 'text-blue-600 dark:text-blue-400', desc: 'Published' },
            { label: 'Categories', value: stats.categories, icon: FolderOpen, bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-100 dark:border-emerald-900/20', color: 'text-emerald-600 dark:text-emerald-400', desc: 'Active' },
            { label: 'Total Views', value: stats.views, icon: Eye, bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-100 dark:border-amber-900/20', color: 'text-amber-600 dark:text-amber-400', desc: 'This Month' },
            { label: 'Helpful Votes', value: stats.helpful, icon: ThumbsUp, bg: 'bg-indigo-50 dark:bg-indigo-950/20', border: 'border-indigo-100 dark:border-indigo-900/20', color: 'text-indigo-600 dark:text-indigo-400', desc: 'This Month' },
            { label: 'Draft Articles', value: stats.drafts, icon: FileText, bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-100 dark:border-rose-900/20', color: 'text-rose-600 dark:text-rose-400', desc: 'Not Published' }
          ].map(card => (
            <div key={card.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4.5 flex items-center gap-4 hover:shadow-xs transition-all duration-300">
              <div className={`h-11 w-11 rounded-2xl ${card.bg} border ${card.border} flex items-center justify-center shrink-0`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">{card.value.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Toolbar */}
        <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search articles by title, keyword or tags..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 h-10 text-xs font-semibold bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="w-44 text-xs font-semibold">
                <Select value={statusFilter} onValueChange={(val) => {
                  setStatusFilter(val || 'ALL');
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="h-10 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 border dark:border-slate-850">
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-44 text-xs font-semibold">
                <Select value={visibilityFilter} onValueChange={(val) => {
                  setVisibilityFilter(val || 'ALL');
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="h-10 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs">
                    <SelectValue placeholder="All Visibility" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 border dark:border-slate-850">
                    <SelectItem value="ALL">All Visibility</SelectItem>
                    <SelectItem value="Public">Public (External)</SelectItem>
                    <SelectItem value="Internal">Internal (Private)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All Categories');
                  setStatusFilter('ALL');
                  setVisibilityFilter('ALL');
                  setCurrentPage(1);
                  toast.success('Filters cleared.');
                }}
                variant="outline"
                className="h-10 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold gap-1 text-slate-500 hover:text-blue-600"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Columns Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left panel: Categories List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Categories</h3>
              </div>
              <CardContent className="p-3 space-y-1">
                {isLoadingCategories ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setCategoryFilter('All Categories');
                        setCurrentPage(1);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[5px] text-xs font-semibold transition-all ${categoryFilter === 'All Categories'
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold border-l-4 border-blue-500'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                    >
                      <span>All Categories</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryFilter === 'All Categories' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        -
                      </span>
                    </button>
                    {categoriesList.map((cat: any) => {
                      const isActive = categoryFilter === cat.Category_Name;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setCategoryFilter(cat.Category_Name);
                            setCurrentPage(1);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-[5px] text-xs font-semibold transition-all ${isActive
                              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold border-l-4 border-blue-500'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                        >
                          <span className="truncate pr-2">{cat.Category_Name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                            -
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/Settings/knowledge-base/categories')}
                    className="w-full text-xs font-bold text-slate-500 hover:text-blue-600 gap-1 rounded-[5px]"
                  >
                    View All Categories
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Articles grid/table */}
          <div className="lg:col-span-3">
            <Card className="border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Knowledge Base Articles</h2>
                  <Badge variant="outline" className="h-5 px-2 text-[10px] bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold">
                    {totalCount} entries
                  </Badge>
                </div>
              </div>

              <div className="overflow-x-auto text-left">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5 w-10 text-center">#</th>
                      <th className="px-5 py-3.5 min-w-[220px]">Article Title</th>
                      <th className="px-5 py-3.5 w-40">Category</th>
                      <th className="px-5 py-3.5">Tags</th>
                      <th className="px-5 py-3.5 w-24 text-center">Status</th>
                      <th className="px-5 py-3.5 w-32">Last Updated</th>
                      <th className="px-5 py-3.5 w-20 text-center">Views</th>
                      <th className="px-5 py-3.5 w-24 text-center">Helpful</th>
                      <th className="px-5 py-3.5 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-350">
                    {isLoadingArticles ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-5 py-4"><Skeleton className="h-4 w-4" /></td>
                          <td className="px-5 py-4">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </td>
                          <td className="px-5 py-4"><Skeleton className="h-5 w-20 rounded-[5px]" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-5 py-4 text-center"><Skeleton className="h-5 w-16 rounded-[5px] mx-auto" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                          <td className="px-5 py-4"><Skeleton className="h-6 w-12 rounded-[5px] mx-auto" /></td>
                          <td className="px-5 py-4 text-center"><Skeleton className="h-7 w-7 rounded-[5px] mx-auto" /></td>
                        </tr>
                      ))
                    ) : paginatedArticles.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="h-32 text-center text-slate-450 font-semibold">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <HelpCircle className="h-8 w-8 text-slate-300" />
                            <span>No knowledge articles found.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedArticles.map((article, idx) => {
                        const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                        return (
                          <tr key={article.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/10 transition-colors">
                            <td className="px-5 py-4 text-center text-slate-400 font-mono">{rowNumber}</td>
                            <td className="px-5 py-4">
                              <div className="space-y-0.5">
                                <button
                                  onClick={() => handleOpenView(article)}
                                  className="text-xs font-extrabold text-blue-600 dark:text-blue-450 hover:underline block text-left"
                                >
                                  {article.Title}
                                </button>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                                  {article.Visibility === 'Public' ? (
                                    <>
                                      <Globe className="h-3 w-3 text-emerald-500" />
                                      <span>Public</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3 text-amber-500" />
                                      <span>Internal Only</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span>{article.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/20 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                {categoriesList.find((c: any) => c.id === article.Category_Id)?.Category_Name || 'Unknown Category'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1">
                                {article.Tags && Object.values(article.Tags).map((tag: any) => (
                                  <span key={tag} className="inline-flex items-center px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[9px] font-semibold">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-bold uppercase tracking-wide border ${article.Status === 'Published'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/20'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                }`}>
                                {article.Status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-450 font-mono font-medium">{article.Updated_Date ? new Date(article.Updated_Date).toLocaleDateString('en-GB') : 'N/A'}</td>
                            <td className="px-5 py-4 text-center font-mono font-bold">{article.Views}</td>
                            <td className="px-5 py-4 text-center">
                              <button
                                // onClick={() => handleHelpfulVote(article.id)}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[5px] border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-all text-[10px]"
                              >
                                <ThumbsUp className="h-3 w-3 text-slate-400" />
                                <span>{article.Helpful_Count}</span>
                              </button>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-[5px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 border border-transparent">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                } />
                                <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-[5px] text-xs font-semibold">
                                  <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleOpenView(article)}>
                                    <Eye className="h-3.5 w-3.5 text-slate-500" /> View Article
                                  </DropdownMenuItem>
                                  {canEditKnowledgeBase && (
                                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleOpenEdit(article)}>
                                      <Edit className="h-3.5 w-3.5 text-blue-500" /> Edit Article
                                    </DropdownMenuItem>
                                  )}
                                  {canDeleteKnowledgeBase && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="cursor-pointer gap-2 text-rose-600 dark:text-rose-450 font-bold" onClick={() => handleDeleteArticle(article.id, article.Title)}>
                                        <Trash2 className="h-3.5 w-3.5" /> Delete Article
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              <div className="border-t border-slate-150 dark:border-slate-800 px-6 py-4 flex items-center justify-between text-xs font-semibold text-slate-505 bg-slate-50/20 dark:bg-slate-955/5">
                <p className="text-[11px] font-bold text-slate-400">
                  Showing {totalCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
                </p>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7.5 w-7.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={currentPage === i + 1 ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-7.5 px-2.5 rounded-[5px] text-[10px] font-bold transition-all ${currentPage === i + 1
                          ? 'text-white bg-blue-600 hover:bg-blue-700 shadow-none border border-transparent'
                          : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7.5 w-7.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* EDIT ARTICLE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl dark:bg-slate-900 border dark:border-slate-800 text-left rounded-[5px]">
          <form onSubmit={handleEditArticle} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white font-extrabold">Edit Article</DialogTitle>
              <DialogDescription>Modify article metadata and detailed instructions.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs font-semibold text-slate-500">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Article Title *</label>
                  {isDuplicateTitleOnEdit && (
                    <span className="text-[10px] font-semibold text-rose-500">
                      Title already exists
                    </span>
                  )}
                </div>
                <Input
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className={`h-9.5 rounded-[5px] border ${
                    isDuplicateTitleOnEdit
                      ? 'border-rose-500 focus-visible:ring-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955'
                  }`}
                  required
                />
                {isDuplicateTitleOnEdit && (
                  <p className="text-[11px] font-medium text-rose-500 flex items-center gap-1.5 pt-0.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    An article with this title already exists. Please choose a unique title.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <Select value={formCategory ? formCategory.toString() : ''} onValueChange={(val: any) => setFormCategory(Number(val))}>
                    <SelectTrigger className="h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <SelectValue placeholder="Select Category">
                        {formCategory ? categoriesList.find((c: any) => c.id === formCategory)?.Category_Name : 'Select Category'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-855">
                      {categoriesList.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.Category_Name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibility</label>
                  <Select value={formVisibility} onValueChange={(val: any) => setFormVisibility(val)}>
                    <SelectTrigger className="h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-855">
                      <SelectItem value="Public">Public (External)</SelectItem>
                      <SelectItem value="Internal">Internal (Private)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <Select value={formStatus} onValueChange={(val: any) => setFormStatus(val)}>
                    <SelectTrigger className="h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 border dark:border-slate-855">
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tags (comma separated)</label>
                  <Input
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    className="h-9.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Article Content *</label>
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  rows={6}
                  className="w-full text-xs font-semibold p-2.5 rounded-[5px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="h-9.5 rounded-[5px]" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9.5 rounded-[5px] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: primaryColor }}
                disabled={updateMutation.isPending || isDuplicateTitleOnEdit}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* VIEW ARTICLE DETAILS DIALOG */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl dark:bg-slate-900 border dark:border-slate-800 text-left rounded-[5px]">
          {selectedArticle && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>{selectedArticle.id}</span>
                  <span>•</span>
                  <span>{categoriesList.find((c: any) => c.id === selectedArticle.Category_Id)?.Category_Name || 'Unknown Category'}</span>
                  <span>•</span>
                  <span className={`inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border ${selectedArticle.Status === 'Published' ? 'text-emerald-700 border-emerald-100 dark:text-emerald-400' : 'text-slate-500 border-slate-200 dark:text-slate-500'
                    }`}>
                    {selectedArticle.Status}
                  </span>
                </div>
                <DialogTitle className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white pt-1">
                  {selectedArticle.Title}
                </DialogTitle>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 pt-2 border-b dark:border-slate-800 pb-3">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> {selectedArticle.Visibility} Visibility
                  </span>
                  <span>•</span>
                  <span>Last Updated: {selectedArticle.Updated_Date ? new Date(selectedArticle.Updated_Date).toLocaleDateString('en-GB') : 'N/A'}</span>
                  <span>•</span>
                  <span>{selectedArticle.Views} Views</span>
                </div>
              </DialogHeader>

              <div className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {selectedArticle.Content?.split('\n').map((paragraph: string, i: number) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t dark:border-slate-800">
                {selectedArticle.Tags && Object.values(selectedArticle.Tags).map((tag: any) => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-xs font-bold">
                    #{tag}
                  </span>
                ))}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Was this article helpful?</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-[5px] border border-slate-200 dark:border-slate-850 gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"
                  // onClick={() => handleHelpfulVote(selectedArticle.id)}
                  >
                    <ThumbsUp className="h-3.5 w-3.5 text-blue-500" />
                    <span>Yes, helpful ({selectedArticle.Helpful_Count})</span>
                  </Button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button className="h-8 rounded-[5px] text-xs font-bold text-white bg-blue-600 hover:bg-blue-700" onClick={() => setIsViewOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[5px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white font-extrabold text-lg">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-semibold text-slate-500">
              This action cannot be undone. This will permanently delete the article
              <span className="font-bold text-slate-800 dark:text-slate-300"> "{deleteTarget?.title}" </span>
              and remove it from the knowledge base.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9.5 rounded-[5px] text-xs font-bold border-slate-200 dark:border-slate-850">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="h-9.5 rounded-[5px] text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Article'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
