import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDefectTrackingList,
  getDefectTracking,
  createDefectTracking,
  updateDefectTracking,
  deleteDefectTracking,
  DefectTrackingListPayload
} from './api/Defect/api';
import { Defect } from '@/store/useDefectStore';
import { fetchUsersList } from '@/service/api/Leads/api';
import { fetchProjectlistwithoutpaginaton } from '@/service/api/Project/api';
import { getAllTestCasesApi } from '@/service/api/TestCase/api';

// Helper to extract project name from various object structures or strings
export const extractProjectName = (val: any): string => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    if (val.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(val);
        return extractProjectName(parsed);
      } catch (e) {
        return val;
      }
    }
    return val;
  }
  if (typeof val === 'object') {
    return (
      val.project_name ||
      val.Project_Name ||
      val.ProjectName ||
      val.projectName ||
      val.name ||
      val.title ||
      val.Project_Title ||
      val.project_title ||
      String(val.id || '')
    );
  }
  return String(val);
};

// Helper to extract a display name from nested user objects or IDs
const safeString = (val: any, defaultStr: string = ''): string => {
  if (val === null || val === undefined) return defaultStr;
  if (typeof val === 'object') {
    return (
      val.project_name ||
      val.Project_Name ||
      val.ProjectName ||
      val.username ||
      `${val.first_name || ''} ${val.last_name || ''}`.trim() ||
      val.name ||
      val.TestCase_Title ||
      val.title ||
      val.label ||
      defaultStr
    );
  }
  return String(val);
};

const extractUserDisplay = (val: any): string => {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'object') {
    return (
      `${val.first_name || ''} ${val.last_name || ''}`.trim() ||
      val.username ||
      val.name ||
      String(val.id || '')
    );
  }
  return String(val);
};

const extractUserId = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'object') {
    const id = Number(val.id || val.pk || val.user_id);
    return isNaN(id) ? null : id;
  }
  const num = Number(val);
  return isNaN(num) ? null : num;
};

// Map Backend fields to Frontend Defect store interface
export const mapBackendToFrontendDefect = (item: any): Defect => {
  if (!item) return {} as Defect;
  return {
    id: String(item.Defect_Id || item.Defect_ID || item.Projecttask_Id || item.id || ''),
    dbId: item.id,
    title: safeString(item.Defect_Name, ''),
    project: extractProjectName(item.Project_Name || item.project || item.Project || item.project_name || item.ProjectName),
    module: safeString(item.Module_Area, ''),
    relatedTo: safeString(item.Related_To, ''),
    testCase: safeString(item.TestCase_Id || item.TestCase || item.testCase, ''),
    testExecution: safeString(item.TestExecution || item.testExecution, ''),
    testExecutionStatus: (safeString(item.Test_Execution_Status) as any) || 'N/A',
    bugType: safeString(item.Bug_Type || item.bugType, ''),
    severity: (safeString(item.Severity || item.severity) as any) || '',
    priority: (safeString(item.Priority || item.priority) as any) || '',
    reportedBy: safeString(item.Reported_By || item.reportedBy, ''),
    reportedOn: safeString(item.Created_Date || item.reportedOn, ''),
    description: safeString(item.Description || item.description, ''),
    stepsToReproduce: safeString(item.Steps_To_Reproduce || item.stepsToReproduce, ''),
    actualResult: safeString(item.Actual_Result || item.actualResult, ''),
    expectedResult: safeString(item.Expected_Result || item.expectedResult, ''),
    environment: (safeString(item.Environment || item.environment) as any) || '',
    browser: safeString(item.Browser || item.browser, ''),
    os: safeString(item.Operating_System || item.os, ''),
    appVersion: safeString(item.Application_Version || item.appVersion, ''),
    status: (safeString(item.Status || item.status) as any) || 'Open',
    assignee: extractUserDisplay(item.Assigned_To),
    assignedTo: extractUserId(item.Assigned_To),
    assignedBy: extractUserDisplay(item.Assigned_By),
    assignedById: extractUserId(item.Assigned_By),
    reviewedBy: extractUserDisplay(item.Reviewed_By),
    reviewedById: extractUserId(item.Reviewed_By),
    createdBy: extractUserDisplay(item.Created_By),
    createdById: extractUserId(item.Created_By),
    updatedBy: extractUserDisplay(item.Updated_By),
    updatedById: extractUserId(item.Updated_By),
    dueDate: safeString(item.Due_Date || item.dueDate, ''),
    labels: item.Label
      ? typeof item.Label === 'string'
        ? item.Label.split(',').map((l: string) => l.trim()).filter(Boolean)
        : Array.isArray(item.Label)
        ? item.Label
        : []
      : Array.isArray(item.labels)
      ? item.labels
      : [],
    watchers: item.Watchers || item.watchers || [],
    executedBy: safeString(item.Executed_By, ''),
    executionDate: safeString(item.Execution_Date, ''),
    isDraft: Boolean(item.Is_Draft),
    deliverable: safeString(item.Deliverable_Name || item.Deliverable_Id, ''),
    remarks: safeString(item.Remarks, ''),
    ticketType: safeString(item.Ticket_Type || item.ticketType, ''),
    sprint: safeString(item.Sprint || item.sprint, ''),
    branch: safeString(item.Branch || item.branch, ''),
    completionDate: safeString(item.Completion_Date || item.completionDate, ''),
    closedDate: safeString(item.Closed_Date || item.closedDate, ''),
    closedHours: item.Closed_Hours ?? item.closedHours,
    startDate: safeString(item.Start_Date || item.startDate, ''),
    estimationHours: item.Estimation_Hours !== undefined && item.Estimation_Hours !== null ? String(item.Estimation_Hours) : (item.estimationHours ? String(item.estimationHours) : ''),
    completionHours: item.Completion_Hours !== undefined && item.Completion_Hours !== null ? String(item.Completion_Hours) : (item.completionHours ? String(item.completionHours) : ''),
    defectCategory: safeString(item.Defect_Category || item.defectCategory, ''),
    sprintBacklog: safeString(item.SprintBacklog_Id, ''),
    attachments: item.Attachment || [],
    childDefects: item.Child_Defect || [],
    developerActionFlag: Boolean(item.Developer_Action_Flag),
    assignedHistory: item.Assigned_History,
    updatedDate: safeString(item.Updated_Date || item.updatedDate, ''),
    isDeleted: Boolean(item.Is_Deleted),
  };
};

export const mapFrontendToBackendDefect = (item: Partial<Defect> & { dbId?: string | number }): any => {
  let watchersPayload: number[] = [];
  if (Array.isArray(item.watchers)) {
    watchersPayload = item.watchers
      .map((w: any) => {
        if (typeof w === 'number') return w;
        if (typeof w === 'object' && w !== null && (w.id || w.pk || w.user_id)) {
          return Number(w.id || w.pk || w.user_id);
        }
        const num = Number(w);
        return isNaN(num) ? null : num;
      })
      .filter((n): n is number => n !== null);
  }

  const parseUserFk = (idVal?: number | null, strVal?: string): number | null => {
    if (idVal !== undefined && idVal !== null && !isNaN(Number(idVal)) && Number(idVal) > 0) {
      return Number(idVal);
    }
    if (strVal && strVal !== 'Unassigned' && strVal !== 'none') {
      const num = Number(strVal);
      if (!isNaN(num) && num > 0) return num;
    }
    return null;
  };

  const assignedToPayload = parseUserFk(item.assignedTo, item.assignee);
  const assignedByPayload = parseUserFk(item.assignedById, item.assignedBy);
  const reviewedByPayload = parseUserFk(item.reviewedById, item.reviewedBy);
  const createdByPayload = parseUserFk(item.createdById, item.createdBy);
  const updatedByPayload = parseUserFk(item.updatedById, item.updatedBy);

  const payload: any = {
    Defect_Name: item.title,
    Project_Name: item.project,
    Module_Area: item.module,
    Related_To: item.relatedTo,
    TestCase_Id: item.testCase || '',
    TestExecution: item.testExecution || '',
    Test_Execution_Status: item.testExecutionStatus,
    Bug_Type: item.bugType,
    Severity: item.severity,
    Priority: item.priority,
    Description: item.description || '',
    Steps_To_Reproduce: item.stepsToReproduce || '',
    Actual_Result: item.actualResult || '',
    Expected_Result: item.expectedResult || '',
    Environment: item.environment,
    Browser: item.browser,
    Operating_System: item.os,
    Application_Version: item.appVersion,
    Status: item.status || 'Open',
    Assigned_To: assignedToPayload,
    Label: item.labels ? item.labels.filter(Boolean).join(',') : '',
    Watchers: watchersPayload,
    Executed_By: item.executedBy,
    Execution_Date: item.executionDate,
    Is_Draft: item.isDraft,
    Deliverable_Id: item.deliverable,
    Remarks: item.remarks,
    Ticket_Type: item.ticketType || '',
    Sprint: item.sprint,
    Branch: item.branch || '',
    Due_Date: item.dueDate || null,
    Completion_Date: item.completionDate || null,
    Closed_Date: item.closedDate || null,
    Closed_Hours: item.closedHours ? Number(item.closedHours) : null,
    Start_Date: item.startDate || null,
    Estimation_Hours: item.estimationHours ? Number(item.estimationHours) : null,
    Completion_Hours: item.completionHours ? Number(item.completionHours) : null,
    Assigned_By: assignedByPayload,
    Reviewed_By: reviewedByPayload,
    Defect_Category: item.defectCategory || '',
    SprintBacklog_Id: item.sprintBacklog,
    Attachment: item.attachments,
    Child_Defect: item.childDefects,
    Developer_Action_Flag: item.developerActionFlag,
    Assigned_History: item.assignedHistory,
    Created_By: createdByPayload,
    Updated_By: updatedByPayload,
    Updated_Date: item.updatedDate,
    Is_Deleted: item.isDeleted,
  };

  if (item.dbId || item.id) {
    payload.id = item.dbId || item.id;
  }

  return payload;
};

// --- Queries ---

export function useDefectsQuery(payload: DefectTrackingListPayload, enabled = true) {
  return useQuery({
    queryKey: ['defectsList', payload],
    queryFn: async () => {
      const res = await fetchDefectTrackingList(payload);
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return data.map(mapBackendToFrontendDefect);
    },
    enabled,
  });
}

export function useDefectQuery(id: string | number, enabled = true) {
  return useQuery({
    queryKey: ['defect', id],
    queryFn: async () => {
      const res = await getDefectTracking(id);
      const raw = Array.isArray(res) ? res[0] : (res?.data || res?.results?.[0] || res);
      return mapBackendToFrontendDefect(raw);
    },
    enabled: enabled && !!id,
  });
}

// --- Mutations ---

export function useCreateDefectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newDefect: Partial<Defect>) => createDefectTracking(mapFrontendToBackendDefect(newDefect)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defectsList'] });
    },
  });
}

export function useUpdateDefectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedDefect: Partial<Defect> & { dbId: string | number }) =>
      updateDefectTracking(mapFrontendToBackendDefect(updatedDefect)),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['defect', variables.dbId] });
      queryClient.invalidateQueries({ queryKey: ['defectsList'] });
    },
  });
}

export function useDeleteDefectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteDefectTracking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defectsList'] });
    },
  });
}

// Mock Dropdowns Query
export function useDefectDropdownsQuery() {
  return useQuery({
    queryKey: ['defectDropdowns'],
    queryFn: async () => {
      // Fetch API data in parallel
      const [projectsRes, usersRes, testCasesRes] = await Promise.all([
        fetchProjectlistwithoutpaginaton().catch(() => []),
        fetchUsersList().catch(() => []),
        getAllTestCasesApi({}).catch(() => [])
      ]);

      const formatRes = (res: any) => Array.isArray(res) ? res : (res?.results || res?.data || []);
      
      const projectsData = formatRes(projectsRes);
      const usersData = formatRes(usersRes);
      const testCasesData = formatRes(testCasesRes);

      const projects = projectsData
        .map((p: any) => extractProjectName(p))
        .filter((p: string) => Boolean(p) && p !== 'undefined' && p !== '[object Object]');
      const users = usersData.map((u: any) => safeString(u)).filter(Boolean);
      const testCases = testCasesData.map((tc: any) => safeString(tc)).filter(Boolean);

      const defaultProjects = [
        'Greenhouse Installation',
        'Smart Agriculture Phase 2',
        'Automated Irrigation Control',
        'Yield Prediction & Analytics',
        'Solar Irrigation Initiative'
      ];

      return {
        projects: projects.length > 0 ? Array.from(new Set(projects)) : defaultProjects,
        rawProjects: projectsData,
        modules: [
          'Irrigation System',
          'Documents',
          'Customers',
          'Reports',
          'Dashboard',
          'Email Service',
          'Soil Tests',
          'Login',
          'Map Integration',
          'Leads'
        ],
        testCases: Array.from(new Set(testCases)),
        users: Array.from(new Set(users)),
        rawUsers: usersData,
        environments: ['QA', 'Staging', 'Production', 'Development'],
        browsers: ['Google Chrome 124', 'Firefox 125', 'Safari 17', 'Microsoft Edge 123'],
        operatingSystems: ['Windows 11', 'macOS Sonoma', 'Linux Ubuntu', 'iOS 17'],
        bugTypes: ['Functional', 'UI', 'Performance', 'Security'],
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Users List Query
export function useUsersListQuery() {
  return useQuery({
    queryKey: ['usersList'],
    queryFn: async () => {
      const response = await fetchUsersList();
      // Adjust based on the actual API response format (assuming response.data or array)
      return Array.isArray(response) ? response : (response?.results || response?.data || []);
    },
    staleTime: 5 * 60 * 1000,
  });
}
