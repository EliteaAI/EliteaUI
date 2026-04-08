import * as React from 'react';

import { useSelector } from 'react-redux';

import { ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import Categories from '@/components/Categories';
import RightInfoPanel from '@/components/RightInfoPanel';
import TrendingAuthors from '@/components/TrendingAuthors';
import useCardList from '@/hooks/useCardList';
import { useLoadApplications } from '@/hooks/useLoadApplications';
import useToast from '@/hooks/useToast';
import { rightInfoPanelStyle } from '@/styles/RightInfoPanelStyle';

const AdminEmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return (
      <div>
        No pipelines yet. <br />
        Create yours now!
      </div>
    );
  } else {
    return (
      <div>
        Nothing found. <br />
        Create yours now!
      </div>
    );
  }
};

const EmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return <div>{`You have no pipelines.`}</div>;
  } else {
    return (
      <div>
        Nothing found. <br />
        Create yours now!
      </div>
    );
  }
};

const PrivatePipelinesList = ({
  rightPanelOffset,
  sortBy,
  sortOrder,
  statuses,
  cardContentType = ContentType.PipelineAll,
}) => {
  const { query } = useSelector(state => state.search);
  const { renderCard } = useCardList(ViewMode.Owner);

  const {
    onLoadMoreApplications,
    data,
    isApplicationsError,
    isMoreApplicationsError,
    isApplicationsFirstFetching,
    isApplicationsFetching,
    applicationsError,
    tagList,
    page,
    pageSize,
    setPage,
  } = useLoadApplications(ViewMode.Owner, sortBy, sortOrder, statuses, false, true);

  const { total } = data || {};
  const uniqueDataList = React.useMemo(() => uniqueArrayByProp(data?.rows || [], 'id'), [data?.rows]);
  const loadMore = React.useCallback(() => {
    const existsMore = total && uniqueDataList.length < total && (page + 1) * pageSize < total;
    if (!existsMore || isApplicationsFetching || isApplicationsFirstFetching) return;
    onLoadMoreApplications();
  }, [
    total,
    uniqueDataList.length,
    page,
    pageSize,
    isApplicationsFetching,
    isApplicationsFirstFetching,
    onLoadMoreApplications,
  ]);

  const { toastError } = useToast();
  React.useEffect(() => {
    if (isMoreApplicationsError) {
      toastError(buildErrorMessage(applicationsError));
    }
  }, [applicationsError, isMoreApplicationsError, toastError]);

  return (
    <>
      <CardList
        key={cardContentType}
        cardList={uniqueDataList}
        total={total}
        isLoading={isApplicationsFirstFetching}
        isError={isApplicationsError}
        rightPanelOffset={rightPanelOffset}
        resetPageOnSort={() => setPage(0)}
        rightPanelContent={
          cardContentType !== ContentType.ApplicationAdmin ? (
            <RightInfoPanel
              tagList={tagList}
              specifiedStatus={statuses[0]}
            />
          ) : (
            <div style={rightInfoPanelStyle}>
              <Categories
                tagList={tagList}
                style={{ flex: 1 }}
                specifiedStatus={statuses[0]}
              />
              <TrendingAuthors />
            </div>
          )
        }
        renderCard={renderCard}
        isLoadingMore={isApplicationsFetching}
        loadMoreFunc={loadMore}
        cardType={cardContentType}
        emptyListPlaceHolder={
          cardContentType !== ContentType.PipelineAdmin ? (
            <EmptyListPlaceHolder query={query} />
          ) : (
            <AdminEmptyListPlaceHolder />
          )
        }
      />
    </>
  );
};

export default PrivatePipelinesList;
