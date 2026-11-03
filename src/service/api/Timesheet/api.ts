import { fetchFromApi } from '@/service/apiClient';

export interface TimesheetPayload {
  User_Name: string;
  Work_Description: string;
  Overtime_Hours: number;
  Overtime_Reason: string;
  Status: string;
  Projecttask_Id?: (number | string)[];
  DefectTracking_Id?: (number | string)[];
  TicketManagement_Id?: (number | string)[];
  Nonproject_TaskManagement_Id?: (number | string)[];
  Duration?: string; // JSON string mapping taskId to {duration, unit}
  Created_By?: number;
  id?: number | string;
}

/**
 * Fetch all timesheet records
 */
export async function fetchAllTimesheets(payload: any = { Is_Deleted: false }): Promise<any> {
  try {
    return await fetchFromApi('/user/Timesheet_ManagementAlllist/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error fetching all timesheets:', error);
    throw error;
  }
}

/**
 * Fetch timesheets created by the current user
 */
export async function fetchTimesheetList(userId: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/Timesheet_ManagementMyList/?Created_By=${userId}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error fetching timesheet list:', error);
    throw error;
  }
}

/**
 * Search timesheets by text
 */
export async function searchTimesheets(search: string): Promise<any> {
  try {
    return await fetchFromApi(`/user/Timesheet_ManagementSearch/?search=${encodeURIComponent(search)}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error searching timesheets:', error);
    throw error;
  }
}

/**
 * Filter timesheets
 */
export async function filterTimesheets(payload: any): Promise<any> {
  try {
    return await fetchFromApi('/user/Timesheet_ManagementFilter/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error filtering timesheets:', error);
    throw error;
  }
}

/**
 * Create a new timesheet record
 */
export async function createTimesheet(payload: TimesheetPayload): Promise<any> {
  try {
    return await fetchFromApi('/user/Timesheet_ManagementCRUD/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error creating timesheet:', error);
    throw error;
  }
}

/**
 * Update an existing timesheet record
 */
export async function updateTimesheet(payload: TimesheetPayload): Promise<any> {
  try {
    return await fetchFromApi('/user/Timesheet_ManagementCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error updating timesheet:', error);
    throw error;
  }
}

/**
 * Fetch a single timesheet record by ID
 */
export async function fetchTimesheetById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/Timesheet_ManagementCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    throw error;
  }
}

/**
 * Delete a timesheet record by ID
 */
export async function deleteTimesheet(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/Timesheet_ManagementCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting timesheet:', error);
    throw error;
  }
}

/**
 * Fetch Project Tasks dropdown options
 */
export async function fetchProjectTaskDropdown(): Promise<any[]> {
  try {
    const res = await fetchFromApi('/user/ProjecttaskDropdown/', {
      method: 'GET',
    });
    return Array.isArray(res) ? res : res?.results || [];
  } catch (error) {
    console.error('Error fetching project task dropdown:', error);
    return [];
  }
}

/**
 * Fetch Defect Tracking dropdown options
 */
export async function fetchDefectTrackingDropdown(): Promise<any[]> {
  try {
    const res = await fetchFromApi('/user/DefectTracking_DropdownAPI/', {
      method: 'GET',
    });
    return Array.isArray(res) ? res : res?.results || [];
  } catch (error) {
    console.error('Error fetching defect tracking dropdown:', error);
    return [];
  }
}

/**
 * Fetch Ticket Management dropdown options
 */
export async function fetchTicketManagementDropdown(): Promise<any[]> {
  try {
    const res = await fetchFromApi('/user/TicketManagementDropdown/', {
      method: 'GET',
    });
    return Array.isArray(res) ? res : res?.results || [];
  } catch (error) {
    console.error('Error fetching ticket management dropdown:', error);
    return [];
  }
}

/**
 * Fetch Non-Project Tasks dropdown options
 */
export async function fetchNonProjectTaskDropdown(): Promise<any[]> {
  try {
    const res = await fetchFromApi('/user/Nonproject_TaskManagement_DropdownAPI/', {
      method: 'GET',
    });
    return Array.isArray(res) ? res : res?.results || [];
  } catch (error) {
    console.error('Error fetching non-project task dropdown:', error);
    return [];
  }
}

/**
 * Fetch User Email dropdown options
 */
export async function fetchUserEmailDropdown(): Promise<any[]> {
  try {
    const res = await fetchFromApi('/user/UserEmailDropdownAPI/', {
      method: 'GET',
    });
    return Array.isArray(res) ? res : res?.results || [];
  } catch (error) {
    console.error('Error fetching user email dropdown:', error);
    return [];
  }
}

/**
 * Send user timesheet report email
 */
export async function sendTimesheetMail(payload: any): Promise<any> {
  try {
    return await fetchFromApi('/user/TimeSheetMailMasterCRUD/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Error sending timesheet mail:', error);
    throw error;
  }
}
