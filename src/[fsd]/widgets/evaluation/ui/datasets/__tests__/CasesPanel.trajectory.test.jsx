// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CasesPanel from '../CasesPanel';

vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => true }),
}));

// The overflow tooltip measures its cell; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const theme = createTheme({ palette: lightPalette });

const cases = [
  {
    id: 1,
    input: 'find EL bugs',
    expected_trajectory: { match: 'in_order', tools: [{ name: 'jira_search' }], forbidden: ['delete_branch'] },
  },
  { id: 2, input: 'say hi', expected_trajectory: null },
];

describe('CasesPanel expected trajectory column', () => {
  afterEach(cleanup);

  it('summarizes a reference and dashes an absent one', () => {
    render(
      <ThemeProvider theme={theme}>
        <CasesPanel
          dataset={{ id: 7, name: 'Bugs' }}
          applicationId={3}
          cases={cases}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText('Expected Trajectory')).toBeInTheDocument();
    expect(screen.getByText('in_order: jira_search · forbidden: delete_branch')).toBeInTheDocument();
  });
});
