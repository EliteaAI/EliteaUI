// @vitest-environment jsdom
import { useCallback, useEffect, useRef, useState } from 'react';

import { describe, expect, it } from 'vitest';

import { autoModel, isAutoSelection } from '@/[fsd]/shared/lib/utils/autoRouting.utils';
import { ChatParticipantType } from '@/common/constants';
import { act, renderHook } from '@testing-library/react';

import * as NewConversationHelpers from '../../lib/helpers/newConversation.helpers';
// Exercise ChatBox's actual callback and dependency list without loading unrelated
// editor/socket/toolkit UI. The browser acceptance checks cover the full component.
// Vite's raw query returns the actual source without importing the full UI.
// eslint-disable-next-line import/no-unresolved
import source from './ChatBox.jsx?raw';

const callback = source.slice(
  source.indexOf('  const initializedConversationModelRef = useRef(null);'),
  source.indexOf('  // We need this useEffect'),
);
const effectStart = source.indexOf('  useEffect(() => {\n    if (!isAgentsPage) {\n      // A saved chat');
const effect = source.slice(effectStart, source.indexOf('\n\n  const getRegeneratePayload', effectStart));
const buildHook = new Function(
  'useState',
  'useCallback',
  'useEffect',
  'useRef',
  'autoModel',
  'isAutoSelection',
  'NewConversationHelpers',
  'ChatParticipantType',
  `return function useSelection({activeConversation, modelsData, defaultModel, isAgentsPage = false, llmSettings, isLoadingConversation = false, userId = 3}) {
    const projectId = 2;
    const activeParticipant = undefined, onChangeParticipantSettings = undefined;
    const onClearActiveParticipant = () => {};
    const [selectedModel, setSelectedModel] = useState(null);
    ${callback}
    ${effect}
    return {selectedModel, setSelectedModel};
  }`,
);
const useSelection = buildHook(
  useState,
  useCallback,
  useEffect,
  useRef,
  autoModel,
  isAutoSelection,
  NewConversationHelpers,
  ChatParticipantType,
);
const haiku = { name: 'haiku', project_id: 1 };
const luna = { name: 'luna', project_id: 1 };
const auto = {
  uuid: 'auto-chat',
  participants: [],
  saved: { selection: autoModel({ id: 'v7-quality-cost', revision: 1 }).selection },
};
const concrete = {
  uuid: 'concrete-chat',
  participants: [],
  saved: { model_name: haiku.name, model_project_id: 1 },
};
for (const conversation of [auto, concrete]) {
  conversation.participants = [
    { entity_name: 'user', entity_meta: { id: 3 }, entity_settings: { llm_settings: conversation.saved } },
  ];
}
const initial = activeConversation => ({
  activeConversation,
  modelsData: { items: [haiku, luna] },
  defaultModel: haiku,
});

describe('saved chat model ownership during SPA navigation', () => {
  it.each([
    [auto, concrete, 'haiku'],
    [concrete, auto, '__elitea_auto__'],
  ])('reselects the new conversation without a page reload', (from, to, expected) => {
    const { result, rerender } = renderHook(useSelection, { initialProps: initial(from) });
    rerender(initial(to));
    expect(result.current.selectedModel.name).toBe(expected);
  });
  it('preserves an explicit same-chat selection on catalog refetch and project default change', () => {
    const { result, rerender } = renderHook(useSelection, { initialProps: initial(auto) });
    act(() => result.current.setSelectedModel(luna));
    rerender({
      activeConversation: { ...auto },
      modelsData: { items: [{ ...haiku }, { ...luna }] },
      defaultModel: { ...haiku },
    });
    expect(result.current.selectedModel).toBe(luna);
    rerender({
      activeConversation: { ...auto },
      modelsData: { items: [{ ...haiku }, { ...luna }] },
      defaultModel: luna,
    });
    expect(result.current.selectedModel).toBe(luna);
    rerender(initial(concrete));
    expect(result.current.selectedModel).toBe(haiku);
  });
  it('waits for saved conversation data and the catalog before initializing', () => {
    const { result, rerender } = renderHook(useSelection, {
      initialProps: {
        ...initial(concrete),
        activeConversation: { uuid: concrete.uuid, participants: [] },
        modelsData: { items: [] },
      },
    });
    expect(result.current.selectedModel).toBeNull();
    rerender(initial(concrete));
    expect(result.current.selectedModel).toBe(haiku);
  });
  it('keeps explicit Agent editor LLM prop updates reactive', () => {
    const { result, rerender } = renderHook(useSelection, {
      initialProps: { ...initial(concrete), isAgentsPage: true, llmSettings: auto.saved },
    });
    expect(result.current.selectedModel.name).toBe('__elitea_auto__');
    rerender({ ...initial(concrete), isAgentsPage: true, llmSettings: concrete.saved });
    expect(result.current.selectedModel).toBe(haiku);
  });
  it.each([
    { activeConversation: { uuid: concrete.uuid, participants: [] } },
    { userId: null },
    { isLoadingConversation: true },
    { modelsData: { items: [] } },
  ])('does not seal chat identity before caller/details/current catalog are ready', delayed => {
    const { result, rerender } = renderHook(useSelection, {
      initialProps: { ...initial(concrete), ...delayed },
    });
    expect(result.current.selectedModel).toBeNull();
    rerender(initial(concrete));
    expect(result.current.selectedModel).toBe(haiku);
  });
  it('retains concrete fallback for a loaded legacy caller with no saved settings', () => {
    const legacy = {
      uuid: 'legacy',
      participants: [{ entity_name: 'user', entity_meta: { id: 3 }, entity_settings: {} }],
    };
    const { result } = renderHook(useSelection, { initialProps: initial(legacy) });
    expect(result.current.selectedModel).toBe(haiku);
  });
  it('uses the existing concrete fallback for a fully loaded shared chat before joining', () => {
    const shared = {
      uuid: 'shared',
      participants: [
        { entity_name: 'user', entity_meta: { id: 99 }, entity_settings: { llm_settings: auto.saved } },
      ],
      message_groups: [],
    };
    const { result, rerender } = renderHook(useSelection, { initialProps: initial(auto) });
    rerender(initial(shared));
    expect(result.current.selectedModel).toBe(haiku);
  });
  it('clears the previous selection while a different chat catalog is not ready', () => {
    const { result, rerender } = renderHook(useSelection, { initialProps: initial(auto) });
    expect(result.current.selectedModel.name).toBe('__elitea_auto__');
    rerender({ ...initial(concrete), modelsData: { items: [] }, defaultModel: null });
    expect(result.current.selectedModel).toBeNull();
    rerender(initial(concrete));
    expect(result.current.selectedModel).toBe(haiku);
  });
});
