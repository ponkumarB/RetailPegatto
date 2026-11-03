import { fetchFromApi } from '@/service/apiClient';

/**
 * Get Additional Subscription Request List Customer Wise
 * Endpoint: GET /superadmin/AdditionalSubscriptionRequestlistCusWise?customer_id={id}&page={page}
 */
export async function getAdditionalSubscriptionRequestList(customerId: string | number, page: number = 1): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/AdditionalSubscriptionRequestlistCusWise?customer_id=${customerId}&page=${page}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Get Addon List
 * Endpoint: GET /superadmin/AddonListAPI/?page={page}
 */
export async function getAddonListAPI(page: number = 1): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/AddonListAPI/?page=${page}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Post Additional Subscription Request
 * Endpoint: POST /superadmin/AddsubscriptionrequestCRUDPost/
 */
export async function postAdditionalSubscriptionRequest(payload: any): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/AddsubscriptionrequestCRUDPost/`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Get Additional Storage Request List Customer Wise
 * Endpoint: GET /superadmin/AdditionalStorageRequestlistCusWise?customer_id={id}&page={page}
 */
export async function getAdditionalStorageRequestList(customerId: string | number, page: number = 1): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/AdditionalStorageRequestlistCusWise?customer_id=${customerId}&page=${page}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Get Storage Master List
 * Endpoint: GET /superadmin/storagemasterlist/?page={page}
 */
export async function getStorageMasterListAPI(page: number = 1): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/storagemasterlist/?page=${page}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Post Additional Storage Request
 * Endpoint: POST /superadmin/AdditionalstoragerequestCRUDPost/
 */
export async function postAdditionalStorageRequest(payload: any): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/AdditionalstoragerequestCRUDPost/`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Get Tenant Subscription List
 * Endpoint: GET https://backend.crmfarm.app/education/user/TenantSubscriptionList/
 */
export async function getTenantSubscriptionListAPI(): Promise<any> {
  try {
    return await fetchFromApi('user/TenantSubscriptionList/', {
      method: 'GET',
    });
  } catch (error) {
    console.warn('Failed to fetch TenantSubscriptionList:', error);
    return { results: [] };
  }
}

/**
 * Get Additional License Request List
 * Endpoint: GET /superadmin/AdditionalLicenseRequestlistCusWise
 */
export async function getAdditionalLicenseRequestListAPI(page: number = 1): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/AdditionalLicenseRequestlistCusWise?customer_id=5&page=${page}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Get Additional User Master List
 * Endpoint: GET /superadmin/AdditionalUserMasterList/
 */
export async function getAdditionalUserMasterListAPI(page: number = 1): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/AdditionalUserMasterList/?page=${page}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Post Additional License Request
 * Endpoint: POST /superadmin/AdditionallicenserequestPOST/
 */
export async function postAdditionalLicenseRequest(payload: any): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/AdditionallicenserequestPOST/`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Get Renewal Request List Customer Wise
 * Endpoint: GET /superadmin/RenewalRequestlistCusWise?customer_id={id}&page={page}
 */
export async function getRenewalRequestListCusWiseAPI(customerId: string | number, page: number = 1): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/RenewalRequestlistCusWise?customer_id=${customerId}&page=${page}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Get Plan List
 * Endpoint: GET /superadmin/planlist/?page={page}
 */
export async function getPlanListAPI(page: number = 1): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/planlist/?page=${page}`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Post Renewal Request
 * Endpoint: POST /superadmin/renewalCRUDPost/
 */
export async function postRenewalRequestAPI(payload: any): Promise<any> {
  const url = `https://backend.crmfarm.in/crmfarmsa/superadmin/renewalCRUDPost/`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}
