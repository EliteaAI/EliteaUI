// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import UserLabel from '../components/UserLabel';

const theme = createTheme({
  palette: {
    text: { secondary: '#666' },
    background: { default: { secondary: '#eee' } },
    border: { lines: '#ccc' },
  },
});

const renderLabel = user =>
  render(
    <ThemeProvider theme={theme}>
      <UserLabel user={user} />
    </ThemeProvider>,
  );

describe('UserLabel', () => {
  afterEach(() => cleanup());

  it('shows the email and no chip for a live user', () => {
    renderLabel({ user_id: 1, user_email: 'alice@example.com', user_deleted: false });
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.queryByTestId('analytics-user-deleted-chip')).not.toBeInTheDocument();
  });

  it('shows the id and a Deleted user chip for a deleted account', () => {
    renderLabel({ user_id: 9, user_email: null, user_deleted: true });
    expect(screen.getByText('User 9')).toBeInTheDocument();
    expect(screen.getByTestId('analytics-user-deleted-chip')).toHaveTextContent('Deleted user');
  });

  it('falls back to the id without a chip when the email is simply unknown', () => {
    renderLabel({ user_id: 12, user_email: null });
    expect(screen.getByText('User 12')).toBeInTheDocument();
    expect(screen.queryByTestId('analytics-user-deleted-chip')).not.toBeInTheDocument();
  });
});
