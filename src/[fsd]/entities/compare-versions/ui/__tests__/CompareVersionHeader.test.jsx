// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CompareVersionHeader from '../CompareVersionHeader';

const theme = createTheme(getDesignTokens('dark'));
const VERSION = { id: 1, name: 'base', created_at: '2026-11-25T07:47:00Z' };

const renderHeader = save =>
  render(
    <ThemeProvider theme={theme}>
      <CompareVersionHeader
        version={VERSION}
        save={{ isSaving: false, onSave: vi.fn(), ...save }}
        saveTestId="compare-header-save"
      />
    </ThemeProvider>,
  );

describe('CompareVersionHeader', () => {
  afterEach(() => cleanup());

  it('shows an enabled Save in the secondary style, not the primary one', () => {
    renderHeader({ isDirty: true });
    const save = screen.getByTestId('compare-header-save');

    expect(save).toBeEnabled();
    expect(save).toHaveStyle({
      backgroundColor: theme.palette.components.button.background.secondary.default,
      color: theme.palette.text.secondary,
    });
  });

  it('shows a disabled Save as a muted secondary button with dimmed text', () => {
    renderHeader({ isDirty: false });
    const save = screen.getByTestId('compare-header-save');

    expect(save).toBeDisabled();
    expect(save).toHaveStyle({
      backgroundColor: theme.palette.components.button.background.default,
      color: theme.palette.components.button.text.disabled,
    });
  });
});
