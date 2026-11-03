import { fetchFromApi } from '@/service/apiClient';

export interface CreateSalesordertrackingapiviewPayload {
  Sale_Id?: number;
}

export interface NewITTaskCalendarFilterPayload {
  organization_id: number;
  status?: string;
  owner_id?: number;
  task_type?: string;
  Priority?: string;
}

export interface NewITTaskSummaryPayload {
  period: [string, string];
}

export interface NewTaskManagemntListParams {
  Created_By?: number | string;
  Startdate: string;
  Enddate: string;
}

export interface ProjectTask {
  id?: number;
  Projecttask_Id?: string;
  Project_Id?: number;
  Milestone_Id?: number;
  Milestone_Name?: string;
  Task_Name?: string;
  Task_Type?: string;
  Parent_Task?: string;
  Deliverable_Name?: string;
  Project_Name?: string;
  Estimated_Cost?: number;
  Deliverable_Description?: string;
  Deliverable_Duration?: string;
  Completion_Date?: string;
  Responsible_Persion_Id?: number;
  Responsible_Persion?: string;
  Start_Date?: string;
  End_Date?: string;
  Actual_Start?: string;
  Actual_End?: string;
  Description?: string;
  Status?: string;
  Complete_Percentage?: string;
  Is_Deleted?: boolean;
  Created_By?: number;
  Created_Date?: string;
  Updated_By?: number;
  Updated_Date?: string;
  Task_Category?: string;
  Priority?: string;
  Tags?: string;
}

export interface ProjectTaskFilterPayload {
  Projecttask_Id?: string;
  Project_Id?: number;
  Project_Name?: string;
  Task_Name?: string;
  Status?: string;
  Responsible_Persion?: string;
  Responsible_Persion_Id?: number;
  Created_By?: string;
  Created_Date?: [string, string] | string;
  Is_Deleted?: boolean;
  page?: number;
}

export interface ProjectTaskSearchParams {
  search?: string;
  Created_By?: string;
}

/**
 * GET request for ProjecttaskAdditional - Get all tasks with pagination
 */
export async function fetchProjectTaskAdditional(page?: number): Promise<any> {
  const params: string[] = [];
  if (page !== undefined) params.push(`page=${page}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/ProjecttaskAdditional/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for single Projecttask by ID
 */
export async function fetchProjectTaskById(id: string | number): Promise<any> {
  return fetchFromApi(`/user/ProjecttaskCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * GET request for ProjecttaskMyAdditional - Get current user's tasks with pagination
 */
export async function fetchMyProjectTasks(createdBy: number | string): Promise<any> {
  return fetchFromApi(`/user/ProjecttaskMyAdditional/?Created_By=${createdBy}`, {
    method: 'GET',
  });
}

/**
 * GET request for ProjecttaskMyAdditionalwithoutpagination - Get current user's tasks without pagination
 */
export async function fetchMyProjectTasksWithoutPagination(createdBy: number | string): Promise<any> {
  return fetchFromApi(`/user/ProjecttaskMyAdditionalwithoutpagination/?Created_By=${createdBy}`, {
    method: 'GET',
  });
}

/**
 * GET request for Projecttasksearch - Search tasks
 */
export async function searchProjectTasks(params: ProjectTaskSearchParams): Promise<any> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  return fetchFromApi(`/user/Projecttasksearch/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * POST request for ProjecttaskCRUD - Create a new task
 */
export async function createProjectTask(payload: ProjectTask): Promise<any> {
  return fetchFromApi('/user/ProjecttaskCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * PUT request for ProjecttaskCRUD - Update a task
 */
export async function updateProjectTask(payload: ProjectTask & { id: string | number }): Promise<any> {
  return fetchFromApi('/user/ProjecttaskCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE request for ProjecttaskCRUD - Soft delete a task
 */
export async function deleteProjectTask(id: string | number): Promise<any> {
  return fetchFromApi(`/user/ProjecttaskCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * POST request for ProjecttaskFilter - Filter tasks
 */
export async function filterProjectTasks(payload: ProjectTaskFilterPayload): Promise<any> {
  return fetchFromApi('/user/ProjecttaskFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for ProjecttaskGhanttChart - Get tasks for Gantt chart
 */
export async function fetchProjectTaskGanttChart(): Promise<any> {
  return fetchFromApi('/user/ProjecttaskGhanttChart/', {
    method: 'GET',
  });
}

/**
 * GET request for ProjectOverdueTaskDashboard - Get overdue tasks
 */
export async function fetchProjectOverdueTaskDashboard(): Promise<any> {
  return fetchFromApi('/user/ProjectOverdueTaskDashboard/', {
    method: 'GET',
  });
}

/**
 * GET request for ProjectTaskCardDashboard - Get task cards
 */
export async function fetchProjectTaskCardDashboard(): Promise<any> {
  return fetchFromApi('/user/ProjectTaskCardDashboard/', {
    method: 'GET',
  });
}

/**
 * GET request for ProjectOverdueTaskDashboard
 */
export async function fetchProjectoverduetaskdashboard(): Promise<any> {
  return fetchFromApi('/user/ProjectOverdueTaskDashboard/', {
    method: 'GET',
  });
}

/**
 * GET request for ProjectTaskCardDashboard
 */
export async function fetchProjecttaskcarddashboard(): Promise<any> {
  return fetchFromApi('/user/ProjectTaskCardDashboard/', {
    method: 'GET',
  });
}

/**
 * GET request for ProjecttaskAdditional
 */
export async function fetchProjecttaskadditional(): Promise<any> {
  return fetchFromApi('/user/ProjecttaskAdditional/', {
    method: 'GET',
  });
}

/**
 * GET request for ProjecttaskMyAdditionalwithoutpagination
 */
export async function fetchProjecttaskMyAdditionalwithoutpagination(createdBy: number | string): Promise<any> {
  return fetchFromApi(`/user/ProjecttaskMyAdditionalwithoutpagination/?Created_By=${createdBy}`, {
    method: 'GET',
  });
}

/**
 * GET request for ProjecttaskGhanttChart
 */
export async function fetchProjecttaskghanttchart(): Promise<any> {
  return fetchFromApi('/user/ProjecttaskGhanttChart/', {
    method: 'GET',
  });
}

/**
 * POST request for SalesOrderTrackingAPIView
 */
export async function createSalesordertrackingapiview(payload: CreateSalesordertrackingapiviewPayload): Promise<any> {
  return fetchFromApi('/user/SalesOrderTrackingAPIView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTaskProgressReport(params: {
  project_id?: string;
  start_date?: string;
  end_date?: string;
  page_size?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params.project_id) query.append('project_id', params.project_id);
  if (params.start_date) query.append('start_date', params.start_date);
  if (params.end_date) query.append('end_date', params.end_date);
  if (params.page_size) {
    query.append('page_size', String(params.page_size));
    query.append('limit', String(params.page_size));
    query.append('pagination', 'false');
  }
  
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchFromApi(`/user/TaskProgressReport/${queryString}`, {
    method: 'GET',
  });
}

/**
 * GET request for SiteVisitlist
 */
export async function fetchSitevisitlist(page?: number | string): Promise<any> {
  const params: string[] = [];
  if (page !== undefined) params.push(`page=${page}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/SiteVisitlist/${query}`, {
    method: 'GET',
  });
}

/**
 * POST request for NewITTaskCalendarFilter
 */
export async function filterNewITTaskCalendar(payload: NewITTaskCalendarFilterPayload): Promise<any> {
  return fetchFromApi('/user/NewITTaskCalendarFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for NewITTaskSummary
 */
export async function fetchNewITTaskSummary(payload: NewITTaskSummaryPayload): Promise<any> {
  return fetchFromApi('/user/NewITTaskSummary/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for NewTaskManagemntListwithoutpagination
 */
export async function fetchNewTaskManagemntListWithoutPagination(params: NewTaskManagemntListParams): Promise<any> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      query.append(key, String(val));
    }
  });
  return fetchFromApi(`/user/NewTaskManagemntListwithoutpagination/?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * GET request for NewTaskManagemntList
 */
export async function fetchNewTaskManagemntList(params: NewTaskManagemntListParams): Promise<any> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null) {
      query.append(key, String(val));
    }
  });
  return fetchFromApi(`/user/NewTaskManagemntList/?${query.toString()}`, {
    method: 'GET',
  });
}
