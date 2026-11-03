import { fetchFromApi } from '@/service/apiClient';

export interface ProblemCategory {
  id?: number;
  ProblemCategory_Id?: string;
  Category_Name: string | null;
  Category_Code: string | null;
  Parent_Category: string | null;
  Description: string | null;
  Status: string | null;
  Display_Order: number | null;
  Associated_Service: string | null;
  Default_Priority: string | null;
  Impact: string | null;
  Affects_Business_Process: string | null;
  Notes: string | null;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Created_By?: number | any;
  Updated_By?: number | any;
}

interface ProblemCategoryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ProblemCategory[];
}

export const getProblemCategories = async (): Promise<ProblemCategoryListResponse> => {
  const response = await fetchFromApi('user/ProblemCategoryList/');
  return response;
};

export const getProblemCategoriesWithoutPagination = async (): Promise<ProblemCategory[]> => {
  const response = await fetchFromApi('user/ProblemCategoryListwithoutpagination/');
  return response;
};

export const getProblemCategory = async (id: number): Promise<ProblemCategory> => {
  const response = await fetchFromApi(`user/ProblemCategoryCRUD/?id=${id}`);
  return response;
};

export const saveProblemCategory = async (data: ProblemCategory): Promise<ProblemCategory> => {
  const isUpdating = !!data.id;
  const endpoint = `user/ProblemCategoryCRUD/`;
  
  const payload = { ...data };
  
  const response = await fetchFromApi(endpoint, {
    method: isUpdating ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  return response;
};

export const deleteProblemCategory = async (id: number): Promise<void> => {
  await fetchFromApi(`user/ProblemCategoryCRUD/?id=${id}`, {
    method: 'DELETE',
  });
};

export const searchProblemCategories = async (query: string): Promise<ProblemCategory[]> => {
  const response = await fetchFromApi(`user/ProblemCategorySearch/?search=${query}`);
  return response;
};
