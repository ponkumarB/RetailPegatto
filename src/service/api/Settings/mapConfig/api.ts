import { fetchFromApi } from '@/service/apiClient';

export interface MapConfigPayload {
  id?: number;
  API_Key: string;
  MailId: string;
  MailPassword?: string;
  User_Id?: number;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
}

export const fetchMapConfig = async (userId: number = 1) => {
  try {
    const response = await fetchFromApi(`/user/MapConfigurationCRUD/?User_Id=${userId}`);
    return response;
  } catch (error: any) {
    if (!error?.message?.includes('matching query does not exist')) {
      console.error('Error fetching Map config:', error);
    }
    throw error;
  }
};

export const saveMapConfig = async (payload: MapConfigPayload) => {
  try {
    const isUpdate = !!payload.id;
    const response = await fetchFromApi(`/user/MapConfigurationCRUD/`, {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    console.error('Error saving Map config:', error);
    throw error;
  }
};

export const deleteMapConfig = async (id: number) => {
  try {
    const response = await fetchFromApi(`/user/MapConfigurationCRUD/?id=${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting Map config:', error);
    throw error;
  }
};
