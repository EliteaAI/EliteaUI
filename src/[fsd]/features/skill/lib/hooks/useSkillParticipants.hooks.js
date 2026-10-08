import { useCallback, useMemo, useState } from 'react';

import { usePagedPublicSkillsQuery } from '@/[fsd]/features/skill-hub/api';
import { useSkillListQuery } from '@/[fsd]/features/skill/api';
import { ChatParticipantType, PAGE_SIZE, PUBLIC_PROJECT_ID } from '@/common/constants';
import useDebounceValue from '@/hooks/useDebounceValue';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const SEARCH_DEBOUNCE_MS = 200;
const FIRST_PAGE = 0;
const NO_ROWS = [];

const toSkillParticipant = projectId => skill => ({
  ...skill,
  project_id: projectId,
  participantType: ChatParticipantType.Skills,
});

const hasMoreRows = data => (data?.rows?.length ?? 0) < (data?.total ?? 0);

export const useSkillParticipants = props => {
  const {
    query = '',
    pageSize = PAGE_SIZE,
    skip = false,
    excludePublic = false,
    debounceMs = SEARCH_DEBOUNCE_MS,
  } = props;

  const projectId = useSelectedProjectId();
  const debouncedQuery = useDebounceValue(query, debounceMs);
  const [pages, setPages] = useState({ query: debouncedQuery, own: FIRST_PAGE, catalog: FIRST_PAGE });
  const isCurrentSearch = pages.query === debouncedQuery;
  const ownPage = isCurrentSearch ? pages.own : FIRST_PAGE;
  const catalogPage = isCurrentSearch ? pages.catalog : FIRST_PAGE;

  const params = useMemo(
    () => ({ sort_by: 'name', sort_order: 'asc', ...(debouncedQuery && { query: debouncedQuery }) }),
    [debouncedQuery],
  );

  const skipCatalog = skip || excludePublic || Number(projectId) === PUBLIC_PROJECT_ID;

  const { currentData: ownData, isFetching: isOwnFetching } = useSkillListQuery(
    { projectId, page: ownPage, pageSize, params },
    { skip: skip || !projectId },
  );
  const { currentData: catalogData, isFetching: isCatalogFetching } = usePagedPublicSkillsQuery(
    { page: catalogPage, pageSize, params },
    { skip: skipCatalog },
  );

  const ownSkills = useMemo(
    () => (skip ? NO_ROWS : (ownData?.rows || NO_ROWS).map(toSkillParticipant(projectId))),
    [ownData?.rows, projectId, skip],
  );
  const catalogSkills = useMemo(
    () => (skipCatalog ? NO_ROWS : (catalogData?.rows || NO_ROWS).map(toSkillParticipant(PUBLIC_PROJECT_ID))),
    [catalogData?.rows, skipCatalog],
  );

  const isFetching = isOwnFetching || isCatalogFetching;
  const canLoadMoreOwn = !skip && hasMoreRows(ownData);
  const canLoadMoreCatalog = !skipCatalog && hasMoreRows(catalogData);

  const onLoadMore = useCallback(() => {
    if (isFetching || (!canLoadMoreOwn && !canLoadMoreCatalog)) return;
    setPages({
      query: debouncedQuery,
      own: canLoadMoreOwn ? ownPage + 1 : ownPage,
      catalog: canLoadMoreCatalog ? catalogPage + 1 : catalogPage,
    });
  }, [isFetching, canLoadMoreOwn, canLoadMoreCatalog, debouncedQuery, ownPage, catalogPage]);

  const total = (skip ? 0 : ownData?.total || 0) + (skipCatalog ? 0 : catalogData?.total || 0);

  return { ownSkills, catalogSkills, total, isFetching, onLoadMore };
};
