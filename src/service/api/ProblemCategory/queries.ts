import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProblemCategories, 
  getProblemCategory, 
  saveProblemCategory, 
  deleteProblemCategory,
  searchProblemCategories,
  getProblemCategoriesWithoutPagination,
  ProblemCategory 
} from './api';
import { toast } from 'sonner';

export const PROBLEM_CATEGORY_KEYS = {
  all: ['problem-categories'] as const,
  lists: () => [...PROBLEM_CATEGORY_KEYS.all, 'list'] as const,
  detail: (id: number) => [...PROBLEM_CATEGORY_KEYS.all, 'detail', id] as const,
  search: (query: string) => [...PROBLEM_CATEGORY_KEYS.all, 'search', query] as const,
};

export const useProblemCategories = () => {
  return useQuery({
    queryKey: PROBLEM_CATEGORY_KEYS.lists(),
    queryFn: getProblemCategories,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProblemCategoriesList = () => {
  return useQuery({
    queryKey: [...PROBLEM_CATEGORY_KEYS.lists(), 'no-pagination'],
    queryFn: getProblemCategoriesWithoutPagination,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProblemCategory = (id: number) => {
  return useQuery({
    queryKey: PROBLEM_CATEGORY_KEYS.detail(id),
    queryFn: () => getProblemCategory(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSaveProblemCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveProblemCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROBLEM_CATEGORY_KEYS.lists() });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to save Problem Category');
    },
  });
};

export const useDeleteProblemCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProblemCategory,
    onSuccess: () => {
      toast.success('Problem Category deleted successfully');
      queryClient.invalidateQueries({ queryKey: PROBLEM_CATEGORY_KEYS.lists() });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete Problem Category');
    },
  });
};

export const useSearchProblemCategories = (query: string) => {
  return useQuery({
    queryKey: PROBLEM_CATEGORY_KEYS.search(query),
    queryFn: () => searchProblemCategories(query),
    enabled: !!query && query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
};
