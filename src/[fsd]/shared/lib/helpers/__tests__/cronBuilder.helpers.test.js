import { describe, expect, it } from 'vitest';

import { describeCron } from '../cronBuilder.helpers';

describe('describeCron', () => {
  it('words a daily cron', () => {
    expect(describeCron('0 8 * * *')).toBe('Runs every day at 08:00.');
  });

  it('words a weekly cron with its day', () => {
    expect(describeCron('0 0 * * 6')).toBe('Runs every week at 00:00 on Saturday.');
  });

  it('joins several weekdays', () => {
    expect(describeCron('30 9 * * 1,3,5')).toBe('Runs every week at 09:30 on Monday, Wednesday and Friday.');
  });

  it('words a monthly cron with ordinal days', () => {
    expect(describeCron('0 6 1,2,13,22 * *')).toBe(
      'Runs every month at 06:00 on the 1st, 2nd, 13th and 22nd.',
    );
  });

  it('gives an empty text for an expression the Builder cannot read', () => {
    expect(describeCron('')).toBe('');
  });
});
