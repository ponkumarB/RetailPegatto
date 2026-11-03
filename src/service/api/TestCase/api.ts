import { fetchFromApi } from '@/service/apiClient';

export interface TestCasePayload {
  id?: number | string;
  TestCase_Id?: string;
  TestCase_Title?: string;
  Project_Name?: string;
  Test_Type?: string;
  Priority?: string;
  Severity?: string;
  Status?: string;
  Reviewer_Name?: string;
  Created_By?: number | string;
  Is_Deleted?: boolean;
  [key: string]: any; // Allow other fields like steps, precondition, etc. if they exist
}

/**
 * GET request for a single test case
 */
export async function getTestCaseApi(id: string | number): Promise<any> {
  return fetchFromApi(`/user/TestCaseManagementCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * POST request to create a test case
 */
export async function createTestCaseApi(payload: TestCasePayload): Promise<any> {
  return fetchFromApi('/user/TestCaseManagementCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PUT request to update a test case completely
 */
export async function updateTestCaseApi(payload: TestCasePayload): Promise<any> {
  return fetchFromApi('/user/TestCaseManagementCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH request to update a test case partially
 */
export async function patchTestCaseApi(payload: Partial<TestCasePayload> & { id: string | number }): Promise<any> {
  return fetchFromApi('/user/TestCaseManagementCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE request to soft delete a test case
 */
export async function deleteTestCaseApi(id: string | number): Promise<any> {
  return fetchFromApi(`/user/TestCaseManagementCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * GET request to search test cases
 */
export async function searchTestCasesApi(search: string, createdBy?: string | number): Promise<any> {
  let url = `/user/TestCaseManagementSearch/?search=${encodeURIComponent(search)}`;
  if (createdBy) {
    url += `&Created_By=${createdBy}`;
  }
  return fetchFromApi(url, {
    method: 'GET',
  });
}

export interface TestCaseFilterPayload {
  TestCase_Id?: string;
  TestCase_Title?: string;
  Project_Name?: string;
  Test_Type?: string;
  Priority?: string;
  Severity?: string;
  Status?: string;
  Reviewer_Name?: string;
  Created_Date?: string[];
  Assigned_To?: string;
  page?: number;
}

/**
 * POST request to filter test cases
 */
export async function filterTestCasesApi(payload: TestCaseFilterPayload): Promise<any> {
  return fetchFromApi('/user/TestCaseManagementFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for my test cases
 */
export async function getMyTestCasesApi(createdBy: string | number): Promise<any> {
  return fetchFromApi(`/user/TestCaseManagementMyList/?Created_By=${createdBy}`, {
    method: 'GET',
  });
}

/**
 * POST request for all test cases with date range and pagination
 */
export async function getAllTestCasesApi(payload: { Created_Date?: string[], page?: number }): Promise<any> {
  let defaultCreatedDate = ["", ""];
  if (!payload.Created_Date || payload.Created_Date.length === 0) {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    defaultCreatedDate = [
      oneYearAgo.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    ];
  }

  const requestBody = {
    ...payload,
    Created_Date: payload.Created_Date || defaultCreatedDate,
  };
  return fetchFromApi('/user/TestCaseManagementAlllist/', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

/**
 * POST request for test case KPI cards
 */
export async function getTestCaseCardsApi(projectId?: string | number): Promise<any> {
  const payload: { project_id?: string | number } = {};
  if (projectId) payload.project_id = projectId;

  return fetchFromApi('/user/TestCaseManagementCards/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request to download test case template
 */
export async function downloadTestCaseTemplateApi(): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tenant = (await import('@/service/apiClient')).getTenantName();
  const BASE_URL = (await import('@/service/apiClient')).BASE_URL;
  const url = `${BASE_URL}/${tenant}/user/Download_TestCase_Template/`;
  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to download template');
  return res.blob();
}

/**
 * POST request for bulk upload test cases
 */
export async function bulkUploadTestCasesApi(formData: FormData): Promise<any> {
  return fetchFromApi('/user/TestCaseManagement_Bulk_Upload/', {
    method: 'POST',
    body: formData,
  });
}

/**
 * GET request for test case dropdown list
 */
export async function fetchTestCaseDropdownList(projectName?: string): Promise<any> {
  let url = '/user/TestCaseDropdownList/';
  // if (projectName) {
  //   url += `?Project_Name=${encodeURIComponent(projectName)}`;
  // }
  return fetchFromApi(url, {
    method: 'GET',
  });
}
