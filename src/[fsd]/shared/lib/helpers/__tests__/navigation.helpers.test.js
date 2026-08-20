// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { buildAbsoluteAppUrl, buildRoute } from '../navigation.helpers';

vi.mock('@/routes', () => ({
  default: {},
  getBasename: () => '/app',
}));

describe('buildAbsoluteAppUrl', () => {
  it('prefixes a path with the origin, basename and project', () => {
    expect(buildAbsoluteAppUrl(2, '/toolkits/all/43/index/docs')).toBe(
      `${window.location.origin}/app/2/toolkits/all/43/index/docs`,
    );
  });

  it('accepts a project id given as a string', () => {
    expect(buildAbsoluteAppUrl('2', '/toolkits/all/43')).toBe(
      `${window.location.origin}/app/2/toolkits/all/43`,
    );
  });
});

describe('buildRoute', () => {
  it('substitutes params and encodes their values', () => {
    expect(
      buildRoute('/toolkits/:tab/:toolkitId/index/:indexName', {
        tab: 'all',
        toolkitId: 43,
        indexName: 'a b',
      }),
    ).toBe('/toolkits/all/43/index/a%20b');
  });

  it('drops an optional marker and leaves a missing value as an empty segment', () => {
    expect(buildRoute('/toolkits/:tab?/:toolkitId', { toolkitId: 7 })).toBe('/toolkits//7');
  });
});
