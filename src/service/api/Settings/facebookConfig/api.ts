import { fetchFromApi } from '@/service/apiClient';

export interface FacebookConfigPayload {
  id?: number;
  App_Id: string;
  Secret_Id: string;
  Access_Token: string;
  Page_No: string;
  Organization_Id?: number;
  UserId?: number;
  Created_By?: number;
  Updated_By?: number;
}

export const fetchFacebookConfig = async (organizationId: number = 1) => {
  try {
    const response = await fetchFromApi(`/user/FacebookConfigurationCRUD/?Organization_Id=${organizationId}`);
    return response;
  } catch (error: any) {
    if (!error?.message?.includes('matching query does not exist')) {
      console.error('Error fetching Facebook config:', error);
    }
    throw error;
  }
};

export const saveFacebookConfig = async (payload: FacebookConfigPayload) => {
  try {
    const isUpdate = !!payload.id;
    const response = await fetchFromApi(`/user/FacebookConfigurationCRUD/`, {
      method: isUpdate ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  } catch (error) {
    console.error('Error saving Facebook config:', error);
    throw error;
  }
};

export const deleteFacebookConfig = async (id: number) => {
  try {
    const response = await fetchFromApi(`/user/FacebookConfigurationCRUD/?id=${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting Facebook config:', error);
    throw error;
  }
};
