import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPaymentTermsTemplateList,
  savePaymentTermsTemplate,
  deletePaymentTermsTemplate,
  PaymentTermsTemplate
} from './api';

export const usePaymentTermsTemplateList = (page: number = 1) => {
  return useQuery({
    queryKey: ['paymentTermsTemplates', page],
    queryFn: () => fetchPaymentTermsTemplateList(page)
  });
};

export const useSavePaymentTermsTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: PaymentTermsTemplate) => savePaymentTermsTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentTermsTemplates'] });
    }
  });
};

export const useDeletePaymentTermsTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => deletePaymentTermsTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentTermsTemplates'] });
    }
  });
};
