// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import MarkdownEditorActions from '../MarkdownEditorActions';

const { toastInfo, handleCopy } = vi.hoisted(() => ({ toastInfo: vi.fn(), handleCopy: vi.fn() }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useToast: () => ({ toastInfo }) }));
vi.mock('@/common/utils', () => ({ handleCopy }));

const theme = createTheme({ palette: lightPalette });

const renderActions = props =>
  render(
    <ThemeProvider theme={theme}>
      <MarkdownEditorActions
        testIdPrefix="test"
        {...props}
      />
    </ThemeProvider>,
  );

describe('MarkdownEditorActions', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders accessible Copy and Full screen buttons', () => {
    renderActions({ value: 'text' });

    expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Full screen view' })).toBeInTheDocument();
  });

  it('copies the given value and shows a toast', () => {
    renderActions({ value: '---\nname: a\n---\nBody', copyMessage: 'Copied!' });

    fireEvent.click(screen.getByTestId('test-copy'));

    expect(handleCopy).toHaveBeenCalledWith('---\nname: a\n---\nBody');
    expect(toastInfo).toHaveBeenCalledWith('Copied!');
  });

  it('disables Copy when there is nothing to copy', () => {
    renderActions({ value: '' });

    expect(screen.getByTestId('test-copy')).toBeDisabled();
  });

  it('calls onFullScreen when Full screen is clicked', () => {
    const onFullScreen = vi.fn();
    renderActions({ value: 'text', onFullScreen });

    fireEvent.click(screen.getByTestId('test-full-screen'));

    expect(onFullScreen).toHaveBeenCalledTimes(1);
  });
});
