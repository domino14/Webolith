/**
 * Thin fetch wrapper that:
 *  - Attaches Authorization: Bearer <token> from the token getter
 *  - On 401, attempts one silent refresh then retries
 *  - Throws ApiError with status + body on non-2xx responses
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = 'ApiError';
  }
}

// Injected by AuthContext so this module doesn't import React.
let _getToken: () => string | null = () => null;
let _refreshToken: () => Promise<string | null> = async () => null;

export function configureClient(
  getToken: () => string | null,
  refreshToken: () => Promise<string | null>,
) {
  _getToken = getToken;
  _refreshToken = refreshToken;
}

async function _fetch(
  url: string,
  options: RequestInit,
  token: string | null,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');
  return fetch(url, { ...options, headers });
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let token = _getToken();
  let resp = await _fetch(url, options, token);

  if (resp.status === 401) {
    // Attempt one silent refresh.
    token = await _refreshToken();
    if (token) {
      resp = await _fetch(url, options, token);
    }
  }

  if (!resp.ok) {
    let body: unknown;
    try {
      body = await resp.json();
    } catch {
      body = await resp.text();
    }
    throw new ApiError(resp.status, body);
  }

  return resp.json() as Promise<T>;
}

export function apiGet<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'GET' });
}

export function apiPost<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
