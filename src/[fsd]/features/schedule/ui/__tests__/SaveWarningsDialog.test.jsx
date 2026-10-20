// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import SaveWarningsDialog from '../SaveWarningsDialog';

// EL-7011 US-33: the warnings dialog shown after a save (R2.2, R2.3).

const WARNINGS = [
  { code: 'human_input_step', message: 'The run waits for a reply.', step: 'Ask the owner' },
  { code: 'sensitive_action', message: 'The tool deletes data.', toolkit: 'GitHub', tool: 'delete_repo' },
  { code: 'brand_new_kind', message: 'Something new happened.', toolkit: 'Jira' },
];

const setup = (props = {}) => {
  const onClose = vi.fn();
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <SaveWarningsDialog
        open
        warnings={WARNINGS}
        onClose={onClose}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onClose };
};

describe('EL-7011 US-33 SaveWarningsDialog', () => {
  afterEach(cleanup);

  it('R2.2 shows an icon, the label, the text and the target of each warning', () => {
    setup();
    const items = screen.getAllByTestId('save-warning-item');
    expect(items).toHaveLength(3);
    const first = within(items[0]);
    expect(first.getByText('Waits for a person')).toBeInTheDocument();
    expect(first.getByText('The run waits for a reply.')).toBeInTheDocument();
    expect(first.getByText('Ask the owner')).toBeInTheDocument();
    expect(items[0].querySelector('svg')).not.toBeNull();
    expect(within(items[1]).getByText('GitHub / delete_repo')).toBeInTheDocument();
  });

  it('R2.2 EL-7011 renders one warning banner per warning in a list', () => {
    setup();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getAllByTestId('credential-warning-banner')).toHaveLength(3);
  });

  it('R1.5 EL-7011 shows the note with no warnings', () => {
    setup({ warnings: [], note: 'Saved as Pause and ask me.' });
    expect(screen.getByText('Saved as Pause and ask me.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('R2.2 EL-7011 runs onClose once when closed twice', () => {
    const { onClose } = setup();
    const ok = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(ok);
    fireEvent.click(ok);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('R2.3 shows the label "Warning" for an unknown kind', () => {
    setup();
    const item = within(screen.getAllByTestId('save-warning-item')[2]);
    expect(item.getByText('Warning')).toBeInTheDocument();
    expect(item.getByText('Something new happened.')).toBeInTheDocument();
  });

  it('R2.2 closes with the OK button and is hidden when closed', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
    setup({ open: false });
    expect(screen.queryByTestId('save-warning-item')).toBeNull();
  });
});
