import { fetchFromApi } from '@/service/apiClient';
import { getLocalData, saveLocalData, upsertLocalItem, deleteLocalItem } from '@/utils/persistentStorage';

export interface ManagePriceDetail {
  id?: number | string;
  Product_Id: string | number;
  Product_Name: string;
  UOM: string;
  Unit_Price: number | string;
  Tax?: number | string;
  Price: number | string;
  Discount?: string | number;
  storeId?: number | string;
  storeName?: string;
  Store_Price?: number | string;
  Final_Price?: number | string;
}

export interface StoreOption {
  id: number;
  Store_Id?: string;
  Store_Name?: string;
  name?: string;
  Store_Code?: string;
}

export interface ManagePriceItem {
  id: number | string;
  ManagePrice_Id?: string;
  Book_Name: string;
  PriceBook_Type: string;
  Start_Date: string;
  End_Date: string;
  Currency?: string;
  Percentage?: string | number;
  Markups?: string | number;
  City?: string;
  State?: string;
  Discount_Name?: string | number;
  Store_Id?: StoreOption[] | any;
  Store_Names?: string;
  ManagePrice_Details?: ManagePriceDetail[];
  Is_Deleted?: boolean;
  Organization_Id?: number;
  Created_By?: number;
  Updated_By?: number;
  Created_Date?: string;
  Updated_Date?: string;
}

export interface FilterManagePricePayload {
  fromdate?: string;
  todate?: string;
  Book_ID?: string;
  Bool_ID?: string;
  Book_Name?: string;
  storeId?: number | string;
  page?: number;
}

const STORAGE_KEY = 'pegatto_manage_price';

/**
 * In oldretailproject only 2 records exist in demo/backend.
 * Provide exact 2-record fallback structure matching oldretailproject.
 */
const INITIAL_MANAGE_PRICES: ManagePriceItem[] = [
  {
    id: 1,
    ManagePrice_Id: 'MP000000001',
    Book_Name: 'Retail Standard Price Book',
    PriceBook_Type: 'List Price',
    Start_Date: '2025-01-01',
    End_Date: '2026-12-31',
    Currency: 'INR',
    Percentage: '0',
    Markups: '',
    City: 'Bengaluru',
    State: 'Karnataka',
    Store_Id: [
      { id: 1, Store_Id: 'STR000000001', Store_Name: 'bangalore hub' }
    ],
    Store_Names: 'bangalore hub',
    ManagePrice_Details: [
      {
        id: 1,
        Product_Id: 'SPM100262456',
        Product_Name: 'Bulb',
        UOM: 'pcs',
        Unit_Price: 120,
        Tax: 18,
        Price: 141.6
      },
      {
        id: 2,
        Product_Id: 'SPM100262454',
        Product_Name: 'Mac Laptop',
        UOM: 'kg',
        Unit_Price: 89999,
        Tax: 18,
        Price: 106198.82
      }
    ],
    Is_Deleted: false,
    Organization_Id: 1
  },
  {
    id: 2,
    ManagePrice_Id: 'MP000000002',
    Book_Name: 'Festive Special Promo Book',
    PriceBook_Type: 'Special Price',
    Start_Date: '2025-06-01',
    End_Date: '2026-11-30',
    Currency: 'INR',
    Percentage: '10',
    Markups: '5',
    City: 'Chennai',
    State: 'Tamil Nadu',
    Store_Id: [
      { id: 6, Store_Id: 'STM-000035', Store_Name: 'Civicon Construction Market' }
    ],
    Store_Names: 'Civicon Construction Market',
    ManagePrice_Details: [
      {
        id: 3,
        Product_Id: 'SP1000724-25',
        Product_Name: 'Batching Plants',
        UOM: 'Unit',
        Unit_Price: 1500000,
        Tax: 18,
        Price: 1770000
      },
      {
        id: 4,
        Product_Id: 'SP1001024-25',
        Product_Name: 'Wire',
        UOM: 'mtr',
        Unit_Price: 5000,
        Tax: 18,
        Price: 5900
      }
    ],
    Is_Deleted: false,
    Organization_Id: 1
  }
];

function getLocalManagePrices(): ManagePriceItem[] {
  const data = getLocalData<ManagePriceItem>(STORAGE_KEY);
  if (!data || data.length === 0) {
    saveLocalData(STORAGE_KEY, INITIAL_MANAGE_PRICES);
    return INITIAL_MANAGE_PRICES;
  }
  return data;
}

function getUserId(): number {
  if (typeof window === 'undefined') return 1;
  const raw = localStorage.getItem('userId') || localStorage.getItem('UserId') || '1';
  return parseInt(raw, 10) || 1;
}

function getOrgId(): number {
  if (typeof window === 'undefined') return 1;
  const raw = localStorage.getItem('organizationId') || localStorage.getItem('OrganizationId') || '1';
  return parseInt(raw, 10) || 1;
}

/**
 * Fetch manage prices list with search, filter or standard pagination
 * Matching oldretailproject ManagePriceAPI.js:
 * - list: /user/ProductManagePriceAdditional/?Is_Deleted=False&page=${page}
 * - search: /user/ProductManagePriceSearch/?search=${searchTerm}
 * - filter: /user/ProductManagePriceFilter/
 */
export async function fetchManagePrices(params?: {
  page?: number;
  search?: string;
  isDeleted?: boolean;
  filterData?: FilterManagePricePayload;
}): Promise<{ results: ManagePriceItem[]; count: number }> {
  const page = params?.page || 1;
  const isDeleted = params?.isDeleted ? 'True' : 'False';
  const search = params?.search?.trim() || '';

  try {
    let res: any;

    if (search) {
      res = await fetchFromApi<any>(`user/ProductManagePriceSearch/?search=${encodeURIComponent(search)}`);
    } else if (params?.filterData && Object.keys(params.filterData).length > 0) {
      res = await fetchFromApi<any>('user/ProductManagePriceFilter/', {
        method: 'POST',
        body: JSON.stringify(params.filterData)
      });
    } else {
      res = await fetchFromApi<any>(`user/ProductManagePriceAdditional/?Is_Deleted=${isDeleted}&page=${page}`);
    }

    if (res) {
      let list: ManagePriceItem[] = [];
      let count = 0;

      if (res.results && Array.isArray(res.results)) {
        list = res.results;
        count = res.count !== undefined ? res.count : res.results.length;
        list.forEach((item) => {
          upsertLocalItem(STORAGE_KEY, item, ['id', 'ManagePrice_Id']);
        });
        return { results: list, count };
      } else if (res.data && Array.isArray(res.data)) {
        list = res.data;
        count = res.total ?? res.count ?? res.data.length;
        list.forEach((item) => {
          upsertLocalItem(STORAGE_KEY, item, ['id', 'ManagePrice_Id']);
        });
        return { results: list, count };
      } else if (Array.isArray(res)) {
        list = res;
        count = res.length;
        list.forEach((item) => {
          upsertLocalItem(STORAGE_KEY, item, ['id', 'ManagePrice_Id']);
        });
        return { results: list, count };
      }
    }
  } catch (err) {
    console.warn('[Manage Price API] Backend fetch failed, falling back to local data:', err);
  }

  // Fallback to local storage (matches 2 records in oldretailproject)
  let items = getLocalManagePrices();

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (item) =>
        (item.Book_Name && item.Book_Name.toLowerCase().includes(q)) ||
        (item.ManagePrice_Id && item.ManagePrice_Id.toLowerCase().includes(q)) ||
        (item.PriceBook_Type && item.PriceBook_Type.toLowerCase().includes(q)) ||
        (Array.isArray(item.Store_Id) &&
          item.Store_Id.some((s: any) => s.Store_Name && s.Store_Name.toLowerCase().includes(q)))
    );
  }

  if (params?.filterData) {
    const { Book_ID, Bool_ID, Book_Name, fromdate, todate, storeId } = params.filterData;
    const targetId = (Book_ID || Bool_ID || '').toLowerCase();
    if (targetId) {
      items = items.filter((item) => item.ManagePrice_Id?.toLowerCase().includes(targetId));
    }
    if (Book_Name) {
      const targetName = Book_Name.toLowerCase();
      items = items.filter((item) => item.Book_Name?.toLowerCase().includes(targetName));
    }
    if (storeId) {
      items = items.filter((item) =>
        Array.isArray(item.Store_Id) && item.Store_Id.some((s: any) => String(s.id) === String(storeId))
      );
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
 * Fetch single Price Book by ID
 */
export async function fetchManagePriceById(id: number | string): Promise<ManagePriceItem | null> {
  try {
    const res = await fetchFromApi<any>(`user/ProductManagePriceCRUD/?id=${id}`);
    if (res) {
      return res.data || res.result || res;
    }
  } catch (err) {
    console.warn('[Manage Price API] fetchById failed:', err);
  }

  const items = getLocalManagePrices();
  return items.find((i) => String(i.id) === String(id)) || null;
}

/**
 * Create new Price Book
 * Endpoint: POST /user/ProductManagePriceCRUD/
 */
export async function createManagePrice(payload: Partial<ManagePriceItem>): Promise<ManagePriceItem> {
  const userId = getUserId();
  const orgId = getOrgId();

  const body: any = {
    Currency: payload.Currency || 'INR',
    Book_Name: payload.Book_Name,
    PriceBook_Type: payload.PriceBook_Type || 'List Price',
    Start_Date: payload.Start_Date,
    End_Date: payload.End_Date,
    City: payload.City || '',
    State: payload.State || '',
    Percentage: payload.Percentage !== undefined && payload.Percentage !== '' ? String(payload.Percentage) : '0',
    Markups: payload.Markups !== undefined && payload.Markups !== '' ? String(payload.Markups) : '0',
    Discount_Name: payload.Discount_Name || 0,
    Store_Id: Array.isArray(payload.Store_Id)
      ? payload.Store_Id.map((s: any) => (typeof s === 'object' ? s.id : s))
      : [],
    ManagePrice_Details: (payload.ManagePrice_Details || []).map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      Product_Id: row.Product_Id,
      Product_Name: row.Product_Name,
      UOM: row.UOM || 'Unit',
      Unit_Price: Number(row.Unit_Price) || 0,
      Tax: Number(row.Tax) || 0,
      Price: Number(row.Price) || 0
    })),
    Is_Deleted: false,
    Organization_Id: orgId,
    Created_By: userId,
    Updated_By: userId
  };

  try {
    const res = await fetchFromApi<any>('user/ProductManagePriceCRUD/', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (res && (res.id || res.ManagePrice_Id || res.data?.id)) {
      const created = res.data || res;
      upsertLocalItem(STORAGE_KEY, created, ['id', 'ManagePrice_Id']);
      return created;
    }
  } catch (err: any) {
    console.error('[Manage Price API] create failed:', err);
    throw err;
  }

  const localCreated: ManagePriceItem = {
    id: Date.now(),
    ManagePrice_Id: `MP${String(Math.floor(Math.random() * 900000000 + 100000000))}`,
    Book_Name: payload.Book_Name || 'New Price Book',
    PriceBook_Type: payload.PriceBook_Type || 'List Price',
    Start_Date: payload.Start_Date || new Date().toISOString().split('T')[0],
    End_Date: payload.End_Date || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    Store_Id: payload.Store_Id || [],
    ManagePrice_Details: payload.ManagePrice_Details || [],
    City: payload.City,
    State: payload.State,
    Is_Deleted: false,
    Created_Date: new Date().toISOString()
  };

  upsertLocalItem(STORAGE_KEY, localCreated, ['id', 'ManagePrice_Id']);
  return localCreated;
}

/**
 * Update existing Price Book
 * Endpoint: PUT /user/ProductManagePriceCRUD/
 */
export async function updateManagePrice(id: number | string, payload: Partial<ManagePriceItem>): Promise<ManagePriceItem> {
  const userId = getUserId();
  const orgId = getOrgId();

  const body: any = {
    id: id,
    ManagePrice_Id: payload.ManagePrice_Id,
    Currency: payload.Currency || 'INR',
    Book_Name: payload.Book_Name,
    PriceBook_Type: payload.PriceBook_Type || 'List Price',
    Start_Date: payload.Start_Date,
    End_Date: payload.End_Date,
    City: payload.City || '',
    State: payload.State || '',
    Percentage: payload.Percentage !== undefined && payload.Percentage !== '' ? String(payload.Percentage) : '0',
    Markups: payload.Markups !== undefined && payload.Markups !== '' ? String(payload.Markups) : '0',
    Store_Id: Array.isArray(payload.Store_Id)
      ? payload.Store_Id.map((s: any) => (typeof s === 'object' ? s.id : s))
      : [],
    ManagePrice_Details: (payload.ManagePrice_Details || []).map((row) => ({
      ...(row.id ? { id: row.id } : {}),
      Product_Id: row.Product_Id,
      Product_Name: row.Product_Name,
      UOM: row.UOM || 'Unit',
      Unit_Price: Number(row.Unit_Price) || 0,
      Tax: Number(row.Tax) || 0,
      Price: Number(row.Price) || 0
    })),
    Is_Deleted: false,
    Organization_Id: orgId,
    Created_By: userId,
    Updated_By: userId
  };

  try {
    const res = await fetchFromApi<any>('user/ProductManagePriceCRUD/', {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    if (res && (res.id || res.ManagePrice_Id || res.data?.id)) {
      const updated = res.data || res;
      upsertLocalItem(STORAGE_KEY, updated, ['id']);
      return updated;
    }
  } catch (err: any) {
    console.error('[Manage Price API] update failed:', err);
    throw err;
  }

  const items = getLocalManagePrices();
  const idx = items.findIndex((i) => String(i.id) === String(id));
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...payload };
    saveLocalData(STORAGE_KEY, items);
    return items[idx];
  }

  return { id, ...payload } as ManagePriceItem;
}

/**
 * Delete Price Book
 * Endpoint: DELETE /user/ProductManagePriceCRUD/?id=${id}
 */
export async function deleteManagePrice(id: number | string): Promise<boolean> {
  try {
    await fetchFromApi(`user/ProductManagePriceCRUD/?id=${id}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('[Manage Price API] delete failed, deleting locally:', err);
  }

  deleteLocalItem(STORAGE_KEY, id, ['id']);
  return true;
}

/**
 * Fetch stores list for price book modal
 */
export async function fetchStoresList(): Promise<StoreOption[]> {
  try {
    const res = await fetchFromApi<any>('/user/StoreMasterList/?Is_Deleted=False');
    if (res) {
      const raw = res.data || res.results || (Array.isArray(res) ? res : []);
      if (raw.length > 0) {
        return raw.map((s: any) => ({
          id: s.id || s.Store_Id,
          Store_Id: s.Store_Id || s.id,
          Store_Name: s.Store_Name || s.name || s.StoreName || `Store #${s.id}`,
          name: s.Store_Name || s.name,
          Store_Code: s.Store_Code || s.code || ''
        }));
      }
    }
  } catch (err) {
    console.warn('[Manage Price API] fetchStoresList failed:', err);
  }

  return [
    { id: 1, Store_Id: 'STR000000001', Store_Name: 'bangalore hub' },
    { id: 6, Store_Id: 'STM-000035', Store_Name: 'Civicon Construction Market' }
  ];
}

/**
 * Fetch product master list for price revision details
 */
export async function fetchProductMasterList(): Promise<any[]> {
  try {
    const res = await fetchFromApi<any>('/user/SalesProductMasterList/');
    if (res) {
      const raw = res.data || res.results || (Array.isArray(res) ? res : []);
      if (raw.length > 0) {
        return raw.map((p: any) => ({
          id: p.id || p.Product_Id,
          Product_Id: p.Product_Id || p.id,
          Product_Name: p.Product_Name || p.name || 'Product',
          UOM: p.UOM || p.uom || 'Unit',
          Price: parseFloat(String(p.Price || p.Unit_Price || 0)) || 0,
          Unit_Price: parseFloat(String(p.Price || p.Unit_Price || 0)) || 0,
          Tax: parseFloat(String(p.Tax || 0)) || 0
        }));
      }
    }
  } catch (err) {
    console.warn('[Manage Price API] fetchProductMasterList failed:', err);
  }

  return [
    { id: 1, Product_Id: 'SPM100262456', Product_Name: 'Bulb', UOM: 'pcs', Unit_Price: 120, Tax: 18, Price: 141.6 },
    { id: 2, Product_Id: 'SPM100262454', Product_Name: 'Mac Laptop', UOM: 'kg', Unit_Price: 89999, Tax: 18, Price: 106198.82 },
    { id: 3, Product_Id: 'SP1000724-25', Product_Name: 'Batching Plants', UOM: 'Unit', Unit_Price: 1500000, Tax: 18, Price: 1770000 },
    { id: 4, Product_Id: 'SP1001024-25', Product_Name: 'Wire', UOM: 'mtr', Unit_Price: 5000, Tax: 18, Price: 5900 }
  ];
}
