'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ArrowLeft,
  X,
  Send,
  Calendar,
  Upload,
  Mail,
  Phone,
  FileText,
  Save,
  FileCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { DeploymentRequest } from '@/types/deployment';

interface DeploymentFormProps {
  initialData?: DeploymentRequest;
  isEditMode: boolean;
  onSubmit: (data: Omit<DeploymentRequest, 'id' | 'status' | 'approvals'>) => void;
  onCancel: () => void;
}

export default function DeploymentForm({
  initialData,
  isEditMode,
  onSubmit,
  onCancel,
}: DeploymentFormProps) {
  // Form Fields State
  const [requestedBy, setRequestedBy] = useState('');
  const [requestedByRole, setRequestedByRole] = useState('');
  const [department, setDepartment] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [deploymentType, setDeploymentType] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low' | ''>('');
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Development' | 'UAT' | ''>('');
  const [changeType, setChangeType] = useState('');
  const [reportingManager, setReportingManager] = useState('');
  const [deploymentFor, setDeploymentFor] = useState<'Internal' | 'Third Party'>('Internal');
  const [purpose, setPurpose] = useState('');
  
  // App Details
  const [appName, setAppName] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [appOwner, setAppOwner] = useState('');
  const [appType, setAppType] = useState('');
  const [repository, setRepository] = useState('');
  const [artifact, setArtifact] = useState('');
  const [dbChanges, setDbChanges] = useState<'Yes' | 'No'>('No');
  const [dbScriptsFilename, setDbScriptsFilename] = useState('');

  // Deployment Details
  const [targetEnv, setTargetEnv] = useState('');
  const [serverCluster, setServerCluster] = useState('');
  const [deploymentWindow, setDeploymentWindow] = useState('');
  const [estimatedDowntime, setEstimatedDowntime] = useState(0);
  const [rollbackPlan, setRollbackPlan] = useState('');
  const [dependencies, setDependencies] = useState('');

  // Additional Information
  const [notes, setNotes] = useState('');
  const [attachedDocsFilename, setAttachedDocsFilename] = useState('');
  const [notifyUpdates, setNotifyUpdates] = useState(true);

  // Pre-populate fields on load/initialData changes
  useEffect(() => {
    if (initialData) {
      setRequestedBy(initialData.requestedBy);
      setRequestedByRole(initialData.requestedByRole);
      setDepartment(initialData.department);
      setRequestDate(initialData.requestDate);
      setRequiredDate(initialData.requiredDate);
      setDeploymentType(initialData.deploymentType);
      setPriority(initialData.priority);
      setEnvironment(initialData.environment);
      setChangeType(initialData.changeType);
      setReportingManager(initialData.reportingManager);
      setDeploymentFor(initialData.deploymentFor);
      setPurpose(initialData.purpose);
      setAppName(initialData.appName);
      setAppVersion(initialData.appVersion);
      setAppOwner(initialData.appOwner);
      setAppType(initialData.appType);
      setRepository(initialData.repository);
      setArtifact(initialData.artifact);
      setDbChanges(initialData.dbChanges);
      setDbScriptsFilename(initialData.dbScriptsFilename || '');
      setTargetEnv(initialData.targetEnv);
      setServerCluster(initialData.serverCluster);
      setDeploymentWindow(initialData.deploymentWindow);
      setEstimatedDowntime(initialData.estimatedDowntime);
      setRollbackPlan(initialData.rollbackPlan);
      setDependencies(initialData.dependencies);
      setNotes(initialData.notes || '');
      setAttachedDocsFilename(initialData.attachedDocsFilename || '');
      setNotifyUpdates(initialData.notifyUpdates);
    } else {
      // Clear values if no initialData
      setRequestedBy('');
      setRequestedByRole('');
      setDepartment('');
      setRequestDate('');
      setRequiredDate('');
      setDeploymentType('');
      setPriority('');
      setEnvironment('');
      setChangeType('');
      setReportingManager('');
      setDeploymentFor('Internal');
      setPurpose('');
      setAppName('');
      setAppVersion('');
      setAppOwner('');
      setAppType('');
      setRepository('');
      setArtifact('');
      setDbChanges('No');
      setDbScriptsFilename('');
      setTargetEnv('');
      setServerCluster('');
      setDeploymentWindow('');
      setEstimatedDowntime(0);
      setRollbackPlan('');
      setDependencies('');
      setNotes('');
      setAttachedDocsFilename('');
      setNotifyUpdates(true);
    }
  }, [initialData]);

  const handleRequesterChange = (name: string) => {
    setRequestedBy(name);
    if (name === 'Priya Kapoor') {
      setRequestedByRole('Business Analyst');
      setDepartment('Business Analysis');
    } else if (name === 'Aarav Rao') {
      setRequestedByRole('Project Manager');
      setDepartment('Delivery Management');
    } else if (name === 'Neha Bansal') {
      setRequestedByRole('Application Owner');
      setDepartment('Engineering');
    } else if (name === 'Vikram Tiwari') {
      setRequestedByRole('Infrastructure Head');
      setDepartment('DevOps & Cloud');
    } else {
      setRequestedByRole('');
      setDepartment('');
    }
  };

  const handleFormSubmit = () => {
    if (!requestedBy.trim()) {
      toast.error('Requested By is required');
      return;
    }
    if (!department.trim()) {
      toast.error('Department is required');
      return;
    }
    if (!requestDate.trim()) {
      toast.error('Request Date is required');
      return;
    }
    if (!requiredDate.trim()) {
      toast.error('Required Date is required');
      return;
    }
    if (!deploymentType.trim()) {
      toast.error('Deployment Type is required');
      return;
    }
    if (!priority) {
      toast.error('Priority is required');
      return;
    }
    if (!environment) {
      toast.error('Environment is required');
      return;
    }
    if (!changeType.trim()) {
      toast.error('Change Type is required');
      return;
    }
    if (!purpose.trim()) {
      toast.error('Purpose / Justification is required');
      return;
    }
    if (!appName.trim() || !appVersion.trim()) {
      toast.error('Application Name and Version are required');
      return;
    }
    if (!targetEnv.trim()) {
      toast.error('Target Environment is required');
      return;
    }
    if (!serverCluster.trim()) {
      toast.error('Server / Cluster is required');
      return;
    }
    if (!deploymentWindow.trim()) {
      toast.error('Deployment Window is required');
      return;
    }
    if (!rollbackPlan.trim()) {
      toast.error('Rollback Plan is required');
      return;
    }

    onSubmit({
      requestedBy,
      requestedByRole,
      department,
      requestDate,
      requiredDate,
      deploymentType,
      priority: priority as 'High' | 'Medium' | 'Low',
      environment: environment as 'Production' | 'Staging' | 'Development' | 'UAT',
      changeType,
      reportingManager,
      deploymentFor,
      purpose,
      appName,
      appVersion,
      appOwner,
      appType,
      repository,
      artifact,
      dbChanges,
      dbScriptsFilename: dbChanges === 'Yes' ? dbScriptsFilename : undefined,
      targetEnv,
      serverCluster,
      deploymentWindow,
      estimatedDowntime,
      rollbackPlan,
      dependencies,
      notes,
      attachedDocsFilename,
      notifyUpdates,
    });
  };

  const defaultApprovals = [
    { step: 1, approver: 'Aaray Rao', role: 'Project Manager', avatar: 'AR', status: 'Pending' },
    { step: 2, approver: 'Rahul Mehta', role: 'IT Manager', avatar: 'RM', status: 'Pending' },
    { step: 3, approver: 'Neha Bansal', role: 'Application Owner', avatar: 'NB', status: 'Pending' },
    { step: 4, approver: 'Vikram Tiwari', role: 'Infrastructure Head', avatar: 'VK', status: 'Pending' }
  ];

  const approvals = initialData?.approvals || defaultApprovals;

  return (
    <div className="w-full space-y-5 text-left">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList className="text-xs font-semibold text-slate-400">
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={onCancel}
              className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              System
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-3 w-3" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              onClick={onCancel}
              className="cursor-pointer hover:text-slate-600 dark:hover:text-slate-200"
            >
              Deployment Requests
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-3 w-3" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-slate-600 dark:text-slate-350">
              {isEditMode ? `Edit Request: ${initialData?.id}` : 'New Request'}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onCancel}
            className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-880 bg-white dark:bg-slate-950 rounded-lg animate-fade-in"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {isEditMode ? 'Edit Deployment Request' : 'Application Deployment Request'}
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {isEditMode
                ? 'Update request configurations, details, and environment values.'
                : 'Request deployment of an application to the target environment.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            className="h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            {isEditMode ? <Save className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
            {isEditMode ? 'Save Changes' : 'Submit Request'}
          </Button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Form Details (Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Section 1: Request Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-855 pb-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-955/40 font-black">1</span>
              Request Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 text-left">
              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Requested By <span className="text-rose-500">*</span>
                </Label>
                <Select value={requestedBy} onValueChange={(val) => handleRequesterChange(val || '')}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-355 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Requester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Priya Kapoor">Priya Kapoor</SelectItem>
                    <SelectItem value="Aarav Rao">Aarav Rao</SelectItem>
                    <SelectItem value="Neha Bansal">Neha Bansal</SelectItem>
                    <SelectItem value="Vikram Tiwari">Vikram Tiwari</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Department <span className="text-rose-500">*</span>
                </Label>
                <Select value={department} onValueChange={(val) => setDepartment(val || '')}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business Analysis">Business Analysis</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="DevOps & Cloud">DevOps & Cloud</SelectItem>
                    <SelectItem value="Delivery Management">Delivery Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Request Date <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Required Date <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 text-left">
              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Deployment Type <span className="text-rose-500">*</span>
                </Label>
                <Select value={deploymentType} onValueChange={(val) => setDeploymentType(val || '')}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Application Deployment">Application Deployment</SelectItem>
                    <SelectItem value="Service Patch">Service Patch</SelectItem>
                    <SelectItem value="Infrastructure Upgrade">Infrastructure Upgrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Priority <span className="text-rose-500">*</span>
                </Label>
                <Select value={priority} onValueChange={(val) => setPriority((val || 'Medium') as any)}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-350 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">🔴 High</SelectItem>
                    <SelectItem value="Medium">🟡 Medium</SelectItem>
                    <SelectItem value="Low">🔵 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Environment <span className="text-rose-500">*</span>
                </Label>
                <Select value={environment} onValueChange={(val) => setEnvironment((val || 'Production') as any)}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-305 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Env" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Staging">Staging</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="UAT">UAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Change Type <span className="text-rose-500">*</span>
                </Label>
                <Select value={changeType} onValueChange={(val) => setChangeType(val || '')}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-305 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Change Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard Change">Standard Change</SelectItem>
                    <SelectItem value="Minor Change">Minor Change</SelectItem>
                    <SelectItem value="Major Change">Major Change</SelectItem>
                    <SelectItem value="Emergency Change">Emergency Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 text-left">
              <div className="grid gap-1.5 sm:col-span-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Reporting Manager
                </Label>
                <Select value={reportingManager} onValueChange={(val) => setReportingManager(val || '')}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aaray Rao (Project Manager)">Aaray Rao (Project Manager)</SelectItem>
                    <SelectItem value="Rahul Mehta (IT Manager)">Rahul Mehta (IT Manager)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5 sm:col-span-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Deployment For <span className="text-rose-500">*</span>
                </Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      id="for-internal"
                      name="deploymentFor"
                      checked={deploymentFor === 'Internal'}
                      onChange={() => setDeploymentFor('Internal')}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <Label htmlFor="for-internal" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Internal Application
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      id="for-third"
                      name="deploymentFor"
                      checked={deploymentFor === 'Third Party'}
                      onChange={() => setDeploymentFor('Third Party')}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <Label htmlFor="for-third" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Third Party Application
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="purpose" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Purpose / Justification <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Textarea
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    maxLength={250}
                    className="text-xs rounded-lg border-slate-200 dark:border-slate-800 min-h-[50px] resize-none pr-12"
                  />
                  <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-bold">
                    {purpose.length}/250
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Application Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-855 pb-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-955/40 font-black">2</span>
              Application Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 text-left">
              <div className="grid gap-1.5">
                <Label htmlFor="appName" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Application Name <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="appVersion" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Application Version <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="appVersion"
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Application Owner
                </Label>
                <Select value={appOwner} onValueChange={(val) => setAppOwner(val || '')}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Neha Bansal">Neha Bansal</SelectItem>
                    <SelectItem value="Rahul Mehta">Rahul Mehta</SelectItem>
                    <SelectItem value="Vikram Tiwari">Vikram Tiwari</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Application Type
                </Label>
                <Select value={appType} onValueChange={(val) => setAppType(val || '')}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web Application">Web Application</SelectItem>
                    <SelectItem value="Mobile Application">Mobile Application</SelectItem>
                    <SelectItem value="Microservice">Microservice</SelectItem>
                    <SelectItem value="API Service">API Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 text-left items-end">
              <div className="grid gap-1.5">
                <Label htmlFor="repository" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Repository / Source
                </Label>
                <Input
                  id="repository"
                  value={repository}
                  onChange={(e) => setRepository(e.target.value)}
                  className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="artifact" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Artifact / Package
                </Label>
                <Input
                  id="artifact"
                  value={artifact}
                  onChange={(e) => setArtifact(e.target.value)}
                  className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid gap-1.5 self-start pt-1">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Database Changes
                </Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      id="db-yes"
                      name="dbChanges"
                      checked={dbChanges === 'Yes'}
                      onChange={() => setDbChanges('Yes')}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <Label htmlFor="db-yes" className="text-xs font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                      Yes
                    </Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      id="db-no"
                      name="dbChanges"
                      checked={dbChanges === 'No'}
                      onChange={() => setDbChanges('No')}
                      className="h-3.5 w-3.5 accent-blue-600"
                    />
                    <Label htmlFor="db-no" className="text-xs font-semibold text-slate-700 dark:text-slate-355 cursor-pointer">
                      No
                    </Label>
                  </div>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Database Scripts
                </Label>
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-2 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-950/20 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors h-14">
                  <Upload className="h-4 w-4 text-blue-600" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1">
                    {dbScriptsFilename || 'Click to upload database scripts'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Deployment Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-955/40 font-black">3</span>
              Deployment Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 text-left">
              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Target Environment <span className="text-rose-500">*</span>
                </Label>
                <Select value={targetEnv} onValueChange={(val) => setTargetEnv(val || '')}>
                  <SelectTrigger className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 w-full">
                    <SelectValue placeholder="Select Target" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Staging">Staging</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="UAT">UAT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="serverCluster" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Server / Cluster <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="serverCluster"
                  value={serverCluster}
                  onChange={(e) => setServerCluster(e.target.value)}
                  className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Deployment Window <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={deploymentWindow}
                    onChange={(e) => setDeploymentWindow(e.target.value)}
                    className="pl-9 h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="downtime" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Estimated Downtime (mins)
                </Label>
                <Input
                  id="downtime"
                  type="number"
                  min="0"
                  value={estimatedDowntime}
                  onChange={(e) => setEstimatedDowntime(parseInt(e.target.value) || 0)}
                  className="h-9 text-xs rounded-lg border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="grid gap-1.5">
                <Label htmlFor="rollbackPlan" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Rollback Plan <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Textarea
                    id="rollbackPlan"
                    value={rollbackPlan}
                    onChange={(e) => setRollbackPlan(e.target.value)}
                    maxLength={250}
                    className="text-xs rounded-lg border-slate-200 dark:border-slate-800 min-h-[55px] resize-none pr-12"
                  />
                  <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-bold">
                    {rollbackPlan.length}/250
                  </span>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="dependencies" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Dependencies
                </Label>
                <div className="relative">
                  <Textarea
                    id="dependencies"
                    value={dependencies}
                    onChange={(e) => setDependencies(e.target.value)}
                    maxLength={250}
                    className="text-xs rounded-lg border-slate-200 dark:border-slate-800 min-h-[55px] resize-none pr-12"
                  />
                  <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-bold">
                    {dependencies.length}/250
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Additional Information */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-955/40 font-black">4</span>
              Additional Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="grid gap-1.5">
                <Label htmlFor="notes" className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Notes (Optional)
                </Label>
                <div className="relative">
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={250}
                    className="text-xs rounded-lg border-slate-200 dark:border-slate-800 min-h-[60px] resize-none pr-12"
                  />
                  <span className="absolute bottom-1 right-2 text-[10px] text-slate-400 font-bold">
                    {notes.length}/250
                  </span>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Attach Supporting Documents (Optional)
                </Label>
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-950/20 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors h-[80px]">
                  <Upload className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
                    {attachedDocsFilename || 'Click to upload or drag and drop'}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">
                    PDF, DOC, DOCX, XLS, PNG, JPG (Max. 10MB)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Approvals (Auto Workflow) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-955/40 font-black">5</span>
              Approvals (Auto Workflow)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 mt-2">
              {approvals.map((app) => (
                <div
                  key={app.step}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 hover:border-slate-200/80 dark:hover:border-slate-800 transition-colors"
                >
                  <span className="text-xs font-bold border border-slate-200 dark:border-slate-800 h-6 w-6 rounded-full flex items-center justify-center bg-white dark:bg-slate-950 shrink-0 shadow-xs">
                    {app.step}
                  </span>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {app.approver}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                      {app.role}
                    </p>
                  </div>
                  <span
                    className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                      app.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                      'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-slate-50 dark:border-slate-850 text-left">
              <Checkbox
                id="notify"
                checked={notifyUpdates}
                onCheckedChange={(checked) => setNotifyUpdates(!!checked)}
                className="h-4 w-4 rounded-xs border-slate-300 dark:border-slate-700"
              />
              <Label htmlFor="notify" className="text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-pointer">
                Notify me on email and system dashboard regarding deployment workflow status updates.
              </Label>
            </div>
          </div>
        </div>

        {/* Right Column: Summary Card and Action Cards (Span 1) */}
        <div className="lg:col-span-1 space-y-5">
          {/* Request Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5 text-left space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-50 dark:border-slate-850">
              Request Summary
            </h3>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
              <div className="flex justify-between">
                <span className="text-slate-400">Request ID</span>
                <span className="font-bold text-slate-900 dark:text-white">{isEditMode ? initialData?.id : 'Draft'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  (isEditMode ? initialData?.status : 'Pending') === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/30' :
                  (isEditMode ? initialData?.status : 'Pending') === 'Approved' ? 'bg-blue-50 text-blue-600 border-blue-100/30' :
                  (isEditMode ? initialData?.status : 'Pending') === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100/30' :
                  'bg-amber-50 text-amber-600 border-amber-100/30'
                }`}>
                  {isEditMode ? initialData?.status : 'Pending'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Priority</span>
                <span className="text-amber-500 font-bold flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  {priority || 'Medium'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Requested By</span>
                <span className="text-slate-800 dark:text-slate-200">{requestedBy || 'N/A'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Request Date</span>
                <span className="text-slate-800 dark:text-slate-200">{requestDate || 'N/A'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Required Date</span>
                <span className="text-slate-800 dark:text-slate-200">{requiredDate || 'N/A'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Deployment Type</span>
                <span className="text-slate-800 dark:text-slate-200 truncate max-w-[120px]" title={deploymentType}>{deploymentType || 'N/A'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Environment</span>
                <span className="text-slate-800 dark:text-slate-200">{environment || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-855 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5 text-left">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-50 dark:border-slate-855">
              Quick Actions
            </h3>

            <div className="mt-3 space-y-1">
              {[
                { title: 'My Requests', path: '/system/application-deployment' },
                { title: 'Request History', path: '/system/application-deployment' },
                { title: 'Application Catalog', path: '/system/application-deployment' },
                { title: 'Change Calendar', path: '/system/application-deployment' }
              ].map((act, index) => (
                <button
                  key={index}
                  onClick={onCancel}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{act.title}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Help Desk Contact Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] p-5 text-left">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Need Help?
              </h4>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                For any issues with application deployment requests, contact IT Support.
              </p>

              <div className="space-y-2.5 pt-2 text-xs font-bold">
                <a
                  href="mailto:support@crmfarmit.com"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Mail className="h-4 w-4 text-slate-400" />
                  support@crmfarmit.com
                </a>
                <a
                  href="tel:+918012345678"
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-300"
                >
                  <Phone className="h-4 w-4 text-slate-400" />
                  +91 80 1234 5678
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
