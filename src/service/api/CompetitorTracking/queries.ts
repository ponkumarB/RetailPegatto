import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getCompetitorMasterList,
  getCompetitorMasterById,
  createCompetitorMaster,
  updateCompetitorMaster,
  deleteCompetitorMaster,
  getCompetitorDashboard,
  searchCompetitorMaster,
  filterCompetitorMaster,
  CompetitorPayload
} from './api';

export const COMPETITOR_MASTER_KEYS = {
  all: ['competitorMaster'] as const,
  lists: () => [...COMPETITOR_MASTER_KEYS.all, 'list'] as const,
  list: (page: number) => [...COMPETITOR_MASTER_KEYS.lists(), page] as const,
  details: () => [...COMPETITOR_MASTER_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...COMPETITOR_MASTER_KEYS.details(), id] as const,
  dashboards: () => [...COMPETITOR_MASTER_KEYS.all, 'dashboard'] as const,
  searches: () => [...COMPETITOR_MASTER_KEYS.all, 'search'] as const,
  search: (query: string) => [...COMPETITOR_MASTER_KEYS.searches(), query] as const,
  filters: () => [...COMPETITOR_MASTER_KEYS.all, 'filter'] as const,
  filter: (payload: any) => [...COMPETITOR_MASTER_KEYS.filters(), payload] as const,
};

export const useCompetitorMasterList = (page: number = 1) => {
  return useQuery({
    queryKey: COMPETITOR_MASTER_KEYS.list(page),
    queryFn: () => getCompetitorMasterList(page),
  });
};

export const useCompetitorMasterById = (id: number) => {
  return useQuery({
    queryKey: COMPETITOR_MASTER_KEYS.detail(id),
    queryFn: () => getCompetitorMasterById(id),
    enabled: !!id,
  });
};

export const useCompetitorDashboard = () => {
  return useQuery({
    queryKey: COMPETITOR_MASTER_KEYS.dashboards(),
    queryFn: () => getCompetitorDashboard(),
  });
};

export const useSearchCompetitorMaster = (searchQuery: string) => {
  return useQuery({
    queryKey: COMPETITOR_MASTER_KEYS.search(searchQuery),
    queryFn: () => searchCompetitorMaster(searchQuery),
    enabled: !!searchQuery,
  });
};

export const useFilterCompetitorMaster = (payload: any) => {
  return useQuery({
    queryKey: COMPETITOR_MASTER_KEYS.filter(payload),
    queryFn: () => filterCompetitorMaster(payload),
    enabled: Object.keys(payload).length > 0,
  });
};

export const useCreateCompetitorMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => createCompetitorMaster(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPETITOR_MASTER_KEYS.all });
      toast.success('Competitor created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create competitor', {
        description: error.message || 'An unexpected error occurred.',
      });
    },
  });
};

export const useUpdateCompetitorMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateCompetitorMaster(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COMPETITOR_MASTER_KEYS.all });
      toast.success('Competitor updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update competitor', {
        description: error.message || 'An unexpected error occurred.',
      });
    },
  });
};

export const useDeleteCompetitorMaster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCompetitorMaster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPETITOR_MASTER_KEYS.all });
      toast.success('Competitor deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete competitor', {
        description: error.message || 'An unexpected error occurred.',
      });
    },
  });
};
