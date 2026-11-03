'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Plus, Users, Search, Trash2, Eye, Pencil, RefreshCw, Briefcase, Calendar, CheckCircle, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useStore } from '@/store/useStore';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBenchManagementList,
  fetchBenchManagementDashboard,
  filterBenchManagement,
  searchBenchManagement,
  deleteBenchRecord
} from '@/service/api/BenchManagement/api';
import { BenchRecord } from '@/types/bench-management';
import { ReusableTable, ColumnConfig } from '@/components/ui/ReusableTable';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { usePermission } from '@/hooks/usePermission';

export default function BenchManagementPage() {
  const { primaryColor } = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canViewBenchManagementOverview, canCreateBenchManagement, canEditBenchManagement, canDeleteBenchManagement, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded && !canViewBenchManagementOverview) {
      toast.error('You do not have permission to view this page.');
      router.push('/');
    }
  }, [canViewBenchManagementOverview, isLoaded, router]);

  if (isLoaded && !canViewBenchManagementOverview) {
    return null;
  }

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [skillsFilter, setSkillsFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  // Temporary Dialog states
  const [tempDept, setTempDept] = useState('');
  const [tempDesignation, setTempDesignation] = useState('');
  const [tempSkills, setTempSkills] = useState('');
  const [tempAvailability, setTempAvailability] = useState('');
  const [tempLocation, setTempLocation] = useState('');

  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const [recordToDelete, setRecordToDelete] = useState<{ id: string; name: string } | null>(null);

  // Sync temp filters when dialog opens
  useEffect(() => {
    if (isFilterDialogOpen) {
      setTempDept(deptFilter);
      setTempDesignation(designationFilter);
      setTempSkills(skillsFilter);
      setTempAvailability(availabilityFilter);
      setTempLocation(locationFilter);
    }
  }, [isFilterDialogOpen, deptFilter, designationFilter, skillsFilter, availabilityFilter, locationFilter]);

  // Check if filters are active
  const isFilterActive = useMemo(() => {
    return deptFilter.trim() !== '' || designationFilter.trim() !== '' || skillsFilter.trim() !== '' || availabilityFilter.trim() !== '' || locationFilter.trim() !== '';
  }, [deptFilter, designationFilter, skillsFilter, availabilityFilter, locationFilter]);

  // Query: Main Bench records list
  const { data: rawData, isLoading } = useQuery({
    queryKey: ['benchRecords', searchQuery, deptFilter, designationFilter, skillsFilter, availabilityFilter, locationFilter, isFilterActive],
    queryFn: async () => {
      if (searchQuery.trim().length > 0) {
        return searchBenchManagement(searchQuery.trim());
      }
      if (isFilterActive) {
        const payload = {
          Department: deptFilter,
          Designation: designationFilter,
          Skills: skillsFilter,
          Availability: availabilityFilter,
          Location: locationFilter
        };
        return filterBenchManagement(payload);
      }
      return fetchBenchManagementList();
    },
    refetchOnWindowFocus: false,
  });

  // Query: Dashboard statistics
  const { data: dashboardData } = useQuery({
    queryKey: ['benchDashboard'],
    queryFn: fetchBenchManagementDashboard,
    refetchOnWindowFocus: false,
  });

  // Resolve list of records
  const benchRecords = useMemo(() => {
    const list = Array.isArray(rawData) ? rawData : (rawData?.results || rawData?.data || []);
    return list as BenchRecord[];
  }, [rawData]);

  // Derived KPIs with backup calculation from local records if API yields empty dashboard
  const kpis = useMemo(() => {
    const d = dashboardData?.data || dashboardData || {};
    
    // Check if API returns dashboard values, else calculate from local list
    const total = Number(d.total_bench ?? d.total ?? benchRecords.length);
    const active = Number(d.active_bench ?? d.active ?? benchRecords.filter(r => r.Bench_Status === 'Active').length);
    const available = Number(d.available_now ?? d.available ?? benchRecords.filter(r => r.Availability === 'Available Now').length);
    const highPriority = Number(d.high_priority ?? d.high ?? benchRecords.filter(r => r.Allocation_Priority === 'High').length);

    return { total, active, available, highPriority };
  }, [dashboardData, benchRecords]);

  // Filter memoized state unique values list removed as they are text fields

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBenchRecord(id),
    onSuccess: () => {
      toast.success('Bench record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['benchRecords'] });
      queryClient.invalidateQueries({ queryKey: ['benchDashboard'] });
      setRecordToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete bench record');
    }
  });

  const handleClearFilters = () => {
    setSearchQuery('');
    setDeptFilter('');
    setDesignationFilter('');
    setSkillsFilter('');
    setAvailabilityFilter('');
    setLocationFilter('');
    queryClient.invalidateQueries({ queryKey: ['benchRecords'] });
  };

  const handleView = (record: BenchRecord) => {
    router.push(`/administration/bench-management/${record.id}`);
  };

  const columns: ColumnConfig<BenchRecord>[] = [
    {
      key: 'Employee_Name',
      header: 'Employee Name',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col text-left">
          <span className="font-bold text-slate-800 dark:text-slate-200">{row.Employee_Name}</span>
          <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">{row.Designation}</span>
        </div>
      )
    },
    {
      key: 'Employee_Code',
      header: 'Employee Code',
      sortable: true,
      render: (row) => <span className="font-mono text-xs">{row.Employee_Code}</span>
    },
    {
      key: 'Department',
      header: 'Department',
      sortable: true,
    },
    {
      key: 'Skills',
      header: 'Skills',
      render: (row) => {
        if (!row.Skills) return <span className="text-slate-400">—</span>;
        const skillsArray = row.Skills.split(',').map(s => s.trim()).filter(Boolean);
        const maxVisible = 3;
        const visibleSkills = skillsArray.slice(0, maxVisible);
        const remainingCount = skillsArray.length - maxVisible;

        return (
          <div className="flex flex-wrap gap-1 w-[220px]" onClick={(e) => e.stopPropagation()}>
            {visibleSkills.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0.5 font-medium whitespace-nowrap bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                {skill}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 font-bold whitespace-nowrap bg-primary/5 text-primary border-primary/20 cursor-help" title={skillsArray.slice(maxVisible).join(', ')}>
                +{remainingCount} more
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'Bench_Date',
      header: 'Bench Date',
      render: (row) => (
        <div className="flex flex-col text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <span>{row.Bench_Date}</span>
          {row.Bench_EndDate && <span className="text-[10px] text-slate-400 font-normal">To: {row.Bench_EndDate}</span>}
        </div>
      )
    },
    {
      key: 'Availability',
      header: 'Availability',
      render: (row) => {
        const isAvailable = row.Availability === 'Available Now';
        return (
          <Badge className={cn("text-[10px] font-semibold", isAvailable ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20" : "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20")}>
            {row.Availability}
          </Badge>
        );
      }
    },
    {
      key: 'Bench_Status',
      header: 'Status',
      render: (row) => {
        const isActive = row.Bench_Status === 'Active';
        return (
          <Badge className={cn("text-[10px] font-semibold", isActive ? "bg-blue-50/80 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "bg-slate-500/10 text-slate-600")}>
            {row.Bench_Status}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-40 dark:bg-slate-900 border dark:border-slate-800 text-xs font-semibold">
              <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleView(row)}>
                <Eye className="h-3.5 w-3.5 text-slate-400" /> View Details
              </DropdownMenuItem>
              {canEditBenchManagement && (
                <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => router.push(`/administration/bench-management/edit/${row.id}`)}>
                  <Pencil className="h-3.5 w-3.5 text-slate-400" /> Edit
                </DropdownMenuItem>
              )}
              {canDeleteBenchManagement && <DropdownMenuSeparator />}
              {canDeleteBenchManagement && (
                <DropdownMenuItem className="cursor-pointer gap-2 text-rose-600 dark:text-rose-400" onClick={() => setRecordToDelete({ id: String(row.id), name: row.Employee_Name })}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1700px] mx-auto space-y-6 text-left p-1 pb-24"
    >
      {/* Breadcrumb section */}
      <div>
        <Breadcrumb>
          <BreadcrumbList className="text-xs font-semibold text-slate-400">
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="hover:text-slate-655 transition-colors">Administration</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Bench Management</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Page Title Header Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" style={{ color: primaryColor }} />
            Bench Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium max-w-2xl">
            Track and allocate company resources currently on bench or pending upcoming projects.
          </p>
        </div>

        {/* Right side header controls */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {canCreateBenchManagement && (
            <Button
              onClick={() => router.push('/administration/bench-management/create')}
              style={{ backgroundColor: primaryColor }}
              className="h-10 px-5 text-white font-bold text-xs rounded-[5px] shadow-md hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all duration-200"
            >
              <Plus className="h-4.5 w-4.5" /> Add Bench Record
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total on Bench */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Total on Bench</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 mt-1">{kpis.total}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-[5px]">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Active Bench */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Active Bench</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 mt-1">{kpis.active}</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded-[5px]">
              <Briefcase className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        {/* Available Now */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Available Now</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 mt-1">{kpis.available}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-slate-800 rounded-[5px]">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        {/* High Priority Allocation */}
        <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450">High Priority</p>
              <h3 className="text-2xl font-black text-slate-850 dark:text-slate-100 mt-1">{kpis.highPriority}</h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-slate-800 rounded-[5px]">
              <Calendar className="h-5 w-5 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar Section */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-[5px] shadow-3xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Inputs */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by Employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 text-xs rounded-[5px] border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
            />
          </div>

          {/* Action Filters and Clear buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Filter Dialog Trigger Button */}
            <Button
              variant="outline"
              onClick={() => setIsFilterDialogOpen(true)}
              className={cn(
                "h-9.5 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-850",
                isFilterActive ? "text-primary border-primary/30 bg-primary/5 dark:bg-primary/10" : "text-slate-700 dark:text-slate-200"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filter
              {isFilterActive && (
                <Badge className="ml-1 h-4 px-1 text-[9px] bg-primary text-white font-bold rounded-full">
                  Active
                </Badge>
              )}
            </Button>

            {/* Clear Filters Button */}
            {(isFilterActive || searchQuery.trim().length > 0) && (
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="h-9.5 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Records Table Wrapper */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px] shadow-3xs p-4">
        {isLoading ? (
          <div className="py-24 text-center space-y-3.5">
            <Users className="animate-bounce h-10 w-10 text-slate-400 mx-auto" />
            <p className="text-slate-500 font-semibold text-sm">Loading bench management list...</p>
          </div>
        ) : (
          <ReusableTable
            columns={columns}
            data={benchRecords}
            loading={isLoading}
            initialPageSize={10}
          />
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-xl bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[5px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" style={{ color: primaryColor }} />
              Filter Bench Records
            </DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Refine resources currently on bench using the filters below.
            </p>
          </DialogHeader>

          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-left">
            {/* Department */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Department</Label>
              <Input
                type="text"
                placeholder="e.g. Development"
                value={tempDept}
                onChange={(e) => setTempDept(e.target.value)}
                className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
              />
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Designation</Label>
              <Input
                type="text"
                placeholder="e.g. Senior Developer"
                value={tempDesignation}
                onChange={(e) => setTempDesignation(e.target.value)}
                className="h-9.5 text-xs bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-[5px]"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Location</Label>
              <Input
                type="text"
                placeholder="e.g. Chennai"
                value={tempLocation}
                onChange={(e) => setTempLocation(e.target.value)}
                className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
              />
            </div>

            {/* Availability Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Availability Status</Label>
              <Input
                type="text"
                placeholder="e.g. Available Now"
                value={tempAvailability}
                onChange={(e) => setTempAvailability(e.target.value)}
                className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
              />
            </div>

            {/* Skills */}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Required Skills</Label>
              <Input
                type="text"
                placeholder="e.g. Java, React"
                value={tempSkills}
                onChange={(e) => setTempSkills(e.target.value)}
                className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 rounded-[5px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-3 pt-3 border-t dark:border-slate-800 flex items-center justify-between w-full">
            <Button
              variant="ghost"
              onClick={() => {
                setTempDept('');
                setTempDesignation('');
                setTempSkills('');
                setTempAvailability('');
                setTempLocation('');
              }}
              className="text-xs font-semibold rounded-[5px] text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Reset All
            </Button>
            <div className="flex gap-2.5">
              <Button
                variant="outline"
                className="text-xs font-semibold rounded-[5px] cursor-pointer"
                onClick={() => setIsFilterDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                style={{ backgroundColor: primaryColor }}
                className="text-xs font-bold text-white rounded-[5px] hover:opacity-90 shadow-md cursor-pointer"
                onClick={() => {
                  setDeptFilter(tempDept);
                  setDesignationFilter(tempDesignation);
                  setSkillsFilter(tempSkills);
                  setAvailabilityFilter(tempAvailability);
                  setLocationFilter(tempLocation);
                  setIsFilterDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['benchRecords'] });
                }}
              >
                Apply Filters
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      {recordToDelete && (
        <ConfirmDeleteDialog
          isOpen={!!recordToDelete}
          onClose={() => setRecordToDelete(null)}
          onConfirm={() => deleteMutation.mutate(recordToDelete.id)}
          title="Delete Bench Record"
          description={`Are you sure you want to remove the bench allocation record for ${recordToDelete.name}? This action cannot be undone.`}
        />
      )}
    </motion.div>
  );
}
