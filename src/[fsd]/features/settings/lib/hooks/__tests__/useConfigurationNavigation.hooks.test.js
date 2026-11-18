// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, renderHook } from '@testing-library/react';

import { useConfigurationNavigation } from '../useConfigurationNavigation.hooks';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ state: null }),
}));

describe('useConfigurationNavigation.navigateToCreateConfiguration', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('opens the create AI provider page as the sidebar create button did', () => {
    renderHook(() => useConfigurationNavigation()).result.current.navigateToCreateConfiguration();

    expect(navigate).toHaveBeenCalledWith(
      { pathname: '/settings/create-ai-provider', search: 'viewMode=owner&from=ai-providers' },
      {
        state: {
          routeStack: [
            { breadCrumb: 'AI Providers', pagePath: '/settings/ai-providers?viewMode=owner' },
            {
              breadCrumb: 'New AI Provider',
              viewMode: 'owner',
              pagePath: '/settings/create-ai-provider?viewMode=owner&from=ai-providers',
            },
          ],
        },
      },
    );
  });
});
