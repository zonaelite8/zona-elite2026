/**
 * api/client.ts
 * Base fetch wrapper with timeout, retry, and wake-up support.
 * Uses the Vite proxy (/api → http://localhost:5000/api) in dev,
 * and Vercel rewrites in production.
 */

const BASE = import.meta.env.VITE_API_URL || '/api'

export async function wakeBackend(): Promise<boolean> {
  return true;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

/** Fetch with a 30-second timeout */
async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const existingSignal = init?.signal;
  
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, {
      ...init,
      signal: existingSignal || controller.signal,
    });
    clearTimeout(timeout);
    return res;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado. Intenta de nuevo.');
    }
    throw err;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithTimeout(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });

  const text = await res.text();
  let data: any = {};
  
  try {
    if (text) {
      data = JSON.parse(text);
    }
  } catch (err) {
    console.error('Failed to parse JSON:', text);
  }

  // Handle token expiration/invalid token errors (AGENTS.md rule)
  if (res.status === 401 || res.status === 403) {
    const errMsg = data.error || data.message || '';
    if (
      errMsg.includes('Invalid or expired token') || 
      errMsg.includes('Access token required') ||
      errMsg.includes('token')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('session-expired'));
      throw new Error(errMsg || 'Tu sesión ha expirado, por favor inicia sesión nuevamente');
    }
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Error (${res.status})`);
  }
  return data as T;
}

/** GET with automatic retry */
async function requestWithRetry<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch (err: any) {
    throw err;
  }
}

export const api = {
  get:    <T>(path: string)                  => requestWithRetry<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown)  => request<T>(path, { method: 'PUT',    body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
}
