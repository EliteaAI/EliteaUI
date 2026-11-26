// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CaseDetailsModal from '../CaseDetailsModal';

const viewer = vi.hoisted(() => ({ id: 3 }));

vi.mock('react-redux', async () => ({
  ...(await vi.importActual('react-redux')),
  useSelector: selector => selector({ user: { id: viewer.id } }),
}));
vi.mock('../CaseTrajectoryPanel', () => ({ default: () => null }));

const theme = createTheme({ palette: lightPalette });

const renderModal = caseItem =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <CaseDetailsModal
          open
          caseData={{ id: 11, case: caseItem }}
          onClose={() => {}}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );

const historyCase = source => ({
  input: 'q',
  output: 'a',
  source: { conversation_id: 'c-1', author_id: 7, is_private: false, ...source },
});

describe('CaseDetailsModal source chat', () => {
  afterEach(() => {
    cleanup();
    viewer.id = 3;
  });

  it('links a history case to the chat it came from', () => {
    renderModal(historyCase({}));

    expect(screen.getByTestId('case-details-source-chat')).toHaveAttribute('href', '/chat/c-1');
  });

  it('gives no link to a private chat the viewer did not write', () => {
    renderModal(historyCase({ is_private: true }));

    expect(screen.queryByTestId('case-details-source-chat')).not.toBeInTheDocument();
    expect(screen.getByTestId('case-details-source')).toHaveTextContent(
      'the link is shown to its author only',
    );
  });

  it('links a private chat for its author', () => {
    viewer.id = 7;
    renderModal(historyCase({ is_private: true }));

    expect(screen.getByTestId('case-details-source-chat')).toBeInTheDocument();
  });

  it('shows nothing for a dataset case', () => {
    renderModal({ input: 'q', output: 'a' });

    expect(screen.queryByTestId('case-details-source')).not.toBeInTheDocument();
  });
});
