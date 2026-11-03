import { fetchFromApi } from '@/service/apiClient';

export interface DealProbability {
  id?: number;
  Stage_Name: string;
  Probability: string;
  Forecast_Type: string;
  Description?: string | null;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number;
  Created_By_id?: number;
  Updated_By_id?: number;
}

export interface DealProbabilityResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DealProbability[];
}

export const fetchDealProbabilities = async (): Promise<DealProbabilityResponse> => {
  const response = await fetchFromApi('/useradmin/UserAdminDealProbabilityAdditional/');
  return response;
};

export const fetchDealProbabilityById = async (id: number): Promise<DealProbability> => {
  // We can fetch from the additional list and filter, or if there is a specific GET for one, use it.
  // The provided endpoints only showed the list API, so we'll fetch the list and find the one.
  const response = await fetchDealProbabilities();
  const item = response.results.find(p => p.id === id);
  if (!item) throw new Error('Deal Probability not found');
  return item;
};

export const saveDealProbability = async (payload: DealProbability): Promise<DealProbability> => {
  const isUpdate = !!payload.id;
  const response = await fetchFromApi('/useradmin/UserAdminDealProbabilityCRUD/', {
    method: isUpdate ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
  return response;
};

export const deleteDealProbability = async (id: number): Promise<void> => {
  await fetchFromApi(`/useradmin/UserAdminDealProbabilityCRUD/?id=${id}`, {
    method: 'DELETE',
  });
};
