import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { request, session, parseError, queryString } from '../src/api/client';
const old = { access_token: 'old-access', refresh_token: 'old-refresh', token_type: 'bearer' };
const rotated = { ...old, access_token: 'new-access', refresh_token: 'new-refresh' };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  session.set(old);
});
afterEach(() => {
  vi.unstubAllGlobals();
  session.set(null);
});
describe('API authentication and errors', () => {
  it('rotates once for parallel unauthorized requests and retries with the latest access token', async () => {
    let refreshes = 0;
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        if (url.endsWith('/auth/refresh')) {
          refreshes++;
          expect(JSON.parse(String(init.body))).toEqual({ refresh_token: 'old-refresh' });
          await new Promise((resolve) => setTimeout(resolve, 10));
          return json(200, rotated);
        }
        const token = (init.headers as Record<string, string>).Authorization;
        calls.push(token);
        return token === 'Bearer old-access'
          ? json(401, { detail: 'expired' })
          : json(200, { ok: true });
      }),
    );
    const result = await Promise.all([request('/one'), request('/two'), request('/three')]);
    expect(result).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(refreshes).toBe(1);
    expect(calls.filter((t) => t === 'Bearer new-access')).toHaveLength(3);
    expect(session.get()).toEqual(rotated);
  });
  it('clears credentials when refresh is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(401, { detail: 'invalid token' })),
    );
    await expect(request('/users/me')).rejects.toMatchObject({ status: 401 });
    expect(session.get()).toBeNull();
    expect(sessionStorage.getItem('smart-roadmap.session')).toBeNull();
  });
  it('does not restore a session after logout during refresh', async () => {
    let finish: (value: Response) => void = () => {};
    let started: () => void = () => {};
    const refreshing = new Promise<void>((r) => {
      started = r;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/auth/refresh')
          ? new Promise<Response>((resolve) => {
              finish = resolve;
              started();
            })
          : json(401, {}),
      ),
    );
    const pending = request('/users/me');
    const rejected = expect(pending).rejects.toMatchObject({ status: 401 });
    await refreshing;
    session.set(null);
    finish(json(200, rotated));
    await rejected;
    expect(session.get()).toBeNull();
  });
  it('does not retry an old user request as a newly signed-in user', async () => {
    let finish: (value: Response) => void = () => {};
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetcher);
    const pending = request('/users/me/goals', 'POST', { title: 'private' });
    session.set(rotated);
    finish(json(401, {}));
    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(session.get()).toEqual(rotated);
  });
  it('preserves credentials on an authorization denial', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(403, { detail: 'Admin required' })),
    );
    await expect(request('/admin/metrics')).rejects.toMatchObject({ status: 403 });
    expect(session.get()).toEqual(old);
  });
  it('ends the session for an inactive account', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json(403, { detail: 'User account is inactive' })),
    );
    await expect(request('/users/me')).rejects.toMatchObject({ status: 403 });
    expect(session.get()).toBeNull();
  });
  it('does not clear a new session when an older inactive-account body arrives late', async () => {
    let finish: (value: unknown) => void = () => {};
    let began: () => void = () => {};
    const reading = new Promise<void>((resolve) => {
      began = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 403,
        ok: false,
        json: () =>
          new Promise((resolve) => {
            finish = resolve;
            began();
          }),
      })),
    );
    const pending = request('/users/me');
    const rejected = expect(pending).rejects.toMatchObject({ status: 403 });
    await reading;
    session.set(rotated);
    finish({ detail: 'User account is inactive' });
    await rejected;
    expect(session.get()).toEqual(rotated);
  });
  it('handles network failures without revealing internals', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('secret internal host');
      }),
    );
    await expect(request('/users/me')).rejects.toMatchObject({
      status: 0,
      message: 'Unable to connect to Smart Roadmap. Please try again.',
    });
  });
  it('maps field errors and sanitizes server failures', () => {
    expect(
      parseError(422, { detail: [{ loc: ['body', 'title'], msg: 'Required' }] }).fields,
    ).toEqual({ title: 'Required' });
    expect(parseError(500, { detail: 'database password' }).message).not.toContain('password');
  });
  it('omits empty filters and encodes search strings', () => {
    expect(
      queryString({ search: 'C++ & SQL', status: '', limit: 12, offset: 0, skip: undefined }),
    ).toBe('?search=C%2B%2B+%26+SQL&limit=12&offset=0');
  });
});
