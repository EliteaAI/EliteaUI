import { describe, expect, it } from 'vitest';

import { parseIntegerInput, sanitizeIntegerInput } from '../integerInput.utils';

describe('sanitizeIntegerInput', () => {
  it.each([
    ['-1', '-1'],
    ['1-2', '12'],
    ['--1', '-1'],
    ['-', '-'],
    ['1a2', '12'],
    [' 42 ', '42'],
    ['-5.7', '-57'],
    ['', ''],
  ])('%j -> %j', (raw, expected) => {
    expect(sanitizeIntegerInput(raw)).toBe(expected);
  });

  it('treats null/undefined as empty', () => {
    expect(sanitizeIntegerInput(null)).toBe('');
    expect(sanitizeIntegerInput(undefined)).toBe('');
  });
});

describe('parseIntegerInput', () => {
  it('parses signed integers', () => {
    expect(parseIntegerInput('-1')).toBe(-1);
    expect(parseIntegerInput('0')).toBe(0);
    expect(parseIntegerInput('42')).toBe(42);
  });

  it('returns null for empty and a lone minus instead of NaN', () => {
    expect(parseIntegerInput('')).toBeNull();
    expect(parseIntegerInput('-')).toBeNull();
  });
});
