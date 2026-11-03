import { fetchFromApi } from '@/service/apiClient';

export interface RolelistPayload {
  Organization_Id?: number;
  Name?: string;
  FirstName?: string;
  LastName?: string;
  Gender?: string;
  Company_Name?: string;
  MobileCountry_Id?: string;
  Mobile_Number?: string;
  AlternatePhoneNo?: string;
  Email_Id?: string;
  Job_Title?: string;
  Department?: string;
  DateOfBirth?: string;
  Address?: string;
  Country?: string;
  State?: string;
  City?: string;
  Pincode?: string;
  Industry_Type?: string;
  LeadSource?: string;
  Contact_Owner?: string;
  Contact_Owner_Id?: number;
  Reportingto_Id?: number;
  Tags?: string;
  Description?: string;
  No_of_Calls?: string;
  Last_Call_Date?: string;
  Last_Called_By?: string;
  No_Of_Days?: string;
  Lead_Flag?: boolean;
  Archive?: boolean;
  Callconnected?: boolean;
  Active_Flag?: boolean;
  Contact_Json?: any;
  Created_By?: number;
  Updated_By?: number;
}


export interface RoleFilterPayload {
  Role_Id?: string;
  Role_Name?: string;
  Description?: string;
  Role_Type?: string;
  Status?: string;
  page: number;
}

/**
 * Endpoint: GET /useradmin/Rolelist
 */
export async function rolelist(params?: Record<string, string | number>): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
  return fetchFromApi(`/useradmin/Rolelist/${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /useradmin/Rolelistwithpagination/
 */
export async function fetchRoleListWithoutPagination(): Promise<any> {
  return fetchFromApi('/useradmin/Rolelistwithpagination/', {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /useradmin/userrolesearch/
 */
export async function searchRoles(search: string, page: number): Promise<any> {
  const query = new URLSearchParams({ search, page: String(page) }).toString();
  return fetchFromApi(`/useradmin/userrolesearch/?${query}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /useradmin/RoleFilter/
 */
export async function filterRoles(payload: RoleFilterPayload): Promise<any> {
  return fetchFromApi('/useradmin/RoleFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Endpoint: GET /useradmin/RoleDashboardCards
 */
export async function roledashboardcards(id?: string | number): Promise<any> {
  const path = id ? `/useradmin/RoleDashboardCards/?id=${id}` : '/useradmin/RoleDashboardCards/';
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /useradmin/RoleCRUD/?Role_Id=X
 */
export async function getRoleDetails(roleId: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/RoleCRUD/?Role_Id=${roleId}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /useradmin/RoleCRUD/
 */
export async function createRole(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/RoleCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Endpoint: PUT /useradmin/RoleCRUD/?Role_Id=X
 */
export async function updateRoleApi(roleId: string | number, payload: any): Promise<any> {
  return fetchFromApi(`/useradmin/RoleCRUD/?Role_Id=${roleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Endpoint: DELETE /useradmin/RoleCRUD/?Role_Id=X
 */
export async function deleteRoleApi(roleId: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/RoleCRUD/?Role_Id=${roleId}`, {
    method: 'DELETE',
  });
}

/**
 * Endpoint: GET /useradmin/Formpermisionlists/
 */
export async function fetchFormPermissions(): Promise<any> {
  return fetchFromApi('/useradmin/Formpermisionlists/', {
    method: 'GET',
  });
}

/**
 * Endpoint: GET /useradmin/Formpermissioncrud/?id=X
 */
export async function fetchFormPermissionById(id: string | number): Promise<any> {
  return fetchFromApi(`/useradmin/Formpermissioncrud/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Endpoint: POST /useradmin/Formpermissioncrud/
 */
export async function createFormPermission(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/Formpermissioncrud/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Endpoint: PUT /useradmin/Formpermissioncrud/
 */
export async function updateFormPermission(payload: any): Promise<any> {
  return fetchFromApi('/useradmin/Formpermissioncrud/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Endpoint: POST /useradmin/Formpermissionfilter/
 * Filter by ModuleName (e.g. 'RolePermissions')
 * NOTE: Backend only supports ModuleName key — filter by FormName client-side after fetch.
 */
export async function filterFormPermissions(moduleName: string): Promise<any> {
  return fetchFromApi('/useradmin/Formpermissionfilter/', {
    method: 'POST',
    body: JSON.stringify({ ModuleName: moduleName }),
  });
}

/**
 * Endpoint: GET https://backend.crmfarm.in/crmfarmsa/superadmin/PlanMenuTreeAPIView/?Plan_Id=X&Product=Y
 */
export async function fetchPlanMenuTree(planId: string, product: string = 'crm'): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/PlanMenuTreeAPIView/?Plan_Id=${planId}&Product=${product}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch PlanMenuTree: ${response.statusText}`);
  }
  return response.json();
}

export function transformPlanMenuTreeToPermissions(menuTree: any[]): any[] {
  const list: any[] = [];
  if (!Array.isArray(menuTree)) return list;

  const traverse = (item: any, moduleName: string, category: string) => {
    const children = Array.isArray(item.children) ? item.children : [];

    if (children.length === 0) {
      const formId = item.code || item.name;
      list.push({
        id: item.id,
        FormId: formId,
        ModuleName: moduleName || item.name,
        FormName: item.name,
        PermissionName: { view: true },
        Field_Name: { category: category || moduleName || 'General' },
        AllPermission: false,
      });
    } else {
      if (item.menu_type === 'submodule' || item.menu_type === 'form') {
        const formId = item.code || item.name;
        list.push({
          id: item.id,
          FormId: formId,
          ModuleName: moduleName || item.name,
          FormName: item.name,
          PermissionName: { view: true },
          Field_Name: { category: category || moduleName || 'General' },
          AllPermission: false,
        });
      }
      children.forEach((child: any) => {
        traverse(child, item.name, category || item.name);
      });
    }
  };

  menuTree.forEach((topModule: any) => {
    const categoryName = topModule.name || 'General';
    const children = Array.isArray(topModule.children) ? topModule.children : [];
    if (children.length > 0) {
      children.forEach((child: any) => {
        traverse(child, topModule.name, categoryName);
      });
    } else {
      list.push({
        id: topModule.id,
        FormId: topModule.code || topModule.name,
        ModuleName: topModule.name,
        FormName: topModule.name,
        PermissionName: { view: true },
        Field_Name: { category: categoryName },
        AllPermission: false,
      });
    }
  });

  const uniqueMap = new Map<string, any>();
  list.forEach((fp) => {
    if (!uniqueMap.has(fp.FormId)) {
      uniqueMap.set(fp.FormId, fp);
    }
  });

  return Array.from(uniqueMap.values());
}

