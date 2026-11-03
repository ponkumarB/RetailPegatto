import { fetchFromApi } from '@/service/apiClient';

export async function fetchWBSDocumentsWithPagination(page: number): Promise<any> {
  return fetchFromApi(`/user/Workbreakdowndocumentpagination/?page=${page}`, {
    method: 'GET',
  });
}

export async function createWBSDocument(payload: any): Promise<any> {
  return fetchFromApi('/user/WorkbreakdowndocumentCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateWBSDocument(id: number | string, payload: any): Promise<any> {
  const payloadWithId = { ...payload, id: typeof id === 'string' ? parseInt(id, 10) : id };
  try {
    return await fetchFromApi('/user/WorkbreakdowndocumentCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payloadWithId),
    });
  } catch (error) {
    console.warn('WBS Document PUT to base failed, trying detail route:', error);
    return fetchFromApi(`/user/WorkbreakdowndocumentCRUD/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}

export async function deleteWBSDocument(id: number | string): Promise<any> {
  try {
    return await fetchFromApi(`/user/WorkbreakdowndocumentCRUD/?id=${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('WBS Document DELETE query failed, trying detail route:', error);
    return fetchFromApi(`/user/WorkbreakdowndocumentCRUD/${id}/`, {
      method: 'DELETE',
    });
  }
}

export async function generateWBSDocumentPDF(wbdId: number | string): Promise<any> {
  return fetchFromApi('/user/GenerateWorkbreakdownstructureDocumentAPIView/', {
    method: 'POST',
    body: JSON.stringify({ WBD_Id: typeof wbdId === 'string' ? parseInt(wbdId, 10) : wbdId }),
  });
}
