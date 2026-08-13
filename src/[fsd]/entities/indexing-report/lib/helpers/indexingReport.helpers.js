import {
  INDEXING_REPORT_KIND_PRESENTATION,
  IndexingReportStatus,
} from '../constants/indexingReport.constants';
import { normalizeIndexingReport } from '../serialize/indexingReport.serialize';

export const pickItemNoun = (count, labels) => (count === 1 ? labels.singular : labels.plural);

/**
 * Groups worth showing for a category. Unchanged items are the whole story of an
 * up-to-date run and are already in its headline, so repeating them as "skipped"
 * there would contradict it.
 */
// The unchanged group is reported on its own line, never under "skipped".
export const visibleCategoryGroups = category =>
  category.groups.filter(group => group.count > 0 && group.reason !== 'unchanged');

/** Categories with something to say — the count they carry, or a dependent group. */
export const visibleCategories = report =>
  report.categories
    .map(category => ({ ...category, groups: visibleCategoryGroups(category) }))
    .filter(category => category.count > 0 || category.groups.some(group => group.dependent));

export const categoryHeadline = (category, report) => {
  const { icon, verb } = INDEXING_REPORT_KIND_PRESENTATION[category.kind];
  if (category.count > 0) {
    return { icon, text: `${category.count} ${pickItemNoun(category.count, report.itemLabels)} ${verb}` };
  }
  const dependentCount = category.groups
    .filter(group => group.dependent)
    .reduce((sum, group) => sum + group.count, 0);
  const labels = category.groups.find(group => group.dependent)?.itemLabels || report.dependentLabels;
  return { icon, text: `${dependentCount} ${pickItemNoun(dependentCount, labels)} ${verb}` };
};

export const reportHeadline = report => {
  const { totals, itemLabels } = report;
  if (report.status === IndexingReportStatus.error && totals.indexed === 0) {
    return { icon: '❌', text: `Failed to index ${itemLabels.plural}` };
  }
  if (report.isUpToDate) {
    const { unchanged } = totals;
    return { icon: '✅', text: `Up to date — ${unchanged} ${pickItemNoun(unchanged, itemLabels)} unchanged` };
  }
  if (totals.indexed === 0 && totals.skipped === 0 && totals.notIndexed === 0 && totals.failed === 0) {
    return { icon: 'ℹ️', text: 'No documents to index' };
  }
  return null;
};

/**
 * The unchanged tally, when it still needs saying. Unchanged items are stripped from
 * the skipped category by visibleCategories, so every renderer has to put them back —
 * this keeps that decision and its wording in one place.
 */
export const unchangedNotice = report => {
  const count = report?.totals?.unchanged || 0;
  if (!count || report.isUpToDate) return null;
  return { count, text: `${count} ${pickItemNoun(count, report.itemLabels)} already indexed (unchanged)` };
};

const groupLine = (group, report) => {
  const counted = group.dependent
    ? `${group.count} ${pickItemNoun(group.count, group.itemLabels || report.dependentLabels)}`
    : `${group.count}`;
  const items = group.items.length ? `: ${group.items.join(', ')}` : '';
  const more = group.more > 0 ? ` … and ${group.more} more` : '';
  return `    → ${group.label} (${counted})${items}${more}`;
};

/**
 * Render a report as the markdown-ish text used wherever indexing results appear as
 * chat content: toolkit conversations, index history entries and notification rows.
 */
export const formatIndexingReportText = source => {
  const report = source?.categories ? source : normalizeIndexingReport(source);
  if (!report) return '';

  const lines = [];
  const headline = reportHeadline(report);
  if (headline) lines.push(`${headline.icon} ${headline.text}`);

  visibleCategories(report).forEach(category => {
    const { icon, text } = categoryHeadline(category, report);
    lines.push(`${icon} ${text}`);
    category.groups.forEach(group => lines.push(groupLine(group, report)));
  });

  const unchanged = unchangedNotice(report);
  if (unchanged) lines.push(`ℹ️ ${unchanged.text}`);

  if (report.errors.length) {
    lines.push('❌ Errors');
    report.errors.forEach(message => lines.push(`    → ${message}`));
    const hidden = report.errorsTotal - report.errors.length;
    if (hidden > 0) lines.push(`    → … and ${hidden} more distinct errors`);
  }

  return lines.join('\n');
};

/** One-line breakdown for banners and notification rows. */
export const summarizeIndexingReport = source => {
  const report = source?.categories ? source : normalizeIndexingReport(source);
  if (!report) return '';

  const headline = reportHeadline(report);
  if (headline) return headline.text;

  const parts = visibleCategories(report).map(category => categoryHeadline(category, report).text);
  const { unchanged } = report.totals;
  if (unchanged > 0) parts.push(`${unchanged} unchanged`);
  return parts.join(', ');
};
