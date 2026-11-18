// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material';

import { dateFormatter } from '@/[fsd]/features/settings/lib/helpers/dateFormatter.helpers';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import lightPalette from '@/lightPalette';
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import ProjectParamsHeader from '../ProjectParamsHeader';

const { state } = vi.hoisted(() => ({ state: { projectId: 10, info: {} } }));

vi.mock('@/[fsd]/features/settings/api/projectInfoApi', () => ({
  useProjectInfoQuery: ({ projectId }) => ({ data: state.info[projectId] }),
}));
vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => state.projectId,
  useSelectedProjectName: () => 'Team Project',
}));
vi.mock('@/[fsd]/widgets/sidebar-root', () => ({ ProjectAvatar: () => null }));
vi.mock('@/hooks/useCheckPermission', () => ({ default: () => ({ checkPermission: () => false }) }));
vi.mock('../select-project-icon', () => ({ SelectProjectIconDialog: () => null }));

const theme = createTheme({ palette: lightPalette });

const TEAM_CREATED = '2026-07-13T09:18:11.904953+00:00';
const OTHER_CREATED = '2026-01-20T11:25:31.563836+00:00';

const renderHeader = () =>
  render(
    <ThemeProvider theme={theme}>
      <ProjectParamsHeader />
    </ThemeProvider>,
  );

describe('ProjectParamsHeader project created (#7490)', () => {
  afterEach(cleanup);

  it('shows the creation date of the selected project', () => {
    state.projectId = 10;
    state.info = { 10: { teammates_count: 3, created_at: TEAM_CREATED } };

    renderHeader();

    expect(screen.getByText('Project created:')).toBeInTheDocument();
    expect(screen.getByText(dateFormatter(TEAM_CREATED))).toBeInTheDocument();
    expect(screen.getByText('Teammates:')).toBeInTheDocument();
  });

  it('follows the selected project', () => {
    state.info = {
      10: { teammates_count: 3, created_at: TEAM_CREATED },
      3: { teammates_count: 1, created_at: OTHER_CREATED },
    };
    state.projectId = 10;
    const { rerender } = renderHeader();

    // The real selector re-renders on a project switch; the mocked hook needs a fresh render
    state.projectId = 3;
    rerender(
      <ThemeProvider theme={theme}>
        <ProjectParamsHeader key={3} />
      </ThemeProvider>,
    );

    expect(screen.getByText(dateFormatter(OTHER_CREATED))).toBeInTheDocument();
    expect(screen.queryByText(dateFormatter(TEAM_CREATED))).not.toBeInTheDocument();
  });

  it.each([null, undefined])('hides the item when created_at is %s', value => {
    state.projectId = 10;
    state.info = { 10: { teammates_count: 3, created_at: value } };

    renderHeader();

    expect(screen.queryByText('Project created:')).not.toBeInTheDocument();
    expect(screen.getByText('Teammates:')).toBeInTheDocument();
  });

  it('hides the item for the public project', () => {
    state.projectId = PUBLIC_PROJECT_ID;
    state.info = { [PUBLIC_PROJECT_ID]: { teammates_count: 3, created_at: TEAM_CREATED } };

    renderHeader();

    expect(screen.queryByText('Project created:')).not.toBeInTheDocument();
  });
});
