import { useEffect } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SearchParams } from '@/common/constants';

export const useShowRunHistoryFromUrl = ({ setShowHistory }) => {
  const [searchParams] = useSearchParams({});

  useEffect(() => {
    const historyRunId = searchParams.get(SearchParams.HistoryRunId);
    const destTab = searchParams.get(SearchParams.DestTab);

    if (historyRunId && destTab === 'History') {
      setShowHistory(true);
    }
  }, [searchParams, setShowHistory]);
};
