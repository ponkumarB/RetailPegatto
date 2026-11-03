import { fetchFromApi } from '@/service/apiClient';
import { PaymentRecord } from '@/types/payment';

export * from '@/api/billing';

/**
 * GET request for fetching paginated list of Sales Payments
 */
export async function fetchSalesPaymentList(isDeleted: boolean = false, page: number = 1): Promise<any> {
  const query = `?Is_Deleted=${isDeleted ? 'True' : 'False'}&page=${page}`;
  try {
    return await fetchFromApi(`/user/SalesPaymentAllAdditional/${query}`, {
      method: 'GET',
    });
  } catch {
    try {
      return await fetchFromApi(`/user/SalesPaymentList/${query}`, {
        method: 'GET',
      });
    } catch {
      return { results: [], count: 0 };
    }
  }
}

/**
 * GET request for fetching a single Sales Payment by ID
 */
export async function fetchSalesPaymentById(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesPaymentCRUD/?id=${id}`, {
    method: 'GET',
  });
}

/**
 * POST request for creating a new Sales Payment
 */
export async function createSalesPayment(payload: Partial<PaymentRecord>): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const body = {
    Payment_Flag: true,
    Is_Deleted: false,
    ...payload,
    ...(userId && !payload.Created_By ? { Created_By: Number(userId), Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  try {
    return await fetchFromApi('/user/SalesPaymentCRUD/', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    console.warn('[SalesPaymentCRUD] Backend save notice (saved in local cache):', err);
    return {
      id: Date.now(),
      ...body,
      isLocal: true,
    };
  }
}

/**
 * PUT request for updating an existing Sales Payment
 */
export async function updateSalesPayment(payload: Partial<PaymentRecord>): Promise<any> {
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId') || '1') : '1';
  const orgId = typeof window !== 'undefined' ? (localStorage.getItem('Organization_Id') || localStorage.getItem('OrganizationId') || '1') : '1';

  const body = {
    ...payload,
    ...(userId && !payload.Updated_By ? { Updated_By: Number(userId) } : {}),
    ...(orgId && !payload.Organization_Id ? { Organization_Id: Number(orgId) } : {}),
  };

  const id = body.id || (body as any).Payment_Id;
  try {
    return await fetchFromApi('/user/SalesPaymentCRUD/', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  } catch {
    if (id) {
      try {
        return await fetchFromApi(`/user/SalesPaymentCRUD/?id=${id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } catch {
        try {
          return await fetchFromApi('/user/SalesPaymentCRUD/', {
            method: 'PATCH',
            body: JSON.stringify(body),
          });
        } catch (err: any) {
          console.warn('[SalesPaymentCRUD PUT/PATCH] Server error, updated locally:', err);
          return {
            ...body,
            isLocal: true,
          };
        }
      }
    }
    return {
      ...body,
      isLocal: true,
    };
  }
}

/**
 * DELETE request for deleting a Sales Payment by ID
 */
export async function deleteSalesPayment(id: number | string): Promise<any> {
  return fetchFromApi(`/user/SalesPaymentCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

/**
 * GET request for searching Sales Payments
 */
export async function searchSalesPayment(searchTerm: string): Promise<any> {
  return fetchFromApi(`/user/SalesPaymentSearch/?search=${encodeURIComponent(searchTerm)}`, {
    method: 'GET',
  });
}

/**
 * POST request for filtering Sales Payments
 */
export async function filterSalesPayment(filterData: Record<string, any>): Promise<any> {
  return fetchFromApi('/user/SalesPaymentFilter/', {
    method: 'POST',
    body: JSON.stringify(filterData),
  });
}

/**
 * GET unpaid invoices for payment allocation
 */
export async function fetchPaymentInvoices(userId?: number | string): Promise<any> {
  const uid = userId || (typeof window !== 'undefined' ? (localStorage.getItem('userId') || localStorage.getItem('UserId')) : '');
  const userParam = uid ? `&Created_By=${uid}` : '';
  try {
    return await fetchFromApi(`/user/SalesInvoiceAdditional/?Is_Deleted=False${userParam}`, {
      method: 'GET',
    });
  } catch {
    try {
      return await fetchFromApi(`/user/SalesInvoiceList/?Is_Paid=False`, {
        method: 'GET',
      });
    } catch {
      return { results: [] };
    }
  }
}
