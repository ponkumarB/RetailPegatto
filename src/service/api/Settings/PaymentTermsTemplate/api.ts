import { fetchFromApi } from '@/service/apiClient';

export interface MilestoneSchedule {
  Milestone: string;
  Percentage: number;
  Payment_Due: string;
}

export interface PaymentTermsTemplate {
  id?: number;
  PaymentTermsTemplate_Id?: string;
  Template_Name: string;
  Project_Type: string;
  Project_Name: string;
  Applicability: string;
  Currency: string;
  Payment_Type: string;
  Payment_Methods: string[];
  Milestone_Schedule: MilestoneSchedule[];
  Advance_Payment_Percentage: number | string;
  Advance_Payment_Due: string;
  Payment_Terms: string;
  Tax_Terms: string;
  Other_Terms: string;
  Validity_Days: number;
  Notes: string;
  Is_Default_Template: boolean;
  Is_Deleted?: boolean;
  Organization_Id?: number | any;
  Created_By?: number | any;
  Updated_By?: number | any;
  Created_Date?: string;
  Updated_Date?: string;
}

export interface PaymentTermsTemplateListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PaymentTermsTemplate[];
}

export const fetchPaymentTermsTemplateList = async (page: number = 1): Promise<PaymentTermsTemplateListResponse> => {
  return fetchFromApi(`/user/PaymentTermsTemplateList/?page=${page}`, {
    method: 'GET',
  });
};

export const savePaymentTermsTemplate = async (data: PaymentTermsTemplate): Promise<PaymentTermsTemplate> => {
  const isEdit = !!data.id;
  const payload = {
    ...data,
    Organization_Id: 1 // Default as requested in payload example
  };
  
  return fetchFromApi('/user/PaymentTermsTemplateCRUD/', {
    method: isEdit ? 'PUT' : 'POST',
    body: JSON.stringify(payload)
  });
};

export const deletePaymentTermsTemplate = async (id: number): Promise<any> => {
  return fetchFromApi(`/user/PaymentTermsTemplateCRUD/?id=${id}`, {
    method: 'DELETE'
  });
};
