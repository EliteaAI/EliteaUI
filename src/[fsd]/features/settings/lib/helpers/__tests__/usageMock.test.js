import { describe, expect, it } from 'vitest';

import { MOCK_MEMBERS_DATA } from './usageMock';

describe('MOCK_MEMBERS_DATA', () => {
  it('every row has a prev_spend field so the vs-prior column renders in mock mode', () => {
    MOCK_MEMBERS_DATA.rows.forEach(row => {
      expect(row).toHaveProperty('prev_spend');
    });
  });

  it('prev_spend is either a number or null, never undefined', () => {
    MOCK_MEMBERS_DATA.rows.forEach(row => {
      const value = row.prev_spend;
      const valid = value === null || typeof value === 'number';
      expect(valid).toBe(true);
    });
  });

  it('rows cover all delta directions used in the vs-prior column', () => {
    const hasUp = MOCK_MEMBERS_DATA.rows.some(
      r => typeof r.prev_spend === 'number' && r.prev_spend < r.spend,
    );
    const hasDown = MOCK_MEMBERS_DATA.rows.some(
      r => typeof r.prev_spend === 'number' && r.prev_spend > r.spend,
    );
    const hasFlat = MOCK_MEMBERS_DATA.rows.some(
      r => typeof r.prev_spend === 'number' && r.prev_spend === r.spend,
    );
    const hasNone = MOCK_MEMBERS_DATA.rows.some(r => r.prev_spend === null);
    expect(hasUp).toBe(true);
    expect(hasDown).toBe(true);
    expect(hasFlat).toBe(true);
    expect(hasNone).toBe(true);
  });

  it('total matches the number of rows', () => {
    expect(MOCK_MEMBERS_DATA.total).toBe(MOCK_MEMBERS_DATA.rows.length);
  });

  it('every row has the required member fields', () => {
    MOCK_MEMBERS_DATA.rows.forEach(row => {
      expect(row).toHaveProperty('user_id');
      expect(row).toHaveProperty('spend');
      expect(row).toHaveProperty('currency');
    });
  });
});
