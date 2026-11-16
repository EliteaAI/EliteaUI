// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { state, runHistoryArgs } = vi.hoisted(() => ({
  state: {
    isFromPipeline: false,
    viewMode: 'owner',
    id: 7,
    versionCount: 0,
    isPrivate: true,
    canUpdate: true,
    publicApplicationId: null,
    publicArgs: { current: null },
  },
  runHistoryArgs: { current: null },
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: {
      id: state.id,
      versions: Array.from({ length: state.versionCount }, (_, index) => ({ id: index + 1 })),
      meta: {},
      version_details: { id: 3, name: 'base' },
    },
  }),
}));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ search: '' }),
  useNavigate: () => vi.fn(),
  useParams: () => ({ tab: 'all', agentId: '7' }),
}));
vi.mock('@/[fsd]/entities/compare-versions', () => ({
  COMPARE_ENTITY_TYPES: { agent: 'agent', pipeline: 'pipeline' },
  COMPARE_MODES: { versions: 'versions', public: 'public' },
  CompareVersionsModal: props =>
    props.mode === 'public' ? <div data-testid="compare-public-modal" /> : null,
}));
vi.mock('@/[fsd]/entities/schedule', () => ({
  buildScheduleFormLink: vi.fn(),
  useOpenScheduleNested: () => vi.fn(),
}));
vi.mock('@/pages/Pipelines/useIsPipelineYamlCodeDirty', () => ({ default: () => false }));
vi.mock('@/[fsd]/entities/version', () => ({
  LATEST_VERSION_NAME: 'base',
  VersionDelete: () => null,
  usePublishApplicationMenu: () => ({}),
  useSetDefaultVersion: () => ({ handleSetDefaultVersion: vi.fn() }),
  useUnpublishVersionMenu: () => ({}),
}));
vi.mock('@/[fsd]/features/agent/lib/hooks', () => ({
  useCompareAgentVersions: () => ({}),
  useComparePublicAgentVersions: args => {
    state.publicArgs.current = args;
    return {
      publicApplicationId: state.publicApplicationId,
      publicVersions: [],
      isLoadingPublicVersions: false,
      publicLoadError: '',
      loadVersions: vi.fn(),
    };
  },
}));
vi.mock('@/[fsd]/shared/lib/constants', () => ({
  PinEntityConstants: { PinEntityType: { Application: 'application' } },
  TourTargetConstants: { AGENT_TOUR_TARGET_IDS: { actionsMenu: 'agent-actions-menu' } },
}));
vi.mock('@/[fsd]/shared/lib/context', () => ({ useInstructionsInputRefContext: () => ({ current: null }) }));
vi.mock('@/[fsd]/shared/lib/helpers', () => ({ NavigationHelpers: { buildRoute: vi.fn() } }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useFormDirtyExcluding: () => false,
  useIsFromPipelineDetail: () => state.isFromPipeline,
  useIsPipelineLayoutDirty: () => false,
  useProjectEntityLink: () => ({}),
  useProjectType: () => ({ isPrivate: state.isPrivate }),
  useRunHistoryNavigation: args => {
    runHistoryArgs.current = args;
    return { runHistoryPath: '/agents/all/7/history?versionId=3' };
  },
  useSelectedProjectId: () => 2,
  useViewMode: () => state.viewMode,
}));
vi.mock('@/[fsd]/shared/ui', () => ({
  Controls: {
    ControlsDropdown: ({ menuItems }) => (
      <ul data-testid="menu">
        {menuItems.map(item => (
          <li
            key={item.key}
            data-key={item.key}
            data-to={typeof item.to === 'string' ? item.to : item.to?.pathname}
            onClick={item.onClick}
          >
            {typeof item.label === 'string' ? item.label : item.key}
          </li>
        ))}
      </ul>
    ),
  },
}));
vi.mock('@/[fsd]/shared/ui/icon', () => ({ EvaluateIcon: () => null, RunHistoryIcon: () => null }));
vi.mock('@/[fsd]/widgets/pin-toggler/lib/hooks', () => ({
  usePin: () => ({}),
  usePinMenu: () => ({ pinMenuItem: { key: 'pin', label: 'Pin to top' } }),
}));
vi.mock('@/common/constants', () => ({
  PERMISSIONS: {
    applications: { export: 'export', update: 'update', delete: 'delete' },
    schedules: { list: 'schedules.list', admin: 'schedules.admin' },
    versions: {},
  },
  ViewMode: { Public: 'public', Owner: 'owner' },
}));
vi.mock('@/components/CopyLinkToEntityButton.jsx', () => ({
  useCopyLinkMenu: ({ key, label }) => ({ copyLinkMenuItem: { key, label } }),
}));
vi.mock('@/components/Fork/ForkEntityButton', () => ({ useForkEntityMenu: () => ({}) }));
vi.mock('@/components/Icons/DeleteIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/DifferenceIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/PinIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useCheckPermission', () => ({
  default: () => ({ checkPermission: permission => permission !== 'update' || state.canUpdate }),
}));
vi.mock('@/pages/Applications/Components/Applications/DeleteApplicationButton', () => ({
  useDeleteApplicationMenu: () => ({ deleteApplicationMenuItem: { key: 'delete-agent' } }),
}));
vi.mock('@/pages/Applications/Components/Applications/ExportApplicationButton', () => ({
  useExportApplicationMenu: () => ({ exportApplicationMenuItem: { key: 'export', label: 'Export' } }),
}));
vi.mock('@/pages/Common', () => ({ AuthorsButton: () => null }));
vi.mock('@/routes', () => ({
  default: {
    ApplicationsRunHistory: '/agents/:tab/:agentId/history',
    PipelineRunHistory: '/pipelines/:tab/:agentId/history',
  },
}));

const { default: ApplicationControls } = await import('../ApplicationControls');

const theme = createTheme({ palette: darkPalette });

const renderControls = () =>
  render(
    <ThemeProvider theme={theme}>
      <ApplicationControls />
    </ThemeProvider>,
  );

const menuKeys = () => [...screen.getByTestId('menu').querySelectorAll('li')].map(el => el.dataset.key);

describe('ApplicationControls Run History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.isFromPipeline = false;
    state.viewMode = 'owner';
    state.id = 7;
    state.versionCount = 0;
    state.isPrivate = true;
    state.canUpdate = true;
  });
  afterEach(() => cleanup());

  it.each([
    ['agent', false, '/agents/:tab/:agentId/history'],
    ['pipeline', true, '/pipelines/:tab/:agentId/history'],
  ])('sits right before the %s delete action and opens its history', (_, isFromPipeline, route) => {
    state.isFromPipeline = isFromPipeline;
    renderControls();

    const keys = menuKeys();
    expect(keys.indexOf('run-history')).toBe(keys.indexOf('delete-agent') - 1);
    expect(runHistoryArgs.current).toMatchObject({ entityId: 7, historyRoute: route });

    // Navigation-only item: a link target (so it can open in a new tab), not a click handler
    const item = screen.getByText('Run History');
    expect(item).toHaveAttribute('data-to', '/agents/all/7/history?versionId=3');
  });

  it('is hidden for an unsaved entity and in public view', () => {
    state.id = undefined;
    const { unmount } = renderControls();
    expect(menuKeys()).not.toContain('run-history');
    unmount();

    state.id = 7;
    state.viewMode = 'public';
    renderControls();
    expect(menuKeys()).not.toContain('run-history');
  });
});

describe('ApplicationControls Compare versions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.isFromPipeline = true;
    state.viewMode = 'owner';
    state.id = 7;
    state.versionCount = 2;
    state.isPrivate = true;
    state.canUpdate = true;
  });
  afterEach(() => cleanup());

  it.each([
    ['in a private project', true, false, true],
    ['for a team editor with applications.update', false, true, true],
    ['for a team viewer without applications.update', false, false, false],
  ])('is shown for a pipeline %s: %s', (_, isPrivate, canUpdate, isShown) => {
    state.isPrivate = isPrivate;
    state.canUpdate = canUpdate;
    renderControls();
    expect(menuKeys().includes('compare-versions')).toBe(isShown);
  });

  it('is hidden for a pipeline with a single version', () => {
    state.versionCount = 1;
    renderControls();
    expect(menuKeys()).not.toContain('compare-versions');
  });

  it('sits after the share link item, as for agents', () => {
    renderControls();
    const keys = menuKeys();
    expect(keys).toContain('compare-versions');
    expect(keys.indexOf('compare-versions')).toBeGreaterThan(keys.indexOf('export'));
  });
});

describe('ApplicationControls Compare to public version', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.isFromPipeline = false;
    state.viewMode = 'owner';
    state.id = 7;
    state.versionCount = 1;
    state.isPrivate = true;
    state.publicApplicationId = 12;
    state.publicArgs.current = null;
  });
  afterEach(() => {
    state.publicApplicationId = null;
    cleanup();
  });

  it('is offered for an agent forked from a public agent, in the version section', () => {
    renderControls();
    const keys = menuKeys();
    expect(keys).toContain('compare-to-public-version');
    expect(keys.indexOf('compare-to-public-version')).toBeLessThan(keys.indexOf('agent'));
    expect(screen.getByText('Compare to public version')).toBeInTheDocument();
  });

  it('is offered even when the agent has a single version', () => {
    state.versionCount = 1;
    renderControls();
    expect(menuKeys()).not.toContain('compare-versions');
    expect(menuKeys()).toContain('compare-to-public-version');
  });

  it.each([
    ['an agent that is not forked from a public agent', () => (state.publicApplicationId = null)],
    ['a pipeline', () => (state.isFromPipeline = true)],
    ['the public view', () => (state.viewMode = 'public')],
    ['an agent that is not saved yet', () => (state.id = undefined)],
  ])('is not offered for %s', (_, arrange) => {
    arrange();
    renderControls();
    expect(menuKeys()).not.toContain('compare-to-public-version');
  });

  it('loads the public versions only while the dialog is open', () => {
    renderControls();
    expect(state.publicArgs.current.open).toBe(false);
    expect(screen.queryByTestId('compare-public-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Compare to public version'));
    expect(state.publicArgs.current.open).toBe(true);
    expect(screen.getByTestId('compare-public-modal')).toBeInTheDocument();
  });

  it('tells the hook which agent and which version it is looking at', () => {
    renderControls();
    expect(state.publicArgs.current).toMatchObject({ projectId: 2, applicationId: 7 });
  });
});
