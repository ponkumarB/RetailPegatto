// service/api/ScrumMeeting/api.ts

import { fetchFromApi } from '@/service/apiClient';
import axios from 'axios';

export interface ScrumMeetingPayload {
  id?: number;
  Status?: string;
  Organization_Id?: number;
  Project_Id?: number;
  Sprint_Id?: number;
  Meeting_Type?: string;
  Meeting_Title?: string;
  Meeting_Date?: string;
  Start_Time?: string;
  End_Time?: string;
  Time_Zone?: string;
  Repeat?: string;
  Attendees?: number[];
  Additional_Invitees?: string;
  Add_To_Calendar?: boolean;
  Send_Email_Notifications?: boolean;
  Enable_Reminder?: boolean;
  Record_Meeting?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

export interface ApiScrumMeeting {
  id: number | string;
  Meeting_Title?: string;
  Meeting_Type?: string;
  Project_Id?: any;
  Sprint_Id?: any;
  Project_Name?: string;
  Sprint_Name?: string;
  Meeting_Date?: string;
  Start_Time?: string;
  End_Time?: string;
  Time_Zone?: string;
  Repeat?: string;
  Status?: string;
  Facilitator?: string;
  ScrumMeeting_Id?: string;
  Created_By?: any;
  Updated_By?: any;
}

export interface ApiResponse {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: ApiScrumMeeting[];
}

export interface Project {
  id: number | string;
  name: string;
  Project_Name?: string;
  [key: string]: any;
}

export interface Sprint {
  id: number | string;
  name: string;
  Sprint_Name?: string;
  Project_Id?: number | string;
  [key: string]: any;
}

export interface ScrumMeetingFilters {
  Is_Deleted?: boolean;
  Project_Id?: string | number;
  Sprint_Id?: string | number;
  Meeting_Type__icontains?: string;
  Meeting_Title__icontains?: string;
  Time_Zone__icontains?: string;
  Repeat__icontains?: string;
  Meeting_Date__range?: [string, string] | string;
  Created_Date__range?: [string, string];
  Status?: string;
  page?: number;
  page_size?: number;
  Meeting_Date?: string;
}

/**
 * Fetch all scrum meetings using ScrumMeetingList endpoint
 * This returns all non-deleted meetings ordered by id descending
 */
export async function fetchScrumMeetingList(): Promise<ApiResponse> {
  try {
    const response = await fetchFromApi('/user/ScrumMeetingList/', {
      method: 'GET',
    });

    // Return the response directly - it could be an array or paginated response
    return response;
  } catch (error) {
    console.error('Error fetching scrum meetings list:', error);
    throw error;
  }
}

/**
 * Fetch all projects
 */
export async function fetchProjects(): Promise<Project[]> {
  try {
    const response = await fetchFromApi('/user/Projectlistwithoutpaginaton/', {
      method: 'GET',
    });
    return Array.isArray(response) ? response : response?.results || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

/**
 * Fetch sprints by project ID
 */
export async function fetchSprintsByProject(projectId?: string | number): Promise<Sprint[]> {
  try {
    let url = '/user/SprintListwithPagination/';
    if (projectId) {
      url = `/user/SprintListwithPagination/?project_id=${projectId}`;
    }
    const response = await fetchFromApi(url, {
      method: 'GET',
    });
    return Array.isArray(response) ? response : response?.results || [];
  } catch (error) {
    console.error('Error fetching sprints:', error);
    throw error;
  }
}

/**
 * Create a new scrum meeting via ScrumMeetingCRUD (POST)
 */
export async function createScrumMeeting(payload: ScrumMeetingPayload): Promise<any> {
  return fetchFromApi('/user/ScrumMeetingCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single scrum meeting by ID via ScrumMeetingCRUD (GET)
 */
export async function fetchScrumMeetingById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ScrumMeetingCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch scrum meeting by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ScrumMeetingCRUD/${id}/`, {
      method: 'GET',
    });
  }
}

/**
 * Fetch all scrum meetings without pagination (GET) - Legacy
 */
export async function fetchAllScrumMeetings(): Promise<any> {
  return fetchFromApi('/user/ScrumMeetingListwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * Fetch scrum meetings with filters using the filter endpoint (POST)
 */
export async function fetchScrumMeetingsWithFilters(filters?: ScrumMeetingFilters): Promise<ApiResponse> {
  try {
    const filterPayload: any = {
      Is_Deleted: false,
    };

    if (filters) {
      if (filters.Project_Id) {
        filterPayload.Project_Id = filters.Project_Id;
      }

      if (filters.Sprint_Id) {
        filterPayload.Sprint_Id = filters.Sprint_Id;
      }

      if (filters.Meeting_Type__icontains) {
        filterPayload.Meeting_Type__icontains = filters.Meeting_Type__icontains;
      }

      if (filters.Meeting_Title__icontains) {
        filterPayload.Meeting_Title__icontains = filters.Meeting_Title__icontains;
      }

      if (filters.Time_Zone__icontains) {
        filterPayload.Time_Zone__icontains = filters.Time_Zone__icontains;
      }

      if (filters.Repeat__icontains) {
        filterPayload.Repeat__icontains = filters.Repeat__icontains;
      }

      if (filters.Meeting_Date__range) {
        filterPayload.Meeting_Date__range = filters.Meeting_Date__range;
      } else if (filters.Meeting_Date) {
        filterPayload.Meeting_Date__range = [filters.Meeting_Date, filters.Meeting_Date];
      }

      if (filters.Created_Date__range) {
        filterPayload.Created_Date__range = filters.Created_Date__range;
      }

      if (filters.Status) {
        filterPayload.Status = filters.Status;
      }

      if (filters.page) {
        filterPayload.page = filters.page;
      }

      if (filters.page_size) {
        filterPayload.page_size = filters.page_size;
      }
    }

    const response = await fetchFromApi('/user/ScrumMeetingFilter/', {
      method: 'POST',
      body: JSON.stringify(filterPayload),
    });

    return response;
  } catch (error) {
    console.error('Error fetching scrum meetings with filters:', error);
    throw error;
  }
}

/**
 * Update a scrum meeting fully via ScrumMeetingCRUD (PUT)
 */
export async function updateScrumMeeting(id: number | string, payload: ScrumMeetingPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/ScrumMeetingCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/ScrumMeetingCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ScrumMeetingCRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Update a scrum meeting partially via ScrumMeetingCRUD (PATCH)
 */
export async function patchScrumMeeting(id: number | string, payload: Partial<ScrumMeetingPayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/ScrumMeetingCRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/ScrumMeetingCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ScrumMeetingCRUD/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete a scrum meeting via ScrumMeetingCRUD (DELETE)
 */
export async function deleteScrumMeeting(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ScrumMeetingCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ScrumMeetingCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}