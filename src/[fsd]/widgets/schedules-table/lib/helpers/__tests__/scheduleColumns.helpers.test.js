import { describe, expect, it } from 'vitest';

import { COMPACT_MIN_PX, SCHEDULES_COLUMNS, TIER_WIDTHS, getTier } from '../scheduleColumns.helpers';

describe('scheduleColumns.helpers', () => {
  it('picks the tier from the measured table width', () => {
    expect(getTier(COMPACT_MIN_PX)).toBe('compact');
    expect(getTier(947)).toBe('compact');
    expect(getTier(948)).toBe('regular');
    expect(getTier(1115)).toBe('regular');
    expect(getTier(1116)).toBe('comfortable');
  });

  it('keeps all 8 columns and a width for each fixed column in every tier', () => {
    expect(SCHEDULES_COLUMNS).toHaveLength(8);
    const fixed = SCHEDULES_COLUMNS.filter(column => !column.width).map(column => column.field);
    Object.values(TIER_WIDTHS).forEach(widths => {
      expect(Object.keys(widths).sort()).toEqual([...fixed].sort());
    });
  });
});
