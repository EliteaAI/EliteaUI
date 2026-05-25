import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const CARD_WIDTH_PX = 440;

export const SHARED_TOUR_TARGET_IDS = {
  workspace: 'shared-tool-editor-workspace',
  configurationForm: 'shared-tool-configuration-form',
  tools: 'shared-tool-tools',
  testSettings: 'shared-tool-test-settings',
  runHistory: 'shared-run-history',
  rawJsonTab: 'shared-raw-json-tab',
};

export const SHARED_TOUR_TARGETS = {
  workspace: buildTourSelector(SHARED_TOUR_TARGET_IDS.workspace),
  configurationForm: buildTourSelector(SHARED_TOUR_TARGET_IDS.configurationForm),
  tools: buildTourSelector(SHARED_TOUR_TARGET_IDS.tools),
  testSettings: buildTourSelector(SHARED_TOUR_TARGET_IDS.testSettings),
  runHistory: buildTourSelector(SHARED_TOUR_TARGET_IDS.runHistory),
  rawJsonTab: buildTourSelector(SHARED_TOUR_TARGET_IDS.rawJsonTab),
};
