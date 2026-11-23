// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import SectionPage from '../SectionPage';

const fixture = vi.hoisted(() => ({
  tab: 'all',
  isDiscover: false,
  showModeTabs: true,
  onChangeTab: vi.fn(),
  tour: null,
  toolbarProps: null,
}));

vi.mock('@/[fsd]/features/interactive-tours', () => ({ ELITEA_CATALOG_TOUR_ID: 'elitea-catalog' }));
vi.mock('@/[fsd]/shared/lib/context', async () => {
  const { createContext } = await import('react');
  return { ListLayoutContext: createContext(null), useInteractiveTour: () => fixture.tour };
});
vi.mock('@/[fsd]/widgets/section-page/lib/hooks', () => ({
  useElementBottom: () => ({ ref: null, bottom: 0 }),
  useSectionFilterCount: () => 0,
  useSectionMode: () => ({
    tab: fixture.tab,
    isPublic: false,
    isTeam: false,
    isDiscover: fixture.isDiscover,
    showModeTabs: fixture.showModeTabs,
    onChangeTab: fixture.onChangeTab,
  }),
}));
vi.mock('@/hooks/users/usePermissions', () => ({ useHasAdminPermissionOfThisEntity: () => false }));
vi.mock('../SectionPageToolbar', () => ({
  default: props => {
    fixture.toolbarProps = props;
    return <div data-testid="toolbar" />;
  },
}));

const theme = createTheme(getDesignTokens('dark'));

const renderPage = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <SectionPage
        sectionKey="applications"
        projectContent={<div data-testid="project-content" />}
        renderDiscover={() => <div data-testid="discover-content" />}
        modeTourId="applications"
        {...props}
      />
    </ThemeProvider>,
  );

const runTourStep = (tourId, tabIndex, phase = 'running') => {
  fixture.tour = { tourId, phase, currentStep: { tabIndex } };
};

describe('SectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(fixture, {
      tab: 'all',
      isDiscover: false,
      showModeTabs: true,
      tour: null,
      toolbarProps: null,
    });
  });
  afterEach(() => cleanup());

  it('shows the project content on the project tab and Discover on Discover', () => {
    renderPage();
    expect(screen.getByTestId('project-content')).toBeInTheDocument();
    cleanup();
    Object.assign(fixture, { tab: 'discover', isDiscover: true });
    renderPage();
    expect(screen.getByTestId('discover-content')).toBeInTheDocument();
  });

  it('hides the filter icon on the Applications Discover only', () => {
    Object.assign(fixture, { tab: 'discover', isDiscover: true });
    renderPage();
    expect(fixture.toolbarProps.hasFilters).toBe(false);
    cleanup();
    renderPage({ sectionKey: 'agents', modeTourId: undefined });
    expect(fixture.toolbarProps.hasFilters).toBe(true);
    cleanup();
    Object.assign(fixture, { tab: 'all', isDiscover: false });
    renderPage();
    expect(fixture.toolbarProps.hasFilters).toBe(true);
  });

  it('opens the tab the page tour step points at', () => {
    runTourStep('applications', 1);
    renderPage();
    expect(fixture.onChangeTab).toHaveBeenCalledWith('discover');
    cleanup();
    vi.clearAllMocks();
    runTourStep('applications', 0);
    renderPage();
    expect(fixture.onChangeTab).toHaveBeenCalledWith('all');
  });

  it('leaves the tab alone for steps without a tab, other tours and finished tours', () => {
    runTourStep('applications', undefined);
    renderPage();
    runTourStep('elitea-catalog', 1);
    renderPage();
    runTourStep('applications', 1, 'complete');
    renderPage();
    runTourStep('applications', 1);
    renderPage({ modeTourId: undefined });
    expect(fixture.onChangeTab).not.toHaveBeenCalled();
  });

  it('does not switch tabs where the mode tabs are hidden', () => {
    fixture.showModeTabs = false;
    runTourStep('applications', 1);
    renderPage();
    expect(fixture.onChangeTab).not.toHaveBeenCalled();
  });
});
