import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const CREDENTIALS_TOUR_TARGET_IDS = {
  page: 'credentials-page',
  form: 'credentials-form',
  testConnection: 'credentials-test-connection',
};

export const CREDENTIALS_TOUR_TARGETS = {
  page: buildTourSelector(CREDENTIALS_TOUR_TARGET_IDS.page),
  form: buildTourSelector(CREDENTIALS_TOUR_TARGET_IDS.form),
  testConnection: buildTourSelector(CREDENTIALS_TOUR_TARGET_IDS.testConnection),
};
