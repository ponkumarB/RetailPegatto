import { create } from 'zustand';

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  customersCount: number;
  percentageOfTotal: number; // percentage of total customers
  createdOn: string;
  lastUpdated: string;
  status: 'Active' | 'Warning' | 'Inactive';
  type: 'Behavioral' | 'Demographic' | 'Transactional' | 'Other';
  rules: string[];
}

interface CustomerSegmentStore {
  segments: CustomerSegment[];
  totalCustomers: number;
  segmentedCustomers: number;
  unsegmentedCustomers: number;
  addSegment: (segment: Omit<CustomerSegment, 'id' | 'customersCount' | 'percentageOfTotal' | 'createdOn' | 'lastUpdated'> & { customersCount?: number }) => void;
  updateSegment: (segment: CustomerSegment) => void;
  deleteSegment: (id: string) => void;
}

const initialSegments: CustomerSegment[] = [
  {
    id: 'SEG-001',
    name: 'High Value Customers',
    description: 'Customers with high purchase value and frequent orders',
    customersCount: 2450,
    percentageOfTotal: 19.7,
    createdOn: 'May 10, 2024',
    lastUpdated: 'May 18, 2024',
    status: 'Active',
    type: 'Transactional',
    rules: ['Total purchases > ₹50,000', 'Order frequency > 5 per month', 'Average order value > ₹5,000']
  },
  {
    id: 'SEG-002',
    name: 'Loyal Customers',
    description: 'Repeat customers with consistent engagement',
    customersCount: 2180,
    percentageOfTotal: 17.5,
    createdOn: 'May 05, 2024',
    lastUpdated: 'May 17, 2024',
    status: 'Active',
    type: 'Behavioral',
    rules: ['Membership duration > 1 year', 'App logins > 10 per month', 'Retention score > 80']
  },
  {
    id: 'SEG-003',
    name: 'Potential Customers',
    description: 'Customers showing interest but not yet purchased',
    customersCount: 1890,
    percentageOfTotal: 15.2,
    createdOn: 'Apr 28, 2024',
    lastUpdated: 'May 16, 2024',
    status: 'Active',
    type: 'Behavioral',
    rules: ['Cart additions > 3', 'Newsletter subscriber = Yes', 'Total purchases = 0']
  },
  {
    id: 'SEG-004',
    name: 'New Customers',
    description: 'Recently registered customers within last 30 days',
    customersCount: 1560,
    percentageOfTotal: 12.5,
    createdOn: 'Apr 25, 2024',
    lastUpdated: 'May 15, 2024',
    status: 'Active',
    type: 'Demographic',
    rules: ['Registration date <= 30 days ago', 'First order completed = Yes']
  },
  {
    id: 'SEG-005',
    name: 'Inactive Customers',
    description: 'Customers not active for a long period',
    customersCount: 1320,
    percentageOfTotal: 10.6,
    createdOn: 'Apr 20, 2024',
    lastUpdated: 'May 15, 2024',
    status: 'Active',
    type: 'Behavioral',
    rules: ['Days since last login > 90', 'No purchases in 6 months']
  },
  {
    id: 'SEG-006',
    name: 'At Risk Customers',
    description: 'Customers likely to churn',
    customersCount: 1050,
    percentageOfTotal: 8.4,
    createdOn: 'Apr 18, 2024',
    lastUpdated: 'May 14, 2024',
    status: 'Warning',
    type: 'Behavioral',
    rules: ['Support tickets count > 3', 'Last active > 30 days', 'CSAT score < 6']
  },
  {
    id: 'SEG-007',
    name: 'Price Sensitive',
    description: 'Customers seeking discounts and price cuts',
    customersCount: 1020,
    percentageOfTotal: 8.2,
    createdOn: 'Apr 15, 2024',
    lastUpdated: 'May 12, 2024',
    status: 'Active',
    type: 'Transactional',
    rules: ['Coupon usage rate > 80%', 'Average order discount > 15%', 'Purchased during sale = Yes']
  },
  {
    id: 'SEG-008',
    name: 'Others',
    description: 'Remaining customer groups not matching other categories',
    customersCount: 988,
    percentageOfTotal: 7.9,
    createdOn: 'Apr 10, 2024',
    lastUpdated: 'May 10, 2024',
    status: 'Active',
    type: 'Demographic',
    rules: ['Region is general', 'Demographic tags = Unassigned']
  }
];

export const useCustomerSegmentStore = create<CustomerSegmentStore>((set) => ({
  segments: initialSegments,
  totalCustomers: 12458,
  segmentedCustomers: 10276,
  unsegmentedCustomers: 2182,

  addSegment: (segment) => set((state) => {
    const nextId = `SEG-${Math.floor(100 + Math.random() * 900)}`;
    const count = segment.customersCount || Math.floor(100 + Math.random() * 500);
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

    const newSegment: CustomerSegment = {
      ...segment,
      id: nextId,
      customersCount: count,
      percentageOfTotal: Number(((count / state.totalCustomers) * 100).toFixed(1)),
      createdOn: currentDate,
      lastUpdated: currentDate,
      type: segment.type || 'Behavioral',
      rules: segment.rules || []
    };

    // Recalculate segmented & unsegmented totals
    const newSegmented = Math.min(state.totalCustomers, state.segmentedCustomers + count);
    const newUnsegmented = Math.max(0, state.totalCustomers - newSegmented);

    const updatedSegments = [newSegment, ...state.segments];
    // Update percentages for all segments based on total
    const recalculatedSegments = updatedSegments.map(s => ({
      ...s,
      percentageOfTotal: Number(((s.customersCount / state.totalCustomers) * 100).toFixed(1))
    }));

    return {
      segments: recalculatedSegments,
      segmentedCustomers: newSegmented,
      unsegmentedCustomers: newUnsegmented
    };
  }),

  updateSegment: (updatedSegment) => set((state) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

    const oldSegment = state.segments.find(s => s.id === updatedSegment.id);
    const diffCount = oldSegment ? updatedSegment.customersCount - oldSegment.customersCount : 0;

    const updatedSegments = state.segments.map((s) =>
      s.id === updatedSegment.id
        ? {
            ...updatedSegment,
            lastUpdated: currentDate,
            percentageOfTotal: Number(((updatedSegment.customersCount / state.totalCustomers) * 100).toFixed(1))
          }
        : s
    );

    const newSegmented = Math.min(state.totalCustomers, Math.max(0, state.segmentedCustomers + diffCount));
    const newUnsegmented = Math.max(0, state.totalCustomers - newSegmented);

    return {
      segments: updatedSegments,
      segmentedCustomers: newSegmented,
      unsegmentedCustomers: newUnsegmented
    };
  }),

  deleteSegment: (id) => set((state) => {
    const targetSegment = state.segments.find(s => s.id === id);
    const count = targetSegment ? targetSegment.customersCount : 0;

    const filteredSegments = state.segments.filter((s) => s.id !== id);

    const newSegmented = Math.max(0, state.segmentedCustomers - count);
    const newUnsegmented = Math.min(state.totalCustomers, state.unsegmentedCustomers + count);

    // Recalculate percentages
    const recalculatedSegments = filteredSegments.map(s => ({
      ...s,
      percentageOfTotal: Number(((s.customersCount / state.totalCustomers) * 100).toFixed(1))
    }));

    return {
      segments: recalculatedSegments,
      segmentedCustomers: newSegmented,
      unsegmentedCustomers: newUnsegmented
    };
  })
}));
