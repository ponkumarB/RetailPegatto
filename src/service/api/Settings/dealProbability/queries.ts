import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchDealProbabilities, 
  fetchDealProbabilityById, 
  saveDealProbability, 
  deleteDealProbability,
  DealProbability
} from './api';
import { toast } from 'sonner';

export const DEAL_PROBABILITY_KEYS = {
  all: ['dealProbabilities'] as const,
  detail: (id: number) => ['dealProbability', id] as const,
};

export const useDealProbabilities = () => {
  return useQuery({
    queryKey: DEAL_PROBABILITY_KEYS.all,
    queryFn: fetchDealProbabilities,
  });
};

export const useDealProbability = (id: number) => {
  return useQuery({
    queryKey: DEAL_PROBABILITY_KEYS.detail(id),
    queryFn: () => fetchDealProbabilityById(id),
    enabled: !!id,
  });
};

export const useSaveDealProbability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveDealProbability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_PROBABILITY_KEYS.all });
    },
    onError: (error) => {
      console.error('Failed to save Deal Probability:', error);
      toast.error('Failed to save Deal Probability');
    }
  });
};

export const useDeleteDealProbability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDealProbability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_PROBABILITY_KEYS.all });
      toast.success('Deal Probability deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete Deal Probability:', error);
      toast.error('Failed to delete Deal Probability');
    }
  });
};
