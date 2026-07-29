import { describe, expect, it, vi } from 'vitest';

// The helper reaches @/common/utils, which pulls in the redux store and cannot load
// in this environment; only convertJsonToString is actually needed here.
vi.mock('@/common/utils', () => ({
  convertJsonToString: value => (typeof value === 'string' ? value : JSON.stringify(value)),
}));
vi.mock('@/[fsd]/shared/lib/utils/soundNotification.utils', () => ({ notifyTaskComplete: () => {} }));

const { SocketMessageType } = await import('@/common/constants');
const { FlowEditorConstants } = await import('../constants');
const { parseRunEvent } = await import('./parseRunsByEvent.helpers');

// A failed pipeline run showed only a bare "Error" label: the error text was captured
// here but never surfaced. These pin what the run carries so the dialog has something
// to render, including the budget scope that selects the friendly message.
const buildStatus = () => ({
  current: {
    data: {
      status: FlowEditorConstants.PipelineStatus.InProgress,
      timeline: [
        {
          id: 'start',
          status: FlowEditorConstants.PipelineStatus.InProgress,
          created_at: new Date(0).toISOString(),
        },
      ],
    },
  },
});

const parse = (event, runPipelineStatus) =>
  parseRunEvent(
    event,
    [],
    [],
    [],
    true,
    vi.fn(),
    { current: null },
    { current: null },
    runPipelineStatus,
    'Run 1',
  );

describe('agent exception on a pipeline run', () => {
  it('prefers the user-facing text over the internal label', () => {
    const status = buildStatus();

    parse(
      {
        type: SocketMessageType.AgentException,
        content: 'InternalSDKError on user input',
        response_metadata: { human_readable: 'This budget has been reached.' },
      },
      status,
    );

    expect(status.current.data.error).toBe('This budget has been reached.');
  });

  it('falls back to the raw content when no user-facing text is sent', () => {
    const status = buildStatus();

    parse(
      {
        type: SocketMessageType.AgentException,
        content: 'Pipeline has no nodes to execute.',
        response_metadata: {},
      },
      status,
    );

    expect(status.current.data.error).toBe('Pipeline has no nodes to execute.');
  });

  it('carries the budget scope so the dialog can show the usage link', () => {
    const status = buildStatus();

    parse(
      {
        type: SocketMessageType.AgentException,
        content: 'InternalSDKError on user input',
        response_metadata: { budget_error_code: 'member_budget_exceeded' },
      },
      status,
    );

    expect(status.current.data.budgetErrorCode).toBe('member_budget_exceeded');
  });

  it('leaves the scope unset for an ordinary failure', () => {
    const status = buildStatus();

    parse({ type: SocketMessageType.AgentException, content: 'boom', response_metadata: {} }, status);

    expect(status.current.data.budgetErrorCode).toBeUndefined();
  });

  it('marks the run as failed', () => {
    const status = buildStatus();

    parse({ type: SocketMessageType.AgentException, content: 'boom', response_metadata: {} }, status);

    expect(status.current.data.status).toBe(FlowEditorConstants.PipelineStatus.Error);
  });
});
