import { describe, expect, it } from 'vitest';

import { PipelineStatus } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';

import {
  formatBadgeCount,
  getActiveRowPosition,
  getVisibleSteps,
  groupConsecutiveSteps,
  isRowActive,
} from '../timeLine.helpers';

const step = (groupId, status = PipelineStatus.Completed) => ({ group_id: groupId, status });

describe('groupConsecutiveSteps', () => {
  it('returns no groups for no steps', () => {
    expect(groupConsecutiveSteps([])).toEqual([]);
  });

  it('merges consecutive steps that share a group id', () => {
    expect(groupConsecutiveSteps([step('a'), step('a'), step('a')])).toEqual([
      { groupId: 'a', start: 0, end: 2 },
    ]);
  });

  it('starts a new group whenever the group id changes', () => {
    expect(groupConsecutiveSteps([step('a'), step('a'), step('b'), step('b')])).toEqual([
      { groupId: 'a', start: 0, end: 1 },
      { groupId: 'b', start: 2, end: 3 },
    ]);
  });

  it('does not merge a group id that comes back after a different one', () => {
    expect(groupConsecutiveSteps([step('a'), step('b'), step('a')])).toEqual([
      { groupId: 'a', start: 0, end: 0 },
      { groupId: 'b', start: 1, end: 1 },
      { groupId: 'a', start: 2, end: 2 },
    ]);
  });

  it('keeps steps without a group id apart, even when they are next to each other', () => {
    expect(groupConsecutiveSteps([step(undefined), step(undefined), step('')])).toEqual([
      { groupId: undefined, start: 0, end: 0 },
      { groupId: undefined, start: 1, end: 1 },
      { groupId: '', start: 2, end: 2 },
    ]);
  });
});

describe('getVisibleSteps', () => {
  const groups = [
    { groupId: 'a', start: 0, end: 0 },
    { groupId: 'b', start: 1, end: 3 },
    { groupId: 'c', start: 4, end: 5 },
  ];

  it('shows one row per group while everything is collapsed', () => {
    expect(getVisibleSteps(groups, false, new Set())).toEqual([
      { index: 0, end: 0, expanded: false },
      { index: 1, end: 3, expanded: false },
      { index: 4, end: 5, expanded: false },
    ]);
  });

  it('never marks a single-step group as expanded, even in expand-all mode', () => {
    expect(getVisibleSteps(groups, true, new Set())[0]).toEqual({ index: 0, end: 0, expanded: false });
  });

  it('expands a group into its head row followed by one row per remaining step', () => {
    expect(getVisibleSteps(groups, false, new Set([1]))).toEqual([
      { index: 0, end: 0, expanded: false },
      { index: 1, end: 3, expanded: true },
      { index: 2, end: 2 },
      { index: 3, end: 3 },
      { index: 4, end: 5, expanded: false },
    ]);
  });

  it('expands every multi-step group in expand-all mode', () => {
    const rows = getVisibleSteps(groups, true, new Set());
    expect(rows.map(row => row.index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(rows.filter(row => row.expanded).map(row => row.index)).toEqual([1, 4]);
  });

  it('lets a per-group override collapse a group while expand-all is on', () => {
    const rows = getVisibleSteps(groups, true, new Set([1]));
    expect(rows.map(row => row.index)).toEqual([0, 1, 4, 5]);
    expect(rows.find(row => row.index === 1).expanded).toBe(false);
  });

  it('ignores an override on a single-step group', () => {
    expect(getVisibleSteps(groups, false, new Set([0]))[0]).toEqual({ index: 0, end: 0, expanded: false });
  });
});

describe('getActiveRowPosition', () => {
  const collapsed = [
    { index: 0, end: 0, expanded: false },
    { index: 1, end: 3, expanded: false },
    { index: 4, end: 5, expanded: false },
  ];
  const expanded = [
    { index: 0, end: 0, expanded: false },
    { index: 1, end: 3, expanded: true },
    { index: 2, end: 2 },
    { index: 3, end: 3 },
    { index: 4, end: 5, expanded: false },
  ];

  it('returns -1 when no step is running', () => {
    expect(getActiveRowPosition(collapsed, -1)).toBe(-1);
  });

  it('points a running child at its collapsed group row', () => {
    expect(getActiveRowPosition(collapsed, 2)).toBe(1);
  });

  it('points a running step at its own row once the group is expanded', () => {
    expect(getActiveRowPosition(expanded, 2)).toBe(2);
  });

  it('points a running group head at its own row when expanded', () => {
    expect(getActiveRowPosition(expanded, 1)).toBe(1);
  });
});

describe('formatBadgeCount', () => {
  it('shows small counts as they are, up to and including the cap', () => {
    expect(formatBadgeCount(1)).toBe(1);
    expect(formatBadgeCount(99)).toBe(99);
  });

  it('collapses counts above the cap', () => {
    expect(formatBadgeCount(100)).toBe('99+');
    expect(formatBadgeCount(12345)).toBe('99+');
  });
});

describe('isRowActive', () => {
  it('is active when the row itself is selected', () => {
    expect(isRowActive(2, 2, false, 2)).toBe(true);
    expect(isRowActive(1, 3, true, 1)).toBe(true);
  });

  it('is active for a collapsed group that holds the selected child', () => {
    expect(isRowActive(1, 3, false, 2)).toBe(true);
    expect(isRowActive(1, 3, false, 3)).toBe(true);
  });

  it('is not active for an expanded group when only a child is selected', () => {
    expect(isRowActive(1, 3, true, 2)).toBe(false);
  });

  it('is not active when the selection is outside the group', () => {
    expect(isRowActive(1, 3, false, 0)).toBe(false);
    expect(isRowActive(1, 3, false, 4)).toBe(false);
  });
});
