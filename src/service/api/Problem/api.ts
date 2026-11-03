import { fetchFromApi } from '@/service/apiClient';

export interface Problem {
  id?: number;
  Problem_Id?: string;
  Problem_Title: string | null;
  Status: string;
  Reported_On?: string;
  Source: string | null;
  Impact: string;
  Urgency: string | null;
  Priority: string | null;
  Affected_Service: string | null;
  Configuration_Item: string | null;
  Description: string | null;
  Symptoms: string | null;
  Business_Impact: string | null;
  Assignment_Group: string | null;
  Vendor: string | null;
  Due_Date: string | null;
  Detected_By: string | null;
  Detected_On: string | null;
  Root_Cause: string | null;
  Attachments?: any;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Reported_By: number | any | null;
  Category: string | number | null;
  Sub_Category: string | null;
  Assign_To: number | any | null;
  Reference_Incidents: number | any | null;
  Created_By?: number | any;
  Updated_By?: number | any;
  Watchers?: any[];
}

interface ProblemListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Problem[];
}

export const getProblems = async (): Promise<ProblemListResponse> => {
  const response = await fetchFromApi('user/ProblemList/');
  return response;
};

export const getProblem = async (id: number): Promise<Problem> => {
  const response = await fetchFromApi(`user/ProblemCRUD/?id=${id}`);
  return response;
};

export const saveProblem = async (data: Problem): Promise<Problem> => {
  const isUpdating = !!data.id;
  const endpoint = `user/ProblemCRUD/`;
  
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

export const deleteProblem = async (id: number): Promise<void> => {
  await fetchFromApi(`user/ProblemCRUD/?id=${id}`, {
    method: 'DELETE',
  });
};

export const searchProblems = async (query: string): Promise<Problem[]> => {
  const response = await fetchFromApi(`user/ProblemSearch/?search=${query}`);
  return response;
};
