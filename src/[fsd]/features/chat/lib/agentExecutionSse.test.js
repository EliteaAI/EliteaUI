import { describe, expect, it, vi } from 'vitest';

import {
  AGENT_ADHOC_EXECUTION_CONTRACT,
  AGENT_APPLICATION_EXECUTION_CONTRACT,
  AGENT_AUTHORIZATION_CONTINUATION_EXECUTION_CONTRACT,
  AGENT_HITL_CONTINUATION_EXECUTION_CONTRACT,
  AGENT_REGENERATION_EXECUTION_CONTRACT,
  admitAgentExecution,
  buildAgentAuthorizationContinuationBody,
  buildAgentExecutionEventsUrl,
  buildAgentExecutionStartBody,
  buildAgentHITLContinuationBody,
  getAgentExecutionResumeCandidate,
  getAgentExecutionSseContract,
  getAgentHITLChildThreadId,
  getAgentRegenerationSseContract,
  isAgentExecutionSseEligible,
  isAgentHITLContinuationEligible,
  resetAgentExecutionReplayProjection,
  resumeAgentExecutionSse,
  settleAgentExecutionReplayProjection,
  startAgentAuthorizationContinuationSse,
  startAgentExecutionSse,
  startAgentHITLContinuationSse,
  startAgentRegenerationSse,
} from './agentExecutionSse';

const payload = {
  payload: { user_input: 'hello' },
  project_id: 7,
  participant_id: 19,
  conversation_uuid: 'conversation-id',
  question_id: 'question-id',
  interaction_uuid: 'interaction-id',
  attachments_info: [],
  mcp_tokens: {},
};

const durableExecutionId = '0123456789abcdef0123456789abcdef';
const anotherDurableExecutionId = 'fedcba9876543210fedcba9876543210';

class FakeEventSource {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
    this.close = vi.fn();
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  async dispatch(name, data) {
    await this.listeners.get(name)?.({ data: JSON.stringify(data) });
  }
}

describe('agent execution SSE', () => {
  it('admits bounded in-process HITL decisions but not child-thread routing', () => {
    expect(
      isAgentHITLContinuationEligible({
        interrupts: [{ interrupt_id: 'root-1', thread_id: 'parent-checkpoint-1' }],
        action: 'approve',
      }),
    ).toBe(true);
    expect(
      isAgentHITLContinuationEligible({
        interrupts: [{
          interrupt_id: 'nested-1',
          parent_agent_call_id: 'call-pipeline-1',
          parent_agent_path: [{ name: 'artifact_test', call_id: 'call-pipeline-1' }],
        }],
        action: 'block_with_comment',
      }),
    ).toBe(true);
    expect(
      isAgentHITLContinuationEligible({
        interrupts: [{ interrupt_id: 'child-1', child_thread_id: 'child-thread-1' }],
        action: 'approve',
      }),
    ).toBe(false);
    expect(
      isAgentHITLContinuationEligible({
        interrupts: [{ interrupt_id: 'nested-1', parent_agent_call_id: 'call-pipeline-1' }],
        action: 'answer',
      }),
    ).toBe(false);
    expect(
      isAgentHITLContinuationEligible({
        interrupts: [{ interrupt_id: 'one' }, { interrupt_id: 'two' }],
        decisions: [
          { interrupt_id: 'one', action: 'approve' },
          { interrupt_id: 'two', action: 'reject' },
        ],
      }),
    ).toBe(true);
    expect(
      isAgentHITLContinuationEligible({
        interrupts: [{ interrupt_id: 'one' }, { interrupt_id: 'two' }],
        decisions: [{ interrupt_id: 'one', action: 'approve' }],
      }),
    ).toBe(false);
  });

  it('distinguishes the parent checkpoint thread from a parallel child thread', () => {
    expect(
      getAgentHITLChildThreadId({
        thread_id: 'parent-checkpoint-1',
        resume_strategy: 'single',
      }),
    ).toBe('');
    expect(
      getAgentHITLChildThreadId({
        thread_id: 'child-thread-1',
        resume_strategy: 'aggregate_child',
      }),
    ).toBe('child-thread-1');
  });

  it('only selects the direct path for the bounded application slice', () => {
    const base = {
      isAgentsPage: true,
      participant: { entity_name: 'application' },
      eventPayload: payload,
      hasAttachments: false,
      hasLLMOverride: false,
      isSendingToUser: false,
    };

    expect(isAgentExecutionSseEligible(base)).toBe(true);
    expect(getAgentExecutionSseContract(base)).toBe(AGENT_APPLICATION_EXECUTION_CONTRACT);
    expect(isAgentExecutionSseEligible({ ...base, isAgentsPage: false })).toBe(false);
    expect(isAgentExecutionSseEligible({ ...base, participant: { entity_name: 'pipeline' } })).toBe(false);
    expect(isAgentExecutionSseEligible({ ...base, hasLLMOverride: true })).toBe(false);
    expect(
      isAgentExecutionSseEligible({ ...base, eventPayload: { ...payload, mcp_tokens: { server: {} } } }),
    ).toBe(false);
  });

  it('selects configured application execution in main Chat for one bounded agent or pipeline participant', () => {
    const application = {
      id: 19,
      entity_name: 'application',
      entity_settings: { agent_type: 'agent' },
    };
    const options = {
      isAgentsPage: false,
      participant: application,
      conversationParticipants: [{ entity_name: 'user' }, { entity_name: 'dummy' }, application],
      conversationMeta: { internal_tools: [] },
      eventPayload: payload,
      hasAttachments: false,
      hasLLMOverride: false,
      isSendingToUser: false,
    };

    expect(getAgentExecutionSseContract(options)).toBe(AGENT_APPLICATION_EXECUTION_CONTRACT);
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationMeta: { internal_tools: ['internal_mcp'] },
      }),
    ).toBe(AGENT_APPLICATION_EXECUTION_CONTRACT);
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationMeta: { internal_tools: ['attachments'] },
      }),
    ).toBeNull();
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { entity_name: 'toolkit', entity_settings: { toolkit_type: 'aha' } },
        ],
      }),
    ).toBeNull();
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { id: 20, entity_name: 'application', entity_settings: { agent_type: 'agent' } },
        ],
      }),
    ).toBeNull();
    expect(
      getAgentExecutionSseContract({
        ...options,
        participant: { ...application, entity_settings: { agent_type: 'pipeline' } },
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { ...application, entity_settings: { agent_type: 'pipeline' } },
        ],
      }),
    ).toBe(AGENT_APPLICATION_EXECUTION_CONTRACT);
  });

  it('selects exactly one persisted configured-agent execution for reload reattachment', () => {
    const application = {
      id: 19,
      entity_name: 'application',
      entity_settings: { agent_type: 'agent' },
    };
    const options = {
      isAgentsPage: false,
      conversationParticipants: [{ entity_name: 'user' }, { entity_name: 'dummy' }, application],
      conversationMeta: { internal_tools: [] },
      chatHistory: [
        { id: 'question-id', role: 'user' },
        {
          id: 'response-id',
          question_id: 'question-id',
          task_id: durableExecutionId,
          isStreaming: true,
        },
      ],
    };

    expect(getAgentExecutionResumeCandidate(options)).toEqual({
      executionId: durableExecutionId,
      questionId: 'question-id',
      responseMessageId: 'response-id',
    });
    expect(
      getAgentExecutionResumeCandidate({
        ...options,
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { ...application, entity_settings: { agent_type: 'pipeline' } },
        ],
      }),
    ).toEqual({
      executionId: durableExecutionId,
      questionId: 'question-id',
      responseMessageId: 'response-id',
    });
    expect(
      getAgentExecutionResumeCandidate({
        ...options,
        conversationMeta: { internal_tools: ['internal_mcp'] },
      }),
    ).toEqual({
      executionId: durableExecutionId,
      questionId: 'question-id',
      responseMessageId: 'response-id',
    });
    expect(
      getAgentExecutionResumeCandidate({
        ...options,
        chatHistory: options.chatHistory.map(message =>
          message.task_id ? { ...message, task_id: 'f2c986f5-e5bf-4de9-b488-a304407dd24c' } : message,
        ),
      }),
    ).toBeNull();
    expect(
      getAgentExecutionResumeCandidate({
        ...options,
        chatHistory: [
          ...options.chatHistory,
          {
            id: 'another-response',
            question_id: 'another-question',
            task_id: anotherDurableExecutionId,
            isStreaming: true,
          },
        ],
      }),
    ).toBeNull();
  });

  it('reattaches an admitted ad-hoc agent execution with the persisted chat model', () => {
    const options = {
      isAgentsPage: false,
      conversationParticipants: [
        {
          entity_name: 'user',
          entity_settings: { llm_settings: { model_name: 'eu.anthropic.claude' } },
        },
        { entity_name: 'dummy' },
        { entity_name: 'application', entity_settings: { agent_type: 'agent' } },
      ],
      conversationMeta: { internal_tools: ['internal_mcp'] },
      chatHistory: [
        { id: 'question-id', role: 'user' },
        {
          id: 'response-id',
          question_id: 'question-id',
          task_id: durableExecutionId,
          isStreaming: true,
        },
      ],
    };

    expect(getAgentExecutionResumeCandidate(options)).toEqual({
      executionId: durableExecutionId,
      questionId: 'question-id',
      responseMessageId: 'response-id',
    });
    expect(
      getAgentExecutionResumeCandidate({
        ...options,
        conversationParticipants: options.conversationParticipants.map(participant =>
          participant.entity_name === 'application'
            ? { ...participant, entity_settings: { agent_type: 'pipeline' } }
            : participant,
        ),
      }),
    ).toEqual({
      executionId: durableExecutionId,
      questionId: 'question-id',
      responseMessageId: 'response-id',
    });
    expect(
      getAgentExecutionResumeCandidate({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { entity_name: 'toolkit', entity_settings: { toolkit_type: 'github' } },
        ],
      }),
    ).toEqual({
      executionId: durableExecutionId,
      questionId: 'question-id',
      responseMessageId: 'response-id',
    });
    expect(
      getAgentExecutionResumeCandidate({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { entity_name: 'toolkit', entity_settings: { toolkit_type: 'mcp' } },
        ],
      }),
    ).toBeNull();
  });

  it('clears only the stale persisted activity projection before durable replay', () => {
    const question = { id: 'question-id', role: 'user' };
    const response = {
      id: 'response-id',
      role: 'assistant',
      content: '...',
      toolActions: [{ id: 'trace_step_1' }, { id: 'trace_step_2' }],
    };
    const otherResponse = {
      id: 'other-response',
      role: 'assistant',
      toolActions: [{ id: 'trace_step_3' }],
    };

    const reset = resetAgentExecutionReplayProjection([question, response, otherResponse], 'response-id');

    expect(reset).toEqual([question, { ...response, toolActions: [] }, otherResponse]);
    expect(resetAgentExecutionReplayProjection(reset, 'response-id')).toBe(reset);
  });

  it('settles only the resumed response when terminal projection hydration times out', () => {
    const response = {
      id: 'response-id',
      role: 'assistant',
      content: 'already streamed',
      isStreaming: true,
      isLoading: true,
      isRegenerating: true,
      isSending: true,
      hitlInterrupt: { interrupt_id: 'preserved' },
      toolActions: [{ id: 'trace_step_1' }],
    };
    const otherResponse = { id: 'other-response', isStreaming: true };

    const settled = settleAgentExecutionReplayProjection([response, otherResponse], 'response-id');

    expect(settled).toEqual([
      {
        ...response,
        isStreaming: false,
        isLoading: false,
        isRegenerating: false,
        isSending: false,
      },
      otherResponse,
    ]);
    expect(settled[0].toolActions).toBe(response.toolActions);
    expect(settled[0].hitlInterrupt).toBe(response.hitlInterrupt);
    expect(settleAgentExecutionReplayProjection(settled, 'response-id')).toBe(settled);
  });

  it('settles a completed continuation from full_message without duplicating streamed content', () => {
    const response = {
      id: 'response-id',
      role: 'assistant',
      content: '',
      isStreaming: true,
      isLoading: true,
      toolActions: [{ id: 'trace_step_1' }],
    };
    const terminal = {
      type: 'full_message',
      message_id: 'response-id',
      content: 'Pipeline completed after HITL.',
    };

    const settled = settleAgentExecutionReplayProjection([response], 'response-id', terminal);

    expect(settled).toEqual([
      {
        ...response,
        content: terminal.content,
        isStreaming: false,
        isLoading: false,
        isRegenerating: false,
        isSending: false,
      },
    ]);
    expect(
      settleAgentExecutionReplayProjection(
        [{ ...response, content: 'Already streamed.' }],
        'response-id',
        terminal,
      )[0].content,
    ).toBe('Already streamed.');
  });

  it('selects ad-hoc execution for standard toolkits and application participants', () => {
    const options = {
      isAgentsPage: false,
      participant: undefined,
      conversationParticipants: [
        { entity_name: 'user' },
        { entity_name: 'dummy' },
        { entity_name: 'toolkit', entity_settings: { toolkit_type: 'aha' } },
      ],
      eventPayload: {
        ...payload,
        participant_id: undefined,
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
      },
      hasAttachments: false,
      hasLLMOverride: true,
      isSendingToUser: false,
    };

    expect(getAgentExecutionSseContract(options)).toBe(AGENT_ADHOC_EXECUTION_CONTRACT);
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { entity_name: 'application', entity_settings: { agent_type: 'agent' } },
        ],
      }),
    ).toBe(AGENT_ADHOC_EXECUTION_CONTRACT);
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { entity_name: 'application', entity_settings: { agent_type: 'pipeline' } },
        ],
      }),
    ).toBe(AGENT_ADHOC_EXECUTION_CONTRACT);
    expect(
      getAgentExecutionSseContract({
        ...options,
        conversationParticipants: [
          ...options.conversationParticipants,
          { entity_name: 'toolkit', meta: { mcp: true }, entity_settings: { toolkit_type: 'mcp' } },
        ],
      }),
    ).toBeNull();
  });

  it('selects regeneration only for the bounded application and ad-hoc slices', () => {
    const applicationPayload = {
      ...payload,
      payload: {
        user_input: 'hello again',
        attachments_info: [],
        mcp_tokens: {},
      },
    };
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: true,
        participant: { entity_name: 'application' },
        eventPayload: applicationPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: false,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: false,
        participant: { id: 19, entity_name: 'application', entity_settings: { agent_type: 'pipeline' } },
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { id: 19, entity_name: 'application', entity_settings: { agent_type: 'pipeline' } },
        ],
        conversationMeta: { internal_tools: [] },
        eventPayload: applicationPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: false,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: false,
        participant: { id: 19, entity_name: 'application' },
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { id: 19, entity_name: 'application', entity_settings: { agent_type: 'agent' } },
        ],
        conversationMeta: { internal_tools: [] },
        eventPayload: applicationPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: false,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: false,
        participant: { id: 19, entity_name: 'application' },
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { id: 19, entity_name: 'application', entity_settings: { agent_type: 'agent' } },
        ],
        conversationMeta: { internal_tools: ['internal_mcp'] },
        eventPayload: applicationPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: false,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: true,
        participant: { entity_name: 'application' },
        eventPayload: applicationPayload,
        hasAttachments: false,
        hasUpdatedItems: true,
        hasLLMOverride: false,
      }),
    ).toBeNull();

    const adhocPayload = {
      ...payload,
      participant_id: undefined,
      payload: {
        user_input: 'hello again',
        attachments_info: [],
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
        mcp_tokens: {},
      },
    };
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: false,
        participant: undefined,
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { entity_name: 'toolkit', entity_settings: { toolkit_type: 'aha' } },
        ],
        eventPayload: adhocPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: true,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
    expect(
      getAgentRegenerationSseContract({
        isAgentsPage: false,
        participant: undefined,
        conversationParticipants: [
          { entity_name: 'user' },
          { entity_name: 'dummy' },
          { entity_name: 'application', entity_settings: { agent_type: 'pipeline' } },
        ],
        eventPayload: adhocPayload,
        hasAttachments: false,
        hasUpdatedItems: false,
        hasLLMOverride: true,
      }),
    ).toBe(AGENT_REGENERATION_EXECUTION_CONTRACT);
  });

  it('normalizes current payloads without forwarding model settings or credentials', () => {
    expect(
      buildAgentExecutionStartBody({
        projectId: '7',
        conversationUuid: 'conversation-id',
        eventPayload: payload,
      }),
    ).toEqual({
      payload: { user_input: 'hello' },
      project_id: 7,
      participant_id: 19,
      conversation_uuid: 'conversation-id',
      question_id: 'question-id',
      interaction_uuid: 'interaction-id',
      attachments_info: [],
      mcp_tokens: {},
    });
  });

  it('carries only selected model settings for bounded ad-hoc execution', () => {
    expect(
      buildAgentExecutionStartBody({
        contract: AGENT_ADHOC_EXECUTION_CONTRACT,
        projectId: '7',
        conversationUuid: 'conversation-id',
        eventPayload: {
          ...payload,
          participant_id: undefined,
          llm_settings: {
            model_name: 'eu.anthropic.claude',
            model_project_id: 7,
            temperature: 0.2,
          },
        },
      }),
    ).toEqual({
      payload: { user_input: 'hello' },
      project_id: 7,
      participant_id: 0,
      conversation_uuid: 'conversation-id',
      question_id: 'question-id',
      interaction_uuid: 'interaction-id',
      attachments_info: [],
      llm_settings: {
        model_name: 'eu.anthropic.claude',
        model_project_id: 7,
        temperature: 0.2,
      },
      mcp_tokens: {},
    });
  });

  it('starts the ad-hoc contract on the same current messages route', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 422, ok: false });
    await startAgentExecutionSse({
      contract: AGENT_ADHOC_EXECUTION_CONTRACT,
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: {
        ...payload,
        participant_id: undefined,
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
      },
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(fetchImpl.mock.calls[0][0]).toContain('execution_contract=agent.execute.adhoc.v1');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        participant_id: 0,
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
      }),
    );
  });

  it('admits a first turn without opening a second realtime transport', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        task_id: 'execution-id',
        execution_id: 'execution-id',
        response_message_id: 'response-id',
        events_url: '/events',
      }),
    });

    const result = await admitAgentExecution({
      contract: AGENT_ADHOC_EXECUTION_CONTRACT,
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: {
        ...payload,
        participant_id: undefined,
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
      },
      fetchImpl,
    });

    expect(result).toEqual({
      started: true,
      admission: {
        task_id: 'execution-id',
        execution_id: 'execution-id',
        response_message_id: 'response-id',
        events_url: '/events',
      },
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0][0]).toContain('execution_contract=agent.execute.adhoc.v1');
    expect(fetchImpl.mock.calls[0][1]).toEqual(
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('falls back before opening SSE when the direct route does not support the turn', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 422, ok: false });
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(result).toEqual({ started: false });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('regenerates the existing response through the focused contract', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ status: 422, ok: false });
    const eventPayload = {
      ...payload,
      message_id: 'response-id',
      stream_id: 'response-id',
      payload: {
        user_input: 'hello again',
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
        attachments_info: [],
        mcp_tokens: {},
      },
    };

    const result = await startAgentRegenerationSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      responseMessageId: 'response-id',
      regenerationId: 'regeneration-id',
      eventPayload,
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(result).toEqual({ started: false });
    expect(fetchImpl.mock.calls[0][0]).toContain(
      '/elitea_core/regenerate/prompt_lib/7/response-id?execution_contract=agent.regenerate.v1',
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({
      ...eventPayload,
      regeneration_id: 'regeneration-id',
    });
  });

  it('continues one root HITL decision without forwarding browser configuration', async () => {
    expect(
      buildAgentHITLContinuationBody({
        projectId: '7',
        conversationUuid: 'conversation-id',
        responseMessageId: 'response-id',
        threadId: 'thread-id',
        action: 'edit',
        value: 'sanitized replacement',
      }),
    ).toEqual({
      project_id: 7,
      conversation_uuid: 'conversation-id',
      message_id: 'response-id',
      thread_id: 'thread-id',
      hitl_resume: true,
      hitl_action: 'edit',
      hitl_value: 'sanitized replacement',
      hitl_decisions: [],
      mcp_tokens: {},
      ignored_mcp_servers: [],
      user_declined_mcp_servers: [],
    });

    const fetchImpl = vi.fn().mockResolvedValue({ status: 422, ok: false });
    const result = await startAgentHITLContinuationSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      responseMessageId: 'response-id',
      threadId: 'thread-id',
      action: 'approve',
      eventPayload: { question_id: 'question-id', participant_id: 19 },
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(result).toEqual({ started: false });
    expect(fetchImpl.mock.calls[0][0]).toContain(
      `/elitea_core/continue_predict/prompt_lib/7/conversation-id?execution_contract=${AGENT_HITL_CONTINUATION_EXECUTION_CONTRACT}`,
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        hitl_action: 'approve',
        hitl_resume: true,
        message_id: 'response-id',
      }),
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).not.toHaveProperty('hitl_value');
  });

  it('continues one atomic parallel HITL decision set without scalar or private routing fields', () => {
    const decisions = [
      { interrupt_id: 'one', action: 'approve', value: '' },
      {
        interrupt_id: 'two',
        tool_call_id: 'tool-two',
        action: 'block_with_comment',
        value: 'retain the file',
      },
    ];

    expect(
      buildAgentHITLContinuationBody({
        projectId: '7',
        conversationUuid: 'conversation-id',
        responseMessageId: 'response-id',
        threadId: 'thread-id',
        hitlDecisions: decisions,
      }),
    ).toEqual({
      project_id: 7,
      conversation_uuid: 'conversation-id',
      message_id: 'response-id',
      thread_id: 'thread-id',
      hitl_resume: true,
      hitl_decisions: decisions,
      mcp_tokens: {},
      ignored_mcp_servers: [],
      user_declined_mcp_servers: [],
    });
  });

  it('continues exactly one toolkit authorization request with private runtime tokens', async () => {
    expect(
      buildAgentAuthorizationContinuationBody({
        projectId: '7',
        conversationUuid: 'conversation-id',
        responseMessageId: 'response-id',
        threadId: 'thread-id',
        authorizationRequestId: 'tool-call-2',
        authorizationAction: 'authorize',
        mcpTokens: { 'configuration:issuer': { access_token: 'private-token' } },
        ignoredMcpServers: ['https://ignored.example'],
        userDeclinedMcpServers: [],
      }),
    ).toEqual({
      project_id: 7,
      conversation_uuid: 'conversation-id',
      message_id: 'response-id',
      thread_id: 'thread-id',
      authorization_request_id: 'tool-call-2',
      authorization_action: 'authorize',
      hitl_resume: false,
      hitl_decisions: [],
      mcp_tokens: { 'configuration:issuer': { access_token: 'private-token' } },
      ignored_mcp_servers: ['https://ignored.example'],
      user_declined_mcp_servers: [],
    });

    const fetchImpl = vi.fn().mockResolvedValue({ status: 422, ok: false });
    const result = await startAgentAuthorizationContinuationSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      responseMessageId: 'response-id',
      threadId: 'thread-id',
      authorizationRequestId: 'tool-call-2',
      authorizationAction: 'skip',
      mcpTokens: {},
      ignoredMcpServers: ['https://mcp.example'],
      userDeclinedMcpServers: ['https://mcp.example'],
      eventPayload: { question_id: 'question-id', participant_id: 19 },
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(result).toEqual({ started: false });
    expect(fetchImpl.mock.calls[0][0]).toContain(
      `/elitea_core/continue_predict/prompt_lib/7/conversation-id?execution_contract=${AGENT_AUTHORIZATION_CONTINUATION_EXECUTION_CONTRACT}`,
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual(
      expect.objectContaining({
        authorization_action: 'skip',
        authorization_request_id: 'tool-call-2',
        hitl_resume: false,
      }),
    );
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).not.toHaveProperty('provided_settings');
  });

  it('retries a finalizing regeneration without falling back to the WebSocket route', async () => {
    const pendingResponse = () => ({
      status: 409,
      ok: false,
      headers: { get: name => (name === 'Retry-After' ? '1' : null) },
      json: async () => ({
        error: 'agent_regeneration_pending',
        message: 'The previous agent response is still being finalized. Please retry shortly.',
        retryable: true,
      }),
    });
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(pendingResponse())
      .mockResolvedValueOnce(pendingResponse())
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          task_id: 'execution-id',
          execution_id: 'execution-id',
          response_message_id: 'response-id',
          events_url: '/events',
        }),
      });
    const waitForRetry = vi.fn().mockResolvedValue();
    const onNodeEvent = vi.fn();
    const eventPayload = {
      ...payload,
      message_id: 'response-id',
      stream_id: 'response-id',
      payload: {
        user_input: 'hello again',
        llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
        attachments_info: [],
        mcp_tokens: {},
      },
    };

    const result = await startAgentRegenerationSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      responseMessageId: 'response-id',
      regenerationId: 'regeneration-id',
      eventPayload,
      onNodeEvent,
      onError: vi.fn(),
      fetchImpl,
      waitForRetry,
      yieldToRenderer: vi.fn().mockResolvedValue(),
      EventSourceImpl: FakeEventSource,
    });

    expect(result.started).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(fetchImpl.mock.calls.map(call => call[1].body)).toEqual([
      fetchImpl.mock.calls[0][1].body,
      fetchImpl.mock.calls[0][1].body,
      fetchImpl.mock.calls[0][1].body,
    ]);
    expect(waitForRetry).toHaveBeenCalledTimes(2);
    expect(waitForRetry).toHaveBeenNthCalledWith(1, 1000);
    expect(onNodeEvent).toHaveBeenCalledOnce();
  });

  it('does not fall back after bounded finalization retries are exhausted', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => ({
      status: 409,
      ok: false,
      headers: { get: () => '0' },
      json: async () => ({
        error: 'agent_regeneration_pending',
        message: 'The previous agent response is still being finalized. Please retry shortly.',
        retryable: true,
      }),
    }));

    await expect(
      startAgentRegenerationSse({
        projectId: 7,
        conversationUuid: 'conversation-id',
        responseMessageId: 'response-id',
        regenerationId: 'regeneration-id',
        eventPayload: {
          ...payload,
          message_id: 'response-id',
          stream_id: 'response-id',
          payload: {
            user_input: 'hello again',
            llm_settings: { model_name: 'eu.anthropic.claude', model_project_id: 7 },
            attachments_info: [],
            mcp_tokens: {},
          },
        },
        onNodeEvent: vi.fn(),
        onError: vi.fn(),
        fetchImpl,
        waitForRetry: vi.fn().mockResolvedValue(),
        EventSourceImpl: FakeEventSource,
      }),
    ).rejects.toMatchObject({
      name: 'AgentExecutionStartError',
      status: 409,
      code: 'agent_regeneration_pending',
      retryable: true,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(5);
  });

  it('reconciles the optimistic response, feeds reducer events, and closes on full_message', async () => {
    const onNodeEvent = vi.fn();
    const onClosed = vi.fn();
    const onTerminal = vi.fn();
    const yieldToRenderer = vi.fn().mockResolvedValue();
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent,
      onError: vi.fn(),
      onClosed,
      onTerminal,
      yieldToRenderer,
      fetchImpl: vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          task_id: 'execution-id',
          execution_id: 'execution-id',
          response_message_id: 'response-id',
          events_url: '/events',
        }),
      }),
      EventSourceImpl: FakeEventSource,
    });

    expect(onNodeEvent).toHaveBeenCalledWith({
      type: 'start_task',
      message_id: 'response-id',
      question_id: 'question-id',
      content: {
        task_id: 'execution-id',
        participant_id: 19,
        question_id: 'question-id',
      },
      sio_event: 'chat_predict',
    });
    expect(yieldToRenderer).toHaveBeenCalledOnce();

    const llmStart = {
      type: 'agent_llm_start',
      message_id: 'response-id',
      response_metadata: { tool_run_id: 'llm-1', model_name: 'model' },
    };
    await result.source.dispatch('execution.node_event', llmStart);
    expect(onNodeEvent).toHaveBeenLastCalledWith(llmStart);
    expect(yieldToRenderer).toHaveBeenCalledTimes(2);

    const agentEvent = { type: 'agent_response', message_id: 'response-id', content: 'done' };
    await result.source.dispatch('execution.node_event', agentEvent);
    await result.source.dispatch('execution.node_event', {
      type: 'partial_message',
      message_id: 'response-id',
    });
    const terminal = { type: 'full_message', message_id: 'response-id', content: 'done' };
    await result.source.dispatch('execution.node_event', terminal);

    expect(onNodeEvent).toHaveBeenCalledTimes(3);
    expect(onNodeEvent).toHaveBeenLastCalledWith(agentEvent);
    expect(result.source.close).toHaveBeenCalledOnce();
    expect(onClosed).toHaveBeenCalledOnce();
    expect(onTerminal).toHaveBeenCalledWith(terminal);
  });

  it('forwards the durable HITL card and closes the paused execution stream', async () => {
    const onNodeEvent = vi.fn();
    const onTerminal = vi.fn();
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent,
      onError: vi.fn(),
      onTerminal,
      fetchImpl: vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          task_id: 'execution-id',
          execution_id: 'execution-id',
          response_message_id: 'response-id',
          events_url: '/events',
        }),
      }),
      yieldToRenderer: vi.fn().mockResolvedValue(),
      EventSourceImpl: FakeEventSource,
    });
    const interrupt = {
      type: 'agent_hitl_interrupt',
      message_id: 'response-id',
      response_metadata: { hitl_interrupt: { interrupt_id: 'interrupt-1' } },
    };

    await result.source.dispatch('execution.node_event', interrupt);

    expect(onNodeEvent).toHaveBeenLastCalledWith(interrupt);
    expect(onTerminal).toHaveBeenCalledWith(interrupt);
    expect(result.source.close).toHaveBeenCalledOnce();
  });

  it('keeps streaming on an auth observation and closes on the bounded authorization pause', async () => {
    const onNodeEvent = vi.fn();
    const onTerminal = vi.fn();
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent,
      onError: vi.fn(),
      onTerminal,
      fetchImpl: vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          task_id: 'execution-id',
          execution_id: 'execution-id',
          response_message_id: 'response-id',
          events_url: '/events',
        }),
      }),
      yieldToRenderer: vi.fn().mockResolvedValue(),
      EventSourceImpl: FakeEventSource,
    });
    const observation = {
      type: 'mcp_authorization_required',
      message_id: 'response-id',
      response_metadata: { tool_run_id: 'tool-call-1' },
    };
    const terminal = {
      ...observation,
      response_metadata: {
        tool_run_id: 'tool-call-2',
        authorization_requests: [
          { tool_run_id: 'tool-call-1', server_url: 'https://one.example' },
          { tool_run_id: 'tool-call-2', server_url: 'https://two.example' },
        ],
      },
    };

    await result.source.dispatch('execution.node_event', observation);
    expect(onNodeEvent).toHaveBeenLastCalledWith(observation);
    expect(onTerminal).not.toHaveBeenCalled();
    expect(result.source.close).not.toHaveBeenCalled();

    await result.source.dispatch('execution.node_event', terminal);
    expect(onNodeEvent).toHaveBeenLastCalledWith(terminal);
    expect(onTerminal).toHaveBeenCalledWith(terminal);
    expect(result.source.close).toHaveBeenCalledOnce();
  });

  it('reattaches an admitted execution without issuing another start request', async () => {
    const onNodeEvent = vi.fn();
    const onTerminal = vi.fn();
    const onReplayReset = vi.fn();
    const onReplayStart = vi.fn();
    const yieldToRenderer = vi.fn().mockResolvedValue();
    const result = resumeAgentExecutionSse({
      projectId: 7,
      executionId: 'execution-id',
      conversationUuid: 'conversation-id',
      questionId: 'question-id',
      onNodeEvent,
      onError: vi.fn(),
      onTerminal,
      onReplayReset,
      onReplayStart,
      EventSourceImpl: FakeEventSource,
      yieldToRenderer,
    });

    expect(buildAgentExecutionEventsUrl('/api/v2/', 7, 'execution/id')).toBe(
      '/api/v2/executions/7/execution%2Fid/events',
    );
    expect(result.started).toBe(true);
    expect(result.source.url).toContain('/executions/7/execution-id/events');
    expect(result.source.options).toEqual({ withCredentials: true });

    const response = {
      type: 'agent_response',
      message_id: 'response-id',
      content: 'recovered',
      response_metadata: { finish_reason: 'stop' },
    };
    await result.source.dispatch('execution.node_event', response);
    expect(onReplayStart).toHaveBeenCalledOnce();
    expect(onReplayStart.mock.invocationCallOrder[0]).toBeLessThan(onNodeEvent.mock.invocationCallOrder[0]);
    expect(yieldToRenderer).toHaveBeenCalledOnce();
    expect(onNodeEvent).toHaveBeenCalledWith(response);

    const terminal = { type: 'full_message', message_id: 'response-id', content: 'recovered' };
    await result.source.dispatch('execution.node_event', terminal);
    expect(onReplayStart).toHaveBeenCalledOnce();
    expect(onTerminal).toHaveBeenCalledWith(terminal);
    expect(result.source.close).toHaveBeenCalledOnce();

    const replayReset = resumeAgentExecutionSse({
      projectId: 7,
      executionId: 'second-execution',
      conversationUuid: 'conversation-id',
      questionId: 'second-question',
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      onReplayReset,
      EventSourceImpl: FakeEventSource,
    });
    await replayReset.source.dispatch('execution.replay_reset', {});
    expect(onReplayReset).toHaveBeenCalledOnce();
    expect(replayReset.source.close).toHaveBeenCalledOnce();
  });

  it('starts distinct editor turns on the same conversation execution stream', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ execution_id: 'execution-1', events_url: '/events/1' }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ execution_id: 'execution-2', events_url: '/events/2' }),
      });

    await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: { ...payload, question_id: 'question-1', payload: { user_input: 'first' } },
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });
    await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: { ...payload, question_id: 'question-2', payload: { user_input: 'second' } },
      onNodeEvent: vi.fn(),
      onError: vi.fn(),
      fetchImpl,
      EventSourceImpl: FakeEventSource,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls.map(call => JSON.parse(call[1].body))).toEqual([
      expect.objectContaining({
        conversation_uuid: 'conversation-id',
        question_id: 'question-1',
        payload: { user_input: 'first' },
      }),
      expect.objectContaining({
        conversation_uuid: 'conversation-id',
        question_id: 'question-2',
        payload: { user_input: 'second' },
      }),
    ]);
  });

  it('maps a safe runtime failure into the current socket-error contract', async () => {
    const onError = vi.fn();
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent: vi.fn(),
      onError,
      fetchImpl: vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({ execution_id: 'execution-id', events_url: '/events' }),
      }),
      EventSourceImpl: FakeEventSource,
    });

    await result.source.dispatch('execution.failed', { safe_message: 'Model is unavailable.' });

    expect(onError).toHaveBeenCalledWith({
      type: 'error',
      message_id: 'question-id',
      headline: 'Model is unavailable.',
      content: 'Model is unavailable.',
    });
    expect(result.source.close).toHaveBeenCalledOnce();
  });

  it('settles cancellation without converting retained partial output into an error', async () => {
    const onError = vi.fn();
    const onTerminal = vi.fn();
    const result = await startAgentExecutionSse({
      projectId: 7,
      conversationUuid: 'conversation-id',
      eventPayload: payload,
      onNodeEvent: vi.fn(),
      onError,
      onTerminal,
      fetchImpl: vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => ({
          execution_id: 'execution-id',
          response_message_id: 'response-id',
          events_url: '/events',
        }),
      }),
      EventSourceImpl: FakeEventSource,
    });

    await result.source.dispatch('execution.failed', {
      code: 'CANCELLED',
      safe_message: 'Execution was cancelled.',
      retryable: false,
    });

    await vi.waitFor(() =>
      expect(onTerminal).toHaveBeenCalledWith({
        type: 'execution.cancelled',
        message_id: 'response-id',
        question_id: 'question-id',
        content: '',
      }),
    );
    expect(onError).not.toHaveBeenCalled();
    expect(result.source.close).toHaveBeenCalledOnce();
  });
});
