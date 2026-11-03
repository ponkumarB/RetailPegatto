import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTemplateDashboard,
  fetchTemplateList,
  createITTemplate,
  fetchITTemplateById,
  updateITTemplate,
  patchITTemplate,
  deleteITTemplate,
  searchITTemplate,
  filterITTemplate,
  fetchITTemplateListWithoutPagination,
  fetchITTemplateList,
  TemplateListParams,
  ITTemplatePayload,
  ITTemplateFilterPayload,
} from './api';

// Query Keys
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (params: TemplateListParams) => [...templateKeys.lists(), params] as const,
  dashboard: () => [...templateKeys.all, 'dashboard'] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: number | string) => [...templateKeys.details(), id] as const,
  searches: () => [...templateKeys.all, 'search'] as const,
  search: (query: string) => [...templateKeys.searches(), query] as const,
  filters: () => [...templateKeys.all, 'filter'] as const,
  filter: (payload: ITTemplateFilterPayload) => [...templateKeys.filters(), payload] as const,
};

export const useTemplateDashboard = () => {
  return useQuery({
    queryKey: templateKeys.dashboard(),
    queryFn: fetchTemplateDashboard,
  });
};

export const useTemplateList = (params: TemplateListParams) => {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => fetchTemplateList(params),
  });
};

export const useITTemplateList = () => {
  return useQuery({
    queryKey: [...templateKeys.lists(), 'default'],
    queryFn: fetchITTemplateList,
  });
};

export const useITTemplateListWithoutPagination = () => {
  return useQuery({
    queryKey: [...templateKeys.lists(), 'no-pagination'],
    queryFn: fetchITTemplateListWithoutPagination,
  });
};

export const useITTemplateById = (id: number | string) => {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => fetchITTemplateById(id),
    enabled: !!id,
  });
};

export const useSearchITTemplate = (searchQuery: string) => {
  return useQuery({
    queryKey: templateKeys.search(searchQuery),
    queryFn: () => searchITTemplate(searchQuery),
    enabled: !!searchQuery && searchQuery.trim().length > 0,
  });
};

export const useFilterITTemplate = (payload: ITTemplateFilterPayload) => {
  return useQuery({
    queryKey: templateKeys.filter(payload),
    queryFn: () => filterITTemplate(payload),
    enabled: Object.keys(payload).length > 0,
  });
};

export const useCreateITTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createITTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};

export const useUpdateITTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: ITTemplatePayload }) =>
      updateITTemplate(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) });
    },
  });
};

export const usePatchITTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: Partial<ITTemplatePayload> }) =>
      patchITTemplate(id, payload),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) });
    },
  });
};

export const useDeleteITTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteITTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
    },
  });
};
