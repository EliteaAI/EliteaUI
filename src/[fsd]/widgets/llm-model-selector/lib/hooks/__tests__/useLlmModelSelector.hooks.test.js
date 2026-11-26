// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

import { useLlmModelSelector } from '../useLlmModelSelector.hooks';

const MODEL = { name: 'gpt-5', supports_reasoning: false };

describe('useLlmModelSelector', () => {
  it('opens the model list at the anchor and closes it', () => {
    const { result } = renderHook(() => useLlmModelSelector({ selectedModel: MODEL }));
    const anchor = {};
    result.current.anchorRef.current = anchor;

    act(() => result.current.handleModelMenuClick());
    expect(result.current.anchorEl).toBe(anchor);

    act(() => result.current.handleClose());
    expect(result.current.anchorEl).toBeNull();
  });

  it('opens the dialog and applies the settings through onSetLLMSettings', () => {
    const onSetLLMSettings = vi.fn();
    const { result } = renderHook(() => useLlmModelSelector({ selectedModel: MODEL, onSetLLMSettings }));

    act(() => result.current.handleSettingsClick());
    expect(result.current.showLLMSettings).toBe(true);

    act(() => result.current.handleApplySettings({ max_tokens: 99 }));
    expect(onSetLLMSettings).toHaveBeenCalledWith({ max_tokens: 99 });
    expect(result.current.showLLMSettings).toBe(false);
  });

  it('cancels the dialog without applying', () => {
    const onSetLLMSettings = vi.fn();
    const { result } = renderHook(() => useLlmModelSelector({ selectedModel: MODEL, onSetLLMSettings }));

    act(() => result.current.handleSettingsClick());
    act(() => result.current.handleCancelSettings());

    expect(result.current.showLLMSettings).toBe(false);
    expect(onSetLLMSettings).not.toHaveBeenCalled();
  });

  it('hands the settings click to the host when it owns the settings', () => {
    const onClickSettings = vi.fn();
    const { result } = renderHook(() =>
      useLlmModelSelector({ selectedModel: MODEL, onClickSettings, onSetLLMSettings: vi.fn() }),
    );

    act(() => result.current.handleSettingsClick());

    expect(onClickSettings).toHaveBeenCalled();
    expect(result.current.showLLMSettings).toBe(false);
  });

  it('opens no dialog without a settings handler', () => {
    const { result } = renderHook(() => useLlmModelSelector({ selectedModel: MODEL }));

    act(() => result.current.handleSettingsClick());

    expect(result.current.showLLMSettings).toBe(false);
  });

  it('normalizes null settings', () => {
    const { result } = renderHook(() => useLlmModelSelector({ llmSettings: null, selectedModel: MODEL }));

    expect(result.current.normalizedLlmSettings).toEqual(
      expect.objectContaining({ max_tokens: expect.anything() }),
    );
  });
});
