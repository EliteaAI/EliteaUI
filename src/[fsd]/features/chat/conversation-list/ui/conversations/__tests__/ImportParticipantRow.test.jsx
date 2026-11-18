// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { IMPORT_PARTICIPANT_MESSAGES } from '../../../lib/constants/importConversation.constants';
import ImportParticipantRow from '../ImportParticipantRow';

const theme = createTheme(getDesignTokens('dark'));

const renderRow = props =>
  render(
    <ThemeProvider theme={theme}>
      <ImportParticipantRow
        participants={[props.participant]}
        checked
        disabled={false}
        onToggle={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ImportParticipantRow', () => {
  afterEach(() => cleanup());

  it('shows the warning and lets the user untick a same-name substitute', () => {
    const onToggle = vi.fn();
    renderRow({ participant: { id: 3, name: 'Helper', status: 'name_only' }, onToggle });

    expect(screen.getByTestId('import-chat-modal-participant-status')).toHaveTextContent(
      IMPORT_PARTICIPANT_MESSAGES.nameOnly,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Helper' });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(3);
  });

  it('warns about a same-name substitute even when it shares a target with another row', () => {
    const first = { id: 1, name: 'Agent-X', status: 'same', target_name: 'Agent-X' };
    const substitute = { id: 2, name: 'Agent-X', status: 'name_only', target_name: 'Agent-X', same_as: 1 };
    renderRow({ participant: substitute, participants: [first, substitute] });

    expect(screen.getByTestId('import-chat-modal-participant-status')).toHaveTextContent(
      IMPORT_PARTICIPANT_MESSAGES.nameOnly,
    );
  });

  it('offers no checkbox choice for a participant that will not be linked', () => {
    renderRow({ participant: { id: 4, name: 'Gone', status: 'not_found' } });

    const checkbox = screen.getByRole('checkbox', { name: 'Gone' });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeDisabled();
    expect(screen.getByTestId('import-chat-modal-participant-status')).toHaveTextContent(
      IMPORT_PARTICIPANT_MESSAGES.notFound,
    );
  });

  it('shows the exact original without a status line', () => {
    renderRow({ participant: { id: 1, name: 'Agent-X', status: 'same', target_name: 'Agent-X' } });

    expect(screen.getByRole('checkbox', { name: 'Agent-X' })).toBeChecked();
    expect(screen.queryByTestId('import-chat-modal-participant-status')).not.toBeInTheDocument();
  });
});
