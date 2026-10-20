// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import RunPerformanceDiff from '../RunPerformanceDiff';

const theme = createTheme({ palette: lightPalette });

const withTheme = node => render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);

const metric = overrides => ({
  run: 1000,
  reference: 1000,
  delta_pct: 0,
  cases: 2,
  excluded: 0,
  verdict: 'unchanged',
  ...overrides,
});

const compare = diff => ({
  run: { id: 5 },
  reference: { id: 4, source: 'previous' },
  diff: {
    not_comparable: [],
    noise: { relative: 0.15, absolute_ms: 2000 },
    coverage: {},
    metrics: { p50_latency_ms: metric(), p95_latency_ms: metric() },
    timeouts: { not_comparable: null, newly_timed_out: [], no_longer_timed_out: [] },
    slower_than_reference: false,
    ...diff,
  },
});

describe('RunPerformanceDiff', () => {
  afterEach(cleanup);

  it('renders nothing without a reference', () => {
    withTheme(<RunPerformanceDiff compare={{ run: { id: 5 }, reference: null, diff: null }} />);

    expect(screen.queryByTestId('evaluation-run-performance-diff')).not.toBeInTheDocument();
  });

  it('shows the reference, the rows and no slower badge when nothing got worse', () => {
    withTheme(<RunPerformanceDiff compare={compare()} />);

    expect(screen.getByText(/Run #4 \(previous run on this dataset\)/)).toBeInTheDocument();
    expect(screen.getByTestId('evaluation-perf-row-p50_latency_ms')).toHaveTextContent('Unchanged');
    expect(screen.queryByTestId('evaluation-run-slower-badge')).not.toBeInTheDocument();
  });

  it('flags a slower run and its newly timed-out cases', () => {
    withTheme(
      <RunPerformanceDiff
        compare={compare({
          metrics: { p50_latency_ms: metric({ run: 9000, delta_pct: 800, verdict: 'worse' }) },
          timeouts: { not_comparable: null, newly_timed_out: [3, 8], no_longer_timed_out: [] },
          slower_than_reference: true,
        })}
      />,
    );

    expect(screen.getByTestId('evaluation-run-slower-badge')).toBeInTheDocument();
    expect(screen.getByTestId('evaluation-perf-row-p50_latency_ms')).toHaveTextContent('+800% · Worse');
    expect(screen.getByTestId('evaluation-perf-timeouts')).toHaveTextContent('Newly timed out: #3, #8');
  });
});
