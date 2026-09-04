import { describe, expect, it } from 'vitest';

import { getStringMaxLength } from '../stringField.helpers';

describe('getStringMaxLength', () => {
  it('reads maxLength from an optional string schema', () => {
    expect(
      getStringMaxLength({
        anyOf: [{ type: 'string', maxLength: 10, pattern: '^\\d+(?:\\.\\d+)?$' }, { type: 'null' }],
      }),
    ).toBe(10);
  });

  it('preserves direct string constraints', () => {
    expect(getStringMaxLength({ type: 'string', maxLength: 25 })).toBe(25);
  });
});
