// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { mergeChatSocketMessage } from '@/[fsd]/features/chat/lib/helpers/chatSocket.helpers';
import { ROLES, TOOL_ACTION_TYPES, ToolActionStatus } from '@/common/constants';
import { renderHook } from '@testing-library/react';

import { useApplicationAnswerState } from '../useApplicationAnswerState.hooks';

const restoredStep = {
  id: 'trace_step_1',
  name: 'waitSeconds',
  type: TOOL_ACTION_TYPES.Tool,
  status: ToolActionStatus.complete,
  toolMeta: { toolkit_name: 'PRF Postman Echo delay' },
};

const liveStep = {
  id: 'run-2',
  name: 'getUser',
  type: TOOL_ACTION_TYPES.Tool,
  status: ToolActionStatus.processing,
  toolMeta: { toolkit_name: 'PRF JSONPlaceholder' },
};

const renderAnswerState = message =>
  renderHook(
    ({ msg }) =>
      useApplicationAnswerState({
        answer: msg.content,
        message_items: [],
        toolActions: msg.toolActions,
        isStreaming: msg.isStreaming,
        isLoading: msg.isLoading,
      }),
    { initialProps: { msg: message } },
  );

describe('useApplicationAnswerState after returning to a running chat (#7763)', () => {
  it('shows a step that starts after the return', () => {
    // A running reply loaded from REST carries the '...' placeholder as its answer
    const message = {
      id: 'reply-1',
      role: ROLES.Assistant,
      content: '...',
      isStreaming: true,
      isLoading: true,
      toolActions: [restoredStep],
    };
    const { result, rerender } = renderAnswerState(message);
    expect(result.current.nonSwarmChildActions).toHaveLength(1);

    // agent_tool_start pushes into the stored array, then the frame is merged into history
    message.toolActions.push(liveStep);
    const [merged] = mergeChatSocketMessage([message], message, { messageId: 'reply-1' });
    rerender({ msg: merged });

    expect(result.current.nonSwarmChildActions.map(action => action.id)).toEqual(['trace_step_1', 'run-2']);
    expect(result.current.nonSwarmChildActions[1].status).toBe(ToolActionStatus.processing);
  });
});
