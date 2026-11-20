import { useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { URL_PARAMS_KEY_TAGS } from '@/common/constants';

const FOLDER_QUERY_PARAM = 'folder';

// Folder and tags filters of a project list, as its right panel writes them into the address
export const useSectionFilterCount = () => {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const tags = new Set(searchParams.getAll(URL_PARAMS_KEY_TAGS).filter(Boolean));
    return tags.size + (searchParams.get(FOLDER_QUERY_PARAM) ? 1 : 0);
  }, [searchParams]);
};
