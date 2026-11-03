import { fetchFromApi } from '@/service/apiClient';

// Interfaces matching backend payload models
export interface ApiAssignedUser {
  User_Id: number;
  User_Name: string;
}

export interface ApiTerritory {
  id?: number;
  Organization_Id?: number;
  TerritoryName: string;
  Territery_Categeroy: string; // spelled with e/o in Postman contract: Territery_Categeroy
  Manager_Name?: string;
  TerritoryManager?: number;
  TerritoryType?: string; // e.g. "Parent", "Sub"
  ParentTerritory?: number | null;
  ParentTerritory_Name?: string;
  TerritoryOperation?: string;
  AssignAreas?: string;
  Country: string;
  State?: string;
  City?: string;
  Assign_Users?: ApiAssignedUser[];
  Reporting_To?: number;
  Reporting_To_Name?: string;
  Region?: string;
  TimeZone?: string;
  Description?: string;
  Is_Active?: boolean;
  PinCodes?: string[];
  Cities?: string[];
  IndustrySegment?: string;
  RevenueRange?: string;
  ProductLine?: string;
  CustomerType?: string;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
  Updated_Date?: string;
}

export interface ApiTerritoryAssignment {
  id?: number;
  Organization_Id?: number;
  Territory: number; // territory ID
  AssignedUsername?: string | null;
  AssignedUseremail?: string | null;
  AssignedUser: number; // user ID
  Assignment_type: string; // e.g. "Primary Assignment", "Exclusive", "Shared", "Backup"
  Start_date: string;
  End_date?: string | null;
  Is_active?: boolean;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
  Updated_Date?: string;
}

export interface ApiTerritoryRule {
  id?: number;
  Organization_Id?: number;
  Rule_Name: string;
  Description?: string;
  Territory: number; // territory ID
  Conditions: Record<string, any>; // conditions dictionary
  Priority: number;
  Is_Active?: boolean;
  Valid_From?: string;
  Valid_To?: string;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
  Updated_Date?: string;
}

export interface ApiTerritoryQuota {
  id?: number;
  Organization_Id?: number;
  Territory: number; // territory ID
  Period: string; // e.g. "Quarterly", "Monthly"
  Year: string;
  Quarter?: string;
  Revenue_Target: number;
  Lead_Target: number;
  Opportunity_Target: number;
  Conversion_Target: number;
  Revenue_Achieved?: number;
  Lead_Achieved?: number;
  Opportunity_Achieved?: number;
  Conversion_Achieved?: number;
  Notes?: string;
  Is_Active?: boolean;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
  Updated_Date?: string;
}

// ----------------------------------------------------
// TERRITORY API METHODS
// ----------------------------------------------------

export async function fetchTerritoryList(page?: number): Promise<any> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/TerritoryManagementList/${query}`, {
    method: 'GET',
  });
}

export async function fetchTerritoryFullList(): Promise<any> {
  return fetchFromApi('/user/TerritoryManagementFullList/', {
    method: 'GET',
  });
}

export async function searchTerritories(search: string): Promise<any> {
  return fetchFromApi(`/user/TerritoryManagementSearchnew/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

export async function filterTerritories(payload: {
  Region?: string;
  Status?: string;
  TerritoryType?: string;
  page?: number;
}): Promise<any> {
  return fetchFromApi('/user/TerritoryManagementFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTerritoryKPIs(): Promise<any> {
  return fetchFromApi('/user/TerritoryKPI/', {
    method: 'POST',
  });
}

export async function createTerritory(payload: ApiTerritory): Promise<any> {
  return fetchFromApi('/user/TerritoryManagementCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTerritory(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryManagementCRUD/?id=${id}`, {
    method: 'GET',
  });
}

export async function updateTerritory(payload: ApiTerritory): Promise<any> {
  return fetchFromApi('/user/TerritoryManagementCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function patchTerritory(payload: Partial<ApiTerritory>): Promise<any> {
  return fetchFromApi('/user/TerritoryManagementCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteTerritory(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryManagementCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

// ----------------------------------------------------
// HIERARCHY TREE API METHODS
// ----------------------------------------------------

export async function fetchTerritoryHierarchyTree(): Promise<any> {
  return fetchFromApi('/user/TerritoryHierarchyTree/', {
    method: 'POST',
  });
}

export async function fetchTerritoryDetails(id: number): Promise<any> {
  return fetchFromApi('/user/TerritoryDetailsView/', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function moveTerritory(payload: {
  territory_id: number;
  new_parent_id: number | null;
  Updated_By: number;
}): Promise<any> {
  return fetchFromApi('/user/MoveTerritoryView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function splitTerritory(payload: {
  territory_id: number;
  created_by: number;
  updated_by: number;
  children: { territory_name: string }[];
}): Promise<any> {
  return fetchFromApi('/user/SplitTerritory/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function mergeTerritories(payload: {
  source_territories: number[];
  new_territory_name: string;
  new_territory_operation: string;
  created_by: number;
  updated_by: number;
}): Promise<any> {
  return fetchFromApi('/user/MergeTerritory/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// ASSIGNMENT API METHODS
// ----------------------------------------------------

export async function createAssignment(payload: ApiTerritoryAssignment): Promise<any> {
  return fetchFromApi('/user/TerritoryAssignmentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAssignment(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryAssignmentCRUD/?id=${id}`, {
    method: 'GET',
  });
}

export async function updateAssignment(payload: ApiTerritoryAssignment): Promise<any> {
  return fetchFromApi('/user/TerritoryAssignmentCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function patchAssignment(payload: Partial<ApiTerritoryAssignment>): Promise<any> {
  return fetchFromApi('/user/TerritoryAssignmentCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAssignment(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryAssignmentCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

export async function fetchAssignmentListView(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryAssignmentListView/?id=${id}`, {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

export async function searchAssignments(search: string): Promise<any> {
  return fetchFromApi(`/user/TerritoryAssignmentSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

export async function fetchAssignmentsList(page?: number): Promise<any> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/TerritoryAssignmentList/${query}`, {
    method: 'GET',
  });
}

export async function fetchAssignmentsWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/TerritoryAssignmentWithoutPagination/', {
    method: 'GET',
  });
}

export async function filterAssignments(payload: {
  AssignedUser?: number;
  Territory?: number;
  Assignment_type?: string;
  Is_active?: boolean;
  Created_Date?: string[];
  page?: number;
}): Promise<any> {
  return fetchFromApi('/user/TerritoryAssignmentFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// RULE API METHODS
// ----------------------------------------------------

export async function createRule(payload: ApiTerritoryRule): Promise<any> {
  return fetchFromApi('/user/TerritoryRuleCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getRule(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryRuleCRUD/?id=${id}`, {
    method: 'GET',
  });
}

export async function updateRule(payload: ApiTerritoryRule): Promise<any> {
  return fetchFromApi('/user/TerritoryRuleCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function patchRule(payload: Partial<ApiTerritoryRule>): Promise<any> {
  return fetchFromApi('/user/TerritoryRuleCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteRule(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryRuleCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

export async function searchRules(search: string): Promise<any> {
  return fetchFromApi(`/user/TerritoryRuleSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

export async function filterRules(payload: {
  Rule_Name?: string;
  Is_Active?: boolean;
  Territory?: number;
  Created_Date?: string[];
  page?: number;
}): Promise<any> {
  return fetchFromApi('/user/TerritoryRuleFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchRulesList(page?: number): Promise<any> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/TerritoryRuleList/${query}`, {
    method: 'GET',
  });
}

export async function fetchRulesWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/TerritoryRuleWithoutPagination/', {
    method: 'GET',
  });
}

// ----------------------------------------------------
// QUOTA API METHODS
// ----------------------------------------------------

export async function createQuota(payload: ApiTerritoryQuota): Promise<any> {
  return fetchFromApi('/user/TerritoryQuotaCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getQuota(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryQuotaCRUD/?id=${id}`, {
    method: 'GET',
  });
}

export async function updateQuota(payload: ApiTerritoryQuota): Promise<any> {
  return fetchFromApi('/user/TerritoryQuotaCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function patchQuota(payload: Partial<ApiTerritoryQuota>): Promise<any> {
  return fetchFromApi('/user/TerritoryQuotaCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteQuota(id: number): Promise<any> {
  return fetchFromApi(`/user/TerritoryQuotaCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

export async function searchQuotas(search: string): Promise<any> {
  return fetchFromApi(`/user/TerritoryQuotaSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

export async function filterQuotas(payload: {
  Territory?: number;
  Is_Active?: boolean;
  page?: number;
}): Promise<any> {
  return fetchFromApi('/user/TerritoryQuotaFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchQuotasList(page?: number): Promise<any> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/TerritoryQuotaList/${query}`, {
    method: 'GET',
  });
}

export async function fetchQuotasWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/TerritoryQuotaWithoutPagination/', {
    method: 'GET',
  });
}

export async function fetchQuotaPerformanceDashboard(payload: {
  territory_id?: number | null;
  period: [string, string];
}): Promise<any> {
  return fetchFromApi('/user/TerritoryQuotaPerformanceDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchQuotaPerformanceTable(payload: {
  territory_id?: number | null;
  period: [string, string];
}): Promise<any> {
  return fetchFromApi('/user/TerritoryQuotaPerformanceTable/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchQuotaSummary(): Promise<any> {
  return fetchFromApi('/user/TerritoryQuotaSummary/', {
    method: 'POST',
  });
}

export async function fetchTerritoryDashboardView(payload: {
  period: [string, string];
}): Promise<any> {
  return fetchFromApi('/user/TerritoryDashboardView/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchTerritoryPerformanceDashboard(payload: {
  period: [string, string];
}): Promise<any> {
  return fetchFromApi('/user/TerritoryPerformanceDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

