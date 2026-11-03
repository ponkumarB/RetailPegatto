import { fetchFromApi, BASE_URL, getTenantName } from '@/service/apiClient';

export interface CreateProjectcompletionactualpredictionPayload {
  Project_Id?: number;
}

/**
 * POST request for ProjectCompletionActualPrediction
 */
export async function createProjectcompletionactualprediction(payload: CreateProjectcompletionactualpredictionPayload, project_id?: number | string): Promise<any> {
  const params: string[] = [];
  if (project_id !== undefined) params.push(`Project_Id=${project_id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/ProjectCompletionActualPrediction/${query}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for ProjectDashboardCards
 */
export async function fetchProjectdashboardcards(created_by?: number | string): Promise<any> {
  const params: string[] = [];
  if (created_by !== undefined) params.push(`Created_By=${created_by}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/ProjectDashboardCards/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for ProjectOverviewDashboard
 */
export async function fetchProjectoverviewdashboard(project_id?: number | string): Promise<any> {
  const params: string[] = [];
  if (project_id !== undefined) params.push(`Project_Id=${project_id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/ProjectOverviewDashboard/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for Projectlistwithoutpaginaton (List projects without pagination)
 */
export async function fetchProjectlistwithoutpaginaton(): Promise<any> {
  return fetchFromApi('/user/Projectlistwithoutpaginaton/', {
    method: 'GET',
  });
}

export interface TrackProjectDashboardPayload {
  project_owner?: string | number;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
}

export interface TrackProjectListPayload {
  project_owner?: string | number;
  status?: string;
  priority?: string;
  created_by?: string | number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
}

/**
 * POST request for TrackProjectDashboardAPI
 */
export async function fetchTrackProjectDashboard(payload: TrackProjectDashboardPayload): Promise<any> {
  return fetchFromApi('/user/TrackProjectDashboardAPI/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for TrackProjectListAPI
 */
export async function fetchTrackProjectList(payload: TrackProjectListPayload, page?: number, page_size?: number): Promise<any> {
  const params: string[] = [];
  if (page !== undefined) params.push(`page=${page}`);
  if (page_size !== undefined) params.push(`page_size=${page_size}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/TrackProjectListAPI/${query}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Create Project (POST)
 */
export async function createProjectApi(payload: any): Promise<any> {
  const normalized = { ...payload };
  if (normalized.Progress !== undefined && normalized.progress === undefined) normalized.progress = normalized.Progress;
  if (normalized.progress !== undefined && normalized.Progress === undefined) normalized.Progress = normalized.progress;
  return fetchFromApi('/user/ProjectCRUD/', {
    method: 'POST',
    body: JSON.stringify(normalized),
  });
}

/**
 * Get Project Details (GET)
 */
export async function getProjectApi(id: string | number): Promise<any> {
  return fetchFromApi(`/user/ProjectCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update Project (PUT)
 */
export async function updateProjectApi(payload: any): Promise<any> {
  const normalized = { ...payload };
  if (normalized.Progress !== undefined && normalized.progress === undefined) normalized.progress = normalized.Progress;
  if (normalized.progress !== undefined && normalized.Progress === undefined) normalized.Progress = normalized.progress;
  return fetchFromApi('/user/ProjectCRUD/', {
    method: 'PUT',
    body: JSON.stringify(normalized),
  });
}

/**
 * Delete Project (DELETE)
 */
export async function deleteProjectApi(id: string | number): Promise<any> {
  return fetchFromApi(`/user/ProjectCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}



/**
 * Bulk Upload Projects
 */
export async function bulkUploadProjectsApi(formData: FormData): Promise<any> {
  return fetchFromApi('/user/Project_Bulk_Upload/', {
    method: 'POST',
    body: formData,
  });
}

/**
 * Download Project Template
 */
export async function downloadProjectTemplateApi(): Promise<Blob> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const tenant = getTenantName();
  const url = `${BASE_URL}/${tenant}/user/Download_Project_Template/`;
  
  const headers = new Headers();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  const res = await fetch(url, {
    method: 'GET',
    headers,
  });
  
  if (!res.ok) {
    throw new Error(`Failed to download template: ${res.statusText}`);
  }
  
  return res.blob();
}
