import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const SIDEBAR_TOUR_TARGET_IDS = {
  logo: 'sidebar-logo',
  themeToggle: 'sidebar-switch-dark-light-mode',
  projectSwitcher: 'sidebar-project-switcher',
  newChat: 'sidebar-new-chat',
  explore: 'sidebar-explore',
  chats: 'sidebar-chats',
  navArtifacts: 'sidebar-nav-artifacts',
  settings: 'sidebar-settings',
  resources: 'sidebar-resources',
  notifications: 'sidebar-notifications',
  user: 'sidebar-user',
  supportAssistant: 'sidebar-support-assistant',
};

export const SIDEBAR_TOUR_TARGETS = {
  logo: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.logo),
  themeToggle: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.themeToggle),
  projectSwitcher: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.projectSwitcher),
  newChat: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.newChat),
  explore: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.explore),
  chats: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.chats),
  navArtifacts: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.navArtifacts),
  settings: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.settings),
  resources: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.resources),
  notifications: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.notifications),
  user: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.user),
  supportAssistant: buildTourSelector(SIDEBAR_TOUR_TARGET_IDS.supportAssistant),
};
