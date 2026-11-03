import { fetchFromApi } from '@/service/apiClient';

export interface LinkedinConfigPayload {
  id?: number;
  Client_Id: string;
  Secret_Id: string;
  Access_Token: string;
  Sub?: string | null;
  Refresh_Token?: string | null;
  Expires_At?: string | null;
  UserId?: number;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
}

export const fetchLinkedinConfig = async (userId: number = 1) => {
  try {
    const response = await fetchFromApi(`/user/LinkeidnConfigurationCRUD/?UserId=${userId}`);
    return response;
  } catch (error: any) {
    if (!error?.message?.includes('matching query does not exist')) {
      console.error('Error fetching LinkedIn config:', error);
    }
    throw error;
  }
};

export const saveLinkedinConfig = async (payload: LinkedinConfigPayload) => {
  try {
    const isUpdate = !!payload.id;
    const response = await fetchFromApi(`/user/LinkeidnConfigurationCRUD/`, {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    console.error('Error saving LinkedIn config:', error);
    throw error;
  }
};

export const deleteLinkedinConfig = async (id: number) => {
  try {
    const response = await fetchFromApi(`/user/LinkeidnConfigurationCRUD/?id=${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting LinkedIn config:', error);
    throw error;
  }
};
