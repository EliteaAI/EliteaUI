// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

import AutomatedActivityTable from '../components/AutomatedActivityTable';
import { AnalyticsTestWrapper as Wrapper } from './_testHelpers';

vi.mock('@/[fsd]/features/settings/lib/helpers', () => ({
  AnalyticCommonHelpers: {
    fmtCost: v => `$${v ?? 0}`,
    fmtNum: v => String(v ?? 0),
    triggerSourceLabel: source =>
      ({ scheduled: 'Scheduled Pipelines', webhook: 'Webhook Triggers' })[source] || source,
  },
}));

vi.mock('@/[fsd]/shared/ui/tooltip', () => ({
  InfoTooltip: () => null,
}));

const SCHEDULED = { trigger_source: 'scheduled', runs: 3, llm_calls: 9, tool_runs: 6, llm_cost: 0.5 };
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
    renderTable([SCHEDULED, WEBHOOK]);

    expect(screen.getByTestId('analytics-automated-row-scheduled')).toHaveTextContent('Scheduled Pipelines');
    expect(screen.getByTestId('analytics-automated-row-webhook')).toHaveTextContent('Webhook Triggers');
  });

  it('shows no Total row for a single source', () => {
    renderTable([SCHEDULED]);

    expect(screen.queryByText('Total')).not.toBeInTheDocument();
  });

  it('sums every column into a Total row for two or more sources', () => {
    renderTable([SCHEDULED, WEBHOOK]);

    // Runs 3+2, LLM calls 9+4, tool runs 6+1, cost 0.5+0.25
    const cells = [...screen.getByText('Total').parentElement.children].map(cell => cell.textContent);
    expect(cells).toEqual(['Total', '', '5', '13', '7', '$0.75']);
  });

  it('EL-7011 R1.2 shows one row per source and entity type with an Entity type column', () => {
    const agent = { ...SCHEDULED, entity_kind: 'agent' };
    const pipeline = { ...SCHEDULED, entity_kind: 'pipeline', runs: 1 };
    const noKind = { ...WEBHOOK, entity_kind: null };
    const { container } = renderTable([agent, pipeline, noKind]);

    expect(screen.getByText('Entity type')).toBeInTheDocument();
    expect(screen.getAllByText('Scheduled Pipelines')).toHaveLength(2);
    const rows = screen.getAllByTestId(/^analytics-automated-row-/);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText('Agent')).toBeInTheDocument();
    // Default sort is runs descending: 3, 2, 1
    expect(within(rows[1]).getByText('-')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Pipeline')).toBeInTheDocument();
    expect(container.textContent).toMatch(/Schedule run now/);
  });

  it('EL-7011 R2.3 sorts by the label text of the source and the entity type', () => {
    renderTable([
      { ...WEBHOOK, entity_kind: 'pipeline' },
      { ...SCHEDULED, entity_kind: 'agent' },
    ]);
    const order = () =>
      screen.getAllByTestId(/^analytics-automated-row-/).map(row => row.textContent.slice(0, 9));

    fireEvent.click(screen.getByText('Entity type'));
    const first = order();
    fireEvent.click(screen.getByText('Entity type'));
    expect(order()).toEqual([...first].reverse());
    expect(first).not.toEqual(order());
  });
});
