// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '@mui/material';

import { useInteractiveTour } from '@/[fsd]/shared/lib/context';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import AnalyticsContainer from '../AnalyticsContainer';
import { analyticsTestTheme } from './_testHelpers';

vi.hoisted(async () => {
  const { installGlobalStubs } = await import('./_testHelpers');
  installGlobalStubs();
});

const SKILLS_LIST = 'models.applications.skills.list';

vi.mock('@/[fsd]/features/settings/api/analyticsApi', () => ({
  TAG_TYPE_ANALYTICS: 'ANALYTICS',
  analyticsApi: { endpoints: {}, util: { invalidateTags: vi.fn() } },
  useProjectAnalyticsQuery: () => ({
    data: { health: [], daily_activity: [], kpis: {} },
    isFetching: false,
    isError: false,
  }),
  useProjectAnalyticsUsageQuery: () => ({ data: { kpis: {} }, isFetching: false, isError: false }),
}));

vi.mock('@/[fsd]/features/interactive-tours', async () => {
  const targets =
    await import('@/[fsd]/features/interactive-tours/lib/constants/analyticsTourTargets.constants');
  return {
    ANALYTICS_TOUR_TARGET_IDS: targets.ANALYTICS_TOUR_TARGET_IDS,
    ANALYTICS_TOUR_ID: 'analytics',
  };
});

vi.mock('@/[fsd]/shared/lib/context', () => ({ useInteractiveTour: vi.fn() }));

vi.mock('@/[fsd]/features/settings/ui/analytics', () => {
  const stub = testId => {
    const Stub = props => (
      <div
        data-testid={testId}
        data-can-view-skills={String(props.canViewSkills)}
        data-date-from={props.dateFrom}
        data-date-to={props.dateTo}
      />
    );
    return Stub;
  };
  return {
    AnalyticsOverview: stub('panel-overview'),
    AnalyticsCosts: stub('panel-costs'),
    AnalyticsTokens: stub('panel-tokens'),
    AnalyticsAgents: stub('panel-agents'),
    AnalyticsSkills: stub('panel-skills'),
    AnalyticsTools: stub('panel-tools'),
    AnalyticsUsers: stub('panel-users'),
    AnalyticsActivity: stub('panel-activity'),
    AnalyticsHealth: stub('panel-health'),
    AnalyticsGuide: props => <div data-testid="panel-guide">{props.visibleTabIds.join(',')}</div>,
  };
});

vi.mock('@/[fsd]/features/settings/ui/drawer-page', () => ({
  DrawerPage: props => <div>{props.children}</div>,
}));

vi.mock('@mui/x-date-pickers/DateTimePicker', () => ({ DateTimePicker: () => null }));

vi.mock('@/[fsd]/shared/lib/utils', () => ({ exportToExcel: vi.fn() }));

vi.mock('@/[fsd]/features/settings/lib/helpers', async () => ({
  AnalyticsUrlStateHelpers: await vi.importActual(
    '@/[fsd]/features/settings/lib/helpers/analyticsUrlState.helpers.js',
  ),
  AnalyticCommonHelpers: {
    getPresetRange: () => ({ from: new Date('2026-10-01'), to: new Date('2026-10-02') }),
    isValidDate: d => d instanceof Date,
    toValidISOString: d => d?.toISOString(),
  },
  AnalyticsExportHelpers: {},
}));

const selectedProject = vi.hoisted(() => ({ id: 2 }));

vi.mock('@/[fsd]/shared/lib/hooks/useSelectedProject.hooks', () => ({
  useSelectedProjectId: () => selectedProject.id,
  useSelectedProjectName: () => 'Private',
}));

const storeWith = (permissions, publicPermissions = []) => {
  const state = Object.freeze({ user: { personal_project_id: 2, permissions, publicPermissions } });
  return { getState: () => state, subscribe: () => () => {}, dispatch: action => action };
};

const LocationProbe = () => (
  <div
    data-testid="location"
    data-search={useLocation().search}
  />
);

const containerTree = (permissions, publicPermissions, url = '/settings/analytics') => (
  <MemoryRouter initialEntries={[url]}>
    <LocationProbe />
    <Provider store={storeWith(permissions, publicPermissions)}>
      <ThemeProvider theme={analyticsTestTheme}>
        <AnalyticsContainer />
      </ThemeProvider>
    </Provider>
  </MemoryRouter>
);

const renderContainer = (permissions, publicPermissions, url) =>
  render(containerTree(permissions, publicPermissions, url));

const tabLabels = () => screen.getAllByRole('tab').map(tab => tab.textContent);

const ALL_TABS = [
  'Overview',
  'Costs',
  'Tokens',
  'Agents & Pipelines',
  'Skills',
  'Tools',
  'Users',
  'Activity',
  'Health',
  'Guide',
];

describe('AnalyticsContainer tabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInteractiveTour.mockReturnValue({});
  });

  afterEach(() => cleanup());

  it('shows Skills after Agents & Pipelines for a user who can list skills', () => {
    renderContainer([SKILLS_LIST]);

    expect(tabLabels()).toEqual(ALL_TABS);
  });

  it('hides Skills without the permission and keeps every other tab in order', () => {
    renderContainer([]);

    expect(tabLabels()).toEqual(ALL_TABS.filter(label => label !== 'Skills'));
  });

  it.each([[[SKILLS_LIST]], [[]]])('each tab opens its own panel (permissions %j)', permissions => {
    renderContainer(permissions);
    const panels = {
      'Agents & Pipelines': 'panel-agents',
      Tools: 'panel-tools',
      Users: 'panel-users',
      Activity: 'panel-activity',
      Health: 'panel-health',
      Guide: 'panel-guide',
    };

    Object.entries(panels).forEach(([label, panel]) => {
      fireEvent.click(screen.getByRole('tab', { name: label }));
      expect(screen.getByTestId(panel)).toBeInTheDocument();
      expect(screen.queryByTestId('panel-skills')).not.toBeInTheDocument();
    });
  });

  it('reads the public permissions in the Public project', () => {
    selectedProject.id = PUBLIC_PROJECT_ID;
    renderContainer([], [SKILLS_LIST]);
    selectedProject.id = 2;

    expect(tabLabels()).toEqual(ALL_TABS);
  });

  it('opens the Skills panel from its tab', () => {
    renderContainer([SKILLS_LIST]);

    fireEvent.click(screen.getByTestId('analytics-tab-skills'));

    expect(screen.getByTestId('panel-skills')).toBeInTheDocument();
  });

  it('tells the Guide which tabs are visible', () => {
    renderContainer([]);

    fireEvent.click(screen.getByRole('tab', { name: 'Guide' }));

    expect(screen.getByTestId('panel-guide').textContent).not.toContain('skills');
  });
});

describe('AnalyticsContainer skill usage gating (#7030)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInteractiveTour.mockReturnValue({});
  });

  afterEach(() => cleanup());

  const SKILL_AWARE_PANELS = {
    Overview: 'panel-overview',
    Costs: 'panel-costs',
    Tokens: 'panel-tokens',
    'Agents & Pipelines': 'panel-agents',
    Users: 'panel-users',
  };

  it.each([
    [[SKILLS_LIST], 'true'],
    [[], 'false'],
  ])('passes the skills permission to every tab that shows skill usage (%j)', (permissions, expected) => {
    renderContainer(permissions);

    Object.entries(SKILL_AWARE_PANELS).forEach(([label, panel]) => {
      fireEvent.click(screen.getByRole('tab', { name: label }));
      expect(screen.getByTestId(panel)).toHaveAttribute('data-can-view-skills', expected);
    });
  });
});

describe('AnalyticsContainer tour steps', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => cleanup());

  it.each([
    ['tools', 'panel-tools'],
    ['health', 'panel-health'],
    ['skills', 'panel-skills'],
  ])('a step for %s opens that tab', (tabId, panel) => {
    useInteractiveTour.mockReturnValue({ tourId: 'analytics', currentStep: { tabId } });

    renderContainer([SKILLS_LIST]);

    expect(screen.getByTestId(panel)).toBeInTheDocument();
  });

  it('a step without a tab keeps the open tab', () => {
    useInteractiveTour.mockReturnValue({ tourId: 'analytics', currentStep: { tabId: 'tools' } });
    const { rerender } = renderContainer([SKILLS_LIST]);

    useInteractiveTour.mockReturnValue({ tourId: 'analytics', currentStep: { id: 'date-range-controls' } });
    rerender(containerTree([SKILLS_LIST]));

    expect(screen.getByTestId('panel-tools')).toBeInTheDocument();
  });

  it('a step for the hidden Skills tab never opens it', () => {
    useInteractiveTour.mockReturnValue({ tourId: 'analytics', currentStep: { tabId: 'skills' } });

    renderContainer([]);

    expect(screen.getByTestId('panel-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('panel-skills')).not.toBeInTheDocument();
  });
});

const urlParams = () => new URLSearchParams(screen.getByTestId('location').dataset.search);

describe('AnalyticsContainer URL state (#7033)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInteractiveTour.mockReturnValue({});
  });

  afterEach(() => cleanup());

  it('writes the open tab and the date preset into the URL', () => {
    renderContainer([]);

    fireEvent.click(screen.getByRole('tab', { name: 'Agents & Pipelines' }));

    expect(urlParams().get('tab')).toBe('agents');
    expect(urlParams().get('range')).toBe('0');
  });

  it('restores the tab and a custom range from the URL', () => {
    const from = '2026-09-01T08:00:00.000Z';
    const to = '2026-09-03T18:00:00.000Z';
    renderContainer([], [], `/settings/analytics?tab=agents&range=custom&from=${from}&to=${to}&agent_id=42`);

    const panel = screen.getByTestId('panel-agents');
    expect(panel).toHaveAttribute('data-date-from', from);
    expect(panel).toHaveAttribute('data-date-to', to);
    expect(urlParams().get('agent_id')).toBe('42');
  });

  it('keeps a pasted skill detail link while the permissions are still loading', () => {
    const url = '/settings/analytics?tab=skills&range=7&skill_id=5&skill_project_id=2';
    const { rerender } = renderContainer([], [], url);

    expect(urlParams().get('skill_id')).toBe('5');

    rerender(containerTree([SKILLS_LIST], [], url));

    expect(screen.getByTestId('panel-skills')).toBeInTheDocument();
    expect(urlParams().get('skill_id')).toBe('5');
    expect(urlParams().get('skill_project_id')).toBe('2');
  });

  it('closes the selected agent when another tab opens', () => {
    renderContainer([], [], '/settings/analytics?tab=agents&range=7&agent_id=42');

    fireEvent.click(screen.getByRole('tab', { name: 'Tools' }));

    expect(urlParams().get('tab')).toBe('tools');
    expect(urlParams().has('agent_id')).toBe(false);
  });
});

describe('AnalyticsContainer tour steps and the selected entity (#7033)', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => cleanup());

  it('shows the agents list on the agents step of a tour started from an agent detail', () => {
    const url = '/settings/analytics?tab=agents&range=7&agent_id=5';
    useInteractiveTour.mockReturnValue({ tourId: 'analytics', currentStep: { tabId: 'overview' } });
    const { rerender } = renderContainer([], [], url);

    useInteractiveTour.mockReturnValue({ tourId: 'analytics', currentStep: { tabId: 'agents' } });
    rerender(containerTree([], [], url));

    expect(screen.getByTestId('panel-agents')).toBeInTheDocument();
    expect(urlParams().has('agent_id')).toBe(false);
  });

  it('keeps a deep-linked agent through a tour step on the same tab and a later range change', () => {
    useInteractiveTour.mockReturnValue({ tourId: 'analytics', currentStep: { tabId: 'agents' } });
    renderContainer([], [], '/settings/analytics?tab=agents&range=7&agent_id=5');

    fireEvent.click(screen.getByTestId('analytics-date-preset-30'));

    expect(urlParams().get('range')).toBe('30');
    expect(urlParams().get('agent_id')).toBe('5');
  });
});
