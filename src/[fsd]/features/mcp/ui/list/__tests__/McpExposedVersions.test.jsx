// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import McpExposedVersions from '../McpExposedVersions';

const fixture = vi.hoisted(() => ({ settings: {}, versions: vi.fn() }));

vi.mock('@/api/platformSettings', () => ({
  useGetPlatformSettingsQuery: () => ({ data: fixture.settings }),
}));
vi.mock('@/[fsd]/features/project-governance', () => ({
  useGetMcpExposedVersionsQuery: (...args) => fixture.versions(...args),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 12 }));

const ROWS = {
  rows: [
    {
      application_id: 7,
      application_name: 'Jira helper',
      version_id: 70,
      version_name: 'base',
      rule: 'bound',
    },
    { application_id: 7, application_name: 'Jira helper', version_id: 71, version_name: 'v2', rule: 'bound' },
  ],
};

describe('the MCP exposed versions line (EL-7269, #7341)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('is not shown, and nothing is read, while credential governance is off or audit only', () => {
    fixture.settings = {};
    fixture.versions.mockReturnValue({ data: ROWS });
    render(<McpExposedVersions />);
    expect(screen.queryByTestId('mcp-exposed-versions')).toBeNull();
    expect(fixture.versions).toHaveBeenCalledWith({ projectId: 12 }, { skip: true });
  });

  it('names every version an agent exposes while governance is enforced, one row each (#1597)', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fixture.settings = { governance_enforced: true };
    fixture.versions.mockReturnValue({ data: ROWS });
    render(<McpExposedVersions />);
    expect(screen.getByTestId('mcp-exposed-version-70')).toHaveTextContent(
      'Jira helper — base (its approved identity)',
    );
    expect(screen.getByTestId('mcp-exposed-version-71')).toHaveTextContent(
      'Jira helper — v2 (its approved identity)',
    );
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
