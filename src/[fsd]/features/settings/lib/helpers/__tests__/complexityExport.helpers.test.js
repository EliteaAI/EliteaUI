import { describe, expect, it } from 'vitest';

import { buildExportSheet, buildRunSheet, exportFileName, readListState } from '../complexity.helpers';

const RANGE = { dateFrom: '2026-10-19', dateTo: '2026-11-19' };

describe('complexity export (#7581)', () => {
  it('names the file after the project and the last covered day, filename-safe', () => {
    expect(exportFileName('My / Team: Project', RANGE)).toBe(
      'complexity_My_Team_Project_2026-10-19_2026-11-18.xlsx',
    );
    expect(exportFileName('', RANGE)).toBe('complexity_Project_2026-10-19_2026-11-18.xlsx');
  });

  it('keeps numbers numeric and leaves unavailable values blank, never zero', () => {
    const sheet = buildExportSheet({
      rows: [
        {
          entity_name: 'A',
          entity_kind: 'pipeline',
          runs: 1,
          cu_median: 0,
          percentile: null,
          label_pending: true,
        },
      ],
      meta: { as_of: '2026-11-16T10:00:00+00:00' },
      projectName: 'P',
      range: RANGE,
    });
    const value = key => {
      const column = sheet.columns.find(c => c.key === key);
      const row = sheet.rows[0];
      return column.transform ? column.transform(row[key], row) : row[key];
    };
    expect(value('cu_median')).toBe(0);
    expect(value('percentile')).toBe('');
    expect(value('context')).toBe('');
    expect(value('label')).toBe('Pending');
    expect(value('entity_kind')).toBe('Pipeline');
    expect(sheet.metadata.map(([label]) => label)).toEqual(
      expect.arrayContaining(['Project', 'Period', 'Scores as of', 'Labels recalibrated', 'Median CU']),
    );
  });

  it('says a run without a score is unavailable instead of writing zeros', () => {
    expect(buildRunSheet(undefined, {}).rows).toEqual([
      { metric: 'Complexity data is unavailable for this run.', value: '' },
    ]);
  });
});

describe('readListState', () => {
  const options = {
    keys: {
      period: 'period',
      search: 'search',
      sortBy: 'sort_by',
      sortOrder: 'sort_order',
      page: 'page',
      rowsPerPage: 'rows',
    },
    periods: [{ value: '7' }, { value: '30' }],
    defaultPeriod: '30',
    defaultSort: { sortBy: 'cu_median', sortOrder: 'desc' },
    rowsOptions: [10, 20, 50],
  };

  it('falls back to defaults for unknown or tampered values', () => {
    const state = readListState(
      new URLSearchParams('period=999&sort_order=sideways&page=-4&rows=7'),
      options,
    );
    expect(state).toMatchObject({ periodDays: '30', sortOrder: 'desc', page: 0, rowsPerPage: 20 });
  });
});
