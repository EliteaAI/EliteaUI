import { memo, useEffect } from 'react';

import { useAgentHubData } from '@/[fsd]/features/agent-hub/lib/hooks';
import { useCatalogCount } from '@/[fsd]/shared/lib/hooks';
import useDebounceValue from '@/hooks/useDebounceValue';

const NO_SELECTED_TAGS = [];

const AgentsTabCount = memo(props => {
  const { query = '', onTotalCountChange } = props;
  const debouncedQuery = useDebounceValue(query, 300);
  const { applicationsByTag } = useAgentHubData(debouncedQuery, NO_SELECTED_TAGS);
  const totalCount = useCatalogCount(applicationsByTag, NO_SELECTED_TAGS);

  useEffect(() => {
    onTotalCountChange?.(totalCount);
  }, [totalCount, onTotalCountChange]);

  return null;
});

AgentsTabCount.displayName = 'AgentsTabCount';

export default AgentsTabCount;
