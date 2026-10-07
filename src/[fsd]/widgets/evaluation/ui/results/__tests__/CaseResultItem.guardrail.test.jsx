// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CaseResultsList from '../CaseResultsList';

const theme = createTheme({ palette: lightPalette });

const card = id => ({ id, case: { id }, cells: [], caseScore: null, pendingCount: 0 });

describe('CaseResultsList guardrail chip', () => {
  afterEach(cleanup);

  it('shows the chip only on the cases that have one', () => {
    render(
      <ThemeProvider theme={theme}>
        <CaseResultsList
          cases={[card(7), card(8)]}
          guardrailChips={{ 7: { label: 'Paused for review', tooltip: 'paused' } }}
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('case-guardrail-badge-7')).toHaveTextContent('Paused for review');
    expect(screen.queryByTestId('case-guardrail-badge-8')).not.toBeInTheDocument();
  });
});
