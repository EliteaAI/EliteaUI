import {
  EVAL_BINDING_KIND,
  EVAL_ENGINE,
  EVAL_POLARITY,
  EVAL_RESULT_STATUS,
  EVAL_SCALE_TYPE,
} from '../constants';
import { getBindingKind } from './binding.helpers';

/**
 * Stable key identifying which validation a binding or result row targets.
 * Exactly one of dimension_id / platform_key is set (§13.1), so the same key can be
 * derived from a snapshot binding or a result row and used to join them.
 */
export const getTargetKey = entity => {
  if (!entity) return null;
  if (entity.dimension_id != null) return `dim:${entity.dimension_id}`;
  if (entity.platform_key != null) return `platform:${entity.platform_key}`;
  return null;
};

/**
 * Evaluates whether a native score meets a binding target on the native scale
 * using the stored comparison operator (§20.5). Returns null when there is no
 * target/operator or no score to compare — the target is then "not applicable".
 */
export const evaluateTargetMet = (nativeScore, operator, target) => {
  if (nativeScore == null || operator == null || target == null || target === '') return null;
  const score = Number(nativeScore);
  const goal = Number(target);
  if (Number.isNaN(score) || Number.isNaN(goal)) return null;
  switch (operator) {
    case '>=':
      return score >= goal;
    case '>':
      return score > goal;
    case '<=':
      return score <= goal;
    case '<':
      return score < goal;
    case '==':
      return score === goal;
    default:
      return null;
  }
};

/**
 * Normalizes a native score onto the 0..100 quality axis. Used as a client-side fallback for a
 * provisional headline while a human dimension is still unscored; the server value is
 * authoritative once present.
 *
 * Mirrors the server's `normalize_score` exactly — same scale ranges, same 0..100 output, same
 * clamp-then-flip order, same 2dp rounding. It has to: the fallback value is summed together
 * with server-provided `normalized_score` values into one headline, so a 0..1 result here would
 * silently drag the average down, and ignoring `scaleType` mis-scored every non-default ordinal.
 */
export const normalizeScore = (nativeScore, { scaleType, scaleMin, scaleMax, polarity } = {}) => {
  if (nativeScore == null) return null;
  const value = Number(nativeScore);
  if (!Number.isFinite(value)) return null;

  let norm;
  if (scaleType === EVAL_SCALE_TYPE.binary) {
    norm = value ? 100 : 0;
  } else {
    // Ordinal points are 1-based unless the author set an explicit min; continuous defaults to 0..100.
    const isOrdinal = scaleType === EVAL_SCALE_TYPE.ordinal;
    const min = Number(scaleMin ?? (isOrdinal ? 1 : 0));
    const max = Number(scaleMax ?? (isOrdinal ? NaN : 100));
    if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return null;
    norm = ((value - min) / (max - min)) * 100;
  }

  norm = Math.min(100, Math.max(0, norm));
  if (polarity === EVAL_POLARITY.lower_better) norm = 100 - norm;
  return Math.round(norm * 100) / 100;
};

/** Short numeric label for a score cell; '—' when absent. */
export const formatScore = (value, digits = 2) => {
  if (value == null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return Number.isInteger(num) ? String(num) : num.toFixed(digits).replace(/\.?0+$/, '');
};

/** Formats a 0..1 normalized value as a rounded percentage, or '—'. */
export const formatPercent = value => {
  if (value == null) return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  return `${Math.round(num * 100)}%`;
};

/**
 * Resolves the display + scoring metadata for a snapshot binding by looking up
 * its referenced dimension / code-validation in the run snapshot maps.
 */
export const resolveBindingMeta = (binding, snapshot = {}) => {
  const kind = getBindingKind(binding);
  const dimensions = snapshot.dimensions ?? {};

  let name = 'Validation';
  let scaleType = null;
  let scaleMin = null;
  let scaleMax = null;
  let polarity = null;

  if (kind === EVAL_BINDING_KIND.dimension) {
    const dim = dimensions[binding.dimension_id] ?? dimensions[String(binding.dimension_id)];
    name = dim?.name || `Dimension #${binding.dimension_id}`;
    scaleType = dim?.scale_type ?? null;
    scaleMin = dim?.scale_min ?? null;
    scaleMax = dim?.scale_max ?? null;
    polarity = dim?.polarity ?? null;
  } else if (kind === EVAL_BINDING_KIND.platform) {
    name = binding.platform_key || 'Platform validation';
    scaleType = EVAL_SCALE_TYPE.binary;
    scaleMin = 0;
    scaleMax = 1;
    polarity = EVAL_POLARITY.higher_better;
  }

  return {
    kind,
    key: getTargetKey(binding),
    dimension_id: binding.dimension_id ?? null,
    platform_key: binding.platform_key ?? null,
    name,
    engine: binding.engine,
    weight: binding.weight ?? 1,
    target: binding.target ?? null,
    operator: binding.target_operator ?? null,
    scaleType,
    scaleMin,
    scaleMax,
    polarity,
    orderIndex: binding.order_index ?? 0,
  };
};

/**
 * Case ids fully covered by one page of results, or `null` when the page covers the whole run.
 *
 * The backend orders results by (dataset_case_id, id), so a page is a contiguous case range whose
 * last case may be cut mid-way. That trailing case is dropped, since a partially-scored case is
 * what makes truncation look like missing scores rather than missing data.
 *
 * A human-only run legitimately has zero results, so a full page is reported as unrestricted rather
 * than as "no cases covered".
 */
export const coveredCaseIdsFromPage = ({ results = [], total = 0, offset = 0 } = {}) => {
  if (offset + results.length >= total) return null;

  const ordered = [];
  const seen = new Set();
  for (const row of results) {
    const id = String(row.dataset_case_id);
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
  }
  return ordered.length > 1 ? ordered.slice(0, -1) : ordered;
};

/**
 * Builds the full scorecard view-model for a run from the B5 payload
 * ({ run, results, human_scores }). Produces per-binding aggregates, per-case
 * drill-down cells, run-level counts and a headline with a provisional flag while
 * any human validation is still unscored (§15). Pure — safe to unit test.
 *
 * `caseIds`, when given, restricts the card to those snapshot cases. The caller passes it when the
 * result page it holds does not cover the whole run; without it the uncovered cases would render as
 * unscored cells that are indistinguishable from genuine gaps.
 */
export const buildScorecard = ({
  run,
  results = [],
  humanScores = [],
  headlineScore,
  caseIds = null,
} = {}) => {
  const snapshot = run?.snapshot ?? {};
  const allCases = [...(snapshot.cases ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const allowedCaseIds = caseIds ? new Set(caseIds.map(String)) : null;
  const cases = allowedCaseIds ? allCases.filter(item => allowedCaseIds.has(String(item.id))) : allCases;
  const bindingsRaw = [...(snapshot.bindings ?? [])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
  );
  const bindings = bindingsRaw.map(b => resolveBindingMeta(b, snapshot));

  // Index result rows by caseId + target key.
  const resultIndex = new Map();
  for (const row of results) {
    resultIndex.set(`${row.dataset_case_id}::${getTargetKey(row)}`, row);
  }

  // Index the latest human score by caseId + dimensionId.
  const humanIndex = new Map();
  for (const hs of humanScores) {
    if (hs.is_latest === false) continue;
    humanIndex.set(`${hs.dataset_case_id}::dim:${hs.dimension_id}`, hs);
  }

  let pendingHuman = 0;
  const perBindingAcc = new Map();
  bindings.forEach(b => perBindingAcc.set(b.key, { nativeSum: 0, scored: 0, met: 0, targeted: 0 }));

  const caseCards = cases.map(caseItem => {
    let weightedSum = 0;
    let weightTotal = 0;
    let missedAny = false;
    let hasError = false;

    const cells = bindings.map(binding => {
      const result = resultIndex.get(`${caseItem.id}::${binding.key}`) ?? null;
      const isHuman = binding.engine === EVAL_ENGINE.human;
      const human = isHuman ? (humanIndex.get(`${caseItem.id}::${binding.key}`) ?? null) : null;

      let nativeScore = null;
      let normalizedScore = null;
      let pending = false;

      if (isHuman) {
        if (human) {
          nativeScore = human.native_score ?? null;
          normalizedScore = human.normalized_score ?? null;
        } else {
          pending = true;
          pendingHuman += 1;
        }
      } else if (result) {
        nativeScore = result.native_score ?? null;
        normalizedScore = result.normalized_score ?? null;
      }

      if (result?.status === EVAL_RESULT_STATUS.error || result?.verdict?.error || result?.evidence?.error)
        hasError = true;

      const met = evaluateTargetMet(nativeScore, binding.operator, binding.target);
      if (met === false) missedAny = true;

      // Fall back to a local normalization only when the server did not provide
      // one (keeps a provisional headline sensible).
      const normalized =
        normalizedScore != null
          ? normalizedScore
          : normalizeScore(nativeScore, {
              scaleType: binding.scaleType,
              scaleMin: binding.scaleMin,
              scaleMax: binding.scaleMax,
              polarity: binding.polarity,
            });

      if (nativeScore != null) {
        const acc = perBindingAcc.get(binding.key);
        acc.nativeSum += Number(nativeScore);
        acc.scored += 1;
        if (met != null) {
          acc.targeted += 1;
          if (met) acc.met += 1;
        }
      }

      if (normalized != null) {
        weightedSum += normalized * (binding.weight ?? 1);
        weightTotal += binding.weight ?? 1;
      }

      return {
        binding,
        result,
        human,
        nativeScore,
        normalizedScore: normalized,
        met,
        pending,
        verdict: result?.verdict ?? null,
        evidence: result?.evidence ?? null,
      };
    });

    const caseScore = weightTotal ? weightedSum / weightTotal : null;

    return {
      id: caseItem.id,
      case: caseItem,
      cells,
      caseScore,
      missedAny,
      hasError,
      pendingCount: cells.filter(c => c.pending).length,
    };
  });

  const perBinding = bindings.map(binding => {
    const acc = perBindingAcc.get(binding.key);
    return {
      ...binding,
      avgNative: acc.scored ? acc.nativeSum / acc.scored : null,
      scored: acc.scored,
      metCount: acc.met,
      targetedCount: acc.targeted,
    };
  });

  const scoredCases = caseCards.filter(c => c.caseScore != null);
  const recomputedHeadline = scoredCases.length
    ? scoredCases.reduce((sum, c) => sum + c.caseScore, 0) / scoredCases.length
    : null;

  const headline = headlineScore != null ? headlineScore : (run?.headline_score ?? recomputedHeadline);

  const counts = {
    total: caseCards.length,
    metAll: caseCards.filter(c => !c.missedAny && !c.hasError && c.caseScore != null).length,
    missedAny: caseCards.filter(c => c.missedAny).length,
    errors: caseCards.filter(c => c.hasError).length,
  };

  return {
    bindings: perBinding,
    cases: caseCards,
    counts,
    headline,
    recomputedHeadline,
    pendingHuman,
    provisional: pendingHuman > 0,
  };
};

/**
 * Markdown explanation of the weighted-score formula (§15) for the
 * headline tooltip. Reuses only numbers already computed by buildScorecard()
 * (case.caseScore, cell.binding.weight/normalizedScore) — no new math.
 */
export const buildWeightedScoreExplanation = scorecard => {
  const { headline, cases = [] } = scorecard;
  const scoredCases = cases.filter(c => c.caseScore != null);

  const caseLine = scoredCases.map(c => formatScore(c.caseScore)).join(', ');

  const runFormula =
    scoredCases.length > 0
      ? `Run score = mean(${caseLine}) = ${headline != null ? formatScore(headline) : '—'}`
      : `Run score = — (no scored cases yet)`;

  const exampleCase = scoredCases[0];
  let caseFormula = '';
  if (exampleCase) {
    const scoredCells = exampleCase.cells.filter(c => c.normalizedScore != null);
    const weightedTerms = scoredCells.map(c => `${c.binding.weight ?? 1}×${formatScore(c.normalizedScore)}`);
    const weights = scoredCells.map(c => c.binding.weight ?? 1);
    caseFormula = `Per case: Case score = (${weightedTerms.join(' + ')}) / (${weights.join(' + ')}) = ${formatScore(
      exampleCase.caseScore,
    )}`;
  }

  return [
    'Weighted score formula:',
    caseFormula,
    `Per run: ${runFormula}`,
    'Skipped or unscored items (no score, or weight 0) are excluded from both sums.',
  ]
    .filter(Boolean)
    .join('\n\n');
};
