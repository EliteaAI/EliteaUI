import { useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useSkillListQuery } from '@/[fsd]/features/skill/api';
import usePageQuery from '@/hooks/usePageQuery';
import { useAuthorIdFromUrl } from '@/hooks/useSearchParamValue';

export const useLoadSkills = (sortBy = 'created_at', sortOrder = 'desc', forceSkip = false) => {
  const { page, pageSize, setPage, tagList, selectedTagIds, projectId } = usePageQuery();
  const { query } = useSelector(state => state.search);
  const authorId = useAuthorIdFromUrl();

  const {
    data,
    error: skillsError,
    isError: isSkillsError,
    isLoading: isSkillsLoading,
    isFetching: isSkillsFetching,
  } = useSkillListQuery(
    {
      projectId,
      page,
      pageSize,
      params: {
        query,
        tags: selectedTagIds,
        author_id: authorId,
        sort_by: sortBy,
        sort_order: sortOrder,
      },
    },
    { skip: !projectId || forceSkip },
  );

  const totalCount = useMemo(() => {
    const { total = 0 } = data || { total: 0 };
    return total;
  }, [data]);

  const onLoadMoreSkills = useCallback(() => {
    if (!isSkillsFetching && (page + 1) * pageSize < totalCount) {
      setPage(page + 1);
    }
  }, [isSkillsFetching, page, pageSize, totalCount, setPage]);

  return {
    tagList,
    data,
    onLoadMoreSkills,
    isSkillsError,
    isSkillsLoading,
    isSkillsFetching: !!page && isSkillsFetching,
    isSkillsFirstFetching: !page && isSkillsFetching,
    isMoreSkillsError: !!page && isSkillsError,
    skillsError,
    page,
    pageSize,
    setPage,
    query,
  };
};
