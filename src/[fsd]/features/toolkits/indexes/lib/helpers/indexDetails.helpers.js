import {
  BannerSeverity,
  BannerTitleMap,
  IndexStatuses,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

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

export const bannerVariant = (isIndexing, state) => {
  if (isIndexing) return { severity: BannerSeverity.info, label: BannerTitleMap[BannerSeverity.info] };
  if (state === IndexStatuses.progress)
    return { severity: BannerSeverity.info, label: BannerTitleMap[BannerSeverity.info] };
  if (state === IndexStatuses.fail)
    return { severity: BannerSeverity.error, label: BannerTitleMap[BannerSeverity.error] };
  if (state === IndexStatuses.cancelled)
    return { severity: BannerSeverity.warning, label: BannerTitleMap[BannerSeverity.warning] };
  if (RUNNABLE_INDEX_STATUSES.includes(state))
    return { severity: BannerSeverity.success, label: BannerTitleMap[BannerSeverity.success] };
  return { severity: BannerSeverity.info, label: BannerTitleMap[BannerSeverity.info] };
};
