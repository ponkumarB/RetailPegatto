import { fetchFromApi } from '@/service/apiClient';

export interface LeadScoringRule {
  id?: number;
  criteria: string;
  condition: string;
  values: any;
  points: string;
}

export interface LeadScoringGrade {
  grade: string;
  min: number;
  max: number;
}

export interface LeadScoringPayload {
  id?: number;
  Organization_Id?: number;
  ScoreName?: string;
  ApplyTo?: string;
  ScoreType?: string;
  MinScore?: number;
  MaxScore?: number;
  ShowScoreLeadDetails?: boolean;
  ShowScorePortalUsers?: boolean;
  ScoreSummary?: string;
  ScoreInterpretation?: string;
  Rules?: LeadScoringRule[];
  GradeConfiguration?: LeadScoringGrade[];
  IsDraft?: boolean;
  IsActive?: boolean;
  CreatedBy?: number;
}

/**
 * Create a new lead scoring configuration
 */
export async function createLeadScoring(payload: LeadScoringPayload): Promise<any> {
  return fetchFromApi('/user/NewITLeadScoringCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single lead scoring configuration by ID
 */
export async function fetchLeadScoringById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/NewITLeadScoringCRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch lead scoring by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/NewITLeadScoringCRUD/?id=${id}`, {
      method: 'GET',
    });
  }
}

/**
 * Update a lead scoring configuration fully via PUT
 */
export async function updateLeadScoring(id: number | string, payload: LeadScoringPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/NewITLeadScoringCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/NewITLeadScoringCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/NewITLeadScoringCRUD/?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Update a lead scoring configuration partially via PATCH
 */
export async function patchLeadScoring(id: number | string, payload: Partial<LeadScoringPayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/NewITLeadScoringCRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/NewITLeadScoringCRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/NewITLeadScoringCRUD/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete a lead scoring configuration by ID
 */
export async function deleteLeadScoring(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/NewITLeadScoringCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/NewITLeadScoringCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

/**
 * Fetch lead scoring rules with pagination
 */
export async function NewITLeadScoringList(params?: any): Promise<any> {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchFromApi(`/user/NewITLeadScoringList/${queryString}`, {
    method: 'GET',
  });
}

/**
 * Fetch lead scoring rules without pagination
 */
export async function NewITLeadScoringListwithoutpagination(): Promise<any> {
  return fetchFromApi('/user/NewITLeadScoringListwithoutpagination/', {
    method: 'GET',
  });
}

