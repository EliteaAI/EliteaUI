// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import getDesignTokens from '@/MainTheme';
import { SIDEBAR_COLLAPSE_STATE_KEY } from '@/[fsd]/widgets/sidebar-root/lib/constants/sidebar.constants';
import { actions as settingsActions } from '@/slices/settings';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import ResourcesButton from '../ResourcesButton';

const fixture = vi.hoisted(() => ({ navigate: vi.fn(), dispatch: vi.fn(), isOnHelpCenter: false }));

vi.mock('react-redux', () => ({ useDispatch: () => fixture.dispatch }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => fixture.navigate,
  useLocation: () => ({ pathname: '/chat/5' }),
  useMatch: () => (fixture.isOnHelpCenter ? {} : null),
}));
vi.mock('@/[fsd]/features/interactive-tours', () => ({ SIDEBAR_TOUR_TARGET_IDS: {} }));
vi.mock('@/[fsd]/shared/ui', () => ({
  AppLink: ({ to, onClick, children, className }) => (
    <a
      href={to}
      onClick={onClick}
      className={className}
      data-testid="help-link"
    >
      {children}
    </a>
  ),
}));
vi.mock('@/ComponentsLib/Tooltip', () => ({ default: ({ children }) => children }));

const theme = createTheme(getDesignTokens('dark'));

const clickHelp = ({ isOnHelpCenter = false } = {}) => {
  fixture.isOnHelpCenter = isOnHelpCenter;
  render(
    <ThemeProvider theme={theme}>
      <ResourcesButton />
    </ThemeProvider>,
  );
  fireEvent.click(screen.getByTestId('help-link'));
};

describe('ResourcesButton', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('opens the Help Center with a collapse id, so the menu folds once it lands', () => {
    clickHelp();
    const [path, { state }] = fixture.navigate.mock.calls[0];
    expect(path).toBe('/help-center');
    expect(state.from).toBe('/chat/5');
    expect(state[SIDEBAR_COLLAPSE_STATE_KEY]).toEqual(expect.any(Number));
    expect(fixture.dispatch).not.toHaveBeenCalled();
  });

  it('folds the menu right away when already on the Help Center', () => {
    clickHelp({ isOnHelpCenter: true });
    expect(fixture.navigate).not.toHaveBeenCalled();
    expect(fixture.dispatch).toHaveBeenCalledWith(settingsActions.setSideBarCollapsed(true));
  });
});
