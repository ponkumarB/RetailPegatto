import { create } from 'zustand';

export interface OwnerForecast {
  owner: string;
  openPipeline: number;
  weightedForecast: number;
  bestCase: number;
  committed: number;
  forecastTarget: number;
  coverage: number;
  accuracy: number;
}

interface RevenueForecastStore {
  ownerForecasts: OwnerForecast[];
  selectedOwner: string;
  isGenerating: boolean;
  
  setSelectedOwner: (owner: string) => void;
  generateForecast: () => Promise<void>;
}

const DEFAULT_FORECASTS: OwnerForecast[] = [
  {
    owner: 'Ajay Kumar',
    openPipeline: 9870000,
    weightedForecast: 6720000,
    bestCase: 12540000,
    committed: 3850000,
    forecastTarget: 8000000,
    coverage: 2.1,
    accuracy: 85,
  },
  {
    owner: 'Priya Sharma',
    openPipeline: 7640000,
    weightedForecast: 5210000,
    bestCase: 9480000,
    committed: 2830000,
    forecastTarget: 6000000,
    coverage: 2.2,
    accuracy: 82,
  },
  {
    owner: 'Rahul Verma',
    openPipeline: 6420000,
    weightedForecast: 4060000,
    bestCase: 7320000,
    committed: 1870000,
    forecastTarget: 5000000,
    coverage: 2.0,
    accuracy: 78,
  },
  {
    owner: 'Neha Singh',
    openPipeline: 5430000,
    weightedForecast: 3250000,
    bestCase: 6150000,
    committed: 1260000,
    forecastTarget: 4000000,
    coverage: 1.7,
    accuracy: 70,
  },
];

export const useRevenueForecastStore = create<RevenueForecastStore>((set) => ({
  ownerForecasts: DEFAULT_FORECASTS,
  selectedOwner: 'All',
  isGenerating: false,

  setSelectedOwner: (owner) => set({ selectedOwner: owner }),
  
  generateForecast: async () => {
    set({ isGenerating: true });
    // Simulate complex regression ML calculations
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Introduce minor fluctuations to demonstrate dynamic updates
    set((state) => {
      const updated = state.ownerForecasts.map((f) => {
        const factor = 0.98 + Math.random() * 0.04; // +/- 2%
        return {
          ...f,
          openPipeline: Math.round(f.openPipeline * factor),
          weightedForecast: Math.round(f.weightedForecast * factor),
          bestCase: Math.round(f.bestCase * factor),
          committed: Math.round(f.committed * factor),
        };
      });
      return { ownerForecasts: updated, isGenerating: false };
    });
  },
}));
