import { fetchFromApi } from '@/service/apiClient';

export interface ApplicationdeploymentrequestcrudPostPayload {
  Request_Number?: string;
  Requested_By?: number;
  Department?: string;
  Request_Date?: string;
  Required_Date?: string;
  Deployment_Type?: string;
  Priority?: string;
  Environment?: string;
  Change_Type?: string;
  ReportingManager_Id?: number;
  ReportingManager_Name?: string;
  Deployment_For?: string;
  Purpose_Justification?: string;
  Application_Name?: string;
  Application_Version?: string;
  Application_Owner?: number;
  Application_Type?: string;
  Repository_Source?: string;
  Artifact_Package?: string;
  Database_Changes?: boolean;
  Target_Environment?: string;
  Server_Cluster?: string;
  Deployment_Window?: string;
  Estimated_Downtime?: number;
  Rollback_Plan?: string;
  Dependencies?: string;
  Notes?: string;
  Status?: string;
  Created_By?: number;
  Updated_By?: number;
  Supporting_Document?: any[];
}

export interface ApplicationdeploymentrequestcrudPutPayload {
  id?: number;
  ApplicationDeploymentRequest_Id?: string;
  Request_Number?: string;
  Department?: string;
  Request_Date?: string;
  Required_Date?: string;
  Deployment_Type?: string;
  Priority?: string;
  Environment?: string;
  Change_Type?: string;
  ReportingManager_Name?: string;
  Deployment_For?: string;
  Purpose_Justification?: string;
  Application_Name?: string;
  Application_Version?: string;
  Application_Type?: string;
  Repository_Source?: string;
  Artifact_Package?: string;
  Database_Changes?: boolean;
  Database_Script?: any;
  Target_Environment?: string;
  Server_Cluster?: string;
  Deployment_Window?: string;
  Estimated_Downtime?: number;
  Rollback_Plan?: string;
  Dependencies?: string;
  Notes?: string;
  Status?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Organization_Id?: any;
  Requested_By?: number;
  ReportingManager_Id?: number;
  Application_Owner?: number;
  Created_By?: number;
  Updated_By?: number;
  Supporting_Document?: any[];
}

export interface ApplicationdeploymentrequestlistPayload {
  id?: number;
  ApplicationDeploymentRequest_Id?: string;
  Request_Number?: string;
  Department?: string;
  Request_Date?: string;
  Required_Date?: string;
  Deployment_Type?: string;
  Priority?: string;
  Environment?: string;
  Change_Type?: string;
  ReportingManager_Name?: string;
  Deployment_For?: string;
  Purpose_Justification?: string;
  Application_Name?: string;
  Application_Version?: string;
  Application_Type?: string;
  Repository_Source?: string;
  Artifact_Package?: string;
  Database_Changes?: boolean;
  Database_Script?: any;
  Target_Environment?: string;
  Server_Cluster?: string;
  Deployment_Window?: string;
  Estimated_Downtime?: number;
  Rollback_Plan?: string;
  Dependencies?: string;
  Notes?: string;
  Status?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Organization_Id?: any;
  Requested_By?: number;
  ReportingManager_Id?: number;
  Application_Owner?: number;
  Created_By?: number;
  Updated_By?: number;
  Supporting_Document?: any[];
}

export interface ApplicationdeploymentrequestwithoutpaginationPayload {
  id?: number;
  ApplicationDeploymentRequest_Id?: string;
  Request_Number?: string;
  Department?: string;
  Request_Date?: string;
  Required_Date?: string;
  Deployment_Type?: string;
  Priority?: string;
  Environment?: string;
  Change_Type?: string;
  ReportingManager_Name?: string;
  Deployment_For?: string;
  Purpose_Justification?: string;
  Application_Name?: string;
  Application_Version?: string;
  Application_Type?: string;
  Repository_Source?: string;
  Artifact_Package?: string;
  Database_Changes?: boolean;
  Database_Script?: any;
  Target_Environment?: string;
  Server_Cluster?: string;
  Deployment_Window?: string;
  Estimated_Downtime?: number;
  Rollback_Plan?: string;
  Dependencies?: string;
  Notes?: string;
  Status?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Organization_Id?: any;
  Requested_By?: number;
  ReportingManager_Id?: number;
  Application_Owner?: number;
  Created_By?: number;
  Updated_By?: number;
  Supporting_Document?: any[];
}

export interface ApplicationdeploymentrequestsearchPayload {
  id?: number;
  ApplicationDeploymentRequest_Id?: string;
  Request_Number?: string;
  Department?: string;
  Request_Date?: string;
  Required_Date?: string;
  Deployment_Type?: string;
  Priority?: string;
  Environment?: string;
  Change_Type?: string;
  ReportingManager_Name?: string;
  Deployment_For?: string;
  Purpose_Justification?: string;
  Application_Name?: string;
  Application_Version?: string;
  Application_Type?: string;
  Repository_Source?: string;
  Artifact_Package?: string;
  Database_Changes?: boolean;
  Database_Script?: any;
  Target_Environment?: string;
  Server_Cluster?: string;
  Deployment_Window?: string;
  Estimated_Downtime?: number;
  Rollback_Plan?: string;
  Dependencies?: string;
  Notes?: string;
  Status?: string;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Organization_Id?: any;
  Requested_By?: number;
  ReportingManager_Id?: number;
  Application_Owner?: number;
  Created_By?: number;
  Updated_By?: number;
  Supporting_Document?: any[];
}

export interface ApplicationdeploymentrequestfilterPayload {
  ApplicationDeploymentRequest_Id?: string;
  Request_Number?: string;
  Department?: string;
  Deployment_Type?: string;
  Priority?: string;
  Environment?: string;
  Change_Type?: string;
  Deployment_For?: string;
  Application_Name?: string;
  Application_Version?: string;
  Application_Type?: string;
  Target_Environment?: string;
  Server_Cluster?: string;
  Status?: string;
  Created_Date?: any[];
  page?: number;
}

export interface ApplicationdeploymentapprovalcrudPostPayload {
  ApplicationDeploymentRequest_Id?: number;
  Approval_Level?: number;
  Approver_Id?: number;
  Approver_Name?: string;
  Status?: string;
  Comments?: string;
  Approved_Date?: any;
}


/**
 * Endpoint: POST /user/ApplicationDeploymentRequestCRUD
 */
export async function applicationdeploymentrequestcrudPost(payload?: ApplicationdeploymentrequestcrudPostPayload): Promise<any> {
  return fetchFromApi('/user/ApplicationDeploymentRequestCRUD', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: PUT /user/ApplicationDeploymentRequestCRUD
 */
export async function applicationdeploymentrequestcrudPut(payload?: ApplicationdeploymentrequestcrudPutPayload): Promise<any> {
  return fetchFromApi('/user/ApplicationDeploymentRequestCRUD', {
    method: 'PUT',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/ApplicationDeploymentRequestList
 */
export async function applicationdeploymentrequestlist(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ApplicationDeploymentRequestList${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ApplicationDeploymentRequestwithoutpagination
 */
export async function applicationdeploymentrequestwithoutpagination(id?: string | number): Promise<any> {
  const path = id ? `/user/ApplicationDeploymentRequestwithoutpagination?id=${id}` : '/user/ApplicationDeploymentRequestwithoutpagination';
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ApplicationDeploymentRequestSearch
 */
export async function applicationdeploymentrequestsearch(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ApplicationDeploymentRequestSearch${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /user/ApplicationDeploymentRequestFilter
 */
export async function applicationdeploymentrequestfilter(payload?: ApplicationdeploymentrequestfilterPayload): Promise<any> {
  return fetchFromApi('/user/ApplicationDeploymentRequestFilter', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: POST /user/ApplicationDeploymentApprovalCRUD
 */
export async function applicationdeploymentapprovalcrudPost(payload?: ApplicationdeploymentapprovalcrudPostPayload): Promise<any> {
  return fetchFromApi('/user/ApplicationDeploymentApprovalCRUD', {
    method: 'POST',
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Endpoint: GET /user/ApplicationDeploymentApprovalCRUD
 */
export async function applicationdeploymentapprovalcrudGet(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ApplicationDeploymentApprovalCRUD${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ApplicationDeploymentApprovalList
 */
export async function applicationdeploymentapprovallist(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ApplicationDeploymentApprovalList${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ApplicationDeploymentApprovalwithoutpagination
 */
export async function applicationdeploymentapprovalwithoutpagination(id?: string | number): Promise<any> {
  const path = id ? `/user/ApplicationDeploymentApprovalwithoutpagination?id=${id}` : '/user/ApplicationDeploymentApprovalwithoutpagination';
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /user/ApplicationDeploymentRequestSummary
 */
export async function applicationdeploymentrequestsummary(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/user/ApplicationDeploymentRequestSummary${query}`, {
    method: 'GET',
  });
}

