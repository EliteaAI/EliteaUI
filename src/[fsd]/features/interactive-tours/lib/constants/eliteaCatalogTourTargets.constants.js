import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const ELITEA_CATALOG_TOUR_TARGET_IDS = {
  workspace: 'elitea-catalog-workspace',
  searchAndCategoryFilters: 'elitea-catalog-search-and-category-filters',
  entityCard: 'elitea-catalog-entity-card',
  likeButton: 'elitea-catalog-like-button',
  primaryActionButton: 'elitea-catalog-primary-action-button',
};

const ELITEA_CATALOG_WORKSPACE_SELECTOR = buildTourSelector(ELITEA_CATALOG_TOUR_TARGET_IDS.workspace);

export const ELITEA_CATALOG_TOUR_TARGETS = {
  workspace: ELITEA_CATALOG_WORKSPACE_SELECTOR,
  searchAndCategoryFilters: `${ELITEA_CATALOG_WORKSPACE_SELECTOR} [data-category-filter-controls]`,
  entityCard: buildTourSelector(ELITEA_CATALOG_TOUR_TARGET_IDS.entityCard),
  likeButton: buildTourSelector(ELITEA_CATALOG_TOUR_TARGET_IDS.likeButton),
  primaryActionButton: buildTourSelector(ELITEA_CATALOG_TOUR_TARGET_IDS.primaryActionButton),
};
