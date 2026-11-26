// The chat input as built: the real chat screen (AppLayout on /chat) on sample data. Each story names the concept story
// (concepts/Chat) it implements; the concept stays the design for the pieces not built yet.
import { Suspense, lazy } from 'react';

import { userEvent, within } from 'storybook/test';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { CHAT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { SCREENSHOT_MODES } from '@/[fsd]/stories/lib/screenshot.constants';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';
import { waitForQuietPage } from '@/[fsd]/stories/lib/storyPlay.helpers';
import { ActiveConversationParticipantKey } from '@/common/constants';

import {
  AGENT,
  AGENT_PARTICIPANT_KEY,
  AGENT_VERSION,
  CHAT_ID,
  PROJECT_ID,
  contextStatus,
  routes,
  state,
} from './chatInput.data';

// Lazy so the routes module loads before the layout
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

const NEW_CHAT = '/chat?create=1';
const CHAT = `/chat/${CHAT_ID}`;
const AGENT_EDITOR = `/agents/all/${AGENT.id}/${AGENT_VERSION.id}?viewMode=owner`;
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

const chatScreen = (path, chatRoutes = routes()) => ({
  decorators: [withStoryApi({ routes: chatRoutes, state, width: '100vw', height: '100vh', path })],
});

// Rendered once the chat page has drawn its field and gone quiet; screenshots wait for the play. In the compare modes the
// screen lives in a frame that runs the story on its own.
const isLive = ({ globals }) => !globals.screenshot || globals.screenshot === SCREENSHOT_MODES.live;

const settled = async context => {
  if (!isLive(context)) return false;
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

// #7717 piece 1. The agent editor's test chat: the same field, the model and ⚙ under it.
export const AgentTestChat = {
  ...chatScreen(AGENT_EDITOR),
  name: 'Agent editor — test chat, the model under the field',
  play: async context => {
    if (!isLive(context)) return;
    const page = within(context.canvasElement);
    await userEvent.click(await page.findByRole('button', { name: 'Test Agent' }, { timeout: 30000 }));
    await settled(context);
  },
};

// #7717 piece 3. A saved chat far from the limit: the grey ring in the field before the mic, the Participants panel
// without its context block. Concept: concepts-chat-1-input-field--chat.
export const ChatWithMessages = {
  ...chatScreen(CHAT),
  name: 'Chat — the context ring in the field',
};

// #7717 piece 3. The same chat past the compaction threshold: the ring in the warning colour.
// Concept: concepts-chat-1-input-field--chat-near-limit.
export const ChatNearLimit = {
  ...chatScreen(CHAT, routes({ context: contextStatus(250000) })),
  name: 'Chat — the context ring near the limit',
};

// #7717 piece 3. A click on the ring opens the context card above it.
export const ContextCard = {
  ...chatScreen(CHAT),
  name: 'Chat — the context card above the ring',
  play: async context => {
    if (!(await settled(context))) return;
    const page = within(context.canvasElement);
    await userEvent.click(await page.findByTestId('context-budget-ring'));
    await page.findByTestId('context-budget-popover');
  },
};
