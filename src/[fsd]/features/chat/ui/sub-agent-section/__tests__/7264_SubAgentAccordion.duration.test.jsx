// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SubAgentAccordion from '../SubAgentAccordion';

vi.mock('../../../lib/helpers/subAgentIcon.helpers', () => ({ resolveSubAgentIcon: () => null }));

const theme = createTheme(getDesignTokens('dark'));

const renderAccordion = props =>
  render(
    <ThemeProvider theme={theme}>
      <SubAgentAccordion
        name="Researcher"
        {...props}
      />
    </ThemeProvider>,
  );

// #7264 P1
describe('SubAgentAccordion duration', () => {
  afterEach(() => cleanup());

  it('shows the settled invocation span after the label', () => {
    renderAccordion({ durationMs: 2400 });
    expect(screen.getByTestId('chat-answer-subagent-duration')).toHaveTextContent('· 2.4s');
  });

  it('hides the span while running or when unknown', () => {
    renderAccordion({ durationMs: 2400, running: true });
    expect(screen.queryByTestId('chat-answer-subagent-duration')).toBeNull();
    cleanup();
    renderAccordion({ durationMs: null });
    expect(screen.queryByTestId('chat-answer-subagent-duration')).toBeNull();
  });
});
