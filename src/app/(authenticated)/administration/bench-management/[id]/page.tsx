'use client';

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';
import {
  ArrowLeft,
  Calendar,
  Users,
  Info,
  Clock,
  Building,
  Briefcase,
  AlertCircle,
  MapPin,
  Pencil,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBenchRecordById, deleteBenchRecord } from '@/service/api/BenchManagement/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog';

export default function BenchRecordDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { primaryColor } = useStore();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  // Query: Fetch existing bench record details
  const { data: recordRaw, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['benchRecord', id],
    queryFn: () => fetchBenchRecordById(id),
    enabled: !!id,
  });

  const record = useMemo(() => {
    return recordRaw?.data || recordRaw;
  }, [recordRaw]);

  // Query: Fetch CRM Users list
  const { data: usersRaw } = useQuery({
    queryKey: ['crmUsersList'],
    queryFn: fetchUsersList,
  });

  const usersList = useMemo(() => {
    const list = Array.isArray(usersRaw) ? usersRaw : (usersRaw?.results || usersRaw?.data || []);
    return list.map((u: any) => {
      const uid = u.id || u.User_Id || u.UserId;
      const firstName = u.first_name || u.FirstName || '';
      const lastName = u.last_name || u.LastName || '';
      const name = u.name || `${firstName} ${lastName}`.trim() || u.username || u.email || 'User';
      return { id: uid, name };
    });
  }, [usersRaw]);

  // Resolve allocation manager's name
  const managerName = useMemo(() => {
    if (!record || !record.Allocation_Manager) return '—';

    // If it's a full object
    if (typeof record.Allocation_Manager === 'object' && record.Allocation_Manager !== null) {
      const u = record.Allocation_Manager;
      const firstName = u.first_name || u.FirstName || '';
      const lastName = u.last_name || u.LastName || '';
      const name = u.name || `${firstName} ${lastName}`.trim() || u.username || u.email;
      if (name) return name;
      const managerId = u.id || u.User_Id || u.UserId;
      if (managerId) {
        const match = usersList.find(usr => Number(usr.id) === Number(managerId));
        if (match) return match.name;
      }
    }

    // If it is a primitive ID or we can extract the ID from the object
    const managerId = typeof record.Allocation_Manager === 'object'
      ? (record.Allocation_Manager.id || record.Allocation_Manager.User_Id || record.Allocation_Manager.UserId)
      : record.Allocation_Manager;

    if (managerId) {
      const match = usersList.find(u => Number(u.id) === Number(managerId));
      if (match) return match.name;
      return `User ID: ${managerId}`;
    }

    return '—';
  }, [record, usersList]);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (rid: string) => deleteBenchRecord(rid),
    onSuccess: () => {
      toast.success('Bench record deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['benchRecords'] });
      queryClient.invalidateQueries({ queryKey: ['benchDashboard'] });
      router.push('/administration/bench-management');
    },
    onError: () => {
      toast.error('Failed to delete bench record');
    }
  });

  if (isLoadingRecord) {
    return (
      <div className="py-24 text-center space-y-3.5">
        <Users className="animate-bounce h-10 w-10 text-slate-400 mx-auto" />
        <p className="text-slate-500 font-semibold text-sm">Loading bench record details...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold">Bench Record Not Found</h2>
        <p className="text-slate-400 text-sm">The bench management record you are looking for does not exist or has been deleted.</p>
        <Button onClick={() => router.push('/administration/bench-management')} style={{ backgroundColor: primaryColor }} className="text-white">
          Back to Bench Management
        </Button>
      </div>
    );
  }

  // Priority Styles
  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400';
      case 'Medium':
        return 'bg-amber-50 text-amber-750 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400';
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400';
    }
  };

  // Status Styles
  const getStatusStyle = (s: string) => {
    return s === 'Active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400'
      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350';
  };

  const skillsArray = record.Skills ? record.Skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[1600px] mx-auto space-y-6 text-left"
    >
      {/* Breadcrumbs & Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={() => router.push('/administration/bench-management')}
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<NavLink to="/administration/bench-management">Bench Management</NavLink>} />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mr-2">
                {record.Employee_Name}
              </h1>
              <Badge variant="outline" className={`rounded-[5px] font-bold text-xs py-0.5 px-2.5 ${getStatusStyle(record.Bench_Status)}`}>
                {record.Bench_Status}
              </Badge>
              {record.Allocation_Priority && (
                <Badge variant="outline" className={`rounded-[5px] font-bold text-xs py-0.5 px-2.5 ${getPriorityStyle(record.Allocation_Priority)}`}>
                  {record.Allocation_Priority} Priority
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1 font-semibold">
              Employee Code: {record.Employee_Code} • Department: {record.Department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            variant="outline"
            className="h-9 gap-2 border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[5px] text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer"
            onClick={() => router.push(`/administration/bench-management/edit/${record.id}`)}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Record
          </Button>

          <Button
            variant="outline"
            className="h-9 gap-2 rounded-[5px] text-xs font-semibold border-rose-200 dark:border-rose-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side (Spans 2) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card 1: Resource Overview */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Resource Profile</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-semibold">
                
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Employee Name</span>
                  <span className="text-slate-800 dark:text-slate-200 text-sm font-bold block">{record.Employee_Name}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Employee Code</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono text-sm block">{record.Employee_Code}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Department</span>
                  <span className="text-slate-800 dark:text-slate-200 text-sm block">{record.Department}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Designation</span>
                  <span className="text-slate-800 dark:text-slate-200 text-sm block">{record.Designation}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Location</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-800 dark:text-slate-200 text-sm">{record.Location || '—'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Total Experience</span>
                  <span className="text-slate-850 dark:text-slate-200 text-sm block">
                    {record.Experience !== undefined && record.Experience !== null ? `${record.Experience} Years` : '—'}
                  </span>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 2: Bench Timeline & Allocation Goals */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Bench Timeline & Goals</h3>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs font-semibold">
                
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Bench Start Date</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-800 dark:text-slate-200 text-sm">{record.Bench_Date || '—'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Bench End Date</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-800 dark:text-slate-200 text-sm">{record.Bench_EndDate || '—'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Availability From</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-800 dark:text-slate-200 text-sm">{record.Available_From || '—'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Expected Allocation Date</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-800 dark:text-slate-200 text-sm">{record.Expected_AllocationDate || '—'}</span>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Expected Target / Project</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-800 dark:text-slate-200 text-sm font-bold">
                      {record.Expected_Project || record.Allocation_Target || '—'}
                    </span>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Card 3: Skills & Notes */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Skills & Capability</h3>
            </div>
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-2">
                <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Skills Inventory</span>
                {skillsArray.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {skillsArray.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs px-2.5 py-0.5 font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-[3px] border border-slate-200 dark:border-slate-700"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 font-semibold italic text-xs block">No skills registered.</span>
                )}
              </div>

              {record.Bench_Reason && (
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Reason for Bench Allocation</span>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[5px] text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-semibold">
                    {record.Bench_Reason}
                  </div>
                </div>
              )}

              {record.Notes && (
                <div className="space-y-2">
                  <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Additional Notes / Remarks</span>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border-l-4 border-primary rounded-r-[5px] text-slate-700 dark:text-slate-300 text-xs leading-relaxed font-semibold">
                    {record.Notes}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Right Side */}
        <div className="space-y-6">

          {/* Allocation Settings & Owner Card */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden">
            <div className="p-5 border-b dark:border-slate-800">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-850 dark:text-slate-200">Allocation Status</h3>
            </div>
            <CardContent className="p-5 space-y-4.5 text-xs font-semibold">
              
              <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Current Status</span>
                <Badge variant="outline" className={`rounded-[5px] font-bold text-xs py-0.5 px-2 ${getStatusStyle(record.Bench_Status)}`}>
                  {record.Bench_Status}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Priority Level</span>
                {record.Allocation_Priority ? (
                  <Badge variant="outline" className={`rounded-[5px] font-bold text-xs py-0.5 px-2 ${getPriorityStyle(record.Allocation_Priority)}`}>
                    {record.Allocation_Priority}
                  </Badge>
                ) : (
                  <span className="text-slate-400 font-semibold">—</span>
                )}
              </div>

              <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Bench Type</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{record.Bench_Type || 'Internal'}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Availability</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{record.Availability || 'Available Now'}</span>
              </div>

              <div className="py-2 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1.5">Allocation Manager</span>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs animate-pulse">
                    {managerName !== '—' ? managerName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'M'}
                  </div>
                  <div>
                    <span className="text-slate-800 dark:text-slate-200 font-bold block">{managerName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">Primary Manager</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Quick Help Card */}
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[5px] shadow-2xs overflow-hidden p-5 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
              <Info className="h-4.5 w-4.5 text-primary" style={{ color: primaryColor }} />
              About Bench Records
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-semibold">
              This overview details the bench timeline, resource inventory, and target allocation goals. Keeping these attributes updated assists the CRM in aligning matches for upcoming business opportunities.
            </p>
          </Card>

        </div>

      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate(record.id)}
        title="Delete Bench Record"
        description={`Are you sure you want to remove the bench allocation record for ${record.Employee_Name}? This action cannot be undone.`}
      />
    </motion.div>
  );
}
