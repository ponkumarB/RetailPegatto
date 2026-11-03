import { fetchFromApi } from '@/service/apiClient';

export interface LeadConversionTrackingParams {
  owner_id: number;
  start_date: string;
  end_date: string;
  page?: number;
}

export interface LeadConversionCard {
  Metric: string;
  Count: number;
}

export interface LeadConversionCardsResponse {
  status: boolean;
  message: string;
  data: LeadConversionCard[];
}

export interface LeadConversionListRecord {
  Lead_Id: string;
  Lead_Name: string;
  Company: string;
  City: string;
  Lead_Source: string;
  Owner: string;
  Current_Stage: string;
  Days_In_Stage: string;
  Last_Activity: string;
}

export interface LeadConversionListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LeadConversionListRecord[];
}

export const fetchLeadConversionCards = async (
  params: LeadConversionTrackingParams
): Promise<LeadConversionCardsResponse> => {
  return fetchFromApi('/user/LeadConversionTrackingCards/', {
    method: 'POST',
    body: JSON.stringify({
      owner_id: params.owner_id,
      start_date: params.start_date,
      end_date: params.end_date,
    }),
  });
};

export const fetchLeadConversionList = async (
  params: LeadConversionTrackingParams
): Promise<LeadConversionListResponse> => {
  const payload: any = {
    owner_id: params.owner_id,
    start_date: params.start_date,
    end_date: params.end_date,
  };
  if (params.page !== undefined) {
    payload.page = params.page;
  }
  
  return fetchFromApi('/user/LeadConversionTrackingList/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
