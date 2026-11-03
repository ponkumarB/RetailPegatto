import { fetchFromApi } from '@/service/apiClient';

/**
 * Generic paginated response interface.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==========================================
// 1. ASSET CATEGORY ENDPOINTS
// ==========================================

export interface AssetCategory {
  id: number;
  Category_Name: string;
  Category_Code?: string;
  Description?: string;
  Is_Active: boolean;
  Is_Deleted: boolean;
  Created_Date: string;
  Updated_Date: string;
  Created_By: number;
  Updated_By: number;
}

export interface CreateAssetCategoryPayload {
  Category_Name: string;
  Description?: string;
  Is_Active?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

export interface UpdateAssetCategoryPayload {
  id: number;
  Category_Name?: string;
  Category_Code?: string;
  Description?: string;
  Is_Active?: boolean;
  Is_Deleted?: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface PatchAssetCategoryPayload {
  id: number;
  Category_Name?: string;
}

/**
 * Create a new Asset Category.
 */
export async function createAssetCategory(payload: CreateAssetCategoryPayload): Promise<AssetCategory> {
  return fetchFromApi('/user/AssetCategoryCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get an Asset Category by its ID.
 */
export async function fetchAssetCategoryById(id: number): Promise<AssetCategory> {
  return fetchFromApi(`/user/AssetCategoryCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing Asset Category.
 */
export async function updateAssetCategory(payload: UpdateAssetCategoryPayload): Promise<AssetCategory> {
  return fetchFromApi('/user/AssetCategoryCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Partially update an Asset Category.
 */
export async function patchAssetCategory(payload: PatchAssetCategoryPayload): Promise<AssetCategory> {
  return fetchFromApi('/user/AssetCategoryCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an Asset Category by ID.
 */
export async function deleteAssetCategory(id: number): Promise<void> {
  return fetchFromApi(`/user/AssetCategoryCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * List Asset Categories with Pagination.
 */
export async function fetchAssetCategories(page?: number): Promise<PaginatedResponse<AssetCategory>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/AssetCategoryListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Search Asset Categories.
 */
export async function searchAssetCategories(search: string): Promise<AssetCategory[]> {
  return fetchFromApi(`/user/AssetCategorySearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * List Asset Categories without Pagination.
 * Note: The Postman collection hits `/user/AssetVendorlistwithoutpaginaton/` for this request, 
 * but we provide `/user/AssetCategorylistwithoutpaginaton/` as the default correct path and fall back or allow parameter override.
 */
export async function fetchAssetCategoriesWithoutPagination(path: string = '/user/AssetCategorylistwithoutpaginaton/'): Promise<AssetCategory[]> {
  return fetchFromApi(path, {
    method: 'GET',
  });
}

/**
 * Filter Asset Categories.
 */
export interface AssetCategoryFilterPayload {
  Category_Name?: string;
  Category_Code?: string;
  Date?: [string, string];
  page?: number;
}
export async function filterAssetCategories(payload: AssetCategoryFilterPayload): Promise<AssetCategory[] | PaginatedResponse<AssetCategory>> {
  return fetchFromApi('/user/AssetCategoryFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// 2. ASSET SUB-CATEGORY ENDPOINTS
// ==========================================

export interface AssetSubCategory {
  id: number;
  Category_Id: number;
  SubCategory_Name: string;
  SubCategory_Code?: string;
  Description?: string;
  Is_Active: boolean;
  Is_Deleted: boolean;
  Created_Date: string;
  Updated_Date: string;
  Created_By: number;
  Updated_By: number;
}

export interface CreateAssetSubCategoryPayload {
  Category_Id: number;
  SubCategory_Name: string;
  Description?: string;
  Is_Active?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

export interface UpdateAssetSubCategoryPayload {
  id: number;
  Category_Id?: number;
  SubCategory_Name?: string;
  SubCategory_Code?: string;
  Description?: string;
  Is_Active?: boolean;
  Is_Deleted?: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface PatchAssetSubCategoryPayload {
  id: number;
  SubCategory_Name?: string;
}

/**
 * Create a new Asset Sub Category.
 */
export async function createAssetSubCategory(payload: CreateAssetSubCategoryPayload): Promise<AssetSubCategory> {
  return fetchFromApi('/user/AssetSubCategoryCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get an Asset Sub Category by ID.
 */
export async function fetchAssetSubCategoryById(id: number): Promise<AssetSubCategory> {
  return fetchFromApi(`/user/AssetSubCategoryCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing Asset Sub Category.
 */
export async function updateAssetSubCategory(payload: UpdateAssetSubCategoryPayload): Promise<AssetSubCategory> {
  return fetchFromApi('/user/AssetSubCategoryCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Partially update an Asset Sub Category.
 */
export async function patchAssetSubCategory(payload: PatchAssetSubCategoryPayload): Promise<AssetSubCategory> {
  return fetchFromApi('/user/AssetSubCategoryCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an Asset Sub Category by ID.
 */
export async function deleteAssetSubCategory(id: number): Promise<void> {
  return fetchFromApi(`/user/AssetSubCategoryCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * List Asset Sub Categories with Pagination.
 */
export async function fetchAssetSubCategories(page?: number): Promise<PaginatedResponse<AssetSubCategory>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/AssetSubCategoryListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Search Asset Sub Categories.
 */
export async function searchAssetSubCategories(search: string): Promise<AssetSubCategory[]> {
  return fetchFromApi(`/user/AssetSubCategorySearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * List Asset Sub Categories without Pagination.
 */
export async function fetchAssetSubCategoriesWithoutPagination(): Promise<AssetSubCategory[]> {
  return fetchFromApi('/user/AssetSubCategorylistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Filter Asset Sub Categories.
 */
export interface AssetSubCategoryFilterPayload {
  SubCategory_Name?: string;
}
export async function filterAssetSubCategories(payload: AssetSubCategoryFilterPayload): Promise<AssetSubCategory[]> {
  return fetchFromApi('/user/AssetSubCategoryFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch Asset Sub Categories by Category ID (Dropdown API).
 */
export async function fetchAssetSubCategoriesByCategory(categoryId: number): Promise<AssetSubCategory[]> {
  return fetchFromApi(`/user/AssetCategoryDropdownAPI/?Category_Id=${categoryId}`, {
    method: 'GET',
  });
}


// ==========================================
// 3. ASSET VENDOR ENDPOINTS
// ==========================================

export interface AssetVendor {
  id: number;
  Vendor_Name: string;
  Contact_Person?: string;
  Email?: string;
  Mobile_Number?: string;
  GST_Number?: string;
  Address?: string;
  Is_Active: boolean;
  Is_Deleted: boolean;
  Created_Date: string;
  Updated_Date: string;
  Created_By: number;
  Updated_By: number;
}

export interface CreateAssetVendorPayload {
  Vendor_Name: string;
  Contact_Person?: string;
  Email?: string;
  Mobile_Number?: string;
  GST_Number?: string;
  Address?: string;
  Is_Active?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

export interface UpdateAssetVendorPayload {
  id: number;
  Vendor_Name?: string;
  Contact_Person?: string;
  Email?: string;
  Mobile_Number?: string;
  GST_Number?: string;
  Address?: string;
  Is_Active?: boolean;
  Is_Deleted?: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface PatchAssetVendorPayload {
  id: number;
  Vendor_Name?: string;
}

/**
 * Create a new Asset Vendor.
 */
export async function createAssetVendor(payload: CreateAssetVendorPayload): Promise<AssetVendor> {
  return fetchFromApi('/user/AssetVendorCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get an Asset Vendor by ID.
 */
export async function fetchAssetVendorById(id: number): Promise<AssetVendor> {
  return fetchFromApi(`/user/AssetVendorCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing Asset Vendor.
 */
export async function updateAssetVendor(payload: UpdateAssetVendorPayload): Promise<AssetVendor> {
  return fetchFromApi('/user/AssetVendorCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Partially update an Asset Vendor.
 */
export async function patchAssetVendor(payload: PatchAssetVendorPayload): Promise<AssetVendor> {
  return fetchFromApi('/user/AssetVendorCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an Asset Vendor by ID.
 */
export async function deleteAssetVendor(id: number): Promise<void> {
  return fetchFromApi(`/user/AssetVendorCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * List Asset Vendors with Pagination.
 */
export async function fetchAssetVendors(page?: number): Promise<PaginatedResponse<AssetVendor>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/AssetVendorListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Search Asset Vendors.
 */
export async function searchAssetVendors(search: string): Promise<AssetVendor[]> {
  return fetchFromApi(`/user/AssetVendorSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * List Asset Vendors without Pagination.
 */
export async function fetchAssetVendorsWithoutPagination(): Promise<AssetVendor[]> {
  return fetchFromApi('/user/AssetVendorlistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Filter Asset Vendors.
 */
export interface AssetVendorFilterPayload {
  Contact_Person?: string;
  Vendor_Name?: string;
  Email?: string;
  Mobile_Number?: string;
  Address?: string;
  Created_By?: number;
  fromdate?: string;
  todate?: string;
}
export async function filterAssetVendors(payload: AssetVendorFilterPayload): Promise<AssetVendor[]> {
  return fetchFromApi('/user/AssetVendorFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// 4. ASSET MASTER ENDPOINTS
// ==========================================

export interface AssetMaster {
  id: number;
  Asset_Code: string;
  Asset_Name: string;
  Category_Id: number;
  SubCategory_Id: number;
  Vendor_Id: number;
  Brand?: string;
  Model_Number?: string;
  Serial_Number?: string;
  Purchase_Date?: string;
  Invoice_Number?: string;
  PO_Number?: string;
  Purchase_Cost?: number;
  Warranty_Start_Date?: string;
  Warranty_End_Date?: string;
  Current_Employee?: string;
  Current_Department?: string;
  Location?: string;
  Asset_Status?: string;
  Remarks?: string;
  Description?: string;
  IP_Address?: string;
  MAC_Address?: string;
  Operating_System?: string;
  Asset_Value?: string;
  Depreciation_Method?: string;
  Depreciation_Rate?: string;
  Warranty_Expiry_Date?: string;
  Is_Active: boolean;
  Is_Deleted: boolean;
  Created_Date: string;
  Updated_Date: string;
  Created_By: number;
  Updated_By: number;
  Attachfile?: string | null;
  Attachment?: any[];
}

export interface CreateAssetMasterPayload {
  Asset_Name: string;
  Category_Id: number;
  SubCategory_Id: number;
  Vendor_Id: number;
  Brand?: string;
  Model_Number?: string;
  Serial_Number?: string;
  Purchase_Date?: string;
  Invoice_Number?: string;
  PO_Number?: string;
  Purchase_Cost?: number;
  Warranty_Start_Date?: string;
  Warranty_End_Date?: string;
  Current_Employee?: string;
  Current_Department?: string;
  Location?: string;
  Asset_Status?: string;
  Remarks?: string;
  Description?: string;
  IP_Address?: string;
  MAC_Address?: string;
  Operating_System?: string;
  Asset_Value?: string;
  Depreciation_Method?: string;
  Depreciation_Rate?: string;
  Warranty_Expiry_Date?: string;
  Is_Active?: boolean;
  Created_By?: number;
  Updated_By?: number;
  Attachment?: any[];
}

export interface UpdateAssetMasterPayload {
  id: number;
  Asset_Code?: string;
  Asset_Name?: string;
  Category_Id?: number;
  SubCategory_Id?: number;
  Vendor_Id?: number;
  Brand?: string;
  Model_Number?: string;
  Serial_Number?: string;
  Purchase_Date?: string;
  Invoice_Number?: string;
  PO_Number?: string;
  Purchase_Cost?: number;
  Warranty_Start_Date?: string;
  Warranty_End_Date?: string;
  Current_Employee?: string;
  Current_Department?: string;
  Location?: string;
  Asset_Status?: string;
  Remarks?: string;
  Description?: string;
  IP_Address?: string;
  MAC_Address?: string;
  Operating_System?: string;
  Asset_Value?: string;
  Depreciation_Method?: string;
  Depreciation_Rate?: string;
  Warranty_Expiry_Date?: string;
  Is_Active?: boolean;
  Is_Deleted?: boolean;
  Created_By?: number;
  Updated_By?: number;
  Attachfile?: string | null;
  Attachment?: any[];
}

export interface PatchAssetMasterPayload {
  id: number;
  Asset_Code?: string;
  Asset_Name?: string;
}

/**
 * Create a new Asset Master.
 */
export async function createAssetMaster(payload: CreateAssetMasterPayload): Promise<AssetMaster> {
  return fetchFromApi('/user/AssetMasterCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get an Asset Master by ID.
 */
export async function fetchAssetMasterById(id: number): Promise<AssetMaster> {
  return fetchFromApi(`/user/AssetMasterCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing Asset Master.
 */
export async function updateAssetMaster(payload: UpdateAssetMasterPayload): Promise<AssetMaster> {
  return fetchFromApi('/user/AssetMasterCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Partially update an Asset Master.
 */
export async function patchAssetMaster(payload: PatchAssetMasterPayload): Promise<AssetMaster> {
  return fetchFromApi('/user/AssetMasterCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an Asset Master by ID.
 */
export async function deleteAssetMaster(id: number): Promise<void> {
  return fetchFromApi(`/user/AssetMasterCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * List Asset Master with Pagination.
 */
export async function fetchAssetMasterList(page?: number): Promise<PaginatedResponse<AssetMaster>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/AssetMasterListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Search Asset Master.
 */
export async function searchAssetMaster(search: string): Promise<AssetMaster[]> {
  return fetchFromApi(`/user/AssetMasterSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * List Asset Master without Pagination.
 */
export async function fetchAssetMasterWithoutPagination(): Promise<AssetMaster[]> {
  return fetchFromApi('/user/AssetMasterlistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Filter Asset Master.
 */
export interface AssetMasterFilterPayload {
  Asset_Name?: string;
  Asset_Code?: string;
  Brand?: string;
  Location?: string;
  Asset_Status?: string;
  Model_Number?: string;
  Serial_Number?: string;
  Created_By?: number;
  fromdate?: string;
  todate?: string;
}
export async function filterAssetMaster(payload: AssetMasterFilterPayload): Promise<AssetMaster[]> {
  return fetchFromApi('/user/AssetMasterFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// 5. ASSET TRANSACTION ENDPOINTS
// ==========================================

export interface AssetTransaction {
  id: number;
  Asset_Id: number;
  Transaction_Type: string;
  Employee_Name?: string;
  Department?: string;
  Location?: string;
  Transaction_Date?: string;
  Expected_Return?: string;
  Email?: string;
  Mobile_Number?: string;
  Address?: string;
  Cost_Center?: string;
  Remarks?: string;
  Is_Active: boolean;
  Is_Deleted: boolean;
  Created_Date: string;
  Updated_Date: string;
  Created_By: number;
  Updated_By: number;
  Attachfile?: string | null;
}

export interface CreateAssetTransactionPayload {
  Asset_Id: number;
  Transaction_Type: string;
  Employee_Name?: string;
  Department?: string;
  Location?: string;
  Transaction_Date?: string;
  Expected_Return?: string;
  Email?: string;
  Mobile_Number?: string;
  Address?: string;
  Cost_Center?: string;
  Remarks?: string;
  Is_Active?: boolean;
  Created_By?: number;
  Updated_By?: number;
}

export interface UpdateAssetTransactionPayload {
  id: number;
  Asset_Id?: number;
  Transaction_Type?: string;
  Employee_Name?: string;
  Department?: string;
  Location?: string;
  Transaction_Date?: string;
  Expected_Return?: string;
  Email?: string;
  Mobile_Number?: string;
  Address?: string;
  Cost_Center?: string;
  Remarks?: string;
  Is_Active?: boolean;
  Is_Deleted?: boolean;
  Created_By?: number;
  Updated_By?: number;
  Attachfile?: string | null;
}

export interface PatchAssetTransactionPayload {
  id: number;
  Remarks?: string;
}

/**
 * Create a new Asset Transaction (e.g. Allocate, Return).
 */
export async function createAssetTransaction(payload: CreateAssetTransactionPayload): Promise<AssetTransaction> {
  return fetchFromApi('/user/AssetTransactionCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get an Asset Transaction by ID.
 */
export async function fetchAssetTransactionById(id: number): Promise<AssetTransaction> {
  return fetchFromApi(`/user/AssetTransactionCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing Asset Transaction.
 */
export async function updateAssetTransaction(payload: UpdateAssetTransactionPayload): Promise<AssetTransaction> {
  return fetchFromApi('/user/AssetTransactionCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Partially update an Asset Transaction.
 */
export async function patchAssetTransaction(payload: PatchAssetTransactionPayload): Promise<AssetTransaction> {
  return fetchFromApi('/user/AssetTransactionCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an Asset Transaction by ID.
 */
export async function deleteAssetTransaction(id: number): Promise<void> {
  return fetchFromApi(`/user/AssetTransactionCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}


/**
 * List Asset Transactions with Pagination.
 */
export async function fetchAssetTransactions(page?: number): Promise<PaginatedResponse<AssetTransaction>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/AssetTransactionListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Search Asset Transactions.
 */
export async function searchAssetTransactions(search: string): Promise<AssetTransaction[]> {
  return fetchFromApi(`/user/AssetTransactionSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * List Asset Transactions without Pagination.
 */
export async function fetchAssetTransactionsWithoutPagination(): Promise<AssetTransaction[]> {
  return fetchFromApi('/user/AssetTransactionlistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Filter Asset Transactions.
 */
export interface AssetTransactionFilterPayload {
  Employee_Name?: string;
  Department?: string;
  Location?: string;
  Transaction_Type?: string;
  Created_By?: number;
  fromdate?: string;
  todate?: string;
}
export async function filterAssetTransactions(payload: AssetTransactionFilterPayload): Promise<AssetTransaction[]> {
  return fetchFromApi('/user/AssetTransactionFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// 6. ASSET MAINTENANCE ENDPOINTS
// ==========================================

export interface AssetMaintenance {
  id: number;
  Asset_Id: number;
  Vendor_Id: number;
  Issue_Description: string;
  Maintenance_Cost?: number;
  Start_Date?: string;
  End_Date?: string;
  Status?: string;
  Remarks?: string;
  Is_Deleted: boolean;
  Created_Date: string;
  Updated_Date: string;
  Created_By: number;
  Updated_By: number;
}

export interface CreateAssetMaintenancePayload {
  Asset_Id: number;
  Vendor_Id: number;
  Issue_Description: string;
  Maintenance_Cost?: number;
  Start_Date?: string;
  End_Date?: string;
  Status?: string;
  Remarks?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface UpdateAssetMaintenancePayload {
  id: number;
  Asset_Id?: number;
  Vendor_Id?: number;
  Issue_Description?: string;
  Maintenance_Cost?: number;
  Start_Date?: string;
  End_Date?: string;
  Status?: string;
  Remarks?: string;
  Is_Deleted?: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface PatchAssetMaintenancePayload {
  id: number;
  Issue_Description?: string;
}

/**
 * Create a new Asset Maintenance record.
 */
export async function createAssetMaintenance(payload: CreateAssetMaintenancePayload): Promise<AssetMaintenance> {
  return fetchFromApi('/user/AssetMaintenanceCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get an Asset Maintenance record by ID.
 */
export async function fetchAssetMaintenanceById(id: number): Promise<AssetMaintenance> {
  return fetchFromApi(`/user/AssetMaintenanceCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing Asset Maintenance record.
 */
export async function updateAssetMaintenance(payload: UpdateAssetMaintenancePayload): Promise<AssetMaintenance> {
  return fetchFromApi('/user/AssetMaintenanceCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Partially update an Asset Maintenance record.
 */
export async function patchAssetMaintenance(payload: PatchAssetMaintenancePayload): Promise<AssetMaintenance> {
  return fetchFromApi('/user/AssetMaintenanceCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an Asset Maintenance by ID.
 */
export async function deleteAssetMaintenance(id: number): Promise<void> {
  return fetchFromApi(`/user/AssetMaintenanceCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}


/**
 * List Asset Maintenance records with Pagination.
 */
export async function fetchAssetMaintenances(page?: number): Promise<PaginatedResponse<AssetMaintenance>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/AssetMaintenanceListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Search Asset Maintenance records.
 */
export async function searchAssetMaintenances(search: string): Promise<AssetMaintenance[]> {
  return fetchFromApi(`/user/AssetMaintenanceSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * List Asset Maintenance records without Pagination.
 */
export async function fetchAssetMaintenancesWithoutPagination(): Promise<AssetMaintenance[]> {
  return fetchFromApi('/user/AssetMaintenancelistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Filter Asset Maintenance records.
 */
export interface AssetMaintenanceFilterPayload {
  Status?: string;
  Remarks?: string;
  Created_By?: number;
  fromdate?: string;
  todate?: string;
}
export async function filterAssetMaintenances(payload: AssetMaintenanceFilterPayload): Promise<AssetMaintenance[]> {
  return fetchFromApi('/user/AssetMaintenanceFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// 7. ASSET REQUEST ENDPOINTS
// ==========================================

export interface AssetRequest {
  id: number;
  Requested_By: string;
  Department?: string;
  Email?: string;
  Phone?: string;
  Reporting_Manager?: string;
  Location?: string;
  Asset_Type?: string;
  Preferred_Brand?: string;
  Preferred_Model?: string;
  Configuration?: string;
  Quantity?: string;
  Priority?: string;
  Purpose?: string;
  Required_Date?: string;
  Expected_Duration?: string;
  Status?: string;
  Is_Deleted: boolean;
  Created_Date: string;
  Updated_Date: string;
  Created_By: number;
  Updated_By: number;
  Attachment?: number[] | null;
}

export interface CreateAssetRequestPayload {
  Requested_By: string;
  Department?: string;
  Email?: string;
  Phone?: string;
  Reporting_Manager?: string;
  Location?: string;
  Asset_Type?: string;
  Preferred_Brand?: string;
  Preferred_Model?: string;
  Configuration?: string;
  Quantity?: string;
  Priority?: string;
  Purpose?: string;
  Required_Date?: string;
  Expected_Duration?: string;
  Status?: string;
  Created_By?: number;
  Updated_By?: number;
  Attachment?: number[] | null;
}

export interface UpdateAssetRequestPayload {
  id: number;
  Requested_By?: string;
  Department?: string;
  Email?: string;
  Phone?: string;
  Reporting_Manager?: string;
  Location?: string;
  Asset_Type?: string;
  Preferred_Brand?: string;
  Preferred_Model?: string;
  Configuration?: string;
  Quantity?: string;
  Priority?: string;
  Purpose?: string;
  Required_Date?: string;
  Expected_Duration?: string;
  Status?: string;
  Attachment?: number[] | null;
  Is_Deleted?: boolean;
  Created_Date?: string;
  Updated_Date?: string;
  Created_By?: number;
  Updated_By?: number;
}

export interface PatchAssetRequestPayload {
  id: number;
  Requested_By?: string;
  Department?: string;
}

/**
 * Create a new Asset Request.
 */
export async function createAssetRequest(payload: CreateAssetRequestPayload): Promise<AssetRequest> {
  return fetchFromApi('/user/AssetRequestCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Get an Asset Request by ID.
 */
export async function fetchAssetRequestById(id: number): Promise<AssetRequest> {
  return fetchFromApi(`/user/AssetRequestCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * Update an existing Asset Request.
 */
export async function updateAssetRequest(payload: UpdateAssetRequestPayload): Promise<AssetRequest> {
  return fetchFromApi('/user/AssetRequestCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Partially update an Asset Request.
 */
export async function patchAssetRequest(payload: PatchAssetRequestPayload): Promise<AssetRequest> {
  return fetchFromApi('/user/AssetRequestCRUD/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * List Asset Requests with Pagination.
 */
export async function fetchAssetRequests(page?: number): Promise<PaginatedResponse<AssetRequest>> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/AssetRequestListwithPagination/${query}`, {
    method: 'GET',
  });
}

/**
 * Search Asset Requests.
 */
export async function searchAssetRequests(search: string): Promise<AssetRequest[]> {
  return fetchFromApi(`/user/AssetRequestSearch/?search=${encodeURIComponent(search)}`, {
    method: 'GET',
  });
}

/**
 * List Asset Requests without Pagination.
 */
export async function fetchAssetRequestsWithoutPagination(): Promise<AssetRequest[]> {
  return fetchFromApi('/user/AssetRequestlistwithoutpaginaton/', {
    method: 'GET',
  });
}

/**
 * Filter Asset Requests.
 * Note: The Postman collection hits `/user/AssetRequestFilter/` using a GET request with body,
 * but we also allow sending it standardly.
 */
export interface AssetRequestFilterPayload {
  Location?: string;
  Asset_Type?: string;
  Priority?: string;
  Status?: string;
  Reporting_Manager?: string;
  Department?: string;
  Requested_By?: string;
  Created_By?: number;
  fromdate?: string;
  todate?: string;
}
export async function filterAssetRequests(payload: AssetRequestFilterPayload): Promise<AssetRequest[]> {
  return fetchFromApi('/user/AssetRequestFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete an Asset Request by ID.
 */
export async function deleteAssetRequest(id: number): Promise<void> {
  return fetchFromApi(`/user/AssetRequestCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

