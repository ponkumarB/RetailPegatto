import { fetchFromApi } from '@/service/apiClient';

export interface CustomerChurnParams {
  start_date: string;
  end_date: string;
}

export interface ChurnSummaryCards {
  total_customers: number;
  at_risk_customers: number;
  churned_customers: number;
  churn_rate: number;
  revenue_at_risk: number;
}

export interface ChurnRateTrend {
  Month: string;
  ChurnRate: number;
  TotalCustomers: number;
  ChurnedCustomers: number;
}

export interface RiskDistribution {
  name: string;
  count: number;
}

export interface ChurnReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface CustomerAtRisk {
  customer_retention_id: string;
  account_id: number;
  customer_name: string;
  segment: string;
  risk_score: number;
  revenue_at_risk: number;
  last_activity: string;
  reason: string;
  recommended_action: string;
  notes: string;
}

export interface ChurnPrediction {
  predicted_churn_percentage: number;
  customers_at_risk: number;
  revenue_at_risk: number;
}

export interface RecommendedAction {
  action: string;
  customers: number;
}

export interface CustomerChurnDashboardData {
  summary_cards: ChurnSummaryCards;
  churn_rate_trend: ChurnRateTrend[];
  risk_distribution: RiskDistribution[];
  churn_reasons: ChurnReason[];
  customers_at_risk: CustomerAtRisk[];
  prediction: ChurnPrediction;
  recommended_actions: RecommendedAction[];
}

export interface CustomerChurnDashboardResponse {
  status: boolean;
  message: string;
  data: CustomerChurnDashboardData;
}

export const fetchCustomerChurnDashboard = async (
  params: CustomerChurnParams
): Promise<CustomerChurnDashboardResponse> => {
  return fetchFromApi('/user/CustomerChurnDashboard/', {
    method: 'POST',
    body: JSON.stringify({
      start_date: params.start_date,
      end_date: params.end_date,
    }),
  });
};
