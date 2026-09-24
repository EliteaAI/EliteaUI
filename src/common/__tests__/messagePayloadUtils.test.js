import { describe, expect, it, vi } from 'vitest';

import { autoModel } from '@/[fsd]/shared/lib/utils';
import { ChatParticipantType } from '@/common/constants';

import {
  generateChatContinuePayload,
  generateMcpContinuePayload,
  generateMessagePayload,
} from '../messagePayloadUtils';

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: {
    getAllTokens: () => ({ sharepoint: { access_token: 'token' } }),
    getServersWithoutTokens: () => [],
  },
}));

describe('Auto selection on the first chat request', () => {
  const selectedModel = autoModel({ id: 'v7-quality-cost', revision: 1 });
  it('sends a selection contract, never the picker sentinel', () => {
    const payload = generateMessagePayload({ question: 'Hi', selectedModel });
    expect(payload.llm_settings.model_name).toBeNull();
    expect(payload.llm_settings.selection).toEqual(selectedModel.selection);
    expect(JSON.stringify(payload)).not.toContain('__elitea_auto__');
  });
  it('preserves explicit effort and does not override a saved agent without permission', () => {
    const settings = {
      selection: { ...selectedModel.selection, reasoning: { mode: 'explicit', preset: 'high' } },
    };
    expect(
      generateMessagePayload({ selectedModel, unsavedLLMSettings: settings }).llm_settings.selection.reasoning
        .preset,
    ).toBe('high');
    const participant = { id: 1, entity_name: ChatParticipantType.Applications };
    expect(generateMessagePayload({ selectedModel, participant }).llm_settings).toBeUndefined();
    expect(
      generateMessagePayload({ selectedModel, participant, allowLLMSettingsOverride: true }).llm_settings
        .selection.mode,
    ).toBe('auto');
  });
  it.each([ChatParticipantType.Applications, ChatParticipantType.Pipelines])(
    'does not leak an Auto chat default into saved participant %s',
    entity_name => {
      const participant = {
        id: 42,
        entity_name,
        entity_settings: {
          llm_settings: { model_name: 'saved-concrete', model_project_id: 1 },
        },
      };
      const payload = generateMessagePayload({ question: 'Go', selectedModel, participant });
      expect(payload.participant_id).toBe(42);
      expect(payload.llm_settings).toBeUndefined();
      expect(participant.entity_settings.llm_settings.model_name).toBe('saved-concrete');
    },
  );
  it('retains concrete manual selection', () => {
    expect(generateMessagePayload({ selectedModel: { name: 'chosen', project_id: 1 } }).llm_settings).toEqual(
      { selection: null, model_name: 'chosen', model_project_id: 1 },
    );
  });
});

describe('generateMcpContinuePayload', () => {
  it('routes one durable Toolkit decision by its exact interrupt identity', () => {
    const decision = {
      interrupt_id: 'mcp_auth_123',
      tool_call_id: 'call_sharepoint',
      child_thread_id: 'root:research-agent',
      action: 'authorize',
    };

    const payload = generateMcpContinuePayload({
      projectId: 7,
      conversation_uuid: 'conversation-id',
      message_id: 'message-id',
      thread_id: 'root-thread',
      authorization_request_id: 'mcp_auth_123',
      authorization_action: 'authorize',
      mcp_auth_decisions: [decision],
    });

    expect(payload).toMatchObject({
      project_id: 7,
      conversation_uuid: 'conversation-id',
      message_id: 'message-id',
      thread_id: 'root-thread',
      mcp_auth_resume: true,
      mcp_auth_action: 'authorize',
      mcp_auth_decisions: [decision],
      authorization_request_id: 'mcp_auth_123',
      should_continue: false,
    });
    expect(payload).not.toHaveProperty('hitl_resume');
    expect(payload.token_limit_continuation).toBe(false);
  });
});

describe('generateChatContinuePayload', () => {
  it('explicitly identifies an output-token continuation', () => {
    const payload = generateChatContinuePayload({
      projectId: 7,
      conversation_uuid: 'conversation-id',
      message_id: 'message-id',
      thread_id: 'thread-id',
      question: 'Write a long answer',
      tokenLimitContinuation: true,
    });

    expect(payload).toMatchObject({
      message_id: 'message-id',
      thread_id: 'thread-id',
      user_input: 'Write a long answer',
      token_limit_continuation: true,
    });
  });
});
