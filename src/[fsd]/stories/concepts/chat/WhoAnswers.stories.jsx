// Chat concept — «who answers»: one button under the field and its list, the new place of the right Participants
// panel. The team's real chat screen with the concept field; the button and its list are ConceptWhoAnswers (changes and their reasons in its
// header). Each story opens what its name says when it loads; everything in it can be clicked: a model, a row (makes it
// answer), Edit, ⚙, Remove, «Fix», «Toolkits & MCP». Sample data, not wired to the API. What to build: the GitHub issue
// of the branch. Only these stories switch «who answers» on (screen › whoAnswers): stories 1.x and 2.x keep dev's
// model button, its ⚙ and the right Participants panel.
import { userEvent, within } from 'storybook/test';

import { SCREENSHOT_MODES } from '@/[fsd]/stories/lib/screenshot.constants';

import { FULL_CHAT, NEW_CHAT, frame, freshChat, screen } from './conceptScreen.helpers';
import { pageSettled, wait } from './storyPlay.helpers';

export default {
  title: 'concepts/Chat/3 Who answers',
  // baselines in light and dark next to this file (npm run storybook:shots); Storybook reads tags statically
  tags: ['screenshot'],
  parameters: { layout: 'fullscreen' },
  beforeEach: freshChat,
};

const BUTTON = 'who-answers-button';
const LIST = 'who-answers-list';

// Opens the list; before that, optionally makes a row of the list answer (a click on it closes the list). In the
// compare modes the screen lives in a frame that runs the story on its own: nothing to do here then (returns null).
const openList = async ({ canvasElement, globals }, { answer } = {}) => {
  if (globals?.screenshot && globals.screenshot !== SCREENSHOT_MODES.live) return null;
  const doc = canvasElement.ownerDocument;
  const page = within(doc.body);
  await pageSettled(doc, `[data-testid="${BUTTON}"]`);
  const button = await page.findByTestId(BUTTON, {}, { timeout: 15000 });
  // below 1200 px the chat stands under the chats list: the page scrolls to the button first
  button.scrollIntoView({ block: 'end' });
  if (answer) {
    await userEvent.click(button);
    // inside the list: below 1200 px the team's Participants panel is in the page too (hidden), with the same names
    const list = within(await page.findByTestId(LIST, {}, { timeout: 5000 }));
    await userEvent.click(await list.findByText(answer, {}, { timeout: 5000 }));
    // the chat switches the one who answers and loads its details
    await wait(1500);
  }
  await userEvent.click(await page.findByTestId(BUTTON, {}, { timeout: 5000 }));
  // the pointer leaves the button, so its tooltip does not cover the list
  await userEvent.unhover(button);
  // the list grows in; the next click waits until it stands where it stays
  await wait(400);
  return page;
};

// A new chat: only the model is in it, so the list is the models themselves — Auto first, the current one highlighted
// with ⚙ «Model settings». A click on a model makes it answer.
export const NewChatModels = {
  name: '1 New chat — the models',
  render: screen({ concept: true, whoAnswers: true }),
  decorators: [frame({ path: NEW_CHAT, whoAnswers: true })],
  play: context => openList(context),
};

// A chat with something of every kind, the model answers: «Model» with the current model (framed), then Agents,
// Pipelines, Skills as in the panel on dev, then «Toolkits & MCP · 4» — its orange dot says one needs setup, and so does
// the dot on the button. Edit, ⚙ and Remove show under the pointer; a click on a row makes it answer.
export const ModelAnswers = {
  name: '2 Chat — the model answers',
  render: screen({ concept: true, whoAnswers: true }),
  decorators: [frame({ path: FULL_CHAT, whoAnswers: true })],
  play: context => openList(context),
};

// An agent answers: the button says who («Jira Helper · v3-strict-review» — the version shows when it is not latest),
// its row in the list is framed; a second click on it, or a model picked from «Model», gives the answer back.
export const AgentAnswers = {
  name: '3 Chat — an agent answers, with its version',
  render: screen({ concept: true, whoAnswers: true }),
  decorators: [frame({ path: FULL_CHAT, whoAnswers: true })],
  play: context => openList(context, { answer: 'Jira Helper' }),
};

// «Toolkits & MCP» opens its rows beside the list: toolkits, then MCPs. GitHub is misconfigured: «Fix» on its row
// opens the toolkit's editor, as the pencil does (dev: the link «Check the toolkit» in the warning line). SharePoint,
// Billing API (an OpenAPI toolkit) and the Playwright MCP wait for the user to sign in: «Log in» in the same place
// starts the sign-in (dev: the link «Log in.» in the warning line).
export const ToolkitsAndMcp = {
  name: '4 Chat — Toolkits & MCP, Fix and Log in',
  render: screen({ concept: true, whoAnswers: true }),
  decorators: [frame({ path: FULL_CHAT, whoAnswers: true })],
  play: async context => {
    const page = await openList(context);
    if (!page) return;
    await userEvent.click(await page.findByTestId('who-answers-tools-row', {}, { timeout: 5000 }));
  },
};

// ⚙ «Model settings»: the model's settings as on dev, then «How the AI works in this chat» — the five modules that
// left «+» › Modules, scrolled into view. The switches are saved by Apply, with the model's settings; Cancel drops them.
export const ModelSettings = {
  name: '5 Chat — ⚙ Model settings',
  render: screen({ concept: true, whoAnswers: true }),
  decorators: [frame({ path: FULL_CHAT, whoAnswers: true })],
  play: async context => {
    const page = await openList(context);
    if (!page) return;
    // ⚙ shows under the pointer only, as on the other rows
    await userEvent.hover(await page.findByTestId('who-answers-model-row', {}, { timeout: 5000 }));
    await userEvent.click(await page.findByTestId('who-answers-model-settings', {}, { timeout: 5000 }));
    // the window opens at its top, as on dev: the model's settings first, the modules below them (story 5b shows them)
    await page.findByTestId('model-settings-modules', {}, { timeout: 5000 });
  },
};

// The same window scrolled to what this piece adds: «How the AI works in this chat», the five switches that left «+» ›
// Modules. On most screens the window is shorter than its content, so story 5 shows only dev's settings.
export const ModelSettingsModules = {
  name: '5b Chat — ⚙ Model settings, scrolled to «How the AI works in this chat»',
  render: screen({ concept: true, whoAnswers: true }),
  decorators: [frame({ path: FULL_CHAT, whoAnswers: true })],
  play: async context => {
    const page = await openList(context);
    if (!page) return;
    // ⚙ shows under the pointer only, as on the other rows
    await userEvent.hover(await page.findByTestId('who-answers-model-row', {}, { timeout: 5000 }));
    await userEvent.click(await page.findByTestId('who-answers-model-settings', {}, { timeout: 5000 }));
    const modules = await page.findByTestId('model-settings-modules', {}, { timeout: 5000 });
    // the dialog grows in and its settings load in parts: scrolled again until the section stays at the top (critic
    // 2026-11-23: one early scroll left 1100 and 630 at the window's top)
    for (let i = 0; i < 10; i += 1) {
      await wait(300);
      modules.scrollIntoView({ block: 'start' });
    }
  },
};

// ⚙ of an agent («Settings in this chat: version, variables»): its versions with a check on the one the chat uses,
// then «Variables» (the team's dialog). A skill's ⚙ has the versions only.
export const AgentSettings = {
  name: '6 Chat — ⚙ of an agent: version and variables',
  render: screen({ concept: true, whoAnswers: true }),
  decorators: [frame({ path: FULL_CHAT, whoAnswers: true })],
  play: async context => {
    const page = await openList(context);
    if (!page) return;
    const list = within(await page.findByTestId(LIST, {}, { timeout: 5000 }));
    const row = await list.findByText('Jira Helper', {}, { timeout: 5000 });
    await userEvent.hover(row);
    const gears = await list.findAllByTestId('who-answers-participant-settings', {}, { timeout: 5000 });
    // the hovered row's ⚙ is the one in view (the others are hidden until their row is under the pointer)
    const gear = gears.find(g => g.offsetParent !== null) || gears[0];
    await userEvent.click(gear);
  },
};
