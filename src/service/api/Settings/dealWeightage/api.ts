import { fetchFromApi } from '@/service/apiClient';

export interface DealWeightSetup {
  id?: number;
  Weight: string;
  Points: number;
  values: string;
  Order_No?: number | null;
  Deal_State_Name?: string | null;
  Weightage_Percentage?: number | null;
  Description?: string | null;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface DealWeightSetupResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DealWeightSetup[];
}

export const fetchDealWeightSetups = async (): Promise<DealWeightSetupResponse> => {
  const response = await fetchFromApi('/useradmin/UserAdminDealWeightSetupAdditional/');
  return response;
};

export const fetchDealWeightSetupById = async (id: number): Promise<DealWeightSetup> => {
  const response = await fetchDealWeightSetups();
  const item = response.results.find(p => p.id === id);
  if (!item) throw new Error('Deal Weight Setup not found');
  return item;
};

export const saveDealWeightSetup = async (payload: DealWeightSetup): Promise<DealWeightSetup> => {
  const isUpdate = !!payload.id;
  const response = await fetchFromApi('/useradmin/UserAdminDealWeightSetupCRUD/', {
    method: isUpdate ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
  return response;
};

export const deleteDealWeightSetup = async (id: number): Promise<void> => {
  await fetchFromApi(`/useradmin/UserAdminDealWeightSetupCRUD/?id=${id}`, {
    method: 'DELETE',
  });
};
