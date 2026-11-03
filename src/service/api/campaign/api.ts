import { fetchFromApi } from '@/service/apiClient';

// ==========================================
// 1. Interfaces & Types
// ==========================================

export interface CampaignKPIs {
  total_campaigns: number;
  total_budget: number;
  total_leads_generated: number;
  average_roi: number;
}

export interface CampaignKPIDashboardResponse {
  status: boolean;
  message: string;
  data: CampaignKPIs;
}

export interface CampaignModel {
  id: number;
  Promo_Id?: string | null;
  Promo_Code?: string | null;
  Promo_Name?: string | null;
  Promo_Date?: string | null;
  Promo_Content?: string | null;
  Campaign_Type?: string | null;
  Campaign_Channel?: string | null;
  Campaign_Status?: string | null;
  Campaign_Description?: string | null;
  Start_Date?: string | null;
  End_Date?: string | null;
  Budget?: number | null;
  Spend_Amount?: number | null;
  Estimated_Leads?: number | null;
  Actual_Leads?: number | null;
  Estimated_ROI?: number | null;
  Actual_ROI?: number | null;
  Campaign_Owner?: string | null;
  Target_Audience?: string | null;
  Target_Count?: number | null;
  Response_Count?: number | null;
  Conversion_Count?: number | null;
  Campaign_Source?: string | null;
  Campaign_Json?: Record<string, any> | null;
  Active_Flag?: boolean | null;
  Is_Deleted?: boolean | null;
  File?: string | null;
  Days_to_Run?: string | null;
  SocialMedia_Type?: string[] | null;
  Is_Stoped?: boolean | null;
  Posting_Date?: string | null;
  Generated_Id?: any | null;
  Created_Date?: string | null;
  Updated_Date?: string | null;
  Organization_Id?: number | null;
  Campaign_Owner_Id?: number | null;
  Created_By?: number | null;
  Updated_By?: number | null;
  FileName?: string | null;
  UserId?: number | null;
  sub?: string | null;
  name?: string | null;
}

export interface PaginatedCampaignResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CampaignModel[];
}

// ==========================================
// 2. Campaign API Functions
// ==========================================

/**
 * Fetches campaign dashboard KPI stats from /user/CampaignDashboardKPI/
 */
export async function fetchCampaignDashboardKPI(token?: string): Promise<CampaignKPIDashboardResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi('/user/CampaignDashboardKPI/', {
    method: 'GET',
    headers,
  });
}

/**
 * Fetches all campaigns list from /user/SocialMediaPromotionallAdditional/
 */
export async function fetchCampaignsList(page: number = 1, token?: string): Promise<PaginatedCampaignResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi(`/user/SocialMediaPromotionallAdditional/?page=${page}`, {
    method: 'GET',
    headers,
  });
}

/**
 * Fetches current user's campaigns from /user/SocialMediaPromotionAdditional/
 */
export async function fetchMyCampaigns(page: number = 1, userId: number, token?: string): Promise<PaginatedCampaignResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi(`/user/SocialMediaPromotionAdditional/?Created_By=${userId}&page=${page}`, {
    method: 'GET',
    headers,
  });
}

/**
 * Creates a new campaign
 */
export async function createCampaign(payload: Omit<CampaignModel, 'id'>, token?: string): Promise<CampaignModel> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi('/user/SocialMediaCampaignCRUD/', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Updates an existing campaign
 */
export async function updateCampaign(payload: Partial<CampaignModel> & { id: number }, token?: string): Promise<CampaignModel> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi('/user/SocialMediaCampaignCRUD/', {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * Deletes a campaign by ID
 */
export async function deleteCampaign(id: number, token?: string): Promise<any> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi(`/user/SocialMediaCampaignCRUD/?id=${id}`, {
    method: 'DELETE',
    headers,
  });
}

/**
 * Fetches a single campaign detail by ID
 */
export async function fetchCampaignDetails(id: number | string, token?: string): Promise<CampaignModel> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetchFromApi(`/user/SocialMediaCampaignCRUD/?id=${id}`, {
    method: 'GET',
    headers,
  });
}
