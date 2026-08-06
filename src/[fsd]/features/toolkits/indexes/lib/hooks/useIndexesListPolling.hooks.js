import { useSelector } from 'react-redux';

import { useGetIndexesListQuery } from '@/[fsd]/features/toolkits/indexes/api';
import { IndexStatuses } from '@/[fsd]/features/toolkits/indexes/lib/constants/indexDetails.constants';
import { selectIndexesList } from '@/[fsd]/features/toolkits/indexes/model/indexes.slice';

// The GET is expensive server-side (fresh engine + vault round trip per request), and
// the staleness threshold is hours — a few samples across that window is plenty.
const POLL_INTERVAL_MS = 300_000;

// `stale` is server-computed per GET and moves in both directions, so any in_progress
// row keeps the poll armed — without it a dead run stays locked (or a revived one
// unlocked) until a manual reload. forcePoll exists because runs started in THIS
// session aren't in the slice until a fetch happens: callers holding a local run
// belief must arm the poll themselves. Multiple subscribers per route are deliberate
// (RTK dedupes on the cache key; lowest positive interval wins) — do not collapse.
export const useIndexesListPolling = ({ toolkitId, projectId, skip = false, forcePoll = false }) => {
  const { data } = useSelector(selectIndexesList);
  const hasInProgress = Boolean(data?.some(item => item?.metadata?.state === IndexStatuses.progress));

  return useGetIndexesListQuery(
    { toolkitId, projectId },
    {
      skip,
      pollingInterval: hasInProgress || forcePoll ? POLL_INTERVAL_MS : 0,
      skipPollingIfUnfocused: true,
    },
  );
};
