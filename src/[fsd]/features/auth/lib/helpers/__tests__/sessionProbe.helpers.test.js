import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/common/constants.js', async importOriginal => ({
  ...(await importOriginal()),
  DEV: false,
  VITE_DEV_TOKEN: '',
  VITE_SERVER_URL: '/api/v2/',
}));

const { SessionConstants } = await import('@/[fsd]/features/auth/lib/constants');
const { probeSession } = await import('../sessionProbe.helpers');

const { SESSION_STATUS } = SessionConstants;

describe('probeSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the current user without following redirects', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ type: 'basic', ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await probeSession();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v2/social/author/',
      expect.objectContaining({ redirect: 'manual', credentials: 'same-origin' }),
    );
  });

  it('reports alive for a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ type: 'basic', ok: true, status: 200 }));

    expect(await probeSession()).toBe(SESSION_STATUS.alive);
  });

  it('reports expired when forward-auth redirects to login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ type: 'opaqueredirect', ok: false, status: 0 }));

    expect(await probeSession()).toBe(SESSION_STATUS.expired);
  });

  it('reports expired for 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ type: 'basic', ok: false, status: 401 }));

    expect(await probeSession()).toBe(SESSION_STATUS.expired);
  });

  it('reports unknown for server errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ type: 'basic', ok: false, status: 502 }));

    expect(await probeSession()).toBe(SESSION_STATUS.unknown);
  });

  it('reports unknown when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    expect(await probeSession()).toBe(SESSION_STATUS.unknown);
  });
});
