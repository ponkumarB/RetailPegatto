import { fetchFromApi, getTenantName, BASE_URL } from '@/service/apiClient';

// Helper to build query parameters dynamically and cleanly
function buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
            if (Array.isArray(val)) {
                val.forEach(item => query.append(key, String(item)));
            } else {
                query.append(key, String(val));
            }
        }
    });
    const str = query.toString();
    return str ? `?${str}` : '';
}

// ==========================================
// 1. Interfaces & Types
// ==========================================

export interface UserQualifiedLead {
    id?: number;
    Organization_Id?: number;
    Ratings?: string;
    Tags?: string[];
    Source_Details?: string;
    Notes?: string;
    Prefered_Contact_Method?: string;
    Fax?: string;
    LinkedIn_Profile?: string;
    Twitter_Profile?: string;
    Date_Of_Birth?: string;
    Mobile_No?: string;
    LeadId?: string;
    Salutation?: string;
    LeadFirstName?: string;
    LeadLastName?: string;
    File?: string;
    FileName?: string;
    LeadType?: string;
    Pincode?: string;
    CompanyName?: string;
    PhoneNo?: string;
    EmailId?: string;
    WebsiteURL?: string;
    BuildingDoorNo?: string;
    StreetName?: string;
    AreaName?: string;
    City?: string;
    State?: string;
    Country?: string;
    LeadSource?: string;
    LeadScore?: number;
    Lead_Stage?: string;
    Recommaned_Action?: string;
    Lead_Status?: string;
    LifeCycleStage?: string;
    Maps?: string;
    LeadDescription?: string;
    LeadMLQStatus?: boolean;
    LeadMLQuestions?: Record<string, any>;
    LeadSLQStatus?: boolean;
    LeadSLQuestions?: Record<string, any>;
    LeadQualifyStatus?: boolean;
    Lead_Owner?: string;
    Lead_Owner_Id?: number;
    Job_Title?: string;
    Job_Role?: string;
    Designation?: string;
    Decissionmaker?: boolean;
    Yrs_of_Experience?: string;
    LeadNoOfEmployees?: number;
    Lead_Industry?: string;
    LeadCompanyTurnOver?: number;
    Head_Quarter?: string;
    LeadLocation?: string;
    Year_of_Founded?: string;
    Organization_structure?: string;
    Budget_Availability?: string;
    Budget?: string;
    Level_of_detail_provided?: string;
    Previous_purchases?: string;
    Campaign_Id?: string;
    ContactId?: string;
    Callconnected?: boolean;
    MobileCountry_Id?: string;
    Deal_Created?: boolean;
    LeadGrowth?: string;
    prediction?: string;
    Is_Deleted?: boolean;
    Lead_Json?: Record<string, any>;
    Company_status?: boolean;
    MQL_Qualified_Date?: string;
    SQL_Qualified_Date?: string;
    Created_By?: number;
    Created_Date?: string;
    Updated_By?: number;
    Updated_Date?: string;
}

export interface CEOLeadsSalesPipelineParams {
    start_date?: string;
    end_date?: string;
}

export interface UserQualifiedLeadsListParams {
    User_Id?: number;
    Lead_Status?: string;
    page?: number;
}

export interface UserQualifiedLeadsFilterParams {
    LeadFirstName?: string;
    Lead_Owner?: string;
    Country?: string;
    LeadSource?: string;
    Industry_Type?: string;
    Lead_Status?: string;
    fromdate?: string;
    todate?: string;
    page?: number;
    User_Id?: number;
    User_id?: number;
}

export interface UserQualifiedLeadsSearchParams {
    User_id?: number;
    search: string;
    page?: number;
}

export interface TaskListParams {
    Lead_Id?: number;
    page?: number;
}

export interface StatusHistoryParams {
    Lead_Id: number;
    page?: number;
}

export interface LeadActivityFilterParams {
    Lead_Id: number;
    Start_Date?: string;
    End_Date?: string;
}

export interface LeadMailListFilterParams {
    Lead_Id: number;
    Start_Date?: string;
    End_Date?: string;
}

export interface LeadNotesFilterParams {
    Lead_Id: number;
    Start_Date?: string;
    End_Date?: string;
}

export interface LeadDealListFilterParams {
    Lead_Id: number;
    Start_Date?: string;
    End_Date?: string;
}

export interface TaskPayload {
    id?: number;
    Organization_Id?: number;
    CRMUserLeadMeeting_id?: number;
    EducationalLead_Id?: number;
    Lead_Id?: number;
    RealestateLead_Id?: number;
    Deal_Id?: number;
    Task_Resource?: string;
    Task_Related?: string;
    RealestateDeal_Id?: number;
    TaskName?: string;
    Task_Desc?: string;
    Start_Date?: string;
    Due_Date?: string;
    Priority?: string;
    Completion?: string;
    Project?: number;
    Assigned_To?: number;
    Assigned_person?: string;
    UserReminder?: number | null | {
        Created_By?: number | null;
        Updated_By?: number | null;
        ReminderFor?: string;
        Repeat_EveryDay?: string;
        RemainderDueDate?: string;
        RemainderMessage?: string;
    };
    Status?: string;
    Is_Deleted?: boolean;
    Created_By?: number;
    Updated_By?: number;
    Sub_Task?: {
        Sub_Task_Name: string;
        Status: string;
        Completion: string;
    }[];
}

export interface StatusHistoryPayload {
    id?: number;
    task?: number;
    sales_order?: number;
    account?: number;
    deal?: number;
    userqualified_lead?: number;
    organization?: number;
    previous_status?: string;
    current_status?: string;
    changed_on?: string;
    changed_by?: number;
    notes?: string;
    Is_Deleted?: boolean;
    Created_By?: number;
    Updated_By?: number;
}

export interface LeadFilterPostParams {
    LeadFirstName?: string;
    Lead_Industry?: string;
    Lead_Status?: string;
    Lead_Owner?: string;
    City?: string;
    State?: string;
    LeadType?: string;
    Country?: string;
    Created_Date?: [string, string] | string | null;
    User_id?: number;
    page?: number;
}

// ==========================================
// 2. Lead CRUD API Functions
// ==========================================

/**
 * Create a new qualified lead
 */
export async function createUserQualifiedLead(payload: UserQualifiedLead): Promise<any> {
    return fetchFromApi('/user/UserQualifiedLeadsCRUD/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Fetch a single qualified lead by ID (or list of leads if no ID is provided)
 */
export async function fetchUserQualifiedLeadById(id: number | string): Promise<any> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    return fetchFromApi(`/user/UserQualifiedLeadsCRUD/?id=${numericId}`, {
        method: 'GET',
    });
}

/**
 * Update an existing qualified lead fully via PUT
 */
export async function updateUserQualifiedLead(id: number | string, payload: UserQualifiedLead): Promise<any> {
    const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
    try {
        return await fetchFromApi('/user/UserQualifiedLeadsCRUD/', {
            method: 'PUT',
            body: JSON.stringify(payloadWithId),
        });
    } catch (error) {
        console.warn(`PUT to base /user/UserQualifiedLeadsCRUD/ failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/UserQualifiedLeadsCRUD/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }
}

/**
 * Update an existing qualified lead partially via PATCH
 */
export async function patchUserQualifiedLead(id: number | string, payload: Partial<UserQualifiedLead>): Promise<any> {
    const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
    try {
        return await fetchFromApi('/user/UserQualifiedLeadsCRUD/', {
            method: 'PATCH',
            body: JSON.stringify(payloadWithId),
        });
    } catch (error) {
        console.warn(`PATCH to base /user/UserQualifiedLeadsCRUD/ failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/UserQualifiedLeadsCRUD/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }
}

/**
 * Delete a qualified lead by ID
 */
export async function deleteUserQualifiedLead(id: number | string): Promise<any> {
    try {
        return await fetchFromApi(`/user/UserQualifiedLeadsCRUD/?id=${id}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.warn(`DELETE with query param failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/UserQualifiedLeadsCRUD/${id}/`, {
            method: 'DELETE',
        });
    }
}

// ==========================================
// 3. Lead List & Pipeline APIs
// ==========================================

/**
 * Fetch CEO Leads Sales Pipeline Cards
 */
export async function fetchCEOLeadsSalesPipeline(params: CEOLeadsSalesPipelineParams): Promise<any> {
    return fetchFromApi('/user/CEO_LeadsSalesPipeline/', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * Fetch list of qualified leads with optional pagination
 */
export async function fetchUserQualifiedLeadsList(params?: UserQualifiedLeadsListParams): Promise<any> {
    const queryString = params ? buildQueryString(params) : '';
    return fetchFromApi(`/user/UserQualifiedLeadsList/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch list of qualified leads without pagination
 */
export async function fetchUserQualifiedLeadListWithoutPagination(): Promise<any> {
    return fetchFromApi('/user/Userqualifiedleadlistwithoutpagination/', {
        method: 'GET',
    });
}


/**
 * Filter qualified leads by search fields and/or date range
 */
export async function filterUserQualifiedLeads(params: UserQualifiedLeadsFilterParams): Promise<any> {
    return fetchFromApi('/user/UserQualifiedLeadsFilter/', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

/**
 * Search qualified leads
 */
export async function searchUserQualifiedLeads(params: UserQualifiedLeadsSearchParams): Promise<any> {
    const queryString = buildQueryString(params);
    return fetchFromApi(`/user/UserQualifiedLeadsSearch/${queryString}`, {
        method: 'GET',
    });
}

// ==========================================
// 4. List Overview Page Sub-components
// ==========================================

/**
 * Fetch Lead Task List (with pagination)
 */
export async function fetchLeadTaskListWithPagination(params?: TaskListParams): Promise<any> {
    const queryString = params ? buildQueryString(params) : '';
    return fetchFromApi(`/user/NewTaskManagemntList/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch Lead Task List (without pagination)
 */
export async function fetchLeadTaskListWithoutPagination(params?: { Lead_Id?: number }): Promise<any> {
    const queryString = params ? buildQueryString(params) : '';
    return fetchFromApi(`/user/NewTaskManagemntListwithoutpagination/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch All Tasks using the new unified task endpoint.
 * Supports filtering via: created_by, assigned_to, status (e.g. 'overdue')
 */
export async function fetchAllTasksNew(params?: {
    created_by?: number;
    assigned_to?: number;
    status?: string;
    page?: number;
}): Promise<{ count: number; next: string | null; previous: string | null; results: any[] }> {
    const queryString = params ? buildQueryString(params) : '';
    return fetchFromApi(`/user/NewTaskManagemntMyAdditionalNew/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Search tasks using GET /user/Newtaskmanagmentsearch/
 */
export async function searchTasks(params?: {
    created_by?: number | string;
    status?: string;
    assigned_to?: number | string;
    search?: string;
    page?: number;
}): Promise<{ count: number; next: string | null; previous: string | null; results: any[] }> {
    const queryString = params ? buildQueryString(params) : '';
    return fetchFromApi(`/user/Newtaskmanagmentsearch/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Filter tasks using POST /user/Newtaskmanagmentfilter/
 */
export async function filterTasks(payload: {
    created_by?: number | string | null;
    assigned_to?: number | string | null;
    status?: string | null;
    TaskName?: string | null;
    Completion?: string | number | null;
    Priority?: string | null;
    Assigned_person?: string | null;
    Start_Date?: string[];
    project_name?: string | null;
    page?: number;
}): Promise<{ count: number; next: string | null; previous: string | null; results: any[] }> {
    return fetchFromApi('/user/Newtaskmanagmentfilter/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}


/**
 * Fetch Non-project Tasks without pagination (POST /user/Nonproject_TaskManagementlistwithoutpagination/)
 */
export async function fetchNonProjectTasksWithoutPagination(payload: {
    Assigned_To: number;
    Created_By: number;
    start_date: string;
    end_date: string;
}): Promise<any> {
    return fetchFromApi('/user/Nonproject_TaskManagementlistwithoutpagination/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Fetch Lead Update Records list
 */
export async function fetchLeadUpdateRecords(documentId: string): Promise<any> {
    const queryString = buildQueryString({ Document_Id: documentId });
    return fetchFromApi(`/user/Updaterecordslist/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch Lead Status History list (with pagination)
 */
export async function fetchStatusHistoryListWithPagination(params: StatusHistoryParams): Promise<any> {
    const queryString = buildQueryString(params);
    return fetchFromApi(`/user/StatusHistoryList/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch Lead Status History list (without pagination)
 */
export async function fetchStatusHistoryListWithoutPagination(params: { Lead_Id: number }): Promise<any> {
    const queryString = buildQueryString(params);
    return fetchFromApi(`/user/StatusHistoryListwithoutpagination/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch Lead Activity list
 */
export async function fetchLeadActivityList(params: LeadActivityFilterParams): Promise<any> {
    const queryString = buildQueryString(params);
    return fetchFromApi(`/user/UserQualifiedLeadsActivitiesMyAdditional/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch Lead Email list
 */
export async function fetchLeadEmailList(params: LeadMailListFilterParams): Promise<any> {
    const queryString = buildQueryString(params);
    return fetchFromApi(`/user/LeadMailListAdditional/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch Lead Notes list
 */
export async function fetchLeadNotesList(params: LeadNotesFilterParams): Promise<any> {
    const queryString = buildQueryString(params);
    return fetchFromApi(`/user/UserLeadNotesFilter/${queryString}`, {
        method: 'GET',
    });
}

/**
 * Fetch Lead Deal list
 */
export async function fetchLeadDealList(params: LeadDealListFilterParams): Promise<any> {
    const queryString = buildQueryString(params);
    return fetchFromApi(`/user/LeadDealList/${queryString}`, {
        method: 'GET',
    });
}

// ==========================================
// 5. Task CRUD APIs
// ==========================================

/**
 * Create a new task
 */
export async function createTask(payload: TaskPayload): Promise<any> {
    return fetchFromApi('/user/NewTaskManagemntCRUD/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Fetch a single task by ID
 */
export async function fetchTaskById(id: number | string): Promise<any> {
    try {
        return await fetchFromApi(`/user/NewTaskManagemntCRUD/?id=${id}`, {
            method: 'GET',
        });
    } catch (error) {
        console.warn(`Fetch task by query param failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/NewTaskManagemntCRUD/${id}/`, {
            method: 'GET',
        });
    }
}

/**
 * Update an existing task fully via PUT
 */
export async function updateTask(id: number | string, payload: TaskPayload): Promise<any> {
    const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
    try {
        return await fetchFromApi('/user/NewTaskManagemntCRUD/', {
            method: 'PUT',
            body: JSON.stringify(payloadWithId),
        });
    } catch (error) {
        console.warn(`PUT to base /user/NewTaskManagemntCRUD/ failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/NewTaskManagemntCRUD/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }
}

/**
 * Update an existing task partially via PATCH
 */
export async function patchTask(id: number | string, payload: Partial<TaskPayload>): Promise<any> {
    const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
    try {
        return await fetchFromApi('/user/NewTaskManagemntCRUD/', {
            method: 'PATCH',
            body: JSON.stringify(payloadWithId),
        });
    } catch (error) {
        console.warn(`PATCH to base /user/NewTaskManagemntCRUD/ failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/NewTaskManagemntCRUD/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }
}

/**
 * Delete a task by ID
 */
export async function deleteTask(id: number | string): Promise<any> {
    try {
        return await fetchFromApi(`/user/NewTaskManagemntCRUD/?id=${id}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.warn(`DELETE with query param failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/NewTaskManagemntCRUD/${id}/`, {
            method: 'DELETE',
        });
    }
}

// ==========================================
// 6. Status History CRUD APIs
// ==========================================

/**
 * Create a new status history record
 */
export async function createStatusHistory(payload: StatusHistoryPayload): Promise<any> {
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
 * Fetch a single status history record by ID
 */
export async function fetchStatusHistoryById(id: number | string): Promise<any> {
    try {
        return await fetchFromApi(`/user/StatusHistoryCRUD/?id=${id}`, {
            method: 'GET',
        });
    } catch (error) {
        console.warn(`Fetch status history by query param failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/StatusHistoryCRUD/${id}/`, {
            method: 'GET',
        });
    }
}

/**
 * Update an existing status history record fully via PUT
 */
export async function updateStatusHistory(id: number | string, payload: StatusHistoryPayload): Promise<any> {
    const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
    try {
        return await fetchFromApi('/user/StatusHistoryCRUD/', {
            method: 'PUT',
            body: JSON.stringify(payloadWithId),
        });
    } catch (error) {
        console.warn(`PUT to base /user/StatusHistoryCRUD/ failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/StatusHistoryCRUD/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }
}

/**
 * Update an existing status history record partially via PATCH
 */
export async function patchStatusHistory(id: number | string, payload: Partial<StatusHistoryPayload>): Promise<any> {
    const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
    try {
        return await fetchFromApi('/user/StatusHistoryCRUD/', {
            method: 'PATCH',
            body: JSON.stringify(payloadWithId),
        });
    } catch (error) {
        console.warn(`PATCH to base /user/StatusHistoryCRUD/ failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/StatusHistoryCRUD/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }
}

/**
 * Delete a status history record by ID
 */
export async function deleteStatusHistory(id: number | string): Promise<any> {
    try {
        return await fetchFromApi(`/user/StatusHistoryCRUD/?id=${id}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.warn(`DELETE with query param failed, trying URL detail path:`, error);
        return fetchFromApi(`/user/StatusHistoryCRUD/${id}/`, {
            method: 'DELETE',
        });
    }
}

/**
 * Fetch the user list for lead owners
 */
export async function fetchUsersList(): Promise<any> {
    return fetchFromApi('/useradmin/UsersList/', {
        method: 'GET',
    });
}

/**
 * Upload leads Excel file
 */
export async function uploadLeadsExcel(formData: FormData): Promise<any> {
    return fetchFromApi('/user/Lead_upload/', {
        method: 'POST',
        body: formData,
    });
}

/**
 * Create a new lead note
 */
export async function createUserLeadNote(payload: any): Promise<any> {
    return fetchFromApi('/user/UserLeadNotesCRUD/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Create/Send a new lead email
 */
export async function createUserLeadMail(payload: any): Promise<any> {
    const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    const userId = userIdStr ? (isNaN(Number(userIdStr)) ? userIdStr : parseInt(userIdStr, 10)) : null;
    const orgIdStr = typeof window !== 'undefined' ? localStorage.getItem('Organization_Id') : null;
    const orgId = orgIdStr ? (isNaN(Number(orgIdStr)) ? orgIdStr : parseInt(orgIdStr, 10)) : null;
    const updatedPayload = {
        cc: null,
        Organization_Id: orgId,
        ...payload,
        UserId: userId
    };
    return fetchFromApi('/user/UserLeadMailMasterCRUD/', {
        method: 'POST',
        body: JSON.stringify(updatedPayload),
    });
}

/**
 * Create a new lead activity
 */
export async function createUserLeadActivity(payload: any): Promise<any> {
    return fetchFromApi('/user/UserQualifiedLeadsActivitiesCRUD/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Bulk status update for leads
 */
export async function bulkUpdateLeadStatus(payload: { Lead_Status: string; lead_ids: number[] }): Promise<any> {
    return fetchFromApi('/user/ITBulkLeadStatusUpdate/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Multiple assign leads to an agent
 */
export async function assignLeadsToAgent(payload: { lead_ids: number[]; lead_owner_id: number }): Promise<any> {
    return fetchFromApi('/user/qualifiedleadmanualassigningwithagent/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Filter leads using POST endpoint /user/LeadFilter/
 */
export async function postLeadFilter(payload: LeadFilterPostParams): Promise<any> {
    return fetchFromApi('/user/LeadFilter/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Fetch Knowlarity Configuration
 */
export async function fetchKnowlarityConfig(userId: string | number): Promise<any> {
    if (!userId) return null;

    // Check session cache if this user has no telephony config to prevent repetitive requests
    if (typeof window !== 'undefined' && sessionStorage.getItem(`knowlarity_not_found_${userId}`)) {
        return null;
    }

    try {
        return await fetchFromApi(`/user/KnowlarityConfigurationCRUD/?User_Id=${userId}`);
    } catch (err: any) {
        const errorMsg = String(err?.message || err || '');
        if (errorMsg.includes('matching query does not exist') || errorMsg.includes('does not exist')) {
            try {
                const numericUserId = typeof userId === 'number' ? userId : (parseInt(String(userId).replace(/\D/g, ''), 10) || 110);
                return await fetchFromApi('/user/KnowlarityConfigurationCRUD/', {
                    method: 'POST',
                    body: JSON.stringify({
                        User_Id: numericUserId,
                        Created_By: numericUserId,
                        Updated_By: numericUserId,
                        Header_Key: 'Authorization',
                        API_Key: '',
                        Knowlarity_Number: '',
                        Knowlarity_CallerId: ''
                    })
                });
            } catch {
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem(`knowlarity_not_found_${userId}`, 'true');
                }
                return null;
            }
        }
        return null;
    }
}

/**
 * Fetch Knowlarity Agents
 */
export async function fetchKnowlarityAgents(apiKey: string, headerKey: string): Promise<any> {
    const res = await fetch('https://kpi.knowlarity.com/Basic/v1/account/agent', {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': headerKey,
            'Authorization': apiKey
        }
    });
    if (!res.ok) {
        throw new Error(`Knowlarity Agent API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

/**
 * Place call via Knowlarity
 */
export async function makeKnowlarityCall(payload: {
    k_number: string;
    agent_number: string;
    customer_number: string;
    caller_id: string;
    caller_name: string;
}, apiKey: string, headerKey: string): Promise<any> {
    const res = await fetch('https://kpi.knowlarity.com/Basic/v1/account/call/makecall', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': headerKey,
            'Authorization': apiKey
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        throw new Error(`Knowlarity Make Call API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

/**
 * Fetch Knowlarity Call Logs
 */
export async function fetchKnowlarityCallLogs(params: {
    start_Date: string;
    end_Date: string;
    UserId: string | number;
    Module: string;
}): Promise<any> {
    const query = new URLSearchParams(params as any).toString();
    return fetchFromApi(`/user/KnowlarityCallLogsCRUD/?${query}`);
}

/**
 * Save Callcenter Activity
 */
export async function saveCallcenterActivity(payload: any): Promise<any> {
    return fetchFromApi('/user/CallcenterActivityCRUD/', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

/**
 * Fetch lead score details
 */
export async function fetchLeadScore(leadId: string | number): Promise<any> {
    const { BASE_URL } = await import('@/service/apiClient');
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}/cbs/user/LeadScoreService/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ Lead_ID: String(leadId) }),
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch lead score: ${res.status}`);
    }
    return res.json();
}

/**
 * Create a new lead meeting (appointment)
 */
export async function createUserLeadMeeting(payload: any): Promise<any> {
    return fetchFromApi('/user/UserLeadMeetingCRUD/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Update a lead meeting (appointment)
 */
export async function updateUserLeadMeeting(payload: any): Promise<any> {
    return fetchFromApi('/user/UserLeadMeetingCRUD/', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

/**
 * Delete a lead meeting (appointment)
 */
export async function deleteUserLeadMeeting(id: number | string): Promise<any> {
    return fetchFromApi(`/user/UserLeadMeetingCRUD/?id=${id}`, {
        method: 'DELETE',
    });
}


/**
 * Fetch lead meetings (appointments)
 */
export async function fetchUserLeadMeetings(payload: { Lead_Id?: number; Deal_Id?: number; Account_Id?: number; period: [string, string] }): Promise<any> {
    return fetchFromApi('/user/UserLeadMeetingMyAdditional/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Fetch stage wise leads (Hot, etc.)
 */
export async function fetchLeadStageWiseLeads(payload: { Lead_Stage: string; page?: number }): Promise<any> {
    return fetchFromApi('/user/LeadStageWiseLeads/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * POST request for EmailContent (AI Assistant)
 * Endpoint: /user/EmailContent/
 * Payload: { input_message: string }
 */
export async function generateEmailContent(input_message: string): Promise<any> {
    return fetchFromApi('/user/EmailContent/', {
        method: 'POST',
        body: JSON.stringify({ input_message }),
    });
}

/**
 * Download Lead Upload Excel Template
 * Endpoint: /user/download_excel_template_uploadLead/
 */
export async function downloadLeadExcelTemplate(): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const tenant = getTenantName();
    const url = `${BASE_URL}/${tenant}/user/download_excel_template_uploadLead/`;

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        method: 'GET',
        headers,
    });

    if (!res.ok) {
        throw new Error(`Failed to download template: ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'Lead_Upload_Template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
}


