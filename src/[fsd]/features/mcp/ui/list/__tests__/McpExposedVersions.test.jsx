// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import McpExposedVersions from '../McpExposedVersions';

const fixture = vi.hoisted(() => ({ settings: {}, versions: vi.fn() }));

vi.mock('@/api/platformSettings', () => ({
  useGetPlatformSettingsQuery: () => ({ data: fixture.settings }),
}));
vi.mock('@/[fsd]/features/project-governance/api/projectGovernanceApi', () => ({
  useGetMcpExposedVersionsQuery: (...args) => fixture.versions(...args),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useSelectedProjectId: () => 12 }));

const ROWS = {
  rows: [{ application_id: 7, application_name: 'Jira helper', version_name: 'v2', rule: 'bound' }],
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

  it('names the version each agent exposes while governance is enforced', () => {
    fixture.settings = { governance_enforced: true };
    fixture.versions.mockReturnValue({ data: ROWS });
    render(<McpExposedVersions />);
    expect(screen.getByTestId('mcp-exposed-version-7')).toHaveTextContent(
      'Jira helper — v2 (its approved identity)',
    );
  });
});
