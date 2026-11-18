// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { dateFormatter } from '@/[fsd]/features/settings/lib/helpers/dateFormatter.helpers';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import Profile from '../Profile';

const { user } = vi.hoisted(() => ({ user: { current: {} } }));

vi.mock('react-redux', () => ({
  useDispatch: () => vi.fn(),
  useSelector: selector => selector({ user: user.current }),
}));
vi.mock('@/slices/user.js', () => ({ logout: vi.fn() }));
vi.mock('@/components/UserAvatar', () => ({ default: () => null }));
vi.mock('@/[fsd]/shared/ui/button', () => ({ BaseBtn: ({ children }) => <button>{children}</button> }));
vi.mock('@/[fsd]/features/settings/ui/ai-providers/FieldWithCopy', () => ({
  default: ({ label, value }) => (
    <div data-testid="field">
      {label}
      {value}
    </div>
  ),
}));

const theme = createTheme({ palette: lightPalette });

const FIRST_LOGIN = '2026-07-13T09:18:11';
const LAST_LOGIN = '2026-11-10T01:03:25';

const renderProfile = state => {
  user.current = { name: 'Ann', email: 'ann@example.com', id: 3, ...state };
  return render(
    <ThemeProvider theme={theme}>
      <Profile />
    </ThemeProvider>,
  );
};

const labels = () => screen.getAllByTestId('field').map(field => field.textContent);

describe('Profile first login (#7490)', () => {
  afterEach(cleanup);

  it('shows First login directly above Last login', () => {
    renderProfile({ first_login: FIRST_LOGIN, last_login: LAST_LOGIN });

    const fields = labels();
    const first = fields.findIndex(text => text.startsWith('First login:'));
    expect(first).toBeGreaterThan(-1);
    expect(fields[first + 1]).toMatch(/^Last login:/);
  });

  it('formats First login with the Last login formatter', () => {
    renderProfile({ first_login: FIRST_LOGIN, last_login: LAST_LOGIN });

    expect(labels()).toContain(`First login:${dateFormatter(FIRST_LOGIN)}`);
    expect(labels()).toContain(`Last login:${dateFormatter(LAST_LOGIN)}`);
  });

  it.each([null, undefined, ''])('shows a dash, not Last login, when First login is %s', value => {
    renderProfile({ first_login: value, last_login: LAST_LOGIN });

    const fields = labels();
    expect(fields).toContain('First login:—');
    expect(fields).not.toContain(`First login:${dateFormatter(LAST_LOGIN)}`);
    expect(fields).toContain(`Last login:${dateFormatter(LAST_LOGIN)}`);
  });

  it('still shows First login above Last login when it is missing', () => {
    renderProfile({ first_login: null, last_login: LAST_LOGIN });

    const fields = labels();
    expect(fields[fields.indexOf('First login:—') + 1]).toMatch(/^Last login:/);
  });
});
