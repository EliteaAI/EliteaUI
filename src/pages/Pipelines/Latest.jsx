import * as React from 'react';

import { usePublicApplicationsListQuery } from '@/api/applications';
import { CollectionStatus, ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage } from '@/common/utils';
import CardList from '@/components/CardList';
import Categories from '@/components/Categories';
import TrendingAuthors from '@/components/TrendingAuthors';
import useCardList from '@/hooks/useCardList';
import usePageQuery from '@/hooks/usePageQuery';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';
import useToast from '@/hooks/useToast';
import { rightInfoPanelStyle } from '@/styles/RightInfoPanelStyle';

const emptyListPlaceHolder = (
  <div>
    No pipelines available. <br />
    Create yours now!
  </div>
);
const emptySearchedListPlaceHolder = (
  <div>
    No pipelines found. <br />
    Create yours now!
  </div>
);

export default function Latest() {
  const { renderCard } = useCardList(ViewMode.Public);
  const { toastError } = useToast();
  const { query, page, pageSize, setPage, tagList, selectedTagIds } = usePageQuery();
  const { sort_by, sort_order } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'created_at',
  });
  const { error, data, isError, isFetching } = usePublicApplicationsListQuery({
    page,
    pageSize,
    params: {
      statuses: CollectionStatus.Published,
      tags: selectedTagIds,
      sort_by,
      sort_order,
      query,
      agents_type: 'pipeline',
    },
  });
  const { rows: pipelines = [], total } = data || {};

  const loadMoreApplications = React.useCallback(() => {
    const existsMore = total && pipelines.length < total && (page + 1) * pageSize < total;
    if (!existsMore || isFetching) {
      return;
    }
    setPage(page + 1);
  }, [total, pipelines.length, page, pageSize, isFetching, setPage]);

  React.useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return (
    <>
      <CardList
        cardList={pipelines}
        total={total}
        isLoading={!page && isFetching}
        isError={isError}
        rightPanelOffset={'16px'}
        rightPanelContent={
          <div style={rightInfoPanelStyle}>
            <Categories
              tagList={tagList}
              style={{ flex: 1 }}
            />
            <TrendingAuthors />
          </div>
        }
        renderCard={renderCard}
        isLoadingMore={!!page && isFetching}
        loadMoreFunc={loadMoreApplications}
        cardType={ContentType.PipelineLatest}
        emptyListPlaceHolder={query ? emptySearchedListPlaceHolder : emptyListPlaceHolder}
      />
    </>
  );
}
