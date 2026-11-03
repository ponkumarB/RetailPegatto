import { useQuery } from '@tanstack/react-query';
import { 
  fetchLeadConversionCards, 
  fetchLeadConversionList, 
  LeadConversionTrackingParams 
} from './api';

export const useLeadConversionCards = (params: LeadConversionTrackingParams) => {
  return useQuery({
    queryKey: ['leadConversionCards', params],
    queryFn: () => fetchLeadConversionCards(params),
    enabled: !!params.start_date && !!params.end_date && !!params.owner_id,
  });
};

export const useLeadConversionList = (params: LeadConversionTrackingParams) => {
  return useQuery({
    queryKey: ['leadConversionList', params],
    queryFn: () => fetchLeadConversionList(params),
    enabled: !!params.start_date && !!params.end_date && !!params.owner_id,
  });
};
