import { buildTourSelector } from '../helpers/tourSelector.helpers';

export const USERS_TOUR_TARGET_IDS = {
  page: 'users-page',
  inviteButton: 'users-invite-button',
  userList: 'users-list',
  userActions: 'users-actions',
};

export const USERS_TOUR_TARGETS = {
  page: buildTourSelector(USERS_TOUR_TARGET_IDS.page),
  inviteButton: buildTourSelector(USERS_TOUR_TARGET_IDS.inviteButton),
  userList: buildTourSelector(USERS_TOUR_TARGET_IDS.userList),
  userActions: buildTourSelector(USERS_TOUR_TARGET_IDS.userActions),
};
