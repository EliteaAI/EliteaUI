import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const APPLICATIONS_TOUR_TARGET_IDS = {
  page: 'applications-page',
  applicationsTab: 'applications-tab',
  applicationsList: 'applications-list',
  catalogTab: 'applications-catalog-tab',
  catalogGrid: 'applications-catalog-grid',
  catalogActions: 'applications-catalog-actions',
  documentationLink: 'applications-catalog-documentation-link',
  wikisCard: 'applications-wikis-card',
  inventoryCard: 'applications-inventory-card',
};

export const APPLICATIONS_TOUR_TARGETS = {
  page: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.page),
  applicationsTab: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.applicationsTab),
  applicationsList: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.applicationsList),
  catalogTab: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.catalogTab),
  catalogGrid: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.catalogGrid),
  catalogActions: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.catalogActions),
  documentationLink: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.documentationLink),
  wikisCard: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.wikisCard),
  inventoryCard: buildTourSelector(APPLICATIONS_TOUR_TARGET_IDS.inventoryCard),
};
