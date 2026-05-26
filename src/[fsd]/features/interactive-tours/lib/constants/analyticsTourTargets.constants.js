import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const ANALYTICS_TOUR_TARGET_IDS = {
  page: 'analytics-page',
  dateFilter: 'analytics-date-filter',
  kpiCards: 'analytics-kpi-cards',
  tabs: 'analytics-tabs',
  tabSection: 'analytics-tab-section',
};

export const ANALYTICS_TOUR_TARGETS = {
  page: buildTourSelector(ANALYTICS_TOUR_TARGET_IDS.page),
  dateFilter: buildTourSelector(ANALYTICS_TOUR_TARGET_IDS.dateFilter),
  kpiCards: buildTourSelector(ANALYTICS_TOUR_TARGET_IDS.kpiCards),
  tabs: buildTourSelector(ANALYTICS_TOUR_TARGET_IDS.tabs),
  tabSection: buildTourSelector(ANALYTICS_TOUR_TARGET_IDS.tabSection),
};
