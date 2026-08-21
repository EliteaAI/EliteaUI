import { describe, expect, it } from 'vitest';

import { sha256 } from './mcpCrypto.helpers';

describe('MCP OAuth crypto helpers', () => {
  it('builds the RFC 7636 S256 challenge without Web Crypto digest support', async () => {
    const challenge = await sha256('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk', {});

    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});
