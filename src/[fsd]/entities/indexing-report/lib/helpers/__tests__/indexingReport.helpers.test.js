import { describe, expect, it } from 'vitest';

import { normalizeIndexingReport } from '../../serialize/indexingReport.serialize';
import {
  formatIndexingReportText,
  summarizeIndexingReport,
  unchangedNotice,
} from '../indexingReport.helpers';

const report = (overrides = {}) => ({
  status: 'ok',
  item_labels: { singular: 'page', plural: 'pages' },
  dependent_labels: { singular: 'attachment', plural: 'attachments' },
  totals: {
    indexed: 179,
    skipped: 0,
    not_indexed: 0,
    failed: 0,
    unchanged: 0,
    dependent_not_indexed: 0,
    total: 179,
  },
  categories: [
    { kind: 'indexed', count: 179, groups: [] },
    { kind: 'skipped', count: 0, groups: [] },
    { kind: 'not_indexed', count: 0, groups: [] },
    { kind: 'failed', count: 0, groups: [] },
  ],
  errors: [],
  errors_total: 0,
  ...overrides,
});

const render = source => formatIndexingReportText({ report: source });

describe('formatIndexingReportText', () => {
  it('names the indexed items with the source’s own noun', () => {
    expect(render(report())).toBe('✅ 179 pages indexed');
  });

  it('uses the singular noun for a single item', () => {
    const source = report({
      totals: { ...report().totals, indexed: 1, total: 1 },
      categories: [{ kind: 'indexed', count: 1, groups: [] }],
    });

    expect(render(source)).toBe('✅ 1 page indexed');
  });

  it('hides categories with nothing in them', () => {
    const text = render(report());

    expect(text).not.toContain('skipped');
    expect(text).not.toContain('not indexed');
    expect(text).not.toContain('failed');
  });

  it('lists each reason under its category', () => {
    const source = report({
      totals: { ...report().totals, skipped: 12, total: 191 },
      categories: [
        { kind: 'indexed', count: 179, groups: [] },
        {
          kind: 'skipped',
          count: 12,
          groups: [
            { reason: 'filtered', label: 'Excluded by configured filters', count: 10, items: ['a.tmp'] },
            { reason: 'empty', label: 'Contained no indexable content', count: 2, items: ['b.md'] },
          ],
        },
      ],
    });

    expect(render(source).split('\n')).toEqual([
      '✅ 179 pages indexed',
      '⚠️ 12 pages skipped',
      '    → Excluded by configured filters (10): a.tmp … and 9 more',
      '    → Contained no indexable content (2): b.md … and 1 more',
    ]);
  });

  it('describes a run that changed nothing by its unchanged count', () => {
    const source = report({
      status: 'ok',
      totals: { indexed: 0, skipped: 0, not_indexed: 0, failed: 0, unchanged: 196, total: 196 },
      categories: [
        { kind: 'indexed', count: 0, groups: [] },
        {
          kind: 'skipped',
          count: 0,
          groups: [{ reason: 'unchanged', label: 'Already indexed (unchanged)', count: 196, items: [] }],
        },
      ],
    });

    const text = render(source);

    expect(text).toBe('✅ Up to date — 196 pages unchanged');
    expect(text).not.toContain('0 pages');
    expect(text).not.toContain('skipped');
  });

  it('does not report unchanged items as skipped on an incremental run', () => {
    const source = report({
      totals: { indexed: 5, skipped: 1, not_indexed: 0, failed: 0, unchanged: 195, total: 201 },
      categories: [
        { kind: 'indexed', count: 5, groups: [] },
        {
          kind: 'skipped',
          count: 1,
          groups: [
            { reason: 'unchanged', label: 'Already indexed (unchanged)', count: 195, items: [] },
            { reason: 'filtered', label: 'Excluded by configured filters', count: 1, items: ['x.tmp'] },
          ],
        },
      ],
    });

    const lines = render(source).split('\n');

    expect(lines).toContain('✅ 5 pages indexed');
    expect(lines).toContain('⚠️ 1 page skipped');
    expect(lines).toContain('ℹ️ 195 pages already indexed (unchanged)');
    expect(lines.some(line => line.includes('196 pages skipped'))).toBe(false);
  });

  it('still reports genuine skips on an otherwise up-to-date run', () => {
    const source = report({
      totals: { indexed: 0, skipped: 1, not_indexed: 0, failed: 0, unchanged: 196, total: 197 },
      categories: [
        { kind: 'indexed', count: 0, groups: [] },
        {
          kind: 'skipped',
          count: 1,
          groups: [
            { reason: 'unchanged', label: 'Already indexed (unchanged)', count: 196, items: [] },
            { reason: 'filtered', label: 'Excluded by configured filters', count: 1, items: ['x.tmp'] },
          ],
        },
      ],
    });

    expect(render(source).split('\n')).toEqual([
      '✅ Up to date — 196 pages unchanged',
      '⚠️ 1 page skipped',
      '    → Excluded by configured filters (1): x.tmp',
    ]);
  });

  it('names dependent items with their own noun and never counts them', () => {
    const source = report({
      totals: { ...report().totals, dependent_not_indexed: 4 },
      categories: [
        { kind: 'indexed', count: 179, groups: [] },
        { kind: 'skipped', count: 0, groups: [] },
        {
          kind: 'not_indexed',
          count: 0,
          groups: [
            {
              reason: 'unsupported_format',
              label: 'Unsupported format',
              count: 4,
              items: ['a.raw'],
              dependent: true,
            },
          ],
        },
      ],
    });

    expect(render(source).split('\n')).toEqual([
      '✅ 179 pages indexed',
      '⚠️ 4 attachments not indexed',
      '    → Unsupported format (4 attachments): a.raw … and 3 more',
    ]);
  });

  it('renders errors as their own block with the hidden count', () => {
    const source = report({
      status: 'partly_indexed',
      errors: ['timeout adding documents'],
      errors_total: 4,
    });

    const lines = render(source).split('\n');

    expect(lines).toContain('❌ Errors');
    expect(lines).toContain('    → timeout adding documents');
    expect(lines).toContain('    → … and 3 more distinct errors');
  });

  it('says so plainly when a run failed outright', () => {
    const source = report({
      status: 'error',
      totals: { indexed: 0, skipped: 0, not_indexed: 0, failed: 0, unchanged: 0, total: 0 },
      categories: [],
      errors: ['auth failed'],
      errors_total: 1,
    });

    expect(render(source).split('\n')[0]).toBe('❌ Failed to index pages');
  });

  it('never mentions chunks', () => {
    expect(render(report()).toLowerCase()).not.toContain('chunk');
  });

  it('returns an empty string when there is nothing to render', () => {
    expect(formatIndexingReportText(null)).toBe('');
  });

  it('renders a pre-report history entry', () => {
    const text = formatIndexingReportText({
      indexed: 191,
      total: 205,
      state: 'completed',
      skipped: {
        total_skipped: 1,
        documents_skipped: { filtered: ['x.tmp'], filtered_count: 1 },
        documents_already_indexed: { count: 12, items: [] },
      },
    });

    expect(text.split('\n')).toEqual([
      '✅ 179 documents indexed',
      '⚠️ 1 document skipped',
      '    → Excluded by configured filters (1): x.tmp',
      'ℹ️ 12 documents already indexed (unchanged)',
    ]);
  });
});

describe('unchangedNotice', () => {
  // visibleCategories strips unchanged from the skipped category, so every renderer
  // has to put it back — this is the single decision they all share.
  const notice = source => unchangedNotice(normalizeIndexingReport({ report: source }));

  it('states the tally on an incremental run', () => {
    const source = report({
      totals: { indexed: 5, skipped: 0, not_indexed: 0, failed: 0, unchanged: 195, total: 200 },
    });

    expect(notice(source)).toEqual({ count: 195, text: '195 pages already indexed (unchanged)' });
  });

  it('uses the singular noun for one item', () => {
    const source = report({
      totals: { indexed: 5, skipped: 0, not_indexed: 0, failed: 0, unchanged: 1, total: 6 },
    });

    expect(notice(source).text).toBe('1 page already indexed (unchanged)');
  });

  it('stays silent when the headline already carries it', () => {
    const source = report({
      totals: { indexed: 0, skipped: 0, not_indexed: 0, failed: 0, unchanged: 196, total: 196 },
    });

    expect(notice(source)).toBeNull();
  });

  it('stays silent when nothing was unchanged', () => {
    expect(notice(report())).toBeNull();
  });

  it('tolerates a missing report', () => {
    expect(unchangedNotice(null)).toBeNull();
  });
});

describe('summarizeIndexingReport', () => {
  it('joins the category headlines for a banner', () => {
    const source = report({
      totals: { ...report().totals, skipped: 12, total: 191 },
      categories: [
        { kind: 'indexed', count: 179, groups: [] },
        { kind: 'skipped', count: 12, groups: [] },
      ],
    });

    expect(summarizeIndexingReport({ report: source })).toBe('179 pages indexed, 12 pages skipped');
  });

  it('prefers the up-to-date headline', () => {
    const source = report({
      totals: { indexed: 0, skipped: 196, not_indexed: 0, failed: 0, unchanged: 196, total: 196 },
      categories: [
        { kind: 'indexed', count: 0, groups: [] },
        {
          kind: 'skipped',
          count: 196,
          groups: [{ reason: 'unchanged', label: 'Already indexed (unchanged)', count: 196, items: [] }],
        },
      ],
    });

    expect(summarizeIndexingReport({ report: source })).toBe('Up to date — 196 pages unchanged');
  });

  it('names unchanged items separately from skipped ones', () => {
    const source = report({
      totals: { indexed: 5, skipped: 1, not_indexed: 0, failed: 0, unchanged: 195, total: 201 },
      categories: [
        { kind: 'indexed', count: 5, groups: [] },
        {
          kind: 'skipped',
          count: 1,
          groups: [
            { reason: 'unchanged', label: 'Already indexed (unchanged)', count: 195, items: [] },
            { reason: 'filtered', label: 'Excluded by configured filters', count: 1, items: [] },
          ],
        },
      ],
    });

    expect(summarizeIndexingReport({ report: source })).toBe(
      '5 pages indexed, 1 page skipped, 195 unchanged',
    );
  });

  it('is empty when there is no report', () => {
    expect(summarizeIndexingReport(null)).toBe('');
  });
});
