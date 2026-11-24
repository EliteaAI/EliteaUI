// Chat concept, part 1 — the input field (approved prototype, tag chat-prototype-approved-2026-11-18, default view).
// The team's real chat screen (AppLayout on /chat) with one part replaced: the input field (ConceptChatInput) and the
// context ring inside it (ConceptContextRing); see CONCEPT_SWAPS in .storybook/main.js. Everything else is dev as is.
// The right Participants panel stays as on dev, without its context ring (the ring has moved into the field).
// Sample data, not wired to the API. What to build and the acceptance criteria: the GitHub issue of this branch.
import { SCREENSHOT_MODES } from '@/[fsd]/stories/lib/screenshot.constants';

import { CHAT, NEW_CHAT, frame, freshChat, screen } from './conceptScreen';
import { contextStatus } from './data';
import { pageSettled } from './storyPlay';

// The story counts as rendered once the chat page has loaded with the field (the app loads in two steps): screenshots
// (npm run storybook:shots) wait for the story's play, otherwise they caught an empty page before the app drew.
const settled = async ({ canvasElement, globals }) => {
  // in the compare modes the screen lives in a frame that runs the story on its own
  if (globals.screenshot && globals.screenshot !== SCREENSHOT_MODES.live) return;
  await pageSettled(canvasElement.ownerDocument, '[data-testid="concept-chat-input"]');
};

export default {
  title: 'concepts/Chat/1 Input field',
  // baselines in light and dark next to this file (npm run storybook:shots); Storybook reads tags statically
  tags: ['screenshot'],
  parameters: { layout: 'fullscreen' },
  beforeEach: freshChat,
  play: settled,
};

// Light or dark: the theme switch in the Storybook toolbar; the field uses the team's theme colours, so no story per theme.
// What changes is only the field: the model's button and its ⚙ leave the field and sit under it; the context ring
// moves into the field (from the right Participants panel); the hint «# for assistants» stays with the caret in it.

// A new chat: «+» on the left; mic and «Speaking mode» on the right; the model and its ⚙ under the field.
export const NewChat = {
  name: '1 New chat — model under the field',
  render: screen({ concept: true }),
  decorators: [frame({ path: NEW_CHAT })],
};

// A chat with messages: «Clear the chat» next to «+»; the context ring before the mic. Hover the ring for the
// three-line tooltip, click it for the Context management card.
export const Chat = {
  name: '2 Chat with messages — ring in the field',
  render: screen({ concept: true }),
  decorators: [frame({ path: CHAT })],
};

// The ring near the limit: from the compaction threshold (90 % of usable input) it takes the team's warning colour,
// at the limit the error colour; the card shows «Summarize now», as on dev.
export const ChatNearLimit = {
  name: '3 Chat — ring near the context limit',
  render: screen({ concept: true }),
  decorators: [frame({ path: CHAT, context: contextStatus(250000) })],
};
