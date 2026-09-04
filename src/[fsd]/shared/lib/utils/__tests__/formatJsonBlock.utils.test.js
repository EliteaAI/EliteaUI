// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { formatJsonBlock } from '@/[fsd]/shared/lib/utils';
import { convertJsonToString } from '@/common/utils';

vi.hoisted(() => {
  const entries = new Map();

  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

const ISSUES = [{ number: 535, title: 'Fix *login* and _signup_, see [doc](http://x)', labels: [] }];

describe('formatJsonBlock', () => {
  it('fences and indents a JSON payload that arrived as a string', () => {
    const result = formatJsonBlock(JSON.stringify(ISSUES));

    expect(result).toBe('```json\n' + JSON.stringify(ISSUES, null, 2) + '\n```');
  });

  it('keeps markdown characters inside values verbatim', () => {
    const result = formatJsonBlock(JSON.stringify(ISSUES));

    expect(result).toContain('*login*');
    expect(result).toContain('[doc](http://x)');
  });

  it('fences a payload that arrived as an object', () => {
    expect(formatJsonBlock(ISSUES)).toBe('```json\n' + JSON.stringify(ISSUES, null, 2) + '\n```');
  });

  it('never double fences', () => {
    const fenced = '```json\n[]\n```';

    expect(formatJsonBlock(fenced)).toBe(fenced);
  });

  it('renders nothing for a missing payload', () => {
    // JSON.stringify(undefined) returns undefined rather than throwing, so this
    // used to produce a fenced literal "undefined" that `|| ''` could not catch.
    expect(formatJsonBlock(undefined)).toBe('');
    expect(formatJsonBlock(null)).toBe('');
    expect(formatJsonBlock(undefined) || 'fallback').toBe('fallback');
  });

  it('leaves prose alone even when it mentions brackets', () => {
    expect(formatJsonBlock('See [the docs](http://x) for details')).toBe(
      'See [the docs](http://x) for details',
    );
  });

  it('leaves prose that merely precedes JSON alone', () => {
    const mixed = 'Here are the issues:\n[{"number": 1}]';

    expect(formatJsonBlock(mixed)).toBe(mixed);
  });

  it('leaves a bare JSON scalar alone', () => {
    expect(formatJsonBlock('42')).toBe('42');
    expect(formatJsonBlock('"just a string"')).toBe('"just a string"');
  });

  it('leaves malformed JSON alone', () => {
    expect(formatJsonBlock('[{"number": 535')).toBe('[{"number": 535');
  });

  it('preserves integers too large for the JS number type', () => {
    // JSON.parse would round these; the user would be shown a wrong id.
    const result = formatJsonBlock('[{"id": 9007199254740993, "work_item": 12345678901234567890}]');

    expect(result).toContain('9007199254740993');
    expect(result).toContain('12345678901234567890');
    expect(result).not.toContain('9007199254740992');
  });

  it('preserves duplicate keys and exotic literals a parser would eat', () => {
    const result = formatJsonBlock('[{"a": 1, "a": 2, "big": 1e400}]');

    expect(result).toContain('"a": 1');
    expect(result).toContain('"a": 2');
    expect(result).toContain('1e400');
    expect(result).not.toContain('null');
  });

  it('does not treat braces or commas inside strings as structure', () => {
    const result = formatJsonBlock('[{"t": "x, y: z {q}"}]');

    expect(result).toContain('"t": "x, y: z {q}"');
  });

  it('is not confused by escaped quotes or backslashes inside strings', () => {
    // The classic failure mode of a character scanner: a \" must not be read as
    // the end of the string, and a trailing \\ must not escape the real closing quote.
    const payload = '[{"a": "he said \\"hi\\", then {left}", "b": "ends with a backslash\\\\", "c": 1}]';

    const result = formatJsonBlock(payload);

    expect(JSON.parse(result.replace(/^```json\n/, '').replace(/\n```$/, ''))).toEqual([
      { a: 'he said "hi", then {left}', b: 'ends with a backslash\\', c: 1 },
    ]);
  });

  it('round-trips any payload it fences', () => {
    const payloads = [
      '[]',
      '{}',
      '[{"nested": {"deep": [1, 2, {"x": null}]}}]',
      '{"unicode": "привет 日本語", "emoji": "🎉"}',
      '[{"esc": "tab\\there\\nnewline"}]',
      '{"num": -1.5e-7, "big": 9007199254740993}',
    ];

    payloads.forEach(payload => {
      const fenced = formatJsonBlock(payload);
      const inner = fenced.replace(/^```json\n/, '').replace(/\n```$/, '');

      expect(JSON.parse(inner)).toEqual(JSON.parse(payload));
    });
  });

  it('keeps empty collections on one line', () => {
    const result = formatJsonBlock('[{"labels": [], "meta": {}}]');

    expect(result).toContain('"labels": []');
    expect(result).toContain('"meta": {}');
  });

  it('indents a compact payload', () => {
    expect(formatJsonBlock('[{"id":1}]')).toBe('```json\n[\n  {\n    "id": 1\n  }\n]\n```');
  });
});

describe('convertJsonToString stays a pass-through for strings', () => {
  // Six call sites accumulate its output with += on streamed fragments, and one
  // wraps it in a ```plaintext fence; fencing a string here splices broken fences
  // into the middle of a message.
  it('returns a JSON string untouched in block mode', () => {
    const json = JSON.stringify(ISSUES);

    expect(convertJsonToString(json, true)).toBe(json);
  });

  it('returns a fragment untouched in block mode', () => {
    expect(convertJsonToString('[{"number": 1', true)).toBe('[{"number": 1');
  });

  it('returns prose untouched', () => {
    expect(convertJsonToString('plain answer', true)).toBe('plain answer');
  });

  it('still stringifies non-strings', () => {
    expect(convertJsonToString(ISSUES)).toBe(JSON.stringify(ISSUES, null, 2));
    expect(convertJsonToString(ISSUES, true)).toContain('```json');
  });
});

describe('formatJsonBlock on large payloads', () => {
  const bigPayload = count =>
    JSON.stringify(
      Array.from({ length: count }, (_, index) => ({
        number: 500 + index,
        title: `fix(carrier): compute the get_ui_reports current_date ${index}`,
        state: 'open',
        created_at: '2026-08-16T21:08:42+00:00',
        url: `https://github.com/EliteaAI/elitea-sdk/pull/${index}`,
        labels: [],
        assignees: [],
      })),
    );

  it('formats a large result in linear time, not quadratic', () => {
    // This runs synchronously inside a render, so a quadratic implementation
    // freezes the chat tab rather than showing a spinner. jsonc-parser's own
    // applyEdits rebuilds the string per edit and measured 1507ms here.
    const payload = bigPayload(2000);
    expect(payload.length).toBeGreaterThan(400_000);

    const startedAt = performance.now();
    const result = formatJsonBlock(payload);
    const elapsed = performance.now() - startedAt;

    expect(result.startsWith('```json')).toBe(true);
    expect(elapsed).toBeLessThan(500);
  });

  it('still round-trips a large result exactly', () => {
    const payload = bigPayload(500);

    const inner = formatJsonBlock(payload)
      .replace(/^```json\n/, '')
      .replace(/\n```$/, '');

    expect(JSON.parse(inner)).toEqual(JSON.parse(payload));
  });
});
