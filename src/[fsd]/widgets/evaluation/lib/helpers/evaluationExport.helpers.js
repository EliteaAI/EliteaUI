import { parseRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { createSheetNamer } from '@/[fsd]/shared/lib/utils/exportToExcel.utils';

import {
  DEFAULT_EVIDENCE_SCOPE,
  EVAL_ENGINE,
  EVAL_RESULT_MAX_LIMIT,
  EVAL_RESULT_STATUS,
  EVIDENCE_SCOPE_OPTIONS,
  IMPORTANCE_WEIGHT_MAP,
} from '../constants';
import { getBindingEngineLabel, getTargetLabel } from './binding.helpers';
import { caseSourceLabel, formatCaseContent } from './dataset.helpers';
import { HUMAN_SCALE_KIND, formatHumanOutcome, resolveHumanScale } from './humanScore.helpers';
import { formatRunStatus } from './run.helpers';
import { getScaleTypeLabel } from './scaleLabel.helpers';

// One empty representation across every table, so a blank cell always reads the same way.
const EMPTY = '—';
// §6 of the story asks case content to say so explicitly rather than render blank.
const NOT_PROVIDED = 'Not provided';
const SUMMARY_SHEET_NAME = 'Summary';
const FALLBACK_SUITE_SLUG = 'untitled-suite';
const FALLBACK_AGENT_SLUG = 'agent';

/** Per-cell outcome against the dimension's target (§9). */
export const CELL_RESULT = {
  met: 'Met',
  missed: 'Missed',
  pending: 'Pending',
  error: 'Error',
};

/** Aggregate state of one dimension across every case it ran against. */
export const DIMENSION_STATUS = {
  completed: 'Completed',
  pending: 'Pending',
  error: 'Error',
};

/** Keeps a score numeric — a pre-formatted string would break sums and sorting in the sheet. */
const round2 = value => {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
};

const isCellErrored = cell =>
  cell?.result?.status === EVAL_RESULT_STATUS.error || !!cell?.verdict?.error || !!cell?.evidence?.error;

const cellResult = cell => {
  if (isCellErrored(cell)) return CELL_RESULT.error;
  if (cell?.pending) return CELL_RESULT.pending;
  if (cell?.met === true) return CELL_RESULT.met;
  if (cell?.met === false) return CELL_RESULT.missed;
  return EMPTY;
};

const cellExplanation = cell =>
  cell?.verdict?.rationale ?? cell?.verdict?.explanation ?? cell?.evidence?.rationale ?? '';

const cellErrorDetails = cell => {
  if (!isCellErrored(cell)) return '';
  return (
    cell.verdict?.stderr ||
    cell.verdict?.error ||
    cell.evidence?.stderr ||
    cell.evidence?.error ||
    cell.result?.error ||
    'Validation failed to run.'
  );
};

/**
 * Score as the sheet should carry it: a number for numeric scales, so it stays summable, and the
 * Pass/Fail wording for a binary one. A pending human evaluation has no score at all and must not
 * be written as a zero (§9).
 */
const cellScore = cell => {
  if (cell?.pending || cell?.nativeScore == null) return cell?.pending ? CELL_RESULT.pending : EMPTY;
  const scale = resolveHumanScale(cell.binding);
  if (scale.kind === HUMAN_SCALE_KIND.passFail) return formatHumanOutcome(cell.nativeScore, scale);
  return round2(cell.nativeScore);
};

/**
 * Readable rendering of a binding's configured scale, e.g. "Rating (1-5)". Named exactly as the
 * Dimension modal and the Results table name it, so an exported sheet never reintroduces the stored
 * `ordinal` / `continuous` / `binary` wording.
 */
export const formatScaleLabel = binding => getScaleTypeLabel(binding, { withBounds: true }) ?? EMPTY;

/** Importance as the Library names it, falling back to the raw weight for a custom one. */
export const formatImportance = weight => {
  if (weight == null) return EMPTY;
  const matched = Object.entries(IMPORTANCE_WEIGHT_MAP).find(([, mapped]) => mapped === weight)?.[0];
  if (!matched) return `Custom (${weight})`;
  return `${matched.charAt(0).toUpperCase()}${matched.slice(1)}`;
};

/**
 * Aggregate status for a dimension — an error or a pending score outranks the completed ones. A
 * cell that produced no score never completed either, whatever engine it ran on: a cancelled run,
 * or a result the backend marked `skipped`, leaves cells that are neither errored nor awaiting a
 * human, and those must not read as done (§9).
 */
export const dimensionStatus = cells => {
  if (cells.some(isCellErrored)) return DIMENSION_STATUS.error;
  if (cells.some(cell => cell.pending || cell.nativeScore == null)) return DIMENSION_STATUS.pending;
  return DIMENSION_STATUS.completed;
};

/** Every cell scored against one binding, in case order. */
const cellsForBinding = (scorecard, binding) =>
  scorecard.cases.map(card => ({
    card,
    cell: card.cells.find(item => item.binding.key === binding.key) ?? null,
  }));

const evidenceScopeLabel = binding => {
  const scope = binding?.evidenceScope;
  if (!scope) return EMPTY;
  // Keyed off the same options the binding editor renders, against the backend's fallback for
  // keys a stored scope omits — so a renamed label cannot leave the export describing a scope by
  // a name the UI no longer uses.
  const labels = EVIDENCE_SCOPE_OPTIONS.filter(
    option => (scope[option.key] ?? DEFAULT_EVIDENCE_SCOPE[option.key]) === true,
  ).map(option => option.label);
  return labels.length ? labels.join(', ') : EMPTY;
};

/**
 * Whether any dimension evaluated against the agent's structure (§6). Scope is opt-in — the
 * platform default leaves structure out — so only an explicit `true` counts.
 */
const isStructureInScope = (bindings = []) =>
  bindings.some(binding => binding.evidenceScope?.structure === true);

const toDate = value => {
  if (!value) return null;
  const time = parseRunTimestamp(value);
  return Number.isNaN(time) ? null : new Date(time);
};

const pad = value => String(value).padStart(2, '0');

/** Local calendar date of a run, which is the date the user read off the history row. */
export const runDateISO = run => {
  const date = toDate(run?.started_at || run?.created_at);
  if (!date) return new Date().toISOString().slice(0, 10);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatDateTime = value => {
  const date = toDate(value);
  if (!date) return EMPTY;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/** Filename-safe slug: no path separators, no runs of whitespace, lower-case and hyphenated. */
const toFileNameSlug = (value, fallback) => {
  const cleaned = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallback;
};

/**
 * `[agent-name]_[suite-name]_[evaluation-date]_run-[id].xlsx` (§3). The date is the run's, not
 * today's, so two exports of the same historical run land on the same name — and the run id keeps
 * two runs evaluated on the same day apart.
 */
export const evaluationExportFileName = ({ agentName, suiteName, run } = {}) => {
  const runSuffix = run?.id != null ? `_run-${toFileNameSlug(run.id, 'id')}` : '';

  return `${toFileNameSlug(agentName, FALLBACK_AGENT_SLUG)}_${toFileNameSlug(
    suiteName,
    FALLBACK_SUITE_SLUG,
  )}_${runDateISO(run)}${runSuffix}.xlsx`;
};

const buildSummarySheet = (scorecard, run, meta) => {
  const { counts, headline, pendingHuman } = scorecard;
  const hasHumanDimension = scorecard.bindings.some(binding => binding.engine === EVAL_ENGINE.human);

  const overallRows = [
    { metric: 'Total Score', value: round2(headline) ?? EMPTY },
    { metric: 'Cases', value: counts.total },
    { metric: 'Met All Targets', value: counts.metAll },
    { metric: 'Missed', value: counts.missedAny },
    { metric: 'Errors', value: counts.errors },
  ];
  if (hasHumanDimension || pendingHuman > 0) {
    overallRows.push({ metric: 'Pending Human evaluations', value: pendingHuman });
  }

  const dimensionRows = scorecard.bindings.map(binding => {
    const cells = cellsForBinding(scorecard, binding)
      .map(entry => entry.cell)
      .filter(Boolean);
    const status = dimensionStatus(cells);
    // A dimension nobody has scored yet has no average to report — writing one would present a
    // pending result as a completed one (§4).
    const hasAverage = binding.scored > 0;

    return {
      dimension: binding.name,
      evaluator: getBindingEngineLabel(binding),
      scale: formatScaleLabel(binding),
      average: hasAverage ? round2(binding.avgNative) : EMPTY,
      target: getTargetLabel(binding.target, binding.operator, binding.scaleType) ?? EMPTY,
      met: binding.targetedCount ? `${binding.metCount}/${binding.targetedCount}` : EMPTY,
      importance: formatImportance(binding.weight),
      status,
    };
  });

  return {
    sheetName: SUMMARY_SHEET_NAME,
    metadata: [
      ['Agent name', meta.agentName || EMPTY],
      ['Agent version', meta.agentVersion || EMPTY],
      ['Suite name', meta.suiteName || EMPTY],
      ['Evaluation run ID', run?.id ?? EMPTY],
      ['Evaluation date and time', formatDateTime(run?.started_at || run?.created_at)],
      ['Evaluation status', formatRunStatus(run?.status) || EMPTY],
      ['Judge Model', meta.judgeModel || EMPTY],
      ['Dataset', meta.datasetNames?.length ? meta.datasetNames.join(', ') : EMPTY],
      ['Number of dimensions', scorecard.bindings.length],
      ['Number of cases', scorecard.cases.length],
      ['Exported at', formatDateTime(new Date().toISOString())],
    ],
    sections: [
      {
        title: 'Overall Results',
        columns: [
          { header: 'Metric', key: 'metric' },
          { header: 'Value', key: 'value' },
        ],
        rows: overallRows,
      },
      {
        title: 'Dimension Results',
        columns: [
          { header: 'Dimension', key: 'dimension' },
          { header: 'Evaluator', key: 'evaluator' },
          { header: 'Scale', key: 'scale' },
          { header: 'Average', key: 'average' },
          { header: 'Target', key: 'target' },
          { header: 'Met', key: 'met' },
          { header: 'Importance', key: 'importance' },
          { header: 'Status', key: 'status' },
        ],
        rows: dimensionRows.length ? dimensionRows : [{ dimension: 'No dimensions in this run.' }],
      },
    ],
  };
};

const buildDimensionSheet = (scorecard, binding, sheetName, run) => {
  const entries = cellsForBinding(scorecard, binding);
  const cells = entries.map(entry => entry.cell).filter(Boolean);

  const evaluated = cells.filter(cell => cell.nativeScore != null).length;
  const met = cells.filter(cell => cellResult(cell) === CELL_RESULT.met).length;
  const missed = cells.filter(cell => cellResult(cell) === CELL_RESULT.missed).length;
  const pending = cells.filter(cell => cell.pending).length;
  const errors = cells.filter(isCellErrored).length;

  const isHuman = binding.engine === EVAL_ENGINE.human;
  const guidanceLabel = isHuman ? 'Human evaluation guidance' : 'Evaluation instructions';

  const sections = [];

  if (binding.guidance) {
    sections.push({
      title: guidanceLabel,
      columns: [{ header: guidanceLabel, key: 'text', wrap: true }],
      rows: [{ text: binding.guidance }],
    });
  }

  sections.push({
    title: 'Case-Level Results',
    columns: [
      { header: 'Case ID', key: 'caseId' },
      { header: 'Score/Outcome', key: 'score' },
      { header: 'Target', key: 'target' },
      { header: 'Result', key: 'result' },
      { header: 'Evaluator', key: 'evaluator' },
      { header: 'Explanation', key: 'explanation', wrap: true },
      { header: 'Human Comment', key: 'humanComment', wrap: true },
      { header: 'Error Details', key: 'errorDetails', wrap: true },
    ],
    rows: entries.length
      ? entries.map(({ card, cell }) => ({
          caseId: card.id,
          score: cell ? cellScore(cell) : EMPTY,
          target: getTargetLabel(binding.target, binding.operator, binding.scaleType) ?? EMPTY,
          result: cellResult(cell),
          evaluator: getBindingEngineLabel(binding),
          explanation: cellExplanation(cell),
          humanComment: cell?.humanNote ?? '',
          errorDetails: cellErrorDetails(cell),
        }))
      : [{ caseId: 'No cases were run against this dimension.' }],
  });

  return {
    sheetName,
    metadata: [
      // The sheet name is clipped to Excel's 31 characters, so the full one lives here (§7).
      ['Dimension', binding.name],
      // Repeated on every sheet so one pulled out of the workbook still names its run.
      ['Evaluation run ID', run?.id ?? EMPTY],
      ['Evaluator', getBindingEngineLabel(binding)],
      ['Evaluation targets', evidenceScopeLabel(binding)],
      ['Scale', formatScaleLabel(binding)],
      ['Polarity', binding.polarity || EMPTY],
      ['Success criterion', binding.operator || EMPTY],
      ['Target value', binding.target ?? EMPTY],
      ['Importance', formatImportance(binding.weight)],
      ['Average', binding.scored > 0 ? round2(binding.avgNative) : EMPTY],
      ['Cases evaluated', evaluated],
      ['Met target', met],
      ['Missed target', missed],
      ['Pending evaluations', pending],
      ['Errors', errors],
    ],
    sections,
  };
};

const buildCaseSheet = (card, { datasetName, structureInScope, run }, sheetName) => {
  const caseItem = card.case ?? {};
  const hasVariables = caseItem.variables && Object.keys(caseItem.variables).length > 0;

  const contentRows = [
    { field: 'Input', value: formatCaseContent(caseItem.input, NOT_PROVIDED) },
    ...(hasVariables
      ? [{ field: 'Variables', value: formatCaseContent(caseItem.variables, NOT_PROVIDED) }]
      : []),
    { field: 'Actual Output', value: formatCaseContent(caseItem.output, NOT_PROVIDED) },
    { field: 'Expected Output', value: formatCaseContent(caseItem.expected_output, NOT_PROVIDED) },
    // Exported when a dimension asked for the agent's structure, or when the run captured it
    // anyway — otherwise the row would say "Not provided" on every case for no reason.
    ...(structureInScope || (caseItem.structure != null && caseItem.structure !== '')
      ? [{ field: 'Agent Instructions', value: formatCaseContent(caseItem.structure, NOT_PROVIDED) }]
      : []),
  ];

  // A case nothing scored is not a pass: a cancelled run, or a dimension the backend skipped,
  // leaves a card with no error, nothing awaiting a human and no missed target — which would
  // otherwise fall through to "Met" and assert an outcome the run never reached (§9).
  const isUnscored = card.caseScore == null && !card.hasError && card.pendingCount === 0;

  const status = card.hasError
    ? CELL_RESULT.error
    : card.pendingCount > 0 || isUnscored
      ? CELL_RESULT.pending
      : card.missedAny
        ? CELL_RESULT.missed
        : CELL_RESULT.met;

  // "Met all targets" only holds once every dimension has actually returned a result; while any
  // is outstanding the answer is unknown rather than "No".
  const metAllTargets =
    card.hasError || card.pendingCount > 0 || isUnscored ? EMPTY : card.missedAny ? 'No' : 'Yes';

  return {
    sheetName,
    metadata: [
      ['Case ID', card.id],
      ['Evaluation run ID', run?.id ?? EMPTY],
      ['Dataset', datasetName || EMPTY],
      ['Case source', caseSourceLabel(caseItem.source_type) || EMPTY],
      ['Case score', round2(card.caseScore) ?? EMPTY],
      ['Case status', status],
      ['Met all targets', metAllTargets],
      ['Pending evaluations', card.pendingCount ?? 0],
    ],
    sections: [
      {
        title: 'Evaluation Content',
        columns: [
          { header: 'Field', key: 'field' },
          { header: 'Value', key: 'value', wrap: true },
        ],
        rows: contentRows,
      },
      {
        title: 'Results by Dimension',
        columns: [
          { header: 'Dimension', key: 'dimension' },
          { header: 'Evaluator', key: 'evaluator' },
          { header: 'Scale', key: 'scale' },
          { header: 'Score/Outcome', key: 'score' },
          { header: 'Target', key: 'target' },
          { header: 'Result', key: 'result' },
          { header: 'Importance', key: 'importance' },
          { header: 'Explanation', key: 'explanation', wrap: true },
          { header: 'Human Comment', key: 'humanComment', wrap: true },
          { header: 'Error Details', key: 'errorDetails', wrap: true },
        ],
        rows: card.cells.length
          ? card.cells.map(cell => ({
              dimension: cell.binding.name,
              evaluator: getBindingEngineLabel(cell.binding),
              scale: formatScaleLabel(cell.binding),
              score: cellScore(cell),
              target:
                getTargetLabel(cell.binding.target, cell.binding.operator, cell.binding.scaleType) ?? EMPTY,
              result: cellResult(cell),
              importance: formatImportance(cell.binding.weight),
              explanation: cellExplanation(cell),
              humanComment: cell.humanNote ?? '',
              errorDetails: cellErrorDetails(cell),
            }))
          : [{ dimension: 'No dimensions were run against this case.' }],
      },
    ],
  };
};

/**
 * The whole workbook for one evaluation run (#6549): a leading Summary sheet, one sheet per
 * dimension, and one sheet per case. `scorecard` is the view-model both entry points already build
 * from the run's stored snapshot, so a historical export is unaffected by later config changes.
 *
 * Worksheet names are sanitized, clipped to Excel's 31 characters and de-duplicated; the complete
 * dimension name and case id are repeated inside each sheet so nothing is lost to the clipping.
 */
export const buildEvaluationResultsSheets = (scorecard, { run = null, meta = {} } = {}) => {
  const nextSheetName = createSheetNamer([SUMMARY_SHEET_NAME]);
  const structureInScope = isStructureInScope(scorecard.bindings);

  return [
    buildSummarySheet(scorecard, run, meta),
    ...scorecard.bindings.map(binding =>
      buildDimensionSheet(scorecard, binding, nextSheetName(binding.name, 'Dimension'), run),
    ),
    ...scorecard.cases.map(card =>
      buildCaseSheet(
        card,
        {
          datasetName: meta.datasetNameByCaseId?.[card.id] ?? meta.datasetNames?.[0],
          structureInScope,
          run,
        },
        nextSheetName(`Case ${card.id}`, 'Case'),
      ),
    ),
  ];
};

/** Dedup key for a human score row across result pages. */
const humanScoreKey = score => score.id ?? `${score.dataset_case_id}::${score.dimension_id}`;

/**
 * Reads everything one run's workbook needs, straight from the API rather than from whatever the
 * screen happens to have rendered — Results History exports a row that was never selected (§2).
 *
 * The results endpoint is paged, so this walks every page: a truncated read would drop cases from
 * the export without saying so. Subscriptions opened here are released again, since none of this
 * data backs a mounted component.
 */
export const fetchEvaluationRunExportData = async (
  dispatch,
  endpoints,
  { projectId, runId, applicationId },
) => {
  const subscriptions = [];
  const read = action => {
    const promise = dispatch(action);
    subscriptions.push(promise);
    return promise;
  };

  try {
    const results = [];
    const humanScores = new Map();
    let runDetail = null;
    let headlineScore = null;
    let offset = 0;

    for (;;) {
      const page = await read(
        endpoints.evalRunResults.initiate({ projectId, runId, limit: EVAL_RESULT_MAX_LIMIT, offset }),
      ).unwrap();

      runDetail = runDetail ?? page?.run ?? null;
      headlineScore = headlineScore ?? page?.headline_score ?? null;
      results.push(...(page?.results ?? []));
      for (const score of page?.human_scores ?? []) humanScores.set(humanScoreKey(score), score);

      const total = page?.total ?? results.length;
      offset += EVAL_RESULT_MAX_LIMIT;
      if (!page?.results?.length || results.length >= total || offset >= total) break;
    }

    // A human-only run has no result rows at all, so the results read may carry no run with it.
    if (!runDetail) {
      runDetail = await read(endpoints.evalRun.initiate({ projectId, runId })).unwrap();
    }

    const [agentDimensions, platformDimensions, datasets] = await Promise.all([
      read(
        endpoints.evalDimensions.initiate({ projectId, agentId: applicationId, includePlatform: false }),
      ).unwrap(),
      read(endpoints.platformDimensionCatalog.initiate({ projectId })).unwrap(),
      read(endpoints.evalDatasets.initiate({ projectId, agentId: applicationId })).unwrap(),
    ]);

    return {
      run: runDetail,
      results,
      humanScores: [...humanScores.values()],
      headlineScore,
      dimensions: [...(agentDimensions ?? []), ...(platformDimensions ?? [])],
      datasets: datasets ?? [],
    };
  } finally {
    subscriptions.forEach(subscription => subscription.unsubscribe?.());
  }
};

/**
 * Dataset names for the workbook: one per case where the snapshot names it, plus the distinct set
 * for the Summary sheet. A run whose cases carry no dataset id falls back to the suite's.
 */
export const resolveExportDatasets = ({ run, scorecard, datasets = [] }) => {
  const namesById = new Map(datasets.map(dataset => [dataset.id, dataset.name]));
  const suiteDatasetId = run?.dataset_id ?? run?.snapshot?.suite?.dataset_id ?? null;
  const fallbackName = run?.snapshot?.dataset?.name ?? namesById.get(suiteDatasetId) ?? null;

  const datasetNameByCaseId = {};
  const names = new Set();

  for (const card of scorecard.cases) {
    const datasetId = card.case?.dataset_id ?? suiteDatasetId;
    const name = namesById.get(datasetId) ?? fallbackName;
    if (name) {
      datasetNameByCaseId[card.id] = name;
      names.add(name);
    }
  }
  if (fallbackName) names.add(fallbackName);

  return { datasetNames: [...names], datasetNameByCaseId };
};
