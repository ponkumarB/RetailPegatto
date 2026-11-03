import { fetchFromApi } from '@/service/apiClient';
import { getLocalData, saveLocalData, upsertLocalItem, deleteLocalItem } from '@/utils/persistentStorage';

export interface DiscountDetail {
  id?: number | string;
  Product_Id: string;
  Product_Name: string;
  Discount: number | string;
}

export interface DiscountItem {
  id: number | string;
  Discount_Id?: string;
  Discount_Name: string;
  Discount_Type: 'Flat' | 'Range' | 'Segment' | string;
  Flat?: string;
  Segmant?: string;
  Discount_Percentage: number | string;
  Start_Date: string;
  End_Date: string;
  From_Quantity?: number | string;
  To_Quantity?: number | string;
  DiscountSetup_Details?: DiscountDetail[];
  Is_Deleted?: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
  Updated_Date?: string;
}

export interface FilterDiscountPayload {
  Discount_Id?: string;
  Discount_IDF?: string;
  Discount_Name?: string;
  Discount_NameF?: string;
  fromdate?: string;
  todate?: string;
}

const STORAGE_KEY = 'pegatto_discounts';

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

export function getLocalDiscounts(): DiscountItem[] {
  return getLocalData<DiscountItem>(STORAGE_KEY);
}

export function saveLocalDiscounts(items: DiscountItem[]): void {
  saveLocalData(STORAGE_KEY, items);
}

/**
 * Fetch discount list with pagination, search, or filter
 * Exactly matches oldretailproject DiscountAPI.js:
 * - List: GET /user/DiscountSetupAdditional/?Is_Deleted=False&page=${page}
 * - Search: GET /user/DiscountSetupSearch/?search=${searchTerm}
 * - Filter: POST /user/DiscountFilter/
 */
export async function fetchDiscounts(params?: {
  page?: number;
  search?: string;
  isDeleted?: boolean;
  filterData?: FilterDiscountPayload;
}): Promise<{ results: DiscountItem[]; count: number }> {
  const page = params?.page || 1;
  const isDeleted = params?.isDeleted ? 'True' : 'False';
  const search = params?.search?.trim() || '';

  try {
    let res: any;

    if (search) {
      res = await fetchFromApi<any>(`user/DiscountSetupSearch/?search=${encodeURIComponent(search)}`);
    } else if (params?.filterData && Object.keys(params.filterData).length > 0) {
      const payload = {
        Discount_Id: params.filterData.Discount_Id || params.filterData.Discount_IDF || '',
        Discount_Name: params.filterData.Discount_Name || params.filterData.Discount_NameF || '',
        fromdate: params.filterData.fromdate || '',
        todate: params.filterData.todate || '',
      };
      res = await fetchFromApi<any>('user/DiscountFilter/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetchFromApi<any>(`user/DiscountSetupAdditional/?Is_Deleted=${isDeleted}&page=${page}`);
    }

    if (res) {
      let list: DiscountItem[] = [];
      let count = 0;

      if (res.results && Array.isArray(res.results)) {
        list = res.results;
        count = res.count !== undefined ? res.count : res.results.length;
        list.forEach((item) => {
          upsertLocalItem(STORAGE_KEY, item, ['id', 'Discount_Id']);
        });
        return { results: list, count };
      } else if (res.data && Array.isArray(res.data)) {
        list = res.data;
        count = res.total ?? res.count ?? res.data.length;
        list.forEach((item) => {
          upsertLocalItem(STORAGE_KEY, item, ['id', 'Discount_Id']);
        });
        return { results: list, count };
      } else if (Array.isArray(res)) {
        list = res;
        count = res.length;
        list.forEach((item) => {
          upsertLocalItem(STORAGE_KEY, item, ['id', 'Discount_Id']);
        });
        return { results: list, count };
      }
    }
  } catch (err) {
    console.warn('[Discount API] Backend fetch failed, checking local storage:', err);
  }

  // Fallback to local storage
  let items = getLocalDiscounts();

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (item) =>
        (item.Discount_Name && item.Discount_Name.toLowerCase().includes(q)) ||
        (item.Discount_Id && item.Discount_Id.toLowerCase().includes(q)) ||
        (item.Discount_Type && item.Discount_Type.toLowerCase().includes(q))
    );
  }

  if (params?.filterData) {
    const targetId = (params.filterData.Discount_Id || params.filterData.Discount_IDF || '').toLowerCase();
    const targetName = (params.filterData.Discount_Name || params.filterData.Discount_NameF || '').toLowerCase();
    const { fromdate, todate } = params.filterData;

    if (targetId) {
      items = items.filter((item) => item.Discount_Id?.toLowerCase().includes(targetId));
    }
    if (targetName) {
      items = items.filter((item) => item.Discount_Name?.toLowerCase().includes(targetName));
    }
    if (fromdate) {
      items = items.filter((item) => new Date(item.Start_Date) >= new Date(fromdate));
    }
    if (todate) {
      items = items.filter((item) => new Date(item.End_Date) <= new Date(todate));
    }
  }

  return { results: items, count: items.length };
}

/**
 * Fetch single Discount by ID
 */
export async function fetchDiscountById(id: number | string): Promise<DiscountItem | null> {
  try {
    const res = await fetchFromApi<any>(`user/DiscountSetupCRUD/?id=${id}`);
    if (res) {
      return res.data || res.result || res;
    }
  } catch (err) {
    console.warn('[Discount API] fetchById failed:', err);
  }

  const items = getLocalDiscounts();
  return items.find((i) => String(i.id) === String(id)) || null;
}

/**
 * Create new Discount Setup
 * Endpoint: POST /user/DiscountSetupCRUD/
 */
export async function createDiscount(payload: Partial<DiscountItem>): Promise<DiscountItem> {
  const userId = getUserId();
  const orgId = getOrgId();

  const body: any = {
    ...(payload.Discount_Id ? { Discount_Id: payload.Discount_Id } : {}),
    Discount_Name: payload.Discount_Name,
    Discount_Type: payload.Discount_Type,
    Flat: payload.Discount_Type === 'Flat' ? payload.Discount_Type : '',
    Discount_Percentage: payload.Discount_Percentage !== undefined ? String(payload.Discount_Percentage) : '0',
    End_Date: payload.End_Date ? new Date(payload.End_Date).toISOString().split('T')[0] : '',
    Start_Date: payload.Start_Date ? new Date(payload.Start_Date).toISOString().split('T')[0] : '',
    Segmant: payload.Discount_Type === 'Segment' ? payload.Segmant || '' : '',
    From_Quantity: payload.Discount_Type === 'Range' ? (payload.From_Quantity !== undefined ? String(payload.From_Quantity) : '') : '',
    To_Quantity: payload.Discount_Type === 'Range' ? (payload.To_Quantity !== undefined ? String(payload.To_Quantity) : '') : '',
    DiscountSetup_Details: (payload.DiscountSetup_Details || []).map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      Product_Id: row.Product_Id,
      Product_Name: row.Product_Name,
      Discount: row.Discount !== undefined ? row.Discount : payload.Discount_Percentage || 0,
    })),
    Is_Deleted: false,
    Organization_Id: orgId,
    Created_By: userId,
    Updated_By: userId,
  };

  try {
    const res = await fetchFromApi<any>('user/DiscountSetupCRUD/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res && (res.id || res.Discount_Id || res.data?.id)) {
      const created = res.data || res;
      upsertLocalItem(STORAGE_KEY, created, ['id', 'Discount_Id']);
      return created;
    }
  } catch (err: any) {
    console.error('[Discount API] create failed:', err);
    throw err;
  }

  const localCreated: DiscountItem = {
    id: Date.now(),
    Discount_Id: payload.Discount_Id || `DCS${Math.floor(Math.random() * 900000000 + 100000000)}`,
    Discount_Name: payload.Discount_Name || 'New Discount',
    Discount_Type: payload.Discount_Type || 'Flat',
    Flat: payload.Discount_Type === 'Flat' ? payload.Discount_Type : '',
    Discount_Percentage: payload.Discount_Percentage || 0,
    Start_Date: payload.Start_Date || new Date().toISOString().split('T')[0],
    End_Date: payload.End_Date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    Segmant: payload.Segmant,
    From_Quantity: payload.From_Quantity,
    To_Quantity: payload.To_Quantity,
    DiscountSetup_Details: payload.DiscountSetup_Details || [],
    Is_Deleted: false,
    Created_Date: new Date().toISOString(),
  };

  upsertLocalItem(STORAGE_KEY, localCreated, ['id', 'Discount_Id']);
  return localCreated;
}

/**
 * Update existing Discount Setup
 * Endpoint: PUT /user/DiscountSetupCRUD/
 */
export async function updateDiscount(id: number | string, payload: Partial<DiscountItem>): Promise<DiscountItem> {
  const userId = getUserId();
  const orgId = getOrgId();

  const body: any = {
    id: id,
    Discount_Id: payload.Discount_Id,
    Discount_Name: payload.Discount_Name,
    Discount_Type: payload.Discount_Type,
    Flat: payload.Discount_Type === 'Flat' ? payload.Discount_Type : '',
    Discount_Percentage: payload.Discount_Percentage !== undefined ? String(payload.Discount_Percentage) : '0',
    End_Date: payload.End_Date ? new Date(payload.End_Date).toISOString().split('T')[0] : '',
    Start_Date: payload.Start_Date ? new Date(payload.Start_Date).toISOString().split('T')[0] : '',
    Segmant: payload.Discount_Type === 'Segment' ? payload.Segmant || '' : '',
    From_Quantity: payload.Discount_Type === 'Range' ? (payload.From_Quantity !== undefined ? String(payload.From_Quantity) : '') : '',
    To_Quantity: payload.Discount_Type === 'Range' ? (payload.To_Quantity !== undefined ? String(payload.To_Quantity) : '') : '',
    DiscountSetup_Details: (payload.DiscountSetup_Details || []).map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      Product_Id: row.Product_Id,
      Product_Name: row.Product_Name,
      Discount: row.Discount !== undefined ? row.Discount : payload.Discount_Percentage || 0,
    })),
    Is_Deleted: false,
    Organization_Id: orgId,
    Created_By: userId,
    Updated_By: userId,
  };

  try {
    const res = await fetchFromApi<any>('user/DiscountSetupCRUD/', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (res) {
      const updated = res.data || res;
      upsertLocalItem(STORAGE_KEY, updated, ['id', 'Discount_Id']);
      return updated;
    }
  } catch (err: any) {
    console.error('[Discount API] update failed:', err);
    throw err;
  }

  const existing = getLocalDiscounts().find((i) => String(i.id) === String(id));
  const updatedItem: DiscountItem = {
    ...(existing || {}),
    ...payload,
    id: id,
    Updated_Date: new Date().toISOString(),
  } as DiscountItem;

  upsertLocalItem(STORAGE_KEY, updatedItem, ['id', 'Discount_Id']);
  return updatedItem;
}

/**
 * Delete Discount Setup
 * Endpoint: DELETE /user/DiscountSetupCRUD/?id=${id}
 */
export async function deleteDiscount(id: number | string): Promise<boolean> {
  try {
    await fetchFromApi<any>(`user/DiscountSetupCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (err: any) {
    console.error('[Discount API] delete failed:', err);
  }

  deleteLocalItem(STORAGE_KEY, id, ['id', 'Discount_Id']);
  return true;
}

/**
 * Fetch series value for Discount_Setup
 * Endpoint: GET /user/SeriesValue/?doctype=Discount_Setup
 */
export async function fetchDiscountSeriesValue(): Promise<string> {
  try {
    const res = await fetchFromApi<any>('user/SeriesValue/?doctype=Discount_Setup');
    if (res && res.series) {
      return res.series;
    }
  } catch (err) {
    console.warn('[Discount API] fetch series failed:', err);
  }
  return '';
}
