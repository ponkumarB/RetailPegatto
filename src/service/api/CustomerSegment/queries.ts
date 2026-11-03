import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCustomerSegmentList,
  fetchCustomerSegmentSearch,
  fetchCustomerSegmentFilter,
  fetchCustomerSegmentationDashboard,
  createCustomerSegment,
  updateCustomerSegment,
  deleteCustomerSegment,
  CustomerSegmentationDashboardPayload,
  CustomerSegmentFilterPayload,
  CustomerSegmentPayload
} from './api';

export const useCustomerSegmentList = () => {
  return useQuery({
    queryKey: ['customerSegmentList'],
    queryFn: fetchCustomerSegmentList
  });
};

export const useCustomerSegmentSearch = (search: string) => {
  return useQuery({
    queryKey: ['customerSegmentSearch', search],
    queryFn: () => fetchCustomerSegmentSearch(search),
    enabled: !!search
  });
};

export const useCustomerSegmentFilter = (payload: CustomerSegmentFilterPayload) => {
  return useQuery({
    queryKey: ['customerSegmentFilter', payload],
    queryFn: () => fetchCustomerSegmentFilter(payload),
    enabled: !!payload.Segment_Type
  });
};

export const useCustomerSegmentationDashboard = (payload: CustomerSegmentationDashboardPayload) => {
  return useQuery({
    queryKey: ['customerSegmentationDashboard', payload],
    queryFn: () => fetchCustomerSegmentationDashboard(payload)
  });
};

export const useCreateCustomerSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerSegmentPayload) => createCustomerSegment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSegmentList'] });
      queryClient.invalidateQueries({ queryKey: ['customerSegmentationDashboard'] });
    }
  });
};

export const useUpdateCustomerSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerSegmentPayload) => updateCustomerSegment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSegmentList'] });
      queryClient.invalidateQueries({ queryKey: ['customerSegmentationDashboard'] });
    }
  });
};

export const useDeleteCustomerSegment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCustomerSegment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSegmentList'] });
      queryClient.invalidateQueries({ queryKey: ['customerSegmentSearch'] });
      queryClient.invalidateQueries({ queryKey: ['customerSegmentFilter'] });
      queryClient.invalidateQueries({ queryKey: ['customerSegmentationDashboard'] });
    }
  });
};
