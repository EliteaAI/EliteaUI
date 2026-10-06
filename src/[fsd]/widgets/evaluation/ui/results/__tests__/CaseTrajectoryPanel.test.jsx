// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CaseTrajectoryPanel from '../CaseTrajectoryPanel';

const queryState = vi.hoisted(() => ({ data: undefined }));

vi.mock('../../../api', () => ({
  useEvalCaseExecutionsQuery: () => ({ data: queryState.data, isFetching: false, isError: false }),
}));

const theme = createTheme({ palette: lightPalette });

const renderPanel = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <CaseTrajectoryPanel
        projectId={1}
        runId={149}
        datasetCaseId={7}
        {...props}
      />
    </ThemeProvider>,
  );

const recordedExecution = {
  trajectory_state: 'recorded',
  trajectory: { steps: [] },
  metrics: { llm_calls: 1 },
};

describe('CaseTrajectoryPanel usage', () => {
  afterEach(() => {
    cleanup();
    queryState.data = undefined;
  });

  it('shows what the agent and the judge spent on the case', () => {
    queryState.data = {
      executions: [recordedExecution],
      usage: [
        {
          role: 'agent',
          usage_state: 'recorded',
          input_tokens: 5074,
          output_tokens: 2373,
          total_tokens: 7447,
          cost: null,
          model_name: 'haiku',
        },
        { role: 'judge', usage_state: 'not_recorded', usage_state_reason: 'no_envelope' },
      ],
    };
    renderPanel();

    const agent = screen.getByTestId('case-usage-agent');
    expect(agent).toHaveTextContent('7,447');
    expect(agent).toHaveTextContent('Not priced');
    expect(agent).toHaveTextContent('haiku');
    expect(screen.getByTestId('case-usage-judge')).toHaveTextContent(
      'Not recorded: the agent returned nothing to read',
    );
  });

  it('shows judge usage for a case with no agent execution', () => {
    queryState.data = {
      executions: [],
      usage: [{ role: 'judge', usage_state: 'recorded', total_tokens: 320, cost: 0.002 }],
    };
    renderPanel();

    expect(screen.getByTestId('case-usage-judge')).toHaveTextContent('$0.0020');
    expect(screen.getByText('No execution was recorded for this case.')).toBeInTheDocument();
  });

  it('renders no usage block when the run recorded none', () => {
    queryState.data = { executions: [recordedExecution], usage: [] };
    renderPanel();

    expect(screen.queryByTestId('case-usage')).not.toBeInTheDocument();
  });
});

describe('CaseTrajectoryPanel expected vs actual', () => {
  afterEach(() => {
    cleanup();
    queryState.data = undefined;
  });

  const expected = {
    match: 'in_order',
    tools: [{ name: 'search', args: { q: 'x' } }, { name: 'summarize' }],
    forbidden: ['delete_branch'],
    max_tool_calls: 2,
  };

  it('sets the expected calls beside the recorded ones', () => {
    queryState.data = {
      executions: [
        {
          ...recordedExecution,
          trajectory: {
            steps: [
              { kind: 'llm', step: 1 },
              { kind: 'tool', step: 2, tool_name: 'search' },
              { kind: 'tool', step: 3, tool_name: 'delete_branch' },
              { kind: 'tool', step: 4, tool_name: 'lookup' },
            ],
          },
        },
      ],
      usage: [],
    };
    renderPanel({ expectedTrajectory: expected });

    expect(screen.getByTestId('case-expected-trajectory')).toHaveTextContent('Expected vs actual (in_order)');
    expect(screen.getByTestId('expected-tool-0')).toHaveTextContent('✓ search (with args): called');
    expect(screen.getByTestId('expected-tool-1')).toHaveTextContent('✗ summarize: not called');
    expect(screen.getByTestId('forbidden-tool-delete_branch')).toHaveTextContent(
      '✗ delete_branch is forbidden: called',
    );
    expect(screen.getByTestId('expected-budget')).toHaveTextContent('✗ 3 of at most 2 tool calls');
    expect(screen.getByTestId('expected-extra-tools')).toHaveTextContent(
      'Also called: delete_branch, lookup',
    );
  });

  it('falls back to the tool sequence when no steps were kept', () => {
    queryState.data = {
      executions: [
        { ...recordedExecution, trajectory: { steps: [], tool_sequence: ['search', 'summarize'] } },
      ],
      usage: [],
    };
    renderPanel({ expectedTrajectory: expected });

    expect(screen.getByTestId('expected-tool-1')).toHaveTextContent('✓ summarize: called');
    expect(screen.getByTestId('expected-budget')).toHaveTextContent('✓ 2 of at most 2 tool calls');
  });

  it('shows nothing without a reference', () => {
    queryState.data = { executions: [recordedExecution], usage: [] };
    renderPanel({ expectedTrajectory: null });

    expect(screen.queryByTestId('case-expected-trajectory')).not.toBeInTheDocument();
  });
});
