// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { buildAbsoluteAppUrl, buildRoute, stripProjectSegment } from '../navigation.helpers';

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

describe('stripProjectSegment', () => {
  it('removes the project segment and keeps the basename', () => {
    expect(stripProjectSegment('/app/591/toolkits/all/870/index/docs', 591)).toBe(
      '/app/toolkits/all/870/index/docs',
    );
  });

  it('accepts a path the router already stripped the basename from', () => {
    expect(stripProjectSegment('/591/toolkits/all/870', '591')).toBe('/app/toolkits/all/870');
  });

  // A substring replace would turn '/2/toolkits/all/2' into '/toolkits/all/2' by luck and
  // '/25/toolkits' into '/5/toolkits' by accident.
  it('matches the project id as a whole leading segment', () => {
    expect(stripProjectSegment('/app/25/toolkits/all/2', 25)).toBe('/app/toolkits/all/2');
    expect(stripProjectSegment('/app/25/toolkits', 2)).toBe('/app/25/toolkits');
  });

  it('leaves a path that does not start with the project segment alone', () => {
    expect(stripProjectSegment('/app/toolkits/all/591', 591)).toBe('/app/toolkits/all/591');
  });

  it('returns the root when nothing follows the project segment', () => {
    expect(stripProjectSegment('/app/591', 591)).toBe('/app/');
  });
});
