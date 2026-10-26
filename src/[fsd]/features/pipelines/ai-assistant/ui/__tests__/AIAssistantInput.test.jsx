// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AIAssistantInput from '../AIAssistantInput';

vi.mock('@/[fsd]/features/pipelines/ai-assistant/ui', () => ({
  AIAssistantModal: () => <div data-testid="ai-assistant-modal" />,
}));
vi.mock('@/components/StyledInputModal', () => ({
  default: props => (
    <div
      data-testid={props['data-testid']}
      data-title={props.title}
    />
  ),
}));
vi.mock('@/[fsd]/shared/lib/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useToast: () => ({ toastError: vi.fn(), toastInfo: vi.fn() }),
}));

const theme = createTheme({ palette: darkPalette });

const renderInput = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <AIAssistantInput
        label="Condition"
        fieldName="Condition"
        value="{{ a }}"
        onInput={vi.fn()}
        hasActionsToolBar
        forceShowActionsToolbar
        showCopyAction
        showExpandAction
        multiline
        collapseContent
        {...props}
      />
    </ThemeProvider>,
  );

describe('AIAssistantInput', () => {
  afterEach(() => cleanup());

  it('offers full screen and AI Assistant instead of inline expand', () => {
    renderInput();

    expect(screen.getByRole('button', { name: 'AI Assistant' })).toBeInTheDocument();
    expect(screen.getByTestId('ai-assistant-input-full-screen')).toBeInTheDocument();
    // Copy, AI Assistant and Full screen only: the inline expand toggle is gone even when a caller asks for it
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('opens the value in the full screen editor', () => {
    renderInput();

    fireEvent.click(screen.getByTestId('ai-assistant-input-full-screen'));

    expect(screen.getByTestId('ai-assistant-input-full-screen-modal')).toHaveAttribute(
      'data-title',
      'Condition',
    );
  });

  it('opens the AI Assistant', () => {
    renderInput();

    fireEvent.click(screen.getByRole('button', { name: 'AI Assistant' }));

    expect(screen.getByTestId('ai-assistant-modal')).toBeInTheDocument();
  });
});
