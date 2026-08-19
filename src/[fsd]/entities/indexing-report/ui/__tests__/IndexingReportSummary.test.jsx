// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import IndexingReportSummary from '../IndexingReportSummary';

afterEach(() => cleanup());

const theme = createTheme();

const renderSummary = source =>
  render(
    <ThemeProvider theme={theme}>
      <IndexingReportSummary source={source} />
    </ThemeProvider>,
  );

const report = (totals = {}, categories = []) => ({
  report: {
    status: 'ok',
    item_labels: { singular: 'page', plural: 'pages' },
    dependent_labels: { singular: 'attachment', plural: 'attachments' },
    totals: {
      indexed: 0,
      skipped: 0,
      not_indexed: 0,
      failed: 0,
      unchanged: 0,
      dependent_not_indexed: 0,
      total: 0,
      ...totals,
    },
    categories,
    errors: [],
    errors_total: 0,
  },
});

describe('IndexingReportSummary', () => {
  it('renders nothing without a report', () => {
    const { container } = renderSummary(null);

    expect(container).toBeEmptyDOMElement();
  });

  it('marks each category with an icon, not colour alone', () => {
    renderSummary(
      report({ indexed: 5, skipped: 1, not_indexed: 1, failed: 1, total: 8 }, [
        { kind: 'indexed', count: 5, groups: [] },
        { kind: 'skipped', count: 1, groups: [] },
        { kind: 'not_indexed', count: 1, groups: [] },
        { kind: 'failed', count: 1, groups: [] },
      ]),
    );

    expect(screen.getByTestId('indexing-report-category-indexed')).toHaveTextContent('✅');
    expect(screen.getByTestId('indexing-report-category-skipped')).toHaveTextContent('⚠️');
    expect(screen.getByTestId('indexing-report-category-not_indexed')).toHaveTextContent('⚠️');
    expect(screen.getByTestId('indexing-report-category-failed')).toHaveTextContent('❌');
  });

  it('names each category in the source’s own units', () => {
    renderSummary(
      report({ indexed: 5, skipped: 1, total: 6 }, [
        { kind: 'indexed', count: 5, groups: [] },
        {
          kind: 'skipped',
          count: 1,
          groups: [
            { reason: 'filtered', label: 'Excluded by configured filters', count: 1, items: ['x.tmp'] },
          ],
        },
      ]),
    );

    expect(screen.getByTestId('indexing-report-category-indexed')).toHaveTextContent('5 pages indexed');
    expect(screen.getByTestId('indexing-report-category-skipped')).toHaveTextContent('1 page skipped');
    expect(screen.getByText('Excluded by configured filters (1)')).toBeInTheDocument();
    expect(screen.getByText('x.tmp')).toBeInTheDocument();
  });

  it('accounts for unchanged items rather than dropping them', () => {
    renderSummary(
      report({ indexed: 5, unchanged: 195, total: 200 }, [
        { kind: 'indexed', count: 5, groups: [] },
        {
          kind: 'skipped',
          count: 0,
          groups: [
            {
              reason: 'unchanged',
              label: 'Already indexed (unchanged)',
              count: 195,
              items: [],
              counted: false,
            },
          ],
        },
      ]),
    );

    expect(screen.getByTestId('indexing-report-unchanged')).toHaveTextContent(
      '195 pages already indexed (unchanged)',
    );
    expect(screen.queryByText(/195 pages skipped/)).not.toBeInTheDocument();
  });

  it('omits the unchanged line when the headline already carries it', () => {
    renderSummary(
      report({ unchanged: 196, total: 196 }, [
        {
          kind: 'skipped',
          count: 0,
          groups: [
            {
              reason: 'unchanged',
              label: 'Already indexed (unchanged)',
              count: 196,
              items: [],
              counted: false,
            },
          ],
        },
      ]),
    );

    expect(screen.getByText(/Up to date — 196 pages unchanged/)).toBeInTheDocument();
    expect(screen.queryByTestId('indexing-report-unchanged')).not.toBeInTheDocument();
  });

  it('names dependent items with their own noun', () => {
    renderSummary(
      report({ indexed: 5, dependent_not_indexed: 4, total: 5 }, [
        { kind: 'indexed', count: 5, groups: [] },
        {
          kind: 'not_indexed',
          count: 0,
          groups: [
            {
              reason: 'unsupported_format',
              label: 'Unsupported format',
              count: 4,
              items: ['a.raw'],
              dependent: true,
              counted: false,
            },
          ],
        },
      ]),
    );

    expect(screen.getByTestId('indexing-report-category-not_indexed')).toHaveTextContent(
      '4 attachments not indexed',
    );
  });

  it('renders repeated item names without collapsing them', () => {
    renderSummary(
      report({ skipped: 2, total: 2 }, [
        {
          kind: 'skipped',
          count: 2,
          groups: [
            {
              reason: 'filtered',
              label: 'Excluded by configured filters',
              count: 2,
              items: ['report.pdf', 'report.pdf'],
            },
          ],
        },
      ]),
    );

    expect(screen.getAllByText('report.pdf')).toHaveLength(2);
  });

  it('renders a pre-report entry', () => {
    renderSummary({ indexed: 40, total: 40, state: 'completed' });

    expect(screen.getByTestId('indexing-report-category-indexed')).toHaveTextContent('40 documents indexed');
  });
});
