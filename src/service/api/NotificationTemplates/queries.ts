import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationTemplateList,
  getNotificationTemplateById,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
  NotificationTemplatePayload,
} from './api';
import { toast } from 'sonner';

export const useNotificationTemplateList = () => {
  return useQuery({
    queryKey: ['NotificationTemplateList'],
    queryFn: getNotificationTemplateList,
  });
};

export const useNotificationTemplateById = (id: number) => {
  return useQuery({
    queryKey: ['NotificationTemplate', id],
    queryFn: () => getNotificationTemplateById(id),
    enabled: !!id,
  });
};

export const useCreateNotificationTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NotificationTemplatePayload) => createNotificationTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['NotificationTemplateList'] });
    },
    onError: (error) => {
      console.error('Error creating Notification Template:', error);
      toast.error('Failed to create Notification Template');
    },
  });
};

export const useUpdateNotificationTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NotificationTemplatePayload }) =>
      updateNotificationTemplate(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['NotificationTemplateList'] });
    },
    onError: (error) => {
      console.error('Error updating Notification Template:', error);
      toast.error('Failed to update Notification Template');
    },
  });
};

export const useDeleteNotificationTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNotificationTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['NotificationTemplateList'] });
      toast.success('Notification Template deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting Notification Template:', error);
      toast.error('Failed to delete Notification Template');
    },
  });
};
