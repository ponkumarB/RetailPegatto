'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useAdditionalUserLicenseStore } from '@/store/useAdditionalUserLicenseStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UserPlus,
  X,
  Send,
  Building,
  Award,
  Phone,
  Mail,
  Calendar,
  Layers,
  Info,
  Users,
  Plus,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditUserLicensePage() {
  const router = useRouter();
  const params = useParams();
  const { primaryColor } = useStore();
  const { requests, updateRequest } = useAdditionalUserLicenseStore();

  const id = params?.id as string;
  const record = useMemo(() => requests.find(r => r.id === id), [requests, id]);

  // Mock static reference values
  const currentPlan = 'Professional Plan';
  const currentActiveUsers = 98;
  const currentLicenseLimit = 100;
  const costPerLicense = 500; // in Rupees (₹)

  // Form states
  const [organization, setOrganization] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [primaryContact, setPrimaryContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestType, setRequestType] = useState<'Add Additional Users' | 'Temporary License (Short Term)'>('Add Additional Users');
  const [additionalLicenses, setAdditionalLicenses] = useState<number>(5);
  const [userRole, setUserRole] = useState('Standard User');
  const [department, setDepartment] = useState('Sales');
  const [requiredFromDate, setRequiredFromDate] = useState('');
  const [reason, setReason] = useState('');
  const [budgetApproval, setBudgetApproval] = useState<boolean>(true);
  const [approvedBy, setApprovedBy] = useState('');
  const [approvalDate, setApprovalDate] = useState('');
  const [poReference, setPoReference] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'Pending Approval' | 'Approved' | 'Rejected' | 'Active'>('Pending Approval');

  // Load record data into state
  useEffect(() => {
    if (record) {
      setOrganization(record.organization);
      setOrganizationCode(record.organizationCode);
      setPrimaryContact(record.primaryContact);
      setEmail(record.email);
      setPhone(record.phone);
      setRequestType(record.requestType);
      setAdditionalLicenses(record.additionalLicenses);
      setUserRole(record.userRole);
      setDepartment(record.department || 'Sales');
      setRequiredFromDate(record.requiredFromDate);
      setReason(record.reason);
      setBudgetApproval(record.budgetApproval);
      setApprovedBy(record.approvedBy);
      setApprovalDate(record.approvalDate);
      setPoReference(record.poReference || '');
      setNotes(record.notes || '');
      setStatus(record.status);
    }
  }, [record]);

  // Derived states
  const newLicenseLimit = currentLicenseLimit + additionalLicenses;
  const estimatedCost = additionalLicenses * costPerLicense;

  const handleIncrement = () => {
    setAdditionalLicenses(prev => prev + 1);
  };

  const handleDecrement = () => {
    setAdditionalLicenses(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization || !primaryContact || !requiredFromDate || !reason) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const updatedFields = {
      organization,
      organizationCode,
      primaryContact,
      email,
      phone,
      requestType,
      additionalLicenses,
      userRole,
      department,
      requiredFromDate,
      reason,
      budgetApproval,
      approvedBy,
      approvalDate,
      poReference,
      notes,
      status
    };

    updateRequest(id, updatedFields);
    toast.success(`User License Request "${id}" updated successfully!`);
    router.push('/add-ons/additional-user-license-request');
  };

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Request Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm">
          The Additional User License Request with ID "{id}" could not be found or does not exist.
        </p>
        <Button onClick={() => router.push('/add-ons/additional-user-license-request')} className="rounded-xl font-bold text-xs h-9 px-4">
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left pb-10">
      {/* Top Header & Breadcrumbs Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-100 dark:border-slate-850 rounded-2xl w-full md:w-auto flex-1">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full shrink-0 border border-blue-100 dark:border-blue-900/50">
            <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-450" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Edit User License Request: {id}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Modify the license request details or update approval status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/add-ons/additional-user-license-request')}
            className="h-10 px-4 text-xs font-bold border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 gap-1.5"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            style={{ backgroundColor: primaryColor }}
            className="h-10 px-4 text-xs font-bold text-white rounded-xl shadow-md hover:opacity-90 transition-all border-none gap-1.5"
          >
            <Send className="h-4 w-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Form Fields */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-6 bg-white dark:bg-slate-900 p-6 border border-slate-100 dark:border-slate-850 rounded-3xl shadow-sm">
          
          {/* Section 1: Organization Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-850 pb-2">
              <Building className="h-4.5 w-4.5 text-blue-650" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Organization Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Organization *</Label>
                <select
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
                >
                  <option value="Acme Solutions Pvt. Ltd.">Acme Solutions Pvt. Ltd.</option>
                  <option value="Globex Corporation">Globex Corporation</option>
                  <option value="Initech Corporation">Initech Corporation</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Organization Code</Label>
                <Input
                  type="text"
                  disabled
                  value={organizationCode}
                  className="text-xs bg-slate-50/50 dark:bg-slate-955/60 font-semibold rounded-xl text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Current Plan</Label>
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-xl bg-slate-50/50 dark:bg-slate-955/60 border-slate-150 dark:border-slate-800 text-slate-500">
                  <Award className="h-4 w-4 text-amber-505" />
                  <span>{currentPlan}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-355">Primary Contact *</Label>
                <select
                  value={primaryContact}
                  onChange={(e) => setPrimaryContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
                >
                  <option value="Raghav S.">Raghav S.</option>
                  <option value="Sarah Jenkins">Sarah Jenkins</option>
                  <option value="Bill Lumbergh">Bill Lumbergh</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-750 dark:text-slate-350">Email</Label>
                <Input
                  type="email"
                  disabled
                  value={email}
                  className="text-xs bg-slate-50/50 dark:bg-slate-955/60 font-semibold rounded-xl text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Phone</Label>
                <div className="flex rounded-xl border border-slate-250 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-955/60 text-slate-500">
                  <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800 shrink-0 text-xs">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={phone}
                    className="w-full px-3 py-1.5 text-xs bg-transparent border-none outline-none font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: License Request Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-850 pb-2">
              <Layers className="h-4.5 w-4.5 text-blue-650" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                License Request Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Request Type *</Label>
                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      checked={requestType === 'Add Additional Users'}
                      onChange={() => setRequestType('Add Additional Users')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Add Additional Users</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      checked={requestType === 'Temporary License (Short Term)'}
                      onChange={() => setRequestType('Temporary License (Short Term)')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Temporary License (Short Term)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-750 dark:text-slate-350">Number of Additional Licenses Requested *</Label>
                <div className="flex items-center w-32 border border-slate-250 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-955">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="px-3 py-2 text-slate-505 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={additionalLicenses}
                    onChange={(e) => setAdditionalLicenses(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center text-xs font-extrabold bg-transparent border-none outline-none text-slate-850 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleIncrement}
                    className="px-3 py-2 text-slate-505 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">User Role / License Type *</Label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
                >
                  <option value="Standard User">Standard User</option>
                  <option value="Admin User">Admin User</option>
                  <option value="Read-Only User">Read-Only User</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Department (Optional)</Label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
                >
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Support">Support</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Required From Date *</Label>
                <div className="relative">
                  <Input
                    type="date"
                    required
                    value={requiredFromDate}
                    onChange={(e) => setRequiredFromDate(e.target.value)}
                    className="text-xs font-semibold rounded-xl pl-9"
                  />
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Reason for Request *</Label>
                <span className="text-[10px] text-slate-400 font-bold">{reason.length} / 500</span>
              </div>
              <textarea
                rows={3}
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide notes or business reasons for this request..."
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
              />
            </div>
          </div>

          {/* Section 3: Additional Information & Status (for Admin actions) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-850 pb-2">
              <Info className="h-4.5 w-4.5 text-blue-655" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Additional Information & Approval Status
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Request Status (Admin Control)</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
                >
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-355">Approved By</Label>
                <select
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none"
                >
                  <option value="Sandeep Verma">Sandeep Verma</option>
                  <option value="Sarah Jenkins">Sarah Jenkins</option>
                  <option value="Finance Dept">Finance Dept</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">Approval Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    className="text-xs font-semibold rounded-xl pl-9"
                  />
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-355">Budget Approval</Label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="budgetApproval"
                      checked={budgetApproval === true}
                      onChange={() => setBudgetApproval(true)}
                      className="h-4 w-4 text-blue-650 focus:ring-blue-550 border-slate-300"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="budgetApproval"
                      checked={budgetApproval === false}
                      onChange={() => setBudgetApproval(false)}
                      className="h-4 w-4 text-blue-650 focus:ring-blue-555 border-slate-300"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-350">PO / Reference No. (Optional)</Label>
                <Input
                  type="text"
                  value={poReference}
                  onChange={(e) => setPoReference(e.target.value)}
                  placeholder="e.g. PO/2025/06/1187"
                  className="text-xs font-semibold rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-355">Notes (Optional)</Label>
                <span className="text-[10px] text-slate-400 font-bold">{notes.length} / 300</span>
              </div>
              <textarea
                rows={2}
                maxLength={300}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any remarks..."
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-200 border-slate-250 dark:border-slate-800 outline-none resize-y"
              />
            </div>
          </div>

        </form>

        {/* Right Column: Summaries & Important Notes */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Request Summary Card */}
          <Card className="border border-slate-100 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-850 bg-slate-50/20 dark:bg-slate-900/20 flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-blue-650" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Request Summary
              </h3>
            </div>
            
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-850 pb-2">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <Users className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Current Active Users</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-white">{currentActiveUsers}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-850 pb-2">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <UserPlus className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Current License Limit</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-white">{currentLicenseLimit}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-850 pb-2">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <Plus className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Additional Licenses Requested</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-white">{additionalLicenses}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-850 pb-2">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <Award className="h-4 w-4 text-indigo-505 shrink-0" />
                  <span>New License Limit (After Approval)</span>
                </div>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{newLicenseLimit}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-850 pb-2">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <span className="text-slate-405 font-extrabold">₹</span>
                  <span>Estimated Monthly Cost</span>
                </div>
                <span className="font-black text-slate-905 dark:text-white">₹ {estimatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-850 pb-2">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Effective From</span>
                </div>
                <span className="font-extrabold text-slate-800 dark:text-white">
                  {requiredFromDate ? requiredFromDate.split('-').reverse().join('/') : ''}
                </span>
              </div>

              <div className="pt-2">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Requested By</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-black text-slate-600 dark:text-slate-350">RS</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-850 dark:text-white">{primaryContact}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">IT Manager</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Important Notes Card */}
          <Card className="border border-blue-100/50 dark:border-blue-900/30 rounded-3xl overflow-hidden bg-blue-50/20 dark:bg-blue-950/10">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-xs font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-wide">
                Important Notes
              </h4>
              <ul className="list-disc pl-4 text-xs font-semibold text-slate-600 dark:text-slate-400 space-y-1.5">
                <li>Your request will be reviewed by the system administrator.</li>
                <li>You will be notified once the request is approved.</li>
                <li>Additional licenses will be billed as per your subscription plan.</li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
