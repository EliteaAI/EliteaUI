// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useIsOwnPersonalProject, useIsScheduleAdmin } from '../useIsScheduleAdmin.hooks';

const mocks = vi.hoisted(() => ({ isAdmin: false, projectId: 5, personalProjectId: undefined }));

vi.mock('react-redux', () => ({
  useSelector: selector => selector({ user: { personal_project_id: mocks.personalProjectId } }),
}));
vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({
  useSelectedProjectId: () => mocks.projectId,
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: () => mocks.isAdmin }),
}));

describe('useIsScheduleAdmin', () => {
  afterEach(() => {
    cleanup();
    Object.assign(mocks, { isAdmin: false, projectId: 5, personalProjectId: undefined });
  });

  it('allows a project admin', () => {
    mocks.isAdmin = true;
    const { result } = renderHook(() => useIsScheduleAdmin());
    expect(result.current).toBe(true);
  });

  it('allows a non-admin in their own personal project', () => {
    mocks.personalProjectId = 5;
    const { result } = renderHook(() => useIsScheduleAdmin());
    expect(result.current).toBe(true);
  });

  it('blocks a non-admin in a team project', () => {
    mocks.personalProjectId = 99;
    const { result } = renderHook(() => useIsScheduleAdmin());
    expect(result.current).toBe(false);
  });

  it('blocks a non-admin when the user has no personal project', () => {
    const { result } = renderHook(() => useIsScheduleAdmin());
    expect(result.current).toBe(false);
  });
});

describe('useIsOwnPersonalProject', () => {
  afterEach(() => {
    cleanup();
    Object.assign(mocks, { isAdmin: false, projectId: 5, personalProjectId: undefined });
  });

  it('is true when the selected project is the personal project, compared as strings', () => {
    mocks.projectId = '5';
    mocks.personalProjectId = 5;
    const { result } = renderHook(() => useIsOwnPersonalProject());
    expect(result.current).toBe(true);
  });

  it('is false in another project, and false for an admin of a team project', () => {
    mocks.isAdmin = true;
    mocks.personalProjectId = 99;
    const { result } = renderHook(() => useIsOwnPersonalProject());
    expect(result.current).toBe(false);
  });
});
