import { create } from 'zustand';
import * as api from '@/service/api/customer-retention/api';

export interface AtRiskCustomer {
  id: string;
  name: string;
  segment: 'Enterprise' | 'SMB' | 'Small Business' | 'Startup';
  revenueAtRisk: number;
  churnRisk: 'High' | 'Medium' | 'Low';
  reason: string;
  contactName: string;
  contactEmail: string;
  actionCategory: 'discount' | 'support' | 'features';
  status: 'At Risk' | 'Retained' | 'Lost';
}

export interface MetricCard {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  color: string;
}

export interface RetentionTrend {
  month: string;
  rate: number;
}

export interface CustomerSegment {
  name: string;
  rate: number;
  customers: number;
  percentage: number;
  color: string;
}


export interface ChurnReason {
  reason: string;
  customers: number;
  percentage: number;
  color: string;
}

interface CustomerRetentionState {
  metrics: {
    totalCustomers: MetricCard;
    retainedCustomers: MetricCard;
    retentionRate: MetricCard;
    churnedCustomers: MetricCard;
    revenueAtRisk: MetricCard;
  };
  trendData: RetentionTrend[];
  segmentData: CustomerSegment[];
  churnReasons: ChurnReason[];
  atRiskCustomers: AtRiskCustomer[];
  loading: boolean;
  error: string | null;
  fetchDashboardData: (startDate: string, endDate: string) => Promise<void>;
  resolveCustomerRisk: (customerId: string, newStatus: 'Retained' | 'Lost') => Promise<void>;
}

const initialMetrics = {
  totalCustomers: { label: 'Total Customers', value: '0', trend: '', isPositive: true, color: 'text-blue-600 bg-blue-50 dark:bg-blue-955/40 border-blue-100 dark:border-blue-900/40' },
  retainedCustomers: { label: 'Retained Customers', value: '0', trend: '', isPositive: true, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-955/40 border-emerald-100 dark:border-emerald-900/40' },
  retentionRate: { label: 'Retention Rate', value: '0.0', trend: '', isPositive: true, color: 'text-amber-600 bg-amber-50 dark:bg-amber-955/20 border-amber-100 dark:border-amber-900/40' },
  churnedCustomers: { label: 'Churned Customers', value: '0', trend: '', isPositive: false, color: 'text-purple-600 bg-purple-50 dark:bg-purple-955/20 border-purple-100 dark:border-purple-900/40' },
  revenueAtRisk: { label: 'Revenue at Risk', value: '0.0', trend: '', isPositive: false, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-955/20 border-cyan-100 dark:border-cyan-900/40' }
};

export const useCustomerRetentionStore = create<CustomerRetentionState>((set, get) => ({
  metrics: initialMetrics,
  trendData: [],
  segmentData: [],
  churnReasons: [],
  atRiskCustomers: [],
  loading: false,
  error: null,

  fetchDashboardData: async (startDate: string, endDate: string) => {
    set({ loading: true, error: null });
    try {
      const datePayload = { Created_Date: [startDate, endDate] };

      // Execute all dashboard queries in parallel using allSettled to prevent single-endpoint failure from blocking the entire dashboard
      const results = await Promise.allSettled([
        api.customerretentiondashboardsummary(datePayload),
        api.customerretentionratetrend(datePayload),
        api.customerretentionsegmentanalysis(datePayload),
        api.customerretentionchurnreasons(datePayload),
        api.customerretentionfilter({
          CustomerRetention_Id: '',
          Segment: '',
          RetentionStatus: '',
          ChurnReason: '',
          Created_Date: [startDate, endDate],
          page: 1
        })
      ]);

      const summaryRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const trendRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const segmentRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const churnRes = results[3].status === 'fulfilled' ? results[3].value : null;
      const filterRes = results[4].status === 'fulfilled' ? results[4].value : null;

      // Log errors for any rejected API requests
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          console.error(`Customer Retention API promise ${idx} failed:`, r.reason);
        }
      });

      console.log('Customer Retention API responses (settled):', {
        summaryRes,
        trendRes,
        segmentRes,
        churnRes,
        filterRes
      });

      // 1. Map Metrics
      const updatedMetrics = { ...get().metrics };
      if (Array.isArray(summaryRes)) {
        summaryRes.forEach(item => {
          const mKey = item.metric;
          const val = item.count;
          if (mKey === 'Total Customers') {
            updatedMetrics.totalCustomers = { ...updatedMetrics.totalCustomers, value: String(val) };
          } else if (mKey === 'Retained Customers') {
            updatedMetrics.retainedCustomers = { ...updatedMetrics.retainedCustomers, value: String(val) };
          } else if (mKey === 'Retention Rate') {
            updatedMetrics.retentionRate = { ...updatedMetrics.retentionRate, value: Number(val).toFixed(1) };
          } else if (mKey === 'Churned Customers') {
            updatedMetrics.churnedCustomers = { ...updatedMetrics.churnedCustomers, value: String(val) };
          } else if (mKey === 'Revenue At Risk') {
            updatedMetrics.revenueAtRisk = { ...updatedMetrics.revenueAtRisk, value: Number(val).toFixed(1) };
          }
        });
      }

      // 2. Map Trend Data
      const updatedTrendData = Array.isArray(trendRes) ? trendRes.map((item: any) => ({
        month: item.Month || 'Unknown',
        rate: Number(item.RetentionRate || 0)
      })) : [];

      // 3. Map Segment Data
      const segmentColors: Record<string, string> = {
        'Enterprise': '#3b82f6',
        'SMB': '#10b981',
        'Small Business': '#f59e0b',
        'Startup': '#8b5cf6'
      };
      const totalSegmentCustomers = Array.isArray(segmentRes) ? segmentRes.reduce((acc, curr) => acc + (curr.count || 0), 0) : 0;
      const updatedSegmentData = Array.isArray(segmentRes) ? segmentRes.map((item: any) => ({
        name: item.segment || 'Unknown',
        rate: Number(item.retention_rate || 0),
        customers: Number(item.count || 0),
        percentage: totalSegmentCustomers > 0 ? parseFloat(((item.count / totalSegmentCustomers) * 100).toFixed(2)) : 0,
        color: segmentColors[item.segment] || '#64748b'
      })) : [];


      // 5. Map Churn Reasons
      const updatedChurnReasons = Array.isArray(churnRes) ? churnRes.map((item: any) => ({
        reason: item.reason || 'Unknown',
        customers: Number(item.count || 0),
        percentage: Number(item.percentage || 0),
        color: 'bg-rose-500'
      })) : [];

      // 6. Map At-Risk Customers
      const filterResults = filterRes?.results || [];
      const updatedAtRiskCustomers = Array.isArray(filterResults) ? filterResults.map((item: any) => {
        const acc = item.Account_Id || {};
        const companyName = acc.Organization_Name || acc.Contact_Name || acc.Lead_Name || `Account ${item.Account_Id}`;
        const contactName = acc.Contact_Name || acc.Lead_Name || 'N/A';
        const contactEmail = acc.Mail || acc.Email_Id || 'N/A';
        
        const score = Number(item.RiskScore || 0);
        let churnRisk: 'High' | 'Medium' | 'Low' = 'Low';
        if (score >= 70) churnRisk = 'High';
        else if (score >= 30) churnRisk = 'Medium';

        let actionCategory: 'discount' | 'support' | 'features' = 'discount';
        const reasonLower = (item.ChurnReason || '').toLowerCase();
        const actionLower = (item.RecommendedAction || '').toLowerCase();
        if (reasonLower.includes('support') || reasonLower.includes('service') || actionLower.includes('support') || actionLower.includes('service')) {
          actionCategory = 'support';
        } else if (reasonLower.includes('feature') || reasonLower.includes('integration') || actionLower.includes('feature') || actionLower.includes('integration')) {
          actionCategory = 'features';
        }

        let status: 'At Risk' | 'Retained' | 'Lost' = 'At Risk';
        if (item.RetentionStatus === 'Churned') status = 'Lost';
        else if (item.RetentionStatus === 'Active' || item.RetentionStatus === 'Reactivated') status = 'Retained';

        return {
          id: String(item.id),
          name: companyName,
          segment: item.Segment || 'Enterprise',
          revenueAtRisk: parseFloat(item.RevenueAtRisk || '0'),
          churnRisk,
          reason: item.ChurnReason || 'N/A',
          contactName,
          contactEmail,
          actionCategory,
          status
        };
      }) : [];

      const hasSummaryError = results[0].status === 'rejected';
      const summaryErrorMsg = hasSummaryError ? ((results[0] as PromiseRejectedResult).reason?.message || 'Failed to load dashboard summary metrics') : null;

      set({
        metrics: updatedMetrics,
        trendData: updatedTrendData,
        segmentData: updatedSegmentData,
        churnReasons: updatedChurnReasons,
        atRiskCustomers: updatedAtRiskCustomers,
        error: summaryErrorMsg,
        loading: false
      });
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err);
      set({ error: err.message || 'Failed to load customer retention data', loading: false });
    }
  },

  resolveCustomerRisk: async (customerId: string, newStatus: 'Retained' | 'Lost') => {
    set({ loading: true, error: null });
    try {
      const statusValue = newStatus === 'Retained' ? 'Active' : 'Churned';
      const riskScore = newStatus === 'Retained' ? 10 : 100;
      
      await api.customerretentioncrudPatch({
        id: parseInt(customerId, 10),
        RetentionStatus: statusValue,
        RiskScore: riskScore
      });

      // Update local state to ensure instant feedback
      set((state) => ({
        atRiskCustomers: state.atRiskCustomers.map((cust) =>
          cust.id === customerId ? { ...cust, status: newStatus } : cust
        ),
        loading: false
      }));
    } catch (err: any) {
      console.error('Failed to resolve customer risk:', err);
      set({ error: err.message || 'Failed to update resolution status', loading: false });
      throw err;
    }
  }
}));
