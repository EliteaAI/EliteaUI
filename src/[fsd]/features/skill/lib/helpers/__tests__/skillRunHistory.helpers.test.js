import { describe, expect, it } from 'vitest';

import {
  buildSkillRunHistoryColumns,
  buildSkillRunHistoryParams,
  hasSkillRunHistoryFilters,
} from '../skillRunHistory.helpers';

const NO_FILTERS = {
  query: '',
  dateFrom: null,
  dateTo: null,
  authorId: null,
  model: null,
  status: null,
  versionId: null,
};

const column = type => buildSkillRunHistoryColumns().find(item => item.type === type);

describe('buildSkillRunHistoryParams', () => {
  it('sends nothing for empty filters', () => {
    expect(buildSkillRunHistoryParams(NO_FILTERS)).toEqual({});
    expect(hasSkillRunHistoryFilters(NO_FILTERS)).toBe(false);
  });

  it('widens the picked dates to whole days', () => {
    const params = buildSkillRunHistoryParams({
      ...NO_FILTERS,
      dateFrom: new Date(2026, 9, 1, 15, 30),
      dateTo: new Date(2026, 9, 2, 9, 0),
    });

    expect(new Date(params.created_from)).toEqual(new Date(2026, 9, 1, 0, 0, 0, 0));
    expect(new Date(params.created_to)).toEqual(new Date(2026, 9, 2, 23, 59, 59, 999));
  });

  it('ignores a date the picker could not parse', () => {
    expect(buildSkillRunHistoryParams({ ...NO_FILTERS, dateFrom: new Date('nope') })).toEqual({});
  });

  it('maps every filter to its query parameter', () => {
    const params = buildSkillRunHistoryParams({
      ...NO_FILTERS,
      query: '  invoice ',
      authorId: 3,
      versionId: 0,
      status: 'error',
      model: 'opus',
    });

    expect(params).toEqual({ query: 'invoice', author_id: 3, version_id: 0, status: 'error', model: 'opus' });
    expect(hasSkillRunHistoryFilters({ ...NO_FILTERS, status: 'error' })).toBe(true);
  });
});

describe('buildSkillRunHistoryColumns', () => {
  it('shows each run column the history needs', () => {
    expect(buildSkillRunHistoryColumns().map(item => item.label)).toEqual([
      'Messages',
      'User',
      'Model',
      'Tokens',
      'Cost',
      'Status',
    ]);
  });

  it('renders unknown usage as a dash, not as zero', () => {
    const run = { tokens: null, cost: null, models: null, status: null };

    expect(column('tokens').getText(run)).toBe('—');
    expect(column('cost').getText(run)).toBe('—');
    expect(column('model').getText(run)).toBe('—');
    expect(column('status').getText(run)).toBe('—');
  });

  it('renders known usage', () => {
    const run = {
      tokens: 1203,
      cost: 0.0022825,
      models: ['haiku', 'opus'],
      status: 'stopped',
      author: { name: 'Admin', email: 'admin@centry.user' },
      message_count: 6,
    };

    expect(column('tokens').getText(run)).toBe((1203).toLocaleString());
    expect(column('cost').getText(run)).toBe('$0.0023');
    expect(column('model').getText(run)).toBe('haiku, opus');
    expect(column('status').getText(run)).toBe('Stopped');
    expect(column('user').getText(run)).toBe('Admin');
    expect(column('user').getTooltip(run)).toBe('admin@centry.user');
    expect(column('messages').getText(run)).toBe('6');
  });

  it('falls back to the email when a user has no name', () => {
    expect(column('user').getText({ author: { name: null, email: 'a@b' } })).toBe('a@b');
  });

  it('sorts runs without usage after runs with it', () => {
    const rows = [{ cost: null }, { cost: 0.5 }, { cost: 0.1 }];

    expect([...rows].sort(column('cost').compare).map(row => row.cost)).toEqual([0.1, 0.5, null]);
  });
});
