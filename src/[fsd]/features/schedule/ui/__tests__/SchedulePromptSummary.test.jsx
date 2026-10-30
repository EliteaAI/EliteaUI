// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SchedulePromptSummary from '../SchedulePromptSummary';

// test panel log: the read-only prompt box with Run test

const PROMPT =
  'List open pull requests of {{repository}} in {{channel}} for {{region}} and post a short summary.';
const variable = (name, value) => ({ name, value });

const theme = createTheme(getDesignTokens('light'));
const renderBox = props => {
  const onTestRun = vi.fn();
  const view = render(
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
  return Object.assign(onTestRun, { view });
};
const chipTexts = () => screen.getAllByTestId('schedule-prompt-chip').map(chip => chip.textContent);
const runTest = () => screen.getByRole('button', { name: 'Run test' });
const chevron = () => screen.getByRole('button', { name: 'Show the full prompt' });

describe('SchedulePromptSummary', () => {
  afterEach(() => cleanup());

  // option A: one pinned line of 61 px; the chevron opens the full prompt
  it('shows one line: the prompt, the version chip and Run test, with the chevron closed', () => {
    renderBox();

    expect(chevron()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('schedule-prompt-text')).toHaveTextContent(PROMPT);
    expect(screen.getByTestId('schedule-prompt-text')).toHaveStyle({
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    });
    expect(chipTexts()).toEqual(['v3']);
    expect(screen.queryByText('Prompt from the schedule')).not.toBeInTheDocument();
    expect(runTest()).toBeEnabled();
  });

  it('the chevron opens the region it controls and closes it again', () => {
    renderBox();
    fireEvent.click(chevron());

    expect(chevron()).toHaveAttribute('aria-expanded', 'true');
    const region = document.getElementById(chevron().getAttribute('aria-controls'));
    expect(region).toHaveTextContent('Prompt from the schedule');
    fireEvent.click(chevron());
    expect(chevron()).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the full prompt when a test starts', () => {
    const onTestRun = renderBox();
    fireEvent.click(chevron());

    onTestRun.view.rerender(
      <ThemeProvider theme={theme}>
        <SchedulePromptSummary
          prompt={PROMPT}
          variables={[variable('region', 'EMEA')]}
          versionLabel="v3"
          running
          onTestRun={onTestRun}
        />
      </ThemeProvider>,
    );

    expect(chevron()).toHaveAttribute('aria-expanded', 'false');
  });

  it('describes Run test with the given note', () => {
    renderBox({ description: 'A test never changes Last run or Next run.' });

    expect(runTest()).toHaveAccessibleDescription('A test never changes Last run or Next run.');
  });

  it('shows the label, the prompt and chips for the version and each variable', () => {
    renderBox();
    fireEvent.click(chevron());

    expect(screen.getByText('Prompt from the schedule')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-prompt-text')).toHaveTextContent(PROMPT);
    expect(chipTexts()).toEqual(['v3', 'region = EMEA']);
  });

  it('shows 3 variable chips at most, then the count of the rest', () => {
    renderBox({
      variables: ['a', 'b', 'c', 'd', 'e'].map(name => variable(name, name.toUpperCase())),
    });
    fireEvent.click(chevron());

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
    expect(screen.queryByRole('button', { name: 'Show the full prompt' })).not.toBeInTheDocument();
    expect(chipTexts()).toEqual(['v3']);
  });

  it('#7254: a disabled hint disables Run test and describes it', () => {
    const onTestRun = renderBox({
      description: 'A note',
      disabledHint: 'Only the schedule owner, Ann Lee, can run it.',
    });

    expect(runTest()).toBeDisabled();
    expect(runTest()).toHaveAccessibleDescription('Only the schedule owner, Ann Lee, can run it.');
    expect(screen.getByTestId('schedule-test-run-hint')).toBeVisible();
    fireEvent.click(runTest());
    expect(onTestRun).not.toHaveBeenCalled();
  });

  it('#7254: without a hint Run test stays as it was', () => {
    renderBox({});

    expect(runTest()).toBeEnabled();
    expect(screen.queryByTestId('schedule-test-run-hint')).not.toBeInTheDocument();
  });
});
