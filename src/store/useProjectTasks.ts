import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjectTaskAdditional,
  fetchProjectTaskById,
  fetchMyProjectTasks,
  fetchMyProjectTasksWithoutPagination,
  searchProjectTasks,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  filterProjectTasks,
  fetchProjectTaskGanttChart,
  fetchProjectOverdueTaskDashboard,
  fetchProjectTaskCardDashboard,
} from '@/service/api/ProjectTask/api';
import { toast } from 'sonner';

// Query Keys
export const projectTaskKeys = {
  all: ['projectTasks'],
  lists: () => [...projectTaskKeys.all, 'list'],
  list: (filters) => [...projectTaskKeys.lists(), { filters }],
  details: () => [...projectTaskKeys.all, 'detail'],
  detail: (id) => [...projectTaskKeys.details(), id],
  my: (createdBy) => [...projectTaskKeys.all, 'my', createdBy],
  myWithoutPagination: (createdBy) => [...projectTaskKeys.all, 'my', createdBy, 'noPagination'],
  search: (params) => [...projectTaskKeys.all, 'search', params],
  gantt: () => [...projectTaskKeys.all, 'gantt'],
  overdue: () => [...projectTaskKeys.all, 'overdue'],
  cards: () => [...projectTaskKeys.all, 'cards'],
};

// ============= QUERIES =============

/**
 * Get all tasks with pagination
 */
export const useProjectTasks = (page?: number) => {
  return useQuery({
    queryKey: projectTaskKeys.list({ page }),
    queryFn: () => fetchProjectTaskAdditional(page),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // keepPreviousData: true,
  });
};

/**
 * Get single task by ID
 */
export const useProjectTask = (id: string | number) => {
  return useQuery({
    queryKey: projectTaskKeys.detail(id),
    queryFn: () => fetchProjectTaskById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get current user's tasks with pagination
 */
export const useMyProjectTasks = (createdBy: number | string) => {
  return useQuery({
    queryKey: projectTaskKeys.my(createdBy),
    queryFn: () => fetchMyProjectTasks(createdBy),
    enabled: !!createdBy,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get current user's tasks without pagination
 */
export const useMyProjectTasksWithoutPagination = (createdBy: number | string) => {
  return useQuery({
    queryKey: projectTaskKeys.myWithoutPagination(createdBy),
    queryFn: () => fetchMyProjectTasksWithoutPagination(createdBy),
    enabled: !!createdBy,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Search tasks
 */
export const useSearchProjectTasks = (params: { search?: string; Created_By?: string }) => {
  return useQuery({
    queryKey: projectTaskKeys.search(params),
    queryFn: () => searchProjectTasks(params),
    enabled: false, // Don't auto-fetch, trigger manually
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get Gantt chart data
 */
export const useProjectTaskGanttChart = () => {
  return useQuery({
    queryKey: projectTaskKeys.gantt(),
    queryFn: () => fetchProjectTaskGanttChart(),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * Get overdue tasks
 */
export const useProjectOverdueTasks = () => {
  return useQuery({
    queryKey: projectTaskKeys.overdue(),
    queryFn: () => fetchProjectOverdueTaskDashboard(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Get task cards
 */
export const useProjectTaskCards = () => {
  return useQuery({
    queryKey: projectTaskKeys.cards(),
    queryFn: () => fetchProjectTaskCardDashboard(),
    staleTime: 5 * 60 * 1000,
  });
};

// ============= MUTATIONS =============

/**
 * Create a new task
 */
export const useCreateProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProjectTask,
    onSuccess: (data) => {
      toast.success('Task created successfully!');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.cards() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.Error || 'Failed to create task');
    },
  });
};

/**
 * Update a task
 */
export const useUpdateProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProjectTask,
    onSuccess: (data, variables) => {
      toast.success('Task updated successfully!');
      // Invalidate specific task and lists
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.cards() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.Error || 'Failed to update task');
    },
  });
};

/**
 * Delete a task (soft delete)
 */
export const useDeleteProjectTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProjectTask,
    onSuccess: (data, variables) => {
      toast.success('Task deleted successfully!');
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.overdue() });
      queryClient.invalidateQueries({ queryKey: projectTaskKeys.cards() });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.Error || 'Failed to delete task');
    },
  });
};

/**
 * Filter tasks
 */
export const useFilterProjectTasks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filterProjectTasks,
    onSuccess: (data) => {
      // Update cache with filtered results
      queryClient.setQueryData(projectTaskKeys.lists(), data);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.Error || 'Failed to filter tasks');
    },
  });
};