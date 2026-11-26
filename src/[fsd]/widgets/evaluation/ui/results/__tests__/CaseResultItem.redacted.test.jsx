// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CaseResultsList from '../CaseResultsList';

const theme = createTheme({ palette: lightPalette });

const card = (id, caseFields = {}) => ({
  id,
  case: { id, ...caseFields },
  cells: [],
  caseScore: null,
  pendingCount: 0,
});

describe('CaseResultsList hidden content badge', () => {
  afterEach(cleanup);

  it('marks only the cases whose text was hidden from the viewer', () => {
    render(
      <ThemeProvider theme={theme}>
        <CaseResultsList cases={[card(7, { redacted: true }), card(8)]} />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('case-redacted-badge-7')).toHaveTextContent('Content hidden');
    expect(screen.queryByTestId('case-redacted-badge-8')).not.toBeInTheDocument();
  });
});
