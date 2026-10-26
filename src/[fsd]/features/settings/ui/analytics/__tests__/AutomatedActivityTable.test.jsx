// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import AutomatedActivityTable from '../components/AutomatedActivityTable';
import { AnalyticsTestWrapper as Wrapper } from './_testHelpers';

vi.mock('@/[fsd]/shared/ui/tooltip', () => ({
  InfoTooltip: () => null,
}));

const SCHEDULED = { trigger_source: 'scheduled', runs: 3, llm_calls: 9, tool_runs: 6, llm_cost: 0.5 };
const SCHEDULE_MANUAL = {
  trigger_source: 'schedule_manual',
  runs: 1,
  llm_calls: 2,
  tool_runs: 0,
  llm_cost: 0.1,
};
const WEBHOOK = { trigger_source: 'webhook', runs: 2, llm_calls: 4, tool_runs: 1, llm_cost: 0.25 };

const renderTable = items =>
  render(
    <Wrapper>
      <AutomatedActivityTable items={items} />
    </Wrapper>,
  );

describe('AutomatedActivityTable', () => {
  afterEach(() => cleanup());

  it('renders nothing when there are no automated runs', () => {
    renderTable([]);

    expect(screen.queryByTestId('analytics-overview-automated-activity')).not.toBeInTheDocument();
  });

  it('renders one labelled row per trigger source', () => {
    renderTable([SCHEDULED, WEBHOOK, SCHEDULE_MANUAL]);

    expect(screen.getByTestId('analytics-automated-row-scheduled')).toHaveTextContent('Scheduled');
    expect(screen.getByTestId('analytics-automated-row-webhook')).toHaveTextContent('Webhook');
    expect(screen.getByTestId('analytics-automated-row-schedule_manual')).toHaveTextContent(
      'Schedule run now',
    );
  });

  it('EL-7011 R2.3 names the sources in the subtitle with their exact labels', () => {
    renderTable([SCHEDULED]);

    expect(screen.getByText(/Webhook, Scheduled, Schedule run now, Index runs/)).toBeInTheDocument();
  });

  it('shows no Total row for a single source', () => {
    renderTable([SCHEDULED]);

    expect(screen.queryByText('Total')).not.toBeInTheDocument();
  });

  it('sums every column into a Total row for two or more sources', () => {
    renderTable([SCHEDULED, WEBHOOK]);

    // Runs 3+2, LLM calls 9+4, tool runs 6+1, cost 0.5+0.25
    const cells = [...screen.getByText('Total').parentElement.children].map(cell => cell.textContent);
    expect(cells).toEqual(['Total', '', '5', '13', '7', '$0.7500']);
  });

  it('EL-7011 R1.2 shows one row per source and entity type with an Entity type column', () => {
    const agent = { ...SCHEDULED, entity_kind: 'agent' };
    const pipeline = { ...SCHEDULED, entity_kind: 'pipeline', runs: 1 };
    const noKind = { ...WEBHOOK, entity_kind: null };
    renderTable([agent, pipeline, noKind]);

    expect(screen.getByText('Entity type')).toBeInTheDocument();
    expect(screen.getAllByText('Scheduled')).toHaveLength(2);
    const rows = screen.getAllByTestId(/^analytics-automated-row-/);
    expect(rows.map(row => row.dataset.testid)).toEqual([
      'analytics-automated-row-scheduled',
      'analytics-automated-row-webhook',
      'analytics-automated-row-scheduled',
    ]);
    expect(within(rows[0]).getByText('Agent')).toBeInTheDocument();
    // Default sort is runs descending: 3, 2, 1
    expect(within(rows[1]).getByText('-')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Pipeline')).toBeInTheDocument();
  });

  it('EL-7011 R2.3 sorts by the label text of the source and the entity type', () => {
    renderTable([
      { ...WEBHOOK, entity_kind: 'pipeline' },
      { ...SCHEDULED, entity_kind: 'agent' },
    ]);
    // The entity type cell is the second child of each row
    const order = () =>
      screen.getAllByTestId(/^analytics-automated-row-/).map(row => row.children[1].textContent);

    fireEvent.click(screen.getByText('Entity type'));
    const first = order();
    expect(first).toHaveLength(2);
    fireEvent.click(screen.getByText('Entity type'));
    expect(order()).toEqual([...first].reverse());
  });
});
