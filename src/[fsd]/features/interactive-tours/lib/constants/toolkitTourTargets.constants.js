import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const TOOLKIT_TOUR_TARGET_IDS = {
  workspace: 'toolkit-workspace',
  indexesTab: 'toolkit-indexes-tab',
  configurationForm: 'toolkit-configuration-form',
  tools: 'toolkit-tools',
  testSettings: 'toolkit-test-settings',
};

export const TOOLKIT_TOUR_TARGETS = {
  workspace: buildTourSelector(TOOLKIT_TOUR_TARGET_IDS.workspace),
  indexesTab: buildTourSelector(TOOLKIT_TOUR_TARGET_IDS.indexesTab),
  configurationForm: buildTourSelector(TOOLKIT_TOUR_TARGET_IDS.configurationForm),
  tools: buildTourSelector(TOOLKIT_TOUR_TARGET_IDS.tools),
  testSettings: buildTourSelector(TOOLKIT_TOUR_TARGET_IDS.testSettings),
};
