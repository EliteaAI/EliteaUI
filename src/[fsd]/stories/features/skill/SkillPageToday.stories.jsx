import { Suspense, lazy } from 'react';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';

import { SKILLS, buildRoutes, storyState } from './skillPageStory.data';

// Lazy so the routes module loads before the layout
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

// The skill page as it is on main today: the "before" of the Settings | Files prototype
export default {
  title: 'features/skill/Skill Page — Today',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Box sx={{ width: '100%' }}>
      <Suspense>
        <AppLayout />
      </Suspense>
    </Box>
  ),
  decorators: [
    withStoryApi({
      routes: buildRoutes({ skillDetails: SKILLS.pdfForms }),
      state: storyState,
      width: 1440,
      height: 900,
      path: '/skills/all/77',
    }),
  ],
};

export const Dark = { globals: { theme: 'dark' } };

export const Light = { globals: { theme: 'light' } };
