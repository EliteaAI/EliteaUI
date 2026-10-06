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

const renderPanel = () =>
  render(
    <ThemeProvider theme={theme}>
      <CaseTrajectoryPanel
        projectId={1}
        runId={149}
        datasetCaseId={7}
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
