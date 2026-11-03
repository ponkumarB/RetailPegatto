import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTestCaseApi,
  createTestCaseApi,
  updateTestCaseApi,
  deleteTestCaseApi,
  searchTestCasesApi,
  filterTestCasesApi,
  getMyTestCasesApi,
  getAllTestCasesApi,
  getTestCaseCardsApi,
  downloadTestCaseTemplateApi,
  bulkUploadTestCasesApi,
  TestCasePayload,
  TestCaseFilterPayload,
  fetchTestCaseDropdownList,
} from './api/TestCase/api';
import { TestCase, TestStep } from '@/store/useTestCaseStore';

// Helper to safely extract string from potentially nested backend objects
const safeString = (val: any, defaultStr: string = '-'): string => {
  if (val === null || val === undefined) return defaultStr;
  if (typeof val === 'object') {
    // If it's a Django user object or similar, try to extract a useful name, otherwise stringify
    return val.Document_Title || val.project_name || val.Project_Name || val.username || val.name || val.first_name || val.title || val.TestCase_Title || JSON.stringify(val);
  }
  return String(val);
};

// Mapper to convert Backend API response to Frontend TestCase model
export const mapBackendToFrontend = (item: any): TestCase => {
  // Map backend Priority to frontend
  let frontendPriority = 'Medium';
  const rawPriority = typeof item.Priority === 'string' ? item.Priority : (item.Priority?.name || '');
  if (rawPriority) {
    if (rawPriority.includes('Critical')) frontendPriority = 'Critical';
    else if (rawPriority.includes('High')) frontendPriority = 'High';
    else if (rawPriority.includes('Medium')) frontendPriority = 'Medium';
    else if (rawPriority.includes('Low')) frontendPriority = 'Low';
  }

  // Map backend Status to frontend
  let frontendStatus = 'Draft';
  const rawStatus = typeof item.Status === 'string' ? item.Status : (item.Status?.name || item.Status || '');
  if (rawStatus) {
    if (rawStatus === 'Sent for Review') frontendStatus = 'Review';
    else if (rawStatus === 'Approved') frontendStatus = 'Active';
    else if (rawStatus === 'Pass' || rawStatus === 'Fail') frontendStatus = 'Active';
    else frontendStatus = String(rawStatus);
  }

  return {
    id: Number(item.id),
    dbId: item.id, // Store DB id for updates/deletes
    testCaseId: safeString(item.TestCase_Id, `TC-${item.id}`),
    title: safeString(item.TestCase_Title, 'Untitled'),
    project: safeString(item.Project_Name || item.Project_Id, 'Unknown Project'),
    testPlan: safeString(item.Testplan_Name || item.Testplan_Id || item.Test_Plan),
    module: safeString(item.Module_Name || item.Module),
    requirement: safeString(item.Requirement),
    priority: frontendPriority as any,
    testType: safeString(item.Test_Type, 'Functional'),
    testLevel: safeString(item.Test_Level),
    precondition: safeString(item.Preconditions || item.Precondition),
    testData: safeString(item.Test_Data),
    environment: safeString(item.Environment),
    objective: safeString(item.Description || item.Objective),
    steps: (item.Test_Steps || item.Steps) ? (typeof (item.Test_Steps || item.Steps) === 'string' ? JSON.parse(item.Test_Steps || item.Steps) : (item.Test_Steps || item.Steps)) : [],
    expectedResultSummary: safeString(item.Expected_Result),
    attachmentsCount: Number(item.Attachments_Count) || ((item.Attachment || item.attachment || item.Attachments || item.attachments) ? (Array.isArray(item.Attachment || item.attachment || item.Attachments || item.attachments) ? (item.Attachment || item.attachment || item.Attachments || item.attachments).length : 1) : 0),
    attachments: (() => {
      const atts = item.Attachment || item.attachment || item.Attachments || item.attachments;
      if (!atts) return [];
      if (typeof atts === 'string') {
        try { return JSON.parse(atts); } catch(e) { return [atts]; }
      }
      return Array.isArray(atts) ? atts : [atts];
    })(),
    status: frontendStatus as any,
    createdBy: safeString(item.Created_By || item.Reviewer_Name, 'Unknown'),
    lastSaved: safeString(item.Created_Date, 'Just now'),
    isFavorite: Boolean(item.Is_Favorite),
  };
};

// Mapper to convert Frontend TestCase model to Backend API Payload
export const mapFrontendToBackend = (item: Partial<TestCase> & { dbId?: string | number }): TestCasePayload => {
  let backendPriority = 'P2-Medium';
  if (item.priority === 'Critical') backendPriority = 'P0-Critical';
  if (item.priority === 'High') backendPriority = 'P1-High';
  if (item.priority === 'Medium') backendPriority = 'P2-Medium';
  if (item.priority === 'Low') backendPriority = 'P3-Low';

  let backendStatus = 'Draft';
  if (item.status === 'Draft') backendStatus = 'Draft';
  if (item.status === 'Review') backendStatus = 'Sent for Review';
  if (item.status === 'Active' || item.status === 'Approved') backendStatus = 'Approved';

  const payload: TestCasePayload = {
    TestCase_Id: item.testCaseId || `TC-${item.dbId || item.id || ''}`,
    TestCase_Title: item.title,
    Test_Type: item.testType,
    Priority: backendPriority,
    Severity: 'Major', // Severity is required by backend but missing in frontend
    Status: backendStatus,
    Created_By: item.createdBy ? (isNaN(Number(item.createdBy)) ? item.createdBy : Number(item.createdBy)) : undefined,
    Updated_By: item.updatedBy ? (isNaN(Number(item.updatedBy)) ? item.updatedBy : Number(item.updatedBy)) : undefined,
    // Add other mapped fields as necessary
    Testplan_Id: undefined,
    Testplan_Name: (item as any).testPlanName || item.testPlan,
    Project_Id: undefined,
    Project_Name: (item as any).projectName || item.project,
    Module_Name: item.module,
    Preconditions: item.precondition,
    Test_Data: item.testData,
    Environment: item.environment,
    Description: item.objective,
    Test_Steps: item.steps ? item.steps : undefined,
    Test_Level: item.testLevel,
    Expected_Result: item.expectedResultSummary,
    Attachment: item.attachments,
    Automation_Status: 'No',
  };

  if (item.dbId) {
    payload.id = item.dbId;
  }

  return payload;
};

// --- Queries ---

export function useTestCaseQuery(id: string | number, enabled = true) {
  return useQuery({
    queryKey: ['testCase', id],
    queryFn: async () => {
      const res = await getTestCaseApi(id);
      return mapBackendToFrontend(res);
    },
    enabled: enabled && !!id,
  });
}

export function useAllTestCasesQuery(page = 1, enabled = true) {
  return useQuery({
    queryKey: ['allTestCases', page],
    queryFn: async () => {
      const res = await getAllTestCasesApi({ page });
      // Assuming res is an array or { results: [] }
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return data.map(mapBackendToFrontend);
    },
    enabled,
  });
}

export function useMyTestCasesQuery(createdBy: string | number, enabled = true) {
  return useQuery({
    queryKey: ['myTestCases', createdBy],
    queryFn: async () => {
      const res = await getMyTestCasesApi(createdBy);
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return data.map(mapBackendToFrontend);
    },
    enabled: enabled && !!createdBy,
  });
}

export function useSearchTestCasesQuery(search: string, createdBy?: string | number, enabled = true) {
  return useQuery({
    queryKey: ['searchTestCases', search, createdBy],
    queryFn: async () => {
      const res = await searchTestCasesApi(search, createdBy);
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return data.map(mapBackendToFrontend);
    },
    enabled: enabled && !!search,
  });
}

export function useFilterTestCasesQuery(filters: TestCaseFilterPayload, enabled = true) {
  return useQuery({
    queryKey: ['filterTestCases', filters],
    queryFn: async () => {
      const res = await filterTestCasesApi(filters);
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return data.map(mapBackendToFrontend);
    },
    enabled,
  });
}

export function useTestCaseCardsQuery(projectId?: string | number, enabled = true) {
  return useQuery({
    queryKey: ['testCaseCards', projectId],
    queryFn: async () => {
      const res = await getTestCaseCardsApi(projectId);
      return res?.data || res;
    },
    enabled,
  });
}

export function useTestCaseDropdownListQuery(projectName?: string, enabled = true) {
  return useQuery({
    queryKey: ['testCaseDropdownList', projectName],
    queryFn: async () => {
      const res = await fetchTestCaseDropdownList(projectName);
      const data = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return data.map(mapBackendToFrontend);
    },
    enabled,
  });
}

// --- Mutations ---

export function useCreateTestCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newTestCase: Partial<TestCase>) => createTestCaseApi(mapFrontendToBackend(newTestCase)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['myTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['filterTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['testCaseCards'] });
    },
  });
}

export function useUpdateTestCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedTestCase: Partial<TestCase> & { dbId: string | number }) => 
      updateTestCaseApi(mapFrontendToBackend(updatedTestCase)),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['testCase', variables.dbId] });
      queryClient.invalidateQueries({ queryKey: ['allTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['myTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['filterTestCases'] });
    },
  });
}

export function useDeleteTestCaseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteTestCaseApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['myTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['filterTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['testCaseCards'] });
    },
  });
}

export function useBulkUploadTestCasesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bulkUploadTestCasesApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['myTestCases'] });
      queryClient.invalidateQueries({ queryKey: ['testCaseCards'] });
    },
  });
}

export { downloadTestCaseTemplateApi };
