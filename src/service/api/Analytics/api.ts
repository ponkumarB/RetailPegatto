import { fetchFromApi } from '@/service/apiClient';

export interface WonLostDashboardAnalyticsPayload {
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

/**
 * POST request for WonLostDashboardAnalytics
 */
export async function fetchWonLostDashboardAnalytics(payload: WonLostDashboardAnalyticsPayload): Promise<any> {
  return fetchFromApi('/user/WonLostDashboardAnalytics/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchNewITProjectAnalyticsDashboard(params?: { start_date?: string, end_date?: string }): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

  return fetchFromApi(`/user/NewITProjectAnalyticsDashboard/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchNewITSalesAnalyticsDashboard = async (queryStr = '') => {
  return fetchFromApi(`/user/NewITSalesAnalyticsDashboard/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchNewITRevenueTrend = async (queryStr = '') => {
  return fetchFromApi(`/user/NewITRevenueTrend/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchNewITSalesPerformanceAnalytics = async (queryStr = '') => {
  return fetchFromApi(`/user/NewITSalesPerformanceAnalytics/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchNewITOpportunityPipeline = async (queryStr = '') => {
  return fetchFromApi(`/user/NewITOpportunityPipeline/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchNewITRevenueBySalesPerson = async (queryStr = '') => {
  return fetchFromApi(`/user/NewITRevenueBySalesPerson/${queryStr}`, {
    method: 'GET',
  });
}

// ------------------------------------------------------------------
// REVENUE FORECAST DASHBOARD
// ------------------------------------------------------------------

export const fetchRevenueForecastKPIView = async (queryStr = '') => {
  return fetchFromApi(`/user/RevenueForecastKPIView/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchForecastByMonthView = async (queryStr = '') => {
  return fetchFromApi(`/user/ForecastByMonthView/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchPipelineByStageWeightedView = async (queryStr = '') => {
  return fetchFromApi(`/user/PipelineByStageWeightedView/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchForecastAccuracyTrendView = async (queryStr = '') => {
  return fetchFromApi(`/user/ForecastAccuracyTrendView/${queryStr}`, {
    method: 'GET',
  });
}

export const fetchForecastSummaryByOwnerView = async (queryStr = '') => {
  return fetchFromApi(`/user/ForecastSummaryByOwnerView/${queryStr}`, {
    method: 'GET',
  });
}

export async function fetchAnalysticSalesByCustomer(payload: {
  Is_Deleted?: boolean;
  fromdate: string;
  todate: string;
  userid: string | number;
}): Promise<any> {
  return fetchFromApi('/user/AnalysticSalesByCustomer/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAnalysticActivityOverview(payload: {
  Is_Deleted?: boolean;
  fromdate: string;
  todate: string;
  userid: string | number;
}): Promise<any> {
  return fetchFromApi('/user/AnalysticActivityOverview/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAnalysticSalesKPIAndChurnDashboard(payload: {
  Is_Deleted?: boolean;
  fromdate: string;
  todate: string;
  userid: string | number;
}): Promise<any> {
  return fetchFromApi('/user/AnalysticSalesKPIAndChurnDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAnalysticMonthlyRetailSales(payload: {
  Is_Deleted?: boolean;
  fromdate: string;
  todate: string;
  userid: string | number;
}): Promise<any> {
  return fetchFromApi('/user/AnalysticMonthlyRetailSales/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchDeliverablesMonthWise(payload: {
  Project_Id: number;
  Start_Date: string;
  End_Date: string;
}): Promise<any> {
  return fetchFromApi('/user/DeliverablesMonthWise/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTaskEstimatedVsActual(payload: {
  Project_Id: number;
  Start_Date: string;
  End_Date: string;
}): Promise<any> {
  return fetchFromApi('/user/TaskEstimatedVsActual/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTaskCompletionTrend(params: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  const queryStr = `project_id=${params.project_id}&start_date=${params.start_date}&end_date=${params.end_date}`;
  return fetchFromApi(`/user/TaskCompletionTrend/?${queryStr}`, {
    method: 'GET',
  });
}

export async function fetchTeamProductivityPatterns(params: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  const queryStr = `project_id=${params.project_id}&start_date=${params.start_date}&end_date=${params.end_date}`;
  return fetchFromApi(`/user/TeamProductivityPatterns/?${queryStr}`, {
    method: 'GET',
  });
}

export async function fetchPredictiveProjectRiskMetrics(params: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  const queryStr = `project_id=${params.project_id}&start_date=${params.start_date}&end_date=${params.end_date}`;
  return fetchFromApi(`/user/PredictiveProjectRisk/?${queryStr}`, {
    method: 'GET',
  });
}

export async function fetchDeveloperWorkloadDistribution(params: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  const queryStr = `project_id=${params.project_id}&start_date=${params.start_date}&end_date=${params.end_date}`;
  return fetchFromApi(`/user/DeveloperWorkloadDistribution/?${queryStr}`, {
    method: 'GET',
  });
}

export async function fetchTeamProductivityTrend(params: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  const queryStr = `project_id=${params.project_id}&start_date=${params.start_date}&end_date=${params.end_date}`;
  return fetchFromApi(`/user/TeamProductivityTrend/?${queryStr}`, {
    method: 'GET',
  });
}

export async function fetchSmartResourceOptimizationMetrics(params: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  const queryStr = `project_id=${params.project_id}&start_date=${params.start_date}&end_date=${params.end_date}`;
  return fetchFromApi(`/user/SmartResourceOptimization/?${queryStr}`, {
    method: 'GET',
  });
}

export async function fetchBudgetCostAnalyticsCards(payload: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  return fetchFromApi('/user/BudgetCostAnalyticsCards/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchInvoiceActivityTrend(payload: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  return fetchFromApi('/user/InvoiceActivityTrend/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMonthlyLabourCostTrend(payload: {
  project_id: number;
  start_date: string;
  end_date: string;
}): Promise<any> {
  return fetchFromApi('/user/MonthlyLabourCostTrend/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAnalysticLeadSource(payload: {
  Is_Deleted?: boolean;
  fromdate: string;
  todate: string;
  userid: string | number;
}): Promise<any> {
  return fetchFromApi('/user/AnalysticLeadSource/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchPipelineKPIs(params: { start_date: string; end_date: string; Organization_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return fetchFromApi(`/user/pipeline_kpis/?${query.toString()}`, { method: 'GET' });
}

export async function fetchPipelineByStage(params: { start_date: string; end_date: string; Organization_Id: string; User_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
    User_Id: params.User_Id,
  });
  return fetchFromApi(`/user/pipeline_by_stage/?${query.toString()}`, { method: 'GET' });
}

export async function fetchPipelineConversionRate(params: { start_date: string; end_date: string; Organization_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return fetchFromApi(`/user/pipeline_conversion_rate/?${query.toString()}`, { method: 'GET' });
}

export async function fetchPipelineTrend(params: { start_date: string; end_date: string; Organization_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return fetchFromApi(`/user/pipeline_trend/?${query.toString()}`, { method: 'GET' });
}

export async function fetchForecastVsActual(params: { start_date: string; end_date: string; Organization_Id: string; User_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
    User_Id: params.User_Id,
  });
  return fetchFromApi(`/user/forecast_vs_actual/?${query.toString()}`, { method: 'GET' });
}

export async function fetchPipelineBySource(params: { start_date: string; end_date: string; Organization_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return fetchFromApi(`/user/pipeline_by_source/?${query.toString()}`, { method: 'GET' });
}

export async function fetchPipelineHealth(params: { start_date: string; end_date: string; Organization_Id: string; User_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
    User_Id: params.User_Id,
  });
  return fetchFromApi(`/user/pipeline_health/?${query.toString()}`, { method: 'GET' });
}

export async function fetchRecentPipelineActivity(params: { start_date: string; end_date: string; Organization_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return fetchFromApi(`/user/recent_pipeline_activity/?${query.toString()}`, { method: 'GET' });
}

export async function fetchTopPipelineOpportunities(params: { start_date: string; end_date: string; Organization_Id: string }): Promise<any> {
  const query = new URLSearchParams({
    Organization_Id: params.Organization_Id,
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return fetchFromApi(`/user/top_pipeline_opportunities/?${query.toString()}`, { method: 'GET' });
}









