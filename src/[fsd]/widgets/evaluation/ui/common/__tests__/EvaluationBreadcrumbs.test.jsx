// @vitest-environment jsdom
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import EvaluationBreadcrumbs from '../EvaluationBreadcrumbs';

const suitesQuery = vi.hoisted(() => ({ current: { data: [], isLoading: false } }));

vi.mock('../../../api', () => ({
  useEvalSuitesQuery: () => suitesQuery.current,
}));

vi.mock('@/hooks/useSelectedProject', () => ({
  useSelectedProjectId: () => 1,
}));

// The trail itself is covered by the breadcrumbs tests; here it only has to put the evaluation
// crumb above the current page so its menu renders.
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useHasBreadcrumbTrail: () => true,
  useBreadcrumbTrail: () => [
    {
      key: '/agents/:tab/:agentId/evaluate',
      label: 'Evaluation (Beta)',
      to: '/agents/all/7/evaluate',
      isCurrent: false,
      entry: {},
    },
    {
      key: '/agents/:tab/:agentId/evaluate/datasets',
      label: 'Manage Datasets',
      to: '/agents/all/7/evaluate/datasets',
      isCurrent: true,
      entry: {},
    },
  ],
}));

beforeEach(() => {
  suitesQuery.current = {
    data: [
      { id: 12, name: 'Regression suite', updated_at: '2026-03-01T00:00:00Z' },
      { id: 13, name: 'Smoke suite', updated_at: '2026-02-01T00:00:00Z' },
    ],
    isLoading: false,
  };
});

afterEach(() => cleanup());

const theme = createTheme({
  palette: {
    text: { primary: '#fff', secondary: '#ccc', info: '#6cf' },
    border: { lines: '#333' },
    icon: { default: '#aaa' },
    boxShadow: { default: '0 0 0.5rem 0 #fff2' },
    background: {
      default: { secondary: '#111' },
      surface: { interactive: { default: '#222' } },
    },
  },
});

const renderBreadcrumbs = (search = '') =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[`/agents/all/7/evaluate/datasets${search}`]}>
        <Routes>
          <Route
            path="/agents/:tab/:agentId/evaluate/datasets"
            element={<EvaluationBreadcrumbs title="Manage Datasets" />}
          />
          <Route
            path="/agents/:tab/:agentId/evaluate/:suiteId"
            element={<div data-testid="suite-page" />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );

const openMenu = () => fireEvent.click(screen.getByTestId('breadcrumb-menu-trigger'));

describe('EvaluationBreadcrumbs', () => {
  it('badges the suite the page was opened from and puts it first', () => {
    renderBreadcrumbs('?suiteId=13');
    openMenu();

    const labels = screen.getAllByRole('menuitem').map(item => item.textContent);

    expect(labels[0]).toContain('Smoke suite');
    expect(screen.getByTestId('breadcrumb-menu-item-13')).toHaveTextContent('Previous');
    expect(screen.getByTestId('breadcrumb-menu-item-12')).not.toHaveTextContent('Previous');
  });

  it('badges nothing when the page was not opened from a suite', () => {
    renderBreadcrumbs();
    openMenu();

    const labels = screen.getAllByRole('menuitem').map(item => item.textContent);

    expect(labels[0]).toContain('Regression suite');
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
  });

  it('navigates to the picked suite, dropping the page-local params', () => {
    renderBreadcrumbs('?suiteId=13&datasetId=5');
    openMenu();
    fireEvent.click(screen.getByTestId('breadcrumb-menu-item-12'));

    expect(screen.getByTestId('suite-page')).toBeInTheDocument();
  });

  it('waits for the suites instead of claiming there are none', () => {
    suitesQuery.current = { data: undefined, isLoading: true };
    renderBreadcrumbs();
    openMenu();

    expect(screen.getByTestId('breadcrumb-menu-loading')).toBeInTheDocument();
    expect(screen.queryByText('No suites created yet')).not.toBeInTheDocument();
  });
});
