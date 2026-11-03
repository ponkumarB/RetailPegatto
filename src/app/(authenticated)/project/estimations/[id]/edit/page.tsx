'use client';
import { getTenantName } from '@/service/apiClient';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calculator,
  FileText,
  Printer,
  RotateCcw,
  Save,
  Download,
  Info,
  Calendar,
  ChevronDown,
  Sparkles,
  Users,
  Building,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/store/useStore';
import { usePermission } from '@/hooks/usePermission';
import { fetchProjectlistwithoutpaginaton } from '@/service/api/Project/api';
import { fetchSoftwareEstimationById, updateSoftwareEstimation } from '@/service/api/SoftwareEstimation/api';
import { fetchUsersList } from '@/service/api/Leads/api';
import { fetchDropDownList } from '@/service/api/Resource/api';
import { fetchAccountFullList } from '@/service/api/Company/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Import export utilities
import {
  exportAsJSON,
  exportAsCSV,
  printEstimation,
  generatePrintStyles,
  formatCurrency
} from '@/utils/estimationExport';

// standard weights
const WEIGHTS = {
  ei: { low: 3, medium: 4, high: 6 },
  eo: { low: 4, medium: 5, high: 7 },
  eq: { low: 3, medium: 4, high: 6 },
  ilf: { low: 7, medium: 10, high: 15 },
  eif: { low: 5, medium: 7, high: 10 }
};

interface TagInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function TagInput({ label, placeholder, value, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const tags = useMemo(() => {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }, [value]);

  const addTag = (tagText: string) => {
    const trimmed = tagText.trim();
    if (!trimmed) return;
    if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue('');
      return;
    }
    const newTags = [...tags, trimmed];
    onChange(newTags.join(', '));
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    const newTags = tags.filter((_, idx) => idx !== indexToRemove);
    onChange(newTags.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="space-y-1.5 text-left">
      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</Label>
      <div className="flex flex-wrap gap-1.5 p-1.5 min-h-[38px] w-full rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-xs focus-within:ring-1 focus-within:ring-slate-900 dark:focus-within:ring-slate-300">
        {tags.map((tag, idx) => (
          <Badge
            key={idx}
            variant="outline"
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-700"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="text-slate-400 hover:text-red-500 rounded-full focus:outline-none transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none py-0.5 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>
    </div>
  );
}

interface MultiSelectUsersProps {
  label: string;
  placeholder: string;
  selectedValues: string;
  onChange: (value: string) => void;
  users: any[];
}

function MultiSelectUsers({ label, placeholder, selectedValues, onChange, users }: MultiSelectUsersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedNames = useMemo(() => {
    return selectedValues.split(',').map(s => s.trim()).filter(Boolean);
  }, [selectedValues]);

  const handleToggleUser = (userName: string) => {
    let newNames: string[];
    if (selectedNames.includes(userName)) {
      newNames = selectedNames.filter(name => name !== userName);
    } else {
      newNames = [...selectedNames, userName];
    }
    onChange(newNames.join(', '));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-1.5 text-left relative" ref={containerRef}>
      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</Label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-wrap gap-1.5 p-1.5 min-h-[38px] w-full rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-xs cursor-pointer focus-within:ring-1 focus-within:ring-slate-900 dark:focus-within:ring-slate-300"
      >
        {selectedNames.length === 0 ? (
          <span className="text-slate-400 py-0.5 px-1">{placeholder}</span>
        ) : (
          selectedNames.map((name, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-850 dark:text-slate-300 dark:border-slate-700"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleUser(name);
              }}
            >
              <span>{name}</span>
              <span className="text-slate-400 hover:text-red-500 rounded-full focus:outline-none transition-colors">
                <X className="h-3 w-3" />
              </span>
            </Badge>
          ))
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900 p-1">
          {users.length > 0 ? (
            users.map((u: any) => {
              const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.name;
              const isSelected = selectedNames.includes(fullName);
              return (
                <div
                  key={u.id}
                  onClick={() => handleToggleUser(fullName)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 text-xs rounded-sm cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                    isSelected ? "bg-slate-50 dark:bg-slate-800/50 font-semibold text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  <span>{fullName}</span>
                  {isSelected && <span className="text-blue-600 dark:text-blue-400">✓</span>}
                </div>
              );
            })
          ) : (
            <div className="px-2.5 py-1.5 text-xs text-slate-400">No resources available</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EditEstimationPage() {
  const { primaryColor } = useStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const id = params.id as string;
  const { canEditEstimation, isLoaded } = usePermission();

  useEffect(() => {
    if (isLoaded && !canEditEstimation) {
      toast.error('You do not have permission to edit estimations.');
      router.push('/project/estimations');
    }
  }, [canEditEstimation, isLoaded, router]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [mappedReportData, setMappedReportData] = useState<any>(null);

  if (isLoaded && !canEditEstimation) {
    return null;
  }

  // Fetch estimation data
  const { data: estimationItem, isLoading: isFetchingEstimation } = useQuery({
    queryKey: ['softwareEstimation', id],
    queryFn: () => fetchSoftwareEstimationById(id),
    enabled: Boolean(id),
  });

  // Fetch projects list
  const { data: projectsData } = useQuery({
    queryKey: ['projectListForEstimations'],
    queryFn: fetchProjectlistwithoutpaginaton,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch users for Estimated_By dropdown
  const { data: usersData } = useQuery({
    queryKey: ['usersList'],
    queryFn: fetchUsersList,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch currency dropdown from Dropdowntables
  const { data: currencyData } = useQuery({
    queryKey: ['dropdown', 'Currency'],
    queryFn: () => fetchDropDownList('Currency'),
    staleTime: 1000 * 60 * 5,
  });

  const extractDropdownValues = (data: any): string[] => {
    if (!data) return [];
    const list = Array.isArray(data) ? data : (data.results || data.data || []);
    if (!Array.isArray(list) || list.length === 0) return [];
    const group = list[0];
    if (!group) return [];
    if (Array.isArray(group.Values)) return group.Values.map((v: any) => typeof v === 'string' ? v : v.value || v.name || '').filter(Boolean);
    if (typeof group.Dropdown_Values === 'string') return group.Dropdown_Values.split(',').map((v: string) => v.trim()).filter(Boolean);
    return [];
  };

  // Fetch Accounts / Customers dropdown list
  const { data: accountsData } = useQuery({
    queryKey: ['accountsListForDropdown'],
    queryFn: fetchAccountFullList,
    staleTime: 1000 * 60 * 5,
  });

  const currencyOptions = useMemo(() => extractDropdownValues(currencyData), [currencyData]);

  const users = useMemo(() => {
    if (!usersData) return [];
    return Array.isArray(usersData) ? usersData : (usersData.results || usersData.data || []);
  }, [usersData]);

  const accountsList = useMemo(() => {
    if (!accountsData) return [];
    return Array.isArray(accountsData) ? accountsData : (accountsData.results || accountsData.data || []);
  }, [accountsData]);

  const projectList = useMemo(() => Array.isArray(projectsData) ? projectsData : [], [projectsData]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const getProjectDisplayName = (project: any) => {
    return (
      project?.project_name ||
      project?.Project_Name ||
      project?.name ||
      project?.ProjectName ||
      String(project?.project_id ?? project?.id ?? project?.Project_Id ?? '')
    );
  };

  const getProjectField = (project: any, ...keys: string[]) => {
    for (const key of keys) {
      const value = project?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value);
      }
    }
    return '';
  };

  const normalizedEstimation = React.useMemo(() => {
    if (!estimationItem) return null;
    if (Array.isArray(estimationItem)) {
      return estimationItem[0] ?? null;
    }
    if (estimationItem.results && Array.isArray(estimationItem.results)) {
      return estimationItem.results[0] ?? null;
    }
    if (estimationItem.data && Array.isArray(estimationItem.data)) {
      return estimationItem.data[0] ?? null;
    }
    return estimationItem;
  }, [estimationItem]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => {
      const apiPayload = {
        id: payload?.id,
        Project_Id: payload.Project_Id,
        project_name: payload.project_name,
        technology_type: payload.technology_type,
        hours_per_fp: payload.hours_per_fp,
        cost_per_hour: payload.cost_per_hour,
        currency: payload.currency,
        contingency_percentage: payload.contingency_percentage,
        team_size: payload.team_size,
        working_days_per_month: payload.working_days_per_month,
        Notes: payload.Notes,
        ei_low: payload.ei_low,
        ei_medium: payload.ei_medium,
        ei_high: payload.ei_high,
        eo_low: payload.eo_low,
        eo_medium: payload.eo_medium,
        eo_high: payload.eo_high,
        eq_low: payload.eq_low,
        eq_medium: payload.eq_medium,
        eq_high: payload.eq_high,
        ilf_low: payload.ilf_low,
        ilf_medium: payload.ilf_medium,
        ilf_high: payload.ilf_high,
        eif_low: payload.eif_low,
        eif_medium: payload.eif_medium,
        eif_high: payload.eif_high,
        gsc_data_communications: payload.gsc_data_communications,
        gsc_distributed_processing: payload.gsc_distributed_processing,
        gsc_performance: payload.gsc_performance,
        gsc_heavily_used_configuration: payload.gsc_heavily_used_configuration,
        gsc_transaction_rate: payload.gsc_transaction_rate,
        gsc_online_data_entry: payload.gsc_online_data_entry,
        gsc_end_user_efficiency: payload.gsc_end_user_efficiency,
        gsc_online_update: payload.gsc_online_update,
        gsc_complex_processing: payload.gsc_complex_processing,
        gsc_reusability: payload.gsc_reusability,
        gsc_installation_ease: payload.gsc_installation_ease,
        gsc_operational_ease: payload.gsc_operational_ease,
        gsc_multiple_sites: payload.gsc_multiple_sites,
        gsc_facilitate_change: payload.gsc_facilitate_change,
        ufp: payload.ufp,
        tdi: payload.tdi,
        vaf: payload.vaf,
        afp: payload.afp,
        roundedAFP: payload.roundedAFP,
        effort_hours: payload.effort_hours,
        base_cost: payload.base_cost,
        contingency_amount: payload.contingency_amount,
        total_estimated_cost: payload.total_estimated_cost,
        duration_months: payload.duration_months,
        // Newly added fields
        Project_Version: payload.Project_Version,
        Estimated_By: payload.Estimated_By ? Number(payload.Estimated_By) : null,
        Estimated_StartDate: payload.Estimated_StartDate || null,
        Estimated_EndDate: payload.Estimated_EndDate || null,
        Organization_Id: payload.Organization_Id || null,
        Domain: payload.Domain,
        Development_Approach: payload.Development_Approach,
        Technology_Stack: payload.Technology_Stack,
        Resources_Used: payload.Resources_Used,
        hours_per_day: payload.hours_per_day,
        percentage_development: payload.percentage_development,
        percentage_testing: payload.percentage_testing,
        percentage_management: payload.percentage_management,
        percentage_infrastructure: payload.percentage_infrastructure,
        Customer_Name: payload.Customer_Name || null,
        Customer_Id: payload.Customer_Id ? Number(payload.Customer_Id) : null
      };
      return updateSoftwareEstimation(apiPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['softwareEstimations'] });
      queryClient.invalidateQueries({ queryKey: ['softwareEstimation', id] });
      toast.success('Software estimation updated successfully!');
      router.push('/project/estimations');
    },
    onError: (error: any) => {
      toast.error(`Failed to update estimation: ${error?.message || 'Unknown error'}`);
    },
  });

  // 1. Project Information States
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Web Application');
  const [clientName, setClientName] = useState('');
  const [customerId, setCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [domain, setDomain] = useState('CRM / Sales');
  const [organization, setOrganization] = useState('CRMFarm IT');
  const [developmentApproach, setDevelopmentApproach] = useState('Agile / Scrum');
  const [projectManager, setProjectManager] = useState('');
  const [technologyStack, setTechnologyStack] = useState('');
  const [estimationDate, setEstimationDate] = useState('');
  const [version, setVersion] = useState('v1.0');
  const [estimatedBy, setEstimatedBy] = useState('');
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [estimatedEndDate, setEstimatedEndDate] = useState('');
  const [resourcesUsed, setResourcesUsed] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [percentageDevelopment, setPercentageDevelopment] = useState(0);
  const [percentageTesting, setPercentageTesting] = useState(0);
  const [percentageManagement, setPercentageManagement] = useState(0);
  const [percentageInfrastructure, setPercentageInfrastructure] = useState(50);

  // 2. Count Function Point Components States
  const [eiCount, setEiCount] = useState({ low: 0, medium: 0, high: 0 });
  const [eoCount, setEoCount] = useState({ low: 0, medium: 0, high: 0 });
  const [eqCount, setEqCount] = useState({ low: 0, medium: 0, high: 0 });
  const [ilfCount, setIlfCount] = useState({ low: 0, medium: 0, high: 0 });
  const [eifCount, setEifCount] = useState({ low: 0, medium: 0, high: 0 });

  // 4. GSC - Ratings States
  const [ratings, setRatings] = useState({
    dataComm: 0,
    distProcessing: 0,
    performance: 0,
    heavilyUsedConfig: 0,
    transactionRate: 0,
    onlineDataEntry: 0,
    endUserEfficiency: 0,
    onlineUpdate: 0,
    complexProcessing: 0,
    reusability: 0,
    installationEase: 0,
    operationalEase: 0,
    multipleSites: 0,
    facilitateChange: 0
  });

  // 6. Productivity States
  const [productivityHours, setProductivityHours] = useState(12);

  // 7. Cost Estimation States
  const [costPerHour, setCostPerHour] = useState(1200);
  const [contingencyPercent, setContingencyPercent] = useState(10);
  const [currency, setCurrency] = useState('INR (₹)');
  const currencySymbol = useMemo(() => currency.match(/\((.*?)\)/)?.[1] || "₹", [currency]);
  const currencyCode = useMemo(() => currency.split(' ')[0] || "INR", [currency]);
  const [notes, setNotes] = useState('');

  // 8. Duration & Team Size States
  const [teamSize, setTeamSize] = useState(5);
  const [workingDays, setWorkingDays] = useState(22);

  // Helper function to extract project ID from nested object
  const extractProjectId = (estimation: any): string | null => {
    if (!estimation) return null;

    // Check for Project_Id in various formats
    const projectId = estimation.Project_Id;

    if (!projectId) return null;

    // If it's a string or number, return it directly
    if (typeof projectId === 'string' || typeof projectId === 'number') {
      return String(projectId);
    }

    // If it's an object with id property
    if (typeof projectId === 'object' && projectId !== null) {
      // Try to get id from various possible properties
      const idValue = projectId.id ?? projectId.Project_Id ?? projectId.project_id ?? projectId.value;
      if (idValue !== undefined && idValue !== null) {
        return String(idValue);
      }
    }

    // Check for project_id in the root
    if (estimation.project_id) {
      return String(estimation.project_id);
    }

    return null;
  };

  // Load estimation data once it is available
  useEffect(() => {
    if (normalizedEstimation && !isDataLoaded) {
      // Map API response fields to component state
      setProjectName(normalizedEstimation.project_name ?? '');
      setProjectType(normalizedEstimation.technology_type ?? 'Web Application');
      const custName = normalizedEstimation.Customer_Name ?? normalizedEstimation.customer_name ?? '';
      const custId = normalizedEstimation.Customer_Id ?? normalizedEstimation.customer_id ?? '';
      setCustomerName(custName);
      setClientName(custName);
      if (custId) setCustomerId(String(custId));
      setDomain(normalizedEstimation.Domain ?? normalizedEstimation.domain ?? 'CRM / Sales');
      setOrganization(normalizedEstimation.organization ?? 'CRMFarm IT');
      setDevelopmentApproach(normalizedEstimation.Development_Approach ?? normalizedEstimation.developmentApproach ?? 'Agile / Scrum');

      const techStack = normalizedEstimation.Technology_Stack ?? normalizedEstimation.technologyStack ?? '';
      setTechnologyStack(Array.isArray(techStack) ? techStack.join(', ') : techStack);

      setEstimationDate(normalizedEstimation.created_Date ?? '');
      setVersion(normalizedEstimation.Project_Version ?? normalizedEstimation.version ?? 'v1.0');

      const estBy = normalizedEstimation.Estimated_By?.id ?? normalizedEstimation.Estimated_By ?? '';
      setEstimatedBy(String(estBy));

      setEstimatedStartDate((normalizedEstimation.estimated_start_date ?? normalizedEstimation.Estimated_StartDate ?? '').substring(0, 10));
      setEstimatedEndDate((normalizedEstimation.estimated_end_date ?? normalizedEstimation.Estimated_EndDate ?? '').substring(0, 10));

      const resUsed = normalizedEstimation.Resources_Used ?? '';
      setResourcesUsed(Array.isArray(resUsed) ? resUsed.join(', ') : resUsed);

      setHoursPerDay(normalizedEstimation.hours_per_day ?? 8);
      setPercentageDevelopment(normalizedEstimation.percentage_development ?? 0);
      setPercentageTesting(normalizedEstimation.percentage_testing ?? 0);
      setPercentageManagement(normalizedEstimation.percentage_management ?? 0);
      setPercentageInfrastructure(normalizedEstimation.percentage_infrastructure ?? 50);

      // Map function point counts
      setEiCount({
        low: normalizedEstimation.ei_low ?? 0,
        medium: normalizedEstimation.ei_medium ?? 0,
        high: normalizedEstimation.ei_high ?? 0
      });
      setEoCount({
        low: normalizedEstimation.eo_low ?? 0,
        medium: normalizedEstimation.eo_medium ?? 0,
        high: normalizedEstimation.eo_high ?? 0
      });
      setEqCount({
        low: normalizedEstimation.eq_low ?? 0,
        medium: normalizedEstimation.eq_medium ?? 0,
        high: normalizedEstimation.eq_high ?? 0
      });
      setIlfCount({
        low: normalizedEstimation.ilf_low ?? 0,
        medium: normalizedEstimation.ilf_medium ?? 0,
        high: normalizedEstimation.ilf_high ?? 0
      });
      setEifCount({
        low: normalizedEstimation.eif_low ?? 0,
        medium: normalizedEstimation.eif_medium ?? 0,
        high: normalizedEstimation.eif_high ?? 0
      });

      // Map GSC ratings
      setRatings({
        dataComm: normalizedEstimation.gsc_data_communications ?? 0,
        distProcessing: normalizedEstimation.gsc_distributed_processing ?? 0,
        performance: normalizedEstimation.gsc_performance ?? 0,
        heavilyUsedConfig: normalizedEstimation.gsc_heavily_used_configuration ?? 0,
        transactionRate: normalizedEstimation.gsc_transaction_rate ?? 0,
        onlineDataEntry: normalizedEstimation.gsc_online_data_entry ?? 0,
        endUserEfficiency: normalizedEstimation.gsc_end_user_efficiency ?? 0,
        onlineUpdate: normalizedEstimation.gsc_online_update ?? 0,
        complexProcessing: normalizedEstimation.gsc_complex_processing ?? 0,
        reusability: normalizedEstimation.gsc_reusability ?? 0,
        installationEase: normalizedEstimation.gsc_installation_ease ?? 0,
        operationalEase: normalizedEstimation.gsc_operational_ease ?? 0,
        multipleSites: normalizedEstimation.gsc_multiple_sites ?? 0,
        facilitateChange: normalizedEstimation.gsc_facilitate_change ?? 0
      });

      // Map productivity and cost
      setProductivityHours(normalizedEstimation.hours_per_fp ?? 12);
      setCostPerHour(normalizedEstimation.cost_per_hour ?? 1200);
      setContingencyPercent(normalizedEstimation.contingency_percentage ?? 10);
      setCurrency(normalizedEstimation.currency ?? 'INR (₹)');
      setNotes(normalizedEstimation.Notes ?? '');
      setTeamSize(normalizedEstimation.team_size ?? 5);
      setWorkingDays(normalizedEstimation.working_days_per_month ?? 22);

      // Set selected project ID using the helper function
      const projectId = extractProjectId(normalizedEstimation);
      if (projectId) {
        setSelectedProjectId(projectId);
      }

      setIsDataLoaded(true);
    } else if (!isFetchingEstimation && !normalizedEstimation) {
      toast.error('Estimation not found.');
      router.push('/project/estimations');
    }
  }, [normalizedEstimation, isFetchingEstimation, id, router, isDataLoaded]);

  // Update project fields when project selection changes
  useEffect(() => {
    if (!selectedProjectId || projectList.length === 0 || !isDataLoaded || !normalizedEstimation) return;

    const selectedProject = projectList.find((project: any) =>
      String(project.id) === selectedProjectId ||
      String(project.project_id) === selectedProjectId ||
      String(project.Project_Id) === selectedProjectId
    );

    if (!selectedProject) return;

    // Get project manager from project
    const pmFromProject = getProjectField(
      selectedProject,
      'Project_Manager_Name',
      'projectManager',
      'owner',
      'Project_Sponsor',
      'Project_Owner',
      'project_owner'
    );

    // Get client name from project
    const clientFromProject = getProjectField(
      selectedProject,
      'Customer_Name',
      'clientName',
      'client_name',
      'Customer',
      'customer',
      'Client',
      'client'
    );

    if (clientFromProject) {
      setClientName(clientFromProject);
    }

    if (pmFromProject) {
      setProjectManager(pmFromProject);
    }

    // ONLY overwrite estimation's saved details with project defaults if the project was actually changed by the user!
    const originalProjectId = extractProjectId(normalizedEstimation);
    if (selectedProjectId !== originalProjectId) {
      // Get project name from project
      const projectNameFromProject = getProjectDisplayName(selectedProject);
      setProjectName(projectNameFromProject || projectName);
      setProjectType(getProjectField(selectedProject, 'Project_Type', 'project_type', 'projectType') || projectType);
      setDomain(getProjectField(selectedProject, 'Domain', 'domain') || domain);
      setOrganization(getProjectField(selectedProject, 'Organization', 'organization') || organization);
      setDevelopmentApproach(getProjectField(selectedProject, 'Development_Approach', 'developmentApproach') || developmentApproach);
      setTechnologyStack(getProjectField(selectedProject, 'Technology_Stack', 'technologyStack', 'TechStack') || technologyStack);
    }
  }, [selectedProjectId, projectList, isDataLoaded, normalizedEstimation]);

  // 3. Calculated Function Point totals
  const ufpCalculations = useMemo(() => {
    const eiLow = eiCount.low * WEIGHTS.ei.low;
    const eiMed = eiCount.medium * WEIGHTS.ei.medium;
    const eiHigh = eiCount.high * WEIGHTS.ei.high;
    const eiTotal = eiLow + eiMed + eiHigh;

    const eoLow = eoCount.low * WEIGHTS.eo.low;
    const eoMed = eoCount.medium * WEIGHTS.eo.medium;
    const eoHigh = eoCount.high * WEIGHTS.eo.high;
    const eoTotal = eoLow + eoMed + eoHigh;

    const eqLow = eqCount.low * WEIGHTS.eq.low;
    const eqMed = eqCount.medium * WEIGHTS.eq.medium;
    const eqHigh = eqCount.high * WEIGHTS.eq.high;
    const eqTotal = eqLow + eqMed + eqHigh;

    const ilfLow = ilfCount.low * WEIGHTS.ilf.low;
    const ilfMed = ilfCount.medium * WEIGHTS.ilf.medium;
    const ilfHigh = ilfCount.high * WEIGHTS.ilf.high;
    const ilfTotal = ilfLow + ilfMed + ilfHigh;

    const eifLow = eifCount.low * WEIGHTS.eif.low;
    const eifMed = eifCount.medium * WEIGHTS.eif.medium;
    const eifHigh = eifCount.high * WEIGHTS.eif.high;
    const eifTotal = eifLow + eifMed + eifHigh;

    const totalUFP = eiTotal + eoTotal + eqTotal + ilfTotal + eifTotal;

    return {
      ei: { low: eiLow, med: eiMed, high: eiHigh, total: eiTotal },
      eo: { low: eoLow, med: eoMed, high: eoHigh, total: eoTotal },
      eq: { low: eqLow, med: eqMed, high: eqHigh, total: eqTotal },
      ilf: { low: ilfLow, med: ilfMed, high: ilfHigh, total: ilfTotal },
      eif: { low: eifLow, med: eifMed, high: eifHigh, total: eifTotal },
      totalUFP
    };
  }, [eiCount, eoCount, eqCount, ilfCount, eifCount]);

  const ufp = ufpCalculations.totalUFP;

  // TDI, VAF, AFP Calculations
  const tdi = Object.values(ratings).reduce((a, b) => a + b, 0);
  const vaf = parseFloat((0.65 + 0.01 * tdi).toFixed(2));
  const afp = parseFloat((ufp * vaf).toFixed(2));
  const roundedAFP = Math.round(afp);

  // Effort Calculations
  const effortHours = roundedAFP * productivityHours;

  // Cost Calculations
  const baseCost = effortHours * costPerHour;
  const contingencyCost = baseCost * (contingencyPercent / 100);
  const totalCost = baseCost + contingencyCost;

  // Duration Calculation
  const durationMonths = parseFloat((roundedAFP / (teamSize * 18.4)).toFixed(2));

  // Save handler
  const handleSave = () => {
    if (!projectName.trim()) {
      toast.error('Project Name is required.');
      return;
    }

    const payload = {
      id: id,
      Project_Id: selectedProjectId ? parseInt(selectedProjectId) : null,
      project_name: projectName,
      technology_type: projectType,
      hours_per_fp: productivityHours,
      cost_per_hour: costPerHour,
      currency: currency,
      contingency_percentage: contingencyPercent,
      team_size: teamSize,
      working_days_per_month: workingDays,
      Notes: notes,
      ei_low: eiCount.low,
      ei_medium: eiCount.medium,
      ei_high: eiCount.high,
      eo_low: eoCount.low,
      eo_medium: eoCount.medium,
      eo_high: eoCount.high,
      eq_low: eqCount.low,
      eq_medium: eqCount.medium,
      eq_high: eqCount.high,
      ilf_low: ilfCount.low,
      ilf_medium: ilfCount.medium,
      ilf_high: ilfCount.high,
      eif_low: eifCount.low,
      eif_medium: eifCount.medium,
      eif_high: eifCount.high,
      gsc_data_communications: ratings.dataComm,
      gsc_distributed_processing: ratings.distProcessing,
      gsc_performance: ratings.performance,
      gsc_heavily_used_configuration: ratings.heavilyUsedConfig,
      gsc_transaction_rate: ratings.transactionRate,
      gsc_online_data_entry: ratings.onlineDataEntry,
      gsc_end_user_efficiency: ratings.endUserEfficiency,
      gsc_online_update: ratings.onlineUpdate,
      gsc_complex_processing: ratings.complexProcessing,
      gsc_reusability: ratings.reusability,
      gsc_installation_ease: ratings.installationEase,
      gsc_operational_ease: ratings.operationalEase,
      gsc_multiple_sites: ratings.multipleSites,
      gsc_facilitate_change: ratings.facilitateChange,
      ufp: ufp,
      tdi: tdi,
      vaf: vaf,
      afp: afp,
      roundedAFP: roundedAFP,
      effort_hours: effortHours,
      base_cost: baseCost,
      contingency_amount: contingencyCost,
      total_estimated_cost: totalCost,
      duration_months: durationMonths,
      // New integration fields
      Project_Version: version,
      Estimated_By: estimatedBy || null,
      Estimated_StartDate: estimatedStartDate || null,
      Estimated_EndDate: estimatedEndDate || null,
      Organization_Id: typeof window !== 'undefined' && localStorage.getItem('Organization_Id') ? Number(localStorage.getItem('Organization_Id')) : null,
      Domain: domain,
      Development_Approach: developmentApproach,
      Technology_Stack: Array.from(new Set(technologyStack.split(',').map(s => s.trim()).filter(Boolean))),
      Resources_Used: Array.from(new Set(resourcesUsed.split(',').map(s => s.trim()).filter(Boolean))),
      hours_per_day: hoursPerDay,
      percentage_development: percentageDevelopment,
      percentage_testing: percentageTesting,
      percentage_management: percentageManagement,
      percentage_infrastructure: percentageInfrastructure,
      Customer_Name: customerName || clientName || null,
      Customer_Id: customerId ? Number(customerId) : null
    };

    updateMutation.mutate(payload);
  };

  // Export Handlers
  const handleExportJSON = () => {
    const data = {
      projectName,
      projectType,
      clientName,
      domain,
      organization,
      developmentApproach,
      projectManager,
      technologyStack,
      estimationDate,
      version,
      ufp,
      tdi,
      vaf,
      afp,
      roundedAFP,
      effortHours,
      baseCost,
      contingencyPercent,
      contingencyAmount: contingencyCost,
      totalCost,
      teamSize,
      workingDays,
      durationMonths,
      currency,
      notes,
      eiCount,
      eoCount,
      eqCount,
      ilfCount,
      eifCount,
      ratings
    };
    exportAsJSON(data);
    toast.success('Estimation exported as JSON successfully!');
  };

  const handleExportCSV = () => {
    const data = {
      projectName,
      projectType,
      clientName,
      domain,
      organization,
      developmentApproach,
      projectManager,
      technologyStack,
      estimationDate,
      version,
      ufp,
      tdi,
      vaf,
      afp,
      roundedAFP,
      effortHours,
      baseCost,
      contingencyPercent,
      contingencyAmount: contingencyCost,
      totalCost,
      teamSize,
      workingDays,
      durationMonths,
      currency,
      notes,
      eiCount,
      eoCount,
      eqCount,
      ilfCount,
      eifCount,
      ratings
    };
    exportAsCSV(data);
    toast.success('Estimation exported as CSV successfully!');
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe number formatter
  const safeNumber = (value: number): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return value.toString();
  };

  if (isFetchingEstimation) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold">Loading software estimation data...</p>
        </div>
      </div>
    );
  }

  if (!normalizedEstimation) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 mx-auto bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center mb-3">
            <FileText className="h-6 w-6 text-rose-500" />
          </div>
          <p className="text-sm text-red-500 font-semibold">Estimation not found.</p>
          <Button
            className="mt-4"
            onClick={() => router.push('/project/estimations')}
          >
            Back to Estimations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 text-left pb-20 p-1">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push('/')} className="cursor-pointer">{getTenantName().toUpperCase()}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push('/project')} className="cursor-pointer">Projects</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => router.push('/project/estimations')} className="cursor-pointer">Software Estimation</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Sizing ({normalizedEstimation.SoftwareEstimation_Id || id})</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header Block */}
      <div className="flex flex-col gap-4 md:gap-2 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            Edit Software Estimation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Modify function point counts, system complexity ratings, effort conversion ratios, or team sizing parameters.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="h-9 gap-1.5 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-855 rounded-sm text-xs font-semibold text-slate-700 dark:text-slate-300"
            onClick={() => router.push('/project/estimations')}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to List
          </Button>
          <Button
            className="h-9 gap-1.5 text-white font-semibold rounded-sm px-4 hover:opacity-90 active:scale-95 transition-all text-xs cursor-pointer"
            style={{ backgroundColor: primaryColor }}
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" /> Update Estimation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ================= SECTION 1: PROJECT INFORMATION ================= */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-visible">
        <div className="p-4 border-b dark:border-slate-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">1. Project Information</h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5 text-left text-xs font-semibold">
            {/* Project Name Input */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Name *</Label>
              <Input
                placeholder="Enter Project Name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900"
              />
            </div>

            {/* Project Type */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Type</Label>
              <Select value={projectType} onValueChange={(val) => val && setProjectType(val)}>
                <SelectTrigger className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded">
                  <SelectValue placeholder="-- Select Type --" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 text-xs">
                  <SelectItem value="Web Application">Web Application</SelectItem>
                  <SelectItem value="Enterprise Application">Enterprise Application</SelectItem>
                  <SelectItem value="Complex / Integrated System">Complex / Integrated System</SelectItem>
                  <SelectItem value="AI / ML Based Application">AI / ML Based Application</SelectItem>
                  <SelectItem value="Mobile Application">Mobile Application</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Client / Customer */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Client / Customer</Label>
              <Select
                value={customerName || clientName}
                onValueChange={(val) => {
                  setCustomerName(val || '');
                  setClientName(val || '');
                  const selectedAcc = accountsList.find((acc: any) => {
                    const accName = acc.Customer_Name || acc.Lead_Name || acc.Contact_Name || acc.Account_Name || acc.Name || '';
                    return accName === val;
                  });
                  if (selectedAcc) {
                    setCustomerId(String(selectedAcc.id ?? selectedAcc.Account_Id));
                  }
                }}
              >
                <SelectTrigger className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                  <SelectValue placeholder="-- Select Customer --" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 text-xs max-h-60 overflow-y-auto">
                  {accountsList.map((acc: any, idx: number) => {
                    const accId = String(acc.id ?? acc.Account_Id);
                    const accName = acc.Customer_Name || acc.Lead_Name || acc.Contact_Name || acc.Account_Name || acc.Name || `Account #${accId}`;
                    return (
                      <SelectItem key={`${accId}-${idx}`} value={accName}>
                        {accName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/* Domain / Industry */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Domain / Industry</Label>
              <Select value={domain} onValueChange={(val) => val && setDomain(val)}>
                <SelectTrigger className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded">
                  <SelectValue placeholder="-- Select Industry --" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 text-xs">
                  <SelectItem value="CRM / Sales">CRM / Sales</SelectItem>
                  <SelectItem value="Logistics / Supply Chain">Logistics / Supply Chain</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Financial Services">Financial Services</SelectItem>
                  <SelectItem value="E-Commerce">E-Commerce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Development Approach */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Development Approach</Label>
              <Select value={developmentApproach} onValueChange={(val) => val && setDevelopmentApproach(val)}>
                <SelectTrigger className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded">
                  <SelectValue placeholder="-- Select Approach --" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 text-xs">
                  <SelectItem value="Agile / Scrum">Agile / Scrum</SelectItem>
                  <SelectItem value="Waterfall">Waterfall</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Kanban">Kanban</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Project Manager - Auto-populated from project */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Manager</Label>
              <Input
                placeholder="Auto-populated from project"
                value={projectManager}
                onChange={(e) => setProjectManager(e.target.value)}
                className="h-9 text-xs border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded"
                readOnly
              />
              <span className="text-[9px] text-slate-400">Auto-populated from selected project</span>
            </div>
            {/* Technology Stack */}
            <TagInput
              label="Technology Stack"
              placeholder="e.g. .NET, React, SQL (Press Enter or comma to add)"
              value={technologyStack}
              onChange={setTechnologyStack}
            />

            {/* Estimation Version */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimation Version</Label>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded"
              />
            </div>
            {/* Estimated By */}
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated By</Label>
              <Select value={estimatedBy} onValueChange={(val) => setEstimatedBy(val || '')}>
                <SelectTrigger className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded">
                  <SelectValue placeholder="-- Select Estimator --">
                    {(() => {
                      const matchedUser = users.find((u: any) => String(u.id) === String(estimatedBy));
                      if (matchedUser) {
                        return `${matchedUser.first_name || ''} ${matchedUser.last_name || ''}`.trim() || matchedUser.username || matchedUser.name;
                      }
                      if (normalizedEstimation?.Estimated_By) {
                        const est = normalizedEstimation.Estimated_By;
                        if (typeof est === 'object') {
                          return `${est.first_name || ''} ${est.last_name || ''}`.trim() || est.username || est.name || est.fullName || String(est.id || '');
                        }
                      }
                      return undefined;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 text-xs">
                  {users.map((u: any) => {
                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.name;
                    return (
                      <SelectItem key={u.id} value={String(u.id)}>{fullName}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {/* Estimated Start Date */}
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Start Date</Label>
              <Input
                type="date"
                value={estimatedStartDate}
                onChange={(e) => setEstimatedStartDate(e.target.value)}
                className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded"
              />
            </div>
            {/* Estimated End Date */}
            <div className="space-y-1.5 text-left">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated End Date</Label>
              <Input
                type="date"
                value={estimatedEndDate}
                onChange={(e) => setEstimatedEndDate(e.target.value)}
                className="h-9 text-xs border-slate-200 dark:border-slate-800 rounded"
              />
            </div>
            {/* Resources Used */}
            <MultiSelectUsers
              label="Resources Used"
              placeholder="-- Select Resources --"
              selectedValues={resourcesUsed}
              onChange={setResourcesUsed}
              users={users}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid for Sizing Inputs & Calculations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ================= SECTION 2: COUNT FUNCTION POINT COMPONENTS ================= */}
        <div className="lg:col-span-5">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-hidden h-full flex flex-col justify-between">
            <div>
              <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  2. Count Function Point Components
                </h3>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <CardContent className="p-5 text-xs">
                <table className="w-full text-left font-semibold text-slate-700 dark:text-slate-350">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase border-b dark:border-slate-800 pb-2">
                      <th className="pb-2">Function Type</th>
                      <th className="pb-2 text-center w-20">Low Count</th>
                      <th className="pb-2 text-center w-20">Medium Count</th>
                      <th className="pb-2 text-center w-20">High Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {/* EI */}
                    <tr>
                      <td className="py-2.5">External Inputs (EI)</td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eiCount.low || ''}
                          onChange={(e) => setEiCount(prev => ({ ...prev, low: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eiCount.medium || ''}
                          onChange={(e) => setEiCount(prev => ({ ...prev, medium: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eiCount.high || ''}
                          onChange={(e) => setEiCount(prev => ({ ...prev, high: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                    </tr>
                    {/* EO */}
                    <tr>
                      <td className="py-2.5">External Outputs (EO)</td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eoCount.low || ''}
                          onChange={(e) => setEoCount(prev => ({ ...prev, low: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eoCount.medium || ''}
                          onChange={(e) => setEoCount(prev => ({ ...prev, medium: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eoCount.high || ''}
                          onChange={(e) => setEoCount(prev => ({ ...prev, high: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                    </tr>
                    {/* EQ */}
                    <tr>
                      <td className="py-2.5">External Inquiries (EQ)</td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eqCount.low || ''}
                          onChange={(e) => setEqCount(prev => ({ ...prev, low: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eqCount.medium || ''}
                          onChange={(e) => setEqCount(prev => ({ ...prev, medium: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eqCount.high || ''}
                          onChange={(e) => setEqCount(prev => ({ ...prev, high: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                    </tr>
                    {/* ILF */}
                    <tr>
                      <td className="py-2.5">Internal Logical Files (ILF)</td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={ilfCount.low || ''}
                          onChange={(e) => setIlfCount(prev => ({ ...prev, low: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={ilfCount.medium || ''}
                          onChange={(e) => setIlfCount(prev => ({ ...prev, medium: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={ilfCount.high || ''}
                          onChange={(e) => setIlfCount(prev => ({ ...prev, high: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                    </tr>
                    {/* EIF */}
                    <tr>
                      <td className="py-2.5">External Interface Files (EIF)</td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eifCount.low || ''}
                          onChange={(e) => setEifCount(prev => ({ ...prev, low: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eifCount.medium || ''}
                          onChange={(e) => setEifCount(prev => ({ ...prev, medium: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <Input
                          type="number"
                          value={eifCount.high || ''}
                          onChange={(e) => setEifCount(prev => ({ ...prev, high: parseInt(e.target.value) || 0 }))}
                          className="h-9 w-16 mx-auto text-xs text-center border-slate-200 dark:border-slate-800 rounded"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </div>
            <div className="p-5 bg-slate-50/50 dark:bg-slate-950/20 border-t dark:border-slate-800">
              <Button
                type="button"
                className="h-9 font-bold text-white text-xs px-5 rounded-sm shrink-0 flex items-center gap-1.5"
                style={{ backgroundColor: primaryColor }}
                onClick={() => toast.success(`UFP calculated: ${ufp}`)}
              >
                <Calculator className="h-3.5 w-3.5" /> Calculate UFP
              </Button>
            </div>
          </Card>
        </div>

        {/* ================= SECTION 3: FUNCTION POINT CALCULATION (UFP) ================= */}
        <div className="lg:col-span-7">
          <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-hidden h-full flex flex-col justify-between">
            <div className="p-4 border-b dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                3. Function Point Calculation (UFP)
              </h3>
            </div>
            <CardContent className="p-5 text-xs flex-1">
              <table className="w-full text-left font-semibold text-slate-700 dark:text-slate-350">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase border-b dark:border-slate-800 pb-2">
                    <th className="pb-2">Function Type</th>
                    <th className="pb-2 text-center">Low Wt.</th>
                    <th className="pb-2 text-center">Med Wt.</th>
                    <th className="pb-2 text-center">High Wt.</th>
                    <th className="pb-2 text-center">Low Total</th>
                    <th className="pb-2 text-center">Med Total</th>
                    <th className="pb-2 text-center">High Total</th>
                    <th className="pb-2 text-center font-bold">Total FP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* EI */}
                  <tr>
                    <td className="py-3">External Inputs (EI)</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.ei.low}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.ei.medium}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.ei.high}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.ei.low}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.ei.med}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.ei.high}</td>
                    <td className="py-3 text-center font-bold text-blue-600 dark:text-blue-400">{ufpCalculations.ei.total}</td>
                  </tr>
                  {/* EO */}
                  <tr>
                    <td className="py-3">External Outputs (EO)</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eo.low}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eo.medium}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eo.high}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eo.low}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eo.med}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eo.high}</td>
                    <td className="py-3 text-center font-bold text-blue-600 dark:text-blue-400">{ufpCalculations.eo.total}</td>
                  </tr>
                  {/* EQ */}
                  <tr>
                    <td className="py-3">External Inquiries (EQ)</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eq.low}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eq.medium}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eq.high}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eq.low}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eq.med}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eq.high}</td>
                    <td className="py-3 text-center font-bold text-blue-600 dark:text-blue-400">{ufpCalculations.eq.total}</td>
                  </tr>
                  {/* ILF */}
                  <tr>
                    <td className="py-3">Internal Logical Files (ILF)</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.ilf.low}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.ilf.medium}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.ilf.high}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.ilf.low}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.ilf.med}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.ilf.high}</td>
                    <td className="py-3 text-center font-bold text-blue-600 dark:text-blue-400">{ufpCalculations.ilf.total}</td>
                  </tr>
                  {/* EIF */}
                  <tr>
                    <td className="py-3">External Interface Files (EIF)</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eif.low}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eif.medium}</td>
                    <td className="py-3 text-center text-slate-450">{WEIGHTS.eif.high}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eif.low}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eif.med}</td>
                    <td className="py-3 text-center text-slate-800 dark:text-slate-200">{ufpCalculations.eif.high}</td>
                    <td className="py-3 text-center font-bold text-blue-600 dark:text-blue-400">{ufpCalculations.eif.total}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>

            {/* Total UFP indicator */}
            <div className="p-5.5 bg-blue-50/40 dark:bg-slate-950/40 border-t dark:border-slate-800 flex items-center justify-between font-extrabold text-xs">
              <span className="uppercase text-slate-500 tracking-wider">Total Unadjusted Function Points (UFP)</span>
              <span className="text-xl text-blue-600 dark:text-blue-400 font-mono pr-4">{safeNumber(ufp)}</span>
            </div>
          </Card>
        </div>

      </div>

      {/* ================= SECTION 4: GENERAL SYSTEM CHARACTERISTICS (GSC) ================= */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-hidden">
        <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            4. General System Characteristics (GSC) - Value Adjustment Factor (VAF)
          </h3>
          <Info className="h-4 w-4 text-slate-400" />
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs font-semibold text-slate-700 dark:text-slate-350">

            {/* Column Left (1 to 7) */}
            <div className="space-y-3">
              {[
                { key: 'dataComm', id: 1, name: 'Data Communications', desc: 'System requires data communications' },
                { key: 'distProcessing', id: 2, name: 'Distributed Processing', desc: 'System performs distributed processing' },
                { key: 'performance', id: 3, name: 'Performance', desc: 'Performance requirements are high' },
                { key: 'heavilyUsedConfig', id: 4, name: 'Heavily Used Configuration', desc: 'Configuration is heavily used' },
                { key: 'transactionRate', id: 5, name: 'Transaction Rate', desc: 'Transaction rate is high' },
                { key: 'onlineDataEntry', id: 6, name: 'Online Data Entry', desc: 'System requires online data entry' },
                { key: 'endUserEfficiency', id: 7, name: 'End User Efficiency', desc: 'End user efficiency is important' }
              ].map((char) => (
                <div key={char.key} className="flex items-center justify-between gap-3 py-1.5 border-b dark:border-slate-800/40 last:border-0">
                  <div className="text-left space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{char.id}. {char.name}</span>
                    <p className="text-[10px] text-slate-405 leading-none">{char.desc}</p>
                  </div>
                  <Select
                    value={(ratings as any)[char.key]?.toString() || '0'}
                    onValueChange={(val) => setRatings(prev => ({ ...prev, [char.key]: parseInt(val) || 0 }))}
                  >
                    <SelectTrigger className="w-16 h-9 text-xs font-bold border-slate-200 dark:border-slate-800 rounded">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 text-xs font-bold">
                      {[0, 1, 2, 3, 4, 5].map(v => (
                        <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Column Right (8 to 14) */}
            <div className="space-y-3">
              {[
                { key: 'onlineUpdate', id: 8, name: 'Online Update', desc: 'System requires online update' },
                { key: 'complexProcessing', id: 9, name: 'Complex Processing', desc: 'Complex processing required' },
                { key: 'reusability', id: 10, name: 'Reusability', desc: 'High degree of reusability' },
                { key: 'installationEase', id: 11, name: 'Installation Ease', desc: 'Ease of installation important' },
                { key: 'operationalEase', id: 12, name: 'Operational Ease', desc: 'Ease of operation important' },
                { key: 'multipleSites', id: 13, name: 'Multiple Sites', desc: 'System used at multiple sites' },
                { key: 'facilitateChange', id: 14, name: 'Facilitate Change', desc: 'Facilitate change in the system' }
              ].map((char) => (
                <div key={char.key} className="flex items-center justify-between gap-3 py-1.5 border-b dark:border-slate-800/40 last:border-0">
                  <div className="text-left space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{char.id}. {char.name}</span>
                    <p className="text-[10px] text-slate-405 leading-none">{char.desc}</p>
                  </div>
                  <Select
                    value={(ratings as any)[char.key]?.toString() || '0'}
                    onValueChange={(val) => setRatings(prev => ({ ...prev, [char.key]: parseInt(val) || 0 }))}
                  >
                    <SelectTrigger className="w-16 h-9 text-xs font-bold border-slate-200 dark:border-slate-800 rounded">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 text-xs font-bold">
                      {[0, 1, 2, 3, 4, 5].map(v => (
                        <SelectItem key={v} value={v.toString()}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

          </div>

          {/* Calculations row summary */}
          <div className="mt-6 border-t dark:border-slate-800 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-5 font-bold text-xs uppercase tracking-wider text-slate-455 items-center">

            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border dark:border-slate-850">
              <span>Total Degree of Influence (TDI)</span>
              <span className="text-base text-slate-800 dark:text-white font-mono">{tdi}</span>
            </div>

            <div className="flex justify-center text-center font-extrabold text-slate-500 py-1 select-none">
              VAF = 0.65 + (0.01 * TDI)
            </div>

            <div className="flex justify-between items-center bg-blue-50/50 dark:bg-slate-950/40 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
              <span className="text-blue-700 dark:text-blue-400 font-extrabold">Value Adjustment Factor (VAF)</span>
              <span className="text-base text-blue-600 dark:text-blue-400 font-mono">{vaf}</span>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Grid: Adjusted FP & Effort */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ================= SECTION 5: ADJUSTED FUNCTION POINTS (AFP) ================= */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-hidden h-full flex flex-col">
          <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              5. Adjusted Function Points (AFP)
            </h3>
            <Info className="h-4 w-4 text-slate-400" />
          </div>
          <CardContent className="p-6 flex-1 flex flex-col justify-center space-y-8">
            <div className="flex items-center justify-center gap-3 py-2 font-bold text-slate-500 text-xs">
              <div className="text-center p-3.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-lg min-w-[80px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">UFP</span>
                <span className="text-base text-slate-800 dark:text-white font-mono">{safeNumber(ufp)}</span>
              </div>
              <span className="text-lg font-extrabold">&times;</span>
              <div className="text-center p-3.5 bg-slate-50 dark:bg-slate-950 border dark:border-slate-850 rounded-lg min-w-[80px]">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">VAF</span>
                <span className="text-base text-slate-800 dark:text-white font-mono">{vaf}</span>
              </div>
              <span className="text-lg font-extrabold">=</span>
              <div className="text-center p-3.5 bg-blue-50/50 dark:bg-blue-955/20 border border-blue-150 rounded-lg min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-blue-500 dark:text-blue-400 block mb-0.5">AFP</span>
                <span className="text-base text-blue-600 dark:text-blue-400 font-mono">{safeNumber(afp)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t dark:border-slate-800 pt-4 font-bold text-xs uppercase tracking-wider text-slate-455">
              <span>Rounded Adjusted Function Points (AFP)</span>
              <span className="text-2xl text-emerald-600 dark:text-emerald-400 font-mono pr-2 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1 rounded-lg">
                {safeNumber(roundedAFP)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ================= SECTION 6: CONVERT TO EFFORT (HOURS) ================= */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-hidden">
          <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              6. Convert to Effort (Hours)
            </h3>
            {/* <Info className="h-4 w-4 text-slate-400" /> */}
          </div>
          <CardContent className="p-6 pt-2 flex flex-col md:flex-row gap-6 justify-between items-start">

            {/* Input hours per FP */}
            <div className="space-y-4 text-left w-full md:max-w-[160px] text-xs font-semibold">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Productivity (Hours per FP)
                </Label>
                <Select value={productivityHours.toString()} onValueChange={(val) => val && setProductivityHours(parseInt(val) || 12)}>
                  <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800 text-xs rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 text-xs">
                    <SelectItem value="8">8 hrs/FP (Simple Web App)</SelectItem>
                    <SelectItem value="10">10 hrs/FP (Std Enterprise App)</SelectItem>
                    <SelectItem value="12">12 hrs/FP (Default Web App)</SelectItem>
                    <SelectItem value="16">16 hrs/FP (Complex Integration)</SelectItem>
                    <SelectItem value="20">20 hrs/FP (AI/ML App)</SelectItem>
                    <SelectItem value="25">25 hrs/FP (Complex AI App)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custom Productivity Ratio</Label>
                <Input
                  type="number"
                  value={productivityHours || ''}
                  onChange={(e) => setProductivityHours(parseInt(e.target.value) || 0)}
                  className="h-9 text-xs border-slate-200 dark:border-slate-800 w-full rounded"
                />
                <span className="text-[9px] text-slate-400 block font-medium mt-0.5">Typical range: 8 - 20 Hrs/FP</span>
              </div>

              <div className="bg-blue-50/50 dark:bg-slate-950/40 p-4 rounded-lg border dark:border-slate-850 text-center space-y-1 pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-455 block">Effort (Hours) = AFP &times; Hours per FP</span>
                <span className="text-xl text-blue-605 dark:text-blue-400 font-mono font-extrabold block">
                  {effortHours ? effortHours.toLocaleString() : '0'}
                </span>
              </div>
            </div>

            {/* Typical Productivity Reference Table */}
            <div className="w-full border dark:border-slate-800 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2 border-b dark:border-slate-800 font-extrabold text-[10px] uppercase text-slate-500 tracking-wider">
                Typical Productivity (Hours per FP)
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-1 font-semibold text-slate-700 dark:text-slate-350">
                {[
                  { type: 'Standard Web Application', hrs: '8 - 12' },
                  { type: 'Enterprise Application (.NET / Java)', hrs: '10 - 15' },
                  { type: 'Complex / Integrated System', hrs: '15 - 20' },
                  { type: 'AI / ML Based Application', hrs: '20 - 30' },
                  { type: 'Mobile Application', hrs: '12 - 18' }
                ].map((row, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 px-2 gap-2 text-[10px]">
                    <span>{row.type}</span>
                    <span className="font-mono text-slate-800 dark:text-white font-bold">{row.hrs}</span>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Grid: Cost Estimation & Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ================= SECTION 7: COST ESTIMATION ================= */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-hidden">
          <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              7. Cost Estimation
            </h3>
            <Info className="h-4 w-4 text-slate-400" />
          </div>
          <CardContent className="p-6 pt-2 flex flex-col md:flex-row gap-4 justify-between items-start text-xs font-semibold text-left">

            {/* Input rates */}
            <div className="space-y-4 w-full md:max-w-[190px]">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost per Hour (Blended Rate) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
                  <Input
                    type="number"
                    step="any"
                    value={costPerHour || ''}
                    onChange={(e) => setCostPerHour(parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs pl-7 border-slate-200 dark:border-slate-800 rounded"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contingency (%)</Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  <Input
                    type="number"
                    step="any"
                    value={contingencyPercent || ''}
                    onChange={(e) => setContingencyPercent(parseFloat(e.target.value) || 0)}
                    className="h-9 text-xs pr-8 border-slate-200 dark:border-slate-800 rounded"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</Label>
                <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
                  <SelectTrigger className="h-9 border-slate-200 dark:border-slate-800 text-xs rounded">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 text-xs max-h-48 overflow-y-auto">
                    {currencyOptions.length > 0 ? currencyOptions.map((cur) => (
                      <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                    )) : (
                      <>
                        <SelectItem value="INR (₹)">INR (₹)</SelectItem>
                        <SelectItem value="USD ($)">USD ($)</SelectItem>
                        <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes</Label>
                <Textarea
                  placeholder="Optional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[80px] border-slate-200 dark:border-slate-800 text-xs rounded"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="w-full flex-1 space-y-4 bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-lg border dark:border-slate-850">
              <h4 className="font-extrabold text-[10px] text-slate-450 uppercase tracking-wider pb-2 border-b dark:border-slate-800/80">
                Cost Breakdown
              </h4>
              <div className="space-y-3.5 text-xs text-slate-555 dark:text-slate-400 font-semibold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Effort (Hours)</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{effortHours ? effortHours.toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cost per Hour</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{currencySymbol} {costPerHour ? costPerHour.toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between items-center border-t dark:border-slate-800/60 pt-2">
                  <span className="text-slate-400">Base Cost</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">{formatCurrency(baseCost, currencySymbol)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Contingency ({contingencyPercent}%)</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold font-mono">{formatCurrency(contingencyCost, currencySymbol)}</span>
                </div>

                <div className="border-t dark:border-slate-800 pt-3 mt-1 text-center space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider">Total Estimated Cost</span>
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">(Editable — calculates Cost/Hr)</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">{currencySymbol}</span>
                    <Input
                      type="number"
                      step="any"
                      value={totalCost ? Math.round(totalCost) : ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const multiplier = 1 + (contingencyPercent / 100);
                        const effectiveEffort = effortHours * multiplier;
                        if (effectiveEffort > 0) {
                          const calculatedCostPerHour = Math.round((val / effectiveEffort) * 100) / 100;
                          setCostPerHour(calculatedCostPerHour);
                        } else {
                          toast.warning('Please specify function point counts (effort hours) to calculate cost per hour.');
                        }
                      }}
                      placeholder="0"
                      className="h-10 text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 pl-7 text-right border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-955/20 focus:ring-2 focus:ring-emerald-500/20 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ================= SECTION 8: DURATION & TEAM SIZE ================= */}
        <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-hidden">
          <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              8. Duration & Team Size
            </h3>
            <Info className="h-4 w-4 text-slate-400" />
          </div>
          <CardContent className="p-6 pt-2 flex flex-col md:flex-row gap-4 justify-between items-start text-xs font-semibold text-left">

            {/* Inputs */}
            <div className="space-y-4 w-full md:max-w-[190px]">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Size</Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase">People</span>
                  <Input
                    type="number"
                    value={teamSize || ''}
                    onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                    className="h-9 text-xs pr-16 border-slate-200 dark:border-slate-800 font-bold rounded"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Working Days per Month</Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase">Days</span>
                  <Input
                    type="number"
                    value={workingDays || ''}
                    onChange={(e) => setWorkingDays(parseInt(e.target.value) || 1)}
                    className="h-9 text-xs pr-14 border-slate-200 dark:border-slate-800 font-bold rounded"
                  />
                </div>
              </div>

              {/* Duration display */}
              <div className="bg-blue-50/50 dark:bg-slate-950/40 p-5 rounded-lg border dark:border-slate-850 text-center space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-455 block">Duration (Months)</span>
                <span className="text-3xl text-blue-600 dark:text-blue-400 font-mono font-extrabold block">
                  {!isNaN(durationMonths) && durationMonths > 0 ? durationMonths.toFixed(2) : '0.00'}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold block uppercase tracking-wider">(Approx.)</span>
              </div>
            </div>

            {/* Note box */}
            <div className="w-full flex-1 bg-amber-50/55 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/60 p-5 rounded-lg space-y-3 relative">
              <h4 className="font-extrabold text-[10px] text-amber-800 dark:text-amber-400 uppercase tracking-wider">Note</h4>
              <p className="text-slate-650 dark:text-slate-400 leading-relaxed leading-5">
                Duration is calculated based on adjusted effort and team size, assuming a standard productivity divider of 18.4 FP per person-month.
              </p>
              <p className="text-slate-655 dark:text-slate-400 leading-relaxed leading-5 pt-1">
                Adjust team size or productivity parameters on the left to refine delivery estimates.
              </p>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-500 pt-2 font-bold">
                <Users className="h-5 w-5" />
                <span>Team Resource Allocation</span>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* ================= SECTION 9: SUMMARY ================= */}
      <Card className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-3xs overflow-hidden">
        <div className="p-4 border-b dark:border-slate-800">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">9. Summary</h3>
        </div>
        <CardContent className="p-6">
          <div className="overflow-x-auto text-left font-bold text-xs uppercase tracking-wider text-slate-500">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-950 px-4 py-3 border-b dark:border-slate-800 text-[10px] text-slate-400">
                  <th className="px-5 py-3 text-center">UFP</th>
                  <th className="px-5 py-3 text-center">VAF</th>
                  <th className="px-5 py-3 text-center">AFP</th>
                  <th className="px-5 py-3 text-center">Effort (Hours)</th>
                  <th className="px-5 py-3 text-center">Team Size</th>
                  <th className="px-5 py-3 text-center">Duration (Months)</th>
                  <th className="px-5 py-3 text-center font-extrabold text-slate-800 dark:text-slate-200 pr-5">Total Cost ({currencyCode})</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 dark:text-slate-200 font-bold font-mono text-center">
                <tr className="hover:bg-slate-50/20 dark:hover:bg-slate-950/10">
                  <td className="px-5 py-4">{safeNumber(ufp)}</td>
                  <td className="px-5 py-4">{safeNumber(vaf)}</td>
                  <td className="px-5 py-4 text-emerald-600 dark:text-emerald-450">{safeNumber(roundedAFP)}</td>
                  <td className="px-5 py-4">{effortHours ? effortHours.toLocaleString() : '0'}</td>
                  <td className="px-5 py-4 font-sans">{teamSize || 0}</td>
                  <td className="px-5 py-4 text-blue-600 dark:text-blue-400">
                    {!isNaN(durationMonths) && durationMonths > 0 ? durationMonths.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-5 py-4 font-extrabold text-sm text-blue-600 dark:text-blue-400 pr-5">
                    {totalCost > 0 ? formatCurrency(totalCost, currencySymbol) : '0'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Action buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 border dark:border-slate-800 rounded-lg shadow-sm">

        {/* Left Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <Button
            type="button"
            className="h-9 text-xs font-bold px-4 text-white rounded-sm active:scale-95 transition-all w-full sm:w-auto shrink-0 flex items-center gap-1.5"
            style={{ backgroundColor: primaryColor }}
            onClick={() => toast.success(`Recalculation successfully synced!`)}
          >
            <Calculator className="h-4 w-4" /> Calculate
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-9 text-xs font-bold px-4 rounded-sm hover:bg-slate-50 dark:hover:bg-slate-855 border-slate-200 dark:border-slate-800 w-full sm:w-auto flex items-center gap-1.5"
            onClick={() => router.push('/project/estimations')}
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" /> Cancel
          </Button>

          <Button
            type="button"
            className="h-9 text-xs font-bold px-6 text-white rounded-sm active:scale-95 transition-all flex items-center gap-1.5"
            style={{ backgroundColor: primaryColor }}
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Update Estimation
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <div
                className="inline-flex items-center justify-center h-9 gap-1 hover:bg-slate-50 dark:hover:bg-slate-855 border border-slate-200 dark:border-slate-800 rounded-sm text-xs font-bold text-slate-655 dark:text-slate-350 w-full sm:w-auto px-4 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Export
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 dark:bg-slate-900 dark:border-slate-800 text-xs">
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={handleExportJSON}>
                <FileText className="h-3.5 w-3.5" /> Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={handleExportCSV}>
                <FileText className="h-3.5 w-3.5" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer flex items-center gap-2" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" /> Print Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>

    </div>
  );
}