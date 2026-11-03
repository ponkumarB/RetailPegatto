import { fetchFromApi } from '@/service/apiClient';

export interface TemplateListParams {
  module?: string;
  template_type?: string;
  status?: string;
}

export interface ITTemplatePayload {
  id?: number;
  Organization_Id?: number;
  Template_Name?: string;
  Template_Type?: string;
  Module?: string;
  Description?: string;
  Template_Category?: string;
  Tags?: string;
  Base_Template?: string;
  Visible_To?: string;
  Is_Default?: boolean;
  Include_Sample_Data?: boolean;
  Form_Structure_Fields?: boolean;
  Field_Validations_Rules?: boolean;
  Layout_Sections?: boolean;
  Workflows_Approvals?: boolean;
  Permissions_Access?: boolean;
  Calculation_Formulas?: boolean;
  Email_SMS_Templates?: boolean;
  Custom_Labels_Placeholders?: boolean;
  Version_No?: string;
  Allow_Edit?: boolean;
  Allow_Copy?: boolean;
  Allow_Delete?: boolean;
  Require_Approval?: boolean;
  Is_Active?: boolean;
  Is_Deleted?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

export interface ITTemplateFilterPayload {
  Organization_Id?: number;
  Template_Type?: string;
  Module?: string;
  Template_Category?: string;
  Is_Active?: boolean;
  Is_Default?: boolean;
  Visible_To?: string;
  Created_Date?: [string, string];
  page?: number;
}

/**
 * GET request for TemplateDashboardAPIView
 */
export async function fetchTemplateDashboard(): Promise<any> {
  return fetchFromApi('/user/TemplateDashboardAPIView/', {
    method: 'GET',
  });
}

/**
 * GET request for TemplateListAPIView with module, template_type, status params
 */
export async function fetchTemplateList(params: TemplateListParams): Promise<any> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return fetchFromApi(`/user/TemplateListAPIView/${queryString}`, {
    method: 'GET',
  });
}

/**
 * Create a new template via ITTemplate_CRUD (POST)
 */
export async function createITTemplate(payload: ITTemplatePayload): Promise<any> {
  return fetchFromApi('/user/ITTemplate_CRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch a single template by ID via ITTemplate_CRUD (GET)
 */
export async function fetchITTemplateById(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ITTemplate_CRUD/?id=${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.warn(`Fetch template by query param ID failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ITTemplate_CRUD/${id}/`, {
      method: 'GET',
    });
  }
}

/**
 * Update a template fully via ITTemplate_CRUD (PUT)
 */
export async function updateITTemplate(id: number | string, payload: ITTemplatePayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/ITTemplate_CRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PUT to base /user/ITTemplate_CRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ITTemplate_CRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Update a template partially via ITTemplate_CRUD (PATCH)
 */
export async function patchITTemplate(id: number | string, payload: Partial<ITTemplatePayload>): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/ITTemplate_CRUD/', {
      method: 'PATCH',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn(`PATCH to base /user/ITTemplate_CRUD/ failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ITTemplate_CRUD/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Delete a template via ITTemplate_CRUD (DELETE)
 */
export async function deleteITTemplate(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ITTemplate_CRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn(`DELETE with query param failed, trying URL detail path:`, error);
    return fetchFromApi(`/user/ITTemplate_CRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

/**
 * GET request for ITTemplateSearch
 */
export async function searchITTemplate(searchQuery: string): Promise<any> {
  return fetchFromApi(`/user/ITTemplateSearch/?search=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
  });
}

/**
 * POST request for ITTemplateFilter
 */
export async function filterITTemplate(payload: ITTemplateFilterPayload): Promise<any> {
  return fetchFromApi('/user/ITTemplateFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for ITTemplateListwithoutpagination
 */
export async function fetchITTemplateListWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/ITTemplateListwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * GET request for ITTemplateList
 */
export async function fetchITTemplateList(): Promise<any> {
  return fetchFromApi('/user/ITTemplateList/', {
    method: 'GET',
  });
}
