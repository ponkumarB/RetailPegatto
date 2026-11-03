import { fetchFromApi } from '@/service/apiClient';

export interface CreateKnowledgecategorycrudPayload {
  Category_Name?: string;
  Description?: string;
  Is_Active?: boolean;
  Is_Deleted?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

export interface UpdateKnowledgecategorycrudPayload {
  id?: number;
  Category_Name?: string;
  Description?: string;
  Is_Active?: boolean;
  Is_Deleted?: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface PatchKnowledgecategorycrudPayload {
  id?: number;
  Category_Name?: string;
}

export interface CreateKnowledgecategoryfilterPayload {
  Category_Name?: string;
}

export interface CreateKnowledgearticlecrudPayload {
  Category_Id?: number;
  Title?: string;
  Content?: string;
  Tags?: any;
  Views?: number;
  Helpful_Count?: number;
  Status?: string;
  Visibility?: string;
  Attachment?: any[];
  Created_By?: number;
  Updated_By?: number;
}

export interface UpdateKnowledgearticlecrudPayload {
  id?: number;
  Title?: string;
  Content?: string;
  Tags?: any;
  Views?: number;
  Helpful_Count?: number;
  Status?: string;
  Visibility?: string;
  Is_Deleted?: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Category_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Attachment?: any[];
}

export interface PatchKnowledgearticlecrudPayload {
  id?: number;
  Title?: string;
}

export interface CreateKnowledgearticlefilterPayload {
  Status?: string;
}

/**
 * POST request for KnowledgeCategoryCRUD
 */
export async function createKnowledgecategorycrud(payload: CreateKnowledgecategorycrudPayload): Promise<any> {
  return fetchFromApi('/user/KnowledgeCategoryCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for KnowledgeCategoryCRUD
 */
export async function fetchKnowledgecategorycrud(id: number | string): Promise<any> {
  const params: string[] = [];
  if (id !== undefined) params.push(`id=${id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/KnowledgeCategoryCRUD/${query}`, {
    method: 'GET',
  });
}

/**
 * PUT request for KnowledgeCategoryCRUD
 */
export async function updateKnowledgecategorycrud(payload: UpdateKnowledgecategorycrudPayload): Promise<any> {
  return fetchFromApi('/user/KnowledgeCategoryCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH request for KnowledgeCategoryCRUD
 */
export async function patchKnowledgecategorycrud(payload: PatchKnowledgecategorycrudPayload): Promise<any> {
  return fetchFromApi('/user/KnowledgeCategoryCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE request for KnowledgeCategoryCRUD
 */
export async function deleteKnowledgecategorycrud(id: number | string): Promise<any> {
  const params: string[] = [];
  if (id !== undefined) params.push(`id=${id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/KnowledgeCategoryCRUD/${query}`, {
    method: 'DELETE',
  });
}

/**
 * GET request for KnowledgeCategoryListwithPagination
 */
export async function fetchKnowledgecategorylistwithpagination(page: number = 1, page_size: number = 10): Promise<any> {
  return fetchFromApi(`/user/KnowledgeCategoryListwithPagination/?page=${page}&page_size=${page_size}`, {
    method: 'GET',
  });
}

/**
 * GET request for KnowledgeCategorySearch
 */
export async function fetchKnowledgecategorysearch(search?: number | string): Promise<any> {
  const params: string[] = [];
  if (search !== undefined) params.push(`search=${search}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/KnowledgeCategorySearch/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for KnowledgeCategorylistwithoutpaginaton
 */
export async function fetchKnowledgecategorylistwithoutpaginaton(): Promise<any> {
  return fetchFromApi('/user/KnowledgeCategorylistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * POST request for KnowledgeCategoryFilter
 */
export async function createKnowledgecategoryfilter(payload: CreateKnowledgecategoryfilterPayload): Promise<any> {
  return fetchFromApi('/user/KnowledgeCategoryFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST request for KnowledgeArticleCRUD
 */
export async function createKnowledgearticlecrud(payload: CreateKnowledgearticlecrudPayload): Promise<any> {
  return fetchFromApi('/user/KnowledgeArticleCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for KnowledgeArticleCRUD
 */
export async function fetchKnowledgearticlecrud(id: number | string): Promise<any> {
  const params: string[] = [];
  if (id !== undefined) params.push(`id=${id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/KnowledgeArticleCRUD/${query}`, {
    method: 'GET',
  });
}

/**
 * PUT request for KnowledgeArticleCRUD
 */
export async function updateKnowledgearticlecrud(payload: UpdateKnowledgearticlecrudPayload): Promise<any> {
  return fetchFromApi('/user/KnowledgeArticleCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * PATCH request for KnowledgeArticleCRUD
 */
export async function patchKnowledgearticlecrud(payload: PatchKnowledgearticlecrudPayload): Promise<any> {
  return fetchFromApi('/user/KnowledgeArticleCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for KnowledgeArticleListwithPagination
 */
export async function fetchKnowledgearticlelistwithpagination(page: number = 1, page_size: number = 10): Promise<any> {
  return fetchFromApi(`/user/KnowledgeArticleListwithPagination/?page=${page}&page_size=${page_size}`, {
    method: 'GET',
  });
}

/**
 * DELETE request for KnowledgeArticleCRUD
 */
export async function deleteKnowledgearticlecrud(id: number | string): Promise<any> {
  const params: string[] = [];
  if (id !== undefined) params.push(`id=${id}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/KnowledgeArticleCRUD/${query}`, {
    method: 'DELETE',
  });
}

/**
 * GET request for KnowledgeArticleSearch
 */
export async function fetchKnowledgearticlesearch(search?: number | string): Promise<any> {
  const params: string[] = [];
  if (search !== undefined) params.push(`search=${search}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return fetchFromApi(`/user/KnowledgeArticleSearch/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for KnowledgeArticlelistwithoutpaginaton
 */
export async function fetchKnowledgearticlelistwithoutpaginaton(): Promise<any> {
  return fetchFromApi('/user/KnowledgeArticlelistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * POST request for KnowledgeArticleFilter
 */
export async function createKnowledgearticlefilter(payload: CreateKnowledgearticlefilterPayload): Promise<any> {
  return fetchFromApi('/user/KnowledgeArticleFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
