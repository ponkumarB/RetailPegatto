import { fetchFromApi } from '@/service/apiClient';

export interface HLDLogicalArchitectureItem {
  Layer: string;
  Technology: string;
}

export interface HLDModuleStructureItem {
  Module: string;
  Description: string;
}

export interface HLDDataFlowDiagramItem {
  Source: string;
  Destination: string;
  Description: string;
}

export interface HLDPayload {
  id?: number;
  Organization_Id?: number;
  Project_Id?: number | null;
  Account_Id?: number | null;
  Project_Name: string;
  Project_Code: string;
  Client_Customer: string;
  Project_Manager: string;
  Start_Date: string;
  Planned_End_Date: string;
  In_Scope: string[];
  Out_Scope: string[];
  System_Context: string;
  Key_Design_Goals: string[];
  Assumptions: string[];
  Logical_Architecture: HLDLogicalArchitectureItem[];
  Module_Structure: HLDModuleStructureItem[];
  Data_Flow_Diagram: HLDDataFlowDiagramItem[];
  Technology_Stack: Array<Record<string, string>>;
  Non_Functional_Requirements: Array<Record<string, string>>;
  Architecture_Principles: string[];
  Review_Checklist: string[];
  Prepared_By: string;
  Document_Date: string;
  Overall_HLD: {
    Summary: string;
    Version: string;
  };
  Document_Version: string;
  Status: string;
  Created_By?: number;
  Updated_By?: number;
}

/**
 * Fetch HLD documents via GET /user/Highleveldesigndocpagination/
 */
export async function fetchHLDList(createdBy?: number | string): Promise<any> {
  // Directly returns a list array, let's wrap it in an object to simplify consumption and query patterns
  const results = await fetchFromApi('/user/Highleveldesigndocpagination/', {
    method: 'GET',
  });
  return { results };
}

/**
 * Create HLD document via POST /user/HighleveldesigndocCRUD/
 */
export async function createHLD(payload: HLDPayload): Promise<any> {
  return fetchFromApi('/user/HighleveldesigndocCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update HLD document via PUT /user/HighleveldesigndocCRUD/
 */
export async function updateHLD(id: number | string, payload: HLDPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  return fetchFromApi(`/user/HighleveldesigndocCRUD/`, {
    method: 'PUT',
    body: JSON.stringify(payloadWithId),
  });
}

/**
 * Delete HLD document via DELETE /user/HighleveldesigndocCRUD/?id={id}
 */
export async function deleteHLD(id: number | string): Promise<any> {
  return fetchFromApi(`/user/HighleveldesigndocCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}
