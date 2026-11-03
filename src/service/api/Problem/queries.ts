import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProblems, 
  getProblem, 
  saveProblem, 
  deleteProblem, 
  searchProblems, 
  Problem 
} from './api';
import { toast } from 'sonner';

export const PROBLEM_KEYS = {
  all: ['problems'] as const,
  lists: () => [...PROBLEM_KEYS.all, 'list'] as const,
  detail: (id: number) => [...PROBLEM_KEYS.all, 'detail', id] as const,
  search: (query: string) => [...PROBLEM_KEYS.all, 'search', query] as const,
};

export const useProblems = () => {
  return useQuery({
    queryKey: PROBLEM_KEYS.lists(),
    queryFn: getProblems,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProblem = (id: number) => {
  return useQuery({
    queryKey: PROBLEM_KEYS.detail(id),
    queryFn: () => getProblem(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveProblem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEM_KEYS.lists() });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to save Problem');
    },
  });
};

export const useDeleteProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProblem,
    onSuccess: () => {
      toast.success('Problem deleted successfully');
      queryClient.invalidateQueries({ queryKey: PROBLEM_KEYS.lists() });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete Problem');
    },
  });
};

export const useSearchProblems = (query: string) => {
  return useQuery({
    queryKey: PROBLEM_KEYS.search(query),
    queryFn: () => searchProblems(query),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};
