/**
 * api/client.ts
 * Base fetch wrapper. Uses the Vite proxy (/api → http://localhost:5000/api).
 */

const BASE = import.meta.env.VITE_API_URL || '/api'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
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

  // Handle token expiration/invalid token errors
  if (res.status === 401 || res.status === 403) {
    if (
      data.error === 'Invalid or expired token' || 
      data.error === 'Access token required' ||
      data.error === 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
    ) {
      // Don't trigger logout for verification error, just for token errors
      if (data.error !== 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.') {
        window.dispatchEvent(new Event('session-expired'));
        throw new Error('Tu sesión ha expirado, por favor inicia sesión nuevamente');
      }
    }
  }

  if (!res.ok) throw new Error(data.error ?? 'Error del servidor');
  return data as T;
}

export const api = {
  get:    <T>(path: string)                  => request<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown)  => request<T>(path, { method: 'PUT',    body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
}
