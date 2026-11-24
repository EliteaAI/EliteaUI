// The chat concept's screen for its stories: the team's real chat screen (AppLayout on /chat) on sample data, with the
// concept's parts swapped in (ConceptSwapProvider; CONCEPT_SWAPS in .storybook/main.js). The right Participants panel
// stays as on dev, without its context ring: the ring has moved into the field.
import { Suspense, lazy } from 'react';

import { Box } from '@mui/material';

import '@/[fsd]/app/routes';
import { withStoryApi } from '@/[fsd]/stories/lib/storyApi';

import { ConceptSwapProvider } from './conceptSwap';
import { CHAT_ID, FULL_CHAT_ID, STATUS_MARK, routes, state } from './data';

// Lazy so the routes module loads before the layout
const AppLayout = lazy(() => import('@/[fsd]/app/layout/AppLayout'));

// The panel's context block (Participants.jsx, `{conversationId && (` … ContextBudgetInfo) is hidden here; in the product
// that block is removed from the panel. The field's ring carries the same tour target, so the rule skips the field.
const HIDE_PANEL_RING = {
  '& [data-tour="chat-context-budget"]:not([data-testid="concept-chat-input"] *)': { display: 'none' },
};

const CONCEPT = { chatInput: true, contextRing: true };

export const screen = ({ concept }) => {
  const Screen = () => (
    <ConceptSwapProvider value={concept ? CONCEPT : {}}>
      {/* scrolls as the app's page does: below 1200 px the chats list stands over the chat (NewChat › isSmallWindow) and
          the page scrolls down to it; storyApi's frame is fixed, so without this the chat was out of reach */}
      <Box sx={[{ width: '100%', height: '100%', overflowY: 'auto' }, concept && HIDE_PANEL_RING]}>
        <Suspense>
          <AppLayout />
        </Suspense>
      </Box>
    </ConceptSwapProvider>
  );
  return Screen;
};

// The team's storyApi answers 200 to everything; an answer marked with STATUS_MARK (data.js › withStatus) goes out with
// its own status instead, so the app's validators see a 400 (the misconfigured GitHub toolkit of the full chat). Installed once,
// over storyApi's fetch; storyApi.jsx is the team's file and is not edited.
const withStatuses = () => {
  if (window.__conceptStatusesInstalled) return;
  window.__conceptStatusesInstalled = true;
  const storyFetch = window.fetch;
  window.fetch = async (input, init) => {
    const response = await storyFetch(input, init);
    const url = typeof input === 'string' ? input : input.url;
    if (!url.includes('/api/v2/') || !response.headers.get('Content-Type')?.includes('json')) return response;
    const answer = await response.clone().json();
    if (!answer || typeof answer !== 'object' || !(STATUS_MARK in answer)) return response;
    return new Response(JSON.stringify(answer.body), {
      status: answer[STATUS_MARK],
      headers: { 'Content-Type': 'application/json' },
    });
  };
};

// Every story starts from its own data: the chat keeps the one who answers in localStorage (ActiveConversationParticipantKey),
// so after «an agent answers» the next story opened with Jira Helper answering. The stories' meta runs it (beforeEach).
export const freshChat = () => {
  window.localStorage.removeItem('ActiveConversationParticipantKey');
};

// The screen fills the Storybook pane (storyApi's frame sized 100vw × 100vh, as the team's screen stories): the app lays
// itself out for the window (isSmallWindow reads window.innerWidth); screenshots and the compare view open it at 1366×768.
export const frame = ({ path, context }) => {
  const storyApi = withStoryApi({
    routes: routes({ context }),
    state,
    width: '100vw',
    height: '100vh',
    path,
  });
  const ConceptFrame = Story => {
    // storyApi installs its fetch while it renders, so the status layer goes on after it
    const element = storyApi(Story);
    withStatuses();
    return element;
  };
  return ConceptFrame;
};

export const NEW_CHAT = '/chat?create=1';
export const CHAT = `/chat?conversation=${CHAT_ID}`;
export const FULL_CHAT = `/chat?conversation=${FULL_CHAT_ID}`;
