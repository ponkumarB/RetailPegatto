import { create } from 'zustand';
import { ApiDealFactor } from '@/service/api/Settings/deal-factor/api';

interface DealFactorState {
  factors: ApiDealFactor[];
  setFactors: (factors: ApiDealFactor[]) => void;
  addFactor: (factor: ApiDealFactor) => void;
  deleteFactor: (id: number) => void;
  updateFactor: (id: number, updatedFactor: Partial<ApiDealFactor>) => void;
}

export const useDealFactorStore = create<DealFactorState>((set) => ({
  factors: [],
  setFactors: (factors) => set({ factors }),
  addFactor: (factor) => set((state) => ({ factors: [...state.factors, factor] })),
  deleteFactor: (id) => set((state) => ({ factors: state.factors.filter((f) => f.id !== id) })),
  updateFactor: (id, updatedFactor) =>
    set((state) => ({
      factors: state.factors.map((f) => (f.id === id ? { ...f, ...updatedFactor } : f)),
    })),
}));
