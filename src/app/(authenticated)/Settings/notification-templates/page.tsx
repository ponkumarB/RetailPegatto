'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Mail,
  Smartphone,
  Bell,
  Edit,
  Trash2,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { NavLink } from '@/components/layout/NavLink';
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
import { useNotificationTemplateList, useDeleteNotificationTemplate } from '@/service/api/NotificationTemplates/queries';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function NotificationTemplatesList() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: listResponse, isLoading } = useNotificationTemplateList();
  const deleteMutation = useDeleteNotificationTemplate();

  const templates = listResponse?.results || [];

  const filteredTemplates = templates.filter((t: any) =>
    t.Template_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.Module?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
        }
      });
    }
  };

  const renderChannelIcons = (channels: string[] = []) => {
    return (
      <div className="flex items-center gap-1.5">
        {channels.includes('Email') && (
          <div title="Email" className="h-6 w-6 rounded flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
            <Mail className="h-3.5 w-3.5" />
          </div>
        )}
        {channels.includes('SMS') && (
          <div title="SMS" className="h-6 w-6 rounded flex items-center justify-center bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
            <Smartphone className="h-3.5 w-3.5" />
          </div>
        )}
        {channels.includes('In-App') && (
          <div title="In-App" className="h-6 w-6 rounded flex items-center justify-center bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50">
            <Bell className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <NavLink to="/Settings" className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">Settings</NavLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold text-slate-800 dark:text-slate-200">Notification Templates</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Notification Templates</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage templates for Email, SMS, and In-App notifications.
          </p>
        </div>

        <Button
          onClick={() => router.push('/Settings/notification-templates/create')}
          style={{ backgroundColor: primaryColor }}
          className="hover:opacity-90 transition-opacity font-bold rounded-xl h-10 px-4"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      {/* Main Content */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardContent className="p-0">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg text-sm focus-visible:ring-1 focus-visible:ring-slate-400"
              />
            </div>
            
            <Button variant="outline" className="w-full sm:w-auto h-10 border-slate-200 dark:border-slate-800">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 hover:bg-transparent border-b-slate-100 dark:border-b-slate-800">
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-11 pl-6">Template Name</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-11">Module</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-11">Type</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-11">Channels</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-11">Status</TableHead>
                  <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-11">Last Updated</TableHead>
                  <TableHead className="h-11 w-[60px] text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-slate-100 dark:border-slate-800">
                      <TableCell className="py-4 pl-6"><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-slate-500">
                      No notification templates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((t: any) => (
                    <TableRow key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-[13px]">{t.Template_Name}</span>
                          <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">{t.Subject}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px]">
                          {t.Module}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.Notification_Type}</span>
                      </TableCell>
                      <TableCell>
                        {renderChannelIcons(t.Channels)}
                      </TableCell>
                      <TableCell>
                        <Badge className={t.Status === 'Active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-none'}>
                          {t.Status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {t.Updated_Date ? format(new Date(t.Updated_Date), 'MMM dd, yyyy') : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-40 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg">
                            <DropdownMenuItem 
                              className="font-medium text-xs cursor-pointer py-2"
                              onClick={() => router.push(`/Settings/notification-templates/${t.id}`)}
                            >
                              <Edit className="mr-2 h-3.5 w-3.5" /> Edit Template
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="font-medium text-xs text-rose-600 focus:text-rose-600 cursor-pointer py-2"
                              onClick={() => setDeleteId(t.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Template</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to delete this notification template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-lg font-bold border-slate-200 dark:border-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="rounded-lg font-bold bg-rose-600 hover:bg-rose-700 text-white border-none shadow-sm"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
