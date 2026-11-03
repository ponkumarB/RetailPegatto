import { fetchFromApi } from '@/service/apiClient';

export interface NotificationTemplateVariable {
  Variable_Name: string;
  Description: string;
}

export interface NotificationTemplatePayload {
  id?: number;
  Organization_Id?: number;
  NotificationTemplate_Id?: string;
  Template_Name?: string;
  Notification_Type?: string;
  Module?: string;
  Subject?: string;
  Message?: string;
  Variables?: NotificationTemplateVariable[];
  Channels?: string[];
  Language?: string;
  Priority?: string;
  Status?: string;
  Is_Draft?: boolean;
  Is_Deleted?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

export const getNotificationTemplateList = async () => {
  const response = await fetchFromApi('/user/NotificationTemplateList/');
  return response;
};

export const getNotificationTemplateById = async (id: number) => {
  const response = await fetchFromApi(`/user/NotificationTemplateCRUD/?id=${id}`);
  return response;
};

export const createNotificationTemplate = async (payload: NotificationTemplatePayload) => {
  const response = await fetchFromApi('/user/NotificationTemplateCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response;
};

export const updateNotificationTemplate = async (id: number, payload: NotificationTemplatePayload) => {
  const data = { ...payload, id };
  const response = await fetchFromApi('/user/NotificationTemplateCRUD/', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response;
};

export const deleteNotificationTemplate = async (id: number) => {
  const response = await fetchFromApi(`/user/NotificationTemplateCRUD/?id=${id}`, {
    method: 'DELETE',
  });
  return response;
};
