import { describe, expect, it } from 'vitest';

import { secondsInHumanFormat } from '../shared.helpers';

describe('secondsInHumanFormat', () => {
  it('breaks longer runs into hours, minutes and seconds', () => {
    expect(secondsInHumanFormat(3661)).toBe('1 h 1 m 1 s');
    expect(secondsInHumanFormat(90)).toBe('1 m 30 s');
  });

  it('prints sub-minute runs at their raw precision', () => {
    expect(secondsInHumanFormat(3.11)).toBe('3.11 s');
  });

  it('separates an unmeasured run from an instant one', () => {
    expect(secondsInHumanFormat(null)).toBe('—');
    expect(secondsInHumanFormat(undefined)).toBe('—');
  });

  it('still reads the sentinels the conversation API emits as zero', () => {
    expect(secondsInHumanFormat(0)).toBe('0 s');
    expect(secondsInHumanFormat(-1)).toBe('0 s');
  });
});
