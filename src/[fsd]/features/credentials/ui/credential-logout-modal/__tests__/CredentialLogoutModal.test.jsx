// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import CredentialLogoutModal from '../CredentialLogoutModal';

const theme = createTheme({
  palette: {
    background: { default: { secondary: '#ffffff', tertiary: '#f5f5f5' } },
    border: { lines: '#e0e0e0' },
    text: { secondary: '#666666' },
    icon: { info: '#0000ff' },
  },
});

const renderModal = (props = {}) => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <CredentialLogoutModal
        open
        onClose={onClose}
        onConfirm={onConfirm}
        {...props}
      />
    </ThemeProvider>,
  );
  return { onClose, onConfirm };
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('CredentialLogoutModal', () => {
  it('says Microsoft keeps the granted permissions and links to My Apps for an Entra credential', () => {
    renderModal({ isMicrosoftEntra: true });

    const note = screen.getByTestId('credential-logout-modal-microsoft-note');
    expect(note).toHaveTextContent('Microsoft keeps the permissions you granted');
    expect(note).toHaveTextContent('every permission you granted before');
    expect(screen.getByRole('link', { name: 'myapps.microsoft.com' })).toHaveAttribute(
      'href',
      'https://myapps.microsoft.com',
    );
    expect(screen.queryByTestId('credential-logout-modal-provider-note')).not.toBeInTheDocument();
  });

  it('shows a generic provider note for a non-Microsoft credential', () => {
    renderModal();

    expect(screen.getByTestId('credential-logout-modal-provider-note')).toHaveTextContent(
      'The provider keeps the permissions you granted',
    );
    expect(screen.queryByTestId('credential-logout-modal-microsoft-note')).not.toBeInTheDocument();
  });

  it('no longer shows the MCP server text', () => {
    renderModal({ isMicrosoftEntra: true });

    expect(screen.queryByText(/MCP/)).not.toBeInTheDocument();
    expect(screen.queryByText(/automatic client registration/)).not.toBeInTheDocument();
  });

  it('calls onConfirm once on Log out and onClose on Cancel', () => {
    const { onClose, onConfirm } = renderModal({ isMicrosoftEntra: true });

    fireEvent.click(screen.getByTestId('credential-logout-modal-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('credential-logout-modal-cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
