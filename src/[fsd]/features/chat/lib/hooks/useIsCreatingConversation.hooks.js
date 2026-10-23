import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { SearchParams } from '@/common/constants.js';

export const useIsCreatingConversation = () => {
  const [searchParams] = useSearchParams();
  const isCreating = useMemo(() => searchParams.get(SearchParams.CreateConversation), [searchParams]);
  return isCreating;
};
