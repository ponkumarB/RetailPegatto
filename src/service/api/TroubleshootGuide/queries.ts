import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  TroubleshootGuide, 
  TroubleshootGuideFilterParams,
  getTroubleshootGuides, 
  getTroubleshootGuideById, 
  saveTroubleshootGuide, 
  deleteTroubleshootGuide, 
  filterTroubleshootGuides,
  searchTroubleshootGuides 
} from './api';

export const troubleshootGuideKeys = {
  all: ['troubleshootGuides'] as const,
  lists: () => [...troubleshootGuideKeys.all, 'list'] as const,
  list: (page: number) => [...troubleshootGuideKeys.lists(), page] as const,
  filters: (filters: TroubleshootGuideFilterParams) => [...troubleshootGuideKeys.lists(), 'filter', filters] as const,
  searches: (term: string) => [...troubleshootGuideKeys.lists(), 'search', term] as const,
  details: () => [...troubleshootGuideKeys.all, 'detail'] as const,
  detail: (id: number) => [...troubleshootGuideKeys.details(), id] as const,
};

export function useTroubleshootGuides(page: number = 1) {
  return useQuery({
    queryKey: troubleshootGuideKeys.list(page),
    queryFn: () => getTroubleshootGuides(page),
  });
}

export function useFilterTroubleshootGuides(filters: TroubleshootGuideFilterParams, enabled: boolean = false) {
  return useQuery({
    queryKey: troubleshootGuideKeys.filters(filters),
    queryFn: () => filterTroubleshootGuides(filters),
    enabled: enabled,
  });
}

export function useSearchTroubleshootGuides(searchTerm: string, enabled: boolean = false) {
  return useQuery({
    queryKey: troubleshootGuideKeys.searches(searchTerm),
    queryFn: () => searchTroubleshootGuides(searchTerm),
    enabled: enabled && searchTerm.length > 0,
  });
}

export function useTroubleshootGuide(id: number | null) {
  return useQuery({
    queryKey: troubleshootGuideKeys.detail(id!),
    queryFn: () => getTroubleshootGuideById(id!),
    enabled: !!id,
  });
}

export function useSaveTroubleshootGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (guide: TroubleshootGuide) => saveTroubleshootGuide(guide),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: troubleshootGuideKeys.all });
      if (data.id) {
        queryClient.setQueryData(troubleshootGuideKeys.detail(data.id), data);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save Troubleshoot Guide');
    }
  });
}

export function useDeleteTroubleshootGuide() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deleteTroubleshootGuide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: troubleshootGuideKeys.lists() });
      toast.success('Troubleshoot Guide deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete Troubleshoot Guide');
    }
  });
}
