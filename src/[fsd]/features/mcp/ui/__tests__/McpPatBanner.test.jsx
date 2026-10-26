// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, render, screen } from '@testing-library/react';

import McpPatBanner from '../McpPatBanner';

const mocks = vi.hoisted(() => ({ status: { patState: null, governed: false } }));

vi.mock('@/[fsd]/features/mcp/lib/hooks', () => ({
  useInternalMcpPatStatus: () => mocks.status,
}));

vi.mock('@/[fsd]/features/mcp/lib/constants', async () =>
  vi.importActual('@/[fsd]/features/mcp/lib/constants/patGate.constants'),
);

vi.mock('@/[fsd]/shared/ui', () => ({
  Button: { BaseBtn: ({ children, onClick }) => <button onClick={onClick}>{children}</button> },
}));

vi.mock('@/routes', () => ({ default: { CreatePersonalToken: '/settings/tokens' }, getBasename: () => '' }));

describe('McpPatBanner', () => {
  afterEach(() => {
    cleanup();
    mocks.status = { patState: null, governed: false };
  });

  it('asks for a personal token when it is missing', () => {
    mocks.status = { patState: 'MISSING', governed: false };
    render(
      <McpPatBanner
        projectId={1}
        toolkitType="mcp_elitea"
      />,
    );
    expect(screen.getByText(/personal access token is required/)).toBeTruthy();
    expect(screen.getByText('Create personal token')).toBeTruthy();
  });

  it('says no token is needed under governance, without a warning or an action (#7214)', () => {
    mocks.status = { patState: null, governed: true };
    render(
      <McpPatBanner
        projectId={1}
        toolkitType="mcp_elitea"
      />,
    );
    expect(screen.getByText(/acts with the run's own identity/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders nothing when the token is valid', () => {
    const { container } = render(
      <McpPatBanner
        projectId={1}
        toolkitType="mcp_elitea"
      />,
    );
    expect(container.textContent).toBe('');
  });
});
