// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { AnalyticsTestWrapper as Wrapper } from '../../analytics/__tests__/_testHelpers';
import RunComplexityTab from '../components/RunComplexityTab';

const RUN = {
  cu_total: 26.4,
  breakdown: { context: 12.4, reasoning: 8, tools: 6 },
  label: 'M',
  percentile: 99,
  llm_calls: 8,
  tool_calls: 6,
  peak_input_tokens: 12400,
};

describe('RunComplexityTab (#7581)', () => {
  afterEach(cleanup);

  it('shows the run’s own score, breakdown, label and percentile', () => {
    render(
      <RunComplexityTab
        run={RUN}
        meta={{}}
      />,
      { wrapper: Wrapper },
    );

    expect(screen.getByTestId('run-complexity-cu')).toHaveTextContent('26.4 CU');
    expect(screen.getByTestId('run-complexity-label')).toHaveTextContent('Medium');
    expect(screen.getByTestId('run-complexity-percentile')).toHaveTextContent('P99');
    expect(screen.getByTestId('run-complexity-context')).toHaveTextContent('12.4 CU');
  });

  // A missing score must not read as zero or fall back to the agent's aggregate
  it('says the data is unavailable when the run has no score', () => {
    render(<RunComplexityTab meta={{}} />, { wrapper: Wrapper });

    expect(screen.getByTestId('run-complexity-unavailable')).toHaveTextContent(
      'Complexity data is unavailable for this run.',
    );
    expect(screen.queryByTestId('run-complexity-cu')).toBeNull();
  });
});
