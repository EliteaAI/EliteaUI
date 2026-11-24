// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import SettingsButton from '../SettingsButton';

vi.mock('react-router-dom', () => ({ useMatch: () => null }));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ SIDEBAR_TOUR_TARGET_IDS: {} }));
vi.mock('@/assets/gear-icon.svg?react', () => ({ default: () => null }));
vi.mock('../SidebarButton', () => ({
  default: ({ to, onClick }) => (
    <a
      href={to}
      onClick={onClick}
      data-testid="settings-link"
    />
  ),
}));

describe('SettingsButton', () => {
  afterEach(cleanup);

  it('opens Settings and asks to fold the menu', () => {
    const open = vi.fn();
    const navigateToPage = vi.fn(() => open);
    render(<SettingsButton navigateToPage={navigateToPage} />);
    fireEvent.click(screen.getByTestId('settings-link'));
    expect(navigateToPage).toHaveBeenCalledWith('/settings/project-general', 'Settings', {
      collapseSidebar: true,
    });
    expect(open).toHaveBeenCalled();
  });
});
