import { fetchFromApi } from '@/service/apiClient';

export interface CompetitorPayload {
  id?: number;
  Competitor_Id?: string;
  Competitor_Name?: string | null;
  Website?: string | null;
  Logo?: string | null;
  Category?: string;
  Starting_Price?: string | number;
  Tracking_Status?: string;
  Description?: string | null;
  Is_Deleted?: boolean;
  Organization_Id?: number | null;
}

export const getCompetitorMasterList = async (page: number = 1) => {
  const response = await fetchFromApi(`/user/CompetitorMasterList/?page=${page}`);
  return response;
};

export const getCompetitorMasterById = async (id: number) => {
  const response = await fetchFromApi(`/user/CompetitorMasterCRUD/?id=${id}`);
  return response;
};

export const createCompetitorMaster = async (payload: any) => {
  const response = await fetchFromApi('/user/CompetitorMasterCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response;
};

export const updateCompetitorMaster = async (id: number, payload: any) => {
  const data = { ...payload, id };
  const response = await fetchFromApi('/user/CompetitorMasterCRUD/', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response;
};

export const deleteCompetitorMaster = async (id: number) => {
  const response = await fetchFromApi(`/user/CompetitorMasterCRUD/?id=${id}`, {
    method: 'DELETE',
  });
  return response;
};

export const getCompetitorDashboard = async () => {
  const response = await fetchFromApi('/user/CompetitorDashboard/', {
    method: 'POST',
  });
  return response;
};

export const searchCompetitorMaster = async (search: string) => {
  const response = await fetchFromApi(`/user/CompetitorMasterSearch/?search=${encodeURIComponent(search)}`);
  return response;
};

export const filterCompetitorMaster = async (payload: any) => {
  const response = await fetchFromApi('/user/CompetitorMasterFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response;
};
