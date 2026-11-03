import { fetchFromApi } from '@/service/apiClient';

export interface NewITMilestoneProjectMilestonesPayload {
  organization_id: number;
  project_id: number;
  start_date?: string;
  end_date?: string;
}

export interface NewITMilestoneDashboardSummaryPayload {
  organization_id: number;
  start_date?: string;
  end_date?: string;
}

/**
 * GET request for MilestoneFilter
 */
export async function fetchMilestonefilter(params: {
  fromdate?: string,
  todate?: string,
  Milestone_Name?: string,
  Project_Name?: string,
  Milestone_Description?: string,
  Responsible_Persion?: string,
  page?: number
}): Promise<any> {
  const queryParams: string[] = [];
  queryParams.push(`fromdate=${params.fromdate || ''}`);
  queryParams.push(`todate=${params.todate || ''}`);
  queryParams.push(`Milestone_Name=${params.Milestone_Name || ''}`);
  queryParams.push(`Project_Name=${params.Project_Name || ''}`);
  queryParams.push(`Milestone_Description=${params.Milestone_Description || ''}`);
  queryParams.push(`Responsible_Persion=${params.Responsible_Persion || ''}`);
  queryParams.push(`page=${params.page || 1}`);
  
  const query = `?${queryParams.join('&')}`;
  return fetchFromApi(`/user/MilestoneFilter/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for MilestoneOverviewDashboard
 */
export async function fetchMilestoneoverviewdashboard(project_id?: number | string): Promise<any> {
  const params: string[] = [];
  if (project_id !== undefined) params.push(`Project_Id=${project_id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/MilestoneOverviewDashboard/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for Milestonesearch
 */
export async function searchMilestone(searchQuery: string): Promise<any> {
  return fetchFromApi(`/user/Milestonesearch/?search=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
  });
}

/**
 * POST request for NewITMilestoneProjectMilestones
 */
export async function fetchNewITMilestoneProjectMilestones(payload: NewITMilestoneProjectMilestonesPayload): Promise<any> {
  return fetchFromApi('/user/NewITMilestoneProjectMilestones/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for NewITMilestoneDashboardSummary
 */
export async function fetchNewITMilestoneDashboardSummary(payload: NewITMilestoneDashboardSummaryPayload): Promise<any> {
  return fetchFromApi('/user/NewITMilestoneDashboardSummary/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for Deliverables by Milestone ID
 */
export async function fetchDeliverablesByMilestone(milestoneId: string | number, status?: string): Promise<any> {
  const ts = new Date().getTime();
  const query = status ? `?Milestone_Id=${milestoneId}&Status=${status}&_t=${ts}` : `?Milestone_Id=${milestoneId}&_t=${ts}`;
  return fetchFromApi(`/user/DeliverablewithMilestoneIDwithoutPag/${query}`, {
    method: 'GET',
    cache: 'no-store',
  });
}

/**
 * GET request for Deliverables List
 */
export async function fetchDeliverablesList(projectId?: number | string, status?: string, responsiblePersonId?: number | string, search?: string, page?: number): Promise<any> {
  const params: string[] = [];
  if (projectId !== undefined) params.push(`Project_Id=${projectId}`);
  if (status !== undefined && status !== 'All') params.push(`Status=${status}`);
  if (responsiblePersonId !== undefined) params.push(`Responsible_Persion_Id=${responsiblePersonId}`);
  if (search !== undefined && search !== '') params.push(`search=${encodeURIComponent(search)}`);
  if (page !== undefined) params.push(`page=${page}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/DeliverableAdditional/${query}`, {
    method: 'GET',
  });
}

/**
 * Deliverable CRUD operations
 */
export async function createDeliverable(payload: any): Promise<any> {
  return fetchFromApi('/user/DeliverableCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDeliverable(id: string | number, payload: any): Promise<any> {
  const payloadWithId = {
    ...payload,
    id: Number(id)
  };
  return fetchFromApi('/user/DeliverableCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payloadWithId),
  });
}

export async function patchDeliverable(id: string | number, payload: any): Promise<any> {
  const payloadWithId = {
    ...payload,
    id: Number(id)
  };
  return fetchFromApi('/user/DeliverableCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payloadWithId),
  });
}

export async function deleteDeliverable(id: string | number): Promise<any> {
  return fetchFromApi(`/user/DeliverableCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * Timesheet APIs
 */
export async function createTimesheet(payload: any): Promise<any> {
  return fetchFromApi('/user/TimesheetCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMilestoneTimesheets(milestoneId: string | number): Promise<any> {
  return fetchFromApi('/user/MilestoneTimesheetListAPIView/', {
    method: 'POST',
    body: JSON.stringify({ Milestone_Id: Number(milestoneId) }),
  });
}

/**
 * Status History (Activity Logs) APIs
 */
export async function fetchStatusHistory(milestoneId: string | number): Promise<any> {
  return fetchFromApi(`/user/StatusHistoryListwithoutpagination/?Milestone_Id=${milestoneId}`, {
    method: 'GET',
  });
}

export async function createStatusHistory(payload: any): Promise<any> {
  const formattedPayload = {
    ...payload,
    changed_on: payload.changed_on 
      ? (typeof payload.changed_on === 'string' && payload.changed_on.includes('T') 
         ? payload.changed_on.split('T')[0] 
         : payload.changed_on)
      : new Date().toISOString().split('T')[0]
  };
  return fetchFromApi('/user/StatusHistoryCRUD/', {
    method: 'POST',
    body: JSON.stringify(formattedPayload),
  });
}

/**
 * Projectwise Milestone List without pagination
 */
export async function fetchProjectWiseMilestonesWithoutPagination(projectId: string | number, startDate?: string, endDate?: string): Promise<any> {
  const params: string[] = [`Project_Id=${projectId}`];
  if (startDate) params.push(`Start_Date=${startDate}`);
  if (endDate) params.push(`End_Date=${endDate}`);
  const query = `?${params.join('&')}`;
  return fetchFromApi(`/user/Project_IdMilestoneList/${query}`, {
    method: 'GET',
  });
}

/**
 * MilestoneAdditional list request
 */
export async function fetchMilestonesList(projectId?: number | string, status?: string, responsiblePersonId?: number | string, search?: string, page?: number): Promise<any> {
  const params: string[] = [];
  if (projectId !== undefined) params.push(`Project_Id=${projectId}`);
  if (status !== undefined && status !== 'All') params.push(`Status=${status}`);
  if (responsiblePersonId !== undefined) params.push(`Responsible_Persion_Id=${responsiblePersonId}`);
  if (search !== undefined && search !== '') params.push(`search=${encodeURIComponent(search)}`);
  if (page !== undefined) params.push(`page=${page}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/MilestoneAdditional/${query}`, {
    method: 'GET',
  });
}

/**
 * Milestone CRUD operations
 */
export async function createMilestone(payload: any): Promise<any> {
  return fetchFromApi('/user/MilestoneCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMilestoneApi(id: string | number, payload: any): Promise<any> {
  const payloadWithId = {
    ...payload,
    id: Number(id)
  };
  return fetchFromApi('/user/MilestoneCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payloadWithId),
  });
}

export async function deleteMilestoneApi(id: string | number): Promise<any> {
  return fetchFromApi(`/user/MilestoneCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * PATCH request for Milestone partial updates
 */
export async function patchMilestoneApi(id: string | number, payload: any): Promise<any> {
  const payloadWithId = {
    ...payload,
    id: Number(id)
  };
  return fetchFromApi('/user/MilestoneCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payloadWithId),
  });
}

/**
 * GET request for Milestone documents list
 */
export async function fetchMilestoneDocuments(milestoneId: string | number, category: string): Promise<any> {
  return fetchFromApi(`/user/MilestoneDocumentOverview/?Milestone_Id=${milestoneId}&File_Category=${category}`, {
    method: 'GET',
  });
}

export async function fetchProjectTimesheets(projectId: string | number): Promise<any> {  
  return fetchFromApi(`/user/Timesheetlist/?Project_Id=${projectId}`, {  
    method: 'GET',  
  });  
}  
export async function updateTimesheet(id: string | number, payload: any): Promise<any> {  
  const payloadWithId = { ...payload, id: Number(id) };  
  return fetchFromApi('/user/TimesheetCRUD/', {  
    method: 'PUT',  
    body: JSON.stringify(payloadWithId),  
  });  
}  
export async function deleteTimesheet(id: string | number): Promise<any> {  
  return fetchFromApi(`/user/TimesheetCRUD/?id=${id}`, {  
    method: 'DELETE',  
  });  
} 
