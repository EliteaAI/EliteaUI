import { describe, expect, it, vi } from 'vitest';

// The helper reaches @/common/utils, which pulls in the redux store and cannot load
// in this environment; only convertJsonToString is actually needed here.
vi.mock('@/common/utils', () => ({
  convertJsonToString: value => (typeof value === 'string' ? value : JSON.stringify(value)),
}));
vi.mock('@/[fsd]/shared/lib/utils/soundNotification.utils', () => ({ notifyTaskComplete: () => {} }));

const { SocketMessageType } = await import('@/common/constants');
const { FlowEditorConstants } = await import('../../constants');
const { parseRunEvent } = await import('../parseRunsByEvent.helpers');

// A failed pipeline run showed only a bare "Error" label: the error text was captured
// here but never surfaced. These pin what the run carries so the dialog has something
// to render, including the budget scope that selects the friendly message
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

  it('carries the structured continuation error into the run dialog', () => {
    const status = buildStatus();
    const continuationError = {
      code: 'output_continuation_exhausted',
      user_message: 'The model response is incomplete.',
      partial_output: '# Partial response',
      attempts: 4,
    };

    parse(
      {
        type: SocketMessageType.AgentException,
        content: 'OutputContinuationExhausted on user input',
        response_metadata: {
          human_readable: continuationError.user_message,
          continuation_error: continuationError,
        },
      },
      status,
    );

    expect(status.current.data.continuationError).toEqual(continuationError);
    expect(status.current.data.errorTrace).toBe('OutputContinuationExhausted on user input');
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

const AGENT = 'e2e6883-agent';
const AGENT_OUTPUT = 'AGENT_DONE greeting received';
const subAgentMetadata = node => ({
  langgraph_node: node,
  original_name: AGENT,
  toolkit_name: AGENT,
  parent_agent_name: AGENT,
  parent_agent_path: [{ name: AGENT }],
});
const pipelineState = agentOut => ({ input: 'hello', first_out: 'FIRST_DONE', agent_out: agentOut });
const subAgentState = { input: 'Input from user', messages: [] };

const edge = (metadata, next_step, state, tool_run_id) => ({
  type: SocketMessageType.AgentOnTransitionalEdge,
  response_metadata: { metadata, next_step, state, tool_run_id },
});
const llmStart = (metadata, tool_run_id) => ({
  type: SocketMessageType.AgentLlmStart,
  response_metadata: { metadata, tool_run_id },
});
const llmEnd = tool_run_id => ({ type: SocketMessageType.AgentLlmEnd, response_metadata: { tool_run_id } });

const agentNodeEvents = next_step => [
  {
    type: SocketMessageType.AgentToolStart,
    response_metadata: {
      tool_name: AGENT,
      tool_run_id: 'agent-call',
      metadata: { langgraph_node: 'FinalAgent', original_name: AGENT, toolkit_name: AGENT },
    },
  },
  edge(subAgentMetadata('StateDefaultNode'), 'agent', subAgentState, 'sub-edge-1'),
  llmStart(subAgentMetadata('agent'), 'sub-llm'),
  llmEnd('sub-llm'),
  edge(subAgentMetadata('agent'), 'END', { ...subAgentState, messages: ['done'] }, 'sub-edge-2'),
  {
    type: SocketMessageType.AgentToolEnd,
    response_metadata: {
      tool_name: AGENT,
      tool_run_id: 'agent-call',
      metadata: { langgraph_node: 'FinalAgent', original_name: AGENT, toolkit_name: AGENT },
    },
  },
  {
    type: SocketMessageType.AgentOnFunctionToolNode,
    response_metadata: { metadata: { langgraph_node: 'FinalAgent' }, state: pipelineState('') },
  },
  edge({ langgraph_node: 'FinalAgent' }, next_step, pipelineState(AGENT_OUTPUT), 'final-edge'),
];

const firstNodeEvents = next_step => [
  { type: SocketMessageType.StartTask },
  edge({ langgraph_node: 'StateDefaultNode' }, 'First', pipelineState(''), 'start-edge'),
  llmStart({ langgraph_node: 'First' }, 'first-llm'),
  llmEnd('first-llm'),
  edge({ langgraph_node: 'First' }, next_step, pipelineState(''), 'first-edge'),
];

const tailNodeEvents = (agentOut, tailOut) => [
  llmStart({ langgraph_node: 'Tail' }, 'tail-llm'),
  llmEnd('tail-llm'),
  edge({ langgraph_node: 'Tail' }, 'END', { ...pipelineState(agentOut), tail_out: tailOut }, 'tail-edge'),
];

const pipelineNode = (id, type, transition, tool) => ({ id, type, transition, tool });

const runPipeline = (nodes, events, interruptAfter = []) => {
  const runPipelineStatus = { current: null };
  let isRunningPipeline = false;
  events.forEach(event => {
    let nextIsRunning = isRunningPipeline;
    parseRunEvent(
      event,
      nodes,
      [],
      interruptAfter,
      isRunningPipeline,
      value => {
        nextIsRunning = value;
      },
      { current: '' },
      { current: '' },
      runPipelineStatus,
      'Run 1 details',
    );
    isRunningPipeline = nextIsRunning;
  });
  return runPipelineStatus.current.data;
};

const timelineIds = data => data.timeline.map(step => step.id);

describe('pipeline timeline group IDs', () => {
  const nodes = [pipelineNode('Ask', 'llm', 'Review'), pipelineNode('Review', 'code', 'Ask')];
  const task = { langgraph_node: 'Ask', langgraph_checkpoint_ns: 'Ask:task-1' };

  it.each(['agent', 'pipeline'])(
    'groups a nested %s by call, without changing the displayed timeline',
    agentType => {
      const app = call_id => {
        const owner = {
          parent_agent_name: 'Delegate',
          parent_agent_path: [{ name: 'Delegate', call_id }],
        };
        return [
          {
            type: SocketMessageType.AgentToolStart,
            response_metadata: {
              tool_name: 'Delegate',
              tool_run_id: `wrapper-${call_id}`,
              metadata: {
                toolkit_type: 'application',
                agent_type: agentType,
                original_name: 'Delegate',
                parent_agent_call_id: call_id,
                langgraph_node: 'Ask',
              },
            },
          },
          llmStart({ ...owner, langgraph_node: 'Ask' }, `child-${call_id}`),
          llmEnd(`child-${call_id}`),
          edge({ ...owner, langgraph_node: 'Ask' }, 'END', { child: call_id }, `edge-${call_id}`),
        ];
      };

      const data = runPipeline(nodes, [
        { type: SocketMessageType.StartTask },
        ...app('first'),
        llmStart(task, 'outer-model'),
        ...app('second'),
      ]);

      expect(timelineIds(data)).toEqual(['Delegate', 'Ask', 'Delegate']);
      expect(data.status).toBe(FlowEditorConstants.PipelineStatus.InProgress);
      expect(
        data.groupedTimeline.map(({ id, group_id, group_label }) => [id, group_id, group_label]),
      ).toEqual([
        ['Delegate', 'application:first', 'Delegate'],
        ['Ask', 'application:first', 'Delegate'],
        ['Ask', 'task:Ask:task-1', 'Ask'],
        ['Delegate', 'application:second', 'Delegate'],
        ['Ask', 'application:second', 'Delegate'],
      ]);
      expect(data.groupedTimeline[1]).toMatchObject({
        status: FlowEditorConstants.PipelineStatus.Completed,
        state: { child: 'first' },
      });
      expect(data.timeline[0].state).toEqual({});
    },
  );

  it('groups model and tool callbacks from one node invocation but separates a revisit', () => {
    const data = runPipeline(nodes, [
      { type: SocketMessageType.StartTask },
      llmStart(task, 'model-1'),
      llmEnd('model-1'),
      {
        type: SocketMessageType.AgentToolStart,
        response_metadata: { metadata: task, tool_name: 'search', tool_run_id: 'tool-1' },
      },
      llmStart(task, 'model-2'),
      edge(task, 'Review', { answer: 'first' }, 'edge-1'),
      edge({ langgraph_node: 'Review', langgraph_checkpoint_ns: 'Review:task-2' }, 'Ask', {}, 'edge-2'),
      llmStart({ ...task, langgraph_checkpoint_ns: 'Ask:task-3' }, 'model-3'),
    ]);

    expect(timelineIds(data)).toEqual(['Ask', 'search', 'Ask', 'Review', 'Ask']);
    const [first, tool, second, review, revisit] = data.timeline;
    expect(first.group_id).toEqual(expect.any(String));
    expect(tool.group_id).toBe(first.group_id);
    expect(second.group_id).toBe(first.group_id);
    expect(new Set([first.group_id, review.group_id, revisit.group_id]).size).toBe(3);
    expect(data.timeline.map(step => step.group_label)).toEqual(['Ask', 'Ask', 'Ask', 'Review', 'Ask']);
    expect(second.state).toEqual({ answer: 'first' });
  });

  it('uses the emitting invocation for an edge-derived interrupt and keeps unscoped rows separate', () => {
    const data = runPipeline(
      nodes,
      [
        { type: SocketMessageType.StartTask },
        llmStart(task, 'model-1'),
        edge(task, 'Review', {}, 'edge-1'),
        { type: SocketMessageType.AgentHitlInterrupt, response_metadata: { node_name: 'Review' } },
        llmStart({ langgraph_node: 'Ask' }, 'model-2'),
        llmStart({ langgraph_node: 'Ask' }, 'model-3'),
      ],
      ['Ask'],
    );

    expect(timelineIds(data)).toEqual(['Ask', 'interrupt', 'Review', 'Ask', 'Ask']);
    const [first, interrupt, hitl, second, third] = data.timeline;
    expect(interrupt.group_id).toBe(first.group_id);
    expect(interrupt.group_label).toBe(first.group_label);
    expect(hitl.group_label).toBe('Review');
    const groupIds = [first, hitl, second, third].map(step => step.group_id);
    expect(groupIds).toEqual(Array(4).fill(expect.any(String)));
    expect(new Set(groupIds).size).toBe(4);
  });
});

describe('agent node in a pipeline run timeline', () => {
  const terminalAgentNodes = [
    pipelineNode('First', 'llm', 'FinalAgent'),
    pipelineNode('FinalAgent', 'agent', 'END', AGENT),
  ];

  it('shows the final state of a terminal agent node on its own, last step', () => {
    const data = runPipeline(terminalAgentNodes, [
      ...firstNodeEvents('FinalAgent'),
      ...agentNodeEvents('END'),
      { type: SocketMessageType.PipelineFinish, response_metadata: {} },
    ]);

    expect(timelineIds(data)).toEqual(['First', AGENT]);
    const [first, agentStep] = data.timeline;
    expect(first.state.agent_out).toBe('');
    expect(agentStep.state.agent_out).toBe(AGENT_OUTPUT);
    expect(data.status).toBe(FlowEditorConstants.PipelineStatus.Completed);
  });

  it('does not finish the pipeline when the sub-agent reaches its own end', () => {
    const data = runPipeline(terminalAgentNodes, [
      ...firstNodeEvents('FinalAgent'),
      ...agentNodeEvents('END').slice(0, 5),
    ]);

    expect(data.status).toBe(FlowEditorConstants.PipelineStatus.InProgress);
  });

  it('keeps one step per node when the agent node hands over to another node', () => {
    const nodes = [
      pipelineNode('First', 'llm', 'FinalAgent'),
      pipelineNode('FinalAgent', 'agent', 'Tail', AGENT),
      pipelineNode('Tail', 'llm', 'END'),
    ];

    const data = runPipeline(nodes, [
      ...firstNodeEvents('FinalAgent'),
      ...agentNodeEvents('Tail'),
      ...tailNodeEvents(AGENT_OUTPUT, 'TAIL_DONE'),
    ]);

    expect(timelineIds(data)).toEqual(['First', AGENT, 'Tail']);
    expect(data.timeline[1].state.agent_out).toBe(AGENT_OUTPUT);
    expect(data.timeline[2].state.tail_out).toBe('TAIL_DONE');
  });

  it('still records a terminal llm node with its final state', () => {
    const nodes = [pipelineNode('First', 'llm', 'Tail'), pipelineNode('Tail', 'llm', 'END')];

    const data = runPipeline(nodes, [...firstNodeEvents('Tail'), ...tailNodeEvents('', 'TAIL_DONE')]);

    expect(timelineIds(data)).toEqual(['First', 'Tail']);
    expect(data.timeline[1].state.tail_out).toBe('TAIL_DONE');
  });

  it('still marks the agent step as failed when a tool inside the sub-agent errors', () => {
    const data = runPipeline(terminalAgentNodes, [
      ...firstNodeEvents('FinalAgent'),
      ...agentNodeEvents('END').slice(0, 1),
      {
        type: SocketMessageType.AgentToolError,
        content: 'tool failed',
        response_metadata: {
          tool_name: 'search',
          tool_run_id: 'sub-tool',
          finish_reason: 'error',
          error: 'tool failed',
        },
      },
    ]);

    expect(timelineIds(data)).toEqual(['First', AGENT]);
    expect(data.timeline[1].status).toBe(FlowEditorConstants.PipelineStatus.Error);
  });
});

describe('code node in a pipeline run timeline', () => {
  const CODE_NODE = 'MyCode';
  const codeNodes = [pipelineNode('First', 'llm', CODE_NODE), pipelineNode(CODE_NODE, 'code', 'END')];
  const codeToolEvent = (type, toolkitName) => ({
    type,
    response_metadata: {
      tool_name: toolkitName,
      tool_run_id: 'code-call',
      metadata: { langgraph_node: CODE_NODE, toolkit_name: toolkitName },
    },
  });

  it.each(['pyodide_sandbox', 'pyodide'])('labels the %s step with the code node name', toolkitName => {
    const data = runPipeline(codeNodes, [
      ...firstNodeEvents(CODE_NODE),
      codeToolEvent(SocketMessageType.AgentToolStart, toolkitName),
      codeToolEvent(SocketMessageType.AgentToolEnd, toolkitName),
      edge({ langgraph_node: CODE_NODE }, 'END', pipelineState('CODE_DONE'), 'code-edge'),
    ]);

    expect(timelineIds(data)).toEqual(['First', CODE_NODE]);
    expect(data.timeline[1].status).toBe(FlowEditorConstants.PipelineStatus.Completed);
    expect(data.timeline[1].state.agent_out).toBe('CODE_DONE');
  });

  it('marks the code node step as failed when the sandbox errors', () => {
    const data = runPipeline(codeNodes, [
      ...firstNodeEvents(CODE_NODE),
      codeToolEvent(SocketMessageType.AgentToolStart, 'pyodide_sandbox'),
      { ...codeToolEvent(SocketMessageType.AgentToolError, 'pyodide_sandbox'), content: 'boom' },
    ]);

    expect(timelineIds(data)).toEqual(['First', CODE_NODE]);
    expect(data.timeline[1].status).toBe(FlowEditorConstants.PipelineStatus.Error);
    expect(data.timeline[1].error).toBe('boom');
  });
});

describe('active node of a run with a duplicated node', () => {
  const MCP_TOOLKIT = 'test-github-mcp';
  const mcpNode = id => ({ id, type: 'mcp', toolkit_name: MCP_TOOLKIT, tool: 'get_me', transition: 'END' });
  const llmNode = id => ({ id, type: 'llm', transition: 'END' });

  const activeNodeAfter = (nodes, event) => {
    const activeNodeIdRef = { current: '' };
    parseRunEvent(
      event,
      nodes,
      [],
      [],
      true,
      vi.fn(),
      { current: '' },
      activeNodeIdRef,
      { current: { data: { status: FlowEditorConstants.PipelineStatus.InProgress, timeline: [] } } },
      'Run 1 details',
    );
    return activeNodeIdRef.current;
  };

  const mcpToolStart = langgraph_node => ({
    type: SocketMessageType.AgentToolStart,
    response_metadata: {
      tool_name: 'get_me',
      tool_run_id: 'mcp-call',
      metadata: { langgraph_node, toolkit_name: MCP_TOOLKIT },
    },
  });

  it('highlights the duplicate MCP node that runs the tool, not the original', () => {
    const nodes = [mcpNode('MCP 1'), mcpNode('MCP 1_copy')];

    expect(activeNodeAfter(nodes, mcpToolStart('MCP1_copy'))).toBe('MCP 1_copy');
    expect(activeNodeAfter(nodes, mcpToolStart('MCP1'))).toBe('MCP 1');
  });

  it('highlights the duplicate llm node whose id extends the original id', () => {
    const nodes = [llmNode('LLM 1'), llmNode('LLM 1_copy')];

    expect(activeNodeAfter(nodes, llmStart({ langgraph_node: 'LLM1_copy' }, 'llm-call'))).toBe('LLM 1_copy');
    expect(activeNodeAfter(nodes, llmStart({ langgraph_node: 'LLM1' }, 'llm-call'))).toBe('LLM 1');
  });

  it('highlights the duplicate when the run passes over its transitional edge', () => {
    const nodes = [llmNode('LLM 1'), llmNode('LLM 1_copy')];

    expect(activeNodeAfter(nodes, edge({ langgraph_node: 'LLM1_copy' }, 'LLM 1', {}, 'edge'))).toBe(
      'LLM 1_copy',
    );
  });

  it('still resolves an MCP node by its toolkit when the event has no node id', () => {
    expect(activeNodeAfter([mcpNode('MCP 1')], mcpToolStart(undefined))).toBe('MCP 1');
  });
});
