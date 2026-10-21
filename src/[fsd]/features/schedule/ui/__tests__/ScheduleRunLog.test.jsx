// @vitest-environment jsdom
import { format } from 'date-fns';
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import ScheduleRunLog from '../ScheduleRunLog';

// EL-7011 owner CR 2026-10-21 test panel log: one monospace line per server event, coloured by level

const at = second => `2026-10-21T10:42:${String(second).padStart(2, '0')}Z`;
const EVENTS = [
  { at: at(1), kind: 'started', text: 'Test run started · trigger: test · version v3' },
  { at: at(1), kind: 'account', text: 'Account: project system account' },
  { at: at(2), kind: 'risk_check', text: 'Risk check: Needs approval · Pause and ask me' },
  { at: at(2), kind: 'agent_started', text: "Agent 'Digest bot' started" },
  { at: at(5), kind: 'tool_call', text: 'Tool EPAM OneCRM · read_query · 214 rows · 1.8 s' },
  { at: at(19), kind: 'summary_ready', text: 'Summary ready · 2,140 tokens' },
  { at: at(19), kind: 'paused', text: 'Paused: Teams · post_message needs approval' },
  { at: at(21), kind: 'decision', text: 'Approved by you in this test' },
  { at: at(39), kind: 'finished', text: 'Run finished' },
];
const LEVELS = ['info', 'info', 'warning', 'info', 'info', 'info', 'warning', 'info', 'success'];

const theme = createTheme(getDesignTokens('light'));
const renderLog = props =>
  render(
    <ThemeProvider theme={theme}>
      <ScheduleRunLog
        events={EVENTS}
        emptyText="No test runs yet."
        {...props}
      />
    </ThemeProvider>,
  );
const lines = () => screen.getAllByTestId('schedule-run-log-line');

describe('ScheduleRunLog EL-7011 owner CR 2026-10-21', () => {
  afterEach(() => cleanup());

  it('shows each event kind as a line with its HH:mm:ss time and text', () => {
    renderLog();

    expect(lines()).toHaveLength(EVENTS.length);
    lines().forEach((line, index) => {
      expect(within(line).getByTestId('schedule-run-log-time')).toHaveTextContent(
        format(new Date(EVENTS[index].at), 'HH:mm:ss'),
      );
      expect(line).toHaveTextContent(EVENTS[index].text);
    });
  });

  it('marks risk and pause lines as warning, the finish line as success and the rest as normal', () => {
    renderLog();

    expect(lines().map(line => line.dataset.level)).toEqual(LEVELS);
    const colorOf = index =>
      getComputedStyle(within(lines()[index]).getByTestId('schedule-run-log-text')).color;
    expect(colorOf(2)).not.toBe(colorOf(0));
    expect(colorOf(8)).not.toBe(colorOf(0));
    expect(colorOf(8)).not.toBe(colorOf(2));
  });

  it('marks a line the server sends as error as a failure line', () => {
    renderLog({
      events: [{ at: at(9), kind: 'finished', text: 'Run failed: model unavailable', level: 'error' }],
    });
    expect(lines()[0].dataset.level).toBe('error');
  });

  it('CR-12 makes the scroll box reachable by keyboard and names it', () => {
    renderLog();

    const box = screen.getByRole('log', { name: 'Run log' });
    expect(box).toHaveAttribute('tabindex', '0');
  });

  it('CR-12 shows a short tool result in the line only', () => {
    renderLog({
      events: [{ at: at(5), kind: 'tool_call', text: 'Tool call: github · list (9 ms): ok', summary: 'ok' }],
    });

    expect(screen.queryByRole('button', { name: /full result/i })).not.toBeInTheDocument();
  });

  it('CR-12 shows the full tool result of a long or multi-line result on demand', () => {
    const summary = `{\n  "items": [${'1, '.repeat(100)}]\n}`;
    renderLog({
      events: [
        {
          at: at(5),
          kind: 'tool_call',
          text: 'Tool call: github · list (9 ms): { "items": [1, 1, 1',
          summary,
        },
      ],
    });

    expect(screen.queryByTestId('schedule-run-log-result')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show full result' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);

    expect(screen.getByTestId('schedule-run-log-result').textContent).toBe(summary);
    expect(screen.getByRole('button', { name: 'Hide full result' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('shows the empty text without events', () => {
    renderLog({ events: [], emptyText: 'Starting test run...' });

    expect(screen.queryAllByTestId('schedule-run-log-line')).toHaveLength(0);
    expect(screen.getByText('Starting test run...')).toBeInTheDocument();
  });

  it('puts the paused actions right under the paused line', () => {
    renderLog({ events: EVENTS.slice(0, 7), pausedAction: <div data-testid="paused-action" /> });

    expect(lines()[6].nextElementSibling).toBe(screen.getByTestId('paused-action'));
  });

  it('follows the newest line unless the person scrolled up', () => {
    const { rerender } = renderLog({ events: EVENTS.slice(0, 2) });
    const box = screen.getByTestId('schedule-run-log');
    Object.defineProperty(box, 'scrollHeight', { configurable: true, value: 500 });
    Object.defineProperty(box, 'clientHeight', { configurable: true, value: 200 });
    const show = events =>
      rerender(
        <ThemeProvider theme={theme}>
          <ScheduleRunLog
            events={events}
            emptyText=""
          />
        </ThemeProvider>,
      );

    show(EVENTS.slice(0, 4));
    expect(box.scrollTop).toBe(500);

    box.scrollTop = 100;
    box.dispatchEvent(new Event('scroll'));
    show(EVENTS);
    expect(box.scrollTop).toBe(100);
  });

  // CR-21 live check: in the fixed-height right block the log shrank to one line
  it('keeps about 7 lines and does not shrink inside the scrolling panel body', () => {
    renderLog();
    expect(screen.getByTestId('schedule-run-log')).toHaveStyle({ flexShrink: '0', minHeight: '11rem' });
  });
});
