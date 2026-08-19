import { describe, expect, it } from 'vitest';

import {
  applyBreadcrumbLabels,
  getBreadcrumbEntityId,
  resolveBreadcrumbTrail,
} from '../breadcrumb.helpers.js';
import { buildRoute } from '../navigation.helpers.js';

const labelsOf = trail => trail.map(crumb => crumb.label);

describe('buildRoute', () => {
  it('substitutes params and encodes their values', () => {
    expect(buildRoute('/toolkits/:tab/:toolkitId', { tab: 'all', toolkitId: 42 })).toBe('/toolkits/all/42');
    expect(
      buildRoute('/toolkits/:tab/:toolkitId/index/:indexName', {
        tab: 'all',
        toolkitId: '7',
        indexName: 'my index 100%',
      }),
    ).toBe('/toolkits/all/7/index/my%20index%20100%25');
  });

  it('renders missing params as an empty segment instead of throwing', () => {
    expect(buildRoute('/toolkits/:tab/:toolkitId', { tab: 'all' })).toBe('/toolkits/all/');
  });

  it('does not leak an optional param marker into the path', () => {
    expect(buildRoute('/toolkits/:tab?', { tab: 'all' })).toBe('/toolkits/all');
    expect(buildRoute('/toolkits/:tab?', {})).toBe('/toolkits/');
  });
});

describe('resolveBreadcrumbTrail', () => {
  it('returns an empty trail for routes without a registry entry', () => {
    expect(resolveBreadcrumbTrail('/user-public/toolkits/12')).toEqual([]);
    expect(resolveBreadcrumbTrail('/apps/applications/12')).toEqual([]);
    expect(resolveBreadcrumbTrail('/settings/project-context')).toEqual([]);
  });

  it('builds the parent chain for a toolkit sub-page and marks the last crumb current', () => {
    const trail = resolveBreadcrumbTrail('/toolkits/my-liked/42/history');

    expect(trail.map(crumb => crumb.to)).toEqual([
      '/toolkits/my-liked',
      '/toolkits/my-liked/42',
      '/toolkits/my-liked/42/history',
    ]);
    expect(trail.map(crumb => crumb.isCurrent)).toEqual([false, false, true]);
  });

  it('preserves the :tab param across the whole trail', () => {
    const trail = resolveBreadcrumbTrail('/toolkits/trending/9/create-index');

    expect(trail.every(crumb => crumb.to.startsWith('/toolkits/trending'))).toBe(true);
  });

  it('chains index history through the index crumb and re-encodes the index name', () => {
    const trail = resolveBreadcrumbTrail('/toolkits/all/7/index/my%20index/history');

    expect(trail.map(crumb => crumb.to)).toEqual([
      '/toolkits/all',
      '/toolkits/all/7',
      '/toolkits/all/7/index/my%20index',
      '/toolkits/all/7/index/my%20index/history',
    ]);
  });

  it('prefers the more specific pattern when route patterns overlap', () => {
    const detail = resolveBreadcrumbTrail('/toolkits/all/42');
    const runHistory = resolveBreadcrumbTrail('/toolkits/all/42/history');

    expect(detail[detail.length - 1].key).toBe('/toolkits/:tab/:toolkitId');
    expect(runHistory[runHistory.length - 1].key).toBe('/toolkits/:tab/:toolkitId/history');
  });

  it('resolves the MCP detail trail from its own root', () => {
    const trail = resolveBreadcrumbTrail('/mcps/all/5');

    expect(trail.map(crumb => crumb.to)).toEqual(['/mcps/all', '/mcps/all/5']);
  });

  it('keeps the test page under the detail page of its own entity type', () => {
    const toolkitTest = resolveBreadcrumbTrail('/toolkits/my-liked/42/test');
    const mcpTest = resolveBreadcrumbTrail('/mcps/all/5/test');

    expect(toolkitTest.map(crumb => crumb.to)).toEqual([
      '/toolkits/my-liked',
      '/toolkits/my-liked/42',
      '/toolkits/my-liked/42/test',
    ]);
    expect(mcpTest.map(crumb => crumb.to)).toEqual(['/mcps/all', '/mcps/all/5', '/mcps/all/5/test']);
    expect(toolkitTest[toolkitTest.length - 1].key).toBe('/toolkits/:tab/:toolkitId/test');
  });
});

describe('getBreadcrumbEntityId', () => {
  it('returns the id only when a crumb needs an entity name', () => {
    expect(getBreadcrumbEntityId(resolveBreadcrumbTrail('/toolkits/all/42/history'))).toBe('42');
    expect(getBreadcrumbEntityId(resolveBreadcrumbTrail('/mcps/all/5'))).toBe('5');
    expect(getBreadcrumbEntityId(resolveBreadcrumbTrail('/toolkits/all'))).toBeUndefined();
    expect(getBreadcrumbEntityId([])).toBeUndefined();
  });
});

describe('applyBreadcrumbLabels', () => {
  it('hides an ancestor whose entity name has not resolved yet', () => {
    const trail = resolveBreadcrumbTrail('/toolkits/all/42/history');

    expect(labelsOf(applyBreadcrumbLabels(trail, ''))).toEqual(['Toolkits & Indexes', 'Run History']);
    expect(labelsOf(applyBreadcrumbLabels(trail, 'GitHub'))).toEqual([
      'Toolkits & Indexes',
      'GitHub',
      'Run History',
    ]);
  });

  it('falls back to the entry label only while the crumb is the current one', () => {
    const trail = resolveBreadcrumbTrail('/toolkits/all/42');

    expect(labelsOf(applyBreadcrumbLabels(trail, ''))).toEqual(['Toolkits & Indexes', 'Edit Toolkit']);
    expect(labelsOf(applyBreadcrumbLabels(trail, 'GitHub'))).toEqual(['Toolkits & Indexes', 'GitHub']);
  });

  it('labels the index crumb with the decoded index name', () => {
    const trail = resolveBreadcrumbTrail('/toolkits/all/7/index/my%20index/history');

    expect(labelsOf(applyBreadcrumbLabels(trail, 'Confluence'))).toEqual([
      'Toolkits & Indexes',
      'Confluence',
      'my index',
      'History',
    ]);
  });

  it('keeps an unlabelled crumb only while it is the current one', () => {
    const unlabelled = { key: '/x', entry: { fallbackLabel: 'Index' }, params: {}, to: '/x' };

    expect(labelsOf(applyBreadcrumbLabels([{ ...unlabelled, isCurrent: true }], ''))).toEqual(['Index']);
    expect(
      applyBreadcrumbLabels(
        [
          { ...unlabelled, isCurrent: false },
          { key: '/y', entry: { label: 'History' }, params: {}, to: '/y', isCurrent: true },
        ],
        '',
      ),
    ).toHaveLength(1);
  });

  it('exposes the details crumb test id for the toolkit and MCP pages', () => {
    const toolkit = applyBreadcrumbLabels(resolveBreadcrumbTrail('/toolkits/all/42'), 'GitHub');
    const mcp = applyBreadcrumbLabels(resolveBreadcrumbTrail('/mcps/all/5'), 'Figma');

    expect(toolkit[toolkit.length - 1].entry.testId).toBe('toolkit-detail-title');
    expect(mcp[mcp.length - 1].entry.testId).toBe('toolkit-detail-title');
  });
});
