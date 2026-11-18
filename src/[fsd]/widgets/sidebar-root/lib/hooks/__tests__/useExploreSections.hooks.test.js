// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import { cleanup, renderHook } from '@testing-library/react';

import { useExploreSections } from '../useExploreSections.hooks';

const fixture = vi.hoisted(() => ({
  permissions: [],
  projectId: 2,
  isMcpVisible: true,
  pathname: '/chat',
}));

vi.mock('react-redux', () => ({
  useSelector: select =>
    select({
      settings: { project: { id: fixture.projectId } },
      user: { permissions: fixture.permissions },
    }),
}));
vi.mock('react-router-dom', () => ({ useLocation: () => ({ pathname: fixture.pathname }) }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({ useIsMcpVisible: () => fixture.isMcpVisible }));

const ALL_PERMISSIONS = [
  PERMISSIONS.applications.list,
  PERMISSIONS.pipelines.list,
  PERMISSIONS.toolkits.list,
  PERMISSIONS.skills.publish,
];

const sectionValues = ({
  permissions = ALL_PERMISSIONS,
  projectId = 2,
  isMcpVisible = true,
  pathname,
} = {}) => {
  Object.assign(fixture, { permissions, projectId, isMcpVisible, pathname: pathname ?? '/chat' });
  return renderHook(() => useExploreSections()).result.current;
};

describe('useExploreSections', () => {
  afterEach(cleanup);

  it('lists every section in order, Credentials last', () => {
    expect(sectionValues().sections.map(section => section.value)).toEqual([
      'agents',
      'pipelines',
      'skills',
      'toolkits',
      'mcps',
      'applications',
      'credentials',
    ]);
  });

  it('hides MCPs when the platform hides them from the menu', () => {
    expect(sectionValues({ isMcpVisible: false }).sections.map(s => s.value)).not.toContain('mcps');
  });

  it('hides Skills in the public project without the publish permission', () => {
    const permissions = ALL_PERMISSIONS.filter(p => p !== PERMISSIONS.skills.publish);
    expect(
      sectionValues({ permissions, projectId: PUBLIC_PROJECT_ID }).sections.map(s => s.value),
    ).not.toContain('skills');
    expect(sectionValues({ permissions }).sections.map(s => s.value)).toContain('skills');
  });

  it('gates agents, pipelines, toolkits, MCPs and credentials by their permission groups', () => {
    expect(sectionValues({ permissions: [] }).sections.map(s => s.value)).toEqual(['skills', 'applications']);
  });

  it('marks the section whose page is open', () => {
    expect(sectionValues({ pathname: '/pipelines/all/7' }).selectedSection).toBe('pipelines');
    expect(sectionValues({ pathname: '/artifacts' }).selectedSection).toBeNull();
  });
});
