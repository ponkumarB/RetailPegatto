import { fetchFromApi } from '@/service/apiClient';
import { BenchRecord } from '@/types/bench-management';

/**
 * GET request for BenchManagementList (paginated)
 */
export async function fetchBenchManagementList(page?: number): Promise<any> {
  const query = page ? `?page=${page}` : '';
  return fetchFromApi(`/user/BenchManagementList/${query}`, {
    method: 'GET',
  });
}

/**
 * GET request for BenchManagementwithoutpagination
 */
export async function fetchBenchManagementWithoutPagination(): Promise<any> {
  return fetchFromApi('/user/BenchManagementwithoutpagination/', {
    method: 'GET',
  });
}

/**
 * POST request for BenchManagementFilter
 */
export async function filterBenchManagement(payload: {
  Department?: string;
  Designation?: string;
  Skills?: string;
  Availability?: string;
  Location?: string;
}): Promise<any> {
  return fetchFromApi('/user/BenchManagementFilter/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET request for BenchManagementSearch
 */
export async function searchBenchManagement(query: string): Promise<any> {
  return fetchFromApi(`/user/BenchManagementSearch/?search=${encodeURIComponent(query)}`, {
    method: 'GET',
  });
}

/**
 * POST request for BenchManagementDashboard
 */
export async function fetchBenchManagementDashboard(): Promise<any> {
  return fetchFromApi('/user/BenchManagementDashboard/', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * CRUD: GET specific record by id
 */
export async function fetchBenchRecordById(id: string | number): Promise<any> {
  return fetchFromApi(`/user/BenchManagementCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * CRUD: POST create bench record
 */
export async function createBenchRecord(payload: BenchRecord): Promise<any> {
  return fetchFromApi('/user/BenchManagementCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * CRUD: PUT update bench record
 */
export async function updateBenchRecord(id: string | number, payload: BenchRecord): Promise<any> {
  return fetchFromApi(`/user/BenchManagementCRUD/?id=${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * CRUD: DELETE bench record
 */
export async function deleteBenchRecord(id: string | number): Promise<any> {
  return fetchFromApi(`/user/BenchManagementCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}
