import { fetchFromApi } from '@/service/apiClient';

export interface SolutionArchitecturePayload {
  id?: number;
  Organization_Id?: number;
  Project_Id?: number | null;
  Document_Code?: string | null;
  Project_Name?: string;
  Client_Id?: number | null;
  Client_Name?: string;
  Project_Manager?: number | null;
  Architecture_View?: string;
  Version?: string;
  Status?: string;
  Prepared_By?: number | null;
  In_Scope?: string[];
  Out_Of_Scope?: string[];
  Business_Context?: string;
  Key_Business_Drivers?: string[];
  Technical_Context?: Record<string, any>;
  Architecture_Diagram?: string;
  Technology_Stack?: Record<string, any> | string[];
  Components?: any[];
  Data_Flow?: any[];
  Architecture_Principles?: string[];
  Security_Considerations?: string[];
  Non_Functional_Requirements?: Record<string, any>;
  Assumptions?: string[];
  Constraints?: string[];
  Document_Content?: string;
  Is_sent_Email?: boolean;
  Is_Generated?: boolean;
}

/**
 * Create Solution Architecture Document
 * Endpoint: POST /user/SolutionArchitectureDocumentCRUD/
 */
export async function createSolutionArchitectureDocument(payload: SolutionArchitecturePayload): Promise<any> {
  return fetchFromApi('/user/SolutionArchitectureDocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update Solution Architecture Document
 * Endpoint: PUT /user/SolutionArchitectureDocumentCRUD/
 */
export async function updateSolutionArchitectureDocument(payload: SolutionArchitecturePayload): Promise<any> {
  return fetchFromApi('/user/SolutionArchitectureDocumentCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete Solution Architecture Document
 * Endpoint: DELETE /user/SolutionArchitectureDocumentCRUD/?id=${id}
 */
export async function deleteSolutionArchitectureDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/SolutionArchitectureDocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    return fetchFromApi(`/user/SolutionArchitectureDocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

/**
 * Fetch Solution Architecture Document List
 * Endpoint: GET /user/SolutionArchitectureDocumentList/ or GET /user/SolutionArchitectureDocumentCRUD/
 */
export async function fetchSolutionArchitectureList(): Promise<any> {
  try {
    return await fetchFromApi('/user/SolutionArchitectureDocumentList/', {
      method: 'GET',
    });
  } catch (error) {
    return fetchFromApi('/user/SolutionArchitectureDocumentCRUD/', {
      method: 'GET',
    });
  }
}

/**
 * Fetch Solution Architecture Document by ID
 * Endpoint: GET /user/SolutionArchitectureDocumentCRUD/?id=${id}
 */
export async function fetchSolutionArchitectureById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SolutionArchitectureDocumentCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Generate Solution Architecture Document PDF
 * Endpoint: POST /user/GenerateSolutionArchitectureDocumentAPIView/
 * Payload: { "SoftwareArch_Id": softwareArchId }
 */
export async function generateSolutionArchitectureDocumentPDF(softwareArchId: number | string): Promise<any> {
  return fetchFromApi('/user/GenerateSolutionArchitectureDocumentAPIView/', {
    method: 'POST',
    body: JSON.stringify({
      SoftwareArch_Id: softwareArchId,
    }),
  });
}

/**
 * Format document preview URL to insert tenant name before /media/
 * e.g. https://backend.crmfarm.app/media/SAD000000002.pdf -> https://backend.crmfarm.app/cbs/media/SAD000000002.pdf
 */
export function getFormattedPreviewUrl(url: string): string {
  if (!url) return '';
  let tenant = typeof window !== 'undefined' ? (localStorage.getItem('tenant') || localStorage.getItem('tenant_name') || 'cbs') : 'cbs';
  if (!tenant || tenant === 'localhost' || tenant === '127') {
    tenant = 'cbs';
  }
  let formatted = url;
  if (tenant && formatted.includes('/media/') && !formatted.includes(`/${tenant}/media/`)) {
    formatted = formatted.replace('/media/', `/${tenant}/media/`);
  }
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    const base = 'https://backend.crmfarm.app';
    if (!formatted.startsWith('/')) {
      formatted = `/${formatted}`;
    }
    formatted = `${base}${formatted}`;
  }
  return formatted;
}
