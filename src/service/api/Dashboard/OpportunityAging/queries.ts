import { useQuery } from '@tanstack/react-query';
import { fetchOpportunityAgingDashboard, OpportunityAgingDashboardPayload } from './api';

export const useOpportunityAgingDashboard = (payload: OpportunityAgingDashboardPayload) => {
  return useQuery({
    queryKey: ['opportunityAgingDashboard', payload],
    queryFn: () => fetchOpportunityAgingDashboard(payload)
  });
};
