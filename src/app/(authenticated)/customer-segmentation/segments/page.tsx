'use client';
import { getTenantName } from '@/service/apiClient';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowLeft,
  Edit2,
  Trash2,
  Sliders,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useCustomerSegmentStore, CustomerSegment } from '@/store/useCustomerSegmentStore';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { NavLink } from '@/components/layout/NavLink';
import { toast } from 'sonner';

export default function CustomerSegmentsPage() {
  const { primaryColor } = useStore();
  const { segments, deleteSegment } = useCustomerSegmentStore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter logic
  const filteredSegments = segments.filter(seg => {
    const matchesSearch = seg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          seg.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || seg.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteSegment(deleteId);
      toast.success('Segment deleted successfully!');
      setDeleteId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left pb-10"
    >
      {/* Breadcrumbs */}
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/">{getTenantName().toUpperCase()}</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<NavLink to="/customer-segmentation">Customer Segmentation</NavLink>} />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Segments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-800 shadow-3xs transition-all duration-300">
        <div className="flex items-center gap-4 text-left">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 border dark:border-slate-800 rounded-xl cursor-pointer"
            onClick={() => router.push('/customer-segmentation')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-blue-650" style={{ color: primaryColor }} />
              Customer Segments List
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage your individual segments, check conditions, and analyze segment performance metrics.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            style={{ backgroundColor: primaryColor }}
            onClick={() => router.push('/customer-segmentation/create')}
            className="text-white text-xs font-bold gap-2 px-4 py-2.5 rounded-xl cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Search & Type Filtering Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-slate-900 p-4 rounded-xl border dark:border-slate-800 shadow-3xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search segments by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs font-semibold h-10 border-slate-200 dark:border-slate-800 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {['All', 'Behavioral', 'Demographic', 'Transactional'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex-1 sm:flex-none px-3.5 py-2 text-xs font-bold rounded-lg border transition-all ${
                selectedType === type
                  ? 'border-blue-500 text-blue-600 bg-blue-50/20'
                  : 'border-slate-200 dark:border-slate-800 text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
              style={selectedType === type ? { borderColor: primaryColor, color: primaryColor } : {}}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Segments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSegments.length > 0 ? (
          filteredSegments.map((segment) => (
            <Card
              key={segment.id}
              className="border border-slate-150 dark:border-slate-850 hover:shadow-md transition-all duration-300 flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl"
            >
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="space-y-1 pr-2">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider mb-1 px-2 py-0.5 rounded-md">
                    {segment.type}
                  </Badge>
                  <CardTitle className="text-base font-extrabold text-slate-850 dark:text-white">
                    {segment.name}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 line-clamp-2">
                    {segment.description}
                  </CardDescription>
                </div>
                <Badge
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md shrink-0 border ${
                    segment.status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800/40'
                      : segment.status === 'Warning'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800/40'
                      : 'bg-slate-500/10 text-slate-400 border-slate-200 dark:border-slate-800/40'
                  }`}
                >
                  {segment.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col justify-between pt-0">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800/40 text-xs font-semibold text-slate-650 dark:text-slate-350 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl px-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">Customers</span>
                    <span className="text-base font-extrabold text-slate-850 dark:text-white">
                      {segment.customersCount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-0.5">% of Total</span>
                    <span className="text-base font-extrabold text-slate-850 dark:text-white">
                      {segment.percentageOfTotal}%
                    </span>
                  </div>
                </div>

                {/* Rules List */}
                <div className="space-y-1.5 flex-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-slate-400" />
                    Segmentation Rules ({segment.rules.length})
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pr-1">
                    {segment.rules.map((rule, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-650 dark:text-slate-300 border dark:border-slate-800 flex items-center gap-1"
                      >
                        <span className="h-1 w-1 rounded-full bg-blue-500" style={{ backgroundColor: primaryColor }} />
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Dates & Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex flex-col">
                    <span>Created: {segment.createdOn}</span>
                    <span>Updated: {segment.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-slate-600 hover:text-blue-600 dark:text-slate-400 rounded-lg cursor-pointer"
                      onClick={() => router.push(`/customer-segmentation/${segment.id}/edit`)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-600 hover:text-rose-600 dark:text-slate-400 rounded-lg cursor-pointer"
                      onClick={() => setDeleteId(segment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-3xs">
            <Info className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-bold">No segments found matching the criteria.</p>
            <Button
              variant="link"
              className="text-xs font-bold mt-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
              style={{ color: primaryColor }}
              onClick={() => {
                setSearchTerm('');
                setSelectedType('All');
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-950 rounded-2xl border dark:border-slate-850 p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Confirm Segment Deletion
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-400 pt-1 leading-relaxed">
              Are you sure you want to delete this segment? This action is permanent, and the customers will be moved back to the unsegmented pool.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="text-xs font-semibold rounded-xl h-9 border-slate-200 dark:border-slate-800"
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl h-9 text-xs px-4"
              onClick={handleDeleteConfirm}
            >
              Delete Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
