import { useMemo } from 'react';

import { UsageConstants } from '@/[fsd]/features/settings/lib/constants';
import { UsageHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { CHART_COLORS } from '@/[fsd]/shared/config/theme';

const { USAGE_DEFAULT_VISIBLE_MODELS, USAGE_MIN_MODEL_SHARE_PCT } = UsageConstants;

export const useUsageModelData = ({
  models = [],
  comparisonModels = [],
  canSeeAmounts,
  showAll,
  sortKey,
  sortDir,
}) => {
  const prevByModel = useMemo(() => {
    const map = new Map();

    comparisonModels.forEach(m => map.set(m.model, m));

    return map;
  }, [comparisonModels]);

  const displayNames = useMemo(() => {
    const resolved = models.map(m => m.display_name || UsageHelpers.formatModelName(m.model));
    const counts = resolved.reduce((acc, name) => acc.set(name, (acc.get(name) || 0) + 1), new Map());

    return resolved.map((name, i) => (counts.get(name) > 1 ? models[i].model || name : name));
  }, [models]);

  const totalWeight = useMemo(
    () => models.reduce((sum, m) => sum + (canSeeAmounts ? m.spend || 0 : m.total_tokens || 0), 0),
    [models, canSeeAmounts],
  );

  const enrichedModels = useMemo(
    () =>
      models.map((model, index) => {
        const prev = prevByModel.get(model.model);
        const weight = canSeeAmounts ? model.spend || 0 : model.total_tokens || 0;
        const share = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
        const delta = UsageHelpers.computeDelta(model.spend ?? 0, prev?.spend ?? null);
        const color = UsageHelpers.stableSeriesColor(model.model || String(index), CHART_COLORS);
        const sparkline = model.daily?.map(d => d.spend || 0) ?? null;
        const modelType = UsageHelpers.detectModelType(model.model);

        return { ...model, displayName: displayNames[index], share, delta, color, sparkline, modelType };
      }),
    [models, displayNames, totalWeight, canSeeAmounts, prevByModel],
  );

  const sortedModels = useMemo(() => {
    const sorted = [...enrichedModels].sort((a, b) => {
      if (sortKey === 'name') {
        const aStr = (a.displayName || a.model || '').toLowerCase();
        const bStr = (b.displayName || b.model || '').toLowerCase();

        return sortDir === 'desc' ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
      }

      let av, bv;

      if (sortKey === 'spend') {
        av = a.spend || 0;
        bv = b.spend || 0;
      } else if (sortKey === 'tokens') {
        av = a.total_tokens || 0;
        bv = b.total_tokens || 0;
      } else if (sortKey === 'delta') {
        av = a.delta?.pct ?? -Infinity;
        bv = b.delta?.pct ?? -Infinity;
      } else {
        av = a.spend || 0;
        bv = b.spend || 0;
      }

      return sortDir === 'desc' ? bv - av : av - bv;
    });

    return sorted;
  }, [enrichedModels, sortKey, sortDir]);

  const { mainModels, otherRow } = useMemo(() => {
    const main = sortedModels.filter(m => m.share >= USAGE_MIN_MODEL_SHARE_PCT);
    const others = sortedModels.filter(m => m.share < USAGE_MIN_MODEL_SHARE_PCT);

    if (!others.length) return { mainModels: main, otherRow: null };

    const otherSpend = others.reduce((s, m) => s + (m.spend || 0), 0);
    const otherTokens = others.reduce((s, m) => s + (m.total_tokens || 0), 0);
    const otherShare = others.reduce((s, m) => s + m.share, 0);

    return {
      mainModels: main,
      otherRow: {
        model: '__other__',
        displayName: `Other (${others.length} model${others.length === 1 ? '' : 's'})`,
        spend: otherSpend,
        total_tokens: otherTokens,
        share: otherShare,
        delta: null,
        color: null,
        sparkline: null,
        modelType: null,
        isOther: true,
      },
    };
  }, [sortedModels]);

  const visibleModels = useMemo(() => {
    const truncated = showAll ? mainModels : mainModels.slice(0, USAGE_DEFAULT_VISIBLE_MODELS);

    return otherRow ? [...truncated, otherRow] : truncated;
  }, [showAll, mainModels, otherRow]);

  const hasMore = mainModels.length > USAGE_DEFAULT_VISIBLE_MODELS;

  return { visibleModels, mainModels, otherRow, hasMore };
};
