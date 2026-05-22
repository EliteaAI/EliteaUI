import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { EmptyStatePage } from '@/[fsd]/entities/empty-state-page';
import { CollectionStatus, ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import Categories from '@/components/Categories';
import TrendingAuthors from '@/components/TrendingAuthors';
import useCardList from '@/hooks/useCardList';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { rightInfoPanelStyle } from '@/styles/RightInfoPanelStyle';

import RightInfoPanel from '../../components/RightInfoPanel';
import { useLoadApplications } from '../../hooks/useLoadApplications';

const AdminEmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return (
      <Box>
        No agents yet. <br />
        Create yours now!
      </Box>
    );
  } else {
    return (
      <Box>
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }
};

const EmptyListPlaceHolder = ({ query, status }) => {
  if (!query) {
    if (status === CollectionStatus.UserApproval) {
      return <Box>{`You have no approval agents.`}</Box>;
    } else if (status === CollectionStatus.Draft) {
      return <Box>{`You have no draft agents.`}</Box>;
    } else if (status === CollectionStatus.OnModeration) {
      return <Box>{`You have no agents on moderation.`}</Box>;
    } else if (status === CollectionStatus.Rejected) {
      return <Box>{`You have no rejected agents.`}</Box>;
    } else if (status === CollectionStatus.Published) {
      return <Box>{`You have no published agents.`}</Box>;
    } else {
      return <Box>{`You have no agents.`}</Box>;
    }
  } else {
    return (
      <Box>
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }
};

const PrivateAgentsList = memo(props => {
  const {
    rightPanelOffset,
    sortBy,
    sortOrder,
    statuses,
    cardContentType = ContentType.ApplicationAll,
  } = props;
  const { query } = useSelector(state => state.search);
  const { renderCard } = useCardList(ViewMode.Owner);
  const navigate = useNavigate();

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
  const uniqueDataList = useMemo(() => uniqueArrayByProp(data?.rows || [], 'id'), [data?.rows]);
  const loadMore = useCallback(() => {
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
  useEffect(() => {
    if (isMoreApplicationsError) {
      toastError(buildErrorMessage(applicationsError));
    }
  }, [applicationsError, isMoreApplicationsError, toastError]);

  const EmptyStateConfig = useMemo(
    () => ({
      title: 'No agents yet',
      description:
        'Create your first agent to get started, or take a quick tour to see how it works. Or take a quick tour to see how it works. ',
      onCreateClick: () => navigate(RouteDefinitions.CreateApplication),
    }),
    [navigate],
  );

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
        customEmptyState={<EmptyStatePage {...EmptyStateConfig} />}
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
});

PrivateAgentsList.displayName = 'PrivateAgentsList';

export default PrivateAgentsList;
