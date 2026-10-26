// @vitest-environment jsdom
import { useEffect } from 'react';

import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { act, cleanup, render } from '@testing-library/react';

import RemountOnEntityChange from '../RemountOnEntityChange';

const onMount = vi.fn();

const Page = () => {
  useEffect(() => {
    onMount();
  }, []);
  return null;
};

const renderRoutes = () => {
  let navigate;
  const NavigateCapture = () => {
    navigate = useNavigate();
    return null;
  };
  render(
    <MemoryRouter initialEntries={['/pipelines/all/545']}>
      <NavigateCapture />
      <Routes>
        <Route
          path="/pipelines/:tab/:agentId"
          element={
            <RemountOnEntityChange>
              <Page />
            </RemountOnEntityChange>
          }
        >
          <Route
            path=":version"
            element={<></>}
          />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
  return { go: path => act(() => navigate(path)) };
};

describe('RemountOnEntityChange', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('remounts the page when the route moves to another entity', () => {
    const { go } = renderRoutes();
    expect(onMount).toHaveBeenCalledTimes(1);

    go('/pipelines/all/997');

    expect(onMount).toHaveBeenCalledTimes(2);
  });

  it('keeps the page mounted across version changes of the same entity', () => {
    const { go } = renderRoutes();

    go('/pipelines/all/545/1092');
    go('/pipelines/all/545?viewMode=owner&name=CodeExecutor');

    expect(onMount).toHaveBeenCalledTimes(1);
  });
});
