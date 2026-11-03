import { fetchFromApi } from '@/service/apiClient';

export interface ProposalDocumentPayload {
  id?: number;
  Organization_Id?: number;
  Project_Id?: number | null;
  ScopeDocument_Id?: number | null;
  SoftwareEstimation_Id?: number | null;
  Supporting_Documents?: string[];
  Document_Code?: string | null;
  Proposal_Title?: string;
  Client_Organization?: string;
  Currency?: string;
  Validity_Period?: number;
  Payment_Terms?: string;
  Include_Sections?: string[];
  Prepared_By?: number;
  Effective_Date?: string | null;
  Description?: string;
  Created_By?: number;
  Updated_By?: number;
}

export async function createProposalDocument(payload: ProposalDocumentPayload): Promise<any> {
  return fetchFromApi('/user/ProposalDocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProposalDocument(payload: ProposalDocumentPayload): Promise<any> {
  return fetchFromApi('/user/ProposalDocumentCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProposalDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/ProposalDocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    return fetchFromApi(`/user/ProposalDocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

export async function fetchProposalDocumentList(): Promise<any> {
  return fetchFromApi('/user/ProposalDocumentList/', {
    method: 'GET',
  });
}

export async function fetchProposalDocumentsWithoutPagination(): Promise<any[]> {
  return fetchFromApi('/user/ProposalDocumentwithoutpagination/', {
    method: 'GET',
  });
}

export async function generateProposalDocument(id: number | string): Promise<any> {
  return fetchFromApi('/user/GenerateProposalDocument/', {
    method: 'POST',
    body: JSON.stringify({ ProposalDocument_Id: typeof id === 'string' ? parseInt(id, 10) : id }),
  });
}
