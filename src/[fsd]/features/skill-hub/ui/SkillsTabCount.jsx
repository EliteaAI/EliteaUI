import { memo, useEffect } from 'react';

import { useSkillHubData } from '@/[fsd]/features/skill-hub/lib/hooks';
import { useCatalogCount } from '@/[fsd]/shared/lib/hooks';
import useDebounceValue from '@/hooks/useDebounceValue';

const NO_SELECTED_TAGS = [];

const SkillsTabCount = memo(props => {
  const { query = '', onTotalCountChange } = props;
  const debouncedQuery = useDebounceValue(query, 300);
  const { skillsByTag } = useSkillHubData(debouncedQuery, NO_SELECTED_TAGS);
  const totalCount = useCatalogCount(skillsByTag, NO_SELECTED_TAGS);

  useEffect(() => {
    onTotalCountChange?.(totalCount);
  }, [totalCount, onTotalCountChange]);

  return null;
});

SkillsTabCount.displayName = 'SkillsTabCount';

export default SkillsTabCount;
