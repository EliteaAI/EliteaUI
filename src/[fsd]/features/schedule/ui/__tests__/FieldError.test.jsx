// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import FieldError from '../FieldError';

const renderError = message =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <FieldError message={message} />
    </ThemeProvider>,
  );

describe('FieldError', () => {
  afterEach(cleanup);

  it('shows the message as an alert', () => {
    renderError('Name is taken');
    expect(screen.getByRole('alert')).toHaveTextContent('Name is taken');
  });

  it('renders nothing without a message', () => {
    renderError('');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
