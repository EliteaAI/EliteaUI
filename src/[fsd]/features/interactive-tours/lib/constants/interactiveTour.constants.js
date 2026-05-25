export const CARD_WIDTH_PX = 440;

const buildTourSelector = targetId => `[data-tour="${targetId}"]`;

export const SHARED_TOUR_TARGET_IDS = {
  runHistory: 'shared-run-history',
};

export const SHARED_TOUR_TARGETS = {
  runHistory: buildTourSelector(SHARED_TOUR_TARGET_IDS.runHistory),
};
