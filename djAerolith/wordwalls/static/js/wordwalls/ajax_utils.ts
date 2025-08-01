/**
 * Modern fetch-based replacement for jQuery AJAX functionality
 */

interface AjaxOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, unknown> | string;
  dataType?: 'json' | 'text' | 'html';
  contentType?: string;
  async?: boolean;
}

interface AjaxResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
}

/**
 * Modern replacement for $.ajax()
 */
export async function ajax<T = unknown>(options: AjaxOptions): Promise<AjaxResponse<T>> {
  const {
    url,
    method = 'GET',
    data,
    dataType = 'json',
    contentType = 'application/x-www-form-urlencoded; charset=UTF-8',
    // async is ignored in fetch (always async)
  } = options;

  // Prepare request options
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': contentType,
    },
  };

  // Add CSRF token for POST requests
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      (fetchOptions.headers as Record<string, string>)['X-CSRFToken'] = csrfToken;
    }
  }

  // Prepare body data
  if (data) {
    if (contentType.includes('application/json')) {
      fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
    } else {
      // Form data
      if (typeof data === 'object') {
        const formData = new URLSearchParams();
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        fetchOptions.body = formData;
      } else {
        fetchOptions.body = data;
      }
    }
  }

  const response = await fetch(url, fetchOptions);
  
  let responseData: T;
  
  switch (dataType) {
    case 'json':
      responseData = await response.json();
      break;
    case 'text':
    case 'html':
      responseData = await response.text() as T;
      break;
    default:
      responseData = await response.json();
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
  };
}

/**
 * Get CSRF token from cookie or meta tag
 */
function getCsrfToken(): string | null {
  // Try to get from cookie first (Django's default)
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrftoken') {
      return decodeURIComponent(value);
    }
  }
  
  // Try to get from meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
  if (metaTag) {
    return metaTag.content;
  }
  
  return null;
}

/**
 * Simplified AJAX methods for common use cases
 */
export const ajaxUtils = {
  get: <T = unknown>(url: string, data?: Record<string, unknown>): Promise<AjaxResponse<T>> => {
    const queryString = data ? '?' + new URLSearchParams(
      Object.entries(data).map(([key, value]) => [key, String(value)])
    ).toString() : '';
    return ajax<T>({ url: url + queryString, method: 'GET' });
  },

  post: <T = unknown>(url: string, data?: Record<string, unknown> | string, contentType?: string): Promise<AjaxResponse<T>> => {
    return ajax<T>({ url, method: 'POST', data, contentType });
  },

  postJson: <T = unknown>(url: string, data: Record<string, unknown>): Promise<AjaxResponse<T>> => {
    return ajax<T>({ 
      url, 
      method: 'POST', 
      data, 
      contentType: 'application/json; charset=utf-8' 
    });
  },
};