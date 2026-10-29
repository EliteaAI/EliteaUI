// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ContextHighUsageBanner from '../ContextHighUsageBanner';

const theme = createTheme({ palette: darkPalette });

const renderBanner = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ContextHighUsageBanner
        onSummarize={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('ContextHighUsageBanner', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('announces automatic summarization when it is enabled', () => {
    renderBanner();
    expect(screen.getByTestId('context-budget-high-usage-banner')).toHaveTextContent(
      'will be summarized automatically',
    );
  });

  it('does not promise automatic summarization when it is disabled', () => {
    renderBanner({ isSummarizationEnabled: false });
    expect(screen.getByTestId('context-budget-high-usage-banner')).not.toHaveTextContent(
      'will be summarized automatically',
    );
  });

  it('calls onSummarize from the Summarize now action', () => {
    const onSummarize = vi.fn();
    renderBanner({ onSummarize });
    fireEvent.click(screen.getByTestId('context-budget-summarize-button'));
    expect(onSummarize).toHaveBeenCalledTimes(1);
  });

  it('disables the action without edit permission', () => {
    renderBanner({ canEdit: false });
    expect(screen.getByTestId('context-budget-summarize-button')).toBeDisabled();
  });

  it('disables the action while summarizing', () => {
    renderBanner({ isSummarizing: true });
    expect(screen.getByTestId('context-budget-summarize-button')).toBeDisabled();
  });
});
