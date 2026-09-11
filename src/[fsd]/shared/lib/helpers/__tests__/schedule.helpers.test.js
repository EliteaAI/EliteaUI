import { describe, expect, it } from 'vitest';

import { canConvertCronTimezone, convertCronTimezone } from '../schedule.helpers';

// Fixed-offset zones keep the expectations independent of the date the suite runs on.
const UTC = 'UTC';
const UTC_PLUS_3 = 'Etc/GMT-3';
const UTC_MINUS_3 = 'Etc/GMT+3';
const UTC_PLUS_5_30 = 'Asia/Kolkata';

describe('convertCronTimezone', () => {
  it('returns the expression unchanged when a timezone is missing or identical', () => {
    expect(convertCronTimezone('51 12 * * *', undefined, UTC)).toBe('51 12 * * *');
    expect(convertCronTimezone('51 12 * * *', UTC, undefined)).toBe('51 12 * * *');
    expect(convertCronTimezone('51 12 * * *', UTC, UTC)).toBe('51 12 * * *');
  });

  it('shifts a fixed daily time forwards and backwards', () => {
    expect(convertCronTimezone('51 12 * * *', UTC, UTC_PLUS_3)).toBe('51 15 * * *');
    expect(convertCronTimezone('51 12 * * *', UTC_PLUS_3, UTC)).toBe('51 9 * * *');
  });

  it('handles timezones with a sub-hour offset', () => {
    expect(convertCronTimezone('0 12 * * *', UTC, UTC_PLUS_5_30)).toBe('30 17 * * *');
    expect(convertCronTimezone('45 12 * * *', UTC, UTC_PLUS_5_30)).toBe('15 18 * * *');
  });

  it('wraps the hour and moves the weekday when the shift crosses midnight', () => {
    expect(convertCronTimezone('0 0 * * 6', UTC_PLUS_3, UTC)).toBe('0 21 * * 5');
    expect(convertCronTimezone('0 23 * * 1', UTC, UTC_PLUS_3)).toBe('0 2 * * 2');
  });

  it('normalises Sunday given as 0 or 7 when the weekday moves', () => {
    expect(convertCronTimezone('0 1 * * 0', UTC, UTC_MINUS_3)).toBe('0 22 * * 6');
    expect(convertCronTimezone('0 1 * * 7', UTC, UTC_MINUS_3)).toBe('0 22 * * 6');
    expect(convertCronTimezone('0 23 * * 6', UTC, UTC_PLUS_3)).toBe('0 2 * * 0');
  });

  it('shifts every entry of a weekday list', () => {
    expect(convertCronTimezone('0 1 * * 1,3,5', UTC, UTC_MINUS_3)).toBe('0 22 * * 0,2,4');
  });

  it('shifts a day-of-month schedule that stays on the same day', () => {
    expect(convertCronTimezone('0 12 1 * *', UTC, UTC_PLUS_3)).toBe('0 15 1 * *');
  });

  it('leaves an expression alone when the hour or minute is not a single fixed value', () => {
    expect(convertCronTimezone('*/30 * * * *', UTC, UTC_PLUS_3)).toBe('*/30 * * * *');
    expect(convertCronTimezone('0 9-17 * * *', UTC, UTC_PLUS_3)).toBe('0 9-17 * * *');
    expect(convertCronTimezone('0 8,20 * * *', UTC, UTC_PLUS_3)).toBe('0 8,20 * * *');
  });

  it('leaves a day-of-month schedule alone when the shift crosses midnight', () => {
    expect(convertCronTimezone('0 0 1 * *', UTC_PLUS_3, UTC)).toBe('0 0 1 * *');
  });

  it('leaves a malformed expression alone', () => {
    expect(convertCronTimezone('0 12 * *', UTC, UTC_PLUS_3)).toBe('0 12 * *');
  });
});

describe('canConvertCronTimezone', () => {
  it('reports convertible when no shift is needed', () => {
    expect(canConvertCronTimezone('*/30 * * * *', UTC, UTC)).toBe(true);
    expect(canConvertCronTimezone('*/30 * * * *', undefined, UTC)).toBe(true);
  });

  it('reports convertible for a fixed time', () => {
    expect(canConvertCronTimezone('51 12 * * *', UTC, UTC_PLUS_3)).toBe(true);
    expect(canConvertCronTimezone('0 0 * * 6', UTC_PLUS_3, UTC)).toBe(true);
  });

  it('reports not convertible for recurring windows and midnight-crossing month days', () => {
    expect(canConvertCronTimezone('*/30 * * * *', UTC, UTC_PLUS_3)).toBe(false);
    expect(canConvertCronTimezone('0 9-17 * * *', UTC, UTC_PLUS_3)).toBe(false);
    expect(canConvertCronTimezone('0 0 1 * *', UTC_PLUS_3, UTC)).toBe(false);
    expect(canConvertCronTimezone('0 12 * *', UTC, UTC_PLUS_3)).toBe(false);
  });
});
