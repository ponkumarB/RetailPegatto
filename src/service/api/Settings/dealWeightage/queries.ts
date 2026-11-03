import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchDealWeightSetups, 
  fetchDealWeightSetupById, 
  saveDealWeightSetup, 
  deleteDealWeightSetup,
  DealWeightSetup
} from './api';
import { toast } from 'sonner';

export const DEAL_WEIGHT_KEYS = {
  all: ['dealWeightSetups'] as const,
  detail: (id: number) => ['dealWeightSetup', id] as const,
};

export const useDealWeightSetups = () => {
  return useQuery({
    queryKey: DEAL_WEIGHT_KEYS.all,
    queryFn: fetchDealWeightSetups,
  });
};

export const useDealWeightSetup = (id: number) => {
  return useQuery({
    queryKey: DEAL_WEIGHT_KEYS.detail(id),
    queryFn: () => fetchDealWeightSetupById(id),
    enabled: !!id,
  });
};

export const useSaveDealWeightSetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveDealWeightSetup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_WEIGHT_KEYS.all });
    },
    onError: (error) => {
      console.error('Failed to save Deal Weight:', error);
      toast.error('Failed to save Deal Weight');
    }
  });
};

export const useDeleteDealWeightSetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDealWeightSetup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_WEIGHT_KEYS.all });
      toast.success('Deal Weight deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete Deal Weight:', error);
      toast.error('Failed to delete Deal Weight');
    }
  });
};
