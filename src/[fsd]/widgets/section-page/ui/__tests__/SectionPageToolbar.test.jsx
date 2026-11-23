// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SectionPageToolbar from '../SectionPageToolbar';

vi.mock('../SectionProjectSearch', () => ({
  default: ({ placeholder, filterButton }) => (
    <div data-testid="project-search">
      {placeholder}
      {filterButton}
    </div>
  ),
}));
vi.mock('../SectionDiscoverSearch', () => ({
  default: ({ placeholder, filterButton }) => (
    <div data-testid="discover-search">
      {placeholder}
      {filterButton}
    </div>
  ),
}));
vi.mock('../SectionAddMenu', () => ({ default: () => <div data-testid="add-menu" /> }));
vi.mock('@/components/ViewToggle', () => ({ default: () => <div data-testid="view-toggle" /> }));
vi.mock('@/components/DateRangeSelect', () => ({ default: () => <div data-testid="date-range" /> }));
vi.mock('@/[fsd]/shared/ui/select', () => ({
  SingleSelect: ({ options, value, onValueChange }) => (
    <select
      data-testid="public-filter"
      value={value}
      onChange={event => onValueChange(event.target.value)}
    >
      {options.map(option => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const theme = createTheme(getDesignTokens('dark'));

const renderToolbar = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <SectionPageToolbar
        sectionKey="agents"
        tab="all"
        onChangeTab={vi.fn()}
        onToggleFilters={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

describe('SectionPageToolbar', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows Yours / Discover in a private project', () => {
    renderToolbar({ showModeTabs: true });
    expect(screen.getByTestId('agents-mode-project')).toHaveTextContent('Yours');
    expect(screen.getByTestId('agents-mode-discover')).toHaveTextContent('Discover');
  });

  it('shows Team / Discover in a team project', () => {
    renderToolbar({ showModeTabs: true, isTeam: true });
    expect(screen.getByTestId('agents-mode-project')).toHaveTextContent('Team');
  });

  it('switches the tab', () => {
    const onChangeTab = vi.fn();
    renderToolbar({ showModeTabs: true, onChangeTab });
    fireEvent.click(screen.getByTestId('agents-mode-discover'));
    expect(onChangeTab).toHaveBeenCalledWith('discover');
  });

  it('has no tabs on Pipelines', () => {
    renderToolbar({ sectionKey: 'pipelines' });
    expect(screen.queryByTestId('pipelines-mode-project')).not.toBeInTheDocument();
    expect(screen.queryByTestId('public-filter')).not.toBeInTheDocument();
    expect(screen.getByTestId('project-search')).toHaveTextContent('Search pipelines');
  });

  it.each([
    ['toolkits', 'Search toolkits & indexes'],
    ['mcps', 'Search MCPs'],
    ['credentials', 'Search credentials'],
  ])('shows %s without tabs, with the view switch and its own placeholder', (sectionKey, placeholder) => {
    renderToolbar({ sectionKey });
    expect(screen.queryByTestId(`${sectionKey}-mode-project`)).not.toBeInTheDocument();
    expect(screen.queryByTestId('public-filter')).not.toBeInTheDocument();
    expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('project-search')).toHaveTextContent(placeholder);
    expect(screen.getByTestId(`${sectionKey}-filters-button`)).toBeInTheDocument();
  });

  it('shows Applications with Yours / Discover, the view switch and the filter icon on the project tab', () => {
    renderToolbar({
      sectionKey: 'applications',
      showModeTabs: true,
      modeTabTourIds: { project: 'applications-tab', discover: 'applications-catalog-tab' },
    });
    expect(screen.getByTestId('applications-mode-project')).toHaveTextContent('Yours');
    expect(screen.getByTestId('applications-mode-project')).toHaveAttribute('data-tour', 'applications-tab');
    expect(screen.getByTestId('applications-mode-discover')).toHaveAttribute(
      'data-tour',
      'applications-catalog-tab',
    );
    expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('project-search')).toHaveTextContent('Search applications');
    expect(screen.getByTestId('applications-filters-button')).toBeInTheDocument();
  });

  it('shows the Applications Discover search without the view switch and the filter icon', () => {
    renderToolbar({
      sectionKey: 'applications',
      showModeTabs: true,
      tab: 'discover',
      isDiscover: true,
      hasFilters: false,
    });
    expect(screen.getByTestId('discover-search')).toHaveTextContent('Search applications');
    expect(screen.queryByTestId('view-toggle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('applications-filters-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('add-menu')).toBeInTheDocument();
  });

  it('shows the Public "Filter by" with Admin only for admins and the period on Trending', () => {
    renderToolbar({ showPublicFilter: true, tab: 'latest' });
    expect(screen.getByText('Filter by:')).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('date-range')).not.toBeInTheDocument();
    cleanup();

    renderToolbar({ showPublicFilter: true, showAdminView: true, tab: 'trending', isTrending: true });
    expect(screen.getByRole('option', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByTestId('date-range')).toBeInTheDocument();
  });

  it('uses the project search and the view switch outside Discover', () => {
    renderToolbar({ showModeTabs: true });
    expect(screen.getByTestId('project-search')).toHaveTextContent('Search agents');
    expect(screen.getByTestId('view-toggle')).toBeInTheDocument();
  });

  it('uses the catalog search without the view switch in Discover', () => {
    renderToolbar({ showModeTabs: true, tab: 'discover', isDiscover: true, sectionKey: 'skills' });
    expect(screen.getByTestId('discover-search')).toHaveTextContent('Search skills');
    expect(screen.queryByTestId('view-toggle')).not.toBeInTheDocument();
  });

  it('toggles the filters from the search field and shows how many are on', () => {
    const onToggleFilters = vi.fn();
    renderToolbar({ onToggleFilters, filterCount: 2 });
    const button = screen.getByTestId('agents-filters-button');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent('2');
    fireEvent.click(button);
    expect(onToggleFilters).toHaveBeenCalledTimes(1);
  });

  it('hides the count while the filters are open', () => {
    renderToolbar({ filtersOpen: true, filterCount: 2 });
    const button = screen.getByTestId('agents-filters-button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveAttribute('aria-label', 'Hide filters');
  });
});
