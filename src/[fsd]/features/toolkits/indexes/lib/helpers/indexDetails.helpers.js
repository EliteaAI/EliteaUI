import {
  IndexStatuses,
  RUNNABLE_INDEX_STATUSES,
} from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';

export const formatDate = ts => {
  if (!ts) return '—';
  try {
    const d = new Date(typeof ts === 'number' ? ts * 1000 : ts);

    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  } catch {
    return '—';
  }
};

export const bannerVariant = (isRunningTool, isIndexing, state) => {
  if (isIndexing) return { severity: 'warning', label: 'Indexing in progress…' };
  if (state === IndexStatuses.progress) return { severity: 'warning', label: 'Indexing in progress…' };
  if (state === IndexStatuses.fail) return { severity: 'error', label: 'Indexing failed' };
  if (state === IndexStatuses.cancelled) return { severity: 'info', label: 'Indexing stopped' };
  if (RUNNABLE_INDEX_STATUSES.includes(state)) return { severity: 'success', label: 'Index is ready!' };
  return { severity: 'info', label: 'Preparing…' };
};
