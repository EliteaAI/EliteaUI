import { sanitizeFileNamePart } from '@/[fsd]/shared/lib/utils/exportToExcel.utils';

import { getBindingEngineLabel } from './binding.helpers';
import { formatScore } from './scorecard.helpers';

const NO_DATA_MSG = 'No cases in this run.';

const metStatusLabel = met => {
  if (met == null) return '—';
  return met ? 'Met' : 'Missed';
};

/** Caps a raw score to 2 decimals while keeping it numeric (so sums/sorting still work). */
const round2 = value => (value == null ? null : Math.round(Number(value) * 100) / 100);

/** One row per case for a single binding's sheet. */
const buildBindingRows = (scorecard, binding) =>
  scorecard.cases.map(card => {
    const cell = card.cells.find(c => c.binding.key === binding.key);
    return {
      caseId: card.id,
      input: card.case?.input ?? '',
      expectedOutput: card.case?.expected_output ?? '',
      nativeScore: round2(cell?.nativeScore),
      normalizedScore: round2(cell?.normalizedScore),
      target: metStatusLabel(cell?.met),
      status: cell?.pending ? 'Pending human score' : cell?.result?.status || (cell ? 'ok' : '—'),
      rationale: cell?.verdict?.rationale ?? cell?.verdict?.explanation ?? '',
    };
  });

/** Builds one sheet per binding (validation) with a case-by-case breakdown. */
const buildBindingSheet = (scorecard, binding) => {
  const rows = buildBindingRows(scorecard, binding);

  return {
    sheetName: sanitizeFileNamePart(binding.name, `Validation_${binding.key}`).slice(0, 31),
    metadata: [
      ['Validation', binding.name],
      ['Engine', getBindingEngineLabel(binding)],
      ['Scale', binding.scaleType || '—'],
      ['Weight', binding.weight ?? 1],
      ['Target', binding.target != null && binding.operator ? `${binding.operator} ${binding.target}` : '—'],
      ['Average score', formatScore(binding.avgNative)],
      ['Met target', binding.targetedCount ? `${binding.metCount}/${binding.targetedCount}` : '—'],
    ],
    sections: [
      {
        columns: [
          { header: 'Case ID', key: 'caseId' },
          { header: 'Input', key: 'input' },
          { header: 'Expected output', key: 'expectedOutput' },
          { header: 'Native score', key: 'nativeScore' },
          { header: 'Normalized score', key: 'normalizedScore' },
          { header: 'Target', key: 'target' },
          { header: 'Status', key: 'status' },
          { header: 'Rationale', key: 'rationale' },
        ],
        rows: rows.length ? rows : [{ caseId: NO_DATA_MSG }],
      },
    ],
  };
};

/** Builds the common/summary sheet: run-level headline + per-binding aggregate table. */
const buildSummarySheet = (scorecard, { runId } = {}) => {
  const { headline, provisional, pendingHuman, counts, bindings } = scorecard;

  const bindingRows = bindings.map(binding => ({
    name: binding.name,
    engine: getBindingEngineLabel(binding),
    scaleType: binding.scaleType || '—',
    avgNative: formatScore(binding.avgNative),
    target: binding.target != null && binding.operator ? `${binding.operator} ${binding.target}` : '—',
    met: binding.targetedCount ? `${binding.metCount}/${binding.targetedCount}` : '—',
  }));

  return {
    sheetName: 'Summary',
    metadata: [
      ['Run', runId != null ? `#${runId}` : '—'],
      ['Weighted headline score', headline != null ? formatScore(headline) : '—'],
      ['Provisional', provisional ? `Yes · ${pendingHuman} pending human score(s)` : 'No'],
      ['Cases total', counts.total],
      ['Cases met all targets', counts.metAll],
      ['Cases missed ≥1 target', counts.missedAny],
      ['Cases with errors', counts.errors],
    ],
    sections: [
      {
        title: 'Validations',
        columns: [
          { header: 'Validation', key: 'name' },
          { header: 'Engine', key: 'engine' },
          { header: 'Scale', key: 'scaleType' },
          { header: 'Avg score', key: 'avgNative' },
          { header: 'Target', key: 'target' },
          { header: 'Met', key: 'met' },
        ],
        rows: bindingRows.length ? bindingRows : [{ name: 'No validations bound to this suite.' }],
      },
    ],
  };
};

/** One row per binding for a single case's sheet. */
const buildCaseRows = card =>
  card.cells.map(cell => ({
    validation: cell.binding.name,
    engine: getBindingEngineLabel(cell.binding),
    nativeScore: round2(cell.nativeScore),
    normalizedScore: round2(cell.normalizedScore),
    target: metStatusLabel(cell.met),
    status: cell.pending ? 'Pending human score' : cell.result?.status || 'ok',
    rationale: cell.verdict?.rationale ?? cell.verdict?.explanation ?? '',
  }));

/** Builds one sheet per dataset case with a validation-by-validation breakdown. */
const buildCaseSheet = card => ({
  sheetName: `Case_${card.id}`.slice(0, 31),
  metadata: [
    ['Case ID', card.id],
    ['Input', card.case?.input ?? ''],
    ['Expected output', card.case?.expected_output ?? ''],
    ['Case score', formatScore(card.caseScore)],
    ['Status', card.hasError ? 'Error' : card.missedAny ? 'Missed ≥1 target' : 'OK'],
    ['Pending human scores', card.pendingCount],
  ],
  sections: [
    {
      columns: [
        { header: 'Validation', key: 'validation' },
        { header: 'Engine', key: 'engine' },
        { header: 'Native score', key: 'nativeScore' },
        { header: 'Normalized score', key: 'normalizedScore' },
        { header: 'Target', key: 'target' },
        { header: 'Status', key: 'status' },
        { header: 'Rationale', key: 'rationale' },
      ],
      rows: buildCaseRows(card),
    },
  ],
});

/**
 * Builds the full sheets array for a run's results export: a leading "Summary"
 * sheet, one sheet per binding/validation, and one sheet per dataset case —
 * mirroring the Analytics export pattern (analyticsExport.helpers.js).
 */
export const buildEvaluationResultsSheets = (scorecard, { runId } = {}) => [
  buildSummarySheet(scorecard, { runId }),
  ...scorecard.bindings.map(binding => buildBindingSheet(scorecard, binding)),
  ...scorecard.cases.map(card => buildCaseSheet(card)),
];

/** Builds the download filename for a run's results export. */
export const evaluationExportFileName = ({ runId } = {}) =>
  `Evaluation_Run_${sanitizeFileNamePart(runId, 'run')}_Results_${new Date().toISOString().slice(0, 10)}.xlsx`;
