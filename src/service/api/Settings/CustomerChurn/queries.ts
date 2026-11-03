import { useQuery } from '@tanstack/react-query';
import { 
  fetchCustomerChurnDashboard, 
  CustomerChurnParams 
} from './api';

export const useCustomerChurnDashboard = (params: CustomerChurnParams) => {
  return useQuery({
    queryKey: ['customerChurnDashboard', params],
    queryFn: () => fetchCustomerChurnDashboard(params),
    enabled: !!params.start_date && !!params.end_date,
  });
};
