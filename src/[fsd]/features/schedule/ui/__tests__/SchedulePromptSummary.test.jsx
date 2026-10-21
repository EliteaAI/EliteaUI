// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SchedulePromptSummary from '../SchedulePromptSummary';

// EL-7011 owner CR 2026-10-21 test panel log: the read-only prompt box with Run test

const PROMPT =
  'List open pull requests of {{repository}} in {{channel}} for {{region}} and post a short summary.';
const variable = (name, value) => ({ name, value });

const theme = createTheme(getDesignTokens('light'));
const renderBox = props => {
  const onTestRun = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <SchedulePromptSummary
        prompt={PROMPT}
        variables={[variable('region', 'EMEA')]}
        versionLabel="v3"
        onTestRun={onTestRun}
        {...props}
      />
    </ThemeProvider>,
  );
  return onTestRun;
};
const chipTexts = () => screen.getAllByTestId('schedule-prompt-chip').map(chip => chip.textContent);
const runTest = () => screen.getByRole('button', { name: 'Run test' });

describe('SchedulePromptSummary EL-7011 owner CR 2026-10-21', () => {
  afterEach(() => cleanup());

  it('shows the label, the prompt and chips for the version and each variable', () => {
    renderBox();

    expect(screen.getByText('Prompt from the schedule')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-prompt-text')).toHaveTextContent(PROMPT);
    expect(chipTexts()).toEqual(['v3', 'region = EMEA']);
  });

  it('shows 3 variable chips at most, then the count of the rest', () => {
    renderBox({
      variables: ['a', 'b', 'c', 'd', 'e'].map(name => variable(name, name.toUpperCase())),
    });

    expect(chipTexts()).toEqual(['v3', 'a = A', 'b = B', 'c = C', '+2']);
  });

  it('Run test calls the form handler', () => {
    const onTestRun = renderBox();

    fireEvent.click(runTest());

    expect(onTestRun).toHaveBeenCalledTimes(1);
  });

  it('disables Run test while a test runs and says so', () => {
    renderBox({ running: true });

    expect(runTest()).toBeDisabled();
    expect(screen.getByText('A test is running.')).toBeInTheDocument();
  });

  it('disables Run test while the run starts', () => {
    renderBox({ pending: true });

    expect(runTest()).toBeDisabled();
    expect(screen.queryByText('A test is running.')).not.toBeInTheDocument();
  });

  it('shows no prompt text for a pipeline that runs from its entry point', () => {
    renderBox({ prompt: '', variables: [] });

    expect(screen.queryByTestId('schedule-prompt-text')).not.toBeInTheDocument();
    expect(chipTexts()).toEqual(['v3']);
  });
});
