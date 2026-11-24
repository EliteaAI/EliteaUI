import { Suspense, lazy } from 'react';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { ROUTES, STATE } from '@/[fsd]/stories/lib/sampleApp.data';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';
import RouteDefinitions from '@/routes';

// Lazy so the routes module loads before the layout
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

// Section pages open from Explore, which folds the menu
const sectionPage = path => ({
  decorators: [
    withStoryApi({
      routes: ROUTES,
      state: { ...STATE, settings: { ...STATE.settings, sideBarCollapsed: true } },
      // Fills the pane; screenshots and the compare view open it in a window of SCREENSHOT_SIZE
      width: '100vw',
      height: '100vh',
      path,
    }),
  ],
});

export default {
  title: 'widgets/section-page/Section pages',
  // Storybook reads tags statically, so the literal; see SCREENSHOT_TAG
  tags: ['screenshot'],
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Box sx={{ width: '100%' }}>
      <Suspense>
        <AppLayout />
      </Suspense>
    </Box>
  ),
};

export const Agents = sectionPage(RouteDefinitions.Applications);

export const Pipelines = sectionPage(RouteDefinitions.Pipelines);

export const Skills = sectionPage(RouteDefinitions.Skills);

export const Toolkits = sectionPage(RouteDefinitions.Toolkits);

export const Mcps = { ...sectionPage(RouteDefinitions.MCPs), name: 'MCPs' };

export const Applications = sectionPage(RouteDefinitions.Apps);

export const Credentials = sectionPage(RouteDefinitions.Credentials);
