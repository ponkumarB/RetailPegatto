/**
 * Checks if a string is a valid backend tenant name
 */
function isValidTenant(tenant: string | null | undefined): boolean {
  if (!tenant) return false;
  const clean = tenant.trim().toLowerCase();
  if (
    !clean ||
    clean === 'undefined' ||
    clean === 'null' ||
    clean === '[object object]' ||
    clean === 'localhost' ||
    clean.startsWith('localhost:') ||
    clean.includes('127.0.0.1') ||
    clean.includes(':') ||
    clean.includes('/')
  ) {
    return false;
  }
  return true;
}

export function getTenantName(): string {
  const fallback = process.env.NEXT_PUBLIC_TENANT || 'foyertech';

  if (typeof window === 'undefined') {
    return fallback;
  }

  // 1. Extract tenant from subdomain if not localhost and not an IP (Highest Priority)
  const hostname = window.location.hostname;
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (hostname && !isIp && hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.');
    let tenantCandidate = '';
    
    // Local testing: e.g., tenant.localhost
    if (parts.length === 2 && parts[1] === 'localhost') {
      tenantCandidate = parts[0];
    } 
    // Production: e.g., tenant.domain.com
    else if (parts.length >= 3) {
      tenantCandidate = parts[0] === 'www' ? parts[1] : parts[0];
    }

    if (isValidTenant(tenantCandidate)) {
      return tenantCandidate;
    }
  }

  // 2. Check localStorage keys if previously set or stored
  const storedCandidates = [
    localStorage.getItem('Tenantname'),
    localStorage.getItem('tenant'),
    localStorage.getItem('DBName'),
    localStorage.getItem('db'),
  ];
  for (const candidate of storedCandidates) {
    if (isValidTenant(candidate)) {
      return candidate!.trim();
    }
  }

  // 3. Check environment variable override
  if (process.env.NEXT_PUBLIC_TENANT && isValidTenant(process.env.NEXT_PUBLIC_TENANT)) {
    return process.env.NEXT_PUBLIC_TENANT.trim();
  }

  // 4. Default fallback
  return fallback;
}

// Base API URL with trailing slashes stripped
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend.crmfarm.app';
export const BASE_URL = rawBaseUrl.replace(/\/+$/, '');

/**
 * Extracts a clean, human-readable error message from backend error responses
 */
function extractErrorMessage(errData: any): string {
  if (!errData) return '';

  if (typeof errData === 'string') {
    const trimmed = errData.trim();
    // If backend returned raw HTML (e.g. 500 or 502 error page), extract meaningful text or title
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.includes('<body')) {
      const titleMatch = trimmed.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        return titleMatch[1].trim();
      }
      const h1Match = trimmed.match(/<h1>([^<]+)<\/h1>/i);
      if (h1Match && h1Match[1]) {
        return h1Match[1].trim();
      }
      return 'Server error. Please try again later.';
    }
    return trimmed;
  }

  if (Array.isArray(errData)) {
    return errData.map((item) => extractErrorMessage(item)).filter(Boolean).join('; ');
  }

  if (typeof errData === 'object') {
    if (errData.detail && typeof errData.detail === 'string') return errData.detail;
    if (errData.message && typeof errData.message === 'string') return errData.message;
    if (errData.error && typeof errData.error === 'string') return errData.error;
    if (errData.Error && typeof errData.Error === 'string') return errData.Error;

    // Handle Django REST Framework validation dictionaries, e.g. {"field": ["msg"]}
    const messages: string[] = [];
    for (const [key, val] of Object.entries(errData)) {
      if (Array.isArray(val)) {
        messages.push(`${key}: ${val.join(', ')}`);
      } else if (typeof val === 'string') {
        messages.push(`${key}: ${val}`);
      } else if (val && typeof val === 'object') {
        messages.push(`${key}: ${extractErrorMessage(val)}`);
      }
    }
    if (messages.length > 0) return messages.join('; ');

    try {
      return JSON.stringify(errData);
    } catch {
      return String(errData);
    }
  }

  return String(errData);
}

// Helper fetcher for TanStack Query endpoints
export async function fetchFromApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('token') || localStorage.getItem('accesstoken') || localStorage.getItem('accessToken'))
    : null;
  const tenant = getTenantName();

  // Merge headers safely
  const headers = new Headers(options?.headers);

  // If body is FormData, browser MUST set boundary header automatically, so remove Content-Type
  const isFormData = typeof FormData !== 'undefined' && options?.body instanceof FormData;
  if (isFormData) {
    headers.delete('Content-Type');
  } else if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Check if token injection should be bypassed
  const noAuth = headers.get('X-No-Auth') === 'true';
  headers.delete('X-No-Auth');

  // Auto-inject or override malformed token headers
  if (!noAuth) {
    const authHeader = headers.get('Authorization');
    if (token && (!authHeader || authHeader === 'Bearer undefined' || authHeader === 'Bearer null' || authHeader.trim() === 'Bearer')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Inject tenant as db header
  if (tenant && !headers.has('db')) {
    headers.set('db', tenant);
  }

  // Construct URL safely:
  // 1. If endpoint is already an absolute URL (e.g. from pagination res.next), use it directly
  // 2. Prevent duplicate tenant prefixes (e.g. /foyertech/foyertech/...)
  let url: string;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    url = endpoint;
  } else {
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    cleanEndpoint = cleanEndpoint.replace(/^\/+/, '/');
    if (cleanEndpoint.startsWith(`/${tenant}/`)) {
      cleanEndpoint = cleanEndpoint.substring(tenant.length + 1);
    } else if (cleanEndpoint === `/${tenant}`) {
      cleanEndpoint = '/';
    }
    // Remap broken/legacy backend endpoints to their working equivalents
    if (cleanEndpoint.startsWith('/user/SalesShipmentList/')) {
      cleanEndpoint = '/user/SalesShipmentAllAdditional/?Is_Deleted=False&page=1';
    } else if (cleanEndpoint.startsWith('/user/StoreList/')) {
      cleanEndpoint = '/user/StoreMasterList/?Is_Deleted=False';
    } else if (cleanEndpoint.startsWith('/user/SalesScheduleAllAdditional/')) {
      cleanEndpoint = cleanEndpoint.replace('/user/SalesScheduleAllAdditional/', '/user/SalesScheduleAdditional/');
    }

    url = `${BASE_URL}/${tenant}${cleanEndpoint}`;
  }

  // Safely prepare request options
  const requestOptions: RequestInit = {
    credentials: 'omit',
    ...options,
    headers,
  };

  // Ensure plain object bodies are stringified and method is defaulted to POST if body exists
  if (
    requestOptions.body &&
    typeof requestOptions.body === 'object' &&
    !isFormData &&
    !(typeof Blob !== 'undefined' && requestOptions.body instanceof Blob) &&
    !(typeof URLSearchParams !== 'undefined' && requestOptions.body instanceof URLSearchParams)
  ) {
    try {
      requestOptions.body = JSON.stringify(requestOptions.body);
    } catch (e) {
      console.warn('[apiClient] Failed to stringify request body:', e);
    }
  }

  if (requestOptions.body && !requestOptions.method) {
    requestOptions.method = 'POST';
  }

  // Ensure required fields exist for backend endpoints with fragile parsers
  if (
    url.includes('/user/SalesShipmentFilter/') &&
    requestOptions.body &&
    typeof requestOptions.body === 'string'
  ) {
    try {
      const parsed = JSON.parse(requestOptions.body);
      let modified = false;
      if (parsed.fromdate === undefined) {
        parsed.fromdate = '';
        modified = true;
      }
      if (parsed.todate === undefined) {
        parsed.todate = '';
        modified = true;
      }
      if (modified) {
        requestOptions.body = JSON.stringify(parsed);
      }
    } catch {}
  }

  // 12-second timeout protection so requests fail fast to offline cache instead of freezing the UI
  const controller = new AbortController();
  const timeoutMs = 12000;
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  if (!requestOptions.signal) {
    requestOptions.signal = controller.signal;
  }

  let res: Response;
  try {
    res = await fetch(url, requestOptions);
  } catch (fetchError: any) {
    if (fetchError?.name === 'AbortError' || controller.signal.aborted) {
      const timeoutErr: any = new Error(
        `Request timeout: The server took longer than ${timeoutMs / 1000}s to respond (504 Gateway Timeout).`
      );
      timeoutErr.status = 504;
      timeoutErr.isTimeout = true;
      timeoutErr.url = url;
      timeoutErr.endpoint = endpoint;
      throw timeoutErr;
    }

    if (endpoint.toLowerCase().includes('userfilesandurls')) {
      if (typeof window !== 'undefined') {
        try {
          const { toast } = await import('sonner');
          toast.error('Content file too large');
        } catch (e) {
          console.error('Toast failed:', e);
        }
      }
      const err: any = new Error('Content file too large');
      err.status = 413;
      throw err;
    }

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineErr: any = new Error('No internet connection. Please check your network.');
      offlineErr.status = 0;
      offlineErr.isOffline = true;
      throw offlineErr;
    }

    throw fetchError;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let rawErrorData: any = null;
    let errorDetail = '';

    if (res.status === 504) {
      errorDetail = 'Gateway Timeout (504): The upstream backend server is taking too long to respond.';
    } else {
      try {
        const errorText = await res.text();
        if (errorText && errorText.trim()) {
          try {
            rawErrorData = JSON.parse(errorText);
            errorDetail = extractErrorMessage(rawErrorData);
          } catch {
            errorDetail = extractErrorMessage(errorText);
          }
        }
      } catch {
        errorDetail = res.statusText || '';
      }
    }

    // Consolidated 401 Session Expiry handling without infinite redirect loop
    if (res.status === 401 && !endpoint.includes('auth_token') && !endpoint.includes('login')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');

        import('@/store/useAuthStore')
          .then(({ useAuthStore }) => {
            useAuthStore.getState().logout();
          })
          .catch(() => {});

        if (window.location.pathname !== '/login') {
          try {
            import('sonner').then(({ toast }) => {
              toast.error('Session expired. Please log in again.');
            }).catch(() => {});
          } catch {}
          window.location.href = '/login';
        }
      }
    }

    if (endpoint.toLowerCase().includes('userfilesandurls')) {
      const isTooLarge =
        res.status === 413 ||
        errorDetail.toLowerCase().includes('content too large') ||
        errorDetail.toLowerCase().includes('too large');
      if (isTooLarge) {
        if (typeof window !== 'undefined') {
          try {
            const { toast } = await import('sonner');
            toast.error('Content file too large');
          } catch (e) {
            console.error('Toast failed:', e);
          }
        }
        const largeFileErr: any = new Error('Content file too large');
        largeFileErr.status = 413;
        throw largeFileErr;
      }
    }

    // Attach structured metadata so callers can inspect err.status, err.data, etc.
    const displayMessage = `API error: ${res.status} ${res.statusText || ''} ${errorDetail}`.trim();
    const apiError: any = new Error(displayMessage);
    apiError.status = res.status;
    apiError.statusText = res.statusText;
    apiError.data = rawErrorData;
    apiError.url = url;
    apiError.endpoint = endpoint;

    throw apiError;
  }

  // Handle empty bodies (e.g. 204 No Content) gracefully without JSON syntax errors
  let text = '';
  try {
    text = await res.text();
  } catch {
    return null as any;
  }

  if (!text || text.trim() === '') {
    return null as any;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as any;
  }
}
