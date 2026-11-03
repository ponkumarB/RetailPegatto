import { fetchFromApi } from '@/service/apiClient';

export interface SLAListPayload {
  status?: string;
  sla_type?: string;
  applies_to?: string;
  page?: number;
  page_size?: number;
}

export interface SLAFilterPayload {
  Priority?: string;
  Status?: string;
  SLA_Name?: string;
  SLA_Code?: string;
  Description?: string;
  SLA_Type?: string;
  Applies_To?: string;
  Business_Hours?: string;
  Customer?: string | number;
  Support_Category?: string | number;
  Product_Service?: string | number;
  from_date?: string;
  to_date?: string;
  page?: number;
}

export interface SLACreatePayload {
  SLA_Name?: string;
  SLA_Code?: string;
  Priority: string;
  Description?: string;
  SLA_Type?: string;
  Applies_To?: string;
  Business_Hours?: string;
  SLA_Targets?: any[];
  SLA_Hours?: number;
  Warning_Hours?: number;
  Escalation_Level1_Hours?: number;
  Escalation_Level2_Hours?: number;
  Response_Time_Mins?: number;
  Status?: string;
  Customer?: number | null;
  Support_Category?: number | null;
  Product_Service?: number | null;
}

/** GET all SLAs with optional filters (paginated) */
export async function fetchSLAList(payload?: SLAListPayload): Promise<any> {
  const query = new URLSearchParams();
  if (payload?.status) query.append('status', payload.status);
  if (payload?.sla_type) query.append('sla_type', payload.sla_type);
  if (payload?.applies_to) query.append('applies_to', payload.applies_to);
  if (payload?.page) query.append('page', String(payload.page));
  if (payload?.page_size) query.append('page_size', String(payload.page_size));
  const qs = query.toString();
  return fetchFromApi(`/user/SLAMasterList/${qs ? `?${qs}` : ''}`);
}

/** GET single SLA by ID */
export async function getSLA(id: string | number): Promise<any> {
  return fetchFromApi(`/user/SLAMasterCRUD/?id=${id}`);
}

/** POST create new SLA */
export async function createSLA(payload: SLACreatePayload): Promise<any> {
  return fetchFromApi('/user/SLAMasterCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** PUT update SLA */
export async function updateSLA(payload: Partial<SLACreatePayload> & { id: string | number }): Promise<any> {
  return fetchFromApi('/user/SLAMasterCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** DELETE (soft delete) SLA */
export async function deleteSLA(id: string | number): Promise<any> {
  return fetchFromApi(`/user/SLAMasterCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/** PATCH partial update SLA */
export async function patchSLA(payload: Partial<SLACreatePayload> & { id: string | number }): Promise<any> {
  return fetchFromApi('/user/SLAMasterCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** GET search SLAs */
export async function searchSLAs(search: string, page?: number): Promise<any> {
  const query = new URLSearchParams({ search });
  if (page) query.append('page', String(page));
  return fetchFromApi(`/user/SLAMasterSearch/?${query.toString()}`);
}

/** POST filter SLAs */
export async function filterSLAs(payload: SLAFilterPayload): Promise<any> {
  return fetchFromApi('/user/SLAMasterFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET all SLAs for dropdown (non-paginated) */
export async function fetchSLADropdownList(): Promise<any> {
  return fetchFromApi('/user/SLAMasterDropdownList/');
}
