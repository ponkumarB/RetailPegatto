import { fetchFromApi } from '@/service/apiClient';

export interface OpportunityAgingDashboardPayload {
  organization_id: number;
  period: string[];
}

export interface AgingTopCard {
  title: string;
  count: number;
  value: number;
}

export interface AgingBucketSummary {
  bucket: string;
  count: number;
  value: number;
  percentage: number;
}

export interface AgingSummary {
  total_opportunities: number;
  total_value: number;
  buckets: AgingBucketSummary[];
}

export interface AgingByStageDistribution {
  "0_30": number;
  "31_60": number;
  "61_90": number;
  "91_180": number;
  "180_plus": number;
}

export interface AgingByStage {
  stage: string;
  value: number;
  distribution: AgingByStageDistribution;
}

export interface AgingByValue {
  bucket: string;
  value: number;
}

export interface OpportunityDetail {
  deal_id: string;
  deal_name: string;
  account: string | null;
  stage: string;
  owner: string;
  amount: number;
  age_days: number;
  aging_bucket: string;
  probability: string;
  expected_close: string;
  status: string | null;
  last_activity: string | null;
}

export interface OpportunityAgingDashboardResponse {
  success: boolean;
  data: {
    top_cards: AgingTopCard[];
    aging_summary: AgingSummary;
    aging_by_stage: AgingByStage[];
    aging_by_value: AgingByValue[];
    opportunity_details: OpportunityDetail[];
  };
}

export const fetchOpportunityAgingDashboard = async (payload: OpportunityAgingDashboardPayload): Promise<OpportunityAgingDashboardResponse> => {
  return fetchFromApi('/user/OpportunityAgingDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};
