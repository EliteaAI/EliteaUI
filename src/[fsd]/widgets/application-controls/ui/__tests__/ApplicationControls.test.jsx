// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import darkPalette from '@/darkPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { state, goToRunHistory, runHistoryArgs } = vi.hoisted(() => ({
  state: { isFromPipeline: false, viewMode: 'owner', id: 7 },
  goToRunHistory: vi.fn(),
  runHistoryArgs: { current: null },
}));

vi.mock('formik', () => ({
  useFormikContext: () => ({
    values: { id: state.id, versions: [], meta: {}, version_details: { id: 3, name: 'base' } },
  }),
}));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ search: '' }),
  useNavigate: () => vi.fn(),
  useParams: () => ({ tab: 'all', agentId: '7' }),
}));
vi.mock('@/[fsd]/entities/compare-versions', () => ({ CompareVersionsModal: () => null }));
vi.mock('@/[fsd]/entities/version', () => ({
  LATEST_VERSION_NAME: 'base',
  VersionDelete: () => null,
  usePublishApplicationMenu: () => ({}),
  useSetDefaultVersion: () => ({ handleSetDefaultVersion: vi.fn() }),
  useUnpublishVersionMenu: () => ({}),
}));
vi.mock('@/[fsd]/features/agent/lib/hooks', () => ({ useCompareAgentVersions: () => ({}) }));
vi.mock('@/[fsd]/shared/lib/constants', () => ({
  PinEntityConstants: { PinEntityType: { Application: 'application' } },
  TourTargetConstants: { AGENT_TOUR_TARGET_IDS: { actionsMenu: 'agent-actions-menu' } },
}));
vi.mock('@/[fsd]/shared/lib/context', () => ({ useInstructionsInputRefContext: () => ({ current: null }) }));
vi.mock('@/[fsd]/shared/lib/helpers', () => ({ NavigationHelpers: { buildRoute: vi.fn() } }));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useIsFromPipelineDetail: () => state.isFromPipeline,
  useProjectEntityLink: () => ({}),
  useProjectType: () => ({ isPrivate: true }),
  useRunHistoryNavigation: args => {
    runHistoryArgs.current = args;
    return { goToRunHistory };
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
  PERMISSIONS: { applications: { export: 'export', update: 'update', delete: 'delete' }, versions: {} },
  ViewMode: { Public: 'public', Owner: 'owner' },
}));
vi.mock('@/components/CopyLinkToEntityButton.jsx', () => ({
  useCopyLinkMenu: ({ key, label }) => ({ copyLinkMenuItem: { key, label } }),
}));
vi.mock('@/components/Fork/ForkEntityButton', () => ({ useForkEntityMenu: () => ({}) }));
vi.mock('@/components/Icons/DeleteIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/DifferenceIcon', () => ({ default: () => null }));
vi.mock('@/components/Icons/PinIcon', () => ({ default: () => null }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => true }) }));
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

    fireEvent.click(screen.getByText('Run History'));
    expect(goToRunHistory).toHaveBeenCalledTimes(1);
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
