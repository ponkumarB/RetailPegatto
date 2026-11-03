// In api/SoftwareEstimation/api.ts
import { fetchFromApi } from '@/service/apiClient';

export interface SoftwareEstimationPayload {
  // Project Information
  id?: number | string;
  Project_Id?: number | string;
  project_name?: string;
  technology_type?: string;
  hours_per_fp?: number;
  cost_per_hour?: number;
  currency?: string;
  contingency_percentage?: number;
  team_size?: number;
  working_days_per_month?: number;
  Notes?: string;

  // Function point counts
  ei_low?: number;
  ei_medium?: number;
  ei_high?: number;
  eo_low?: number;
  eo_medium?: number;
  eo_high?: number;
  eq_low?: number;
  eq_medium?: number;
  eq_high?: number;
  ilf_low?: number;
  ilf_medium?: number;
  ilf_high?: number;
  eif_low?: number;
  eif_medium?: number;
  eif_high?: number;

  // GSC ratings
  gsc_data_communications?: number;
  gsc_distributed_processing?: number;
  gsc_performance?: number;
  gsc_heavily_used_configuration?: number;
  gsc_transaction_rate?: number;
  gsc_online_data_entry?: number;
  gsc_end_user_efficiency?: number;
  gsc_online_update?: number;
  gsc_complex_processing?: number;
  gsc_reusability?: number;
  gsc_installation_ease?: number;
  gsc_operational_ease?: number;
  gsc_multiple_sites?: number;
  gsc_facilitate_change?: number;

  // Calculated fields
  ufp?: number;
  tdi?: number;
  vaf?: number;
  afp?: number;
  roundedAFP?: number;
  effort_hours?: number;
  base_cost?: number;
  contingency_amount?: number;
  total_estimated_cost?: number;
  duration_months?: number;

  // New integration fields
  Project_Version?: string | null;
  Estimated_By?: number | string | null;
  Estimated_StartDate?: string | null;
  Estimated_EndDate?: string | null;
  Organization_Id?: number | null;
  Domain?: string | null;
  Development_Approach?: string | null;
  Technology_Stack?: string[] | null;
  Resources_Used?: string[] | null;
  hours_per_day?: number;
  percentage_development?: number;
  percentage_testing?: number;
  percentage_management?: number;
  percentage_infrastructure?: number;
  Customer_Name?: string | null;
  Customer_Id?: number | string | null;
}

export interface SoftwareEstimationListParams {
  page?: number;
  page_size?: number;
  search?: string;
  projectType?: string;
}

export async function fetchSoftwareEstimations(params?: SoftwareEstimationListParams): Promise<any> {
  const query = new URLSearchParams();
  if (params?.page != null) query.set('page', String(params.page));
  if (params?.page_size != null) query.set('page_size', String(params.page_size));
  if (params?.search) query.set('search', params.search);
  if (params?.projectType) query.set('projectType', params.projectType);

  const queryString = query.toString();
  const path = queryString
    ? `/user/SoftwareEstimationList/?${queryString}`
    : '/user/SoftwareEstimationList/';

  return fetchFromApi(path, {
    method: 'GET',
  });
}

export async function fetchSoftwareEstimationById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/SoftwareEstimationCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch software estimation by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/SoftwareEstimationCRUD/${id}/`, {
      method: 'GET',
    });
  }
}

export async function createSoftwareEstimation(payload: SoftwareEstimationPayload): Promise<any> {
  return fetchFromApi('/user/SoftwareEstimationCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export const updateSoftwareEstimation = async (payload: SoftwareEstimationPayload) => {
  return fetchFromApi(`/user/SoftwareEstimationCRUD/`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};


export async function deleteSoftwareEstimation(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/SoftwareEstimationCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/SoftwareEstimationCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

export async function fetchSoftwareEstimationListWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/SoftwareEstimationListwithoutpagination/', {
    method: 'GET',
  });
}
