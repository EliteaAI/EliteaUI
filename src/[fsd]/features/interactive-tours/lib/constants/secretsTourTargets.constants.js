import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const SECRETS_TOUR_TARGET_IDS = {
  page: 'secrets-page',
  addButton: 'secrets-add-button',
  secretList: 'secrets-list',
  secretActions: 'secrets-actions',
};

export const SECRETS_TOUR_TARGETS = {
  page: buildTourSelector(SECRETS_TOUR_TARGET_IDS.page),
  addButton: buildTourSelector(SECRETS_TOUR_TARGET_IDS.addButton),
  secretList: buildTourSelector(SECRETS_TOUR_TARGET_IDS.secretList),
  secretActions: buildTourSelector(SECRETS_TOUR_TARGET_IDS.secretActions),
};
