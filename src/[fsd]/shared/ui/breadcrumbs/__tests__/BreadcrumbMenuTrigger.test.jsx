// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import BreadcrumbMenuTrigger from '../BreadcrumbMenuTrigger';

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

const items = [
  { id: 12, label: 'Regression suite', badge: 'Previous' },
  { id: 13, label: 'Smoke suite' },
];

const renderTrigger = (menu = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <BreadcrumbMenuTrigger
        label="Evaluation (Beta)"
        menu={{ items, activeId: 12, onSelect: () => {}, header: 'Navigate to...', ...menu }}
      />
    </ThemeProvider>,
  );

describe('BreadcrumbMenuTrigger', () => {
  it('renders the crumb label as a closed menu trigger', () => {
    renderTrigger();
    const trigger = screen.getByTestId('breadcrumb-menu-trigger');

    expect(trigger).toHaveTextContent('Evaluation (Beta)');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the suite list on click and marks the active one', () => {
    renderTrigger();
    fireEvent.click(screen.getByTestId('breadcrumb-menu-trigger'));

    expect(screen.getByTestId('breadcrumb-menu-trigger')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('breadcrumb-menu-header')).toHaveTextContent('Navigate to...');
    expect(screen.getByTestId('breadcrumb-menu-item-12')).toHaveAttribute('aria-current', 'true');
    expect(screen.getByTestId('breadcrumb-menu-item-13')).not.toHaveAttribute('aria-current');
  });

  it('shows the badge the caller attached to an entry', () => {
    renderTrigger();
    fireEvent.click(screen.getByTestId('breadcrumb-menu-trigger'));

    expect(screen.getByTestId('breadcrumb-menu-item-12')).toHaveTextContent('Previous');
    expect(screen.getByTestId('breadcrumb-menu-item-13')).not.toHaveTextContent('Previous');
  });

  it('renders the entries in the order it was given', () => {
    renderTrigger();
    fireEvent.click(screen.getByTestId('breadcrumb-menu-trigger'));

    const labels = screen.getAllByRole('menuitem').map(item => item.textContent);

    expect(labels[0]).toContain('Regression suite');
    expect(labels[1]).toContain('Smoke suite');
  });

  it('reports the picked item and closes', () => {
    const onSelect = vi.fn();
    renderTrigger({ onSelect });

    fireEvent.click(screen.getByTestId('breadcrumb-menu-trigger'));
    fireEvent.click(screen.getByTestId('breadcrumb-menu-item-13'));

    expect(onSelect).toHaveBeenCalledWith({ id: 13, label: 'Smoke suite' });
    expect(screen.getByTestId('breadcrumb-menu-trigger')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens from the keyboard', () => {
    renderTrigger();
    fireEvent.keyDown(screen.getByTestId('breadcrumb-menu-trigger'), { key: 'Enter' });

    expect(screen.getByTestId('breadcrumb-menu-item-12')).toBeInTheDocument();
  });

  it('shows the empty label when there is nothing to switch to', () => {
    renderTrigger({ items: [], emptyLabel: 'No suites created yet' });
    fireEvent.click(screen.getByTestId('breadcrumb-menu-trigger'));

    expect(screen.getByText('No suites created yet')).toBeInTheDocument();
    expect(screen.queryByTestId('breadcrumb-menu-loading')).not.toBeInTheDocument();
  });

  it('shows a loading row instead of the empty label while the caller is fetching', () => {
    renderTrigger({ items: [], emptyLabel: 'No suites created yet', isLoading: true });
    fireEvent.click(screen.getByTestId('breadcrumb-menu-trigger'));

    expect(screen.getByTestId('breadcrumb-menu-loading')).toBeInTheDocument();
    expect(screen.queryByText('No suites created yet')).not.toBeInTheDocument();
  });
});
