// The «+» menu under the chat input as built: the real chat screen (AppLayout on /chat) on sample data, the menu opened
// by the play. Each story names the concept story (concepts/Chat/2 Plus menu) it implements.
import { Suspense, lazy } from 'react';

import { userEvent, within } from 'storybook/test';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { SCREENSHOT_MODES } from '@/[fsd]/stories/lib/screenshot.constants';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';
import { waitForQuietPage } from '@/[fsd]/stories/lib/storyPlay.helpers';

import { FULL_CHAT_ID, routes, state } from './chatInput.data';

// Lazy so the routes module loads before the layout
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

const chatScreen = path => ({
  decorators: [withStoryApi({ routes: routes(), state, width: '100vw', height: '100vh', path })],
});

// Opens «+», then each row given. In the compare modes the screen lives in a frame that runs the story on its own.
const open =
  (...rows) =>
  async ({ canvasElement, globals }) => {
    if (globals.screenshot && globals.screenshot !== SCREENSHOT_MODES.live) return;
    const doc = canvasElement.ownerDocument;
    const page = within(doc.body);
    await waitForQuietPage({
      quietMs: 1500,
      timeoutMs: 30000,
      readySelector: '[data-testid="plus-menu-button"]',
    });
    const plus = await page.findByTestId('plus-menu-button', {}, { timeout: 15000 });
    await userEvent.click(plus);
    // the pointer leaves «+», so its tooltip does not cover the field
    await userEvent.unhover(plus);
    for (const row of rows) await userEvent.click(await page.findByTestId(row, {}, { timeout: 5000 }));
    // the clicked row keeps no keyboard focus (its focus colour is not the open row's colour)
    if (rows.length && doc.activeElement?.getAttribute('role') === 'menuitem') doc.activeElement.blur();
  };

export default {
  title: 'features/chat/Plus menu',
  // Storybook reads tags statically, so the literal; see SCREENSHOT_TAG
  tags: ['screenshot'],
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Suspense>
        <AppLayout />
      </Suspense>
    </Box>
  ),
};

// #7717 piece 4. A new chat in a team project: no numbers, no «N left» after Attach Files, Invite Users last (it stays in
// a new chat, unlike the concept). Concept: concepts-chat-2-plus-menu--new-chat-menu.
export const NewChatMenu = {
  ...chatScreen('/chat?create=1'),
  name: 'New chat — the «+» menu',
  play: open(),
};

// #7717 piece 4. A saved chat with something of every kind: each row says how many («Agents 3»); no Invite Users
// (Share in the chat's menu). Concept: the rows of concepts-chat-2-plus-menu--modules-with-descriptions.
export const ChatMenuWithCounts = {
  ...chatScreen(`/chat/${FULL_CHAT_ID}`),
  name: 'Chat — the «+» menu with counts',
  play: open(),
};
