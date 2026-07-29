/**
 * api/client.ts
 * Base fetch wrapper with timeout, retry, and wake-up support.
 * Uses the Vite proxy (/api → http://localhost:5000/api) in dev,
 * and Vercel rewrites in production.
 */

const BASE = import.meta.env.VITE_API_URL || '/api'

// --- Connection state (global) ---
let _backendAwake = false;
let _wakePromise: Promise<boolean> | null = null;

/** Emits a custom event so App.tsx can show/hide the connection banner */
function emitConnectionStatus(status: 'connecting' | 'connected' | 'error') {
  window.dispatchEvent(new CustomEvent('backend-status', { detail: status }));
}

/** Wake up the backend with a lightweight ping. Returns true if successful. */
export async function wakeBackend(): Promise<boolean> {
  if (_backendAwake) return true;
  // Deduplicate: if a wake is already in progress, reuse it
  if (_wakePromise) return _wakePromise;

  _wakePromise = (async () => {
    emitConnectionStatus('connecting');
    // Try up to 3 times with increasing delays (backend may take 30-60s to wake on Render)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), attempt === 1 ? 15000 : 30000);
        const res = await fetch(`${BASE}/wake`, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          _backendAwake = true;
          emitConnectionStatus('connected');
          return true;
        }
      } catch {
        // Wait before retrying (5s, then 10s)
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, attempt * 5000));
        }
      }
    }
    emitConnectionStatus('error');
    return false;
  })();

  const result = await _wakePromise;
  _wakePromise = null;
  return result;
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
      throw new Error('El servidor no responde. Puede estar iniciando, intenta de nuevo en unos segundos.');
    }
    throw new Error('No se pudo conectar al servidor. Verifica tu conexión a internet.');
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithTimeout(`${BASE}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });

  // Mark backend as awake on any successful response
  _backendAwake = true;

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

/** GET with automatic retry (up to 2 retries for network errors) */
async function requestWithRetry<T>(path: string, init?: RequestInit): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await request<T>(path, init);
    } catch (err: any) {
      lastError = err;
      // Only retry on network/timeout errors, not on API errors (4xx, 5xx with message)
      const isNetworkError = err.message?.includes('no responde') || 
                              err.message?.includes('No se pudo conectar') ||
                              err.message?.includes('Failed to fetch');
      if (!isNetworkError || attempt === 2) throw err;
      // Wait before retry: 2s, then 4s
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
    }
  }
  throw lastError;
}

export const api = {
  get:    <T>(path: string)                  => requestWithRetry<T>(path, { method: 'GET' }),
  post:   <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body?: unknown)  => request<T>(path, { method: 'PUT',    body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                  => request<T>(path, { method: 'DELETE' }),
}
