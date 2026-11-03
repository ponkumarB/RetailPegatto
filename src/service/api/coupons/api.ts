import { fetchFromApi } from '@/service/apiClient';
import { getLocalData, saveLocalData, upsertLocalItem, deleteLocalItem } from '@/utils/persistentStorage';

export interface CouponItem {
  id: number | string;
  Counpon_Id?: string;
  Counpon_Code: string;
  Counpon_Type: 'FLAT' | 'PERCENTAGE' | 'BUY_GET' | string;
  Discount_Type?: 'PERCENTAGE' | 'FLAT' | string;
  Discount_Value: number | string;
  Max_Discount?: number | string | null;
  Min_Order_Value?: number | string;
  Usage_Limit?: number | string | null;
  Used_Count?: number;
  Valid_From: string;
  Valid_To: string;
  Status: 'ACTIVE' | 'INACTIVE' | 'DISABLED' | 'EXPIRED' | string;
  Description?: string;
  Counpon_Description?: string | null;
  Is_Deleted?: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
  Updated_Date?: string;
}

export interface CouponConditionItem {
  id?: number | string;
  Condition_Id?: string;
  coupon?: number | string;
  Condition_Type: 'PRODUCT' | 'CATEGORY' | 'CART_VALUE' | 'CUSTOMER_SEGMENT' | string;
  Product_Id?: string;
  Product_Name?: string;
  Min_Quantity?: number | string | null;
  Customer_Segment?: string | null;
  Created_Date?: string;
}

export interface CouponUsageItem {
  id?: number | string;
  coupon?: number | string;
  order_id?: string;
  customer_name?: string;
  discount_amount?: number;
  order_total?: number;
  used_at?: string;
}

const STORAGE_KEY = 'pegatto_coupons';

function getUserId(): number {
  if (typeof window === 'undefined') return 1;
  const raw = localStorage.getItem('userId') || localStorage.getItem('user_id') || localStorage.getItem('UserId');
  return raw ? parseInt(raw, 10) || 1 : 1;
}

function getOrgId(): number {
  if (typeof window === 'undefined') return 1;
  const raw =
    localStorage.getItem('organizationId') ||
    localStorage.getItem('org_id') ||
    localStorage.getItem('OrganizationId');
  return raw ? parseInt(raw, 10) || 1 : 1;
}

export function getLocalCoupons(): CouponItem[] {
  return getLocalData<CouponItem>(STORAGE_KEY);
}

export function saveLocalCoupons(items: CouponItem[]): void {
  saveLocalData(STORAGE_KEY, items);
}

/**
 * Fetch coupons with pagination, filters, and search
 * Exactly matches couponsApi.js in oldretailproject:
 * - List: GET user/CouponList/?page=${page}&Coupon_Type=${type}&Status=${status}&search=${search}
 * - Search & Filter: GET user/CouponSearchFilter/?page=${page}&...
 */
export async function fetchCoupons(params?: {
  page?: number;
  type?: string;
  status?: string;
  activeOnly?: boolean;
  search?: string;
}): Promise<{ coupons: CouponItem[]; totalCount: number }> {
  const page = params?.page || 1;
  const search = params?.search?.trim() || '';
  const type = params?.type || '';
  const status = params?.status || '';
  const activeOnly = params?.activeOnly;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  if (type) queryParams.set('Coupon_Type', type);
  if (status) queryParams.set('Status', status);
  if (activeOnly) queryParams.set('Active_Only', 'true');
  if (search) queryParams.set('search', search);

  try {
    // user/CouponList/ natively supports page, Coupon_Type, Status, search
    const endpoint = `user/CouponList/?${queryParams.toString()}`;

    let res: any;
    try {
      res = await fetchFromApi<any>(endpoint);
    } catch {
      // Fallback try with CouponSearchFilter if CouponList fails
      res = await fetchFromApi<any>(`user/CouponSearchFilter/?${queryParams.toString()}`);
    }

    if (res) {
      let list: CouponItem[] = [];
      let count = 0;

      if (res.results && Array.isArray(res.results)) {
        list = res.results;
        count = res.count !== undefined ? res.count : res.results.length;
      } else if (res.coupons && Array.isArray(res.coupons)) {
        list = res.coupons;
        count = res.totalCount ?? res.coupons.length;
      } else if (res.data && Array.isArray(res.data)) {
        list = res.data;
        count = res.total ?? res.count ?? res.data.length;
      } else if (Array.isArray(res)) {
        list = res;
        count = res.length;
      }

      // Sync fetched items to local storage
      if (list.length > 0) {
        list.forEach((item) => {
          upsertLocalItem(STORAGE_KEY, item, ['id', 'Counpon_Code', 'Counpon_Id']);
        });
      }

      // Enforce client-side filtering on returned list to guarantee exact match
      let filtered = list;
      if (type && type !== 'ALL') {
        filtered = filtered.filter(
          (c) => c.Counpon_Type?.toUpperCase() === type.toUpperCase()
        );
      }
      if (status && status !== 'ALL') {
        filtered = filtered.filter(
          (c) => c.Status?.toUpperCase() === status.toUpperCase()
        );
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            (c.Counpon_Code && c.Counpon_Code.toLowerCase().includes(q)) ||
            (c.Description && c.Description.toLowerCase().includes(q)) ||
            (c.Counpon_Description && c.Counpon_Description.toLowerCase().includes(q))
        );
      }

      return {
        coupons: filtered,
        totalCount: filtered.length !== list.length ? filtered.length : count
      };
    }
  } catch (err) {
    console.warn('[Coupons API] Backend fetch failed, checking local storage:', err);
  }

  // Fallback to local data only when backend request completely errors out
  let items = getLocalCoupons();

  if (items.length === 0) {
    items = [
      {
        id: 1,
        Counpon_Id: 'CPN000000001',
        Counpon_Code: 'SUMMER2026',
        Counpon_Type: 'FLAT',
        Discount_Type: 'PERCENTAGE',
        Discount_Value: 200,
        Max_Discount: 1000,
        Min_Order_Value: 500,
        Usage_Limit: 100,
        Used_Count: 0,
        Valid_From: '2024-01-01',
        Valid_To: '2027-01-01',
        Status: 'ACTIVE',
        Description: 'Summer season discount coupon'
      }
    ];
    saveLocalCoupons(items);
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (c) =>
        (c.Counpon_Code && c.Counpon_Code.toLowerCase().includes(q)) ||
        (c.Description && c.Description.toLowerCase().includes(q)) ||
        (c.Counpon_Description && c.Counpon_Description.toLowerCase().includes(q))
    );
  }

  if (type && type !== 'ALL') {
    items = items.filter((c) => c.Counpon_Type?.toUpperCase() === type.toUpperCase());
  }

  if (status && status !== 'ALL') {
    items = items.filter((c) => c.Status?.toUpperCase() === status.toUpperCase());
  }

  return { coupons: items, totalCount: items.length };
}

/**
 * Fetch single coupon by ID
 * Endpoint: GET user/CouponCRUD/?id=${id}
 */
export async function fetchCouponById(id: number | string): Promise<CouponItem | null> {
  try {
    const res = await fetchFromApi<any>(`user/CouponCRUD/?id=${id}`);
    if (res) {
      return res.data || res.result || res;
    }
  } catch (err) {
    console.warn('[Coupons API] fetchById failed:', err);
  }

  const items = getLocalCoupons();
  return items.find((c) => String(c.id) === String(id)) || null;
}

/**
 * Create new coupon
 * Endpoint: POST user/CouponCRUD/
 */
export async function createCoupon(data: Partial<CouponItem>): Promise<CouponItem> {
  const userId = getUserId();
  const orgId = getOrgId();

  const payload = {
    Counpon_Code: (data.Counpon_Code || '').trim().toUpperCase(),
    Counpon_Type: data.Counpon_Type || 'FLAT',
    Discount_Type: data.Discount_Type || 'PERCENTAGE',
    Discount_Value: data.Discount_Value !== undefined ? String(data.Discount_Value) : '0',
    Max_Discount: data.Max_Discount !== undefined && data.Max_Discount !== null ? String(data.Max_Discount) : null,
    Min_Order_Value: data.Min_Order_Value !== undefined ? String(data.Min_Order_Value) : '0',
    Usage_Limit: data.Usage_Limit ? Number(data.Usage_Limit) : null,
    Valid_From: data.Valid_From ? new Date(data.Valid_From).toISOString() : new Date().toISOString(),
    Valid_To: data.Valid_To ? new Date(data.Valid_To).toISOString() : new Date(Date.now() + 365 * 86400000).toISOString(),
    Status: data.Status || 'ACTIVE',
    Description: data.Description || '',
    Counpon_Description: data.Description || '',
    Created_By: userId,
    Updated_By: userId,
    Organization_Id: orgId,
  };

  try {
    const res = await fetchFromApi<any>('user/CouponCRUD/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res && (res.id || res.Counpon_Id || res.data?.id)) {
      const created = res.data || res;
      upsertLocalItem(STORAGE_KEY, created, ['id', 'Counpon_Code', 'Counpon_Id']);
      return created;
    }
  } catch (err: any) {
    console.error('[Coupons API] create failed:', err);
    throw err;
  }

  const localCreated: CouponItem = {
    id: Date.now(),
    Counpon_Id: `CPN${Math.floor(Math.random() * 900000000 + 100000000)}`,
    ...payload,
    Used_Count: 0,
    Created_Date: new Date().toISOString(),
  };

  upsertLocalItem(STORAGE_KEY, localCreated, ['id', 'Counpon_Code', 'Counpon_Id']);
  return localCreated;
}

/**
 * Update existing coupon
 * Endpoint: PUT user/CouponCRUD/
 */
export async function updateCoupon(id: number | string, data: Partial<CouponItem>): Promise<CouponItem> {
  const userId = getUserId();
  const orgId = getOrgId();

  const payload = {
    id: id,
    Counpon_Id: data.Counpon_Id,
    Counpon_Code: (data.Counpon_Code || '').trim().toUpperCase(),
    Counpon_Type: data.Counpon_Type || 'FLAT',
    Discount_Type: data.Discount_Type || 'PERCENTAGE',
    Discount_Value: data.Discount_Value !== undefined ? String(data.Discount_Value) : '0',
    Max_Discount: data.Max_Discount !== undefined && data.Max_Discount !== null ? String(data.Max_Discount) : null,
    Min_Order_Value: data.Min_Order_Value !== undefined ? String(data.Min_Order_Value) : '0',
    Usage_Limit: data.Usage_Limit ? Number(data.Usage_Limit) : null,
    Valid_From: data.Valid_From ? new Date(data.Valid_From).toISOString() : new Date().toISOString(),
    Valid_To: data.Valid_To ? new Date(data.Valid_To).toISOString() : new Date().toISOString(),
    Status: data.Status || 'ACTIVE',
    Description: data.Description || '',
    Counpon_Description: data.Description || '',
    Updated_By: userId,
    Organization_Id: orgId,
  };

  try {
    const res = await fetchFromApi<any>('user/CouponCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res) {
      const updated = res.data || res;
      upsertLocalItem(STORAGE_KEY, updated, ['id', 'Counpon_Code', 'Counpon_Id']);
      return updated;
    }
  } catch (err: any) {
    console.error('[Coupons API] update failed:', err);
    throw err;
  }

  const existing = getLocalCoupons().find((c) => String(c.id) === String(id));
  const updatedItem: CouponItem = {
    ...(existing || {}),
    ...payload,
    id: id,
    Updated_Date: new Date().toISOString(),
  } as CouponItem;

  upsertLocalItem(STORAGE_KEY, updatedItem, ['id', 'Counpon_Code', 'Counpon_Id']);
  return updatedItem;
}

/**
 * Delete coupon
 * Endpoint: DELETE user/CouponCRUD/?id=${id}
 */
export async function deleteCoupon(id: number | string): Promise<boolean> {
  try {
    await fetchFromApi<any>(`user/CouponCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (err: any) {
    console.error('[Coupons API] delete failed:', err);
  }

  deleteLocalItem(STORAGE_KEY, id, ['id', 'Counpon_Code', 'Counpon_Id']);
  return true;
}

/**
 * Fetch coupon conditions
 * Endpoint: GET user/CouponConditionList/?coupon_id=${couponId}
 */
export async function fetchCouponConditions(couponId: number | string, page = 1): Promise<{ conditions: CouponConditionItem[]; totalCount: number }> {
  try {
    const res = await fetchFromApi<any>(`user/CouponConditionList/?coupon_id=${couponId}&page=${page}`);
    if (res) {
      const list = res.results || res.conditions || (Array.isArray(res) ? res : []);
      const count = res.count ?? res.totalCount ?? list.length;
      return { conditions: list, totalCount: count };
    }
  } catch (err) {
    console.warn('[Coupons API] fetchConditions failed:', err);
  }
  return { conditions: [], totalCount: 0 };
}

/**
 * Create coupon condition
 * Endpoint: POST user/CouponConditionCRUD/
 */
export async function createCouponCondition(data: Partial<CouponConditionItem>): Promise<any> {
  const userId = getUserId();
  const orgId = getOrgId();
  return fetchFromApi<any>('user/CouponConditionCRUD/', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      Created_By: userId,
      Updated_By: userId,
      Organization_Id: orgId,
    }),
  });
}

/**
 * Delete coupon condition
 * Endpoint: DELETE user/CouponConditionCRUD/${id}/
 */
export async function deleteCouponCondition(id: number | string): Promise<any> {
  return fetchFromApi<any>(`user/CouponConditionCRUD/${id}/`, {
    method: 'DELETE',
  });
}
