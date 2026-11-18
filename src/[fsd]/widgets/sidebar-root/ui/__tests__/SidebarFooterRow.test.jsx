// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SidebarFooterRow from '../SidebarFooterRow';

const fixture = vi.hoisted(() => ({ collapsed: false }));

vi.mock('react-redux', () => ({
  useSelector: select => select({ settings: { sideBarCollapsed: fixture.collapsed } }),
}));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ SIDEBAR_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/widgets/sidebar-root/lib/hooks', () => ({
  useSidebarNavigation: () => ({ navigateToPage: () => () => {} }),
}));
vi.mock('@/[fsd]/widgets/sidebar-root/ui/button/SettingsButton', () => ({
  default: () => <span data-testid="settings-button" />,
}));
vi.mock('@/[fsd]/widgets/sidebar-root/ui/button/ResourcesButton', () => ({
  default: ({ cell }) => (
    <span
      data-testid="help-button"
      data-cell={!!cell}
    />
  ),
}));

const theme = createTheme(getDesignTokens('dark'));

const renderRow = ({ collapsed = false, onToggleAssistant } = {}) => {
  fixture.collapsed = collapsed;
  return render(
    <ThemeProvider theme={theme}>
      <SidebarFooterRow onToggleAssistant={onToggleAssistant} />
    </ThemeProvider>,
  );
};

describe('SidebarFooterRow', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('shows Settings, Help and the Support Assistant cell in one row', () => {
    renderRow({ onToggleAssistant: vi.fn() });
    const row = screen.getByTestId('sidebar-footer-row');
    expect(row).toContainElement(screen.getByTestId('settings-button'));
    expect(row).toContainElement(screen.getByTestId('help-button'));
    expect(row).toContainElement(screen.getByRole('button', { name: 'Support Assistant' }));
    expect(screen.getByTestId('help-button')).toHaveAttribute('data-cell', 'true');
  });

  it('leaves the assistant cell out when the assistant is disabled', () => {
    renderRow();
    expect(screen.queryByTestId('sidebar-support-assistant')).toBeNull();
    expect(screen.getByTestId('settings-button')).toBeInTheDocument();
  });

  it('toggles the assistant on click, Enter and Space', () => {
    const onToggleAssistant = vi.fn();
    renderRow({ onToggleAssistant });
    const cell = screen.getByTestId('sidebar-support-assistant');
    fireEvent.click(cell);
    fireEvent.keyDown(cell, { key: 'Enter' });
    fireEvent.keyDown(cell, { key: ' ' });
    fireEvent.keyDown(cell, { key: 'a' });
    expect(onToggleAssistant).toHaveBeenCalledTimes(3);
  });

  it('stacks Settings and Help above the assistant cell when collapsed', () => {
    renderRow({ collapsed: true, onToggleAssistant: vi.fn() });
    expect(screen.queryByTestId('sidebar-footer-row')).toBeNull();
    expect(screen.getByTestId('settings-button')).toBeInTheDocument();
    expect(screen.getByTestId('help-button')).toHaveAttribute('data-cell', 'false');
    expect(screen.getByRole('button', { name: 'Support Assistant' })).toBeInTheDocument();
  });
});
