// The left menu concept «Explore» (owner's choice 2026-11-13, the only version from 2026-11-16), for the developers to
// run and take from: the chat screen with the new menu, and a section's own page opened from Explore's hover list.
// Sample data, not wired to the API. What to build and the acceptance criteria: the GitHub issue of this branch.
import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';

import ConceptShell from './ConceptShell';
import { SectionPage } from './SectionPage';
import { ROUTES, STATE } from './data';

export default {
  title: 'concepts/Left menu Explore',
  parameters: { layout: 'fullscreen' },
};

// The frame fills the Storybook window (owner, 2026-11-10). Shots come out 1366 × 768 at that window size.
// No theme is pinned: the toolbar's Theme switch works on both stories. The product runs dark — the story links in the
// issue open them with &globals=theme:dark.
const frame = ({ path, collapsed }) =>
  withStoryApi({
    routes: ROUTES,
    // The folded menu: the team's sidebar parts read settings.sideBarCollapsed and draw their collapsed look.
    state: collapsed ? { ...STATE, settings: { ...STATE.settings, sideBarCollapsed: true } } : STATE,
    width: '100vw',
    height: '100vh',
    path,
  });

// The chat with the open menu: hover «Explore» for the list of sections.
export const ExploreChat = {
  name: 'Chat — hover Explore for the sections',
  render: () => (
    <Box sx={{ width: '100%' }}>
      <ConceptShell active="chat" />
    </Box>
  ),
  decorators: [frame({ path: '/chat?create=1' })],
};

// A section's own page, the menu folded to icons; «Explore» in the folded menu opens the same list.
export const SectionPageStory = {
  name: 'Section page — opened from Explore',
  render: () => (
    <Box sx={{ width: '100%' }}>
      <ConceptShell
        active="section"
        rail
      >
        <SectionPage />
      </ConceptShell>
    </Box>
  ),
  decorators: [frame({ path: '/chat', collapsed: true })],
};
