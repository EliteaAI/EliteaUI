import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const CARD_WIDTH_PX = 440;

export const SHARED_TOUR_TARGET_IDS = {
  runHistory: 'shared-run-history',
  rawJsonTab: 'shared-raw-json-tab',
};

export const SHARED_TOUR_TARGETS = {
  runHistory: buildTourSelector(SHARED_TOUR_TARGET_IDS.runHistory),
  rawJsonTab: buildTourSelector(SHARED_TOUR_TARGET_IDS.rawJsonTab),
};
