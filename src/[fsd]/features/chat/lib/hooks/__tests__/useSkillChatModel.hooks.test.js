// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { renderHook } from '@testing-library/react';

import { useSkillChatModel } from '../useSkillChatModel.hooks';

const MODELS = [
  { name: 'sonnet', project_id: 1, default: true },
  { name: 'haiku', project_id: 1 },
];

const skill = (entitySettings = { version_id: 8 }) => ({
  id: 4,
  entity_name: 'skill',
  entity_meta: { id: 174, project_id: 2 },
  entity_settings: entitySettings,
});

const details = versionId => ({
  id: 174,
  version_details: {
    id: versionId,
    run_settings: { llm_settings: { model_name: 'haiku', model_project_id: 1 } },
  },
});

const renderModel = (activeParticipant, participantDetails, onChangeParticipantSettings) =>
  renderHook(() =>
    useSkillChatModel({ activeParticipant, participantDetails, models: MODELS, onChangeParticipantSettings }),
  ).result.current;

describe('useSkillChatModel', () => {
  it("shows the pinned version's model and lets the chat override it", () => {
    const onChangeParticipantSettings = vi.fn();
    const participant = skill();
    const state = renderModel(participant, details(8), onChangeParticipantSettings);

    expect(state.skillModel).toBe(MODELS[1]);
    state.onSelectSkillModel(MODELS[0]);
    const [saved, hasBeenChanged] = onChangeParticipantSettings.mock.calls[0];
    expect(hasBeenChanged).toBe(true);
    expect(saved.entity_settings).toMatchObject({ version_id: 8, llm_settings: { model_name: 'sonnet' } });
  });

  it('keeps the shown model when only its settings change', () => {
    const onChangeParticipantSettings = vi.fn();
    const state = renderModel(skill(), details(8), onChangeParticipantSettings);

    state.onSetSkillLLMSettings({ max_tokens: 8192, steps_limit: 5 });
    const { llm_settings } = onChangeParticipantSettings.mock.calls[0][0].entity_settings;
    expect(llm_settings).toMatchObject({ model_name: 'haiku', max_tokens: 8192 });
    expect(llm_settings).not.toHaveProperty('steps_limit');
  });

  it('withholds the model until the pinned version is known', () => {
    const state = renderModel(skill(), details(7), vi.fn());

    expect(state.skillModel).toBeNull();
    expect(state.onSelectSkillModel).toBeUndefined();
    expect(state.onSetSkillLLMSettings).toBeUndefined();
  });

  it("uses the chat's own model without waiting for the version", () => {
    const state = renderModel(
      skill({ version_id: 8, llm_settings: { model_name: 'sonnet' } }),
      undefined,
      vi.fn(),
    );

    expect(state.skillModel).toBe(MODELS[0]);
    expect(state.onSelectSkillModel).toBeDefined();
  });

  it('is read-only without a way to save and inert for other participants', () => {
    expect(renderModel(skill(), details(8)).onSelectSkillModel).toBeUndefined();
    expect(
      renderModel({ entity_name: 'application', entity_meta: { id: 1 } }, undefined, vi.fn()),
    ).toMatchObject({
      isActiveSkill: false,
      skillModel: null,
    });
  });
});
