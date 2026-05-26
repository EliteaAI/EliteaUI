import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const PERSONAL_TOKENS_TOUR_TARGET_IDS = {
  page: 'personal-tokens-page',
  addButton: 'personal-tokens-add-button',
  tokenList: 'personal-tokens-list',
  ideSettings: 'personal-tokens-ide-settings',
};

export const PERSONAL_TOKENS_TOUR_TARGETS = {
  page: buildTourSelector(PERSONAL_TOKENS_TOUR_TARGET_IDS.page),
  addButton: buildTourSelector(PERSONAL_TOKENS_TOUR_TARGET_IDS.addButton),
  tokenList: buildTourSelector(PERSONAL_TOKENS_TOUR_TARGET_IDS.tokenList),
  ideSettings: buildTourSelector(PERSONAL_TOKENS_TOUR_TARGET_IDS.ideSettings),
};
