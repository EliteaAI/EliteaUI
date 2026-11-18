// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import ExploreMenu from '../ExploreMenu';

const fixture = vi.hoisted(() => ({
  sections: [],
  selectedSection: null,
  navigate: vi.fn(),
}));

vi.mock('@/[fsd]/features/interactive-tours', () => ({ SIDEBAR_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/widgets/sidebar-root/lib/hooks', () => ({
  useExploreSections: () => ({ sections: fixture.sections, selectedSection: fixture.selectedSection }),
  useSidebarNavigation: () => ({
    navigateToPage: (path, breadCrumb) => event => {
      event?.preventDefault?.();
      fixture.navigate(path, breadCrumb);
    },
    getLinkTarget: path => path,
  }),
}));
vi.mock('@/[fsd]/shared/ui', async () => {
  const { forwardRef } = await import('react');
  return {
    AppLink: forwardRef((props, ref) => {
      const { to, children, onClick, ...rest } = props;
      return (
        <a
          ref={ref}
          href={to}
          onClick={onClick}
          {...rest}
        >
          {children}
        </a>
      );
    }),
  };
});
vi.mock('@/[fsd]/widgets/sidebar-root/ui/SidebarMenuItem', () => ({
  default: ({ menuTitle, onClick, selected, buttonProps }) => (
    <button
      type="button"
      data-testid="explore-item"
      data-selected={selected}
      onClick={onClick}
      {...buttonProps}
    >
      {menuTitle}
    </button>
  ),
}));

const SECTIONS = [
  { value: 'agents', label: 'Agents', url: '/agents' },
  { value: 'mcps', label: 'MCPs', url: '/mcps', breadCrumb: 'MCP' },
  { value: 'credentials', label: 'Credentials', url: '/credentials' },
];

const theme = createTheme(getDesignTokens('dark'));

const renderMenu = ({ sections = SECTIONS, selectedSection = null } = {}) => {
  fixture.sections = sections;
  fixture.selectedSection = selectedSection;
  return render(
    <ThemeProvider theme={theme}>
      <ExploreMenu />
    </ThemeProvider>,
  );
};

const list = () => screen.queryByTestId('sidebar-explore-menu');

describe('ExploreMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders nothing when no section is available', () => {
    renderMenu({ sections: [] });
    expect(screen.queryByTestId('sidebar-explore')).toBeNull();
  });

  it('opens on hover and stays open while the pointer moves onto the list', () => {
    renderMenu();
    fireEvent.mouseEnter(screen.getByTestId('sidebar-explore'));
    expect(list()).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByTestId('sidebar-explore'));
    fireEvent.mouseEnter(list());
    act(() => vi.advanceTimersByTime(500));
    expect(list()).toBeInTheDocument();
  });

  it('closes 200 ms after the pointer leaves', () => {
    renderMenu();
    fireEvent.mouseEnter(screen.getByTestId('sidebar-explore'));
    fireEvent.mouseLeave(screen.getByTestId('sidebar-explore'));
    act(() => vi.advanceTimersByTime(199));
    expect(list()).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(list()).toBeNull();
  });

  it('opens on click, stays open on a click after the hover, and closes on Escape', () => {
    renderMenu();
    const item = screen.getByTestId('explore-item');
    fireEvent.click(item);
    expect(item).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(item, { key: 'Escape' });
    expect(list()).toBeNull();

    fireEvent.mouseEnter(screen.getByTestId('sidebar-explore'));
    fireEvent.click(item);
    expect(list()).toBeInTheDocument();
  });

  it('moves focus into the list when opened from the keyboard, but not on a mouse click', () => {
    renderMenu();
    const item = screen.getByTestId('explore-item');
    fireEvent.click(item, { detail: 1 });
    expect(screen.getByTestId('sidebar-explore-agents')).not.toHaveFocus();

    fireEvent.click(item, { detail: 0 });
    expect(screen.getByTestId('sidebar-explore-agents')).toHaveFocus();
  });

  it('returns focus to Explore on Escape and on Tab from the list', () => {
    renderMenu();
    const item = screen.getByTestId('explore-item');
    fireEvent.click(item, { detail: 0 });
    fireEvent.keyDown(screen.getByTestId('sidebar-explore-agents'), { key: 'Escape' });
    expect(list()).toBeNull();
    expect(item).toHaveFocus();

    fireEvent.click(item, { detail: 0 });
    fireEvent.keyDown(screen.getByTestId('sidebar-explore-agents'), { key: 'Tab' });
    expect(list()).toBeNull();
    expect(item).toHaveFocus();
  });

  it('closes on a click outside', () => {
    renderMenu();
    fireEvent.click(screen.getByTestId('explore-item'));
    act(() => vi.advanceTimersByTime(0));
    fireEvent.click(document.body);
    expect(list()).toBeNull();
  });

  it('renders the sections in order as real links', () => {
    renderMenu();
    fireEvent.click(screen.getByTestId('explore-item'));
    const links = screen.getAllByRole('menuitem');
    expect(links.map(link => link.textContent)).toEqual(['Agents', 'MCPs', 'Credentials']);
    expect(links.map(link => link.getAttribute('href'))).toEqual(['/agents', '/mcps', '/credentials']);
  });

  it('navigates through the guarded sidebar navigation and closes', () => {
    renderMenu();
    fireEvent.click(screen.getByTestId('explore-item'));
    fireEvent.click(screen.getByTestId('sidebar-explore-mcps'));
    expect(fixture.navigate).toHaveBeenCalledWith('/mcps', 'MCP');
    expect(list()).toBeNull();
  });

  it('selects Explore and the open section', () => {
    renderMenu({ selectedSection: 'agents' });
    expect(screen.getByTestId('explore-item')).toHaveAttribute('data-selected', 'true');
    fireEvent.click(screen.getByTestId('explore-item'));
    expect(screen.getByTestId('sidebar-explore-agents')).toHaveClass('Mui-selected');
    expect(screen.getByTestId('sidebar-explore-mcps')).not.toHaveClass('Mui-selected');
  });
});
