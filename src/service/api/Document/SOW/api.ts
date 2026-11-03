import { fetchFromApi } from '@/service/apiClient';

export interface SOWInScopeItem {
  Module: string;
  Description: string;
}

export interface SOWOutScopeItem {
  Description: string;
}

export interface SOWDeliverableItem {
  Deliverable: string;
}

export interface SOWTermCondition {
  Term: string;
}

export interface SOWPaymentScheduleItem {
  Milestone: string;
  Percentage: number;
  Amount: number;
}

export interface SOWOverall {
  Objective: string;
  Assumptions: string[];
}

export interface SOWPayload {
  id?: number;
  Organization_Id?: number;
  Deal_Id?: number | null;
  Account_Id?: number | null;
  Project_Name: string;
  Project_Code: string;
  Customer_Name: string;
  Contact_Person: string;
  Email: string;
  Phone: string;
  Project_Manager: string;
  Start_Date: string;
  Planned_End_Date: string;
  Project_Location: string;
  Currency: string;
  In_Scope: SOWInScopeItem[];
  Out_Scope: SOWOutScopeItem[];
  Key_Deliverables: SOWDeliverableItem[];
  Project_Duration: number;
  Project_Duration_Unit: string;
  Payment_Terms: string;
  Terms_Conditions: SOWTermCondition[];
  Payment_Schedule: SOWPaymentScheduleItem[];
  Prepared_By: string;
  Document_Date: string;
  Overall_SOW: SOWOverall;
  Document_Version: string;
  Status: string;
  Created_By?: number;
  Updated_By?: number;
}

/**
 * Fetch paginated list of SOW documents via /user/StatementofworkdocumentList/
 */
export async function fetchSOWList(createdBy: number | string): Promise<{ count: number; results: any[] }> {
  return fetchFromApi(`/user/StatementofworkdocumentList/?Created_By=${createdBy}`, {
    method: 'GET',
  });
}

/**
 * Create a new SOW document via /user/StatementofworkdocumentCRUD/ (POST)
 */
export async function createSOW(payload: SOWPayload): Promise<any> {
  return fetchFromApi('/user/StatementofworkdocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update an existing SOW document via /user/StatementofworkdocumentCRUD/?id={id} (PUT)
 */
export async function updateSOW(id: number | string, payload: SOWPayload): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  return fetchFromApi(`/user/StatementofworkdocumentCRUD/?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(payloadWithId),
  });
}

/**
 * Delete an SOW document via /user/StatementofworkdocumentCRUD/?id={id} (DELETE)
 */
export async function deleteSOW(id: number | string): Promise<any> {
  return fetchFromApi(`/user/StatementofworkdocumentCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}
