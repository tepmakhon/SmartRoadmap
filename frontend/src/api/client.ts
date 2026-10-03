export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const key = 'smart-roadmap.session';
function load(): Tokens | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (
      data &&
      typeof data === 'object' &&
      'access_token' in data &&
      'refresh_token' in data &&
      typeof data.access_token === 'string' &&
      typeof data.refresh_token === 'string'
    )
      return data as Tokens;
  } catch {
    sessionStorage.removeItem(key);
  }
  return null;
}
let tokens = load();
const listeners = new Set<() => void>();
let refreshPromise: Promise<void> | null = null;
let generation = 0;
let identity = 0;
function setTokens(value: Tokens | null, replacement = true) {
  generation++;
  if (replacement) identity++;
  tokens = value;
  if (value) sessionStorage.setItem(key, JSON.stringify(value));
  else sessionStorage.removeItem(key);
  listeners.forEach((listener) => listener());
}
export const session = {
  get: () => tokens,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  set: (value: Tokens | null) => setTokens(value),
};
export function parseError(status: number, body: unknown): ApiError {
  const detail = body && typeof body === 'object' && 'detail' in body ? body.detail : undefined;
  const fields: Record<string, string> = {};
  if (Array.isArray(detail))
    for (const item of detail) {
      if (
        item &&
        typeof item === 'object' &&
        'loc' in item &&
        'msg' in item &&
        Array.isArray(item.loc)
      )
        fields[String(item.loc.at(-1))] = String(item.msg);
    }
  const fallback: Record<number, string> = {
    401: 'Your session has ended. Please sign in again.',
    403: 'You do not have permission to access this item.',
    404: 'This item could not be found.',
    409: 'This item already exists or conflicts with another item.',
    422: 'Please check the highlighted fields.',
    500: 'Something went wrong. Please try again.',
    503: 'Smart Roadmap is temporarily unavailable. Please try again.',
  };
  return new ApiError(
    status,
    typeof detail === 'string' && status < 500
      ? detail
      : Object.keys(fields).length
        ? Object.values(fields).join(' · ')
        : fallback[status] || 'Unable to complete your request.',
    fields,
  );
}
async function transport(path: string, method: string, body?: unknown, access?: string) {
  try {
    return await fetch(`${base}/api/v1${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new ApiError(0, 'Unable to connect to Smart Roadmap. Please try again.');
  }
}
async function read<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw parseError(response.status, body);
  return body as T;
}
async function refresh() {
  if (refreshPromise) return refreshPromise;
  const captured = tokens;
  const started = generation;
  if (!captured) throw new ApiError(401, 'Please sign in to continue.');
  refreshPromise = (async () => {
    try {
      const next = await read<Tokens>(
        await transport('/auth/refresh', 'POST', { refresh_token: captured.refresh_token }),
      );
      if (generation === started) setTokens(next, false);
      else throw new ApiError(401, 'Your session has changed. Please sign in again.');
    } catch (error) {
      if (generation === started) session.set(null);
      throw error;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}
export async function request<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  authenticated = true,
): Promise<T> {
  const startedIdentity = identity;
  const checkIdentity = () => {
    if (authenticated && identity !== startedIdentity)
      throw new ApiError(401, 'Your session has changed. Please sign in again.');
  };
  const sentToken = authenticated ? tokens?.access_token : undefined;
  if (authenticated && !sentToken) throw new ApiError(401, 'Please sign in to continue.');
  let response = await transport(path, method, body, sentToken);
  checkIdentity();
  if (response.status === 401 && authenticated) {
    if (sentToken === tokens?.access_token) await refresh();
    checkIdentity();
    if (!tokens) throw new ApiError(401, 'Your session has ended. Please sign in again.');
    response = await transport(path, method, body, tokens.access_token);
    checkIdentity();
    if (response.status === 401) session.set(null);
  }
  try {
    const result = await read<T>(response);
    checkIdentity();
    return result;
  } catch (error) {
    if (
      authenticated &&
      identity === startedIdentity &&
      error instanceof ApiError &&
      error.status === 403 &&
      error.message === 'User account is inactive'
    )
      session.set(null);
    throw error;
  }
}
export function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value !== undefined && value !== '') query.set(key, String(value));
  return query.size ? `?${query}` : '';
}
