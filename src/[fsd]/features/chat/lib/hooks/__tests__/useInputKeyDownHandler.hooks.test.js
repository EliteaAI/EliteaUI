// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import {
  useNewInputKeyDownHandler,
  useNewStartConversationInputKeyDownHandler,
} from '../useInputKeyDownHandler.hooks';

// Mimics the subset of the keydown event the hook reads off the textarea.
const buildEvent = (key, { value = '', selectionStart = value.length, selectionEnd } = {}) => ({
  key,
  target: {
    value,
    selectionStart,
    selectionEnd: selectionEnd ?? selectionStart,
  },
});

const press = (result, key, targetState) => {
  act(() => {
    result.current.onKeyDown(buildEvent(key, targetState));
  });
};

// Types a whole string, keeping the fake textarea value in sync with the keystrokes.
const type = (result, text) => {
  let value = '';
  for (const char of text) {
    press(result, char, { value });
    value += char;
  }
  return value;
};

describe('useNewInputKeyDownHandler', () => {
  it.each([
    ['#', 'hashtag'],
    ['&', 'ampersand'],
  ])('opens participant mention mode on "%s" (%s)', trigger => {
    const { result } = renderHook(() => useNewInputKeyDownHandler());

    press(result, trigger);

    expect(result.current.isProcessingSymbols).toBe(true);
    expect(result.current.query).toBe(trigger);
  });

  it.each(['#', '&'])('accumulates typed characters after "%s"', trigger => {
    const { result } = renderHook(() => useNewInputKeyDownHandler());

    type(result, `${trigger}Agent`);

    expect(result.current.isProcessingSymbols).toBe(true);
    expect(result.current.query).toBe(`${trigger}Agent`);
  });

  it.each(['#', '&'])('resets when backspacing over the "%s" trigger itself', trigger => {
    const { result } = renderHook(() => useNewInputKeyDownHandler());

    press(result, trigger);
    press(result, 'Backspace', { value: trigger });

    expect(result.current.isProcessingSymbols).toBe(false);
    expect(result.current.query).toBe('');
  });

  it.each(['#', '&'])('keeps the mention open when backspacing a query character after "%s"', trigger => {
    const { result } = renderHook(() => useNewInputKeyDownHandler());

    const value = type(result, `${trigger}Ag`);
    press(result, 'Backspace', { value });

    expect(result.current.isProcessingSymbols).toBe(true);
    expect(result.current.query).toBe(`${trigger}A`);
  });

  it.each(['#', '&'])('resets on Escape while in "%s" mention mode', trigger => {
    const { result } = renderHook(() => useNewInputKeyDownHandler());

    type(result, `${trigger}Agent`);
    press(result, 'Escape', { value: `${trigger}Agent` });

    expect(result.current.isProcessingSymbols).toBe(false);
    expect(result.current.query).toBe('');
  });

  it('does not start participant mention mode on "@"', () => {
    const { result } = renderHook(() => useNewInputKeyDownHandler());

    press(result, '@');

    expect(result.current.isProcessingSymbols).toBe(false);
    expect(result.current.query).toBe('');
    expect(result.current.isProcessingAtSymbol).toBe(true);
    expect(result.current.atQuery).toBe('@');
  });

  it.each(['#', '&'])('ignores "%s" when hashtag detection is disabled', trigger => {
    const { result } = renderHook(() => useNewInputKeyDownHandler({ disableHashtagDetection: true }));

    press(result, trigger);

    expect(result.current.isProcessingSymbols).toBe(false);
    expect(result.current.query).toBe('');
  });
});

describe('useNewStartConversationInputKeyDownHandler', () => {
  it.each(['#', '&'])('opens participant mention mode on "%s" and accumulates the query', trigger => {
    const { result } = renderHook(() => useNewStartConversationInputKeyDownHandler());

    type(result, `${trigger}Agent`);

    expect(result.current.isProcessingSymbols).toBe(true);
    expect(result.current.query).toBe(`${trigger}Agent`);
  });

  it.each(['#', '&'])('resets when backspacing over the "%s" trigger itself', trigger => {
    const { result } = renderHook(() => useNewStartConversationInputKeyDownHandler());

    press(result, trigger);
    press(result, 'Backspace', { value: trigger });

    expect(result.current.isProcessingSymbols).toBe(false);
    expect(result.current.query).toBe('');
  });
});
