import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { EmptyStatePage } from '@/[fsd]/entities/empty-state-page';
import { ContentType, ViewMode } from '@/common/constants';
import { buildErrorMessage, uniqueArrayByProp } from '@/common/utils';
import CardList from '@/components/CardList';
import Categories from '@/components/Categories';
import RightInfoPanel from '@/components/RightInfoPanel';
import TrendingAuthors from '@/components/TrendingAuthors';
import useCardList from '@/hooks/useCardList';
import { useLoadApplications } from '@/hooks/useLoadApplications';
import useToast from '@/hooks/useToast';
import RouteDefinitions from '@/routes';
import { rightInfoPanelStyle } from '@/styles/RightInfoPanelStyle';

const AdminEmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return (
      <Box>
        No pipelines yet. <br />
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

const EmptyListPlaceHolder = ({ query }) => {
  if (!query) {
    return <Box>{`You have no pipelines.`}</Box>;
  } else {
    return (
      <Box>
        Nothing found. <br />
        Create yours now!
      </Box>
    );
  }
};

const PrivatePipelinesList = memo(props => {
  const { rightPanelOffset, sortBy, sortOrder, statuses, cardContentType = ContentType.PipelineAll } = props;
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
  } = useLoadApplications(ViewMode.Owner, sortBy, sortOrder, statuses, false, true);

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
      title: 'No pipelines yet',
      description:
        'Create your first pipeline to start automating tasks and workflows. Or take a quick tour to see how it works.',
      onCreateClick: () => navigate(RouteDefinitions.CreatePipeline),
    }),
    [navigate],
  );

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
        customEmptyState={<EmptyStatePage {...EmptyStateConfig} />}
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
});

PrivatePipelinesList.displayName = 'PrivatePipelinesList';

export default PrivatePipelinesList;
