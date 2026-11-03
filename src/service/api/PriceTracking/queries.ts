import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getPriceTrackingList,
  getPriceTrackingById,
  createPriceTracking,
  updatePriceTracking,
  deletePriceTracking,
  getPriceTrackingDashboard,
  filterPriceTracking,
} from './api';

export const usePriceTrackingList = (page: number = 1) => {
  return useQuery({
    queryKey: ['priceTracking', 'list', page],
    queryFn: () => getPriceTrackingList(page),
  });
};

export const usePriceTrackingById = (id: number) => {
  return useQuery({
    queryKey: ['priceTracking', 'detail', id],
    queryFn: () => getPriceTrackingById(id),
    enabled: !!id,
  });
};

export const usePriceTrackingDashboard = (period: [string, string]) => {
  return useQuery({
    queryKey: ['priceTracking', 'dashboard', period],
    queryFn: () => getPriceTrackingDashboard(period),
  });
};

export const useFilterPriceTracking = () => {
  return useMutation({
    mutationFn: (data: any) => filterPriceTracking(data),
  });
};

export const useCreatePriceTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createPriceTracking(data),
    onSuccess: () => {
      toast.success('Price tracking created successfully.');
      queryClient.invalidateQueries({ queryKey: ['priceTracking'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to create price tracking: ${error.message}`);
    },
  });
};

export const useUpdatePriceTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updatePriceTracking(id, data),
    onSuccess: () => {
      toast.success('Price tracking updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['priceTracking'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to update price tracking: ${error.message}`);
    },
  });
};

export const useDeletePriceTracking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePriceTracking(id),
    onSuccess: () => {
      toast.success('Price tracking deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['priceTracking'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete price tracking: ${error.message}`);
    },
  });
};
