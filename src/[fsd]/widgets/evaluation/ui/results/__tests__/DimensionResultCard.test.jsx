// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import DimensionResultCard from '../DimensionResultCard';

const theme = createTheme({ palette: lightPalette });

const codeBinding = { key: 'dim:1', name: 'performance.latency', engine: 'code' };

const renderCard = cell =>
  render(
    <ThemeProvider theme={theme}>
      <DimensionResultCard
        cell={{ binding: codeBinding, nativeScore: null, met: null, pending: false, ...cell }}
      />
    </ThemeProvider>,
  );

describe('DimensionResultCard — case time limit (performance §3.2, §3.3)', () => {
  afterEach(cleanup);

  it('shows a skipped binding with its note, not as pending or an error', () => {
    renderCard({
      binding: { key: 'dim:2', name: 'Accuracy', engine: 'ai' },
      result: { status: 'skipped' },
      skipped: true,
      verdict: { note: 'Skipped: the agent reached the case time limit (10 s).' },
    });

    expect(screen.getByTestId('dimension-skipped-label')).toHaveTextContent('Skipped');
    expect(screen.getByText('Skipped: the agent reached the case time limit (10 s).')).toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dimension-score-label')).not.toBeInTheDocument();
  });

  it('shows a skipped human binding as skipped rather than awaiting a reviewer', () => {
    renderCard({
      binding: { key: 'dim:3', name: 'Helpfulness', engine: 'human' },
      result: { status: 'skipped' },
      skipped: true,
      verdict: null,
    });

    expect(screen.getByTestId('dimension-skipped-label')).toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    expect(screen.getByText('Not scored for this case.')).toBeInTheDocument();
  });

  it('reads a timed-out latency check as exceeded and missed, with the note', () => {
    renderCard({
      result: { status: 'ok' },
      nativeScore: 1,
      met: false,
      verdict: {
        status: 'exceeded',
        passed: null,
        note: 'Exceeded: the agent reached the case time limit (10 s).',
      },
    });

    expect(screen.getByTestId('dimension-score-label')).toHaveTextContent('Exceeded | Missed');
    expect(screen.getByText('Exceeded: the agent reached the case time limit (10 s).')).toBeInTheDocument();
  });

  it('shows what a scored code check printed when it has no rationale', () => {
    renderCard({
      result: { status: 'ok' },
      nativeScore: 0.17,
      met: true,
      verdict: { status: 'scored', stdout: '1.7 s of the 10 s limit' },
    });

    expect(screen.getByTestId('dimension-score-label')).toHaveTextContent('Met');
    expect(screen.getByText('1.7 s of the 10 s limit')).toBeInTheDocument();
  });
});
