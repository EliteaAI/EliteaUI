// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SkillBreakdownTable from '../components/SkillBreakdownTable';
import { AnalyticsTestWrapper as Wrapper } from './_testHelpers';

vi.mock('@/[fsd]/shared/ui/tooltip', () => ({ InfoTooltip: () => null }));

const COLUMNS = [
  { key: 'name', label: 'Name', render: row => row.name.toUpperCase() },
  { key: 'runs', label: 'Runs', render: row => `${row.runs} runs` },
];

const ROWS = [
  { key: 'a', name: 'alpha', runs: 9 },
  { key: 'b', name: 'bravo', runs: 100 },
  { key: 'c', name: 'charlie', runs: 10 },
];

const TEST_ID = 'breakdown';

const renderTable = props =>
  render(
    <SkillBreakdownTable
      title="Breakdown"
      columns={COLUMNS}
      rows={ROWS}
      testId={TEST_ID}
      {...props}
    />,
    { wrapper: Wrapper },
  );

const rowTexts = () => screen.getAllByTestId(`${TEST_ID}-row`).map(row => row.textContent);

describe('SkillBreakdownTable', () => {
  afterEach(() => cleanup());

  it('renders rows in the given order with plain headers when it cannot sort', () => {
    renderTable();

    expect(rowTexts()).toEqual(['ALPHA9 runs', 'BRAVO100 runs', 'CHARLIE10 runs']);
    expect(screen.queryByTestId(`${TEST_ID}-sort-runs`)).toBeNull();
  });

  it('leaves the order to its owner and reports the clicked column', () => {
    const onSort = vi.fn();
    renderTable({ sortBy: 'runs', sortOrder: 'desc', onSort });

    fireEvent.click(screen.getByTestId(`${TEST_ID}-sort-name`));

    expect(rowTexts()).toEqual(['ALPHA9 runs', 'BRAVO100 runs', 'CHARLIE10 runs']);
    expect(onSort).toHaveBeenCalledWith('name');
  });

  it('reports a column sort key instead of its row key', () => {
    const onSort = vi.fn();
    renderTable({
      columns: [COLUMNS[0], { ...COLUMNS[1], sortKey: 'run_count' }],
      sortBy: 'run_count',
      sortOrder: 'desc',
      onSort,
    });

    fireEvent.click(screen.getByTestId(`${TEST_ID}-sort-runs`));

    expect(onSort).toHaveBeenCalledWith('run_count');
    expect(screen.getByTestId(`${TEST_ID}-sort-runs`)).toHaveClass('Mui-active');
  });

  it('shows a spinner instead of rows while loading', () => {
    renderTable({ loading: true });

    expect(screen.getByTestId(`${TEST_ID}-loading`)).toBeInTheDocument();
    expect(screen.queryByTestId(`${TEST_ID}-row`)).toBeNull();
  });

  it('renders the footer under the table', () => {
    renderTable({ footer: <span data-testid="breakdown-footer" /> });

    expect(screen.getByTestId('breakdown-footer')).toBeInTheDocument();
  });
});
