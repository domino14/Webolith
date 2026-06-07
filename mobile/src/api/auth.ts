import { API_BASE } from './config';

export interface AuthResult {
  token: string;
  username: string;
  member: boolean;
}

export async function loginWithPassword(
  username: string,
  password: string,
): Promise<AuthResult> {
  const resp = await fetch(`${API_BASE}/api/mobile/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error ?? 'Login failed');
  }
  return data as AuthResult;
}

export async function loginWithGoogle(idToken: string): Promise<AuthResult> {
  const resp = await fetch(`${API_BASE}/api/mobile/google-login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error ?? 'Google login failed');
  }
  return data as AuthResult;
}

export async function refreshJwt(token: string): Promise<string | null> {
  try {
    const resp = await fetch(`${API_BASE}/jwt_extend`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}
