import { fetchFromApi } from '@/service/apiClient';

export interface ScopeDocumentPayload {
  id?: number;
  Organization_Id?: number;
  Project_Id?: number | null;
  BRDDocument_Id?: number | null;
  FRDDocument_Id?: number | null;
  SRSDocument_Id?: number | null;
  Project_Name?: string;
  Client_Organization?: string;
  Project_Manager?: number | null;
  Scope_Level?: string;
  Include_Sections?: string[];
  Prepared_By?: number;
  Effective_Date?: string | null;
  Description?: string;
  Created_By?: number;
  Updated_By?: number;
}

export async function createScopeDocument(payload: ScopeDocumentPayload): Promise<any> {
  return fetchFromApi('/user/ScopeDocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateScopeDocument(payload: ScopeDocumentPayload): Promise<any> {
  return fetchFromApi('/user/ScopeDocumentCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteScopeDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ScopeDocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    return fetchFromApi(`/user/ScopeDocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

export async function fetchScopeDocumentList(): Promise<any> {
  return fetchFromApi('/user/ScopeDocumentList/', {
    method: 'GET',
  });
}

export async function generateScopeDocument(id: number | string): Promise<any> {
  return fetchFromApi('/user/GenerateScopeDocument2APIView/', {
    method: 'POST',
    body: JSON.stringify({ ScopeDocument_Id: typeof id === 'string' ? parseInt(id, 10) : id }),
  });
}

export async function fetchScopeDocumentListWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/ScopeDocumentwithoutpagination/', {
    method: 'GET',
  });
}
