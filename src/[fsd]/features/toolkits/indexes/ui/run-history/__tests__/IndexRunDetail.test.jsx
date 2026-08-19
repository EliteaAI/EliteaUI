// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Box, ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import IndexRunDetail from '../IndexRunDetail';

vi.mock('@/pages/Common', () => ({
  ContentContainer: ({ children }) => <Box>{children}</Box>,
}));

vi.mock('@/[fsd]/shared/ui/button', () => ({
  BaseBtn: ({ children, ...rest }) => <button {...rest}>{children}</button>,
}));

afterEach(() => cleanup());

const theme = createTheme({
  palette: {
    background: { userInputBackground: '#eee' },
  },
});

const report = JSON.stringify({
  version: 1,
  status: 'ok',
  item_labels: { singular: 'page', plural: 'pages' },
  totals: { indexed: 3, skipped: 0, not_indexed: 0, failed: 0, unchanged: 0, total: 3 },
  categories: [{ kind: 'indexed', count: 3, groups: [] }],
  errors: [],
  errors_total: 0,
});

const baseRow = {
  id: 'index-run:docs:1786973660',
  name: 'Reindexed by schedule — docs',
  entry: {
    state: 'scheduled_reindex',
    updated_on: 1786973660,
    initiator: 'schedule',
    report,
    index_configuration: '{"index_name": "docs"}',
  },
};

const renderRow = row =>
  render(
    <ThemeProvider theme={theme}>
      <IndexRunDetail row={row} />
    </ThemeProvider>,
  );

describe('IndexRunDetail', () => {
  it('summarises a run no transcript can describe', () => {
    renderRow(baseRow);

    expect(screen.getByText('Reindexed by schedule — docs')).toBeInTheDocument();
    expect(screen.getByText(/^Finished/)).toBeInTheDocument();
    expect(screen.getByText('Started by Schedule')).toBeInTheDocument();
    expect(screen.getByText('Tool: index_data')).toBeInTheDocument();
    expect(screen.getByTestId('indexing-report-summary')).toHaveTextContent('3 pages indexed');
  });

  it('names the recorded initiator only — a legacy run without one gets no attribution', () => {
    renderRow({ ...baseRow, entry: { ...baseRow.entry, initiator: undefined } });
    expect(screen.queryByText(/^Started by/)).not.toBeInTheDocument();

    cleanup();

    renderRow({ ...baseRow, entry: { ...baseRow.entry, initiator: 'llm' } });
    expect(screen.getByText('Started by Agent')).toBeInTheDocument();
  });

  it('reveals the per-run request parameters on demand', () => {
    renderRow(baseRow);

    fireEvent.click(screen.getByTestId('index-run-configuration-toggle'));

    expect(screen.getByTestId('index-run-configuration')).toHaveTextContent('"index_name": "docs"');
  });

  it('hides the parameters section when the run recorded none', () => {
    renderRow({ ...baseRow, entry: { ...baseRow.entry, index_configuration: undefined } });

    expect(screen.queryByTestId('index-run-configuration-toggle')).not.toBeInTheDocument();
  });

  it('states a failure once, not beside the report that already lists it', () => {
    const failedReport = JSON.stringify({
      version: 1,
      status: 'error',
      totals: { indexed: 0, skipped: 0, not_indexed: 0, failed: 0, unchanged: 0, total: 0 },
      categories: [],
      errors: ['Unauthorized (401)'],
      errors_total: 1,
    });
    renderRow({
      ...baseRow,
      entry: { ...baseRow.entry, state: 'failed', error: 'Unauthorized (401)', report: failedReport },
    });

    expect(screen.getAllByText('Unauthorized (401)')).toHaveLength(1);
  });

  it('keeps the human budget sentence even though the report repeats the raw error', () => {
    const raw = 'Budget exceeded: project_budget_exceeded';
    const budgetReport = JSON.stringify({
      version: 1,
      status: 'error',
      totals: { indexed: 0, skipped: 0, not_indexed: 0, failed: 0, unchanged: 0, total: 0 },
      categories: [],
      errors: [raw],
      errors_total: 1,
    });
    renderRow({
      ...baseRow,
      entry: { ...baseRow.entry, state: 'failed', error: raw, report: budgetReport },
    });

    expect(screen.getByText(/budget has been reached/)).toBeInTheDocument();
  });

  it('leaves a creation event with the bare essentials', () => {
    renderRow({
      ...baseRow,
      name: 'Created — docs',
      entry: { state: 'created', updated_on: 1786973660, error: 'Vault unreachable' },
    });

    expect(screen.getByText('Created — docs')).toBeInTheDocument();
    expect(screen.getByText('Vault unreachable')).toBeInTheDocument();
    expect(screen.queryByTestId('indexing-report-summary')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Tool:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Finished/)).not.toBeInTheDocument();
  });

  it('renders nothing without an entry', () => {
    const { container } = renderRow({ ...baseRow, entry: null });

    expect(container).toBeEmptyDOMElement();
  });
});
