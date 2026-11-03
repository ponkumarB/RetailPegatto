import { create } from 'zustand';
import { PaymentRecord } from '@/types/payment';
import * as paymentApi from '@/service/api/Payment/api';
import { getLocalData, upsertLocalItem, deleteLocalItem, mergeWithLocalData } from '@/utils/persistentStorage';

interface PaymentState {
  payments: PaymentRecord[];
  paymentsCount: number;
  isLoading: boolean;
  error: string | null;
  loadPayments: (page?: number, isDeleted?: boolean) => Promise<void>;
  getPaymentById: (id: number | string) => Promise<PaymentRecord | null>;
  addPayment: (payload: Partial<PaymentRecord>) => Promise<any>;
  updatePayment: (payload: Partial<PaymentRecord>) => Promise<any>;
  deletePayment: (id: number | string) => Promise<any>;
  searchPayments: (searchTerm: string) => Promise<void>;
  filterPayments: (filterData: Record<string, any>) => Promise<void>;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: typeof window !== 'undefined' ? getLocalData<PaymentRecord>('pegatto_payments') : [],
  paymentsCount: typeof window !== 'undefined' ? getLocalData<PaymentRecord>('pegatto_payments').length : 0,
  isLoading: false,
  error: null,

  loadPayments: async (page = 1, isDeleted = false) => {
    set({ isLoading: true, error: null });
    try {
      const res = await paymentApi.fetchSalesPaymentList(isDeleted, page);
      let list: PaymentRecord[] = [];

      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.results)) {
        list = res.results;
      } else if (res && Array.isArray(res.data)) {
        list = res.data;
      }

      const merged = mergeWithLocalData<PaymentRecord>('pegatto_payments', list, ['id', 'Payment_Id', 'Receipt_No', 'Transaction_No']);
      set({ payments: merged, paymentsCount: merged.length, isLoading: false });
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      const local = getLocalData<PaymentRecord>('pegatto_payments');
      set({ payments: local, paymentsCount: local.length, error: err.message || 'Failed to load payments', isLoading: false });
    }
  },

  getPaymentById: async (id: number | string) => {
    const local = getLocalData<PaymentRecord>('pegatto_payments');
    const localFound = local.find(p => String(p.id) === String(id) || String(p.Payment_Id) === String(id));
    if (localFound) return localFound;

    try {
      const res = await paymentApi.fetchSalesPaymentById(id);
      if (Array.isArray(res) && res.length > 0) {
        return res[0];
      }
      if (res && typeof res === 'object' && !Array.isArray(res)) {
        return res.result || res.data || res;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to fetch payment details:', err);
      return null;
    }
  },

  addPayment: async (payload: Partial<PaymentRecord>) => {
    set({ isLoading: true, error: null });
    const localItem: PaymentRecord = {
      id: payload.id || Date.now(),
      Payment_Id: payload.Payment_Id || `PMT-${Date.now()}`,
      Customer_Name: payload.Customer_Name || '',
      Receipt_No: payload.Receipt_No || `REC-${Date.now()}`,
      Amount: payload.Amount || 0,
      Payment_Date: payload.Payment_Date || new Date().toISOString().split('T')[0],
      Mode_of_Payment: payload.Mode_of_Payment || 'Cash',
      Status: payload.Status || 'Completed',
      ...payload,
    } as PaymentRecord;

    const updatedLocal = upsertLocalItem('pegatto_payments', localItem, ['id', 'Payment_Id', 'Receipt_No']);
    set({ payments: updatedLocal, paymentsCount: updatedLocal.length });

    try {
      const res = await paymentApi.createSalesPayment(payload);
      await get().loadPayments(1);
      return res;
    } catch (err: any) {
      console.warn('Backend payment save notice (saved locally):', err);
      set({ isLoading: false });
      return localItem;
    }
  },

  updatePayment: async (payload: Partial<PaymentRecord>) => {
    set({ isLoading: true, error: null });
    if (payload.id) {
      const updatedLocal = upsertLocalItem('pegatto_payments', payload as PaymentRecord, ['id', 'Payment_Id']);
      set({ payments: updatedLocal, paymentsCount: updatedLocal.length });
    }

    try {
      const res = await paymentApi.updateSalesPayment(payload);
      await get().loadPayments(1);
      return res;
    } catch (err: any) {
      console.warn('Backend payment update notice (updated locally):', err);
      set({ isLoading: false });
      return payload;
    }
  },

  deletePayment: async (id: number | string) => {
    deleteLocalItem('pegatto_payments', id, ['id', 'Payment_Id']);
    const local = getLocalData<PaymentRecord>('pegatto_payments');
    set({ payments: local, paymentsCount: local.length, isLoading: true, error: null });

    try {
      const res = await paymentApi.deleteSalesPayment(id);
      await get().loadPayments(1);
      return res;
    } catch (err: any) {
      console.warn('Backend payment delete notice (deleted locally):', err);
      set({ isLoading: false });
      return { success: true };
    }
  },

  searchPayments: async (searchTerm: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await paymentApi.searchSalesPayment(searchTerm);
      const list = Array.isArray(res) ? res : res?.results || res?.data || [];
      const count = res?.count || list.length;
      set({ payments: list, paymentsCount: count, isLoading: false });
    } catch (err: any) {
      console.error('Failed to search payments:', err);
      set({ error: err.message || 'Failed to search payments', isLoading: false });
    }
  },

  filterPayments: async (filterData: Record<string, any>) => {
    set({ isLoading: true, error: null });
    try {
      const res = await paymentApi.filterSalesPayment(filterData);
      const list = Array.isArray(res) ? res : res?.results || res?.data || [];
      const count = res?.count || list.length;
      set({ payments: list, paymentsCount: count, isLoading: false });
    } catch (err: any) {
      console.error('Failed to filter payments:', err);
      set({ error: err.message || 'Failed to filter payments', isLoading: false });
    }
  },
}));

