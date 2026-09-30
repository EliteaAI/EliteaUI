// @vitest-environment jsdom
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import Breadcrumbs from '../Breadcrumbs';

const trail = vi.hoisted(() => ({ current: [] }));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useBreadcrumbTrail: () => trail.current,
}));

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

const EVALUATE_ROUTE = '/agents/:tab/:agentId/evaluate';

const crumb = (key, label, isCurrent) => ({
  key,
  label,
  to: '/agents/all/1/evaluate',
  isCurrent,
  entry: {},
});

const menus = {
  [EVALUATE_ROUTE]: {
    items: [{ id: 12, label: 'Regression suite' }],
    activeId: 12,
    onSelect: () => {},
  },
};

const renderBreadcrumbs = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <Breadcrumbs menus={menus} />
      </MemoryRouter>
    </ThemeProvider>,
  );

describe('Breadcrumbs', () => {
  it('gives a crumb its menu while the page sits below it', () => {
    trail.current = [
      crumb(EVALUATE_ROUTE, 'Evaluation (Beta)', false),
      crumb('/agents/:tab/:agentId/evaluate/datasets', 'Manage Datasets', true),
    ];
    renderBreadcrumbs();

    expect(screen.getByTestId('breadcrumb-menu-trigger')).toHaveTextContent('Evaluation (Beta)');
  });

  it('renders that same crumb as plain text once it is the page you are on', () => {
    trail.current = [crumb(EVALUATE_ROUTE, 'Evaluation (Beta)', true)];
    renderBreadcrumbs();

    expect(screen.queryByTestId('breadcrumb-menu-trigger')).not.toBeInTheDocument();
    expect(screen.getByTestId('breadcrumb-current')).toHaveTextContent('Evaluation (Beta)');
  });
});
