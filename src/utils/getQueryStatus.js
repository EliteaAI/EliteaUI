import { CollectionStatus } from '@/common/constants';

export const getQueryStatuses = statuses =>
  statuses?.length && !statuses?.includes(CollectionStatus.All) ? statuses.join(',') : undefined;
