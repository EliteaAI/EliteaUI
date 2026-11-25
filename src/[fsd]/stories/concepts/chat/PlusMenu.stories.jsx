// The «+» menu under the concept field; ConceptPlusButton copies the team's PlusChatButton and ConceptPlusSubmenu
// its PlusChatSubmenu, changes marked «concept:». Each story opens the menu on load. Sample data, not wired to the API:
// a pick changes nothing on the screen.
import { userEvent, within } from 'storybook/test';

import { SCREENSHOT_MODES } from '@/[fsd]/stories/lib/screenshot.constants';
import { pageSettled } from '@/[fsd]/stories/lib/storyPlay.helpers';

import { frame, freshChat, screen } from './conceptScreen';
import { FULL_CHAT, NEW_CHAT } from './conceptScreen.constants';

export default {
  title: 'concepts/Chat/2 Plus menu',
  // baselines in light and dark next to this file (npm run storybook:shots); Storybook reads tags statically
  tags: ['screenshot'],
  parameters: { layout: 'fullscreen' },
  beforeEach: freshChat,
};

const open =
  (...rows) =>
  async ({ canvasElement, globals }) => {
    // in the compare modes the screen lives in a frame that runs the story on its own
    if (globals.screenshot && globals.screenshot !== SCREENSHOT_MODES.live) return;
    const doc = canvasElement.ownerDocument;
    const page = within(doc.body);
    await pageSettled(doc, '[data-testid="plus-menu-button"]');
    const plus = await page.findByTestId('plus-menu-button', {}, { timeout: 15000 });
    // below 1200 px the chat stands under the chats list: the page scrolls to the field first
    plus.scrollIntoView({ block: 'end' });
    await userEvent.click(plus);
    // the pointer leaves «+», so its tooltip does not cover the field
    await userEvent.unhover(plus);
    for (const row of rows) await userEvent.click(await page.findByTestId(row, {}, { timeout: 5000 }));
    // the clicked row keeps no keyboard focus (its focus colour is not the open row's colour)
    if (rows.length && doc.activeElement?.getAttribute('role') === 'menuitem') doc.activeElement.blur();
  };

// A new chat: Attach Files, Modules, Agents, Pipelines, Skills, Toolkits, MCPs — no Invite Users (people come from
// Share in the header). Nothing is in the chat yet, so no row has a number.
export const NewChatMenu = {
  name: '1 New chat — the «+» menu',
  render: screen({ concept: true }),
  decorators: [frame({ path: NEW_CHAT })],
  play: open(),
};

// A chat with something of every kind: each row says how many are in the chat («Agents 3»). Modules lists what a
// person turns on for a request, each with its description; the switch saves it for this chat, as on dev. The modules
// are dev's, all nine.
export const ModulesWithDescriptions = {
  name: '2 Chat — Modules with descriptions',
  render: screen({ concept: true }),
  decorators: [frame({ path: FULL_CHAT })],
  play: open('internal-tools-menuitem'),
};

// Agents: «Create Agent» under the search; the chat's agents on top under «In this chat · 3», each with a check that
// gives way to a delete icon («Remove agent») under the pointer, then «All agents · N». Catalog agents not in the chat carry the «Catalog» label. A row not yet
// added adds the agent and closes the menu; scrolling down loads the next 20.
export const AgentsInThisChat = {
  name: '3 Chat — Agents, in this chat on top',
  render: screen({ concept: true }),
  decorators: [frame({ path: FULL_CHAT })],
  play: open('agents-menuitem'),
};

// Toolkits (and MCPs): a switch in each row; it keeps the list open, so several can be turned on in a row.
export const ToolkitsWithSwitches = {
  name: '4 Chat — Toolkits with switches',
  render: screen({ concept: true }),
  decorators: [frame({ path: FULL_CHAT })],
  play: open('toolkits-menuitem'),
};
