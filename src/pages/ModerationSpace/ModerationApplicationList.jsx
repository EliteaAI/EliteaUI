import * as React from 'react';

import { useSelector } from 'react-redux';

import { Box } from '@mui/material';

import { useApplicationListQuery } from '@/api/applications';
import { useLazyTagListQuery } from '@/api/tags.js';
import { CollectionStatus, ContentType, PUBLIC_PROJECT_ID, ViewMode } from '@/common/constants';
import { buildErrorMessage, sortByCreatedAt } from '@/common/utils';
import CardList from '@/components/CardList';
import useCardList from '@/hooks/useCardList';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';
import useToast from '@/hooks/useToast';

const emptyListPlaceHolder = <div>No agents are currently pending approval.</div>;

export default function ModerationApplicationList({ setTabCount }) {
  const { renderCard } = useCardList(ViewMode.Moderator);
  const [page, setPage] = React.useState(0);
  const pageSize = useSelector(state => state.settings.pageSize);
  const { sort_by, sort_order } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'created_at',
  });
  const { data, error, isError, isFetching } = useApplicationListQuery({
    projectId: PUBLIC_PROJECT_ID,
    page,
    pageSize,
    params: {
      tags: [],
      sort_by,
      sort_order,
      statuses: CollectionStatus.OnModeration,
      agents_type: 'classic',
    },
  });
  const { total, rows: applications = [] } = data || {};
  const [getTagList] = useLazyTagListQuery();
  const loadMoreApplications = React.useCallback(() => {
    const existsMore = total && applications.length < total;
    if (!existsMore) {
      return;
    }
    setPage(page + 1);
  }, [total, applications, page]);

  const onLoadMore = React.useCallback(() => {
    if (!isFetching) {
      loadMoreApplications();
    }
  }, [isFetching, loadMoreApplications]);

  const realDataList = React.useMemo(() => {
    const prompts = applications.map(i => ({
      ...i,
      cardType: ContentType.ModerationSpaceApplication,
    }));
    const finalList = [...prompts].sort(sortByCreatedAt);
    return finalList;
  }, [applications]);

  React.useEffect(() => {
    if (data) {
      setTabCount(data?.total || 0);
    }
  }, [data, setTabCount]);

  React.useEffect(() => {
    if (PUBLIC_PROJECT_ID) {
      getTagList({ projectId: PUBLIC_PROJECT_ID });
    }
  }, [getTagList]);

  const { toastError } = useToast();
  React.useEffect(() => {
    if (isError && !!page) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, page, toastError]);

  if (isError) return <>error</>;

  return (
    <Box component="div">
      <CardList
        cardList={realDataList}
        total={total}
        isLoading={!page && isFetching}
        isError={isError}
        renderCard={renderCard}
        isLoadingMore={!!page && isFetching}
        loadMoreFunc={onLoadMore}
        cardType={ContentType.ModerationSpaceApplication}
        emptyListSX={{ pr: 0 }}
        dynamicTags
        emptyListPlaceHolder={emptyListPlaceHolder}
      />
    </Box>
  );
}
