'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  Info, 
  GripVertical,
  HelpCircle,
  Check,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { useDealFactorStore } from '@/store/useDealFactorStore';
import {
  fetchDealFactors,
  createDealFactor,
  updateDealFactor,
  deleteDealFactor,
  ApiDealFactor
} from '@/service/api/Settings/deal-factor/api';

// Robust PK helper to handle numbers, string integers, objects, or arrays of items
const getPkValue = (val: any, defaultVal: number = 1): number => {
  if (val === null || val === undefined) return defaultVal;
  if (Array.isArray(val)) {
    if (val.length === 0) return defaultVal;
    return getPkValue(val[0], defaultVal);
  }
  if (typeof val === 'object') {
    return val.id || defaultVal;
  }
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultVal : parsed;
};

export default function DealFactorSetupPage() {
  const router = useRouter();
  const { primaryColor } = useStore();
  const { factors, setFactors, updateFactor, deleteFactor } = useDealFactorStore();
  const [isLoading, setIsLoading] = useState(true);

  // Load factors on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    setIsLoading(true);
    fetchDealFactors(token)
      .then((response) => {
        setFactors(response.results || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch deal factors:', err);
        setIsLoading(false);
        toast.error('Failed to load deal factors from server.');
      });
  }, [setFactors]);

  // Delete Dialog State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [factorIdToDelete, setFactorIdToDelete] = useState<number | null>(null);
  const [factorNameToDelete, setFactorNameToDelete] = useState('');

  const parseAndShowError = (err: any, defaultMsg: string) => {
    console.error(err);
    const msg = err?.message || '';
    if (msg.includes('{') && msg.includes('}')) {
      try {
        const jsonStart = msg.indexOf('{');
        const jsonEnd = msg.lastIndexOf('}');
        const jsonStr = msg.substring(jsonStart, jsonEnd + 1);
        const errObj = JSON.parse(jsonStr);
        Object.entries(errObj).forEach(([key, val]) => {
          const message = Array.isArray(val) ? val.join(', ') : String(val);
          toast.error(`${key}: ${message}`);
        });
        return;
      } catch (e) {
        console.error('Failed to parse error JSON from message:', e);
      }
    }
    toast.error(msg || defaultMsg);
  };

  // Delete Handler
  const handleDeleteFactor = (id: number, name: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    deleteDealFactor(id, token)
      .then(() => {
        deleteFactor(id);
        toast.success(`Factor "${name}" deleted.`);
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to delete factor.');
      });
  };

  // Active status Toggle Switch
  const handleToggleActive = (factor: ApiDealFactor) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || undefined : undefined;
    const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = storedUserId ? parseInt(storedUserId, 10) : 1;

    const updatedPayload = {
      ...factor,
      Active_Flag: !factor.Active_Flag,
      Updated_By: userId,
      Organization_Id: getPkValue(factor.Organization_Id, 1),
      Created_By: getPkValue(factor.Created_By, userId)
    };

    updateDealFactor(updatedPayload, token)
      .then((updated) => {
        updateFactor(factor.id, updated);
        toast.success(`Factor status updated.`);
      })
      .catch((err) => {
        parseAndShowError(err, 'Failed to toggle status.');
      });
  };

  // Get Impact styling helper
  const getImpactStyle = (impact: string) => {
    const imp = (impact || '').toLowerCase();
    if (imp.includes('pos')) {
      return 'text-emerald-600 dark:text-emerald-400 font-bold';
    }
    if (imp.includes('neg')) {
      return 'text-rose-600 dark:text-rose-455 font-bold';
    }
    return 'text-blue-600 dark:text-blue-405 font-bold';
  };

  const handleSaveChanges = () => {
    toast.success('All changes saved to CRM configuration!');
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        
        {/* SKELETON LOADING VIEW */}
        {isLoading && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
          >
            {/* Breadcrumb skeleton */}
            <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />

            {/* Header Title skeleton */}
            <div className="flex justify-between items-center py-2">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl" />
            </div>

            {/* Table skeleton */}
            <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl shadow-2xs overflow-hidden">
              <div className="p-4 border-b dark:border-slate-900 bg-slate-50 dark:bg-slate-900/40">
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
              </div>
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-4 w-1/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                    <div className="h-6 w-12 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* FULL CONTENT VIEW */}
        {!isLoading && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto space-y-6 text-left p-1"
          >
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList className="text-xs font-semibold text-slate-400">
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => router.push('/')} className="cursor-pointer hover:text-slate-600">Settings</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <span className="text-slate-400">Sales</span>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-slate-600 dark:text-slate-350">Deal Factor Setup</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 border-b dark:border-slate-900">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  Deal Factor Setup
                </h1>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Define the factors that influence deal success. These factors will be used to evaluate and score deals.
                </p>
              </div>
              <Button 
                onClick={() => router.push('/Settings/deal-factor-setup/create')}
                style={{ backgroundColor: primaryColor }} 
                className="h-10 px-5 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add Factor
              </Button>
            </div>

            {/* Deal Factors Table Card */}
            <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-2xl shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">Deal Factors</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/70 dark:bg-slate-900/50">
                    <TableRow className="border-b dark:border-slate-900">
                      <TableHead className="w-10 px-4"></TableHead>
                      <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Factor Name</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Description</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Data Type</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-3.5">Impact</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-center">Mandatory</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-center">Active</TableHead>
                      <TableHead className="text-xs font-extrabold uppercase tracking-wider text-slate-400 py-3.5 text-right px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factors.map((factor) => (
                      <TableRow 
                        key={factor.id} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 border-b dark:border-slate-900 transition-colors duration-150"
                      >
                        <TableCell className="px-3 text-slate-350 dark:text-slate-700">
                          <GripVertical className="h-4.5 w-4.5 cursor-grab hover:text-slate-500" />
                        </TableCell>
                        <TableCell className="font-extrabold text-slate-850 dark:text-white py-4 text-xs md:text-sm">
                          {factor.Factor_Name}
                        </TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400 text-xs font-semibold py-4 max-w-sm">
                          {factor.Description}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border border-blue-100 bg-blue-50/50 text-[10px] font-bold text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30">
                            {factor.Data_Type}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-xs font-black">
                          <div className="flex flex-col">
                            <span className={getImpactStyle(factor.Impact)}>{factor.Impact}</span>
                            <span className="text-[10px] text-slate-405 text-slate-400 font-semibold font-mono">({factor.Weight}x)</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex justify-center">
                            {factor.Is_Mandatory ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-current bg-white dark:bg-slate-900 rounded-full" />
                            ) : (
                              <XCircle className="h-5 w-5 text-slate-205 dark:text-slate-700 fill-current bg-white dark:bg-slate-900 rounded-full" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(factor)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                factor.Active_Flag ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  factor.Active_Flag ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right px-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-450 hover:text-slate-700 rounded-lg cursor-pointer"
                              onClick={() => router.push(`/Settings/deal-factor-setup/${factor.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                                  <MoreHorizontal className="h-4.5 w-4.5" />
                                </Button>
                              } />
                              <DropdownMenuContent align="end" className="w-36 dark:bg-slate-900 border dark:border-slate-800 text-xs">
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/Settings/deal-factor-setup/${factor.id}`)}>
                                  Edit Factor
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="cursor-pointer text-rose-500 font-bold" 
                                  onClick={() => {
                                    setFactorIdToDelete(factor.id);
                                    setFactorNameToDelete(factor.Factor_Name);
                                    setIsDeleteOpen(true);
                                  }}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Bottom Info callout & Action Bar */}
            <div className="space-y-4">
              <div className="flex items-start gap-2.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 text-xs font-semibold text-slate-650 dark:text-slate-400 leading-relaxed text-left">
                <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Factors with higher impact have more influence on the overall deal score. You can reorder factors using drag & drop.</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-900">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/Deal')}
                  className="h-10 px-5 text-xs font-bold rounded-xl border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  style={{ backgroundColor: primaryColor }} 
                  className="h-10 px-6 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-all shadow-xs"
                >
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Delete Confirmation Dialog Modal */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <DialogContent className="max-w-md dark:bg-slate-900 border dark:border-slate-800 text-left animate-in fade-in zoom-in-95 duration-200">
                <DialogHeader>
                  <DialogTitle className="dark:text-white font-bold">Delete Deal Factor</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the deal factor "{factorNameToDelete}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="pt-3 gap-2 flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDeleteOpen(false);
                      setFactorIdToDelete(null);
                      setFactorNameToDelete('');
                    }}
                    className="cursor-pointer border-slate-205 dark:border-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="destructive"
                    onClick={() => {
                      if (factorIdToDelete !== null) {
                        handleDeleteFactor(factorIdToDelete, factorNameToDelete);
                      }
                      setIsDeleteOpen(false);
                      setFactorIdToDelete(null);
                      setFactorNameToDelete('');
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    Confirm Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
