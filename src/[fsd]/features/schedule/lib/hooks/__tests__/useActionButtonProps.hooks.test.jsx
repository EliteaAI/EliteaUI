// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { renderHook } from '@testing-library/react';

import { useActionButtonProps } from '../useActionButtonProps.hooks';

const renderInMode = mode =>
  renderHook(() => useActionButtonProps(), {
    wrapper: ({ children }) => (
      <ThemeProvider theme={createTheme(getDesignTokens(mode))}>{children}</ThemeProvider>
    ),
  }).result.current;

describe('useActionButtonProps', () => {
  it('uses the chat prompt buttons in the dark theme', () => {
    const props = renderInMode('dark');

    expect(props.primary).toEqual({ variant: 'positive' });
    expect(props.secondary).toEqual({ variant: 'neutral' });
  });

  it('uses the standard primary and secondary buttons in the light theme', () => {
    const props = renderInMode('light');

    expect(props.primary).toEqual({ variant: 'elitea', color: 'primary' });
    expect(props.secondary).toEqual({ variant: 'elitea', color: 'secondary' });
  });
});
