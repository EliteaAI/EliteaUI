// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { act, renderHook } from '@testing-library/react';

const handleClearChat = vi.fn();
const getModalProps = vi.fn(() => ({ open: false }));
let toolSchema = null;

vi.mock('@/[fsd]/features/mcp', () => ({
  useMcpAuthModal: () => ({ handleMcpAuthRequired: vi.fn(), getModalProps }),
}));

vi.mock('@/[fsd]/features/toolkits/lib/constants', () => ({
  ToolkitChatModesEnum: { testTools: 'testTools' },
}));

vi.mock('@/[fsd]/features/toolkits/lib/helpers', () => ({
  ToolkitChatHelpers: { validateToolkitForm: () => true },
}));

vi.mock('@/common/constants', () => ({ WELCOME_MESSAGE_ID: 'welcome_message_id' }));

vi.mock('@/pages/Applications/Components/Tools/consts', () => ({
  ToolTypes: { custom: { value: 'custom' } },
}));

vi.mock('@/hooks/toolkit/useGetSelectedToolSchema', () => ({
  useGetSelectedToolSchema: () => toolSchema,
}));

vi.mock('../useToolkitChat.hooks', () => ({
  useToolkitChat: () => ({
    chatHistory: [{ id: 'welcome_message_id' }],
    handleRunTool: vi.fn(),
    handleClearChat,
    isRunning: false,
    retryLastRun: vi.fn(),
    modelList: [],
    onSelectModel: vi.fn(),
    onSetLLMSettings: vi.fn(),
    selectedModel: null,
    llmSettings: {},
  }),
}));

const { useToolkitTestRunner } = await import('../useToolkitTestRunner.hooks');

const renderRunner = () =>
  renderHook(() => useToolkitTestRunner({ toolkitId: '1', values: { type: 'jira', settings: {} } }));

const selectTool = (result, tool) => act(() => result.current.onChangeTool(tool));

beforeEach(() => {
  vi.clearAllMocks();
  toolSchema = null;
});

describe('useToolkitTestRunner default seeding', () => {
  it('seeds one default per schema type without sharing object or array references', () => {
    toolSchema = {
      properties: {
        payload: { type: 'object' },
        tags: { type: 'array' },
        other_payload: { type: 'object' },
        enabled: { type: 'boolean' },
        title: { type: 'string' },
        limit: { type: 'integer' },
        ratio: { type: 'number' },
        unknown: {},
      },
    };

    const { result } = renderRunner();
    selectTool(result, 'create_issue');

    const seeded = result.current.toolInputVariables;

    expect(seeded).toEqual({
      payload: {},
      tags: [],
      other_payload: {},
      enabled: false,
      title: '',
      limit: null,
      ratio: null,
      unknown: '',
    });
    expect(seeded.payload).not.toBe(seeded.other_payload);
  });

  it('prefers an explicit default, then an anyOf array default, then a nullable anyOf', () => {
    toolSchema = {
      properties: {
        status: { type: 'string', default: 'open' },
        whitelist: { anyOf: [{ type: 'array', default: ['a'] }, { type: 'null' }] },
        blacklist: { anyOf: [{ type: 'array' }, { type: 'null' }] },
      },
    };

    const { result } = renderRunner();
    selectTool(result, 'search_issues');

    expect(result.current.toolInputVariables).toEqual({
      status: 'open',
      whitelist: ['a'],
      blacklist: null,
    });
  });

  it('does not re-seed over values entered after the tool was initialized', () => {
    toolSchema = { properties: { title: { type: 'string' }, status: { type: 'string', default: 'open' } } };

    const { result } = renderRunner();
    selectTool(result, 'create_issue');

    act(() => result.current.onChangeInputVariables({ title: 'typed', status: 'closed' }));

    expect(result.current.toolInputVariables).toEqual({ title: 'typed', status: 'closed' });
  });

  it('keeps the parameters object identity while the user edits an initialized tool', () => {
    toolSchema = { properties: { title: { type: 'string' } } };

    const { result } = renderRunner();
    selectTool(result, 'create_issue');

    act(() => result.current.onChangeInputVariables({ title: 'a' }));
    const afterFirstEdit = result.current.toolInputVariables;

    act(() => result.current.onChangeInputVariables({ title: 'ab' }));

    expect(result.current.toolInputVariables).toEqual({ title: 'ab' });
    expect(result.current.toolInputVariables).not.toBe(afterFirstEdit);
  });

  it('replaces a schema-supplied function when a late schema finally seeds the tool', () => {
    toolSchema = null;

    const { result, rerender } = renderRunner();
    selectTool(result, 'create_issue');

    // No schema yet, so nothing is seeded and a schema-supplied function survives.
    act(() => result.current.onChangeInputVariables({ title: 'typed', filter: () => {} }));
    expect(result.current.toolInputVariables.filter).toBeTypeOf('function');

    toolSchema = { properties: { title: { type: 'string' }, filter: { type: 'string' } } };
    act(() => rerender());

    expect(result.current.toolInputVariables.title).toBe('typed');
    expect(result.current.toolInputVariables.filter).toBe('');
  });
});

describe('useToolkitTestRunner tool changes', () => {
  it('clears parameters and results so output is never attributed to the previous tool', () => {
    toolSchema = { properties: { title: { type: 'string' } } };

    const { result } = renderRunner();
    selectTool(result, 'create_issue');

    act(() => result.current.onChangeInputVariables({ title: 'typed' }));
    expect(result.current.toolInputVariables.title).toBe('typed');

    selectTool(result, 'search_issues');

    expect(result.current.selectedTool).toBe('search_issues');
    expect(result.current.toolInputVariables.title).toBe('');
    expect(handleClearChat).toHaveBeenCalled();
  });

  it('treats a cleared selection as no tool', () => {
    const { result } = renderRunner();
    selectTool(result, 'create_issue');
    selectTool(result, null);

    expect(result.current.selectedTool).toBeNull();
  });

  it('re-seeds defaults when the tool that was just cleared is picked again', () => {
    toolSchema = { properties: { status: { type: 'string', default: 'open' } } };

    const { result } = renderRunner();
    selectTool(result, 'create_issue');
    expect(result.current.toolInputVariables).toEqual({ status: 'open' });

    selectTool(result, null);
    expect(result.current.toolInputVariables).toEqual({});

    selectTool(result, 'create_issue');
    expect(result.current.toolInputVariables).toEqual({ status: 'open' });
  });
});
