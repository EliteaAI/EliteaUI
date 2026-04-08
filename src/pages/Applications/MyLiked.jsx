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
    You have not liked any agents yet. <br />
    Choose the agents you like now!
  </div>
);
const emptySearchedListPlaceHolder = (
  <div>
    No agents found yet. <br />
    Publish yours now!
  </div>
);

export default function MyLiked() {
  const { renderCard } = useCardList(ViewMode.Public);
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
      my_liked: true,
      agents_type: 'classic',
    },
  });
  const { rows: applications = [], total } = data || {};

  const loadMoreApplications = React.useCallback(() => {
    const existsMore = total && applications.length < total && (page + 1) * pageSize < total;
    if (!existsMore || isFetching) {
      return;
    }
    setPage(page + 1);
  }, [total, applications.length, page, pageSize, isFetching, setPage]);

  const { toastError } = useToast();
  React.useEffect(() => {
    if (isError) {
      toastError(buildErrorMessage(error));
    }
  }, [error, isError, toastError]);

  return (
    <>
      <CardList
        cardList={applications}
        total={total}
        isLoading={!page && isFetching}
        isError={isError}
        rightPanelOffset={'16px'}
        rightPanelContent={
          <div style={rightInfoPanelStyle}>
            <Categories
              tagList={tagList}
              style={{ flex: 1 }}
              my_liked
            />
            <TrendingAuthors />
          </div>
        }
        renderCard={renderCard}
        isLoadingMore={!!page && isFetching}
        loadMoreFunc={loadMoreApplications}
        cardType={ContentType.ApplicationMyLiked}
        emptyListPlaceHolder={query ? emptySearchedListPlaceHolder : emptyListPlaceHolder}
      />
    </>
  );
}
