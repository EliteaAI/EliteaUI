import { describe, expect, it } from 'vitest';

import { normalizeIndexingReport } from '../indexingReport.serialize';

const canonicalReport = (overrides = {}) => ({
  version: 1,
  status: 'ok',
  operation: 'reindex',
  item_labels: { singular: 'page', plural: 'pages' },
  dependent_labels: { singular: 'attachment', plural: 'attachments' },
  totals: {
    indexed: 179,
    skipped: 12,
    not_indexed: 0,
    failed: 1,
    unchanged: 0,
    dependent_not_indexed: 0,
    total: 192,
  },
  categories: [
    { kind: 'indexed', count: 179, groups: [] },
    {
      kind: 'skipped',
      count: 12,
      groups: [{ reason: 'filtered', label: 'Excluded by configured filters', count: 12, items: ['a.tmp'] }],
    },
    { kind: 'not_indexed', count: 0, groups: [] },
    {
      kind: 'failed',
      count: 1,
      groups: [{ reason: 'processing_error', label: 'Could not be processed', count: 1, items: ['x.pdf'] }],
    },
  ],
  errors: [],
  errors_total: 0,
  ...overrides,
});

const categoryOf = (report, kind) => report.categories.find(category => category.kind === kind);

describe('normalizeIndexingReport with a canonical report', () => {
  it('reads a report carried by a tool result', () => {
    const report = normalizeIndexingReport({ status: 'ok', message: 'x', report: canonicalReport() });

    expect(report.totals.indexed).toBe(179);
    expect(report.itemLabels).toEqual({ singular: 'page', plural: 'pages' });
    expect(report.isLegacy).toBe(false);
  });

  it('reads a report carried by an index_meta document', () => {
    const report = normalizeIndexingReport({ metadata: { report: canonicalReport(), state: 'completed' } });

    expect(report.totals.total).toBe(192);
  });

  it('accepts the report as a JSON string', () => {
    const report = normalizeIndexingReport({ report: JSON.stringify(canonicalReport()) });

    expect(report.totals.indexed).toBe(179);
  });

  it('always returns the four categories in reading order', () => {
    const report = normalizeIndexingReport({ report: canonicalReport({ categories: [] }) });

    expect(report.categories.map(category => category.kind)).toEqual([
      'indexed',
      'skipped',
      'not_indexed',
      'failed',
    ]);
  });

  it('caps group items and reports how many were left out', () => {
    const items = Array.from({ length: 12 }, (unused, index) => `file-${index}.tmp`);
    const source = canonicalReport();
    categoryOf(source, 'skipped').groups[0] = {
      reason: 'filtered',
      label: 'Excluded by configured filters',
      count: 12,
      items,
    };

    const report = normalizeIndexingReport({ report: source });

    expect(categoryOf(report, 'skipped').groups[0].items).toHaveLength(5);
    expect(categoryOf(report, 'skipped').groups[0].more).toBe(7);
  });

  it('gives dependent groups the report-level dependent nouns', () => {
    const source = canonicalReport();
    categoryOf(source, 'not_indexed').groups = [
      { reason: 'unsupported_format', label: 'Unsupported format', count: 4, items: [], dependent: true },
    ];

    const report = normalizeIndexingReport({ report: source });

    expect(categoryOf(report, 'not_indexed').groups[0].itemLabels).toEqual({
      singular: 'attachment',
      plural: 'attachments',
    });
  });

  it('marks a run that only found unchanged items as up to date', () => {
    const source = canonicalReport({
      totals: { indexed: 0, skipped: 196, not_indexed: 0, failed: 0, unchanged: 196, total: 196 },
    });

    expect(normalizeIndexingReport({ report: source }).isUpToDate).toBe(true);
  });

  it('does not call a run with failures up to date', () => {
    const source = canonicalReport({
      totals: { indexed: 0, skipped: 196, not_indexed: 0, failed: 2, unchanged: 196, total: 198 },
    });

    expect(normalizeIndexingReport({ report: source }).isUpToDate).toBe(false);
  });
});

describe('normalizeIndexingReport guards', () => {
  it('discards a successful report left behind on a failed run', () => {
    const report = normalizeIndexingReport({
      report: canonicalReport(),
      state: 'failed',
      error: 'connection refused',
      indexed: 191,
      total: 192,
    });

    expect(report.isLegacy).toBe(true);
    expect(report.status).toBe('error');
    expect(report.errors).toEqual(['connection refused']);
  });

  it('keeps an error report but sources its totals from the carried counts', () => {
    const source = canonicalReport({
      status: 'error',
      totals: { indexed: 0, skipped: 0, not_indexed: 0, failed: 0, unchanged: 0, total: 0 },
    });

    const report = normalizeIndexingReport({ report: source, state: 'failed', indexed: 191, total: 192 });

    expect(report.totals.indexed).toBe(191);
    expect(report.totals.total).toBe(192);
  });

  it.each([null, undefined, 'text', 42, {}])('returns null for %p', value => {
    expect(normalizeIndexingReport(value)).toBeNull();
  });

  it('falls back to legacy fields when the report is unparseable', () => {
    const report = normalizeIndexingReport({ report: 'not json', indexed: 10, total: 12 });

    expect(report.isLegacy).toBe(true);
    expect(report.totals.total).toBe(12);
  });
});

const legacySkipped = {
  items_processed: 191,
  total_skipped: 13,
  files_skipped: {
    count: 3,
    whitelist_filtered: ['a.png'],
    whitelist_filtered_count: 1,
    blacklist_filtered: [],
    blacklist_filtered_count: 0,
    read_error: ['locked.doc'],
    read_error_count: 1,
    empty_content: ['blank.md'],
    empty_content_count: 1,
    unsupported_extension: [],
    unsupported_extension_count: 0,
  },
  documents_skipped: { count: 10, error: [], error_count: 0, filtered: ['x.tmp'], filtered_count: 10 },
  runtime_skipped: {
    count: 0,
    extension_filtered: [],
    extension_filtered_count: 0,
    error: [],
    error_count: 0,
  },
  dependent_items_skipped: { count: 4, items: ['a.raw'] },
  documents_already_indexed: { count: 12, items: ['page-1'] },
};

describe('normalizeIndexingReport with pre-report rows', () => {
  const entry = { indexed: 191, total: 205, state: 'completed', skipped: legacySkipped };

  it('splits the persisted count into this run and unchanged items', () => {
    const report = normalizeIndexingReport(entry);

    expect(report.totals.indexed).toBe(179);
    expect(report.totals.unchanged).toBe(12);
  });

  it('keeps the persisted total untouched so no displayed number shifts', () => {
    expect(normalizeIndexingReport(entry).totals.total).toBe(205);
  });

  it('rebuilds the breakdown from the skipped blob', () => {
    const report = normalizeIndexingReport(entry);

    const skipped = categoryOf(report, 'skipped');
    expect(skipped.count).toBe(12 + 10 + 1 + 1);
    expect(skipped.groups.map(group => group.reason)).toEqual([
      'unchanged',
      'filtered',
      'not_in_whitelist',
      'empty',
    ]);
    expect(categoryOf(report, 'failed').count).toBe(1);
  });

  it('keeps dependent items out of the category counts', () => {
    const report = normalizeIndexingReport(entry);

    const failed = categoryOf(report, 'failed');
    expect(failed.count).toBe(1);
    expect(failed.groups.some(group => group.dependent && group.count === 4)).toBe(true);
    expect(report.totals.dependentNotIndexed).toBe(4);
  });

  it('unions tracking sets that share a reason into one group', () => {
    // _filter_parsing_errors routinely fills both sets, and the SDK reports them as one
    // group — two identical "Unsupported format" lines would also collide as React keys.
    const report = normalizeIndexingReport({
      indexed: 5,
      total: 8,
      state: 'completed',
      skipped: {
        files_skipped: { unsupported_extension: ['a.ai'], unsupported_extension_count: 1 },
        runtime_skipped: {
          extension_filtered: ['b.raw'],
          extension_filtered_count: 1,
          error: ['c.pdf'],
          error_count: 1,
        },
        documents_skipped: { error: ['d.pdf'], error_count: 1 },
      },
    });

    const notIndexed = categoryOf(report, 'not_indexed');
    expect(notIndexed.groups).toHaveLength(1);
    expect(notIndexed.groups[0].count).toBe(2);
    expect(notIndexed.groups[0].items).toEqual(['a.ai', 'b.raw']);

    const failed = categoryOf(report, 'failed');
    expect(failed.groups.filter(group => group.reason === 'processing_error')).toHaveLength(1);
  });

  it('counts a name recorded in both sets once', () => {
    const report = normalizeIndexingReport({
      indexed: 5,
      total: 6,
      state: 'completed',
      skipped: {
        files_skipped: { unsupported_extension: ['shared.ai'], unsupported_extension_count: 1 },
        runtime_skipped: { extension_filtered: ['shared.ai'], extension_filtered_count: 1 },
      },
    });

    const group = categoryOf(report, 'not_indexed').groups[0];
    expect(group.items).toEqual(['shared.ai']);
    expect(group.count).toBe(1);
  });

  it('produces unique render keys for every group', () => {
    const report = normalizeIndexingReport(entry);

    report.categories.forEach(category => {
      const keys = category.groups.map(group => `${group.reason}-${group.dependent}`);
      expect(new Set(keys).size).toBe(keys.length);
    });
  });

  it('accepts the skipped blob as a JSON string', () => {
    const report = normalizeIndexingReport({ ...entry, skipped: JSON.stringify(legacySkipped) });

    expect(report.totals.unchanged).toBe(12);
  });

  it('degrades to the bare count when no breakdown was ever recorded', () => {
    const report = normalizeIndexingReport({ indexed: 40, total: 40, state: 'completed' });

    expect(report.totals.indexed).toBe(40);
    expect(report.categories.every(category => category.groups.length === 0)).toBe(true);
  });

  it('reads an all-unchanged legacy run as up to date', () => {
    const report = normalizeIndexingReport({
      indexed: 196,
      total: 196,
      state: 'completed',
      skipped: {
        items_processed: 196,
        total_skipped: 0,
        documents_already_indexed: { count: 196, items: [] },
      },
    });

    expect(report.totals.indexed).toBe(0);
    expect(report.totals.unchanged).toBe(196);
    expect(report.isUpToDate).toBe(true);
  });

  it('a legacy run with failures is not up to date', () => {
    const report = normalizeIndexingReport({
      indexed: 196,
      total: 197,
      state: 'completed',
      skipped: { ...legacySkipped, documents_already_indexed: { count: 196, items: [] } },
    });

    expect(report.isUpToDate).toBe(false);
  });
});
