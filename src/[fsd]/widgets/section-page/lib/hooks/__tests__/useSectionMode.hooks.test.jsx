// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import { useSectionMode } from '../useSectionMode.hooks';

const fixture = vi.hoisted(() => ({
  projectId: 10,
  isPublic: false,
  isTeam: false,
}));

vi.mock('@/[fsd]/shared/lib/hooks', () => ({
  useSelectedProjectId: () => fixture.projectId,
  useProjectType: () => ({ isPublic: fixture.isPublic, isTeam: fixture.isTeam }),
}));

let changeTab;

const Probe = ({ sectionKey, hasPublicViews }) => {
  const { tab, isDiscover, onChangeTab } = useSectionMode(sectionKey, hasPublicViews);
  const location = useLocation();
  changeTab = onChangeTab;
  return (
    <>
      <span data-testid="tab">{tab}</span>
      <span data-testid="discover">{String(isDiscover)}</span>
      <span data-testid="path">{location.pathname + location.search}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
    </>
  );
};

const renderAt = (url, { sectionKey = 'agents', hasPublicViews = true, state } = {}) =>
  render(
    <MemoryRouter
      initialEntries={[
        { pathname: url.split('?')[0], search: url.split('?')[1] ? `?${url.split('?')[1]}` : '', state },
      ]}
    >
      <Routes>
        <Route
          path="/:section/:tab"
          element={
            <Probe
              sectionKey={sectionKey}
              hasPublicViews={hasPublicViews}
            />
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const path = () => screen.getByTestId('path').textContent;

describe('useSectionMode', () => {
  beforeEach(() => {
    Object.assign(fixture, { projectId: 10, isPublic: false, isTeam: false });
  });
  afterEach(() => cleanup());

  it('keeps the project tab of a private project', () => {
    renderAt('/agents/all');
    expect(screen.getByTestId('tab')).toHaveTextContent('all');
    expect(screen.getByTestId('discover')).toHaveTextContent('false');
    expect(path()).toBe('/agents/all');
  });

  it('opens Discover for agents and skills', () => {
    renderAt('/skills/discover', { sectionKey: 'skills', hasPublicViews: false });
    expect(screen.getByTestId('discover')).toHaveTextContent('true');
    expect(path()).toBe('/skills/discover');
  });

  it('replaces Discover with the project tab on Pipelines', () => {
    renderAt('/pipelines/discover?view=table', { sectionKey: 'pipelines' });
    expect(path()).toBe('/pipelines/all?view=table');
  });

  it('replaces an unknown or public tab with the project tab outside Public', () => {
    renderAt('/agents/latest');
    expect(path()).toBe('/agents/all');
  });

  it('keeps the public views in the Public project and sends other tabs to Latest', () => {
    fixture.isPublic = true;
    renderAt('/agents/trending');
    expect(path()).toBe('/agents/trending');
    cleanup();
    renderAt('/agents/all');
    expect(path()).toBe('/agents/latest');
  });

  it('shows the project list of Skills in Public, which has no public views', () => {
    fixture.isPublic = true;
    renderAt('/skills/latest', { sectionKey: 'skills', hasPublicViews: false });
    expect(path()).toBe('/skills/all');
  });

  it('keeps Discover reachable in Public for catalog links', () => {
    fixture.isPublic = true;
    renderAt('/agents/discover?agentId=5');
    expect(screen.getByTestId('discover')).toHaveTextContent('true');
    expect(path()).toBe('/agents/discover?agentId=5');
    cleanup();
    renderAt('/skills/discover?skillId=7', { sectionKey: 'skills', hasPublicViews: false });
    expect(path()).toBe('/skills/discover?skillId=7');
  });

  it('does not keep Discover on Pipelines in Public', () => {
    fixture.isPublic = true;
    renderAt('/pipelines/discover', { sectionKey: 'pipelines' });
    expect(path()).toBe('/pipelines/latest');
  });

  it('does not redirect before the project is known', () => {
    fixture.projectId = undefined;
    renderAt('/agents/latest');
    expect(path()).toBe('/agents/latest');
  });

  it('keeps only the project tab on Toolkits, MCPs and Credentials', () => {
    renderAt('/toolkits/my-liked?view=table', { sectionKey: 'toolkits', hasPublicViews: false });
    expect(path()).toBe('/toolkits/all?view=table');
    cleanup();
    renderAt('/mcps/discover', { sectionKey: 'mcps', hasPublicViews: false });
    expect(path()).toBe('/mcps/all');
    expect(JSON.parse(screen.getByTestId('state').textContent).routeStack[0].breadCrumb).toBe('MCPs');
    cleanup();
    fixture.isPublic = true;
    renderAt('/credentials/latest', { sectionKey: 'credentials', hasPublicViews: false });
    expect(path()).toBe('/credentials/all');
  });

  it('switches tabs keeping the search and the navigation state', () => {
    renderAt('/agents/all?tags[]=x', { state: { trendRange: 'week' } });
    act(() => changeTab('discover'));
    expect(path()).toBe('/agents/discover?tags[]=x');
    expect(JSON.parse(screen.getByTestId('state').textContent)).toEqual({
      trendRange: 'week',
      routeStack: [{ pagePath: '/agents/discover?tags[]=x', breadCrumb: 'Agents' }],
    });
  });
});
