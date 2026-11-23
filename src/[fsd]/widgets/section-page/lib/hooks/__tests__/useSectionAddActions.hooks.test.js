// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '@/common/constants';
import { act, cleanup, renderHook } from '@testing-library/react';

import { useSectionAddActions } from '../useSectionAddActions.hooks';

const fixture = vi.hoisted(() => ({
  navigate: vi.fn(),
  openFileDialog: vi.fn(),
  openSkillFileDialog: vi.fn(),
  permissions: [],
  isPublic: false,
  personalProjectId: 5,
  projects: [{ id: 1 }, { id: 5 }],
}));

vi.mock('react-redux', () => ({
  useSelector: select =>
    select({
      user: { personal_project_id: fixture.personalProjectId },
      settings: { projects: fixture.projects },
    }),
}));
vi.mock('react-router-dom', () => ({ useNavigate: () => fixture.navigate }));
vi.mock('@/[fsd]/entities/import-wizard/lib/hooks', () => ({
  useImport: () => ({ openFileDialog: fixture.openFileDialog }),
}));
vi.mock('@/[fsd]/features/skill/lib/hooks', () => ({
  useSkillImport: () => ({ openFileDialog: fixture.openSkillFileDialog }),
}));
vi.mock('@/[fsd]/features/pipelines/ai-edit-pipeline', () => ({
  AiEditPipelineConstants: { OPEN_BUILD_WITH_AI_STATE_KEY: 'openBuildWithAI' },
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useProjectType: () => ({ isPublic: fixture.isPublic }),
}));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => fixture.permissions.includes(permission) }),
}));

const ALL = [PERMISSIONS.applications.create, PERMISSIONS.applications.update, PERMISSIONS.toolkits.create];

const renderActions = (sectionKey, overrides = {}) => {
  Object.assign(fixture, {
    permissions: ALL,
    isPublic: false,
    personalProjectId: 5,
    projects: [{ id: 1 }, { id: 5 }],
    ...overrides,
  });
  return renderHook(() => useSectionAddActions(sectionKey)).result;
};

describe('useSectionAddActions', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('opens the create page with the list and the create page in the route stack', () => {
    renderActions('agents').current.onNew();
    expect(fixture.navigate).toHaveBeenCalledWith(
      { pathname: '/agents/create', search: 'viewMode=owner' },
      {
        state: {
          routeStack: [
            { breadCrumb: 'Agents', pagePath: '/agents/all?viewMode=owner' },
            { breadCrumb: 'New Agent', viewMode: 'owner', pagePath: '/agents/create?viewMode=owner' },
          ],
        },
      },
    );
  });

  it('imports agents and pipelines through the import wizard and skills through the skill import', () => {
    renderActions('pipelines').current.onImport();
    expect(fixture.openFileDialog).toHaveBeenCalledTimes(1);
    renderActions('skills').current.onImport();
    expect(fixture.openSkillFileDialog).toHaveBeenCalledTimes(1);
  });

  it('opens the agent window on the page', () => {
    const result = renderActions('agents');
    act(() => result.current.onBuildWithAi());
    expect(result.current.isBuildWithAiOpen).toBe(true);
    expect(fixture.navigate).not.toHaveBeenCalled();
    act(() => result.current.onCloseBuildWithAi());
    expect(result.current.isBuildWithAiOpen).toBe(false);
  });

  it('opens the pipeline window on the create page', () => {
    const result = renderActions('pipelines');
    act(() => result.current.onBuildWithAi());
    expect(result.current.isBuildWithAiOpen).toBe(false);
    const [target, { state }] = fixture.navigate.mock.calls[0];
    expect(target.pathname).toBe('/pipelines/create');
    expect(state.openBuildWithAI).toBe(true);
  });

  it('follows the permissions', () => {
    const result = renderActions('agents', { permissions: [PERMISSIONS.applications.create] });
    expect(result.current.canCreate).toBe(true);
    expect(result.current.canBuildWithAi).toBe(false);
  });

  it('offers Import only to a user with a project other than Public', () => {
    expect(renderActions('agents', { projects: [{ id: 1 }] }).current.canImport).toBe(false);
  });

  it('creates nothing in Public for a user without a personal project', () => {
    const result = renderActions('agents', { isPublic: true, personalProjectId: null });
    expect(result.current.canCreate).toBe(false);
    expect(result.current.canBuildWithAi).toBe(false);
  });

  it.each([
    ['toolkits', '/toolkits/create', 'Toolkits & Indexes', '/toolkits/all', 'New Toolkit'],
    ['mcps', '/mcps/create', 'MCPs', '/mcps/all', 'New MCP'],
    ['credentials', '/credentials/create-credential', 'Credentials', '/credentials/all', 'New Credential'],
  ])(
    'opens the %s create page with its route stack',
    (sectionKey, createPath, listLabel, listPath, newLabel) => {
      renderActions(sectionKey).current.onNew();
      expect(fixture.navigate).toHaveBeenCalledWith(
        { pathname: createPath, search: 'viewMode=owner' },
        {
          state: {
            routeStack: [
              { breadCrumb: listLabel, pagePath: `${listPath}?viewMode=owner` },
              { breadCrumb: newLabel, viewMode: 'owner', pagePath: `${createPath}?viewMode=owner` },
            ],
          },
        },
      );
    },
  );

  it('offers neither Import nor Build with AI on Toolkits, MCPs and Credentials', () => {
    ['toolkits', 'mcps', 'credentials'].forEach(sectionKey => {
      const result = renderActions(sectionKey);
      expect(result.current.canImport).toBe(false);
      expect(result.current.canBuildWithAi).toBe(false);
    });
  });

  it('creates toolkits and MCPs only with the toolkit create permission', () => {
    const permissions = [PERMISSIONS.applications.create];
    expect(renderActions('toolkits', { permissions }).current.canCreate).toBe(false);
    expect(renderActions('mcps', { permissions }).current.canCreate).toBe(false);
    expect(renderActions('mcps', { permissions: [PERMISSIONS.toolkits.create] }).current.canCreate).toBe(
      true,
    );
    expect(renderActions('agents', { permissions: [PERMISSIONS.toolkits.create] }).current.canCreate).toBe(
      false,
    );
  });

  it('creates credentials without a permission, except in Public without a personal project', () => {
    expect(renderActions('credentials', { permissions: [] }).current.canCreate).toBe(true);
    expect(
      renderActions('credentials', { permissions: [], isPublic: true, personalProjectId: null }).current
        .canCreate,
    ).toBe(false);
  });
});
