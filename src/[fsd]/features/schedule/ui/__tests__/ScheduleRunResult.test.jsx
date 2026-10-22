// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ScheduleRunResult from '../ScheduleRunResult';

// EL-7011 owner CR 2026-10-21 test panel log: the result card of a finished run

const run = {
  id: 12,
  status: 'success',
  conversation_id: 70,
  summary: { duration_ms: 38_000, tokens: 2140, cost_usd: 0.03 },
};
const ANSWER =
  '## Open pull requests\n1. **EliteaUI** #482 Add schedule form\n2. `elitea_core` #377\n3. x\n4. y';

const theme = createTheme(getDesignTokens('dark'));
const renderResult = props =>
  render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <ScheduleRunResult
          run={run}
          answer={ANSWER}
          {...props}
        />
      </ThemeProvider>
    </MemoryRouter>,
  );

describe('ScheduleRunResult EL-7011 owner CR 2026-10-21', () => {
  afterEach(() => cleanup());

  it('shows the status chip, duration, tokens and cost', () => {
    renderResult();

    expect(screen.getByTestId('schedule-run-status')).toHaveTextContent('Success');
    expect(screen.getByTestId('schedule-run-summary')).toHaveTextContent('38 s · 2,140 tokens · $0.0300');
  });

  it('opens the run conversation in a new tab', () => {
    renderResult();

    const link = screen.getByRole('link', { name: /Open conversation/ });
    expect(link).toHaveAttribute('href', '/chat/70');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('shows the answer as plain text', () => {
    renderResult();

    const answer = screen.getByTestId('schedule-run-answer');
    expect(answer.textContent).toBe(
      'Open pull requests\n1. EliteaUI #482 Add schedule form\n2. elitea_core #377\n3. x\n4. y',
    );
  });

  it('shows the reason of a failed or blocked run', () => {
    renderResult({ run: { ...run, status: 'failed', reason: 'rejected by the owner' }, answer: undefined });
    expect(screen.getByText('rejected by the owner')).toBeInTheDocument();
    cleanup();

    renderResult({ run: { ...run, status: 'blocked', reason: 'Teams post_message is a sensitive tool' } });
    expect(screen.getByText('Teams post_message is a sensitive tool')).toBeInTheDocument();
  });

  it('leaves out the summary and the link the run does not have', () => {
    renderResult({ run: { id: 3, status: 'skipped', conversation_id: null }, answer: undefined });

    expect(screen.queryByTestId('schedule-run-summary')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByTestId('schedule-run-answer')).not.toBeInTheDocument();
  });

  // CR-21 option A: below a 1000 px window height the answer keeps 2 lines, so the card fits the right block
  // CR-21 fit spec: one header row, so the card stays 88 px with 2 answer lines under 1000 px window height
  it('keeps the header on one row: the stats get an ellipsis and a tooltip, the link does not shrink', () => {
    renderResult();
    const header = screen.getByTestId('schedule-run-status').parentElement;
    const summary = screen.getByTestId('schedule-run-summary');

    expect(header).toHaveStyle({ flexWrap: 'nowrap' });
    expect(summary).toHaveStyle({
      flexShrink: '1',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
    expect(summary).toHaveAttribute('aria-label', '38 s · 2,140 tokens · $0.0300');
    expect(screen.getByRole('link', { name: /Open conversation/ })).toHaveStyle({ flexShrink: '0' });
    // BUG-38: the app link colour, not the brand colour
    expect(screen.getByRole('link', { name: /Open conversation/ })).toHaveStyle({
      color: theme.palette.text.link,
    });
  });

  it('clamps the answer to 4 lines, and to 2 lines in a window under 62.5 rem high', () => {
    renderResult();
    const answer = screen.getByTestId('schedule-run-answer');
    const answerClass = [...answer.classList].find(name => name.startsWith('css-'));
    const css = [...document.querySelectorAll('style')].map(style => style.textContent).join('');

    expect(answer).toHaveStyle({ WebkitLineClamp: '4' });
    expect(css).toMatch(
      new RegExp(`@media \\(max-height: ?62\\.4375rem\\)\\{\\.${answerClass}\\{[^}]*-webkit-line-clamp: ?2`),
    );
  });
});
