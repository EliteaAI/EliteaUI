import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const NOTIFICATIONS_TOUR_TARGET_IDS = {
  page: 'notifications-page',
  toolbar: 'notifications-toolbar',
};

export const NOTIFICATIONS_TOUR_TARGETS = {
  page: buildTourSelector(NOTIFICATIONS_TOUR_TARGET_IDS.page),
  toolbar: buildTourSelector(NOTIFICATIONS_TOUR_TARGET_IDS.toolbar),
};
