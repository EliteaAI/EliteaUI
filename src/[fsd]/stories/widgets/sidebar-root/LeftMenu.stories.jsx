import { Suspense, lazy } from 'react';

import { userEvent, within } from 'storybook/test';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { ROUTES, STATE } from '@/[fsd]/stories/lib/sampleApp.data';
import { SCREENSHOT_MODES } from '@/[fsd]/stories/lib/screenshot.constants';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';
import { waitForQuietPage } from '@/[fsd]/stories/lib/storyPlay.helpers';

// Lazy so the routes module loads before the layout
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

const screen = ({ collapsed = false } = {}) =>
  withStoryApi({
    routes: ROUTES,
    state: { ...STATE, settings: { ...STATE.settings, sideBarCollapsed: collapsed } },
    // Fills the pane; screenshots and the compare view open it in a window of SCREENSHOT_SIZE
    width: '100vw',
    height: '100vh',
    path: '/chat?create=1',
  });

// In the compare modes the screen lives in a frame that runs this on its own
const hoverExplore = async ({ globals }) => {
  if (globals.screenshot && globals.screenshot !== SCREENSHOT_MODES.live) return;
  await waitForQuietPage();
  const page = within(document.body);
  await userEvent.hover(await page.findByTestId('sidebar-explore'));
  await page.findByTestId('sidebar-explore-menu');
};

export default {
  title: 'widgets/sidebar-root/Left menu',
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

export const Open = {
  decorators: [screen()],
};

export const ExploreList = {
  name: 'Explore list',
  decorators: [screen()],
  play: hoverExplore,
};

export const Collapsed = {
  decorators: [screen({ collapsed: true })],
};

export const CollapsedExploreList = {
  name: 'Collapsed, Explore list',
  decorators: [screen({ collapsed: true })],
  play: hoverExplore,
};
