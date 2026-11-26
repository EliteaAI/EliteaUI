// @vitest-environment jsdom
import { useState } from 'react';

import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import RunHistoryPage from '../RunHistoryPage';

vi.hoisted(() => {
  const entries = new Map();
  globalThis.localStorage = {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear(),
  };
});

// The light palette only: the full MainTheme pulls in API modules this test does not mock
const LIGHT_THEME = createTheme({ palette: lightPalette });
const containerProps = vi.hoisted(() => ({ current: null }));

vi.mock('@/[fsd]/entities/run-history', async () => ({
  ...(await vi.importActual('@/[fsd]/entities/run-history/lib/helpers')),
  // The real status cell, so the Status column is drawn as it is in the app
  RunStatusCell: (await vi.importActual('@/[fsd]/entities/run-history/ui/run-history-list/RunStatusCell'))
    .default,
  RunHistoryContainer: props => {
    containerProps.current = props;
    return (
      <button
        data-testid="open-analytics"
        onClick={() => props.handleOpenAnalytics(77)}
      />
    );
  },
}));

vi.mock('@/[fsd]/features/chat', () => ({ ChatMessageList: () => null }));
const complexitySwitch = vi.hoisted(() => ({ on: false }));
vi.mock('@/[fsd]/features/settings/ui/complexity', () => ({
  useRunComplexityColumn: () =>
    complexitySwitch.on ? { id: 'complexity', label: 'Complexity', render: () => null } : null,
}));
vi.mock('@/[fsd]/features/schedule', () => ({
  ScheduleRunStatusChip: ({ status }) => <span data-testid="status-chip">{status}</span>,
}));

vi.mock('@/[fsd]/features/settings', () => ({ DrawerPageHeader: () => null }));

vi.mock('@/[fsd]/features/toolkits', () => ({ ToolkitsHelpers: { prettifyToolkitConversation: vi.fn() } }));

vi.mock('@/[fsd]/shared/ui/breadcrumbs', () => ({ default: () => null }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 2 }));

vi.mock('@/api/applications', () => ({ useApplicationDetailsQuery: () => ({ data: undefined }) }));

const scheduleList = vi.hoisted(() => ({
  args: null,
  calls: [],
  rows: [{ id: 4, name: 'Daily digest' }],
  webhookRows: [{ id: 8, name: 'Push hook', trigger_kind: 'webhook' }],
}));

vi.mock('@/[fsd]/entities/schedule', async () => ({
  ...(await vi.importActual('@/[fsd]/entities/schedule/lib/helpers')),
  // Run History loads the cron and the webhook rows in two calls; `args` keeps the cron one
  useAllEntitySchedules: args => {
    scheduleList.calls.push(args);
    if (args.triggerKind === 'webhook') return { rows: args.skip ? [] : scheduleList.webhookRows };
    scheduleList.args = args;
    return { rows: args.skip ? [] : scheduleList.rows };
  },
}));

vi.mock('@/[fsd]/shared/ui/button', () => ({
  BUTTON_VARIANTS: { text: 'text' },
  BaseBtn: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

// The shared multi-select, as the filter uses it: the closed button shows the summary, the menu lists the options
// (each with its test id), a tick reports the whole array, and the search field appears only when asked for
vi.mock('@/[fsd]/shared/ui', async () => ({
  // The real status dot, which the Status column and filter draw with
  StatusDot: (await vi.importActual('@/[fsd]/shared/ui/status-dot/StatusDot')).default,
  Select: {
    SingleSelect: ({
      options,
      value,
      onValueChange,
      customRenderValue,
      withSearch,
      label,
      'data-testid': testId,
    }) => {
      const [open, setOpen] = useState(false);
      return (
        <div data-testid={testId}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
          >
            {customRenderValue(value)}
          </button>
          {open && (
            <div role="listbox">
              {withSearch && <input aria-label={`Search ${label}`} />}
              {options.map(option => {
                const checked = value.includes(option.value);
                return (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      data-testid={option.testId}
                      checked={checked}
                      onChange={() =>
                        onValueChange(
                          checked ? value.filter(v => v !== option.value) : [...value, option.value],
                        )
                      }
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      );
    },
  },
}));

// Opens a filter's dropdown by its visible name, then ticks or unticks options by their label text
const openFilter = name => fireEvent.click(screen.getByTestId(`run-history-filter-${name}-button`));
const tickFilterOption = (filterName, optionValue) =>
  fireEvent.click(screen.getByTestId(`run-history-filter-${filterName}-option-${optionValue}-checkbox`));
const filterSummary = name => screen.getByTestId(`run-history-filter-${name}-button`).textContent;

const AnalyticsProbe = () => {
  const { pathname, search } = useLocation();
  return <div data-testid="analytics-page">{`${pathname}${search}`}</div>;
};

const renderAt = (url, extraProps) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/agents/:tab/:agentId/history"
          element={
            <RunHistoryPage
              source="application"
              detailRoute="/agents/:tab/:agentId"
              analyticsRoute="/agents/:tab/:agentId/history/analytics"
              {...extraProps}
            />
          }
        />
        <Route
          path="/agents/:tab/:agentId/history/analytics"
          element={<AnalyticsProbe />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('RunHistoryPage opening run analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scheduleList.calls = [];
  });

  afterEach(() => cleanup());

  it('opens the chosen conversation without the single analytics run it was reached from', () => {
    renderAt('/agents/all/127/history?usage_run_id=run-x&history_run_id=9');

    fireEvent.click(screen.getByTestId('open-analytics'));

    expect(screen.getByTestId('analytics-page')).toHaveTextContent(
      '/agents/all/127/history/analytics?history_run_id=77',
    );
  });

  it('keeps the other search params of a plain Run History visit', () => {
    renderAt('/agents/all/127/history?viewMode=owner');

    fireEvent.click(screen.getByTestId('open-analytics'));

    expect(screen.getByTestId('analytics-page')).toHaveTextContent(
      '/agents/all/127/history/analytics?viewMode=owner&history_run_id=77',
    );
  });
});

describe('RunHistoryPage execution type column', () => {
  afterEach(() => cleanup());

  it('passes the column label and row decorator through to the container', () => {
    const decorateRow = vi.fn();
    renderAt('/agents/all/127/history', { eventColumnLabel: 'Trigger Type', decorateRow });

    expect(containerProps.current.eventColumnLabel).toBe('Trigger Type');
    expect(containerProps.current.decorateRow).toBe(decorateRow);
  });

  it('leaves the column label and decorator unset when the caller gives none', () => {
    renderAt('/agents/all/127/history');

    expect(containerProps.current.eventColumnLabel).toBeUndefined();
    expect(containerProps.current.decorateRow).toBeUndefined();
  });
});

describe('RunHistoryPage schedule filter and links', () => {
  afterEach(() => cleanup());

  it('?schedule_id=4 sends schedule_id to the list and shows the filter summary', () => {
    renderAt('/agents/all/127/history?schedule_id=4', { scheduleEntityType: 'agent' });

    expect(scheduleList.args).toMatchObject({ entityType: 'agent', entityId: '127', skip: false });
    expect(containerProps.current.queryParams).toEqual({ schedule_id: '4' });
    expect(filterSummary('schedule')).toContain('Daily digest');

    openFilter('schedule');
    tickFilterOption('schedule', '4');
    expect(containerProps.current.queryParams).toEqual({});
  });

  it('loads every page of the entity schedules so every name can link', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });

    expect(scheduleList.args).toEqual({
      entityType: 'agent',
      entityId: '127',
      triggerKind: 'cron',
      skip: false,
    });
    expect(scheduleList.calls).toContainEqual({
      entityType: 'agent',
      entityId: '127',
      triggerKind: 'webhook',
      skip: false,
    });
  });

  it('a webhook name links to the webhook editor, not the schedule one', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });
    const [scheduleColumn] = containerProps.current.extraColumns;

    render(
      <ThemeProvider theme={LIGHT_THEME}>
        <MemoryRouter>
          {scheduleColumn.render({ schedule_run: { schedule_id: 8, schedule_name: 'Push hook' } })}
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(screen.getByRole('link', { name: 'Push hook' }).getAttribute('href')).toMatch(/webhooks\/8\?/);
  });

  it('a schedule not in the caller list shows a plain name', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });
    const [scheduleColumn] = containerProps.current.extraColumns;

    expect(scheduleColumn.render({ schedule_run: { schedule_id: 9, schedule_name: 'Hidden' } })).toBe(
      'Hidden',
    );
    expect(scheduleColumn.render({ schedule_run: null })).toBe('-');
    render(
      <ThemeProvider theme={LIGHT_THEME}>
        <MemoryRouter>
          {scheduleColumn.render({ schedule_run: { schedule_id: 4, schedule_name: 'Daily digest' } })}
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(screen.getByRole('link', { name: 'Daily digest' })).toHaveAttribute(
      'href',
      '/agents/all/127/schedules/4?viewMode=owner',
    );
    // a cut name shows in full on hover
    expect(screen.getByRole('link', { name: 'Daily digest' })).toHaveAttribute('title', 'Daily digest');
    // the theme link (MUI Link), not the browser default blue
    expect(screen.getByRole('link', { name: 'Daily digest' })).toHaveClass('MuiLink-root');
    // the app link colour, not the brand colour (4.5:1 for small text)
    expect(screen.getByRole('link', { name: 'Daily digest' })).toHaveStyle({
      color: LIGHT_THEME.palette.text.secondary,
    });
  });

  it('ignores a schedule_id that is not a number, and keeps an unknown valid id as an option', () => {
    renderAt('/agents/all/127/history?schedule_id=abc', { scheduleEntityType: 'agent' });
    expect(containerProps.current.queryParams).toEqual({});
    expect(filterSummary('schedule')).toContain('All');
    cleanup();

    renderAt('/agents/all/127/history?schedule_id=55', { scheduleEntityType: 'agent' });
    expect(containerProps.current.queryParams).toEqual({ schedule_id: '55' });
    openFilter('schedule');
    expect(screen.getByTestId('run-history-filter-schedule-option-55-checkbox')).toBeChecked();
  });

  it('shows "All" as the summary when nothing is ticked', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });

    expect(filterSummary('schedule')).toContain('All');
  });

  it('sends status, event and version together, each as a comma list when several are ticked', () => {
    renderAt('/agents/all/127/history?schedule_id=4&run_outcome=failed,skipped&trigger=test&version_id=9', {
      scheduleEntityType: 'agent',
    });

    expect(containerProps.current.queryParams).toEqual({
      schedule_id: '4',
      run_outcome: 'failed,skipped',
      trigger: 'test',
      version_id: '9',
    });
    expect(filterSummary('status')).toContain('2 selected');
    expect(filterSummary('event')).toContain('Test');
  });

  it('ticking two statuses writes both to the URL, and Clear filters resets every filter', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });
    expect(screen.queryByTestId('run-history-clear-filters-button')).not.toBeInTheDocument();

    openFilter('status');
    tickFilterOption('status', 'failed');
    tickFilterOption('status', 'skipped');
    expect(containerProps.current.queryParams).toEqual({ run_outcome: 'failed,skipped' });
    expect(filterSummary('status')).toContain('2 selected');

    fireEvent.click(screen.getByTestId('run-history-clear-filters-button'));
    expect(containerProps.current.queryParams).toEqual({});
  });

  it('unticking the last option of a filter removes its param', () => {
    renderAt('/agents/all/127/history?run_outcome=failed', { scheduleEntityType: 'agent' });

    openFilter('status');
    tickFilterOption('status', 'failed');

    expect(containerProps.current.queryParams).toEqual({});
  });

  it('ticking All clears the other ticks of the filter', () => {
    renderAt('/agents/all/127/history?run_outcome=failed,skipped', { scheduleEntityType: 'agent' });

    openFilter('status');
    fireEvent.click(screen.getByTestId('run-history-filter-status-option-all-checkbox'));

    expect(containerProps.current.queryParams).toEqual({});
    expect(filterSummary('status')).toContain('All');
  });

  it('sends a Scheduled event as trigger=cron', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });

    openFilter('event');
    tickFilterOption('event', 'cron');

    expect(containerProps.current.queryParams).toEqual({ trigger: 'cron' });
  });

  it.each([
    ['chat', 'Chat'],
    ['api', 'API'],
    ['mcp', 'MCP'],
  ])('sends execution_type=%s for the %s option, not a run trigger', (value, label) => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });

    openFilter('event');
    tickFilterOption('event', value);

    expect(containerProps.current.queryParams).toEqual({ execution_type: value });
    expect(filterSummary('event')).toContain(label);
  });

  it('Chat and Scheduled together list both kinds: trigger and execution_type are sent side by side', () => {
    renderAt('/agents/all/127/history?trigger=chat,cron', { scheduleEntityType: 'agent' });

    expect(containerProps.current.queryParams).toEqual({ trigger: 'cron', execution_type: 'chat' });
    expect(filterSummary('event')).toContain('2 selected');
  });

  it('keeps Status, Version and Schedule filters enabled for Chat, API and MCP runs', () => {
    renderAt('/agents/all/127/history?trigger=api&run_outcome=failed&schedule_id=4&version_id=9', {
      scheduleEntityType: 'agent',
    });

    expect(containerProps.current.queryParams).toEqual({
      execution_type: 'api',
      run_outcome: 'failed',
      schedule_id: '4',
      version_id: '9',
    });
    ['schedule', 'status', 'version'].forEach(name => {
      expect(screen.getByTestId(`run-history-filter-${name}-button`)).toBeEnabled();
    });
  });

  it('reads trigger=chat from the link and Clear filters resets it', () => {
    renderAt('/agents/all/127/history?trigger=chat', { scheduleEntityType: 'agent' });
    expect(containerProps.current.queryParams).toEqual({ execution_type: 'chat' });

    fireEvent.click(screen.getByTestId('run-history-clear-filters-button'));
    expect(containerProps.current.queryParams).toEqual({});
  });

  it('ignores an unknown trigger and an unknown status in the link', () => {
    renderAt('/agents/all/127/history?trigger=bogus&run_outcome=bogus', { scheduleEntityType: 'agent' });

    expect(containerProps.current.queryParams).toEqual({});
    openFilter('event');
    ['cron', 'manual', 'webhook', 'test', 'chat', 'api', 'mcp'].forEach(value =>
      expect(screen.getByTestId(`run-history-filter-event-option-${value}-checkbox`)).toBeInTheDocument(),
    );
  });

  it('a link with execution_type alone sends no filter', () => {
    renderAt('/agents/all/127/history?execution_type=chat', { scheduleEntityType: 'agent' });

    expect(containerProps.current.queryParams).toEqual({});
  });

  it('histories without schedules still draw the Schedule/Webhook filter, showing All (design)', () => {
    const { rows, webhookRows } = scheduleList;
    scheduleList.rows = [];
    scheduleList.webhookRows = [];
    try {
      renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });
    } finally {
      scheduleList.rows = rows;
      scheduleList.webhookRows = webhookRows;
    }

    // The design draws the Schedule/Webhook filter on every agent and pipeline, showing All with no schedule
    expect(screen.getByTestId('run-history-filter-schedule-button')).toHaveTextContent('All');
    expect(screen.getByTestId('run-history-filter-status-button')).toBeInTheDocument();
    // The Schedule/Webhook column is always drawn for an agent; a row without a schedule shows a hyphen
    const scheduleColumn = containerProps.current.extraColumns.find(column => column.id === 'schedule');
    expect(scheduleColumn).toBeDefined();
    expect(scheduleColumn.render({ schedule_run: null })).toBe('-');
    // The page still asks for the agent's schedules, so a run that has one can link its name
    expect(scheduleList.args).toMatchObject({ entityType: 'agent', skip: false });
  });
});

describe('RunHistoryPage status column', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the server run_status of a chat row as its label, not a hyphen', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });

    const statusColumn = containerProps.current.extraColumns.find(column => column.id === 'status');
    render(<>{statusColumn.render({ schedule_run: null, run_status: 'failed' })}</>);

    expect(screen.getByTestId('run-status-cell')).toHaveTextContent('Failed');
  });

  it('shows a hyphen when the row has neither a schedule run nor a run_status', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });

    const statusColumn = containerProps.current.extraColumns.find(column => column.id === 'status');
    render(<>{statusColumn.render({ schedule_run: null, run_status: null })}</>);

    expect(screen.queryByTestId('run-status-cell')).not.toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

describe('RunHistoryPage complexity filter (BE-2)', () => {
  afterEach(() => cleanup());

  afterEach(() => {
    complexitySwitch.on = false;
  });

  it('is not drawn while the platform complexity switch is off', () => {
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });

    expect(screen.queryByTestId('run-history-filter-complexity-button')).not.toBeInTheDocument();
    expect(containerProps.current.queryParams).toEqual({});
  });

  it('is drawn with its five labels once the switch is on, showing All', () => {
    complexitySwitch.on = true;
    renderAt('/agents/all/127/history', { scheduleEntityType: 'agent' });

    expect(screen.getByTestId('run-history-filter-complexity-button')).toHaveTextContent('All');
    openFilter('complexity');
    ['L', 'M', 'H', 'X', 'not_scored'].forEach(value =>
      expect(
        screen.getByTestId(`run-history-filter-complexity-option-${value}-checkbox`),
      ).toBeInTheDocument(),
    );
  });

  it('sends a ticked complexity label to the list as complexity, with the five labels as options', () => {
    renderAt('/agents/all/127/history?complexity=L,not_scored', { scheduleEntityType: 'agent' });

    expect(containerProps.current.queryParams).toEqual({ complexity: 'L,not_scored' });
  });

  it('drops a complexity value the server does not know from a hand-edited link', () => {
    renderAt('/agents/all/127/history?complexity=bogus', { scheduleEntityType: 'agent' });

    expect(containerProps.current.queryParams).toEqual({});
  });
});
