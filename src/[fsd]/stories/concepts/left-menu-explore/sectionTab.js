// Which section's page is open (Agents, Pipelines, Skills, Toolkits & Indexes, MCPs, Applications), shared by Explore's
// hover list in the menu and the section page across the concept's stories: the module keeps it while Storybook
// switches stories in the same frame, and the tab's sessionStorage keeps it when the bare iframe.html opens the other
// story as a new page. Nothing reaches a backend. In the team's code this is the address: each section has its own
// route already (src/routes.js: /agents, /pipelines, /skills, /toolkits, /mcps, /apps).
import { useSyncExternalStore } from 'react';

const KEY = 'concept-left-menu-section';
const listeners = new Set();

const read = () => {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
};
let state = { tab: read().tab ?? 'agents' };

const subscribe = listener => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSectionTab = () => useSyncExternalStore(subscribe, () => state);

export const setSectionTab = key => {
  state = { tab: key };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // no storage (a locked-down browser): the choice lives as long as the page
  }
  listeners.forEach(listener => listener());
};
