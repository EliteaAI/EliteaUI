import { TourTargetConstants } from '@/[fsd]/shared/lib/constants';

import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const CARD_WIDTH_PX = 440;

export const { SHARED_TOUR_TARGET_IDS } = TourTargetConstants;

export const SHARED_TOUR_TARGETS = {
  workspace: buildTourSelector(SHARED_TOUR_TARGET_IDS.workspace),
  configurationForm: buildTourSelector(SHARED_TOUR_TARGET_IDS.configurationForm),
  tools: buildTourSelector(SHARED_TOUR_TARGET_IDS.tools),
  testSettings: buildTourSelector(SHARED_TOUR_TARGET_IDS.testSettings),
  runHistory: buildTourSelector(SHARED_TOUR_TARGET_IDS.runHistory),
  rawJsonTab: buildTourSelector(SHARED_TOUR_TARGET_IDS.rawJsonTab),
};
