import { describe, expect, it, vi } from 'vitest';

import { generateChatContinuePayload, generateMcpContinuePayload } from './messagePayloadUtils';

vi.mock('@/[fsd]/features/mcp/lib/helpers', () => ({
  McpAuthHelpers: {
    getAllTokens: () => ({ sharepoint: { access_token: 'token' } }),
    getServersWithoutTokens: () => [],
  },
}));

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
