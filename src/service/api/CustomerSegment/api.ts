import { fetchFromApi } from '@/service/apiClient';

export interface CustomerSegmentRule {
  field: string;
  operator: string;
  value: number | string;
}

export interface CustomerSegment {
  id: number;
  CustomerSegment_Id: string;
  Segment_Name: string;
  Description: string;
  Status: string;
  Segment_Type: string;
  Initial_Segment_Size: number;
  Rules: CustomerSegmentRule[];
  Is_Deleted: boolean;
  Created_Date: string;
  Updated_Date: string;
  Organization_Id: any;
  Created_By: any;
  Updated_By: any;
}

export interface CustomerSegmentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CustomerSegment[];
}

export interface CustomerSegmentFilterPayload {
  Segment_Type?: string;
}

export interface SegmentedCustomersStats {
  count: number;
  percentage: number;
}

export interface CustomerSegmentationDashboardTopCards {
  total_customers: number;
  total_segments: number;
  segmented_customers: SegmentedCustomersStats;
  unsegmented_customers: SegmentedCustomersStats;
}

export interface SegmentDistribution {
  segment_id: string;
  segment_name: string;
  segment_type: string;
  customer_count: number;
  percentage: number;
}

export interface TrendDataPoint {
  label: string;
  count: number;
}

export interface TrendData {
  segment: string;
  data: TrendDataPoint[];
}

export interface CustomerSegmentationDashboardResponse {
  success: boolean;
  data: {
    top_cards: CustomerSegmentationDashboardTopCards;
    segment_distribution: SegmentDistribution[];
    trend: TrendData[];
  };
}

export interface CustomerSegmentationDashboardPayload {
  organization_id: number;
  period: string[];
}

export interface CustomerSegmentPayload {
  id?: number;
  Organization_Id: number;
  Segment_Name: string;
  Description: string;
  Status: string;
  Segment_Type: string;
  Initial_Segment_Size: number;
  Rules: CustomerSegmentRule[];
  Created_By: number;
  Updated_By: number;
}

export const fetchCustomerSegmentList = async (): Promise<CustomerSegmentListResponse> => {
  return fetchFromApi('/user/CustomerSegmentList/');
};

export const fetchCustomerSegmentSearch = async (search: string): Promise<CustomerSegmentListResponse> => {
  return fetchFromApi(`/user/CustomerSegmentSearch/?search=${encodeURIComponent(search)}`);
};

export const fetchCustomerSegmentFilter = async (payload: CustomerSegmentFilterPayload): Promise<{count: number; page: number; results: CustomerSegment[]}> => {
  return fetchFromApi('/user/CustomerSegmentFilter/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const fetchCustomerSegmentationDashboard = async (payload: CustomerSegmentationDashboardPayload): Promise<CustomerSegmentationDashboardResponse> => {
  return fetchFromApi('/user/CustomerSegmentationDashboard/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const createCustomerSegment = async (payload: CustomerSegmentPayload): Promise<CustomerSegment> => {
  return fetchFromApi('/user/CustomerSegmentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const updateCustomerSegment = async (payload: CustomerSegmentPayload): Promise<CustomerSegment> => {
  return fetchFromApi('/user/CustomerSegmentCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const deleteCustomerSegment = async (id: number): Promise<any> => {
  return fetchFromApi(`/user/CustomerSegmentCRUD/?id=${id}`, {
    method: 'DELETE'
  });
};
