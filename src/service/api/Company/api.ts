import { fetchFromApi } from '@/service/apiClient';

export interface CreateAccountlistwithdealcountPayload {
  page?: number;
}

export interface CreateAccountfilterPayload {
  Created_Date?: string[];
  User_Id?: number;
  Phone_Number?: string;
  page?: number;
  Lead_Name?: string;
  Location?: string;
  Mail?: string;
  Industry?: string;
}

/**
 * GET request for AccountDashboardCards
 */
export async function fetchAccountdashboardcards(created_by?: number | string): Promise<any> {
  const params: string[] = [];
  if (created_by !== undefined) params.push(`Created_By=${created_by}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/AccountDashboardCards/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for AccountDealOverview
 */
export async function fetchAccountdealoverview(account_id?: number | string): Promise<any> {
  const params: string[] = [];
  if (account_id !== undefined) params.push(`Account_Id=${account_id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/AccountDealOverview/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for AccountMyListWithDealCount
 */
export async function fetchAccountmylistwithdealcount(created_by?: number | string): Promise<any> {
  const params: string[] = [];
  if (created_by !== undefined) params.push(`Created_By=${created_by}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/AccountMyListWithDealCount/${query}`, {
    method: 'GET',
  });
}

/**
 * POST request for AccountListWithDealCount
 */
export async function createAccountlistwithdealcount(payload: CreateAccountlistwithdealcountPayload): Promise<any> {
  return fetchFromApi('/user/AccountListWithDealCount/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for AccountFilter
 */
export async function createAccountfilter(payload: CreateAccountfilterPayload): Promise<any> {
  return fetchFromApi('/user/AccountFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for AccountInvoiceList
 */
export async function fetchAccountinvoicelist(account_id?: number | string): Promise<any> {
  const params: string[] = [];
  if (account_id !== undefined) params.push(`Account_Id=${account_id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/AccountInvoiceList/${query}`, {
    method: 'GET',
  });
}

export async function fetchNewRequest(): Promise<any> {
  return fetchFromApi('', {
    method: 'GET',
  });
}

/**
 * GET request for AccountCRUD by account id
 */
export async function fetchAccountCRUD(id: number | string): Promise<any> {
  return fetchFromApi(`/user/AccountCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * POST request to create a new Account/Company (AccountCRUD)
 */
export async function createAccountCRUD(payload: any): Promise<any> {
  return fetchFromApi('/user/AccountCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAccountFullList(): Promise<any> {
  return fetchFromApi('/user/AccountFullList/?Is_Deleted=False', {
    method: 'GET',
  });
}

export interface ApiAccountNote {
  id: number;
  AccountNotes_Id?: string;
  Subject?: string;
  Notes: string;
  Active_Flag: boolean;
  Is_Deleted: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Organization_Id: number;
  Account_Id: number;
  Created_By?: any;
  Updated_By?: any;
}

/**
 * GET request for AccountNotesAdditional
 */
export async function fetchAccountNotes(accountId: string | number): Promise<ApiAccountNote[]> {
  const res = await fetchFromApi(`/user/AccountNotesAdditional/?Is_Deleted=False&Account_Id=${accountId}`, {
    method: 'GET',
  });
  if (res && typeof res === 'object') {
    if (Array.isArray(res.results)) {
      return res.results;
    } else if (Array.isArray(res)) {
      return res;
    }
  }
  return [];
}

/**
 * POST request for AccountNotesCRUD (Create)
 */
export async function createAccountNote(noteData: Partial<ApiAccountNote>): Promise<any> {
  return fetchFromApi('/user/AccountNotesCRUD/', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

/**
 * DELETE request for AccountNotesCRUD (Delete)
 */
export async function deleteAccountNote(noteId: string | number): Promise<any> {
  return fetchFromApi(`/user/AccountNotesCRUD/?id=${noteId}`, {
    method: 'DELETE',
  });
}

/**
 * PATCH request for AccountNotesCRUD (Update)
 */
export async function updateAccountNote(noteId: string | number, noteData: Partial<ApiAccountNote>): Promise<any> {
  const noteIdNum = typeof noteId === 'string' ? parseInt(noteId, 10) : noteId;
  return fetchFromApi(`/user/AccountNotesCRUD/?id=${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...noteData,
      id: noteIdNum,
    }),
  });
}

export interface ApiAccountActivity {
  id?: number;
  AccountActivities_Id?: any;
  Account_Id: number;
  Activity_Type: string;
  Created_By?: any;
  Expected_Date: string;
  Expected_Time: string;
  Organization_Id: number;
  Reminder_Payload?: any;
  Task: string;
  Task_Description: string;
  Updated_By?: any;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
}

/**
 * GET request for AccountActivitiesMyAdditional
 */
export async function fetchAccountActivities(accountId: string | number): Promise<ApiAccountActivity[]> {
  const res = await fetchFromApi(`/user/AccountActivitiesMyAdditional/?Account_Id=${accountId}`, {
    method: 'GET',
  });
  if (res && typeof res === 'object') {
    if (Array.isArray(res.results)) {
      return res.results;
    } else if (Array.isArray(res)) {
      return res;
    }
  }
  return [];
}

/**
 * POST request for AccountActivitiesCRUD (Create)
 */
export async function createAccountActivity(activityData: ApiAccountActivity): Promise<any> {
  return fetchFromApi('/user/AccountActivitiesCRUD/', {
    method: 'POST',
    body: JSON.stringify(activityData),
  });
}

/**
 * DELETE request for AccountActivitiesCRUD (Delete)
 */
export async function deleteAccountActivity(activityId: string | number): Promise<any> {
  return fetchFromApi(`/user/AccountActivitiesCRUD/?id=${activityId}`, {
    method: 'DELETE',
  });
}


/**
 * POST request for AccountCRUD (Update / Upload File / Update Tags)
 */
export async function uploadAccountFile(accountId: string | number, formData: FormData): Promise<any> {
  return fetchFromApi(`/user/AccountCRUD/?id=${accountId}`, {
    method: 'POST',
    body: formData,
  });
}

/**
 * PUT request for AccountCRUD (Update / Upload File / Update Tags)
 */
export async function updateAccountCRUD(accountId: string | number, formData: FormData): Promise<any> {
  return fetchFromApi(`/user/AccountCRUD/?id=${accountId}`, {
    method: 'PUT',
    body: formData,
  });
}

/**
 * DELETE request for AccountCRUD (Delete Company)
 */
export async function deleteAccountCRUD(accountId: string | number): Promise<any> {
  return fetchFromApi(`/user/AccountCRUD/?id=${accountId}`, {
    method: 'DELETE',
  });
}

/**
 * GET request for AccountOverviewContacts list
 */
export async function fetchAccountOverviewContacts(accountId: string | number): Promise<any> {
  return fetchFromApi(`/user/AccountOverviewContacts/?Account_Id=${accountId}`, {
    method: 'GET',
  });
}

/**
 * GET request for StatusHistoryList (Account Timeline)
 */
export async function fetchAccountStatusHistory(accountId: string | number): Promise<any[]> {
  try {
    const res = await fetchFromApi(`/user/StatusHistoryList/?Account_Id=${accountId}`, {
      method: 'GET',
    });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.results)) return res.results;
    return [];
  } catch {
    return [];
  }
}

/**
 * GET request for AccountSearch
 */
export async function fetchAccountSearch(search: string): Promise<any> {
  return fetchFromApi(`/user/AccountSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * GET request for Sent Mails list
 */
export async function fetchAccountSentMails(accountId: string | number): Promise<any> {
  return fetchFromApi(`/user/AccountMailMasterListAdditional/?Account_Id=${accountId}`, {
    method: 'GET',
  });
}

/**
 * GET request for Inbox Mails list
 * Note: Returns empty array on error (e.g. 417 from server) to prevent UI crash.
 */
export async function fetchAccountInboxMails(accountId: string | number): Promise<any[]> {
  try {
    const res = await fetchFromApi(`/user/InboxEmailAccountList/?Account_Id=${accountId}`, {
      method: 'GET',
    });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.results)) return res.results;
    return [];
  } catch {
    // Silently return empty list — backend may return 417 for this endpoint
    return [];
  }
}

/**
 * POST request to compose and send mail (AccountMailMasterCRUD)
 */
export async function createAccountMailMaster(payload: any): Promise<any> {
  return fetchFromApi('/user/AccountMailMasterCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request to upload file attachment (UserFilesandUrlsCRUD)
 */
export async function uploadUserFileAndUrl(payload: any): Promise<any> {
  return fetchFromApi('/user/UserFilesandUrlsCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for creating account meeting (AccountMeetingCRUD)
 */
export async function createAccountMeeting(payload: any): Promise<any> {
  return fetchFromApi('/user/AccountMeetingCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for company appointments (AccountMeetingAdditional)
 */
export async function fetchAccountMeetings(accountId: number | string): Promise<any> {
  return fetchFromApi(`/user/AccountMeetingAdditional/?Is_Deleted=False&Account_Id=${accountId}`, {
    method: 'GET',
  });
}

/**
 * PUT request for updating account meeting (AccountMeetingCRUD)
 */
export async function updateAccountMeeting(payload: any): Promise<any> {
  return fetchFromApi('/user/AccountMeetingCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE request for deleting account meeting (AccountMeetingCRUD)
 */
export async function deleteAccountMeeting(id: number | string): Promise<any> {
  return fetchFromApi(`/user/AccountMeetingCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}



