import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSLAList,
  getSLA,
  createSLA,
  updateSLA,
  deleteSLA,
  searchSLAs,
  filterSLAs,
  fetchSLADropdownList,
  SLAListPayload,
  SLAFilterPayload,
  SLACreatePayload,
} from './api/SLA/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SLAMaster {
  id: number;
  slaId: string;
  priority: string;
  slaName: string;
  slaCode: string;
  description: string;
  slaType: string;
  appliesTo: string;
  businessHours: string;
  slaTargets: any[];
  slaHours: number;
  warningHours: number;
  escalationLevel1Hours: number;
  escalationLevel2Hours: number;
  responseTimeMins: number;
  status: string;
  createdDate: string;
  updatedDate: string;
  isDeleted: boolean;
}

// ─── Mapper: Backend → Frontend ───────────────────────────────────────────────

export const mapSLAFromBackend = (item: any): SLAMaster => {
  const slaId = item.SLA_Id || item.sla_id || item.slaId || (item.id ? `SLA-${item.id}` : '');
  const slaCode = item.SLA_Code || item.sla_code || item.slaCode || slaId || '—';
  const priority = item.Priority || item.priority || 'Medium';
  const slaName = item.SLA_Name || item.sla_name || item.slaName || item.Name || item.name || (priority ? `${priority} Priority SLA` : '') || slaCode || slaId;
  const appliesTo = item.Applies_To || item.applies_to || item.appliesTo || item.Customer || item.Support_Category || item.Product_Service || 'All Customers';

  return {
    id: item.id,
    slaId: slaId,
    priority: priority,
    slaName: slaName,
    slaCode: slaCode,
    description: item.Description || item.description || '',
    slaType: item.SLA_Type || item.sla_type || item.slaType || 'Time Based',
    appliesTo: appliesTo,
    businessHours: item.Business_Hours || item.business_hours || item.businessHours || 'Default Business Hours (24x7)',
    slaTargets: item.SLA_Targets || item.sla_targets || item.slaTargets || [],
    slaHours: item.SLA_Hours ?? item.sla_hours ?? item.slaHours ?? 24,
    warningHours: item.Warning_Hours ?? item.warning_hours ?? item.warningHours ?? 1,
    escalationLevel1Hours: item.Escalation_Level1_Hours ?? item.escalation_level1_hours ?? item.escalationLevel1Hours ?? 2,
    escalationLevel2Hours: item.Escalation_Level2_Hours ?? item.escalation_level2_hours ?? item.escalationLevel2Hours ?? 4,
    responseTimeMins: item.Response_Time_Mins ?? item.response_time_mins ?? item.responseTimeMins ?? 60,
    status: item.Status || item.status || 'Within SLA',
    createdDate: item.Created_Date || item.created_date || item.createdDate || item.created_at || '',
    updatedDate: item.Updated_Date || item.updated_date || item.updatedDate || item.updated_at || '',
    isDeleted: Boolean(item.Is_Deleted ?? item.is_deleted ?? item.isDeleted),
  };
};

// ─── Mapper: Frontend → Backend ───────────────────────────────────────────────

export const mapSLAToBackend = (item: Partial<SLAMaster> & { id?: number }): any => {
  const payload: any = {};
  if (item.id !== undefined) payload.id = item.id;
  if (item.priority !== undefined) payload.Priority = item.priority;
  if (item.slaName !== undefined) payload.SLA_Name = item.slaName;
  if (item.slaCode !== undefined) payload.SLA_Code = item.slaCode;
  if (item.description !== undefined) payload.Description = item.description;
  if (item.slaType !== undefined) payload.SLA_Type = item.slaType;
  if (item.appliesTo !== undefined) payload.Applies_To = item.appliesTo;
  if (item.businessHours !== undefined) payload.Business_Hours = item.businessHours;
  if (item.slaTargets !== undefined) payload.SLA_Targets = item.slaTargets;
  if (item.slaHours !== undefined) payload.SLA_Hours = item.slaHours;
  if (item.warningHours !== undefined) payload.Warning_Hours = item.warningHours;
  if (item.escalationLevel1Hours !== undefined) payload.Escalation_Level1_Hours = item.escalationLevel1Hours;
  if (item.escalationLevel2Hours !== undefined) payload.Escalation_Level2_Hours = item.escalationLevel2Hours;
  if (item.responseTimeMins !== undefined) payload.Response_Time_Mins = item.responseTimeMins;
  if (item.status !== undefined) payload.Status = item.status;
  return payload;
};

// ─── Queries ──────────────────────────────────────────────────────────────────

/** Fetch paginated SLA list */
export function useSLAListQuery(payload?: SLAListPayload) {
  return useQuery({
    queryKey: ['slaList', payload],
    queryFn: async () => {
      const res = await fetchSLAList(payload);
      const items = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return {
        data: items.map(mapSLAFromBackend),
        count: res?.count ?? items.length,
        next: res?.next ?? null,
        previous: res?.previous ?? null,
      };
    },
    staleTime: 30 * 1000,
  });
}

/** Fetch single SLA by id */
export function useSLAQuery(id: string | number, enabled = true) {
  return useQuery({
    queryKey: ['sla', id],
    queryFn: async () => {
      const res = await getSLA(id);
      return mapSLAFromBackend(res);
    },
    enabled: enabled && !!id,
  });
}

/** Search SLAs */
export function useSLASearchQuery(search: string, page = 1) {
  return useQuery({
    queryKey: ['slaSearch', search, page],
    queryFn: async () => {
      const res = await searchSLAs(search, page);
      const items = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return {
        data: items.map(mapSLAFromBackend),
        count: res?.count ?? items.length,
        next: res?.next ?? null,
        previous: res?.previous ?? null,
      };
    },
    enabled: search.trim().length > 0,
    staleTime: 15 * 1000,
  });
}

/** Filter SLAs */
export function useSLAFilterQuery(payload: SLAFilterPayload, enabled = false) {
  return useQuery({
    queryKey: ['slaFilter', payload],
    queryFn: async () => {
      const res = await filterSLAs(payload);
      const items = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return {
        data: items.map(mapSLAFromBackend),
        count: res?.count ?? items.length,
      };
    },
    enabled,
    staleTime: 15 * 1000,
  });
}

/** Dropdown list (non-paginated) */
export function useSLADropdownQuery() {
  return useQuery({
    queryKey: ['slaDropdown'],
    queryFn: async () => {
      const res = await fetchSLADropdownList();
      const items = Array.isArray(res) ? res : (res?.results || res?.data || []);
      return items.map(mapSLAFromBackend);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Create SLA */
export function useCreateSLAMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SLACreatePayload) => createSLA(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaList'] });
      queryClient.invalidateQueries({ queryKey: ['slaSearch'] });
      queryClient.invalidateQueries({ queryKey: ['slaDropdown'] });
    },
  });
}

/** Update SLA (full) */
export function useUpdateSLAMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SLAMaster> & { id: number }) =>
      updateSLA(mapSLAToBackend(payload)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sla', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['slaList'] });
      queryClient.invalidateQueries({ queryKey: ['slaSearch'] });
    },
  });
}

/** Patch SLA (partial) */
export function usePatchSLAMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SLAMaster> & { id: number }) =>
      updateSLA(mapSLAToBackend(payload)),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sla', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['slaList'] });
    },
  });
}

/** Delete (soft) SLA */
export function useDeleteSLAMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number | string) => deleteSLA(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slaList'] });
      queryClient.invalidateQueries({ queryKey: ['slaSearch'] });
      queryClient.invalidateQueries({ queryKey: ['slaDropdown'] });
    },
  });
}
