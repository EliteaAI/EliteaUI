export const IndexingReportKind = {
  indexed: 'indexed',
  skipped: 'skipped',
  notIndexed: 'not_indexed',
  failed: 'failed',
};

export const IndexingReportStatus = {
  ok: 'ok',
  partlyIndexed: 'partly_indexed',
  error: 'error',
};

export const INDEXING_REPORT_KIND_ORDER = [
  IndexingReportKind.indexed,
  IndexingReportKind.skipped,
  IndexingReportKind.notIndexed,
  IndexingReportKind.failed,
];

export const INDEXING_REPORT_KIND_PRESENTATION = {
  [IndexingReportKind.indexed]: { icon: '✅', verb: 'indexed', tone: 'success' },
  [IndexingReportKind.skipped]: { icon: '⚠️', verb: 'skipped', tone: 'warning' },
  [IndexingReportKind.notIndexed]: { icon: '⚠️', verb: 'not indexed', tone: 'warning' },
  [IndexingReportKind.failed]: { icon: '❌', verb: 'failed', tone: 'error' },
};

export const DEFAULT_INDEXING_ITEM_LABELS = { singular: 'document', plural: 'documents' };
export const DEFAULT_INDEXING_DEPENDENT_LABELS = { singular: 'attachment', plural: 'attachments' };

// Maps the pre-report `skipped` blob (IndexingStats.to_dict) onto report groups.
export const LEGACY_SKIPPED_GROUPS = [
  {
    kind: IndexingReportKind.skipped,
    reason: 'filtered',
    label: 'Excluded by configured filters',
    section: 'documents_skipped',
    countKey: 'filtered_count',
    itemsKey: 'filtered',
  },
  {
    kind: IndexingReportKind.skipped,
    reason: 'not_in_whitelist',
    label: 'Not matching the configured include patterns',
    section: 'files_skipped',
    countKey: 'whitelist_filtered_count',
    itemsKey: 'whitelist_filtered',
  },
  {
    kind: IndexingReportKind.skipped,
    reason: 'blacklisted',
    label: 'Matching the configured exclude patterns',
    section: 'files_skipped',
    countKey: 'blacklist_filtered_count',
    itemsKey: 'blacklist_filtered',
  },
  {
    kind: IndexingReportKind.skipped,
    reason: 'empty',
    label: 'Contained no indexable content',
    section: 'files_skipped',
    countKey: 'empty_content_count',
    itemsKey: 'empty_content',
  },
  {
    kind: IndexingReportKind.notIndexed,
    reason: 'unsupported_format',
    label: 'Unsupported format',
    section: 'files_skipped',
    countKey: 'unsupported_extension_count',
    itemsKey: 'unsupported_extension',
  },
  {
    kind: IndexingReportKind.notIndexed,
    reason: 'unsupported_format',
    label: 'Unsupported format',
    section: 'runtime_skipped',
    countKey: 'extension_filtered_count',
    itemsKey: 'extension_filtered',
  },
  {
    kind: IndexingReportKind.failed,
    reason: 'read_error',
    label: 'Could not be read',
    section: 'files_skipped',
    countKey: 'read_error_count',
    itemsKey: 'read_error',
  },
  {
    kind: IndexingReportKind.failed,
    reason: 'processing_error',
    label: 'Could not be processed',
    section: 'documents_skipped',
    countKey: 'error_count',
    itemsKey: 'error',
  },
  {
    kind: IndexingReportKind.failed,
    reason: 'processing_error',
    label: 'Could not be processed',
    section: 'runtime_skipped',
    countKey: 'error_count',
    itemsKey: 'error',
  },
];

export const LEGACY_DEPENDENT_GROUPS = [
  {
    kind: IndexingReportKind.skipped,
    reason: 'filtered',
    label: 'Excluded by configured filters',
    section: 'dependent_items_filtered',
  },
  {
    kind: IndexingReportKind.notIndexed,
    reason: 'unsupported_format',
    label: 'Unsupported format',
    section: 'dependent_items_unsupported',
  },
  {
    kind: IndexingReportKind.skipped,
    reason: 'empty',
    label: 'Contained no indexable content',
    section: 'dependent_items_empty',
  },
  {
    kind: IndexingReportKind.failed,
    reason: 'processing_error',
    label: 'Could not be processed',
    section: 'dependent_items_skipped',
  },
];
