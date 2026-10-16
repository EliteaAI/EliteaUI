import { formatTokenCount, formatUsd } from './runUsage.helpers';
import { formatDurationMs } from './trajectory.helpers';

/**
 * The run's "Performance vs reference" panel (performance design §3.4), read from the server's
 * `eval_run_compare` response. Every figure covers only the cases both runs measured, so each row
 * says how many that is and how many were left out. Pure.
 */

const REFERENCE_SOURCE_LABEL = {
  baseline: 'suite baseline',
  previous: 'previous run on this dataset',
  explicit: 'selected run',
};

const NOT_COMPARABLE_NOTE = {
  time_limit_changed:
    'The case time limit changed between the runs, so latency and timeouts are not compared.',
  different_dataset: 'The runs used different datasets; only the cases they share are compared.',
};

export const PERFORMANCE_VERDICT = {
  better: 'better',
  worse: 'worse',
  withinNoise: 'within_noise',
  unchanged: 'unchanged',
};

const VERDICT_LABEL = {
  better: 'Better',
  worse: 'Worse',
  within_noise: 'Within noise',
  unchanged: 'Unchanged',
};

const formatMs = value => (typeof value === 'number' ? formatDurationMs(Math.round(value)) : null);
const formatCount = value => (typeof value === 'number' ? String(value) : null);

const METRIC_ROWS = [
  { key: 'p50_latency_ms', label: 'Latency p50', format: formatMs },
  { key: 'p95_latency_ms', label: 'Latency p95', format: formatMs },
  { key: 'p50_final_answer_ms', label: 'Final answer p50', format: formatMs },
  {
    key: 'agent_tokens',
    label: 'Agent tokens',
    format: value => (value == null ? null : formatTokenCount(value)),
  },
  { key: 'agent_cost', label: 'Agent cost', format: formatUsd },
  { key: 'tool_calls', label: 'Tool calls', format: formatCount },
];

const pluralCases = count => `${count} ${count === 1 ? 'case' : 'cases'}`;

const formatDeltaPct = pct => {
  if (typeof pct !== 'number' || !Number.isFinite(pct)) return null;
  const rounded = Math.round(pct);
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
};

const caseList = ids => (ids?.length ? ids.map(id => `#${id}`).join(', ') : null);

/**
 * @param {object} [compare] - `{ run, reference, diff }` from `eval_run_compare`
 * @returns {{
 *   referenceLabel: string,
 *   referenceRunId: number,
 *   rows: Array<{ key: string, label: string, run: string, reference: string, change: string | null,
 *     verdict: string | null, verdictLabel: string | null, coverage: string | null }>,
 *   notes: string[],
 *   timeouts: { newly: string | null, noLonger: string | null } | null,
 *   isSlower: boolean,
 * } | null} null when the run has no reference to compare with
 */
export const buildPerformanceDiff = compare => {
  const diff = compare?.diff;
  const reference = compare?.reference;
  if (!diff || !reference) return null;

  const rows = METRIC_ROWS.map(({ key, label, format }) => {
    const metric = diff.metrics?.[key];
    if (!metric) return null;
    const withheld = metric.not_comparable === 'time_limit_changed';
    const coverage = metric.cases
      ? `${pluralCases(metric.cases)}${metric.excluded ? `, ${metric.excluded} left out` : ''}`
      : null;
    return {
      key,
      label,
      run: format(metric.run) ?? '—',
      reference: format(metric.reference) ?? '—',
      change: withheld ? 'Not comparable' : formatDeltaPct(metric.delta_pct),
      verdict: metric.verdict ?? null,
      verdictLabel: VERDICT_LABEL[metric.verdict] ?? null,
      coverage,
    };
  }).filter(Boolean);

  const notes = (diff.not_comparable ?? []).map(reason => NOT_COMPARABLE_NOTE[reason]).filter(Boolean);
  const coverage = diff.coverage ?? {};
  if (coverage.changed?.length)
    notes.push(
      `${pluralCases(coverage.changed.length)} changed input since the reference and ${coverage.changed.length === 1 ? 'is' : 'are'} left out.`,
    );
  const oneSided = (coverage.only_in_run?.length ?? 0) + (coverage.only_in_reference?.length ?? 0);
  if (oneSided)
    notes.push(
      `${pluralCases(oneSided)} ran in only one of the two runs and ${oneSided === 1 ? 'is' : 'are'} left out.`,
    );

  const timeouts =
    diff.timeouts && !diff.timeouts.not_comparable
      ? {
          newly: caseList(diff.timeouts.newly_timed_out),
          noLonger: caseList(diff.timeouts.no_longer_timed_out),
        }
      : null;

  const noise = diff.noise
    ? `Latency changes within ±${Math.round(diff.noise.relative * 100)}% or ${diff.noise.absolute_ms / 1000} s count as noise.`
    : null;

  return {
    referenceRunId: reference.id,
    referenceLabel: `Run #${reference.id} (${REFERENCE_SOURCE_LABEL[reference.source] ?? 'reference'})`,
    rows,
    notes,
    noise,
    timeouts: timeouts && (timeouts.newly || timeouts.noLonger) ? timeouts : null,
    isSlower: !!diff.slower_than_reference,
  };
};
