import { fetchFromApi } from '@/service/apiClient';

export interface LLDReferenceDocument {
  Document_Name: string;
  Version: string;
}

export interface LLDKeyModule {
  Module_Name: string;
  Description: string;
}

export interface LLDTechnologyStack {
  Backend: string;
  Frontend: string;
  Database: string;
}

export interface LLDModuleDesignItem {
  Module: string;
  Design: string;
}

export interface LLDDatabaseDesignItem {
  Table_Name: string;
  Description: string;
}

export interface LLDAPIDesignItem {
  API_Name: string;
  Method: string;
  Endpoint: string;
}

export interface LLDClassDesignItem {
  Class_Name: string;
  Description: string;
}

export interface LLDUIDesignItem {
  Screen: string;
  Description: string;
}

export interface LLDSequenceDiagramItem {
  Process: string;
  Description: string;
}

export interface LLDSampleCodeItem {
  Language: string;
  Code: string;
}

export interface LLDReviewChecklistItem {
  Item: string;
  Status: boolean;
}

export interface LLDPayload {
  id?: number;
  Organization_Id?: number;
  Project_Id?: number | null;
  Project_Name: string;
  Project_Code: string;
  Client_Customer: string;
  Account_Id?: number | null;
  Project_Manager: string;
  Start_Date: string;
  Planned_End_Date: string;
  In_Scope: string[];
  Out_Scope: string[];
  Reference_Documents: LLDReferenceDocument[];
  Key_Modules: LLDKeyModule[];
  Technology_Stack: LLDTechnologyStack;
  Module_Design: LLDModuleDesignItem[];
  Database_Design: LLDDatabaseDesignItem[];
  API_Design: LLDAPIDesignItem[];
  Class_Design: LLDClassDesignItem[];
  UI_Design: LLDUIDesignItem[];
  Sequence_Diagrams: LLDSequenceDiagramItem[];
  Sample_Code: LLDSampleCodeItem[];
  Design_Considerations: string[];
  Dependencies: string[];
  Assumptions: string[];
  Review_Checklist: LLDReviewChecklistItem[];
  Prepared_By: string;
  Document_Date: string;
  Overall_LLD: {
    Summary: string;
    Version: string;
  };
  Document_Version: string;
  Status: string;
  Active_Flag?: boolean;
  Is_Deleted?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

/**
 * Fetch LLD documents via GET /user/Lowleveldesigndocpagination/
 */
export async function fetchLLDList(createdBy?: number | string): Promise<any> {
  const results = await fetchFromApi('/user/Lowleveldesigndocpagination/', {
    method: 'GET',
  });
  return { results };
}

/**
 * Create LLD document via POST /user/LowleveldesigndocCRUD/
 */
export async function createLLD(payload: LLDPayload): Promise<any> {
  return fetchFromApi('/user/LowleveldesigndocCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update LLD document via PUT /user/LowleveldesigndocCRUD/
 */
export async function updateLLD(id: number | string, payload: LLDPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  return fetchFromApi('/user/LowleveldesigndocCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payloadWithId),
  });
}

/**
 * Delete LLD document via DELETE /user/LowleveldesigndocCRUD/?id={id}
 */
export async function deleteLLD(id: number | string): Promise<any> {
  return fetchFromApi(`/user/LowleveldesigndocCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}
