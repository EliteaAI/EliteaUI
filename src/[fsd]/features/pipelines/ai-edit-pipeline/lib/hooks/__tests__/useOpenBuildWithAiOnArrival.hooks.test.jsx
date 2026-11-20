// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { useOpenBuildWithAiOnArrival } from '../useOpenBuildWithAiOnArrival.hooks';

const Probe = ({ enabled }) => {
  const shouldOpen = useOpenBuildWithAiOnArrival(enabled);
  const location = useLocation();
  return (
    <>
      <span data-testid="open">{String(shouldOpen)}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
      <span data-testid="search">{location.search}</span>
    </>
  );
};

const renderAt = (state, enabled = true) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/pipelines/create', search: '?viewMode=owner', state }]}>
      <Routes>
        <Route
          path="/pipelines/create"
          element={<Probe enabled={enabled} />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('useOpenBuildWithAiOnArrival', () => {
  afterEach(() => cleanup());

  it('opens once and drops the flag, keeping the rest of the state and the search', () => {
    renderAt({ openBuildWithAI: true, routeStack: [{ pagePath: '/pipelines/all' }] });
    expect(screen.getByTestId('open')).toHaveTextContent('true');
    expect(JSON.parse(screen.getByTestId('state').textContent)).toEqual({
      routeStack: [{ pagePath: '/pipelines/all' }],
    });
    expect(screen.getByTestId('search')).toHaveTextContent('?viewMode=owner');
  });

  it('stays closed without the flag', () => {
    renderAt({ routeStack: [] });
    expect(screen.getByTestId('open')).toHaveTextContent('false');
  });

  it('leaves the flag alone when disabled', () => {
    renderAt({ openBuildWithAI: true }, false);
    expect(screen.getByTestId('open')).toHaveTextContent('false');
    expect(JSON.parse(screen.getByTestId('state').textContent)).toEqual({ openBuildWithAI: true });
  });
});
