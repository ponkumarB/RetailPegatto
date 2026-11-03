import { fetchFromApi } from '../../apiClient';

export const getPriceTrackingList = async (page: number = 1) => {
  const response = await fetchFromApi(`/user/PriceTrackingList/?page=${page}`);
  return response;
};

export const getPriceTrackingById = async (id: number) => {
  const response = await fetchFromApi(`/user/PriceTrackingCRUD/?id=${id}`);
  return response;
};

export const createPriceTracking = async (data: any) => {
  const response = await fetchFromApi('/user/PriceTrackingCRUD/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
};

export const updatePriceTracking = async (id: number, data: any) => {
  const response = await fetchFromApi('/user/PriceTrackingCRUD/', {
    method: 'PUT',
    body: JSON.stringify({ id, ...data }),
  });
  return response;
};

export const deletePriceTracking = async (id: number) => {
  const response = await fetchFromApi(`/user/PriceTrackingCRUD/?id=${id}`, {
    method: 'DELETE',
  });
  return response;
};

export const getPriceTrackingDashboard = async (period: [string, string]) => {
  const response = await fetchFromApi('/user/PriceTrackingDashboard/', {
    method: 'POST',
    body: JSON.stringify({ period }),
  });
  return response;
};

export const filterPriceTracking = async (data: any) => {
  const response = await fetchFromApi('/user/PriceTrackingFilter/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response;
};
