import {
  DEFAULT_INDEXING_DEPENDENT_LABELS,
  DEFAULT_INDEXING_ITEM_LABELS,
  INDEXING_REPORT_KIND_ORDER,
  IndexingReportKind,
  IndexingReportStatus,
  LEGACY_DEPENDENT_GROUPS,
  LEGACY_SKIPPED_GROUPS,
} from '../constants/indexingReport.constants';

const ITEMS_SAMPLE_SIZE = 5;
const FAILED_STATES = ['failed', 'cancelled'];

const parseJson = value => {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const labelsOf = (labels, fallback) => ({
  singular: labels?.singular || fallback.singular,
  plural: labels?.plural || fallback.plural,
});

const countOf = value => Number(value) || 0;

export const isUpToDateRun = totals =>
  countOf(totals?.indexed) === 0 && countOf(totals?.failed) === 0 && countOf(totals?.unchanged) > 0;

const buildGroup = ({ reason, label, count, items = [], dependent = false, itemLabels }) => {
  const shown = items.slice(0, ITEMS_SAMPLE_SIZE);
  return {
    reason,
    label,
    count,
    items: shown,
    // A group whose names were never recorded is fully described by its count.
    more: shown.length ? Math.max(0, count - shown.length) : 0,
    dependent,
    itemLabels: itemLabels || null,
  };
};

const normalizeCategories = (categories, dependentLabels) =>
  INDEXING_REPORT_KIND_ORDER.map(kind => {
    const source = (categories || []).find(category => category?.kind === kind);
    return {
      kind,
      count: countOf(source?.count),
      groups: (source?.groups || []).map(group =>
        buildGroup({
          reason: group.reason,
          label: group.label,
          count: countOf(group.count),
          items: group.items || [],
          dependent: Boolean(group.dependent),
          itemLabels: group.dependent ? labelsOf(group.item_labels, dependentLabels) : group.item_labels,
        }),
      ),
    };
  });

const normalizeTotals = totals => ({
  indexed: countOf(totals?.indexed),
  skipped: countOf(totals?.skipped),
  notIndexed: countOf(totals?.not_indexed),
  failed: countOf(totals?.failed),
  unchanged: countOf(totals?.unchanged),
  dependentNotIndexed: countOf(totals?.dependent_not_indexed),
  total: countOf(totals?.total),
});

// A failed run whose report says everything went fine is a report left over from an
// earlier run. Trusting it would show last run's success on this run's failure.
const contradictsState = (report, state) =>
  FAILED_STATES.includes(state) && report?.status === IndexingReportStatus.ok;

const fromCanonicalReport = (report, entry) => {
  const itemLabels = labelsOf(report.item_labels, DEFAULT_INDEXING_ITEM_LABELS);
  const dependentLabels = labelsOf(report.dependent_labels, DEFAULT_INDEXING_DEPENDENT_LABELS);
  const totals = normalizeTotals(report.totals);

  // An error report never ran far enough to produce meaningful counts.
  const carriedTotals =
    report.status === IndexingReportStatus.error
      ? { ...totals, indexed: countOf(entry?.indexed), total: countOf(entry?.total) }
      : totals;

  return {
    status: report.status || IndexingReportStatus.ok,
    operation: report.operation || null,
    itemLabels,
    dependentLabels,
    totals: carriedTotals,
    categories: normalizeCategories(report.categories, dependentLabels),
    errors: report.errors || [],
    errorsTotal: countOf(report.errors_total),
    isUpToDate: isUpToDateRun(report.totals),
    isLegacy: false,
  };
};

const legacyGroupsFor = (kind, skipped, dependentLabels) => {
  const merged = new Map();
  LEGACY_SKIPPED_GROUPS.filter(spec => spec.kind === kind).forEach(spec => {
    const section = skipped?.[spec.section] || {};
    const existing = merged.get(spec.reason);
    const count = countOf(section[spec.countKey]);
    const items = section[spec.itemsKey] || [];
    if (!existing) {
      merged.set(spec.reason, {
        reason: spec.reason,
        label: spec.label,
        count,
        names: new Set(items),
        duplicates: 0,
      });
      return;
    }
    // The SDK unions the underlying sets, so a name in both is one item there.
    items.forEach(item => {
      if (existing.names.has(item)) existing.duplicates += 1;
      existing.names.add(item);
    });
    existing.count += count;
  });
  const groups = [...merged.values()].map(({ names, count, duplicates, ...group }) =>
    buildGroup({ ...group, count: Math.max(0, count - duplicates), items: [...names] }),
  );

  const dependentGroups = LEGACY_DEPENDENT_GROUPS.filter(spec => spec.kind === kind).map(spec => {
    const section = skipped?.[spec.section] || {};
    return buildGroup({
      reason: spec.reason,
      label: spec.label,
      count: countOf(section.count),
      items: section.items || [],
      dependent: true,
      itemLabels: dependentLabels,
    });
  });

  return [...groups, ...dependentGroups].filter(group => group.count > 0);
};

// Pre-report rows still carry the raw IndexingStats blob; only the nouns were lost.
const fromLegacyEntry = entry => {
  const skipped = parseJson(entry?.skipped);
  const itemLabels = DEFAULT_INDEXING_ITEM_LABELS;
  const dependentLabels = DEFAULT_INDEXING_DEPENDENT_LABELS;
  const unchanged = countOf(skipped?.documents_already_indexed?.count);

  // The persisted `indexed` counts everything in the store, unchanged items included;
  // the breakdown is about this run, so unchanged items are shown on their own line.
  const persistedIndexed = countOf(entry?.indexed);
  const runIndexed = skipped ? Math.max(0, persistedIndexed - unchanged) : persistedIndexed;

  const categories = INDEXING_REPORT_KIND_ORDER.map(kind => {
    if (kind === IndexingReportKind.indexed) return { kind, count: runIndexed, groups: [] };
    const groups = legacyGroupsFor(kind, skipped, dependentLabels);
    if (kind === IndexingReportKind.skipped && unchanged > 0) {
      groups.unshift(
        buildGroup({
          reason: 'unchanged',
          label: 'Already indexed (unchanged)',
          count: unchanged,
          items: skipped?.documents_already_indexed?.items || [],
        }),
      );
    }
    return {
      kind,
      count: groups
        .filter(group => !group.dependent && group.reason !== 'unchanged')
        .reduce((sum, group) => sum + group.count, 0),
      groups,
    };
  });

  const totals = {
    indexed: runIndexed,
    skipped: categories.find(category => category.kind === IndexingReportKind.skipped).count,
    notIndexed: categories.find(category => category.kind === IndexingReportKind.notIndexed).count,
    failed: categories.find(category => category.kind === IndexingReportKind.failed).count,
    unchanged,
    dependentNotIndexed: categories.reduce(
      (sum, category) =>
        sum + category.groups.filter(group => group.dependent).reduce((n, group) => n + group.count, 0),
      0,
    ),
    total: countOf(entry?.total) || persistedIndexed + unchanged,
  };

  const error = (entry?.error || '').trim();
  const isFailed = FAILED_STATES.includes(entry?.state) || Boolean(error);

  return {
    status: isFailed ? IndexingReportStatus.error : IndexingReportStatus.ok,
    operation: null,
    itemLabels,
    dependentLabels,
    totals,
    categories,
    errors: error ? [error] : [],
    errorsTotal: error ? 1 : 0,
    isUpToDate: !isFailed && isUpToDateRun(totals),
    isLegacy: true,
  };
};

/**
 * Build a renderable report from any surface that carries one: a parsed tool result,
 * an index_meta document or history entry, or a notification's meta. Falls back to
 * synthesising one from the pre-report fields so old records still render a breakdown.
 */
export const normalizeIndexingReport = source => {
  if (!source || typeof source !== 'object') return null;

  const entry = source.metadata && typeof source.metadata === 'object' ? source.metadata : source;
  const report = parseJson(entry.report);

  if (report && !contradictsState(report, entry.state)) return fromCanonicalReport(report, entry);
  if (entry.skipped || entry.indexed !== undefined || entry.state || entry.error) {
    return fromLegacyEntry(entry);
  }
  return null;
};
