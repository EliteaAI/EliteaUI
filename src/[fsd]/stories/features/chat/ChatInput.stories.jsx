// The chat input as built: the real chat screen (AppLayout on /chat) on sample data. Each story names the concept story
// (concepts/Chat) it implements; the concept stays the design for the pieces not built yet.
import { Suspense, lazy } from 'react';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { CHAT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { SCREENSHOT_MODES } from '@/[fsd]/stories/lib/screenshot.constants';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';
import { waitForQuietPage } from '@/[fsd]/stories/lib/storyPlay.helpers';
import { ActiveConversationParticipantKey } from '@/common/constants';

import { AGENT_PARTICIPANT_KEY, CHAT_ID, PROJECT_ID, routes, state } from './chatInput.data';

// Lazy so the routes module loads before the layout
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

const NEW_CHAT = '/chat?create=1';
const CHAT = `/chat/${CHAT_ID}`;
const INPUT_SELECTOR = `[data-tour="${CHAT_TOUR_TARGET_IDS.messageInput}"] textarea`;

// The chat keeps the one who answers in localStorage; each story sets it (or clears it) before the app reads it
const answeredBy = participantKey => () => {
  window.localStorage.removeItem(ActiveConversationParticipantKey);
  if (participantKey) {
    window.localStorage.setItem(
      ActiveConversationParticipantKey,
      JSON.stringify({ [PROJECT_ID]: [{ cid: CHAT_ID, pid: participantKey }] }),
    );
  }
};

const chatScreen = path => ({
  decorators: [withStoryApi({ routes: routes(), state, width: '100vw', height: '100vh', path })],
});

// Rendered once the chat page has drawn its field and gone quiet; screenshots wait for the play. In the compare modes the
// screen lives in a frame that runs the story on its own.
const settled = async ({ globals }) => {
  if (globals.screenshot && globals.screenshot !== SCREENSHOT_MODES.live) return false;
  await waitForQuietPage({ quietMs: 1500, timeoutMs: 30000, readySelector: INPUT_SELECTOR });
  return true;
};

const focusInput = async context => {
  if (!(await settled(context))) return;
  document.querySelector(INPUT_SELECTOR)?.focus();
};

export default {
  title: 'features/chat/Chat input',
  // Storybook reads tags statically, so the literal; see SCREENSHOT_TAG
  tags: ['screenshot'],
  parameters: { layout: 'fullscreen' },
  beforeEach: answeredBy(null),
  play: settled,
  render: () => (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Suspense>
        <AppLayout />
      </Suspense>
    </Box>
  ),
};

// #7717 piece 2. A new chat with the caret in the empty field: «Type your message… # for assistants» stays.
// Concept: concepts-chat-1-input-field--new-chat (the field's hint).
export const NewChatFocused = {
  ...chatScreen(NEW_CHAT),
  name: 'New chat — «#» hint with the caret in the field',
  play: focusInput,
};

// #7717 piece 2. An agent answers: «Reply to Release Notes Writer…».
export const ReplyToAgent = {
  ...chatScreen(CHAT),
  name: 'Chat — an agent answers, «Reply to <agent>…»',
  beforeEach: answeredBy(AGENT_PARTICIPANT_KEY),
};
