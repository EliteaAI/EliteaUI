// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { MarkdownConstants } from '@/[fsd]/shared/lib/constants';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import MarkdownViewToggle from '../MarkdownViewToggle';

const { MARKDOWN_VIEW_MODES } = MarkdownConstants;

const theme = createTheme({ palette: lightPalette });

const renderToggle = props =>
  render(
    <ThemeProvider theme={theme}>
      <MarkdownViewToggle
        value={MARKDOWN_VIEW_MODES.edit}
        onChange={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const renderedModeLabels = () =>
  screen.getAllByRole('button').map(button => button.getAttribute('aria-label'));

describe('MarkdownViewToggle', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('renders Edit before Preview by default', () => {
    renderToggle();

    expect(renderedModeLabels()).toEqual(['Edit mode', 'Preview mode']);
  });

  it('renders the modes in the given icon order', () => {
    renderToggle({ iconOrder: [MARKDOWN_VIEW_MODES.preview, MARKDOWN_VIEW_MODES.edit] });

    expect(renderedModeLabels()).toEqual(['Preview mode', 'Edit mode']);
  });

  it('marks the controlled value as selected', () => {
    renderToggle({ value: MARKDOWN_VIEW_MODES.preview });

    expect(screen.getByTestId('markdown-preview-mode-toggle')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('markdown-edit-mode-toggle')).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the clicked mode', () => {
    const onChange = vi.fn();
    renderToggle({ onChange });

    fireEvent.click(screen.getByTestId('markdown-preview-mode-toggle'));

    expect(onChange).toHaveBeenCalledWith(MARKDOWN_VIEW_MODES.preview);
  });

  it('does not report a click on the already selected mode', () => {
    const onChange = vi.fn();
    renderToggle({ onChange });

    fireEvent.click(screen.getByTestId('markdown-edit-mode-toggle'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
