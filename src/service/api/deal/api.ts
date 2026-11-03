import { fetchFromApi } from '@/service/apiClient';
import { Deal } from '@/store/useDealStore';


export interface OrganizationInfo {
    id: number;
    Organization_Id: string;
    Organization_Name: string;
    Organization_Logo: string;
    Organization_Mail: string;
    DateFormat: string;
    Currencies: string;
}

export interface LeadInfo {
    id: number;
    LeadId: string;
    LeadFirstName: string;
    LeadLastName: string;
    LeadType: string;
    CompanyName: string;
    PhoneNo: string;
    EmailId: string;
    Lead_Status: string;
    Lead_Owner: string;
}

export interface UserInfo {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    Designation: string;
    User_Photo: string;
}

export interface ApiDeal {
    id: number;
    Deal_Id: string;
    Deal_Code: string;
    Deal_Name: string;
    Deal_Type: string;
    Account_Name: string | null;
    Lead_Name: string | null;
    Contact_Person: string | null;
    Phoene: string | null;
    Amount: number;
    Deal_Owner: string;
    DealScore: number;
    ApproxDealAmount: number;
    ActualDealAmount: number;
    MinimumTurnOver: number;
    Current_Status: string | null;
    Deal_Stage: string;
    Lost_Reason: string | null;
    Lead_Source: string;
    Deal_Probablity: string;
    Probability_Id: number;
    Next_Step: string | null;
    Deal_Note: string;
    ExpClosing_Date: string;
    Recommaned_Action: string | null;
    Prediction: string | null;
    Active_Flag: boolean;
    Is_Deleted: boolean;
    Won_Deal_Date: string;
    Created_Date: string;
    Updated_Date: string;
    Pipeline_Name: string | null;
    Campaign_Name: string | null;
    Organization_Id: OrganizationInfo | number | null;
    Account_Id: any;
    Lead_Id: LeadInfo | null;
    Created_By: UserInfo | null;
    Updated_By: UserInfo | null;
    Deal_Competitor?: any;
    Deal_Json?: any;
    Contact_Id?: any;
    UserLeadfromCampaign_Id?: any;
    SocialMediaCampaign_Id?: any;
}

export interface DealApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: ApiDeal[];
}

/**
 * Fetches paginated deal list from /user/DealAdditional/
 */
export async function fetchDeals(page: number = 1, searchQuery: string = '', token?: string): Promise<DealApiResponse> {
    let endpoint = `/user/DealAdditional/?page=${page}`;
    if (searchQuery) {
        endpoint += `&search=${encodeURIComponent(searchQuery)}`;
    }
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi(endpoint, {
        method: 'GET',
        headers,
    });
}

export interface DealStageCounts {
    Qualification?: number;
    Proposal?: number;
    Negotiation?: number;
    "Closed Won"?: number;
    "Closed Lost"?: number;
    [key: string]: number | undefined;
}

export interface DealKPIs {
    Total_Deals: number;
    Total_Pipeline_Value: number;
    Deal_Stage_Counts?: DealStageCounts;
    Won_Deals?: number;
    Lost_Deals?: number;
}

export interface DealKPIsResponse {
    status: boolean;
    data: DealKPIs;
}

/**
 * Fetches deal screen KPIs from /user/DealScreenKPIs/
 */
export async function fetchDealScreenKPIs(token?: string): Promise<DealKPIsResponse> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/DealScreenKPIs/', {
        method: 'GET',
        headers,
    });
}

/**
 * Fetches paginated list of current user's deals from /user/DealMyAdditional/
 */
export async function fetchMyDeals(page: number = 1, userId: number = 71, searchQuery: string = '', token?: string): Promise<DealApiResponse> {
    let endpoint = `/user/DealMyAdditional/?Created_By=${userId}&page=${page}`;
    if (searchQuery) {
        endpoint += `&search=${encodeURIComponent(searchQuery)}`;
    }
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi(endpoint, {
        method: 'GET',
        headers,
    });
}

/**
 * Fetches deals by stage using DealPipeLineFilter
 */
export async function fetchDealsByPipelineStage(stage: string, token?: string): Promise<any> {
    const endpoint = `/user/DealPipeLineFilter/?Deal_Stage=${encodeURIComponent(stage)}`;
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi(endpoint, {
        method: 'GET',
        headers,
    });
}

/**
 * Creates a new deal on the backend API via POST
 */
export async function createDeal(dealData: any, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/DealCRUD/', {
        method: 'POST',
        headers,
        body: JSON.stringify(dealData),
    });
}

/**
 * Updates an existing deal on the backend API via PUT
 */
export async function updateDealApi(dealId: string | number, dealData: any, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let finalData = { ...dealData };

    // Fetch the existing deal to perform a complete field merge (satisfying all required serializer fields)
    try {
        const existing = await fetchDealById(dealId, token);
        if (existing) {
            const existingPayload = {
                Deal_Id: existing.Deal_Id,
                Deal_Code: existing.Deal_Code || "",
                Deal_Name: existing.Deal_Name,
                Deal_Type: existing.Deal_Type,
                Account_Name: existing.Account_Name,
                Lead_Name: existing.Lead_Name,
                Contact_Person: existing.Contact_Person,
                Phoene: existing.Phoene,
                Amount: existing.Amount,
                Deal_Owner: existing.Deal_Owner,
                DealScore: existing.DealScore || 0.0,
                ApproxDealAmount: existing.ApproxDealAmount || 0.0,
                ActualDealAmount: existing.ActualDealAmount || 0.0,
                MinimumTurnOver: existing.MinimumTurnOver || 0.0,
                Current_Status: existing.Current_Status,
                Deal_Stage: existing.Deal_Stage,
                Lost_Reason: existing.Lost_Reason,
                Lead_Source: existing.Lead_Source,
                Deal_Competitor: existing.Deal_Competitor || {},
                Deal_Probablity: existing.Deal_Probablity,
                Probability_Id: existing.Probability_Id || 0,
                Next_Step: existing.Next_Step,
                Deal_Note: existing.Deal_Note,
                ExpClosing_Date: existing.ExpClosing_Date,
                Recommaned_Action: existing.Recommaned_Action,
                Prediction: existing.Prediction,
                Active_Flag: existing.Active_Flag !== undefined ? existing.Active_Flag : true,
                Is_Deleted: existing.Is_Deleted || false,
                Deal_Json: existing.Deal_Json || {},
                Won_Deal_Date: existing.Won_Deal_Date,
                Created_Date: existing.Created_Date,
                Updated_Date: new Date().toISOString().split('T')[0],
                Pipeline_Name: existing.Pipeline_Name,
                Campaign_Name: existing.Campaign_Name,
                Organization_Id: existing.Organization_Id ? (typeof existing.Organization_Id === 'object' ? (existing.Organization_Id as any).id : existing.Organization_Id) : 1,
                Account_Id: existing.Account_Id,
                Lead_Id: existing.Lead_Id ? (typeof existing.Lead_Id === 'object' ? (existing.Lead_Id as any).id : existing.Lead_Id) : null,
                Created_By: existing.Created_By ? (typeof existing.Created_By === 'object' ? (existing.Created_By as any).id : existing.Created_By) : 71,
                Updated_By: existing.Updated_By ? (typeof existing.Updated_By === 'object' ? (existing.Updated_By as any).id : existing.Updated_By) : 71,
                Contact_Id: existing.Contact_Id,
                UserLeadfromCampaign_Id: existing.UserLeadfromCampaign_Id,
                SocialMediaCampaign_Id: existing.SocialMediaCampaign_Id
            };

            finalData = {
                ...existingPayload,
                ...dealData
            };
        }
    } catch (e) {
        console.warn('Failed to fetch existing deal for full payload merge:', e);
    }

    const parsedId = typeof dealId === 'string' ? parseInt(dealId, 10) : dealId;
    const bodyData = {
        id: isNaN(parsedId as number) ? dealId : parsedId,
        ...finalData
    };

    // Try different PATCH and PUT URL formats in sequence to support the backend's routing:
    // 1. PATCH to Base URL (/user/DealCRUD/)
    // 2. PATCH to Query Param URL (/user/DealCRUD/?id={id})
    // 3. PUT to Base URL (/user/DealCRUD/)
    // 4. PUT to Query Param URL (/user/DealCRUD/?id={id})
    try {
        return await fetchFromApi(`/user/DealCRUD/`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(bodyData),
        });
    } catch (error) {
        console.warn(`PATCH to base /user/DealCRUD/ failed, trying query parameter PATCH:`, error);
        try {
            return await fetchFromApi(`/user/DealCRUD/?id=${dealId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(bodyData),
            });
        } catch (error2) {
            console.warn(`PATCH to query parameter failed, trying PUT:`, error2);
            try {
                return await fetchFromApi(`/user/DealCRUD/`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(bodyData),
                });
            } catch (error3) {
                console.warn(`PUT to base URL failed, trying query parameter PUT:`, error3);
                return await fetchFromApi(`/user/DealCRUD/?id=${dealId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(bodyData),
                });
            }
        }
    }
}

/**
 * Deletes a deal on the backend API via DELETE with query param id
 */
export async function deleteDealApi(dealId: string | number, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi(`/user/DealCRUD/?id=${dealId}`, {
        method: 'DELETE',
        headers,
    });
}

/**
 * Fetches a single deal by ID from /user/DealCRUD/${dealId}/ with query param fallback
 */
export async function fetchDealById(dealId: string | number, token?: string): Promise<ApiDeal> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchFromApi(`/user/DealCRUD/?id=${dealId}`, {
        method: 'GET',
        headers,
    });
    if (Array.isArray(res)) {
        if (res.length > 0) return res[0];
    } else if (res && typeof res === 'object') {
        if (Array.isArray(res.results) && res.results.length > 0) {
            return res.results[0];
        }
        return res;
    }
    throw new Error(`Deal not found with ID ${dealId}`);
}

export const mapStage = (dealStage: string | null, dealType: string | null): Deal['stage'] => {
    const type = dealType?.toLowerCase();
    if (type === 'won') return 'Closed Won';
    if (type === 'lost') return 'Closed Lost';

    const stage = (dealStage || '').toLowerCase();
    if (stage.includes('enquiry') || stage.includes('qualifying') || stage.includes('qualification')) return 'Qualification';
    if (stage.includes('demo') || stage.includes('proposal') || stage.includes('presentation')) return 'Proposal';
    if (stage.includes('negotiation')) return 'Negotiation';
    if (stage.includes('won')) return 'Closed Won';
    if (stage.includes('lost')) return 'Closed Lost';
    return 'Qualification';
};

export const mapApiDealToUiDeal = (apiDeal: ApiDeal): Deal => {
    const company = apiDeal.Lead_Id?.CompanyName || apiDeal.Account_Name || 'N/A';
    const companyInitials = company.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) || 'CO';

    const companyBgColors = [
        'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400',
        'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400',
        'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/20 dark:text-green-400',
        'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:text-sky-400',
        'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400'
    ];
    const companyBgColor = companyBgColors[apiDeal.id % companyBgColors.length];

    let contactName = 'N/A';
    if (apiDeal.Contact_Person) {
        contactName = apiDeal.Contact_Person;
    } else if (apiDeal.Lead_Id) {
        contactName = `${apiDeal.Lead_Id.LeadFirstName || ''} ${apiDeal.Lead_Id.LeadLastName || ''}`.trim() || 'N/A';
    }
    const contactInitials = contactName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) || 'CT';
    const contactBgColor = 'bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400';

    const owner = apiDeal.Deal_Owner || 'N/A';
    const ownerInitials = owner.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) || 'OW';
    const ownerAvatarColor = 'bg-emerald-500 text-white';

    const expectedClose = apiDeal.ExpClosing_Date ? apiDeal.ExpClosing_Date.split('T')[0] : new Date().toISOString().split('T')[0];
    const probability = parseInt(apiDeal.Deal_Probablity) || 0;

    return {
        id: apiDeal.id.toString(),
        name: apiDeal.Deal_Name || 'Unnamed Deal',
        stage: mapStage(apiDeal.Deal_Stage, apiDeal.Deal_Type),
        company,
        companyInitials,
        companyBgColor,
        contactName,
        contactEmail: apiDeal.Lead_Id?.EmailId || apiDeal.Contact_Id?.Email_Id || apiDeal.Contact_Id?.EmailId || 'N/A',
        contactPhone: apiDeal.Phoene || apiDeal.Lead_Id?.PhoneNo || 'N/A',
        contactRole: apiDeal.Lead_Id?.LeadType || 'Representative',
        contactInitials,
        contactBgColor,
        dealValue: apiDeal.Amount || 0,
        expectedClose,
        probability,
        owner,
        ownerInitials,
        ownerAvatarColor,
        createdOn: apiDeal.Created_Date ? apiDeal.Created_Date.split('T')[0] : '',
        lastUpdated: apiDeal.Updated_Date ? apiDeal.Updated_Date.split('T')[0] : '',
        currency: 'INR',
        currencySymbol: '₹',
        summary: apiDeal.Deal_Note || '',
        source: apiDeal.Lead_Source || 'N/A',
        internalNotes: '',
        Deal_Json: apiDeal.Deal_Json || {},
        Lead_Id: apiDeal.Lead_Id,
        Contact_Id: apiDeal.Contact_Id
    };
};

export interface ApiDealNote {
    id: number;
    DealNotes_Id?: string;
    Subject: string;
    Notes: string;
    Active_Flag: boolean;
    Is_Deleted: boolean;
    Created_Date?: string;
    Updated_Date?: string;
    Organization_Id: number;
    Deal_Id: number;
    Created_By?: number;
    Updated_By?: number;
}

/**
 * Fetches deal notes for a specific deal ID
 */
export async function fetchDealNotes(dealId: string | number, token?: string): Promise<ApiDealNote[]> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchFromApi(`/user/DealNotesMyAdditional/?Is_Deleted=False&Deal_Id=${dealId}`, {
        method: 'GET',
        headers,
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
 * Creates a new deal note via POST
 */
export async function createDealNote(noteData: Partial<ApiDealNote>, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/DealNotesCRUD/', {
        method: 'POST',
        headers,
        body: JSON.stringify(noteData),
    });
}

/**
 * Updates an existing deal note via PUT
 */
export async function updateDealNote(noteData: Partial<ApiDealNote>, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/DealNotesCRUD/', {
        method: 'PUT',
        headers,
        body: JSON.stringify(noteData),
    });
}

/**
 * Deletes a deal note via DELETE with query param id
 */
export async function deleteDealNote(noteId: string | number, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi(`/user/DealNotesCRUD/?id=${noteId}`, {
        method: 'DELETE',
        headers,
    });
}

export interface ApiDealTask {
    id: number;
    Task_Id?: string;
    Task_Resource?: string | null;
    Task_Related?: string | null;
    TaskName: string;
    Task_Desc: string;
    Start_Date: string;
    Due_Date: string;
    Priority: string;
    Completion: string;
    Assigned_person?: string | null;
    Status: string;
    Is_Deleted: boolean;
    Created_Date?: string;
    Updated_Date?: string;
    Organization_Id: any;
    Deal_Id: any;
    Project?: any;
    Assigned_To?: any;
    UserReminder?: any;
    Created_By?: any;
    Updated_By?: any;
}

/**
 * Fetches tasks for a specific deal ID
 */
export async function fetchDealTasks(dealId: string | number, token?: string): Promise<ApiDealTask[]> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchFromApi(`/user/NewTaskManagemntdealList/?Deal_Id=${dealId}`, {
        method: 'GET',
        headers,
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
 * Creates a new deal task via POST
 */
export async function createDealTask(taskData: Partial<ApiDealTask>, token?: string): Promise<ApiDealTask> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/NewTaskManagemntCRUD/', {
        method: 'POST',
        headers,
        body: JSON.stringify(taskData),
    });
}

/**
 * Updates an existing deal task via PUT
 */
export async function updateDealTask(taskData: Partial<ApiDealTask>, token?: string): Promise<ApiDealTask> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/NewTaskManagemntCRUD/', {
        method: 'PUT',
        headers,
        body: JSON.stringify(taskData),
    });
}

/**
 * Deletes a deal task via DELETE with query param id
 */
export async function deleteDealTask(taskId: string | number, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi(`/user/NewTaskManagemntCRUD/?id=${taskId}`, {
        method: 'DELETE',
        headers,
    });
}

export interface ApiDealActivity {
    id: number;
    DealActivities_Id?: string;
    Task: string;
    Task_Description: string;
    Expected_Date: string;
    Expected_Time: string;
    Activity_Type: string;
    Active_Flag: boolean;
    Is_Deleted: boolean;
    Default_Date?: string;
    Created_Date?: string;
    Updated_Date?: string;
    Organization_Id: any;
    Deal_Id: any;
    Reminder_Id?: any;
    Created_By?: any;
    Updated_By?: any;
    Reminder_Payload?: any;
}

/**
 * Fetches activities for a specific deal ID
 */
export async function fetchDealActivities(dealId: string | number, token?: string): Promise<ApiDealActivity[]> {
    const headers: Record<string, string> = {
        'X-No-Auth': 'true'
    };
    const res = await fetchFromApi(`/user/DealActivitiesMyAdditional/?Deal_Id=${dealId}`, {
        method: 'POST',
        headers,
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
 * Creates a new deal activity via POST
 */
export async function createDealActivity(activityData: Partial<ApiDealActivity>, token?: string): Promise<ApiDealActivity> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/DealActivitiesCRUD/', {
        method: 'POST',
        headers,
        body: JSON.stringify(activityData),
    });
}

/**
 * Updates an existing deal activity via PUT
 */
export async function updateDealActivity(activityData: Partial<ApiDealActivity>, token?: string): Promise<ApiDealActivity> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/DealActivitiesCRUD/', {
        method: 'PUT',
        headers,
        body: JSON.stringify(activityData),
    });
}

/**
 * Deletes a deal activity via DELETE with query param id
 */
export async function deleteDealActivity(activityId: string | number, token?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi(`/user/DealActivitiesCRUD/?id=${activityId}`, {
        method: 'DELETE',
        headers,
    });
}

// ==========================================
// Deal Source KPI & Analytics
// ==========================================

export interface DealSourceKPI {
    total_deals_generated: number;
    won_deals: number;
    total_deal_value: number;
    win_rate: number;
}

export interface DealSourceKPIResponse {
    status: boolean;
    message: string;
    data: DealSourceKPI;
}

export interface DealSourcePieChartItem {
    source: string;
    deals: number;
    percentage: number;
}

export interface DealSourceTrendItem {
    label: string;
    [key: string]: any;
}

export interface DealSourceDetailedItem {
    source: string;
    deals_created: number;
    won_deals: number;
    lost_deals: number;
    win_rate: number;
    total_deal_value: number;
    avg_deal_value: number;
}

export interface DealSourceAnalyticsData {
    pie_chart: DealSourcePieChartItem[];
    trend: DealSourceTrendItem[];
    detailed: DealSourceDetailedItem[];
}

export interface DealSourceAnalyticsResponse {
    status: boolean;
    message: string;
    data: DealSourceAnalyticsData;
}

/**
 * Fetches Deal Source KPIs from /user/DealSourceKPIAPI/
 */
export async function fetchDealSourceKPI(
    startDate: string = '2026-01-01',
    endDate: string = '2026-06-11',
    token?: string
): Promise<DealSourceKPIResponse> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/DealSourceKPIAPI/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
        }),
    });
}

/**
 * Fetches Deal Source Analytics charts and detailed table data from /user/DealSourceAnalyticsAPI/
 */
export async function fetchDealSourceAnalytics(
    startDate: string = '2026-01-01',
    endDate: string = '2026-06-11',
    period: [string, string] = ['2025-06-08', '2026-06-15'],
    token?: string
): Promise<DealSourceAnalyticsResponse> {
    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return fetchFromApi('/user/DealSourceAnalyticsAPI/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
            period: period,
        }),
    });
}

/**
 * Fetch deal meetings (appointments)
 */
export async function fetchUserDealMeetings(dealId: number | string): Promise<any> {
    return fetchFromApi(`/user/DealMeetingMyAdditional/?Is_Deleted=False&Deal_Id=${dealId}`, {
        method: 'GET',
    });
}

/**
 * Create a new deal meeting (appointment)
 */
export async function createDealMeeting(payload: any): Promise<any> {
    return fetchFromApi('/user/DealMeetingCRUD/', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

/**
 * Update a deal meeting (appointment)
 */
export async function updateDealMeeting(payload: any): Promise<any> {
    return fetchFromApi('/user/DealMeetingCRUD/', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
}

/**
 * Delete a deal meeting (appointment)
 */
export async function deleteDealMeeting(id: number | string): Promise<any> {
    return fetchFromApi(`/user/DealMeetingCRUD/?id=${id}`, {
        method: 'DELETE',
    });
}







