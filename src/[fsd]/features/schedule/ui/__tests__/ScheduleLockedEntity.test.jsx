// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleLockedEntity from '../ScheduleLockedEntity';

// the entity of a form opened from its own page: shown, not changeable

vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));

const setup = props =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('light'))}>
      <MemoryRouter>
        <ScheduleLockedEntity {...props} />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('ScheduleLockedEntity', () => {
  afterEach(cleanup);

  it('shows the toolkit and the index as two locked fields with the index hint', () => {
    setup({ type: 'toolkit_index', name: 'Docs toolkit', indexName: 'handbook' });

    expect(screen.getByLabelText(/^Toolkit/)).toHaveValue('Docs toolkit');
    expect(screen.getByLabelText(/^Index/)).toHaveValue('handbook');
    expect(screen.getByTestId('schedule-locked-index')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-locked-entity')).toHaveTextContent(
      'To change the toolkit or index, create a new schedule in',
    );
  });

  it('shows no index field for an agent', () => {
    setup({ type: 'agent', name: 'Helper' });

    expect(screen.getByLabelText(/^Agent/)).toHaveValue('Helper');
    expect(screen.queryByTestId('schedule-locked-index')).not.toBeInTheDocument();
    expect(screen.getByTestId('schedule-locked-entity')).toHaveTextContent(
      'To schedule a different agent, create the schedule in',
    );
  });

  it('links to the Schedules list', () => {
    setup({ type: 'toolkit_index', name: 'Docs toolkit', indexName: 'handbook' });

    expect(screen.getByTestId('schedule-locked-entity-link')).toHaveTextContent('Settings / Schedules');
  });
});
