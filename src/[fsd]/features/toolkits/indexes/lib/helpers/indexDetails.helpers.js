import { summarizeIndexingReport } from '@/[fsd]/entities/indexing-report';
import {
  BANNER_SUCCESS_SUFFIX,
  BannerMessageMap,
  BannerSeverity,
  BannerTitleMap,
  IndexStatuses,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { BUDGET_ERROR_VARIANTS } from '@/[fsd]/shared/lib/constants/budgetError.constants';

// The scope code the backend puts in the persisted index error. Reusing the shared copy
// keeps the banner and the message below it from drifting apart.
const budgetErrorMessage = error => {
  if (typeof error !== 'string') return null;

  const code = Object.keys(BUDGET_ERROR_VARIANTS).find(scope => error.includes(scope));

  return code ? BUDGET_ERROR_VARIANTS[code].message : null;
};

export const formatDate = ts => {
  if (!ts) return '—';
  try {
    const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);

    if (Number.isNaN(d.getTime())) return '—';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch {
    return '—';
  }
};

export const bannerVariant = (isIndexing, state, reindexStats, error) => {
  if (isIndexing)
    return {
      severity: BannerSeverity.info,
      label: BannerTitleMap[BannerSeverity.info],
      message: BannerMessageMap[BannerSeverity.info],
    };
  if (state === IndexStatuses.progress)
    return {
      severity: BannerSeverity.info,
      label: BannerTitleMap[BannerSeverity.info],
      message: BannerMessageMap[BannerSeverity.info],
    };
  if (state === IndexStatuses.fail)
    return {
      severity: BannerSeverity.error,
      label: BannerTitleMap[BannerSeverity.error],
      // A budget block is not a source-connection problem, and Reindex cannot succeed
      // until the budget resets — the default copy would send the user the wrong way
      message: budgetErrorMessage(error) || BannerMessageMap[BannerSeverity.error],
    };
  if (state === IndexStatuses.cancelled)
    return {
      severity: BannerSeverity.warning,
      label: BannerTitleMap[BannerSeverity.warning],
      message: BannerMessageMap[BannerSeverity.warning],
    };
  if (RUNNABLE_INDEX_STATUSES.includes(state)) {
    // Only the run's own breakdown knows what it indexed and in what units.
    const breakdown = summarizeIndexingReport(reindexStats?.latestEntry);
    return {
      severity: BannerSeverity.success,
      label: BannerTitleMap[BannerSeverity.success],
      message: breakdown
        ? `${breakdown}. ${BANNER_SUCCESS_SUFFIX}`
        : BannerMessageMap[BannerSeverity.success],
    };
  }
  return {
    severity: BannerSeverity.info,
    label: BannerTitleMap[BannerSeverity.info],
    message: BannerMessageMap[BannerSeverity.info],
  };
};
