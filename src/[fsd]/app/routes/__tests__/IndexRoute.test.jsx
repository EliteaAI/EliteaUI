// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

const fixture = vi.hoisted(() => ({ user: {} }));

vi.mock('react-redux', () => ({ useSelector: selector => selector({ user: fixture.user }) }));
vi.mock('react-router-dom', () => ({
  Navigate: props => (
    <div
      data-testid="navigate"
      data-to={props.to}
      data-replace={String(props.replace)}
    />
  ),
}));
vi.mock('@/routes', () => ({ default: { Chat: '/chat', Onboarding: '/onboarding' } }));

const { default: IndexRoute } = await import('../IndexRoute');

describe('IndexRoute', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('shows the loader while the user is loading', () => {
    fixture.user = {};
    render(<IndexRoute />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
  });

  it('keeps the loader on screen while it redirects to the chat', () => {
    fixture.user = { id: 1, personal_project_id: 7 };
    render(<IndexRoute />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/chat');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
  });

  it('redirects to onboarding without a personal project, with the loader', () => {
    fixture.user = { id: 1, personal_project_id: null };
    render(<IndexRoute />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/onboarding');
  });
});
