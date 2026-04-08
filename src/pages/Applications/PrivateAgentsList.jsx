import * as React from 'react';

import { useSelector } from 'react-redux';

import { CollectionStatus, ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import Categories from '@/components/Categories';
import TrendingAuthors from '@/components/TrendingAuthors';
import useCardList from '@/hooks/useCardList';
import useToast from '@/hooks/useToast';
import { rightInfoPanelStyle } from '@/styles/RightInfoPanelStyle';

import RightInfoPanel from '../../components/RightInfoPanel';
import { useLoadApplications } from '../../hooks/useLoadApplications';

const AdminEmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return (
      <div>
        No agents yet. <br />
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

const EmptyListPlaceHolder = ({ query, status }) => {
  if (!query) {
    if (status === CollectionStatus.UserApproval) {
      return <div>{`You have no approval agents.`}</div>;
    } else if (status === CollectionStatus.Draft) {
      return <div>{`You have no draft agents.`}</div>;
    } else if (status === CollectionStatus.OnModeration) {
      return <div>{`You have no agents on moderation.`}</div>;
    } else if (status === CollectionStatus.Rejected) {
      return <div>{`You have no rejected agents.`}</div>;
    } else if (status === CollectionStatus.Published) {
      return <div>{`You have no published agents.`}</div>;
    } else {
      return <div>{`You have no agents.`}</div>;
    }
  } else {
    return (
      <div>
        Nothing found. <br />
        Create yours now!
      </div>
    );
  }
};

const PrivateAgentsList = props => {
  const {
    rightPanelOffset,
    sortBy,
    sortOrder,
    statuses,
    cardContentType = ContentType.ApplicationAll,
  } = props;
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
  } = useLoadApplications(ViewMode.Owner, sortBy, sortOrder, statuses, false, false, true);

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
        hideStatusColumn
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
          cardContentType !== ContentType.ApplicationAdmin ? (
            <EmptyListPlaceHolder
              query={query}
              status={statuses[0]}
            />
          ) : (
            <AdminEmptyListPlaceHolder />
          )
        }
      />
    </>
  );
};

export default PrivateAgentsList;
