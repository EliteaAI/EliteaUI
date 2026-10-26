// @vitest-environment jsdom
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { act, cleanup, renderHook } from '@testing-library/react';

import { ANALYTICS_TOUR_ID } from '../../constants';
import { useInteractiveTourController } from '../useInteractiveTourController.hooks';

vi.mock('@/slices/settings', async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    actions: { ...original.actions, setSideBarCollapsed: vi.fn(() => ({ type: 'noop' })) },
  };
});

const SKILLS_LIST = 'models.applications.skills.list';

// Node 22 experimental Web Storage defines localStorage as undefined when --localstorage-file is
// not provided, which can shadow jsdom's implementation and crash the hook's localStorage.setItem.
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    store: {},
    getItem(key) {
      return this.store[key] ?? null;
    },
    setItem(key, value) {
      this.store[key] = String(value);
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    },
  });
});

const startAnalyticsTour = async (permissions, { projectId = 2, publicPermissions = [] } = {}) => {
  const state = Object.freeze({
    user: { permissions, publicPermissions },
    settings: { project: { id: projectId } },
  });
  const store = { getState: () => state, subscribe: () => () => {}, dispatch: action => action };
  const { result } = renderHook(() => useInteractiveTourController(), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
  await act(() => result.current.startTour(ANALYTICS_TOUR_ID));
  const tabIds = [];
  for (let index = 0; index < result.current.totalSteps; index += 1) {
    if (result.current.currentStep.tabId) tabIds.push(result.current.currentStep.tabId);
    act(() => result.current.next());
  }
  return tabIds;
};

describe('analytics tour steps', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('visits the Skills tab only for a user who can list skills', async () => {
    const withSkills = await startAnalyticsTour([SKILLS_LIST]);
    const withoutSkills = await startAnalyticsTour([]);

    expect(withSkills).toContain('skills');
    expect(withoutSkills).not.toContain('skills');
    expect(withoutSkills).toEqual(withSkills.filter(tabId => tabId !== 'skills'));
  });

  it('reads the public permissions in the Public project', async () => {
    const tabIds = await startAnalyticsTour([], {
      projectId: PUBLIC_PROJECT_ID,
      publicPermissions: [SKILLS_LIST],
    });

    expect(tabIds).toContain('skills');
  });

  it('addresses every tab by id', async () => {
    expect(await startAnalyticsTour([SKILLS_LIST])).toEqual([
      'overview',
      'agents',
      'chats',
      'skills',
      'tools',
      'users',
      'activity',
      'health',
      'costs',
      'tokens',
      'guide',
    ]);
  });
});
