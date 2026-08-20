import { BannerSeverity } from './indexDetails.constants';

export const IndexingBlockers = {
  loading: 'loading',
  notConfigured: 'not_configured',
  buildsDisabled: 'builds_disabled',
};

export const IndexingBlockerBanners = {
  [IndexingBlockers.notConfigured]: {
    severity: BannerSeverity.info,
    label: 'Indexing is not available',
    message: 'Set a PgVector connection and an Embedding Model in the configuration to enable indexing.',
  },
  [IndexingBlockers.buildsDisabled]: {
    severity: BannerSeverity.info,
    label: 'Index data tool not enabled',
    message: 'Enable the “Index data” tool to activate indexing and create indexes.',
  },
};
