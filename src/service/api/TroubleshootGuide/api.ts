import { fetchFromApi } from '@/service/apiClient';
import { Problem } from '@/service/api/Problem/api';

export interface TroubleshootGuide {
  id?: number;
  ITTroubleShootGuide_Id?: string;
  Guide_Title: string;
  Guide_Code: string;
  Category: string;
  Applies_To: string;
  Status: string;
  Priority: string;
  Description?: string | null;
  Symptoms?: string | null;
  Root_Cause?: string | null;
  Prerequisites?: string | null;
  Notes?: string | null;
  Review_Date?: string | null;
  Version?: string | null;
  Visibility?: string | null;
  Troubleshoot_Steps?: string[] | null;
  Attachment?: string | null;
  Created_Date?: string;
  Updated_Date?: string;
  Is_Deleted?: boolean;
  Issue_Problem?: number | null | Problem;
  Author?: number | null | any;
  Reviewed_By?: number | null | any;
  Approved_By?: number | null | any;
  Organization_Id?: number | null | any;
  Created_By?: number | null | any;
  Updated_By?: number | null | any;
}

export interface TroubleshootGuideListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TroubleshootGuide[];
  page?: number;
}

export interface TroubleshootGuideFilterParams {
  Organization_Id?: number;
  Guide_Title?: string;
  Guide_Code?: string;
  Issue_Problem?: number | null;
  Category?: string;
  Applies_To?: string;
  Status?: string;
  Priority?: string;
  Review_Date?: string;
  Author?: number | null;
  Reviewed_By?: number | null;
  Approved_By?: number | null;
  Version?: string;
  Visibility?: string;
  Created_By?: number | null;
  page?: number;
}

export const getTroubleshootGuides = async (page: number = 1): Promise<TroubleshootGuideListResponse> => {
  const data = await fetchFromApi(`user/ITTroubleShootGuideList/?page=${page}`);
  return data;
};

export const filterTroubleshootGuides = async (params: TroubleshootGuideFilterParams): Promise<TroubleshootGuideListResponse> => {
  const data = await fetchFromApi('user/ITTroubleShootGuideFilter/', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return data;
};

export const searchTroubleshootGuides = async (searchTerm: string): Promise<TroubleshootGuide[]> => {
  const data = await fetchFromApi(`user/ITTroubleShootGuideSearch/?search=${encodeURIComponent(searchTerm)}`);
  return data;
};

export const getTroubleshootGuideById = async (id: number): Promise<TroubleshootGuide> => {
  const data = await fetchFromApi(`user/ITTroubleShootGuideCRUD/?id=${id}`);
  return data;
};

export const saveTroubleshootGuide = async (guide: TroubleshootGuide): Promise<TroubleshootGuide> => {
  const method = guide.id ? 'PUT' : 'POST';
  const data = await fetchFromApi('user/ITTroubleShootGuideCRUD/', {
    method,
    body: JSON.stringify(guide),
  });
  return data;
};

export const deleteTroubleshootGuide = async (id: number): Promise<void> => {
  await fetchFromApi(`user/ITTroubleShootGuideCRUD/?id=${id}`, {
    method: 'DELETE',
  });
};
