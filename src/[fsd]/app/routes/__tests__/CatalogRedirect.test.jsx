// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import CatalogRedirect from '../CatalogRedirect';

const Landing = () => {
  const location = useLocation();
  return <span data-testid="landing">{location.pathname + location.search}</span>;
};

const renderAt = url =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/elitea-catalog"
          element={<CatalogRedirect />}
        />
        <Route
          path="/:section/:tab"
          element={<Landing />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('CatalogRedirect', () => {
  afterEach(() => cleanup());

  it('opens Agents → Discover by default', () => {
    renderAt('/elitea-catalog');
    expect(screen.getByTestId('landing')).toHaveTextContent(/^\/agents\/discover$/);
  });

  it('keeps the agent to open', () => {
    renderAt('/elitea-catalog?tab=agents&agentId=7');
    expect(screen.getByTestId('landing')).toHaveTextContent('/agents/discover?agentId=7');
  });

  it('opens Skills → Discover with the skill and the tour', () => {
    renderAt('/elitea-catalog?tab=skills&skillId=3&tour=elitea-catalog');
    expect(screen.getByTestId('landing')).toHaveTextContent('/skills/discover?skillId=3&tour=elitea-catalog');
  });
});
