// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CaseResultsList from '../CaseResultsList';

const theme = createTheme({ palette: lightPalette });

const card = id => ({ id, case: { id }, cells: [], caseScore: null, pendingCount: 0 });

describe('CaseResultsList execution badges', () => {
  afterEach(cleanup);

  it('shows the chip only on the cases that have one', () => {
    render(
      <ThemeProvider theme={theme}>
        <CaseResultsList
          cases={[card(7), card(8)]}
          executionBadges={{
            7: { guardrail: { label: 'Paused for review', tooltip: 'paused' }, counters: null },
          }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('case-guardrail-badge-7')).toHaveTextContent('Paused for review');
    expect(screen.queryByTestId('case-guardrail-badge-8')).not.toBeInTheDocument();
  });

  it('shows the counters next to the score', () => {
    render(
      <ThemeProvider theme={theme}>
        <CaseResultsList
          cases={[card(7), card(8)]}
          executionBadges={{
            7: {
              guardrail: null,
              counters: { label: '6 steps · 1 tool error', tooltip: 't', hasErrors: true },
            },
          }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('case-counters-7')).toHaveTextContent('6 steps · 1 tool error');
    expect(screen.queryByTestId('case-guardrail-badge-7')).not.toBeInTheDocument();
    expect(screen.queryByTestId('case-counters-8')).not.toBeInTheDocument();
  });
});
