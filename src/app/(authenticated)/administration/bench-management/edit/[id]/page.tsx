'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
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
import { fetchBenchRecordById, updateBenchRecord } from '@/service/api/BenchManagement/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const benchFormSchema = z.object({
  Employee_Name: z.string().min(1, 'Employee Name is required'),
  Employee_Code: z.string().min(1, 'Employee Code is required'),
  Employee_Id: z.any().optional(),
  Department: z.string().min(1, 'Department is required'),
  Designation: z.string().min(1, 'Designation is required'),
  Skills: z.string().min(1, 'Skills are required'),
  Bench_Date: z.string().min(1, 'Bench Date is required'),
  Bench_EndDate: z.any().optional(),
  Location: z.string().min(1, 'Location is required'),
  Available_From: z.any().optional(),
  Availability: z.string().min(1, 'Availability status is required'),
  Bench_Reason: z.any().optional(),
  Bench_Status: z.string().min(1, 'Bench Status is required'),
  Expected_Project: z.any().optional(),
  Experience: z.any().optional(),
  Expected_Allocation_Date: z.any().optional(),
  Allocation_Priority: z.any().optional(),
  Bench_Type: z.any().optional(),
  Allocation_Manager: z.any().optional(),
  Notes: z.any().optional()
});

type FormValues = z.infer<typeof benchFormSchema>;

export default function EditBenchPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { primaryColor } = useStore();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(benchFormSchema) as any,
  });

  // Register custom Select inputs so they are tracked by React Hook Form
  useEffect(() => {
    register('Availability');
    register('Bench_Status');
    register('Allocation_Priority');
    register('Bench_Type');
    register('Allocation_Manager');
  }, [register]);

  // Query: Fetch users list for managers
  const { data: usersRaw } = useQuery({
    queryKey: ['benchUsersList'],
    queryFn: fetchUsersList,
  });

  const usersList = useMemo(() => {
    const list = Array.isArray(usersRaw) ? usersRaw : (usersRaw?.results || usersRaw?.data || []);
    return list.map((u: any) => {
      const id = u.id || u.User_Id || u.UserId;
      const firstName = u.first_name || u.FirstName || '';
      const lastName = u.last_name || u.LastName || '';
      const name = u.name || `${firstName} ${lastName}`.trim() || u.username || u.email || 'User';
      return { id, name };
    });
  }, [usersRaw]);

  // Query: Fetch existing bench record details
  const { data: recordData, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['benchRecord', id],
    queryFn: () => fetchBenchRecordById(id),
    enabled: !!id,
  });

  // Prefill form values
  useEffect(() => {
    if (recordData) {
      const record = recordData.data || recordData;
      reset({
        Employee_Name: record.Employee_Name || '',
        Employee_Code: record.Employee_Code || '',
        Employee_Id: record.Employee_Id ?? undefined,
        Department: record.Department || '',
        Designation: record.Designation || '',
        Skills: record.Skills || '',
        Bench_Date: record.Bench_Date ? record.Bench_Date.split('T')[0] : '',
        Bench_EndDate: record.Bench_EndDate ? record.Bench_EndDate.split('T')[0] : '',
        Location: record.Location || '',
        Available_From: record.Available_From ? record.Available_From.split('T')[0] : '',
        Availability: record.Availability || 'Available Now',
        Bench_Reason: record.Bench_Reason || '',
        Bench_Status: record.Bench_Status || 'Active',
        Expected_Project: record.Expected_Project || '',
        Experience: record.Experience ?? undefined,
        Expected_Allocation_Date: record.Expected_Allocation_Date ? record.Expected_Allocation_Date.split('T')[0] : '',
        Allocation_Priority: record.Allocation_Priority || 'Medium',
        Bench_Type: record.Bench_Type || 'Internal',
        Allocation_Manager: typeof record.Allocation_Manager === 'object' && record.Allocation_Manager !== null
          ? (record.Allocation_Manager.id || record.Allocation_Manager.User_Id || record.Allocation_Manager.UserId)
          : record.Allocation_Manager ?? undefined,
        Notes: record.Notes || ''
      });
    }
  }, [recordData, reset]);

  const watchedAvailability = watch('Availability');
  const watchedStatus = watch('Bench_Status');
  const watchedPriority = watch('Allocation_Priority');
  const watchedType = watch('Bench_Type');
  const watchedManager = watch('Allocation_Manager');

  const selectedManagerName = useMemo(() => {
    if (!watchedManager) return "";
    const found = usersList.find(u => String(u.id) === String(watchedManager));
    if (found) return found.name;

    // Fallback to record's original manager object if available
    const record = recordData?.data || recordData;
    if (record && record.Allocation_Manager && typeof record.Allocation_Manager === 'object') {
      const rm = record.Allocation_Manager;
      const name = rm.name || `${rm.first_name || rm.FirstName || ''} ${rm.last_name || rm.LastName || ''}`.trim() || rm.username;
      if (name) return name;
    }
    return String(watchedManager);
  }, [watchedManager, usersList, recordData]);

  const onSubmit = async (data: FormValues) => {
    try {
      const orgId = typeof window !== 'undefined' ? Number(localStorage.getItem('Organization_Id') || 1) : 1;
      const loggedInUserId = typeof window !== 'undefined' ? Number(localStorage.getItem('userId') || 1) : 1;

      let benchDuration = '';
      if (data.Bench_Date && data.Bench_EndDate) {
        const start = new Date(data.Bench_Date);
        const end = new Date(data.Bench_EndDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        benchDuration = `${diffDays} Days`;
      }

      let managerId = data.Allocation_Manager;
      if (typeof managerId === 'object' && managerId !== null) {
        managerId = (managerId as any).id || (managerId as any).User_Id || (managerId as any).UserId;
      } else if (managerId !== undefined && managerId !== null && managerId !== '') {
        managerId = Number(managerId);
      } else {
        managerId = undefined;
      }

      let exp = data.Experience;
      if (exp !== undefined && exp !== null && exp !== '') {
        exp = Number(exp);
      } else {
        exp = undefined;
      }

      let empId = data.Employee_Id;
      if (empId !== undefined && empId !== null && empId !== '') {
        empId = Number(empId);
      } else {
        empId = undefined;
      }

      const originalRecord = recordData?.data || recordData || {};
      let createdById = originalRecord.Created_By;
      if (typeof createdById === 'object' && createdById !== null) {
        createdById = createdById.id || createdById.User_Id || createdById.UserId;
      }

      const payload = {
        ...originalRecord,
        ...data,
        Allocation_Manager: managerId,
        Experience: exp,
        Employee_Id: empId,
        Organization_Id: orgId,
        Bench_Duration: benchDuration || undefined,
        Created_By: createdById ? Number(createdById) : undefined,
        Updated_By: loggedInUserId
      };

      await updateBenchRecord(id, payload as any);
      toast.success('Bench record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['benchRecords'] });
      queryClient.invalidateQueries({ queryKey: ['benchRecord', id] });
      queryClient.invalidateQueries({ queryKey: ['benchDashboard'] });
      router.push('/administration/bench-management');
    } catch (err) {
      toast.error('Failed to update bench record');
    }
  };

  if (isLoadingRecord) {
    return (
      <div className="py-24 text-center">
        <Users className="animate-spin h-10 w-10 text-primary mx-auto" style={{ color: primaryColor }} />
        <p className="text-slate-500 font-semibold text-sm mt-3.5">Loading bench record details...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1200px] mx-auto space-y-6 text-left p-1 pb-24"
    >
      {/* Breadcrumbs */}
      <div>
        <Breadcrumb>
          <BreadcrumbList className="text-xs font-semibold text-slate-400">
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="hover:text-slate-655 transition-colors">Administration</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/administration/bench-management" className="hover:text-slate-655 transition-colors">Bench Management</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-slate-600 dark:text-slate-300 font-semibold">Edit Bench Record</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header and Back Button */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-[5px] border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 shrink-0"
          onClick={() => router.push('/administration/bench-management')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" style={{ color: primaryColor }} />
            Edit Bench Record
          </h1>
          <p className="text-xs text-slate-400">Modify allocation targets, bench dates, and skills details.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any, (errs) => {
        toast.error('Validation failed: ' + Object.values(errs).map((err: any) => err.message).join(', '));
      })} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Form Content (Spans 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b dark:border-slate-800 pb-2 mb-4">Resource Profile</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee Name */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Employee Name *</Label>
                  <Input
                    {...register('Employee_Name')}
                    placeholder="Enter Employee Name"
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-805"
                  />
                  {errors.Employee_Name && <p className="text-[10px] text-red-500 font-semibold">{errors.Employee_Name.message}</p>}
                </div>

                {/* Employee Code */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Employee Code *</Label>
                  <Input
                    {...register('Employee_Code')}
                    placeholder="e.g. EMP1001"
                    className="h-9.5 text-xs font-mono rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-805"
                  />
                  {errors.Employee_Code && <p className="text-[10px] text-red-500 font-semibold">{errors.Employee_Code.message}</p>}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Department *</Label>
                  <Input
                    {...register('Department')}
                    placeholder="e.g. Development, QA, Design"
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-805"
                  />
                  {errors.Department && <p className="text-[10px] text-red-500 font-semibold">{errors.Department.message}</p>}
                </div>

                {/* Designation */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Designation *</Label>
                  <Input
                    {...register('Designation')}
                    placeholder="e.g. Senior Software Engineer"
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-805"
                  />
                  {errors.Designation && <p className="text-[10px] text-red-500 font-semibold">{errors.Designation.message}</p>}
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Experience (Years)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('Experience')}
                    placeholder="e.g. 4.5"
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-805"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Location *</Label>
                  <Input
                    {...register('Location')}
                    placeholder="e.g. Bangalore, Chennai, Remote"
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-805"
                  />
                  {errors.Location && <p className="text-[10px] text-red-500 font-semibold">{errors.Location.message}</p>}
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold">Skills *</Label>
                <Input
                  {...register('Skills')}
                  placeholder="e.g. Java, React, SQL (comma-separated)"
                  className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-805"
                />
                {errors.Skills && <p className="text-[10px] text-red-500 font-semibold">{errors.Skills.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b dark:border-slate-800 pb-2 mb-4">Bench Details & Allocation</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bench Date */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Bench Start Date *</Label>
                  <Input
                    type="date"
                    {...register('Bench_Date')}
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808"
                  />
                  {errors.Bench_Date && <p className="text-[10px] text-red-500 font-semibold">{errors.Bench_Date.message}</p>}
                </div>

                {/* Bench End Date */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Expected End Date</Label>
                  <Input
                    type="date"
                    {...register('Bench_EndDate')}
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808"
                  />
                </div>

                {/* Available From */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Available From</Label>
                  <Input
                    type="date"
                    {...register('Available_From')}
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808"
                  />
                </div>

                {/* Expected Project */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Expected Project Target</Label>
                  <Input
                    {...register('Expected_Project')}
                    placeholder="e.g. CRM Implementation"
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808"
                  />
                </div>

                {/* Expected Allocation Date */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Expected Allocation Date</Label>
                  <Input
                    type="date"
                    {...register('Expected_Allocation_Date')}
                    className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808"
                  />
                </div>

                {/* Allocation Manager */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Allocation Manager</Label>
                  <Select
                    value={watchedManager ? String(watchedManager) : ""}
                    onValueChange={(val) => setValue('Allocation_Manager', val ? Number(val) : undefined)}
                  >
                    <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808 rounded-[5px]">
                      {watchedManager && selectedManagerName ? (
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedManagerName}</span>
                      ) : (
                        <SelectValue placeholder="Select Manager" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {usersList.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bench Reason */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Reason for Bench Allocation</Label>
                <Input
                  {...register('Bench_Reason')}
                  placeholder="e.g. Project Completed, Awaiting Onboarding"
                  className="h-9.5 text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">Additional Notes</Label>
                <Textarea
                  {...register('Notes')}
                  placeholder="Add any specific skill details, allocation notes, or manager remarks..."
                  rows={4}
                  className="text-xs rounded-[5px] bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Settings (Spans 1 column) */}
        <div className="space-y-6">
          <Card className="border dark:border-slate-800 shadow-3xs rounded-[5px] bg-white dark:bg-slate-900 sticky top-6">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b dark:border-slate-800 pb-2 mb-4">Settings & Status</h2>

              {/* Availability */}
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold">Availability Status *</Label>
                <Select
                  value={watchedAvailability || ""}
                  onValueChange={(val) => setValue('Availability', val || 'Available Now')}
                >
                  <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808 rounded-[5px]">
                    <SelectValue placeholder="Availability Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available Now">Available Now</SelectItem>
                    <SelectItem value="Available Soon">Available Soon</SelectItem>
                    <SelectItem value="Allocated">Allocated</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bench Status */}
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold">Bench Status *</Label>
                <Select
                  value={watchedStatus || ""}
                  onValueChange={(val) => setValue('Bench_Status', val || 'Active')}
                >
                  <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808 rounded-[5px]">
                    <SelectValue placeholder="Bench Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allocation Priority */}
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold">Allocation Priority</Label>
                <Select
                  value={watchedPriority || ""}
                  onValueChange={(val) => setValue('Allocation_Priority', val || undefined)}
                >
                  <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808 rounded-[5px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bench Type */}
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold">Bench Type</Label>
                <Select
                  value={watchedType || ""}
                  onValueChange={(val) => setValue('Bench_Type', val || undefined)}
                >
                  <SelectTrigger className="h-9.5 text-xs bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-808 rounded-[5px]">
                    <SelectValue placeholder="Bench Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internal">Internal</SelectItem>
                    <SelectItem value="External">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 space-y-2.5">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: primaryColor }}
                  className="w-full h-10 text-white font-bold text-xs rounded-[5px] shadow-md hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4.5 w-4.5" /> Save Changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 text-xs font-bold rounded-[5px]"
                  onClick={() => router.push('/administration/bench-management')}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </motion.div>
  );
}
