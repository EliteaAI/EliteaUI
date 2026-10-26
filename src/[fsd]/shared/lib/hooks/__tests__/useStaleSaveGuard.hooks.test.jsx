// @vitest-environment jsdom
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';

import { act, cleanup, renderHook } from '@testing-library/react';

import { useStaleSaveGuard } from '../useStaleSaveGuard.hooks';

const renderGuard = (initialEntityId, path = '/pipelines/all/545') => {
  let currentPath = path;
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[currentPath]}>
      <Routes>
        <Route
          path="/pipelines/:tab/:agentId"
          element={children}
        />
        <Route
          path="/chat"
          element={children}
        />
      </Routes>
    </MemoryRouter>
  );
  const utils = renderHook(({ entityId }) => useStaleSaveGuard(entityId), {
    wrapper,
    initialProps: { entityId: initialEntityId },
  });
  return {
    ...utils,
    moveTo: (nextPath, entityId) => {
      currentPath = nextPath;
      utils.rerender({ entityId });
    },
  };
};

describe('useStaleSaveGuard', () => {
  afterEach(() => cleanup());

  it('keeps a save current while the page shows the same entity', () => {
    const { result, rerender } = renderGuard(545);
    const target = result.current.captureSaveTarget();

    rerender({ entityId: 545 });

    expect(result.current.isSaveTargetCurrent(target)).toBe(true);
  });

  it('treats a string and a numeric id of the same entity as the same target', () => {
    const { result, rerender } = renderGuard('545');
    const target = result.current.captureSaveTarget();

    rerender({ entityId: 545 });

    expect(result.current.isSaveTargetCurrent(target)).toBe(true);
  });

  it('flags a save as stale once the form holds another entity', () => {
    const { result, rerender } = renderGuard(545);
    const target = result.current.captureSaveTarget();

    rerender({ entityId: 997 });

    expect(result.current.isSaveTargetCurrent(target)).toBe(false);
  });

  it('flags a save as stale when the route moved to another entity before the form reloads', () => {
    let navigateTo;
    const NavigateCapture = () => {
      navigateTo = useNavigate();
      return null;
    };
    const wrapper = ({ children }) => (
      <MemoryRouter initialEntries={['/pipelines/all/545']}>
        <NavigateCapture />
        <Routes>
          <Route
            path="/pipelines/:tab/:agentId"
            element={children}
          />
        </Routes>
      </MemoryRouter>
    );
    // The form still holds the previous entity: only the URL has moved on
    const { result } = renderHook(() => useStaleSaveGuard(545), { wrapper });
    const target = result.current.captureSaveTarget();

    act(() => navigateTo('/pipelines/all/997'));

    expect(result.current.isSaveTargetCurrent(target)).toBe(false);
  });

  it('skips the route check where the URL has no entity id (chat editor)', () => {
    const { result, rerender } = renderGuard(545, '/chat');
    const target = result.current.captureSaveTarget();

    rerender({ entityId: 545 });
    expect(result.current.isSaveTargetCurrent(target)).toBe(true);

    rerender({ entityId: 997 });
    expect(result.current.isSaveTargetCurrent(target)).toBe(false);
  });
});
